import { downloadBlob, renderToJpeg, renderToPng, renderToWebp, type RenderOptions } from "@reactsnap/core";
import { useRef, type RefObject } from "react";

type Exporter = (filename?: string, options?: RenderOptions) => Promise<Blob>;

export function useReactSnap<T extends HTMLElement = HTMLElement>(
  baseOptions: RenderOptions = {}
): {
  ref: RefObject<T | null>;
  exportPng: Exporter;
  exportJpeg: Exporter;
  exportWebp: Exporter;
} {
  const ref = useRef<T | null>(null);

  const withNode = async (
    renderer: (node: HTMLElement, options: RenderOptions) => Promise<Blob>,
    filename: string | undefined,
    options: RenderOptions | undefined
  ) => {
    if (!ref.current) {
      throw new Error("ReactSnap target ref is not attached.");
    }

    const blob = await renderer(ref.current, { ...baseOptions, ...options });
    if (filename) {
      downloadBlob(blob, filename);
    }
    return blob;
  };

  const exportPng: Exporter = async (filename, options) =>
    await withNode(renderToPng, filename, options);

  const exportJpeg: Exporter = async (filename, options) =>
    await withNode(renderToJpeg, filename, options);

  const exportWebp: Exporter = async (filename, options) =>
    await withNode(renderToWebp, filename, options);

  return {
    ref,
    exportPng,
    exportJpeg,
    exportWebp
  };
}
