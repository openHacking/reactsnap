import type { RenderOptions } from "./types";

export function ensureBrowserApi(name: string, value: unknown): void {
  if (!value) {
    throw new Error(`${name} is only available in a browser environment.`);
  }
}

export function resolveDimensions(node: HTMLElement, options: RenderOptions) {
  const rect = node.getBoundingClientRect();
  const width = Math.max(1, Math.round(options.width ?? rect.width));
  const height = Math.max(1, Math.round(options.height ?? rect.height));
  const scale = options.scale ?? options.pixelRatio ?? window.devicePixelRatio ?? 1;

  return { width, height, scale };
}

export async function waitForReady(
  target: Document,
  waitUntil: RenderOptions["waitUntil"] = "fonts"
): Promise<void> {
  if (typeof waitUntil === "number") {
    await delay(waitUntil);
    return;
  }

  if (waitUntil === "load") {
    if (target.readyState === "complete") {
      return;
    }

    await new Promise<void>((resolve) => {
      target.defaultView?.addEventListener("load", () => resolve(), { once: true });
    });
    return;
  }

  if (waitUntil === "network-idle") {
    await delay(200);
    return;
  }

  if ("fonts" in target && target.fonts?.ready) {
    await target.fonts.ready;
    return;
  }

  await delay(16);
}

export function cloneNodeForExport(node: HTMLElement): HTMLElement {
  return node.cloneNode(true) as HTMLElement;
}

export function escapeSvgText(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), type, quality);
  });

  if (!blob) {
    throw new Error(`Unable to serialize canvas as ${type}.`);
  }

  return blob;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
