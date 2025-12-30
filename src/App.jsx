import React, { useEffect, useMemo, useState } from 'react';
import UploadPanel from './components/UploadPanel';
import ControlsPanel from './components/ControlsPanel';
import Viewer from './components/Viewer';

const defaultConfig = {
  depthCut: 0.28,
  densityCut: 0.08,
  depthScale: 2.1,
  focus: 0.5,
  aperture: 0.18,
  pointScale: 180.0,
  curlStrength: 0.15,
  curlFrequency: 1.5,
  curlSpeed: 0.45,
  morph: 1,
  depthReverse: false,
  useSprite: true,
  additive: false,
};

function App() {
  const [colorUrl, setColorUrl] = useState(null);
  const [depthUrl, setDepthUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [imageSize, setImageSize] = useState(null);

  const handleReset = () => setConfig(defaultConfig);

  const setConfigValue = (key, value) =>
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));

  const validateImagePair = async (colorFile, depthFile) => {
    const readImage = (file) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to decode image.'));
        };
        img.src = url;
      });

    const [colorInfo, depthInfo] = await Promise.all([
      readImage(colorFile),
      readImage(depthFile),
    ]);

    if (
      colorInfo.width !== depthInfo.width ||
      colorInfo.height !== depthInfo.height
    ) {
      throw new Error('Color and depth images must share the same dimensions.');
    }

    setImageSize(colorInfo);
  };

  const handleUpload = async ({ colorFile, depthFile }) => {
    setError('');
    if (!colorFile || !depthFile) {
      setError('Please choose both a color map and depth map.');
      return;
    }

    setLoading(true);
    try {
      await validateImagePair(colorFile, depthFile);
      if (colorUrl) URL.revokeObjectURL(colorUrl);
      if (depthUrl) URL.revokeObjectURL(depthUrl);
      const colorObjectUrl = URL.createObjectURL(colorFile);
      const depthObjectUrl = URL.createObjectURL(depthFile);
      setColorUrl(colorObjectUrl);
      setDepthUrl(depthObjectUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => () => {
      if (colorUrl) URL.revokeObjectURL(colorUrl);
      if (depthUrl) URL.revokeObjectURL(depthUrl);
    },
    [colorUrl, depthUrl]
  );

  const loaded = useMemo(() => !!(colorUrl && depthUrl), [colorUrl, depthUrl]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">WebGL + Shader</p>
          <h1>3D Face Particle Renderer</h1>
          <p className="lede">
            Upload a color map and matching depth map to render an interactive 78,400-point particle face. All motion and depth
            cues are driven in custom GPU shaders with damping-based rotation.
          </p>
        </div>
        <div className="header-actions">
          <button className="ghost" onClick={handleReset}>
            Reset parameters
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <UploadPanel onUpload={handleUpload} loading={loading} imageSize={imageSize} />
          <ControlsPanel config={config} onChange={setConfigValue} />
          {error && <p className="error">{error}</p>}
        </section>

        <section className="viewer">
          {loaded ? (
            <Viewer
              colorUrl={colorUrl}
              depthUrl={depthUrl}
              config={config}
              key={`${colorUrl}-${depthUrl}`}
            />
          ) : (
            <div className="placeholder">
              <p>Upload a color map and depth map to begin.</p>
              <p className="muted">Recommended: 280×280 or higher. Depth should be linear (non-sRGB).</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
