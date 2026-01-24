export type SetLog = {
  id?: number;
  workout: "A" | "B" | "C"| "D" | "E";
  exercise: string;
  weight: number;
  reps: number;
  date: string;
};
