import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';

// Ensure we run on the Node.js runtime
export const runtime = 'nodejs';

// Configure ffmpeg binary path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Minimal types for ffprobe result to avoid 'any' and enable compatibility checks
type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  profile?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string; // e.g., "30000/1001"
  r_frame_rate?: string;
  pix_fmt?: string;
  bit_rate?: string; // in bits per second (string)
  sample_rate?: string; // audio only, e.g., "44100"
  channels?: number; // audio channels
};
type FfprobeFormat = { bit_rate?: string; duration?: string };
type FfprobeData = { streams?: FfprobeStream[]; format?: FfprobeFormat };

// Helpers
const parseFps = (rate?: string): number => {
  if (!rate) return 0;
  if (rate.includes('/')) {
    const [n, d] = rate.split('/').map((v) => Number(v || 0));
    return d ? n / d : n;
  }
  const n = Number(rate);
  return isNaN(n) ? 0 : n;
};

const approx = (a: number, b: number, tol = 0.75) => Math.abs(a - b) <= tol;

const toKbps = (bitsPerSecond?: string): number => {
  if (!bitsPerSecond) return 0;
  const n = parseInt(bitsPerSecond, 10);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.floor(n / 1000);
};

const sanitizeBaseName = (name: string): string => {
  // only letters and numbers, short and simple
  const cleaned = (name || 'pixora')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24);
  if (cleaned.length >= 3) return cleaned;
  return `pixora${crypto.randomUUID().replace(/[^a-z0-9]/g, '').slice(0, 6)}`;
};

const isFrameCompatible = (probe: FfprobeData) => {
  const streams = Array.isArray(probe?.streams) ? probe.streams : [];
  const v = streams.find((s) => s?.codec_type === 'video');
  const a = streams.find((s) => s?.codec_type === 'audio');
  if (!v) return false;
  const fps = parseFps(v.avg_frame_rate || v.r_frame_rate);
  const w = v.width || 0;
  const h = v.height || 0;
  const totalKbps = toKbps(probe?.format?.bit_rate) || 0;
  const vOk = v.codec_name === 'h264' && (v.profile || '').toLowerCase().includes('baseline');
  const sizeOk = w <= 1280 && h <= 720;
  const fpsOk = approx(fps, 30, 1.0) || approx(fps, 29.97, 1.0);
  const brOk = totalKbps <= 10_000 || totalKbps === 0; // 0 if unknown
  const aOk = !a || (
    a.codec_name === 'mp3' &&
    (a.sample_rate === '44100' || a.sample_rate === '44100.0') &&
    (typeof a.channels === 'number' ? a.channels >= 2 : true)
  );
  return vOk && sizeOk && fpsOk && aOk && brOk;
};

export async function POST(req: Request) {
  // Collect stderr to help diagnose failures
  const stderrLines: string[] = [];
  let transcodeId = '';
  let inputPath = '';
  let outputPath = '';
  let usedPath: 'primary' | 'fallback' | 'remux' | 'copy' = 'primary';
  let targetFps = 30; // Frame-ready target (may be overridden by source FPS)

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    // Extract original file name if available
    const originalName = (file as File & { name?: string }).name ?? 'input';
    const inputExt = path.extname(originalName) || '.bin';
    const baseName = path.basename(originalName, inputExt);

    // Write incoming file to a temporary location
    const tmpDir = os.tmpdir();
    transcodeId = crypto.randomUUID();
    inputPath = path.join(tmpDir, `pixora-${transcodeId}${inputExt}`);
    outputPath = path.join(tmpDir, `pixora-${transcodeId}-out.mp4`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Enforce server-side 200MB limit as well
    if (buffer.length > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large', details: 'Maximum allowed size is 200MB' },
        { status: 413 }
      );
    }
    await fs.writeFile(inputPath, buffer);

    // Run ffmpeg to transcode to MP4 (primary: H.264/AAC). If it fails, fallback to MPEG4.
    const runWithOptions = (options: string[], passName = 'single') => new Promise<void>((resolve, reject) => {
      console.log(`[${passName}] Running FFmpeg with options:`, options);
      const command = ffmpeg(inputPath)
        .outputOptions(options)
        .on('start', (cmd) => {
          console.log(`[${passName}] FFmpeg start:`, cmd);
        })
        .on('stderr', (line) => {
          stderrLines.push(line);
          console.log(`[${passName}] FFmpeg stderr:`, line);
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`[${passName}] FFmpeg error:`, err);
          console.error(`[${passName}] FFmpeg stdout:`, stdout);
          console.error(`[${passName}] FFmpeg stderr:`, stderr);
          reject(err);
        })
        .on('end', (stdout, stderr) => {
          console.log(`[${passName}] FFmpeg process completed`);
          if (stderr) {
            console.log(`[${passName}] FFmpeg process stderr:`, stderr);
          }
          resolve();
        });
      
      command.save(outputPath);
    });

    const probe = await new Promise<FfprobeData>((resolve) => {
      ffmpeg.ffprobe(inputPath, (_err, data) => resolve(data as FfprobeData));
    });
    const streams = Array.isArray(probe?.streams) ? probe.streams : [];
    const hasAudio = streams.some((s) => s?.codec_type === 'audio');
    const videoStream = streams.find((s) => s?.codec_type === 'video');
    const audioStream = streams.find((s) => s?.codec_type === 'audio');
    // Preserve source FPS up to 60, keep a reasonable floor of 24
    const sourceFpsProbe = parseFps(videoStream?.avg_frame_rate || videoStream?.r_frame_rate);
    if (sourceFpsProbe && sourceFpsProbe > 0) {
      const rounded = Math.round(sourceFpsProbe);
      targetFps = Math.min(60, Math.max(24, rounded));
    }
    // bitrate estimates
    const totalKbps = toKbps(probe?.format?.bit_rate) || 0;
    const videoKbps = toKbps(videoStream?.bit_rate) || 0;
    const safeSourceKbps = videoKbps || (totalKbps > 0 ? Math.max(300, totalKbps - 128) : 3000);
    // Initial estimate of target bitrate (adjusted later after scale is chosen)
    let targetVideoKbps = Math.floor(safeSourceKbps * 0.75);
    // We'll re-clamp this after deciding scale to aim for significantly better quality.
    // Choose target scale based on source resolution
    const vw = videoStream?.width || 0;
    const vh = videoStream?.height || 0;
    const aspect = vw && vh ? vw / vh : 0;
    const scaleExpr = 'scale=min(1920\\,iw):min(1080\\,ih):force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2';
    const scaleExprFallback = 'scale=min(1920\\,iw):min(1080\\,ih):force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2';
    const scaleTag = '<=1080p';

    // Re-clamp bitrate heuristic against a 1080p ceiling (no VBV used in primary path)
    {
      const targetW = Math.min(1920, vw || 0);
      const targetH = Math.min(1080, vh || 0);
      const norm = targetW && targetH ? (targetW * targetH) / (1920 * 1080) : 0.5;
      const minKbps = Math.max(3500, Math.round(9000 * norm));
      const maxKbps = Math.max(6000, Math.round(14000 * norm));
      targetVideoKbps = Math.max(minKbps, Math.min(maxKbps, Math.floor(safeSourceKbps * 0.9)));
      if (videoKbps) {
        targetVideoKbps = Math.min(targetVideoKbps, Math.max(minKbps, videoKbps - 100));
      }
    }

    // If already frame-compatible, remux with faststart and skip re-encoding to preserve quality
    const alreadyCompatible = isFrameCompatible(probe);
    const remuxCopyOptions: string[] = [
      '-map', hasAudio ? '0:v:0' : '0:v:0',
      ...(hasAudio ? ['-map', '0:a:0'] : []),
      '-c', 'copy',
      '-movflags', '+faststart',
      '-f', 'mp4',
      '-y'
    ];

    if (alreadyCompatible) {
      try {
        await runWithOptions(remuxCopyOptions, 'copy');
        usedPath = 'copy';
      } catch (copyErr) {
        // If copy remux fails, proceed to normal primary encoding path
        console.error('Copy remux failed, falling back to encode:', copyErr);
      }
    }
    // Build GOP options based on targetFps (approx 2-second GOP)
    const gopKeyint = Math.max(2, Math.round(targetFps * 2));
    const gopMinKeyint = Math.max(1, Math.round(targetFps));
    const x264GopOpts = `keyint=${gopKeyint}:min-keyint=${gopMinKeyint}:scenecut=40:ref=5:bframes=8:b-adapt=2:me=umh:subme=9:trellis=2:aq-mode=2:aq-strength=1.2:rc-lookahead=60:weightp=2:8x8dct=1:direct=auto`;

    // High quality, frame-ready settings for primary conversion (High Profile/AAC/30fps)
    const primaryOptions: string[] = [
      // Video settings
      '-map', '0:v:0',
      '-c:v', 'libx264',
      '-preset', 'slower',
      '-tune', 'grain',
      '-pix_fmt', 'yuv420p',
      '-vf', scaleExpr,
      '-r', String(targetFps),
      '-profile:v', 'high',
      '-level', '4.1',
      // CRF-based compression for quality
      '-crf', '14',
      // Audio settings
      ...(hasAudio ? [
        '-map', '0:a:0',
        '-c:a', 'aac',
        '-b:a', '320k',
        '-ar', '48000',
        '-ac', '2'  // MP3 stereo, 44.1kHz
      ] : ['-an']),  // No audio if not present in source
      // Output settings
      '-movflags', '+faststart',
      '-f', 'mp4',
      '-y',
      // Additional optimizations
      '-threads', '0',  // Use all available CPU threads
      '-x264opts', x264GopOpts  // Dynamic GOP + enhanced motion/psy settings based on target FPS
    ];

    // Last resort - encode with ultrafast Baseline/MP3 to maximize success
    const remuxOptions: string[] = [
      // Video settings
      '-map', '0:v:0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-vf', scaleExpr,
      '-r', '30',
      '-profile:v', 'baseline',
      '-level', '3.1',
      '-crf', '23',
      // Audio settings
      ...(hasAudio ? [
        '-map', '0:a:0',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2'
      ] : ['-an']),
      // Output settings
      '-movflags', '+faststart',
      '-f', 'mp4',
      '-y'
    ];

    // Fallback options (quality-biased but faster)
    const fallbackOptions: string[] = [
      // Video settings
      '-map', '0:v:0',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',
      '-vf', scaleExprFallback,
      '-r', String(targetFps),
      '-profile:v', 'high',
      '-level', '4.1',
      // Use CRF for consistent quality (slightly higher quality)
      '-crf', '17',
      // Constrain peak bitrate (<= 10 Mbps)
      '-maxrate', '10M',
      '-bufsize', '20M',
      // Audio settings
      ...(hasAudio ? [
        '-map', '0:a:0',
        '-c:a', 'aac',
        '-b:a', '256k',
        '-ar', '48000',
        '-ac', '2'
      ] : ['-an']),
      // Output settings
      '-movflags', '+faststart',
      '-f', 'mp4',
      '-y',
      // Optimizations for speed
      '-threads', '0',
      '-x264opts', x264GopOpts
    ];

    const durationSec = probe?.format?.duration ? parseFloat(probe.format.duration) || 0 : 0;
    const passLogBase = path.join(os.tmpdir(), `pixora-${transcodeId}-2pass`);
    const nullSink = process.platform === 'win32' ? 'NUL' : '/dev/null';

    const runTwoPassPrimary = async () => {
      // Pass 1: analyze, no audio, write to null sink
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-map', '0:v:0',
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-pix_fmt', 'yuv420p',
            '-vf', scaleExpr,
            '-r', String(targetFps),
            '-b:v', `${targetVideoKbps}k`,
            '-maxrate', `${Math.min(10_000, Math.round(targetVideoKbps * 2))}k`,
            '-bufsize', `${Math.min(20_000, Math.round(targetVideoKbps * 3))}k`,
            '-profile:v', 'baseline',
            '-level', '3.1',
            '-pass', '1',
            '-passlogfile', passLogBase,
            '-an',
            '-f', 'null',
          ])
          .on('stderr', (line) => { stderrLines.push(line); console.log('ffmpeg stderr (p1):', line); })
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(nullSink);
      });
      // Pass 2: actual encode with audio
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-map', '0:v:0',
            ...(hasAudio ? ['-map', '0:a:0'] : ['-an']),
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-pix_fmt', 'yuv420p',
            '-vf', scaleExpr,
            '-r', String(targetFps),
            '-b:v', `${targetVideoKbps}k`,
            '-maxrate', `${Math.min(10_000, Math.round(targetVideoKbps * 2))}k`,
            '-bufsize', `${Math.min(20_000, Math.round(targetVideoKbps * 3))}k`,
            '-profile:v', 'baseline',
            '-level', '3.1',
            '-pass', '2',
            '-passlogfile', passLogBase,
            '-c:a', 'libmp3lame',
            '-b:a', '192k',
            '-ar', '44100',
            '-ac', '2',
            '-movflags', '+faststart',
          ])
          .on('stderr', (line) => { stderrLines.push(line); console.log('ffmpeg stderr (p2):', line); })
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(outputPath);
      });
    };

    try {
      if (usedPath !== 'copy') {
        await runWithOptions(primaryOptions);
        usedPath = 'primary';
      }
    } catch (primaryErr) {
      console.error('Primary FFmpeg conversion failed:', primaryErr);
      console.error('Error details:', String(primaryErr));
      
      // Clean up any partial output file
      try { await fs.unlink(outputPath); } catch (cleanupErr) {
        console.error('Error cleaning up after primary conversion:', cleanupErr);
      }
      
      // Try fallback with simpler settings
      try {
        console.log('Trying fallback conversion...');
        await runWithOptions(fallbackOptions, 'fallback');
        usedPath = 'fallback';
        console.log('Fallback conversion succeeded');
      } catch (fallbackErr) {
        console.error('Fallback FFmpeg conversion failed:', fallbackErr);
        console.error('Fallback error details:', String(fallbackErr));
        
        // Clean up any partial output file from fallback
        try { await fs.unlink(outputPath); } catch (cleanupErr) {
          console.error('Error cleaning up after fallback conversion:', cleanupErr);
        }
        
        // As last resort, try to remux (no compression) to salvage output
        try {
          console.log('Attempting to remux as last resort...');
          await runWithOptions(remuxOptions as string[], 'remux');
          usedPath = 'remux';
          console.log('Remuxing succeeded');
        } catch (remuxErr) {
          console.error('Remuxing also failed:', remuxErr);
          console.error('Remux error details:', String(remuxErr));
          throw new Error(`All conversion attempts failed. Last error: ${remuxErr}`);
        }
      }
    }

    const outputBuffer = await fs.readFile(outputPath);
    const safeBase = sanitizeBaseName(baseName);
    const filename = `${safeBase}fr.mp4`;

    const info = `path=${usedPath}; scale=${scaleTag}; fps=${targetFps}; vkbps=${targetVideoKbps}; hasAudio=${hasAudio}`;
    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Transcode-Path': usedPath,
        'X-Transcode-Info': info,
      },
    });
  } catch (err: unknown) {
    console.error('FFmpeg API error:', err);
    const msg = err instanceof Error ? err.message : String(err || '');
    const tail = stderrLines.slice(-15).join('\n');
    const details = tail ? `${msg} | ffmpeg: ${tail}` : msg;
    return NextResponse.json({ error: 'Conversion failed', details }, { status: 500 });
  } finally {
    // Cleanup temp files
    try { if (inputPath) await fs.unlink(inputPath); } catch {}
    try { if (outputPath) await fs.unlink(outputPath); } catch {}
    // Cleanup two-pass logs
    try { if (transcodeId) await fs.unlink(`${path.join(os.tmpdir(), `pixora-${transcodeId}-2pass`)}.log`); } catch {}
    try { if (transcodeId) await fs.unlink(`${path.join(os.tmpdir(), `pixora-${transcodeId}-2pass`)}.log.mbtree`); } catch {}
  }
}
