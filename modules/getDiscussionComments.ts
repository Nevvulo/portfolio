import { graphql } from "@octokit/graphql";

export default async function getDiscussionComments(
  discussionId: number,
  token: string
) {
  const data = await graphql(
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
  const comments = (data as any).repository.discussion.comments;
  return { total: comments.totalCount, comments: comments.nodes };
}
