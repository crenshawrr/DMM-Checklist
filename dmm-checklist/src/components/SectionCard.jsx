import React, { useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";
import Pill from "./Pill";
import Checklist from "./Checklist";
import { pct } from "../utils/text";

export default function SectionCard({
  section,
  completed,
  setCompleted,
  query,
  showCompletedOnly,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const allItems = useMemo(() => {
    const base = section.items || [];
    const subs = (section.subsections || []).flatMap((s) => s.items || []);
    return [...base, ...subs];
  }, [section]);

  const doneCount = allItems.reduce((acc, it) => acc + (completed[it._id] ? 1 : 0), 0);

  const filteredMain = (section.items || []).filter((it) => {
    const matchesQ = !query || it.text.toLowerCase().includes(query.toLowerCase());
    const matchesDone = !showCompletedOnly || completed[it._id];
    return matchesQ && matchesDone;
  });

  const filteredSubs = (section.subsections || [])
    .map((sub) => ({
      ...sub,
      items: (sub.items || []).filter((it) => {
        const matchesQ = !query || it.text.toLowerCase().includes(query.toLowerCase());
        const matchesDone = !showCompletedOnly || completed[it._id];
        return matchesQ && matchesDone;
      }),
    }))
    .filter((sub) => sub.items.length > 0);

  const hasAnything = filteredMain.length > 0 || filteredSubs.length > 0;

  function toggle(id) {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function setAllInSection(value) {
    const ids = allItems.map((it) => it._id);
    setCompleted((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = value;
      return next;
    });
  }

  if (!hasAnything) return null;

  return (
    <div className="card card--section">
      <div className="card__header">
        <div className="card__headerRow">
          <div className="card__titleWrap">
            <div className="card__title">{section.title}</div>
            <div className="card__badges">
              <Pill>{pct(doneCount, allItems.length)}% complete</Pill>
              <Pill>
                {doneCount}/{allItems.length} steps
              </Pill>
            </div>
          </div>

          <div className="card__actions">
            <button className="btn btn--ghost" onClick={() => setAllInSection(true)}>
              Complete all
            </button>
            <button className="btn btn--ghost" onClick={() => setAllInSection(false)}>
              Clear
            </button>
            <button className="btn btn--primary" onClick={() => setOpen((v) => !v)}>
              {open ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        <ProgressBar done={doneCount} total={allItems.length} />
      </div>

      {open && (
        <div className="card__body">
          {filteredMain.length > 0 && (
            <Checklist items={filteredMain} completed={completed} onToggle={toggle} />
          )}

          {filteredSubs.map((sub) => (
            <div key={sub.id} className="subsection">
              <div className="subsection__title">{sub.title}</div>
              <Checklist items={sub.items} completed={completed} onToggle={toggle} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
