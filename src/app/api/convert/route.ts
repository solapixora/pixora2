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

// Minimal types for ffprobe result to avoid 'any'
type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string; // e.g., "30000/1001"
  bit_rate?: string;
};
type FfprobeFormat = { bit_rate?: string; duration?: string };
type FfprobeData = { streams?: FfprobeStream[]; format?: FfprobeFormat };

export async function POST(req: Request) {
  // Collect stderr to help diagnose failures
  const stderrLines: string[] = [];
  let transcodeId = '';
  let inputPath = '';
  let outputPath = '';
  let usedPath: 'primary' | 'fallback' | 'remux' = 'primary';
  const targetFps = 24; // fixed fps to aid compression

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
    const hasAudio = Array.isArray(probe?.streams) && probe.streams.some((s) => s?.codec_type === 'audio');
    const videoStream = Array.isArray(probe?.streams) ? probe.streams.find((s) => s?.codec_type === 'video') : undefined;
    // fixed fps to aid compression
    const totalKbps = probe?.format?.bit_rate ? Math.max(1, Math.floor(parseInt(probe.format.bit_rate, 10) / 1000)) : 0;
    const videoKbps = videoStream?.bit_rate ? Math.max(1, Math.floor(parseInt(videoStream.bit_rate, 10) / 1000)) : 0;
    const safeSourceKbps = videoKbps || (totalKbps > 0 ? Math.max(300, totalKbps - 128) : 3000);
    // Aim at ~60% of source video bitrate, with hard clamps
    let targetVideoKbps = Math.floor(safeSourceKbps * 0.6);
    targetVideoKbps = Math.max(250, Math.min(1000, targetVideoKbps));
    // Never exceed source video bitrate (keep at least 50 kbps margin if known)
    if (videoKbps) {
      targetVideoKbps = Math.min(targetVideoKbps, Math.max(200, videoKbps - 50));
    }
    // Choose target scale based on source resolution
    const vw = videoStream?.width || 0;
    const vh = videoStream?.height || 0;
    // Fixed FPS to aid compression
    const targetFps = 24;
    let scaleExpr = 'scale=min(640,iw):min(360,ih):force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2';
    let scaleExprFallback = 'scale=trunc(min(640,iw)/2)*2:trunc(min(360,ih)/2)*2';
    let scaleTag = '360p';
    if ((vw >= 1280 || vh >= 720) && (vw < 1920 && vh < 1080)) {
      scaleExpr = 'scale=min(854,iw):min(480,ih):force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2';
      scaleExprFallback = 'scale=trunc(min(854,iw)/2)*2:trunc(min(480,ih)/2)*2';
      scaleTag = '480p';
    } else if (vw >= 1920 || vh >= 1080) {
      scaleExpr = 'scale=min(1280,iw):min(720,ih):force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2';
      scaleExprFallback = 'scale=trunc(min(1280,iw)/2)*2:trunc(min(720,ih)/2)*2';
      scaleTag = '720p';
      // For 1080p+ sources, allow up to 1000 kbps
      targetVideoKbps = Math.min(1000, Math.max(450, targetVideoKbps));
    }

    // More aggressive compression settings for primary conversion
    const primaryOptions: string[] = [
      // Video settings
      '-map', '0:v:0',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-tune', 'film',  // Optimize for high quality video
      '-pix_fmt', 'yuv420p',
      '-vf', scaleExpr,
      '-r', String(targetFps),
      // More aggressive CRF (Constant Rate Factor) for better compression
      // Lower values = better quality but larger file size (18-28 is a good range)
      '-crf', '23',
      // Limit maximum bitrate to prevent huge files
      '-maxrate', `${Math.round(targetVideoKbps * 1.5)}k`,
      '-bufsize', `${Math.round(targetVideoKbps * 2)}k`,
      // Audio settings
      ...(hasAudio ? [
        '-map', '0:a:0',
        '-c:a', 'aac',
        '-b:a', '64k',
        '-ar', '44100',
        '-ac', '2'  // Force stereo output
      ] : ['-an']),  // No audio if not present in source
      // Output settings
      '-movflags', '+faststart',
      '-profile:v', 'high',
      '-level', '4.1',
      '-f', 'mp4',
      '-y',
      // Additional optimizations
      '-threads', '0',  // Use all available CPU threads
      '-x264opts', 'keyint=60:min-keyint=60:scenecut=0'  // Better keyframe control
    ];

    // Last resort - remux with some compression if possible
    const remuxOptions: string[] = [
      // Video settings - try to re-encode with very fast settings
      '-map', '0:v:0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',  // Fastest possible encoding
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',  // Simple even dimensions
      '-r', String(Math.min(30, targetFps)),  // Cap at 30fps for this fallback
      '-crf', '28',  // Higher CRF for smaller files
      // Audio settings
      ...(hasAudio ? [
        '-map', '0:a:0',
        '-c:a', 'aac',
        '-b:a', '64k',
        '-ar', '44100',
        '-ac', '2'
      ] : ['-an']),
      // Output settings
      '-movflags', '+faststart',
      '-f', 'mp4',
      '-y'
    ];

    // Fallback options with stronger compression
    const fallbackOptions: string[] = [
      // Video settings
      '-map', '0:v:0',
      '-c:v', 'libx264',  // Still use x264 but with simpler settings
      '-preset', 'faster',  // Faster encoding than medium
      '-pix_fmt', 'yuv420p',
      '-vf', scaleExprFallback,
      '-r', String(targetFps),
      // Use CRF for consistent quality
      '-crf', '25',  // Slightly higher CRF for smaller files
      // Audio settings
      ...(hasAudio ? [
        '-map', '0:a:0',
        '-c:a', 'aac',
        '-b:a', '64k',
        '-ar', '44100',
        '-ac', '2'
      ] : ['-an']),
      // Output settings
      '-movflags', '+faststart',
      '-f', 'mp4',
      '-y',
      // Optimizations for speed
      '-threads', '0'
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
            '-maxrate', `${Math.round(targetVideoKbps * 1.2)}k`,
            '-bufsize', `${Math.round(targetVideoKbps * 2)}k`,
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
            '-maxrate', `${Math.round(targetVideoKbps * 1.2)}k`,
            '-bufsize', `${Math.round(targetVideoKbps * 2)}k`,
            '-pass', '2',
            '-passlogfile', passLogBase,
            '-c:a', 'aac',
            '-b:a', '64k',
            '-movflags', '+faststart',
          ])
          .on('stderr', (line) => { stderrLines.push(line); console.log('ffmpeg stderr (p2):', line); })
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(outputPath);
      });
    };

    try {
      if (durationSec >= 10) {
        await runTwoPassPrimary();
      } else {
        await runWithOptions(primaryOptions);
      }
      usedPath = 'primary';
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
    const filename = `${baseName}_pixora-ready_${scaleTag}_${targetFps}fps_${targetVideoKbps}k_${usedPath}.mp4`;

    const info = `path=${usedPath}; scale=${scaleTag}; fps=${targetFps}; vkbps=${targetVideoKbps}; hasAudio=${hasAudio}`;
    return new NextResponse(outputBuffer, {
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
