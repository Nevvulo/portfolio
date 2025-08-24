import { graphql } from "@octokit/graphql";

export default async function getLastDiscussions(token: string) {
  return graphql(
    `
      {
        repository(owner: "Nevvulo", name: "blog") {
          discussions(first: 10) {
            nodes {
              id
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
      }
    `,
    {
      headers: {
        authorization: `token ${token}`,
      },
    },
  );
}
