import type { ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';

export type V3 = [number, number, number];

export function Box({
  args,
  position,
  rotation,
  color,
  roughness = 0.68,
  metalness = 0.04,
  emissive,
  emissiveIntensity = 0,
  opacity = 1,
  castShadow = false,
  receiveShadow = false,
  radius,
  children,
}: {
  args: V3;
  position?: V3;
  rotation?: V3;
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  radius?: number;
  children?: ReactNode;
}) {
  const mat = (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissive ? emissiveIntensity : 0}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
  if (radius && radius > 0) {
    return (
      <RoundedBox args={args} position={position} rotation={rotation} radius={radius} smoothness={2} castShadow={castShadow} receiveShadow={receiveShadow}>
        {mat}
        {children}
      </RoundedBox>
    );
  }
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={args} />
      {mat}
      {children}
    </mesh>
  );
}

export function Desk({ position, rotation = 0, screen = '#8ecfc4' }: { position: V3; rotation?: number; screen?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box args={[1.28, 0.07, 0.66]} position={[0, 0.74, 0]} color="#f6f3ec" roughness={0.5} radius={0.02} castShadow />
      <Box args={[0.07, 0.7, 0.07]} position={[-0.54, 0.36, 0.22]} color="#e3ddd3" />
      <Box args={[0.07, 0.7, 0.07]} position={[0.54, 0.36, 0.22]} color="#e3ddd3" />
      <Box args={[0.07, 0.7, 0.07]} position={[-0.54, 0.36, -0.22]} color="#e3ddd3" />
      <Box args={[0.07, 0.7, 0.07]} position={[0.54, 0.36, -0.22]} color="#e3ddd3" />
      <Box args={[0.46, 0.3, 0.04]} position={[0.08, 1.02, -0.24]} color="#1c242c" />
      <Box args={[0.38, 0.22, 0.02]} position={[0.08, 1.02, -0.21]} color={screen} emissive={screen} emissiveIntensity={0.45} />
      <Box args={[0.05, 0.14, 0.04]} position={[0.08, 0.84, -0.24]} color="#1c242c" />
      <Box args={[0.38, 0.06, 0.36]} position={[0, 0.46, 0.48]} color="#2a3038" radius={0.03} />
      <Box args={[0.38, 0.38, 0.06]} position={[0, 0.66, 0.64]} color="#2a3038" radius={0.03} />
    </group>
  );
}

export function Plant({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.26, 12]} />
        <meshStandardMaterial color="#f3f4f5" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.05, 12]} />
        <meshStandardMaterial color="#6d4c34" />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 12]} />
        <meshStandardMaterial color="#2f8a46" roughness={0.7} />
      </mesh>
      <mesh position={[0.14, 0.46, 0.06]} castShadow>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshStandardMaterial color="#46a15c" roughness={0.65} />
      </mesh>
    </group>
  );
}

export function Palm({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0.04, 1.15, 0]} rotation={[0.08, 0, 0.06]} castShadow>
        <cylinderGeometry args={[0.07, 0.13, 2.3, 7]} />
        <meshStandardMaterial color="#8d6848" roughness={0.9} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.42, 2.22, Math.cos(a) * 0.42]} rotation={[0.95, a, 0]} castShadow>
            <coneGeometry args={[0.14, 1.2, 4]} />
            <meshStandardMaterial color={i % 2 ? '#2c7438' : '#3d9450'} roughness={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Car({ position, rotation = 0, color }: { position: V3; rotation?: number; color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box args={[1.42, 0.32, 0.66]} position={[0, 0.3, 0]} color={color} radius={0.08} metalness={0.4} roughness={0.32} castShadow />
      <Box args={[0.66, 0.28, 0.58]} position={[-0.02, 0.54, 0]} color="#d5e2ec" radius={0.08} metalness={0.15} roughness={0.2} />
      {[
        [0.42, 0.32],
        [0.42, -0.32],
        [-0.46, 0.32],
        [-0.46, -0.32],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.16, p[1]]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 12]} />
          <meshStandardMaterial color="#1b2128" />
        </mesh>
      ))}
    </group>
  );
}

export function Pouf({ position, color }: { position: V3; color: string }) {
  return (
    <mesh position={[position[0], 0.28, position[2]]} scale={[1, 0.68, 1]} castShadow>
      <sphereGeometry args={[0.34, 24, 16]} />
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  );
}

export function Sofa({ position, rotation = 0, color = '#2c333b' }: { position: V3; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box args={[1.55, 0.28, 0.62]} position={[0, 0.34, 0]} color={color} radius={0.06} castShadow />
      <Box args={[1.55, 0.42, 0.16]} position={[0, 0.58, -0.24]} color={color} radius={0.04} />
      <Box args={[0.14, 0.32, 0.62]} position={[-0.74, 0.46, 0]} color={color} radius={0.04} />
      <Box args={[0.14, 0.32, 0.62]} position={[0.74, 0.46, 0]} color={color} radius={0.04} />
    </group>
  );
}

export function Plate({ color = '#f7f8f9', lip = '#ffffff' }: { color?: string; lip?: string }) {
  return (
    <group>
      <Box args={[12.2, 0.22, 9]} position={[0, 0.11, 0]} color={color} roughness={0.92} receiveShadow />
      <Box args={[12.2, 0.03, 9]} position={[0, 0.23, 0]} color={lip} roughness={1} receiveShadow />
    </group>
  );
}
