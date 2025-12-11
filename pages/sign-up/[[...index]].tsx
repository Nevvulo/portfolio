import { SignUp } from "@clerk/nextjs";
import Head from "next/head";
import styled from "styled-components";
import { SimpleNavbar } from "../../components/navbar/simple";

export default function SignUpPage() {
  return (
    <SignUpView>
      <SimpleNavbar backRoute="/" />

      <SignUpContainer>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/account"
        />
      </SignUpContainer>

      <Head>
        <title>Sign Up - Nevulo</title>
        <meta name="description" content="Create your Nevulo account" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
    </SignUpView>
  );
}

const SignUpView = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${(props) => props.theme.background};
`;

const SignUpContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;
