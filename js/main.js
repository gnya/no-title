import {start} from './gray-scott.js';

// text color
let text_color = new THREE.Color(1.000, 0.980, 0.968);
const pick_color = (data, size) => {
  const get_color = (x, y) => {
    const i = (x + y * size) * 4;
    return new THREE.Color(
      data[i + 0] / 255, data[i + 1] / 255, data[i + 2] / 255);
  };
  const l2_color = (a, b) => {
    return Math.sqrt(
        Math.pow(a.r - b.r, 2)
      + Math.pow(a.g - b.g, 2)
      + Math.pow(a.b - b.b, 2));
  };
  const color0 = new THREE.Color(1.000, 0.980, 0.968);
  const color1 = new THREE.Color(1.000, 0.205, 0.363);
  const count = {n:0, c0: 0};
  const step = Math.floor(size / 24);
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const c = get_color(x, y);
      const d0 = l2_color(c, color0);
      if (d0 < 0.02) count.c0++;
      count.n++;
    }
  }
  const rate = 25 * (1 - count.c0 / count.n);
  return color0.lerp(color1, rate > 0.8 ? 0.8 : rate);
};

// calc canvas size
let canvas_size;
if (window.innerHeight > window.innerWidth) {
  canvas_size = window.innerWidth;
} else {
  canvas_size = window.innerHeight;
}
canvas_size -= 50;
if (canvas_size > 512) canvas_size = 512;

// start simulation
start(canvas_size, (renderer) => {
  // get image data
  const canvas = document.createElement('canvas');
  canvas.width = canvas_size;
  canvas.height = canvas_size;
  const context_2d = canvas.getContext('2d');
  context_2d.drawImage(renderer.domElement, 0, 0);
  const img = context_2d.getImageData(0, 0, canvas_size, canvas_size);

  // text color
  const color = pick_color(img.data, canvas_size);
  text_color = text_color.lerp(color, 0.03);
  const elm0 = document.getElementById('caption');
  const elm1 = document.getElementById('description');
  elm0.style.color = text_color.getStyle();
  elm1.style.color = text_color.getStyle();
});
