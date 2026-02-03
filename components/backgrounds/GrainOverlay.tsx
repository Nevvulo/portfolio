import styled from "styled-components";

/**
 * Full-screen grain noise overlay with a subtle purple tint.
 * Uses a pre-baked tiling noise PNG for performance (SVG feTurbulence is very
 * slow on Safari). Theme-aware: adjusts noise opacity and tint for dark/light.
 */
export function GrainOverlay({ className }: { className?: string }) {
  return (
    <Wrapper className={className} aria-hidden="true">
      <Noise />
      <Tint />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transform: translateZ(0);
`;

const Noise = styled.div`
  position: absolute;
  inset: 0;
  background-image: url('/noise.png');
  background-repeat: repeat;
  background-size: 100px 100px;
  opacity: ${(p) => (p.theme.background === "#100d1b" ? 0.4 : 0.3)};
  transform: translateZ(0);
`;

const Tint = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) =>
    p.theme.background === "#100d1b"
      ? "radial-gradient(ellipse at 50% 0%, rgba(144, 116, 242, 0.08), transparent 70%)"
      : "radial-gradient(ellipse at 50% 0%, rgba(144, 116, 242, 0.05), transparent 70%)"};
  transform: translateZ(0);
`;
