export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  labels?: string[];
  location: string;
  difficulty?: string;
  reviewedBy?: string;
  author?: string;
  keyIdeas?: string[];
  coverAuthor?: string;
  coverAuthorUrl?: string;
  readTimeMins?: number;
}

export type Blogmap = (BlogPost & {
  discussionId: string;
  discussionNo: number;
  mediumId: string;
  mediumUrl: string;
})[];

export type BlogPostContent = string;
