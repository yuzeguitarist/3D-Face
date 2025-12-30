import * as THREE from 'three';

export const GRID_SIZE = 280;

function fibonacciSpherePoint(i, n) {
  const k = (Math.sqrt(5) - 1) / 2;
  const z = 1 - (2 * i) / (n - 1);
  const radius = Math.sqrt(Math.max(0, 1 - z * z));
  const phi = 2 * Math.PI * i * k;
  return new THREE.Vector3(
    radius * Math.cos(phi),
    z,
    radius * Math.sin(phi),
  );
}

export function createParticleGeometry() {
  const total = GRID_SIZE * GRID_SIZE;
  const positions = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  const randoms = new Float32Array(total * 4);
  const sphere = new Float32Array(total * 3);

  let i = 0;
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const u = (x + 0.5) / GRID_SIZE;
      const v = (y + 0.5) / GRID_SIZE;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;

      randoms[i * 4] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();

      const s = fibonacciSpherePoint(i, total);
      sphere[i * 3] = s.x;
      sphere[i * 3 + 1] = s.y;
      sphere[i * 3 + 2] = s.z;

      i += 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aUv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 4));
  geometry.setAttribute('aSphere', new THREE.Float32BufferAttribute(sphere, 3));
  geometry.computeBoundingSphere();

  return geometry;
}
