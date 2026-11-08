// Vertex shader: a continuous travelling wave of particles across the screen.

uniform float uTime;
uniform float uCollapse;   // 0 -> 1 during the compress animation, then stays at 1
uniform float uPixelRatio;
uniform float uSpanScale;  // horizontal fit so the wave runs edge to edge on any screen
uniform vec3 uColorA;      // colour at the left end (theme)
uniform vec3 uColorB;      // colour at the right end (theme)

attribute float aRandom;
attribute float aProgress; // 0 at the left end, 1 at the right end
attribute vec2 aOffset;    // per-particle thickness offset (y, z)

varying vec3 vColor;
varying float vAlpha;

const float SPAN = 14.0;       // world units end to end, before uSpanScale
const float WAVELENGTH = 5.2;  // in unscaled units, so every screen shows ~2.7 waves
const float AMPLITUDE = 0.85;
const float BASELINE = -0.9;   // a little below centre, under the headline

void main() {
  float x = (aProgress - 0.5) * SPAN;
  float k = 6.2831853 / WAVELENGTH;
  float phase = k * x - uTime * 0.6;

  // The compress animation squeezes the wave flat and tight, then releases it;
  // sin(pi * t) is 0 at both ends, so the wave always returns to full shape.
  float squeeze = sin(clamp(uCollapse, 0.0, 1.0) * 3.14159265);
  float amp = AMPLITUDE * (1.0 - 0.85 * squeeze);
  float thickness = 1.0 - 0.7 * squeeze;

  vec3 pos;
  pos.x = x * uSpanScale;
  pos.y = BASELINE + sin(phase) * amp + 0.12 * sin(phase * 2.3 + uTime * 0.4) + aOffset.x * thickness;
  pos.z = cos(phase * 0.5) * 0.6 + aOffset.y * thickness;

  // A little shimmer so the ribbon feels alive without breaking its shape.
  pos.xy += 0.03 * vec2(sin(uTime * 1.3 + aRandom * 6.28), cos(uTime * 1.1 + aRandom * 6.28));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = (22.0 * uPixelRatio * (0.8 + aRandom * 0.4)) / -mvPosition.z;

  vColor = mix(uColorA, uColorB, aProgress);

  // Soften the very ends so the wave flows in and out past the screen edges.
  float edgeFade = smoothstep(0.0, 0.05, aProgress) * smoothstep(1.0, 0.95, aProgress);
  vAlpha = edgeFade * (0.7 + 0.25 * aRandom);
}
