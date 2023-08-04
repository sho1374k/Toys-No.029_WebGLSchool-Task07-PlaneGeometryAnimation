import * as THREE from "three";

export class Stage {
  constructor(params, bool) {
    // props
    this.params = params;
    this.bool = bool;

    // init
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.stats = null;

    this.init();
  }

  init() {
    this.setRenderer();
    this.setScene();
    this.setCamera();
    // this.setFog();
  }

  updateRenderer() {
    this.renderer.setSize(this.params.w, this.params.h);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }

  setRendererLight() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // this.renderer.toneMapping = THREE.CineonToneMapping;
    // this.renderer.shadowMap.type = THREE.BasicShadowMap
    // this.renderer.shadowMap.type = THREE.PCFShadowMap
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // this.renderer.shadowMap.type = THREE.VSMShadowMap
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1; //1.75
    // this.renderer.physicallyCorrectLights = true;
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    // this.setRendererLight();
    this.updateRenderer();

    const wrap = document.getElementById("world");
    wrap.appendChild(this.renderer.domElement);
  }

  setScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#161616");
    // if (GUI != null) {
    //   const scene = GUI.addFolder("scene");
    //   // scene.close();
    //   scene
    //     .addColor(this.scene, "background")
    //     .name("background")
    //     .onChange((value) => {
    //       this.scene.background = new THREE.Color(value);
    //     });
    // }

    // SceneHelper
    // if (MODE) {
    //   this.scene.add(new THREE.GridHelper(1000, 100));
    //   this.scene.add(new THREE.AxesHelper(100));
    // }
  }

  updateFog() {
    this.scene.fog.far = this.params.shorter * 3;
  }

  setFog() {
    this.scene.fog = new THREE.Fog(0x1e0101, 10, this.params.shorter * 3);
    if (GUI != null) {
      const fog = GUI.addFolder("fog");
      fog
        .addColor(this.scene.fog, "color")
        .name("color")
        .onChange((value) => {
          this.scene.fog.color = new THREE.Color(value);
        });
      fog
        .add(this.scene.fog, "near", 0, 100)
        .name("near")
        .onChange((value) => {
          this.scene.fog.near = value;
        });
      fog
        .add(this.scene.fog, "far", 1, this.params.shorter * 10)
        .name("far")
        .onChange((value) => {
          this.scene.fog.far = value;
        });
    }
  }

  updateCamera() {
    this.configCamera.far = (this.params.h * 0.5) / Math.tan(this.configCamera.fov * 0.5 * (Math.PI / 180));

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.aspect = this.params.w / this.params.h;
    this.camera.position.z = this.configCamera.far;
    this.camera.far = this.configCamera.far * 4;

    this.camera.updateProjectionMatrix();
  }

  setCamera() {
    this.configCamera = {
      fov: 60,
      aspect: this.params.w / this.params.h,
      near: 1,
      far: (this.params.h * 0.5) / Math.tan(60 * 0.5 * (Math.PI / 180)),
    };

    this.camera = new THREE.PerspectiveCamera(
      this.configCamera.fov,
      this.configCamera.aspect,
      this.configCamera.near,
      this.configCamera.far * 4,
    );

    this.updateCamera();
  }

  raf() {
    // this.renderer.render(this.scene, this.camera);
  }

  resize(props) {
    this.bool.isMatchMediaWidth = props.isMatchMediaWidth;
    this.params.w = props.w;
    this.params.h = props.h;
    this.params.aspect = props.aspect;
    this.params.shorter = props.shorter;
    this.params.longer = props.longer;

    this.updateRenderer();
    this.updateCamera();
  }
}
