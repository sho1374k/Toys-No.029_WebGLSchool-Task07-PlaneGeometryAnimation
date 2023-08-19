// --------------------------

// scss

// --------------------------
import "../scss/app.scss";

// --------------------------

// lib

// --------------------------
import gsap from "gsap";

// --------------------------

// module

// --------------------------
import { SetGui } from "./lib/setGui";
import { WebGL } from "./webgl/WebGL";

// --------------------------

// window

// --------------------------
window.MODE = process.env.NODE_ENV === "development";
window.GSAP = gsap;

window.addEventListener("DOMContentLoaded", (e) => {
  new SetGui();

  const world = document.getElementById("world");
  const worldRect = world.getBoundingClientRect();

  const bool = {
    isMatchMediaHover: window.matchMedia("(hover: hover)").matches,
  };

  const params = {
    w: window.innerWidth,
    h: bool.isMatchMediaHover ? window.innerHeight : worldRect.height,
  };

  const webgl = new WebGL(params);
  webgl.init();

  GSAP.ticker.add(webgl.raf);
  GSAP.ticker.fps(30);

  const resize = () => {
    params.w = window.innerWidth;
    params.h = bool.isMatchMediaHover ? window.innerHeight : world.getBoundingClientRect().height;

    webgl.resize(params);
  };
  window.addEventListener("resize", resize, { passive: true });
  setTimeout(() => {
    resize();
  }, 300);

  if (bool.isMatchMediaHover) {
    // 右クリック禁止
    document.oncontextmenu = function () {
      return false;
    };
    document.getElementsByTagName("html")[0].oncontextmenu = function () {
      return false;
    };
    document.body.oncontextmenu = function () {
      return false;
    };
  }
});
