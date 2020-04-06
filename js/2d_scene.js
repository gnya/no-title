export const init_2d_scene = (width, height, shader) => {
  // create camera
  const rate = height / width;
  const camera = new THREE.OrthographicCamera(-1, 1, 1 * rate, -1 * rate, 0, -1);

  // create scene
  const scene = new THREE.Scene();

  // create mesh
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {uv_tex: {value: null}},
    vertexShader: shader.vert,
    fragmentShader: shader.frag
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y += rate - 1;
  scene.add(mesh);

  // create webGL renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three_js_canvas'),
    preserveDrawingBuffer: true
  });
  renderer.setClearColor('rgba(255,250,247)');
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // snapshot
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

  return [renderer, scene, camera, mesh];
}
