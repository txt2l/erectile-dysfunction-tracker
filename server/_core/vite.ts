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
      
      const actualTemplate = path.resolve(
        __dirname,
        "../..",
        "index.html"
      );
      
      const templatePath = fs.existsSync(actualTemplate) ? actualTemplate : clientTemplate;

      let template = await fs.promises.readFile(templatePath, "utf-8");
      
      const envVars = {
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "Ov23li5jr8IVlFngehZB",
        VITE_API_URL: process.env.VITE_API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN || "",
      };
      const envInjection = `<script>window.ENV_INJECTED = ${JSON.stringify(envVars)};</script>`;
      
      if (template.includes("</head>")) {
        template = template.replace("</head>", `${envInjection}</head>`);
      } else if (template.includes("<body>")) {
        template = template.replace("<body>", `<body>${envInjection}`);
      } else if (template.includes("</body>")) {
        template = template.replace("</body>", `${envInjection}</body>`);
      } else {
        template = envInjection + template;
      }

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
  const CLIENT_PATH = path.join(process.cwd(), "dist/client");

  console.log(`[Static] Serving files from: ${CLIENT_PATH}`);
  console.log("CLIENT BUILD EXISTS:", fs.existsSync(path.join(CLIENT_PATH, "index.html")));

  app.use(express.static(CLIENT_PATH, { index: false }));

  app.get("*", (req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ error: "Not Found" });
    }
    
    const indexPath = path.join(CLIENT_PATH, "index.html");
    
    if (fs.existsSync(indexPath)) {
      fs.readFile(indexPath, "utf8", (err, data) => {
        if (err) {
          return res.status(500).send("Error reading index.html");
        }
        
        const envVars = {
          GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "Ov23li5jr8IVlFngehZB",
          VITE_API_URL: process.env.VITE_API_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN || "",
        };
        
        const envScript = `<script>window.ENV_INJECTED = ${JSON.stringify(envVars)};</script>`;
        const html = envScript + data;
        
        console.log(`[Injection] Injected ENV_INJECTED:`, envVars);
        res.set("Content-Type", "text/html");
        res.send(html);
      });
    } else {
      console.error(`[Static] index.html not found at: ${indexPath}`);
      res.status(404).send(`Not Found: ${req.originalUrl} (Static path: ${CLIENT_PATH})`);
    }
  });
}
