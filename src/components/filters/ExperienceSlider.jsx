import React from 'react';

// ExperienceSlider component using native range input and custom CSS styling.
// Props:
//   min: minimum value (default 0)
//   max: maximum value (default 20)
//   step: step increment (default 1)
//   value: current selected value
//   onChange: callback receiving the new numeric value
// The component sets a CSS variable '--val' to control the fill percentage of the slider.
export default function ExperienceSlider({ min = 0, max = 20, step = 1, value = 0, onChange }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const handleChange = (e) => {
    const newVal = Number(e.target.value);
    if (onChange) onChange(newVal);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '150px' }}>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Experience: {value} yr{value !== 1 ? 's' : ''}
      </label>
      <input
        type="range"
        className="ez-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        style={{ '--val': percentage }}
      />
    </div>
  );
}
