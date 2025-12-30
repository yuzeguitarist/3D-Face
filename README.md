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
