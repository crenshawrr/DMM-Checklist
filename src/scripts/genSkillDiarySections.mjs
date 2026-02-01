// scripts/genSkillDiarySections.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source tables: "Achievements by skill requirement" for all skills
const SOURCE_URL = "https://oldschoolrunescape.fandom.com/wiki/Achievements/All_achievements";

const SKILLS = [
  "Agility",
  "Attack",
  "Construction",
  "Cooking",
  "Crafting",
  "Defence",
  "Farming",
  "Firemaking",
  "Fishing",
  "Fletching",
  "Herblore",
  "Hitpoints",
  "Hunter",
  "Magic",
  "Mining",
  "Prayer",
  "Ranged",
  "Runecrafting",
  "Slayer",
  "Smithing",
  "Strength",
  "Thieving",
  "Woodcutting",
];

function toSkillId(skill) {
  return `skills-${skill.toLowerCase()}`;
}

function cleanText(s) {
  return (s || "")
    .replace(/\s+/g, " ")
    .replace(/\[\w+\]/g, "") // strip footnote markers like [a]
    .trim();
}

function detectSkillHeading($, skill) {
  // Fandom uses ids like id="Agility", id="Attack", etc.
  return $(`#${skill}`).first();
}


function findTableAfterHeading($, headingEl) {
  // Walk forward in the DOM until we hit a table (wikitable)
  let el = headingEl;
  for (let i = 0; i < 30; i++) {
    el = el.parent().next(); // heading span -> parent heading -> next sibling
    if (!el || el.length === 0) return null;
    const table = el.find("table.wikitable").first();
    if (table && table.length) return table;

    // sometimes the next sibling itself is the table
    if (el.is("table.wikitable")) return el;

    // keep walking if it's wrappers/divs/etc
  }
  return null;
}

function parseSkillTable($, table) {
  // Columns in the rendered text include:
  // Level | Other skills | Quests needed | Diary | Difficulty | Task
  // We'll extract Diary, Difficulty, Task, and also keep Level/Other/Quests as notes.
  const rows = [];
  const tr = table.find("tr").toArray();

  // Skip header row(s)
  for (let i = 1; i < tr.length; i++) {
    const $tr = $(tr[i]);
    const tds = $tr.find("td").toArray();
    if (!tds.length) continue;

    // Some rows might be special (e.g. "Various / Multiple"); still keep them if task exists
    const cols = tds.map((td) => cleanText($(td).text()));

    // Try normal 6-column layout first
    // [0]=level, [1]=other skills, [2]=quests, [3]=diary, [4]=difficulty, [5]=task
    let level = cols[0] ?? "";
    let other = cols[1] ?? "";
    let quests = cols[2] ?? "";
    let diary = cols[3] ?? "";
    let difficulty = cols[4] ?? "";
    let task = cols[5] ?? "";

    // If layout differs, attempt to salvage by using last columns for diary/difficulty/task
    if (!task && cols.length >= 3) {
      task = cols.at(-1) ?? "";
      difficulty = cols.at(-2) ?? "";
      diary = cols.at(-3) ?? "";
      level = cols[0] ?? level;
    }

    task = cleanText(task);
    diary = cleanText(diary);
    difficulty = cleanText(difficulty);

    if (!task) continue;

    // Build a friendly text line that works well in your checklist UI
    // Example: "Falador (Easy): Climb over the western Falador wall. [Agility 5] (Quests: None)"
    const metaBits = [];
    if (level) metaBits.push(`Level: ${level}`);
    if (other && other !== "None") metaBits.push(`Other: ${other}`);
    if (quests && quests !== "None" && quests !== "Various") metaBits.push(`Quests: ${quests}`);

    const metaSuffix = metaBits.length ? ` (${metaBits.join(" | ")})` : "";

    rows.push({
      diary,
      difficulty,
      task,
      text: `${diary || "Multiple"} (${difficulty || "—"}): ${task}${metaSuffix}`,
      // Keep raw fields too in case you want to render them later
      level,
      other,
      quests,
    });
  }

  return rows;
}

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (skill-diary-generator)" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const sections = [];

  for (const skill of SKILLS) {
    const heading = detectSkillHeading($, skill);
    if (!heading || !heading.length) {
      console.warn(`No heading found for: ${skill}`);
      continue;
    }

    const table = findTableAfterHeading($, heading);
    if (!table) {
      console.warn(`No table found for: ${skill}`);
      continue;
    }

    const items = parseSkillTable($, table).map((r) => ({
      text: r.text,
      // Optional metadata you might use later:
      skill,
      diary: r.diary,
      tier: r.difficulty,
      level: r.level,
      other: r.other,
      quests: r.quests,
    }));

    sections.push({
      id: toSkillId(skill),
      title: `Achievement Diaries — ${skill}`,
      items,
    });
  }

  const out = `// AUTO-GENERATED FILE — do not edit by hand.
// Generated from: ${SOURCE_URL}
// Source tables: "Achievements by skill requirement" (Fandom)
// Generated at: ${new Date().toISOString()}

export const skillDiarySections = ${JSON.stringify(sections, null, 2)};
`;

  const outPath = path.join(__dirname, "..", "src", "data", "skillDiarySections.generated.js");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, "utf8");
  console.log(`Wrote ${sections.length} skill sections -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
