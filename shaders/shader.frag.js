export default `
const vec4 color0 = vec4(0.156, 0.380, 0.643, 1.0);
const vec4 color1 = vec4(1.000, 0.205, 0.363, 1.0);
const vec4 color2 = vec4(1.000, 0.930, 0.938, 1.0);
const vec4 color3 = vec4(1.000, 0.930, 0.938, 1.0);
const vec4 color_back = vec4(1.000, 0.980, 0.968, 1.0);
uniform sampler2D uv_tex;
varying vec2 vUv;

vec4 getColor(in vec4 uv) {
  float rate0 = uv.a / (uv.a + uv.g);
  if (rate0 < 0.03) {
    if (rate0 < 0.01) {
      float rate1 = 1.00 - rate0 / 0.01;
      return color2 + (color_back - color2) * rate1;
    } else {
      float rate1 = 1.00 - (rate0 - 0.01) / 0.02;
      return color0 + (color2 - color0) * rate1;
    }
  } else if (rate0 > 0.97) {
    if (rate0 > 0.99) {
      float rate1 = (rate0 - 0.99) / 0.01;
      return color3 + (color_back - color3) * rate1;
    } else {
      float rate1 = (rate0 - 0.97) / 0.02;
      return color1 + (color3 - color1) * rate1;
    }
  } else {
    return color0 + (color1 - color0) * rate0;
  }
}

void main() {
  vec4 uv = texture2D(uv_tex, vUv);
  if (uv.a + uv.g >= 0.15) {
    gl_FragColor = getColor(uv);
  } else if (uv.a + uv.g >= 0.1) {
    vec4 color = getColor(uv);
    float rate1 = (uv.a + uv.g - 0.1) / 0.05;

    gl_FragColor = color_back + (color - color_back) * rate1;
  } else {
    gl_FragColor = color_back;
  }
}
`;
