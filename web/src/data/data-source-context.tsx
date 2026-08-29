import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  LearningIndexAdapter,
  LearningIndexAvailability,
  TodayWorkspaceSnapshot,
} from "../../shared/data-contract";
import { HttpLearningIndexAdapter } from "./http-learning-index-adapter";

interface DataSourceContextValue {
  status: LearningIndexAvailability | null;
  today: TodayWorkspaceSnapshot | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
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
  const [today, setToday] = useState<TodayWorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all([source.describe(), source.getToday()])
      .then(([nextStatus, nextToday]) => {
        if (!active) return;
        setStatus(nextStatus);
        setToday(nextToday);
      })
      .catch(() => {
        if (!active) return;
        setStatus({ availability: "unavailable", reason: "unreachable" });
        setToday(null);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [source, refreshToken]);

  return (
    <DataSourceContext.Provider
      value={{ status, today, loading, error, refresh }}
    >
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
