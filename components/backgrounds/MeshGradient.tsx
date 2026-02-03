import { m } from "framer-motion";
import styled from "styled-components";

/**
 * Animated mesh gradient background with floating purple/violet blobs.
 * Adapted from shadcn.io/background/gradient — converted to styled-components.
 * Supports both light and dark themes via theme-aware base colors.
 */
export function MeshGradient({ className }: { className?: string }) {
  return (
    <Wrapper className={className}>
      <BaseGradient />

      {/* Blob 1 — deep purple */}
      <Blob
        $size="min(50vw, 50vh)"
        $color="rgba(144, 116, 242, 0.35)"
        animate={{ x: ["0%", "30%", "10%", "0%"], y: ["0%", "20%", "40%", "0%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        initial={{ x: "10%", y: "10%" }}
      />

      {/* Blob 2 — violet */}
      <Blob
        $size="min(60vw, 60vh)"
        $color="rgba(123, 97, 255, 0.30)"
        animate={{ x: ["60%", "40%", "70%", "60%"], y: ["10%", "30%", "5%", "10%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        initial={{ x: "60%", y: "10%" }}
      />

      {/* Blob 3 — soft blue-purple */}
      <Blob
        $size="min(45vw, 45vh)"
        $color="rgba(99, 102, 241, 0.30)"
        animate={{ x: ["20%", "50%", "30%", "20%"], y: ["60%", "40%", "70%", "60%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        initial={{ x: "20%", y: "60%" }}
      />

      {/* Blob 4 — pink-purple accent */}
      <Blob
        $size="min(55vw, 55vh)"
        $color="rgba(192, 132, 252, 0.22)"
        animate={{ x: ["70%", "50%", "80%", "70%"], y: ["50%", "70%", "40%", "50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        initial={{ x: "70%", y: "50%" }}
      />

      {/* Blob 5 — deep indigo */}
      <Blob
        $size="min(40vw, 40vh)"
        $color="rgba(79, 77, 193, 0.28)"
        animate={{ x: ["40%", "60%", "30%", "40%"], y: ["30%", "50%", "20%", "30%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        initial={{ x: "40%", y: "30%" }}
      />

      <NoiseOverlay />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
  background: ${(p) => p.theme.background};
`;

const BaseGradient = styled.div`
  position: absolute;
  inset: 0;
  background: ${(p) =>
    p.theme.background === "#100d1b"
      ? "linear-gradient(to bottom right, #100d1b, #1a1625, #100d1b)"
      : "linear-gradient(to bottom right, #f8f7fc, #ede9fe, #f8f7fc)"};
`;

const Blob = styled(m.div)<{ $size: string; $color: string }>`
  position: absolute;
  border-radius: 9999px;
  filter: blur(120px);
  width: ${(p) => p.$size};
  height: ${(p) => p.$size};
  background: ${(p) => `radial-gradient(circle, ${p.$color} 0%, transparent 70%)`};
`;

const NoiseOverlay = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
`;
