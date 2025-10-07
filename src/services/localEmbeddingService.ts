import { pipeline } from "@xenova/transformers";

let embedder: any = null;

// Load the model
async function getEmbedder() {
  if (!embedder) {
    console.log("loading local embedding model");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("model loaded!");
  }
  return embedder;
}

export async function embedLocally(texts: string | string[]): Promise<number[][]> {
  const embedderInstance = await getEmbedder();

  const arr = Array.isArray(texts) ? texts : [texts];
  const results: number[][] = [];

  for (const t of arr) {
    const output = await embedderInstance(t, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }

  return results;
}
