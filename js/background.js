/* ============================================
   AURORA BACKGROUND — WebGL "liquid chrome" style
   Soft pudra palette: cream / grey / lavender / dusty-pink
   ONE big soft glossy highlight follows the cursor (not a busy multi-noise field)
   ============================================ */
(function () {
  const canvas = document.getElementById('aurora-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  const vsSource = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 uRes;
    uniform vec2 uMouse;     // normalized 0..1, smoothed
    uniform float uTime;

    vec2 hash(vec2 p){
      p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }
    float noise(vec2 p){
      const float K1 = 0.366025404;
      const float K2 = 0.211324865;
      vec2 i = floor(p + (p.x+p.y)*K1);
      vec2 a = p - i + (i.x+i.y)*K2;
      vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0*K2;
      vec3 h = max(0.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.0);
      vec3 n = h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c,hash(i+1.0)));
      return dot(n, vec3(70.0));
    }
    // only 2 soft, large-scale octaves — smooth glossy shapes, not busy noise
    float fbm(vec2 p){
      float v = 0.0; float a = 0.6;
      for(int i=0;i<2;i++){ v += a*noise(p); p *= 1.8; a *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / uRes.xy;
      vec2 p = uv; p.x *= uRes.x/uRes.y;
      vec2 mouse = uMouse; mouse.x *= uRes.x/uRes.y;

      float t = uTime * 0.02;

      // one slow diagonal drift field — big smooth shapes, not chaotic
      float n1 = fbm(p*0.9 + vec2(t, -t*0.5));

      // mouse: one big soft glossy highlight that clearly follows the cursor
      float d = distance(p, mouse);
      float glow = smoothstep(1.25, 0.0, d);
      float glowCore = smoothstep(0.55, 0.0, d);

      // palette — soft pudra tones only, close to the liquid-chrome reference
      vec3 cream    = vec3(0.976, 0.965, 0.960);
      vec3 grey     = vec3(0.88, 0.87, 0.885);
      vec3 lavender = vec3(0.78, 0.74, 0.87);
      vec3 pink     = vec3(0.90, 0.79, 0.80);

      vec3 col = mix(cream, grey, smoothstep(0.1, 0.9, n1));
      col = mix(col, lavender, glow * 0.85);
      col = mix(col, pink, glowCore * 0.55);

      // keep it light at all times
      col = mix(col, vec3(1.0), 0.12);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  gl.useProgram(program);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uMouse = gl.getUniformLocation(program, 'uMouse');
  const uTime = gl.getUniformLocation(program, 'uTime');

  let targetMouse = [0.5, 0.42];
  let mouse = [0.5, 0.42];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    targetMouse = [e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight];
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      targetMouse = [e.touches[0].clientX / window.innerWidth, 1.0 - e.touches[0].clientY / window.innerHeight];
    }
  }, { passive: true });

  const start = performance.now();
  function frame(now) {
    // smooth follow — visibly trails the cursor like a liquid highlight
    mouse[0] += (targetMouse[0] - mouse[0]) * 0.07;
    mouse[1] += (targetMouse[1] - mouse[1]) * 0.07;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();