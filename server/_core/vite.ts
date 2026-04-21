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
  // Use path.join(process.cwd(), "dist/client") as per schema for robust Railway path resolution
  const CLIENT_PATH = path.join(process.cwd(), "dist/client");

  console.log(`[Static] Serving files from: ${CLIENT_PATH}`);
  
  // CRITICAL VERIFICATION STEP (AS PER SCHEMA)
  console.log("CLIENT BUILD EXISTS:", fs.existsSync(path.join(CLIENT_PATH, "index.html")));

  // 1. SERVE STATIC FRONTEND
  app.use(express.static(CLIENT_PATH, { index: false }));

  // 2. SPA FALLBACK ROUTE (CRITICAL FIX)
  app.get("*", (req, res) => {
    // Skip API routes
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "Not Found" });
    }
    
    const indexPath = path.join(CLIENT_PATH, "index.html");
    
    if (fs.existsSync(indexPath)) {
      // Use sendFile as per schema for robust SPA routing
      res.sendFile(indexPath);
    } else {
      console.error(`[Static] index.html not found at: ${indexPath}`);
      res.status(404).send(`Not Found: ${req.originalUrl} (Static path: ${CLIENT_PATH})`);
    }
  });
}
