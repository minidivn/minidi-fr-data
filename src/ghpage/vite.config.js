/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, "../../docs");

export default defineConfig({
  root: ".",
  base: "./",
  build: { outDir: "../../docs", emptyOutDir: false, sourcemap: false },
  server: { port: 5173 },
  plugins: [
    {
      name: "docs-data",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url, "http://localhost").pathname;
          const filePath = path.join(docsDir, url);
          if (
            url.endsWith(".json") &&
            fs.existsSync(filePath) &&
            fs.statSync(filePath).isFile()
          ) {
            res.writeHead(200, { "Content-Type": "application/json" });
            fs.createReadStream(filePath).pipe(res);
            return;
          }
          next();
        });
      },
    },
  ],
});
