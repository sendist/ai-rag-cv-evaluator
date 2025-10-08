import "dotenv/config";
import fs from "fs";
import path from "path";
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

  //Map each actual file to its "kind"
  const files: Record<DocChunk["kind"], string> = {
    job_desc: path.join(base, "job_desc.pdf"),
    cv_rubric: path.join(base, "cv_rubric.pdf"),
    case_brief: path.join(base, "case_study_brief.pdf"),
    project_rubric: path.join(base, "project_rubric.pdf"),
  };

  let allChunks: DocChunk[] = [];

  for (const [kind, filePath] of Object.entries(files)) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found for kind "${kind}": ${filePath}`);
      continue;
    }

    console.log(`Processing ${kind} from ${path.basename(filePath)}...`);
    const chunks = await pdfToChunks(filePath, kind as DocChunk["kind"]);
    console.log(`Created ${chunks.length} chunks from ${kind}`);
    allChunks = allChunks.concat(chunks);
  }

  if (allChunks.length === 0) {
    console.error("No chunks were created. Check file paths.");
    return;
  }

  await upsertChunks(allChunks);
  console.log(`Ingested ${allChunks.length} chunks into Qdrant`);
})();
