import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "All Tools — C Wow" },
      {
        name: "description",
        content:
          "Browse the full directory of C Wow tools — convert files, edit images, clean data, generate content, and more.",
      },
      { property: "og:title", content: "All Tools — C Wow" },
      { property: "og:description", content: "Browse the full directory of C Wow tools." },
    ],
    links: [{ rel: "canonical", href: "https://cwow.app/tools" }],
  }),
  component: ToolsLayout,
});

function ToolsLayout() {
  return <Outlet />;
}
