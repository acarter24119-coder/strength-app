import type { SetLog } from "./types";
function calcOneRm(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}
import "./App.css";

type Props = {
  history: SetLog[];
  onDeleteSet: (id: number) => void;
  onExportCSV: () => void;
  onBack: () => void;
};

export default function HistoryPage({
  history,
  onDeleteSet,
  onExportCSV,
  onBack,
}: Props) {
  // --- Group by exercise ---
  const groupedByExercise = history.reduce<Record<string, SetLog[]>>(
    (acc, curr) => {
      if (!acc[curr.exercise]) acc[curr.exercise] = [];
      acc[curr.exercise].push(curr);
      return acc;
    },
    {}
  );

  // --- Weekly Volume ---
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyVolume = history
    .filter((s) => new Date(s.date) >= sevenDaysAgo)
    .reduce<
      Record<string, { sets: number; reps: number; volume: number }>
    >((acc, curr) => {
      if (!acc[curr.exercise]) {
        acc[curr.exercise] = { sets: 0, reps: 0, volume: 0 };
      }
      acc[curr.exercise].sets += 1;
      acc[curr.exercise].reps += curr.reps;
      acc[curr.exercise].volume += curr.weight * curr.reps;
      return acc;
    }, {});

  // --- Best 1RM per exercise ---
  const bestOneRmByExercise: Record<string, number> = {};
  Object.keys(groupedByExercise).forEach((ex) => {
    const best = groupedByExercise[ex].reduce((max, s) => {
      const est = calcOneRm(s.weight, s.reps);
      return est > max ? est : max;
    }, 0);
    bestOneRmByExercise[ex] = best;
  });

  return (
    <div className="container">
      <h1>History</h1>

      <button onClick={onBack} style={{ marginBottom: 20 }}>
        ← Back to Workout
      </button>

      <button onClick={onExportCSV} style={{ marginBottom: 20 }}>
        Export CSV
      </button>

      <hr />

      {/* WEEKLY VOLUME */}
      <h2>Weekly Volume (last 7 days)</h2>
      {Object.keys(weeklyVolume).length === 0 && (
        <div>No sets logged in the last 7 days yet.</div>
      )}
      {Object.entries(weeklyVolume).map(([ex, stats]) => (
        <div key={ex} style={{ marginBottom: 10 }}>
          <strong>{ex}</strong>
          <div>Sets: {stats.sets}</div>
          <div>Total reps: {stats.reps}</div>
          <div>Total volume: {stats.volume.toFixed(1)} kg</div>
        </div>
      ))}

      <hr />

      {/* HISTORY BY EXERCISE */}
      <h2>History by Exercise (with best 1RM)</h2>
      {Object.keys(groupedByExercise).map((ex) => (
        <div key={ex} style={{ marginBottom: 20 }}>
          <h3>
            {ex} — Best est. 1RM:{" "}
            {bestOneRmByExercise[ex]
              ? `${bestOneRmByExercise[ex].toFixed(1)} kg`
              : "N/A"}
          </h3>

          {groupedByExercise[ex].map((s) => {
            const est1Rm = calcOneRm(s.weight, s.reps);
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {s.date.slice(0, 10)} — Workout {s.workout} — {s.reps} reps —{" "}
                  {s.weight} kg{" "}
                  {est1Rm ? `— est. 1RM: ${est1Rm.toFixed(1)} kg` : ""}
                </span>

                <span
                  style={{
                    color: "red",
                    marginLeft: 10,
                    cursor: "pointer",
                  }}
                  onClick={() => onDeleteSet(s.id!)}
                >
                  ❌
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}