// src/utils/osrsHiscores.js
// Fetch + parse OSRS hiscores "lite" CSV into a { skillName: level } map.
//
// Endpoint format: index_lite returns CSV lines of rank,level,xp/score. :contentReference[oaicite:2]{index=2}

const HISCORE_BASE =
  "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=";

// Order for OSRS index_lite (first line is "Overall", then 23 skills in this order)
const SKILL_ORDER = [
  "Overall",
  "Attack",
  "Defence",
  "Strength",
  "Hitpoints",
  "Ranged",
  "Prayer",
  "Magic",
  "Cooking",
  "Woodcutting",
  "Fletching",
  "Fishing",
  "Firemaking",
  "Crafting",
  "Smithing",
  "Mining",
  "Herblore",
  "Agility",
  "Thieving",
  "Slayer",
  "Farming",
  "Runecrafting",
  "Hunter",
  "Construction",
];

function normalizeLevel(n) {
  // Some players may return -1 level for unranked skills. :contentReference[oaicite:3]{index=3}
  // We'll treat that as 1 for "can I do X?" logic.
  if (!Number.isFinite(n)) return 1;
  if (n < 1) return 1;
  return n;
}

export async function fetchOsrsLevels(playerName) {
  const name = (playerName || "").trim();
  if (!name) throw new Error("Enter a player name.");

  const url = HISCORE_BASE + encodeURIComponent(name);

  // NOTE: If this is blocked by CORS in your browser, you’ll need a proxy route.
  // (You already discussed Cloudflare worker proxies earlier — this endpoint sometimes blocks direct fetch from browsers.)
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Hiscores lookup failed (${res.status}). Name might be invalid or endpoint blocked.`);
  }

  const text = await res.text();
  return parseOsrsIndexLite(text);
}

export function parseOsrsIndexLite(csvText) {
  const lines = (csvText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Defensive: sometimes extra activities exist beyond skills.
  // We only map the first 24 lines (Overall + 23 skills).
  const levels = {};
  for (let i = 0; i < SKILL_ORDER.length && i < lines.length; i++) {
    const parts = lines[i].split(",");
    const levelRaw = Number(parts[1]);
    levels[SKILL_ORDER[i]] = normalizeLevel(levelRaw);
  }

  return levels;
}

export function getOsrsSkillNames() {
  // Return the 23 skills (no Overall)
  return SKILL_ORDER.filter((s) => s !== "Overall");
}
