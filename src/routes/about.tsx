import { createFileRoute } from "@tanstack/react-router";
import { CwsLogo } from "../components/site/cws-logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — C Wow" },
      {
        name: "description",
        content:
          "C Wow by Colossal Web Services is a free multitool workspace for everyday file, document, image, and data tasks.",
      },
      { property: "og:title", content: "About — C Wow" },
      {
        property: "og:description",
        content: "C Wow by Colossal Web Services — everyday tasks, colossal possibilities.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <CwsLogo height={32} />
      <h1 className="mt-5 text-3xl font-bold text-foreground">About C Wow</h1>
      <p className="mt-4 text-lg text-muted-foreground">Everyday tasks. Colossal possibilities.</p>
      <div className="mt-6 space-y-4 text-foreground leading-relaxed">
        <p>
          C Wow is a practical productivity workspace by Colossal Web Services. It brings together
          the everyday tools people need — file conversion, image editing, data cleanup, writing
          helpers, and calculators — into one connected place.
        </p>
        <p>
          Most tools run entirely in your browser. Your files stay on your device and never touch a
          server unless a tool is explicitly labeled "Processed online." You don't need an account
          to use any ready tool.
        </p>
        <p>
          We built C Wow to be fast, honest, and genuinely useful. No fabricated statistics, no fake
          success states, and no tools that don't actually work. If a capability requires a
          connected service that isn't active yet, we say so plainly rather than pretending it
          works.
        </p>
        <h2 className="text-xl font-semibold text-foreground pt-4">What you can do here</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Convert files between formats — PDF, images, CSV, JSON, Excel, and more.</li>
          <li>Edit and optimize images — resize, compress, crop, rotate, and adjust.</li>
          <li>Clean and transform structured data — dedupe, split, merge, and convert.</li>
          <li>Run developer and text utilities — encoders, formatters, hashers, and generators.</li>
          <li>Build colors, QR codes, gradients, and invoices.</li>
          <li>Chain tools into connected workflows for multi-step tasks.</li>
        </ul>
      </div>
    </div>
  );
}
