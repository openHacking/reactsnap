import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReactSnap } from "../packages/react/src/useReactSnap";

const coreMocks = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
  renderToJpeg: vi.fn(),
  renderToPng: vi.fn(),
  renderToWebp: vi.fn()
}));

vi.mock("@reactsnap/core", () => ({
  downloadBlob: coreMocks.downloadBlob,
  renderToJpeg: coreMocks.renderToJpeg,
  renderToPng: coreMocks.renderToPng,
  renderToWebp: coreMocks.renderToWebp
}));

describe("@reactsnap/react API", () => {
  beforeEach(() => {
    coreMocks.downloadBlob.mockReset();
    coreMocks.renderToJpeg.mockReset();
    coreMocks.renderToPng.mockReset();
    coreMocks.renderToWebp.mockReset();
  });

  it("throws if the ref has not been attached", async () => {
    const { result } = renderHook(() => useReactSnap());

    await expect(result.current.exportPng()).rejects.toThrow(
      "ReactSnap target ref is not attached."
    );
  });

  it("renders PNG without downloading when filename is omitted", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    coreMocks.renderToPng.mockResolvedValue(blob);

    const { result } = renderHook(() => useReactSnap({ scale: 2 }));
    const node = document.createElement("div");
    result.current.ref.current = node;

    const output = await result.current.exportPng(undefined, { background: "#fff" });

    expect(output).toBe(blob);
    expect(coreMocks.renderToPng).toHaveBeenCalledWith(node, {
      scale: 2,
      background: "#fff"
    });
    expect(coreMocks.downloadBlob).not.toHaveBeenCalled();
  });

  it("downloads JPEG and WebP when a filename is provided", async () => {
    const jpegBlob = new Blob(["jpg"], { type: "image/jpeg" });
    const webpBlob = new Blob(["webp"], { type: "image/webp" });
    coreMocks.renderToJpeg.mockResolvedValue(jpegBlob);
    coreMocks.renderToWebp.mockResolvedValue(webpBlob);

    const { result } = renderHook(() => useReactSnap({ scale: 3, background: "#eee" }));
    const node = document.createElement("section");
    result.current.ref.current = node;

    await expect(result.current.exportJpeg("card.jpg")).resolves.toBe(jpegBlob);
    await expect(
      result.current.exportWebp("card.webp", { background: "#111" })
    ).resolves.toBe(webpBlob);

    expect(coreMocks.renderToJpeg).toHaveBeenCalledWith(node, {
      scale: 3,
      background: "#eee"
    });
    expect(coreMocks.renderToWebp).toHaveBeenCalledWith(node, {
      scale: 3,
      background: "#111"
    });
    expect(coreMocks.downloadBlob).toHaveBeenNthCalledWith(1, jpegBlob, "card.jpg");
    expect(coreMocks.downloadBlob).toHaveBeenNthCalledWith(2, webpBlob, "card.webp");
  });
});
