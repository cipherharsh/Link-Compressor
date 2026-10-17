/*
 * PURPOSE: Fragment shader for WildStrand particles rendering circular glows with depth attenuation.
 * INPUTS: Varying vColor, vAlpha, gl_PointCoord.
 * OUTPUTS: gl_FragColor with radial antialiased falloff.
 * DEPENDS_ON: Three.js WebGLRenderer.
 * WHY_THIS_DESIGN: Radial circle calculation in fragment shader creates glowing orbs without high-poly particle meshes.
 */

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
