import type { RenderOptions } from "./types";
import { cloneNodeForSnapshot } from "./snapshotNode";
import { ensureBrowserApi, escapeSvgText, resolveDimensions, waitForReady } from "./utils";

export async function nodeToSvgString(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<string> {
  ensureBrowserApi("document", globalThis.document);
  await waitForReady(node.ownerDocument, options.waitUntil);

  const { width, height } = resolveDimensions(node, options);
  const cloned = cloneNodeForSnapshot(node);
  const serializedNode = new XMLSerializer().serializeToString(cloned);
  const background = options.background
    ? `<rect width="100%" height="100%" fill="${escapeSvgText(options.background)}" />`
    : "";
  const wrapperStyle = `width:${width}px;height:${height}px;`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    background,
    `<foreignObject width="100%" height="100%">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="${wrapperStyle}">`,
    serializedNode,
    `</div>`,
    `</foreignObject>`,
    `</svg>`
  ].join("");
}

export async function nodeToSvgDataUrl(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<string> {
  const svg = await nodeToSvgString(node, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
