import { promises as fs } from "node:fs";
import path from "node:path";

// Only COR artifacts under .cor/ are viewable; names mirror cor-plan and cor-research.
const PLAN_RE = /^plan(?:_\d+_[A-Za-z0-9_-]+)?\.md$/;
const RESEARCH_RE = /^research_[A-Za-z0-9_-]+\.md$/;
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
  return null;
}

/** Resolves a user-supplied artifact path to an absolute file inside <root>/.cor/. */
export function resolveArtifact(root, input) {
  if (typeof input !== "string" || input.length === 0 || input.length > 256)
    throw new ArtifactError("invalid-path", "path must be a non-empty string such as .cor/plan.md");
  const name = path.posix.basename(input.replace(/\\/g, "/"));
  const rel = input.replace(/\\/g, "/").replace(/^\.\//, "");
  if (rel !== name && rel !== `.cor/${name}`)
    throw new ArtifactError("invalid-path", "Only files directly under .cor/ are supported.");
  const kind = kindOf(name);
  if (!kind)
    throw new ArtifactError("unsupported-artifact", "Supported: .cor/plan.md, .cor/plan_<N>_<slug>.md, .cor/research_<slug>.md");
  return { kind, name, rel: `.cor/${name}`, abs: path.join(root, ".cor", name) };
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
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
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

export async function loadArtifact(root, ref) {
  let file;
  try {
    file = await readText(ref.abs);
  } catch (err) {
    if (err instanceof ArtifactError) throw err;
    if (err.code === "ENOENT") throw new ArtifactError("not-found", `${ref.rel} does not exist.`);
    throw new ArtifactError("read-failed", `Cannot read ${ref.rel}: ${err.message}`);
  }
  const model = ref.kind === "plan" ? parsePlan(file.text, await readCheckpoint(root), ref.rel) : parseResearch(file.text);
  return { ...model, path: ref.rel, updatedAt: new Date(file.mtime).toISOString() };
}

export async function listArtifacts(root) {
  let names;
  try {
    names = await fs.readdir(path.join(root, ".cor"));
  } catch (err) {
    if (err.code === "ENOENT") return { plans: [], research: [], checkpoint: null };
    throw new ArtifactError("read-failed", `Cannot list .cor/: ${err.message}`);
  }
  const checkpoint = await readCheckpoint(root);
  const plans = [];
  const research = [];
  for (const name of names.sort()) {
    const kind = kindOf(name);
    if (!kind) continue;
    try {
      const a = await loadArtifact(root, resolveArtifact(root, name));
      if (kind === "plan") plans.push({ path: a.path, title: a.title, progress: a.progress, nextTask: a.nextTask, active: Boolean(a.checkpoint && a.checkpoint.phase !== "done"), updatedAt: a.updatedAt });
      else research.push({ path: a.path, title: a.title, confidence: a.confidence, sourceCount: a.sourceCount, updatedAt: a.updatedAt });
    } catch (err) {
      (kind === "plan" ? plans : research).push({ path: `.cor/${name}`, title: name, error: err.message });
    }
  }
  return { plans, research, checkpoint };
}
