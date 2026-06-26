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

export function cloneNodeForSnapshot(node: HTMLElement): HTMLElement {
  const cloned = node.cloneNode(true) as HTMLElement;
  copyComputedStyles(node, cloned);
  return cloned;
}
