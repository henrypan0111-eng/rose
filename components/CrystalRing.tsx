
import React from 'react';
import CrystalMaterial from './CrystalMaterial';

const CrystalRing: React.FC = () => {
  const LIU_LI_RING = {
      color: "#aaddff", // Pale Blue
      thickness: 1.2,
      roughness: 0.1,
      clearcoat: 1.0,
      ior: 1.5,
      transmission: 0.0,
      emissive: "#004488",
      emissiveIntensity: 0.8, // Increased for self-glowing effect
      metalness: 0.1,
      iridescence: 0.3,
      iridescenceIOR: 1.6,
      envMapIntensity: 2.5,
      specularIntensity: 0.2 // Added to reduce harsh highlights
  };

  return (
    <group rotation={[Math.PI / 3, 0, 0]}>
      {/* Main outer ring */}
      <mesh>
        <torusGeometry args={[2.8, 0.05, 16, 100]} />
        <CrystalMaterial 
            {...LIU_LI_RING}
        />
      </mesh>
      
      {/* Inner ring - slight ghost effect via opacity, not transmission */}
      <mesh scale={0.96} rotation={[0.05, 0.1, 0]}>
         <torusGeometry args={[2.8, 0.02, 16, 100]} />
         <CrystalMaterial 
            {...LIU_LI_RING}
            color="#88ccff"
            opacity={0.5}
            transparent={true}
        />
      </mesh>
    </group>
  );
};

export default CrystalRing;
