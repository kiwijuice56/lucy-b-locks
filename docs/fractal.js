const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl', { antialias: false });
 
const VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
    v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;
 
const FS = `
precision highp float;
varying vec2 v_uv;
 
uniform float x_min;
uniform float x_max;
uniform float y_min;
uniform float y_max;
uniform vec2  mouse_pos;
uniform float shimmer_speed;
uniform float u_time;
 
const vec3 col_a = vec3(245.0/255.0, 212.0/255.0, 246.0/255.0);
const vec3 col_b = vec3(240.0/255.0, 197.0/255.0, 238.0/255.0);
const vec3 col_c = vec3(215.0/255.0, 180.0/255.0, 219.0/255.0);
 
vec3 color_cell(float mu, vec2 uv) {
    float shimmer_mu = mu + u_time * shimmer_speed;
    shimmer_mu -= floor(shimmer_mu);
    float scaled_shimmer = shimmer_mu * 2.0;
    scaled_shimmer -= floor(scaled_shimmer);
    float cyclic_scaled_mu = scaled_shimmer;
 
    vec3 col = col_a;
    col = mix(col, col_b, smoothstep(0.0,       1.0/3.0, cyclic_scaled_mu));
    col = mix(col, col_c, smoothstep(1.0/3.0,   2.0/3.0, cyclic_scaled_mu));
    col = mix(col, col_a, smoothstep(2.0/3.0,   1.0,     cyclic_scaled_mu));
    return col;
}
 
vec3 mandelbrot(vec2 uv) {
    float x = x_min + uv.x * (x_max - x_min);
    float y = y_min + uv.y * (y_max - y_min);
    float xtemp;
    int iter = 0;
 
    for (int i = 0; i < 16; i++) {
        xtemp = x*x - y*y + mouse_pos.x;
        y     = 2.0*x*y  + mouse_pos.y;
        x     = xtemp;
        iter++;
        if (x*x + y*y > 4.0) break;
    }
 
    if (iter == 16) return col_c;
 
    for (int extra = 0; extra < 4; extra++) {
        xtemp = x*x - y*y + mouse_pos.x;
        y     = 2.0*x*y  + mouse_pos.y;
        x     = xtemp;
        iter++;
    }
 
    float modulus = sqrt(x*x + y*y);
    float mu = max(0.0, (float(iter) - log(log(modulus)) / log(2.0))) / 16.0;
    mu = sqrt(mu);
    return color_cell(mu, uv);
}
 
void main() {
    vec3 col = mandelbrot(v_uv);
    float x = max(0.0, 3.0 - u_time) / 3.0;
    col = col_a * x + col * (1.0 - x);
    gl_FragColor = vec4(col, 1.0);
}`;
 
function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s);
    return s;
}
 
const prog = gl.createProgram();
gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
gl.useProgram(prog);
 
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1,  -1,1,
     1,-1,  1, 1,  -1,1
]), gl.STATIC_DRAW);
 
const aPos = gl.getAttribLocation(prog, 'a_pos');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
 
const U = {};
['x_min','x_max','y_min','y_max','mouse_pos','shimmer_speed','u_time']
    .forEach(n => U[n] = gl.getUniformLocation(prog, n));
gl.uniform1f(U.shimmer_speed, 0.1);
 
const VIEW = { cx: 0.0, cy: 0.0, range: 0.9 };
 
function setView() {
    const aspect = canvas.width / canvas.height;
    gl.uniform1f(U.x_min, VIEW.cx - VIEW.range * aspect);
    gl.uniform1f(U.x_max, VIEW.cx + VIEW.range * aspect);
    gl.uniform1f(U.y_min, VIEW.cy - VIEW.range);
    gl.uniform1f(U.y_max, VIEW.cy + VIEW.range);
}
 
function resize() {
    canvas.width  = canvas.clientWidth  * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    setView();
}
window.addEventListener('resize', resize);
resize();
 
const ORBIT_CENTER_X = -0.1;
const ORBIT_CENTER_Y =  0.0;
const ORBIT_RADIUS   =  0.4;
const ORBIT_SPEED    =  0.08; // radians per second
 
const t0 = performance.now();
function frame() {
    const t = (performance.now() - t0) / 1000;
    gl.uniform1f(U.u_time, t);
 
    const angle = t * ORBIT_SPEED * Math.PI * 2;
    gl.uniform2f(U.mouse_pos,
        ORBIT_CENTER_X + Math.cos(angle) * ORBIT_RADIUS,
        ORBIT_CENTER_Y + Math.sin(angle) * ORBIT_RADIUS
    );
 
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
}
 
requestAnimationFrame(frame);