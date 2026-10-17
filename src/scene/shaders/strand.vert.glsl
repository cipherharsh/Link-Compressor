/*
 * PURPOSE: Vertex shader for WildStrand particles with curl-noise displacement and collapse kinematics.
 * INPUTS: Attributes: position, aRandom, aIndex. Uniforms: uTime, uProgress, uCollapse, uLength, uPixelRatio.
 * OUTPUTS: gl_Position and vColor/vAlpha for fragment shading.
 * DEPENDS_ON: Three.js WebGLRenderer.
 * WHY_THIS_DESIGN: GPU-accelerated procedural curl noise ensures fluid 60fps ribbons without CPU geometry updates.
 */

uniform float uTime;
uniform float uProgress;
uniform float uCollapse;
uniform float uLength;
uniform float uPixelRatio;

attribute float aRandom;
attribute float aProgress;

varying vec3 vColor;
varying float vAlpha;

// Simplex/Perlin-inspired pseudo curl noise
vec3 snoise3D(vec3 p) {
  float n1 = sin(p.y * 1.5 + uTime * 0.8) * cos(p.z * 1.5 + uTime * 0.6);
  float n2 = sin(p.z * 1.5 + uTime * 0.7) * cos(p.x * 1.5 + uTime * 0.9);
  float n3 = sin(p.x * 1.5 + uTime * 0.9) * cos(p.y * 1.5 + uTime * 0.7);
  return vec3(n1, n2, n3);
}

void main() {
  // Base position along spline ribbon
  vec3 pos = position;

  // Length culling: particles beyond URL length fade out
  float isVisible = step(aProgress, clamp(uLength, 0.1, 1.0));

  // Curl noise displacement proportional to (1.0 - uCollapse)
  float noiseIntensity = mix(0.7, 0.05, uCollapse);
  vec3 curl = snoise3D(pos * 0.8 + aRandom * 2.0) * noiseIntensity;
  
  // Collapse attraction: tightens towards origin/centerline as uCollapse increases
  pos = mix(pos + curl, pos * 0.2, uCollapse * 0.8);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Attenuate point size by camera depth
  float baseSize = mix(28.0, 16.0, uCollapse);
  gl_PointSize = (baseSize * uPixelRatio * (0.8 + aRandom * 0.4)) / -mvPosition.z;

  // Color transition along ribbon: Accent (#6CF2C2) to Accent-2 (#7C8CFF)
  vec3 colorA = vec3(0.424, 0.949, 0.761); // #6CF2C2
  vec3 colorB = vec3(0.486, 0.549, 1.000); // #7C8CFF
  vColor = mix(colorA, colorB, aProgress + sin(uTime + aRandom * 6.28) * 0.2);

  vAlpha = isVisible * mix(0.85, 0.2, uCollapse);
}
