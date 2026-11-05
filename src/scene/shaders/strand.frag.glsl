// Fragment shader: circular glow with depth-based alpha falloff for strand particles.

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Center distance from (0.5, 0.5) inside the point quad
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Soft circle falloff
  if (dist > 0.5) {
    discard;
  }

  // Smooth glow towards center
  float glow = smoothstep(0.5, 0.0, dist);
  float alpha = vAlpha * glow;

  gl_FragColor = vec4(vColor, alpha);
}
