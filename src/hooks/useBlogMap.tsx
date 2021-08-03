import { useRepoFile } from "./useRepoFile";

export const useBlogMap = (): Record<string, string>[] | undefined => {
  const { loading, contents, error } = useRepoFile("blogmap.json", "json");
  if (loading) return;
  if (error) throw new Error(error);
  if (typeof contents === "string") return;
  return contents;
};
