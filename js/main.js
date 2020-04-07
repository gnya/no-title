import {init_2d_scene} from './2d_scene.js';
import {init_gray_scott} from './gray_scott.js';
import {build_text_mesh} from './text_mesh.js';
import {random_int} from './utils.js';

import shader_vert from '../shaders/shader.vert.js';
import shader_frag from '../shaders/shader.frag.js';

const get_image_data = (renderer, size) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const elm = renderer.domElement;
  context.drawImage(elm, 0, 0, elm.width, elm.width, 0, 0, size, size);
  return context.getImageData(0, 0, size, size);
}

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

  // pick color
  const color = new THREE.Color(1.000, 0.980, 0.968);
  let count = 0;
  for (let i = 0; i < 100; i++) {
    const c = get_color(random_int(0, size), random_int(0, size));
    if (l2_color(c, color) > 0.02) count++;
  }
  const rate = 5 * count / 100;
  return rate > 1.0 ? 1.0 : rate;
};

const bind_mouse_event = (elm, onmove, onstart, onend) => {
  // mouse
  elm.onmousemove = e => onmove(e.pageX, e.pageY);
  elm.onmousedown = e => onstart(e.pageX, e.pageY);
  elm.onmouseup = e => onend();

  // touch
  elm.ontouchmove = e => {
    const o = e.changedTouches[0];
    onmove(o.pageX, o.pageY);
  };
  elm.ontouchstart = e => {
    const o = e.changedTouches[0];
    onstart(o.pageX, o.pageY);
  };
  elm.ontouchend = e => onend();
}

const init_mouse_event = (size, elm, uniforms) => {
  const painting = {};
  Object.defineProperty(painting, 'pos', {
    set(pos) {uniforms.painting_pos.value = pos}
  });
  Object.defineProperty(painting, 'type', {
    set(type) {uniforms.painting_type.value = type}
  });
  Object.defineProperty(painting, 'done', {
    set(done) {uniforms.painting_done.value = done}
  });

  // bind mouse event
  const paint_uv = (brush_x, brush_y) => {
    const rect = elm.getBoundingClientRect();
    const x = brush_x - rect.left;
    const y = brush_y - rect.top;
    if (painting.type != -1) {
      painting.pos = new THREE.Vector2(x, size - y);
      painting.done = false;
    }
  };
  const onmove = (x, y) => paint_uv(x, y);
  const onstart = (x, y) => {
    painting.type = random_int(0, 2); paint_uv(x, y);
  };
  const onend = () => painting.type = -1;
  bind_mouse_event(elm, onmove, onstart, onend);

  return painting;
}

const init_text_mesh = (width, height, scene) => {
  const caption_style = {
    font_pixel: 14, font_weight: 900,
    font_family: 'Montserrat', letter_spacing: 2.2,
    line_height: 6, color: 'rgb(255,52,92)', scale: 1.0
  };
  const reference_style = {
    font_pixel: 8, font_weight: 500,
    font_family: 'Montserrat', letter_spacing: 0.3,
    line_height: 2, color: 'rgb(255,52,92)', scale: 0.85
  };
  const text_mesh = build_text_mesh([
    {text: 'Gray-Scott Pattern', style: caption_style},
    {text: 'P. Gray and S.K. Scott', style: reference_style},
    {text: 'Autocatalytic reactions in the isothermal continuous stirred tank reactor', style: reference_style},
    {text: 'Oscillations and instabilities in the system A + 2B → 3B, B → C', style: reference_style},
    {text: 'Chemical Engineering Science Vol.39, (1984)', style: reference_style}
  ], width);
  const baseline = text_mesh.geometry.parameters.height / 2;
  text_mesh.position.y = (height / width) - 2.03 - baseline;
  text_mesh.material.opacity = 0.0;
  scene.add(text_mesh);
  return text_mesh;
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
  };
  const width = calc_canvas_size(512);
  const height = width + 100;

  // init webGL
  const [renderer, scene, camera, mesh] = init_2d_scene(
    width, height, {vert: shader_vert, frag: shader_frag});

  // init Gray-Scott model
  const [gpu, uv_tex_var] = init_gray_scott(width, renderer);

  // init mouse event
  const painting = init_mouse_event(
    width, renderer.domElement, uv_tex_var.material.uniforms);

  // init text mesh
  const text_mesh = init_text_mesh(width, height, scene);

  let text_update_count = 0;
  const update_text_mesh = () => {
    const img = get_image_data(renderer, width);
    const rate = pick_color(img.data, width);
    text_mesh.material.opacity
      = text_mesh.material.opacity * 0.97 + rate * 0.03;
  }

  // main loop
  const animation = () => {
    // gpu computation
    for (let i = 0; i < 5; i++) {
      gpu.compute();
      painting.done = true; // stop painting
    }

    // rendering
    mesh.material.uniforms.uv_tex.value
      = gpu.getCurrentRenderTarget(uv_tex_var).texture;
    renderer.render(scene, camera);

    // update text mesh
    text_update_count++;
    if (text_update_count > 10) {
      text_update_count = 0;
      update_text_mesh();
    }

    requestAnimationFrame(animation);
  };
  animation();
};

WebFont.load({
  google: {families: ['Montserrat:500,900']},
  active: () => start()
});
