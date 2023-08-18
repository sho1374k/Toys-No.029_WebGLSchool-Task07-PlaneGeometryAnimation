import { WebGLMath } from "./WebGLMath.js";

// 短く書けるようにローカル変数に入れておく
const Vec2 = WebGLMath.Vec2;
const Vec3 = WebGLMath.Vec3;
const Mat4 = WebGLMath.Mat4;
const Qtn = WebGLMath.Qtn;

/**
 * three.js の OrbitControls に似た挙動のカメラ操作用ユーティリティクラス
 * @class
 */
export class WebGLOrbitCamera {
  /** @type {number} */
  static get DEFAULT_DISTANCE() {
    return 5.0;
  }
  /** @type {number} */
  static get DEFAULT_MIN_DISTANCE() {
    return 1.0;
  }
  /** @type {number} */
  static get DEFAULT_MAX_DISTANCE() {
    return 10.0;
  }
  /** @type {number} */
  static get DEFAULT_MOVE_SCALE() {
    return 2.0;
  }

  /**
   * @constructor
   * @param {HTMLElement} target - イベントを設定するターゲットエレメント
   * @param {object} [option={}]
   * @property {number} option.distance - カメラの原点からの距離
   * @property {number} option.min - カメラが原点に寄れる最小距離
   * @property {number} option.max - カメラが原点から離れられる最大距離
   * @property {number} option.move - カメラが平行移動する際のスケール
   */
  constructor(target, option = {}) {
    this.target = target;
    this.distance = option.distance || WebGLOrbitCamera.DEFAULT_DISTANCE;
    this.minDistance = option.min || WebGLOrbitCamera.DEFAULT_MIN_DISTANCE;
    this.maxDistance = option.max || WebGLOrbitCamera.DEFAULT_MAX_DISTANCE;
    this.moveScale = option.move || WebGLOrbitCamera.DEFAULT_MOVE_SCALE;
    this.position = Vec3.create(0.0, 0.0, this.distance);
    this.center = Vec3.create(0.0, 0.0, 0.0);
    this.upDirection = Vec3.create(0.0, 1.0, 0.0);
    this.defaultPosition = Vec3.create(0.0, 0.0, this.distance);
    this.defaultCenter = Vec3.create(0.0, 0.0, 0.0);
    this.defaultUpDirection = Vec3.create(0.0, 1.0, 0.0);
    this.movePosition = Vec3.create(0.0, 0.0, 0.0);
    this.rotateX = 0.0;
    this.rotateY = 0.0;
    this.scale = 0.0;
    this.isDown = false;
    this.prevPosition = Vec2.create(0, 0);
    this.offsetPosition = Vec2.create(0, 0);
    this.qt = Qtn.create();
    this.qtx = Qtn.create();
    this.qty = Qtn.create();

    // self binding
    this.mouseInteractionStart = this.mouseInteractionStart.bind(this);
    this.mouseInteractionMove = this.mouseInteractionMove.bind(this);
    this.mouseInteractionEnd = this.mouseInteractionEnd.bind(this);
    this.wheelScroll = this.wheelScroll.bind(this);

    // event
    this.target.addEventListener(
      "mousedown",
      this.mouseInteractionStart,
      false
    );
    this.target.addEventListener("mousemove", this.mouseInteractionMove, false);
    this.target.addEventListener("mouseup", this.mouseInteractionEnd, false);
    this.target.addEventListener("wheel", this.wheelScroll, false);
    this.target.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
      },
      false
    );
  }

  /**
   * マウスボタンが押された際のイベント
   */
  mouseInteractionStart(event) {
    this.isDown = true;
    const bound = this.target.getBoundingClientRect();
    this.prevPosition = Vec2.create(
      event.clientX - bound.left,
      event.clientY - bound.top
    );
  }

  /**
   * マウスが移動した際のイベント
   */
  mouseInteractionMove(event) {
    if (this.isDown !== true) {
      return;
    }
    const bound = this.target.getBoundingClientRect();
    const w = bound.width;
    const h = bound.height;
    const x = event.clientX - bound.left;
    const y = event.clientY - bound.top;
    const s = 1.0 / Math.min(w, h);
    this.offsetPosition = Vec2.create(
      x - this.prevPosition[0],
      y - this.prevPosition[1]
    );
    this.prevPosition = Vec2.create(x, y);
    switch (event.buttons) {
      case 1: // 左ボタン
        this.rotateX += this.offsetPosition[0] * s;
        this.rotateY += this.offsetPosition[1] * s;
        this.rotateX = this.rotateX % 1.0;
        this.rotateY = Math.min(Math.max(this.rotateY % 1.0, -0.25), 0.25);
        break;
      case 2: // 右ボタン
        const eyeOffset = Vec3.create(
          this.offsetPosition[0],
          -this.offsetPosition[1],
          0.0
        );
        const rotateEye = Qtn.toVecIII(eyeOffset, this.qt);
        this.movePosition[0] -= rotateEye[0] * s * this.moveScale;
        this.movePosition[1] -= rotateEye[1] * s * this.moveScale;
        this.movePosition[2] -= rotateEye[2] * s * this.moveScale;
        break;
    }
  }

  /**
   * マウスボタンが離された際のイベント
   */
  mouseInteractionEnd(event) {
    this.isDown = false;
  }

  /**
   * スクロール操作に対するイベント
   */
  wheelScroll(event) {
    const w = event.wheelDelta;
    if (w > 0) {
      this.scale = -0.5;
    } else if (w < 0) {
      this.scale = 0.5;
    }
  }

  /**
   * 現在のパラメータからビュー行列を生成して返す
   * @return {Mat4}
   */
  update() {
    const PI2 = Math.PI * 2.0;
    const v = Vec3.create(1.0, 0.0, 0.0);
    const u = Vec3.create(0.0, 1.0, 0.0);
    // scale
    this.scale *= 0.7;
    this.distance += this.scale;
    this.distance = Math.min(
      Math.max(this.distance, this.minDistance),
      this.maxDistance
    );
    this.defaultPosition[2] = this.distance;
    // rotate
    Qtn.identity(this.qt);
    Qtn.identity(this.qtx);
    Qtn.identity(this.qty);
    Qtn.rotate(this.rotateX * PI2, u, this.qtx);
    Qtn.toVecIII(v, this.qtx, v);
    Qtn.rotate(this.rotateY * PI2, v, this.qty);
    Qtn.multiply(this.qtx, this.qty, this.qt);
    Qtn.toVecIII(this.defaultPosition, this.qt, this.position);
    Qtn.toVecIII(this.defaultUpDirection, this.qt, this.upDirection);
    // translate
    this.position[0] += this.movePosition[0];
    this.position[1] += this.movePosition[1];
    this.position[2] += this.movePosition[2];
    this.center[0] = this.defaultCenter[0] + this.movePosition[0];
    this.center[1] = this.defaultCenter[1] + this.movePosition[1];
    this.center[2] = this.defaultCenter[2] + this.movePosition[2];

    return Mat4.lookAt(this.position, this.center, this.upDirection);
  }
}
