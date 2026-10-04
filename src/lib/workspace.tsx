// Session workspace store — in-memory only, never persists file contents.
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface WorkspaceItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  url: string;
  sourceTool: string;
  createdAt: number;
  meta?: Record<string, string | number>;
}

// A result handed off to another tool so its input can be auto-populated
// without a re-upload. Held in memory only; cleared on consume or refresh.
export interface PendingToolInput {
  blob: Blob;
  name: string;
  mime: string;
  targetToolId: string;
}

interface WorkspaceContextValue {
  items: WorkspaceItem[];
  add: (item: Omit<WorkspaceItem, "id" | "url" | "createdAt">) => WorkspaceItem;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  // Stage a result blob as the input for another tool. The target tool's
  // FileDropzone consumes it on mount via consumePendingInput.
  sendToTool: (input: PendingToolInput) => void;
  consumePendingInput: (toolId: string) => PendingToolInput | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

let idCounter = 0;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  // Ref (not state) so consume reads synchronously without a re-render.
  const pendingRef = useRef<PendingToolInput | null>(null);

  const add = useCallback((item: Omit<WorkspaceItem, "id" | "url" | "createdAt">) => {
    const id = `ws-${Date.now()}-${idCounter++}`;
    const url = URL.createObjectURL(item.blob);
    const full: WorkspaceItem = { ...item, id, url, createdAt: Date.now() };
    setItems((prev) => [full, ...prev].slice(0, 20));
    return full;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url));
      return [];
    });
  }, []);

  const sendToTool = useCallback((input: PendingToolInput) => {
    pendingRef.current = input;
  }, []);

  const consumePendingInput = useCallback((toolId: string): PendingToolInput | null => {
    const p = pendingRef.current;
    if (p && p.targetToolId === toolId) {
      pendingRef.current = null;
      return p;
    }
    return null;
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ items, add, remove, clear, count: items.length, sendToTool, consumePendingInput }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
