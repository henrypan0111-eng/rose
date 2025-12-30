
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CatmullRomCurve3, Vector3, Matrix4, Quaternion, Euler } from 'three';
import CrystalMaterial from './CrystalMaterial';

// --- LIU LI (OPAQUE GLAZE) MATERIAL CONFIGURATION ---

const LIU_LI_BASE = {
    transmission: 0.0,      // Opaque - No light passing through
    opacity: 1.0,
    thickness: 0.0,         // Irrelevant for opaque
    roughness: 0.12,        // High polish
    clearcoat: 1.0,         
    clearcoatRoughness: 0.05,
    ior: 1.5,               
    metalness: 0.1,         // Slight metallic sheen common in opaque Liu Li
    specularIntensity: 0.2, // Drastically reduced to prevent harsh spotlight glare
    envMapIntensity: 2.5,   // Strong reflections kept as requested
    
    // Iridescence
    iridescence: 0.25,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [200, 400] as [number, number],
};

// 1. FLOWER HEAD: Pale Azure / Light Blue
const FLOWER_MATERIAL = {
    ...LIU_LI_BASE,
    color: "#aaddff",           // Light Blue surface
    emissive: "#004488",        // Deeper blue glow for depth
    emissiveIntensity: 1.2,     // Increased for self-glowing effect
};

// 2. STEM & LEAVES: Cyan-tinted Light Blue (to distinguish slightly but keep unity)
const STEM_MATERIAL = {
    ...LIU_LI_BASE,
    roughness: 0.18,            // Slightly rougher for organic parts
    color: "#99ccdd",           // Soft Cyan/Blue
    emissive: "#003344",        // Deep teal/blue glow
    emissiveIntensity: 0.6,     // Increased for self-glowing effect
};

// 3. SEPALS: High-gloss, gem-like finish (Optimized rendering)
const SEPAL_MATERIAL = {
    ...LIU_LI_BASE,
    roughness: 0.1,             // Smoother than stem for gem-like quality
    color: "#aeeeee",           // Pale Turquoise/Cyan, slightly brighter than stem
    emissive: "#005566",        // Richer inner glow
    emissiveIntensity: 0.9,     // High glow to stand out under the flower
    metalness: 0.15,            // Metallic sheen
    specularIntensity: 0.4,     // Sharper highlights
    iridescence: 0.35,           
    iridescenceIOR: 1.4,
};

// --- GEOMETRY HELPERS ---

const mergeGeometries = (geometries: THREE.BufferGeometry[]) => {
  if (!geometries || geometries.length === 0) return new THREE.BufferGeometry();
  
  let totalVertices = 0;
  let totalIndices = 0;
  
  for (const geo of geometries) {
    totalVertices += geo.attributes.position.count;
    if (geo.index) {
      totalIndices += geo.index.count;
    } else {
      totalIndices += geo.attributes.position.count;
    }
  }

  const positionArr = new Float32Array(totalVertices * 3);
  const normalArr = new Float32Array(totalVertices * 3);
  const uvArr = new Float32Array(totalVertices * 2);
  const indicesArr = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const idx = geo.index;

    if (pos) positionArr.set(pos.array, vertexOffset * 3);
    
    if (norm) normalArr.set(norm.array, vertexOffset * 3);
    else {
        for(let k=0; k<pos.count; k++) {
            normalArr[(vertexOffset+k)*3 + 1] = 1.0; 
        }
    }
    
    if (uv) uvArr.set(uv.array, vertexOffset * 2);

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indicesArr[indexOffset + i] = idx.getX(i) + vertexOffset;
      }
      indexOffset += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        indicesArr[indexOffset + i] = i + vertexOffset;
      }
      indexOffset += pos.count;
    }

    vertexOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positionArr, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normalArr, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
  merged.setIndex(new THREE.BufferAttribute(indicesArr, 1));
  
  return merged;
};

const createPetalGeometry = (index: number) => {
    const geometry = new THREE.BoxGeometry(1, 1, 0.06, 20, 20, 1); 
    const posAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const seed = index * 13.5;
    for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        const u = vertex.x + 0.5;
        let v = vertex.y + 0.5;
        v = Math.max(0, Math.min(1, v));
        let shapeWidth = Math.sin(v * Math.PI * 0.85);
        shapeWidth = Math.pow(Math.max(0, shapeWidth), 0.4);
        shapeWidth *= Math.min(1.0, v * 3.5);
        vertex.x *= shapeWidth * 1.5;
        const undulation = Math.sin(u * 3 + seed) * Math.cos(v * 2 + seed) * 0.04;
        vertex.z += undulation;
        const edgeDist = Math.abs(u - 0.5) * 2;
        const topDist = v;
        const waveFreq = 2.0 + (index % 3); 
        const waveAmp = 0.08 * topDist * Math.pow(Math.max(0, edgeDist), 1.5); 
        const waveZ = Math.sin(u * Math.PI * waveFreq + seed) * waveAmp;
        const waveY = Math.cos(u * Math.PI * waveFreq + seed) * waveAmp * 0.15;
        vertex.z += waveZ;
        vertex.y += waveY; 
        let cupAmount = 0.6;
        if (index > 12) cupAmount = 0.35; 
        const distFromCenter = Math.abs(vertex.x);
        vertex.z += Math.pow(Math.max(0, distFromCenter), 2.2) * cupAmount * 2.0;
        if (index < 6) {
            vertex.z += Math.sin(v * Math.PI * 0.5) * 0.4;
        } else if (index < 12) {
            vertex.z -= Math.pow(Math.max(0, v), 3.0) * 0.25; 
        } else {
            vertex.z -= Math.pow(Math.max(0, v), 2.5) * 0.5; 
            vertex.y -= Math.pow(Math.max(0, Math.abs(u - 0.5)), 3) * 0.5; 
        }
        vertex.y += 0.5; 
        posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
};

const createSolidLeafGeometry = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1, 16, 32, 1);
    const posAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const length = 1.4;
    const targetMaxWidth = 0.8;
    const midribThickness = 0.05;
    const edgeThickness = 0.002;

    for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        let v = vertex.y + 0.5;
        v = Math.max(0, Math.min(1, v));
        let shapeWidth = Math.sin(Math.pow(v, 0.75) * Math.PI); 
        if(v > 0.7) shapeWidth *= (1.0 - (v - 0.7) / 0.3);
        const serrationCount = 16;
        const phase = v * serrationCount;
        const toothLocal = phase % 1; 
        const serrationShape = Math.pow(toothLocal, 0.8); 
        const serrationAmp = 0.04 * Math.sin(v * Math.PI); 
        let halfWidth = (shapeWidth * targetMaxWidth * 0.5) + serrationShape * serrationAmp;
        vertex.x *= halfWidth * 2.0; 
        const distRatio = halfWidth > 0.001 ? Math.abs(vertex.x) / halfWidth : 0;
        const tProfile = 1.0 - Math.pow(distRatio, 2.5); 
        const currentThickness = edgeThickness + (midribThickness - edgeThickness) * tProfile;
        vertex.z *= currentThickness;
        const absX = Math.abs(vertex.x);
        vertex.z += absX * 0.6;
        if(distRatio < 0.15) {
             const t = distRatio / 0.15;
             const dip = (Math.cos(t * Math.PI) + 1) * 0.5;
             vertex.z -= dip * 0.015;
        }
        vertex.z -= Math.sin(v * Math.PI * 0.85) * 0.25;
        const veinFreq = 12;
        const veinPhase = v * veinFreq - distRatio * 3.5;
        const puff = Math.sin(veinPhase * Math.PI * 2);
        const puffMask = Math.sin(distRatio * Math.PI); 
        vertex.z += puff * puffMask * 0.01;
        if (v > 0.8) {
            const tipT = (v - 0.8) / 0.2;
            vertex.z -= Math.pow(tipT, 3) * 0.15;
        }
        vertex.y = v * length;
        posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
}

const createSepalGeometry = () => {
    const shape = new THREE.Shape();
    // Widened as requested: 0.22 -> 0.35 -> 0.5
    const width = 0.5; 
    // Shortened further from 1.35 to 1.1
    const length = 1.1; 
    
    // Base width slightly increased for stability visual
    const baseWidth = 0.08;
    shape.moveTo(-baseWidth, 0);
    shape.lineTo(baseWidth, 0);
    
    // Elegant leaf-like shape
    shape.bezierCurveTo(width * 1.0, length * 0.2, width * 0.5, length * 0.7, 0, length);
    shape.bezierCurveTo(-width * 0.5, length * 0.7, -width * 1.0, length * 0.2, -baseWidth, 0);

    const extrudeSettings = {
        depth: 0.02, 
        bevelEnabled: true, 
        bevelThickness: 0.01, 
        bevelSize: 0.01, 
        bevelSegments: 3, 
        steps: 8 
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for(let i=0; i<pos.count; i++){
        vertex.fromBufferAttribute(pos, i);
        const t = vertex.y / length;
        
        // Gentle curve that starts fairly straight/outward and curls slightly
        // We rely on the object's tilt for the main direction.
        
        // Slight S-curve for organic feel
        // Dip down slightly at base, curve up at tip
        const curve = Math.sin(t * Math.PI * 0.8) * 0.15;
        
        vertex.z += curve;
        
        // Cupping
        vertex.z += Math.pow(Math.abs(vertex.x / width), 2.2) * 0.12;

        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
}

const createThornGeometry = () => {
    const height = 0.35; 
    const baseRadius = 0.08;
    const geo = new THREE.CylinderGeometry(0.001, baseRadius, height, 12, 12);
    geo.translate(0, height/2, 0);
    const posAttribute = geo.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        const h = vertex.y / height;
        const bend = Math.pow(h, 2) * 0.12;
        vertex.z -= bend; 
        vertex.x *= 0.8;
        posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
}

const createFullLeafGeometry = () => {
    const geos: THREE.BufferGeometry[] = [];
    
    // 1. Node
    const nodeGeo = new THREE.SphereGeometry(0.06, 16, 16);
    geos.push(nodeGeo);

    // 2. Petiole
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.1, 0.02),
      new THREE.Vector3(0, 0.35, 0.08)
    ]);
    const petioleGeo = new THREE.TubeGeometry(curve, 8, 0.035, 8, false);
    geos.push(petioleGeo);

    // 3. Stipules
    const shape = new THREE.Shape();
    shape.moveTo(0,0);
    shape.quadraticCurveTo(0.05, 0.05, 0.02, 0.2); 
    shape.quadraticCurveTo(0.0, 0.15, 0, 0); 
    const stipuleGeoBase = new THREE.ExtrudeGeometry(shape, {
         depth: 0.005, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, steps: 1
    });
    stipuleGeoBase.center();

    const s1 = stipuleGeoBase.clone();
    const m1 = new THREE.Matrix4();
    m1.compose(new THREE.Vector3(-0.04, 0.08, 0.01), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0.5)), new THREE.Vector3(1,1,1));
    s1.applyMatrix4(m1);
    geos.push(s1);

    const s2 = stipuleGeoBase.clone();
    const m2 = new THREE.Matrix4();
    m2.compose(new THREE.Vector3(0.04, 0.08, 0.01), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 3.14, -0.5)), new THREE.Vector3(1,1,1));
    s2.applyMatrix4(m2);
    geos.push(s2);

    // 4. Leaf Blade
    const bladeGeo = createSolidLeafGeometry();
    const mBlade = new THREE.Matrix4();
    mBlade.compose(new THREE.Vector3(0, 0.35, 0.08), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0, 0)), new THREE.Vector3(1,1,1));
    bladeGeo.applyMatrix4(mBlade);
    geos.push(bladeGeo);

    return mergeGeometries(geos);
};

const generateCrystalTexture = () => {
    if (typeof document === 'undefined') return null;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Smooth gradient background for polished look
    const grad = ctx.createLinearGradient(0,0,size,size);
    grad.addColorStop(0, '#505050');
    grad.addColorStop(1, '#303030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle noise for surface realism
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = `rgba(255, 255, 255, 0.02)`;
        ctx.fillRect(x,y,2,2);
    }
    
    // Flow lines (simulating poured glass)
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const len = Math.random() * 200 + 50;
        ctx.strokeStyle = `rgba(255, 255, 255, 0.03)`;
        ctx.lineWidth = Math.random() * 30 + 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 50, y + 100, x - 50, y + 150, x + 20, y + 200);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
    return tex;
};

// --- COMPONENTS ---

const FlowerHead = () => {
  const crystalTexture = useMemo(() => generateCrystalTexture(), []);

  const meshGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    const goldenAngle = 137.5 * (Math.PI / 180);
    const totalPetals = 22; 

    for (let i = 0; i < totalPetals; i++) {
        const theta = i * goldenAngle;
        let config;
        if (i < 5) config = { radius: 0.05, y: 0.6 + i * 0.03, scale: 0.35, rotX: 0.1 };
        else if (i < 10) { const t = (i - 5) / 5; config = { radius: 0.15 + t * 0.08, y: 0.65 - t * 0.1, scale: 0.5 + t * 0.15, rotX: 0.05 }; }
        else if (i < 16) { const t = (i - 10) / 6; config = { radius: 0.25 + t * 0.15, y: 0.55 - t * 0.08, scale: 0.7 + t * 0.15, rotX: 0.1 }; }
        else { const t = (i - 16) / 6; config = { radius: 0.45 + t * 0.05, y: 0.45 - t * 0.05, scale: 0.95, rotX: 0.2 }; }

        const { radius, y, scale, rotX } = config;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const rotY = -theta - Math.PI / 2;

        const geo = createPetalGeometry(i);
        const matrix = new Matrix4();
        matrix.compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rotX, rotY, 0)), new Vector3(scale, scale, scale));
        geo.applyMatrix4(matrix);
        geometries.push(geo);
    }

    const centerGeo = new THREE.SphereGeometry(1, 16, 16);
    const centerMatrix = new Matrix4();
    centerMatrix.compose(new Vector3(0, 0.4, 0), new Quaternion(), new Vector3(0.12, 0.24, 0.12));
    centerGeo.applyMatrix4(centerMatrix);
    geometries.push(centerGeo);

    const merged = mergeGeometries(geometries);
    merged.computeBoundingSphere(); 
    return merged;
  }, []);

  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
        const t = state.clock.elapsedTime;
        // Pulse glow with higher base for visibility
        materialRef.current.emissiveIntensity = 1.2 + Math.sin(t * 1.5) * 0.2;
    }
  });

  return (
    <group position={[0, 1.0, 0]}>
      <mesh geometry={meshGeometry} castShadow receiveShadow>
         <CrystalMaterial 
            ref={materialRef}
            bumpMap={crystalTexture}
            bumpScale={0.005} // Very subtle bump
            {...FLOWER_MATERIAL} 
        />
      </mesh>
    </group>
  );
};

const Sepals = () => {
    // Generate texture locally for sepals to have surface detail
    const crystalTexture = useMemo(() => generateCrystalTexture(), []);

    const meshGeometry = useMemo(() => {
        const geometries: THREE.BufferGeometry[] = [];
        const baseGeo = createSepalGeometry();
        // Create 6 sepals (changed from 5)
        const count = 6;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const geo = baseGeo.clone();
            const mat = new Matrix4();
            
            // Moved up as requested by user (1.05 -> 1.35) to be closer to the flower head base
            const attachY = 1.35; 
            const attachRadius = 0.07; // Slightly larger radius for upper stem thickness

            const x = Math.sin(angle) * attachRadius;
            const z = Math.cos(angle) * attachRadius;
            
            // Orientation:
            // High tilt to spread them out widely like the red line curve
            const tilt = 1.05; // Approx 60 degrees

            const q = new Quaternion();
            const qRot = new Quaternion().setFromAxisAngle(new Vector3(0,1,0), angle);
            const qTilt = new Quaternion().setFromAxisAngle(new Vector3(1,0,0), tilt);
            q.multiply(qRot).multiply(qTilt);

            mat.compose(
                new Vector3(x, attachY, z), 
                q, 
                new Vector3(1, 1, 1)
            );
            geo.applyMatrix4(mat);
            geometries.push(geo);
        }
        return mergeGeometries(geometries);
    }, []);

    return (
        <mesh geometry={meshGeometry} castShadow receiveShadow>
             <CrystalMaterial 
                bumpMap={crystalTexture}
                bumpScale={0.008} // Subtle surface texture
                {...SEPAL_MATERIAL}
             />
        </mesh>
    );
};

const Stem = () => {
  const meshGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];

    // 1. Main Stem Curve
    const curve = new CatmullRomCurve3([
      new Vector3(0, 1.6, 0),         
      new Vector3(0, 1.0, 0),         
      new Vector3(0.15, 0.2, 0.05),   
      new Vector3(-0.05, -1.5, -0.05),
      new Vector3(0.02, -3.5, 0.02)   
    ]);
    const stemShape = new THREE.Shape();
    const radius = 0.05;
    for(let i=0; i <= 24; i++) {
        const theta = (i / 24) * Math.PI * 2;
        const r = radius + Math.sin(theta * 10) * 0.003; 
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (i===0) stemShape.moveTo(x,y); else stemShape.lineTo(x,y);
    }
    const stemGeo = new THREE.ExtrudeGeometry(stemShape, { extrudePath: curve, steps: 64, bevelEnabled: false });
    geometries.push(stemGeo);

    // 2. Receptacle - Larger to anchor the flower
    const receptacleGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const recMat = new Matrix4();
    recMat.compose(new Vector3(0, 1.5, 0), new Quaternion(), new Vector3(1, 1.1, 1));
    receptacleGeo.applyMatrix4(recMat);
    geometries.push(receptacleGeo);

    // Note: Sepals are now a separate component <Sepals />

    // 3. Thorns
    const thornBaseGeo = createThornGeometry();
    const thornCount = 20; 
    const stemRadius = 0.05;

    for (let i = 0; i < thornCount; i++) {
        const tBase = 0.15 + (i / thornCount) * 0.83; 
        const tJitter = (Math.random() - 0.5) * 0.04;
        const t = Math.max(0.12, Math.min(0.99, tBase + tJitter));
        
        const point = curve.getPoint(t);
        let tangent = curve.getTangent(t).normalize();
        if (tangent.lengthSq() < 0.1) tangent = new Vector3(0, -1, 0);

        const angle = i * 2.5 + Math.random() * 0.5; 
        let up = new Vector3(0, 1, 0);
        if (Math.abs(tangent.y) > 0.9) up = new Vector3(0, 0, 1);
        const binormal = new Vector3().crossVectors(tangent, up).normalize();
        const normal = binormal.clone().applyAxisAngle(tangent, angle).normalize();

        const thornPos = point.clone().add(normal.clone().multiplyScalar(stemRadius - 0.005));
        
        const yAxis = normal.clone(); 
        const zAxisApprox = tangent.clone().negate(); 
        const xAxis = new Vector3().crossVectors(yAxis, zAxisApprox).normalize();
        const zAxis = new Vector3().crossVectors(xAxis, yAxis).normalize(); 
        
        const rotMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const quat = new Quaternion().setFromRotationMatrix(rotMatrix);
        
        const wobble = new Quaternion().setFromEuler(new Euler(
            (Math.random() - 0.5) * 0.4, 
            (Math.random() - 0.5) * 0.4, 
            (Math.random() - 0.5) * 0.4
        ));
        quat.multiply(wobble);

        const scale = 0.25 + Math.random() * 0.3;
        
        const mat = new Matrix4();
        mat.compose(thornPos, quat, new Vector3(scale, scale, scale));
        
        const thornInst = thornBaseGeo.clone();
        thornInst.applyMatrix4(mat);
        geometries.push(thornInst);
    }

    // 4. Leaves
    const leafBaseGeo = createFullLeafGeometry();
    const leavesData = [
       { pos: [0.06, 0.85, 0.02], rot: [0, 0, -0.8], scale: 0.7 },
       { pos: [0.08, 0.0, 0.08], rot: [0.4, 1.8, 0.4], scale: 0.85 },
       { pos: [0.08, -0.7, -0.02], rot: [-0.3, -1.5, -0.4], scale: 0.95 },
       { pos: [-0.05, -1.6, -0.04], rot: [0.1, 2.8, 0.6], scale: 1.05 }
    ];
    leavesData.forEach(d => {
        const inst = leafBaseGeo.clone();
        const mat = new Matrix4();
        mat.compose(new Vector3(...d.pos as [number,number,number]), new Quaternion().setFromEuler(new Euler(...d.rot as [number,number,number])), new Vector3(d.scale, d.scale, d.scale));
        inst.applyMatrix4(mat);
        geometries.push(inst);
    });

    return mergeGeometries(geometries);
  }, []);
  
  return (
    <mesh geometry={meshGeometry} castShadow receiveShadow>
        <CrystalMaterial 
            {...STEM_MATERIAL} 
        />
    </mesh>
  );
};

const Rose: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
        const t = state.clock.elapsedTime;
        const baseTilt = 10 * (Math.PI / 180);
        groupRef.current.rotation.z = baseTilt + Math.sin(t * 0.6) * 0.03; 
        groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.02;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, 10 * (Math.PI / 180)]}>
      <FlowerHead />
      <Sepals />
      <Stem />
    </group>
  );
};

export default Rose;
