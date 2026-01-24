import Dexie from "dexie";

import type { SetLog } from "./types";

class StrengthDB extends Dexie {
  sets!: Dexie.Table<SetLog, number>;

  constructor() {
    super("strengthDB");
    this.version(1).stores({
      sets: "++id, day, exercise, date",
    });
  }
}

export const db = new StrengthDB();
