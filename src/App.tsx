import { useState } from "react";
import MainPage from "./main";
import HistoryPage from "./History";
import PlanPage from "./Plan";

export default function App() {
  const [page, setPage] = useState<"main" | "history" | "plan" | "stats">("main");

  return (
    <div style={{ paddingBottom: "80px" }}>
      {page === "main" && <MainPage />}
      {page === "history" && <HistoryPage />}
      {page === "plan" && <PlanPage />}
      {page === "stats" && <div>Stats page coming soon</div>}

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
          background: "#111",
          color: "white",
          borderTop: "1px solid #333"
        }}
      >
        <button onClick={() => setPage("main")}>Workout</button>
        <button onClick={() => setPage("history")}>History</button>
        <button onClick={() => setPage("plan")}>Plan</button>
        <button onClick={() => setPage("stats")}>Stats</button>
      </nav>
    </div>
  );
}