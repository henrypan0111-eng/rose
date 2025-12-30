import React, { forwardRef } from 'react';
import { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type CrystalMaterialProps = ThreeElements['meshPhysicalMaterial'] & {
  color?: string;
  thickness?: number;
  roughness?: number;
  ior?: number;
  dispersion?: number;
  attenuationColor?: string;
  attenuationDistance?: number;
  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange?: [number, number];
}

const CrystalMaterial = forwardRef<THREE.MeshPhysicalMaterial, CrystalMaterialProps>(({
  color = "#ffffff",
  thickness = 1.0,
  roughness = 0.15,
  ior = 1.5,
  dispersion = 0.1,
  attenuationColor = "#ffffff",
  attenuationDistance = 1.0,
  iridescence = 0.0,
  iridescenceIOR = 1.3,
  iridescenceThicknessRange = [100, 400],
  transmission = 0.0,
  ...props
}, ref) => {
  return (
    // @ts-ignore
    <meshPhysicalMaterial
      ref={ref}
      transmission={transmission}
      thickness={thickness}     
      roughness={roughness}     
      metalness={props.metalness ?? 0.0}
      ior={ior}                 
      color={color}             
      attenuationColor={attenuationColor} 
      attenuationDistance={attenuationDistance} 
      dispersion={dispersion}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
      iridescence={iridescence}
      iridescenceIOR={iridescenceIOR}
      iridescenceThicknessRange={iridescenceThicknessRange}
      side={2}                  
      {...props}
    />
  );
});

export default CrystalMaterial;