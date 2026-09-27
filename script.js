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

  const GROUP_SIZE = 5;
  const TOTAL_GROUPS = wishes.length / GROUP_SIZE;
  const DETECTED_BPM = 129.2;
  const THREE_BEATS_MS = (60000 / DETECTED_BPM) * 3;
  const START_DELAY_MS = 450;

  const $ = (selector) => document.querySelector(selector);
  const welcome = $("#welcome");
  const celebration = $("#celebration");
  const startButton = $("#startButton");
  const replayButton = $("#replayButton");
  const soundButton = $("#soundButton");
  const spotlightCard = $("#spotlightCard");
  const batchGrid = $("#batchGrid");
  const wishLayer = $("#wishLayer");
  const progressText = $("#progressText");
  const progressBar = $("#progressBar");
  const toast = $("#toast");
  const confettiCanvas = $("#confetti");
  const confettiContext = confettiCanvas.getContext("2d");
  const heartViewport = $("#heartViewport");
  const heartSpace = $("#heartSpace");
  const heartWords = $("#heartWords");
  const backgroundMusic = $("#backgroundMusic");
  const zoomOutButton = $("#zoomOutButton");
  const zoomResetButton = $("#zoomResetButton");
  const zoomInButton = $("#zoomInButton");

  const params = new URLSearchParams(window.location.search);
  const requestedName = (params.get("to") || params.get("name") || "").trim();
  const friendName = requestedName ? requestedName.replace(/[<>]/g, "").slice(0, 16) : "亲爱的朋友";
  $("#welcomeName").textContent = friendName;
  $("#celebrationName").textContent = friendName;
  document.title = `生日快乐｜送给${friendName}的满满祝福`;

  let started = false;
  let heartFormed = false;
  let groupIndex = 0;
  let groupTimer = null;
  let confettiTimer = null;
  let toastTimer = null;
  let soundEnabled = true;
  let wantsGyroscope = false;

  let targetRotX = -8;
  let targetRotY = 0;
  let currentRotX = -8;
  let currentRotY = 0;
  let currentZoom = 1;
  let targetZoom = 1;
  let dragging = false;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragDistance = 0;
  let pressedWord = null;
  let orientationBase = null;
  let lastFrameTime = performance.now();
  const activePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function clearTimers() {
    window.clearTimeout(groupTimer);
    window.clearTimeout(confettiTimer);
    groupTimer = null;
    confettiTimer = null;
  }

  function ensureMusicPlaying() {
    if (!soundEnabled) return Promise.resolve();
    backgroundMusic.volume = 0.76;
    backgroundMusic.muted = false;
    const playResult = backgroundMusic.play();
    return playResult && typeof playResult.catch === "function" ? playResult.catch(() => {}) : Promise.resolve();
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
    groupIndex = 0;
    heartFormed = false;
    spotlightCard.classList.remove("is-converging");
    heartViewport.classList.remove("is-active");
    heartViewport.setAttribute("aria-hidden", "true");
    heartWords.querySelectorAll(".word-3d").forEach((word) => word.classList.remove("is-formed", "word-hit"));
    wishLayer.replaceChildren();
    batchGrid.replaceChildren();
    progressBar.style.width = "0%";
    progressText.textContent = `祝福 0 / ${wishes.length}`;
    targetRotX = -8;
    targetRotY = 0;
    targetZoom = 1;
    currentRotX = -8;
    currentRotY = 0;
    currentZoom = 1;
    activePointers.clear();
  }

  function startShow() {
    started = true;
    resetShow();
    welcome.classList.remove("is-active");
    celebration.classList.add("is-active");
    celebration.setAttribute("aria-hidden", "false");
    soundButton.textContent = "背景音乐开";

    ensureMusicPlaying();
    groupTimer = window.setTimeout(showNextGroup, START_DELAY_MS);
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.46, 100);
    confettiTimer = window.setTimeout(confettiLoop, 1700);
  }

  function showNextGroup() {
    if (!started || heartFormed) return;
    if (groupIndex >= TOTAL_GROUPS) {
      groupTimer = window.setTimeout(formHeart, 900);
      return;
    }

    const start = groupIndex * GROUP_SIZE;
    const group = wishes.slice(start, start + GROUP_SIZE);
    batchGrid.replaceChildren();
    group.forEach((wish, index) => {
      const item = document.createElement("span");
      item.className = "batch-word";
      item.textContent = wish;
      item.style.setProperty("--i", index);
      batchGrid.appendChild(item);
    });

    spotlightCard.classList.remove("pop");
    void spotlightCard.offsetWidth;
    spotlightCard.classList.add("show", "pop");
    spawnBatchBubbles(group);
    groupIndex += 1;
    progressText.textContent = `祝福 ${groupIndex * GROUP_SIZE} / ${wishes.length} · 每3拍一组`;
    progressBar.style.width = `${((groupIndex * GROUP_SIZE) / wishes.length) * 100}%`;

    if (groupIndex >= TOTAL_GROUPS) {
      groupTimer = window.setTimeout(formHeart, 980);
    } else {
      groupTimer = window.setTimeout(showNextGroup, THREE_BEATS_MS);
    }
  }

  function spawnBatchBubbles(group) {
    const anchors = [
      [17, 28], [70, 24], [12, 54], [73, 57], [44, 72]
    ];
    group.forEach((wish, index) => {
      const bubble = document.createElement("div");
      bubble.className = "wish-bubble";
      bubble.textContent = wish;
      bubble.style.setProperty("--hue", [338, 20, 48, 275, 205][index]);
      bubble.style.setProperty("--rise", `${48 + Math.random() * 70}px`);
      bubble.style.setProperty("--rotate", `${-6 + Math.random() * 12}deg`);
      bubble.style.setProperty("--duration", `${1.26 + Math.random() * .14}s`);
      bubble.style.left = `${anchors[index][0]}%`;
      bubble.style.top = `${anchors[index][1]}%`;
      bubble.style.fontSize = `${12 + (index % 3)}px`;
      bubble.style.animationDelay = `${index * 35}ms`;
      wishLayer.appendChild(bubble);
      window.setTimeout(() => bubble.remove(), 1750);
    });
    while (wishLayer.childElementCount > 20) wishLayer.firstElementChild.remove();
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
      window.setTimeout(() => word.classList.add("is-formed"), index * 8);
    });

    window.setTimeout(() => {
      spotlightCard.classList.remove("show", "is-converging");
      progressText.textContent = "100 句祝福已汇聚成爱";
      progressBar.style.width = "100%";
      burstConfetti(window.innerWidth / 2, window.innerHeight * 0.38, 190);
      showToast("拖动旋转，放大看看整颗爱心");
      ensureMusicPlaying();
    }, 840);
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
        if (permission === "granted") window.addEventListener("deviceorientation", handler, true);
        else wantsGyroscope = false;
      }).catch(() => { wantsGyroscope = false; });
    } else {
      window.addEventListener("deviceorientation", handler, true);
    }
  }

  function startHeartLoop() {
    function loop(now) {
      const delta = Math.min(32, now - lastFrameTime);
      lastFrameTime = now;
      if (!dragging && activePointers.size < 2) {
        targetRotY += (wantsGyroscope ? 0.0045 : 0.038) * delta;
      }
      currentRotY += (targetRotY - currentRotY) * 0.09;
      currentRotX += (targetRotX - currentRotX) * 0.09;
      currentZoom += (targetZoom - currentZoom) * 0.1;
      heartSpace.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale(${currentZoom.toFixed(3)})`;
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
  }

  function pointerDistance() {
    const values = Array.from(activePointers.values());
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  heartViewport.addEventListener("pointerdown", (event) => {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pressedWord = event.target.closest(".word-3d");
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    dragDistance = 0;
    dragging = true;
    if (activePointers.size === 2) {
      pinchStartDistance = pointerDistance();
      pinchStartZoom = targetZoom;
      dragDistance = 99;
    }
    heartViewport.setPointerCapture(event.pointerId);
  });

  heartViewport.addEventListener("pointermove", (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size >= 2) {
      const distance = pointerDistance();
      if (pinchStartDistance > 0) targetZoom = clamp(pinchStartZoom * distance / pinchStartDistance, 0.72, 1.8);
      return;
    }
    if (!dragging) return;
    const dx = event.clientX - dragLastX;
    const dy = event.clientY - dragLastY;
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    dragDistance += Math.abs(dx) + Math.abs(dy);
    targetRotY += dx * 0.48;
    targetRotX = clamp(targetRotX - dy * 0.36, -62, 62);
  });

  function releasePointer(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) pinchStartDistance = 0;
    if (activePointers.size === 0) {
      dragging = false;
      if (dragDistance < 9 && pressedWord) {
        pressedWord.classList.remove("word-hit");
        void pressedWord.offsetWidth;
        pressedWord.classList.add("word-hit");
        showToast(`「${pressedWord.dataset.wish}」送给你`);
        burstConfetti(event.clientX, event.clientY, 28);
      }
      pressedWord = null;
    }
  }

  heartViewport.addEventListener("pointerup", releasePointer);
  heartViewport.addEventListener("pointercancel", releasePointer);

  heartViewport.addEventListener("dblclick", () => {
    targetZoom = targetZoom > 1.12 ? 0.92 : 1.34;
  });

  heartViewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    targetZoom = clamp(targetZoom - event.deltaY * 0.001, 0.72, 1.8);
  }, { passive: false });

  function changeZoom(delta) {
    targetZoom = clamp(targetZoom + delta, 0.72, 1.8);
    showToast(targetZoom > 1 ? "爱心已放大" : "爱心已缩小");
  }

  [[zoomOutButton, -0.18], [zoomInButton, 0.18], [zoomResetButton, 1]].forEach(([button, value]) => {
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (value === 1) {
        targetZoom = 1;
        targetRotX = -8;
        targetRotY = 0;
        showToast("爱心已恢复默认大小");
      } else {
        changeZoom(value);
      }
    });
  });

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
        x, y,
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

  startButton.addEventListener("click", () => {
    if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
    enableGyroscope();
    startShow();
  });

  replayButton.addEventListener("click", () => {
    resetShow();
    started = true;
    heartViewport.classList.remove("is-active");
    groupTimer = window.setTimeout(showNextGroup, START_DELAY_MS);
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.42, 80);
    ensureMusicPlaying();
    showToast("100 句祝福重新开始，音乐继续播放");
  });

  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? "背景音乐开" : "背景音乐关";
    backgroundMusic.muted = !soundEnabled;
    if (soundEnabled) ensureMusicPlaying();
    showToast(soundEnabled ? "背景音乐已开启" : "背景音乐已关闭，动画继续");
  });

  window.addEventListener("resize", resizeConfetti);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && started && soundEnabled) ensureMusicPlaying();
  });

  createHeartWords();
  resizeConfetti();
  startHeartLoop();
  window.requestAnimationFrame(drawConfetti);
})();

