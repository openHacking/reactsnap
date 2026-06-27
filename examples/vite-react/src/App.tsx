import {
  renderToPng,
  supportsHtmlInCanvas,
  type RenderStrategy,
  type ResolvedRenderStrategy
} from "@reactsnap/core";
import { useReactSnap } from "@reactsnap/react";
import { useEffect, useRef, useState } from "react";

type SourceMode = "react" | "html";
type StrategyOption = Exclude<RenderStrategy, undefined>;

const sharedExportOptions = {
  scale: 2,
  background: "#f7f3ea"
} as const;

const strategyLabels: Record<StrategyOption, string> = {
  auto: "Auto",
  "html-in-canvas": "WICG HTML in Canvas",
  "foreign-object": "foreignObject"
};

function InvoiceCard(props: { variant: SourceMode; strategy: StrategyOption }) {
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
          <strong>{strategyLabels[props.strategy]}</strong>
        </div>
      </div>
    </article>
  );
}

export function App() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("react");
  const [strategy, setStrategy] = useState<StrategyOption>("auto");
  const [status, setStatus] = useState("Rendering initial preview...");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string>("--");
  const [resolvedStrategy, setResolvedStrategy] = useState<ResolvedRenderStrategy | null>(null);
  const htmlRef = useRef<HTMLElement | null>(null);
  const latestPreviewUrlRef = useRef<string | null>(null);
  const { ref: reactRef } = useReactSnap<HTMLDivElement>(sharedExportOptions);
  const htmlInCanvasSupported = supportsHtmlInCanvas();

  useEffect(() => {
    let active = true;

    const generatePreview = async () => {
      setStatus(
        `Rendering ${sourceMode.toUpperCase()} preview with ${strategyLabels[strategy]}...`
      );

      try {
        const targetNode = sourceMode === "react" ? reactRef.current : htmlRef.current;
        const blob = targetNode
          ? await renderToPng(targetNode, {
              ...sharedExportOptions,
              strategy,
              debug: true,
              onStrategyResolved: (nextStrategy) => {
                if (!active) {
                  return;
                }
                setResolvedStrategy(nextStrategy);
              }
            })
          : null;

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
        setResolvedStrategy(null);
        setStatus(error instanceof Error ? error.message : "Preview export failed.");
      }
    };

    void generatePreview();

    return () => {
      active = false;
    };
  }, [reactRef, sourceMode, strategy]);

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
        <div className="toolbar__controls">
          <div className="toolbar__stack">
            <span className="toolbar__label">Source</span>
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
          </div>
          <div className="toolbar__stack">
            <span className="toolbar__label">Strategy</span>
            <div className="toolbar__group" role="tablist" aria-label="Render strategy">
              <button
                type="button"
                className={`chip ${strategy === "auto" ? "chip--active" : ""}`}
                onClick={() => setStrategy("auto")}
              >
                Auto
              </button>
              <button
                type="button"
                className={`chip ${strategy === "html-in-canvas" ? "chip--active" : ""}`}
                onClick={() => setStrategy("html-in-canvas")}
                disabled={!htmlInCanvasSupported}
                title={
                  htmlInCanvasSupported
                    ? "Use the WICG html-in-canvas path"
                    : "WICG html-in-canvas is not available in this browser"
                }
              >
                WICG HTML in Canvas
              </button>
              <button
                type="button"
                className={`chip ${strategy === "foreign-object" ? "chip--active" : ""}`}
                onClick={() => setStrategy("foreign-object")}
              >
                foreignObject
              </button>
            </div>
          </div>
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
            <div className="strategy-board">
              <div className="strategy-board__card">
                <span className="strategy-board__label">Requested</span>
                <strong>{strategyLabels[strategy]}</strong>
              </div>
              <div className="strategy-board__card">
                <span className="strategy-board__label">Resolved</span>
                <strong>
                  {resolvedStrategy ? strategyLabels[resolvedStrategy.resolved] : "--"}
                </strong>
              </div>
              <div className="strategy-board__card">
                <span className="strategy-board__label">Fallback</span>
                <strong>{resolvedStrategy ? (resolvedStrategy.fallback ? "Yes" : "No") : "--"}</strong>
              </div>
              <div className="strategy-board__card">
                <span className="strategy-board__label">WICG Support</span>
                <strong>{htmlInCanvasSupported ? "Available" : "Unavailable"}</strong>
              </div>
            </div>
            <p className="strategy-board__reason">
              {resolvedStrategy?.reason ??
                "Choose a strategy to compare explicit routing with automatic fallback."}
            </p>
            <div className="source-frame">
              <div className="source-frame__canvas">
                <div className="snapshot-stage">
                  <div
                    className={sourceMode === "react" ? "" : "is-hidden"}
                    aria-hidden={sourceMode !== "react"}
                  >
                    <div ref={reactRef}>
                      <InvoiceCard variant="react" strategy={strategy} />
                    </div>
                  </div>
                  <div
                    className={sourceMode === "html" ? "" : "is-hidden"}
                    aria-hidden={sourceMode !== "html"}
                  >
                    <section ref={htmlRef}>
                      <InvoiceCard variant="html" strategy={strategy} />
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
