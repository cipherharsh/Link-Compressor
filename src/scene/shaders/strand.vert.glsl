// Vertex shader: a continuous travelling wave of particles across the screen.

uniform float uTime;
uniform float uGather;     // 0 -> 1 while a QR is generated, then eases back to 0
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

  float gather = clamp(uGather, 0.0, 1.0);

  vec3 pos;
  pos.x = x * uSpanScale;
  pos.y = BASELINE + sin(phase) * AMPLITUDE + 0.12 * sin(phase * 2.3 + uTime * 0.4) + aOffset.x;
  pos.z = cos(phase * 0.5) * 0.6 + aOffset.y;

  // A little shimmer so the ribbon feels alive without breaking its shape.
  pos.xy += 0.03 * vec2(sin(uTime * 1.3 + aRandom * 6.28), cos(uTime * 1.1 + aRandom * 6.28));

  // QR generation: the ribbon is drawn in towards the code at the centre and dims,
  // as in the original animation, then flows back out into the wave.
  pos = mix(pos, pos * 0.2, gather * 0.8);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  gl_PointSize = (mix(22.0, 14.0, gather) * uPixelRatio * (0.8 + aRandom * 0.4)) / -mvPosition.z;

  vColor = mix(uColorA, uColorB, aProgress);

  // Soften the very ends so the wave flows in and out past the screen edges.
  float edgeFade = smoothstep(0.0, 0.05, aProgress) * smoothstep(1.0, 0.95, aProgress);
  vAlpha = edgeFade * (0.7 + 0.25 * aRandom) * mix(1.0, 0.3, gather);
}
