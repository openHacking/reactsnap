import type { RenderOptions } from "./types";
import { ensureBrowserApi, escapeSvgText, resolveDimensions, waitForReady } from "./utils";

function copyComputedStyles(source: Element, target: Element): void {
  const computed = getComputedStyle(source);
  const cssText = Array.from(computed)
    .map((property) => `${property}:${computed.getPropertyValue(property)};`)
    .join("");

  target.setAttribute("style", cssText);

  if (source instanceof HTMLInputElement) {
    target.setAttribute("value", source.value);
  }

  if (source instanceof HTMLTextAreaElement) {
    target.textContent = source.value;
  }

  if (source instanceof HTMLCanvasElement && target instanceof HTMLCanvasElement) {
    const dataUrl = source.toDataURL();
    const replacement = document.createElement("img");
    replacement.setAttribute("src", dataUrl);
    replacement.setAttribute("style", cssText);
    target.replaceWith(replacement);
    return;
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);

  for (let index = 0; index < sourceChildren.length; index += 1) {
    const sourceChild = sourceChildren[index];
    const targetChild = targetChildren[index];
    if (sourceChild && targetChild) {
      copyComputedStyles(sourceChild, targetChild);
    }
  }
}

function cloneNodeForSvg(node: HTMLElement): HTMLElement {
  const cloned = node.cloneNode(true) as HTMLElement;
  copyComputedStyles(node, cloned);
  return cloned;
}

export async function nodeToSvgString(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<string> {
  ensureBrowserApi("document", globalThis.document);
  await waitForReady(node.ownerDocument, options.waitUntil);

  const { width, height } = resolveDimensions(node, options);
  const cloned = cloneNodeForSvg(node);
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
