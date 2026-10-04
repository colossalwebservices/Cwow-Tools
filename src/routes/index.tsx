import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <section aria-labelledby="welcome-title">
        <span className="status"><span aria-hidden="true" />Development preview</span>
        <h1 id="welcome-title">Your project is running.</h1>
        <p>The missing application entry files are in place, and this starter page is served from your source code.</p>
        <div className="details">
          <h2>A clean starting point</h2>
          <p>The imported repository contained configuration but no application screens. This page confirms the development environment works; it does not restore the original app.</p>
        </div>
        <p className="hint">Edit <code>src/routes/index.tsx</code> to build your first screen.</p>
      </section>
    </main>
  );
}
