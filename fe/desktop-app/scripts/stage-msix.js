import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const releaseDir = join(root, "src-tauri", "target", "release");
const stageDir = join(root, "msix-dist");
const assetsDir = join(root, "Assets");

const files = [
  ["desktop-app.exe", "desktop-app.exe"],
  ["focusbuddy-bot.exe", "focusbuddy-bot.exe"],
];

rmSync(stageDir, { recursive: true, force: true });
mkdirSync(stageDir, { recursive: true });

for (const [sourceName, targetName] of files) {
  const source = join(releaseDir, sourceName);
  if (!existsSync(source)) {
    throw new Error(`Missing release artifact: ${source}`);
  }

  cpSync(source, join(stageDir, targetName));
}

const releaseResources = join(releaseDir, "resources");
if (existsSync(releaseResources)) {
  cpSync(releaseResources, join(stageDir, "resources"), { recursive: true });
}

if (existsSync(assetsDir)) {
  cpSync(assetsDir, join(stageDir, "Assets"), { recursive: true });
}

console.log(`MSIX staging folder ready: ${stageDir}`);
