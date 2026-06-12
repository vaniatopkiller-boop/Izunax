function initNoise(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0, h = 0;
  const SCALE = 4;
  let frame = 0;

  function resize() {
    w = canvas.width = Math.ceil(window.innerWidth / SCALE);
    h = canvas.height = Math.ceil(window.innerHeight / SCALE);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.style.imageRendering = "pixelated";
  }

  function draw() {
    frame++;
    if (frame % 3 !== 0) { requestAnimationFrame(draw); return; }
    const imageData = ctx.createImageData(w, h);
    const buf = new Uint32Array(imageData.data.buffer);
    for (let i = 0, len = buf.length; i < len; i++) {
      const v = (Math.random() * 255) | 0;
      const a = (Math.random() * 25) | 0;
      buf[i] = (a << 24) | (v << 16) | (v << 8) | v;
    }
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
}

function initGlitch() {
  const els = document.querySelectorAll(".glitch");
  els.forEach(el => {
    const text = el.dataset.text || el.textContent;
    el.setAttribute("data-text", text);
  });
}

function typeWriter(el, text, speed = 40, callback) {
  let i = 0;
  el.textContent = "";
  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else if (callback) {
      callback();
    }
  }
  type();
}

function initTerminalBoot(container, lines, onComplete) {
  let lineIdx = 0;
  function addLine() {
    if (lineIdx >= lines.length) {
      if (onComplete) onComplete();
      return;
    }
    const line = document.createElement("div");
    line.className = "terminal-line";
    const text = lines[lineIdx];
    if (text.startsWith("[OK]")) {
      line.innerHTML = `<span class="t-ok">[OK]</span> ${text.substring(4)}`;
    } else if (text.startsWith("[!!]")) {
      line.innerHTML = `<span class="t-warn">[!!]</span> ${text.substring(4)}`;
    } else if (text.startsWith("[ERR]")) {
      line.innerHTML = `<span class="t-err">[ERR]</span> ${text.substring(5)}`;
    } else {
      line.textContent = text;
    }
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    lineIdx++;
    setTimeout(addLine, 80 + Math.random() * 120);
  }
  addLine();
}

function flashScreen() {
  const flash = document.createElement("div");
  flash.style.cssText = "position:fixed;inset:0;background:#fff;opacity:0.15;z-index:9999;pointer-events:none;";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 100);
}

function initCRTFlicker() {
  setInterval(() => {
    if (Math.random() < 0.03) {
      document.body.classList.add("crt-flicker");
      setTimeout(() => document.body.classList.remove("crt-flicker"), 150);
    }
  }, 2000);
}

export { initNoise, initGlitch, typeWriter, initTerminalBoot, flashScreen, initCRTFlicker };
