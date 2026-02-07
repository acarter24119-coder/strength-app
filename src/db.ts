// db.ts
import Dexie from "dexie";
import type { SetLog } from "./types";

class StrengthDB extends Dexie {
  sets!: Dexie.Table<SetLog, number>;
  plan!: Dexie.Table<{ id: number; text: string }, number>;

  constructor() {
    super("strengthDB");

    // Version bump — resets DB (Option B)
    this.version(2).stores({
      sets: "++id, workout, exercise, type, date",
      plan: "id"
    });
  }
}

export const db = new StrengthDB();