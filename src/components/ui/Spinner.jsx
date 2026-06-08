import React from 'react';

export default function Spinner({ size = 24, color = '#6C5CE7' }) {
  const style = {
    width: size,
    height: size,
    border: `${Math.round(size / 8)}px solid ${color}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };
  return <div style={style} aria-label="Loading spinner" />;
}
