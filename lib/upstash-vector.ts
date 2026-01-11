import { Index } from "@upstash/vector";

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export interface ArticleMetadata {
  slug: string;
  title: string;
  labels: string[];
  difficulty: string;
  contentType: string;
  publishedAt: number;
}

export async function upsertArticleWithEmbedding(
  slug: string,
  textToEmbed: string,
  metadata: ArticleMetadata
): Promise<void> {
  await vectorIndex.upsert({
    id: slug,
    data: textToEmbed,
    metadata: metadata as unknown as Record<string, unknown>,
  });
}

export async function findSimilarArticles(
  queryText: string,
  options?: { topK?: number; filter?: string }
): Promise<{ id: string; score: number; metadata?: ArticleMetadata }[]> {
  const results = await vectorIndex.query({
    data: queryText,
    topK: options?.topK ?? 10,
    filter: options?.filter,
    includeMetadata: true,
  });

  return results.map((r) => ({
    id: r.id as string,
    score: r.score,
    metadata: r.metadata as ArticleMetadata | undefined,
  }));
}

export async function findSimilarByVector(
  vector: number[],
  options?: { topK?: number; filter?: string }
): Promise<{ id: string; score: number; metadata?: ArticleMetadata }[]> {
  const results = await vectorIndex.query({
    vector,
    topK: options?.topK ?? 10,
    filter: options?.filter,
    includeMetadata: true,
  });

  return results.map((r) => ({
    id: r.id as string,
    score: r.score,
    metadata: r.metadata as ArticleMetadata | undefined,
  }));
}

export async function getArticleVector(slug: string): Promise<number[] | null> {
  const results = await vectorIndex.fetch([slug], { includeVectors: true });
  return results[0]?.vector ?? null;
}

export async function deleteArticleEmbedding(slug: string): Promise<void> {
  await vectorIndex.delete([slug]);
}

export { vectorIndex };
