// db.ts
import Dexie from "dexie";
import type { SetLog } from "./types";

class StrengthDB extends Dexie {
  sets!: Dexie.Table<SetLog, number>;
  plan!: Dexie.Table<{ id: number; text: string }, number>;
  workouts!: Dexie.Table<{ id?: number; date: string }, number>; // NEW

  constructor() {
    super("strengthDB");

    this.version(3).stores({
      sets: "++id, workout, exercise, type, date, workoutId", // NEW: workoutId index
      plan: "id",
      workouts: "++id, date" // NEW TABLE
    });
  }
}

export const db = new StrengthDB();