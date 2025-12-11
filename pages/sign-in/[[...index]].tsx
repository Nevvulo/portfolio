import { SignIn } from "@clerk/nextjs";
import Head from "next/head";
import styled from "styled-components";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function SignInPage() {
  return (
    <SignInView>
      <SimpleNavbar backRoute="/" />

      <SignInContainer>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/account"
        />
      </SignInContainer>

      <Head>
        <title>Sign In - Nevulo</title>
        <meta name="description" content="Sign in to your Nevulo account" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
    </SignInView>
  );
}

const SignInView = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${(props) => props.theme.background};
`;

const SignInContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;
