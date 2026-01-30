import { useEffect, useRef, useState } from "react"
import type { SetLog } from "./types"
import { saveAs } from "file-saver"
import { db } from "./db"
import HistoryPage from "./History"
import "./App.css"

type WorkoutKey = "A" | "B" | "C" | "D" | "E"

const workouts: Record<WorkoutKey, string[]> = {
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
}

function getNextWorkout(): WorkoutKey {
  return (localStorage.getItem("nextWorkout") as WorkoutKey) || "A"
}

function setNextWorkout(key: WorkoutKey) {
  localStorage.setItem("nextWorkout", key)
}

function rotateWorkout(current: WorkoutKey): WorkoutKey {
  const order: WorkoutKey[] = ["A", "B", "C", "D", "E"]
  const index = order.indexOf(current)
  const next = order[(index + 1) % order.length]
  setNextWorkout(next)
  return next
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function formatTodayDate() {
  const d = new Date()
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function calcOneRm(weight: number, reps: number): number {
  if (!weight || !reps) return 0
  return weight * (1 + reps / 30)
}

/* ---------------------------------------------------------
   PLAN PAGE
--------------------------------------------------------- */
function PlanPage({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("")

  useEffect(() => {
    db.table("plan")
      .get(1)
      .then((entry: any) => {
        if (entry?.text) setText(entry.text)
      })
  }, [])

  useEffect(() => {
    db.table("plan").put({ id: 1, text })
  }, [text])

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
  )
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function App() {
  const [workoutKey, setWorkoutKey] = useState<WorkoutKey>("A")
  const [todaysExercises, setTodaysExercises] = useState<string[]>([])
  const [exercise, setExercise] = useState("")
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [setNumber, setSetNumber] = useState(1)
  const [history, setHistory] = useState<SetLog[]>([])
  const [showSummary, setShowSummary] = useState(false)

  const [page, setPage] = useState<"main" | "history" | "plan">("main")

  const [customExercises, setCustomExercises] = useState<
    Record<WorkoutKey, string[]>
  >(() => JSON.parse(localStorage.getItem("customExercises") || "{}"))

  const lastSetRef = useRef<HTMLDivElement | null>(null)

  const saveCustomExercises = (data: Record<WorkoutKey, string[]>) => {
    setCustomExercises(data)
    localStorage.setItem("customExercises", JSON.stringify(data))
  }

  useEffect(() => {
    const key = getNextWorkout()
    setWorkoutKey(key)
    setTodaysExercises([...workouts[key], ...(customExercises[key] || [])])
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const data = await db.sets.toArray()
    setHistory(data)
  }
  const deleteSet = async (id: number | undefined) => {
    if (typeof id !== "number") return
    await db.sets.delete(id)
    await loadHistory()
  }

  const getLastSetForExercise = (exerciseName: string) => {
    const filtered = history
      .filter((s) => s.exercise === exerciseName)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    return filtered[0] || null
  }

  const getNextWeight = (last: SetLog | null) => {
    if (!last) return ""
    return last.reps >= 8
      ? String(last.weight + 2.5)
      : String(last.weight)
  }

  const getTodaySetCountForExercise = (exerciseName: string) => {
    const today = getTodayISODate()
    return history.filter(
      (s) =>
        s.exercise === exerciseName &&
        s.date.slice(0, 10) === today
    ).length
  }

  const selectExercise = (name: string) => {
    setExercise(name)
    const last = getLastSetForExercise(name)
    if (last) {
      setWeight(getNextWeight(last))
      setReps(String(last.reps))
    } else {
      setWeight("")
      setReps("")
    }
    setSetNumber(getTodaySetCountForExercise(name) + 1)
  }

  const repeatLastSetForExercise = (exerciseName: string) => {
    const last = getLastSetForExercise(exerciseName)
    if (!last) return
    setExercise(exerciseName)
    setWeight(String(last.weight))
    setReps(String(last.reps))
    setSetNumber(getTodaySetCountForExercise(exerciseName) + 1)
    setTimeout(
      () =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        }),
      50
    )
  }

  const saveSet = async () => {
    if (!exercise || !weight || !reps) return

    await db.sets.add({
      workout: workoutKey,
      exercise,
      weight: Number(weight),
      reps: Number(reps),
      date: new Date().toISOString(),
    })

    await loadHistory()
    setSetNumber(getTodaySetCountForExercise(exercise) + 1)

    setTimeout(() => {
      if (lastSetRef.current) {
        const rect = lastSetRef.current.getBoundingClientRect()
        const absoluteY = rect.top + window.scrollY
        window.scrollTo({
          top: absoluteY - 80,
          behavior: "smooth",
        })
      } else {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        })
      }
    }, 50)
  }

  const goToNextWorkout = () => {
    const next = rotateWorkout(workoutKey)
    setWorkoutKey(next)
    setTodaysExercises([
      ...workouts[next],
      ...(customExercises[next] || []),
    ])
    setExercise("")
    setWeight("")
    setReps("")
    setSetNumber(1)
  }

  const exportCSV = () => {
    const header = "Workout,Exercise,Weight (kg),Reps,Date\n"
    const rows = history
      .map(
        (s) =>
          `${s.workout},${s.exercise},${s.weight},${s.reps},${s.date}`
      )
      .join("\n")
    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    })
    saveAs(blob, "Strength-History.csv")
  }

  const todaysSets = history.filter(
    (s) => s.date.slice(0, 10) === getTodayISODate()
  )

  const todaysTotals = todaysSets.reduce(
    (acc, curr) => {
      acc.sets += 1
      acc.reps += curr.reps
      acc.volume += curr.weight * curr.reps
      return acc
    },
    { sets: 0, reps: 0, volume: 0 }
  )

  const todaysByExercise = todaysSets.reduce<
    Record<string, SetLog[]>
  >((acc, curr) => {
    if (!acc[curr.exercise]) acc[curr.exercise] = []
    acc[curr.exercise].push(curr)
    return acc
  }, {})

  const groupedByExercise = history.reduce<
    Record<string, SetLog[]>
  >((acc, curr) => {
    if (!acc[curr.exercise]) acc[curr.exercise] = []
    acc[curr.exercise].push(curr)
    return acc
  }, {})

  const bestOneRmByExercise: Record<string, number> = {}

  Object.keys(groupedByExercise).forEach((ex) => {
    const best = groupedByExercise[ex].reduce((max, s) => {
      const est = calcOneRm(s.weight, s.reps)
      return est > max ? est : max
    }, 0)
    bestOneRmByExercise[ex] = best
  })

  const prList: string[] = []

  Object.entries(todaysByExercise).forEach(([ex, sets]) => {
    const todaysBest1Rm = sets.reduce(
      (max, s) => Math.max(max, calcOneRm(s.weight, s.reps)),
      0
    )
    const allTimeBest1Rm = bestOneRmByExercise[ex] || 0

    if (todaysBest1Rm > allTimeBest1Rm) {
      prList.push(
        `${ex} — New 1RM PR: ${todaysBest1Rm.toFixed(1)} kg`
      )
    }
  })

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
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <h1>Workout {workoutKey}</h1>
          <div style={{ opacity: 0.7, fontSize: 14 }}>
            {formatTodayDate()}
          </div>
          <div
            style={{
              marginTop: 10,
              borderBottom: "1px solid #e5e5ea",
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
              <strong>Total volume:</strong>{" "}
              {todaysTotals.volume.toFixed(1)} kg
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
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
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
                setShowSummary(false)
                goToNextWorkout()
              }}
            >
              Next Workout
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------
     PAGE SWITCHING
  --------------------------------------------------------- */
  if (page === "history") {
    return (
      <HistoryPage
        history={history}
        onDeleteSet={deleteSet}
        onExportCSV={exportCSV}
        onBack={() => setPage("main")}
      />
    )
  }

  if (page === "plan") {
    return <PlanPage onBack={() => setPage("main")} />
  }
  /* ---------------------------------------------------------
     MAIN WORKOUT PAGE
  --------------------------------------------------------- */
  return (
    <>
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
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
          >
            <h1>Workout {workoutKey}</h1>
            <div style={{ opacity: 0.7, fontSize: 14 }}>
              {formatTodayDate()}
            </div>
            <div
              style={{
                marginTop: 10,
                borderBottom: "1px solid #e5e5ea",
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
                  <span onClick={() => selectExercise(ex)}>
                    {ex}
                  </span>

                  {customExercises[workoutKey]?.includes(ex) && (
                    <span
                      style={{ color: "red" }}
                      onClick={() => {
                        const updated = {
                          ...customExercises,
                          [workoutKey]: customExercises[workoutKey].filter(
                            (x) => x !== ex
                          ),
                        }
                        saveCustomExercises(updated)
                        setTodaysExercises([
                          ...workouts[workoutKey],
                          ...updated[workoutKey],
                        ])
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
                onClick={() => {
                  const name = prompt("Enter exercise name:")
                  if (!name) return

                  const updated = {
                    ...customExercises,
                    [workoutKey]: [
                      ...(customExercises[workoutKey] || []),
                      name,
                    ],
                  }

                  saveCustomExercises(updated)
                  setTodaysExercises([
                    ...workouts[workoutKey],
                    ...updated[workoutKey],
                  ])
                }}
              >
                + Add Exercise
              </button>

              <button
                style={{ flex: 1 }}
                onClick={goToNextWorkout}
              >
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
                const name = e.target.value
                setExercise(name)

                const last = getLastSetForExercise(name)
                if (last) {
                  setWeight(getNextWeight(last))
                  setReps(String(last.reps))
                } else {
                  setWeight("")
                  setReps("")
                }

                setSetNumber(
                  getTodaySetCountForExercise(name) + 1
                )
              }}
            />

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

            <button
              onClick={saveSet}
              style={{ width: "100%" }}
            >
              Save Set
            </button>
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
                      onClick={() =>
                        repeatLastSetForExercise(exerciseName)
                      }
                    >
                      ↻ Repeat last
                    </button>
                  </div>

                  {sets.map((s, index) => {
                    const isLastGroup =
                      groupIndex ===
                      Object.entries(todaysByExercise).length - 1
                    const isLastSet = index === sets.length - 1

                    return (
                      <div
                        key={s.id}
                        ref={
                          isLastGroup && isLastSet
                            ? lastSetRef
                            : null
                        }
                        className="set-row"
                      >
                        <div>
                          <span
                            style={{
                              opacity: 0.6,
                              marginRight: 8,
                            }}
                          >
                            Set {index + 1}
                          </span>
                          <span>
                            {s.weight} kg × {s.reps} reps
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              opacity: 0.6,
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
                    )
                  })}
                </div>
              )
            )}
          </div>

          {/* Bottom Buttons */}
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
              boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
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
                onClick={() => setPage("history")}
              >
                History
              </button>

              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={exportCSV}
              >
                Export CSV
              </button>

              <button
                className="secondary"
                style={{ flex: 1 }}
                onClick={() => setPage("plan")}
              >
                Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}