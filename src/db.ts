// db.ts
import Dexie from "dexie";
import type { SetLog } from "./types";

class StrengthDB extends Dexie {
  sets!: Dexie.Table<SetLog, number>;
  plan!: Dexie.Table<{ id: number; text: string }, number>; // ← Add this line

  constructor() {
    super("strengthDB");
    this.version(1).stores({
      sets: "++id, day, exercise, date",
      plan: "id", // ← Add this line
    });
  }
}

export const db = new StrengthDB();