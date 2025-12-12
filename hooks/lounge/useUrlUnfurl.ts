import { useState, useEffect, useRef } from "react";
import type { MessageEmbed } from "../../types/lounge";

// URL detection regex
const URL_REGEX = /https?:\/\/[^\s<>"\]]+/gi;

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 500;

interface UseUrlUnfurlResult {
  embeds: MessageEmbed[];
  isLoading: boolean;
  urls: string[];
}

export function useUrlUnfurl(content: string): UseUrlUnfurlResult {
  const [embeds, setEmbeds] = useState<MessageEmbed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  // Cache for unfurled URLs to avoid re-fetching
  const cacheRef = useRef<Map<string, MessageEmbed>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Extract URLs from content
    const detectedUrls = content.match(URL_REGEX) || [];

    // Deduplicate URLs
    const uniqueUrls = [...new Set(detectedUrls)];

    setUrls(uniqueUrls);

    if (uniqueUrls.length === 0) {
      setEmbeds([]);
      setIsLoading(false);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce the unfurl request
    const timeoutId = setTimeout(() => {
      unfurlUrls(uniqueUrls);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [content]);

  const unfurlUrls = async (urlsToUnfurl: string[]) => {
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const newEmbeds: MessageEmbed[] = [];

      for (const url of urlsToUnfurl) {
        // Check cache first
        const cached = cacheRef.current.get(url);
        if (cached) {
          newEmbeds.push(cached);
          continue;
        }

        try {
          const response = await fetch("/api/lounge/unfurl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
            signal: abortControllerRef.current?.signal,
          });

          if (response.ok) {
            const data = await response.json();
            const embed: MessageEmbed = {
              type: data.type,
              url: data.url,
              title: data.title,
              description: data.description,
              thumbnail: data.thumbnail,
              siteName: data.siteName,
              embedUrl: data.embedUrl,
            };

            // Cache the result
            cacheRef.current.set(url, embed);
            newEmbeds.push(embed);
          }
        } catch (err) {
          // Ignore individual URL errors, just skip them
          if (err instanceof Error && err.name === "AbortError") {
            return; // Request was cancelled
          }
          console.error(`Failed to unfurl ${url}:`, err);
        }
      }

      setEmbeds(newEmbeds);
    } finally {
      setIsLoading(false);
    }
  };

  return { embeds, isLoading, urls };
}
