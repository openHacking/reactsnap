import type { RenderOptions } from "./types";
import { nodeToCanvas } from "./nodeToCanvas";
import { canvasToBlob } from "./utils";

export async function renderToCanvas(
  input: HTMLElement,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  return await nodeToCanvas(input, options);
}

export async function renderToPng(
  input: HTMLElement,
  options: RenderOptions = {}
): Promise<Blob> {
  const canvas = await renderToCanvas(input, options);
  return await canvasToBlob(canvas, "image/png");
}

export async function renderToJpeg(
  input: HTMLElement,
  options: RenderOptions = {}
): Promise<Blob> {
  const canvas = await renderToCanvas(input, options);
  return await canvasToBlob(canvas, "image/jpeg", 0.92);
}

export async function renderToWebp(
  input: HTMLElement,
  options: RenderOptions = {}
): Promise<Blob> {
  const canvas = await renderToCanvas(input, options);
  return await canvasToBlob(canvas, "image/webp", 0.92);
}
