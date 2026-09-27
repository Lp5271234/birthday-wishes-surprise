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

  const $ = (selector) => document.querySelector(selector);
  const welcome = $("#welcome");
  const celebration = $("#celebration");
  const startButton = $("#startButton");
  const replayButton = $("#replayButton");
  const soundButton = $("#soundButton");
  const spotlightCard = $("#spotlightCard");
  const spotlightText = $("#spotlightText");
  const wishLayer = $("#wishLayer");
  const wishStage = $("#wishStage");
  const progressText = $("#progressText");
  const progressBar = $("#progressBar");
  const toast = $("#toast");
  const confettiCanvas = $("#confetti");
  const confettiContext = confettiCanvas.getContext("2d");

  const params = new URLSearchParams(window.location.search);
  const requestedName = (params.get("to") || params.get("name") || "").trim();
  const friendName = requestedName ? requestedName.replace(/[<>]/g, "").slice(0, 16) : "亲爱的朋友";
  $("#welcomeName").textContent = friendName;
  $("#celebrationName").textContent = friendName;
  document.title = `生日快乐｜送给${friendName}的满满祝福`;

  let started = false;
  let spotlightIndex = 0;
  let bubbleIndex = 0;
  let bubbleQueue = [];
  let spotlightTimer = null;
  let bubbleTimer = null;
  let confettiTimer = null;
  let toastTimer = null;
  let soundEnabled = true;
  let audioContext = null;
  let melodyTimer = null;
  let activeOscillators = [];

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
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function clearTimers() {
    window.clearTimeout(spotlightTimer);
    window.clearTimeout(bubbleTimer);
    window.clearTimeout(confettiTimer);
    spotlightTimer = null;
    bubbleTimer = null;
    confettiTimer = null;
  }

  function resetShow() {
    clearTimers();
    spotlightIndex = 0;
    bubbleIndex = 0;
    bubbleQueue = shuffle(wishes);
    wishLayer.replaceChildren();
    spotlightCard.classList.remove("show", "pop");
    progressBar.style.width = "0%";
    progressText.textContent = `祝福 0 / ${wishes.length}`;
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
      burstConfetti(window.innerWidth / 2, window.innerHeight * 0.46, 110);
    }, 420);

    bubbleTimer = window.setTimeout(spawnBubble, 320);
    confettiTimer = window.setTimeout(confettiLoop, 1500);
    playMelody();
  }

  function nextSpotlight() {
    if (!started) return;
    const wish = wishes[spotlightIndex];
    spotlightText.textContent = wish;
    spotlightCard.classList.remove("pop");
    void spotlightCard.offsetWidth;
    spotlightCard.classList.add("show", "pop");
    progressText.textContent = `祝福 ${spotlightIndex + 1} / ${wishes.length}`;
    progressBar.style.width = `${((spotlightIndex + 1) / wishes.length) * 100}%`;

    if ((spotlightIndex + 1) % 8 === 0) {
      burstConfetti(window.innerWidth * (0.22 + Math.random() * 0.56), window.innerHeight * (0.2 + Math.random() * 0.35), 48);
    }

    spotlightIndex += 1;
    if (spotlightIndex >= wishes.length) {
      spotlightTimer = window.setTimeout(() => {
        spotlightText.textContent = "福运连连，快乐不停";
        progressText.textContent = "祝福已全部送达";
        progressBar.style.width = "100%";
        burstConfetti(window.innerWidth / 2, window.innerHeight * 0.34, 150);
        spotlightIndex = 0;
        bubbleQueue = shuffle(wishes);
        bubbleIndex = 0;
        spotlightTimer = window.setTimeout(nextSpotlight, 2200);
      }, 1500);
    } else {
      spotlightTimer = window.setTimeout(nextSpotlight, 1650);
    }
  }

  function spawnBubble() {
    if (!started) return;
    if (bubbleIndex >= bubbleQueue.length) {
      bubbleQueue = shuffle(wishes);
      bubbleIndex = 0;
    }

    const wish = bubbleQueue[bubbleIndex];
    bubbleIndex += 1;

    const bubble = document.createElement("div");
    bubble.className = "wish-bubble";
    bubble.textContent = wish;
    const hue = [338, 20, 48, 275, 205][Math.floor(Math.random() * 5)];
    bubble.style.setProperty("--hue", hue);
    bubble.style.setProperty("--rise", `${110 + Math.random() * 210}px`);
    bubble.style.setProperty("--rotate", `${-7 + Math.random() * 14}deg`);
    bubble.style.setProperty("--duration", `${4.8 + Math.random() * 2.8}s`);
    bubble.style.left = `${7 + Math.random() * 76}%`;
    bubble.style.top = `${20 + Math.random() * 58}%`;
    bubble.style.fontSize = `${12 + Math.random() * 5}px`;

    wishLayer.appendChild(bubble);
    while (wishLayer.childElementCount > 24) {
      wishLayer.firstElementChild.remove();
    }
    window.setTimeout(() => bubble.remove(), 7800);
    bubbleTimer = window.setTimeout(spawnBubble, 480 + Math.random() * 360);
  }

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

      if (piece.age >= piece.life || piece.y > window.innerHeight + 50) {
        confetti.splice(index, 1);
      }
    }
    window.requestAnimationFrame(drawConfetti);
  }

  function confettiLoop() {
    if (!started) return;
    burstConfetti(
      window.innerWidth * (0.18 + Math.random() * 0.64),
      window.innerHeight * (0.16 + Math.random() * 0.3),
      34
    );
    confettiTimer = window.setTimeout(confettiLoop, 2800);
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

    activeOscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch (_) {}
    });
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

    const totalDuration = cursor - startAt;
    melodyTimer = window.setTimeout(playMelody, (totalDuration + 3.2) * 1000);
  }

  function stopMelody() {
    window.clearTimeout(melodyTimer);
    activeOscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch (_) {}
    });
    activeOscillators = [];
  }

  startButton.addEventListener("click", () => {
    if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
    startShow();
  });

  replayButton.addEventListener("click", () => {
    resetShow();
    nextSpotlight();
    burstConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 100);
    playMelody();
    showToast("祝福重新开始啦");
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

  wishStage.addEventListener("pointerdown", (event) => {
    burstConfetti(event.clientX, event.clientY, 32);
  });

  window.addEventListener("resize", resizeConfetti);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopMelody();
    } else if (started && soundEnabled) {
      playMelody();
    }
  });

  resizeConfetti();
  window.requestAnimationFrame(drawConfetti);
})();
