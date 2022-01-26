import Link from "next/link";
import { Text, Title } from "../../components/generics";
import { BlogView } from "../../components/layout/blog";
import { ROUTES } from "../../constants/routes";

export default function PostNotFound() {
  return (
    <BlogView>
      <Title>Oops!</Title>
      <Text>We couldn't find the post you were looking for.</Text>
      <Link href={ROUTES.BLOG.ROOT}>Back to the Blog</Link>
    </BlogView>
  );
}
