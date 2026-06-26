import type { RenderOptions } from "./types";
import { cloneNodeForExport, ensureBrowserApi, escapeSvgText, resolveDimensions, waitForReady } from "./utils";

function collectInlineStyles(node: HTMLElement): string {
  const style = getComputedStyle(node);
  const rules = [
    ["box-sizing", style.boxSizing],
    ["font-family", style.fontFamily],
    ["font-size", style.fontSize],
    ["font-weight", style.fontWeight],
    ["line-height", style.lineHeight],
    ["color", style.color],
    ["background", style.background],
    ["padding", style.padding],
    ["margin", style.margin],
    ["border", style.border],
    ["border-radius", style.borderRadius],
    ["display", style.display],
    ["align-items", style.alignItems],
    ["justify-content", style.justifyContent],
    ["gap", style.gap],
    ["width", `${node.offsetWidth}px`],
    ["height", `${node.offsetHeight}px`]
  ];

  return rules.map(([key, value]) => `${key}:${value}`).join(";");
}

export async function nodeToSvgString(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<string> {
  ensureBrowserApi("document", globalThis.document);
  await waitForReady(node.ownerDocument, options.waitUntil);

  const { width, height } = resolveDimensions(node, options);
  const cloned = cloneNodeForExport(node);
  const serializedNode = new XMLSerializer().serializeToString(cloned);
  const background = options.background
    ? `<rect width="100%" height="100%" fill="${escapeSvgText(options.background)}" />`
    : "";
  const wrapperStyle = collectInlineStyles(node);

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
