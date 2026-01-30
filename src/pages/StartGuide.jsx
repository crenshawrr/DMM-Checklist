import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../components/SectionCard";

export default function StartGuide({ sections, completed, setCompleted, query, showCompletedOnly }) {
  const { mode } = useParams();

  const sectionId = useMemo(() => {
    if (mode === "ranged") return "ranged-start";
    if (mode === "magic") return "magic-start";
    if (mode === "moneymaking") return "moneymaking-start";
    if (mode === "melee") return "melee-start";
    return null; // don't silently fall back
  }, [mode]);

  const section = sectionId ? sections.find((s) => s.id === sectionId) : null;

  if (!section) {
    return (
      <div className="card">
        <h2>Not found</h2>
        <p>Unknown start mode: <code>{mode}</code></p>
      </div>
    );
  }

  return (
    <div className="stack">
      <SectionCard
        section={section}
        completed={completed}
        setCompleted={setCompleted}
        query={query}
        showCompletedOnly={showCompletedOnly}
        defaultOpen
      />
    </div>
  );
}
