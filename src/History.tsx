import type { SetLog } from "./types";
import "./App.css";

function calcOneRm(weight: number = 0, reps: number = 0): number {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

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

  /* ---------------------------------------------------------
     GROUP BY EXERCISE
  --------------------------------------------------------- */
  const groupedByExercise = history.reduce<Record<string, SetLog[]>>(
    (acc, curr) => {
      if (!acc[curr.exercise]) acc[curr.exercise] = [];
      acc[curr.exercise].push(curr);
      return acc;
    },
    {}
  );

  /* ---------------------------------------------------------
     WEEKLY VOLUME (strength only)
  --------------------------------------------------------- */
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

      // Strength only
      if (curr.type === "strength") {
        acc[curr.exercise].reps += curr.reps || 0;
        acc[curr.exercise].volume += (curr.weight || 0) * (curr.reps || 0);
      }

      return acc;
    }, {});

  /* ---------------------------------------------------------
     BEST 1RM (strength only)
  --------------------------------------------------------- */
  const bestOneRmByExercise: Record<string, number> = {};

  Object.keys(groupedByExercise).forEach((ex) => {
    const best = groupedByExercise[ex].reduce((max, s) => {
      if (s.type !== "strength") return max;
      const est = calcOneRm(s.weight, s.reps);
      return est > max ? est : max;
    }, 0);

    bestOneRmByExercise[ex] = best;
  });

  /* ---------------------------------------------------------
     FORMAT SET DETAILS
  --------------------------------------------------------- */
  const formatSetDetails = (s: SetLog) => {
    if (s.type === "strength") {
      return `${s.weight} kg × ${s.reps} reps`;
    }

    if (s.type === "carry") {
      const parts = [];
      if (s.weight) parts.push(`${s.weight} kg`);
      if (s.distance) parts.push(`${s.distance} m`);
      if (s.time) parts.push(`${s.time} s`);
      return parts.join(" | ");
    }

    if (s.type === "hold") {
      const parts = [];
      if (s.weight) parts.push(`${s.weight} kg`);
      if (s.time) parts.push(`${s.time} s`);
      return parts.join(" | ");
    }

    return "";
  };

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
          <div>Total reps (strength only): {stats.reps}</div>
          <div>Total volume (strength only): {stats.volume.toFixed(1)} kg</div>
        </div>
      ))}

      <hr />

      {/* HISTORY BY EXERCISE */}
      <h2>History by Exercise</h2>

      {Object.keys(groupedByExercise).map((ex) => (
        <div key={ex} style={{ marginBottom: 20 }}>
          <h3>
            {ex} —{" "}
            {bestOneRmByExercise[ex]
              ? `Best est. 1RM: ${bestOneRmByExercise[ex].toFixed(1)} kg`
              : "No 1RM (not a strength lift)"}
          </h3>

          {groupedByExercise[ex].map((s) => {
            const details = formatSetDetails(s);
            const est1Rm =
              s.type === "strength" ? calcOneRm(s.weight, s.reps) : 0;

            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span>
                  {s.date.slice(0, 10)} — Workout {s.workout} — {details}
                  {est1Rm
                    ? ` — est. 1RM: ${est1Rm.toFixed(1)} kg`
                    : ""}
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