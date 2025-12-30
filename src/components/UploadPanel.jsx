import React, { useRef, useState } from 'react';

function UploadPanel({ onUpload, loading, imageSize }) {
  const colorInput = useRef(null);
  const depthInput = useRef(null);
  const [colorFile, setColorFile] = useState(null);
  const [depthFile, setDepthFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpload({ colorFile, depthFile });
  };

  const reset = () => {
    setColorFile(null);
    setDepthFile(null);
    if (colorInput.current) colorInput.current.value = '';
    if (depthInput.current) depthInput.current.value = '';
  };

  const fileLabel = (file) => (file ? file.name : 'No file selected');

  return (
    <form className="card" onSubmit={handleSubmit}>
      <header>
        <div>
          <p className="eyebrow">Assets</p>
          <h3>Upload maps</h3>
        </div>
        <button className="ghost" type="button" onClick={reset}>
          Clear
        </button>
      </header>
      <div className="field">
        <label>Color map</label>
        <input
          ref={colorInput}
          type="file"
          accept="image/*"
          onChange={(e) => setColorFile(e.target.files?.[0] ?? null)}
        />
        <p className="muted">{fileLabel(colorFile)}</p>
      </div>
      <div className="field">
        <label>Depth map</label>
        <input
          ref={depthInput}
          type="file"
          accept="image/*"
          onChange={(e) => setDepthFile(e.target.files?.[0] ?? null)}
        />
        <p className="muted">{fileLabel(depthFile)}</p>
      </div>
      {imageSize && (
        <p className="muted">
          Matched dimensions: {imageSize.width}×{imageSize.height}
        </p>
      )}
      <div className="actions">
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Render'}
        </button>
      </div>
      <p className="hint">
        Depth map should be linear (non-sRGB) and aligned with the color map. If your source is inverted, use the depth inversion
        toggle below.
      </p>
    </form>
  );
}

export default UploadPanel;
