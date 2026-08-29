import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
} from "../../shared/data-contract";
import { HttpLearningIndexAdapter } from "./http-learning-index-adapter";

interface DataSourceContextValue {
  status: LearningIndexAvailability | null;
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({
  children,
  adapter,
}: {
  children: ReactNode;
  adapter?: LearningIndexAdapter;
}) {
  const source = useMemo(
    () => adapter ?? new HttpLearningIndexAdapter(),
    [adapter],
  );
  const [status, setStatus] = useState<LearningIndexAvailability | null>(null);

  useEffect(() => {
    let active = true;
    source
      .describe()
      .then((nextStatus) => {
        if (active) setStatus(nextStatus);
      })
      .catch(() => {
        if (active)
          setStatus({ availability: "unavailable", reason: "unreachable" });
      });
    return () => {
      active = false;
    };
  }, [source]);

  return (
    <DataSourceContext.Provider value={{ status }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSourceStatus(): DataSourceContextValue {
  const context = useContext(DataSourceContext);
  if (!context)
    throw new Error("useDataSourceStatus 必须在 DataSourceProvider 内使用");
  return context;
}
