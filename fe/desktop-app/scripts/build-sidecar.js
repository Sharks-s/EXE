import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const botDir = resolve(appDir, "python-bot");
const specPath = resolve(botDir, "focusbuddy-bot.spec");

const pyInstaller = process.platform === "win32" ? "pyinstaller.exe" : "pyinstaller";
const buildResult = spawnSync(pyInstaller, ["--noconfirm", "--clean", specPath], {
  cwd: botDir,
  stdio: "inherit",
  shell: false,
});

if (buildResult.error) {
  console.error(`Could not start PyInstaller: ${buildResult.error.message}`);
  process.exit(1);
}

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const extension = process.platform === "win32" ? ".exe" : "";
const source = resolve(botDir, "dist", `focusbuddy-bot${extension}`);

const rustcResult = spawnSync("rustc", ["-vV"], {
  cwd: appDir,
  encoding: "utf8",
  shell: false,
});
const hostMatch = rustcResult.stdout?.match(/^host:\s*(.+)$/m);
const targetTriple = process.env.TAURI_ENV_TARGET_TRIPLE || hostMatch?.[1]?.trim();

if (!targetTriple) {
  console.error("Could not determine the Rust target triple for the Tauri sidecar.");
  process.exit(1);
}

if (!existsSync(source)) {
  console.error(`PyInstaller output was not found at ${source}`);
  process.exit(1);
}

const destination = resolve(
  appDir,
  "src-tauri",
  "binaries",
  `focusbuddy-bot-${targetTriple}${extension}`,
);

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
console.log(`Updated Tauri sidecar: ${destination}`);
