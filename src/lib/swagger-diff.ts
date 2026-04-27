type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type SwaggerLikeDoc = {
  paths?: Record<string, unknown>;
};

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
]);

type OperationNormalized = {
  tags: JsonValue;
  parameters: JsonValue;
  requestBody: JsonValue;
  responses: JsonValue;
  deprecated: JsonValue;
  security: JsonValue;
};

type OperationDiffRow = {
  key: string;
  method: string;
  path: string;
};

export type OperationChangedRow = OperationDiffRow & {
  changedFields: Array<keyof OperationNormalized>;
};

export type SwaggerDiffResult = {
  summary: {
    beforeTotal: number;
    afterTotal: number;
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  added: OperationDiffRow[];
  removed: OperationDiffRow[];
  changed: OperationChangedRow[];
};

function canonicalize(value: unknown): JsonValue {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const normalized: Record<string, JsonValue> = {};
    for (const [k, v] of entries) {
      normalized[k] = canonicalize(v);
    }
    return normalized;
  }

  return String(value);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function normalizeTags(tags: unknown): JsonValue {
  if (!Array.isArray(tags)) return [];
  return [...tags.map((x) => String(x))].sort();
}

function normalizeParameters(parameters: unknown): JsonValue {
  if (!Array.isArray(parameters)) return [];
  const rows = parameters.map((item) => canonicalize(item));
  return rows.sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
}

function normalizeOperation(operation: Record<string, unknown>): OperationNormalized {
  return {
    tags: normalizeTags(operation.tags),
    parameters: normalizeParameters(operation.parameters),
    requestBody: canonicalize(operation.requestBody ?? null),
    responses: canonicalize(operation.responses ?? {}),
    deprecated: Boolean(operation.deprecated),
    security: canonicalize(operation.security ?? []),
  };
}

function parseKey(key: string): OperationDiffRow {
  const spaceIndex = key.indexOf(" ");
  const method = spaceIndex > 0 ? key.slice(0, spaceIndex) : "UNKNOWN";
  const path = spaceIndex > 0 ? key.slice(spaceIndex + 1) : key;
  return { key, method, path };
}

function extractOperations(doc: SwaggerLikeDoc): Map<string, OperationNormalized> {
  const map = new Map<string, OperationNormalized>();
  const paths = doc?.paths ?? {};

  for (const path of Object.keys(paths)) {
    const pathItem = paths[path];
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const [method, rawOperation] of Object.entries(pathItem)) {
      const methodLower = method.toLowerCase();
      if (!HTTP_METHODS.has(methodLower)) continue;
      if (!rawOperation || typeof rawOperation !== "object") continue;

      const key = `${methodLower.toUpperCase()} ${path}`;
      map.set(key, normalizeOperation(rawOperation as Record<string, unknown>));
    }
  }

  return map;
}

export function diffSwaggerDocs(beforeDoc: SwaggerLikeDoc, afterDoc: SwaggerLikeDoc): SwaggerDiffResult {
  const beforeMap = extractOperations(beforeDoc);
  const afterMap = extractOperations(afterDoc);

  const beforeKeys = new Set(beforeMap.keys());
  const afterKeys = new Set(afterMap.keys());

  const added: OperationDiffRow[] = [];
  const removed: OperationDiffRow[] = [];
  const changed: OperationChangedRow[] = [];
  let unchanged = 0;

  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      removed.push(parseKey(key));
      continue;
    }

    const beforeOp = beforeMap.get(key)!;
    const afterOp = afterMap.get(key)!;

    const changedFields = (Object.keys(beforeOp) as Array<keyof OperationNormalized>).filter(
      (field) => stableStringify(beforeOp[field]) !== stableStringify(afterOp[field]),
    );

    if (changedFields.length > 0) {
      changed.push({
        ...parseKey(key),
        changedFields,
      });
    } else {
      unchanged += 1;
    }
  }

  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) {
      added.push(parseKey(key));
    }
  }

  added.sort((a, b) => a.key.localeCompare(b.key));
  removed.sort((a, b) => a.key.localeCompare(b.key));
  changed.sort((a, b) => a.key.localeCompare(b.key));

  return {
    summary: {
      beforeTotal: beforeMap.size,
      afterTotal: afterMap.size,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      unchanged,
    },
    added,
    removed,
    changed,
  };
}
