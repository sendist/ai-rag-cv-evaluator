import { Router } from "express";
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

uploadRouter.post("/upload", upload.fields([{ name: "cv", maxCount: 1 }, { name: "report", maxCount: 1 }]), (req, res) => {
  const cv = (req.files as any)?.cv?.[0];
  const report = (req.files as any)?.report?.[0];
  if (!cv || !report) return res.status(400).json({ error: "cv and report are required" });
  res.json({ cv_id: path.basename(cv.path), report_id: path.basename(report.path) });
});
