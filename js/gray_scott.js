import {random_int} from './utils.js';

import gray_scott_frag from '../shaders/grayscott.frag.js';

const init_uv_tex = (uv_tex, size) => {
  const n = random_int(4, 8);
  const r = size / (n * 2) - 16;
  const type = [];
  for (let i = 0; i < n * n; i++) type.push(Math.random() > 0.5);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (x + y * size) * 4;

      for (let circle_y = 0; circle_y < n; circle_y++) {
        const y_c = (1 + circle_y) * size / (n + 1);
        for (let circle_x = 0; circle_x < n; circle_x++) {
          const x_c = (1 + circle_x) * size / (n + 1);
          const d = Math.pow(x - x_c, 2) + Math.pow(y - y_c, 2);
          const i_offset = type[circle_x + circle_y * n] * 2;

          if (d < Math.pow(r, 2)) {
            uv_tex.image.data[i + i_offset + 1] = 1.0;
          } else {
            uv_tex.image.data[i + i_offset + 0] = 1.0;
          }
        }
      }
    }
  }
};

const init_fk_tex = (fk_tex, size) => {
  const f = 0.055 + Math.random() * 0.001 /* f */;
  const k = 0.062 + Math.random() * 0.002 /* k */;
  const x_c = size / 2, y_c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (x + y * size) * 4;
      const d = Math.pow(x - x_c, 2) + Math.pow(y - y_c, 2);
      const n = d / (Math.pow(x_c, 2) + Math.pow(y_c, 2));
      fk_tex.image.data[i + 0] = f - n * n * 0.06;
      fk_tex.image.data[i + 1] = k + n * n * 0.03;
    }
  }
};

export const init_gray_scott = (size, renderer) => {
  // create GPU computation renderer
  const gpu = new GPUComputationRenderer(size, size, renderer);

  // create uv texture
  const uv_tex = gpu.createTexture();
  init_uv_tex(uv_tex, size);

  // create fk texture
  const fk_tex = gpu.createTexture();
  init_fk_tex(fk_tex, size);

  // create uv variable
  const uv_tex_var = gpu.addVariable('uv_tex', gray_scott_frag, uv_tex);
  gpu.setVariableDependencies(uv_tex_var, [uv_tex_var]);
  uv_tex_var.material.uniforms = {
    fk_tex: {value: fk_tex /* fk texture */},
    dt: {value: 1.0 /* dt */},
    Du: {value: 1.0 /* Du */},
    Dv: {value: 0.5 /* Dv */},
    painting_pos: {value: new THREE.Vector2()},
    painting_type: {value: -1},
    painting_done: {value: true}
  };

  // init GPU computation renderer
  const error = gpu.init();
  if (error !== null) {
    console.error(error);
  }

  return [gpu, uv_tex_var];
}
