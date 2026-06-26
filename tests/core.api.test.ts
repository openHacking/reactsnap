import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadBlob,
  nodeToCanvas,
  nodeToSvgDataUrl,
  nodeToSvgString,
  renderToCanvas,
  renderToJpeg,
  renderToPng,
  renderToWebp
} from "../packages/core/src/index";

describe("@reactsnap/core API", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("serializes a DOM node to an SVG string with copied values and background", async () => {
    const node = document.createElement("div");
    node.innerHTML = `
      <label>
        <input value="hello" />
      </label>
      <textarea>ignored</textarea>
      <span>Snapshot</span>
    `;
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 120, height: 48 })
    });

    const input = node.querySelector("input") as HTMLInputElement;
    const textarea = node.querySelector("textarea") as HTMLTextAreaElement;
    input.value = "synced";
    textarea.value = "typed";

    const svg = await nodeToSvgString(node, {
      background: "#fff",
      width: 120,
      height: 48
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48"');
    expect(svg).toContain('<rect width="100%" height="100%" fill="#fff" />');
    expect(svg).toContain('value="synced"');
    expect(svg).toContain(">typed<");
    expect(svg).toContain("Snapshot");
  });

  it("serializes a DOM node to an SVG data URL", async () => {
    const node = document.createElement("div");
    node.textContent = "Hello";
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 80, height: 20 })
    });

    const dataUrl = await nodeToSvgDataUrl(node, { width: 80, height: 20 });

    expect(dataUrl.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(dataUrl)).toContain("Hello");
  });

  it("renders a DOM node to canvas and binary formats", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 75, height: 30 })
    });

    const context = {
      fillStyle: "",
      fillRect: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn()
    };

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback, type) {
      callback(new Blob([type ?? "image/png"], { type: type ?? "image/png" }));
    });

    class MockImage {
      decoding = "";
      src = "";
      async decode() {}
    }

    vi.stubGlobal("Image", MockImage);

    const canvas = await nodeToCanvas(node, {
      width: 75,
      height: 30,
      scale: 2,
      background: "#abc"
    });

    expect(canvas.width).toBe(150);
    expect(canvas.height).toBe(60);
    expect(canvas.style.width).toBe("75px");
    expect(canvas.style.height).toBe("30px");
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 150, 60);
    expect(context.scale).toHaveBeenCalledWith(2, 2);
    expect(context.drawImage).toHaveBeenCalledTimes(1);

    expect(await renderToCanvas(node, { width: 75, height: 30 })).toBeInstanceOf(HTMLCanvasElement);
    await expect(renderToPng(node, { width: 75, height: 30 })).resolves.toMatchObject({
      type: "image/png"
    });
    await expect(renderToJpeg(node, { width: 75, height: 30 })).resolves.toMatchObject({
      type: "image/jpeg"
    });
    await expect(renderToWebp(node, { width: 75, height: 30 })).resolves.toMatchObject({
      type: "image/webp"
    });
  });

  it("downloads a blob through an object URL", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadBlob(new Blob(["file"]), "card.png");
    await Promise.resolve();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
});
