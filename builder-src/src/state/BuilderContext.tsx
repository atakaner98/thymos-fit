import { createContext, useContext, type ReactNode } from "react";
import { useTemplatesStore } from "./templatesStore";

type BuilderStore = ReturnType<typeof useTemplatesStore>;

const BuilderContext = createContext<BuilderStore | null>(null);

export function BuilderProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const store = useTemplatesStore(userId);
  return (
    <BuilderContext.Provider value={store}>{children}</BuilderContext.Provider>
  );
}

export function useBuilder(): BuilderStore {
  const store = useContext(BuilderContext);
  if (!store) {
    throw new Error("useBuilder must be used inside BuilderProvider");
  }
  return store;
}
