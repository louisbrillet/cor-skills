// COR artifact canvas — optional GitHub Copilot extension installed by cor-setup.
// Read-only view of .cor/ plans and research reports. Files stay the source of truth.
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { createCanvas, CanvasError, joinSession } from "@github/copilot-sdk/extension";
import { ArtifactError, listArtifacts, loadArtifact, resolveArtifact } from "./artifacts.mjs";
import { startServer, watchCorDir } from "./server.mjs";

const CANVAS_ID = "cor-skills-artifacts";
const instances = new Map();
let session;

function toCanvasError(err) {
  if (err instanceof CanvasError) return err;
  if (err instanceof ArtifactError) return new CanvasError(err.code, err.message);
  return new CanvasError("internal-error", err?.message ?? String(err));
}

function resolveRoot(input, ctx) {
  const raw = input?.root ?? ctx.session?.workingDirectory;
  if (typeof raw !== "string" || !path.isAbsolute(raw))
    throw new CanvasError("invalid-root", "Pass `root` as the absolute path of the project repository.");
  const root = path.resolve(raw);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new CanvasError("invalid-root", `${root} is not a directory.`);
  return root;
}

async function buildState(inst) {
  const overview = await listArtifacts(inst.root);
  let artifact = null;
  let error = null;
  if (inst.view) {
    try {
      artifact = await loadArtifact(inst.root, resolveArtifact(inst.root, inst.view));
    } catch (err) {
      error = err.message;
    }
  }
  return { root: inst.root, view: inst.view, highlight: inst.highlight, overview, artifact, error };
}

async function refresh(inst) {
  try {
    inst.server.broadcast(await buildState(inst));
  } catch (err) {
    session?.log?.(`cor-artifacts: refresh failed: ${err.message}`);
  }
}

function summarize(state) {
  const a = state.artifact;
  const base = {
    view: state.view ?? "overview",
    plans: state.overview.plans.map((p) => ({ path: p.path, title: p.title, progress: p.progress, nextTask: p.nextTask, error: p.error })),
    research: state.overview.research.map((r) => ({ path: r.path, title: r.title, confidence: r.confidence, error: r.error })),
  };
  if (state.error) return { ...base, error: state.error };
  if (a?.kind === "plan") return { ...base, plan: { path: a.path, title: a.title, progress: a.progress, nextTask: a.nextTask, checkpoint: a.checkpoint } };
  if (a?.kind === "research") return { ...base, research_report: { path: a.path, title: a.title, confidence: a.confidence, sections: a.sections.map((s) => s.heading) } };
  return base;
}

async function setView(inst, input) {
  if (input?.path == null) {
    inst.view = null;
  } else {
    const ref = resolveArtifact(inst.root, input.path);
    await loadArtifact(inst.root, ref);
    inst.view = ref.rel;
  }
  inst.highlight = typeof input?.highlight === "string" ? input.highlight : null;
  const state = await buildState(inst);
  inst.server.broadcast(state);
  return state;
}

function getInstance(instanceId) {
  const inst = instances.get(instanceId);
  if (!inst) throw new CanvasError("not-open", "Canvas instance is not open. Call open_canvas first.");
  return inst;
}

function action(name, description, inputSchema, run) {
  return {
    name,
    description,
    ...(inputSchema ? { inputSchema } : {}),
    handler: async ({ instanceId, input }) => {
      try {
        return await run(getInstance(instanceId), input ?? {});
      } catch (err) {
        throw toCanvasError(err);
      }
    },
  };
}

const PATH_PROP = { type: "string", description: "Artifact path relative to the repo root, e.g. .cor/plan.md or .cor/research_auth_options.md." };

const canvas = createCanvas({
  id: CANVAS_ID,
  displayName: "COR artifacts",
  description: "Live visual view of COR plans (task progress) and research reports stored in a repository's .cor/ folder.",
  inputSchema: {
    type: "object",
    properties: {
      root: { type: "string", description: "Absolute path of the project repository. Defaults to the session working directory." },
      path: PATH_PROP,
    },
    additionalProperties: false,
  },
  actions: [
    action("getState", "Return the artifact overview and the artifact currently shown.", null, async (inst) => summarize(await buildState(inst))),
    action(
      "showArtifact",
      "Show a plan or research report. Omit path to show the overview.",
      { type: "object", properties: { path: PATH_PROP }, additionalProperties: false },
      async (inst, input) => summarize(await setView(inst, { path: input.path ?? null })),
    ),
    action(
      "highlightTask",
      "Scroll to and highlight a task (e.g. T03) in the plan currently shown.",
      { type: "object", properties: { taskId: { type: "string", pattern: "^T\\d+$" } }, required: ["taskId"], additionalProperties: false },
      async (inst, input) => {
        if (!inst.view || !inst.view.includes("plan")) throw new CanvasError("no-plan", "Show a plan before highlighting a task.");
        return summarize(await setView(inst, { path: inst.view, highlight: input.taskId }));
      },
    ),
  ],
  async open(ctx) {
    const input = ctx.input && typeof ctx.input === "object" && !Array.isArray(ctx.input) ? ctx.input : {};
    try {
      const root = resolveRoot(input, ctx);
      let inst = instances.get(ctx.instanceId);
      if (inst && inst.root !== root) {
        inst.stopWatch();
        inst.root = root;
        inst.stopWatch = watchCorDir(root, () => refresh(inst));
      }
      if (!inst) {
        inst = { root, view: null, highlight: null };
        inst.server = await startServer({
          getState: () => buildState(inst),
          setView: (body) => setView(inst, { path: body?.path ?? null }),
        });
        inst.stopWatch = watchCorDir(root, () => refresh(inst));
        instances.set(ctx.instanceId, inst);
      }
      if (input.path !== undefined) await setView(inst, { path: input.path });
      else await refresh(inst);
      const state = await buildState(inst);
      const a = state.artifact;
      const status = a?.kind === "plan" ? `${a.progress.done}/${a.progress.total} tasks` : a?.kind === "research" ? `Confidence ${a.confidence ?? "n/a"}` : `${state.overview.plans.length} plan(s), ${state.overview.research.length} report(s)`;
      return { url: inst.server.url, title: a ? `COR — ${a.title}` : "COR artifacts", status };
    } catch (err) {
      throw toCanvasError(err);
    }
  },
  async onClose({ instanceId }) {
    const inst = instances.get(instanceId);
    if (!inst) return;
    instances.delete(instanceId);
    inst.stopWatch();
    await inst.server.close();
  },
});

session = await joinSession({ canvases: [canvas] });
