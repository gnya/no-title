const build_text_line = (text, style) => {
  const container = new createjs.Container();
  const font_style = style.font_weight + " "
    + style.font_pixel * 3 * style.scale + "px " + style.font_family;
  const ls = style.letter_spacing * 3 * style.scale;
  let width = 0;
  [].forEach.call(text, (s) => {
    const t = new createjs.Text(s, font_style, style.color);
    t.scale = style.scale;
    t.x = width;
    container.addChild(t);
    width += ls + t.getMeasuredWidth();
  });
  return container;
}

export const build_text_mesh = (contents, width) => {
  // build container
  const container = new createjs.Container();
  let height = 0;
  [].forEach.call(contents, (content) => {
    const c = build_text_line(content.text, content.style);
    c.x = (width * 3 - c.getBounds().width) / 2;
    c.y = height * 3;
    container.addChild(c);
    height += content.style.line_height + content.style.font_pixel;
  });
  height -= contents[contents.length - 1].style.line_height;
  const y = (height * 3 - container.getBounds().height) / 2;
  container.cache(0, -y, width * 3, height * 3);

  // create mesh
  const tex = new THREE.Texture(container.cacheCanvas);
  tex.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(2.0, 2.0 * height / width);
  const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true});
  return new THREE.Mesh(geo, mat);
}
