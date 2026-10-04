import { Cloud, Settings } from "lucide-react";
import type { ToolDefinition } from "../../lib/tools";

export function IntegrationRequired({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <Cloud className="h-5 w-5 text-amber-500" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            This tool needs a connected service
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tool.name} requires an online provider to process your input. It's listed here for
            completeness but is not active until the service is configured.
          </p>
          {tool.integration && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
              <Settings className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Required integration:</span>{" "}
                {tool.integration}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
