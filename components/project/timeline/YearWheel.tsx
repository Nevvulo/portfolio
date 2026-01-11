import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface YearWheelProps {
  years: number[];
  currentYearIndex: number;
  scrollProgress: number;
}

export function YearWheel({ years, currentYearIndex, scrollProgress }: YearWheelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRadius = 3;
  const segmentAngle = (Math.PI * 2) / Math.max(years.length * 2, 12);

  // Calculate target rotation based on scroll
  const targetRotation = useMemo(() => {
    return scrollProgress * Math.PI * 2 * ((years.length - 1) / years.length);
  }, [scrollProgress, years.length]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth rotation towards target
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -targetRotation,
        delta * 3
      );
    }
  });

  return (
    <group ref={groupRef} position={[-4, 0, 0]}>
      {/* Main wheel structure */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[wheelRadius, 0.15, 16, 64]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[wheelRadius - 0.5, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#16213e"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Year segments on the wheel */}
      {years.map((year, index) => {
        const angle = index * segmentAngle * 2;
        const x = 0;
        const y = Math.cos(angle) * wheelRadius;
        const z = Math.sin(angle) * wheelRadius;
        const isActive = index === currentYearIndex;

        return (
          <group key={year} position={[x, y, z]} rotation={[angle, 0, 0]}>
            {/* Year text */}
            <Text
              position={[0.3, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              fontSize={isActive ? 0.5 : 0.35}
              color={isActive ? "#ffffff" : "#666688"}
              anchorX="left"
              anchorY="middle"
            >
              {year}
            </Text>

            {/* Tick mark */}
            <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.02, 0.3, 0.02]} />
              <meshStandardMaterial
                color={isActive ? "#7c3aed" : "#333355"}
                emissive={isActive ? "#7c3aed" : "#000000"}
                emissiveIntensity={isActive ? 0.5 : 0}
              />
            </mesh>
          </group>
        );
      })}

      {/* Center hub */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
        <meshStandardMaterial
          color="#0f0f23"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Glowing center accent */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.35, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// Ticker digits that roll like a stopwatch
interface TickerDigitProps {
  value: number;
  position: [number, number, number];
}

export function TickerDigit({ value, position }: TickerDigitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const digitHeight = 0.6;

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetY = -value * digitHeight;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        delta * 5
      );
    }
  });

  return (
    <group position={position}>
      {/* Digit window frame */}
      <RoundedBox args={[0.5, 0.7, 0.1]} radius={0.05} position={[0, 0, 0.1]}>
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.95} />
      </RoundedBox>

      {/* Rolling digits */}
      <group ref={groupRef}>
        {digits.map((digit, i) => (
          <Text
            key={digit}
            position={[0, i * digitHeight, 0]}
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {digit}
          </Text>
        ))}
      </group>
    </group>
  );
}

// Full year ticker display (like a stopwatch/odometer)
interface YearTickerProps {
  year: number;
  position: [number, number, number];
}

export function YearTicker({ year, position }: YearTickerProps) {
  const digits = year.toString().split("").map(Number);

  return (
    <group position={position}>
      {/* Background panel */}
      <RoundedBox args={[2.8, 1, 0.15]} radius={0.08} position={[0, 0, -0.1]}>
        <meshStandardMaterial
          color="#0f0f23"
          metalness={0.7}
          roughness={0.3}
        />
      </RoundedBox>

      {/* Border glow */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2.9, 1.1]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.1} />
      </mesh>

      {/* Individual digit tickers */}
      {digits.map((digit, i) => (
        <TickerDigit
          key={i}
          value={digit}
          position={[(i - 1.5) * 0.6, 0, 0]}
        />
      ))}
    </group>
  );
}
