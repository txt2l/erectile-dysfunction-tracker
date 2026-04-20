import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the server is bundled into dist/index.js
  // The static files are in dist/public
  // We try multiple ways to resolve the path to be extremely robust
  const pathsToTry = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
  ];

  let distPath = "";
  for (const p of pathsToTry) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"))) {
      distPath = p;
      break;
    }
  }

  if (!distPath) {
    console.error(
      `Could not find the build directory in any of: ${pathsToTry.join(", ")}`
    );
    // Fallback to the first one just in case
    distPath = pathsToTry[0];
  } else {
    console.log(`[Static] Serving files from: ${distPath}`);
  }

  // Serve static files from the resolved directory
  app.use(express.static(distPath));

  // Fall through to index.html for all other routes (SPA support)
  app.use("*", (req, res) => {
    // Skip API routes
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "Not Found" });
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`Not Found: ${req.originalUrl} (Static path: ${distPath})`);
    }
  });
}
