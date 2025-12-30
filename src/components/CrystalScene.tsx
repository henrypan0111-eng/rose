import React from 'react';
import { OrbitControls, Environment, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import Rose from './Rose';
import CrystalRing from './CrystalRing';
import Shards from './Shards';

const CrystalScene: React.FC = () => {
  return (
    <>
      <color attach="background" args={['#050510']} />
      
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={4} 
        maxDistance={15}
        autoRotate={true}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
      />

      <ambientLight intensity={0.8} color="#ccccff" />
      
      <spotLight 
        position={[10, 10, 10]} 
        angle={1.2} 
        penumbra={1} 
        intensity={0.02} 
        color="#ffffff" 
        castShadow 
      />
      
      <spotLight 
        position={[-10, 2, -5]} 
        angle={1.2} 
        penumbra={1} 
        intensity={0.02} 
        color="#00ffff" 
      />

      <pointLight position={[0, -5, 2]} intensity={0.4} color="#aa00ff" distance={15} />

      <Environment preset="city" background={false} environmentIntensity={1.0} />

      <group position={[0, -0.5, 0]}>
        <Float 
          speed={1.5} 
          rotationIntensity={0.2} 
          floatIntensity={0.5}
          floatingRange={[-0.1, 0.1]}
        >
          <Rose />
          <CrystalRing />
          <Shards />
        </Float>
      </group>

      <Sparkles count={200} scale={10} size={2} speed={0.4} opacity={0.5} color="#aaddff" />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={0.3} 
          radius={0.4} 
        />
        <Vignette eskil={false} offset={0.5} darkness={0.3} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </>
  );
};

export default CrystalScene;