import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — C Wow" },
      {
        name: "description",
        content:
          "Get in touch with Colossal Web Services about C Wow, partnerships, or custom web, app, and automation projects.",
      },
      { property: "og:title", content: "Contact — C Wow" },
      { property: "og:description", content: "Contact Colossal Web Services." },
    ],
  }),
  component: ContactPage,
});

const TRACKING_ID = "tk_e2932199a59045d7bd10e0067561b305";
const LOCATION_ID = "t0v85dVxP6g97UxOonyR";
const PROJECT_ID = "1791088165051573188";

function ContactPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email || !message) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const trackingPayload = {
        type: "external form_submission",
        timestamp: Date.now(),
        formId: "contact-form",
        formData: {
          first_name: firstName,
          last_name: lastName,
          email,
          calendar_notes: message,
        },
        formLabels: {
          first_name: "First name",
          last_name: "Last name",
          email: "Email",
          calendar_notes: "Message",
        },
        url: typeof window !== "undefined" ? window.location.href : "",
        title: typeof document !== "undefined" ? document.title : "",
        path: typeof window !== "undefined" ? window.location.pathname : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        trackingId: TRACKING_ID,
        locationId: LOCATION_ID,
        projectId: PROJECT_ID,
        sessionId: crypto.randomUUID(),
        properties: {
          deviceType:
            typeof navigator !== "undefined" && /Mobile|Android|iPhone/i.test(navigator.userAgent)
              ? "mobile"
              : "desktop",
          source: "ai_studio",
          projectId: PROJECT_ID,
          formName: "Contact Form",
        },
      };
      await fetch("https://backend.leadconnectorhq.com/external-tracking/events", {
        method: "POST",
        headers: { version: "2021-07-28" },
        body: (() => {
          const fd = new FormData();
          fd.append("event", JSON.stringify(trackingPayload));
          return fd;
        })(),
      });
      setStatus("done");
    } catch (e) {
      setError("Something went wrong sending your message. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-cat-business/15">
          <Check className="size-8 text-cat-business" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Message sent</h1>
        <p className="mt-2 text-muted-foreground">
          Thanks for reaching out. We'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Contact us</h1>
      <p className="mt-2 text-muted-foreground">
        Need a website, app, or automation? Meet Colossal Web Services. Send us a note — we won't
        use your details for anything other than replying.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-muted-foreground">
            First name
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
            />
          </label>
          <label className="block text-sm text-muted-foreground">
            Last name
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
            />
          </label>
        </div>
        <label className="block text-sm text-muted-foreground">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring"
          />
        </label>
        <label className="block text-sm text-muted-foreground">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-ring resize-y"
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors focus-ring"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send message"
          )}
        </button>
      </form>
    </div>
  );
}
