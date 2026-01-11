import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Search, X } from "lucide-react";

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search articles..." }: SearchBarProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Focus input when expanded
	useEffect(() => {
		if (isExpanded && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isExpanded]);

	// Handle click outside to collapse (only if empty)
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node) &&
				!value
			) {
				setIsExpanded(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [value]);

	const handleClear = () => {
		onChange("");
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			if (value) {
				onChange("");
			} else {
				setIsExpanded(false);
				inputRef.current?.blur();
			}
		}
	};

	return (
		<Container
			ref={containerRef}
			$expanded={isExpanded || !!value}
			onMouseEnter={() => setIsExpanded(true)}
		>
			<IconButton
				onClick={() => setIsExpanded(true)}
				$expanded={isExpanded || !!value}
				type="button"
				aria-label="Search"
			>
				<Search size={18} />
			</IconButton>

			<Input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				$expanded={isExpanded || !!value}
				onKeyDown={handleKeyDown}
			/>

			{value && (
				<ClearButton onClick={handleClear} type="button" aria-label="Clear search">
					<X size={16} />
				</ClearButton>
			)}
		</Container>
	);
}

const Container = styled.div<{ $expanded: boolean }>`
	display: flex;
	align-items: center;
	background: ${(p) => (p.$expanded ? "rgba(255, 255, 255, 0.08)" : "transparent")};
	border: 1px solid ${(p) => (p.$expanded ? "rgba(255, 255, 255, 0.15)" : "transparent")};
	border-radius: 8px;
	padding: ${(p) => (p.$expanded ? "6px 12px" : "6px")};
	transition: all 0.25s ease;
	width: ${(p) => (p.$expanded ? "240px" : "32px")};
	cursor: ${(p) => (p.$expanded ? "text" : "pointer")};

	@media (max-width: 640px) {
		width: ${(p) => (p.$expanded ? "180px" : "32px")};
	}
`;

const IconButton = styled.button<{ $expanded: boolean }>`
	background: none;
	border: none;
	color: ${(p) => p.theme.contrast};
	cursor: pointer;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: ${(p) => (p.$expanded ? 0.6 : 0.8)};
	transition: opacity 0.2s;
	flex-shrink: 0;

	&:hover {
		opacity: 1;
	}
`;

const Input = styled.input<{ $expanded: boolean }>`
	background: transparent;
	border: none;
	color: ${(p) => p.theme.contrast};
	font-size: 14px;
	font-family: var(--font-sans);
	width: ${(p) => (p.$expanded ? "100%" : "0")};
	opacity: ${(p) => (p.$expanded ? 1 : 0)};
	padding-left: ${(p) => (p.$expanded ? "8px" : "0")};
	transition: all 0.25s ease;

	&:focus {
		outline: none;
	}

	&::placeholder {
		color: ${(p) => p.theme.contrast};
		opacity: 0.5;
	}
`;

const ClearButton = styled.button`
	background: none;
	border: none;
	color: ${(p) => p.theme.contrast};
	cursor: pointer;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.6;
	transition: opacity 0.2s;
	flex-shrink: 0;
	margin-left: 4px;

	&:hover {
		opacity: 1;
	}
`;

export default SearchBar;
