// Connected workflow presets — local-only ones are active.
import type { CategoryId } from "./registry";

export interface WorkflowStep {
  toolSlug: string;
  label: string;
}

export interface Workflow {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  steps: WorkflowStep[];
  available: boolean;
  unavailableReason?: string;
  resultDescription: string;
}

export const workflows: Workflow[] = [
  {
    slug: "website-image-pack",
    name: "Website Image Pack",
    description:
      "Prepare a set of images for the web: crop, resize, compress, and convert, then ZIP them.",
    category: "image",
    available: true,
    resultDescription: "A ZIP of optimized web-ready images.",
    steps: [
      { toolSlug: "image-crop", label: "Crop / fit" },
      { toolSlug: "image-resize", label: "Resize" },
      { toolSlug: "image-compress", label: "Compress" },
      { toolSlug: "image-convert", label: "Convert to WebP" },
      { toolSlug: "zip-create", label: "Bundle as ZIP" },
    ],
  },
  {
    slug: "document-packet",
    name: "Document Packet",
    description: "Merge PDFs, reorder pages, and export a single organized packet.",
    category: "pdf",
    available: true,
    resultDescription: "A single merged, ordered PDF.",
    steps: [
      { toolSlug: "pdf-merge", label: "Merge PDFs" },
      { toolSlug: "pdf-rotate", label: "Rotate pages" },
    ],
  },
  {
    slug: "clean-spreadsheet",
    name: "Clean Spreadsheet",
    description: "Preview a CSV, trim values, remove duplicates, reorder columns, and export XLSX.",
    category: "file-data",
    available: true,
    resultDescription: "A cleaned XLSX spreadsheet.",
    steps: [
      { toolSlug: "csv-clean", label: "Clean & dedupe" },
      { toolSlug: "csv-to-xlsx", label: "Export to Excel" },
    ],
  },
  {
    slug: "social-image-pack",
    name: "Social Image Pack",
    description: "Resize one image to multiple social aspect ratios and export a labeled ZIP.",
    category: "image",
    available: true,
    resultDescription: "A ZIP with images sized for each social platform.",
    steps: [
      { toolSlug: "image-resize", label: "Resize to ratios" },
      { toolSlug: "zip-create", label: "Bundle as ZIP" },
    ],
  },
  {
    slug: "product-photo-pack",
    name: "Product Photo Pack",
    description: "Remove background, fit/pad, resize, and export product photos.",
    category: "ai-image",
    available: false,
    unavailableReason: "Requires the background removal AI engine to be connected.",
    resultDescription: "A ZIP of product photos with transparent backgrounds.",
    steps: [
      { toolSlug: "ai-bg-remove", label: "Remove background" },
      { toolSlug: "image-resize", label: "Fit & resize" },
      { toolSlug: "zip-create", label: "Bundle as ZIP" },
    ],
  },
  {
    slug: "content-kit",
    name: "Content Kit",
    description: "Turn notes into a brief, an email, an SMS, and social captions.",
    category: "ai-write",
    available: false,
    unavailableReason: "Requires an AI writing provider to be connected.",
    resultDescription: "A set of ready-to-use content drafts.",
    steps: [
      { toolSlug: "ai-summarize", label: "Draft brief" },
      { toolSlug: "ai-rewrite", label: "Draft email" },
      { toolSlug: "ai-rewrite", label: "Draft SMS & captions" },
    ],
  },
];

export const workflowMap = Object.fromEntries(workflows.map((w) => [w.slug, w]));
export const availableWorkflows = workflows.filter((w) => w.available);
