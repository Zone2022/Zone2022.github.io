/* A small, dependency-free WebGL cel-shaded notebook. */
(() => {
  const canvas = document.getElementById("notebook");
  const fallback = () => {
    canvas.hidden = true;
    canvas.style.display = "none";
    document.getElementById("scene-fallback").hidden = false;
    document.getElementById("rotate-scene").hidden = true;
  };
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) {
    fallback();
    return;
  }
  try {
    const compile = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = gl.createProgram();
    gl.attachShader(
      program,
      compile(
        gl.VERTEX_SHADER,
        `attribute vec3 position; attribute vec3 normal; attribute vec2 uv; uniform mat4 model; uniform mat4 projection; varying vec3 n; varying vec2 vUv; void main(){n=mat3(model)*normal;vUv=uv;gl_Position=projection*model*vec4(position,1.);}`,
      ),
    );
    gl.attachShader(
      program,
      compile(
        gl.FRAGMENT_SHADER,
        `precision mediump float; varying vec3 n; varying vec2 vUv; uniform vec3 color; uniform bool useTexture; uniform sampler2D cover; void main(){float l=dot(normalize(n),normalize(vec3(-.5,.8,1.)));float shade=l>.65?1.:l>.1?.82:.60;vec3 base=useTexture?texture2D(cover,vUv).rgb:color;gl_FragColor=vec4(base*shade,1.);}`,
      ),
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error("WebGL link");
    gl.useProgram(program);
    const loc = {};
    ["position", "normal", "uv"].forEach(
      (x) => (loc[x] = gl.getAttribLocation(program, x)),
    );
    ["model", "projection", "color", "useTexture"].forEach(
      (x) => (loc[x] = gl.getUniformLocation(program, x)),
    );
    const texCanvas = document.createElement("canvas");
    texCanvas.width = 512;
    texCanvas.height = 640;
    const ctx = texCanvas.getContext("2d");
    ctx.fillStyle = "#334bbd";
    ctx.fillRect(0, 0, 512, 640);
    ctx.strokeStyle = "#171e2e";
    ctx.lineWidth = 12;
    ctx.strokeRect(7, 7, 498, 626);
    ctx.fillStyle = "#f6efdc";
    ctx.font = "italic bold 114px Georgia";
    ctx.fillText("Lynn", 63, 197);
    ctx.font = "20px sans-serif";
    ctx.fillText("F I E L D   N O T E S", 65, 250);
    ctx.fillStyle = "#edc84e";
    ctx.save();
    ctx.translate(252, 410);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-9, -81, 18, 162);
    }
    ctx.restore();
    ctx.fillStyle = "#f6efdc";
    ctx.font = "16px sans-serif";
    ctx.fillText("A NOTEBOOK IN PROGRESS", 65, 575);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texCanvas,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const parts = [];
    function box(x, y, z, w, h, d, color, textured = false) {
      const X = w / 2,
        Y = h / 2,
        Z = d / 2;
      const faces = [
        [
          [-X, -Y, Z],
          [X, -Y, Z],
          [X, Y, Z],
          [-X, Y, Z],
          [0, 0, 1],
        ],
        [
          [X, -Y, -Z],
          [-X, -Y, -Z],
          [-X, Y, -Z],
          [X, Y, -Z],
          [0, 0, -1],
        ],
        [
          [X, -Y, Z],
          [X, -Y, -Z],
          [X, Y, -Z],
          [X, Y, Z],
          [1, 0, 0],
        ],
        [
          [-X, -Y, -Z],
          [-X, -Y, Z],
          [-X, Y, Z],
          [-X, Y, -Z],
          [-1, 0, 0],
        ],
        [
          [-X, Y, Z],
          [X, Y, Z],
          [X, Y, -Z],
          [-X, Y, -Z],
          [0, 1, 0],
        ],
        [
          [-X, -Y, -Z],
          [X, -Y, -Z],
          [X, -Y, Z],
          [-X, -Y, Z],
          [0, -1, 0],
        ],
      ];
      faces.forEach((f, fi) => {
        let data = [];
        const uv = [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ];
        [0, 1, 2, 0, 2, 3].forEach((i) =>
          data.push(f[i][0] + x, f[i][1] + y, f[i][2] + z, ...f[4], ...uv[i]),
        );
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        parts.push({ buffer, color, texture: textured && fi === 0 });
      });
    }
    const ink = [0.1, 0.13, 0.2],
      blue = [0.2, 0.29, 0.74],
      paper = [0.96, 0.93, 0.83];
    box(0, 0, -0.17, 2.67, 3.55, 0.1, ink);
    box(0, 0, -0.1, 2.62, 3.5, 0.1, blue);
    box(0.035, 0, 0.08, 2.49, 3.34, 0.28, paper);
    for (let i = 0; i < 5; i++)
      box(0.04, 0, -0.025 + i * 0.052, 2.5, 3.34, 0.009, [0.69, 0.69, 0.64]);
    box(0, 0, 0.265, 2.67, 3.55, 0.09, ink);
    box(0, 0, 0.32, 2.62, 3.5, 0.045, blue, true);
    box(-1.25, 0, 0.04, 0.18, 3.55, 0.63, ink);
    box(-1.25, 0, 0.07, 0.15, 3.5, 0.63, blue);
    box(0.96, 0, 0.375, 0.07, 3.5, 0.035, ink);
    box(1.01, 0, 0.377, 0.055, 3.5, 0.04, [0.9, 0.73, 0.26]);
    box(0.5, -1.91, 0.12, 0.24, 0.36, 0.025, [0.91, 0.39, 0.29]);
    // A pencil with flat bands, modeled beside the book.
    box(1.78, 0.03, 0.15, 0.16, 3.13, 0.16, ink);
    box(1.78, 0.07, 0.17, 0.13, 2.94, 0.13, [0.94, 0.76, 0.25]);
    box(1.78, 1.61, 0.17, 0.16, 0.2, 0.16, [0.91, 0.47, 0.36]);
    box(1.78, -1.58, 0.17, 0.08, 0.15, 0.08, [0.72, 0.58, 0.4]);
    box(1.78, -1.72, 0.17, 0.035, 0.14, 0.035, ink);
    const multiply = (a, b) => {
      let out = new Float32Array(16);
      for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++)
          for (let k = 0; k < 4; k++)
            out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
      return out;
    };
    let rx = -0.22,
      ry = -0.38,
      rz = -0.21,
      tx = rx,
      ty = ry,
      spin = 0,
      frame = 0,
      visible = true,
      drag = false,
      startX = 0,
      startY = 0,
      previous = 0;
    const reduced = () =>
      document.documentElement.dataset.motion === "off" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    function render(time = 0) {
      frame = 0;
      if (document.hidden || !visible) return;
      const rect = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(rect.width * dpr) ||
        canvas.height !== Math.round(rect.height * dpr)
      ) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      const dt = previous ? Math.min(time - previous, 50) : 16;
      previous = time;
      spin *= Math.pow(0.88, dt / 16);
      const a = rx,
        b = ry + spin,
        c = rz;
      let R = [
        Math.cos(b),
        0,
        -Math.sin(b),
        0,
        0,
        1,
        0,
        0,
        Math.sin(b),
        0,
        Math.cos(b),
        0,
        0,
        0,
        0,
        1,
      ];
      R = multiply(
        [
          1,
          0,
          0,
          0,
          0,
          Math.cos(a),
          Math.sin(a),
          0,
          0,
          -Math.sin(a),
          Math.cos(a),
          0,
          0,
          0,
          0,
          1,
        ],
        R,
      );
      R = multiply(
        [
          Math.cos(c),
          Math.sin(c),
          0,
          0,
          -Math.sin(c),
          Math.cos(c),
          0,
          0,
          0,
          0,
          1,
          0,
          -0.15,
          0,
          -6.8,
          1,
        ],
        R,
      );
      const aspect = canvas.width / canvas.height,
        f = 1 / Math.tan(0.65 / 2);
      gl.uniformMatrix4fv(loc.model, false, new Float32Array(R));
      gl.uniformMatrix4fv(
        loc.projection,
        false,
        new Float32Array([
          f / aspect,
          0,
          0,
          0,
          0,
          f,
          0,
          0,
          0,
          0,
          -1.002,
          -1,
          0,
          0,
          -0.2002,
          0,
        ]),
      );
      parts.forEach((p) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, p.buffer);
        [
          ["position", 3, 0],
          ["normal", 3, 12],
          ["uv", 2, 24],
        ].forEach(([name, size, offset]) => {
          gl.enableVertexAttribArray(loc[name]);
          gl.vertexAttribPointer(loc[name], size, gl.FLOAT, false, 32, offset);
        });
        gl.uniform3fv(loc.color, p.color);
        gl.uniform1i(loc.useTexture, p.texture ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      });
      if (
        Math.abs(tx - rx) + Math.abs(ty - ry) + Math.abs(spin) > 0.001 &&
        !reduced()
      )
        schedule();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }
    canvas.addEventListener("pointermove", (e) => {
      if (reduced()) return;
      const rect = canvas.getBoundingClientRect();
      if (drag) {
        ty = Math.max(-1.2, Math.min(1.2, -0.38 + (e.clientX - startX) * 0.01));
        tx = Math.max(
          -0.7,
          Math.min(0.7, -0.22 + (e.clientY - startY) * 0.008),
        );
      } else if (e.pointerType === "mouse") {
        ty =
          -0.38 +
          ((e.clientX - rect.left - rect.width / 2) / rect.width) * 0.65;
        tx =
          -0.22 +
          ((e.clientY - rect.top - rect.height / 2) / rect.height) * 0.4;
      }
      schedule();
    });
    canvas.addEventListener("pointerdown", (e) => {
      if (reduced()) return;
      drag = true;
      startX = e.clientX;
      startY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    const reset = () => {
      drag = false;
      tx = -0.22;
      ty = -0.38;
      schedule();
    };
    canvas.addEventListener("pointerup", reset);
    canvas.addEventListener("pointercancel", reset);
    canvas.addEventListener("pointerleave", () => {
      if (!drag) reset();
    });
    document.getElementById("rotate-scene").addEventListener("click", () => {
      if (reduced()) return;
      spin = 1.7;
      schedule();
    });
    new ResizeObserver(schedule).observe(canvas);
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    }).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      previous = 0;
      if (!document.hidden) schedule();
    });
    document.addEventListener("motionchange", () => {
      rx = tx = -0.22;
      ry = ty = -0.38;
      spin = 0;
      schedule();
    });
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      fallback();
    });
    schedule();
  } catch (error) {
    console.warn("Notebook illustration fallback:", error);
    fallback();
  }
})();
