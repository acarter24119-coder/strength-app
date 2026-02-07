export type WorkoutKey = "A" | "B" | "C" | "D" | "E";

export type ExerciseType = "strength" | "carry" | "hold";

export type SetLog = {
  id?: number;

  workout: WorkoutKey;
  exercise: string;
  type: ExerciseType;

  // Strength fields
  weight?: number;
  reps?: number;

  // Carry fields
  distance?: number; // metres
  time?: number;     // seconds

  // Hold fields
  // (uses weight + time)

  notes?: string;

  date: string;
};