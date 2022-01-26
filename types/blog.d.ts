export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  labels?: string[];
  location: string;
}

export type Blogmap = (BlogPost & {
  discussionId: string;
  discussionNo: number;
})[];

export type BlogPostContent = string;
