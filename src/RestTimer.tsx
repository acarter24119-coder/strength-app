import { useState, useEffect, useRef } from "react";

export default function RestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Tick every second when running
  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  // ⭐ NEW — Preset rest times
  const setPreset = (value: number) => {
    setSeconds(value);
    setRunning(true);
  };

  // Format mm:ss
  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <h2>Rest Timer</h2>

      <div style={{ fontSize: "32px", marginBottom: "10px" }}>
        {format(seconds)}
      </div>

      {/* ⭐ Preset Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button className="add-set-btn" onClick={() => setPreset(30)}>30s</button>
        <button className="add-set-btn" onClick={() => setPreset(60)}>60s</button>
        <button className="add-set-btn" onClick={() => setPreset(90)}>90s</button>
        <button className="add-set-btn" onClick={() => setPreset(120)}>120s</button>
      </div>

      {!running && (
        <button onClick={start} className="add-set-btn">
          Start
        </button>
      )}

      {running && (
        <button onClick={pause} className="finish-btn">
          Pause
        </button>
      )}

      <button
        onClick={reset}
        className="history-btn"
        style={{ marginTop: "10px" }}
      >
        Reset
      </button>
    </div>
  );
}