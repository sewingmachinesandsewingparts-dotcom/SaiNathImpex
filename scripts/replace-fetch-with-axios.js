import fs from "fs";
import path from "path";

const root = path.resolve(".");
const extensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(res);
    if (extensions.has(path.extname(res))) return [res];
    return [];
  });
}

function ensureAxiosImport(content) {
  if (/\bimport\s+axios\s+from\s+["']axios["']/.test(content)) return content;
  if (/\bconst\s+axios\s*=\s*require\(["']axios["']\)/.test(content)) return content;

  const lines = content.split(/\r?\n/);
  let insertIndex = 0;
  if (lines[0].trim() === '"use client";' || lines[0].trim() === "'use client';") {
    insertIndex = 1;
  }

  for (let i = insertIndex; i < lines.length; i += 1) {
    if (/^import\s/.test(lines[i])) {
      insertIndex = i + 1;
    } else if (insertIndex === 0) {
      break;
    }
  }

  lines.splice(insertIndex, 0, "import axios from 'axios';");
  return lines.join("\n");
}

function transform(content) {
  if (!content.includes("fetch(")) return content;
  let updated = content;

  updated = updated.replace(/\bfetch\s*\(/g, "axios(");
  updated = updated.replace(/\bbody\s*:/g, "data:");
  updated = updated.replace(/\.json\(\)/g, ".data");

  return updated;
}

const files = walk(path.join(root, "src"));
let changedFiles = 0;
let changedLines = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("fetch(")) continue;
  let updated = transform(content);

  if (updated !== content) {
    if (updated.includes("axios(") && !/\bimport\s+axios\s+from\s+["']axios["']/.test(updated) && !/\bconst\s+axios\s*=\s*require\(["']axios["']\)/.test(updated)) {
      updated = ensureAxiosImport(updated);
    }
    fs.writeFileSync(file, updated, "utf8");
    changedFiles += 1;
    const origLines = content.split(/\r?\n/).length;
    const newLines = updated.split(/\r?\n/).length;
    changedLines += Math.abs(newLines - origLines);
    console.log(`Updated ${file}`);
  }
}

console.log(`Done. Updated ${changedFiles} files.`);
