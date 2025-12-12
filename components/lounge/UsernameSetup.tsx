import { useState, useEffect } from "react";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
import { Check, X, Loader2, AtSign } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../constants/lounge";
import { useDebounce } from "../../hooks/useDebounce";

interface UsernameSetupProps {
  onComplete: (username: string) => void;
  onSkip?: () => void;
}

export function UsernameSetup({ onComplete, onSkip }: UsernameSetupProps) {
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(username, 300);
  const setUsernameMutation = useMutation(api.users.setUsername);

  // Check username availability
  const availability = useQuery(
    api.users.checkUsername,
    debouncedUsername.length >= 3 ? { username: debouncedUsername } : "skip"
  );

  useEffect(() => {
    if (debouncedUsername.length >= 3) {
      setChecking(true);
    }
  }, [debouncedUsername]);

  useEffect(() => {
    if (availability !== undefined) {
      setChecking(false);
      if (!availability.available) {
        setError(availability.reason || "Username not available");
      } else {
        setError(null);
      }
    }
  }, [availability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.length < 3 || error || checking) return;

    setIsSubmitting(true);
    try {
      await setUsernameMutation({ username });
      onComplete(username);
    } catch (err: any) {
      setError(err.message || "Failed to set username");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(value);
    setError(null);
  };

  const isValid = username.length >= 3 && !error && !checking && availability?.available;

  return (
    <Container>
      <Header>
        <Title>Choose your username</Title>
        <Subtitle>
          This will be your unique profile URL and how others can find you.
        </Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        <InputWrapper>
          <InputPrefix>
            <AtSign size={18} />
          </InputPrefix>
          <Input
            type="text"
            value={username}
            onChange={handleChange}
            placeholder="username"
            maxLength={20}
            autoFocus
          />
          <StatusIcon>
            {checking && <Loader2 size={18} className="spin" />}
            {!checking && isValid && <Check size={18} color={LOUNGE_COLORS.online} />}
            {!checking && error && username.length >= 3 && <X size={18} color="#ef4444" />}
          </StatusIcon>
        </InputWrapper>

        {username && (
          <Preview>
            nev.so/@{username || "username"}
          </Preview>
        )}

        {error && username.length >= 3 && (
          <ErrorMessage>{error}</ErrorMessage>
        )}

        {username.length > 0 && username.length < 3 && (
          <HintMessage>Username must be at least 3 characters</HintMessage>
        )}

        <ButtonRow>
          {onSkip && (
            <SkipButton type="button" onClick={onSkip}>
              Skip for now
            </SkipButton>
          )}
          <SubmitButton type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </SubmitButton>
        </ButtonRow>
      </Form>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  max-width: 400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  padding: 0 1rem;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const InputPrefix = styled.span`
  color: rgba(255, 255, 255, 0.4);
  margin-right: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 0;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  font-family: inherit;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    outline: none;
  }
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  margin-left: 0.5rem;

  .spin {
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

const Preview = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: ${LOUNGE_COLORS.tier1};
  padding: 0.5rem;
  background: rgba(144, 116, 242, 0.1);
  border-radius: 6px;
`;

const ErrorMessage = styled.div`
  font-size: 0.85rem;
  color: #ef4444;
  text-align: center;
`;

const HintMessage = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${LOUNGE_COLORS.tier1};
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${LOUNGE_COLORS.tier1}dd;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
`;

const SkipButton = styled.button`
  padding: 0.75rem 1rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }
`;

export default UsernameSetup;
