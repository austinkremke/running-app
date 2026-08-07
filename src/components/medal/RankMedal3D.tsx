import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO_SOURCE = require('../../../assets/icons/main-logo.png');
const LOGO_ASPECT = 270 / 235;
const LOGO_PLANE_WIDTH = 1.2;
const LOGO_PLANE_HEIGHT = LOGO_PLANE_WIDTH / LOGO_ASPECT;

type MotionState = {
  /** Rotation (radians) queued from finger movement this frame, drained by useFrame. */
  pendingDelta: number;
  /** Radians/sec carried after release; decays via friction each frame. */
  velocity: number;
};

/** Converts on-screen drag pixels/velocity into mesh rotation. Tuned so a
 *  normal swipe reads as roughly half a turn, with a flick continuing to
 *  spin for a second or two before settling into a slow idle rotation. */
const DRAG_TO_RADIANS = 0.01;
const FLING_TO_RADIANS_PER_SEC = 0.004;
const FRICTION = 3;
const IDLE_SPIN_RADIANS_PER_SEC = 0.35;
const VELOCITY_REST_EPSILON = 0.001;

/** three.js's generic useLoader/TextureLoader path pulls in DOM APIs
 *  (`document`) that don't exist on native, even though @react-three/fiber's
 *  native build patches TextureLoader.prototype.load to avoid them —
 *  useLoader's own caching layer doesn't route through that patched method
 *  here. Building the texture by hand, the same way that patch does
 *  internally (expo-asset + Image.getSize, then a manually-populated
 *  THREE.Texture), sidesteps it entirely. */
function useLogoTexture(source: number): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;

      const { width, height } = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
        },
      );

      if (cancelled) return;

      const tex = new THREE.Texture();
      tex.image = { data: { localUri: uri }, width, height };
      tex.flipY = true;
      tex.needsUpdate = true;
      // @ts-expect-error — forces non-DOM upload for EXGL texImage2D.
      tex.isDataTexture = true;
      setTexture(tex);
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  return texture;
}

function CoinMesh({ motionRef, color }: { motionRef: React.MutableRefObject<MotionState>; color: string }) {
  // CylinderGeometry's flat faces are perpendicular to its own local Y axis
  // by default, but the camera sits on Z — face-on to the camera means
  // tilting the coin 90° around X. Spin is applied to the outer group's Y
  // (world/screen-vertical axis), not the mesh's own now-reoriented Y, so a
  // swipe still spins it face-on rather than end-over-end.
  const groupRef = useRef<THREE.Group>(null);
  const rotationY = useRef(0);
  const logoTexture = useLogoTexture(LOGO_SOURCE);

  useFrame((_, delta) => {
    const motion = motionRef.current;

    if (motion.pendingDelta !== 0) {
      rotationY.current += motion.pendingDelta;
      motion.pendingDelta = 0;
    } else if (Math.abs(motion.velocity) > VELOCITY_REST_EPSILON) {
      rotationY.current += motion.velocity * delta;
      motion.velocity *= Math.exp(-FRICTION * delta);
    } else {
      motion.velocity = 0;
      rotationY.current += delta * IDLE_SPIN_RADIANS_PER_SEC;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = rotationY.current;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.16, 64]} />
        {/* meshStandardMaterial (PBR) needs GLSL derivative extensions
         *  expo-gl doesn't reliably support and renders invisible with no
         *  error — meshPhongMaterial is the RN-safe choice for a shiny look. */}
        <meshPhongMaterial color={color} shininess={90} specular="#fff8dc" />
      </mesh>
      {/* Logo overlay — a transparent-background PNG on a thin plane just in
       *  front of the coin's face. A sibling of the tilted coin mesh (not a
       *  child of it), so it's positioned directly in the group's own local
       *  frame — which, after the coin mesh's rotation, already has +Z as
       *  "facing the camera," matching PlaneGeometry's default orientation
       *  with no extra rotation needed. */}
      {logoTexture ? (
        <mesh position={[0, 0, 0.081]}>
          <planeGeometry args={[LOGO_PLANE_WIDTH, LOGO_PLANE_HEIGHT]} />
          <meshBasicMaterial alphaTest={0.5} map={logoTexture} transparent />
        </mesh>
      ) : null}
    </group>
  );
}

type RankMedal3DProps = {
  size?: number;
  /** Gold/silver/bronze — or any hex color for a custom tier. */
  color?: string;
};

/** A swipeable spinning 3D medal — drag rotates it 1:1 with your finger,
 *  a flick keeps it spinning with decaying inertia, and it settles into a
 *  slow idle spin at rest. */
export function RankMedal3D({ size = 220, color = '#F5C842' }: RankMedal3DProps) {
  const motionRef = useRef<MotionState>({ pendingDelta: 0, velocity: 0 });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onChange((event) => {
      motionRef.current.pendingDelta += event.changeX * DRAG_TO_RADIANS;
      motionRef.current.velocity = 0;
    })
    .onEnd((event) => {
      motionRef.current.velocity = event.velocityX * FLING_TO_RADIANS_PER_SEC;
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size }}>
        {/* Canvas's internal wrapper uses flex:1 to fill its parent — an
         *  explicit style here (rather than relying on the parent's flex
         *  behavior) guarantees it gets real, non-zero dimensions regardless
         *  of the parent's alignItems/justifyContent. Without this it can
         *  silently collapse to 0 width and never mount its GL view. */}
        <Canvas camera={{ position: [0, 0, 4], fov: 35 }} style={styles.canvas}>
          <ambientLight intensity={0.6} />
          <directionalLight intensity={1.3} position={[2, 3, 4]} />
          <directionalLight color="#8AA0FF" intensity={0.35} position={[-3, -2, -2]} />
          <CoinMesh color={color} motionRef={motionRef} />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    height: '100%',
  },
});
