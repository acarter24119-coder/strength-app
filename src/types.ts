export type WorkoutKey = "A" | "B" | "C" | "D" | "E";

export type ExerciseType = 
  | "strength"
  | "carry"
  | "hold"
  | "cardio";

export type SetLog = {
  id?: number;

  workout: WorkoutKey;
  exercise: string;
  type: ExerciseType;

  // Strength fields
  weight?: number;
  reps?: number;

  // Carry fields (strongman)
  // Distance in metres
  distance?: number;
  // Time in seconds
  time?: number;

  // Hold fields
  // (uses weight + time)

  // Cardio fields
  // distance = kilometres
  // time = seconds
  // (same fields as carry, but different meaning)

  notes?: string;

  date: string; // ISO timestamp
};