// /api-docs — Swagger UI for the LTSD REST API
// Spec is read server-side from docs/openapi.yaml and passed as a prop.
// No /api/openapi route needed.

import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { SwaggerUIClient } from "./swagger-ui";

export const metadata = {
  title: "LTSD API Docs",
  description: "Interactive REST API documentation for LTSD.",
};

export default function ApiDocsPage() {
  const raw  = readFileSync(join(process.cwd(), "docs", "openapi.yaml"), "utf-8");
  const spec = parse(raw) as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header bar */}
      <div
        className="w-full px-6 py-3 flex items-center gap-3 border-b border-[#E5E7EB]"
        style={{ background: "#000A1E" }}
      >
        <span
          className="text-white font-bold text-lg tracking-tight"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          LTSD
        </span>
        <span className="text-[rgba(255,255,255,0.4)] text-sm">|</span>
        <span
          className="text-[rgba(255,255,255,0.7)] text-sm"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          API Documentation
        </span>
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#FE9800] text-white font-semibold">
          v1.0
        </span>
      </div>

      <SwaggerUIClient spec={spec} />
    </div>
  );
}
