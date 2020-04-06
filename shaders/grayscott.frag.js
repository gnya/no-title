export default `
// reference: https://www.karlsims.com/rd.html
const vec2 size = resolution;
const vec2 step_r = vec2(1.0 / size.x, 0.0); // right
const vec2 step_t = vec2(0.0, 1.0 / size.y); // top
const vec2 step_rt = step_r + step_t; // right and top
const vec2 step_rb = step_r - step_t; // right and bottom
// uniform sampler2D texture_uv; // external
uniform sampler2D fk_tex;
uniform float dt;
uniform float Du;
uniform float Dv;
uniform vec2 painting_pos;
uniform int painting_type;
uniform bool painting_done;

void main() {
  vec2 pos = gl_FragCoord.xy / size;
  // center uv
  vec4 uv  = texture2D(uv_tex, pos);
  // neighbors uv
  vec4 uv_n0 = texture2D(uv_tex, pos - step_r);
  vec4 uv_n1 = texture2D(uv_tex, pos + step_r);
  vec4 uv_n2 = texture2D(uv_tex, pos - step_t);
  vec4 uv_n3 = texture2D(uv_tex, pos + step_t);
  vec4 uv_n = uv_n0 + uv_n1 + uv_n2 + uv_n3;
  // diagonals uv
  vec4 uv_d0 = texture2D(uv_tex, pos - step_rt);
  vec4 uv_d1 = texture2D(uv_tex, pos + step_rb);
  vec4 uv_d2 = texture2D(uv_tex, pos - step_rb);
  vec4 uv_d3 = texture2D(uv_tex, pos + step_rt);
  vec4 uv_d = uv_d0 + uv_d1 + uv_d2 + uv_d3;
  // laplacian
  vec4 uv_l = uv_n * .2 + uv_d * .05 - uv;

  // gray-scott model
  vec2 fk = texture2D(fk_tex, pos).rg;
  float du0 = Du * uv_l.r // Du * du0
            + fk.r * (1.0  - uv.r) // f * (1 - u0)
            - uv.r * (uv.g * uv.g + uv.a * uv.a + uv.g * uv.a * 2.0);
  float dv0 = Dv * uv_l.g // Dv * dv0
            - uv.g * (fk.r + fk.g) // v0 * (f + k)
            + uv.g * (uv.r * uv.g + uv.r * uv.a);
  float du1 = Du * uv_l.b // Du * du1
            + fk.r * (1.0  - uv.b) // f * (1 - u1)
            - uv.b * (uv.g * uv.g + uv.a * uv.a + uv.g * uv.a * 1.62);
  float dv1 = Dv * uv_l.a // Dv * dv1
            - uv.a * (fk.r + fk.g) // v1 * (f + k)
            + uv.a * (uv.b * uv.a + uv.b * uv.g * 0.95);
  vec4 uv_next = uv + vec4(du0, dv0, du1, dv1) * dt;

  // painting
  if (!painting_done) {
    vec2 dif = gl_FragCoord.xy - painting_pos;
    if (dot(dif, dif) < 5.0) {
      if (painting_type == 0) uv_next.g = 0.9;
      if (painting_type == 1) uv_next.a = 0.9;
    }
  }

  gl_FragColor = clamp(uv_next, 0.0, 1.0);
}
`;
