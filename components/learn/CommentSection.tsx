import { useUser } from "@clerk/nextjs";
import {
  faCrown,
  faEye,
  faFaceSmile,
  faFire,
  faFlag,
  faHeart,
  faLightbulb,
  faPaperPlane,
  faReply,
  faSpinner,
  faStar,
  faThumbsUp,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../constants/lounge";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { UserPopoutTrigger } from "../lounge/user-popout";

// Reaction types for comments
const COMMENT_REACTIONS = [
  { type: "heart" as const, icon: faHeart, label: "Heart" },
  { type: "thumbs_up" as const, icon: faThumbsUp, label: "Thumbs up" },
  { type: "fire" as const, icon: faFire, label: "Fire" },
  { type: "eyes" as const, icon: faEye, label: "Eyes" },
  { type: "thinking" as const, icon: faLightbulb, label: "Thinking" },
  { type: "laugh" as const, icon: faFaceSmile, label: "Laugh" },
];

type CommentReactionType = "heart" | "thumbs_up" | "eyes" | "fire" | "thinking" | "laugh";

// Role constants (must match convex/auth.ts)
const ROLE_STAFF = 1;

interface CommentSectionProps {
  postId: Id<"blogPosts">;
}

interface CommentAuthor {
  _id: Id<"users">;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  tier?: string;
  isCreator?: boolean;
}

interface Comment {
  _id: Id<"blogComments">;
  postId: Id<"blogPosts">;
  authorId: Id<"users">;
  content: string;
  parentId?: Id<"blogComments">;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: number;
  editedAt?: number;
  author: CommentAuthor | null;
  replies: (Comment & { author: CommentAuthor | null })[];
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { isSignedIn } = useUser();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"blogComments"> | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current Convex user for ID comparison and staff check (only when signed in)
  const currentUser = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const comments = useQuery(api.blogComments.list, { postId }) as Comment[] | undefined;
  const commentCount = useQuery(api.blogComments.getCount, { postId });
  const createComment = useMutation(api.blogComments.create);
  const deleteComment = useMutation(api.blogComments.deleteComment);
  const reportComment = useMutation(api.blogComments.report);
  const grantCommentXp = useMutation(api.experience.grantCommentXp);

  // Comment reactions
  const commentReactions = useQuery(api.blogCommentReactions.getForPost, { postId });
  const myCommentReactions = useQuery(
    api.blogCommentReactions.getMyReactionsForPost,
    isSignedIn ? { postId } : "skip",
  );
  const toggleReaction = useMutation(api.blogCommentReactions.toggle);

  // Check if current user is staff/creator (role >= 1 or isCreator flag)
  const isStaff = currentUser?.isCreator || (currentUser?.role ?? 0) >= ROLE_STAFF;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({ postId, content: newComment.trim() });
      setNewComment("");
      // Grant XP for commenting (backend handles daily limits)
      grantCommentXp({ postId }).catch(console.error);
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: Id<"blogComments">) => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({ postId, content: replyContent.trim(), parentId });
      setReplyContent("");
      setReplyingTo(null);
      // Grant XP for replying too (backend handles daily limits)
      grantCommentXp({ postId }).catch(console.error);
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: Id<"blogComments">) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment({ commentId });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleReport = async (commentId: Id<"blogComments">) => {
    const reason = prompt("Why are you reporting this comment?");
    if (reason === null) return;
    try {
      await reportComment({ commentId, reason: reason || undefined });
      alert("Comment reported. Thank you for helping keep our community safe.");
    } catch (error: any) {
      alert(error.message || "Failed to report comment");
    }
  };

  return (
    <Container>
      <Header>
        <Title>Comments</Title>
        <Count>{commentCount ?? 0}</Count>
      </Header>

      {/* Comment form */}
      {isSignedIn ? (
        <CommentForm onSubmit={handleSubmit}>
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={2000}
          />
          <FormActions>
            <CharCount $warning={newComment.length > 1800}>{newComment.length}/2000</CharCount>
            <SubmitButton type="submit" disabled={!newComment.trim() || isSubmitting}>
              {isSubmitting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Post
                </>
              )}
            </SubmitButton>
          </FormActions>
        </CommentForm>
      ) : (
        <SignInPrompt>
          <a href="/sign-in">Sign in</a> to join the conversation
        </SignInPrompt>
      )}

      {/* Comments list */}
      <CommentList>
        {comments?.length === 0 && <EmptyState>Be the first to comment!</EmptyState>}
        {comments?.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            currentUserId={currentUser?._id}
            isStaff={isStaff}
            isSignedIn={!!isSignedIn}
            onDelete={handleDelete}
            onReport={handleReport}
            onReply={(id) => {
              setReplyingTo(id);
              setReplyContent("");
            }}
            replyingTo={replyingTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            handleReply={handleReply}
            isSubmitting={isSubmitting}
            reactions={commentReactions?.[comment._id.toString()]}
            myReaction={myCommentReactions?.[comment._id.toString()]}
            onToggleReaction={(commentId, type) => toggleReaction({ commentId, type })}
            allReactions={commentReactions}
            allMyReactions={myCommentReactions}
          />
        ))}
      </CommentList>
    </Container>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: Id<"users">;
  isStaff: boolean;
  isSignedIn: boolean;
  onDelete: (id: Id<"blogComments">) => void;
  onReport: (id: Id<"blogComments">) => void;
  onReply: (id: Id<"blogComments">) => void;
  replyingTo: Id<"blogComments"> | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleReply: (parentId: Id<"blogComments">) => void;
  isSubmitting: boolean;
  isReply?: boolean;
  reactions?: { counts: Record<string, number>; total: number };
  myReaction?: string;
  onToggleReaction: (commentId: Id<"blogComments">, type: CommentReactionType) => void;
  // Full maps for nested replies
  allReactions?: Record<string, { counts: Record<string, number>; total: number }>;
  allMyReactions?: Record<string, string>;
}

function CommentItem({
  comment,
  currentUserId,
  isStaff,
  isSignedIn,
  onDelete,
  onReport,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  handleReply,
  isSubmitting,
  isReply = false,
  reactions,
  myReaction,
  onToggleReaction,
  allReactions,
  allMyReactions,
}: CommentItemProps) {
  const [showActions, setShowActions] = useState(false);

  // Check if current user is the author of this comment
  const isAuthor = currentUserId && comment.author?._id === currentUserId;
  // Can delete if author of the comment OR is staff
  const canDelete = isAuthor || isStaff;

  return (
    <CommentCard
      $isReply={isReply}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CommentHeader>
        <AuthorInfo>
          {comment.author?._id ? (
            <AuthorTrigger userId={comment.author._id}>
              {comment.author.avatarUrl ? (
                <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} />
              ) : (
                <AvatarPlaceholder>
                  {comment.author.displayName?.charAt(0) || "?"}
                </AvatarPlaceholder>
              )}
            </AuthorTrigger>
          ) : (
            <AvatarPlaceholder>?</AvatarPlaceholder>
          )}
          <AuthorMeta>
            <AuthorName>
              {comment.author?._id ? (
                <AuthorNameTrigger userId={comment.author._id}>
                  {comment.author.displayName || "Unknown"}
                </AuthorNameTrigger>
              ) : (
                "Unknown"
              )}
              {comment.author?.isCreator && <StaffBadge>staff</StaffBadge>}
              {comment.author?.tier === "tier1" && (
                <TierBadge $tier="tier1">
                  <FontAwesomeIcon icon={faStar} />
                  Super Legend
                </TierBadge>
              )}
              {comment.author?.tier === "tier2" && (
                <TierBadge $tier="tier2">
                  <FontAwesomeIcon icon={faCrown} />
                  Super Legend II
                </TierBadge>
              )}
            </AuthorName>
            <Timestamp>
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              {comment.isEdited && <EditedLabel>(edited)</EditedLabel>}
            </Timestamp>
          </AuthorMeta>
        </AuthorInfo>

        {/* Hover actions */}
        <Actions $visible={showActions}>
          {isSignedIn && !isReply && (
            <ActionButton onClick={() => onReply(comment._id)} title="Reply">
              <FontAwesomeIcon icon={faReply} />
            </ActionButton>
          )}
          {isSignedIn && !isAuthor && (
            <ActionButton onClick={() => onReport(comment._id)} title="Report" $danger>
              <FontAwesomeIcon icon={faFlag} />
            </ActionButton>
          )}
          {canDelete && (
            <ActionButton onClick={() => onDelete(comment._id)} title="Delete" $danger>
              <FontAwesomeIcon icon={faTrash} />
            </ActionButton>
          )}
        </Actions>
      </CommentHeader>

      <CommentContent>{comment.content}</CommentContent>

      {/* Reactions bar - only show for signed in users */}
      {isSignedIn && (
        <ReactionRow>
          {COMMENT_REACTIONS.map(({ type, icon, label }) => {
            const count = reactions?.counts[type] || 0;
            const isActive = myReaction === type;
            return (
              <ReactionChip
                key={type}
                $active={isActive}
                onClick={() => onToggleReaction(comment._id, type)}
                title={label}
              >
                <FontAwesomeIcon icon={icon} />
                {count > 0 && <span>{count}</span>}
              </ReactionChip>
            );
          })}
        </ReactionRow>
      )}

      {/* Reply form */}
      {replyingTo === comment._id && (
        <ReplyForm>
          <ReplyInput
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            maxLength={2000}
          />
          <ReplyActions>
            <CancelButton onClick={() => onReply(null as any)}>Cancel</CancelButton>
            <ReplyButton
              onClick={() => handleReply(comment._id)}
              disabled={!replyContent.trim() || isSubmitting}
            >
              {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : "Reply"}
            </ReplyButton>
          </ReplyActions>
        </ReplyForm>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <RepliesContainer>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={{ ...reply, replies: [] }}
              currentUserId={currentUserId}
              isStaff={isStaff}
              isSignedIn={isSignedIn}
              onDelete={onDelete}
              onReport={onReport}
              onReply={onReply}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleReply={handleReply}
              isSubmitting={isSubmitting}
              isReply
              reactions={allReactions?.[reply._id.toString()]}
              myReaction={allMyReactions?.[reply._id.toString()]}
              onToggleReaction={onToggleReaction}
              allReactions={allReactions}
              allMyReactions={allMyReactions}
            />
          ))}
        </RepliesContainer>
      )}
    </CommentCard>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  padding: 40px 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const Count = styled.span`
  background: ${(props) => props.theme.linkColor}22;
  color: ${(props) => props.theme.linkColor};
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-mono);
`;

const CommentForm = styled.form`
  margin-bottom: 32px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.linkColor};
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const FormActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
`;

const CharCount = styled.span<{ $warning: boolean }>`
  font-size: 12px;
  color: ${(props) => (props.$warning ? "#ff6b6b" : "rgba(255, 255, 255, 0.4)")};
  font-family: var(--font-mono);
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: ${(props) => props.theme.linkColor};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SignInPrompt = styled.div`
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 32px;
  color: ${(props) => props.theme.textColor};

  a {
    color: ${(props) => props.theme.linkColor};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${(props) => props.theme.textColor};
  font-size: 15px;
`;

const CommentCard = styled.div<{ $isReply?: boolean }>`
  padding: ${(props) => (props.$isReply ? "10px 12px" : "16px")};
  background: rgba(255, 255, 255, 0.03);
  border-radius: ${(props) => (props.$isReply ? "8px" : "12px")};
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const CommentHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => props.theme.linkColor}33;
  color: ${(props) => props.theme.linkColor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
`;

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AuthorName = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
  flex-wrap: wrap;
  row-gap: 4px;
`;

const AuthorTrigger = styled(UserPopoutTrigger)`
  flex-shrink: 0;
`;

const AuthorNameTrigger = styled(UserPopoutTrigger)`
  font-weight: 600;
  color: ${(props) => props.theme.contrast};

  &:hover {
    text-decoration: underline;
  }
`;

const StaffBadge = styled.span`
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TierBadge = styled.span<{ $tier: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: ${(props) => (props.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1)}22;
  border: 1px solid ${(props) => (props.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1)}44;
  border-radius: 4px;
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => (props.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1)};
  white-space: nowrap;
  flex-shrink: 0;

  svg {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const EditedLabel = styled.span`
  margin-left: 4px;
  font-style: italic;
`;

const Actions = styled.div<{ $visible: boolean }>`
  display: flex;
  gap: 4px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.15s ease;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: ${(props) => (props.$danger ? "#ff6b6b" : "rgba(255, 255, 255, 0.6)")};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$danger ? "rgba(255, 107, 107, 0.15)" : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.$danger ? "#ff6b6b" : "rgba(255, 255, 255, 0.9)")};
  }
`;

const CommentContent = styled.p`
  margin: 0;
  color: ${(props) => props.theme.textColor};
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ReplyForm = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const ReplyInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.linkColor};
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ReplyActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: ${(props) => props.theme.textColor};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ReplyButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: ${(props) => props.theme.linkColor};
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RepliesContainer = styled.div`
  margin-top: 16px;
  margin-left: 24px;
  padding-left: 16px;
  border-left: 2px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReactionRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const ReactionChip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  min-width: 42px;
  height: 26px;
  border-radius: 12px;
  border: 1px solid ${(props) =>
    props.$active ? "rgba(144, 116, 242, 0.4)" : "rgba(255, 255, 255, 0.1)"};
  background: ${(props) =>
    props.$active ? "rgba(144, 116, 242, 0.15)" : "rgba(255, 255, 255, 0.03)"};
  color: ${(props) => (props.$active ? "#9074f2" : "rgba(255, 255, 255, 0.5)")};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  span {
    font-family: var(--font-mono);
    font-size: 11px;
    min-width: 8px;
  }
`;

export default CommentSection;
