import React from "react";
import { pct } from "../utils/text";

export default function ProgressBar({ done, total }) {
  const percent = pct(done, total);

  return (
    <div className="progress">
      <div className="progress__track" aria-label={`Progress: ${percent}%`}>
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress__label">
        {done}/{total} ({percent}%)
      </div>
    </div>
  );
}
