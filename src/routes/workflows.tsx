import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workflows")({
  head: () => ({
    meta: [
      { title: "Workflows — C Wow" },
      {
        name: "description",
        content:
          "Connected workflows chain compatible tools together — resize and compress images, organize a PDF packet, or clean a spreadsheet in one run.",
      },
      { property: "og:title", content: "Workflows — C Wow" },
      {
        property: "og:description",
        content: "Chain compatible C Wow tools into connected workflows.",
      },
    ],
  }),
  component: WorkflowsLayout,
});

function WorkflowsLayout() {
  return <Outlet />;
}
