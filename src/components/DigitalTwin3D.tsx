import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  DiagnosticSummary,
  MachineProfile,
  SensorFeatureStats,
  SensorKey,
} from '../models/types';
import {
  Box,
  Crosshair,
  Download,
  Eye,
  FileBox,
  Flame,
  Layers,
  Maximize2,
  RotateCcw,
  Sliders,
  Sparkles,
  Upload,
} from 'lucide-react';

export type TwinViewMode = 'standard' | 'exploded' | 'section' | 'thermal' | 'sensor';
export type CameraPreset = 'isometric' | 'front' | 'top' | 'right' | 'section';

export interface PresetGlbModel {
  id: string;
  name: string;
  filename: string;
  path: string;
  description: string;
  sizeKb: number;
}

export const PRESET_GLB_MODELS: PresetGlbModel[] = [
  {
    id: 'industrial_powertrain',
    name: 'Helical Powertrain',
    filename: 'industrial_powertrain.glb',
    path: '/models/industrial_powertrain.glb',
    description: 'Double-reduction helical gear train with input/output shafts, roller bearings, and thermal fins',
    sizeKb: 133,
  },
  {
    id: 'industrial_motor',
    name: 'Induction Motor',
    filename: 'industrial_motor.glb',
    path: '/models/industrial_motor.glb',
    description: 'PBR Stator housing with cooling ribs, drive shaft, end-shields, and top conduit box',
    sizeKb: 99,
  },
  {
    id: 'centrifugal_pump',
    name: 'Centrifugal Pump',
    filename: 'centrifugal_pump.glb',
    path: '/models/centrifugal_pump.glb',
    description: 'Spiral volute casing, high-efficiency bronze impeller, suction/discharge ANSI flanges',
    sizeKb: 116,
  },
];

export function resolvePresetGlbForMachine(machine: MachineProfile): string {
  if (
    machine.category === 'Pump' ||
    machine.code.startsWith('GP') ||
    machine.id.includes('GP') ||
    machine.name.toLowerCase().includes('pump')
  ) {
    return 'centrifugal_pump';
  }
  if (
    machine.category === 'Compressor' ||
    machine.code.startsWith('GC') ||
    machine.id.includes('GC') ||
    machine.code.startsWith('TX') ||
    machine.name.toLowerCase().includes('motor') ||
    machine.name.toLowerCase().includes('compressor')
  ) {
    return 'industrial_motor';
  }
  return 'industrial_powertrain';
}

interface DigitalTwin3DProps {
  machine: MachineProfile;
  diagnostics: DiagnosticSummary;
  selectedSensorKey: SensorKey | null;
  onSelectSensor: (key: SensorKey) => void;
  highlightedComponentId: string | null;
  onSelectComponent?: (componentId: string | null) => void;
  compactMode?: boolean;
  initialViewMode?: TwinViewMode;
}

interface ProjectedSensorNode {
  id: string;
  key: SensorKey;
  label: string;
  shortLabel: string;
  unit: string;
  componentId: string;
  componentName: string;
  x: number;
  y: number;
  visible: boolean;
  stat: SensorFeatureStats;
}

/**
 * Helper to build a true 3D Involute Toothed Gear Geometry via THREE.Shape + THREE.ExtrudeGeometry
 * for GLB/GLTF PBR Machinery CAD rendering.
 */
function createInvoluteGearGeometry(
  teeth: number,
  outerRadius: number,
  rootRadius: number,
  boreRadius: number,
  faceWidth: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.30;
    const a3 = a0 + step * 0.62;
    const a4 = a0 + step * 0.74;

    const p0x = Math.cos(a0) * rootRadius;
    const p0y = Math.sin(a0) * rootRadius;
    if (i === 0) {
      shape.moveTo(p0x, p0y);
    } else {
      shape.lineTo(p0x, p0y);
    }
    shape.lineTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
  }
  shape.closePath();

  // Center bore hole
  const boreHole = new THREE.Path();
  boreHole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
  shape.holes.push(boreHole);

  // Lightning web holes for larger gears
  if (rootRadius - boreRadius > 0.18) {
    const holeOrbit = (rootRadius + boreRadius) * 0.5;
    const holeRad = (rootRadius - boreRadius) * 0.22;
    for (let h = 0; h < 6; h++) {
      const ha = (h / 6) * Math.PI * 2;
      const webHole = new THREE.Path();
      webHole.absarc(
        Math.cos(ha) * holeOrbit,
        Math.sin(ha) * holeOrbit,
        holeRad,
        0,
        Math.PI * 2,
        true
      );
      shape.holes.push(webHole);
    }
  }

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: faceWidth,
    bevelEnabled: true,
    bevelThickness: Math.min(0.018, faceWidth * 0.08),
    bevelSize: Math.min(0.015, faceWidth * 0.06),
    bevelSegments: 2,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  // Rotate so gear axis is along X-axis
  geo.rotateY(Math.PI / 2);
  return geo;
}

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({
  machine,
  diagnostics,
  selectedSensorKey,
  onSelectSensor,
  highlightedComponentId,
  onSelectComponent,
  compactMode = false,
  initialViewMode = 'section',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<TwinViewMode>(initialViewMode);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [explodeAmount, setExplodeAmount] = useState<number>(
    initialViewMode === 'exploded' ? 0.75 : 0
  );
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    housing: true,
    shafts: true,
    bearings: true,
    gears: true,
    lubrication: true,
    sensors: true,
  });
  const [projectedNodes, setProjectedNodes] = useState<ProjectedSensorNode[]>([]);
  const [webglError, setWebglError] = useState<boolean>(false);

  // GLB / GLTF 3D Asset State - Dynamically resolved based on active machine
  const initialPresetId = resolvePresetGlbForMachine(machine);
  const initialPresetObj =
    PRESET_GLB_MODELS.find((p) => p.id === initialPresetId) || PRESET_GLB_MODELS[0];

  const [selectedPresetGlbId, setSelectedPresetGlbId] = useState<string>(initialPresetId);
  const [activeGlbName, setActiveGlbName] = useState<string>(initialPresetObj.filename);
  const [glbSizeKb, setGlbSizeKb] = useState<number>(initialPresetObj.sizeKb);
  const [customGlbUrl, setCustomGlbUrl] = useState<string | null>(null);
  const [glbStatusMsg, setGlbStatusMsg] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState<boolean>(false);
  // Default to STATIC (no auto animation as requested: "animated nai joitu if possible")
  const [isAnimated, setIsAnimated] = useState<boolean>(false);
  const [useGlbAsset, setUseGlbAsset] = useState<boolean>(true);
  const glbBufferRef = useRef<ArrayBuffer | null>(null);

  // Sync preset model whenever machine changes
  useEffect(() => {
    if (!customGlbUrl) {
      const targetId = resolvePresetGlbForMachine(machine);
      setSelectedPresetGlbId(targetId);
      const matched = PRESET_GLB_MODELS.find((p) => p.id === targetId);
      if (matched) {
        setActiveGlbName(matched.filename);
        setGlbSizeKb(matched.sizeKb);
      }
    }
  }, [machine.id, machine.code, machine.category, customGlbUrl]);

  // Refs for animation loop access without re-creating scene
  const stateRef = useRef({
    viewMode,
    explodeAmount,
    visibleLayers,
    highlightedComponentId,
    selectedSensorKey,
    rpm: diagnostics.sensorStats.rpm?.currentValue || machine.inputSpeedRpm,
    isRunning: false, // Default static, no animation
    isAnimated: false,
    useGlbAsset: true,
    targetSpherical: { radius: 3.95, phi: 1.12, theta: 0.70 },
    currentSpherical: { radius: 3.95, phi: 1.12, theta: 0.70 },
    panOffset: new THREE.Vector3(0, 0.04, 0),
  });

  useEffect(() => {
    stateRef.current.isAnimated = isAnimated;
    stateRef.current.isRunning = isAnimated && machine.operatingState === 'RUNNING';
  }, [isAnimated, machine.operatingState]);

  useEffect(() => {
    stateRef.current.useGlbAsset = useGlbAsset;
  }, [useGlbAsset]);

  useEffect(() => {
    stateRef.current.viewMode = viewMode;
    if (viewMode === 'exploded' && explodeAmount < 0.1) {
      setExplodeAmount(0.75);
      stateRef.current.explodeAmount = 0.75;
    } else if (viewMode !== 'exploded' && explodeAmount > 0) {
      setExplodeAmount(0);
      stateRef.current.explodeAmount = 0;
    }
  }, [viewMode]);

  useEffect(() => {
    stateRef.current.explodeAmount = explodeAmount;
  }, [explodeAmount]);

  useEffect(() => {
    stateRef.current.visibleLayers = visibleLayers;
  }, [visibleLayers]);

  useEffect(() => {
    stateRef.current.highlightedComponentId = highlightedComponentId;
  }, [highlightedComponentId]);

  useEffect(() => {
    stateRef.current.selectedSensorKey = selectedSensorKey;
  }, [selectedSensorKey]);

  useEffect(() => {
    stateRef.current.rpm =
      diagnostics.sensorStats.rpm?.currentValue || machine.inputSpeedRpm;
    stateRef.current.isRunning = machine.operatingState === 'RUNNING';
  }, [diagnostics, machine]);

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const t = stateRef.current.targetSpherical;
    stateRef.current.panOffset.set(0, 0.04, 0);
    if (preset === 'isometric') {
      t.radius = 3.95;
      t.phi = 1.12;
      t.theta = 0.70;
    } else if (preset === 'front') {
      t.radius = 3.85;
      t.phi = Math.PI / 2 - 0.04;
      t.theta = 0.0;
    } else if (preset === 'top') {
      t.radius = 4.15;
      t.phi = 0.18;
      t.theta = 0.0;
    } else if (preset === 'right') {
      t.radius = 3.85;
      t.phi = Math.PI / 2 - 0.05;
      t.theta = Math.PI / 2;
    } else if (preset === 'section') {
      t.radius = 3.55;
      t.phi = 1.16;
      t.theta = 0.42;
      setViewMode('section');
    }
  };

  // Handle user uploading a custom .GLB / .GLTF 3D Machinery Model
  const handleGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customGlbUrl) {
      URL.revokeObjectURL(customGlbUrl);
    }
    const url = URL.createObjectURL(file);
    setCustomGlbUrl(url);
    setActiveGlbName(file.name);
    setGlbSizeKb(Math.max(1, Math.round(file.size / 1024)));
    setGlbStatusMsg(`Loaded 3D GLTF/GLB Asset: ${file.name}`);
    setTimeout(() => setGlbStatusMsg(null), 4000);
  };

  // Handle exporting/downloading the current 3D Machinery Assembly as a binary .GLB file
  const handleDownloadGlb = () => {
    if (!glbBufferRef.current) return;
    const blob = new Blob([glbBufferRef.current], {
      type: 'model/gltf-binary',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeGlbName.endsWith('.glb')
      ? activeGlbName
      : `${machine.code}_CuraAI_Machinery.glb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // PBR Environment Map via RoomEnvironment for realistic GLB/GLTF metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );

    // Studio & Dark CAD Lighting (Cyan-Teal + Deep Ocean Blue + Vintage Off-White Key)
    const ambientLight = new THREE.AmbientLight(0xf6f1e5, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf6f1e5, 2.2);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLightCyan = new THREE.DirectionalLight(0x2ce0ec, 1.85);
    rimLightCyan.position.set(-6, 4, -5);
    scene.add(rimLightCyan);

    const fillLightBlue = new THREE.PointLight(0x19a7ce, 1.5, 14);
    fillLightBlue.position.set(0, -2.2, 4);
    scene.add(fillLightBlue);

    // Dark Shaded CAD Reference Floor Grid & Pedestal Ring
    const gridHelper = new THREE.GridHelper(6.4, 18, 0x2ce0ec, 0x0b2942);
    gridHelper.position.y = -0.96;
    (gridHelper.material as THREE.Material).opacity = 0.34;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Glowing Cyan-Blue Floor Pedestal Ring under the 3D GLB Machinery
    const pedestalRing = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.42, 64),
      new THREE.MeshBasicMaterial({
        color: 0x2ce0ec,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.42,
      })
    );
    pedestalRing.rotation.x = -Math.PI / 2;
    pedestalRing.position.y = -0.955;
    scene.add(pedestalRing);

    // Scale dimensions relative to standard 800x600x550mm box
    const dim = machine.dimensions;
    const scaleX = (dim.housingLengthMm / 800) * 2.2;
    const scaleY = (dim.housingHeightMm / 550) * 1.45;
    const scaleZ = (dim.housingWidthMm / 600) * 1.55;
    const inShaftRadius = (dim.inputShaftDiameterMm / 70) * 0.135;
    const outShaftRadius = (dim.outputShaftDiameterMm / 100) * 0.195;

    // GLTF 2.0 PBR Metallic-Roughness Materials
    const darkCastIronMat = new THREE.MeshStandardMaterial({
      name: 'PBR_CastIron_Casing',
      color: 0x1e2c3a,
      metalness: 0.78,
      roughness: 0.32,
    });
    const machinedFlangeMat = new THREE.MeshStandardMaterial({
      name: 'PBR_VintageOffWhite_Steel',
      color: 0xf2ece0,
      metalness: 0.88,
      roughness: 0.20,
    });
    const translucentHoodMat = new THREE.MeshPhysicalMaterial({
      name: 'PBR_DarkSmokedGlass_Hood',
      color: 0x0b2840,
      metalness: 0.15,
      roughness: 0.08,
      transparent: true,
      opacity: 0.42,
      transmission: 0.55,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      emissive: 0x07263d,
      emissiveIntensity: 0.35,
    });
    const alloyShaftMat = new THREE.MeshStandardMaterial({
      name: 'PBR_HardenedAlloyShaft',
      color: 0xf6f1e5,
      metalness: 0.94,
      roughness: 0.14,
    });
    const gearCarburizedMat = new THREE.MeshStandardMaterial({
      name: 'PBR_CarburizedHelicalGear',
      color: 0x19a7ce,
      metalness: 0.88,
      roughness: 0.18,
      emissive: 0x042838,
      emissiveIntensity: 0.28,
    });
    const bearingBrassMat = new THREE.MeshStandardMaterial({
      name: 'PBR_BearingCageCyanAlloy',
      color: 0x2ce0ec,
      metalness: 0.90,
      roughness: 0.16,
      emissive: 0x06384d,
      emissiveIntensity: 0.32,
    });
    const oilBathMat = new THREE.MeshPhysicalMaterial({
      name: 'PBR_LubricationFluid',
      color: 0x009eb2,
      transparent: true,
      opacity: 0.48,
      roughness: 0.06,
      metalness: 0.1,
      transmission: 0.5,
      clearcoat: 0.95,
    });
    const splitLineWireMat = new THREE.LineBasicMaterial({
      color: 0x2ce0ec,
      transparent: true,
      opacity: 0.65,
    });

    // Groups for GLB/GLTF scene graph hierarchy & exploded choreography
    const rootGroup = new THREE.Group();
    rootGroup.name = `CuraAI_GLTF_Root_${machine.code}`;
    scene.add(rootGroup);

    const lowerHousingGroup = new THREE.Group();
    lowerHousingGroup.name = 'Layer_LowerHousing';
    const upperCoverGroup = new THREE.Group();
    upperCoverGroup.name = 'Layer_UpperCover';
    const frontWallGroup = new THREE.Group();
    frontWallGroup.name = 'Layer_FrontWall';
    const inputShaftGroup = new THREE.Group();
    inputShaftGroup.name = 'Layer_InputShaft';
    const intermediateShaftGroup = new THREE.Group();
    intermediateShaftGroup.name = 'Layer_IntermediateShaft';
    const outputShaftGroup = new THREE.Group();
    outputShaftGroup.name = 'Layer_OutputShaft';
    const bearingsGroup = new THREE.Group();
    bearingsGroup.name = 'Layer_Bearings';
    const gearsGroup = new THREE.Group();
    gearsGroup.name = 'Layer_Gears';
    const oilSumpGroup = new THREE.Group();
    oilSumpGroup.name = 'Layer_Lubrication';
    const customLoadedGlbGroup = new THREE.Group();
    customLoadedGlbGroup.name = 'Layer_CustomUploadedGLB';

    rootGroup.add(
      lowerHousingGroup,
      upperCoverGroup,
      frontWallGroup,
      inputShaftGroup,
      intermediateShaftGroup,
      outputShaftGroup,
      bearingsGroup,
      gearsGroup,
      oilSumpGroup,
      customLoadedGlbGroup
    );

    // 1. Heavy Cast-Iron Finned Lower Housing & Machined Baseplate
    const baseHeight = (dim.baseHeightMm / 80) * 0.16;
    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 1.16, baseHeight, scaleZ * 1.20),
      darkCastIronMat
    );
    basePlate.position.set(0, -scaleY * 0.5 - baseHeight * 0.5, 0);
    lowerHousingGroup.add(basePlate);

    // Machined Off-White Steel Mounting Pads & Hex Anchor Bolts
    const padGeo = new THREE.BoxGeometry(0.26, 0.03, 0.26);
    const boltGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.09, 6);
    const boltPositions = [
      [-scaleX * 0.51, -scaleY * 0.5 + 0.02, scaleZ * 0.52],
      [scaleX * 0.51, -scaleY * 0.5 + 0.02, scaleZ * 0.52],
      [-scaleX * 0.51, -scaleY * 0.5 + 0.02, -scaleZ * 0.52],
      [scaleX * 0.51, -scaleY * 0.5 + 0.02, -scaleZ * 0.52],
    ];
    boltPositions.forEach(([bx, by, bz]) => {
      const pad = new THREE.Mesh(padGeo, machinedFlangeMat);
      pad.position.set(bx, by - 0.02, bz);
      lowerHousingGroup.add(pad);

      const bolt = new THREE.Mesh(boltGeo, alloyShaftMat);
      bolt.position.set(bx, by + 0.02, bz);
      lowerHousingGroup.add(bolt);
    });

    // Lower U-shaped Sump Casing Walls
    const wallT = (dim.wallThicknessMm / 20) * 0.09;
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX, scaleY * 0.64, wallT),
      darkCastIronMat
    );
    backWall.position.set(0, -scaleY * 0.18, -scaleZ * 0.5 + wallT * 0.5);
    lowerHousingGroup.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallT, scaleY * 0.64, scaleZ),
      darkCastIronMat
    );
    leftWall.position.set(-scaleX * 0.5 + wallT * 0.5, -scaleY * 0.18, 0);
    lowerHousingGroup.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallT, scaleY * 0.64, scaleZ),
      darkCastIronMat
    );
    rightWall.position.set(scaleX * 0.5 - wallT * 0.5, -scaleY * 0.18, 0);
    lowerHousingGroup.add(rightWall);

    // External Cast-Iron Thermal Dissipation Fins
    for (let f = -5; f <= 5; f++) {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, scaleY * 0.52, scaleZ * 1.03),
        darkCastIronMat
      );
      fin.position.set(f * (scaleX * 0.082), -scaleY * 0.21, 0);
      lowerHousingGroup.add(fin);
    }

    // Precision Machined Split-Line Flange Rim + Perimeter Bolts
    const splitFlange = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 1.08, 0.055, scaleZ * 1.08),
      machinedFlangeMat
    );
    splitFlange.position.set(0, 0.13, 0);
    lowerHousingGroup.add(splitFlange);

    for (let b = -3; b <= 3; b++) {
      const fBoltBack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.09, 6),
        alloyShaftMat
      );
      fBoltBack.position.set(b * (scaleX * 0.14), 0.15, -scaleZ * 0.51);
      lowerHousingGroup.add(fBoltBack);

      const fBoltFront = fBoltBack.clone();
      fBoltFront.position.set(b * (scaleX * 0.14), 0.15, scaleZ * 0.51);
      lowerHousingGroup.add(fBoltFront);
    }

    // Front Removable Casing Wall with Oil Level Sight-Glass Port
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.98, scaleY * 0.62, wallT),
      translucentHoodMat
    );
    frontWall.position.set(0, -scaleY * 0.18, scaleZ * 0.5 - wallT * 0.5);
    frontWallGroup.add(frontWall);

    const sightGlassRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.05, 24),
      machinedFlangeMat
    );
    sightGlassRim.rotation.x = Math.PI / 2;
    sightGlassRim.position.set(-scaleX * 0.28, -scaleY * 0.28, scaleZ * 0.51);
    frontWallGroup.add(sightGlassRim);

    // Upper Inspection Hood + Lifting Eye-Bolts + Breather Valve
    const topCover = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.96, scaleY * 0.38, scaleZ * 0.94),
      translucentHoodMat
    );
    topCover.position.set(0, scaleY * 0.32, 0);
    upperCoverGroup.add(topCover);

    const topCoverEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(topCover.geometry),
      splitLineWireMat
    );
    topCoverEdges.position.copy(topCover.position);
    upperCoverGroup.add(topCoverEdges);

    const inspectionHatch = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.46, 0.05, scaleZ * 0.48),
      machinedFlangeMat
    );
    inspectionHatch.position.set(0, scaleY * 0.52, 0);
    upperCoverGroup.add(inspectionHatch);

    // Lifting Eye-Bolts (Torus rings on top cover)
    const eyeBoltGeo = new THREE.TorusGeometry(0.065, 0.018, 12, 24);
    const leftEyeBolt = new THREE.Mesh(eyeBoltGeo, machinedFlangeMat);
    leftEyeBolt.position.set(-scaleX * 0.34, scaleY * 0.56, 0);
    upperCoverGroup.add(leftEyeBolt);

    const rightEyeBolt = new THREE.Mesh(eyeBoltGeo, machinedFlangeMat);
    rightEyeBolt.position.set(scaleX * 0.34, scaleY * 0.56, 0);
    upperCoverGroup.add(rightEyeBolt);

    // 2. Lubrication Sump Bath & External Pressurized Oil Cooling Manifold Pipe
    const oilSumpMesh = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.88, scaleY * 0.32, scaleZ * 0.84),
      oilBathMat
    );
    oilSumpMesh.position.set(0, -scaleY * 0.32, 0);
    oilSumpGroup.add(oilSumpMesh);

    const pipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-scaleX * 0.36, -scaleY * 0.36, -scaleZ * 0.52),
      new THREE.Vector3(-scaleX * 0.36, -scaleY * 0.36, -scaleZ * 0.66),
      new THREE.Vector3(0, -scaleY * 0.05, -scaleZ * 0.66),
      new THREE.Vector3(scaleX * 0.32, 0.18, -scaleZ * 0.66),
      new THREE.Vector3(scaleX * 0.32, 0.18, -scaleZ * 0.48),
    ]);
    const manifoldPipe = new THREE.Mesh(
      new THREE.TubeGeometry(pipeCurve, 32, 0.032, 12, false),
      bearingBrassMat
    );
    oilSumpGroup.add(manifoldPipe);

    // 3. Stepped Alloy Input Shaft + Bolted Drive Coupling Flange
    const inputShaftY = 0.22;
    const inputShaftMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(inShaftRadius, inShaftRadius, scaleX * 0.92, 32),
      alloyShaftMat
    );
    inputShaftMesh.rotation.z = Math.PI / 2;
    inputShaftMesh.position.set(-scaleX * 0.38, inputShaftY, 0);
    inputShaftGroup.add(inputShaftMesh);

    // Input Drive Flange Coupling
    const inCouplingFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(inShaftRadius * 2.1, inShaftRadius * 2.1, 0.08, 28),
      machinedFlangeMat
    );
    inCouplingFlange.rotation.z = Math.PI / 2;
    inCouplingFlange.position.set(-scaleX * 0.82, inputShaftY, 0);
    inputShaftGroup.add(inCouplingFlange);

    // Keyway bar on input shaft extension
    const keywayMesh = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.26, 0.035, 0.035),
      bearingBrassMat
    );
    keywayMesh.position.set(-scaleX * 0.66, inputShaftY + inShaftRadius, 0);
    inputShaftGroup.add(keywayMesh);

    // 4. Precision Spherical Roller Bearings (SKF 22214 E)
    const createRollerBearing = (
      radius: number,
      width: number,
      x: number,
      y: number,
      z: number
    ) => {
      const brg = new THREE.Group();
      brg.position.set(x, y, z);

      const outerRing = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.68, radius * 1.68, width, 36, 1, true),
        bearingBrassMat
      );
      outerRing.rotation.z = Math.PI / 2;
      brg.add(outerRing);

      const outerHousingBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.82, radius * 1.82, width * 0.85, 32, 1, true),
        machinedFlangeMat
      );
      outerHousingBoss.rotation.z = Math.PI / 2;
      brg.add(outerHousingBoss);

      const innerRing = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.12, radius * 1.12, width * 1.06, 32),
        alloyShaftMat
      );
      innerRing.rotation.z = Math.PI / 2;
      brg.add(innerRing);

      const numRollers = 14;
      for (let r = 0; r < numRollers; r++) {
        const angle = (r / numRollers) * Math.PI * 2;
        const roller = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.21, radius * 0.21, width * 0.84, 14),
          alloyShaftMat
        );
        roller.rotation.z = Math.PI / 2;
        roller.position.set(
          0,
          Math.cos(angle) * (radius * 1.39),
          Math.sin(angle) * (radius * 1.39)
        );
        brg.add(roller);
      }
      return brg;
    };

    const deInputBearing = createRollerBearing(
      inShaftRadius * 1.15,
      0.22,
      -scaleX * 0.44,
      inputShaftY,
      0
    );
    bearingsGroup.add(deInputBearing);

    const ndeInputBearing = createRollerBearing(
      inShaftRadius * 1.05,
      0.18,
      scaleX * 0.12,
      inputShaftY,
      -0.25
    );
    bearingsGroup.add(ndeInputBearing);

    // 5. True 3D Extruded Involute Gear Train (Input Pinion, Intermediate Gear/Pinion, Output Bull Gear)
    const createExtrudedGearAssembly = (
      teeth: number,
      pitchRadius: number,
      faceWidth: number,
      boreRadius: number,
      mat: THREE.Material
    ) => {
      const gearGroup = new THREE.Group();
      const gearGeo = createInvoluteGearGeometry(
        teeth,
        pitchRadius * 1.06,
        pitchRadius * 0.88,
        boreRadius,
        faceWidth
      );
      const gearMesh = new THREE.Mesh(gearGeo, mat);
      gearGroup.add(gearMesh);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(boreRadius * 1.45, boreRadius * 1.45, faceWidth * 1.28, 28),
        machinedFlangeMat
      );
      hub.rotation.z = Math.PI / 2;
      gearGroup.add(hub);

      return gearGroup;
    };

    const inputPinion = createExtrudedGearAssembly(
      16,
      0.28,
      0.26,
      inShaftRadius * 0.95,
      gearCarburizedMat
    );
    inputPinion.position.set(-0.22, inputShaftY, 0);
    gearsGroup.add(inputPinion);

    const interGear = createExtrudedGearAssembly(
      26,
      0.46,
      0.24,
      0.11,
      gearCarburizedMat
    );
    interGear.position.set(-0.22, -0.14, -0.24);
    gearsGroup.add(interGear);

    const interPinion = createExtrudedGearAssembly(
      14,
      0.24,
      0.30,
      0.11,
      bearingBrassMat
    );
    interPinion.position.set(0.18, -0.14, -0.24);
    gearsGroup.add(interPinion);

    const interShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, scaleX * 0.58, 24),
      alloyShaftMat
    );
    interShaft.rotation.z = Math.PI / 2;
    interShaft.position.set(0, -0.14, -0.24);
    intermediateShaftGroup.add(interShaft);

    const outputBullGear = createExtrudedGearAssembly(
      32,
      0.58,
      0.32,
      outShaftRadius * 0.95,
      gearCarburizedMat
    );
    outputBullGear.position.set(0.22, -0.05, 0.14);
    gearsGroup.add(outputBullGear);

    const outputShaftMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(outShaftRadius, outShaftRadius, scaleX * 0.92, 32),
      alloyShaftMat
    );
    outputShaftMesh.rotation.z = Math.PI / 2;
    outputShaftMesh.position.set(scaleX * 0.38, -0.05, 0.14);
    outputShaftGroup.add(outputShaftMesh);

    const outCouplingFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(outShaftRadius * 1.9, outShaftRadius * 1.9, 0.09, 28),
      machinedFlangeMat
    );
    outCouplingFlange.rotation.z = Math.PI / 2;
    outCouplingFlange.position.set(scaleX * 0.82, -0.05, 0.14);
    outputShaftGroup.add(outCouplingFlange);

    const outputBearing = createRollerBearing(
      outShaftRadius * 1.12,
      0.24,
      scaleX * 0.44,
      -0.05,
      0.14
    );
    bearingsGroup.add(outputBearing);

    // 6. Real Binary .GLB Asset Loading via GLTFLoader
    const exporter = new GLTFExporter();
    const loader = new GLTFLoader();

    const activePreset =
      PRESET_GLB_MODELS.find((p) => p.id === selectedPresetGlbId) ||
      PRESET_GLB_MODELS[0];
    const targetGlbUrl = customGlbUrl || activePreset.path;

    loader.load(
      targetGlbUrl,
      (gltf) => {
        customLoadedGlbGroup.clear();
        const importedScene = gltf.scene;

        // Auto-center and normalize scale to fit Digital Twin stage
        const box = new THREE.Box3().setFromObject(importedScene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const targetScale = 2.45 / maxDim;
        importedScene.scale.setScalar(targetScale);
        importedScene.position.set(
          -center.x * targetScale,
          -center.y * targetScale,
          -center.z * targetScale
        );

        importedScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        customLoadedGlbGroup.add(importedScene);
        setActiveGlbName(customGlbUrl ? activeGlbName : activePreset.filename);
        setGlbSizeKb(customGlbUrl ? glbSizeKb : activePreset.sizeKb);

        // Prepare binary buffer for GLB export
        exporter.parse(
          importedScene,
          (result) => {
            if (result instanceof ArrayBuffer) {
              glbBufferRef.current = result;
            }
          },
          () => {},
          { binary: true }
        );
      },
      undefined,
      (err) => {
        console.warn('Fallback to procedural CAD assembly:', err);
        exporter.parse(
          rootGroup,
          (result) => {
            if (result instanceof ArrayBuffer) {
              glbBufferRef.current = result;
              setGlbSizeKb(Math.max(12, Math.round(result.byteLength / 1024)));
            }
          },
          () => {},
          { binary: true }
        );
      }
    );

    // 7. Physical 3D Sensor Probes & Anchor Markers
    const sensorAnchors: {
      config: (typeof machine.sensors)[number];
      object3D: THREE.Object3D;
      beaconMesh: THREE.Mesh;
    }[] = [];

    machine.sensors.forEach((sCfg) => {
      const probeGroup = new THREE.Group();
      probeGroup.position.set(
        sCfg.location3D[0] * (scaleX / 2.2),
        sCfg.location3D[1] * (scaleY / 1.45),
        sCfg.location3D[2] * (scaleZ / 1.55)
      );

      const stat = diagnostics.sensorStats[sCfg.key];
      const isCrit = stat?.severity === 'CRITICAL';
      const isInv = stat?.severity === 'INVESTIGATE' || stat?.severity === 'WATCH';
      const beaconColor = isCrit ? 0xef5b4c : isInv ? 0x2ce0ec : 0xf6f1e5;

      const beaconMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
      });
      const beaconMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 16),
        beaconMat
      );
      probeGroup.add(beaconMesh);

      const ringGeo = new THREE.RingGeometry(0.078, 0.098, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      probeGroup.add(ringMesh);

      rootGroup.add(probeGroup);
      sensorAnchors.push({ config: sCfg, object3D: probeGroup, beaconMesh });
    });

    // Pointer Orbit & Pan Controls
    let isDragging = false;
    let isRightDrag = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      isRightDrag = e.button === 2 || e.shiftKey;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      if (isRightDrag) {
        stateRef.current.panOffset.x -= dx * 0.0035;
        stateRef.current.panOffset.y += dy * 0.0035;
      } else {
        stateRef.current.targetSpherical.theta -= dx * 0.0075;
        stateRef.current.targetSpherical.phi = Math.max(
          0.15,
          Math.min(Math.PI - 0.2, stateRef.current.targetSpherical.phi - dy * 0.0075)
        );
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current.targetSpherical.radius = Math.max(
        2.2,
        Math.min(7.0, stateRef.current.targetSpherical.radius + e.deltaY * 0.0025)
      );
    };

    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        isRightDrag = false;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - prevX;
        const dy = e.touches[0].clientY - prevY;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
        stateRef.current.targetSpherical.theta -= dx * 0.0075;
        stateRef.current.targetSpherical.phi = Math.max(
          0.15,
          Math.min(Math.PI - 0.2, stateRef.current.targetSpherical.phi - dy * 0.0075)
        );
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const pinchDelta = touchStartDist - currentDist;
        touchStartDist = currentDist;
        stateRef.current.targetSpherical.radius = Math.max(
          2.2,
          Math.min(7.0, stateRef.current.targetSpherical.radius + pinchDelta * 0.01)
        );
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      touchStartDist = 0;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', (e) => e.preventDefault());

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation & 2D Projection Loop
    let frameId = 0;
    let frameCount = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      frameCount++;

      const st = stateRef.current;

      // Smooth camera interpolation
      st.currentSpherical.radius +=
        (st.targetSpherical.radius - st.currentSpherical.radius) * 0.12;
      st.currentSpherical.phi +=
        (st.targetSpherical.phi - st.currentSpherical.phi) * 0.12;
      st.currentSpherical.theta +=
        (st.targetSpherical.theta - st.currentSpherical.theta) * 0.12;

      const r = st.currentSpherical.radius;
      const phi = st.currentSpherical.phi;
      const theta = st.currentSpherical.theta;

      camera.position.set(
        r * Math.sin(phi) * Math.sin(theta) + st.panOffset.x,
        r * Math.cos(phi) + st.panOffset.y,
        r * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(st.panOffset);

      // Rotate shafts & gears proportional to RPM ONLY if animation is explicitly enabled
      if (st.isAnimated && st.isRunning) {
        const baseOmega = (st.rpm / 1500) * 0.045;
        inputShaftMesh.rotation.x += baseOmega;
        inCouplingFlange.rotation.x += baseOmega;
        inputPinion.rotation.x += baseOmega;
        interGear.rotation.x -= baseOmega * (16 / 26);
        interPinion.rotation.x -= baseOmega * (16 / 26);
        outputBullGear.rotation.x += baseOmega * (16 / 26) * (14 / 32);
        outputShaftMesh.rotation.x += baseOmega * (16 / 26) * (14 / 32);
        outCouplingFlange.rotation.x += baseOmega * (16 / 26) * (14 / 32);
      }

      // Layer visibility & Exploded View choreography
      // Display the original GLB 3D asset directly!
      const showGlb = st.useGlbAsset;
      const exp = st.explodeAmount;
      upperCoverGroup.position.y = exp * 0.85;
      frontWallGroup.position.z = exp * 0.75;
      inputShaftGroup.position.x = -exp * 0.65;
      bearingsGroup.position.x = -exp * 0.35;
      outputShaftGroup.position.x = exp * 0.65;
      oilSumpGroup.position.y = -exp * 0.35;

      customLoadedGlbGroup.visible = showGlb;
      lowerHousingGroup.visible = !showGlb && st.visibleLayers.housing;
      upperCoverGroup.visible =
        !showGlb && st.visibleLayers.housing && st.viewMode !== 'section';
      frontWallGroup.visible =
        !showGlb && st.visibleLayers.housing && st.viewMode !== 'section';
      inputShaftGroup.visible = !showGlb && st.visibleLayers.shafts;
      intermediateShaftGroup.visible = !showGlb && st.visibleLayers.shafts;
      outputShaftGroup.visible = !showGlb && st.visibleLayers.shafts;
      bearingsGroup.visible = !showGlb && st.visibleLayers.bearings;
      gearsGroup.visible = !showGlb && st.visibleLayers.gears;
      oilSumpGroup.visible = !showGlb && st.visibleLayers.lubrication;

      // Thermal Mode / Component Highlighting
      if (st.viewMode === 'thermal') {
        bearingBrassMat.emissive.setHex(0xc83e2b);
        bearingBrassMat.emissiveIntensity = 0.75;
        gearCarburizedMat.emissive.setHex(0x00b4c6);
        gearCarburizedMat.emissiveIntensity = 0.48;
      } else {
        const highlightBrg =
          st.highlightedComponentId === 'COMP-BRG-IN' ||
          st.selectedSensorKey === 'temperature' ||
          st.selectedSensorKey === 'vibration';
        bearingBrassMat.emissive.setHex(highlightBrg ? 0x2ce0ec : 0x06384d);
        bearingBrassMat.emissiveIntensity = highlightBrg ? 0.62 : 0.32;

        const highlightGear =
          st.highlightedComponentId === 'COMP-GEAR-MESH' ||
          st.selectedSensorKey === 'load';
        gearCarburizedMat.emissive.setHex(highlightGear ? 0x2ce0ec : 0x042838);
        gearCarburizedMat.emissiveIntensity = highlightGear ? 0.52 : 0.28;
      }

      // Make sensor rings face camera
      sensorAnchors.forEach((sa) => {
        sa.object3D.visible = st.visibleLayers.sensors;
        sa.object3D.lookAt(camera.position);
      });

      renderer.render(scene, camera);

      // Update 2D projected sensor coordinates every 3 frames
      if (frameCount % 3 === 0 && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const nextNodes: ProjectedSensorNode[] = [];

        sensorAnchors.forEach((sa) => {
          const worldPos = new THREE.Vector3();
          sa.object3D.getWorldPosition(worldPos);
          worldPos.project(camera);

          const x = (worldPos.x * 0.5 + 0.5) * width;
          const y = (-(worldPos.y * 0.5) + 0.5) * height;
          const visible =
            st.visibleLayers.sensors &&
            worldPos.z < 1.0 &&
            x >= 24 &&
            x <= width - 24 &&
            y >= 24 &&
            y <= height - 24;

          const stat = diagnostics.sensorStats[sa.config.key];
          if (stat) {
            nextNodes.push({
              id: sa.config.id,
              key: sa.config.key,
              label: sa.config.label,
              shortLabel: sa.config.shortLabel,
              unit: sa.config.unit,
              componentId: sa.config.componentId,
              componentName: sa.config.componentName,
              x,
              y,
              visible,
              stat,
            });
          }
        });

        setProjectedNodes(nextNodes);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      domElem.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElem.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      domElem.removeEventListener('wheel', onWheel);
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, [
    machine.id,
    machine.dimensions.housingLengthMm,
    machine.dimensions.housingWidthMm,
    machine.dimensions.housingHeightMm,
    machine.dimensions.inputShaftDiameterMm,
    machine.dimensions.outputShaftDiameterMm,
    customGlbUrl,
    selectedPresetGlbId,
  ]);

  const activeSensorNode =
    projectedNodes.find((n) => n.key === selectedSensorKey) ||
    projectedNodes.find((n) => n.stat.isAnomalous) ||
    projectedNodes[0];

  const toggleLayer = (layer: string) => {
    setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] md:min-h-[390px] xl:min-h-[420px] cad-grid-bg rounded-[22px] overflow-hidden select-none flex flex-col justify-between">
      {/* Top Technical CAD & GLB/GLTF Asset Viewport Overlay Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0B1522]/85 backdrop-blur-md border-b border-white/20">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-white tracking-wide font-bold">
            <Crosshair className="w-3.5 h-3.5 text-[#00D2FF]" />
            MECHMATE AI 3D TWIN · {machine.code}
          </span>
          <span className="text-white/50 text-xs" aria-hidden="true">
            ·
          </span>

          {/* 3D GLB Model Asset Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-white/70">ORIGINAL 3D ASSET:</span>
            <select
              value={customGlbUrl ? 'custom' : selectedPresetGlbId}
              onChange={(e) => {
                if (e.target.value === 'custom') return;
                setSelectedPresetGlbId(e.target.value);
                if (customGlbUrl) {
                  URL.revokeObjectURL(customGlbUrl);
                  setCustomGlbUrl(null);
                }
              }}
              className="bg-[#0B1A28] border border-white/25 text-xs font-mono font-bold text-[#00D2FF] rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-[#00D2FF] transition-colors"
            >
              {PRESET_GLB_MODELS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0B1A28] text-white">
                  {p.name} ({p.sizeKb} KB GLB)
                </option>
              ))}
              {customGlbUrl && (
                <option value="custom" className="bg-[#0B1A28] text-white">
                  {activeGlbName} ({glbSizeKb} KB Custom)
                </option>
              )}
            </select>
          </div>

          {/* Static / Animated Stance Control ("animated nai joitu if possible" -> Default STATIC) */}
          <button
            type="button"
            onClick={() => setIsAnimated(!isAnimated)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer ${
              isAnimated
                ? 'bg-[#00E599]/25 text-[#00E599] border border-[#00E599]/60 shadow-[0_0_8px_rgba(0,229,153,0.3)]'
                : 'glass-subcard text-white/90 hover:text-white border border-white/20'
            }`}
            title="Toggle machine rotation (Static by default)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAnimated ? 'bg-[#00E599] animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{isAnimated ? 'Animated Motion' : 'Static (Original 3D)'}</span>
          </button>

          {/* GLB/GLTF Upload & Export Controls */}
          <label
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono glass-subcard text-white rounded-lg cursor-pointer hover:border-[#00D2FF] transition-colors"
            title="Load a custom .GLB or .GLTF 3D Machinery Model"
          >
            <Upload className="w-3 h-3 text-[#00D2FF]" />
            <span>Load .GLB</span>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleGlbUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={handleDownloadGlb}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono glass-subcard text-white rounded-lg cursor-pointer hover:border-[#00D2FF] transition-colors"
            title="Download current 3D Machinery Assembly as binary .GLB"
          >
            <Download className="w-3 h-3 text-[#00E599]" />
            <span>Export .GLB</span>
          </button>
          {customGlbUrl && (
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(customGlbUrl);
                setCustomGlbUrl(null);
                setSelectedPresetGlbId('industrial_powertrain');
              }}
              className="text-[11px] font-mono text-[#00D2FF] hover:underline cursor-pointer"
            >
              Reset Default GLB
            </button>
          )}

          {/* Node Inspector Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setShowInspector(!showInspector)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer ${
              showInspector
                ? 'bg-[#00D2FF]/25 text-[#00D2FF] border border-[#00D2FF]/60 shadow-[0_0_12px_rgba(0,210,255,0.3)]'
                : 'glass-subcard text-white/90 hover:text-[#00D2FF]'
            }`}
            title="Toggle 3D Physical Sensor Nodes Inspector"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span>{showInspector ? 'Hide Nodes' : 'Inspect Nodes'}</span>
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 glass-subcard p-1 rounded-xl">
          {(
            [
              { id: 'section', label: 'Section Cut', icon: Eye },
              { id: 'standard', label: 'Assembly', icon: Box },
              { id: 'exploded', label: 'Exploded', icon: Maximize2 },
              { id: 'thermal', label: 'Thermal Zone', icon: Flame },
            ] as const
          ).map((mode) => {
            const Icon = mode.icon;
            const active = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'btn-indigo-primary text-white'
                    : 'text-[#DCE6EA] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Toast when loading custom GLB/GLTF */}
      {glbStatusMsg && (
        <div className="relative z-20 mx-4 mt-2 px-3 py-1.5 glass-panel-elevated rounded-xl text-xs font-mono text-[#00D2FF] self-start shadow-lg">
          {glbStatusMsg}
        </div>
      )}

      {/* Middle Unobstructed 3D WebGL Stage (100% full width, zero side blocks squeezing the canvas!) */}
      <div className="relative flex-1 w-full h-full min-h-[340px] overflow-hidden">
        {/* Full-Width WebGL Canvas Container */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Fallback if WebGL unavailable */}
        {webglError && (
          <div className="relative z-10 m-auto p-6 glass-panel rounded-xl text-center max-w-md mt-16">
            <p className="text-sm font-medium text-white">
              Hardware 3D Viewport Fallback Active
            </p>
            <p className="text-xs text-[#DCE6EA] mt-1">
              Parametric dimensions: {machine.dimensions.housingLengthMm} ×{' '}
              {machine.dimensions.housingWidthMm} × {machine.dimensions.housingHeightMm} mm.
            </p>
          </div>
        )}

        {/* Non-overlapping Floating Active Node Pill when Inspector is closed */}
        {!showInspector && activeSensorNode && (
          <button
            onClick={() => setShowInspector(true)}
            className="absolute bottom-3 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#051319]/85 backdrop-blur-md border border-white/20 text-xs font-mono text-white hover:border-[#00D2FF] transition-all cursor-pointer shadow-xl group"
            title="Click to open physical sensor nodes inspector"
          >
            <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
            <span className="text-white/70">Node:</span>
            <span className="font-bold text-[#00D2FF]">{activeSensorNode.label}</span>
            <span className="text-white font-bold font-mono">
              {activeSensorNode.stat.currentValue} {activeSensorNode.unit}
            </span>
            <span className="text-[10px] text-[#00D2FF] group-hover:underline ml-1">
              Inspect →
            </span>
          </button>
        )}

        {/* Slide-In Overlay Drawer Inspector (Never shrinks the 3D canvas or overlaps the center model!) */}
        {showInspector && (
          <div className="absolute top-2 right-2 bottom-2 w-80 max-w-[calc(100%-1rem)] bg-[#051319]/92 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl z-20 flex flex-col justify-between gap-3 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <div className="text-xs font-mono font-bold text-[#00D2FF] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>PHYSICAL TELEMETRY NODES</span>
              </div>
              <button
                onClick={() => setShowInspector(false)}
                className="w-6 h-6 rounded-full glass-subcard flex items-center justify-center text-white/80 hover:text-white cursor-pointer text-xs"
                title="Close Inspector"
              >
                ✕
              </button>
            </div>

            {/* Active Sensor Node Card */}
            {activeSensorNode && (
              <div className="glass-subcard rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-white/80">
                  <span>PHYSICAL NODE · {activeSensorNode.id}</span>
                  <span className="text-[#00D2FF] font-semibold">
                    [{activeSensorNode.stat.origin}]
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {activeSensorNode.label}
                </div>
                <div className="text-[11px] text-white/75 truncate">
                  Component: {activeSensorNode.componentName}
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/15 grid grid-cols-3 gap-1.5 font-mono">
                  <div>
                    <div className="text-[9px] text-white/70">CURRENT</div>
                    <div className="text-xs font-bold text-white">
                      {activeSensorNode.stat.currentValue}{' '}
                      <span className="text-[9px] text-white/75">
                        {activeSensorNode.unit}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/70">BASELINE</div>
                    <div className="text-xs text-white/90">
                      {activeSensorNode.stat.baselineMean}{' '}
                      <span className="text-[9px]">{activeSensorNode.unit}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/70">DEVIATION</div>
                    <div
                      className={`text-xs font-bold ${
                        activeSensorNode.stat.severity === 'CRITICAL'
                          ? 'text-[#FF5500]'
                          : activeSensorNode.stat.isAnomalous
                          ? 'text-[#00D2FF]'
                          : 'text-[#00E599]'
                      }`}
                    >
                      {activeSensorNode.stat.deviationPercent >= 0 ? '+' : ''}
                      {activeSensorNode.stat.deviationPercent}%
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-white/90">
                  <Sparkles className="inline w-3 h-3 text-[#00E599] mr-1 -mt-0.5" />
                  {activeSensorNode.stat.explanation}
                </p>
              </div>
            )}

            {/* 3D Sensor Node Selector List */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/70 mb-1.5">
                Machine Sensors ({projectedNodes.length})
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {projectedNodes.map((node) => {
                  const isSelected = node.key === selectedSensorKey;
                  const isCrit = node.stat.severity === 'CRITICAL';
                  const isAnom = node.stat.isAnomalous;

                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        onSelectSensor(node.key);
                        onSelectComponent?.(node.componentId);
                      }}
                      className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'indigo-feature-block text-white'
                          : 'glass-subcard text-white/90 hover:border-[#00D2FF]'
                      }`}
                      title={`${node.label} (${node.componentName})`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isCrit
                              ? 'bg-[#FF5500]'
                              : isAnom
                              ? 'bg-[#00D2FF]'
                              : 'bg-[#00E599]'
                          }`}
                        />
                        <span className="font-semibold truncate">{node.shortLabel}</span>
                      </div>
                      <span className="text-white font-bold shrink-0">
                        {node.stat.currentValue}
                        {node.unit}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CAD Controls & Layer Toggles Bar */}
      <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0B1522]/85 backdrop-blur-md border-t border-white/20">
        {/* Camera Orientation Presets */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono text-white/80 mr-1">VIEW:</span>
          {(['isometric', 'front', 'top', 'right', 'section'] as CameraPreset[]).map(
            (preset) => (
              <button
                key={preset}
                onClick={() => applyCameraPreset(preset)}
                className={`px-2.5 py-1 text-[11px] font-mono uppercase rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  cameraPreset === preset
                    ? 'btn-indigo-primary text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {preset}
              </button>
            )
          )}
          <button
            onClick={() => applyCameraPreset('isometric')}
            className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Reset Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Exploded Distance Slider */}
        {!compactMode && (
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span className="text-[11px] font-mono text-white/85">EXPLODE</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explodeAmount}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setExplodeAmount(v);
                if (v > 0.05 && viewMode !== 'exploded') setViewMode('exploded');
              }}
              className="w-20 accent-[#00D2FF] cursor-pointer h-1 bg-white/30 rounded"
            />
          </div>
        )}

        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <Layers className="w-3.5 h-3.5 text-[#00D2FF] mr-1 shrink-0" />
          {Object.entries(visibleLayers).map(([layer, isVis]) => (
            <button
              key={layer}
              onClick={() => toggleLayer(layer)}
              className={`px-2.5 py-0.5 text-[11px] font-mono capitalize rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                isVis
                  ? 'glass-subcard text-white border-white/40'
                  : 'bg-transparent border-transparent text-white/40 line-through'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

