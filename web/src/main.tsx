import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/error-boundary";
import { DataSourceProvider } from "./data/data-source-context";
import { router } from "./router";
import "./styles/tokens.css";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("缺少应用挂载节点");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <DataSourceProvider>
        <RouterProvider router={router} />
      </DataSourceProvider>
    </ErrorBoundary>
  </StrictMode>,
);
