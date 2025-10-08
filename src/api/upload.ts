import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const id = Date.now() + "-" + Math.random().toString(36).slice(2);
    cb(null, id + path.extname(file.originalname || ".pdf"));
  },
});

const upload = multer({ storage });

export const uploadRouter = Router();


/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload CV and project report files
 *     description: Upload two files (CV and project report) to the server.
 *     tags:
 *       - Upload
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: cv
 *         in: formData
 *         required: true
 *         type: file
 *         description: CV file in PDF format.
 *       - name: report
 *         in: formData
 *         required: true
 *         type: file
 *         description: Project report file in PDF format.
 *     responses:
 *       200:
 *         description: File upload successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cv_id:
 *                   type: string
 *                   example: "1717614526-cv.pdf"
 *                 report_id:
 *                   type: string
 *                   example: "1717614526-report.pdf"
 */
uploadRouter.post("/upload", upload.fields([{ name: "cv", maxCount: 1 }, { name: "report", maxCount: 1 }]), (req, res, next) => {
  try {
    const cv = (req.files as any)?.cv?.[0];
    const report = (req.files as any)?.report?.[0];
    if (!cv || !report) return res.status(400).json({ error: "cv and report are required" });
    res.json({ cv_id: path.basename(cv.path), report_id: path.basename(report.path) });
  } catch (err) {
    next(err);
  }
});
