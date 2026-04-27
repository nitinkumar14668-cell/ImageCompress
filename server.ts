import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set strong Cache-Control headers to optimize backend response times
  app.use((req, res, next) => {
    // Let Vite handle its own caching during dev, but we can set generic headers for other assets
    // If it's an image or static asset, give it max-age
    if (req.path.match(/\.(jpg|jpeg|png|webp|svg|ico|css|js|woff2?)$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      // Default to slightly aggressive caching for document if no specific route
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    }
    next();
  });

  // API Route for health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    // In development mode, use Vite as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache"); // HTML always fresh
        }
      }
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`⚡ Caching enabled for static assets and API routes to reduce latency.`);
  });
}

startServer();
