import React from "react";
import SectionCard from "../components/SectionCard";

export default function Reference({ sections, completed, setCompleted, query, showCompletedOnly }) {
  const ids = ["starting-gear", "multipliers", "autocompleted-quests", "useful-early-sigils"];
  const refSections = ids.map((id) => sections.find((s) => s.id === id)).filter(Boolean);

  return (
    <div className="stack">
      {refSections.map((sec, idx) => (
        <SectionCard
          key={sec.id}
          section={sec}
          completed={completed}
          setCompleted={setCompleted}
          query={query}
          showCompletedOnly={showCompletedOnly}
          defaultOpen={idx < 2}
        />
      ))}
    </div>
  );
}
