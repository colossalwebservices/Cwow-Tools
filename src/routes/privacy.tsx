import { createFileRoute } from "@tanstack/react-router";
import { Shield, Cloud } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — C Wow" },
      {
        name: "description",
        content:
          "How C Wow handles your files and data: local processing stays on your device, online tools are clearly labeled.",
      },
      { property: "og:title", content: "Privacy — C Wow" },
      { property: "og:description", content: "How C Wow handles your files and data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Privacy & Data Handling</h1>
      <div className="mt-6 space-y-6">
        <div className="flex gap-3 rounded-xl border border-border bg-card p-5">
          <Shield className="size-6 shrink-0 text-cat-business" />
          <div>
            <h2 className="font-semibold text-foreground">Stays on your device</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tools labeled "Stays on your device" process your files entirely in your browser using
              JavaScript. Your file contents are never uploaded to any server. Loading the tool's
              code is separate from uploading your file.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-border bg-card p-5">
          <Cloud className="size-6 shrink-0 text-cat-video" />
          <div>
            <h2 className="font-semibold text-foreground">Processed online</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tools labeled "Processed online" send your input to a server for processing. These are
              clearly marked before you start. Online tools are only enabled when their service is
              actually connected and configured.
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-foreground leading-relaxed">
          <h2 className="text-lg font-semibold text-foreground">Session workspace</h2>
          <p className="text-muted-foreground">
            The workspace holds your current inputs and outputs in browser memory only. We do not
            save file contents or sensitive document text to localStorage. Refreshing or closing the
            tab discards unsaved files. Favorites and recently-used tool IDs are stored locally on
            your device; they contain only tool identifiers, never file contents.
          </p>
          <h2 className="text-lg font-semibold text-foreground pt-2">Sensitive inputs</h2>
          <p className="text-muted-foreground">
            Generated passwords and sensitive QR payloads (such as Wi-Fi credentials) are never
            persisted, logged, included in share links, or sent to analytics. They exist only in
            your current session.
          </p>
          <h2 className="text-lg font-semibold text-foreground pt-2">Analytics</h2>
          <p className="text-muted-foreground">
            If analytics is configured, it records only tool IDs, success/failure categories, and
            coarse timing — never document content, entered text, filenames, or personal data.
          </p>
          <h2 className="text-lg font-semibold text-foreground pt-2">No accounts required</h2>
          <p className="text-muted-foreground">
            You can use every ready tool without registering or providing an email. We don't collect
            personal information to use the core tools.
          </p>
        </div>
      </div>
    </div>
  );
}
