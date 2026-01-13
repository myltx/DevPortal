/* eslint-disable no-console */
const path = require("path");
const fs = require("fs/promises");
const { createSwaggerSpec } = require("next-swagger-doc");

async function main() {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "项目导航 API",
        version: "1.0",
      },
      security: [],
    },
  });

  const outPath = path.join(process.cwd(), "public", "openapi.json");
  await fs.writeFile(outPath, JSON.stringify(spec, null, 2), "utf8");
  console.log(`[openapi] generated: ${outPath}`);
}

main().catch((err) => {
  console.error("[openapi] failed:", err);
  process.exit(1);
});

