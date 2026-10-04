import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Guides — C Wow" },
      {
        name: "description",
        content:
          "Practical guides for common tasks: preparing web images, merging PDFs, cleaning spreadsheets, and more — with links to the tools.",
      },
      { property: "og:title", content: "Guides — C Wow" },
      {
        property: "og:description",
        content: "Practical guides for common tasks with links to C Wow tools.",
      },
    ],
  }),
  component: GuidesLayout,
});

function GuidesLayout() {
  return <Outlet />;
}
