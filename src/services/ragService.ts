import { QdrantClient } from "@qdrant/js-client-rest";
import { embedLocally as embed } from "./localEmbeddingService.ts";


const client = new QdrantClient({ url: process.env.QDRANT_URL!, apiKey: process.env.QDRANT_API_KEY || undefined, timeout: 60000, });
const COLLECTION = process.env.QDRANT_COLLECTION!;

export type DocChunk = { id: string; text: string; kind: "job_desc" | "case_brief" | "cv_rubric" | "project_rubric" };

export async function ensureCollection() {
  try {
    await client.getCollection(COLLECTION);
  } catch {
    await client.createCollection(COLLECTION, {
      vectors: { size: 384, distance: "Cosine" },
    });
  }
}

// export async function upsertChunks(chunks: DocChunk[]) {
//   await ensureCollection();
//   const vectors = await embed(chunks.map(c => c.text));
//   await client.upsert(COLLECTION, {
//     points: chunks.map((c, i) => ({
//       id: c.id,
//       vector: vectors[i],
//       payload: { text: c.text, kind: c.kind }
//     }))
//   });
// }

export async function upsertChunks(chunks: DocChunk[]) {
  await ensureCollection();
  const vectors = await embed(chunks.map(c => c.text));

  const BATCH_SIZE = 1; // safe batch size
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchVectors = vectors.slice(i, i + BATCH_SIZE);

    try {
      await client.upsert(COLLECTION, {
        points: batch.map((c, j) => ({
          id: c.id,
          vector: batchVectors[j],
          payload: { text: c.text, kind: c.kind },
        })),
      });
      console.log(`✅ Uploaded batch ${i / BATCH_SIZE + 1}`);
    } catch (err: any) {
      console.error(`❌ Failed batch ${i / BATCH_SIZE + 1}:`, err.message);
    }
  }
}


// export async function searchRelevant(query: string, kinds: DocChunk["kind"][], limit = 6) {
//   const [qVec] = await embed([query]);
//   const res = await client.search(COLLECTION, {
//     vector: qVec,
//     limit,
//     filter: { must: [{ key: "kind", match: { any: kinds } }] },
//     with_payload: true
//   });
//   return res.map(r => (r.payload as any).text as string);
// }

export async function searchRelevant(query: string, kinds: DocChunk["kind"][], limit = 6) {
  console.log("🔍 Searching relevant:", kinds.join(","));
  const [qVec] = await embed([query]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await client.search(COLLECTION, {
      vector: qVec,
      limit,
      filter: { must: [{ key: "kind", match: { any: kinds } }] },
      with_payload: true,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.map(r => (r.payload as any).text as string);
  } catch (err: any) {
    console.error("❌ searchRelevant failed for", kinds, err.message);
    return [];
  }
}
