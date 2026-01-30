import "./App.css";
import React, { useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { buildSections } from "./data/guideData";
import { usePersistedState } from "./utils/storage";

import Home from "./pages/Home";
import StartGuide from "./pages/StartGuide";
import Reference from "./pages/Reference";

export default function App() {
  const sections = useMemo(() => buildSections(), []);
  const [completed, setCompleted] = usePersistedState("dmm_guide_checklist_v1", {});
  const [query, setQuery] = useState("");
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const location = useLocation();
  const isStartGuide = location.pathname.startsWith("/start");

  const allItems = useMemo(() => {
    const list = [];
    for (const s of sections) {
      for (const it of s.items || []) list.push(it);
      for (const sub of s.subsections || []) for (const it of sub.items || []) list.push(it);
    }
    return list;
  }, [sections]);

  const doneAll = allItems.reduce((acc, it) => acc + (completed[it._id] ? 1 : 0), 0);

  function clearAll() {
    if (!window.confirm("Clear ALL checkboxes for this guide?")) return;
    setCompleted({});
  }

  function completeAllVisible(routeSectionIds) {
    // Mark all items in specific section ids complete (used by pages)
    const ids = [];
    for (const secId of routeSectionIds) {
      const sec = sections.find((s) => s.id === secId);
      if (!sec) continue;

      const main = (sec.items || []).filter((it) => {
        const matchesQ = !query || it.text.toLowerCase().includes(query.toLowerCase());
        const matchesDone = !showCompletedOnly || completed[it._id];
        return matchesQ && matchesDone;
      });
      main.forEach((it) => ids.push(it._id));

      for (const sub of sec.subsections || []) {
        const subItems = (sub.items || []).filter((it) => {
          const matchesQ = !query || it.text.toLowerCase().includes(query.toLowerCase());
          const matchesDone = !showCompletedOnly || completed[it._id];
          return matchesQ && matchesDone;
        });
        subItems.forEach((it) => ids.push(it._id));
      }
    }

    setCompleted((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = true;
      return next;
    });
  }

  return (
    <div className="app">
      <div className="shell">
        <header className="topbar">
          <div className="topbar__left">
            <div className="title">Deadman Mode Start Guide</div>
            <div className="subtitle">Checklist with saved progress (localStorage).</div>
            <div className="stats">
              <span className="pill">
                Overall: {doneAll}/{allItems.length}
              </span>
              <span className="pill">
                {allItems.length ? Math.round((doneAll / allItems.length) * 100) : 0}% complete
              </span>
            </div>
          </div>

          <div className="topbar__right">
            <button
              className="btn btn--ghost"
              onClick={() =>
                completeAllVisible(
                  isStartGuide
                    ? ["ranged-start", "magic-start", "moneymaking-start", "melee-start"]
                    : ["starting-gear", "multipliers", "autocompleted-quests", "useful-early-sigils"]
                )
              }
            >
              Complete visible
            </button>

            <button className="btn btn--ghost" onClick={clearAll}>
              Reset all
            </button>
          </div>
        </header>

        <nav className="nav">
          <NavLink className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`} to="/">
            Home
            </NavLink>
            <NavLink
            className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`}
            to="/start/melee"
          >
            Melee Start
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`} to="/start/ranged">
            Ranged start
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`} to="/start/magic">
            Magic start
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`} to="/start/moneymaking">
            Moneymaking
          </NavLink>
          <NavLink className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`} to="/reference">
            Reference
          </NavLink>

          <div className="nav__spacer" />

          <input
            className="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter steps (e.g., altar, museum, Varrock)"
          />

          <label className="toggle">
            <input
              type="checkbox"
              checked={showCompletedOnly}
              onChange={(e) => setShowCompletedOnly(e.target.checked)}
            />
            <span>Show completed only</span>
          </label>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/start/:mode"
              element={
                <StartGuide
                  sections={sections}
                  completed={completed}
                  setCompleted={setCompleted}
                  query={query}
                  showCompletedOnly={showCompletedOnly}
                />
              }
            />

            <Route
              path="/reference"
              element={
                <Reference
                  sections={sections}
                  completed={completed}
                  setCompleted={setCompleted}
                  query={query}
                  showCompletedOnly={showCompletedOnly}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
