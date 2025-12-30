import React from 'react';

const Slider = ({ label, min, max, step, value, onChange, description }) => (
  <label className="field">
    <div className="field-heading">
      <span>{label}</span>
      <span className="muted">{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
    {description && <p className="muted">{description}</p>}
  </label>
);

const Toggle = ({ label, checked, onChange, description }) => (
  <label className="field toggle">
    <div>
      <span>{label}</span>
      {description && <p className="muted">{description}</p>}
    </div>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

function ControlsPanel({ config, onChange }) {
  return (
    <div className="card">
      <header>
        <div>
          <p className="eyebrow">Parameters</p>
          <h3>Shader controls</h3>
        </div>
      </header>
      <div className="grid">
        <Slider
          label="Depth cut"
          min={0}
          max={1}
          step={0.01}
          value={config.depthCut}
          onChange={(v) => onChange('depthCut', v)}
          description="Lower values allow more background depth to appear."
        />
        <Slider
          label="Density cut"
          min={0}
          max={0.4}
          step={0.01}
          value={config.densityCut}
          onChange={(v) => onChange('densityCut', v)}
          description="Particles darker than this threshold are discarded."
        />
        <Slider
          label="Depth scale"
          min={0.5}
          max={4}
          step={0.05}
          value={config.depthScale}
          onChange={(v) => onChange('depthScale', v)}
          description="Stretch depth range into Z space."
        />
        <Slider
          label="Point scale"
          min={50}
          max={300}
          step={1}
          value={config.pointScale}
          onChange={(v) => onChange('pointScale', v)}
          description="Base particle size adjusted by camera distance."
        />
        <Slider
          label="Focus"
          min={0}
          max={1}
          step={0.01}
          value={config.focus}
          onChange={(v) => onChange('focus', v)}
          description="Depth plane where particles are sharpest."
        />
        <Slider
          label="Aperture"
          min={0}
          max={0.6}
          step={0.01}
          value={config.aperture}
          onChange={(v) => onChange('aperture', v)}
          description="Strength of depth-of-field blur and fade."
        />
        <Slider
          label="Curl strength"
          min={0}
          max={0.6}
          step={0.01}
          value={config.curlStrength}
          onChange={(v) => onChange('curlStrength', v)}
          description="Adds gentle swirling motion to keep the face alive."
        />
        <Slider
          label="Curl frequency"
          min={0.5}
          max={4}
          step={0.05}
          value={config.curlFrequency}
          onChange={(v) => onChange('curlFrequency', v)}
        />
        <Slider
          label="Curl speed"
          min={0}
          max={2}
          step={0.01}
          value={config.curlSpeed}
          onChange={(v) => onChange('curlSpeed', v)}
        />
        <Slider
          label="Morph"
          min={0}
          max={1}
          step={0.01}
          value={config.morph}
          onChange={(v) => onChange('morph', v)}
          description="0 = sphere cloud, 1 = full face."
        />
      </div>
      <div className="toggles">
        <Toggle
          label="Invert depth"
          checked={config.depthReverse}
          onChange={(v) => onChange('depthReverse', v)}
          description="Use if your depth map stores near as dark instead of bright."
        />
        <Toggle
          label="Use sprite texture"
          checked={config.useSprite}
          onChange={(v) => onChange('useSprite', v)}
          description="Softens particle edges for bokeh-like look."
        />
        <Toggle
          label="Additive blending"
          checked={config.additive}
          onChange={(v) => onChange('additive', v)}
          description="Brighter, glowier particles. Disable for more realistic color."
        />
      </div>
    </div>
  );
}

export default ControlsPanel;
