# Web-Based 3D Face Particle Renderer

A React + Three.js demo that turns a color photo and its depth map into a 78,400-point particle face. Upload matching images, tweak shader parameters, and orbit the result in real time with GPU-driven animation.

## Features
- Upload matching **color** and **depth** maps with dimension validation.
- Fixed **280 × 280 grid** (78,400 points) with per-vertex UV, random seeds, and optional sphere morph source.
- Custom **vertex/fragment shaders** with depth-based point placement, background discard, curl noise motion, morphing, and depth-of-field sizing/fading.
- Optional **sprite-based bokeh** and toggleable **additive blending**.
- **Orbit controls** with damping for smooth interaction and live parameter sliders for cuts, focus/aperture, depth scale, curl noise, and morph.

## Getting Started
1. Install dependencies (requires Node.js 18+):
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open the provided URL, upload a color map and a matching depth map (linear, non-sRGB), and adjust the controls.

## Notes
- Depth textures are treated as **linear** data; color uses **sRGB**.
- If your depth map encodes near as dark, enable **Invert depth**.
- Point size scales with camera distance via `uPointScale`; tune alongside focus/aperture for the desired bokeh strength.
