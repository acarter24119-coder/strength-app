export type WorkoutKey = "A" | "B" | "C" | "D" | "E";

export type ExerciseType =
  | "strength"
  | "carry"
  | "hold"
  | "cardio";

export type SetLog = {
  id?: number;

  workout: WorkoutKey;
  exercise: string;        // e.g. "Log Press", "Farmers", "Yoke"
  type: ExerciseType;

  // Strength fields
  weight?: number;         // kg
  reps?: number;

  // Carry fields (strongman)
  distance?: number;       // metres
  time?: number;           // seconds (also used for hold + cardio)

  // Hold fields
  // (uses weight + time)

  // Cardio fields
  // distance = kilometres
  // time = seconds
  // (same fields as carry, but different meaning)

  notes?: string;

  date: string;            // ISO timestamp
};