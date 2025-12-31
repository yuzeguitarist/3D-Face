import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { createParticleGeometry } from '../utils/geometry';
import { vertexShader, fragmentShader } from '../shaders/particleMaterial';

function ParticleCloud({ colorUrl, depthUrl, config }) {
  const geometry = useMemo(() => createParticleGeometry(), []);
  const materialRef = useRef();
  const spriteTex = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x / size - 0.5;
        const dy = y / size - 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = dist < 0.5 ? Math.exp(-8.0 * dist * dist) : 0;
        const idx = (y * size + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.floor(alpha * 255);
      }
    }
    const tex = new THREE.DataTexture(data, size, size);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.LinearSRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const colorTexture = useTexture(colorUrl);
  const depthTexture = useTexture(depthUrl);

  useEffect(() => {
    if (colorTexture) {
      colorTexture.colorSpace = THREE.SRGBColorSpace;
      colorTexture.flipY = false;
      colorTexture.minFilter = THREE.LinearFilter;
      colorTexture.magFilter = THREE.LinearFilter;
      colorTexture.generateMipmaps = false;
      colorTexture.needsUpdate = true;
    }
  }, [colorTexture]);

  useEffect(() => {
    if (depthTexture) {
      depthTexture.colorSpace = THREE.LinearSRGBColorSpace;
      depthTexture.flipY = false;
      depthTexture.minFilter = THREE.LinearFilter;
      depthTexture.magFilter = THREE.LinearFilter;
      depthTexture.generateMipmaps = false;
      depthTexture.needsUpdate = true;
    }
  }, [depthTexture]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uDepthScale.value = config.depthScale;
    uniforms.uFocus.value = config.focus;
    uniforms.uAperture.value = config.aperture;
    uniforms.uPointScale.value = config.pointScale;
    uniforms.uDepthCut.value = config.depthCut;
    uniforms.uDensityCut.value = config.densityCut;
    uniforms.uCurlStrength.value = config.curlStrength;
    uniforms.uCurlFrequency.value = config.curlFrequency;
    uniforms.uCurlSpeed.value = config.curlSpeed;
    uniforms.uMorph.value = config.morph;
    uniforms.uDepthReverse.value = config.depthReverse ? 1.0 : 0.0;
    uniforms.uUseSprite.value = config.useSprite ? 1.0 : 0.0;
  });

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.blending = config.additive
      ? THREE.AdditiveBlending
      : THREE.NormalBlending;
    materialRef.current.depthWrite = config.depthWrite;
    materialRef.current.depthTest = config.depthTest;
    materialRef.current.needsUpdate = true;
  }, [config.additive, config.depthTest, config.depthWrite]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={config.depthWrite}
        depthTest={config.depthTest}
        blending={config.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uColorTex: { value: colorTexture },
          uDepthTex: { value: depthTexture },
          uSpriteTex: { value: spriteTex },
          uUseSprite: { value: config.useSprite ? 1.0 : 0.0 },
          uTime: { value: 0 },
          uDepthScale: { value: config.depthScale },
          uFocus: { value: config.focus },
          uAperture: { value: config.aperture },
          uPointScale: { value: config.pointScale },
          uDepthCut: { value: config.depthCut },
          uDensityCut: { value: config.densityCut },
          uCurlStrength: { value: config.curlStrength },
          uCurlFrequency: { value: config.curlFrequency },
          uCurlSpeed: { value: config.curlSpeed },
          uMorph: { value: config.morph },
          uDepthReverse: { value: config.depthReverse ? 1.0 : 0.0 },
        }}
      />
    </points>
  );
}

function SceneHost(props) {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor('#05060a');
  }, [gl]);
  return <ParticleCloud {...props} />;
}

function Viewer({ colorUrl, depthUrl, config }) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      camera={{ position: [0, 0, 3], fov: 50 }}
    >
      <color attach="background" args={[0.02, 0.03, 0.04]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 3]} intensity={0.8} />
      <PerspectiveCamera makeDefault position={[0, 0, 3.2]} fov={50} />
      <SceneHost colorUrl={colorUrl} depthUrl={depthUrl} config={config} />
      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.5}
        zoomSpeed={0.9}
        maxPolarAngle={Math.PI * 0.9}
        enablePan={false}
      />
    </Canvas>
  );
}

export default Viewer;
