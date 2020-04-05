import gray_scott_frag from '../shaders/gray-scott.frag.js';
import shader_vert from '../shaders/shader.vert.js';
import shader_frag from '../shaders/shader.frag.js';

const random_int = (min, max) => {
  return min + Math.floor(Math.random() * (max - min));
};

const init_uv_tex = (uv_tex, size) => {
  const n = random_int(4, 6);
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

          if (d < Math.pow(size / 16, 2)) {
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

export const start = (size, onrendering) => {
  // create camera
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

  // create scene
  const scene = new THREE.Scene();

  // create geometry
  const geometry = new THREE.PlaneGeometry(2, 2);

  // create material
  const material = new THREE.ShaderMaterial({
    uniforms: {uv_tex: {value: null}},
    vertexShader: shader_vert,
    fragmentShader: shader_frag
  });

  // create mesh
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // create webGL renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three_js_canvas'),
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(size, size);

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
    painting_pos: {type: 'v2', value: new THREE.Vector2()},
    painting_type: {value: -1},
    painting_done: {value: true}
  };

  // mouse interaction
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
  const onbrushmove = (brush_x, brush_y) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = brush_x - rect.left;
    const y = brush_y - rect.top;

    if (painting.type != -1) {
      painting.pos = new THREE.Vector2(x, size - y);
      painting.done = false;
    }
  };
  const onbrushstart = () => painting.type = 0;
  const onbrushend = () => painting.type = -1;
  renderer.domElement.onmousemove = e => onbrushmove(e.pageX, e.pageY);
  renderer.domElement.ontouchmove = e => {
    const o = event.changedTouches[0];
    onbrushmove(o.pageX, o.pageY);
  }
  renderer.domElement.onmousedown = e => onbrushstart();
  renderer.domElement.ontouchstart = e => onbrushstart();
  renderer.domElement.onmouseup = e => onbrushend();
  renderer.domElement.ontouchend = e => onbrushend();

  // init GPU computation renderer
  const error = gpu.init();
  if (error !== null) {
    console.error(error);
  }

  // snapshot (only Google Chrome)
  const snapshot = () => {
    const context = renderer.domElement.getContext(
      'experimental-webgl', {preserveDrawingBuffer: true});
    const url = renderer.domElement.toDataURL();
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'snapshot.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.parentNode.removeChild(anchor);
  };
  window.addEventListener('keydown', (event) => {
    if (event.keyCode == 83) snapshot();
  });

  // main loop
  const animation = () => {
    for (let i = 0; i < 5; i++) {
      gpu.compute();
      painting.done = true; // stop painting
    }

    material.uniforms.uv_tex.value = gpu.getCurrentRenderTarget(uv_tex_var).texture;
    renderer.render(scene, camera);
    onrendering(renderer); // callback

    requestAnimationFrame(animation);
  };
  animation();
};
