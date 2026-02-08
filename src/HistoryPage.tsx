import { useEffect, useState } from "react";
import { db } from "./db";
import type { SetLog } from "./types";

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const allWorkouts = await db.workouts.orderBy("id").reverse().toArray();
      setWorkouts(allWorkouts);
    };
    load();
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>History</h1>

      {workouts.map(workout => (
        <div key={workout.id} style={{ marginBottom: "20px" }}>
          <button
            onClick={() => toggleExpand(workout.id)}
            style={{ width: "100%", padding: "10px" }}
          >
            Workout on {new Date(workout.date).toLocaleString()}
          </button>

          {expanded === workout.id && (
            <WorkoutSets workoutId={workout.id} />
          )}
        </div>
      ))}
    </div>
  );
}

function WorkoutSets({ workoutId }: { workoutId: number }) {
  const [sets, setSets] = useState<SetLog[]>([]);

  useEffect(() => {
    const load = async () => {
      const sessionSets = await db.sets
        .where("workoutId")
        .equals(workoutId)
        .toArray();

      setSets(sessionSets);
    };
    load();
  }, [workoutId]);

  return (
    <div style={{ marginTop: "10px", paddingLeft: "10px" }}>
      {sets.map(set => (
        <div key={set.id} style={{ marginBottom: "10px" }}>
          <strong>{set.exercise}</strong> ({set.type})<br />
          {set.weight !== undefined && <>Weight: {set.weight}kg<br /></>}
          {set.reps !== undefined && <>Reps: {set.reps}<br /></>}
          {set.distance !== undefined && <>Distance: {set.distance}m<br /></>}
          {set.time !== undefined && <>Time: {set.time}s<br /></>}
          {set.notes && <>Notes: {set.notes}<br /></>}
        </div>
      ))}
    </div>
  );
}