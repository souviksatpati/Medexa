import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/App";
import { initSyncEngine } from "@/sync/syncEngine";
import { seedDemoData } from "./sync/seedDemoData";

seedDemoData().catch((error) => {
  console.error("Failed to seed demo data:", error);
});

initSyncEngine();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);