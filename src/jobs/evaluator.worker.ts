import 'dotenv/config'
import { Worker } from "bullmq";
import { extractPdfText } from "../services/pdfParser.ts";
import { searchRelevant } from "../services/ragService.ts";
import { evaluateCV, evaluateProject, finalizeSummary } from "../services/scoring.ts";
import { markProcessing, markCompleted } from "../api/result.ts";
import { EvalJobPayload } from "../types.ts";

const connection = { url: process.env.REDIS_URL };

export const worker = new Worker<EvalJobPayload>(
  "eval-queue",
  async job => {
    console.log("👷 Worker picked up job:", job.id, job.data);
    await markProcessing(job.id);

    const { jobTitle, cvPath, reportPath } = job.data;
    const cvText = await extractPdfText(cvPath);
    const reportText = await extractPdfText(reportPath);

    console.log("SearchRelevant start...");
    const jobDescCtx = await searchRelevant(`Job: ${jobTitle}`, ["job_desc"], 6);
    const cvRubricCtx = await searchRelevant("CV scoring rubric", ["cv_rubric"], 4);
    const briefCtx = await searchRelevant("Case study brief", ["case_brief"], 6);
    const projRubricCtx = await searchRelevant("Project rubric", ["project_rubric"], 4);

    console.log("evaluate CV...");
    const cvEval = await evaluateCV(cvText, jobDescCtx, cvRubricCtx);
    console.log("projectEval...");
    const projEval = await evaluateProject(reportText, briefCtx, projRubricCtx);
    console.log("finishEval...");
    const summary = await finalizeSummary({
      cv_match_rate: cvEval.cv_match_rate,
      cv_feedback: cvEval.cv_feedback,
      project_score: projEval.project_score,
      project_feedback: projEval.project_feedback,
    });

    await markCompleted(job.id, {
      cv_match_rate: cvEval.cv_match_rate,
      cv_feedback: cvEval.cv_feedback,
      project_score: projEval.project_score,
      project_feedback: projEval.project_feedback,
      overall_summary: summary,
    });

    console.log("job completed:", job.id);
  },
  { connection, concurrency: 2 }
);

worker.on("completed", job => console.log(`job done: ${job.id}`));
worker.on("failed", (job, err) => console.error(`job failed: ${job?.id}`, err));
worker.on("error", err => console.error("worker error:", err));
