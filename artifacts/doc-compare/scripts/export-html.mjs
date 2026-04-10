import { mkdir, copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist-standalone");

await mkdir(distDir, { recursive: true });
await copyFile(path.join(publicDir, "index-standalone.html"), path.join(distDir, "index.html"));
console.log(`Exported to ${path.join(distDir, "index.html")}`);
