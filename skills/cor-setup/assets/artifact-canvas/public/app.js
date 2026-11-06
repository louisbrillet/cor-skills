const $ = (id) => document.getElementById(id);
const main = $("content");
let state = null;
let lastKey = "";
let prevDone = new Set();
let ctxOpen = true;
let ctxExpanded = false;

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function announce(msg) {
  $("status").textContent = msg;
}

async function show(path) {
  try {
    const res = await fetch("/api/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path }) });
    if (!res.ok) throw new Error((await res.json()).message || "Error");
  } catch (err) {
    announce(`Error: ${err.message}`);
  }
}

function when(iso) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const ICONS = {
  done: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" class="fill"/><path d="M5 8.2l2.1 2.1L11 6.1" class="tick"/></svg>',
  active: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.25" class="ring"/><path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" class="half"/></svg>',
  next: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.25" class="ring"/><circle cx="8" cy="8" r="2" class="dot"/></svg>',
  pending: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.25" class="ring"/></svg>',
};
const icon = (status) => ICONS[status] ?? ICONS.pending;

function bar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const level = pct === 0 ? "none" : pct < 40 ? "low" : pct < 100 ? "mid" : "full";
  return `<div class="bar lvl-${level}" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="${done} of ${total} tasks done"><span style="width:${pct}%"></span></div>`;
}

function renderOverview(o) {
  const plans = o.plans.length
    ? o.plans
        .map(
          (p) => `<li><button type="button" class="card" data-path="${esc(p.path)}">
            <span class="card-title">${esc(p.title)}</span><span class="card-path">${esc(p.path)}</span>
            <span class="card-side">${p.error ? `<span class="err">${esc(p.error)}</span>` : `${p.active ? '<span class="running">running</span>' : p.nextTask ? `<span>next ${esc(p.nextTask)}</span>` : "<span>complete</span>"}
            ${bar(p.progress.done, p.progress.total)}<span>${p.progress.done}/${p.progress.total}</span>`}</span>
          </button></li>`,
        )
        .join("")
    : `<li class="empty">No plan yet. Run <code>cor-plan</code>.</li>`;
  const research = o.research.length
    ? o.research
        .map(
          (r) => `<li><button type="button" class="card" data-path="${esc(r.path)}">
            <span class="card-title">${esc(r.title)}</span><span class="card-path">${esc(r.path)}</span>
            <span class="card-side">${r.error ? `<span class="err">${esc(r.error)}</span>` : `${r.confidence ? `<span class="pill conf-${r.confidence.toLowerCase()}">${r.confidence}</span>` : ""}<span>${r.sourceCount} source${r.sourceCount === 1 ? "" : "s"}</span>`}</span>
          </button></li>`,
        )
        .join("")
    : `<li class="empty">No research report. Run <code>cor-research</code> when evidence matters.</li>`;
  return `<h1>Artifacts</h1><p class="root">${esc(state.root)}</p>
    <div class="section-head"><h3>Plans</h3><span class="count">${o.plans.length}</span></div><ul class="cards">${plans}</ul>
    <div class="section-head"><h3>Research</h3><span class="count">${o.research.length}</span></div><ul class="cards">${research}</ul>`;
}

function renderPlan(a) {
  const pct = a.progress.total ? Math.round((a.progress.done / a.progress.total) * 100) : 0;
  const cp = a.checkpoint && a.checkpoint.phase !== "done"
    ? `<p class="checkpoint">cor-code on <strong>${esc(a.checkpoint.task)}</strong><span class="sep">/</span><code>${esc(a.checkpoint.phase)}</code></p>`
    : "";
  const phases = a.phases
    .map(
      (p) => `<section class="phase" aria-label="${esc(p.heading)}"><h3>${esc(p.heading)}</h3><ol class="tasks">${p.tasks
        .map((t) => {
          const cls = [t.status, state.highlight === t.id ? "highlight" : "", t.done && !prevDone.has(t.id) && (state.view ?? "") === lastKey ? "just-done" : ""].join(" ");
          const label = { done: "done", active: "in progress", next: "next", pending: "pending" }[t.status];
          return `<li class="task ${cls}" id="task-${esc(t.id)}">
            <span class="check" aria-hidden="true">${icon(t.status)}</span>
            <span class="tid">${esc(t.id)}</span><span class="ttext">${t.html}</span>
            ${t.tags.map((g) => `<span class="tag tag-${g.toLowerCase()}">${esc(g)}</span>`).join("")}
            <span class="sr-only">(${label})</span></li>`;
        })
        .join("")}</ol></section>`,
    )
    .join("");
  const ctx = a.context
    .map((c) => `<div class="ctx-sec"><h4 class="label">${esc(c.heading)}</h4><div class="md">${c.html}</div></div>`)
    .join("");
  return `<h1>${esc(a.title)}</h1><p class="meta"><code>${esc(a.path)}</code><span class="sep">·</span>${when(a.updatedAt)}</p>
    <div class="summary"><span class="big">${pct}%</span>${bar(a.progress.done, a.progress.total)}<span>${a.progress.done} of ${a.progress.total}</span></div>
    ${cp}
    ${ctx ? `<section class="context" aria-label="Plan context"><details${ctxOpen ? " open" : ""}><summary>Context</summary>
      <div class="ctx-body${ctxExpanded ? " expanded" : ""}">${ctx}</div><button type="button" class="more" hidden>${ctxExpanded ? "Show less" : "Show more"}</button></details></section>` : ""}
    <div class="phases">${phases || '<p class="empty">No tasks found.</p>'}</div>`;
}

function slug(s, i) {
  return `s${i}-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function renderResearch(a) {
  const toc = a.sections.map((s, i) => `<li><a href="#${slug(s.heading, i)}">${esc(s.heading)}</a></li>`).join("");
  const body = a.sections
    .map((s, i) => `<section class="rsec ${/decision summary/i.test(s.heading) ? "decision" : ""}" id="${slug(s.heading, i)}"><h2>${esc(s.heading)}</h2><div class="md">${s.html}</div></section>`)
    .join("");
  return `<h1>${esc(a.title)}</h1><p class="meta"><code>${esc(a.path)}</code><span class="sep">·</span>${when(a.updatedAt)}<span class="sep">·</span>${a.sourceCount} source${a.sourceCount === 1 ? "" : "s"}${a.confidence ? `<span class="sep">·</span><span class="pill conf-${a.confidence.toLowerCase()}">${a.confidence}</span>` : ""}</p>
    <div class="research-grid"><nav class="toc" aria-label="Sections"><ol>${toc}</ol></nav><div>${body}</div></div>`;
}

function wireContext() {
  const d = main.querySelector(".context details");
  if (!d) return;
  const body = d.querySelector(".ctx-body");
  const more = d.querySelector(".more");
  const fit = () => { more.hidden = !(ctxExpanded || body.scrollHeight > body.clientHeight + 1); };
  d.addEventListener("toggle", () => { ctxOpen = d.open; fit(); });
  more.addEventListener("click", () => {
    ctxExpanded = !ctxExpanded;
    body.classList.toggle("expanded", ctxExpanded);
    more.textContent = ctxExpanded ? "Show less" : "Show more";
  });
  fit();
}

function render() {
  const a = state.artifact;
  $("crumb").textContent = state.view ? `/ ${state.view}` : "";
  let html;
  if (state.error) html = `<p class="err" role="alert">${esc(state.error)}</p>${renderOverview(state.overview)}`;
  else if (a?.kind === "plan") html = renderPlan(a);
  else if (a?.kind === "research") html = renderResearch(a);
  else html = renderOverview(state.overview);
  main.innerHTML = html;
  wireContext();
  main.setAttribute("aria-busy", "false");
  main.querySelectorAll(".card[data-path]").forEach((b) => b.addEventListener("click", () => show(b.dataset.path)));

  const key = state.view ?? "";
  if (key !== lastKey) {
    main.focus();
    announce(a ? `Showing ${a.title}` : "Showing artifact overview");
  } else if (a?.kind === "plan") {
    const newly = a.phases.flatMap((p) => p.tasks).filter((t) => t.done && !prevDone.has(t.id));
    if (newly.length) announce(`${newly.map((t) => t.id).join(", ")} completed. ${a.progress.done} of ${a.progress.total} done.`);
  }
  if (state.highlight) document.getElementById(`task-${state.highlight}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  prevDone = new Set(a?.kind === "plan" ? a.phases.flatMap((p) => p.tasks).filter((t) => t.done).map((t) => t.id) : []);
  lastKey = key;
}

$("home").addEventListener("click", () => show(null));

async function init() {
  state = await (await fetch("/api/state")).json();
  render();
  const es = new EventSource("/events");
  es.addEventListener("state", (e) => {
    state = JSON.parse(e.data);
    render();
  });
  es.onopen = () => { $("live").textContent = "live"; $("live").classList.remove("off"); };
  es.onerror = () => { $("live").textContent = "reconnecting"; $("live").classList.add("off"); };
}

init().catch((err) => { main.innerHTML = `<p class="err" role="alert">${esc(err.message)}</p>`; });
