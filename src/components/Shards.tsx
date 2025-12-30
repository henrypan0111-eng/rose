import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CrystalMaterial from './CrystalMaterial';

const SHARD_MATERIAL = {
    color: "#aaddff",
    thickness: 0.0,
    roughness: 0.1, 
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    transmission: 0.0,
    ior: 1.5,
    emissive: "#003366", 
    emissiveIntensity: 0.8,
    metalness: 0.1, 
    envMapIntensity: 2.5,
    specularIntensity: 0.2,
    iridescence: 0.3,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [200, 500] as [number, number]
};

interface ShardProps {
  position: [number, number, number];
  scale: number;
  rotationSpeed: number;
  floatSpeed: number;
  floatOffset: number;
}

const Shard: React.FC<ShardProps> = ({ position, scale, rotationSpeed, floatSpeed, floatOffset }) => {
  const ref = useRef<THREE.Mesh>(null);
  const initialPos = useRef(new THREE.Vector3(...position));
  
  useFrame((state, delta) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.x += delta * rotationSpeed;
      ref.current.rotation.y += delta * rotationSpeed * 0.5;
      ref.current.rotation.z += delta * rotationSpeed * 0.2;
      
      ref.current.position.y = initialPos.current.y + Math.sin(t * floatSpeed + floatOffset) * 0.2;
      const s = scale + Math.sin(t * 2 + floatOffset) * (scale * 0.1);
      ref.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={ref} position={initialPos.current}>
      <tetrahedronGeometry args={[1, 0]} />
      <CrystalMaterial 
        {...SHARD_MATERIAL}
        resolution={256} 
        samples={3}      
      />
    </mesh>
  );
};

interface ButterflyProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  wingGeo: THREE.BufferGeometry;
  bodyGeo: THREE.BufferGeometry;
  antennaGeo: THREE.BufferGeometry;
}

const Butterfly: React.FC<ButterflyProps> = ({ position, rotation = [0,0,0], scale = 1, wingGeo, bodyGeo, antennaGeo }) => {
    const groupRef = useRef<THREE.Group>(null);
    const leftWingRef = useRef<THREE.Group>(null);
    const rightWingRef = useRef<THREE.Group>(null);

    const seed = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        const time = state.clock.elapsedTime + seed;
        if(groupRef.current) {
            groupRef.current.position.y += Math.sin(time * 2.5) * 0.0015;
            groupRef.current.rotation.z = rotation[2] + Math.sin(time * 0.8) * 0.08;
            groupRef.current.rotation.x = rotation[0] + Math.cos(time * 0.5) * 0.05;
        }

        if (leftWingRef.current && rightWingRef.current) {
            const t = Math.sin(time * 15); 
            const flapAngle = THREE.MathUtils.mapLinear(t, -1, 1, -0.5, 1.0);
            leftWingRef.current.rotation.z = flapAngle;
            rightWingRef.current.rotation.z = -flapAngle;
        }
    })

    return (
        <group ref={groupRef} position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)} scale={scale}>
             <group rotation={[Math.PI/2, 0, 0]}> 
                 <mesh geometry={bodyGeo}>
                    <CrystalMaterial 
                        {...SHARD_MATERIAL}
                    />
                 </mesh>

                 <mesh geometry={antennaGeo} position={[0, 0.23, 0]}>
                    <CrystalMaterial {...SHARD_MATERIAL} />
                 </mesh>
             </group>

             <group ref={rightWingRef} position={[0.02, 0, 0.05]}>
                <mesh geometry={wingGeo}>
                   <CrystalMaterial 
                      {...SHARD_MATERIAL}
                      opacity={0.8}
                      transparent={true} 
                   />
                </mesh>
             </group>

             <group ref={leftWingRef} position={[-0.02, 0, 0.05]}>
                <mesh geometry={wingGeo} rotation={[0, 0, Math.PI]} >
                   <CrystalMaterial 
                      {...SHARD_MATERIAL}
                      opacity={0.8}
                      transparent={true}
                   />
                </mesh>
             </group>
        </group>
    )
}

const Shards: React.FC = () => {
  const shardsData = useMemo(() => {
    const data = [];
    const count = 20; 
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1); 
        const r = 3 + Math.random() * 4; 
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        data.push({ 
            pos: [x, y, z] as [number, number, number], 
            scale: 0.08 + Math.random() * 0.15,
            speed: 0.3 + Math.random() * 0.7,
            floatSpeed: 0.5 + Math.random() * 0.5,
            floatOffset: Math.random() * Math.PI * 2
        });
    }
    return data;
  }, []);

  const bodyGeometry = useMemo(() => {
     const points = [
        new THREE.Vector2(0.0, 0.24),  
        new THREE.Vector2(0.035, 0.21), 
        new THREE.Vector2(0.02, 0.18),  
        new THREE.Vector2(0.045, 0.12), 
        new THREE.Vector2(0.04, 0.05),  
        new THREE.Vector2(0.025, 0.0),  
        new THREE.Vector2(0.035, -0.05), 
        new THREE.Vector2(0.015, -0.25), 
        new THREE.Vector2(0.0, -0.30)   
     ];
     const geo = new THREE.LatheGeometry(points, 16);
     geo.computeVertexNormals();
     return geo;
  }, []);

  const antennaGeometry = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.01, 0, 0),
          new THREE.Vector3(0.05, 0.15, 0.05),
          new THREE.Vector3(0.08, 0.28, 0.02),
          new THREE.Vector3(0.10, 0.32, -0.02)
      ]);
      const tube = new THREE.TubeGeometry(curve, 12, 0.004, 4, false);
      const geo1 = tube;
      const geo2 = tube.clone();
      geo2.scale(-1, 1, 1); 
      
      const merged = new THREE.BufferGeometry();
      const pos1 = geo1.attributes.position.array;
      const pos2 = geo2.attributes.position.array;
      const newPos = new Float32Array(pos1.length + pos2.length);
      newPos.set(pos1);
      newPos.set(pos2, pos1.length);
      merged.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
      
      const norm1 = geo1.attributes.normal.array;
      const norm2 = geo2.attributes.normal.array;
      const newNorm = new Float32Array(norm1.length + norm2.length);
      newNorm.set(norm1);
      newNorm.set(norm2, norm1.length);
      merged.setAttribute('normal', new THREE.BufferAttribute(newNorm, 3));

      return merged;
  }, []);

  const wingGeometry = useMemo(() => {
     const shape = new THREE.Shape();
     shape.moveTo(0, 0);
     shape.bezierCurveTo(0.1, 0.4, 0.5, 1.1, 1.4, 1.1); 
     shape.bezierCurveTo(1.6, 1.1, 1.7, 0.9, 1.6, 0.6); 
     shape.bezierCurveTo(1.5, 0.4, 1.4, 0.3, 1.2, 0.1); 
     shape.lineTo(1.15, 0.0);
     shape.bezierCurveTo(1.2, -0.2, 1.3, -0.6, 1.0, -0.9);
     shape.lineTo(1.05, -1.35); 
     shape.lineTo(0.85, -1.25); 
     shape.bezierCurveTo(0.6, -1.1, 0.3, -0.8, 0.1, -0.4);
     shape.quadraticCurveTo(0.05, -0.2, 0, 0);

     const extrudeSettings = {
         steps: 2,
         depth: 0.015,
         bevelEnabled: true,
         bevelThickness: 0.01,
         bevelSize: 0.01,
         bevelSegments: 3
     };

     const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
     geo.rotateX(-Math.PI / 2);
     geo.translate(0, -0.015, 0);
     return geo;
  }, []);

  return (
    <group>
      {shardsData.map((s, i) => (
        <Shard 
            key={i} 
            position={s.pos} 
            scale={s.scale} 
            rotationSpeed={s.speed} 
            floatSpeed={s.floatSpeed}
            floatOffset={s.floatOffset}
        />
      ))}
      <Butterfly 
        position={[2, 0.5, 1]} 
        rotation={[0.2, -0.5, 0.1]} 
        scale={0.23} 
        wingGeo={wingGeometry}
        bodyGeo={bodyGeometry}
        antennaGeo={antennaGeometry}
      />
      <Butterfly 
        position={[-1.8, -1, 0.5]} 
        rotation={[0.1, 0.8, -0.2]} 
        scale={0.18} 
        wingGeo={wingGeometry}
        bodyGeo={bodyGeometry}
        antennaGeo={antennaGeometry}
      />
      <Butterfly 
        position={[0.5, 2.2, -1]} 
        rotation={[-0.3, 0.2, 0.4]} 
        scale={0.15} 
        wingGeo={wingGeometry}
        bodyGeo={bodyGeometry}
        antennaGeo={antennaGeometry}
      />
    </group>
  );
};

export default Shards;