import { Html, PerspectiveCamera, Sparkles, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import styled from "styled-components";
import * as THREE from "three";
import type { Doc } from "../../../convex/_generated/dataModel";

// Convex project type
type ConvexProject = Doc<"projects">;

interface TimelineSceneProps {
  projects: ConvexProject[];
  timelineYears: number[];
  scrollProgress: number;
  onProjectClick: (project: ConvexProject) => void;
  onScrollChange?: (progress: number) => void;
  isMobile?: boolean;
  isLandscape?: boolean;
}

// HTML-based project card that looks like the original
function HtmlProjectCard({
  project,
  position,
  isActive,
  index,
  onClick,
  animationProgress = 1,
  isMobile = false,
  isLandscape = false,
}: {
  project: ConvexProject;
  position: [number, number, number];
  isActive: boolean;
  index: number;
  onClick: () => void;
  animationProgress?: number; // 0 = hidden, 1 = fully visible
  isMobile?: boolean;
  isLandscape?: boolean;
}) {
  // Responsive card width - increased for better mobile readability
  const cardWidth = isMobile
    ? isLandscape
      ? "380px" // Mobile landscape
      : "300px" // Mobile portrait (increased from 260px)
    : "550px"; // Desktop

  // Responsive distance factor (how 3D depth affects size)
  const distanceFactor = isMobile ? (isLandscape ? 2.6 : 2.2) : 3.2;
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef({ x: position[0], y: position[1], z: position[2] });

  // Update target when position prop changes
  targetPos.current = { x: position[0], y: position[1], z: position[2] };

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Very subtle floating (reduced amplitude)
      const floatY = Math.sin(state.clock.elapsedTime * 0.4 + index * 1.2) * 0.015;

      // Smooth position lerp
      const posSpeed = 12;
      groupRef.current.position.x +=
        (targetPos.current.x - groupRef.current.position.x) * Math.min(1, delta * posSpeed);
      groupRef.current.position.y +=
        (targetPos.current.y + floatY - groupRef.current.position.y) *
        Math.min(1, delta * posSpeed);
      groupRef.current.position.z +=
        (targetPos.current.z - groupRef.current.position.z) * Math.min(1, delta * posSpeed);

      // Keep scale constant - only use opacity for transitions
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  const timelineText = project.timeline.endYear
    ? `${project.timeline.startYear} — ${project.timeline.endYear}`
    : `${project.timeline.startYear} — Present`;

  return (
    <group ref={groupRef} position={position}>
      <Html
        transform
        distanceFactor={distanceFactor}
        position={[0, 0, 0]}
        style={{
          width: cardWidth,
          pointerEvents: animationProgress > 0.5 ? "auto" : "none",
          opacity: animationProgress,
        }}
      >
        <CardContainer $background={project.background} $isActive={isActive} onClick={onClick}>
          <CardContent>
            {project.logoUrl && project.logoWidth && project.logoHeight ? (
              project.logoIncludesName ? (
                <CardLogo>
                  {/* Using native img for Safari compatibility inside drei Html */}
                  <img
                    src={project.logoUrl}
                    width={Math.min(project.logoWidth, 180)}
                    height={Math.min(project.logoHeight, 180)}
                    alt={`${project.name} Logo`}
                    loading="eager"
                    style={{
                      objectFit: "contain",
                      filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.6))",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                    onError={(e) => {
                      // Hide broken image and show fallback
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </CardLogo>
              ) : (
                <CardLogoWithTitle>
                  {/* Using native img for Safari compatibility inside drei Html */}
                  <img
                    src={project.logoUrl}
                    width={Math.min(project.logoWidth, 48)}
                    height={Math.min(project.logoHeight, 48)}
                    alt={`${project.name} Logo`}
                    loading="eager"
                    style={{
                      objectFit: "contain",
                      filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.6))",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <CardTitle>{project.name}</CardTitle>
                </CardLogoWithTitle>
              )
            ) : (
              <CardTitle>{project.name}</CardTitle>
            )}
            <CardBottomRow>
              <CardSubtitle>{project.shortDescription}</CardSubtitle>
              <TimelineBadge>{timelineText}</TimelineBadge>
            </CardBottomRow>
          </CardContent>
          {project.maintained && <MaintainedBadge>MAINTAINED</MaintainedBadge>}
        </CardContainer>
      </Html>
    </group>
  );
}

// Styled components for the HTML card
const CardContainer = styled.div<{ $background: string; $isActive: boolean }>`
  position: relative;
  background: ${(props) => props.$background};
  border-radius: 20px;
  padding: 1.5rem 2rem;
  height: 160px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out;
  box-shadow: ${(props) =>
    props.$isActive
      ? "0 16px 50px rgba(99, 102, 241, 0.3), 0 6px 16px rgba(0, 0, 0, 0.4)"
      : "0 10px 30px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)"};
  transform: ${(props) => (props.$isActive ? "scale(1.02)" : "scale(1)")};
  border: 2px solid ${(props) =>
    props.$isActive ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.1)"};

  /* Mobile responsive - increased height for better readability */
  @media (max-width: 767px) {
    padding: 1rem 1.25rem;
    height: 110px;
    border-radius: 14px;
  }

  &:hover {
    transform: translateY(-8px) scale(1.05);
    box-shadow: 0 24px 60px rgba(99, 102, 241, 0.35), 0 10px 24px rgba(0, 0, 0, 0.35);
    border-color: rgba(99, 102, 241, 0.5);
  }

  /* Disable hover effects on touch devices */
  @media (hover: none) {
    &:hover {
      transform: ${(props) => (props.$isActive ? "scale(1.02)" : "scale(1)")};
      box-shadow: ${(props) =>
        props.$isActive
          ? "0 16px 50px rgba(99, 102, 241, 0.3), 0 6px 16px rgba(0, 0, 0, 0.4)"
          : "0 10px 30px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)"};
    }

    &:active {
      transform: scale(0.98);
    }
  }

  h1 {
    color: white;
    margin: 0;
    font-size: 1.6rem;
    font-weight: 600;

    @media (max-width: 767px) {
      font-size: 1.2rem;
    }
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0.5rem 0 0;
    font-size: 1rem;
    line-height: 1.5;

    @media (max-width: 767px) {
      font-size: 0.85rem;
      margin: 0.25rem 0 0;
    }
  }
`;

const CardContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  gap: 0.5rem;

  @media (max-width: 767px) {
    gap: 0.25rem;
  }
`;

const CardBottomRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 767px) {
    gap: 0.5rem;
  }
`;

const CardLogo = styled.div`
  display: flex;
  align-items: flex-start;

  @media (max-width: 767px) {
    img {
      max-width: 80px !important;
      max-height: 32px !important;
      width: auto !important;
      height: auto !important;
    }
  }
`;

const CardLogoWithTitle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 767px) {
    gap: 0.5rem;

    img {
      max-width: 24px !important;
      max-height: 24px !important;
      width: auto !important;
      height: auto !important;
    }
  }
`;

const CardTitle = styled.h2`
  color: white;
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 767px) {
    font-size: 1.1rem;
  }
`;

const CardSubtitle = styled.p`
  color: white;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  flex: 1;

  @media (max-width: 767px) {
    font-size: 0.75rem;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const TimelineBadge = styled.div`
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  font-family: "Sixtyfour", monospace;
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 767px) {
    padding: 0.2rem 0.4rem;
    font-size: 0.5rem;
    border-radius: 4px;
  }
`;

const MaintainedBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);

  @media (max-width: 767px) {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.1rem 0.3rem;
    font-size: 0.4rem;
    border-radius: 3px;
  }
`;

// Persona-style Year Menu - vertical fan with subtle 3D rotation
function YearWheel3D({
  years,
  scrollProgress,
  isMobile = false,
  isPortrait = false,
  onScrollChange,
}: {
  years: number[];
  scrollProgress: number;
  isMobile?: boolean;
  isPortrait?: boolean;
  onScrollChange?: (progress: number) => void;
}) {
  // Responsive position - on mobile portrait, position at top-left but pushed right
  const basePosition: [number, number, number] = isPortrait
    ? [-1.1, -2.0, 0] // Bottom-left on mobile portrait
    : isMobile
      ? [-2.5, -1.5, 0] // Left side on mobile landscape
      : [-3.5, -2.2, 0]; // Left side on desktop
  const fontSize = isPortrait ? 0.3 : isMobile ? 0.35 : 0.5;
  const activeScale = isPortrait ? 0.75 : isMobile ? 0.9 : 1;
  const groupRef = useRef<THREE.Group>(null);

  const currentIndex = Math.floor(scrollProgress * (years.length - 1));

  // Interactive scroll state
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const rubberBand = useRef(0);
  const lastTime = useRef(Date.now());

  // Momentum and rubber band animation
  useFrame(() => {
    if (!onScrollChange) return;

    const now = Date.now();
    const dt = Math.min((now - lastTime.current) / 1000, 0.1);
    lastTime.current = now;

    if (!isDragging.current && Math.abs(velocity.current) > 0.001) {
      // Apply momentum with friction
      const friction = 0.92;
      velocity.current *= friction;

      let newProgress = scrollProgress + velocity.current * dt * 60;

      // Rubber band effect at boundaries
      if (newProgress < 0) {
        rubberBand.current = newProgress;
        newProgress = 0;
        velocity.current *= 0.5; // Dampen at boundary
      } else if (newProgress > 1) {
        rubberBand.current = newProgress - 1;
        newProgress = 1;
        velocity.current *= 0.5;
      } else {
        // Spring back rubber band
        rubberBand.current *= 0.85;
      }

      onScrollChange(Math.max(0, Math.min(1, newProgress)));
    } else if (!isDragging.current) {
      // Spring back rubber band when not dragging
      rubberBand.current *= 0.85;
    }
  });

  const handlePointerDown = (e: THREE.Event) => {
    if (!onScrollChange) return;
    isDragging.current = true;
    lastY.current = (e as any).clientY || (e as any).point?.y || 0;
    velocity.current = 0;
    (e as any).stopPropagation?.();
  };

  const handlePointerMove = (e: THREE.Event) => {
    if (!isDragging.current || !onScrollChange) return;

    const clientY = (e as any).clientY || (e as any).point?.y || 0;
    const deltaY = lastY.current - clientY;
    lastY.current = clientY;

    const sensitivity = isMobile ? 0.004 : 0.002;
    velocity.current = deltaY * sensitivity;

    let newProgress = scrollProgress + velocity.current;

    // Rubber band resistance at boundaries
    if (newProgress < 0) {
      newProgress = newProgress * 0.3; // Resistance
      rubberBand.current = newProgress;
    } else if (newProgress > 1) {
      newProgress = 1 + (newProgress - 1) * 0.3;
      rubberBand.current = newProgress - 1;
    }

    onScrollChange(Math.max(-0.1, Math.min(1.1, newProgress)));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Subtle 3D tilt based on scroll
  const tiltX = Math.sin(scrollProgress * Math.PI) * 0.1;
  const tiltY = Math.cos(scrollProgress * Math.PI * 0.5) * 0.05;

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Very subtle breathing animation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        0.3 + tiltY,
        delta * 2,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        tiltX,
        delta * 2,
      );
    }
  });

  // Calculate which years to show (window around current)
  const visibleRange = 4;
  const scrollOffset = scrollProgress * (years.length - 1);

  return (
    <group ref={groupRef} position={basePosition} scale={activeScale}>
      {/* Interactive hit area for scroll */}
      <mesh
        position={[0.5, 0, 0.1]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <planeGeometry args={[2.5, 6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Vertical line accent */}
      <mesh position={[-0.4, 0, -0.5]}>
        <boxGeometry args={[0.02, 8, 0.02]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.25} />
      </mesh>

      {/* Year items fanning out */}
      {years.map((year, i) => {
        // Position relative to current scroll
        const relativePos = i - scrollOffset;

        // Only show years within visible range
        if (Math.abs(relativePos) > visibleRange) return null;

        // Vertical position with curve
        const y = relativePos * (isMobile ? 0.6 : 0.8);

        // Z depth - items further from center recede
        const z = -Math.abs(relativePos) * 0.3;

        // X offset - fan out effect
        const x = Math.abs(relativePos) * 0.15;

        // Rotation - tilt away from center
        const rotZ = relativePos * 0.05;

        // Scale based on distance from center
        const distance = Math.abs(relativePos);
        const scale = Math.max(0.5, 1 - distance * 0.15);

        const isActive = i === currentIndex;

        return (
          <group
            key={year}
            position={[x, y, z]}
            rotation={[0, 0, rotZ]}
            scale={[scale, scale, scale]}
          >
            {/* Selection indicator */}
            {isActive && (
              <mesh position={[-0.3, 0, 0]}>
                <boxGeometry args={[0.08, isMobile ? 0.3 : 0.4, 0.02]} />
                <meshBasicMaterial color="#6366f1" />
              </mesh>
            )}

            {/* Year text */}
            <Text
              position={[0, 0, 0]}
              fontSize={isActive ? fontSize : fontSize * 0.7}
              color={isActive ? "#ffffff" : "#666688"}
              anchorX="left"
              anchorY="middle"
              font="/fonts/Sixtyfour.woff"
            >
              {year}
            </Text>

            {/* Subtle glow behind active year */}
            {isActive && (
              <mesh position={[0.5, 0, -0.1]}>
                <planeGeometry args={[isMobile ? 1.1 : 1.5, isMobile ? 0.45 : 0.6]} />
                <meshBasicMaterial color="#4f46e5" transparent opacity={0.1} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Decorative bracket */}
      <mesh position={[-0.5, 0, -0.3]}>
        <boxGeometry args={[0.03, 3, 0.03]} />
        <meshStandardMaterial color="#2a2a5a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Smooth step for nicer fade transitions
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function TimelineContent({
  projects,
  timelineYears,
  scrollProgress,
  onProjectClick,
  onScrollChange,
  isMobile = false,
  isLandscape = false,
}: TimelineSceneProps) {
  const currentRealYear = new Date().getFullYear();
  // Responsive card spacing - tighter on mobile
  const cardSpacing = isMobile ? (isLandscape ? 1.4 : 1.2) : 2.0;

  // Get floor/ceil years from scroll position for interpolation
  const yearFloat = scrollProgress * (timelineYears.length - 1);
  const floorIdx = Math.floor(yearFloat);
  const ceilIdx = Math.min(Math.ceil(yearFloat), timelineYears.length - 1);
  const t = yearFloat - floorIdx; // 0-1 interpolation factor

  const floorYear = timelineYears[floorIdx] ?? currentRealYear;
  const ceilYear = timelineYears[ceilIdx] ?? floorYear;

  // Helper: get projects active in a specific year
  const getActiveForYear = (year: number) =>
    projects.filter((p) => {
      const endYear = p.timeline.endYear ?? currentRealYear;
      return p.timeline.startYear <= year && endYear >= year;
    });

  const floorActive = getActiveForYear(floorYear);
  const ceilActive = getActiveForYear(ceilYear);

  // Helper: get Y position for a project in a stack
  const getYInStack = (slug: string, stack: typeof projects): number | null => {
    const idx = stack.findIndex((p) => p.slug === slug);
    if (idx === -1) return null;
    return (idx - (stack.length - 1) / 2) * cardSpacing;
  };

  // Union of projects visible in either year
  const visibleSlugs = new Set([
    ...floorActive.map((p) => p.slug),
    ...ceilActive.map((p) => p.slug),
  ]);

  // Calculate interpolated position and opacity for each visible project
  const visibleProjects = projects
    .filter((p) => visibleSlugs.has(p.slug))
    .map((project) => {
      const yFloor = getYInStack(project.slug, floorActive);
      const yCeil = getYInStack(project.slug, ceilActive);

      let y: number;
      let opacity: number;

      if (yFloor !== null && yCeil !== null) {
        // In both years: interpolate position, full opacity
        y = lerp(yFloor, yCeil, t);
        opacity = 1;
      } else if (yFloor !== null) {
        // Only in floor year: fade out as t increases
        y = yFloor;
        opacity = 1 - smoothstep(t);
      } else {
        // Only in ceil year: fade in as t increases
        y = yCeil!;
        opacity = smoothstep(t);
      }

      return { project, y, opacity };
    });

  return (
    <>
      {/* Lighting - more subtle, less purple */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, 5, 5]} intensity={0.2} color="#6366f1" />
      <spotLight position={[0, 8, 8]} angle={0.4} penumbra={1} intensity={0.3} color="#4f46e5" />

      {/* Persona-style Year wheel */}
      <YearWheel3D
        years={timelineYears}
        scrollProgress={scrollProgress}
        isMobile={isMobile}
        isPortrait={isMobile && !isLandscape}
        onScrollChange={onScrollChange}
      />

      {/* Project cards - adjust position based on viewport */}
      <group
        position={[isMobile ? (isLandscape ? 0.5 : 0) : 1, isMobile && !isLandscape ? 0.3 : 0, 0]}
      >
        {visibleProjects.map(({ project, y, opacity }, index) => (
          <HtmlProjectCard
            key={project.slug}
            isMobile={isMobile}
            isLandscape={isLandscape}
            project={project}
            position={[0, y, 0]}
            isActive={opacity > 0.5}
            index={index}
            onClick={() => onProjectClick(project)}
            animationProgress={opacity}
          />
        ))}
      </group>

      {/* Ambient particles - more subtle */}
      <Sparkles
        count={50}
        scale={[18, 12, 8]}
        size={1}
        speed={0.15}
        color="#6366f1"
        opacity={0.15}
      />

      {/* Grid floor - very subtle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[40, 40, 40, 40]} />
        <meshBasicMaterial color="#1a1a2e" wireframe transparent opacity={0.04} />
      </mesh>
    </>
  );
}

export function TimelineScene({
  projects,
  timelineYears,
  scrollProgress,
  onProjectClick,
  onScrollChange,
  isMobile = false,
  isLandscape = false,
}: TimelineSceneProps) {
  // Responsive camera settings
  const cameraZ = isMobile ? (isLandscape ? 7 : 6) : 8;
  const cameraY = isMobile && !isLandscape ? 0.5 : 0;
  const fov = isMobile ? (isLandscape ? 55 : 60) : 50;

  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #0d0d14 0%, #0f0f18 50%, #0a0a10 100%)",
      }}
    >
      <PerspectiveCamera makeDefault position={[0, cameraY, cameraZ]} fov={fov} />
      <fog attach="fog" args={["#0d0d14", 12, 28]} />

      <Suspense fallback={null}>
        <TimelineContent
          projects={projects}
          timelineYears={timelineYears}
          scrollProgress={scrollProgress}
          onProjectClick={onProjectClick}
          onScrollChange={onScrollChange}
          isMobile={isMobile}
          isLandscape={isLandscape}
        />
      </Suspense>
    </Canvas>
  );
}
