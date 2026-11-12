export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const DEFAULT_TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzYmIyYmJlM2JlNGI4Mzg2M2M0YTM4Y2E1YjRhNTc5ZiIsIm5iZiI6MTc5NDM5Mzc5OC4zNDYsInN1YiI6IjZhZjQ0NmM2MTE3OTQyYmZiM2M1NzdhNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.KcXO0lmhq7utzmF1lYDs4mCqBY7sB16F7muuRgMUxHY";

  try {
    // Extract endpoint path
    let tmdbPath = req.url || "";
    tmdbPath = tmdbPath.replace(/^\/api\/tmdb\/?/, "").replace(/^\/tmdb\/?/, "");

    // Determine auth token or key
    let authHeader = req.headers.authorization;
    let apiKeyParam = null;

    if (!authHeader) {
      const serverToken =
        process.env.VITE_TMDB_READ_TOKEN ||
        process.env.TMDB_READ_TOKEN ||
        process.env.TMDB_TOKEN ||
        DEFAULT_TOKEN;

      const serverKey =
        process.env.VITE_TMDB_API_KEY ||
        process.env.TMDB_API_KEY ||
        process.env.TMDB_KEY;

      if (serverToken && serverToken.startsWith("eyJ")) {
        authHeader = `Bearer ${serverToken}`;
      } else if (serverKey) {
        apiKeyParam = serverKey;
      } else {
        authHeader = `Bearer ${DEFAULT_TOKEN}`;
      }
    } else {
      const raw = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (!raw.startsWith("eyJ") && raw.length === 32) {
        apiKeyParam = raw;
        authHeader = undefined;
      }
    }

    const sep = tmdbPath.includes("?") ? "&" : "?";
    const targetUrl = apiKeyParam
      ? `https://api.themoviedb.org/3/${tmdbPath}${sep}api_key=${apiKeyParam}`
      : `https://api.themoviedb.org/3/${tmdbPath}`;

    const headers = {
      Host: "api.themoviedb.org",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MoviesForMe/2.7.0",
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const tmdbRes = await fetch(targetUrl, {
      method: req.method || "GET",
      headers,
    });

    const data = await tmdbRes.json();
    return res.status(tmdbRes.status).json(data);
  } catch (err) {
    return res.status(502).json({
      error: "TMDB proxy error",
      message: err.message,
    });
  }
}
