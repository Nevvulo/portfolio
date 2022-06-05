export interface LatestNevuletterResponse {
  error?: string;
  email: {
    id: string;
    url: string;
    image: string;
    title: string;
    createdAt: string;
    issueNo: number;
  } | null;
}
