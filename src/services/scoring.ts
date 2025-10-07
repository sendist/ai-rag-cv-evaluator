import { chat } from "./llmService.ts";

export async function evaluateCV(cvText: string, jobDescCtx: string[], rubricCtx: string[]) {
  const system = "You are a precise recruiter AI. Score CV vs job requirements using the rubric. Return strict JSON.";
  const user = `CV:\n${cvText}\n\nJOB_DESCRIPTION_SNIPPETS:\n${jobDescCtx.join("\n---\n")}\n\nRUBRIC_SNIPPETS:\n${rubricCtx.join("\n---\n")}\n\nTask: 1) compute cv_match_rate (0..1) and 2) write cv_feedback (3-5 sentences).\nReturn JSON with keys: cv_match_rate, cv_feedback.`;
  const out = await chat(system, user);
  return safeJson(out, ["cv_match_rate", "cv_feedback"]);
}

export async function evaluateProject(reportText: string, briefCtx: string[], rubricCtx: string[]) {
  const system = "You are a strict code reviewer AI. Evaluate project report vs brief and rubric. Return strict JSON.";
  const user = `REPORT:\n${reportText}\n\nCASE_BRIEF_SNIPPETS:\n${briefCtx.join("\n---\n")}\n\nRUBRIC_SNIPPETS:\n${rubricCtx.join("\n---\n")}\n\nTask: 1) score project_score (1..5) and 2) write project_feedback (3-5 sentences).\nReturn JSON keys: project_score, project_feedback.`;
  const out = await chat(system, user);
  return safeJson(out, ["project_score", "project_feedback"]);
}

export async function finalizeSummary(inputs: { cv_match_rate: number; cv_feedback: string; project_score: number; project_feedback: string; }) {
  const system = "You are a hiring manager. Summarize strengths, gaps, and next steps.";
  const user = `Make a concise overall summary (3–5 sentences).\nData: ${JSON.stringify(inputs)}`;
  const out = await chat(system, user);
  return (out || "").trim();
}

function safeJson(raw: string, keys: string[]) {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const obj = JSON.parse(raw.slice(start, end + 1));
    for (const k of keys) if (!(k in obj)) throw new Error("Missing key " + k);
    return obj;
  } catch {
    const fallback: any = {};
    if (keys.includes("cv_match_rate")) fallback.cv_match_rate = 0.0;
    if (keys.includes("project_score")) fallback.project_score = 1;
    for (const k of keys) fallback[k] ??= "";
    return fallback;
  }
}
