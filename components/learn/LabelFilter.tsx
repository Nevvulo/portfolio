import { X } from "lucide-react";
import styled from "styled-components";

interface LabelFilterProps {
  labels: string[];
  selectedLabels: string[];
  onToggle: (label: string) => void;
  onClear?: () => void;
}

export function LabelFilter({ labels, selectedLabels, onToggle, onClear }: LabelFilterProps) {
  if (labels.length === 0) return null;

  const hasSelection = selectedLabels.length > 0;

  return (
    <Container>
      <FilterRow>
        <LabelsScroll>
          {labels.map((label) => (
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

export default LabelFilter;
