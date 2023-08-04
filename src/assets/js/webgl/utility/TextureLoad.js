import * as THREE from "three";

export function TextureLoad(src) {
  const texture = new THREE.TextureLoader().load(src);
  // texture.encoding = THREE.GammaEncoding;
  // texture.encoding = THREE.sRGBEncoding;
  // texture.encoding = THREE.LinearEncoding;
  return texture;
}
