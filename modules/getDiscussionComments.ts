import { graphql } from "@octokit/graphql";

export type GetDiscussionCommentsResponseNode = {
  publishedAt: string;
  body: string;
  author: {
    login: string;
    avatarUrl: string;
  };
};
interface GetDiscussionCommentsResponse {
  repository: {
    discussion: {
      comments: {
        totalCount: number;
        nodes: GetDiscussionCommentsResponseNode[];
      };
    };
  };
}

export default async function getDiscussionComments(
  discussionId: number,
  token: string
) {
  const data = await graphql<GetDiscussionCommentsResponse>(
    `
      {
        repository(owner: "Nevvulo", name: "blog") {
          discussion(number: ${discussionId}) {
            comments(first: 10) {
              totalCount
              nodes {
                publishedAt
                body
                author {
                  login
                  avatarUrl
                }
              }
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `token ${token}`,
      },
    }
  );

  const { totalCount: total, nodes: comments } =
    data.repository.discussion.comments;
  return { total, comments };
}
