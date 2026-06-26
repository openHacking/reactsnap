import type { RenderOptions } from "@reactsnap/core";

export type PdfOptions = RenderOptions & {
  filename?: string;
};

export async function renderToPdf(_input: HTMLElement, _options: PdfOptions = {}): Promise<Blob> {
  throw new Error("PDF export is scaffolded but not implemented yet. Next step: add a real PDF backend.");
}
