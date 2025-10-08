declare module 'heic-decode' {
  export type HeicDecoded = { width: number; height: number; data: Uint8Array } | HeicDecoded[];
  export default function heicDecode(input: { buffer: Buffer }): Promise<HeicDecoded>;
}
