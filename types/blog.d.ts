export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  publishedAt?: number;
  labels?: string[];
  location: string;
  difficulty?: string;
  reviewedBy?: string;
  author?: string;
  keyIdeas?: string[];
  coverAuthor?: string;
  coverAuthorUrl?: string;
  readTimeMins?: number;
  aiDisclosureStatus?: "none" | "llm-assisted" | "llm-reviewed";
}

export type Blogmap = (BlogPost & {
  discussionId: string;
  discussionNo: number;
  mediumId: string;
  mediumUrl: string;
  hashnodeId: string;
  hashnodeUrl: string;
  devToUrl: string;
  devToUrl: string;
})[];

export type BlogPostContent = string;
