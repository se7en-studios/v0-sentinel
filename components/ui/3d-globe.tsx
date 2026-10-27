"use client";
import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface GlobeMarker {
  lat: number;
  lng: number;
  /** Optional circular image. Without it the marker is a pulsing ember. */
  src?: string;
  label?: string;
  /** Ember colour when there is no image. */
  color?: string;
  size?: number;
}

export interface Globe3DConfig {
  /** Globe radius */
  radius?: number;
  /** URL to the Earth texture map */
  textureUrl?: string;
  /** URL to the bump/elevation map for terrain */
  bumpMapUrl?: string;
  /** Warm glow added on top of the texture (city lights read as embers). */
  emissiveColor?: string;
  emissiveIntensity?: number;
  /** Whether to show atmosphere glow */
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  /** Higher = more diffuse */
  atmosphereBlur?: number;
  /** Terrain bump scale (0 = flat) */
  bumpScale?: number;
  /** Auto rotate speed (0 = disabled) */
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  /** Let the visitor drag the globe. Off by default on touch so the page still scrolls. */
  enableRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  /** Where the camera starts looking (degrees). Defaults to the Americas. */
  initialLat?: number;
  initialLng?: number;
  showWireframe?: boolean;
  wireframeColor?: string;
  ambientIntensity?: number;
  pointLightIntensity?: number;
  /** Background color (null for transparent) */
  backgroundColor?: string | null;
}

interface Globe3DProps {
  markers?: GlobeMarker[];
  config?: Globe3DConfig;
  className?: string;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

// ============================================================================
// Marker
// ============================================================================

interface MarkerProps {
  marker: GlobeMarker;
  radius: number;
  onClick?: (marker: GlobeMarker) => void;
  onHover?: (marker: GlobeMarker | null) => void;
}

function Marker({ marker, radius, onClick, onHover }: MarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const imageGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const color = marker.color ?? "#ff6a2b";

  const surfacePosition = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.001),
    [marker.lat, marker.lng, radius],
  );
  const topPosition = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.18),
    [marker.lat, marker.lng, radius],
  );
  const lineHeight = topPosition.distanceTo(surfacePosition);

  // Hide markers on the far side of the globe.
  useFrame(() => {
    if (!imageGroupRef.current) return;
    const worldPos = new THREE.Vector3();
    imageGroupRef.current.getWorldPosition(worldPos);
    const dot = worldPos.normalize().dot(camera.position.clone().normalize());
    setIsVisible(dot > 0.1);
  });

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    onHover?.(marker);
  }, [marker, onHover]);
  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    onHover?.(null);
  }, [onHover]);
  const handleClick = useCallback(() => onClick?.(marker), [marker, onClick]);

  const { lineCenter, lineQuaternion } = useMemo(() => {
    const center = surfacePosition.clone().lerp(topPosition, 0.5);
    const direction = topPosition.clone().sub(surfacePosition).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return { lineCenter: center, lineQuaternion: quaternion };
  }, [surfacePosition, topPosition]);

  return (
    <group visible={isVisible}>
      <mesh position={lineCenter} quaternion={lineQuaternion}>
        <cylinderGeometry args={[0.003, 0.003, lineHeight, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.95 : 0.55}
        />
      </mesh>

      <mesh position={surfacePosition} quaternion={lineQuaternion}>
        <coneGeometry args={[0.015, 0.04, 8]} />
        <meshBasicMaterial color={hovered ? "#ffd27a" : color} />
      </mesh>

      <group ref={imageGroupRef} position={topPosition}>
        <Html
          transform
          center
          sprite
          distanceFactor={10}
          style={{
            pointerEvents: isVisible ? "auto" : "none",
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.15s ease-out",
          }}
        >
          <div className="relative flex items-center justify-center">
            {hovered && marker.label ? (
              <span className="pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[5px] font-medium text-white">
                {marker.label}
              </span>
            ) : null}
            <div
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-full shadow-lg transition-transform duration-200",
                hovered && "scale-150",
              )}
              style={{
                width: "4px",
                height: "4px",
                background: marker.src ? "#171717" : color,
              }}
              onMouseEnter={handlePointerEnter}
              onMouseLeave={handlePointerLeave}
              onClick={handleClick}
            >
              {marker.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={marker.src}
                  alt={marker.label || "Marker"}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : null}
            </div>
            {!marker.src ? (
              <span
                aria-hidden
                className="pointer-events-none absolute size-1 animate-ping rounded-full opacity-60"
                style={{ background: color }}
              />
            ) : null}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ============================================================================
// Globe + markers
// ============================================================================

interface RotatingGlobeProps {
  config: Required<Globe3DConfig>;
  markers: GlobeMarker[];
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}

function RotatingGlobe({
  config,
  markers,
  onMarkerClick,
  onMarkerHover,
}: RotatingGlobeProps) {
  // Configured in the load callback: the textures returned by the hook are read-only.
  const [earthTexture, bumpTexture] = useTexture([config.textureUrl, config.bumpMapUrl], ([earth, bump]) => {
    earth.colorSpace = THREE.SRGBColorSpace;
    earth.anisotropy = 16;
    bump.anisotropy = 8;
  });

  const geometry = useMemo(
    () => new THREE.SphereGeometry(config.radius, 64, 64),
    [config.radius],
  );
  const wireframeGeometry = useMemo(
    () => new THREE.SphereGeometry(config.radius * 1.002, 32, 16),
    [config.radius],
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={config.bumpScale * 0.05}
          emissive={config.emissiveColor}
          emissiveMap={earthTexture}
          emissiveIntensity={config.emissiveIntensity}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {config.showWireframe && (
        <mesh geometry={wireframeGeometry}>
          <meshBasicMaterial
            color={config.wireframeColor}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      )}

      {markers.map((marker, index) => (
        <Marker
          key={`marker-${index}-${marker.lat}-${marker.lng}`}
          marker={marker}
          radius={config.radius}
          onClick={onMarkerClick}
          onHover={onMarkerHover}
        />
      ))}
    </group>
  );
}

// ============================================================================
// Atmosphere
// ============================================================================

function Atmosphere({
  radius,
  color,
  intensity,
  blur,
}: {
  radius: number;
  color: string;
  intensity: number;
  blur: number;
}) {
  const fresnelPower = Math.max(0.5, 5 - blur);

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          atmosphereColor: { value: new THREE.Color(color) },
          intensity: { value: intensity },
          fresnelPower: { value: fresnelPower },
        },
        vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
        fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float intensity;
        uniform float fresnelPower;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), fresnelPower);
          gl_FragColor = vec4(atmosphereColor, fresnel * intensity);
        }
      `,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [color, intensity, fresnelPower],
  );

  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[radius, 64, 32]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  );
}

// ============================================================================
// Scene
// ============================================================================

function Scene({
  markers,
  config,
  onMarkerClick,
  onMarkerHover,
}: {
  markers: GlobeMarker[];
  config: Required<Globe3DConfig>;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}) {
  const { camera } = useThree();

  // The camera starts above the chosen lat/lng; OrbitControls then orbits from there.
  useEffect(() => {
    camera.position.copy(
      latLngToVector3(
        config.initialLat,
        config.initialLng,
        config.radius * 3.5,
      ),
    );
    camera.lookAt(0, 0, 0);
  }, [camera, config.radius, config.initialLat, config.initialLng]);

  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight
        position={[config.radius * 5, config.radius * 2, config.radius * 5]}
        intensity={config.pointLightIntensity}
        color="#ffffff"
      />
      <directionalLight
        position={[-config.radius * 3, config.radius, -config.radius * 2]}
        intensity={config.pointLightIntensity * 0.3}
        color="#ff9a5a"
      />

      <RotatingGlobe
        config={config}
        markers={markers}
        onMarkerClick={onMarkerClick}
        onMarkerHover={onMarkerHover}
      />

      {config.showAtmosphere && (
        <Atmosphere
          radius={config.radius}
          color={config.atmosphereColor}
          intensity={config.atmosphereIntensity}
          blur={config.atmosphereBlur}
        />
      )}

      <OrbitControls
        makeDefault
        enablePan={config.enablePan}
        enableZoom={config.enableZoom}
        enableRotate={config.enableRotate}
        minDistance={config.minDistance}
        maxDistance={config.maxDistance}
        rotateSpeed={0.4}
        autoRotate={config.autoRotateSpeed > 0}
        autoRotateSpeed={config.autoRotateSpeed}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
}


// ============================================================================
// Globe3D
// ============================================================================

const defaultConfig: Required<Globe3DConfig> = {
  radius: 2,
  textureUrl: "/globe/earth-ember.webp",
  bumpMapUrl: "/globe/earth-topology.png",
  emissiveColor: "#ffffff",
  emissiveIntensity: 1.1,
  showAtmosphere: true,
  atmosphereColor: "#ff6a2b",
  atmosphereIntensity: 0.9,
  atmosphereBlur: 2,
  bumpScale: 1,
  autoRotateSpeed: 0.3,
  enableZoom: false,
  enablePan: false,
  enableRotate: true,
  minDistance: 5,
  maxDistance: 15,
  initialLat: 0,
  initialLng: -90,
  showWireframe: false,
  wireframeColor: "#4a9eff",
  ambientIntensity: 0.25,
  pointLightIntensity: 0.4,
  backgroundColor: null,
};

export function Globe3D({
  markers = [],
  config = {},
  className,
  onMarkerClick,
  onMarkerHover,
}: Globe3DProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const mergedConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config],
  );

  // Render only while on screen: the globe animates forever and would otherwise burn the GPU.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("relative h-[500px] w-full", className)}
      style={{ touchAction: "pan-y" }}
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [0, 0, mergedConfig.radius * 3.5],
        }}
        style={{ background: mergedConfig.backgroundColor || "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene
            markers={markers}
            config={mergedConfig}
            onMarkerClick={onMarkerClick}
            onMarkerHover={onMarkerHover}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Globe3D;
