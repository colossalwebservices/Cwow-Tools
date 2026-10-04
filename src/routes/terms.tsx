import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — C Wow" },
      { name: "description", content: "Terms of use for C Wow by Colossal Web Services." },
      { property: "og:title", content: "Terms — C Wow" },
      { property: "og:description", content: "Terms of use for C Wow." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Terms of Use</h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          C Wow is provided by Colossal Web Services as a free productivity workspace for everyday
          tasks.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Use of the service</h2>
        <p>
          You may use C Wow for lawful personal and commercial tasks. You are responsible for the
          content you process and for ensuring you have the rights to any files you upload or
          convert.
        </p>
        <h2 className="text-lg font-semibold text-foreground">No warranty</h2>
        <p>
          The tools are provided "as is" without warranty of any kind. While we strive for reliable
          output, we recommend keeping backups of your original files. Results from calculators are
          arithmetic based on your inputs and are not professional advice.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Limitations</h2>
        <p>
          Online tools respect the limits of their connected services. We do not guarantee unlimited
          free processing for capabilities that require paid infrastructure.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Privacy</h2>
        <p>
          Our data handling is described in our Privacy page. Local tools do not transmit your file
          contents; online tools are clearly labeled.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Changes</h2>
        <p>
          We may update these terms and the available tools over time. Continued use after changes
          constitutes acceptance.
        </p>
      </div>
    </div>
  );
}
