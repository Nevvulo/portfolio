import type { BlogPostContent, Blogmap } from "../types/blog";

export default async function getFile<T extends Location>(
  location: T,
  mode: ResponseMode = "json"
): Promise<
  | (T extends Location
      ? T extends "blogmap.json"
        ? Blogmap
        : T extends `posts/${string}`
        ? BlogPostContent
        : undefined
      : undefined)
  | undefined
> {
  try {
    if (isKnownFileLocation(location)) {
      const res = await fetch(
        `https://raw.githubusercontent.com/Nevvulo/blog/main/${location}`
      );
      return await res[mode]();
    } else {
      throw new Error("getFile was called with an unexpected file location");
    }
  } catch (err) {
    return undefined;
  }
}

const KnownFileLocations = ["schema.json", "blogmap.json"] as const;
const isKnownFileLocation = (
  location: KnownFileLocation | UnknownFileLocation
): location is KnownFileLocation => {
  return isBlogmap(location) || isBlogPost(location) || isSchema(location);
};

const isBlogmap = (location: Location): location is "blogmap.json" =>
  location === "blogmap.json";
const isBlogPost = (location: Location): location is `posts/${string}` =>
  location.startsWith("posts/");
const isSchema = (location: Location): location is "schema.json" =>
  location === "schema.json";

type KnownFileLocation = typeof KnownFileLocations[number] | `posts/${string}`;
type UnknownFileLocation = string;
type Location = KnownFileLocation | UnknownFileLocation;
type ResponseMode = "text" | "json";
