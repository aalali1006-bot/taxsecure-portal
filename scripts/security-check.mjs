import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const excluded = new Set(["node_modules", ".git", "dist", ".manus-logs", ".turbo"]);
const ignoredExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".lock"]);
const patterns = [
  { label: "private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "GitHub token", regex: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { label: "AWS access key", regex: /AKIA[0-9A-Z]{16}/ },
  { label: "generic secret assignment", regex: /(?:api[_-]?key|client[_-]?secret|password)\s*[:=]\s*["'][^"']{12,}["']/i },
];

function listFiles(directory) {
  return readdirSync(directory).flatMap(entry => {
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) return excluded.has(entry) ? [] : listFiles(absolute);
    return [absolute];
  });
}

const findings = [];
for (const file of listFiles(root)) {
  const ext = file.slice(file.lastIndexOf("."));
  if (ignoredExtensions.has(ext)) continue;
  const content = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) findings.push(`${pattern.label}: ${relative(root, file)}`);
  }
}

if (findings.length) {
  console.error("Potential secrets detected. Remove them before publishing:\n" + findings.join("\n"));
  process.exit(1);
}

console.log("Secret guard passed: no high-confidence credential patterns found.");
