import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import CrystalScene from './components/CrystalScene';
import UIOverlay from './components/UIOverlay';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-black" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 45 }}
        gl={{ 
          antialias: false, 
          alpha: false, 
          stencil: false, 
          depth: true,
          powerPreference: "high-performance" 
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <CrystalScene />
        </Suspense>
      </Canvas>
      <Loader />
      <UIOverlay />
    </div>
  );
};

export default App;