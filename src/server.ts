import "dotenv/config";
import express from "express";
import { uploadRouter } from "./api/upload.ts";
import { evaluateRouter } from "./api/evaluate.ts";
import { resultRouter } from "./api/result.ts";
import { worker } from "./jobs/evaluator.worker.ts";
import { ensureCollection } from "./services/ragService.ts";
import { log } from "./utils/logger.ts";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use(uploadRouter);
app.use(evaluateRouter);
app.use(resultRouter);

ensureCollection().then(() => log("Qdrant collection ready"));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => log(`Server running on :${port}`));
