import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../..");
const MANIFEST_PATH = path.join(ROOT_DIR, "chrome-extension", "manifest.json");
const PUBLIC_EXTENSION_DIR = path.join(ROOT_DIR, "public", "extension");
const ARTIFACT_EXTENSION_DIR = path.join(ROOT_DIR, "artifacts", "extension");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyArchive(fileName) {
  fs.copyFileSync(
    path.join(PUBLIC_EXTENSION_DIR, fileName),
    path.join(ARTIFACT_EXTENSION_DIR, fileName),
  );
}

async function main() {
  console.log("🚀 Starting Chrome Extension Packaging...\n");

  // 1. Read current version
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Error: manifest.json not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const currentVersion = manifest.version;
  console.log(`ℹ️  Current Version: ${currentVersion}`);

  // 2. Ask for new version
  const newVersion = await askQuestion(
    `❓ Enter new version (default: ${currentVersion}): `,
  );
  const finalVersion = newVersion.trim() || currentVersion;

  if (finalVersion !== currentVersion) {
    manifest.version = finalVersion;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated manifest.json to version ${finalVersion}`);
  } else {
    console.log("ℹ️  Version unchanged.");
  }

  // 3. Package (Zip)
  console.log("\n📦 Packaging extension...");
  try {
    ensureDir(PUBLIC_EXTENSION_DIR);
    ensureDir(ARTIFACT_EXTENSION_DIR);

    const zipFileName = `chrome-extension-v${finalVersion}.zip`;
    // Command: cd chrome-extension && zip -r ../public/extension/filename.zip . -x "*.DS_Store"
    const cmd = `cd chrome-extension && zip -r ../public/extension/${zipFileName} . -x "*.DS_Store"`;

    execSync(cmd, { cwd: ROOT_DIR, stdio: "inherit" });

    // Create 'latest' copy for runtime download
    const latestFileName = "chrome-extension-latest.zip";
    fs.copyFileSync(
      path.join(PUBLIC_EXTENSION_DIR, zipFileName),
      path.join(PUBLIC_EXTENSION_DIR, latestFileName),
    );

    // Keep a clean archive outside the repo root's top-level.
    copyArchive(zipFileName);
    copyArchive(latestFileName);

    console.log(`✅ Successfully created public/extension/${zipFileName}`);
    console.log(`✅ Successfully updated public/extension/${latestFileName}`);
    console.log(`✅ Archive copied to artifacts/extension/${zipFileName}`);
    console.log(`✅ Archive copied to artifacts/extension/${latestFileName}`);
    console.log(`🔗 Download URL (Versioned): /extension/${zipFileName}`);
    console.log(`🔗 Download URL (Latest):    /extension/${latestFileName}`);
  } catch (error) {
    console.error("❌ Failed to zip extension:", error.message);
    process.exit(1);
  }

  console.log("\n✨ Done!");
  rl.close();
}

main();
