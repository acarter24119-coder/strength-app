// src/Plan.tsx
import { useEffect, useState } from "react";
import { db } from "./db";

export default function Plan() {
  const [text, setText] = useState("");

  useEffect(() => {
    db.plan.get(1).then((entry) => {
      if (entry?.text) setText(entry.text);
    });
  }, []);

  useEffect(() => {
    db.plan.put({ id: 1, text });
  }, [text]);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Training Plan</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your strongman plan here..."
        rows={20}
        style={{ width: "100%", fontSize: "1rem" }}
      />
    </div>
  );
}