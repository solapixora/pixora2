import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const originalName = (file as File & { name?: string }).name ?? 'image.heic';
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let outputBuffer: Buffer | null = null;
    let sharpErr: string | null = null;
    try {
      outputBuffer = await sharp(inputBuffer, { unlimited: true })
        .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
        .toBuffer();
    } catch (err: unknown) {
      sharpErr = err instanceof Error ? err.message : String(err || '');
    }

    if (!outputBuffer) {
      // Try heic-convert first (if present)
      try {
        type ConvertOptions = { buffer: Buffer; format: 'JPEG' | 'PNG'; quality?: number };
        type HeicConvertExport = (opts: ConvertOptions) => Promise<Buffer>;
        type HeicConvertModule = { default?: HeicConvertExport } | HeicConvertExport;

        const mod = (await import('heic-convert')) as unknown as HeicConvertModule;
        const heicConvertFn: HeicConvertExport = typeof mod === 'function' ? mod : (mod.default as HeicConvertExport);

        const converted = await heicConvertFn({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.9,
        });
        // Recompress and resize with sharp to control dimensions/size consistently
        outputBuffer = await sharp(converted)
          .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
          .toBuffer();
      } catch (err: unknown) {
        // If heic-convert is unavailable or fails, fall back to heic-decode + sharp
        try {
          type HeicDecoded = { width: number; height: number; data: Uint8Array };
          type HeicDecodeExport = (input: { buffer: Buffer }) => Promise<HeicDecoded | HeicDecoded[]>;
          type HeicDecodeModule = { default?: HeicDecodeExport } | HeicDecodeExport;

          const mod2 = (await import('heic-decode')) as unknown as HeicDecodeModule;
          const heicDecodeFn: HeicDecodeExport = typeof mod2 === 'function' ? mod2 : (mod2.default as HeicDecodeExport);
          const decoded = await heicDecodeFn({ buffer: inputBuffer });
          const img = Array.isArray(decoded) ? decoded[0] : decoded;
          const { width, height, data } = img;

          outputBuffer = await sharp(Buffer.from(data), {
            raw: { width, height, channels: 4 },
          })
            .removeAlpha()
            .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
            .toBuffer();
        } catch (err2: unknown) {
          const heicErr1 = err instanceof Error ? err.message : String(err || '');
          const heicErr2 = err2 instanceof Error ? err2.message : String(err2 || '');
          const details = [sharpErr, heicErr1, heicErr2].filter(Boolean).join(' | ');
          return NextResponse.json({ error: 'HEIC conversion failed', details }, { status: 500 });
        }
      }
    }

    const filename = originalName.replace(/\.(heic|heif)$/i, '') + '_pixora-heic2jpg.jpg';

    return new NextResponse(outputBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err || '');
    return NextResponse.json({ error: 'Unexpected server error', details: msg }, { status: 500 });
  }
}
