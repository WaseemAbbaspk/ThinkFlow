import JSZip from 'jszip';
import type { RenderedFile } from './markdown';

export async function buildZip(files: RenderedFile[]): Promise<Blob> {
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.content);
  return zip.generateAsync({ type: 'blob' });
}
