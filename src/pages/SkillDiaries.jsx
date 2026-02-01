// src/pages/SkillDiaries.jsx
import React, { useEffect, useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import { fetchOsrsLevels, getOsrsSkillNames, HISCORE_TYPES } from "../utils/osrsHiscores";

function titleCase(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toOsrsSkillNameFromSectionId(sectionId) {
  const slug = (sectionId || "").replace("skills-", "");
  return titleCase(slug);
}

function parseOtherRequirements(otherStr) {
  const out = {};
  if (!otherStr) return out;

  const s = String(otherStr).trim();
  if (!s || s.toLowerCase() === "none") return out;

  const re = /([A-Za-z]+)\s*(\d{1,3})/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const skill = titleCase(m[1].toLowerCase());
    const lvl = Number(m[2]);
    if (Number.isFinite(lvl)) out[skill] = lvl;
  }
  return out;
}

function getRequirementFromItem(item, fallbackSkillName) {
  const req = {
    primarySkill: item.skill || fallbackSkillName,
    primaryLevel: null,
    others: {},
  };

  if (item.level != null && String(item.level).trim() !== "") {
    const n = Number(String(item.level).replace(/[^\d-]/g, ""));
    if (Number.isFinite(n)) req.primaryLevel = n;
  } else {
    const text = String(item.text || "");
    const m = /Level:\s*(\d{1,3})/i.exec(text);
    if (m) req.primaryLevel = Number(m[1]);
  }

  req.others = parseOtherRequirements(item.other);
  return req;
}

function canDoStep(levels, req) {
  if (!levels) return { ok: false, missing: ["Load stats to highlight"] };

  const missing = [];

  const primarySkill = req.primarySkill ? titleCase(String(req.primarySkill).toLowerCase()) : null;
  if (primarySkill && req.primaryLevel != null) {
    const have = levels[primarySkill] ?? 1;
    if (have < req.primaryLevel) missing.push(`${primarySkill} ${req.primaryLevel} (you: ${have})`);
  }

  for (const [skill, need] of Object.entries(req.others || {})) {
    const have = levels[skill] ?? 1;
    if (have < need) missing.push(`${skill} ${need} (you: ${have})`);
  }

  return { ok: missing.length === 0, missing };
}

function decorateSectionForPlayer(section, levels) {
  if (!section) return section;

  const skillName = toOsrsSkillNameFromSectionId(section.id);

  const decorateItem = (it) => {
    const req = getRequirementFromItem(it, skillName);
    const verdict = canDoStep(levels, req);

    if (!levels) return it;

    if (verdict.ok) return { ...it, text: `✅ ${it.text}` };

    const miss = verdict.missing.length ? ` — need: ${verdict.missing.join(", ")}` : "";
    return { ...it, text: `🔒 ${it.text}${miss}` };
  };

  return {
    ...section,
    items: (section.items || []).map(decorateItem),
    subsections: (section.subsections || []).map((sub) => ({
      ...sub,
      items: (sub.items || []).map(decorateItem),
    })),
  };
}

export default function SkillDiaries({ sections, completed, setCompleted, query, showCompletedOnly }) {
  const skillSections = useMemo(() => {
    return (sections || [])
      .filter((s) => typeof s.id === "string" && s.id.startsWith("skills-"))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [sections]);

  const [selectedId, setSelectedId] = useState(() => skillSections[0]?.id || "");

  // Stat lookup
  const [playerName, setPlayerName] = useState("");
  const [hiscoreType, setHiscoreType] = useState("STANDARD");
  const [tournamentA, setTournamentA] = useState("13"); // ✅ default to a=13
  const [lookupStatus, setLookupStatus] = useState({ state: "idle", error: "" });
  const [levels, setLevels] = useState(null);

  useEffect(() => {
    if (!skillSections.length) return;
    if (!selectedId || !skillSections.some((s) => s.id === selectedId)) {
      setSelectedId(skillSections[0].id);
    }
  }, [skillSections, selectedId]);

  const selectedSectionRaw = useMemo(() => {
    return skillSections.find((s) => s.id === selectedId) || skillSections[0] || null;
  }, [skillSections, selectedId]);

  const selectedSection = useMemo(() => {
    return decorateSectionForPlayer(selectedSectionRaw, levels);
  }, [selectedSectionRaw, levels]);

  const selectedSkillSlug = selectedSectionRaw?.id?.replace("skills-", "") || "";

  const filteredStats = useMemo(() => {
    if (!selectedSectionRaw) return { done: 0, total: 0 };

    const items = [];
    for (const it of selectedSectionRaw.items || []) items.push(it);
    for (const sub of selectedSectionRaw.subsections || []) for (const it of sub.items || []) items.push(it);

    const filtered = items.filter((it) => {
      const text = (it.text || "").toLowerCase();
      const matchesQ = !query || text.includes(query.toLowerCase());
      const matchesDone = !showCompletedOnly || completed[it._id];
      return matchesQ && matchesDone;
    });

    const done = filtered.reduce((acc, it) => acc + (completed[it._id] ? 1 : 0), 0);
    return { done, total: filtered.length };
  }, [selectedSectionRaw, completed, query, showCompletedOnly]);

  async function doLookup() {
    setLookupStatus({ state: "loading", error: "" });
    try {
      const opts =
        hiscoreType === "DEADMAN_TOURNAMENT" && tournamentA.trim()
          ? { a: tournamentA.trim() }
          : {};
      const lv = await fetchOsrsLevels(playerName, hiscoreType, opts);
      setLevels(lv);
      setLookupStatus({ state: "done", error: "" });
    } catch (e) {
      setLevels(null);
      setLookupStatus({ state: "error", error: e?.message || "Lookup failed." });
    }
  }

  if (!skillSections.length) {
    return (
      <div className="card">
        <h2>Skill Diaries</h2>
        <p>
          No skill diary sections found. Make sure your generated sections exist (ids like <code>skills-agility</code>)
          and are appended in <code>buildSections()</code>.
        </p>
      </div>
    );
  }

  const skillNames = getOsrsSkillNames();
  const typeLabel = HISCORE_TYPES.find((t) => t.key === hiscoreType)?.label || "Standard";

  return (
    <div className="skill-diaries">
      <div className="skill-diaries__header">
        <h2>Skill Diaries</h2>
        <div className="skill-diaries__meta">
          <span className="pill">
            Selected: {titleCase(selectedSkillSlug)} — {filteredStats.done}/{filteredStats.total} (filtered)
          </span>
          <span className="pill">{levels ? `Highlight: ON (${typeLabel})` : "Highlight: OFF"}</span>
        </div>
      </div>

      {/* Stat lookup panel */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>Stat lookup</div>

          <select
            className="search"
            style={{ maxWidth: 240 }}
            value={hiscoreType}
            onChange={(e) => setHiscoreType(e.target.value)}
            title="Choose hiscore table"
          >
            {HISCORE_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          {hiscoreType === "DEADMAN_TOURNAMENT" && (
            <input
              className="search"
              style={{ maxWidth: 120 }}
              value={tournamentA}
              onChange={(e) => setTournamentA(e.target.value)}
              placeholder="a=13"
              title="Tournament parameter (a=...)"
            />
          )}

          <input
            className="search"
            style={{ maxWidth: 320 }}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter OSRS player name"
          />

          <button className="btn btn--ghost" onClick={doLookup} disabled={lookupStatus.state === "loading"}>
            {lookupStatus.state === "loading" ? "Loading..." : "Fetch stats"}
          </button>

          {lookupStatus.state === "error" ? (
            <span style={{ opacity: 0.9 }}>❌ {lookupStatus.error}</span>
          ) : lookupStatus.state === "done" ? (
            <span style={{ opacity: 0.9 }}>
              ✅ Loaded: {playerName.trim()} ({typeLabel}
              {hiscoreType === "DEADMAN_TOURNAMENT" ? `, a=${tournamentA.trim() || "?"}` : ""})
            </span>
          ) : (
            <span style={{ opacity: 0.7 }}>Tip: stats enable ✅/🔒 highlighting</span>
          )}
        </div>

        {levels && (
          <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {skillNames.map((sk) => (
              <span key={sk} className="pill">
                {sk}: {levels[sk] ?? 1}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="skill-diaries__grid">
        <aside className="skill-diaries__sidebar">
          <div className="skill-diaries__sidebarTitle">Skills</div>

          <div className="skill-diaries__list">
            {skillSections.map((s) => {
              const slug = s.id.replace("skills-", "");
              const label = titleCase(slug);
              const isActive = selectedSectionRaw?.id === s.id;

              return (
                <button
                  key={s.id}
                  className={`skill-diaries__skillBtn ${isActive ? "is-active" : ""}`}
                  onClick={() => setSelectedId(s.id)}
                  type="button"
                  title={s.title}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="skill-diaries__content">
          {selectedSection ? (
            <SectionCard
              section={selectedSection}
              completed={completed}
              setCompleted={setCompleted}
              query={query}
              showCompletedOnly={showCompletedOnly}
            />
          ) : (
            <div className="card">
              <h3>No skill selected</h3>
              <p>Select a skill on the left.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
