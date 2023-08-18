import { WebGLMath } from "./doxas/WebGLMath";

/**
 * @class プログラムオブジェクトを作成する継承元
 */
export class Object {
  /**
   * @param {WebGLRenderingContext} gl WebGLコンテキスト
   * @param {source} fragment ピクセルシェーダ
   * @param {source} vertex 頂点シェーダ
   */
  constructor(stage, fragment, vertex) {
    this.gl = stage.gl;
    this.canvas = stage.canvas;
    this.isOrbitCamera = stage.isOrbitCamera;
    this.camera = stage.camera;

    this.drawCount = null;
    this.uniforms = {};

    const vs = this.createFragmentShader(fragment);
    const fs = this.createVertexShader(vertex);
    this.program = this.createProgramObject(vs, fs);

    // バックフェイスカリングと深度テストは初期状態で有効
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.v2 = WebGLMath.Vec2;
    this.v3 = WebGLMath.Vec3;
    this.m4 = WebGLMath.Mat4;
    this.qtn = WebGLMath.Qtn;
  }

  /**
   * シェーダオブジェクトを生成
   * @param {WebGLRenderingContext} gl WebGLコンテキスト
   * @param {source} source シェーダ
   * @param {number} type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @returns {WebGLShader}
   */
  createShaderObject(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    } else {
      throw new Error(gl.getShaderInfoLog(shader));
      return null;
    }
  }

  /**
   * ピクセルシェーダを生成
   * @param {source} source ピクセルシェーダ
   * @returns {WebGLShader}
   */
  createFragmentShader(source) {
    console.log("🙌 ~ create fragment");
    const gl = this.gl;
    return this.createShaderObject(gl, source, gl.FRAGMENT_SHADER);
  }

  /**
   * 頂点シェーダを生成
   * @param {souce} source 頂点シェーダ
   * @returns {WebGLShader}
   */
  createVertexShader(source) {
    console.log("🙌 ~ create vertex");
    const gl = this.gl;
    return this.createShaderObject(gl, source, gl.VERTEX_SHADER);
  }

  /**
   * プログラムオブジェクトを生成
   * @param {WebGLShader} vs 頂点シェーダ
   * @param {WebGLShader} fs ピクセルシェーダ
   * @returns {WebGLProgram}
   */
  createProgramObject(vs, fs) {
    const gl = this.gl;
    const program = gl.createProgram();

    // シェーダをアタッチ（関連付け）する
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    // シェーダオブジェクトをリンクする
    gl.linkProgram(program);

    // リンクが完了するとシェーダオブジェクトは不要になるので削除する
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program);
      return program;
    } else {
      throw new Error(gl.getProgramInfoLog(program));
      return null;
    }
  }

  /**
   * IBOを生成
   * @param {Array} indexArray 頂点インデックスの結び順の配列
   * @return {WebGLBuffer}
   */
  createIBO(indexArray) {
    const gl = this.gl;
    // 空のバッファオブジェクトを生成する
    const ibo = gl.createBuffer();
    // バッファを gl.ELEMENT_ARRAY_BUFFER としてバインドする
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // バインドしたバッファに Int16Array オブジェクトに変換した配列を設定する
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexArray), gl.STATIC_DRAW);
    // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
  }

  /**
   * IBOを更新
   * @param {WebGLBuffer} ibo - インデックスバッファ
   */
  updateIBO(ibo) {
    const gl = this.gl;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  }

  /**
   * 配列から VBO（Vertex Buffer Object）を生成する
   * @param {Array.<number>} vertexArray - 頂点属性情報の配列
   * @return {WebGLBuffer}
   */
  createVBO(vertexArray) {
    const gl = this.gl;
    // 空のバッファオブジェクトを生成する
    const vbo = gl.createBuffer();
    // バッファを gl.ARRAY_BUFFER としてバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // バインドしたバッファに Float32Array オブジェクトに変換した配列を設定する
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
    // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  }

  /**
   * VBOを有効化
   * @param {WebGLBuffer} vbo 頂点属性を格納した頂点バッファの配列
   * @param {number} location 頂点属性ロケーション
   * @param {number} stride 分割数
   */
  updateVBO(vbo, location, stride) {
    const gl = this.gl;
    // 有効化したいバッファをまずバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // 頂点属性ロケーションの有効化を行う
    gl.enableVertexAttribArray(location);
    // 対象のロケーションのストライドやデータ型を設定する
    gl.vertexAttribPointer(location, stride, gl.FLOAT, false, 0, 0);
  }

  getUniform(name) {
    const gl = this.gl;
    const program = this.program;
    const location = gl.getUniformLocation(program, name);
    return gl.getUniform(program, location);
  }

  /**
   * unifrom値を設定
   * @param {string} name 変数名
   * @param {string} type 型タイプ
   * @param {any} value 値
   */
  createUniform(name, type, value) {
    const gl = this.gl;
    const program = this.program;
    this.uniforms[name] = gl.getUniformLocation(program, name);
  }

  /**
   * unifrom値を更新
   * @param {string} name 変数名
   * @param {string} type 型タイプ
   * @param {any} value 値
   * 変数の文字列タイプ（少し前の three.js 文字列変数）:  https://qiita.com/kitasenjudesign/items/1657d9556591284a43c8
   * uniformで利用するデータの型: https://webglfundamentals.org/webgl/lessons/ja/webgl-shaders-and-glsl.html
   */
  updateUniform(name, type, value, transpose = false) {
    const gl = this.gl;
    switch (type) {
      case "t":
        gl.uniform1i(this.uniforms[name], value); // sampler2D (テクスチャ)
        break;
      case "i":
        gl.uniform1i(this.uniforms[name], value); // int:１つの整数
        break;
      case "f":
        gl.uniform1f(this.uniforms[name], value); // float: １つの浮動小数点
        break;
      case "v1":
        gl.uniform1fv(this.uniforms[name], value); // vec1: １つの浮動小数点を配列に入れたもの
        break;
      case "v2":
        gl.uniform2fv(this.uniforms[name], value); // vec2: ２つの浮動小数点を配列にいれたもの
        break;
      case "v3":
        gl.uniform3fv(this.uniforms[name], value); // vec3: ３つの浮動小数点を配列にいれたもの
        break;
      case "v4":
        gl.uniform4fv(this.uniforms[name], value); // vec4: ４つの浮動小数点を配列にいれたもの
        break;
      case "m2":
        gl.uniformMatrix2fv(this.uniforms[name], transpose, value); // mat2: 配列で表現された 2x2 の行列
        break;
      case "m3":
        gl.uniformMatrix3fv(this.uniforms[name], transpose, value); // mat3: 配列で表現された 3x3 の行列
        break;
      case "m4":
        gl.uniformMatrix4fv(this.uniforms[name], transpose, value); // mat4: 配列で表現された 4x4 の行列
        break;
      default:
        throw new Error("type is not defined");
        break;
    }
  }

  /**
   *
   * @param {number} fov field of view 垂直視野
   * @param {number} aspect 画面のアスペクト比
   * @param {number} near 一番近い距離
   * @param {number} far 一番遠い距離
   * @returns
   */
  createProjection(fov = 45, aspect = window.innerWidth / window.innerHeight, near = 0.1, far = 10.0) {
    return this.m4.perspective(fov, aspect, near, far);
  }

  /**
   *
   * @param {element} ele // imgタグ
   * @returns {Promise} objデータを返す
   */
  loadEleImg(ele) {
    return new Promise((resolve) => {
      const src = ele.getAttribute("src");
      const w = ele.getAttribute("width");
      const h = ele.getAttribute("height");

      const img = new Image();
      img.src = src;
      img.addEventListener("load", (e) => {
        const data = {
          img: img,
          src: src,
          w: w,
          h: h,
          aspect: w / h,
        };
        return resolve(data);
      });
    });
  }

  /**
   *
   * @param {path} path // 画像パス
   * @returns {Promise} objデータを返す
   */
  loadImg(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = path;
      img.addEventListener("load", (e) => {
        return resolve(img);
      });
    });
  }

  /**
   * テクスチャ用のリソースからテクスチャを生成する
   * @param {any} resource - 画像や HTMLCanvasElement などのテクスチャ用リソース
   * @return {WebGLTexture}
   */
  createTexture(resource) {
    const gl = this.gl;
    // テクスチャオブジェクトを生成
    const texture = gl.createTexture();
    // アクティブなテクスチャユニット番号を指定する
    gl.activeTexture(gl.TEXTURE0);
    // テクスチャをアクティブなユニットにバインドする
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // バインドしたテクスチャにデータを割り当て
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource);
    // ミップマップを自動生成する
    gl.generateMipmap(gl.TEXTURE_2D);
    // テクスチャパラメータを設定する
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // 安全の為にテクスチャのバインドを解除してから返す
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  /**
   * バックフェイスカリングを設定する
   * @param {boolean} bool
   * @returns
   */
  setCulling(bool = true) {
    const gl = this.gl;
    return bool ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
  }

  /**
   * 深度テストを設定する
   * @param {boolean} bool - 設定する値
   */
  setDepthTest(bool = true) {
    const gl = this.gl;
    bool ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
  }

  raf() {
    if (this.program != null) this.gl.useProgram(this.program);
  }
}
