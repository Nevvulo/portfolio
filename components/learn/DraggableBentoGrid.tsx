import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, Edit2, EyeOff, GripVertical, Send, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { BentoCard, type BentoCardProps } from "./BentoCard";

type BentoSize = "small" | "medium" | "large" | "banner" | "featured";

export interface AdminBentoCardProps extends BentoCardProps {
  status?: "draft" | "published" | "archived";
}

interface DraggableBentoCardProps {
  post: AdminBentoCardProps;
  onSizeChange?: (size: BentoSize) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onArchive?: () => void;
  isEditing?: boolean;
}

function DraggableBentoCard({
  post,
  onSizeChange,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onArchive,
  isEditing,
}: DraggableBentoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sizes: BentoSize[] = ["small", "medium", "large", "banner", "featured"];

  return (
    <CardWrapper
      ref={setNodeRef}
      style={style}
      $size={post.bentoSize}
      $contentType={post.contentType}
      $isEditing={isEditing}
    >
      {isEditing && (
        <>
          {/* Top overlay: drag handle + size selector */}
          <EditOverlay>
            <DragHandle {...attributes} {...listeners}>
              <GripVertical size={20} />
            </DragHandle>
            <SizeSelector>
              {sizes.map((s) => (
                <SizeButton
                  key={s}
                  $active={post.bentoSize === s}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSizeChange?.(s);
                  }}
                >
                  {s.charAt(0).toUpperCase()}
                </SizeButton>
              ))}
            </SizeSelector>
          </EditOverlay>

          {/* Bottom overlay: action buttons */}
          <ActionsOverlay>
            <StatusBadge $status={post.status || "draft"}>{post.status || "draft"}</StatusBadge>
            <ActionButtons>
              {onEdit && (
                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                  title="Edit"
                >
                  <Edit2 size={14} />
                </ActionButton>
              )}
              {post.status === "draft" && onPublish && (
                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPublish();
                  }}
                  title="Publish"
                  $success
                >
                  <Send size={14} />
                </ActionButton>
              )}
              {post.status === "published" && onUnpublish && (
                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUnpublish();
                  }}
                  title="Unpublish"
                >
                  <EyeOff size={14} />
                </ActionButton>
              )}
              {post.status !== "archived" && onArchive && (
                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onArchive();
                  }}
                  title="Archive"
                >
                  <Archive size={14} />
                </ActionButton>
              )}
              {onDelete && (
                <ActionButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="Delete"
                  $danger
                >
                  <Trash2 size={14} />
                </ActionButton>
              )}
            </ActionButtons>
          </ActionsOverlay>
        </>
      )}
      <BentoCard {...post} />
    </CardWrapper>
  );
}

interface DraggableBentoGridProps {
  posts: AdminBentoCardProps[];
  onReorder: (posts: AdminBentoCardProps[]) => void;
  onSizeChange?: (postId: number, size: BentoSize) => void;
  onEdit?: (postId: number) => void;
  onDelete?: (postId: number) => void;
  onPublish?: (postId: number) => void;
  onUnpublish?: (postId: number) => void;
  onArchive?: (postId: number) => void;
  compact?: boolean;
  emptyMessage?: ReactNode;
}

export function DraggableBentoGrid({
  posts,
  onReorder,
  onSizeChange,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onArchive,
  compact,
  emptyMessage,
}: DraggableBentoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);
    const newPosts = arrayMove(posts, oldIndex, newIndex);
    onReorder(newPosts);
  };

  if (posts.length === 0) {
    return (
      <EmptyState>
        {emptyMessage || (
          <>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDescription>Create your first post to get started</EmptyDescription>
          </>
        )}
      </EmptyState>
    );
  }

  const GridComponent = compact ? CompactGridContainer : GridContainer;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={posts.map((p) => p.id)} strategy={rectSortingStrategy}>
        <GridComponent>
          {posts.map((post) => (
            <DraggableBentoCard
              key={post.id}
              post={post}
              isEditing
              onSizeChange={(size) => onSizeChange?.(post.id, size)}
              onEdit={onEdit ? () => onEdit(post.id) : undefined}
              onDelete={onDelete ? () => onDelete(post.id) : undefined}
              onPublish={onPublish ? () => onPublish(post.id) : undefined}
              onUnpublish={onUnpublish ? () => onUnpublish(post.id) : undefined}
              onArchive={onArchive ? () => onArchive(post.id) : undefined}
            />
          ))}
        </GridComponent>
      </SortableContext>
    </DndContext>
  );
}

// Grid wrapper that applies correct grid-column/row spans based on size
const CardWrapper = styled.div<{
  $size: BentoSize;
  $contentType: string;
  $isEditing?: boolean;
}>`
  position: relative;
  height: 100%;

  /* Apply grid spans based on size - news cards excluded (they're flex items) */
  ${(p) => {
    if (p.$contentType === "news") return "";
    switch (p.$size) {
      case "featured":
        return `
          grid-column: span 3 !important;
          grid-row: span 2 !important;
          @media (max-width: 1200px) { grid-column: span 2 !important; }
          @media (max-width: 600px) { grid-column: span 1 !important; grid-row: span 1 !important; }
        `;
      case "large":
        return `
          grid-column: span 2 !important;
          grid-row: span 2 !important;
          @media (max-width: 600px) { grid-column: span 1 !important; grid-row: span 1 !important; }
        `;
      case "banner":
        return `
          grid-column: span 3 !important;
          grid-row: span 1 !important;
          @media (max-width: 900px) { grid-column: span 2 !important; }
          @media (max-width: 600px) { grid-column: span 1 !important; }
        `;
      case "medium":
        return `
          grid-column: span 2 !important;
          grid-row: span 1 !important;
          @media (max-width: 600px) { grid-column: span 1 !important; }
        `;
      case "small":
      default:
        return `
          grid-column: span 1 !important;
          grid-row: span 1 !important;
        `;
    }
  }}

  /* Ensure the BentoCard inside stretches to fill */
  & > a {
    display: block;
    height: 100%;
  }
`;

const EditOverlay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: auto;
`;

const ActionsOverlay = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: auto;
`;

const StatusBadge = styled.span<{ $status?: string }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);

  ${(p) => {
    switch (p.$status) {
      case "published":
        return `
          background: rgba(16, 185, 129, 0.9);
          color: white;
        `;
      case "draft":
        return `
          background: rgba(245, 158, 11, 0.9);
          color: white;
        `;
      case "archived":
        return `
          background: rgba(107, 114, 128, 0.9);
          color: white;
        `;
      default:
        return `
          background: rgba(0, 0, 0, 0.7);
          color: white;
        `;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
`;

const ActionButton = styled.button<{ $danger?: boolean; $success?: boolean }>`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: ${(p) =>
    p.$danger
      ? "rgba(239, 68, 68, 0.8)"
      : p.$success
        ? "rgba(16, 185, 129, 0.8)"
        : "rgba(255, 255, 255, 0.1)"};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) =>
      p.$danger
        ? "rgba(239, 68, 68, 1)"
        : p.$success
          ? "rgba(16, 185, 129, 1)"
          : "rgba(255, 255, 255, 0.2)"};
    transform: scale(1.1);
  }
`;

const DragHandle = styled.div`
  cursor: grab;
  padding: 6px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.85);
  }
`;

const SizeSelector = styled.div`
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
`;

const SizeButton = styled.button<{ $active?: boolean }>`
  width: 26px;
  height: 26px;
  border: 1px solid ${(p) => (p.$active ? "#9074f2" : "rgba(255,255,255,0.3)")};
  border-radius: 4px;
  background: ${(p) => (p.$active ? "#9074f2" : "transparent")};
  color: white;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #9074f2;
    background: ${(p) => (p.$active ? "#9074f2" : "rgba(144, 116, 242, 0.3)")};
  }
`;

// TRUE BENTO GRID - 5 columns for proper bento layout
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;
  contain: layout style;

  /* Ensure grid items stretch to fill their cells */
  & > * {
    min-height: 100%;
    height: 100%;
  }

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 180px;
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
    gap: 14px;
    padding: 0 16px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 16px;
    padding: 0 16px;
  }
`;

// COMPACT GRID for news - smaller rows, simpler layout, right-aligned
const CompactGridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 900px) {
    gap: 8px;
    padding: 0 16px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  font-family: var(--font-sans);
`;

export default DraggableBentoGrid;
