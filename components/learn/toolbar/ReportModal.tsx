import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  Flag,
  ChevronRight,
  AlertCircle,
  FileText,
  ThumbsDown,
  Scale,
  Mail,
  UserX,
  HelpCircle,
  ExternalLink,
  ArrowLeft,
  Check,
} from "lucide-react";
import { LOUNGE_COLORS } from "@/constants/lounge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

type ReportCategory =
  | "content_quality"
  | "factual_error"
  | "dislike"
  | "infringement"
  | "contact_request"
  | "mention_removal"
  | "other";

interface ReportOption {
  id: ReportCategory;
  icon: React.ReactNode;
  label: string;
  description: string;
  requiresText: boolean;
  redirectTo?: string; // If set, redirects instead of showing text input
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: "content_quality",
    icon: <FileText size={18} />,
    label: "Content/quality issue",
    description: "Typo, spelling mistake, or formatting problem",
    requiresText: true,
  },
  {
    id: "factual_error",
    icon: <AlertCircle size={18} />,
    label: "Major factual error",
    description: "Misreporting or misunderstanding of facts",
    requiresText: true,
  },
  {
    id: "dislike",
    icon: <ThumbsDown size={18} />,
    label: "I don't like this content",
    description: "Personal preference or disagreement",
    requiresText: true,
  },
  {
    id: "infringement",
    icon: <Scale size={18} />,
    label: "There's an infringement issue",
    description: "Copyright, trademark, or legal concern",
    requiresText: true,
  },
  {
    id: "contact_request",
    icon: <Mail size={18} />,
    label: "I need to get in touch directly",
    description: "Want to discuss this content privately",
    requiresText: false,
    redirectTo: "/contact",
  },
  {
    id: "mention_removal",
    icon: <UserX size={18} />,
    label: "I'm mentioned and want to be removed",
    description: "Request to remove personal mention",
    requiresText: true,
  },
  {
    id: "other",
    icon: <HelpCircle size={18} />,
    label: "It's something else",
    description: "Other issue not listed above",
    requiresText: true,
  },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"blogPosts">;
  postTitle?: string;
}

type ScreenState = "categories" | "text-input" | "success" | "already-reported";

export function ReportModal({ isOpen, onClose, postId, postTitle }: ReportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<ScreenState>("categories");
  const [selectedCategory, setSelectedCategory] = useState<ReportOption | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReport = useMutation(api.contentReports.create);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setScreen("categories");
      setSelectedCategory(null);
      setReason("");
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCategorySelect = useCallback((option: ReportOption) => {
    setSelectedCategory(option);

    if (option.redirectTo) {
      // Don't change screen, just show redirect info
      return;
    }

    if (option.requiresText) {
      setScreen("text-input");
    } else {
      // Submit immediately if no text required
      handleSubmit(option.id, "");
    }
  }, []);

  const handleSubmit = useCallback(
    async (category?: ReportCategory, submittedReason?: string) => {
      const cat = category || selectedCategory?.id;
      const text = submittedReason ?? reason;

      if (!cat) return;

      setIsSubmitting(true);
      try {
        await createReport({
          postId,
          category: cat,
          reason: text || undefined,
        });
        setScreen("success");
      } catch (error: any) {
        if (error.message?.includes("already reported")) {
          setScreen("already-reported");
        } else {
          console.error("Failed to submit report:", error);
          alert("Failed to submit report. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [createReport, postId, selectedCategory, reason]
  );

  const handleBack = useCallback(() => {
    setScreen("categories");
    setSelectedCategory(null);
    setReason("");
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <ModalWrapper onClick={onClose}>
            <ModalContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <HeaderLeft>
                  {screen === "text-input" && (
                    <BackButton onClick={handleBack}>
                      <ArrowLeft size={16} />
                    </BackButton>
                  )}
                  <HeaderTitle>
                    <Flag size={18} />
                    <span>Report Content</span>
                  </HeaderTitle>
                </HeaderLeft>
                <CloseButton onClick={onClose}>
                  <X size={18} />
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                <AnimatePresence mode="wait">
                  {screen === "categories" && (
                    <ScreenContainer
                      key="categories"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ScreenTitle>Is there something wrong?</ScreenTitle>
                      <ScreenSubtitle>
                        Pick from any of the options below to let staff know about your issue.
                      </ScreenSubtitle>

                      <OptionsList>
                        {REPORT_OPTIONS.map((option) => (
                          <OptionButton
                            key={option.id}
                            onClick={() => handleCategorySelect(option)}
                            $isRedirect={!!option.redirectTo}
                          >
                            <OptionIcon>{option.icon}</OptionIcon>
                            <OptionText>
                              <OptionLabel>{option.label}</OptionLabel>
                              <OptionDescription>{option.description}</OptionDescription>
                            </OptionText>
                            {option.redirectTo ? (
                              <ExternalLink size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </OptionButton>
                        ))}
                      </OptionsList>

                      {selectedCategory?.redirectTo && (
                        <RedirectNotice>
                          <p>
                            To get in touch directly about this content, please use our contact page
                            and reference the article title in your message.
                          </p>
                          <ContactLink href={selectedCategory.redirectTo}>
                            Go to Contact Page
                            <ExternalLink size={14} />
                          </ContactLink>
                        </RedirectNotice>
                      )}
                    </ScreenContainer>
                  )}

                  {screen === "text-input" && selectedCategory && (
                    <ScreenContainer
                      key="text-input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ScreenTitle>{selectedCategory.label}</ScreenTitle>
                      <ScreenSubtitle>
                        Please provide details to help us understand and address your concern.
                      </ScreenSubtitle>

                      <TextArea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        rows={5}
                        autoFocus
                      />

                      <SubmitButton
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting || !reason.trim()}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Report"}
                      </SubmitButton>
                    </ScreenContainer>
                  )}

                  {screen === "success" && (
                    <ScreenContainer
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SuccessIcon>
                        <Check size={32} />
                      </SuccessIcon>
                      <ScreenTitle>Report Submitted</ScreenTitle>
                      <ScreenSubtitle>
                        Thank you for your feedback. We'll review your report and take appropriate
                        action if needed.
                      </ScreenSubtitle>
                      <DoneButton onClick={onClose}>Done</DoneButton>
                    </ScreenContainer>
                  )}

                  {screen === "already-reported" && (
                    <ScreenContainer
                      key="already-reported"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <WarningIcon>
                        <AlertCircle size={32} />
                      </WarningIcon>
                      <ScreenTitle>Already Reported</ScreenTitle>
                      <ScreenSubtitle>
                        You've already submitted a report for this content. We're reviewing it and
                        will take action if needed.
                      </ScreenSubtitle>
                      <DoneButton onClick={onClose}>Got it</DoneButton>
                    </ScreenContainer>
                  )}
                </AnimatePresence>
              </ModalContent>
            </ModalContainer>
          </ModalWrapper>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Styled Components
const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
`;

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1101;
  padding: 20px;
`;

const ModalContainer = styled(m.div)`
  background: rgba(16, 13, 27, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 15px;

  svg {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const ScreenContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
`;

const ScreenTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: white;
`;

const ScreenSubtitle = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
`;

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OptionButton = styled.button<{ $isRedirect?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    border-color: rgba(144, 116, 242, 0.3);
  }

  > svg:last-child {
    margin-left: auto;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }
`;

const OptionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(144, 116, 242, 0.15);
  border-radius: 8px;
  color: ${LOUNGE_COLORS.tier1};
  flex-shrink: 0;
`;

const OptionText = styled.div`
  flex: 1;
  min-width: 0;
`;

const OptionLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 2px;
`;

const OptionDescription = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

const RedirectNotice = styled.div`
  margin-top: 16px;
  padding: 14px;
  background: rgba(144, 116, 242, 0.1);
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 10px;

  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
  }
`;

const ContactLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${LOUNGE_COLORS.tier1};
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  margin-bottom: 16px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: ${LOUNGE_COLORS.tier1};
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #7c5dd3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 50%;
  color: #22c55e;
  margin: 0 auto 16px;
`;

const WarningIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(234, 179, 8, 0.2);
  border-radius: 50%;
  color: #eab308;
  margin: 0 auto 16px;
`;

const DoneButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;
