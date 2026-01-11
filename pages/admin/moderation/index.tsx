import Head from "next/head";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { useTierAccess } from "../../../hooks/lounge/useTierAccess";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Clock,
  User,
  MessageSquare,
  FileText,
  Filter,
  ExternalLink,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const getServerSideProps = () => ({ props: {} });

type ReportStatus = "pending" | "reviewed" | "dismissed";
type ReportType = "comments" | "content";

export default function ModerationPage() {
  const [mounted, setMounted] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("content");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("pending");
  const { isLoading, isCreator } = useTierAccess();

  // Comment reports
  const commentReports = useQuery(
    api.blogComments.getReports,
    statusFilter === "all" ? {} : { status: statusFilter as ReportStatus }
  );
  const resolveCommentReport = useMutation(api.blogComments.resolveReport);

  // Content reports (from learn posts)
  const contentReports = useQuery(
    api.contentReports.getReports,
    statusFilter === "all" ? {} : { status: statusFilter as ReportStatus }
  );
  const resolveContentReport = useMutation(api.contentReports.resolve);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResolveComment = async (
    reportId: Id<"blogCommentReports">,
    status: "reviewed" | "dismissed",
    deleteComment = false
  ) => {
    try {
      await resolveCommentReport({ reportId, status, deleteComment });
    } catch (error) {
      console.error("Failed to resolve report:", error);
      alert("Failed to resolve report");
    }
  };

  const handleResolveContent = async (
    reportId: Id<"contentReports">,
    status: "reviewed" | "dismissed"
  ) => {
    try {
      await resolveContentReport({ reportId, status });
    } catch (error) {
      console.error("Failed to resolve report:", error);
      alert("Failed to resolve report");
    }
  };

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Moderation" />
        <Container>
          <p>Loading...</p>
        </Container>
      </BlogView>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Head>
          <title>Access Denied | Moderation</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Moderation" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access the moderation panel.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  const pendingCommentCount = commentReports?.filter((r) => r.status === "pending").length ?? 0;
  const pendingContentCount = contentReports?.filter((r) => r.status === "pending").length ?? 0;
  const totalPendingCount = pendingCommentCount + pendingContentCount;

  const reports = reportType === "comments" ? commentReports : contentReports;

  return (
    <>
      <Head>
        <title>Moderation | Nevulo Admin</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Moderation" />
        <AdminContainer>
          <Header>
            <HeaderTop>
              <Shield size={32} />
              <div>
                <Title>Moderation</Title>
                <Text>Review reported content and comments</Text>
              </div>
            </HeaderTop>
            {totalPendingCount > 0 && (
              <PendingBadge>
                <AlertTriangle size={14} />
                {totalPendingCount} pending {totalPendingCount === 1 ? "report" : "reports"}
              </PendingBadge>
            )}
          </Header>

          <TypeTabs>
            <TypeTab
              $active={reportType === "content"}
              onClick={() => setReportType("content")}
            >
              <FileText size={16} />
              Content Reports
              {pendingContentCount > 0 && <TabBadge>{pendingContentCount}</TabBadge>}
            </TypeTab>
            <TypeTab
              $active={reportType === "comments"}
              onClick={() => setReportType("comments")}
            >
              <MessageSquare size={16} />
              Comment Reports
              {pendingCommentCount > 0 && <TabBadge>{pendingCommentCount}</TabBadge>}
            </TypeTab>
          </TypeTabs>

          <FilterBar>
            <Filter size={16} />
            <FilterButton
              $active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </FilterButton>
            <FilterButton
              $active={statusFilter === "pending"}
              onClick={() => setStatusFilter("pending")}
            >
              <Clock size={14} />
              Pending
            </FilterButton>
            <FilterButton
              $active={statusFilter === "reviewed"}
              onClick={() => setStatusFilter("reviewed")}
            >
              <CheckCircle size={14} />
              Reviewed
            </FilterButton>
            <FilterButton
              $active={statusFilter === "dismissed"}
              onClick={() => setStatusFilter("dismissed")}
            >
              <XCircle size={14} />
              Dismissed
            </FilterButton>
          </FilterBar>

          <ReportsList>
            {reports === undefined ? (
              <EmptyState>Loading reports...</EmptyState>
            ) : reports.length === 0 ? (
              <EmptyState>
                <CheckCircle size={48} />
                <h3>All clear!</h3>
                <p>No {statusFilter !== "all" ? statusFilter : ""} reports to review.</p>
              </EmptyState>
            ) : reportType === "comments" ? (
              /* Comment Reports */
              (commentReports ?? []).map((report) => (
                <ReportCard key={report._id} $status={report.status}>
                  <ReportHeader>
                    <StatusBadge $status={report.status}>
                      {report.status === "pending" && <Clock size={12} />}
                      {report.status === "reviewed" && <CheckCircle size={12} />}
                      {report.status === "dismissed" && <XCircle size={12} />}
                      {report.status}
                    </StatusBadge>
                    <ReportTime>
                      Reported {formatDistanceToNow(report._creationTime, { addSuffix: true })}
                    </ReportTime>
                  </ReportHeader>

                  <CommentPreview>
                    <PreviewHeader>
                      <MessageSquare size={14} />
                      <span>Reported Comment</span>
                    </PreviewHeader>
                    {report.comment ? (
                      <>
                        <CommentAuthor>
                          <User size={12} />
                          {report.comment.author?.displayName || "Unknown User"}
                          {report.comment.author?.username && (
                            <Username>@{report.comment.author.username}</Username>
                          )}
                        </CommentAuthor>
                        <CommentContent>{report.comment.content}</CommentContent>
                      </>
                    ) : (
                      <DeletedNotice>Comment has been deleted</DeletedNotice>
                    )}
                  </CommentPreview>

                  <ReporterInfo>
                    <AlertTriangle size={12} />
                    Reported by:{" "}
                    <strong>{report.reporter?.displayName || "Unknown"}</strong>
                    {report.reporter?.username && (
                      <Username>@{report.reporter.username}</Username>
                    )}
                  </ReporterInfo>

                  {report.reason && (
                    <ReasonBox>
                      <strong>Reason:</strong> {report.reason}
                    </ReasonBox>
                  )}

                  {report.status === "pending" && (
                    <ActionButtons>
                      <ActionButton
                        $variant="success"
                        onClick={() => handleResolveComment(report._id, "reviewed", false)}
                        title="Mark as reviewed (keep comment)"
                      >
                        <Eye size={14} />
                        Keep & Resolve
                      </ActionButton>
                      <ActionButton
                        $variant="danger"
                        onClick={() => {
                          if (confirm("Delete this comment and resolve the report?")) {
                            handleResolveComment(report._id, "reviewed", true);
                          }
                        }}
                        title="Delete comment and resolve"
                      >
                        <Trash2 size={14} />
                        Delete & Resolve
                      </ActionButton>
                      <ActionButton
                        $variant="muted"
                        onClick={() => handleResolveComment(report._id, "dismissed", false)}
                        title="Dismiss report (false positive)"
                      >
                        <XCircle size={14} />
                        Dismiss
                      </ActionButton>
                    </ActionButtons>
                  )}

                  {report.resolvedAt && (
                    <ResolvedInfo>
                      Resolved {formatDistanceToNow(report.resolvedAt, { addSuffix: true })}
                    </ResolvedInfo>
                  )}
                </ReportCard>
              ))
            ) : (
              /* Content Reports */
              (contentReports ?? []).map((report) => (
                <ReportCard key={report._id} $status={report.status}>
                  <ReportHeader>
                    <StatusBadge $status={report.status}>
                      {report.status === "pending" && <Clock size={12} />}
                      {report.status === "reviewed" && <CheckCircle size={12} />}
                      {report.status === "dismissed" && <XCircle size={12} />}
                      {report.status}
                    </StatusBadge>
                    <ReportTime>
                      Reported {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                    </ReportTime>
                  </ReportHeader>

                  <CommentPreview>
                    <PreviewHeader>
                      <FileText size={14} />
                      <span>Reported Post</span>
                    </PreviewHeader>
                    {report.post ? (
                      <>
                        <PostTitle>
                          {report.post.title}
                          <Link href={`/learn/${report.post.slug}`} target="_blank">
                            <ExternalLink size={12} />
                          </Link>
                        </PostTitle>
                        <CategoryBadge $category={report.category}>
                          {report.category.replace(/_/g, " ")}
                        </CategoryBadge>
                      </>
                    ) : (
                      <DeletedNotice>Post has been deleted</DeletedNotice>
                    )}
                  </CommentPreview>

                  <ReporterInfo>
                    <AlertTriangle size={12} />
                    Reported by:{" "}
                    <strong>{report.reporter?.displayName || "Unknown"}</strong>
                    {report.reporter?.username && (
                      <Username>@{report.reporter.username}</Username>
                    )}
                  </ReporterInfo>

                  {report.reason && (
                    <ReasonBox>
                      <strong>Details:</strong> {report.reason}
                    </ReasonBox>
                  )}

                  {report.status === "pending" && (
                    <ActionButtons>
                      <ActionButton
                        $variant="success"
                        onClick={() => handleResolveContent(report._id, "reviewed")}
                        title="Mark as reviewed"
                      >
                        <Eye size={14} />
                        Mark Reviewed
                      </ActionButton>
                      <ActionButton
                        $variant="muted"
                        onClick={() => handleResolveContent(report._id, "dismissed")}
                        title="Dismiss report"
                      >
                        <XCircle size={14} />
                        Dismiss
                      </ActionButton>
                    </ActionButtons>
                  )}

                  {report.resolvedAt && (
                    <ResolvedInfo>
                      Resolved {formatDistanceToNow(report.resolvedAt, { addSuffix: true })}
                    </ResolvedInfo>
                  )}
                </ReportCard>
              ))
            )}
          </ReportsList>
        </AdminContainer>
      </BlogView>
    </>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const AdminContainer = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  svg {
    color: ${(props) => props.theme.linkColor};
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
`;

const Text = styled.p`
  margin: 4px 0 0;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const PendingBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
`;

const TypeTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const TypeTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${(props) =>
    props.$active ? props.theme.linkColor + "22" : props.theme.postBackground};
  border: 1px solid
    ${(props) => (props.$active ? props.theme.linkColor + "44" : "rgba(255, 255, 255, 0.08)")};
  border-radius: 10px;
  color: ${(props) =>
    props.$active ? props.theme.linkColor : props.theme.textColor};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active
        ? props.theme.linkColor + "33"
        : "rgba(255, 255, 255, 0.05)"};
  }
`;

const TabBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  border-radius: 10px;
  color: white;
  font-size: 11px;
  font-weight: 700;
`;

const PostTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin-bottom: 8px;

  a {
    color: ${(props) => props.theme.linkColor};
    opacity: 0.7;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
    }
  }
`;

const CategoryBadge = styled.span<{ $category: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.$category) {
      case "factual_error":
      case "infringement":
        return `
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        `;
      case "content_quality":
        return `
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        `;
      case "mention_removal":
      case "contact_request":
        return `
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.15);
          color: #9ca3af;
        `;
    }
  }}
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;

  > svg {
    color: ${(props) => props.theme.textColor};
    opacity: 0.5;
  }
`;

const FilterButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${(props) =>
    props.$active ? props.theme.linkColor + "22" : "transparent"};
  border: 1px solid
    ${(props) => (props.$active ? props.theme.linkColor + "44" : "transparent")};
  border-radius: 6px;
  color: ${(props) =>
    props.$active ? props.theme.linkColor : props.theme.textColor};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active
        ? props.theme.linkColor + "33"
        : "rgba(255, 255, 255, 0.05)"};
  }
`;

const ReportsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;

  svg {
    margin-bottom: 16px;
    opacity: 0.4;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const ReportCard = styled.div<{ $status: string }>`
  padding: 20px;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid
    ${(props) => {
      switch (props.$status) {
        case "pending":
          return "rgba(239, 68, 68, 0.3)";
        case "reviewed":
          return "rgba(34, 197, 94, 0.3)";
        case "dismissed":
          return "rgba(156, 163, 175, 0.3)";
        default:
          return "rgba(255, 255, 255, 0.08)";
      }
    }};
  border-radius: 12px;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.$status) {
      case "pending":
        return `
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        `;
      case "reviewed":
        return `
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        `;
      case "dismissed":
        return `
          background: rgba(156, 163, 175, 0.15);
          color: #9ca3af;
        `;
      default:
        return "";
    }
  }}
`;

const ReportTime = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const CommentPreview = styled.div`
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const CommentAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const Username = styled.span`
  font-weight: 400;
  opacity: 0.6;
`;

const CommentContent = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${(props) => props.theme.textColor};
  white-space: pre-wrap;
  word-break: break-word;
`;

const DeletedNotice = styled.div`
  font-size: 13px;
  font-style: italic;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
`;

const ReporterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 12px;

  svg {
    color: #f59e0b;
  }
`;

const ReasonBox = styled.div`
  padding: 10px 14px;
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  margin-bottom: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant: "success" | "danger" | "muted" }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) => {
    switch (props.$variant) {
      case "success":
        return `
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          &:hover { background: rgba(34, 197, 94, 0.25); }
        `;
      case "danger":
        return `
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          &:hover { background: rgba(239, 68, 68, 0.25); }
        `;
      case "muted":
        return `
          background: rgba(156, 163, 175, 0.15);
          color: #9ca3af;
          &:hover { background: rgba(156, 163, 175, 0.25); }
        `;
    }
  }}
`;

const ResolvedInfo = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
`;
