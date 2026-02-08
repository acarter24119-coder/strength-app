// db.ts
import Dexie from "dexie";
import type { SetLog, WorkoutKey } from "./types";

class StrengthDB extends Dexie {
  sets!: Dexie.Table<SetLog, number>;
  workouts!: Dexie.Table<{ id?: number; date: string }, number>;
  plans!: Dexie.Table<{ workout: WorkoutKey; exercises: string[] }, WorkoutKey>;

  constructor() {
    super("strengthDB");

    this.version(4).stores({
      sets: "++id, workout, exercise, type, date, workoutId",
      workouts: "++id, date",
      plans: "workout" // KEYED BY WORKOUT LETTER A–E
    });
  }
}

export const db = new StrengthDB();