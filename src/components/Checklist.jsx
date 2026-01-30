import React from "react";
import Pill from "./Pill";

export default function Checklist({ items, completed, onToggle }) {
  return (
    <div className="checklist">
      {items.map((it) => {
        const isDone = !!completed[it._id];
        return (
          <label
            key={it._id}
            className={`item ${isDone ? "is-done" : ""}`}
            style={{ marginLeft: it.indent ? it.indent * 18 : 0 }}
          >
            <input type="checkbox" checked={isDone} onChange={() => onToggle(it._id)} />
            <div className="item__text">
              <div className="item__title">{it.text}</div>
            </div>
            <div className="item__meta">
              {typeof it.points === "number" && <Pill>+{it.points} pts</Pill>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
