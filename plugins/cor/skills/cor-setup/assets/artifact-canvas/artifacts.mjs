import { promises as fs } from "node:fs";
import path from "node:path";

// Viewable artifacts: .cor/ plans and research (cor-plan, cor-research) and
// docs/ maps (feature-map, codebase-map). Names mirror what those skills write.
const PLAN_RE = /^plan(?:_\d+_[A-Za-z0-9_-]+)?\.md$/;
const RESEARCH_RE = /^research_[A-Za-z0-9_-]+\.md$/;
const MAP_RE = /^(?:feature-map|codebase-map)(?:\/[A-Za-z0-9_-]+)?\.md$/;
const CONF_RE = /\b(EXTRACTED|INFERRED|AMBIGUOUS)\b/;
const TASK_RE = /^\s*- \[( |x|X)\] (T\d+)\s*[:\-—]\s*(.*)$/;
const TAG_RE = /\[(unit|integration|UAT)\]/gi;
const MAX_BYTES = 2 * 1024 * 1024;

export class ArtifactError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function kindOf(name) {
  if (PLAN_RE.test(name)) return "plan";
  if (RESEARCH_RE.test(name)) return "research";
  if (MAP_RE.test(name)) return "map";
  return null;
}

const SUPPORTED = "Supported: .cor/plan.md, .cor/plan_<N>_<slug>.md, .cor/research_<slug>.md, docs/feature-map.md, docs/feature-map/<slug>.md, docs/codebase-map.md";

/** Resolves a user-supplied artifact path to an absolute file inside <root>/.cor/ or <root>/docs/. */
export function resolveArtifact(root, input) {
  if (typeof input !== "string" || input.length === 0 || input.length > 256)
    throw new ArtifactError("invalid-path", "path must be a non-empty string such as .cor/plan.md");
  const rel = input.replace(/\\/g, "/").replace(/^\.\//, "");
  if (rel.includes("..")) throw new ArtifactError("invalid-path", "Parent segments are not allowed.");
  const name = path.posix.basename(rel);
  if (rel === name || rel === `.cor/${name}`) {
    const kind = kindOf(name);
    if (!kind || kind === "map") throw new ArtifactError("unsupported-artifact", SUPPORTED);
    return { kind, name, rel: `.cor/${name}`, abs: path.join(root, ".cor", name) };
  }
  const m = /^docs\/((?:feature-map|codebase-map)(?:\/[A-Za-z0-9_-]+)?\.md)$/.exec(rel);
  if (!m) throw new ArtifactError("invalid-path", SUPPORTED);
  return { kind: "map", name: m[1], rel, abs: path.join(root, ...rel.split("/")) };
}

async function readText(abs) {
  const stat = await fs.stat(abs);
  if (stat.size > MAX_BYTES) throw new ArtifactError("too-large", "Artifact exceeds 2 MB.");
  return { text: await fs.readFile(abs, "utf8"), mtime: stat.mtimeMs };
}

export async function readCheckpoint(root) {
  let text;
  try {
    text = await fs.readFile(path.join(root, ".cor", "checkpoint.md"), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw new ArtifactError("read-failed", `Cannot read checkpoint: ${err.message}`);
  }
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(plan|task|phase|started)\s*:\s*([^#]*?)\s*(?:#.*)?$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out.plan || out.task ? out : null;
}

// ---------- Markdown (safe subset) ----------

export function esc(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function inline(raw) {
  const codes = [];
  let s = raw.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  s = s.replace(/\b(ADOPT|FALLBACK|REJECT)\b/g, (m) => `<span class="pill pill-${m.toLowerCase()}">${m}</span>`);
  s = s.replace(/\b(HIGH|MEDIUM|LOW)\b/g, (m) => `<span class="pill conf-${m.toLowerCase()}">${m}</span>`);
  s = s.replace(/\b(EXTRACTED|INFERRED|AMBIGUOUS)\b/g, (m) => `<span class="pill tag-${m.toLowerCase()}">${m}</span>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

/** Renders a markdown fragment to escaped HTML. Raw HTML in the source is never passed through. */
export function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      const lang = line.trim().slice(3).trim().toLowerCase();
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(lang === "mermaid" ? `<pre class="mermaid-src"><code>${esc(buf.join("\n"))}</code></pre>` : `<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^\s*<!--/.test(line)) {
      while (i < lines.length && !/-->/.test(lines[i])) i++;
      i++;
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(h[1].length + 1, 6);
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table></div>`,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      out.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`);
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|\s*[-*]\s|\s*\d+\.\s|\s*\||\s*```)/.test(lines[i])) para.push(lines[i++]);
    if (para.length === 0) {
      out.push(`<p>${inline(lines[i++])}</p>`);
      continue;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

// ---------- Parsers ----------

function sections(text) {
  const lines = text.split(/\r?\n/);
  let title = "";
  const list = [];
  let cur = null;
  for (const line of lines) {
    const h1 = /^#\s+(.*)$/.exec(line);
    if (h1 && !title) {
      title = h1[1].trim();
      continue;
    }
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      cur = { heading: h2[1].trim(), lines: [] };
      list.push(cur);
      continue;
    }
    if (cur) cur.lines.push(line);
  }
  return { title, sections: list };
}

export function parsePlan(text, checkpoint, rel) {
  const { title, sections: secs } = sections(text);
  const phases = [];
  const context = [];
  for (const s of secs) {
    const isTasks = /^tasks$/i.test(s.heading) || /^phase\s+\d+/i.test(s.heading);
    if (!isTasks) {
      context.push({ heading: s.heading, html: renderMarkdown(s.lines.join("\n")) });
      continue;
    }
    const tasks = [];
    for (const line of s.lines) {
      const m = TASK_RE.exec(line);
      if (!m) continue;
      const tags = [...m[3].matchAll(TAG_RE)].map((t) => (t[1].toUpperCase() === "UAT" ? "UAT" : t[1].toLowerCase()));
      tasks.push({ id: m[2], done: m[1] !== " ", text: m[3].replace(TAG_RE, "").trim(), html: inline(m[3].replace(TAG_RE, "").trim()), tags });
    }
    phases.push({ heading: /^tasks$/i.test(s.heading) ? "Phase 1" : s.heading, tasks });
  }
  const all = phases.flatMap((p) => p.tasks);
  const active = checkpoint && checkpoint.plan && checkpoint.plan.replace(/^\.\//, "") === rel ? checkpoint : null;
  const activeTask = active && active.phase !== "done" ? active.task : null;
  const next = all.find((t) => !t.done && !t.tags.length) ?? all.find((t) => !t.done) ?? null;
  for (const t of all) {
    t.status = t.done ? "done" : t.id === activeTask ? "active" : next && t.id === next.id && !activeTask ? "next" : "pending";
  }
  return {
    kind: "plan",
    title: title.replace(/^COR Plan\s*[—-]?\s*/i, "") || "COR Plan",
    context,
    phases,
    progress: { done: all.filter((t) => t.done).length, total: all.length },
    checkpoint: active,
    nextTask: activeTask ?? next?.id ?? null,
  };
}

export function parseResearch(text) {
  const { title, sections: secs } = sections(text);
  const summary = secs.find((s) => /decision summary/i.test(s.heading));
  const conf = summary && /confidence\s*:\s*\**\s*(HIGH|MEDIUM|LOW)/i.exec(summary.lines.join("\n"));
  const sources = secs.find((s) => /^sources$/i.test(s.heading));
  return {
    kind: "research",
    title: title.replace(/^COR Research\s*[—-]?\s*/i, "") || "COR Research",
    confidence: conf ? conf[1].toUpperCase() : null,
    sourceCount: sources ? sources.lines.filter((l) => /^\s*[-*]\s+/.test(l)).length : 0,
    sections: secs.map((s) => ({ heading: s.heading, html: renderMarkdown(s.lines.join("\n")) })),
  };
}

/** Parses the `<!-- feature-map:meta ... -->` or `<!-- codebase-map:meta ... -->` header. */
function parseMeta(text) {
  const m = /<!--\s*(?:feature|codebase)-map:meta\s*\n([\s\S]*?)-->/.exec(text);
  const meta = {};
  if (!m) return meta;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^\s*([a-z-]+)\s*:\s*(.*?)\s*$/.exec(line);
    if (kv) meta[kv[1]] = kv[2];
  }
  return meta;
}

function tableRows(lines) {
  const i = lines.findIndex((l, k) => /^\s*\|/.test(l) && k + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[k + 1]));
  if (i < 0) return { head: [], rows: [] };
  const head = splitRow(lines[i]);
  const rows = [];
  let k = i + 2;
  while (k < lines.length && /^\s*\|/.test(lines[k])) rows.push(splitRow(lines[k++]));
  return { head, rows };
}

export function parseMap(text, rel) {
  const { title, sections: secs } = sections(text);
  const meta = parseMeta(text);
  const isFeature = /feature-map/.test(rel);
  const capabilities = [];
  const flags = [];
  const other = [];
  const confidence = { EXTRACTED: 0, INFERRED: 0, AMBIGUOUS: 0 };
  let featureCount = 0;
  for (const s of secs) {
    if (/^capabilities$/i.test(s.heading)) {
      let cur = null;
      for (const line of s.lines) {
        const h3 = /^###\s+(.*)$/.exec(line);
        if (h3) {
          cur = { name: h3[1].trim(), lines: [] };
          capabilities.push(cur);
          continue;
        }
        if (cur) cur.lines.push(line);
      }
      for (const c of capabilities) {
        const { head, rows } = tableRows(c.lines);
        const confIdx = head.findIndex((h) => /^conf/i.test(h));
        const flagIdx = head.findIndex((h) => /^flag/i.test(h));
        c.features = rows.map((r) => {
          const conf = confIdx >= 0 ? (CONF_RE.exec(r[confIdx]) || [])[1] ?? null : null;
          if (conf) confidence[conf]++;
          return { cells: r.map((cell) => inline(cell)), confidence: conf, flagged: flagIdx >= 0 && r[flagIdx] && r[flagIdx] !== "-" };
        });
        c.head = head.map((h) => inline(h));
        featureCount += c.features.length;
        c.summary = inline((c.lines.find((l) => l.trim() && !/^\s*[<|#]/.test(l)) ?? "").trim());
        c.html = renderMarkdown(c.lines.filter((l) => !/^\s*<!--/.test(l)).join("\n"));
        delete c.lines;
      }
      continue;
    }
    if (/^flags$/i.test(s.heading)) {
      const { head, rows } = tableRows(s.lines);
      flags.push(...rows.map((r) => Object.fromEntries(head.map((h, k) => [h.toLowerCase().replace(/\s+/g, "_"), r[k] ?? ""]))));
      other.push({ heading: s.heading, html: renderMarkdown(s.lines.join("\n")) });
      continue;
    }
    other.push({ heading: s.heading, html: renderMarkdown(s.lines.join("\n")) });
  }
  return {
    kind: "map",
    mapKind: isFeature ? "feature" : "codebase",
    title: title || (isFeature ? "Feature Map" : "Codebase Map"),
    meta,
    capabilities,
    featureCount,
    flagCount: flags.length,
    flags,
    confidence,
    sections: other,
  };
}

export async function loadArtifact(root, ref) {
  let file;
  try {
    file = await readText(ref.abs);
  } catch (err) {
    if (err instanceof ArtifactError) throw err;
    if (err.code === "ENOENT") throw new ArtifactError("not-found", `${ref.rel} does not exist.`);
    throw new ArtifactError("read-failed", `Cannot read ${ref.rel}: ${err.message}`);
  }
  const model =
    ref.kind === "plan" ? parsePlan(file.text, await readCheckpoint(root), ref.rel) : ref.kind === "research" ? parseResearch(file.text) : parseMap(file.text, ref.rel);
  return { ...model, path: ref.rel, updatedAt: new Date(file.mtime).toISOString() };
}

async function listMapFiles(root) {
  const out = [];
  for (const base of ["feature-map", "codebase-map"]) {
    try {
      await fs.stat(path.join(root, "docs", `${base}.md`));
      out.push(`docs/${base}.md`);
    } catch {}
    try {
      const names = await fs.readdir(path.join(root, "docs", base));
      for (const n of names.sort()) if (/^[A-Za-z0-9_-]+\.md$/.test(n)) out.push(`docs/${base}/${n}`);
    } catch {}
  }
  return out;
}

export async function listArtifacts(root) {
  let names = [];
  try {
    names = await fs.readdir(path.join(root, ".cor"));
  } catch (err) {
    if (err.code !== "ENOENT") throw new ArtifactError("read-failed", `Cannot list .cor/: ${err.message}`);
  }
  const checkpoint = await readCheckpoint(root);
  const plans = [];
  const research = [];
  const maps = [];
  for (const rel of await listMapFiles(root)) {
    try {
      const a = await loadArtifact(root, resolveArtifact(root, rel));
      maps.push({ path: a.path, title: a.title, mapKind: a.mapKind, capabilities: a.capabilities.length, features: a.featureCount, flags: a.flagCount, generated: a.meta.generated ?? null, updatedAt: a.updatedAt });
    } catch (err) {
      maps.push({ path: rel, title: rel, error: err.message });
    }
  }
  for (const name of names.sort()) {
    const kind = kindOf(name);
    if (!kind || kind === "map") continue;
    try {
      const a = await loadArtifact(root, resolveArtifact(root, name));
      if (kind === "plan") plans.push({ path: a.path, title: a.title, progress: a.progress, nextTask: a.nextTask, active: Boolean(a.checkpoint && a.checkpoint.phase !== "done"), updatedAt: a.updatedAt });
      else research.push({ path: a.path, title: a.title, confidence: a.confidence, sourceCount: a.sourceCount, updatedAt: a.updatedAt });
    } catch (err) {
      (kind === "plan" ? plans : research).push({ path: `.cor/${name}`, title: name, error: err.message });
    }
  }
  return { plans, research, maps, checkpoint };
}
