// --------------------------

// lib

// --------------------------
import * as THREE from "three";

// --------------------------

// shaders

// --------------------------
import fragmentShader from "../../shaders/fragment.glsl";
import vertexShader from "../../shaders/vertex.glsl";

// --------------------------

// module

// --------------------------
import { TextureLoad } from "./utility/TextureLoad";

const DURATION = 2.4;
const EASE = "power2.inOut";

export class Mesh {
  constructor(body, params, bool, stage) {
    this.body = body;
    this.stage = stage;
    this.params = params;
    this.bool = bool;

    this.isInit = false;

    this.group = null;
    this.mesh = null;

    this.isAnime = true;

    this.init();
  }

  TextureLoader(src) {
    return new THREE.TextureLoader().loadAsync(src);
  }

  /**
   *
   * @param {element} ele // imgタグ
   * @returns objデータを返す
   */
  loadImg(ele) {
    const src = ele.getAttribute("src");
    const w = ele.getAttribute("width");
    const h = ele.getAttribute("height");

    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.addEventListener("load", (e) => {
        const data = {
          img: img,
          src: src,
          texture: TextureLoad(src),
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
   * @param {element} ele // imgタグ
   * @returns objデータを返す
   */
  loadVideo(ele) {
    const src = ele.getAttribute("src");
    const w = ele.getAttribute("width");
    const h = ele.getAttribute("height");

    return new Promise((resolve) => {
      ele.play();
      const data = {
        ele: ele,
        src: src,
        texture: new THREE.VideoTexture(ele),
        w: w,
        h: h,
        aspect: w / h,
      };
      data.texture.encoding = THREE.sRGBEncoding;
      return resolve(data);
    });
  }

  async init() {
    // 画像データ作成
    // this.imgDataList = [];
    // this.imgList = [...document.querySelectorAll(".js-img")];
    // console.log(this.imgList);
    // this.imgDataList = await Promise.all(
    //   this.imgList.map((ele) => {
    //     return this.loadImg(ele);
    //   }),
    // );

    this.imgDataList = [];
    this.imgList = [...document.querySelectorAll(".js-video")];
    this.imgDataList = await Promise.all(
      this.imgList.map((ele) => {
        return this.loadVideo(ele);
      }),
    );

    await G.delay(0);
    this.slideConfig = {
      current: 0,
      max: this.imgDataList.length - 1,
    };

    this.createGroup();
    this.createPlaneGeometry();
    this.createMesh();

    this.setDomSystem();
    this.setInteractive();

    this.setAutoPlay();

    await G.delay(300);
    this.body.setAttribute("data-status", "enter");
  }

  toDown(e) {
    if (!this.isDown && this.isAnime) {
      clearTimeout(this.timerDown);
      this.isDown = true;
      this.vector.start.x = e.touches ? e.touches[0].clientX : e.clientX;
      // this.vector.start.y = e.touches ? e.touches[0].clientY : e.clientY;
    }
  }

  toDownMove(e) {
    const DURATION_DOWN = 50;
    const THRESHOLD = 0.5;

    let nextIndex;

    if (this.isDown && this.isAnime) {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      // const y = e.touches ? e.touches[0].clientY : e.clientY;

      this.vector.target.x = this.vector.start.x - x;
      // this.vector.target.y = this.vector.start.x - y;

      if (this.vector.target.x > 10 || this.vector.target.x < -10) {
        // アニメーションのディレクションを決める
        if (this.isDirectionOnced) {
          this.isDirectionOnced = false;

          // 現在のナビゲーションの`is-active`を解除
          if (this.naviList[this.slideConfig.current].classList.contains("is-active")) {
            this.naviList[this.slideConfig.current].classList.remove("is-active");
          }

          if (this.vector.target.x > 0) {
            // console.log("+ : 右 → 左");
            this.isDirectionNext = true;

            // 次のindex番号を設定
            nextIndex = this.slideConfig.current - 1;
            if (nextIndex < 0) nextIndex = this.imgDataList.length - 2;

            const current = this.group.children[this.slideConfig.current];
            const next = this.group.children[nextIndex];

            // uniform変数更新
            current.material.uniforms.uAnime.value = 1.0;
            current.renderOrder = 2;
            current.material.uniforms.uTexture.value = this.imgDataList[this.slideConfig.current].texture;
            current.material.uniforms.uTextureAspect.value = this.imgDataList[this.slideConfig.current].aspect;

            next.material.uniforms.uAnime.value = 1.0;
            next.renderOrder = 1;
            next.material.uniforms.uTexture.value = this.imgDataList[nextIndex].texture;
            next.material.uniforms.uTextureAspect.value = this.imgDataList[nextIndex].aspect;

            // 動画再生時間を0にする
            this.imgDataList[nextIndex].ele.currentTime = 0;
          } else {
            // console.log("- 左 → 右");
            this.isDirectionNext = false;

            // 次のindex番号を設定
            nextIndex = this.slideConfig.current + 1;
            if (nextIndex > this.slideConfig.max) nextIndex = 0;

            const current = this.group.children[this.slideConfig.current];
            const next = this.group.children[nextIndex];

            // uniform変数更新
            current.material.uniforms.uAnime.value = 1.0;
            current.renderOrder = 1;
            current.material.uniforms.uTexture.value = this.imgDataList[this.slideConfig.current].texture;
            current.material.uniforms.uTextureAspect.value = this.imgDataList[this.slideConfig.current].aspect;

            next.material.uniforms.uAnime.value = 0.0;
            next.renderOrder = 2;
            next.material.uniforms.uTexture.value = this.imgDataList[nextIndex].texture;
            next.material.uniforms.uTextureAspect.value = this.imgDataList[nextIndex].aspect;

            // 動画再生時間を0にする
            this.imgDataList[nextIndex].ele.currentTime = 0;
            console.log(nextIndex);

          }
        }

        // 進捗アニメーション値を格納する
        this.vector.current.x = G.clamp(Math.abs(this.vector.target.x / this.params.w) * 3, 0.0, THRESHOLD);

        if (this.isDirectionNext) {
          nextIndex = this.slideConfig.current - 1;
          if (nextIndex < 0) nextIndex = this.imgDataList.length - 2;
          GSAP.to(this.group.children[this.slideConfig.current].material.uniforms.uAnime, {
            duration: 1,
            value: 1.0 - this.vector.current.x,
          });
        } else {
          nextIndex = this.slideConfig.current + 1;
          if (nextIndex > this.slideConfig.max) nextIndex = 0;
          GSAP.to(this.group.children[nextIndex].material.uniforms.uAnime, {
            duration: 1,
            value: this.vector.current.x,
          });
        }

        // 自動再生を解除
        clearTimeout(this.timerAutoPlay);
        // nextボタンの進捗を解除
        if (this.nextBtn.classList.contains("is-active")) {
          this.nextBtn.classList.remove("is-active");
        }

        clearTimeout(this.timerDown);
        this.timerDown = setTimeout(() => {
          this.isDown = false;
          this.isAnime = false;

          if (this.isDirectionNext) {
            const current = this.group.children[this.slideConfig.current];
            console.log(current.material.uniforms.uAnime.value, THRESHOLD);
            if (current.material.uniforms.uAnime.value < THRESHOLD) {
              clearTimeout(this.timerAutoPlay);
              this.naviList[this.slideConfig.current].classList.add("is-active");
              this.updateBodyData(this.slideConfig.current);

              GSAP.to(current.material.uniforms.uAnime, {
                duration: DURATION,
                value: 1.0,
                ease: EASE,
                onComplete: () => {
                  this.isAnime = true;
                  this.isDown = false;
                  this.isDirectionOnced = true;

                  this.setAutoPlay();
                },
              });
            } else {
              console.log("timer next before");
              // 戻す

              GSAP.to(current.material.uniforms.uAnime, {
                duration: DURATION,
                value: 0.0,
                ease: EASE,
                onComplete: () => {
                  nextIndex = this.slideConfig.current - 1;
                  if (nextIndex < 0) nextIndex = this.slideConfig.max;

                  const current = this.group.children[this.slideConfig.current];
                  const next = this.group.children[nextIndex];

                  // uniform変数更新
                  current.material.uniforms.uAnime.value = 0.0;
                  current.renderOrder = 2;
                  current.material.uniforms.uTexture.value = this.imgDataList[this.slideConfig.current].texture;
                  current.material.uniforms.uTextureAspect.value = this.imgDataList[this.slideConfig.current].aspect;

                  next.material.uniforms.uAnime.value = 1.0;
                  next.renderOrder = 1;
                  next.material.uniforms.uTexture.value = this.imgDataList[nextIndex].texture;
                  next.material.uniforms.uTextureAspect.value = this.imgDataList[nextIndex].aspect;

                  // shaderのテクスチャ情報更新
                  // current.material.uniforms.uTexture2.value = this.imgDataList[this.slideConfig.current].texture;
                  // current.material.uniforms.uTexture1.value = this.imgDataList[nextIndex].texture;
                  // current.material.uniforms.uTextureAspect2.value = this.imgDataList[this.slideConfig.current].aspect;
                  // current.material.uniforms.uTextureAspect1.value = this.imgDataList[nextIndex].aspect;

                  this.slideConfig.current--;
                  if (this.slideConfig.current < 0) this.slideConfig.current = this.slideConfig.max;

                  this.isAnime = true;
                  this.isDown = false;
                  this.isDirectionOnced = true;
                  this.naviList[this.slideConfig.current].classList.add("is-active");
                  this.updateBodyData(this.slideConfig.current);

                  this.setAutoPlay();
                },
              });
            }
          } else {
            const next = this.group.children[nextIndex];
            console.log(next.material.uniforms.uAnime.value , 1.0 - THRESHOLD);
            if (next.material.uniforms.uAnime.value + 0.1 < 1.0 - THRESHOLD) {
              console.log("timer prev after");
              this.naviList[this.slideConfig.current].classList.add("is-active");
              this.updateBodyData(this.slideConfig.current);

              GSAP.to(next.material.uniforms.uAnime, {
                duration: DURATION,
                value: 0.0,
                ease: EASE,
                onComplete: () => {
                  this.isAnime = true;
                  this.isDown = false;
                  this.isDirectionOnced = true;

                  this.setAutoPlay();
                },
              });
            } else {
              // 戻す
              console.log("timer prev before");

              GSAP.to(next.material.uniforms.uAnime, {
                duration: DURATION,
                value: 1.0,
                ease: EASE,
                onComplete: () => {
                  this.isAnime = true;
                  this.isDown = false;
                  this.isDirectionOnced = true;

                  nextIndex = this.slideConfig.current + 1;
                  if (nextIndex > this.slideConfig.max) nextIndex = 0;

                  const current = this.group.children[this.slideConfig.current];
                  const next = this.group.children[nextIndex];

                  // // shaderのテクスチャ情報更新
                  // current.material.uniforms.uTexture1.value = this.imgDataList[this.slideConfig.current].texture;
                  // current.material.uniforms.uTexture2.value = this.imgDataList[nextIndex].texture;
                  // current.material.uniforms.uTextureAspect1.value = this.imgDataList[this.slideConfig.current].aspect;
                  // current.material.uniforms.uTextureAspect2.value = this.imgDataList[nextIndex].aspect;

                  // uniform変数更新
                  current.material.uniforms.uAnime.value = 1.0;
                  current.renderOrder = 1;
                  current.material.uniforms.uTexture.value = this.imgDataList[this.slideConfig.current].texture;
                  current.material.uniforms.uTextureAspect.value = this.imgDataList[this.slideConfig.current].aspect;

                  next.material.uniforms.uAnime.value = 1.0;
                  next.renderOrder = 2;
                  next.material.uniforms.uTexture.value = this.imgDataList[nextIndex].texture;
                  next.material.uniforms.uTextureAspect.value = this.imgDataList[nextIndex].aspect;

                  // 現在地の更新
                  this.slideConfig.current++;
                  if (this.slideConfig.current > this.slideConfig.max) this.slideConfig.current = 0;
                  this.naviList[this.slideConfig.current].classList.add("is-active");

                  this.updateBodyData(this.slideConfig.current);

                  this.setAutoPlay();
                },
              });
            }
          }
        }, DURATION_DOWN);
      }
    }
  }

  toUp(e) {
    this.isDown = false;
  }

  setInteractive() {
    const DURATION_NEXT_SLIDE = 2000;
    this.timerNextSlide = null;
    this.isNextSlide = true;
    window.addEventListener("wheel", (e) => {
      const y = e.deltaY;

      if (this.isNextSlide && this.isAnime) {
        this.isAnime = false;
        this.isNextSlide = false;
        if (y > 0) {
          // console.log("down");
          this.updateSlide("+");
        } else {
          // console.log("up");
          this.updateSlide("-");
        }
        clearTimeout(this.timerNextSlide);
        this.timerNextSlide = setTimeout(() => {
          clearTimeout(this.timerNextSlide);
          this.isNextSlide = true;
        }, DURATION_NEXT_SLIDE);
      }
    });

    this.isDown = false;
    this.timerDown = null;
    this.isDirectionOnced = true;
    this.isDirectionNext = true;
    this.nextIndex = 0;

    this.vector = {
      start: {
        x: 0,
        y: 0,
      },
      target: {
        x: 0,
        y: 0,
      },
      current: {
        x: 0,
        y: 0,
      },
    };

    if (this.bool.isMatchMediaHover) {
      window.addEventListener("mousedown", this.toDown.bind(this), { passive: true });
      window.addEventListener("mousemove", this.toDownMove.bind(this), { passive: true });
      window.addEventListener("mouseup", this.toUp.bind(this));
    } else {
      window.addEventListener("touchstart", this.toDown.bind(this), { passive: true });
      window.addEventListener("touchmove", this.toDownMove.bind(this), { passive: true });
      window.addEventListener("touchend", this.toUp.bind(this));
    }
  }

  updateBodyData(value) {
    this.body.setAttribute("data-webgl-carousel-current", value);
  }

  /**
   *
   * @param {string} direction // 進行方向: "+" or "-"
   * @param {number} nextIndex // 次のスライドindex番号を指定する
   */
  updateSlide(direction = "+", nextIndex = null) {
    // 自動再生を解除
    clearTimeout(this.timerAutoPlay);

    // 現在のナビゲーションの`is-active`を解除
    if (this.naviList[this.slideConfig.current].classList.contains("is-active")) {
      this.naviList[this.slideConfig.current].classList.remove("is-active");
    }

    // 進行方向によって処理を分ける
    if (direction === "+") {
      // 次の指定がなければ`+1`する
      if (nextIndex === null) {
        nextIndex = this.slideConfig.current + 1;
        if (nextIndex > this.slideConfig.max) nextIndex = 0;
      }

      const current = this.group.children[this.slideConfig.current];
      const next = this.group.children[nextIndex];

      // uniform変数更新
      current.material.uniforms.uAnime.value = 1.0;
      current.renderOrder = 2;
      current.material.uniforms.uTexture.value = this.imgDataList[this.slideConfig.current].texture;
      current.material.uniforms.uTextureAspect.value = this.imgDataList[this.slideConfig.current].aspect;

      next.material.uniforms.uAnime.value = 1.0;
      next.renderOrder = 1;
      next.material.uniforms.uTexture.value = this.imgDataList[nextIndex].texture;
      next.material.uniforms.uTextureAspect.value = this.imgDataList[nextIndex].aspect;

      // 動画再生時間を0にする
      this.imgDataList[nextIndex].ele.currentTime = 0;

      // shaderの補完値を更新、その後クリックを許可する
      GSAP.to(current.material.uniforms.uAnime, {
        duration: DURATION,
        value: 0.0,
        ease: EASE,
        onComplete: () => {
          this.isAnime = true;
          this.isClickUI = true;

          // 自動再生を有効化
          this.setAutoPlay();
        },
      });

      // 現在地の更新
      this.slideConfig.current++;
      if (this.slideConfig.current > this.slideConfig.max) this.slideConfig.current = 0;
    } else {
      // 次の指定がなければ`-1`する
      if (nextIndex === null) {
        nextIndex = this.slideConfig.current - 1;
        if (nextIndex < 0) nextIndex = this.slideConfig.max;
      }

      const current = this.group.children[this.slideConfig.current];
      const next = this.group.children[nextIndex];

      // uniform変数更新
      current.material.uniforms.uAnime.value = 1.0;
      current.renderOrder = 1;
      current.material.uniforms.uTexture.value = this.imgDataList[this.slideConfig.current].texture;
      current.material.uniforms.uTextureAspect.value = this.imgDataList[this.slideConfig.current].aspect;

      next.material.uniforms.uAnime.value = 0.0;
      next.renderOrder = 2;
      next.material.uniforms.uTexture.value = this.imgDataList[nextIndex].texture;
      next.material.uniforms.uTextureAspect.value = this.imgDataList[nextIndex].aspect;

      // 動画再生時間を0にする
      this.imgDataList[nextIndex].ele.currentTime = 0;

      GSAP.to(next.material.uniforms.uAnime, {
        duration: DURATION,
        value: 1.0,
        ease: EASE,
        onComplete: () => {
          this.isAnime = true;
          this.isClickUI = true;

          // 自動再生を有効化
          this.setAutoPlay();
        },
      });

      this.slideConfig.current--;
      if (this.slideConfig.current < 0) this.slideConfig.current = this.slideConfig.max;
    }

    if (nextIndex != null) {
      this.slideConfig.current = nextIndex;
    }
    this.naviList[this.slideConfig.current].classList.add("is-active");
    this.updateBodyData(this.slideConfig.current);

    // nextボタンの進捗を解除
    if (this.nextBtn.classList.contains("is-active")) {
      this.nextBtn.classList.remove("is-active");
    }
  }

  setDomSystem() {
    this.isClickUI = true;
    // prevボタン
    this.prevBtn = document.getElementById("prevBtn");
    this.prevBtn.addEventListener("click", (e) => {
      if (this.isClickUI && this.isAnime) {
        this.isAnime = false;
        this.isClickUI = false;
        this.updateSlide("-");
      }
    });

    // nextボタン
    this.nextBtn = document.getElementById("nextBtn");
    this.nextBtn.addEventListener("click", (e) => {
      if (this.isClickUI && this.isAnime) {
        this.isAnime = false;
        this.isClickUI = false;
        this.updateSlide("+");
      }
    });

    // ナビゲーション
    this.naviList = [...document.querySelectorAll(".js-navi")];
    for (let i = 0; i < this.naviList.length; i++) {
      const navi = this.naviList[i];
      navi.addEventListener("click", (e) => {
        console.log(this.slideConfig.current, i);
        if (this.slideConfig.current != i) {
          if (this.isClickUI && this.isAnime) {
            this.isAnime = false;
            this.isClickUI = false;
            if (this.slideConfig.current < i) {
              this.updateSlide("+", i);
            } else if (this.slideConfig.current > i) {
              this.updateSlide("-", i);
            }
          }
        }
      });
    }
  }

  toAutoPlay() {
    this.isAnime = false;
    this.isClickUI = false;
    this.updateSlide("+");
  }

  setAutoPlay() {
    const INTERVAL = 3000;
    this.timerAutoPlay = null;

    // nextボタンの進捗を有効化
    this.nextBtn.classList.add("is-active");

    clearTimeout(this.timerAutoPlay);
    this.timerAutoPlay = setTimeout(() => {
      this.toAutoPlay();
    }, INTERVAL);
  }

  createPlaneGeometry() {
    const depth = 100;
    this.planeGeometry = new THREE.PlaneBufferGeometry(1, 1, depth, depth);
  }

  createGroup() {
    this.group = new THREE.Group();
    this.stage.scene.add(this.group);
  }

  updateMesh(mesh) {
    // scale
    mesh.scale.x = this.params.w;
    mesh.scale.y = this.params.h;
    mesh.scale.z = this.params.shorter;

    // shader
    mesh.material.uniforms.uPlaneAspect.value = this.params.aspect;
  }

  createMesh() {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      fragmentShader: fragmentShader,
      vertexShader: vertexShader,
      uniforms: {
        uTime: { type: "f", value: 0.0 },
        uScale: { type: "f", value: 1.0 },
        uPlaneAspect: { type: "f", value: this.params.aspect },

        // img
        uTexture: { type: "t", value: this.imgDataList[0].texture },
        uTextureAspect: { type: "f", value: this.imgDataList[0].aspect },

        // duration && easing
        uAnime: { type: "f", value: 0.0 },

        uAngle: {
          type: "f",
          value: G.getDegreeToRadian(45),
        },
        // uTwist: { type: "f", value: 0.0 },

        // debug
        uProgress: { type: "f", value: 0. },
        // uProgress2: { type: "f", value: 0.0 },
      },
    });

    for (let i = 0; i < this.imgDataList.length; i++) {
      const m = material.clone();
      m.uniforms.uTexture.value = this.imgDataList[i].texture;
      if (i === 0) {
        m.uniforms.uAnime.value = 1.0;
      }

      const mesh = new THREE.Mesh(this.planeGeometry, m);
      mesh.name = `plane${i}`;
      mesh.renderOrder = 0;
      this.updateMesh(mesh);
      this.group.add(mesh);

      // if (GUI != null) {
      //   const folder = GUI.addFolder("mesh");
      //   folder
      //     .add(mesh.material.uniforms.uProgress, "value", 0.0, 1.0)
      //     .name("uProgress")
      //     .onChange((value) => {
      //       mesh.material.uniforms.uProgress.value = value;
      //     });
      // }
    }

    if (GUI) {
      let params = {
        // progress: 0.5,
        // progress2: 0.0,
        angle: G.getRadianToDegree(this.group.children[0].material.uniforms.uAngle.value),
        // twist: G.getRadianToDegree(this.group.children[0].material.uniforms.uTwist.value),
      };
      const folder = GUI.addFolder("shader");
      // folder
      //   .add(params, "progress", 0, 1)
      //   .name("uProgress")
      //   .onChange((value) => {
      //     for (let i = 0; i < this.group.children.length; i++) {
      //       const mesh = this.group.children[i];
      //       mesh.material.uniforms.uProgress.value = value;
      //     }
      //   });
      folder
        .add(params, "angle", 0, 90)
        .name("uAngle")
        .onChange((value) => {
          for (let i = 0; i < this.group.children.length; i++) {
            const mesh = this.group.children[i];
            mesh.material.uniforms.uAngle.value = G.getDegreeToRadian(value);
          }
        });
      // folder
      //   .add(params, "twist", 0, 90)
      //   .name("uTwist")
      //   .onChange((value) => {
      //     for (let i = 0; i < this.group.children.length; i++) {
      //       const mesh = this.group.children[i];
      //       mesh.material.uniforms.uTwist.value = G.getDegreeToRadian(value);
      //     }
      //   });
    }
  }

  resize(props) {
    this.bool.isMatchMediaWidth = props.isMatchMediaWidth;
    this.params.w = props.w;
    this.params.h = props.h;
    this.params.aspect = props.aspect;
    this.params.shorter = props.shorter;
    // this.params.longer = props.longer;
    if (this.group != null) {
      for (let i = 0; i < this.group.children.length; i++) {
        const mesh = this.group.children[i];
        this.updateMesh(mesh);
      }
    }
  }

  raf(time) {
    if (this.group != null) {
      for (let i = 0; i < this.group.children.length; i++) {
        const mesh = this.group.children[i];
        mesh.material.uniforms.uTime.value = time;
      }
    }
    this.stage.renderer.render(this.stage.scene, this.stage.camera);
  }
}
