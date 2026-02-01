import type { ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/theme";

interface WidgetContainerProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  variant?: "default" | "live" | "accent";
  fullWidth?: boolean;
  noPadding?: boolean;
}

export function WidgetContainer({
  children,
  title,
  icon,
  headerAction,
  className,
  variant = "default",
  fullWidth,
  noPadding,
}: WidgetContainerProps) {
  return (
    <Container className={className} $variant={variant} $fullWidth={fullWidth}>
      {title && (
        <Header>
          <HeaderLeft>
            {icon && <IconWrapper>{icon}</IconWrapper>}
            <Title>{title}</Title>
          </HeaderLeft>
          {headerAction && <HeaderAction>{headerAction}</HeaderAction>}
        </Header>
      )}
      <Content $noPadding={noPadding}>{children}</Content>
    </Container>
  );
}

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
`;

const Container = styled.div<{ $variant: string; $fullWidth?: boolean }>`
  position: relative;
  background: rgba(144, 116, 242, 0.04);
  border: 1px solid rgba(144, 116, 242, 0.08);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s ease;
  display: flex;
  flex-direction: column;

  ${(props) => props.$fullWidth && css`
    grid-column: 1 / -1;
  `}

  ${(props) =>
    props.$variant === "live" &&
    css`
      border-color: rgba(239, 68, 68, 0.5);
      animation: ${pulse} 2s ease-in-out infinite;
      background: linear-gradient(
        135deg,
        rgba(239, 68, 68, 0.06) 0%,
        rgba(144, 116, 242, 0.04) 100%
      );
    `}

  ${(props) =>
    props.$variant === "accent" &&
    css`
      border-color: ${LOUNGE_COLORS.tier1}30;
      background: linear-gradient(
        135deg,
        rgba(144, 116, 242, 0.07) 0%,
        rgba(144, 116, 242, 0.04) 100%
      );
    `}

  &:hover {
    border-color: rgba(144, 116, 242, 0.15);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderAction = styled.div`
  display: flex;
  align-items: center;

  a {
    font-size: 12px;
    font-weight: 500;
    color: ${LOUNGE_COLORS.tier1};
    text-decoration: none;
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LOUNGE_COLORS.tier1};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  opacity: 0.7;
`;

const Content = styled.div<{ $noPadding?: boolean }>`
  padding: ${(props) => (props.$noPadding ? "0" : "14px 16px 16px")};
  flex: 1;
  overflow: hidden;
`;
