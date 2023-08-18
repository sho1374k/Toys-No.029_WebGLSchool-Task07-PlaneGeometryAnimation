// lib
import { WebGLMath } from "./doxas/WebGLMath.js";
import { WebGLOrbitCamera } from "./doxas/WebGLOrbitCamera";

export class Stage {
  constructor(params, isClearColor = true, isOrbitCamera = true) {
    this.gl = null; // WebGLRenderingContext
    this.canvas = null; // HTMLCanvasElement
    this.camera = null;
    this.isClearColor = isClearColor;
    this.isOrbitCamera = isOrbitCamera;
    this.params = params;
    this.params.color = {
      r: 1,
      g: 1,
      b: 1,
      a: 1,
    };

    this.v3 = WebGLMath.Vec3;
    this.m4 = WebGLMath.Mat4;
  }

  createWebGLContext() {
    // WebGL コンテキストを初期化する
    const gl = this.canvas.getContext("webgl");
    if (gl == null) {
      throw new Error("webgl not supported");
      return null;
    } else {
      return gl;
    }
  }

  /**
   * canvasのサイズを設定
   * @param {number} w
   * @param {number} h
   */
  setSize(w = window.innerWidth, h = window.innerHeight) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  /**
   * canvas内でのWebGLのviewportの設定
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  setViewport(x = 0, y = 0, w = this.canvas.width, h = this.canvas.height) {
    this.gl.viewport(x, y, w, h);
  }

  /**
   * クリアする色を設定
   * @param {object} color {r, g, b, a};
   */
  setClearColor(color = { r: 1, g: 1, b: 1, a: 1 }) {
    this.params.color = color;
    this.gl.clearColor(this.params.color.r, this.params.color.g, this.params.color.b, this.params.color.a);
    this.gl.clearDepth(1.0);
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clear(gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  setCamera() {
    if (this.isOrbitCamera) {
      this.camera = new WebGLOrbitCamera(this.canvas, {
        distance: 5.0, // Z 軸上の初期位置までの距離
        min: 0.1, // カメラが寄れる最小距離
        max: 10.0, // カメラが離れられる最大距離
        move: 2.0, // 右ボタンで平行移動する際の速度係数
      });
    } else {
      const eye = this.v3.create(0.0, 0.0, 5.0); // カメラの位置
      const center = this.v3.create(0.0, 0.0, 0.0); // カメラの注視点
      const upDirection = this.v3.create(0.0, 1.0, 0.0); // カメラの天面の向き
      this.camera = this.m4.lookAt(eye, center, upDirection);
      this.camera.position = eye;
    }
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  resize(w = window.innerWidth, h = window.innerHeight) {
    this.setSize(w, h);
    this.setViewport();
  }

  raf() {
    if (this.isClearColor) {
      this.setClearColor();
    } else {
      this.gl.clearDepth(1.0);
      this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }

    this.setViewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * @param {HTMLElement} canvas WebGLを内包するcanvas要素
   */
  init(canvas, w = window.innerWidth, h = window.innerHeight) {
    console.log("🚀 ~ Stage init");
    this.canvas = canvas;
    this.gl = this.createWebGLContext(this.canvas);
    this.setSize(w, h);
    this.setViewport(0, 0, this.canvas.width, this.canvas.height);
    if (this.isClearColor) this.setClearColor();
    this.setCamera();
  }
}
