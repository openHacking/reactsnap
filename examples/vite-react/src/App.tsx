import { renderToPng } from "@reactsnap/core";
import { useReactSnap } from "@reactsnap/react";
import { useEffect, useRef, useState } from "react";

type SourceMode = "react" | "html";

const sharedExportOptions = {
  scale: 2,
  background: "#f7f3ea"
} as const;

function InvoiceCard(props: { variant: SourceMode }) {
  const isHtml = props.variant === "html";

  return (
    <article className={`snapshot-card ${isHtml ? "snapshot-card--html" : ""}`}>
      <div className="snapshot-card__badge">{isHtml ? "HTML Snapshot" : "React Snapshot"}</div>
      <h2>Invoice Summary</h2>
      <p className="snapshot-card__copy">
        Inspect the source node on the left and compare it with the exported PNG on the
        right.
      </p>
      <div className="snapshot-card__stats">
        <div>
          <span className="snapshot-card__label">Source</span>
          <strong>{isHtml ? "HTML" : "React"}</strong>
        </div>
        <div>
          <span className="snapshot-card__label">Renderer</span>
          <strong>foreignObject</strong>
        </div>
      </div>
    </article>
  );
}

export function App() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("react");
  const [status, setStatus] = useState("Rendering initial preview...");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string>("--");
  const htmlRef = useRef<HTMLElement | null>(null);
  const latestPreviewUrlRef = useRef<string | null>(null);
  const { ref: reactRef } = useReactSnap<HTMLDivElement>(sharedExportOptions);

  useEffect(() => {
    let active = true;

    const generatePreview = async () => {
      setStatus(`Rendering ${sourceMode.toUpperCase()} preview...`);

      try {
        const targetNode = sourceMode === "react" ? reactRef.current : htmlRef.current;
        const blob = targetNode ? await renderToPng(targetNode, sharedExportOptions) : null;

        if (!blob) {
          throw new Error(`${sourceMode.toUpperCase()} preview target is not attached.`);
        }

        const nextPreviewUrl = URL.createObjectURL(blob);
        if (!active) {
          URL.revokeObjectURL(nextPreviewUrl);
          return;
        }

        setPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          latestPreviewUrlRef.current = nextPreviewUrl;
          return nextPreviewUrl;
        });
        setPreviewSize(`${Math.round(blob.size / 1024)} KB`);
        setStatus(`Preview ready from ${sourceMode.toUpperCase()}.`);
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus(error instanceof Error ? error.message : "Preview export failed.");
      }
    };

    void generatePreview();

    return () => {
      active = false;
    };
  }, [reactRef, sourceMode]);

  useEffect(() => {
    return () => {
      if (latestPreviewUrlRef.current) {
        URL.revokeObjectURL(latestPreviewUrlRef.current);
      }
    };
  }, []);

  return (
    <main className="workbench">
      <section className="hero">
        <div>
          <p className="eyebrow">ReactSnap Dev Workbench</p>
          <h1>Preview the source node and its PNG export side by side.</h1>
        </div>
        <p className="intro">
          Use this page during development to compare real DOM output with the rasterized
          PNG result without downloading files manually.
        </p>
      </section>

      <section className="toolbar">
        <div className="toolbar__group" role="tablist" aria-label="Source mode">
          <button
            type="button"
            className={`chip ${sourceMode === "react" ? "chip--active" : ""}`}
            onClick={() => setSourceMode("react")}
          >
            React component
          </button>
          <button
            type="button"
            className={`chip ${sourceMode === "html" ? "chip--active" : ""}`}
            onClick={() => setSourceMode("html")}
          >
            HTML block
          </button>
        </div>
        <div className="toolbar__meta">
          <span>{status}</span>
          <span>Blob size: {previewSize}</span>
        </div>
      </section>

      <section className="panels">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Source</p>
              <h2>{sourceMode === "react" ? "Rendered React component" : "Rendered HTML node"}</h2>
            </div>
            <code>{sourceMode === "react" ? "useReactSnap()" : "renderToPng()"}</code>
          </div>
          <div className="panel__body panel__body--source">
            <div className="source-frame">
              <div className="source-frame__canvas">
                <div className="snapshot-stage">
                  <div
                    className={sourceMode === "react" ? "" : "is-hidden"}
                    aria-hidden={sourceMode !== "react"}
                  >
                    <div ref={reactRef}>
                      <InvoiceCard variant="react" />
                    </div>
                  </div>
                  <div
                    className={sourceMode === "html" ? "" : "is-hidden"}
                    aria-hidden={sourceMode !== "html"}
                  >
                    <section ref={htmlRef}>
                      <InvoiceCard variant="html" />
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Output</p>
              <h2>Exported PNG preview</h2>
            </div>
            <span className="pill">Auto refreshed</span>
          </div>
          <div className="panel__body">
            <div className="preview-frame">
              {previewUrl ? (
                <img
                  className="preview-frame__image"
                  src={previewUrl}
                  alt={`PNG preview generated from the ${sourceMode} source`}
                />
              ) : (
                <div className="preview-frame__empty">Preview not ready yet.</div>
              )}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
