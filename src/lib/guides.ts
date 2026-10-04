// Guides registry — substantive, original guides that link to real tools.
import type { CategoryId } from "./registry";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  sections: { heading: string; body: string; toolSlugs?: string[] }[];
}

export const guides: Guide[] = [
  {
    slug: "prepare-images-for-web",
    title: "How to prepare images for the web",
    description:
      "Resize, compress, and convert images so they load fast and look sharp on any site.",
    category: "image",
    sections: [
      {
        heading: "Why image optimization matters",
        body: "Large images slow down pages and hurt both user experience and search rankings. Preparing images means getting the right dimensions, an efficient format, and the smallest file size that still looks good.",
      },
      {
        heading: "Step 1: Resize to the display size",
        body: "Don't ship a 4000px photo for a 400px thumbnail. Resize images to the largest size they'll actually be displayed at (or a bit larger for retina screens).",
        toolSlugs: ["image-resize"],
      },
      {
        heading: "Step 2: Compress to reduce file size",
        body: "Compression removes data your eye barely notices. For photos, JPEG or WebP at 70–80% quality is a good starting point. Compare the result to the original — if it looks fine, you've saved bandwidth.",
        toolSlugs: ["image-compress"],
      },
      {
        heading: "Step 3: Convert to a modern format",
        body: "WebP is widely supported and usually smaller than JPEG or PNG for the same quality. Convert your images to WebP for the best balance of size and compatibility.",
        toolSlugs: ["image-convert"],
      },
      {
        heading: "Step 4: Batch the whole set",
        body: "If you have many images, use batch processing and download all results as a ZIP. The Website Image Pack workflow chains these steps together.",
        toolSlugs: ["image-resize", "image-compress", "image-convert"],
      },
    ],
  },
  {
    slug: "merge-and-organize-pdfs",
    title: "How to merge and organize PDFs",
    description: "Combine multiple PDFs, reorder pages, and produce a single clean document.",
    category: "pdf",
    sections: [
      {
        heading: "When to merge PDFs",
        body: "Combining scanned pages, receipts, or contracts into one file makes them easier to share and archive. You keep everything in one document with consistent page order.",
      },
      {
        heading: "Step 1: Merge your files",
        body: "Add your PDFs in the order you want them. The merge tool combines them into a single document, preserving each file's pages in sequence.",
        toolSlugs: ["pdf-merge"],
      },
      {
        heading: "Step 2: Rotate pages if needed",
        body: "If some pages are sideways, rotate them to the correct orientation before finalizing.",
        toolSlugs: ["pdf-rotate"],
      },
      {
        heading: "Step 3: Split out what you don't need",
        body: "If your merged file has pages you want to remove, split it by page ranges and keep only the sections you need.",
        toolSlugs: ["pdf-split"],
      },
      {
        heading: "Use the Document Packet workflow",
        body: "The Document Packet workflow chains merge and rotate so you can produce an organized packet in one go.",
        toolSlugs: ["pdf-merge", "pdf-rotate"],
      },
    ],
  },
  {
    slug: "clean-and-export-spreadsheets",
    title: "How to clean and export a spreadsheet",
    description: "Remove duplicates, trim messy values, and convert between CSV and Excel formats.",
    category: "file-data",
    sections: [
      {
        heading: "Common spreadsheet problems",
        body: "Exported data often has trailing spaces, duplicate rows, and inconsistent formatting. Cleaning it before analysis saves time and prevents errors.",
      },
      {
        heading: "Step 1: Clean the data",
        body: "Remove duplicate rows and trim whitespace from every field. This catches copy-paste errors and repeated entries.",
        toolSlugs: ["csv-clean"],
      },
      {
        heading: "Step 2: Convert to the format you need",
        body: "CSV is universal but loses formatting. Excel (XLSX) preserves columns and is easier to share. Convert based on where the data is going.",
        toolSlugs: ["csv-to-xlsx", "xlsx-to-csv"],
      },
      {
        heading: "Step 3: Convert to JSON for apps",
        body: "If you're feeding data into an app or API, JSON is the right format. Convert your cleaned CSV to JSON with one step.",
        toolSlugs: ["csv-to-json"],
      },
      {
        heading: "Use the Clean Spreadsheet workflow",
        body: "The Clean Spreadsheet workflow chains cleaning and Excel export so you go from raw CSV to a polished XLSX in one run.",
        toolSlugs: ["csv-clean", "csv-to-xlsx"],
      },
    ],
  },
];

export const guideMap = Object.fromEntries(guides.map((g) => [g.slug, g]));
