attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
varying float vScale;
varying vec2 vUv;
uniform float uScale;
uniform vec2 uFullScale;
varying vec2 vCurve;
varying vec3 vNormal;
varying vec3 vPosition;
uniform vec2 uCurve;
uniform mat4 uMvpMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

const float PI = 3.1415925;

void main() {
  vUv = uv;
  vCurve = uCurve;
  vScale = uScale;

  // ワールド空間上でのモデルの頂点を求める
  vPosition = (uModelMatrix * vec4(position, 1.0)).xyz;

  vNormal = normalize((uNormalMatrix * vec4(normal, 0.0)).xyz);

  // animation progress
  float transform = 1.0 - uv.y;
  float progressStartValue = 0.5;
  float progress = clamp(
    progressStartValue, 
    1.0,
    smoothstep(
      transform * progressStartValue,
      1.0,
      uScale
    )
  );

  float x = position.x;
  float y = position.y;
  float z = position.z;

  // curve effects
  x = x + (sin(uv.y * PI) * uCurve.x) * (1.0 - uScale);
  y = y + (sin(uv.x * PI) * uCurve.y) * (1.0 - uScale);

  // plane size → fullscreen size
  x = x * uFullScale.x;
  y = y * uFullScale.y;

  // position adjustment
  x = x + (x * progress) - (x * uScale);
  y = y + (y * progress) - (y * uScale);

  gl_Position = uMvpMatrix * vec4(vec3(x, y, z), 1.0);
}
