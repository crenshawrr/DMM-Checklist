// api/hiscore.js
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  const player = (req.query.player || "").trim();
  const typeRaw = (req.query.type || "STANDARD").trim().toUpperCase();

  if (!player) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(400).send("Missing ?player=");
  }

  // Map friendly types -> hiscore endpoints
  // Standard: /m=hiscore_oldschool/
  // Ironman / Hardcore / Ultimate: /m=hiscore_oldschool_ironman|.../
  // Deadman: /m=hiscore_oldschool_deadman/
  // Seasonal: /m=hiscore_oldschool_seasonal/
  const TYPE_TO_PATH = {
    STANDARD: "hiscore_oldschool",
    IRONMAN: "hiscore_oldschool_ironman",
    HARDCORE_IRONMAN: "hiscore_oldschool_hardcore_ironman",
    ULTIMATE_IRONMAN: "hiscore_oldschool_ultimate",
    DEADMAN: "hiscore_oldschool_deadman",
    SEASONAL: "hiscore_oldschool_seasonal",
  };

  const modePath = TYPE_TO_PATH[typeRaw] || TYPE_TO_PATH.STANDARD;

  const upstream =
    `https://secure.runescape.com/m=${modePath}/index_lite.ws?player=` +
    encodeURIComponent(player);

  try {
    const r = await fetch(upstream, {
      headers: {
        "User-Agent": "Mozilla/5.0 (osrs-hiscore-proxy)",
        Accept: "text/plain,*/*",
      },
    });

    const text = await r.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");

    return res.status(r.status).send(text);
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(502).send("Upstream fetch failed.");
  }
}
