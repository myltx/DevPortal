import axios from "axios";

// --- Types ---

interface SwaggerInfo {
  title: string;
  description?: string;
  version: string;
}

interface SwaggerTag {
  name: string;
  description?: string;
}

interface SwaggerOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  consumes?: string[];
  produces?: string[];
  parameters?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  responses?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  security?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  deprecated?: boolean;
}

interface SwaggerPathItem {
  get?: SwaggerOperation;
  post?: SwaggerOperation;
  put?: SwaggerOperation;
  delete?: SwaggerOperation;
  patch?: SwaggerOperation;
  options?: SwaggerOperation;
  head?: SwaggerOperation;
  parameters?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface SwaggerDoc {
  swagger: string;
  info: SwaggerInfo;
  host?: string;
  basePath?: string;
  tags?: SwaggerTag[];
  schemes?: string[];
  paths: Record<string, SwaggerPathItem>;
  definitions?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  securityDefinitions?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  parameters?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  responses?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface SwaggerResource {
  name: string;
  url: string;
  swaggerVersion: string;
  location: string;
}

interface MergeOptions {
  targetUrl: string;
  apiPrefix?: string;
  timeout?: number;
  debugLimit?: number;
}

// --- State ---

// In-memory cache: Map<string, { data: SwaggerDoc, timestamp: number }>
const cacheMap = new Map<string, { data: SwaggerDoc; timestamp: number }>();

// Request coalescing: Map<string, Promise<SwaggerDoc | null>>
const pendingRequests = new Map<string, Promise<SwaggerDoc | null>>();

const DEFAULT_TIMEOUT = 10000;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// --- Helpers ---

// Strips common Swagger UI suffixes and Hashes (#/login) to get the clean base Origin/Context
function normalizeBaseUrl(inputUrl: string): string {
  try {
    const u = new URL(inputUrl);
    
    // 1. Hash is automatically handled by URL object (u.hash separate from u.pathname)
    // u.toString() by default includes hash, so we reconstruct it without hash.
    
    // 2. Remove common file suffixes from Pathname
    const suffixes = [
        "/doc.html", 
        "/swagger-ui.html", 
        "/swagger-ui/index.html",
        "/swagger-ui/"
    ];
    
    for (const suffix of suffixes) {
        if (u.pathname.endsWith(suffix)) {
            u.pathname = u.pathname.substring(0, u.pathname.length - suffix.length);
            break; 
        }
    }
    
    // 3. Return clean URL (Protocol + Host + Path)
    // We construct it manually to ensure no Trailing Slash and No Hash
    const cleanPath = u.pathname.replace(/\/$/, "");
    return `${u.origin}${cleanPath}`;
    
  } catch (e) {
    // Fallback for invalid URLs (e.g. missing protocol)
    return inputUrl.split('#')[0].split('?')[0].replace(/\/$/, "");
  }
}

function getFullUrl(targetUrl: string, apiPrefix?: string): string {
  // Normalize the input target URL first
  const cleanTarget = normalizeBaseUrl(targetUrl);
  const prefix = apiPrefix ? apiPrefix.replace(/\/$/, "") : "";
  return prefix.startsWith("/") ? `${cleanTarget}${prefix}` : `${cleanTarget}/${prefix}`;
}

async function fetchSwaggerResources(baseFullUrl: string, timeout: number): Promise<SwaggerResource[]> {
  try {
    const url = `${baseFullUrl}/swagger-resources`;
    console.log(`[SwaggerMerge] Fetching resources from: ${url}`);
    const response = await axios.get(url, { timeout });
    return response.data;
  } catch (error: any) {
    console.warn(`[SwaggerMerge] Error fetching ${baseFullUrl}/swagger-resources:`, error.message);
    throw new Error(`Failed to fetch swagger resources from ${baseFullUrl}`);
  }
}

async function fetchGroupDocs(baseFullUrl: string, groupName: string, timeout: number): Promise<SwaggerDoc | null> {
  try {
    const encodedGroup = encodeURIComponent(groupName);
    const url = `${baseFullUrl}/v2/api-docs?group=${encodedGroup}`;
    console.log(`[SwaggerMerge] Fetching docs for group: ${groupName} (${url})`);
    
    const response = await axios.get(url, { timeout });
    return response.data;
  } catch (error: any) {
    console.warn(`[SwaggerMerge] Error fetching docs for group ${groupName}:`, error.message);
    return null;
  }
}

function mergeSwaggerDocs(docsList: { groupName: string; doc: SwaggerDoc }[]): SwaggerDoc | null {
  if (!docsList || docsList.length === 0) {
    return null;
  }

  // Find first valid doc to use as base template
  const firstValidEntry = docsList.find((x) => x && x.doc);
  if (!firstValidEntry) return null;
  const baseDoc = firstValidEntry.doc;

  const mergedDocs: SwaggerDoc = {
    swagger: "2.0",
    info: {
      title: "Merged API Documentation",
      description: "Aggregated Swagger documentation from multiple services/groups.",
      version: "1.0.0",
    },
    host: baseDoc.host,
    basePath: baseDoc.basePath || "/",
    tags: [],
    schemes: baseDoc.schemes || ["http", "https"],
    paths: {},
    definitions: {},
    securityDefinitions: {},
    parameters: {},
    responses: {},
  };

  const methods = ["get", "post", "put", "delete", "patch", "options", "head"] as const;

  docsList.forEach(({ groupName, doc }) => {
    if (!doc) return;

    // 1. Merge Definitions
    if (doc.definitions) {
      Object.assign(mergedDocs.definitions!, doc.definitions);
    }

    // 2. Merge Global Security/Params/Responses
    if (doc.securityDefinitions) {
      Object.assign(mergedDocs.securityDefinitions!, doc.securityDefinitions);
    }
    if (doc.parameters) {
      Object.assign(mergedDocs.parameters!, doc.parameters);
    }
    if (doc.responses) {
      Object.assign(mergedDocs.responses!, doc.responses);
    }

    // 3. Merge Tags
    if (doc.tags) {
      const existingTagNames = new Set(mergedDocs.tags!.map((t) => t.name));
      doc.tags.forEach((tag) => {
        if (!existingTagNames.has(tag.name)) {
          mergedDocs.tags!.push(tag);
          existingTagNames.add(tag.name);
        }
      });
    }

    // 3. Merge Paths & Inject Group Tags
    if (doc.paths) {
      for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
        // Deep clone to avoid mutating original or shared references
        // Using structuredClone (Node 17+ / Modern Browsers)
        const newPathItem = structuredClone(pathItem) as SwaggerPathItem;

        methods.forEach((method) => {
          const operation = newPathItem[method];
          if (operation) {
            // Processing Tags
            if (operation.tags && operation.tags.length > 0) {
               operation.tags = operation.tags.map((tag) => {
                 const newTagName = `${groupName}/${tag}`;
                 // Add to global tags if missing
                 if (!mergedDocs.tags!.find((t) => t.name === newTagName)) {
                    mergedDocs.tags!.push({
                        name: newTagName,
                        description: `Group: ${groupName}, Tag: ${tag}`
                    });
                 }
                 return newTagName;
               });
            } else {
                // Default tag
                const defaultTag = groupName;
                operation.tags = [defaultTag];
                if (!mergedDocs.tags!.find((t) => t.name === defaultTag)) {
                    mergedDocs.tags!.push({
                        name: defaultTag,
                        description: `API Group: ${defaultTag}`
                    });
                }
            }

            // Ordering Responses (200, 40001, 40003)
            if (operation.responses) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const orderedResponses: Record<string, any> = {};
                const targetKeys = ["200", "40001", "40003"];
                
                targetKeys.forEach(k => {
                    if (operation.responses![k]) {
                        orderedResponses[k] = operation.responses![k];
                    }
                });
                
                operation.responses = orderedResponses;
            }
          }
        });

        mergedDocs.paths[pathKey] = newPathItem;
      }
    }
  });

  return mergedDocs;
}


// --- Main Export ---

export async function getMergedSwagger(options: MergeOptions): Promise<SwaggerDoc | null> {
  const { targetUrl, apiPrefix, timeout = DEFAULT_TIMEOUT, debugLimit = 0 } = options;

  if (!targetUrl) {
    throw new Error("Missing required parameter: targetUrl");
  }

  const fullTargetUrl = getFullUrl(targetUrl, apiPrefix);
  const cacheKey = fullTargetUrl;

  // 1. Coalescing
  if (pendingRequests.has(cacheKey)) {
    console.log(`[SwaggerMerge] Coalescing request for ${fullTargetUrl}`);
    return pendingRequests.get(cacheKey)!;
  }

  // 2. Cache Check
  const now = Date.now();
  const cached = cacheMap.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    console.log(`[SwaggerMerge] Cache HIT for ${fullTargetUrl}`);
    return cached.data;
  }

  // 3. Execution
  const taskPromise = (async () => {
    try {
        let resources = await fetchSwaggerResources(fullTargetUrl, timeout);
        
        if (!Array.isArray(resources)) {
            // Some services might return object-wrapped or non-standard
            // Fallback: try to see if accessing /v2/api-docs directly works (single group)
            // But here strict mode for now
             throw new Error("Invalid swagger-resources response. Expected an array.");
        }

        if (debugLimit > 0) {
            resources = resources.slice(0, debugLimit);
        }

        const fetchPromises = resources.map(async (res) => {
            const doc = await fetchGroupDocs(fullTargetUrl, res.name, timeout);
            return { groupName: res.name, doc };
        });

        const results = await Promise.all(fetchPromises);
        const validResults = results.filter(r => r.doc !== null) as { groupName: string; doc: SwaggerDoc }[];
        
        const merged = mergeSwaggerDocs(validResults);
        
        if (merged) {
            cacheMap.set(cacheKey, {
                data: merged,
                timestamp: Date.now()
            });

            // Cleanup cache if too large
            if (cacheMap.size > 50) {
                // Delete oldest logic omitted, just clear half? or clear all simple
                cacheMap.clear();
                // re-set current
                cacheMap.set(cacheKey, { data: merged, timestamp: Date.now() });
            }
        }
        
        return merged;

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        throw e;
    } finally {
        pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, taskPromise);
  return taskPromise;
}
