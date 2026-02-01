export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  const player = (req.query.player || "").trim();
  if (!player) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(400).send("Missing ?player=");
  }

  const upstream =
    "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=" +
    encodeURIComponent(player);

  try {
    const r = await fetch(upstream, {
      headers: {
        "User-Agent": "Mozilla/5.0 (osrs-hiscore-proxy)",
        Accept: "text/plain,*/*"
      }
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
