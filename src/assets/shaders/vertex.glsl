varying float vTime;
varying float vFrontShadow;
varying vec2 vUv;

uniform float uScale;
uniform float uTime;
uniform float uAnime;
uniform float uAngle;
// uniform float uTwist;
// uniform float uProgress;

const float PI = 3.1415925;
const float RADIUS = 0.1;
const float ROLL = 8.0;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(
      oc * axis.x * axis.x + c,
      oc * axis.x * axis.y - axis.z * s,
      oc * axis.z * axis.x + axis.y * s,
      0.0,
      oc * axis.x * axis.y + axis.z * s,
      oc * axis.y * axis.y + c,
      oc * axis.y * axis.z - axis.x * s,
      0.0,
      oc * axis.z * axis.x - axis.y * s,
      oc * axis.y * axis.z + axis.x * s,
      oc * axis.z * axis.z + c,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

float map(float x, float a, float b, float c, float d) {
  return (x - a) * (d - c) / (b - a) + c;
}

void main(){
  vUv = uv;
  vTime = uTime;

  // 進捗範囲を`0.0 ~ 1.0`から最小値を半径分マイナスにする
  float progress = map(uAnime, 0.0, 1.0, RADIUS * -1.0, 1.0);

  // 回転量
  float angle = uAngle;

  vec3 pos = position;
  // Z軸ベクトルを基準に回転させ位置を中心に調整する
  pos = rotate(
    pos - vec3(-0.5, 0.5, 0.0), 
    vec3(0.0, 0.0, 1.0), 
    angle * -1.0
  ) + vec3(-0.5, 0.5, 0.0);
  
  // ローカル原点を右端にする、移動する範囲をangleに合わせる
  // `pos.x`の範囲`0.5 ~ 1.5`を`-1.9986 ≤ sin(angle) + cos(angle) ≤ 1.0016`にあわせる
  // その結果、`0.49984797903 ≤ offset ≤ -0.75026367436`となる
  float offset = (pos.x + 0.5) / (sin(angle) + cos(angle));

  // ロールする位置を設定
  pos.z = RADIUS + RADIUS * (1.0 - offset * 0.5) * sin(-offset * ROLL * PI - 0.5 * PI);
  pos.x =  -0.5 + RADIUS * (1.0 - offset * 0.5) * cos(-offset * ROLL * PI + 0.5 * PI);

  // ローカル原点で回転する状態からz軸ベクトル中心に回転するように補正する
  pos = rotate(
    pos - vec3(-0.5,0.5,0.0), 
    vec3(0.0,0.0,1.0),
    angle
  ) + vec3(-0.5,0.5,0.0);

  // 原点（中点）からになるように補正する、Z軸(上下)には半径(ベクトル)に合わせて正しい回転が得られるようにする
  pos = pos - vec3(-0.5,0.5, RADIUS);

  // ロールアニメーション
  pos = rotate(
    pos,
    vec3(sin(angle), cos(angle), 0.0), 
    -PI * progress * ROLL
  );

  // 並行移動のアニメーション
  pos += vec3(
    -0.5 + progress * cos(angle) * (sin(angle) + cos(angle)), 
    0.5 - progress * sin(angle) * (sin(angle) + cos(angle)),
    RADIUS * (1.0 - progress * 0.5)
  );

  // 平面とロールの位置を補完する
  float interpolationValue = (progress - offset * 0.95) * 100.0;
  float interpolation = clamp(
    interpolationValue,
    0.0,
    1.0
  );
  vec3 lastPosition = mix(pos, position, interpolation);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lastPosition * 1.0, 1.0 );

  // shadows
  vFrontShadow = clamp(
    interpolationValue,
    0.5,
    1.0
  );
}
