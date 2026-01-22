const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const MANIFEST_PATH = path.join(__dirname, "../chrome-extension/manifest.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
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
    const rootDir = path.join(__dirname, "..");
    const outputDir = path.join(rootDir, "public", "extension");

    // Ensure output dir exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zipFileName = `chrome-extension-v${finalVersion}.zip`;
    // Command: cd chrome-extension && zip -r ../public/extension/filename.zip . -x "*.DS_Store"
    const cmd = `cd chrome-extension && zip -r ../public/extension/${zipFileName} . -x "*.DS_Store"`;

    execSync(cmd, { cwd: rootDir, stdio: "inherit" });

    // Create 'latest' copy
    const latestFileName = "chrome-extension-latest.zip";
    fs.copyFileSync(
      path.join(outputDir, zipFileName),
      path.join(outputDir, latestFileName),
    );

    console.log(`✅ Successfully created public/extension/${zipFileName}`);
    console.log(`✅ Successfully updated public/extension/${latestFileName}`);
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
