// Đổi tên installer NSIS sau khi build: FocusBuddy_0.1.0_x64-setup.exe -> FocusBuddy_x64-setup.exe
import { readdirSync, renameSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nsisDir = join(root, "src-tauri", "target", "release", "bundle", "nsis");

if (!existsSync(nsisDir)) {
  console.error(`Không tìm thấy thư mục: ${nsisDir}`);
  process.exit(1);
}

const pattern = /^(.+?)_\d+\.\d+\.\d+.*?_(x64|x86|arm64)-setup\.exe$/;
let renamed = 0;

for (const file of readdirSync(nsisDir)) {
  const match = file.match(pattern);
  if (!match) continue;

  const [, name, arch] = match;
  const newName = `${name}_${arch}-setup.exe`;
  const target = join(nsisDir, newName);

  if (existsSync(target)) rmSync(target);
  renameSync(join(nsisDir, file), target);
  console.log(`Renamed: ${file} -> ${newName}`);
  renamed++;
}

if (renamed === 0) console.warn("Không có file installer nào để đổi tên.");
