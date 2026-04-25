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
        __dirname,
        "../..",
        "src",
        "main.tsx"
      );
      
      // For development, we use the src/main.tsx as the template
      // Vite will transform it into the full HTML page
      const actualTemplate = path.resolve(
        __dirname,
        "../..",
        "index.html"
      );
      
      const templatePath = fs.existsSync(actualTemplate) ? actualTemplate : clientTemplate;

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(templatePath, "utf-8");
      
      // Inject runtime environment variables
      const envInjection = `<script>window.ENV_INJECTED = ${JSON.stringify({
        VITE_OAUTH_PORTAL_URL: process.env.VITE_OAUTH_PORTAL_URL || process.env.OAUTH_PORTAL_URL || process.env.OAUTH_SERVER_URL,
        VITE_APP_ID: process.env.VITE_APP_ID || process.env.APP_ID,
        VITE_API_URL: process.env.VITE_API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN,
      })};</script>`;
      template = template.replace("</head>", `${envInjection}</head>`);

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
      // Inject runtime environment variables into the static index.html
      fs.readFile(indexPath, "utf8", (err, data) => {
        if (err) {
          return res.status(500).send("Error reading index.html");
        }
        const portalUrl = process.env.VITE_OAUTH_PORTAL_URL || process.env.OAUTH_PORTAL_URL || process.env.OAUTH_SERVER_URL;
        console.log(`[Injection] Serving index.html with Portal URL: ${portalUrl ? "FOUND" : "NOT FOUND"}`);
        
        const envInjection = `<script>window.ENV_INJECTED = ${JSON.stringify({
          VITE_OAUTH_PORTAL_URL: portalUrl,
          VITE_APP_ID: process.env.VITE_APP_ID || process.env.APP_ID,
          VITE_API_URL: process.env.VITE_API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN,
        })};</script>`;
        const html = data.replace("</head>", `${envInjection}</head>`);
        res.send(html);
      });
    } else {
      console.error(`[Static] index.html not found at: ${indexPath}`);
      res.status(404).send(`Not Found: ${req.originalUrl} (Static path: ${CLIENT_PATH})`);
    }
  });
}
