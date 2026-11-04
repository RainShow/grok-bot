import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLOOR_Y, type FloorId, type HomeFloor } from './model';
import { Box, Car, Palm, Plant } from './parts';
import { useFontRevision, useSignTexture, useSoftShadow } from './textures';

const W = 13.2;
const D = 9.6;
const WALL = 2.78;
const GLASS_H = 2.16;
const GLASS_Y = 1.42;
const ORDER: HomeFloor[] = ['lobby', 'research', 'content', 'night'];

const slabMat = new THREE.MeshStandardMaterial({ color: '#f5f6f8', roughness: 0.84, metalness: 0.02 });
const wallMat = new THREE.MeshStandardMaterial({ color: '#f3f5f7', roughness: 0.78 });
const darkMat = new THREE.MeshStandardMaterial({ color: '#1c2630', metalness: 0.48, roughness: 0.3 });
const shaftMat = new THREE.MeshPhysicalMaterial({
  color: '#d5e7f2',
  roughness: 0.05,
  metalness: 0,
  transmission: 0.8,
  thickness: 0.28,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

function makeGlass() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#e7f3f8',
    roughness: 0.06,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.42,
    ior: 1.45,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    envMapIntensity: 1.2,
    attenuationColor: new THREE.Color('#d5e8f4'),
    attenuationDistance: 1.4,
    side: THREE.DoubleSide,
  });
  mat.userData.baseTransmission = 0.9;
  mat.userData.keepDepth = true;
  return mat;
}

function spring(value: number, target: number, vel: { v: number }, omega: number, dt: number) {
  const step = 1 / 60;
  let left = Math.min(dt, 0.05);
  let current = value;
  while (left > 0.0001) {
    const h = Math.min(step, left);
    const x = current - target;
    vel.v += (-omega * omega * x - 2 * omega * vel.v) * h;
    current += vel.v * h;
    left -= h;
  }
  return current;
}

function fadeMat(mat: THREE.Material, fade: number) {
  const prev = mat.userData.fade as number | undefined;
  if (prev !== undefined && Math.abs(prev - fade) < 0.02) return;
  mat.userData.fade = fade;
  mat.opacity = fade;
  mat.transparent = true;
  if (!mat.userData.keepDepth) mat.depthWrite = fade > 0.9;
  if (mat instanceof THREE.MeshPhysicalMaterial && mat.userData.baseTransmission) {
    mat.transmission = (mat.userData.baseTransmission as number) * fade;
  }
}

function Curtain({
  width,
  height,
  glass,
  mullion,
  position,
  rotation,
}: {
  width: number;
  height: number;
  glass: THREE.Material;
  mullion: THREE.Material;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cols = Math.max(4, Math.round(width / 0.76));
  const geo = useMemo(() => new THREE.BoxGeometry(0.038, height - 0.04, 0.05), [height]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const step = width / cols;
    for (let i = 0; i <= cols; i += 1) {
      matrix.makeTranslation(-width / 2 + i * step, 0, 0.03);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [cols, width]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={glass} dispose={null}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <instancedMesh ref={ref} args={[geo, mullion, cols + 1]} dispose={null} frustumCulled={false} />
      <mesh material={mullion} position={[0, height * 0.22, 0.03]} dispose={null}>
        <boxGeometry args={[width, 0.032, 0.04]} />
      </mesh>
      <mesh material={mullion} position={[0, -height * 0.2, 0.03]} dispose={null}>
        <boxGeometry args={[width, 0.032, 0.04]} />
      </mesh>
    </group>
  );
}

function Shaft({ glass, metal }: { glass: THREE.Material; metal: THREE.Material }) {
  const h = 2.95;
  const posts: [number, number][] = [
    [-0.38, -0.58],
    [0.38, -0.58],
    [-0.38, 0.58],
    [0.38, 0.58],
  ];
  return (
    <group position={[W / 2 + 1.35, h / 2, 1.05]}>
      <mesh material={glass} dispose={null}>
        <boxGeometry args={[0.82, h, 1.28]} />
      </mesh>
      {posts.map((p, i) => (
        <mesh key={i} position={[p[0], 0, p[1]]} material={metal} dispose={null}>
          <boxGeometry args={[0.045, h, 0.045]} />
        </mesh>
      ))}
      <mesh position={[0, -0.15, 0]} material={metal} dispose={null}>
        <boxGeometry args={[0.74, 0.04, 1.16]} />
      </mesh>
    </group>
  );
}

function Roof({ trim, dark, metal }: { trim: THREE.Material; dark: THREE.Material; metal: THREE.Material }) {
  return (
    <group position={[0, 2.9, 0]}>
      <RoundedBox args={[W + 0.35, 0.18, D + 0.28]} radius={0.06} smoothness={2} bevelSegments={2} material={trim} castShadow receiveShadow dispose={null} />
      <mesh position={[0, 0.16, D / 2 + 0.08]} material={trim} dispose={null}>
        <boxGeometry args={[W + 0.5, 0.22, 0.08]} />
      </mesh>
      <mesh position={[0, 0.16, -D / 2 - 0.08]} material={trim} dispose={null}>
        <boxGeometry args={[W + 0.5, 0.22, 0.08]} />
      </mesh>
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => (
          <mesh key={`${row}-${col}`} position={[-2.3 + col * 1.15, 0.22, -1.5 + row * 1.15]} rotation={[-0.42, 0.15, 0]} material={dark} castShadow dispose={null}>
            <boxGeometry args={[1.02, 0.035, 0.62]} />
          </mesh>
        )),
      )}
      <RoundedBox args={[1.7, 0.55, 0.95]} position={[-4.3, 0.4, -2.4]} radius={0.08} smoothness={2} material={trim} castShadow dispose={null} />
      <mesh position={[-4.3, 0.72, -2.4]} rotation={[-Math.PI / 2, 0, 0]} material={dark} dispose={null}>
        <cylinderGeometry args={[0.28, 0.32, 0.08, 16]} />
      </mesh>
      <RoundedBox args={[1.15, 0.38, 0.7]} position={[-4.3, 0.32, -1.05]} radius={0.06} smoothness={2} material={metal} castShadow dispose={null} />
      <mesh position={[3.4, 0.28, 1.5]} dispose={null}>
        <boxGeometry args={[2.1, 0.06, 1.35]} />
        <meshPhysicalMaterial color="#d5e8f2" transmission={0.65} roughness={0.08} thickness={0.2} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Story({
  id,
  floor,
  sign,
  children,
}: {
  id: HomeFloor;
  floor: FloorId;
  sign: THREE.Texture | null;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const front = useRef<THREE.Group>(null);
  const roof = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Group>(null);
  const interior = useRef<THREE.Group>(null);
  const lift = useRef(0);
  const liftV = useRef({ v: 0 });
  const open = useRef(0);
  const openV = useRef({ v: 0 });
  const idx = ORDER.indexOf(id);
  const glass = useMemo(() => makeGlass(), []);
  const mullion = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2a323a', metalness: 0.45, roughness: 0.34, transparent: true, opacity: 1 }),
    [],
  );
  const trim = useMemo(() => wallMat.clone(), []);
  const slab = useMemo(() => slabMat.clone(), []);
  const dark = useMemo(() => darkMat.clone(), []);
  const shaft = useMemo(() => {
    const mat = shaftMat.clone();
    mat.userData.baseTransmission = 0.8;
    mat.userData.keepDepth = true;
    return mat;
  }, []);
  const signMat = useMemo(() => {
    if (!sign) return null;
    const mat = new THREE.MeshBasicMaterial({ map: sign, transparent: true, depthWrite: false, opacity: 1 });
    mat.userData.keepDepth = true;
    return mat;
  }, [sign]);
  useEffect(
    () => () => {
      glass.dispose();
      mullion.dispose();
      trim.dispose();
      slab.dispose();
      dark.dispose();
      shaft.dispose();
      signMat?.dispose();
    },
    [glass, mullion, trim, slab, dark, shaft, signMat],
  );

  useFrame((_, rawDt) => {
    const active = ORDER.indexOf(floor as HomeFloor);
    const selected = active >= 0;
    const leaving = selected && idx > active;
    const opening = selected && idx === active;
    lift.current = spring(lift.current, leaving ? 14 + (idx - active) * 1.6 : 0, liftV.current, 7.2, rawDt);
    open.current = spring(open.current, opening ? 1 : 0, openV.current, 8.4, rawDt);
    const fade = Math.max(0, 1 - Math.max(0, lift.current) / 5.2);
    fadeMat(glass, fade);
    fadeMat(mullion, fade);
    fadeMat(trim, fade);
    fadeMat(slab, fade);
    fadeMat(dark, fade);
    fadeMat(shaft, fade);
    if (signMat) fadeMat(signMat, fade);
    const root = group.current;
    if (root) {
      root.position.y = FLOOR_Y[id] + lift.current;
      root.visible = lift.current < 6.2;
    }
    if (front.current) {
      front.current.position.y = -open.current * 2.2;
      front.current.visible = open.current < 0.94;
    }
    if (roof.current) roof.current.visible = open.current < 0.22;
    if (shaftRef.current) shaftRef.current.visible = open.current < 0.35;
    if (interior.current) interior.current.visible = open.current > 0.16;
  });

  const sideYaw: [number, number, number] = [0, Math.PI / 2, 0];
  return (
    <group ref={group} position={[0, FLOOR_Y[id], 0]}>
      <RoundedBox
        args={[W, 0.36, D]}
        position={[0, -0.18, 0]}
        radius={0.08}
        smoothness={2}
        bevelSegments={2}
        material={slab}
        castShadow
        receiveShadow
        dispose={null}
      />
      {(
        [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ] as const
      ).map(([sx, sz]) => (
        <RoundedBox
          key={`${sx}${sz}`}
          args={[0.28, WALL, 0.28]}
          position={[sx * (W / 2 - 0.08), WALL / 2, sz * (D / 2 - 0.08)]}
          radius={0.06}
          smoothness={2}
          bevelSegments={2}
          material={trim}
          castShadow
          dispose={null}
        />
      ))}
      <mesh position={[0, WALL / 2, -D / 2 + 0.06]} material={trim} receiveShadow dispose={null}>
        <boxGeometry args={[W - 0.2, WALL, 0.12]} />
      </mesh>
      <mesh position={[0, 0.16, D / 2]} material={trim} dispose={null}>
        <boxGeometry args={[W, 0.28, 0.14]} />
      </mesh>
      <Curtain width={D - 0.36} height={GLASS_H} glass={glass} mullion={mullion} position={[W / 2, GLASS_Y, 0]} rotation={sideYaw} />
      <Curtain width={D - 0.36} height={GLASS_H} glass={glass} mullion={mullion} position={[-W / 2, GLASS_Y, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <mesh position={[W / 2, 2.62, 0]} material={trim} dispose={null}>
        <boxGeometry args={[0.14, 0.28, D]} />
      </mesh>
      <mesh position={[-W / 2, 2.62, 0]} material={trim} dispose={null}>
        <boxGeometry args={[0.14, 0.28, D]} />
      </mesh>
      <group ref={front}>
        <Curtain width={W - 0.28} height={GLASS_H} glass={glass} mullion={mullion} position={[0, GLASS_Y, D / 2 + 0.02]} />
        <mesh position={[0, 2.62, D / 2 + 0.02]} material={trim} dispose={null}>
          <boxGeometry args={[W, 0.28, 0.12]} />
        </mesh>
        {signMat && (
          <mesh position={[0, 1.58, D / 2 + 0.1]} material={signMat} dispose={null}>
            <planeGeometry args={[6.6, 1.25]} />
          </mesh>
        )}
      </group>
      <group ref={shaftRef}>
        <Shaft glass={shaft} metal={mullion} />
      </group>
      <group ref={roof}>{id === 'night' && <Roof trim={trim} dark={dark} metal={mullion} />}</group>
      <group ref={interior} visible={false}>
        {children}
      </group>
    </group>
  );
}

export function Dollhouse({ floor, children }: { floor: FloorId; children: (id: HomeFloor) => ReactNode }) {
  const rev = useFontRevision();
  const sign = useSignTexture(rev);
  return (
    <group>
      {ORDER.map((id) => (
        <Story key={id} id={id} floor={floor} sign={id === 'content' ? sign : null}>
          {children(id)}
        </Story>
      ))}
    </group>
  );
}

export function Monument() {
  return (
    <group position={[-8.6, 0, 7.4]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.35, 2.45, 0.1, 40]} />
        <meshStandardMaterial color="#f3f5f7" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, 0.025, 8, 48]} />
        <meshStandardMaterial color="#c5ced6" />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 2.15, 0.12, Math.cos(a) * 2.15]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.06, 0.03, i % 4 === 0 ? 0.32 : 0.16]} />
            <meshStandardMaterial color="#b7c2cc" />
          </mesh>
        );
      })}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.34, 6.4, 20]} />
        <meshStandardMaterial color="#f7f8fa" roughness={0.32} metalness={0.08} />
      </mesh>
      <mesh position={[0, 6.9, 0]} castShadow>
        <sphereGeometry args={[0.32, 24, 18]} />
        <meshStandardMaterial color="#fbfcfd" roughness={0.22} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.04, 10, 32]} />
        <meshStandardMaterial color="#d5dee6" metalness={0.25} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Truck() {
  return (
    <group position={[8.4, 0, 6.4]} rotation={[0, -0.6, 0]}>
      <Box args={[2.3, 1.15, 1.05]} position={[0.35, 0.85, 0]} color="#f5f7f8" radius={0.06} castShadow />
      <Box args={[0.85, 0.72, 0.98]} position={[-1.05, 0.62, 0]} color="#2c333b" radius={0.08} castShadow />
      {[
        [1.05, 0.5],
        [1.05, -0.5],
        [-0.7, 0.5],
        [-0.7, -0.5],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.22, p[1]]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 14]} />
          <meshStandardMaterial color="#1b2128" />
        </mesh>
      ))}
    </group>
  );
}

export function Grounds() {
  const shadow = useSoftShadow();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#e4e7ec" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.02, 1.2]}>
        <planeGeometry args={[20, 16]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.6, 0.015, 7.4]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <Box args={[28, 0.04, 3.1]} position={[2, 0.03, 13.2]} color="#d3dae2" roughness={0.95} receiveShadow />
      <Box args={[3.2, 0.04, 22]} position={[13.4, 0.03, 4]} color="#d3dae2" roughness={0.95} receiveShadow />
      <Box args={[16, 0.02, 7.2]} position={[1.2, 0.04, 8.6]} color="#e3e8ee" roughness={1} receiveShadow />
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={`stall-${i}`} args={[0.04, 0.01, 2.3]} position={[-3.2 + i * 1.55, 0.06, 8.3]} color="#f7f8fa" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={`walk-${i}`} args={[0.28, 0.01, 1.15]} position={[-1.6 + i * 0.48, 0.06, 11.55]} color="#f7f8fa" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={`dash-${i}`} args={[1.1, 0.01, 0.08]} position={[-4 + i * 2.2, 0.06, 13.2]} color="#f4f6f8" />
      ))}
      <Palm position={[-8.2, 0, 5.6]} />
      <Palm position={[-7.4, 0, -4.2]} scale={0.85} />
      <Palm position={[8.6, 0, 5.2]} scale={0.95} />
      <Palm position={[9.4, 0, -3.4]} scale={0.8} />
      <Palm position={[2.4, 0, 11.2]} scale={0.7} />
      <Palm position={[-4.6, 0, 11.4]} scale={0.75} />
      <Plant position={[-8.8, 0, 3.4]} scale={1.3} />
      <Plant position={[8.2, 0, 3.2]} scale={1.15} />
      <Car position={[-3.2, 0, 7.5]} rotation={0.08} color="#f4f6f8" />
      <Car position={[-1.6, 0, 7.65]} rotation={-0.04} color="#2c333b" />
      <Car position={[0.1, 0, 7.5]} color="#d24b4b" />
      <Car position={[1.7, 0, 7.7]} rotation={0.05} color="#4d6f92" />
      <Car position={[3.4, 0, 9.7]} rotation={Math.PI} color="#f7f7f5" />
      <Car position={[1.6, 0, 9.85]} rotation={Math.PI + 0.06} color="#1f242b" />
      <Car position={[-0.2, 0, 9.7]} rotation={Math.PI} color="#c9a24a" />
      <Truck />
      <mesh position={[-2.4, 0.04, 5.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 20]} />
        <meshStandardMaterial color="#d7e4cf" roughness={1} />
      </mesh>
      <Plant position={[-2.4, 0, 5.4]} scale={1.4} />
    </group>
  );
}
