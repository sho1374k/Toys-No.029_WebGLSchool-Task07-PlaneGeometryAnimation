// module
import { Stage } from "./Stage";
import { ObjectPlane } from "./ObjectPlane";

export class WebGL {
  constructor(params) {
    this.params = params;

    this.vector = {
      x: {
        target: 0,
        current: 0,
      },
      y: {
        target: 0,
        current: 0,
      },
      ease: 0.2,
    };

    this.stage = new Stage(params, false, false);
    this.stage.init(document.getElementById("webgl"), params.w, params.h);
    this.plane = new ObjectPlane(params, this.stage);

    this.raf = this.raf.bind(this);

    if (window.matchMedia("(hover: hover)").matches) {
      window.addEventListener("mousemove", this.onMove.bind(this), {
        passive: true,
      });
    } else {
      window.addEventListener("touchmove", this.onMove.bind(this), {
        passive: true,
      });
    }
  }

  /**
   * 線形補間
   * https://ja.wikipedia.org/wiki/%E7%B7%9A%E5%BD%A2%E8%A3%9C%E9%96%93
   * @param {number} start
   * @param {number} end
   * @param {number} ease
   * @returns {number} 補完した値
   */
  lerp(start, end, ease) {
    return start * (1 - ease) + end * ease;
  }

  onMove(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    this.vector.x.target = (x / this.params.w) * 2 - 1;
    this.vector.y.target = -(y / this.params.h) * 2 + 1;

    this.plane.onMove(this.vector);
  }

  raf() {
    const time = performance.now() * 0.001;

    this.vector.x.current = this.lerp(this.vector.x.current, this.vector.x.target, this.vector.ease);
    this.vector.y.current = this.lerp(this.vector.y.current, this.vector.y.target, this.vector.ease);

    this.stage.raf();
    this.plane.raf(time, this.vector);
  }

  resize(params) {
    this.params.w = params.w;
    this.params.h = params.h;

    this.stage.resize(params.w, params.h);
    this.plane.resize(params);
  }

  init() {
    console.log("🚀 ~ WebGL init");
    this.plane.init();
  }
}
