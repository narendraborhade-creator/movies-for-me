import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import https from "node:https";

const TMDB_IPS = ["3.175.86.37", "3.175.86.50", "3.175.86.67", "3.175.86.103"];
let currentIpIdx = 0;

function tmdbProxyPlugin() {
  return {
    name: "tmdb-proxy",
    configureServer(server) {
      server.middlewares.use("/tmdb", (req, res) => {
        const ip = TMDB_IPS[currentIpIdx % TMDB_IPS.length];
        const headers = { ...req.headers, host: "api.themoviedb.org" };
        delete headers["content-length"];

        const options = {
          hostname: ip,
          port: 443,
          path: "/3" + (req.url || ""),
          method: req.method || "GET",
          headers,
          servername: "api.themoviedb.org",
        };

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on("error", (err) => {
          currentIpIdx++;
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "TMDB proxy error", message: err.message }));
        });

        req.pipe(proxyReq);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const isDist = process.env.ELECTRON_DIST === "1";
  return {
    plugins: [react(), tmdbProxyPlugin()],
    base: isDist ? "./" : "/",
    server: {
      port: 5173,
      host: true,
    },
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isDist,
          drop_debugger: isDist,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            settings: ["./src/pages/SettingsPage"],
            movie: ["./src/pages/MoviePage"],
            tv: ["./src/pages/TVPage"],
            downloads: ["./src/pages/DownloadsPage"],
          },
        },
      },
    },
  };
});
