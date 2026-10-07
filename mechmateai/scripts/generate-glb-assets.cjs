const fs = require('fs');
const path = require('path');

// Polyfill FileReader for Three.js GLTFExporter in Node.js
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
        if (this.onload) this.onload({ target: this });
      }).catch((err) => {
        if (this.onerror) this.onerror(err);
      });
    }
  };
}

const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

const modelsDir = path.join(__dirname, '..', 'public', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

function exportSceneToGlb(scene, filename) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const filePath = path.join(modelsDir, filename);
          fs.writeFileSync(filePath, Buffer.from(result));
          console.log(`Successfully generated GLB: ${filePath} (${(result.byteLength / 1024).toFixed(1)} KB)`);
          resolve(filePath);
        } else {
          reject(new Error('Expected ArrayBuffer for binary GLB export'));
        }
      },
      (error) => {
        reject(error);
      },
      { binary: true }
    );
  });
}

// 1. Build Industrial Powertrain Gearbox GLB
async function createPowertrainGlb() {
  const scene = new THREE.Scene();
  scene.name = 'IndustrialPowertrain';

  const castIronMat = new THREE.MeshStandardMaterial({
    name: 'CastIron_Casing',
    color: 0x1d2c38,
    metalness: 0.75,
    roughness: 0.35,
  });

  const machinedSteelMat = new THREE.MeshStandardMaterial({
    name: 'Machined_Steel',
    color: 0xf5f3ee,
    metalness: 0.90,
    roughness: 0.18,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    name: 'Bearing_Bronze',
    color: 0xd4a040,
    metalness: 0.85,
    roughness: 0.25,
  });

  const cyanAccentMat = new THREE.MeshStandardMaterial({
    name: 'Sensor_CyanAccent',
    color: 0x00d2ff,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Base Housing
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.4), castIronMat);
  base.position.y = -0.65;
  scene.add(base);

  // Main Gearbox Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.2), castIronMat);
  body.position.y = 0;
  scene.add(body);

  // Top Cover Flange
  const topCover = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.3), machinedSteelMat);
  topCover.position.y = 0.61;
  scene.add(topCover);

  // Cooling Fins
  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 1.28), castIronMat);
    fin.position.set(i * 0.22, 0, 0);
    scene.add(fin);
  }

  // Input Shaft (Drive side)
  const inShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 32), machinedSteelMat);
  inShaft.rotation.z = Math.PI / 2;
  inShaft.position.set(-1.1, 0.2, 0);
  scene.add(inShaft);

  // Drive Flange
  const driveFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32), machinedSteelMat);
  driveFlange.rotation.z = Math.PI / 2;
  driveFlange.position.set(-1.65, 0.2, 0);
  scene.add(driveFlange);

  // Output Shaft (Driven side)
  const outShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 32), machinedSteelMat);
  outShaft.rotation.z = Math.PI / 2;
  outShaft.position.set(1.1, -0.15, 0);
  scene.add(outShaft);

  // Output Coupler
  const outFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 32), machinedSteelMat);
  outFlange.rotation.z = Math.PI / 2;
  outFlange.position.set(1.75, -0.15, 0);
  scene.add(outFlange);

  // Internal Helical Bull Gear
  const bullGear = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.24, 48), brassMat);
  bullGear.rotation.z = Math.PI / 2;
  bullGear.position.set(0.15, -0.15, 0);
  scene.add(bullGear);

  // Pinion Gear
  const pinionGear = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.24, 32), machinedSteelMat);
  pinionGear.rotation.z = Math.PI / 2;
  pinionGear.position.set(0.15, 0.2, 0);
  scene.add(pinionGear);

  // Bearing Cartridges
  const bearingIn = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 16, 32), brassMat);
  bearingIn.rotation.y = Math.PI / 2;
  bearingIn.position.set(-0.85, 0.2, 0);
  scene.add(bearingIn);

  const bearingOut = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.07, 16, 32), brassMat);
  bearingOut.rotation.y = Math.PI / 2;
  bearingOut.position.set(0.85, -0.15, 0);
  scene.add(bearingOut);

  // Sensor Ports
  const vibSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16), cyanAccentMat);
  vibSensor.position.set(-0.55, 0.65, 0.35);
  scene.add(vibSensor);

  const tempSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 16), cyanAccentMat);
  tempSensor.position.set(0.55, 0.65, -0.35);
  scene.add(tempSensor);

  // Oil Sight Glass
  const sightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24), machinedSteelMat);
  sightGlass.rotation.x = Math.PI / 2;
  sightGlass.position.set(0, -0.35, 0.61);
  scene.add(sightGlass);

  await exportSceneToGlb(scene, 'industrial_powertrain.glb');
}

// 2. Build High-Speed Induction Motor GLB
async function createInductionMotorGlb() {
  const scene = new THREE.Scene();
  scene.name = 'InductionMotor';

  const statorMat = new THREE.MeshStandardMaterial({
    name: 'Motor_StatorTeal',
    color: 0x153c48,
    metalness: 0.8,
    roughness: 0.3,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    name: 'Motor_ShaftSteel',
    color: 0xe8e6e2,
    metalness: 0.92,
    roughness: 0.15,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    name: 'Winding_Copper',
    color: 0xd9753b,
    metalness: 0.88,
    roughness: 0.22,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    name: 'Electric_Cyan',
    color: 0x00d2ff,
    metalness: 0.5,
    roughness: 0.2,
  });

  // Stator Housing (Cylinder with horizontal axis)
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.8, 36), statorMat);
  stator.rotation.z = Math.PI / 2;
  scene.add(stator);

  // Longitudinal Stator Cooling Ribs
  for (let a = 0; a < 16; a++) {
    const angle = (a / 16) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 0.14), statorMat);
    rib.position.set(0, Math.cos(angle) * 0.78, Math.sin(angle) * 0.78);
    rib.rotation.x = -angle;
    scene.add(rib);
  }

  // Motor Base Mounting Feet
  const foot1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.45), statorMat);
  foot1.position.set(0, -0.78, 0.72);
  scene.add(foot1);

  const foot2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.45), statorMat);
  foot2.position.set(0, -0.78, -0.72);
  scene.add(foot2);

  // Motor Rotor Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.1, 32), steelMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(0.2, 0, 0);
  scene.add(shaft);

  // Drive End Shield Flange
  const endShieldDE = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.2, 36), steelMat);
  endShieldDE.rotation.z = Math.PI / 2;
  endShieldDE.position.set(0.95, 0, 0);
  scene.add(endShieldDE);

  // Non-Drive End Shield & Fan Cowling Cover
  const fanCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.76, 0.5, 36), statorMat);
  fanCowl.rotation.z = Math.PI / 2;
  fanCowl.position.set(-1.15, 0, 0);
  scene.add(fanCowl);

  // Terminal Conduit Box on Top
  const terminalBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), steelMat);
  terminalBox.position.set(0.1, 0.95, 0);
  scene.add(terminalBox);

  // Terminal Cable Glands
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), accentMat);
  gland.rotation.z = Math.PI / 2;
  gland.position.set(0.42, 0.95, 0);
  scene.add(gland);

  // Internal Winding Glimpse
  const winding = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.12, 16, 32), copperMat);
  winding.rotation.y = Math.PI / 2;
  winding.position.set(0.72, 0, 0);
  scene.add(winding);

  await exportSceneToGlb(scene, 'industrial_motor.glb');
}

// 3. Build Centrifugal Slurry Pump GLB
async function createCentrifugalPumpGlb() {
  const scene = new THREE.Scene();
  scene.name = 'CentrifugalPump';

  const castIronMat = new THREE.MeshStandardMaterial({
    name: 'Pump_VoluteCasing',
    color: 0x1f3442,
    metalness: 0.82,
    roughness: 0.32,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    name: 'Pump_Flanges',
    color: 0xf0ede6,
    metalness: 0.92,
    roughness: 0.18,
  });

  const bronzeMat = new THREE.MeshStandardMaterial({
    name: 'Impeller_Bronze',
    color: 0xd89c42,
    metalness: 0.85,
    roughness: 0.25,
  });

  const cyanMat = new THREE.MeshStandardMaterial({
    name: 'Sensor_Cyan',
    color: 0x00d2ff,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Volute Spiral Casing (Torus + Offset Center)
  const volute = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.36, 24, 48), castIronMat);
  volute.rotation.y = Math.PI / 2;
  scene.add(volute);

  // Central Impeller Eye Hub
  const impeller = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.28, 36), bronzeMat);
  impeller.rotation.z = Math.PI / 2;
  scene.add(impeller);

  // Suction Intake Nozzle (Front axial flange)
  const suctionPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.65, 32), castIronMat);
  suctionPipe.rotation.z = Math.PI / 2;
  suctionPipe.position.set(0.65, 0, 0);
  scene.add(suctionPipe);

  // Suction Flange Ring
  const suctionFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 32), steelMat);
  suctionFlange.rotation.z = Math.PI / 2;
  suctionFlange.position.set(1.0, 0, 0);
  scene.add(suctionFlange);

  // Discharge Outlet Nozzle (Top radial flange)
  const dischargePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 32), castIronMat);
  dischargePipe.position.set(0, 0.95, 0.62);
  scene.add(dischargePipe);

  // Discharge Flange Ring
  const dischargeFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 32), steelMat);
  dischargeFlange.position.set(0, 1.35, 0.62);
  scene.add(dischargeFlange);

  // Bearing Frame Bracket (Back side towards motor coupling)
  const bearingFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.46, 1.1, 32), castIronMat);
  bearingFrame.rotation.z = Math.PI / 2;
  bearingFrame.position.set(-0.75, 0, 0);
  scene.add(bearingFrame);

  // Pump Drive Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.8, 32), steelMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(-0.95, 0, 0);
  scene.add(shaft);

  // Pump Base Pedestal
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 1.2), castIronMat);
  pedestal.position.set(-0.15, -0.95, 0);
  scene.add(pedestal);

  // Pressure Sensor Probe on Discharge
  const pressProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 16), cyanMat);
  pressProbe.rotation.z = Math.PI / 2;
  pressProbe.position.set(0.32, 1.05, 0.62);
  scene.add(pressProbe);

  await exportSceneToGlb(scene, 'centrifugal_pump.glb');
}

async function main() {
  console.log('Generating 3D Binary GLB Assets for MechMate AI...');
  try {
    await createPowertrainGlb();
    await createInductionMotorGlb();
    await createCentrifugalPumpGlb();
    console.log('All GLB assets successfully generated in public/models/');
  } catch (err) {
    console.error('Error generating GLB assets:', err);
    process.exit(1);
  }
}

main();
