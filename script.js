window.addEventListener("load", function () {
  /* MONTAGNE GENERATIVE HERO */
  const canvas = document.getElementById("montiGenerativi");
  const ctx = canvas.getContext("2d");

  function resizeHeroCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeHeroCanvas();
  window.addEventListener("resize", resizeHeroCanvas);

  function noiseLine(x, layer, time) {
    return (
      Math.sin(x * 0.006 + layer * 0.7 + time) +
      Math.sin(x * 0.014 + layer * 1.3 + time * 0.7) +
      Math.sin(x * 0.028 + layer * 0.4 + time * 1.2)
    ) / 3;
  }

  function drawMountains(time) {
    const w = canvas.width;
    const h = canvas.height;
    const t = time * 0.00035;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;

    for (let layer = 0; layer < 42; layer++) {
      ctx.beginPath();

      const depth = layer / 42;
      const baseY = h * 0.26 + layer * 12;
      const amplitude = 120 - depth * 70;
      const perspective = 1 + depth * 1.4;

      for (let x = -80; x <= w + 80; x += 10) {
        const center = Math.abs(x - w / 2) / (w / 2);
        const peakShape = Math.pow(1 - Math.min(center, 1), 2.2) * 210;
        const n = noiseLine(x, layer, t);

        const y =
          baseY -
          peakShape +
          n * amplitude +
          Math.sin((x + layer * 20) * 0.012 + t) * 16;

        const px = w / 2 + (x - w / 2) * perspective;
        const py = y + depth * 260;

        if (x === -80) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.stroke();
    }

    requestAnimationFrame(drawMountains);
  }

  requestAnimationFrame(drawMountains);

  /* INDICE INTERATTIVO */
  const buttons = document.querySelectorAll(".index-item");
  const textBox = document.getElementById("indexText");

  buttons.forEach(function (button) {
    button.addEventListener("mouseenter", function () {
      textBox.textContent = button.dataset.text;
    });

    button.addEventListener("click", function () {
      textBox.textContent = button.dataset.text;
    });
  });

  /* GALLERIA NOISE OTTIMIZZATA */
  const size = 180;

  function setupCanvas(id) {
    const c = document.getElementById(id);
    c.width = size;
    c.height = size;
    return {
      canvas: c,
      ctx: c.getContext("2d")
    };
  }

  const white = setupCanvas("whiteNoise");
  const value = setupCanvas("valueNoise");
  const fbm = setupCanvas("fbmNoise");
  const voronoi = setupCanvas("voronoiNoise");
  const simplex = setupCanvas("simplexNoise");
  const perlin = setupCanvas("perlinNoise");

  let t = 0;
  let frame = 0;

  function smoothNoise(x, y, z) {
    return (
      Math.sin(x * 0.08 + z) +
      Math.sin(y * 0.08 + z * 1.2) +
      Math.sin((x + y) * 0.04 + z * 0.8)
    ) / 6 + 0.5;
  }

  function drawPixels(target, mode) {
    const ctx = target.ctx;
    const image = ctx.createImageData(size, size);
    const data = image.data;

    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        let v = 0;

        if (mode === "white") v = Math.random();
        if (mode === "value") v = smoothNoise(x, y, t);

        if (mode === "fbm") {
          v =
            smoothNoise(x, y, t) * 0.55 +
            smoothNoise(x * 2, y * 2, t) * 0.25 +
            smoothNoise(x * 4, y * 4, t) * 0.15 +
            smoothNoise(x * 8, y * 8, t) * 0.05;
        }

        if (mode === "simplex") {
          v =
            Math.sin(x * 0.06 + t * 1.4) *
            Math.cos(y * 0.06 + t) *
            0.5 + 0.5;
        }

        const c = Math.max(0, Math.min(255, v * 255));

        for (let oy = 0; oy < 2; oy++) {
          for (let ox = 0; ox < 2; ox++) {
            const px = x + ox;
            const py = y + oy;

            if (px < size && py < size) {
              const index = (px + py * size) * 4;
              data[index] = c;
              data[index + 1] = c;
              data[index + 2] = c;
              data[index + 3] = 255;
            }
          }
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  const points = [];

  for (let i = 0; i < 14; i++) {
    points.push({
      x: Math.random() * size,
      y: Math.random() * size,
      vx: Math.random() * 0.5 - 0.25,
      vy: Math.random() * 0.5 - 0.25
    });
  }

  function drawVoronoi() {
    const ctx = voronoi.ctx;
    const image = ctx.createImageData(size, size);
    const data = image.data;

    for (let p of points) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > size) p.vx *= -1;
      if (p.y < 0 || p.y > size) p.vy *= -1;
    }

    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        let minD = 9999;

        for (let p of points) {
          const dx = x - p.x;
          const dy = y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minD) minD = d;
        }

        const c = Math.max(0, Math.min(255, 255 - minD * 4));

        for (let oy = 0; oy < 2; oy++) {
          for (let ox = 0; ox < 2; ox++) {
            const px = x + ox;
            const py = y + oy;

            if (px < size && py < size) {
              const index = (px + py * size) * 4;
              data[index] = c;
              data[index + 1] = c;
              data[index + 2] = c;
              data[index + 3] = 255;
            }
          }
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  function drawPerlinLines() {
    const ctx = perlin.ctx;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1.2;

    for (let r = 18; r < 85; r += 5) {
      ctx.beginPath();

      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
        const n = smoothNoise(
          Math.cos(a) * 80 + r,
          Math.sin(a) * 80 + r,
          t
        );

        const radius = r + (n - 0.5) * 24;
        const x = size / 2 + Math.cos(a) * radius;
        const y = size / 2 + Math.sin(a) * radius;

        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.stroke();
    }
  }

  function animateGallery() {
    frame++;

    if (frame % 2 === 0) {
      t += 0.035;

      drawPixels(white, "white");
      drawPixels(value, "value");
      drawPixels(fbm, "fbm");
      drawVoronoi();
      drawPixels(simplex, "simplex");
      drawPerlinLines();
    }

    requestAnimationFrame(animateGallery);
  }

  animateGallery();
});
