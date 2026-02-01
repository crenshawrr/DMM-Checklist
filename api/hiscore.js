// api/hiscore.js
function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseNumber(s) {
  // convert "19,677" -> 19677, empty -> -1
  const t = stripTags(s).replace(/,/g, "").trim();
  if (!t) return -1;
  const n = Number(t);
  return Number.isFinite(n) ? n : -1;
}

function buildLiteCsvFromTable(html) {
  // We output the 24-line OSRS index_lite skill block:
  // Overall + 23 skills (no commas in numbers)
  const SKILLS = [
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

  // Find all rows. The hiscorepersonal table is simple enough to regex.
  const rowRe = /<tr[\s\S]*?>[\s\S]*?<\/tr>/gi;
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  const rows = String(html || "").match(rowRe) || [];

  // Map skill -> {rank, level, xp}
  const map = new Map();

  for (const row of rows) {
    // extract all <td>...</td>
    const tds = [];
    let m;
    while ((m = tdRe.exec(row)) !== null) {
      tds.push(m[1]);
    }
    tdRe.lastIndex = 0;

    // Expect: [Skill, Rank, Level, XP]
    if (tds.length < 4) continue;

    const skill = stripTags(tds[0]);
    if (!SKILLS.includes(skill)) continue;

    const rank = parseNumber(tds[1]);
    const level = parseNumber(tds[2]);
    const xp = parseNumber(tds[3]);

    map.set(skill, { rank, level, xp });
  }

  // Fill missing with -1,-1,-1 like official index_lite
  const lines = SKILLS.map((sk) => {
    const v = map.get(sk) || { rank: -1, level: -1, xp: -1 };
    return `${v.rank},${v.level},${v.xp}`;
  });

  return lines.join("\n") + "\n";
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    // allow common headers if browser sends them
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  const player = (req.query.player || "").trim();
  const typeRaw = String(req.query.type || "STANDARD").trim().toUpperCase();
  const aRaw = (req.query.a || "").toString().trim(); // tournament a=13

  if (!player) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(400).send("Missing ?player=");
  }

  const TYPE_TO_MODE = {
    STANDARD: "hiscore_oldschool",
    IRONMAN: "hiscore_oldschool_ironman",
    HARDCORE_IRONMAN: "hiscore_oldschool_hardcore_ironman",
    ULTIMATE_IRONMAN: "hiscore_oldschool_ultimate",
    DEADMAN: "hiscore_oldschool_deadman",
    SEASONAL: "hiscore_oldschool_seasonal",
    DEADMAN_TOURNAMENT: "hiscore_oldschool_tournament",
  };

  const mode = TYPE_TO_MODE[typeRaw] || TYPE_TO_MODE.STANDARD;

  let upstreamUrl = "";
  let responseText = "";

  try {
    if (mode === "hiscore_oldschool_tournament") {
      // ✅ Match the exact page the browser uses:
      // https://secure.runescape.com/m=hiscore_oldschool_tournament/a=13/hiscorepersonal?user1=name
      let base = `https://secure.runescape.com/m=${mode}/`;
      if (/^\d+$/.test(aRaw)) base += `a=${aRaw}/`;
      upstreamUrl = `${base}hiscorepersonal?user1=${encodeURIComponent(player)}`;

      const r = await fetch(upstreamUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (osrs-hiscore-proxy)",
          Accept: "text/html,*/*",
        },
      });

      const html = await r.text();

      // Convert HTML -> lite CSV (24 lines)
      responseText = buildLiteCsvFromTable(html);

      // Still return 200 even if parsing fails to find rows (it will output -1s)
      res.setHeader("X-Hiscore-Mode", mode);
      res.setHeader("X-Upstream-URL", upstreamUrl);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.setHeader("CDN-Cache-Control", "no-store");
      res.setHeader("Vercel-CDN-Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");

      return res.status(200).send(responseText);
    }

    // All other modes: use official lite CSV
    upstreamUrl =
      `https://secure.runescape.com/m=${mode}/index_lite.ws?player=` +
      encodeURIComponent(player);

    const r = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (osrs-hiscore-proxy)",
        Accept: "text/plain,*/*",
      },
    });

    responseText = await r.text();

    res.setHeader("X-Hiscore-Mode", mode);
    res.setHeader("X-Upstream-URL", upstreamUrl);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");

    return res.status(r.status).send(responseText);
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(502).send("Upstream fetch failed.");
  }
}
