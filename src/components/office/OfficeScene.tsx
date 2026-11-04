import { useLayoutEffect, useRef, useState } from 'react';
import { ContactShadows, Environment, Lightformer, OrbitControls, SoftShadows } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ACESFilmicToneMapping, MOUSE, PCFSoftShadowMap, TOUCH, Vector3, type OrthographicCamera } from 'three';
import type { ComponentRef } from 'react';
import type { FleetBot } from '../../game/fleet';
import { useFleet } from '../../game/useFleet';
import { ClassifiedBots, FloorBots } from './Bots';
import { Dollhouse, Grounds, Monument } from './Campus';
import { ClassifiedInterior, ContentInterior, LobbyInterior, NightInterior, ResearchInterior } from './Interiors';
import { frameZoom, poseFor, type FloorId, type HomeFloor } from './model';
import { OfficeChrome } from './OfficeChrome';

function springScalar(value: number, target: number, vel: { v: number }, omega: number, dt: number) {
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

function springVec(current: Vector3, target: Vector3, vel: Vector3, omega: number, dt: number) {
  const scratch = { v: vel.x };
  current.x = springScalar(current.x, target.x, scratch, omega, dt);
  vel.x = scratch.v;
  scratch.v = vel.y;
  current.y = springScalar(current.y, target.y, scratch, omega, dt);
  vel.y = scratch.v;
  scratch.v = vel.z;
  current.z = springScalar(current.z, target.z, scratch, omega, dt);
  vel.z = scratch.v;
}

function Lights({ floor }: { floor: FloorId }) {
  const dark = floor === 'classified';
  return (
    <>
      <hemisphereLight color={dark ? '#ff7382' : '#fff1df'} groundColor={dark ? '#2a0610' : '#c9d3c4'} intensity={dark ? 0.28 : 0.78} />
      <ambientLight intensity={dark ? 0.08 : 0.24} color={dark ? '#ffd0d6' : '#fff6ea'} />
      <directionalLight
        position={[16, 24, 12]}
        intensity={dark ? 0.22 : 1.7}
        color={dark ? '#ffd0d4' : '#fff3e2'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={64}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.00035}
      />
      {!dark && <directionalLight position={[-12, 9, -8]} intensity={0.42} color="#d5e4f6" />}
    </>
  );
}

function CameraRig({ floor }: { floor: FloorId }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const look = useRef(new Vector3(0.7, 6.3, 0.45));
  const posVel = useRef(new Vector3());
  const lookVel = useRef(new Vector3());
  const zoomVel = useRef({ v: 0 });
  const goalPos = useRef(new Vector3());
  const goalLook = useRef(new Vector3());
  const movingRef = useRef(true);
  const [moving, setMoving] = useState(true);

  const setMove = (next: boolean) => {
    if (movingRef.current === next) return;
    movingRef.current = next;
    setMoving(next);
  };

  useLayoutEffect(() => {
    const spec = poseFor(floor);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    posVel.current.set(0, 0, 0);
    lookVel.current.set(0, 0, 0);
    zoomVel.current.v = 0;
    if (!reduce) {
      setMove(true);
      return;
    }
    const zoom = frameZoom(spec.zoom, size.width, size.height);
    camera.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    look.current.set(spec.look[0], spec.look[1], spec.look[2]);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    camera.lookAt(look.current);
    const ctrl = controls.current;
    if (ctrl) {
      ctrl.target.copy(look.current);
      ctrl.update();
    }
    setMove(false);
  }, [floor, camera, size.width, size.height]);

  useFrame((_, rawDt) => {
    if (!movingRef.current) return;
    const spec = poseFor(floor);
    const zoomGoal = frameZoom(spec.zoom, size.width, size.height);
    goalPos.current.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    goalLook.current.set(spec.look[0], spec.look[1], spec.look[2]);
    springVec(camera.position, goalPos.current, posVel.current, 6.6, rawDt);
    springVec(look.current, goalLook.current, lookVel.current, 6.6, rawDt);
    camera.zoom = springScalar(camera.zoom, zoomGoal, zoomVel.current, 6.6, rawDt);
    camera.lookAt(look.current);
    camera.updateProjectionMatrix();
    const ctrl = controls.current;
    if (ctrl) ctrl.target.copy(look.current);
    const err = camera.position.distanceTo(goalPos.current) + look.current.distanceTo(goalLook.current);
    const speed = posVel.current.length() + lookVel.current.length() + Math.abs(zoomVel.current.v);
    if (err < 0.045 && speed < 0.06 && Math.abs(camera.zoom - zoomGoal) < 0.12) {
      camera.position.copy(goalPos.current);
      look.current.copy(goalLook.current);
      camera.zoom = zoomGoal;
      camera.lookAt(look.current);
      camera.updateProjectionMatrix();
      if (ctrl) {
        ctrl.target.copy(look.current);
        ctrl.update();
      }
      setMove(false);
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={!moving}
      enableRotate={false}
      enableDamping={false}
      enablePan
      enableZoom
      minZoom={12}
      maxZoom={96}
      zoomSpeed={0.65}
      panSpeed={0.75}
      mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
      touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }}
    />
  );
}

function FloorSet({
  id,
  bots,
  selectedId,
  onSelect,
}: {
  id: HomeFloor;
  bots: readonly FleetBot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {id === 'night' && <NightInterior />}
      {id === 'content' && <ContentInterior />}
      {id === 'research' && <ResearchInterior />}
      {id === 'lobby' && <LobbyInterior />}
      <FloorBots floor={id} bots={bots} selectedId={selectedId} onSelect={onSelect} />
    </>
  );
}

function World({
  floor,
  bots,
  selectedId,
  onSelect,
}: {
  floor: FloorId;
  bots: readonly FleetBot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const dark = floor === 'classified';
  return (
    <>
      <color attach="background" args={[dark ? '#12060a' : '#e7ebf0']} />
      <fog attach="fog" args={[dark ? '#12060a' : '#e7ebf0', dark ? 14 : 34, dark ? 36 : 72]} />
      {!dark && <SoftShadows size={12} samples={6} focus={0.45} />}
      {!dark && (
        <Environment resolution={128} frames={1} environmentIntensity={1}>
          <Lightformer form="rect" intensity={2.6} position={[7, 8, 8]} scale={[14, 8, 1]} color="#fff1e0" />
          <Lightformer form="rect" intensity={1.5} position={[-8, 5, -5]} scale={[12, 6, 1]} color="#d7e6f6" />
          <Lightformer form="rect" intensity={1.15} position={[0, 12, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[20, 20, 1]} color="#ffffff" />
        </Environment>
      )}
      <Lights floor={floor} />
      <CameraRig floor={floor} />
      {!dark && <Grounds />}
      {!dark && <Monument />}
      {!dark && (
        <Dollhouse floor={floor}>{(id) => <FloorSet id={id} bots={bots} selectedId={selectedId} onSelect={onSelect} />}</Dollhouse>
      )}
      {!dark && (
        <ContactShadows position={[0.4, 0.01, 0.2]} opacity={0.32} scale={22} blur={2.4} far={4.5} resolution={512} frames={1} color="#6a7380" />
      )}
      {dark && (
        <>
          <ClassifiedInterior />
          <ClassifiedBots bots={bots} selectedId={selectedId} onSelect={onSelect} />
        </>
      )}
    </>
  );
}

export function OfficeStage({
  floor,
  onFloor,
  selectedId,
  onSelectBot,
  opsOpen,
  onToggleOps,
}: {
  floor: FloorId;
  onFloor: (floor: FloorId) => void;
  selectedId: string | null;
  onSelectBot: (id: string | null) => void;
  opsOpen: boolean;
  onToggleOps: () => void;
}) {
  const fleet = useFleet();
  return (
    <div className={`office-stage${floor === 'classified' ? ' is-classified' : ''}`}>
      <div className="office-canvas">
        <Canvas
          orthographic
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [23, 17.5, 23], zoom: 40, near: 0.1, far: 260 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          fallback={<div className="webgl-fallback">这台浏览器开不了 3D 办公室。</div>}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
            gl.shadowMap.type = PCFSoftShadowMap;
            scene.environmentIntensity = 1;
          }}
        >
          <World floor={floor} bots={fleet.bots} selectedId={selectedId} onSelect={(id) => onSelectBot(id)} />
        </Canvas>
      </div>
      <OfficeChrome
        floor={floor}
        onFloor={onFloor}
        selectedId={selectedId}
        onClear={() => onSelectBot(null)}
        bots={fleet.bots}
        sourceNote={fleet.source}
        opsOpen={opsOpen}
        onToggleOps={onToggleOps}
      />
    </div>
  );
}
