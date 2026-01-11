import { Search } from "@upstash/search";

// Initialize client from environment variables
// Expects UPSTASH_SEARCH_REST_URL and UPSTASH_SEARCH_REST_TOKEN
const client = Search.fromEnv();

// Blog posts index
export const blogIndex = client.index("blog-posts");

// Content fields (searchable)
export interface BlogPostContent {
	title: string;
	description: string;
	labels: string[];
}

// Metadata fields (returned but not searchable)
export interface BlogPostMetadata {
	slug: string;
	difficulty: string;
	contentType: string;
	coverImage: string;
	readTimeMins: number;
	publishedAt: number;
	authorName: string;
	visibility: string;
}

export interface BlogSearchDocument {
	id: string;
	content: BlogPostContent;
	metadata: BlogPostMetadata;
}

/**
 * Upsert a blog post into the search index
 */
export async function upsertBlogPost(doc: BlogSearchDocument): Promise<void> {
	await blogIndex.upsert([doc]);
}

/**
 * Delete a blog post from the search index
 */
export async function deleteBlogPost(id: string): Promise<void> {
	await blogIndex.delete([id]);
}

/**
 * Search for blog posts
 */
export async function searchBlogPosts(
	query: string,
	options?: {
		labels?: string[];
		limit?: number;
	}
) {
	const { labels, limit = 10 } = options || {};

	// Build filter for labels if provided
	// Upstash Search filter syntax for array: labels = 'value'
	let filter: string | undefined;
	if (labels && labels.length > 0) {
		// For multiple labels, use AND
		filter = labels.map((label) => `labels = '${label}'`).join(" AND ");
	}

	const results = await blogIndex.search({
		query,
		limit,
		filter,
	});

	return results;
}
