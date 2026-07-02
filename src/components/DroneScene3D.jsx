import { useEffect, useMemo, useRef } from "react";
import { ExternalLink, MousePointer2, Rotate3D, ZoomIn } from "lucide-react";
import * as THREE from "three";

const WEATHER_TONES = {
  clear: { sky: 0xbfe9ff, ground: 0x78ad67, fog: 0xb8ded8 },
  rain: { sky: 0x6c8790, ground: 0x5f9573, fog: 0x6f8f95 },
  wind: { sky: 0xa7d6e5, ground: 0x78ac6a, fog: 0x9fc9c8 },
  heat: { sky: 0xffd58a, ground: 0x9fb75f, fog: 0xf2c678 },
};

export default function DroneScene3D({
  weather,
  droneState,
  isAirborne,
  isSpraying,
  location,
  operationTile,
  onOpenDrone,
  children,
}) {
  const mountRef = useRef(null);
  const propsRef = useRef({ weather, droneState, isAirborne, isSpraying, operationTile });
  const mapsUrl = useMemo(() => {
    const lat = location?.latitude;
    const lng = location?.longitude;
    return lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : "https://www.google.com/maps";
  }, [location]);

  useEffect(() => {
    propsRef.current = { weather, droneState, isAirborne, isSpraying, operationTile };
  }, [weather, droneState, isAirborne, isSpraying, operationTile]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(WEATHER_TONES.clear.fog, 32, 72);

    const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 120);
    const orbit = { theta: -0.72, phi: 0.92, radius: 34, target: new THREE.Vector3(0, 0, 0) };
    const updateCamera = () => {
      camera.position.set(
        Math.sin(orbit.theta) * orbit.radius,
        Math.sin(orbit.phi) * orbit.radius,
        Math.cos(orbit.theta) * orbit.radius,
      );
      camera.lookAt(orbit.target);
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x405447, 1.25);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(18, 28, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const groundMat = new THREE.MeshStandardMaterial({ color: WEATHER_TONES.clear.ground, roughness: 0.92 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(46, 30, 1, 1), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const fieldGroup = new THREE.Group();
    scene.add(fieldGroup);
    const cropMats = [
      new THREE.MeshStandardMaterial({ color: 0x8cc56a, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x6fb35c, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0xa2ca68, roughness: 0.85 }),
    ];
    [
      [-12, -6, 12, 9, 0],
      [8, -6, 15, 8, 1],
      [-13, 7, 11, 7, 2],
      [9, 7, 12, 7, 0],
    ].forEach(([x, z, w, d, matIndex], patchIndex) => {
      const patch = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), new THREE.MeshStandardMaterial({ color: 0x5d9d55, roughness: 0.95 }));
      patch.position.set(x, 0.05, z);
      patch.receiveShadow = true;
      fieldGroup.add(patch);
      for (let row = 0; row < Math.floor(w); row += 1) {
        const crop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, d - 1), cropMats[(row + patchIndex) % cropMats.length]);
        crop.position.set(x - w / 2 + row + 0.7, 0.32, z);
        crop.castShadow = true;
        fieldGroup.add(crop);
      }
    });

    const river = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 33), new THREE.MeshStandardMaterial({ color: 0x56a9b6, roughness: 0.38, metalness: 0.05 }));
    river.position.set(0.7, 0.09, 0);
    river.rotation.y = 0.22;
    scene.add(river);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0xbda26a, roughness: 0.82 });
    const road = new THREE.Mesh(new THREE.BoxGeometry(48, 0.1, 1.1), roadMat);
    road.position.set(0, 0.16, 2.4);
    road.rotation.y = -0.12;
    scene.add(road);
    const sideRoad = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 29), roadMat);
    sideRoad.position.set(-10.5, 0.18, 0);
    sideRoad.rotation.y = -0.08;
    scene.add(sideRoad);

    const station = createStation();
    station.position.set(-15, 0.35, 8.4);
    station.rotation.y = 0.35;
    scene.add(station);

    const drone = createDrone();
    scene.add(drone);

    const flightPath = createFlightPath();
    scene.add(flightPath);

    const sprayGroup = createSprayParticles();
    scene.add(sprayGroup);

    const rainGroup = createRain();
    scene.add(rainGroup);
    const windGroup = createWind();
    scene.add(windGroup);
    const heatGroup = createHeat();
    scene.add(heatGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveringDrone = false;
    let dragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;
    const isSceneEvent = (event) => event.target === renderer.domElement || event.target === mount;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const onPointerDown = (event) => {
      if (!isSceneEvent(event)) return;
      dragging = true;
      moved = false;
      lastX = event.clientX;
      lastY = event.clientY;
      mount.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!isSceneEvent(event)) return;
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      hoveringDrone = raycaster.intersectObject(drone, true).length > 0;
      mount.classList.toggle("is-drone-hovered", hoveringDrone);

      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      orbit.theta -= dx * 0.006;
      orbit.phi = Math.max(0.42, Math.min(1.2, orbit.phi - dy * 0.004));
      lastX = event.clientX;
      lastY = event.clientY;
      updateCamera();
    };
    const onPointerUp = (event) => {
      if (dragging && isSceneEvent(event) && !moved && hoveringDrone) onOpenDrone?.();
      dragging = false;
    };
    const onWheel = (event) => {
      if (!isSceneEvent(event)) return;
      event.preventDefault();
      orbit.radius = Math.max(20, Math.min(48, orbit.radius + event.deltaY * 0.018));
      updateCamera();
    };
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("pointerleave", onPointerUp);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const clock = new THREE.Clock();
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const current = propsRef.current;
      const tone = WEATHER_TONES[current.weather?.type ?? "clear"] ?? WEATHER_TONES.clear;
      scene.background = new THREE.Color(tone.sky);
      scene.fog.color.setHex(tone.fog);
      groundMat.color.lerp(new THREE.Color(tone.ground), 0.035);

      const target = getDroneTarget(current.droneState);
      drone.position.lerp(target, 0.035);
      drone.rotation.y = Math.sin(elapsed * 0.8) * 0.2 + (current.droneState === "RETURNING" ? -0.75 : 0.25);
      drone.position.y += Math.sin(elapsed * 3.2) * (current.droneState === "DOCKED" ? 0.002 : 0.014);
      drone.traverse((child) => {
        if (child.userData?.rotor) child.rotation.y += 0.55;
      });

      flightPath.visible = current.isAirborne;
      sprayGroup.visible = current.isSpraying;
      sprayGroup.children.forEach((drop, index) => {
        drop.position.y -= 0.035 + index * 0.001;
        drop.material.opacity = Math.max(0, drop.material.opacity - 0.01);
        if (drop.position.y < 0.5) {
          drop.position.y = 3.6;
          drop.material.opacity = 0.72;
        }
      });

      rainGroup.visible = current.weather?.type === "rain";
      windGroup.visible = current.weather?.type === "wind";
      heatGroup.visible = current.weather?.type === "heat";
      rainGroup.children.forEach((drop) => {
        drop.position.y -= 0.24;
        drop.position.x += 0.04;
        if (drop.position.y < 0) {
          drop.position.y = 13 + Math.random() * 6;
          drop.position.x = -20 + Math.random() * 40;
        }
      });
      windGroup.children.forEach((line, index) => {
        line.position.x += 0.18 + index * 0.008;
        if (line.position.x > 26) line.position.x = -25;
      });
      heatGroup.children.forEach((wave, index) => {
        wave.position.x = Math.sin(elapsed * 1.7 + index) * 1.5;
        wave.material.opacity = 0.1 + Math.sin(elapsed * 2 + index) * 0.04;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointerleave", onPointerUp);
      mount.removeEventListener("wheel", onWheel);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onOpenDrone]);

  return (
    <div className={`relative w-full h-full cursor-move scene-${weather.type}`} ref={mountRef}>
      {children && (
        <div className="absolute top-sm left-sm z-10 pointer-events-auto">{children}</div>
      )}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 text-[10px] text-on-surface-variant font-data-mono pointer-events-none opacity-80 drop-shadow-md">
        <span className="flex items-center gap-1"><Rotate3D size={11} /> Kéo xoay</span>
        <span className="flex items-center gap-1"><ZoomIn size={11} /> Cuộn zoom</span>
      </div>
      <a 
        className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-primary hover:text-primary-fixed bg-surface-container-highest/80 backdrop-blur px-2 py-1 rounded font-bold transition-colors pointer-events-auto border border-outline-variant"
        href={mapsUrl} target="_blank" rel="noreferrer"
      >
        <ExternalLink size={11} /> Maps
      </a>
    </div>
  );
}

function createStation() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.45, 2.2), new THREE.MeshStandardMaterial({ color: 0xe9e2b7, roughness: 0.8 }));
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 2.5), new THREE.MeshStandardMaterial({ color: 0x456f61, roughness: 0.7 }));
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 40), new THREE.MeshStandardMaterial({ color: 0x2e554b, roughness: 0.55 }));
  base.position.y = 0.25;
  roof.position.y = 0.72;
  pad.position.set(0, 0.1, -2.2);
  [base, roof, pad].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}

function createDrone() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4fbf7, roughness: 0.42, metalness: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x21463f, roughness: 0.52 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 1.1), bodyMat);
  body.castShadow = true;
  group.add(body);
  const camera = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 18), darkMat);
  camera.position.set(0, -0.28, -0.38);
  group.add(camera);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x385f57, roughness: 0.5 });
  [[1.35, 0, 0.85], [-1.35, 0, 0.85], [1.35, 0, -0.85], [-1.35, 0, -0.85]].forEach(([x, y, z]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), armMat);
    arm.position.set(x / 2, y, z / 2);
    arm.rotation.y = Math.atan2(z, x);
    group.add(arm);
    const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 8, 32), bodyMat);
    rotor.position.set(x, 0.05, z);
    rotor.rotation.x = Math.PI / 2;
    rotor.userData.rotor = true;
    group.add(rotor);
  });
  group.position.copy(getDroneTarget("DOCKED"));
  return group;
}

function createFlightPath() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-15, 2.6, 8),
    new THREE.Vector3(-9, 5.4, 2),
    new THREE.Vector3(-2, 5.2, -2),
    new THREE.Vector3(5, 4.7, -5),
  ]);
  const points = curve.getPoints(48);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.7, gapSize: 0.45, transparent: true, opacity: 0.78 });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  line.visible = false;
  return line;
}

function createSprayParticles() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xbbece5, transparent: true, opacity: 0.72 });
  for (let index = 0; index < 16; index += 1) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), material.clone());
    drop.position.set(-0.8 + Math.random() * 1.6, 2 + Math.random() * 1.8, -0.5 + Math.random() * 1);
    group.add(drop);
  }
  group.position.set(4, 0, -4);
  group.visible = false;
  return group;
}

function createRain() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xdaf7ff, transparent: true, opacity: 0.65 });
  for (let index = 0; index < 90; index += 1) {
    const drop = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.4, 0.035), material.clone());
    drop.position.set(-20 + Math.random() * 40, 2 + Math.random() * 16, -14 + Math.random() * 28);
    drop.rotation.z = 0.18;
    group.add(drop);
  }
  group.visible = false;
  return group;
}

function createWind() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  for (let index = 0; index < 18; index += 1) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(5 + Math.random() * 4, 0.035, 0.035), material.clone());
    line.position.set(-23 + Math.random() * 42, 2 + Math.random() * 7, -13 + Math.random() * 26);
    line.rotation.y = -0.08;
    group.add(line);
  }
  group.visible = false;
  return group;
}

function createHeat() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xffe18a, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  for (let index = 0; index < 4; index += 1) {
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(32, 4), material.clone());
    wave.position.set(0, 1.3 + index * 1.2, -6 + index * 3);
    wave.rotation.x = -Math.PI / 2.8;
    group.add(wave);
  }
  group.visible = false;
  return group;
}

function getDroneTarget(state) {
  if (state === "DOCKED") return new THREE.Vector3(-15, 1.05, 6.2);
  if (state === "RETURNING") return new THREE.Vector3(-10.5, 3.2, 3.4);
  if (state === "SPRAYING") return new THREE.Vector3(4.4, 4.2, -4.2);
  return new THREE.Vector3(-1, 5.1, -2.8);
}
