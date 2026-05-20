import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useScroll, useTransform, useMotionValue, useSpring, MotionValue } from "framer-motion";

/**
 * Procedural QR-like grid generated once. Returns an array of {x,y,size} cells in
 * normalised [-0.5..0.5] space so we can extrude them into a 3D mosaic.
 */
function useQrCells(seed = 7) {
  return useMemo(() => {
    const N = 21; // QR-ish module count
    const cells: { x: number; y: number; on: boolean; finder: boolean }[] = [];
    // simple LCG for stable randomness
    let s = seed * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const isFinder = (i: number, j: number) => {
      const inBox = (a: number, b: number) =>
        i >= a && i < a + 7 && j >= b && j < b + 7;
      return inBox(0, 0) || inBox(N - 7, 0) || inBox(0, N - 7);
    };
    const finderOn = (i: number, j: number) => {
      // outer ring + inner block
      const local = (a: number, b: number) => {
        const li = i - a;
        const lj = j - b;
        if (li === 0 || li === 6 || lj === 0 || lj === 6) return true;
        if (li >= 2 && li <= 4 && lj >= 2 && lj <= 4) return true;
        return false;
      };
      if (i < 7 && j < 7) return local(0, 0);
      if (i >= N - 7 && j < 7) return local(N - 7, 0);
      if (i < 7 && j >= N - 7) return local(0, N - 7);
      return false;
    };
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const finder = isFinder(i, j);
        const on = finder ? finderOn(i, j) : rand() > 0.5;
        cells.push({
          x: (i / (N - 1) - 0.5),
          y: (j / (N - 1) - 0.5),
          on,
          finder,
        });
      }
    }
    return { cells, N };
  }, [seed]);
}

function QrMosaic({
  pointer,
  scrollY,
}: {
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  scrollY: MotionValue<number>;
}) {
  const { cells, N } = useQrCells(11);
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mosaic = useRef<THREE.Group>(null);

  const onCells = useMemo(() => cells.filter((c) => c.on), [cells]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const moduleSize = 1 / N;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const px = pointer.x.get();
    const py = pointer.y.get();
    const sy = scrollY.get(); // 0..1

    if (group.current) {
      // breathing + cursor follow + scroll travel
      const targetRotY = px * 0.6 + t * 0.15;
      const targetRotX = -py * 0.4 + Math.sin(t * 0.6) * 0.05;
      group.current.rotation.y += (targetRotY - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (targetRotX - group.current.rotation.x) * 0.05;
      group.current.position.y = Math.sin(t * 0.8) * 0.05 - sy * 1.4;
      group.current.position.z = -sy * 1.5;
      const breath = 1 + Math.sin(t * 1.2) * 0.015;
      const shrink = 1 - sy * 0.35;
      group.current.scale.setScalar(breath * shrink);
    }

    // animate module heights (wave through grid)
    if (mesh.current) {
      for (let idx = 0; idx < onCells.length; idx++) {
        const c = onCells[idx];
        const wave =
          0.06 +
          Math.sin(t * 1.4 + (c.x + c.y) * 6) * 0.04 +
          (c.finder ? 0.12 : 0);
        tmp.position.set(c.x, c.y, wave / 2);
        tmp.scale.set(moduleSize * 0.92, moduleSize * 0.92, wave);
        tmp.updateMatrix();
        mesh.current.setMatrixAt(idx, tmp.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* glass slab behind modules */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[1.05, 1.05, 0.06]} />
        <MeshTransmissionMaterial
          thickness={0.4}
          roughness={0.05}
          transmission={1}
          ior={1.4}
          chromaticAberration={0.04}
          backside
          color="#0b1220"
          attenuationColor="#3b82f6"
          attenuationDistance={1.2}
        />
      </mesh>

      {/* glowing edge frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.08, 1.08, 0.02]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.18} />
      </mesh>

      <group ref={mosaic}>
        <instancedMesh ref={mesh} args={[undefined, undefined, onCells.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#e6f0ff"
            metalness={0.85}
            roughness={0.18}
            emissive="#2563eb"
            emissiveIntensity={0.35}
          />
        </instancedMesh>
      </group>
    </group>
  );
}

function PointerBridge({
  px,
  py,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const { mouse } = useThree();
  useFrame(() => {
    px.set(mouse.x);
    py.set(mouse.y);
  });
  return null;
}

export function Hero3DQR() {
  // scroll-linked motion (0 at top, 1 after one viewport)
  const { scrollYProgress } = useScroll();
  const sy = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const syS = useSpring(sy, { stiffness: 80, damping: 20, mass: 0.6 });

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const pxS = useSpring(px, { stiffness: 90, damping: 18, mass: 0.4 });
  const pyS = useSpring(py, { stiffness: 90, damping: 18, mass: 0.4 });

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 2.4], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#00000000"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#7aa6ff" />
        <directionalLight position={[-4, -2, 2]} intensity={0.8} color="#a78bfa" />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
            <QrMosaic pointer={{ x: pxS, y: pyS }} scrollY={syS} />
          </Float>
          <Sparkles
            count={60}
            scale={[3, 2, 2]}
            size={2}
            speed={0.4}
            color="#7aa6ff"
            opacity={0.6}
          />
          <Environment preset="city" />
        </Suspense>
        <PointerBridge px={px} py={py} />
      </Canvas>

      {/* soft ambient glow under the QR */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35),transparent_60%)] blur-2xl" />
    </div>
  );
}
