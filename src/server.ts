import "dotenv/config";
import express from "express";
import { uploadRouter } from "./api/upload.ts";
import { evaluateRouter } from "./api/evaluate.ts";
import { resultRouter } from "./api/result.ts";
import { worker } from "./jobs/evaluator.worker.ts";
import { ensureCollection } from "./services/ragService.ts";
import { log } from "./utils/logger.ts";
import { setupSwagger } from "./swagger.ts";

const app = express();
app.use(express.json({ limit: "10mb" }));

setupSwagger(app);

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use(requireApiKey);

app.use(uploadRouter);
app.use(evaluateRouter);
app.use(resultRouter);

app.use((err, req, res, _next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err?.message || "Something went wrong",
  });
});

ensureCollection().then(() => log("Qdrant collection ready"));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => log(`Server running on :${port}`));
