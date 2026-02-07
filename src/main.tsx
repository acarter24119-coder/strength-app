import { useState } from "react";
import type { WorkoutKey, ExerciseType, SetLog } from "./types";
import { db } from "./db";

export default function MainPage() {
  const [workout, setWorkout] = useState<WorkoutKey>("A");
  const [exercise, setExercise] = useState("");
  const [type, setType] = useState<ExerciseType>("strength");

  // Strength fields
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  // Carry / Cardio fields
  const [distance, setDistance] = useState("");
  const [time, setTime] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  const addSet = async () => {
    const newSet: SetLog = {
      workout,
      exercise,
      type,

      // Strength
      weight: type === "strength" ? Number(weight) : undefined,
      reps: type === "strength" ? Number(reps) : undefined,

      // Carry + Cardio
      distance:
        type === "carry" || type === "cardio"
          ? Number(distance)
          : undefined,

      // Hold + Cardio
      time:
        type === "hold" || type === "cardio"
          ? Number(time)
          : undefined,

      notes: notes || "",
      date: new Date().toISOString(),
    };

    await db.sets.add(newSet);

    // Clear fields
    setWeight("");
    setReps("");
    setDistance("");
    setTime("");
    setNotes("");
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Workout Logger</h1>

      <label>Workout Key</label>
      <select
        value={workout}
        onChange={e => setWorkout(e.target.value as WorkoutKey)}
      >
        <option>A</option>
        <option>B</option>
        <option>C</option>
        <option>D</option>
        <option>E</option>
      </select>

      <label>Exercise Name</label>
      <input
        value={exercise}
        onChange={e => setExercise(e.target.value)}
        placeholder="e.g. Log Press"
      />

      <label>Type</label>
      <select
        value={type}
        onChange={e => setType(e.target.value as ExerciseType)}
      >
        <option value="strength">Strength</option>
        <option value="carry">Carry</option>
        <option value="hold">Hold</option>
        <option value="cardio">Cardio</option>
      </select>

      {type === "strength" && (
        <>
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={e => setReps(e.target.value)}
          />
        </>
      )}

      {type === "carry" && (
        <>
          <input
            type="number"
            placeholder="Distance (m)"
            value={distance}
            onChange={e => setDistance(e.target.value)}
          />
          <input
            type="number"
            placeholder="Time (s)"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </>
      )}

      {type === "hold" && (
        <>
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="Time (s)"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </>
      )}

      {type === "cardio" && (
        <>
          <input
            type="number"
            placeholder="Distance (km)"
            value={distance}
            onChange={e => setDistance(e.target.value)}
          />
          <input
            type="number"
            placeholder="Time (s)"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </>
      )}

      <label>Notes</label>
      <input
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes"
      />

      <button onClick={addSet}>Add Set</button>
    </div>
  );
}