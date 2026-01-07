import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api", // Define which folder to scan for JSDoc
    definition: {
      openapi: "3.0.0",
      info: {
        title: "项目导航 API",
        version: "1.0",
      },
      security: [],
    },
  });
  return spec;
};
