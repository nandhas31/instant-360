/**
 * WebGL2 shaders for the dual-fisheye -> equirectangular preview. The
 * fragment shader implements the same geometry as `projection.ts` (see
 * that file's unit tests for the reference behavior); it's duplicated in
 * GLSL because shader code can't import from TypeScript.
 */

export const VERTEX_SHADER = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
  // a_position is a full-screen triangle strip in clip space [-1, 1].
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_source;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_lensFovRad;

const float PI = 3.14159265359;

vec3 equirectDirection(vec2 uv, float yaw, float pitch) {
  float longitude = (uv.x - 0.5) * 2.0 * PI + yaw;
  float latitude = clamp((0.5 - uv.y) * PI + pitch, -PI * 0.5, PI * 0.5);
  return vec3(
    cos(latitude) * sin(longitude),
    sin(latitude),
    cos(latitude) * cos(longitude)
  );
}

void main() {
  vec3 dir = equirectDirection(v_uv, u_yaw, u_pitch);

  float lensSign = dir.z >= 0.0 ? 1.0 : -1.0;
  float cosTheta = clamp(dir.z * lensSign, -1.0, 1.0);
  float theta = acos(cosTheta);
  float halfFov = u_lensFovRad * 0.5;
  float radius = theta / halfFov;

  float localX = dir.x;
  float localY = lensSign >= 0.0 ? dir.y : -dir.y;
  float azimuth = atan(localY, localX);

  vec2 lensUv = vec2(0.5) + radius * vec2(cos(azimuth), sin(azimuth)) * 0.5;
  vec2 compositeUv = lensSign >= 0.0 ? lensUv * vec2(0.5, 1.0) : vec2(0.5, 0.0) + lensUv * vec2(0.5, 1.0);

  if (radius > 1.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  outColor = texture(u_source, compositeUv);
}
`;
