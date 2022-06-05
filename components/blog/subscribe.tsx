import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import styled from "styled-components";
import COLORS from "../../constants/colors";
import { Container } from "../container";
import {
  faCheckCircle,
  faNewspaper,
  faSpinner,
  faTimes,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Title } from "../generics";

const SubscriptionBackground = styled(Container)`
  background-color: ${(props) => props.theme.subscriptionBackground};
  padding: 1em 3em;
  width: auto;
  margin: 12px 0em 12px 0em;
  border: 2px solid ${(props) => props.theme.postImageBoxShadow};
  border-radius: 0.5rem;
  flex-direction: column;

  @media (max-width: 650px) {
    padding: 1em;
    margin: 0em 0em 1em;
  }
`;

const SuccessBackground = styled(Container)`
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;
  background-color: rgba(92, 247, 95, 0.1);
  padding: 1em;
  width: auto;
  margin: 0.5rem 0;
  border: 2px solid rgba(229, 231, 235, 0.1);
  border-radius: 0.5rem;
  flex-direction: column;
`;

const ErrorBackground = styled(Container)`
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;
  background-color: rgba(247, 92, 92, 0.1);
  padding: 1em;
  width: auto;
  margin: 0.5rem 0;
  border: 2px solid rgba(229, 231, 235, 0.1);
  border-radius: 0.5rem;
  flex-direction: column;
`;

const InputContainer = styled(Container)`
  position: relative;
  background: white;
  border-radius: 0.5rem;
`;

const Input = styled.input.attrs({ placeholder: "john@gmail.com" })`
  font-family: "Inter", sans-serif;
  width: 100%;
  border: none;
  border-radius: 0.35rem;
  padding: 1rem;
  padding-right: 8rem;
`;

const SubscribeButton = styled.button`
  position: absolute;
  right: 12px;
  top: 6px;
  transition: all 0.15s;
  padding: 0.6rem;
  background-color: ${COLORS.LINK};
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-family: "Inter", sans-serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.3);

  :hover {
    transform: scale(1.1);
  }
`;

const Text = styled.p`
  font-family: "RobotoCondensed", sans-serif;
  font-weight: 400;
  font-size: 18px;
  margin: 0.25rem 4px 1rem 0;
  color: ${(props) => props.theme.subscriptionText};

  @media (max-width: 468px) {
    font-size: 17px;
  }
`;

interface NewsletterSubscriptionProps {
  onSubscribe?: (email: string) => void;
  loading?: boolean;
  success?: string;
  error?: string;
}
export function NewsletterSubscription({
  onSubscribe,
  loading,
  success,
  error,
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("");
  return (
    <SubscriptionBackground>
      <Title fontSize="1.5rem">Nevuletter</Title>
      <Text>
        <FontAwesomeIcon
          style={{ marginRight: 8, width: "16px", height: "16px" }}
          icon={faNewspaper}
        />
        Subscribe to the <b>Nevuletter</b> so you never miss new posts.
      </Text>
      {success && (
        <SuccessBackground>
          <span>
            <FontAwesomeIcon
              style={{ marginRight: "8px" }}
              icon={faCheckCircle}
            />
            {success ||
              `Great stuff - we've sent a verification e-mail to ${email}! 😎`}
          </span>
        </SuccessBackground>
      )}
      {error && !success && (
        <ErrorBackground>
          <span>
            <FontAwesomeIcon
              style={{ marginRight: "8px" }}
              icon={faTimesCircle}
            />
            {error ||
              "Uh-oh. Something went wrong while trying to sign you up for the Nevuletter, please try again soon!"}
          </span>
        </ErrorBackground>
      )}
      <InputContainer>
        <Input
          required
          autoComplete="email"
          type="email"
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <SubscribeButton
          type="submit"
          disabled={loading || !!success}
          onClick={() => onSubscribe?.(email)}
        >
          {loading ? (
            <FontAwesomeIcon className="fa-spin" icon={faSpinner} />
          ) : (
            "Subscribe"
          )}
        </SubscribeButton>
      </InputContainer>
    </SubscriptionBackground>
  );
}
