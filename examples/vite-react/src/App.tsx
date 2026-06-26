import { useState } from "react";
import { useReactSnap } from "@reactsnap/react";

export function App() {
  const [status, setStatus] = useState("Ready to export");
  const { ref, exportPng } = useReactSnap<HTMLElement>({
    scale: 2,
    background: "#f7f3ea"
  });

  return (
    <main className="page">
      <section>
        <p className="eyebrow">ReactSnap Demo</p>
        <h1>Export real React UI into a PNG.</h1>
        <p className="intro">
          This example uses the bootstrap hook and the baseline foreignObject strategy.
        </p>
        <button
          className="action"
          onClick={async () => {
            setStatus("Rendering PNG...");
            try {
              await exportPng("reactsnap-card.png");
              setStatus("PNG exported");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Export failed");
            }
          }}
        >
          Export PNG
        </button>
        <p className="status">{status}</p>
      </section>

      <section className="stage">
        <article ref={ref} className="card">
          <div className="badge">Component Snapshot</div>
          <h2>Invoice Summary</h2>
          <p className="card-copy">
            The initial engine focuses on DOM node and React component export.
          </p>
          <div className="stats">
            <div>
              <span className="label">Format</span>
              <strong>PNG</strong>
            </div>
            <div>
              <span className="label">Strategy</span>
              <strong>foreignObject</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
