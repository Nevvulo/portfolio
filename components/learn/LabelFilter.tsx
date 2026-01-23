import { X } from "lucide-react";
import styled from "styled-components";
import { Skeleton } from "../generics/skeleton";

// Max labels to show (roughly 4 lines on lower resolutions)
const MAX_VISIBLE_LABELS = 15;

// Pre-generated widths for skeleton labels to avoid CLS
// These simulate realistic label widths (40-100px range)
const SKELETON_LABEL_WIDTHS = [52, 78, 64, 45, 88, 56, 72, 94, 48, 82, 60, 75, 68, 42, 86];

interface LabelFilterProps {
  labels: string[];
  selectedLabels: string[];
  onToggle: (label: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export function LabelFilter({
  labels,
  selectedLabels,
  onToggle,
  onClear,
  isLoading,
}: LabelFilterProps) {
  const hasSelection = selectedLabels.length > 0;

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Container>
        <FilterRow>
          <LabelsScroll>
            {SKELETON_LABEL_WIDTHS.map((width, i) => (
              <SkeletonLabel key={i} $width={width} />
            ))}
          </LabelsScroll>
        </FilterRow>
      </Container>
    );
  }

  if (labels.length === 0) return null;

  // Limit to first 15 labels
  const visibleLabels = labels.slice(0, MAX_VISIBLE_LABELS);

  return (
    <Container>
      <FilterRow>
        <LabelsScroll>
          {visibleLabels.map((label) => (
            <FilterLabel
              key={label}
              $selected={selectedLabels.includes(label)}
              onClick={() => onToggle(label)}
              type="button"
            >
              {label.replace(/-/g, " ")}
            </FilterLabel>
          ))}
        </LabelsScroll>
        {hasSelection && onClear && (
          <ClearButton onClick={onClear} type="button">
            <X size={12} />
            Clear
          </ClearButton>
        )}
      </FilterRow>
    </Container>
  );
}

const Container = styled.div`
	width: 100%;
`;

const FilterRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const ClearButton = styled.button`
	display: flex;
	align-items: center;
	gap: 4px;
	background: rgba(239, 68, 68, 0.15);
	border: 1px solid rgba(239, 68, 68, 0.3);
	color: #f87171;
	font-family: var(--font-mono);
	font-size: 11px;
	font-weight: 500;
	padding: 0.2em 0.6em;
	border-radius: 4px;
	cursor: pointer;
	white-space: nowrap;
	flex-shrink: 0;
	transition: all 0.2s;

	&:hover {
		background: rgba(239, 68, 68, 0.25);
	}
`;

const LabelsScroll = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	overflow-x: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;

	&::-webkit-scrollbar {
		display: none;
	}
`;

const FilterLabel = styled.button<{ $selected: boolean }>`
	background: ${(p) => (p.$selected ? "rgba(79, 77, 193, 0.35)" : "rgba(79, 77, 193, 0.15)")};
	padding: 0.2em 0.6em;
	border: 1px solid
		${(p) => (p.$selected ? "rgba(79, 77, 193, 0.6)" : "rgba(79, 77, 193, 0.3)")};
	font-family: var(--font-mono);
	font-size: 11px;
	font-weight: 500;
	border-radius: 4px;
	color: ${(p) => (p.$selected ? "#c4c2ff" : "#a5a3f5")};
	text-transform: lowercase;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.15s ease;

	&:hover {
		background: rgba(79, 77, 193, 0.3);
		border-color: rgba(79, 77, 193, 0.5);
	}
`;

const SkeletonLabel = styled(Skeleton)<{ $width: number }>`
	width: ${(p) => p.$width}px;
	height: 22px;
	border-radius: 4px;
	flex-shrink: 0;
`;

export default LabelFilter;
