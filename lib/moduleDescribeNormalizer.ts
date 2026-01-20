function normalizeNewlines(text: string): string {
  return String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizePunctuation(text: string): string {
  return String(text ?? "")
    .replace(/：/g, ":")
    .replace(/，/g, ",")
    .replace(/；/g, ";")
    .replace(/\t/g, " ");
}

function normalizeWhitespace(text: string): string {
  return String(text ?? "")
    .split("\n")
    .map((l) => l.trim().replace(/\s+/g, " "))
    .join("\n")
    .trim();
}

export function normalizeDescribeMinimal(text: string): string {
  return normalizeWhitespace(normalizePunctuation(normalizeNewlines(text)));
}

function looksLikeUrl(text: string): boolean {
  const t = String(text ?? "").trim();
  return /^https?:\/\/\S+$/i.test(t);
}

function isLabelOnlyLine(text: string): boolean {
  const t = String(text ?? "").trim();
  if (!t) return false;
  if (looksLikeUrl(t)) return false;
  if (!t.endsWith(":")) return false;
  const label = t.slice(0, -1).trim();
  if (!label) return false;
  if (label.length > 30) return false;
  if (/^https?$/i.test(label)) return false;
  return true;
}

function looksLikeLabelKey(labelText: string): boolean {
  const label = String(labelText ?? "").trim();
  if (!label) return false;
  if (label.length > 30) return false;
  if (looksLikeUrl(label)) return false;
  if (label.includes("/")) return false;
  if (!(/[\u4e00-\u9fff]/.test(label) || /[A-Za-z]/.test(label))) return false;
  if (/\d{7,}/.test(label)) return false;
  if (/[-—–]/.test(label) && /\d/.test(label)) return false;
  return true;
}

function splitOnce(text: string, sep: string): [string, string] | null {
  const idx = text.indexOf(sep);
  if (idx === -1) return null;
  return [text.slice(0, idx), text.slice(idx + sep.length)];
}

function splitColumns(line: string): string[] {
  return String(line ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function parseTableRow3(line: string): { subLabel: string; user: string; pass: string } | null {
  const cols = splitColumns(line);
  if (cols.length !== 3) return null;
  const [subLabel, user, pass] = cols;
  // 子项一般是中文或字母，避免把 URL/path 之类误判成子项
  if (!/[\u4e00-\u9fff]/.test(subLabel) && !/[A-Za-z]/.test(subLabel)) return null;
  if (looksLikeUrl(subLabel) || looksLikeUrl(user) || looksLikeUrl(pass)) return null;
  if (subLabel.endsWith(":")) return null;
  if (subLabel.length > 30) return null;
  return { subLabel, user, pass };
}

function parseTableRow2(line: string): { subLabel: string; user: string } | null {
  const cols = splitColumns(line);
  if (cols.length !== 2) return null;
  const [subLabel, user] = cols;
  if (!/[\u4e00-\u9fff]/.test(subLabel) && !/[A-Za-z]/.test(subLabel)) return null;
  if (looksLikeUrl(subLabel) || looksLikeUrl(user)) return null;
  if (subLabel.endsWith(":")) return null;
  if (subLabel.length > 30) return null;
  return { subLabel, user };
}

function makeNestedLabel(parent: string, child: string): string {
  const p = String(parent ?? "").trim();
  const c = String(child ?? "").trim();
  if (!p) return c || "账号";
  if (!c) return p;
  return `${p}-${c}`;
}

type ParsedPair =
  | { user: string; pass: string; rule: "kv-pair" | "slash" | "dash" }
  | { label: string; user: string; pass: string; rule: "triple-dash" };

function parseAccountPasswordFromValue(valueText: string): ParsedPair | null {
  const v = String(valueText ?? "").trim();
  if (!v) return null;

  const both =
    /(?:账号|account|user(?:name)?)\s*[:=]\s*(?<user>\S+).*(?:密码|password|pass(?:wd)?)\s*[:=]\s*(?<pass>\S+)/i.exec(
      v,
    );
  if (both?.groups?.user && both?.groups?.pass) {
    return { user: both.groups.user, pass: both.groups.pass, rule: "kv-pair" };
  }

  const slashSplit = splitOnce(v, "/");
  if (slashSplit) {
    const left = slashSplit[0].trim();
    const right = slashSplit[1].trim();
    if (left && right) return { user: left, pass: right, rule: "slash" };
  }

  const hasDash = /[-—–]/.test(v);
  if (hasDash) {
    const parts = v
      .split(/[-—–]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      if (/[\u4e00-\u9fff]/.test(parts[0])) {
        return {
          label: parts[0],
          user: parts[1],
          pass: parts.slice(2).join("-"),
          rule: "triple-dash",
        };
      }
      return { user: parts[0], pass: parts.slice(1).join("-"), rule: "dash" };
    }
    if (parts.length === 2) return { user: parts[0], pass: parts[1], rule: "dash" };
  }

  return null;
}

type Group = { label: string; creds: Array<{ user: string; pass: string }>; urls: string[]; notes: string[] };

export function normalizeModuleDescribeConservative(input: string): {
  minimal: string;
  normalized: string;
  changed: boolean;
  hasStructureSignals: boolean;
} {
  const minimal = normalizeDescribeMinimal(normalizePunctuation(normalizeNewlines(input)));
  const lines = minimal ? minimal.split("\n").filter(Boolean) : [];

  const groups = new Map<string, Group>();
  const ensureGroup = (label: string | null | undefined): Group => {
    const key = label || "备注";
    const existing = groups.get(key);
    if (existing) return existing;
    const created: Group = { label: key, creds: [], urls: [], notes: [] };
    groups.set(key, created);
    return created;
  };

  let currentLabel: string | null = null;
  let pendingCredLabel: string | null = null;
  let pendingUser: string | null = null;

  const ruleHits = {
    labelValue: 0,
    labelOnly: 0,
    urlLine: 0,
    extractedCredentials: 0,
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (looksLikeUrl(line)) {
      ruleHits.urlLine += 1;
      ensureGroup(currentLabel || "地址").urls.push(line);
      continue;
    }

    if (isLabelOnlyLine(line)) {
      ruleHits.labelOnly += 1;
      currentLabel = line.slice(0, -1).trim();
      pendingCredLabel = currentLabel;
      pendingUser = null;
      continue;
    }

    const colonSplit = splitOnce(line, ":");
    if (colonSplit) {
      const label = colonSplit[0].trim();
      const rest = colonSplit[1].trim();
      if (label && rest && looksLikeLabelKey(label)) {
        ruleHits.labelValue += 1;
        currentLabel = label;
        const group = ensureGroup(currentLabel);
        if (looksLikeUrl(rest)) {
          ruleHits.urlLine += 1;
          group.urls.push(rest);
          pendingCredLabel = null;
          pendingUser = null;
          continue;
        }

        const parsed = parseAccountPasswordFromValue(rest);
        if (parsed) {
          ruleHits.extractedCredentials += 1;
          group.creds.push({ user: parsed.user, pass: parsed.pass });
          pendingCredLabel = null;
          pendingUser = null;
          continue;
        }

        // 兼容：label: user pass（两列）
        const cols = splitColumns(rest);
        if (cols.length === 2) {
          ruleHits.extractedCredentials += 1;
          group.creds.push({ user: cols[0], pass: cols[1] });
          pendingCredLabel = null;
          pendingUser = null;
          continue;
        }

        group.notes.push(rest);
        pendingCredLabel = currentLabel;
        pendingUser = null;
        continue;
      }
    }

    if (pendingCredLabel) {
      if (!pendingUser) {
        // 兼容：label-only 下面贴的是三列/两列表格行
        const row3 = parseTableRow3(line);
        if (row3) {
          const nested = makeNestedLabel(pendingCredLabel, row3.subLabel);
          ruleHits.extractedCredentials += 1;
          ensureGroup(nested).creds.push({ user: row3.user, pass: row3.pass });
          continue;
        }
        const row2 = parseTableRow2(line);
        if (row2) {
          const nested = makeNestedLabel(pendingCredLabel, row2.subLabel);
          // 下一行作为密码
          pendingCredLabel = nested;
          pendingUser = row2.user;
          continue;
        }

        const parsedInline = parseAccountPasswordFromValue(line);
        if (parsedInline) {
          const label = "label" in parsedInline ? parsedInline.label : pendingCredLabel;
          ruleHits.extractedCredentials += 1;
          ensureGroup(label).creds.push({ user: parsedInline.user, pass: parsedInline.pass });
          pendingCredLabel = null;
          pendingUser = null;
          continue;
        }
        pendingUser = line;
        continue;
      }

      ruleHits.extractedCredentials += 1;
      ensureGroup(pendingCredLabel).creds.push({ user: pendingUser, pass: line });
      pendingCredLabel = null;
      pendingUser = null;
      continue;
    }

    // 无上下文：也支持三列/两列 + 下一行密码
    const row3 = parseTableRow3(line);
    if (row3) {
      ruleHits.extractedCredentials += 1;
      ensureGroup(row3.subLabel).creds.push({ user: row3.user, pass: row3.pass });
      continue;
    }
    const row2 = parseTableRow2(line);
    if (row2) {
      currentLabel = row2.subLabel;
      pendingCredLabel = row2.subLabel;
      pendingUser = row2.user;
      continue;
    }

    const parsedLine = parseAccountPasswordFromValue(line);
    if (parsedLine) {
      const label = "label" in parsedLine ? parsedLine.label : currentLabel || "账号";
      ruleHits.extractedCredentials += 1;
      ensureGroup(label).creds.push({ user: parsedLine.user, pass: parsedLine.pass });
      continue;
    }

    ensureGroup(currentLabel || "备注").notes.push(line);
  }

  const extractedCredentials = Array.from(groups.values()).reduce((sum, g) => sum + g.creds.length, 0);
  const extractedUrls = Array.from(groups.values()).reduce((sum, g) => sum + g.urls.length, 0);

  const hasStructureSignals =
    ruleHits.labelValue > 0 || ruleHits.labelOnly > 0 || ruleHits.urlLine > 0 || extractedCredentials > 0;

  const blocks: string[] = [];
  if (hasStructureSignals) {
    for (const group of groups.values()) {
      const hasAny = group.creds.length || group.urls.length || group.notes.length;
      if (!hasAny) continue;
      blocks.push(`【${group.label}】`);
      for (const c of group.creds) {
        blocks.push(`账号: ${c.user}`);
        blocks.push(`密码: ${c.pass}`);
      }
      for (const u of group.urls) blocks.push(`地址: ${u}`);
      for (const n of group.notes) blocks.push(n);
      blocks.push("");
    }
  }

  const normalized = hasStructureSignals ? normalizeDescribeMinimal(blocks.join("\n")) : minimal;
  const changed = minimal !== normalized;

  // extractedUrls 暂不返回，只用于内部判断；避免 TS lint unused
  void extractedUrls;

  return { minimal, normalized, changed, hasStructureSignals };
}
