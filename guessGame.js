// guessGame.js – Playa 6.0 (Final Polished Game Mode)

(function () {
  let guessMode = false;
  let guessDuration = 5.0;
  let guessTimer = null;
  let gameActive = false;
  let guessQueue = [];
  let guessIndex = 0;
  let guessScore = 0;
  let remainingGuesses = 0;

  const toggle = document.getElementById('toggleGuess');
  const duration = document.getElementById('guessDuration');
  const countdown = document.getElementById('guessCountdown');
  const media = document.getElementById('mediaPlayer');
  const controls = document.getElementById('mediaControls');
  const playerControls = document.getElementById('playerControls');

  const guessModal = document.getElementById('guessModal');
  const guessInput = document.getElementById('guessCountInput');
  const startBtn = document.getElementById('startGuessGameBtn');

  const scoreModal = document.getElementById('scoreModal');
  const scoreText = document.getElementById('scoreText');
  const replayBtn = document.getElementById('replayBtn');
  const exitBtn = document.getElementById('exitBtn');

  if (!toggle || !duration || !countdown || !media || !guessModal || !guessInput || !startBtn || !playerControls || !scoreModal || !scoreText || !replayBtn || !exitBtn) return;

  toggle.addEventListener('change', e => {
    guessMode = e.target.checked;
    document.body.classList.toggle('guess-theme', guessMode);
    if (guessMode) {
      media.pause();
      countdown.textContent = '';
      showGuessModal();
    } else {
      endGame(true);
    }
  });

  duration.addEventListener('input', e => {
    guessDuration = parseFloat(e.target.value);
  });

  startBtn.addEventListener('click', () => {
    const max = window.queue?.length || 0;
    const count = parseInt(guessInput.value, 10);
    if (!count || count < 1 || count > max) {
      alert(`Please enter a number between 1 and ${max}`);
      return;
    }
    hideGuessModal();
    startGame(count);
  });

  replayBtn.addEventListener('click', () => {
    hideScoreModal();
    showGuessModal();
  });

  exitBtn.addEventListener('click', () => {
    hideScoreModal();
    toggle.checked = false;
    document.body.classList.remove('guess-theme');
  });

  function showGuessModal() {
    const max = window.queue?.length || 0;
    if (max === 0) {
      alert("Queue is empty.");
      toggle.checked = false;
      return;
    }
    guessInput.max = max;
    guessInput.value = max;
    guessModal.classList.remove('hidden');
  }

  function hideGuessModal() {
    guessModal.classList.add('hidden');
  }

  function showScoreModal() {
    scoreText.textContent = `Your score: ${guessScore}/${guessQueue.length}`;
    scoreModal.classList.remove('hidden');
  }

  function hideScoreModal() {
    scoreModal.classList.add('hidden');
  }

  function startGame(count) {
    const max = window.queue.length;
    guessQueue = [...Array(max).keys()].sort(() => Math.random() - 0.5).slice(0, count);
    guessIndex = 0;
    guessScore = 0;
    remainingGuesses = count;
    gameActive = true;

    playerControls.style.display = 'none';
    injectGameButtons();
    playCurrent();
  }

  function restoreStandardControls() {
    playerControls.style.display = '';
  }

  function injectGameButtons() {
    removeGameButtons();
    const panel = document.createElement('div');
    panel.id = 'gameButtons';
    panel.innerHTML = `
      <button id="correctBtn">✅ Correct!</button>
      <button id="wrongBtn">❌ Wrong!</button>
      <button id="skipBtn">⏭️ Skip</button>
    `;
    controls.appendChild(panel);

    document.getElementById('correctBtn').onclick = () => {
      guessScore++;
      nextSong();
    };
    document.getElementById('wrongBtn').onclick = () => {
      remainingGuesses--;
      if (remainingGuesses <= 0) return endGame();
      playCurrent();
    };
    document.getElementById('skipBtn').onclick = () => {
      nextSong();
    };
  }

  function removeGameButtons() {
    const panel = document.getElementById('gameButtons');
    if (panel) panel.remove();
  }

  function playCurrent() {
    const index = guessQueue[guessIndex];
    const item = window.queue[index];
    if (!item) return;
    const encodedPath = encodeURI(`file://${item.path.replace(/\\/g, '/')}`);
    media.src = '';
    media.load();
    media.src = encodedPath;
    media.play();
    window.renderQueue?.(index);
    startGuessTimer();
  }

  function nextSong() {
    if (guessIndex < guessQueue.length - 1) {
      guessIndex++;
      playCurrent();
    } else {
      endGame();
    }
  }

  function endGame(fromToggle = false) {
    gameActive = false;
    removeGameButtons();
    restoreStandardControls();
    if (!fromToggle) {
      showScoreModal();
    }
  }

  function startGuessTimer() {
    clearInterval(guessTimer);
    let timeLeft = guessDuration;
    countdown.textContent = `⏱️ ${timeLeft.toFixed(1)}s`;
    guessTimer = setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 0) {
        clearInterval(guessTimer);
        media.pause();
        media.currentTime = 0;
        countdown.textContent = '';
      } else {
        countdown.textContent = `⏱️ ${timeLeft.toFixed(1)}s`;
      }
    }, 100);
  }

  function stopGuessTimer() {
    clearInterval(guessTimer);
    countdown.textContent = '';
  }

  // External hooks for renderer.js
  window.startGuessTimer = startGuessTimer;
  window.stopGuessTimer = stopGuessTimer;
  window.isGuessMode = () => guessMode && gameActive;
})();
