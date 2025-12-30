export const vertexShader = /* glsl */ `
precision highp float;

attribute vec2 aUv;
attribute vec4 aRandom;
attribute vec3 aSphere;

uniform sampler2D uColorTex;
uniform sampler2D uDepthTex;
uniform float uTime;
uniform float uDepthScale;
uniform float uFocus;
uniform float uAperture;
uniform float uPointScale;
uniform float uDepthCut;
uniform float uDensityCut;
uniform float uCurlStrength;
uniform float uCurlFrequency;
uniform float uCurlSpeed;
uniform float uMorph;
uniform float uDepthReverse;

varying vec3 vColor;
varying float vDiscard;
varying float vAlpha;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(27.16898, 38.90563, 17.96873))) * 43758.5453);
}

vec3 gradientNoise(vec3 p) {
  return vec3(hash(p + vec3(1.32, 0.57, 9.2)), hash(p + vec3(8.1, 2.7, 0.7)), hash(p + vec3(4.8, 1.3, 5.9)));
}

vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = gradientNoise(p + vec3(e, 0.0, 0.0)) - gradientNoise(p - vec3(e, 0.0, 0.0));
  vec3 dy = gradientNoise(p + vec3(0.0, e, 0.0)) - gradientNoise(p - vec3(0.0, e, 0.0));
  vec3 dz = gradientNoise(p + vec3(0.0, 0.0, e)) - gradientNoise(p - vec3(0.0, 0.0, e));
  return normalize(vec3(dy.z - dz.y, dz.x - dx.z, dx.y - dy.x));
}

void main() {
  vec3 color = texture2D(uColorTex, aUv).rgb;
  float density = dot(color, vec3(0.299, 0.587, 0.114));
  float depth = texture2D(uDepthTex, aUv).r;
  depth = mix(depth, 1.0 - depth, step(0.5, uDepthReverse));

  vColor = color;
  vDiscard = depth < uDepthCut || density < uDensityCut ? 1.0 : 0.0;

  vec3 facePos = vec3(aUv * 2.0 - 1.0, depth * uDepthScale);
  facePos.y *= -1.0;

  vec3 noisePos = vec3(aUv, depth) * uCurlFrequency + aRandom.xyz * 2.5 + uTime * uCurlSpeed;
  vec3 curl = curlNoise(noisePos) * uCurlStrength;

  vec3 morphed = mix(aSphere, facePos + curl, uMorph);

  vec4 mvPosition = modelViewMatrix * vec4(morphed, 1.0);
  float focusDelta = abs(depth - uFocus);
  float apertureBoost = 1.0 + focusDelta * (1.5 + uAperture * 6.0);
  gl_PointSize = (uPointScale * apertureBoost) / max(0.0001, -mvPosition.z);

  vAlpha = exp(-focusDelta * (2.0 + uAperture * 8.0));
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uSpriteTex;
uniform float uUseSprite;

varying vec3 vColor;
varying float vDiscard;
varying float vAlpha;

void main() {
  if (vDiscard > 0.5) discard;
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;

  float sprite = mix(1.0, texture2D(uSpriteTex, gl_PointCoord).r, step(0.5, uUseSprite));
  float alpha = vAlpha * sprite;
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(vColor, alpha);
}
`;
