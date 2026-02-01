// src/utils/osrsHiscores.js
const HISCORE_PROXY_BASE = "https://dmm-checklist.vercel.app";

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

export const HISCORE_TYPES = [
  { key: "STANDARD", label: "Standard" },
  { key: "IRONMAN", label: "Ironman" },
  { key: "HARDCORE_IRONMAN", label: "Hardcore Ironman" },
  { key: "ULTIMATE_IRONMAN", label: "Ultimate Ironman" },
  { key: "DEADMAN", label: "Deadman (main)" },
  { key: "DEADMAN_TOURNAMENT", label: "Deadman (tournament)" },
  { key: "SEASONAL", label: "Seasonal" },
];

function normalizeLevel(n) {
  if (!Number.isFinite(n)) return 1;
  if (n < 1) return 1;
  return n;
}

export async function fetchOsrsLevels(playerName, hiscoreType = "STANDARD", opts = {}) {
  const name = (playerName || "").trim();
  if (!name) throw new Error("Enter a player name.");

  const type = (hiscoreType || "STANDARD").trim().toUpperCase();

  const params = new URLSearchParams();
  params.set("player", name);
  params.set("type", type);

  if (opts.a != null && String(opts.a).trim() !== "") params.set("a", String(opts.a).trim());

  const url = `${HISCORE_PROXY_BASE}/api/hiscore?${params.toString()}`;

  const res = await fetch(url, {
    // ✅ This avoids caching without adding custom headers (no preflight required)
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`Hiscores lookup failed (${res.status}). ${msg ? msg.slice(0, 160) : ""}`);
  }

  const text = await res.text();

  if (text.includes("<html") || text.includes("<!DOCTYPE")) {
    throw new Error("Proxy returned HTML, not CSV. Check that /api/hiscore is deployed.");
  }

  return parseOsrsIndexLite(text);
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export function parseOsrsIndexLite(csvText) {
  const lines = (csvText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const levels = {};
  for (let i = 0; i < SKILL_ORDER.length && i < lines.length; i++) {
    const parts = lines[i].split(",");
    const levelRaw = Number(parts[1]);
    levels[SKILL_ORDER[i]] = normalizeLevel(levelRaw);
  }
  return levels;
}

export function getOsrsSkillNames() {
  return SKILL_ORDER.filter((s) => s !== "Overall");
}
