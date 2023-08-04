varying float vTime;
varying vec2 vUv;

varying float vFrontShadow;
uniform sampler2D uTexture;
uniform float uTextureAspect;
uniform float uPlaneAspect;

vec2 ratio(float p, float t, float s){
  return vec2(
    min(p / t, 1.0) * s,
    (min((1.0 / p) / (1.0 / t), 1.0)) * s
  );
}

vec2 optimizationUv(vec2 uv, vec2 ratio){
  return vec2(
    ((uv.x - 0.5) * ratio.x + 0.5),
    ((uv.y - 0.5) * ratio.y + 0.5)
  );
}

vec3 rgbToGrayscale(vec3 color) {
  float average = (color.r + color.g + color.b) / 3.0;
  return vec3(average);
}

void main( void ) {
  vec2 uv = vUv;
  vec2 ratio1 = ratio(uPlaneAspect, uTextureAspect, 1.);
  vec2 uv1 = optimizationUv(uv, ratio1);
  vec4 texture = texture2D(uTexture, uv1);

  if (gl_FrontFacing) {
    // 表
    texture.rgb *= vFrontShadow;
  } else {
    // 裏
    texture.rgb = rgbToGrayscale(texture.rgb);
    texture = vec4(
      texture.rgb, 1.0
    );
  };
  gl_FragColor = texture;
}

