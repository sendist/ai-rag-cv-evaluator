import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import { addEvalJob } from "../services/queue.ts";

export const evaluateRouter = Router();


/**
 * @swagger
 * /evaluate:
 *   post:
 *     summary: Queue a new evaluation job
 *     description: Submits a CV and project report for AI evaluation.
 *     tags:
 *       - Evaluation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job_title, cv_id, report_id]
 *             properties:
 *               job_title:
 *                 type: string
 *                 example: "AI Engineer"
 *               cv_id:
 *                 type: string
 *                 example: "1717614526-cv.pdf"
 *               report_id:
 *                 type: string
 *                 example: "1717614526-report.pdf"
 *     responses:
 *       200:
 *         description: Job queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "queued"
 */
evaluateRouter.post("/evaluate", async (req, res, next) => {
  try {
    const { job_title, cv_id, report_id } = req.body || {};
    if (!job_title || !cv_id || !report_id) return res.status(400).json({ error: "job_title, cv_id, report_id required" });

    const cvPath = path.join(process.env.UPLOAD_DIR || "./uploads", cv_id);
    const reportPath = path.join(process.env.UPLOAD_DIR || "./uploads", report_id);

    const job = await addEvalJob({ jobTitle: job_title, cvPath, reportPath });
    res.json({ id: job.id, status: "queued" });
  } catch (err) {
    next(err);
  }

});
