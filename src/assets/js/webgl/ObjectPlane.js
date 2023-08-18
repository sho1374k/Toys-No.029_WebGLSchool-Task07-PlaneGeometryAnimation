// module
import { Object } from "./Object";

// shader
import fragmentShader from "../../shader/frag/plane.glsl";
import vertexShader from "../../shader/vert/plane.glsl";

export class ObjectPlane extends Object {
  constructor(params, stage) {
    super(stage, fragmentShader, vertexShader);
    this.stage = stage;
    this.params = params;

    this.isCreated = false;
    this.isOpened = false;
    this.isClicked = false;
    this.isChange = true;
    this.isMatchMediaHover = window.matchMedia("(hover: hover)").matches;

    this.mesh = {};

    this.curve = {
      x: {
        target: 0,
        current: 0,
      },
      y: {
        target: 0,
        current: 0,
      },
      power: 0.3,
    };

    this.variable = {
      progress: 0.0,
      scale: 0.0,
      change: 0.0,
      status: {
        before: 1,
        after: 0,
      },
    };
  }

  /**
   * @param {number} width 板ポリの横幅
   * @param {number} height 板ポリの縦幅
   * @param {number} widthSegments 横の1辺を分割する数
   * @param {number} heightSegments 縦の1辺を分割する数
   */
  getPlaneGeometry(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    const w = width / 2;
    const h = height / 2;

    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);

    const limitGridX = gridX + 1;
    const limitGridY = gridY + 1;

    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;

    const indexList = [];
    const positionList = [];
    const normalList = [];
    const uvList = [];

    for (let iy = 0; iy < limitGridY; iy++) {
      const y = iy * segmentHeight - h;

      for (let ix = 0; ix < limitGridX; ix++) {
        const x = ix * segmentWidth - w;

        positionList.push(x, -y, 0);

        normalList.push(0, 0, 1);

        uvList.push(ix / gridX);
        uvList.push(1 - iy / gridY);
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + limitGridX * iy;
        const b = ix + limitGridX * (iy + 1);
        const c = ix + 1 + limitGridX * (iy + 1);
        const d = ix + 1 + limitGridX * iy;

        indexList.push(a, b, d);
        indexList.push(b, c, d);
      }
    }

    // prettier-ignore
    return { 
      position: positionList, 
      normal: normalList, 
      uv: uvList, 
      index: indexList 
    };
  }

  createMesh() {
    const gl = this.gl;

    // geometry作成
    this.mesh.geometry = this.getPlaneGeometry(1, 1, 32, 32);

    // BVO作成
    this.mesh.position = {
      array: this.createVBO(this.mesh.geometry.position),
      location: gl.getAttribLocation(this.program, "position"),
      stride: 3,
    };
    this.mesh.uv = {
      array: this.createVBO(this.mesh.geometry.uv),
      location: gl.getAttribLocation(this.program, "uv"),
      stride: 2,
    };
    this.mesh.normal = {
      array: this.createVBO(this.mesh.geometry.normal),
      location: gl.getAttribLocation(this.program, "normal"),
      stride: 3,
    };

    // IBO作成
    this.mesh.ibo = {
      data: this.createIBO(this.mesh.geometry.index),
      length: this.mesh.geometry.index.length,
    };

    // uniform作成
    this.createUniform("uMvpMatrix");
    this.createUniform("uCurve");
    this.createUniform("uTime");
    this.createUniform("uNormalMatrix");
    this.createUniform("uModelMatrix");
    this.createUniform("uEyePosition");
    this.createUniform("uPlaneAspect");
    this.createUniform("uTextureAspect");
    this.createUniform("uMatcap");
    this.createUniform("uTexture1");
    this.createUniform("uTexture2");
    this.createUniform("uProgress");
    this.createUniform("uNoise");
    this.createUniform("uScale");
    this.createUniform("uChange");
    this.createUniform("uFullScale");

    this.isCreated = true;
  }

  onMove(vector) {
    this.curve.x.target = vector.x.target;
    this.curve.y.target = vector.y.target;
  }

  resize(params) {}

  raf(time, vector) {
    const v = vector;
    const gl = this.stage.gl;
    if (this.isCreated) {
      super.raf(time);

      const m4 = this.m4;
      const v3 = this.v3;

      // ビュー座標変換行列
      const view = this.isOrbitCamera ? this.camera.update() : this.camera;

      // プロジェクション座標変換行列
      const fov = 45;
      const aspect = this.params.w / this.params.h;
      const near = 0.01;
      const far = 5000;
      const projection = this.createProjection(fov, aspect, near, far);

      // scale
      const rect = this.rectItem.getBoundingClientRect();
      const scaleX = rect.width;
      const scaleY = rect.height;
      const scaleZ = 1.0;
      const scale = v3.create(scaleX, scaleY, scaleZ);

      // translate
      const translateX =
        v.x.current * this.params.w * 0.5 * this.variable.status.before + 0 * this.variable.status.after;
      const translateY =
        v.y.current * this.params.h * 0.5 * this.variable.status.before + 0 * this.variable.status.after;
      const translateZ = (this.params.h / Math.tan((fov * Math.PI) / 360)) * 0.49 * -1; // 0.49: 0.5だとアスペクト比によっては1 ~ 2px隙間ができる...
      const translate = v3.create(translateX, translateY, translateZ);

      // モデル座標変換行列
      const rotateAxis = v3.create(1.0, 0.0, 0.0);
      let model = m4.translate(m4.identity(), translate); // 移動
      model = m4.scale(model, scale);
      model = m4.rotate(model, 0, rotateAxis);

      // 行列を乗算して MVP 行列を生成する（掛ける順序に注意）
      const vp = m4.multiply(projection, view);
      const mvp = m4.multiply(vp, model);

      // モデル座標行列の逆行列を作成
      const normalMatrix = m4.transpose(m4.inverse(model));

      const updateCurveValue = () => {
        const x = v.x.current;
        const y = v.y.current;

        // subtracts vector
        this.curve.x.current = x - this.curve.x.target;
        this.curve.y.current = y - this.curve.y.target;

        // multiply scalar
        this.curve.x.current *= this.curve.power * -1;
        this.curve.y.current *= this.curve.power * -1;

        this.updateUniform("uCurve", "v2", [this.curve.x.current, this.curve.y.current]);
      };
      updateCurveValue();

      // uniform更新
      this.updateUniform("uProgress", "f", this.variable.progress);
      this.updateUniform("uMvpMatrix", "m4", mvp);
      this.updateUniform("uNormalMatrix", "m4", normalMatrix);
      this.updateUniform("uModelMatrix", "m4", model);
      this.updateUniform("uEyePosition", "v3", this.camera.position);
      this.updateUniform("uTime", "f", time);
      this.updateUniform("uScale", "f", this.variable.scale);
      this.updateUniform("uChange", "f", this.variable.change);

      const fullScaleX = 1.0 * this.variable.status.before + (this.params.w / scaleX) * this.variable.status.after;
      const fullScaleY = 1.0 * this.variable.status.before + (this.params.h / scaleY) * this.variable.status.after;
      this.updateUniform("uFullScale", "v2", [fullScaleX, fullScaleY]);

      const textureAspect = scaleX / scaleY;
      const planeAspect =
        textureAspect * this.variable.status.before + (this.params.w / this.params.h) * this.variable.status.after;
      this.updateUniform("uPlaneAspect", "f", planeAspect);
      this.updateUniform("uTextureAspect", "f", textureAspect);

      // VBO設定
      this.updateVBO(this.mesh.position.array, this.mesh.position.location, this.mesh.position.stride);
      this.updateVBO(this.mesh.normal.array, this.mesh.normal.location, this.mesh.normal.stride);
      this.updateVBO(this.mesh.uv.array, this.mesh.uv.location, this.mesh.uv.stride);

      // IBO設定
      this.updateIBO(this.mesh.ibo.data);

      // テクスチャ設定
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture.current.img);
      this.updateUniform("uTexture1", "t", 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texture.before.img);
      this.updateUniform("uTexture2", "t", 1);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.matcap);
      this.updateUniform("uMatcap", "t", 2);

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.noise);
      this.updateUniform("uNoise", "t", 3);

      // 描画
      gl.drawElements(gl.TRIANGLES, this.mesh.ibo.length, gl.UNSIGNED_SHORT, 0);
      // gl.drawElements(gl.LINE_LOOP, this.mesh.ibo.length, gl.UNSIGNED_SHORT, 0); // debug
    }
  }

  toClickItem(ele, i) {
    const DURATION = 1;
    if (ele.classList.contains("is-active")) {
      // 閉じる
      ele.classList.remove("is-active");
      GSAP.to(this.variable.status, {
        duration: DURATION,
        before: 1,
        after: 0,
      });
      GSAP.to(this.variable, {
        duration: DURATION,
        scale: 0,
        onComplete: () => {
          this.isOpened = false;
        },
      });
    } else {
      if (this.isChange) {
        this.itemList.forEach((element) => {
          element.classList.remove("is-active");
        });
        ele.classList.add("is-active");

        if (this.isOpened) {
          // すでに開いている
          this.isChange = false;
          this.variable.change = 1.0;
          const current = this.texture.current;
          this.texture.before.img = current.img;
          this.texture.before.aspect = current.aspect;
          this.texture.current.img = this.createTexture(this.textureList[i].img);
          this.texture.current.aspect = this.textureList[i].aspect;

          GSAP.to(this.variable, {
            duration: DURATION,
            change: 0.0,
            onComplete: () => {
              this.isChange = true;
            },
          });
        } else {
          // 今から開く
          this.isOpened = true;
          GSAP.to(this.variable.status, {
            duration: DURATION,
            before: 0,
            after: 1,
          });
          GSAP.to(this.variable, {
            duration: DURATION,
            scale: 1,
          });
        }
      }
    }
  }

  toEnterItem(i) {
    if (!this.isOpened) {
      const current = this.texture.current;
      this.texture.before.img = current.img;
      this.texture.before.aspect = current.aspect;
      this.texture.current.img = this.createTexture(this.textureList[i].img);
      this.texture.current.aspect = this.textureList[i].aspect;
    }
  }

  async init() {
    console.log("🚀 ~ Plane init");

    this.matcap = await this.loadImg("assets/img/texture/matcap.jpg");
    this.matcap = this.createTexture(this.matcap);

    this.noise = await this.loadImg("assets/img/texture/noise.png");
    this.noise = this.createTexture(this.noise);

    this.imgList = [...document.querySelectorAll(".js-img")];
    this.textureList = [];
    this.textureList = await Promise.all(
      this.imgList.map((ele) => {
        return this.loadEleImg(ele);
      }),
    );

    this.texture = {
      before: {
        img: this.createTexture(this.textureList[0].img),
        aspect: this.textureList[0].aspect,
      },
      current: {
        img: this.createTexture(this.textureList[1].img),
        aspect: this.textureList[1].aspect,
      },
    };

    this.itemList = [...document.querySelectorAll(".js-item")];
    this.itemList.forEach((ele, i) => {
      if (this.isMatchMediaHover) {
        ele.addEventListener("mouseenter", (e) => {
          this.toEnterItem(i);
        });
      }
      ele.addEventListener("click", (e) => {
        this.toClickItem(ele, i);
      });
    });

    this.rectItem = document.getElementById("js-rect");

    this.setCulling();
    this.setDepthTest();
    this.createMesh();

    setTimeout(() => {
      const body = document.body;
      body.setAttribute("data-status", "enter");
    }, 300);

    if (GUI != null) {
      const gui = GUI.addFolder("plane");
      gui
        .add(this.variable, "progress", 0.0, 1.0)
        .name("uProgress")
        .onChange((value) => {
          this.variable.progress = value;
        });
    }
  }
}
