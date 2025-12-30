# Web-Based 3D Face Particle Renderer

This document outlines an implementation plan for a web application that converts an uploaded color photo and depth map into an interactive 3D particle visualization rendered with the GPU.

## Goals
- Accept a color map and a corresponding depth map from the user.
- Quantize the inputs into a fixed set of 78,400 particles (e.g., 280 × 280 grid).
- Render the result in real time on the GPU using custom shaders, with smooth interactions and cinematic depth-of-field.

## Tech Stack
- **UI:** React
- **3D:** Three.js with React Three Fiber
- **Rendering:** `THREE.Points` + `ShaderMaterial` (or `RawShaderMaterial`)
- **Geometry:** `BufferGeometry` with custom attributes for per-particle data
- **Textures:** Color map, depth map, optional sprite texture for soft bokeh
- **Interaction:** Mouse/touch rotation with damping (lerp-based)

## Architecture & Modules
- **React shell:** page layout, upload controls, parameter sliders, loading/error messaging, and a minimal state store (e.g., Zustand) to keep GPU-only data out of React renders.
- **Asset loader:** validates color/depth dimension match, generates `HTMLImageElement` URLs from uploads, sets correct color space (`SRGBColorSpace` for color, `LinearSRGBColorSpace` for depth), and handles optional depth inversion.
- **Scene host (R3F):** camera setup, orbit/damped rotation logic, lights if desired, and a `Points` system wrapped in a memoized component so geometry is created once.
- **Geometry builder:** constructs the 280 × 280 grid, fills `aUv`, `aRandom`, and optional `aSphere` attributes, uploads as `Float32BufferAttribute`, and freezes (`usage: StaticDrawUsage`).
- **Shader package:** colocated GLSL strings for vertex/fragment shaders plus a hook that wires uniforms (textures, time, animation toggles) and updates them via `useFrame`.
- **Controls & presets:** depth/density cuts, depth scale, focus/aperture, morph amount, curl strength, sprite on/off, depth inversion toggle, and reset-to-defaults actions.

## Step-by-Step Implementation
1. **UI & state:** build upload inputs for color/depth, show progress/error toasts, and store validated URLs plus config values in a central store.
2. **Texture prep:** load images into Three.js textures, set `flipY` consistently, and flag depth texture as linear; guard rendering until both textures report `image` readiness.
3. **Geometry creation:** on first render, generate the 280 × 280 grid; compute UVs with pixel-center sampling, fill random noise seeds, and optionally generate sphere positions for morphing.
4. **Shader material:** define `ShaderMaterial` with attributes/uniforms noted below; disable `depthWrite`, pick blending (`AdditiveBlending` or `NormalBlending`), and set `transparent: true`.
5. **Animation loop:** in `useFrame`, increment `uTime`, lerp camera target rotation based on pointer velocity for damping, and update uniforms like `uMorph` during entry animation.
6. **Discard strategy:** send a varying flag from the vertex shader when depth/density fall below thresholds; perform `discard` in the fragment shader to remove background.
7. **Depth-of-field sizing:** compute `gl_PointSize` using `uPointScale * (1.0 / -mvPosition.z)` and modulate by distance-to-focus to create bokeh; mirror the focus logic in alpha for softer edges.
8. **Curl noise:** apply 3D curl noise to positions in the vertex shader using `uTime` and per-particle random phases; keep strength moderate to maintain facial cohesion.

## Shader Pseudocode Highlights
**Vertex shader**
```
vec3 color = texture(uColorTex, aUv).rgb;
float density = dot(color, vec3(0.299, 0.587, 0.114));
float depth = texture(uDepthTex, aUv).r; // linear space
bool discardFlag = depth < depthCut || density < densityCut;

vec3 facePos = vec3(aUv * 2.0 - 1.0, depth * uDepthScale);
facePos.xy *= vec2(1.0, -1.0); // optional flip
vec3 noisy = facePos + curlNoise(aUv * freq + aRandom.xyz + uTime * speed) * curlStrength;
vec3 morphed = mix(aSphere, noisy, uMorph);

vec4 mvPos = modelViewMatrix * vec4(morphed, 1.0);
float focusDelta = abs(depth - uFocus);
gl_PointSize = (uPointScale / -mvPos.z) * mix(1.0, 1.0 + focusDelta * uAperture, 1.0);
vAlpha = computeAlpha(focusDelta, density);
vColor = color;
vDiscard = discardFlag ? 1.0 : 0.0;
gl_Position = projectionMatrix * mvPos;
```

**Fragment shader**
```
if (vDiscard > 0.5) discard;
vec2 c = gl_PointCoord - 0.5;
if (dot(c, c) > 0.25) discard; // circular mask
float sprite = texture(uSpriteTex, gl_PointCoord).r; // optional
float alpha = vAlpha * sprite;
fragColor = vec4(vColor, alpha);
```

## Config & Interaction Details
- **Rotation/damping:** track pointer deltas, integrate into a target Euler, and lerp current rotation each frame for smooth follow.
- **Parameter UI:** sliders for depth scale, focus, aperture, point scale, curl strength, morph; toggles for depth inversion, sprite usage, additive vs normal blending; numeric inputs for `depthCut`/`densityCut`.
- **Loading/errors:** display progress while textures load; show validation errors for mismatched sizes or failed decoding; block rendering until validation passes.
- **Responsiveness:** resize canvas on container changes; recompute `uPointScale` if camera FOV or viewport size changes.

## Chinese Quick Guide（中文速览）
- 固定 280×280 粒子网格，`aUv` 采样彩色与深度，`aRandom` 提供噪声相位，`aSphere` 用于球面到人脸的过渡动画。
- 顶点 shader：采样 color/depth → 计算密度/抠除背景 → curl noise 微动 → 深度拉伸 + 景深点大小 → `uMorph` 插值。
- 片段 shader：用 varying 标记 discard，`gl_PointCoord` 裁圆，按 sprite/景深混合透明度，关闭 `depthWrite` 并选合适 blending。
- UI：上传彩色/深度图（校验尺寸、可反转深度），滑块调 depthScale/focus/aperture/pointScale/curlStrength/morph，开关 depthCut/densityCut 与 sprite。
- 性能：属性只上传一次，动画全在 shader；深度纹理保持线性色彩空间，统一处理 `flipY`；点大小按视距衰减防止爆炸。

## Data Flow to the GPU
- **Geometry layout:** 280 × 280 grid (or equivalent) to yield 78,400 vertices.
- **Attributes (per particle):**
  - `aUv` (UV/index): normalized UV used to sample both color and depth.
  - `aRandom`: four random floats for size, noise phase, and subtle offsets.
  - `aSphere`: optional sphere-distributed start position for morphing.
- **Uniforms (global):**
  - `uColorTex`, `uDepthTex`, `uSpriteTex`
  - `uTime`
  - `uFocus`, `uAperture` (depth of field)
  - `uPointScale` (view-dependent point sizing)
  - `uDepthScale` (depth stretch)
  - `uMorph` (0 = sphere, 1 = face)
  - `depthCut`, `densityCut` thresholds (configurable)

## Vertex Shader Responsibilities
1. Sample color from `uColorTex` via `aUv`; compute density (luma or mean RGB).
2. Sample depth from `uDepthTex`; map UV to XY in normalized space and depth to Z using `uDepthScale`.
3. Mark background for discard when depth < `depthCut` or density < `densityCut` (pass a flag to fragment shader).
4. Animate with curl noise driven by `uTime` and `aRandom` phases.
5. Apply depth-of-field sizing: farther from `uFocus` => larger & softer points; optionally adjust alpha.
6. Morph from `aSphere` to face positions using `uMorph`.
7. Set `gl_PointSize` using `uPointScale` scaled by view distance (e.g., `-mvPosition.z`).

## Fragment Shader Responsibilities
1. Discard flagged background fragments.
2. Clip square point sprites to circles with `gl_PointCoord` radius check.
3. Compose color from interpolated vertex color; optionally modulate with `uSpriteTex` for soft bokeh edges.
4. Apply alpha falloff toward edges and depth-of-field transparency (farther from focus => lower alpha and softer look).
5. Choose blending that suits the art direction; typically disable `depthWrite` for cleaner transparency.

## Interaction & UX
- Orbit-like rotation on mouse/touch drag with damping to keep motion smooth.
- Loading states while textures prepare; error states for mismatched sizes or load failures.
- Optional toggle to invert depth if sources vary (`depthReverse` flag) and to adjust thresholds live.

## Performance Notes
- Avoid per-frame CPU updates to attributes; animate in shaders via uniforms.
- Ensure depth texture is sampled as linear (not sRGB) to prevent gamma distortion; color map can be sRGB.
- Handle `flipY` consistently for both textures or adjust UVs accordingly.
- Align UV sampling to pixel centers: e.g., `(x + 0.5) / width` during attribute generation.
- Tune `uPointScale` relative to camera FOV and distance to prevent oversized nearby particles.

## Parameter Defaults (tunable via UI)
- `depthCut`: 0.3
- `densityCut`: 0.1–0.2
- `depthScale`: 1.5–3.0 depending on depth map range
- `focus`: 0.5 (depth-space), `aperture`: 0.1–0.2
- `curlStrength`: mild default to keep the face cohesive
- `morph`: animate from 0 → 1 on load for sphere-to-face reveal

## Implementation Outline
1. **UI flow:** upload color/depth images, show progress, validate same dimensions, allow depth inversion toggle.
2. **Texture loading:** create Three.js `Texture` objects with appropriate color space and `flipY` handling; wait for readiness.
3. **Geometry setup:** build a 280 × 280 grid of UVs plus `aRandom` and optional `aSphere` attributes; upload once.
4. **Scene:** R3F canvas with `Points` + custom shaders; set camera FOV and position to frame the face.
5. **Controls:** implement drag-based rotation with damping; expose UI sliders for thresholds, depth scale, focus, aperture, morph, and curl strength.
6. **Rendering tweaks:** disable `depthWrite`, choose blending mode (additive for glow or normal for realism), and fine-tune point size scaling.
7. **Animation:** drive `uTime` via `useFrame`; lerp `uMorph` for the entry transition.

## Pitfalls & Mitigations
- **No vertex discard:** use a varying flag and discard in fragment shader.
- **Depth gamma:** keep depth texture linear; verify color space setup.
- **Texture orientation:** unify `flipY` or compensate in UVs.
- **Point size variance:** scale with view distance using `uPointScale`.
- **Depth polarity:** provide inversion toggle for inconsistent depth sources.
- **Transparency artifacts:** disable `depthWrite` and pick suitable blending to reduce sorting issues.

## Acceptance Criteria
- Background is largely free of particles due to depth/density thresholds.
- Rotating view reveals clear 3D layering derived from the depth map.
- Subtle curl noise motion without breaking facial cohesion.
- Depth-of-field yields larger, softer, and more transparent points away from the focus plane.
- Interaction feels responsive with smooth damping and no runaway spinning.
