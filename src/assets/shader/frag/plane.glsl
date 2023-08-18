precision mediump float;
varying float vScale;
varying vec2 vUv;
varying vec2 vCurve;
varying vec3 vNormal;
uniform float uChange;
uniform float uPlaneAspect;
uniform float uTextureAspect;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uNoise;
uniform sampler2D uMatcap;
uniform vec3 uEyePosition;
varying vec3 vPosition;

uniform float uTime;
uniform float uProgress;

const vec3 LIGTH = vec3(0.0, 0.0, 5.0);

#include ../_inc/matcap.glsl
#include ../_inc/ratio.glsl
#include ../_inc/optimizationUv.glsl

void main() {
  float progress = uChange;
  float scaleProgress = 1.0 - vScale;
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

  // モデルの頂点座標とカメラの位置から視線ベクトルを求める
  vec3 eyeDirection = normalize(vPosition - uEyePosition);

  // matcap
  vec2 matcapUv = matcap(eyeDirection, vNormal);
  vec4 matcapTexture = texture2D(uMatcap, matcapUv);

  // ノイズ（歪み）
  vec4 noise = texture2D(uNoise, optimizationUv(uv, vec2(1.0)));
  vec2 dispUv = noise.xy;

  vec2 textureUv = optimizationUv(uv, ratio(uPlaneAspect, uTextureAspect, 1.0));

  float interpolation = pow(
    smoothstep(
      0.0, 
      1.0, 
      (progress * 0.95 + dispUv.x * 0.05 ) * 2.0 - textureUv.x
    ),
    5.0
  );

  vec2 uv1 = (textureUv - 0.5) * (1.0 - interpolation) + 0.5;
  vec4 t1 = vec4(
  texture2D(uTexture1, uv1).r,
  texture2D(uTexture1, uv1 + (vCurve.x + vCurve.y) * 0.4 * scaleProgress).g,
  texture2D(uTexture1, uv1 + (vCurve.x + vCurve.y) * 0.4 * scaleProgress).b,
  1.0
  );
  t1.r = t1.r * (1.0 + interpolation * (20.0 - 19.0 * progress));
  t1.g = t1.g * (1.0 - interpolation);
  t1.b = t1.b * (1.0 - interpolation * (10.0 - 9.0 * progress));

  vec2 uv2 = (textureUv - 0.5) * (interpolation) + 0.5;
  vec4 t2 = vec4(
  texture2D(uTexture2, uv2).r,
  texture2D(uTexture2, uv2 + (vCurve.x + vCurve.y) * 0.4 * scaleProgress).g,
  texture2D(uTexture2, uv2 + (vCurve.x + vCurve.y) * 0.4 * scaleProgress).b,
  1.0
  );
  t2.rgb = t2.rgb * interpolation;

  vec4 texture = mix(t1,t2,interpolation);
  vec4 dist = vec4(texture.rgb * matcapTexture.rgb, 1.0);
  gl_FragColor = dist;
}
