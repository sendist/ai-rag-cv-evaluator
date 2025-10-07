import { Router } from "express";
import fs from "fs";
import path from "path";

// Location for persistent results
const RESULTS_FILE = path.resolve("data/results.json");

// Ensure directory exists
if (!fs.existsSync(path.dirname(RESULTS_FILE))) {
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
}

// Load cache from file if it exists
let cache: Record<string, any> = {};
if (fs.existsSync(RESULTS_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
  } catch {
    cache = {};
  }
}

// Helper to write changes
function save() {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(cache, null, 2));
}

// --- 🔹 Exported status helpers ---
export function markProcessing(id: string) {
  cache[id] = { id, status: "processing" };
  save();
}

export function markCompleted(id: string, result: any) {
  cache[id] = { id, status: "completed", result };
  save();
}

export function setJobResult(id: string, payload: any) {
  cache[id] = payload;
  save();
}

// --- 🔹 Express Router ---
export const resultRouter = Router();

resultRouter.get("/result/:id", (req, res) => {
  const id = req.params.id;

  // Reload latest cache from file
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
    } catch {
      cache = {};
    }
  }

  const val = cache[id];
  if (!val) {
    return res.json({ id, status: "queued" });
  }

  res.json(val);
});
