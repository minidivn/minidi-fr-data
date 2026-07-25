/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".",
  base: "./",
  server: { port: 5174 },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
