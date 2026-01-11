import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/router";
import { api } from "../convex/_generated/api";
import { useDebounce } from "./useDebounce";

export interface SearchResult {
	slug: string;
	title: string;
	description: string;
	labels: string[];
	difficulty: string;
	contentType: string;
	coverImage: string;
	readTimeMins: number;
	publishedAt: number;
	authorName: string;
	score: number;
}

interface UseBlogSearchReturn {
	query: string;
	setQuery: (query: string) => void;
	selectedLabels: string[];
	toggleLabel: (label: string) => void;
	clearLabels: () => void;
	results: SearchResult[] | null;
	isSearching: boolean;
	error: string | null;
	allLabels: string[];
	isActive: boolean;
	clearAll: () => void;
}

export function useBlogSearch(): UseBlogSearchReturn {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
	const [results, setResults] = useState<SearchResult[] | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const initializedRef = useRef(false);

	// Initialize from URL query params on mount
	useEffect(() => {
		if (initializedRef.current || !router.isReady) return;
		initializedRef.current = true;

		const labelParam = router.query.label;
		if (labelParam) {
			const labels = Array.isArray(labelParam) ? labelParam : [labelParam];
			setSelectedLabels(labels);
		}
	}, [router.isReady, router.query.label]);

	// Sync URL when labels change (after initialization)
	useEffect(() => {
		if (!router.isReady || !initializedRef.current) return;

		const currentLabel = router.query.label;
		const currentLabels = Array.isArray(currentLabel) ? currentLabel : currentLabel ? [currentLabel] : [];

		// Only update if labels actually changed
		const labelsMatch =
			selectedLabels.length === currentLabels.length &&
			selectedLabels.every((l) => currentLabels.includes(l));

		if (!labelsMatch) {
			const newQuery = { ...router.query };
			if (selectedLabels.length > 0) {
				newQuery.label = selectedLabels.length === 1 ? selectedLabels[0] : selectedLabels;
			} else {
				delete newQuery.label;
			}
			router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
		}
	}, [selectedLabels, router]);

	// Debounce the search query
	const debouncedQuery = useDebounce(query, 300);

	// Get all available labels from Convex
	const allLabels = useQuery(api.search.getAllLabels) ?? [];

	// Perform search when query or labels change
	const performSearch = useCallback(async (searchQuery: string, labels: string[]) => {
		// If no query and no labels, clear results
		if (!searchQuery.trim() && labels.length === 0) {
			setResults(null);
			setError(null);
			return;
		}

		setIsSearching(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			if (searchQuery.trim()) {
				params.set("q", searchQuery.trim());
			}
			if (labels.length > 0) {
				params.set("labels", labels.join(","));
			}
			params.set("limit", "20");

			const response = await fetch(`/api/blog/search?${params.toString()}`);

			// Check content type to ensure we're getting JSON
			const contentType = response.headers.get("content-type");
			if (!contentType?.includes("application/json")) {
				throw new Error("Search service unavailable");
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Search failed");
			}

			setResults(data.results);
		} catch (err) {
			console.error("[useBlogSearch] Error:", err);
			setError(err instanceof Error ? err.message : "Search failed");
			setResults([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

	// Trigger search when debounced query or labels change
	useEffect(() => {
		performSearch(debouncedQuery, selectedLabels);
	}, [debouncedQuery, selectedLabels, performSearch]);

	const toggleLabel = useCallback((label: string) => {
		setSelectedLabels((prev) =>
			prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
		);
	}, []);

	const clearLabels = useCallback(() => {
		setSelectedLabels([]);
	}, []);

	const clearAll = useCallback(() => {
		setQuery("");
		setSelectedLabels([]);
		setResults(null);
		setError(null);
	}, []);

	const isActive = query.length > 0 || selectedLabels.length > 0;

	return {
		query,
		setQuery,
		selectedLabels,
		toggleLabel,
		clearLabels,
		results,
		isSearching,
		error,
		allLabels,
		isActive,
		clearAll,
	};
}

export default useBlogSearch;
