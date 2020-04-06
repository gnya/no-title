import {init_2d_scene} from './2d_scene.js';
import {init_gray_scott} from './gray_scott.js';
import {build_text_mesh} from './text_mesh.js';

import shader_vert from '../shaders/shader.vert.js';
import shader_frag from '../shaders/shader.frag.js';

const pick_color = (data, size) => {
  const random_int = (min, max) => {
    return min + Math.floor(Math.random() * (max - min));
  };
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
  const color = new THREE.Color(1.000, 0.980, 0.968);
  const count = {n:0, c0: 0};
  for (let i = 0; i < 100; i++) {
    const c = get_color(random_int(0, size), random_int(0, size));
    count.c0 += l2_color(c, color) < 0.02 ? 0.0 : 1.0;
    count.n++;
  }
  const rate = 10 * count.c0 / count.n;
  return rate > 1.0 ? 1.0 : rate;
};

const init_mouse_event = (size, renderer, uv_tex_var) => {
  const painting = {};
  Object.defineProperty(painting, 'pos', {
    set(pos) {uv_tex_var.material.uniforms.painting_pos.value = pos}
  });
  Object.defineProperty(painting, 'type', {
    set(type) {uv_tex_var.material.uniforms.painting_type.value = type}
  });
  Object.defineProperty(painting, 'done', {
    set(done) {uv_tex_var.material.uniforms.painting_done.value = done}
  });
  const paint_uv = (brush_x, brush_y) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = brush_x - rect.left;
    const y = brush_y - rect.top;
    if (painting.type != -1) {
      painting.pos = new THREE.Vector2(x, size - y);
      painting.done = false;
    }
  };
  const onbrushmove = (x, y) => paint_uv(x, y);
  const onbrushstart = (x, y) => {painting.type = 0; paint_uv(x, y);};
  const onbrushend = () => painting.type = -1;
  renderer.domElement.onmousemove = e => onbrushmove(e.pageX, e.pageY);
  renderer.domElement.ontouchmove = e => {
    const o = e.changedTouches[0];
    onbrushmove(o.pageX, o.pageY);
  };
  renderer.domElement.onmousedown = e => onbrushstart(e.pageX, e.pageY);
  renderer.domElement.ontouchstart = e => {
    const o = e.changedTouches[0];
    onbrushstart(o.pageX, o.pageY);
  };
  renderer.domElement.onmouseup = e => onbrushend();
  renderer.domElement.ontouchend = e => onbrushend();
  return painting;
}

const start = () => {
  const calc_canvas_size = (max) => {
    let size;
    if (window.innerHeight > window.innerWidth) {
      size = window.innerWidth;
    } else {
      size = window.innerHeight;
    }
    size -= 50;
    if (size > max) size = max;
    return size;
  }
  const size = calc_canvas_size(512);

  // init webGL
  const [renderer, scene, camera, mesh] = init_2d_scene(
    size, size + 90, {vert: shader_vert, frag: shader_frag});

  // init Gray-Scott model
  const [gpu, uv_tex_var] = init_gray_scott(size, renderer);

  // init mouse event
  const painting = init_mouse_event(size, renderer, uv_tex_var);

  // text texture
  const caption_style = {
    font_pixel: 14, font_weight: 900, font_family: 'Montserrat',
    letter_spacing: 2.2, line_height: 8, color: 'rgb(255,52,92)', scale: 1.0
  };
  const reference_style = {
    font_pixel: 8, font_weight: 400, font_family: 'Montserrat',
    letter_spacing: 0.3, line_height: 2, color: 'rgb(255,52,92)', scale: 0.85
  };
  const text_mesh = build_text_mesh([
    {text: 'Gray-Scott Pattern', style: caption_style},
    {text: 'P. Gray and S.K. Scott', style: reference_style},
    {text: 'Autocatalytic reactions in the isothermal continuous stirred tank reactor', style: reference_style},
    {text: 'Oscillations and instabilities in the system A + 2B → 3B, B → C', style: reference_style},
    {text: 'Chemical Engineering Science Vol.39, (1984)', style: reference_style}
  ], size);
  text_mesh.position.y = -0.95;
  text_mesh.material.opacity = 0.0;
  scene.add(text_mesh);

  // main loop
  const animation = () => {
    for (let i = 0; i < 5; i++) {
      gpu.compute();
      painting.done = true; // stop painting
    }

    mesh.material.uniforms.uv_tex.value
      = gpu.getCurrentRenderTarget(uv_tex_var).texture;
    renderer.render(scene, camera);

    const get_image_data = (renderer) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context_2d = canvas.getContext('2d');
      context_2d.drawImage(renderer.domElement, 0, 0);
      return context_2d.getImageData(0, 0, size, size);
    }

    // text color
    const img = get_image_data(renderer);
    const rate = pick_color(img.data, size);
    text_mesh.material.opacity
      = text_mesh.material.opacity * 0.97 + rate * 0.03;

    requestAnimationFrame(animation);
  };
  animation();
};

WebFont.load({
  google: {families: ['Montserrat:400,900']},
  active: () => start()
});
