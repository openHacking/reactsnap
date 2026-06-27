import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadBlob,
  nodeToCanvas,
  nodeToSvgDataUrl,
  nodeToSvgString,
  type ResolvedRenderStrategy,
  renderToCanvas,
  renderToJpeg,
  renderToPng,
  renderToWebp,
  supportsHtmlInCanvas
} from "../packages/core/src/index";

describe("@reactsnap/core API", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(HTMLCanvasElement.prototype, "layoutSubtree");
    Reflect.deleteProperty(HTMLCanvasElement.prototype, "requestPaint");
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

  it("reports html-in-canvas capability based on WICG canvas APIs", () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "layoutSubtree", {
      value: false,
      writable: true,
      configurable: true
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "requestPaint", {
      value: vi.fn(),
      configurable: true
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawElementImage: vi.fn()
    } as never);

    expect(supportsHtmlInCanvas()).toBe(true);

    Reflect.deleteProperty(HTMLCanvasElement.prototype, "layoutSubtree");
    Reflect.deleteProperty(HTMLCanvasElement.prototype, "requestPaint");
    vi.restoreAllMocks();
    expect(supportsHtmlInCanvas()).toBe(false);
  });

  it("uses html-in-canvas when auto is selected and capability is available", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 60, height: 24 })
    });

    const context = {
      fillStyle: "",
      fillRect: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      drawElementImage: vi.fn()
    };

    Object.defineProperty(HTMLCanvasElement.prototype, "layoutSubtree", {
      value: false,
      writable: true,
      configurable: true
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "requestPaint", {
      value: vi.fn(function (this: HTMLCanvasElement) {
        this.dispatchEvent(new Event("paint"));
      }),
      configurable: true
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);

    const resolved: ResolvedRenderStrategy[] = [];
    const canvas = await nodeToCanvas(node, {
      width: 60,
      height: 24,
      strategy: "auto",
      onStrategyResolved: (strategy) => resolved.push(strategy)
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect((canvas as HTMLCanvasElement & { layoutSubtree?: boolean }).layoutSubtree).toBe(true);
    expect(context.drawElementImage).toHaveBeenCalledWith(expect.any(HTMLElement), 0, 0, 60, 24);
    expect(resolved.at(-1)).toEqual({
      requested: "auto",
      resolved: "html-in-canvas",
      fallback: false,
      reason: "browser capability available"
    });
  });

  it("falls back from auto to foreign-object with a debug warning", async () => {
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
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    class MockImage {
      decoding = "";
      src = "";
      async decode() {}
    }

    vi.stubGlobal("Image", MockImage);

    const resolved: ResolvedRenderStrategy[] = [];
    await nodeToCanvas(node, {
      width: 75,
      height: 30,
      strategy: "auto",
      debug: true,
      onStrategyResolved: (strategy) => resolved.push(strategy)
    });

    expect(resolved.at(-1)).toEqual({
      requested: "auto",
      resolved: "foreign-object",
      fallback: true,
      reason: "html-in-canvas capability unavailable; falling back to foreign-object"
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('strategy "auto" resolved to "foreign-object"')
    );
    expect(context.drawImage).toHaveBeenCalledTimes(1);
  });

  it("falls back from auto when html-in-canvas rendering fails at runtime", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 75, height: 30 })
    });

    const context = {
      fillStyle: "",
      fillRect: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      drawElementImage: vi.fn(() => {
        throw new Error("draw failed");
      })
    };

    Object.defineProperty(HTMLCanvasElement.prototype, "layoutSubtree", {
      value: false,
      writable: true,
      configurable: true
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "requestPaint", {
      value: vi.fn(function (this: HTMLCanvasElement) {
        this.dispatchEvent(new Event("paint"));
      }),
      configurable: true
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    class MockImage {
      decoding = "";
      src = "";
      async decode() {}
    }

    vi.stubGlobal("Image", MockImage);

    const resolved: ResolvedRenderStrategy[] = [];
    await nodeToCanvas(node, {
      width: 75,
      height: 30,
      strategy: "auto",
      debug: true,
      onStrategyResolved: (strategy) => resolved.push(strategy)
    });

    expect(resolved.at(-1)?.requested).toBe("auto");
    expect(resolved.at(-1)?.resolved).toBe("foreign-object");
    expect(resolved.at(-1)?.fallback).toBe(true);
    expect(resolved.at(-1)?.reason).toContain(
      "html-in-canvas render failed; falling back to foreign-object"
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("html-in-canvas render failed; falling back to foreign-object")
    );
    expect(context.drawImage).toHaveBeenCalledTimes(1);
  });

  it("throws when html-in-canvas is explicitly requested without support", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 75, height: 30 })
    });

    await expect(
      nodeToCanvas(node, {
        width: 75,
        height: 30,
        strategy: "html-in-canvas"
      })
    ).rejects.toThrow("html-in-canvas is not supported in this browser environment.");
  });

  it("keeps foreign-object as a deterministic explicit strategy", async () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    Object.defineProperty(node, "getBoundingClientRect", {
      value: () => ({ width: 90, height: 40 })
    });

    const context = {
      fillStyle: "",
      fillRect: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      drawElementImage: vi.fn()
    };

    Object.defineProperty(HTMLCanvasElement.prototype, "layoutSubtree", {
      value: false,
      writable: true,
      configurable: true
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "requestPaint", {
      value: vi.fn(function (this: HTMLCanvasElement) {
        this.dispatchEvent(new Event("paint"));
      }),
      configurable: true
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as never);

    class MockImage {
      decoding = "";
      src = "";
      async decode() {}
    }

    vi.stubGlobal("Image", MockImage);

    const resolved: ResolvedRenderStrategy[] = [];
    await nodeToCanvas(node, {
      width: 90,
      height: 40,
      strategy: "foreign-object",
      onStrategyResolved: (strategy) => resolved.push(strategy)
    });

    expect(resolved.at(-1)).toEqual({
      requested: "foreign-object",
      resolved: "foreign-object",
      fallback: false,
      reason: "explicit foreign-object strategy requested"
    });
    expect(context.drawElementImage).not.toHaveBeenCalled();
    expect(context.drawImage).toHaveBeenCalledTimes(1);
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
