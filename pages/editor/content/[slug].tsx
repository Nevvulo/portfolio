import { useQuery as useRQ } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { getPostBySlugForEdit as getPostBySlugForEditAction } from "@/src/db/client/queries";

// Dynamically import PostEditor to avoid SSR issues
const PostEditor = dynamic(() => import("../../admin/blog/index").then((mod) => mod.PostEditor), {
  ssr: false,
  loading: () => (
    <LoadingContainer>
      <Loader2 className="spinner" size={24} />
      <LoadingText>Loading editor...</LoadingText>
    </LoadingContainer>
  ),
});

export const getServerSideProps = () => ({ props: {} });

export default function EditContentPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [mounted, setMounted] = useState(false);

  // Fetch post by slug (includes edit access check)
  const { data: post, isLoading: postLoading } = useRQ({
    queryKey: ["post", "edit", slug],
    queryFn: () => getPostBySlugForEditAction(slug as string),
    enabled: !!slug,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || postLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Edit Content" />
        <Container>
          <LoadingContainer>
            <Loader2 className="spinner" size={24} />
            <LoadingText>Loading...</LoadingText>
          </LoadingContainer>
        </Container>
      </BlogView>
    );
  }

  if (post === null) {
    return (
      <>
        <Head>
          <title>Access Denied | Content Editor</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Edit Content" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to edit this content, or it doesn't exist.</Text>
            <BackButton onClick={() => router.back()}>
              <ArrowLeft size={16} />
              Go Back
            </BackButton>
          </Container>
        </BlogView>
      </>
    );
  }

  const handleClose = () => {
    // Navigate back to the post or learn page
    if (post.status === "published") {
      router.push(`/learn/${post.slug}`);
    } else {
      router.push("/learn");
    }
  };

  return (
    <>
      <Head>
        <title>Edit: {post.title} | Content Editor</title>
      </Head>
      <BlogView>
        <SimpleNavbar
          title={`Editing: ${post.title}`}
          backRoute={post.status === "published" ? `/learn/${post.slug}` : "/learn"}
        />
        <AdminContainer>
          <PostEditor post={post} onClose={handleClose} />
        </AdminContainer>
      </BlogView>
    </>
  );
}

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 60px 20px;
  text-align: center;
`;

const AdminContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  margin-bottom: 12px;
`;

const Text = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(144, 116, 242, 0.15);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 8px;
  color: #9074f2;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.25);
    border-color: rgba(144, 116, 242, 0.5);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  margin-top: 12px;
`;
