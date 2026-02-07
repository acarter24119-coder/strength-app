import { useEffect, useRef, useState } from "react";
import type { SetLog, WorkoutKey, ExerciseType } from "./types";
import { saveAs } from "file-saver";
import { db } from "./db";
import HistoryPage from "./History";
import "./App.css";

const workouts: Record<WorkoutKey, string[]> = {
  A: [],
  B: [],
  C: [],
  D: [],
  E: []
};

function getNextWorkout(): WorkoutKey {
  return (localStorage.getItem("nextWorkout") as WorkoutKey) || "A";
}

function setNextWorkout(key: WorkoutKey) {
  localStorage.setItem("nextWorkout", key);
}

function rotateWorkout(current: WorkoutKey): WorkoutKey {
  const order: WorkoutKey[] = ["A", "B", "C", "D", "E"];
  const index = order.indexOf(current);
  const next = order[(index + 1) % order.length];
  setNextWorkout(next);
  return next;
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function formatTodayDate() {
  const d = new Date();
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function calcOneRm(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

/* ---------------------------------------------------------
   PLAN PAGE
--------------------------------------------------------- */
function PlanPage({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");

  useEffect(() => {
    db.table("plan")
      .get(1)
      .then((entry: any) => {
        if (entry?.text) setText(entry.text);
      });
  }, []);

  useEffect(() => {
    db.table("plan").put({ id: 1, text });
  }, [text]);

  return (
    <div className="container" style={{ padding: "1rem" }}>
      <h2>Training Plan</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your strongman plan here..."
        rows={20}
        style={{ width: "100%", fontSize: "1rem" }}
      />

      <button
        className="secondary"
        style={{ marginTop: "1rem", width: "100%" }}
        onClick={onBack}
      >
        Back
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   ADD EXERCISE MODAL
--------------------------------------------------------- */
function AddExerciseModal({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (name: string, type: ExerciseType) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ExerciseType | null>(null);

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Exercise</h2>

        <input
          placeholder="Exercise name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            className={type === "strength" ? "active-type" : ""}
            onClick={() => setType("strength")}
            style={{ flex: 1 }}
          >
            Strength
          </button>

          <button
            className={type === "carry" ? "active-type" : ""}
            onClick={() => setType("carry")}
            style={{ flex: 1 }}
          >
            Carry
          </button>

          <button
            className={type === "hold" ? "active-type" : ""}
            onClick={() => setType("hold")}
            style={{ flex: 1 }}
          >
            Hold
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>

          <button
            style={{ flex: 1 }}
            disabled={!name || !type}
            onClick={() => {
              if (name && type) onSave(name, type);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   STATS PAGE
--------------------------------------------------------- */
function StatsPage({ history,  }: { history: SetLog[]; onBack: () => void }) {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);

  const recent = history.filter((s) => {
    const d = new Date(s.date);
    return d >= sevenDaysAgo && d <= today;
  });

  const totals = recent.reduce(
    (acc, curr) => {
      acc.sets += 1;
      const vol = (curr.weight || 0) * (curr.reps || 0);
      acc.volume += vol;
      return acc;
    },
    { sets: 0, volume: 0 }
  );

  return (
    <div className="container">
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#f7f7f9",
          paddingBottom: 8,
          marginBottom: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
        }}
      >
        <h1>Stats</h1>
        <div style={{ opacity: 0.7, fontSize: 14 }}>Last 7 days</div>
        <div
          style={{
            marginTop: 10,
            borderBottom: "1px solid #e5e5ea"
          }}
        />
      </div>

      <div className="card fade-in">
        <h2>Overview</h2>
        <div>
          <strong>Total sets:</strong> {totals.sets}
        </div>
        <div>
          <strong>Total volume:</strong> {totals.volume.toFixed(1)} kg
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function App() {
  const [workoutKey, setWorkoutKey] = useState<WorkoutKey>("A");
  const [todaysExercises, setTodaysExercises] = useState<string[]>([]);
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [distance, setDistance] = useState("");
  const [timeSeconds, setTimeSeconds] = useState("");
  const [setNumber, setSetNumber] = useState(1);
  const [history, setHistory] = useState<SetLog[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const [page, setPage] = useState<"main" | "history" | "plan" | "stats">("main");

  const [customExercises, setCustomExercises] = useState<
    Record<WorkoutKey, { name: string; type: ExerciseType }[]>
  >(() => JSON.parse(localStorage.getItem("customExercises") || "{}"));

  const lastSetRef = useRef<HTMLDivElement | null>(null);

  // Add Exercise Modal State
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  // Rest timer
  const [restActive, setRestActive] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);

  const saveCustomExercises = (
    data: Record<WorkoutKey, { name: string; type: ExerciseType }[]>
  ) => {
    setCustomExercises(data);
    localStorage.setItem("customExercises", JSON.stringify(data));
  };

  useEffect(() => {
    const key = getNextWorkout();
    setWorkoutKey(key);
    setTodaysExercises([
      ...workouts[key],
      ...(customExercises[key]?.map((e) => e.name) || [])
    ]);
    loadHistory();
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    if (restActive && restRemaining > 0) {
      timer = window.setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            setRestActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [restActive, restRemaining]);

  const loadHistory = async () => {
    const data = await db.sets.toArray();
    setHistory(data);
  };

  const deleteSet = async (id: number | undefined) => {
    if (typeof id !== "number") return;
    await db.sets.delete(id);
    await loadHistory();
  };

  const getExerciseType = (exerciseName: string): ExerciseType => {
    const list = customExercises[workoutKey] || [];
    const found = list.find((e) => e.name === exerciseName);
    if (found) return found.type;
    return "strength";
  };

  const getLastSetForExercise = (exerciseName: string) => {
    const filtered = history
      .filter((s) => s.exercise === exerciseName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return filtered[0] || null;
  };

  const getNextWeight = (last: SetLog | null) => {
    if (!last || !last.weight || !last.reps) return "";
    return last.reps >= 8 ? String(last.weight + 2.5) : String(last.weight);
  };

  const getTodaySetCountForExercise = (exerciseName: string) => {
    const today = getTodayISODate();
    return history.filter(
      (s) => s.exercise === exerciseName && s.date.slice(0, 10) === today
    ).length;
  };

  const selectExercise = (name: string) => {
    setExercise(name);
    const last = getLastSetForExercise(name);
    const type = getExerciseType(name);

    if (type === "strength") {
      if (last) {
        setWeight(getNextWeight(last));
        setReps(String(last.reps || ""));
      } else {
        setWeight("");
        setReps("");
      }
      setDistance("");
      setTimeSeconds("");
    } else if (type === "carry") {
      if (last) {
        setWeight(String(last.weight || ""));
        setDistance(String(last.distance || ""));
        setTimeSeconds(String(last.time || ""));
      } else {
        setWeight("");
        setDistance("");
        setTimeSeconds("");
      }
      setReps("");
    } else if (type === "hold") {
      if (last) {
        setWeight(String(last.weight || ""));
        setTimeSeconds(String(last.time || ""));
      } else {
        setWeight("");
        setTimeSeconds("");
      }
      setReps("");
      setDistance("");
    }

    setSetNumber(getTodaySetCountForExercise(name) + 1);
  };

  const repeatLastSetForExercise = (exerciseName: string) => {
    const last = getLastSetForExercise(exerciseName);
    if (!last) return;
    setExercise(exerciseName);
    const type = last.type || getExerciseType(exerciseName);

    if (type === "strength") {
      setWeight(String(last.weight || ""));
      setReps(String(last.reps || ""));
      setDistance("");
      setTimeSeconds("");
    } else if (type === "carry") {
      setWeight(String(last.weight || ""));
      setDistance(String(last.distance || ""));
      setTimeSeconds(String(last.time || ""));
      setReps("");
    } else if (type === "hold") {
      setWeight(String(last.weight || ""));
      setTimeSeconds(String(last.time || ""));
      setReps("");
      setDistance("");
    }

    setSetNumber(getTodaySetCountForExercise(exerciseName) + 1);
    setTimeout(
      () =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        }),
      50
    );
  };

  const saveSet = async () => {
    if (!exercise) return;

    const type = getExerciseType(exercise);

    if (type === "strength") {
      if (!weight || !reps) return;
    } else if (type === "carry") {
      if (!weight || (!distance && !timeSeconds)) return;
    } else if (type === "hold") {
      if (!weight || !timeSeconds) return;
    }

    const payload: SetLog = {
      workout: workoutKey,
      exercise,
      type,
      date: new Date().toISOString()
    };

    if (type === "strength") {
      payload.weight = Number(weight);
      payload.reps = Number(reps);
    } else if (type === "carry") {
      if (weight) payload.weight = Number(weight);
      if (distance) payload.distance = Number(distance);
      if (timeSeconds) payload.time = Number(timeSeconds);
    } else if (type === "hold") {
      if (weight) payload.weight = Number(weight);
      if (timeSeconds) payload.time = Number(timeSeconds);
    }

    await db.sets.add(payload);
    await loadHistory();
    setSetNumber(getTodaySetCountForExercise(exercise) + 1);

    setTimeout(() => {
      if (lastSetRef.current) {
        const rect = lastSetRef.current.getBoundingClientRect();
        const absoluteY = rect.top + window.scrollY;
        window.scrollTo({
          top: absoluteY - 80,
          behavior: "smooth"
        });
      } else {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 50);
  };

  const goToNextWorkout = () => {
    const next = rotateWorkout(workoutKey);
    setWorkoutKey(next);
    setTodaysExercises([
      ...workouts[next],
      ...(customExercises[next]?.map((e) => e.name) || [])
    ]);
    setExercise("");
    setWeight("");
    setReps("");
    setDistance("");
    setTimeSeconds("");
    setSetNumber(1);
  };

  const exportCSV = () => {
    const header = "Workout,Exercise,Type,Weight (kg),Reps,Distance (m),Time (s),Date\n";
    const rows = history
      .map((s) => {
        return `${s.workout},${s.exercise},${s.type || ""},${s.weight || ""},${
          s.reps || ""
        },${s.distance || ""},${s.time || ""},${s.date}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;"
    });
    saveAs(blob, "Strength-History.csv");
  };

  const todaysSets = history.filter(
    (s) => s.date.slice(0, 10) === getTodayISODate()
  );

  const todaysTotals = todaysSets.reduce(
    (acc, curr) => {
      acc.sets += 1;
      const vol = (curr.weight || 0) * (curr.reps || 0);
      acc.reps += curr.reps || 0;
      acc.volume += vol;
      return acc;
    },
    { sets: 0, reps: 0, volume: 0 }
  );

  const todaysByExercise = todaysSets.reduce<Record<string, SetLog[]>>(
    (acc, curr) => {
      if (!acc[curr.exercise]) acc[curr.exercise] = [];
      acc[curr.exercise].push(curr);
      return acc;
    },
    {}
  );

  const groupedByExercise = history.reduce<Record<string, SetLog[]>>(
    (acc, curr) => {
      if (!acc[curr.exercise]) acc[curr.exercise] = [];
      acc[curr.exercise].push(curr);
      return acc;
    },
    {}
  );

  const bestOneRmByExercise: Record<string, number> = {};

  Object.keys(groupedByExercise).forEach((ex) => {
    const best = groupedByExercise[ex].reduce((max, s) => {
      const est = calcOneRm(s.weight || 0, s.reps || 0);
      return est > max ? est : max;
    }, 0);
    bestOneRmByExercise[ex] = best;
  });

  const prList: string[] = [];

  Object.entries(todaysByExercise).forEach(([ex, sets]) => {
    const todaysBest1Rm = sets.reduce(
      (max, s) => Math.max(max, calcOneRm(s.weight || 0, s.reps || 0)),
      0
    );
    const allTimeBest1Rm = bestOneRmByExercise[ex] || 0;

    if (todaysBest1Rm > allTimeBest1Rm) {
      prList.push(`${ex} — New 1RM PR: ${todaysBest1Rm.toFixed(1)} kg`);
    }
  });

  const handleSaveNewExercise = (name: string, type: ExerciseType) => {
    const updated = {
      ...customExercises,
      [workoutKey]: [
        ...(customExercises[workoutKey] || []),
        { name, type }
      ]
    };

    saveCustomExercises(updated);
    setTodaysExercises([
      ...workouts[workoutKey],
      ...updated[workoutKey].map((e) => e.name)
    ]);

    setShowAddExerciseModal(false);
  };

  const startRestTimer = (seconds: number) => {
    if (!seconds) return;
    setRestRemaining(seconds);
    setRestActive(true);
  };

  const formatRest = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ---------------------------------------------------------
     SUMMARY PAGE
  --------------------------------------------------------- */
  if (showSummary) {
    return (
      <div className="container">
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#f7f7f9",
            paddingBottom: 8,
            marginBottom: 12,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
          }}
        >
          <h1>Workout {workoutKey}</h1>
          <div style={{ opacity: 0.7, fontSize: 14 }}>{formatTodayDate()}</div>
          <div
            style={{
              marginTop: 10,
              borderBottom: "1px solid #e5e5ea"
            }}
          />
        </div>

        <div className="summary-box fade-in">
          {prList.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2>🏆 Personal Records Today</h2>
              {prList.map((pr, idx) => (
                <div key={idx}>{pr}</div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div>
              <strong>Total sets:</strong> {todaysTotals.sets}
            </div>
            <div>
              <strong>Total reps:</strong> {todaysTotals.reps}
            </div>
            <div>
              <strong>Total volume:</strong> {todaysTotals.volume.toFixed(1)} kg
            </div>
          </div>
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 480,
            padding: "10px 16px 16px",
            background: "#f7f7f9",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)"
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="secondary"
              style={{ flex: 1 }}
              onClick={() => setShowSummary(false)}
            >
              Back
            </button>

            <button
              style={{ flex: 1 }}
              onClick={() => {
                setShowSummary(false);
                goToNextWorkout();
              }}
            >
              Next Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     PAGE SWITCHING
  --------------------------------------------------------- */
  if (page === "history") {
    return (
      <>
        {showAddExerciseModal && (
          <AddExerciseModal
            onClose={() => setShowAddExerciseModal(false)}
            onSave={handleSaveNewExercise}
          />
        )}
        <HistoryPage
          history={history}
          onDeleteSet={deleteSet}
          onExportCSV={exportCSV}
          onBack={() => setPage("main")}
        />
      </>
    );
  }

  if (page === "plan") {
    return (
      <>
        {showAddExerciseModal && (
          <AddExerciseModal
            onClose={() => setShowAddExerciseModal(false)}
            onSave={handleSaveNewExercise}
          />
        )}
        <PlanPage onBack={() => setPage("main")} />
      </>
    );
  }

  if (page === "stats") {
    return (
      <>
        {showAddExerciseModal && (
          <AddExerciseModal
            onClose={() => setShowAddExerciseModal(false)}
            onSave={handleSaveNewExercise}
          />
        )}
        <StatsPage history={history} onBack={() => setPage("main")} />
      </>
    );
  }

  /* ---------------------------------------------------------
     MAIN WORKOUT PAGE
  --------------------------------------------------------- */
  return (
    <>
      {showAddExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowAddExerciseModal(false)}
          onSave={handleSaveNewExercise}
        />
      )}

      {page === "main" && (
        <div className="container">
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "#f7f7f9",
              paddingBottom: 8,
              marginBottom: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
            }}
          >
            <h1>Workout {workoutKey}</h1>
            <div style={{ opacity: 0.7, fontSize: 14 }}>{formatTodayDate()}</div>
            <div
              style={{
                marginTop: 10,
                borderBottom: "1px solid #e5e5ea"
              }}
            />
          </div>

          {exercise && (
            <div className="active-exercise fade-in">
              <strong>
                {exercise} — Set {setNumber}
              </strong>
            </div>
          )}

          <div className="card fade-in">
            <h2>Today's Exercises</h2>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {todaysExercises.map((ex) => (
                <li key={ex} className="exercise-item">
                  <span onClick={() => selectExercise(ex)}>{ex}</span>

                  {customExercises[workoutKey]?.some((e) => e.name === ex) && (
                    <span
                      style={{ color: "red" }}
                      onClick={() => {
                        const updated = {
                          ...customExercises,
                          [workoutKey]: customExercises[workoutKey].filter(
                            (x) => x.name !== ex
                          )
                        };
                        saveCustomExercises(updated);
                        setTodaysExercises([
                          ...workouts[workoutKey],
                          ...(updated[workoutKey]?.map((e) => e.name) || [])
                        ]);
                      }}
                    >
                      ❌
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setShowAddExerciseModal(true)}
              >
                + Add Exercise
              </button>

              <button style={{ flex: 1 }} onClick={goToNextWorkout}>
                Next Workout
              </button>
            </div>
          </div>

          <div className="card fade-in">
            <h2>Log a Set</h2>

            <input
              placeholder="Exercise"
              value={exercise}
              onChange={(e) => {
                const name = e.target.value;
                setExercise(name);

                const last = getLastSetForExercise(name);
                const type = getExerciseType(name);

                if (type === "strength") {
                  if (last) {
                    setWeight(getNextWeight(last));
                    setReps(String(last.reps || ""));
                  } else {
                    setWeight("");
                    setReps("");
                  }
                  setDistance("");
                  setTimeSeconds("");
                } else if (type === "carry") {
                  if (last) {
                    setWeight(String(last.weight || ""));
                    setDistance(String(last.distance || ""));
                    setTimeSeconds(String(last.time || ""));
                  } else {
                    setWeight("");
                    setDistance("");
                    setTimeSeconds("");
                  }
                  setReps("");
                } else if (type === "hold") {
                  if (last) {
                    setWeight(String(last.weight || ""));
                    setTimeSeconds(String(last.time || ""));
                  } else {
                    setWeight("");
                    setTimeSeconds("");
                  }
                  setReps("");
                  setDistance("");
                }

                setSetNumber(getTodaySetCountForExercise(name) + 1);
              }}
            />

            {/* Dynamic fields based on exercise type */}
            {(() => {
              const type = getExerciseType(exercise || "");
              if (type === "carry") {
                return (
                  <>
                    <input
                      placeholder="Weight (kg)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <input
                      placeholder="Distance (m)"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                    <input
                      placeholder="Time (s) (optional)"
                      value={timeSeconds}
                      onChange={(e) => setTimeSeconds(e.target.value)}
                    />
                  </>
                );
              }
              if (type === "hold") {
                return (
                  <>
                    <input
                      placeholder="Weight (kg)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <input
                      placeholder="Time (s)"
                      value={timeSeconds}
                      onChange={(e) => setTimeSeconds(e.target.value)}
                    />
                  </>
                );
              }
              // strength default
              return (
                <>
                  <input
                    placeholder="Weight (kg)"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />

                  <input
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                  />
                </>
              );
            })()}

            <button onClick={saveSet} style={{ width: "100%", marginTop: 8 }}>
              Save Set
            </button>

            {/* Optional Rest Timer */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
                Rest timer (optional)
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button
                  className="secondary"
                  style={{ flex: 1 }}
                  onClick={() => startRestTimer(60)}
                >
                  60s
                </button>
                <button
                  className="secondary"
                  style={{ flex: 1 }}
                  onClick={() => startRestTimer(90)}
                >
                  90s
                </button>
                <button
                  className="secondary"
                  style={{ flex: 1 }}
                  onClick={() => startRestTimer(120)}
                >
                  120s
                </button>
                <button
                  className="secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const val = window.prompt("Custom rest (seconds):");
                    if (!val) return;
                    const sec = Number(val);
                    if (!isNaN(sec) && sec > 0) startRestTimer(sec);
                  }}
                >
                  Custom
                </button>
              </div>

              {restActive && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "#e5f2ff",
                    fontSize: 14
                  }}
                >
                  <span>Rest: {formatRest(restRemaining)}</span>
                  <button
                    className="secondary"
                    onClick={() => {
                      setRestActive(false);
                      setRestRemaining(0);
                    }}
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="fade-in">
            <h3>Today's Sets</h3>

            {Object.keys(todaysByExercise).length === 0 && (
              <div style={{ opacity: 0.6 }}>No sets logged yet.</div>
            )}

            {Object.entries(todaysByExercise).map(
              ([exerciseName, sets], groupIndex) => (
                <div
                  key={exerciseName}
                  className="exercise-group fade-in"
                >
                  <div className="exercise-group-header">
                    <div className="exercise-group-header-title">
                      {exerciseName}
                    </div>

                    <button
                      className="secondary"
                      style={{ fontSize: 12, padding: "4px 8px" }}
                      onClick={() => repeatLastSetForExercise(exerciseName)}
                    >
                      ↻ Repeat last
                    </button>
                  </div>

                  {sets.map((s, index) => {
                    const isLastGroup =
                      groupIndex ===
                      Object.entries(todaysByExercise).length - 1;
                    const isLastSet = index === sets.length - 1;

                    const type = s.type || getExerciseType(exerciseName);

                    let details = "";
                    if (type === "strength") {
                      details = `${s.weight || 0} kg × ${s.reps || 0} reps`;
                    } else if (type === "carry") {
                      const parts = [];
                      if (s.weight) parts.push(`${s.weight} kg`);
                      if (s.distance) parts.push(`${s.distance} m`);
                      if (s.time) parts.push(`${s.time} s`);
                      details = parts.join(" | ");
                    } else if (type === "hold") {
                      const parts = [];
                      if (s.weight) parts.push(`${s.weight} kg`);
                      if (s.time) parts.push(`${s.time} s`);
                      details = parts.join(" | ");
                    }

                    return (
                      <div
                        key={s.id}
                        ref={isLastGroup && isLastSet ? lastSetRef : null}
                        className="set-row"
                      >
                        <div>
                          <span
                            style={{
                              opacity: 0.6,
                              marginRight: 8
                            }}
                          >
                            Set {index + 1}
                          </span>
                          <span>{details}</span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              opacity: 0.6
                            }}
                          >
                            {s.date.slice(11, 16)}
                          </span>

                          <button
                            className="set-delete-btn"
                            onClick={() => deleteSet(s.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Bottom Buttons / Navigation */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              maxWidth: 480,
              padding: "10px 16px 16px",
              background: "#f7f7f9",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setShowSummary(true)}
              >
                Finish Workout
              </button>

              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={exportCSV}
              >
                Export CSV
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setPage("main")}
              >
                Workout
              </button>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setPage("history")}
              >
                History
              </button>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setPage("plan")}
              >
                Plan
              </button>
              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setPage("stats")}
              >
                Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}