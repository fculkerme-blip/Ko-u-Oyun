(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const $ = (id) => document.getElementById(id);
  const screens = {
    menu: $('menuScreen'),
    message: $('messageScreen'),
    shop: $('shopScreen'),
  };

  const ui = {
    levelText: $('levelText'),
    coinText: $('coinText'),
    sizeText: $('sizeText'),
    questionText: $('questionText'),
    tablePicker: $('tablePicker'),
    startBtn: $('startBtn'),
    shopOpenBtn: $('shopOpenBtn'),
    shopCloseBtn: $('shopCloseBtn'),
    shopCoinText: $('shopCoinText'),
    hatGrid: $('hatGrid'),
    continueBtn: $('continueBtn'),
    retryBtn: $('retryBtn'),
    homeBtn: $('homeBtn'),
    messageKicker: $('messageKicker'),
    messageTitle: $('messageTitle'),
    messageBody: $('messageBody'),
    leftBtn: $('leftBtn'),
    rightBtn: $('rightBtn'),
    pauseBtn: $('pauseBtn'),
    selectAllBtn: $('selectAllBtn'),
    selectNoneBtn: $('selectNoneBtn'),
  };

  const palette = [
    { name: 'Pembe', hex: '#ff4fa3' },
    { name: 'Mavi', hex: '#3498db' },
    { name: 'Yeşil', hex: '#00b894' },
    { name: 'Turuncu', hex: '#ff9f1a' },
    { name: 'Mor', hex: '#8e44ad' },
  ];

  const hats = [
    { id: 'none', emoji: '🙂', name: 'Şapkasız', cost: 0 },
    { id: 'cap', emoji: '🧢', name: 'Spor Şapka', cost: 20 },
    { id: 'crown', emoji: '👑', name: 'Kral Tacı', cost: 80 },
    { id: 'grad', emoji: '🎓', name: 'Mezun Kepi', cost: 60 },
    { id: 'wizard', emoji: '🧙', name: 'Sihirbaz', cost: 100 },
    { id: 'helmet', emoji: '⛑️', name: 'Güvenlik Kaskı', cost: 45 },
    { id: 'cowboy', emoji: '🤠', name: 'Kovboy', cost: 75 },
    { id: 'detective', emoji: '🕵️', name: 'Dedektif', cost: 95 },
    { id: 'artist', emoji: '🎨', name: 'Ressam Beresi', cost: 70 },
    { id: 'astronaut', emoji: '🚀', name: 'Uzay Kaskı', cost: 120 },
    { id: 'pirate', emoji: '🏴‍☠️', name: 'Korsan', cost: 110 },
    { id: 'ninja', emoji: '🥷', name: 'Ninja', cost: 130 },
    { id: 'fire', emoji: '🔥', name: 'Alev Saç', unlockLevel: 8 },
    { id: 'star', emoji: '⭐', name: 'Yıldız', unlockLevel: 12 },
    { id: 'alien', emoji: '👽', name: 'Uzaylı', unlockLevel: 15 },
    { id: 'robot', emoji: '🤖', name: 'Robot', unlockLevel: 18 },
    { id: 'dragon', emoji: '🐉', name: 'Ejderha', unlockLevel: 22 },
    { id: 'diamond', emoji: '💎', name: 'Elmas', cost: 180 },
    { id: 'football', emoji: '⚽', name: 'Futbolcu', cost: 85 },
    { id: 'turkey', emoji: '🇹🇷', name: 'Bayrak', cost: 90 },
    { id: 'medal', emoji: '🏅', name: 'Madalya', unlockLevel: 25 },
    { id: 'trophy', emoji: '🏆', name: 'Kupa', unlockLevel: 30 },
    { id: 'brain', emoji: '🧠', name: 'Zeka Tacı', unlockLevel: 35 },
    { id: 'lightning', emoji: '⚡', name: 'Şimşek', cost: 160 },
    { id: 'rainbow', emoji: '🌈', name: 'Gökkuşağı', unlockLevel: 45 },
    { id: 'gemcrown', emoji: '💠', name: 'Kristal Taç', cost: 250 },
    { id: 'legend', emoji: '🌟', name: 'Efsane', unlockLevel: 60 },
  ];

  const storageKey = 'renkliCarpimKosusu.v1';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const defaultSave = {
    coins: 0,
    level: 1,
    bestLevel: 1,
    selectedTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    ownedHats: ['none'],
    activeHat: 'none',
  };

  const save = loadSave();

  let width = 0;
  let height = 0;
  let dpr = 1;
  let roadLeft = 0;
  let roadRight = 0;
  let playerY = 0;

  const state = {
    mode: 'menu',
    level: save.level,
    score: 0,
    coinsInRun: 0,
    runDistance: 0,
    levelLength: 2600,
    speed: 220,
    targetX: 0,
    keys: new Set(),
    lastTime: 0,
    objects: [],
    particles: [],
    messageKind: 'info',
    paused: false,
    selectedTables: new Set(save.selectedTables),
    question: null,
    answerLocked: false,
    bossResolved: false,
    player: {
      x: 0,
      colorIndex: 0,
      size: 1,
      minSize: 0.45,
      maxSize: 4.5,
    },
  };

  init();

  function init() {
    buildTablePicker();
    bindEvents();
    resize();
    renderShop();
    updateHud();
    showScreen('menu');
    requestAnimationFrame(loop);
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return clone(defaultSave);
      const parsed = JSON.parse(raw);
      return {
        ...clone(defaultSave),
        ...parsed,
        selectedTables: Array.isArray(parsed.selectedTables) && parsed.selectedTables.length ? parsed.selectedTables : clone(defaultSave.selectedTables),
        ownedHats: Array.isArray(parsed.ownedHats) && parsed.ownedHats.length ? parsed.ownedHats : ['none'],
      };
    } catch {
      return clone(defaultSave);
    }
  }

  function persist() {
    save.level = state.level;
    save.bestLevel = Math.max(save.bestLevel || 1, state.level);
    save.selectedTables = [...state.selectedTables].sort((a, b) => a - b);
    localStorage.setItem(storageKey, JSON.stringify(save));
  }

  function buildTablePicker() {
    ui.tablePicker.innerHTML = '';
    for (let n = 1; n <= 12; n += 1) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = String(n);
      input.checked = state.selectedTables.has(n);
      input.addEventListener('change', () => {
        if (input.checked) state.selectedTables.add(n);
        else state.selectedTables.delete(n);
        if (state.selectedTables.size === 0) {
          input.checked = true;
          state.selectedTables.add(n);
        }
        persist();
      });
      label.append(input, document.createTextNode(`${n}×`));
      ui.tablePicker.appendChild(label);
    }
  }

  function bindEvents() {
    window.addEventListener('resize', resize);

    ui.startBtn.addEventListener('click', () => startLevel(state.level));
    ui.continueBtn.addEventListener('click', () => {
      if (state.messageKind === 'pause') {
        state.paused = false;
        ui.pauseBtn.textContent = 'Ⅱ';
        screens.message.classList.remove('active');
      } else {
        startLevel(state.level);
      }
    });
    ui.retryBtn.addEventListener('click', () => startLevel(state.level));
    ui.homeBtn.addEventListener('click', () => showScreen('menu'));
    ui.shopOpenBtn.addEventListener('click', () => {
      renderShop();
      showScreen('shop');
    });
    ui.shopCloseBtn.addEventListener('click', () => showScreen(state.mode === 'playing' ? null : 'menu'));

    ui.selectAllBtn.addEventListener('click', () => setAllTables(true));
    ui.selectNoneBtn.addEventListener('click', () => {
      setAllTables(false);
      state.selectedTables.add(2);
      const input = ui.tablePicker.querySelector('input[value="2"]');
      if (input) input.checked = true;
      persist();
    });

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'a', 'd', ' ', 'p'].includes(key)) event.preventDefault();
      state.keys.add(key);
      if ((key === ' ' || key === 'p') && state.mode === 'playing') togglePause();
      if (key === 'enter' && screens.message.classList.contains('active')) ui.continueBtn.click();
    });
    window.addEventListener('keyup', (event) => state.keys.delete(event.key.toLowerCase()));

    bindHoldButton(ui.leftBtn, 'left');
    bindHoldButton(ui.rightBtn, 'right');
    ui.pauseBtn.addEventListener('click', togglePause);

    let dragging = false;
    const setPointerTarget = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      state.targetX = clamp(x, roadLeft + 30, roadRight - 30);
    };
    canvas.addEventListener('pointerdown', (event) => {
      if (state.mode !== 'playing') return;
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      setPointerTarget(event);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!dragging || state.mode !== 'playing') return;
      setPointerTarget(event);
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
  }

  function bindHoldButton(button, direction) {
    let interval = null;
    const start = () => {
      state.keys.add(direction === 'left' ? 'arrowleft' : 'arrowright');
      if (interval) clearInterval(interval);
      interval = setInterval(() => state.keys.add(direction === 'left' ? 'arrowleft' : 'arrowright'), 50);
    };
    const stop = () => {
      state.keys.delete(direction === 'left' ? 'arrowleft' : 'arrowright');
      if (interval) clearInterval(interval);
      interval = null;
    };
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    button.addEventListener('pointerleave', stop);
  }

  function setAllTables(selected) {
    state.selectedTables.clear();
    ui.tablePicker.querySelectorAll('input').forEach((input) => {
      input.checked = selected;
      if (selected) state.selectedTables.add(Number(input.value));
    });
    persist();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = Math.max(320, rect.width);
    height = Math.max(480, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    roadLeft = width * 0.18;
    roadRight = width * 0.82;
    playerY = height * 0.79;
    if (!state.player.x) {
      state.player.x = width / 2;
      state.targetX = width / 2;
    }
  }

  function showScreen(name) {
    Object.values(screens).forEach((screen) => screen.classList.remove('active'));
    if (name && screens[name]) screens[name].classList.add('active');
    if (name === 'menu') state.mode = 'menu';
  }

  function startLevel(level) {
    const boundedLevel = Math.max(1, Math.min(100, level));
    state.level = boundedLevel;
    state.score = 0;
    state.coinsInRun = 0;
    state.runDistance = 0;
    state.levelLength = 2500 + boundedLevel * 42;
    state.speed = 225 + Math.min(140, boundedLevel * 4);
    state.objects = [];
    state.particles = [];
    state.paused = false;
    state.answerLocked = false;
    state.bossResolved = false;
    state.player.x = width / 2;
    state.targetX = width / 2;
    state.player.colorIndex = randomInt(0, palette.length - 1);
    state.player.size = 1 + Math.min(0.65, boundedLevel * 0.012);
    state.question = makeQuestion();
    generateLevelObjects();
    showScreen(null);
    state.mode = 'playing';
    updateHud();
  }

  function makeQuestion() {
    const tables = [...state.selectedTables];
    const a = tables[randomInt(0, tables.length - 1)] || 2;
    const b = randomInt(1, 12);
    const correct = a * b;
    let wrong = correct;
    while (wrong === correct || wrong <= 0) {
      const offset = randomChoice([-12, -10, -9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
      wrong = correct + offset;
    }
    const correctSide = Math.random() > 0.5 ? 1 : 0;
    return {
      text: `${a} × ${b}`,
      correct,
      wrong,
      answers: correctSide === 0 ? [correct, wrong] : [wrong, correct],
      correctSide,
    };
  }

  function generateLevelObjects() {
    addGate(360);

    let dist = 650;
    const gapBase = Math.max(82, 134 - state.level * 1.6);
    while (dist < state.levelLength - 380) {
      const roll = Math.random();
      if (roll < 0.45) addStickPack(dist);
      else if (roll < 0.72) addWall(dist);
      else addCoinLine(dist);
      dist += randomInt(gapBase, gapBase + 95);
    }

    for (let i = 0; i < 16; i += 1) addCoin(state.levelLength - 310 + i * 18, randomLaneX(i % 3));

    state.objects.push({
      id: cryptoId(),
      type: 'boss',
      dist: state.levelLength - 80,
      bossSize: 1.25 + Math.min(2.8, state.level * 0.035),
      hit: false,
    });
  }

  function addGate(dist) {
    const gateWidth = Math.min(210, width * 0.22);
    const y = dist;
    state.objects.push({
      id: cryptoId(),
      type: 'gate',
      dist: y,
      width: gateWidth,
      correctSide: state.question.correctSide,
      answers: state.question.answers,
      hit: false,
    });
  }

  function addStickPack(dist) {
    const lane = randomInt(0, 2);
    const packSize = randomInt(2, 5);
    const colorIndex = Math.random() < 0.6 ? state.player.colorIndex : randomInt(0, palette.length - 1);
    for (let i = 0; i < packSize; i += 1) {
      state.objects.push({
        id: cryptoId(),
        type: 'stick',
        dist: dist + i * 24,
        lane,
        xOffset: randomInt(-22, 22),
        colorIndex,
        hit: false,
      });
    }
  }

  function addWall(dist) {
    const lane = randomInt(0, 2);
    const wallHeight = Math.round((0.65 + Math.random() * 2.4 + state.level * 0.014) * 10) / 10;
    state.objects.push({
      id: cryptoId(),
      type: 'wall',
      dist,
      lane,
      colorIndex: randomInt(0, palette.length - 1),
      wallHeight,
      hit: false,
    });
  }

  function addCoinLine(dist) {
    const lane = randomInt(0, 2);
    for (let i = 0; i < randomInt(4, 7); i += 1) addCoin(dist + i * 28, randomLaneX(lane));
  }

  function addCoin(dist, x) {
    state.objects.push({
      id: cryptoId(),
      type: 'coin',
      dist,
      x,
      hit: false,
    });
  }

  function loop(time) {
    const dt = Math.min(0.033, (time - (state.lastTime || time)) / 1000);
    state.lastTime = time;

    if (state.mode === 'playing' && !state.paused) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    handleMovement(dt);
    state.runDistance += state.speed * dt;

    for (const obj of state.objects) {
      if (obj.hit) continue;
      const y = objectScreenY(obj.dist);
      if (y > height + 160) obj.hit = true;
      if (y < -180 || y > height + 180) continue;
      checkCollision(obj, y);
    }

    state.particles = state.particles.filter((p) => p.life > 0);
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    }

    if (state.player.size <= state.player.minSize) failLevel('Çok küçüldün!', 'Farklı renklere ve yüksek duvarlara dikkat et. Bu bölümü tekrar deneyelim.');
    updateHud();
  }

  function handleMovement(dt) {
    const laneSpeed = 520 + state.level * 2;
    if (state.keys.has('arrowleft') || state.keys.has('a')) state.targetX -= laneSpeed * dt;
    if (state.keys.has('arrowright') || state.keys.has('d')) state.targetX += laneSpeed * dt;
    state.targetX = clamp(state.targetX, roadLeft + 32, roadRight - 32);
    const smooth = 1 - Math.pow(0.001, dt);
    state.player.x += (state.targetX - state.player.x) * smooth;
  }

  function checkCollision(obj, y) {
    if (obj.type === 'gate') {
      const gateY = y;
      if (Math.abs(gateY - playerY) < 34) {
        const leftX = width * 0.37;
        const rightX = width * 0.63;
        const side = Math.abs(state.player.x - leftX) < Math.abs(state.player.x - rightX) ? 0 : 1;
        obj.hit = true;
        state.answerLocked = true;
        if (side === obj.correctSide) {
          popText('Doğru!', state.player.x, playerY - 80, '#00b894');
          grow(0.68);
          state.score += 150;
        } else {
          failLevel('Yanlış cevap!', `${state.question.text} = ${state.question.correct}. Doğru kapıyı seçip tekrar koşalım.`);
        }
      }
      return;
    }

    if (obj.type === 'stick') {
      const x = randomLaneX(obj.lane) + obj.xOffset;
      if (distance(state.player.x, playerY, x, y) < playerRadius() + 18) {
        obj.hit = true;
        if (obj.colorIndex === state.player.colorIndex) {
          grow(0.2);
          state.score += 25;
          burst(x, y, palette[obj.colorIndex].hex, 8);
          popText('+Boy', x, y - 26, '#00b894');
        } else {
          shrink(0.28);
          state.score = Math.max(0, state.score - 10);
          burst(x, y, palette[obj.colorIndex].hex, 5);
          popText('-Boy', x, y - 26, '#ff4f5e');
        }
      }
      return;
    }

    if (obj.type === 'wall') {
      const x = randomLaneX(obj.lane);
      const w = laneWidth() * 0.74;
      if (Math.abs(y - playerY) < 28 && Math.abs(state.player.x - x) < w / 2 + playerRadius() * 0.6) {
        obj.hit = true;
        if (obj.wallHeight > state.player.size + 0.65) {
          failLevel('Duvar çok yüksekti!', `Duvar ${obj.wallHeight.toFixed(1)}x, sen ${state.player.size.toFixed(1)}x boyundaydın.`);
        } else {
          state.player.colorIndex = obj.colorIndex;
          shrink(0.18 + obj.wallHeight * 0.08);
          popText('Renk değişti', state.player.x, playerY - 88, palette[obj.colorIndex].hex);
          burst(state.player.x, playerY - 30, palette[obj.colorIndex].hex, 12);
        }
      }
      return;
    }

    if (obj.type === 'coin') {
      if (distance(state.player.x, playerY - 6, obj.x, y) < playerRadius() + 18) {
        obj.hit = true;
        state.coinsInRun += 1;
        state.score += 10;
        burst(obj.x, y, '#f1c40f', 6);
      }
      return;
    }

    if (obj.type === 'boss') {
      if (!state.bossResolved && Math.abs(y - playerY) < 44) {
        state.bossResolved = true;
        obj.hit = true;
        if (state.player.size >= obj.bossSize) completeLevel(obj.bossSize);
        else failLevel('Rakip senden büyüktü!', `Rakip ${obj.bossSize.toFixed(1)}x, sen ${state.player.size.toFixed(1)}x. Daha çok aynı renk topla.`);
      }
    }
  }

  function completeLevel(bossSize) {
    state.mode = 'message';
    const earned = Math.max(3, state.coinsInRun + Math.floor(state.score / 220));
    save.coins += earned;
    state.messageKind = 'success';
    ui.messageKicker.textContent = 'Seviye tamamlandı';
    ui.messageTitle.textContent = 'Harika koşu!';
    ui.messageBody.textContent = `Rakip ${bossSize.toFixed(1)}x idi, sen ${state.player.size.toFixed(1)}x oldun. ${earned} coin kazandın.`;
    ui.continueBtn.textContent = 'Sonraki Seviye';
    state.level = Math.min(100, state.level + 1);
    save.level = state.level;
    save.bestLevel = Math.max(save.bestLevel || 1, state.level);
    persist();
    renderShop();
    screens.message.classList.add('active');
  }

  function failLevel(title, body) {
    if (state.mode !== 'playing') return;
    state.mode = 'message';
    state.messageKind = 'fail';
    ui.messageKicker.textContent = 'Tekrar dene';
    ui.messageTitle.textContent = title;
    ui.messageBody.textContent = body;
    ui.continueBtn.textContent = 'Tekrar Dene';
    persist();
    screens.message.classList.add('active');
  }

  function togglePause() {
    if (state.mode !== 'playing') return;
    state.paused = !state.paused;
    ui.pauseBtn.textContent = state.paused ? '▶' : 'Ⅱ';
    if (state.paused) {
      state.messageKind = 'pause';
      ui.messageKicker.textContent = 'Duraklatıldı';
      ui.messageTitle.textContent = 'Mola';
      ui.messageBody.textContent = 'Devam etmek için Devam düğmesine ya da boşluk tuşuna bas.';
      ui.continueBtn.textContent = 'Devam';
      screens.message.classList.add('active');
    } else {
      ui.continueBtn.textContent = 'Devam';
      screens.message.classList.remove('active');
    }
  }

  function updateHud() {
    ui.levelText.textContent = String(state.level);
    ui.coinText.textContent = String(save.coins + (state.mode === 'playing' ? state.coinsInRun : 0));
    ui.sizeText.textContent = `${state.player.size.toFixed(1)}x`;
    ui.questionText.textContent = state.question ? `${state.question.text} = ?` : 'Hazır mısın?';
  }

  function renderShop() {
    ui.shopCoinText.textContent = String(save.coins);
    ui.hatGrid.innerHTML = '';
    for (const hat of hats) {
      const owned = save.ownedHats.includes(hat.id);
      const levelUnlocked = !hat.unlockLevel || save.bestLevel >= hat.unlockLevel;
      const canBuy = !owned && levelUnlocked && save.coins >= (hat.cost || 0);
      const card = document.createElement('div');
      card.className = `hat-card ${save.activeHat === hat.id ? 'selected' : ''}`;

      const emoji = document.createElement('span');
      emoji.className = 'emoji';
      emoji.textContent = hat.emoji;
      const name = document.createElement('strong');
      name.textContent = hat.name;
      const status = document.createElement('small');

      const button = document.createElement('button');
      if (owned) {
        status.textContent = save.activeHat === hat.id ? 'Takılı' : 'Sende var';
        button.textContent = save.activeHat === hat.id ? 'Seçili' : 'Tak';
        button.disabled = save.activeHat === hat.id;
        button.addEventListener('click', () => {
          save.activeHat = hat.id;
          persist();
          renderShop();
        });
      } else if (!levelUnlocked) {
        status.textContent = `Seviye ${hat.unlockLevel} gerekli`;
        button.textContent = 'Kilitli';
        button.disabled = true;
      } else {
        status.textContent = `${hat.cost} coin`;
        button.textContent = canBuy ? 'Satın al' : 'Coin gerekli';
        button.disabled = !canBuy;
        button.addEventListener('click', () => {
          save.coins -= hat.cost || 0;
          save.ownedHats.push(hat.id);
          save.activeHat = hat.id;
          persist();
          renderShop();
          updateHud();
        });
      }
      card.append(emoji, name, status, button);
      ui.hatGrid.appendChild(card);
    }
  }

  function draw() {
    drawBackground();
    drawRoad();
    drawObjects();
    drawPlayer();
    drawParticles();

    if (state.mode !== 'playing') {
      drawAttractText();
    } else if (state.paused) {
      drawPauseTint();
    }
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#aee8ff');
    sky.addColorStop(0.55, '#dff7ff');
    sky.addColorStop(1, '#b7f0c3');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    drawCloud(width * 0.18, height * 0.18, 1.05);
    drawCloud(width * 0.74, height * 0.15, 0.85);
    drawCloud(width * 0.48, height * 0.28, 0.72);

    ctx.fillStyle = '#7ed957';
    ctx.fillRect(0, height * 0.66, width, height * 0.34);
    ctx.fillStyle = 'rgba(255,255,255,.24)';
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 137 + Math.sin(state.runDistance * 0.001 + i) * 40) % width;
      const y = height * 0.68 + (i % 4) * 46;
      drawFlower(x, y, i % palette.length);
    }
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    roundedRect(-60, -16, 120, 34, 18);
    ctx.fill();
    circle(-28, -22, 28, 'rgba(255,255,255,.82)');
    circle(7, -30, 34, 'rgba(255,255,255,.82)');
    circle(42, -18, 24, 'rgba(255,255,255,.82)');
    ctx.restore();
  }

  function drawFlower(x, y, colorIndex) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#31a24c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x, y - 4);
    ctx.stroke();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      circle(x + Math.cos(a) * 5, y - 8 + Math.sin(a) * 5, 4, palette[colorIndex].hex);
    }
    circle(x, y - 8, 3, '#ffe66d');
    ctx.restore();
  }

  function drawRoad() {
    const topY = height * 0.29;
    const bottomY = height + 80;
    const topLeft = width * 0.39;
    const topRight = width * 0.61;
    const grad = ctx.createLinearGradient(0, topY, 0, height);
    grad.addColorStop(0, '#7b7d92');
    grad.addColorStop(1, '#55586d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(topLeft, topY);
    ctx.lineTo(topRight, topY);
    ctx.lineTo(roadRight + 70, bottomY);
    ctx.lineTo(roadLeft - 70, bottomY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 26]);
    ctx.lineDashOffset = -state.runDistance * 0.28;
    for (let i = 1; i < 3; i += 1) {
      const t = i / 3;
      ctx.beginPath();
      ctx.moveTo(lerp(topLeft, topRight, t), topY);
      ctx.lineTo(lerp(roadLeft - 25, roadRight + 25, t), bottomY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(topLeft, topY);
    ctx.lineTo(roadLeft - 70, bottomY);
    ctx.moveTo(topRight, topY);
    ctx.lineTo(roadRight + 70, bottomY);
    ctx.stroke();
  }

  function drawObjects() {
    const visible = state.objects
      .filter((obj) => !obj.hit)
      .map((obj) => ({ obj, y: objectScreenY(obj.dist) }))
      .filter(({ y }) => y > -210 && y < height + 170)
      .sort((a, b) => a.y - b.y);

    for (const { obj, y } of visible) {
      if (obj.type === 'gate') drawGate(obj, y);
      else if (obj.type === 'coin') drawCoin(obj, y);
      else if (obj.type === 'stick') drawTinyRunner(randomLaneX(obj.lane) + obj.xOffset, y, obj.colorIndex, 0.72);
      else if (obj.type === 'wall') drawWall(obj, y);
      else if (obj.type === 'boss') drawBoss(obj, y);
    }
  }

  function drawGate(obj, y) {
    const leftX = width * 0.37;
    const rightX = width * 0.63;
    const xs = [leftX, rightX];
    for (let side = 0; side < 2; side += 1) {
      const x = xs[side];
      const isCorrect = side === obj.correctSide;
      const hue = isCorrect ? palette[state.player.colorIndex].hex : '#ff5c7c';
      const w = Math.min(210, laneWidth() * 1.05);
      const h = 118;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(20,25,59,.24)';
      roundedRect(-w / 2 + 8, -h / 2 + 10, w, h, 18);
      ctx.fill();
      ctx.fillStyle = hue;
      roundedRect(-w / 2, -h / 2, w, h, 18);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.2)';
      roundedRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 14);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = `900 ${Math.max(30, Math.min(48, width * 0.045))}px ui-rounded, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(obj.answers[side]), 0, 2);
      ctx.font = '800 13px ui-rounded, system-ui';
      ctx.fillText('CEVAP', 0, -36);
      ctx.restore();
    }
  }

  function drawCoin(obj, y) {
    const pulse = 1 + Math.sin(performance.now() * 0.008 + obj.dist) * 0.08;
    ctx.save();
    ctx.translate(obj.x, y);
    ctx.scale(pulse, pulse);
    circle(0, 0, 13, '#f1c40f');
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff6a5';
    ctx.font = '900 16px ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', 0, 1);
    ctx.restore();
  }

  function drawWall(obj, y) {
    const x = randomLaneX(obj.lane);
    const w = laneWidth() * 0.78;
    const h = 28 + obj.wallHeight * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.17)';
    roundedRect(-w / 2 + 6, -h / 2 + 8, w, h, 12);
    ctx.fill();
    ctx.fillStyle = palette[obj.colorIndex].hex;
    roundedRect(-w / 2, -h / 2, w, h, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    roundedRect(-w / 2 + 8, -h / 2 + 8, w - 16, h / 2, 9);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '900 18px ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${obj.wallHeight.toFixed(1)}x`, 0, 0);
    ctx.restore();
  }

  function drawBoss(obj, y) {
    const x = width / 2;
    drawTinyRunner(x, y, (state.player.colorIndex + 2) % palette.length, obj.bossSize);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.86)';
    roundedRect(x - 44, y - 90 - obj.bossSize * 9, 88, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#20233a';
    ctx.font = '900 15px ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Rakip ${obj.bossSize.toFixed(1)}x`, x, y - 76 - obj.bossSize * 9);
    ctx.restore();
  }

  function drawTinyRunner(x, y, colorIndex, scale) {
    const s = scale;
    const c = palette[colorIndex].hex;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#20233a';
    ctx.lineWidth = 3 * s;
    ctx.fillStyle = c;
    circle(0, -31 * s, 13 * s, c);
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo(0, 18 * s);
    ctx.moveTo(0, -4 * s);
    ctx.lineTo(-15 * s, 8 * s);
    ctx.moveTo(0, -4 * s);
    ctx.lineTo(16 * s, -13 * s);
    ctx.moveTo(0, 18 * s);
    ctx.lineTo(-13 * s, 38 * s);
    ctx.moveTo(0, 18 * s);
    ctx.lineTo(15 * s, 35 * s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    ctx.beginPath();
    ctx.ellipse(0, 42 * s, 20 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const p = state.player;
    const scale = p.size;
    const x = p.x;
    const y = playerY;
    const color = palette[p.colorIndex].hex;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.19)';
    ctx.beginPath();
    ctx.ellipse(x, y + 64 * scale, 25 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#20233a';
    ctx.lineWidth = 4.5 * scale;

    circle(0, -42 * scale, 18 * scale, color);
    ctx.beginPath();
    ctx.moveTo(0, -24 * scale);
    ctx.lineTo(0, 25 * scale);
    const wobble = Math.sin(performance.now() * 0.013) * 5;
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo((-22 - wobble) * scale, 9 * scale);
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo((22 + wobble) * scale, -18 * scale);
    ctx.moveTo(0, 25 * scale);
    ctx.lineTo((-18 + wobble) * scale, 58 * scale);
    ctx.moveTo(0, 25 * scale);
    ctx.lineTo((19 - wobble) * scale, 56 * scale);
    ctx.stroke();

    drawHat(scale);

    ctx.fillStyle = 'rgba(255,255,255,.95)';
    roundedRect(-37 * scale, -87 * scale, 74 * scale, 25 * scale, 12 * scale);
    ctx.fill();
    ctx.fillStyle = '#20233a';
    ctx.font = `900 ${13 * scale}px ui-rounded, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.size.toFixed(1)}x`, 0, -74 * scale);
    ctx.restore();
  }

  function drawHat(scale) {
    const active = hats.find((hat) => hat.id === save.activeHat) || hats[0];
    if (active.id === 'none') return;
    ctx.font = `${Math.max(20, 25 * scale)}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(active.emoji, 0, -68 * scale);
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      circle(p.x, p.y, p.size, p.color);
      ctx.restore();
    }
  }

  function drawAttractText() {
    if (screens.menu.classList.contains('active') || screens.shop.classList.contains('active') || screens.message.classList.contains('active')) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    roundedRect(width / 2 - 175, height / 2 - 36, 350, 72, 24);
    ctx.fill();
    ctx.fillStyle = '#20233a';
    ctx.font = '900 22px ui-rounded, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Oyuna başlamak için menüyü kullan', width / 2, height / 2);
    ctx.restore();
  }

  function drawPauseTint() {
    ctx.save();
    ctx.fillStyle = 'rgba(25,31,63,.22)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function objectScreenY(dist) {
    const pxPerDist = Math.max(0.9, Math.min(1.18, width / 860));
    return playerY - (dist - state.runDistance) * pxPerDist;
  }

  function randomLaneX(lane) {
    const lw = laneWidth();
    return roadLeft + lw * (lane + 0.5);
  }

  function laneWidth() {
    return (roadRight - roadLeft) / 3;
  }

  function playerRadius() {
    return 22 * state.player.size;
  }

  function grow(amount) {
    state.player.size = clamp(state.player.size + amount, state.player.minSize, state.player.maxSize);
    burst(state.player.x, playerY - 50, palette[state.player.colorIndex].hex, 10);
  }

  function shrink(amount) {
    state.player.size = clamp(state.player.size - amount, 0.1, state.player.maxSize);
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: randomInt(-90, 90),
        vy: randomInt(-150, -30),
        size: randomInt(3, 7),
        color,
        life: 0.6 + Math.random() * 0.45,
        maxLife: 1.05,
      });
    }
  }

  function popText(text, x, y, color) {
    state.particles.push({
      x,
      y,
      vx: 0,
      vy: -38,
      size: 0,
      color,
      life: 0.95,
      maxLife: 0.95,
      label: text,
    });
    const particle = state.particles[state.particles.length - 1];
    particle.draw = () => {};
  }

  function circle(x, y, r, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomChoice(items) {
    return items[randomInt(0, items.length - 1)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function cryptoId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  // Label particles are drawn here so they can reuse the same particle update loop.
  const originalDrawParticles = drawParticles;
  drawParticles = function patchedDrawParticles() { // eslint-disable-line no-func-assign
    originalDrawParticles();
    for (const p of state.particles) {
      if (!p.label) continue;
      ctx.save();
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      roundedRect(p.x - 42, p.y - 16, 84, 32, 16);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.font = '900 15px ui-rounded, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x, p.y);
      ctx.restore();
    }
  };
})();
