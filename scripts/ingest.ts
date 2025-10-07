import "dotenv/config";
import fs from "fs";
import path from "path";
import * as pdfjs from "pdfjs-dist";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { upsertChunks, DocChunk } from "../src/services/ragService.ts";
import { v4 as uuidv4 } from "uuid";

async function extractPdfText(filePath: string): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({ data }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(" ");
    fullText += text + " ";
  }
  return fullText.replace(/\s+/g, " ").trim();
}

async function pdfToChunks(filePath: string, kind: DocChunk["kind"], chunkSize = 1200) {
  const text = await extractPdfText(filePath);
  const chunks: DocChunk[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    const part = text.slice(i, i + chunkSize);
    chunks.push({
      id: uuidv4(),
      text: part,
      kind,
    });
  }
  return chunks;
}

(async () => {
  const base = path.resolve("data");
  const sourceFile = path.join(base, "case_study_brief.pdf");

  const kinds: DocChunk["kind"][] = ["job_desc", "cv_rubric", "case_brief", "project_rubric"];
  let all: DocChunk[] = [];

  for (const kind of kinds) {
    const chunks = await pdfToChunks(sourceFile, kind);
    all = all.concat(chunks);
  }

  await upsertChunks(all);
  console.log(`ngested ${all.length} chunks to Qdrant`);
})();
