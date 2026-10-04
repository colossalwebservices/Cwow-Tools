import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface WorkspaceItem {
  id: string;
  name: string;
  mime: string;
  blob: Blob;
  url: string;
  sourceToolId?: string;
  sourceToolName?: string;
  createdAt: number;
  preview?: string;
}

interface WorkspaceContextValue {
  items: WorkspaceItem[];
  count: number;
  addItem: (item: Omit<WorkspaceItem, "id" | "url" | "createdAt">) => string;
  removeItem: (id: string) => void;
  clear: () => void;
  renameItem: (id: string, name: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `ws-${Date.now()}-${idCounter}`;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const urlsRef = useRef<Map<string, string>>(new Map());

  const addItem = useCallback((item: Omit<WorkspaceItem, "id" | "url" | "createdAt">) => {
    const id = nextId();
    const url = URL.createObjectURL(item.blob);
    urlsRef.current.set(id, url);
    setItems((prev) => [{ ...item, id, url, createdAt: Date.now() }, ...prev]);
    return id;
  }, []);

  const removeItem = useCallback((id: string) => {
    const url = urlsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(id);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    for (const url of urlsRef.current.values()) URL.revokeObjectURL(url);
    urlsRef.current.clear();
    setItems([]);
  }, []);

  const renameItem = useCallback((id: string, name: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)));
  }, []);

  // Cleanup all object URLs on unmount
  useMemo(() => {
    return () => {
      for (const url of urlsRef.current.values()) URL.revokeObjectURL(url);
    };
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({ items, count: items.length, addItem, removeItem, clear, renameItem }),
    [items, addItem, removeItem, clear, renameItem],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
