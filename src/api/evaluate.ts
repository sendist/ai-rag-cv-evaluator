import { Router } from "express";
import path from "path";
import { addEvalJob } from "../services/queue.ts";

export const evaluateRouter = Router();

evaluateRouter.post("/evaluate", async (req, res) => {
  const { job_title, cv_id, report_id } = req.body || {};
  if (!job_title || !cv_id || !report_id) return res.status(400).json({ error: "job_title, cv_id, report_id required" });

  const cvPath = path.join(process.env.UPLOAD_DIR || "./uploads", cv_id);
  const reportPath = path.join(process.env.UPLOAD_DIR || "./uploads", report_id);

  const job = await addEvalJob({ jobTitle: job_title, cvPath, reportPath });
  res.json({ id: job.id, status: "queued" });
});
