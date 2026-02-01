import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../components/SectionCard";

export default function Skill({ sections, completed, setCompleted, query, showCompletedOnly }) {
  const { skill } = useParams(); // "fishing", "cooking", etc.
  const sectionId = `skills-${skill}`;

  const section = useMemo(() => sections.find((s) => s.id === sectionId), [sections, sectionId]);

  if (!section) {
    return (
      <div className="card">
        <h2>Not found</h2>
        <p>Unknown skill page: {skill}</p>
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
      />
    </div>
  );
}
