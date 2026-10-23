import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

const tauriResult = spawnSync("tauri", args, {
  stdio: "inherit",
  shell: true,
});

if (tauriResult.status !== 0) {
  process.exit(tauriResult.status ?? 1);
}

if (args[0] === "build") {
  const renameResult = spawnSync(process.execPath, ["scripts/rename-installer.js"], {
    stdio: "inherit",
    shell: false,
  });

  process.exit(renameResult.status ?? 1);
}
