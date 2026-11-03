import { useLayoutEffect, useRef, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MOUSE, TOUCH, ACESFilmicToneMapping, PCFSoftShadowMap, Vector3, type OrthographicCamera } from 'three';
import type { ComponentRef } from 'react';
import type { FleetBot } from '../../game/fleet';
import { useFleet } from '../../game/useFleet';
import { ClassifiedBots, FloorBots } from './Bots';
import { Grounds, Monument, Shell } from './Campus';
import { ClassifiedInterior, ContentInterior, LobbyInterior, NightInterior, ResearchInterior } from './Interiors';
import { frameZoom, poseFor, type FloorId } from './model';
import { OfficeChrome } from './OfficeChrome';

function Lights({ floor }: { floor: FloorId }) {
  const dark = floor === 'classified';
  return (
    <>
      <hemisphereLight color={dark ? '#ff7382' : '#f7fbff'} groundColor={dark ? '#2a0610' : '#d5dde6'} intensity={dark ? 0.28 : 0.92} />
      <ambientLight intensity={dark ? 0.07 : 0.48} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={dark ? 0.22 : 1.55}
        color={dark ? '#ffd0d4' : '#fff8f2'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0004}
      />
      {!dark && <directionalLight position={[-10, 8, -6]} intensity={0.38} color="#d5e6f6" />}
    </>
  );
}

function CameraRig({ floor }: { floor: FloorId }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const size = useThree((s) => s.size);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const scratch = useRef(new Vector3());
  const anim = useRef({
    t: 1,
    from: new Vector3(),
    to: new Vector3(),
    fromLook: new Vector3(),
    toLook: new Vector3(),
    fromZoom: 34,
    toZoom: 34,
  });
  const [moving, setMoving] = useState(false);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useLayoutEffect(() => {
    const spec = poseFor(floor);
    const zoom = frameZoom(spec.zoom, sizeRef.current.width, sizeRef.current.height);
    const a = anim.current;
    a.from.copy(camera.position);
    a.to.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    const ctrl = controls.current;
    if (ctrl) a.fromLook.copy(ctrl.target);
    else a.fromLook.set(0, 0, 0);
    a.toLook.set(spec.look[0], spec.look[1], spec.look[2]);
    a.fromZoom = camera.zoom;
    a.toZoom = zoom;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      camera.position.copy(a.to);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      camera.lookAt(a.toLook);
      if (ctrl) {
        ctrl.target.copy(a.toLook);
        ctrl.update();
      }
      a.t = 1;
      setMoving(false);
      return;
    }
    a.t = 0;
    setMoving(true);
  }, [floor, camera]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (a.t >= 1) return;
    a.t = Math.min(1, a.t + dt / 0.85);
    const k = a.t < 0.5 ? 2 * a.t * a.t : 1 - (-2 * a.t + 2) ** 2 / 2;
    camera.position.lerpVectors(a.from, a.to, k);
    const look = scratch.current.copy(a.fromLook).lerp(a.toLook, k);
    camera.lookAt(look);
    camera.zoom = a.fromZoom + (a.toZoom - a.fromZoom) * k;
    camera.updateProjectionMatrix();
    const ctrl = controls.current;
    if (ctrl) ctrl.target.copy(look);
    if (a.t >= 1 && ctrl) {
      ctrl.update();
      setMoving(false);
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
      <fog attach="fog" args={[dark ? '#12060a' : '#e7ebf0', dark ? 14 : 28, dark ? 36 : 58]} />
      <Lights floor={floor} />
      <CameraRig floor={floor} />
      {!dark && <Grounds />}
      {floor === 'overview' && <Monument />}
      {floor === 'overview' && <Shell />}
      {floor === 'night' && (
        <>
          <NightInterior />
          <FloorBots floor="night" bots={bots} selectedId={selectedId} onSelect={onSelect} />
        </>
      )}
      {floor === 'content' && (
        <>
          <ContentInterior />
          <FloorBots floor="content" bots={bots} selectedId={selectedId} onSelect={onSelect} />
        </>
      )}
      {floor === 'research' && (
        <>
          <ResearchInterior />
          <FloorBots floor="research" bots={bots} selectedId={selectedId} onSelect={onSelect} />
        </>
      )}
      {floor === 'lobby' && (
        <>
          <LobbyInterior />
          <FloorBots floor="lobby" bots={bots} selectedId={selectedId} onSelect={onSelect} />
        </>
      )}
      {floor === 'classified' && (
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
          dpr={[1, 1.75]}
          camera={{ position: [24, 18, 24], zoom: 34, near: 0.1, far: 240 }}
          gl={{ antialias: true, alpha: false }}
          fallback={<div className="webgl-fallback">这台浏览器开不了 3D 办公室。</div>}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.06;
            gl.shadowMap.type = PCFSoftShadowMap;
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
