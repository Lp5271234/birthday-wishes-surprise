(() => {
  "use strict";

  const wishes = [
    "生日快乐", "福如东海", "寿比南山", "长命百岁", "福寿安康", "福寿双全",
    "寿与天齐", "松鹤延年", "鹤寿千岁", "龟鹤遐寿", "万寿无疆", "海屋添筹",
    "南山献寿", "寿元无量", "福寿绵长", "福寿康宁", "延年益寿", "增福添寿",
    "岁岁平安", "福寿齐天", "寿山福海", "寿星高照", "华诞之喜", "生辰快乐",
    "福寿满堂", "身体健康", "身强体壮", "身强力壮", "健步如飞", "生龙活虎",
    "龙马精神", "精神矍铄", "神采奕奕", "容光焕发", "满面红光", "鹤发童颜",
    "筋骨强健", "气血充盈", "心宽体健", "安然无恙", "无病无灾", "百病不侵",
    "健康长寿", "福体安康", "贵体安康", "身心康泰", "康健顺遂", "元气满满",
    "精力充沛", "活力四射", "前程似锦", "鹏程万里", "锦绣前程", "前途无量",
    "前途似锦", "平步青云", "青云直上", "步步高升", "蒸蒸日上", "飞黄腾达",
    "功成名就", "马到成功", "旗开得胜", "出类拔萃", "大展宏图", "大展经纶",
    "宏图大展", "事业有成", "学业有成", "金榜题名", "一帆风顺", "一路顺风",
    "万事亨通", "百事大吉", "功业辉煌", "天天开心", "笑口常开", "喜笑颜开",
    "眉开眼笑", "喜上眉梢", "欢天喜地", "喜气洋洋", "心花怒放", "乐不可支",
    "笑逐颜开", "欢欣鼓舞", "其乐融融", "喜气盈门", "快乐无忧", "无忧无虑",
    "怡然自得", "悠然自得", "幸福美满", "吉祥如意", "万事如意", "心想事成",
    "福星高照", "洪福齐天", "好运连连", "福运连连"
  ];

  const SPOTLIGHT_INTERVAL = 500;
  const $ = (selector) => document.querySelector(selector);
  const welcome = $("#welcome");
  const celebration = $("#celebration");
  const startButton = $("#startButton");
  const replayButton = $("#replayButton");
  const soundButton = $("#soundButton");
  const spotlightCard = $("#spotlightCard");
  const spotlightText = $("#spotlightText");
  const progressText = $("#progressText");
  const progressBar = $("#progressBar");
  const toast = $("#toast");
  const confettiCanvas = $("#confetti");
  const confettiContext = confettiCanvas.getContext("2d");
  const heartViewport = $("#heartViewport");
  const heartSpace = $("#heartSpace");
  const heartWords = $("#heartWords");

  const params = new URLSearchParams(window.location.search);
  const requestedName = (params.get("to") || params.get("name") || "").trim();
  const friendName = requestedName ? requestedName.replace(/[<>]/g, "").slice(0, 16) : "亲爱的朋友";
  $("#welcomeName").textContent = friendName;
  $("#celebrationName").textContent = friendName;
  document.title = `生日快乐｜送给${friendName}的满满祝福`;

  let started = false;
  let heartFormed = false;
  let spotlightIndex = 0;
  let spotlightTimer = null;
  let confettiTimer = null;
  let toastTimer = null;
  let soundEnabled = true;
  let audioContext = null;
  let melodyTimer = null;
  let activeOscillators = [];
  let wantsGyroscope = false;

  let targetRotX = -8;
  let targetRotY = 0;
  let currentRotX = -8;
  let currentRotY = 0;
  let currentZoom = 1;
  let targetZoom = 1;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragDistance = 0;
  let pressedWord = null;
  let lastFrameTime = performance.now();
  let orientationBase = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function clearTimers() {
    window.clearTimeout(spotlightTimer);
    window.clearTimeout(confettiTimer);
    spotlightTimer = null;
    confettiTimer = null;
  }

  function createHeartWords() {
    heartWords.replaceChildren();
    const layers = 5;
    const wordsPerLayer = wishes.length / layers;
    const depthZ = [47, 23, 0, -23, -47];
    const wordOpacity = [0.98, 0.78, 0.6, 0.44, 0.32];
    wishes.forEach((wish, index) => {
      const layer = Math.floor(index / wordsPerLayer);
      const positionInLayer = index % wordsPerLayer;
      const t = (positionInLayer / wordsPerLayer) * Math.PI * 2 + layer * (Math.PI / 50);
      const z = depthZ[layer];
      const x = 16 * Math.pow(Math.sin(t), 3) * 7.35;
      const heartY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const y = -heartY * 7.35;
      const rotateY = (x >= 0 ? -11 : 11) + (Math.random() * 7 - 3.5);
      const rotateZ = -6 + Math.random() * 12;
      const word = document.createElement("span");
      word.className = "word-3d" + (layer <= 1 ? " is-front" : "");
      word.textContent = wish;
      word.dataset.wish = wish;
      word.style.setProperty("--hue", [338, 20, 48, 275, 205][layer]);
      word.style.setProperty("--word-size", `${9 + ((index + layer) % 3)}px`);
      word.style.setProperty("--opacity", wordOpacity[layer].toFixed(2));
      word.style.setProperty(
        "--target-transform",
        `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z}px) rotateY(${rotateY.toFixed(1)}deg) rotateZ(${rotateZ.toFixed(1)}deg) scale(1)`
      );
      heartWords.appendChild(word);
    });
  }

  function resetShow() {
    clearTimers();
    spotlightIndex = 0;
    heartFormed = false;
    spotlightCard.classList.remove("is-converging");
    heartViewport.classList.remove("is-active");
    heartViewport.setAttribute("aria-hidden", "true");
    heartWords.querySelectorAll(".word-3d").forEach((word) => word.classList.remove("is-formed", "word-hit"));
    progressBar.style.width = "0%";
    progressText.textContent = `祝福 0 / ${wishes.length}`;
    targetRotX = -8;
    targetRotY = 0;
    targetZoom = 1;
    currentRotX = -8;
    currentRotY = 0;
    currentZoom = 1;
  }

  function startShow() {
    started = true;
    resetShow();
    welcome.classList.remove("is-active");
    celebration.classList.add("is-active");
    celebration.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      spotlightCard.classList.add("show");
      nextSpotlight();
      burstConfetti(window.innerWidth / 2, window.innerHeight * 0.46, 120);
    }, 360);

    confettiTimer = window.setTimeout(confettiLoop, 1400);
    playMelody();
  }

  function nextSpotlight() {
    if (!started || heartFormed) return;
    spotlightText.textContent = wishes[spotlightIndex];
    spotlightCard.classList.remove("pop");
    void spotlightCard.offsetWidth;
    spotlightCard.classList.add("show", "pop");
    progressText.textContent = `祝福 ${spotlightIndex + 1} / ${wishes.length}`;
    progressBar.style.width = `${((spotlightIndex + 1) / wishes.length) * 100}%`;

    spotlightIndex += 1;
    if (spotlightIndex >= wishes.length) {
      progressText.textContent = "100 句祝福汇聚中…";
      spotlightTimer = window.setTimeout(formHeart, 560);
    } else {
      spotlightTimer = window.setTimeout(nextSpotlight, SPOTLIGHT_INTERVAL);
    }
  }

  function formHeart() {
    if (heartFormed) return;
    heartFormed = true;
    clearTimers();
    spotlightCard.classList.add("is-converging");
    heartViewport.classList.add("is-active");
    heartViewport.setAttribute("aria-hidden", "false");

    const words = Array.from(heartWords.querySelectorAll(".word-3d"));
    words.forEach((word, index) => {
      window.setTimeout(() => word.classList.add("is-formed"), index * 11);
    });

    window.setTimeout(() => {
      spotlightCard.classList.remove("show", "is-converging");
      progressText.textContent = "100 句祝福已汇聚成爱";
      progressBar.style.width = "100%";
      burstConfetti(window.innerWidth / 2, window.innerHeight * 0.38, 180);
      showToast("拖拽旋转，倾斜手机也能看");
    }, 1550);
    playMelody();
  }

  function enableGyroscope() {
    const handler = (event) => {
      wantsGyroscope = true;
      if (event.beta == null || event.gamma == null) return;
      if (!orientationBase) orientationBase = { beta: event.beta, gamma: event.gamma };
      targetRotY = clamp((event.gamma - orientationBase.gamma) * 0.72, -52, 52);
      targetRotX = clamp(-8 + (event.beta - orientationBase.beta) * 0.38, -48, 34);
      targetZoom = 1.02;
    };

    if (typeof DeviceOrientationEvent === "undefined") {
      wantsGyroscope = false;
      showToast("当前浏览器不支持陀螺仪，拖动也能旋转");
      return;
    }
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then((permission) => {
        if (permission === "granted") {
          window.addEventListener("deviceorientation", handler, true);
        } else {
          wantsGyroscope = false;
          showToast("陀螺仪未授权，可拖拽旋转");
        }
      }).catch(() => {
        wantsGyroscope = false;
      });
    } else {
      window.addEventListener("deviceorientation", handler, true);
    }
  }

  function startHeartLoop() {
    function loop(now) {
      const delta = Math.min(32, now - lastFrameTime);
      lastFrameTime = now;
      if (!dragging) {
        const autoSpeed = wantsGyroscope ? 0.0045 : 0.038;
        targetRotY += autoSpeed * delta;
      }
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentZoom += (targetZoom - currentZoom) * 0.08;
      heartSpace.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale(${currentZoom.toFixed(3)})`;
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
  }

  heartViewport.addEventListener("pointerdown", (event) => {
    dragging = true;
    pressedWord = event.target.closest(".word-3d");
    dragStartX = dragLastX = event.clientX;
    dragStartY = dragLastY = event.clientY;
    dragDistance = 0;
    heartViewport.setPointerCapture(event.pointerId);
  });

  heartViewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragLastX;
    const dy = event.clientY - dragLastY;
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    dragDistance += Math.abs(dx) + Math.abs(dy);
    targetRotY += dx * 0.48;
    targetRotX = clamp(targetRotX - dy * 0.36, -62, 62);
  });

  heartViewport.addEventListener("pointerup", (event) => {
    dragging = false;
    if (dragDistance < 9 && pressedWord) {
      pressedWord.classList.remove("word-hit");
      void pressedWord.offsetWidth;
      pressedWord.classList.add("word-hit");
      showToast(`「${pressedWord.dataset.wish}」送给你`);
      burstConfetti(event.clientX, event.clientY, 28);
    }
    pressedWord = null;
  });

  heartViewport.addEventListener("pointercancel", () => {
    dragging = false;
  });

  heartViewport.addEventListener("dblclick", () => {
    targetZoom = targetZoom > 1.12 ? 0.92 : 1.34;
  });

  heartViewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    targetZoom = clamp(targetZoom - event.deltaY * 0.001, 0.78, 1.55);
  }, { passive: false });

  function resizeConfetti() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = Math.floor(window.innerWidth * ratio);
    confettiCanvas.height = Math.floor(window.innerHeight * ratio);
    confettiCanvas.style.width = `${window.innerWidth}px`;
    confettiCanvas.style.height = `${window.innerHeight}px`;
    confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  const confetti = [];
  const colors = ["#ffd86e", "#ff6f9f", "#b892ff", "#71e6d9", "#ff9e5f", "#fff1c9"];

  function burstConfetti(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.4 + Math.random() * 7.5;
      confetti.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        gravity: 0.11 + Math.random() * 0.08,
        rotation: Math.random() * Math.PI,
        rotationSpeed: -0.18 + Math.random() * 0.36,
        width: 5 + Math.random() * 7,
        height: 8 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100 + Math.random() * 70,
        age: 0
      });
    }
    if (confetti.length > 700) confetti.splice(0, confetti.length - 700);
  }

  function drawConfetti() {
    confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let index = confetti.length - 1; index >= 0; index -= 1) {
      const piece = confetti[index];
      piece.age += 1;
      piece.vy += piece.gravity;
      piece.vx *= 0.992;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.rotationSpeed;
      const opacity = Math.max(0, 1 - piece.age / piece.life);
      confettiContext.save();
      confettiContext.globalAlpha = opacity;
      confettiContext.translate(piece.x, piece.y);
      confettiContext.rotate(piece.rotation);
      confettiContext.fillStyle = piece.color;
      confettiContext.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      confettiContext.restore();
      if (piece.age >= piece.life || piece.y > window.innerHeight + 50) confetti.splice(index, 1);
    }
    window.requestAnimationFrame(drawConfetti);
  }

  function confettiLoop() {
    if (!started) return;
    burstConfetti(window.innerWidth * (0.18 + Math.random() * 0.64), window.innerHeight * (0.16 + Math.random() * 0.3), 32);
    confettiTimer = window.setTimeout(confettiLoop, 3200);
  }

  const melodies = [
    [392.00, 0.34], [392.00, 0.24], [440.00, 0.58], [392.00, 0.58], [523.25, 0.58], [493.88, 1.08],
    [392.00, 0.34], [392.00, 0.24], [440.00, 0.58], [392.00, 0.58], [587.33, 0.58], [523.25, 1.08],
    [392.00, 0.34], [392.00, 0.24], [783.99, 0.58], [659.25, 0.58], [523.25, 0.58], [493.88, 0.58], [440.00, 1.08],
    [698.46, 0.34], [698.46, 0.24], [659.25, 0.58], [523.25, 0.58], [587.33, 0.58], [523.25, 1.15]
  ];

  function playMelody() {
    if (!soundEnabled) return;
    window.clearTimeout(melodyTimer);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContext) audioContext = new AudioContextClass();
    audioContext.resume().catch(() => {});
    activeOscillators.forEach((oscillator) => { try { oscillator.stop(); } catch (_) {} });
    activeOscillators = [];
    const startAt = audioContext.currentTime + 0.08;
    let cursor = startAt;
    melodies.forEach(([frequency, duration]) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(0.055, cursor + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + Math.max(0.08, duration * 0.82));
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(cursor);
      oscillator.stop(cursor + duration * 1.05);
      activeOscillators.push(oscillator);
      cursor += duration;
    });
    melodyTimer = window.setTimeout(playMelody, (cursor - startAt + 3.2) * 1000);
  }

  function stopMelody() {
    window.clearTimeout(melodyTimer);
    activeOscillators.forEach((oscillator) => { try { oscillator.stop(); } catch (_) {} });
    activeOscillators = [];
  }

  startButton.addEventListener("click", () => {
    if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
    enableGyroscope();
    startShow();
  });

  replayButton.addEventListener("click", () => {
    resetShow();
    started = true;
    spotlightCard.classList.add("show");
    restartConfetti();
    nextSpotlight();
    playMelody();
    showToast("100 句祝福重新开始");
  });

  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? "音乐开启" : "音乐关闭";
    if (soundEnabled) {
      playMelody();
      showToast("音乐已开启");
    } else {
      stopMelody();
      showToast("音乐已关闭");
    }
  });

  function restartConfetti() {
    window.clearTimeout(confettiTimer);
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.42, 90);
    confettiTimer = window.setTimeout(confettiLoop, 1400);
  }

  window.addEventListener("resize", resizeConfetti);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMelody();
    else if (started && soundEnabled) playMelody();
  });

  createHeartWords();
  resizeConfetti();
  startHeartLoop();
  window.requestAnimationFrame(drawConfetti);
})();






