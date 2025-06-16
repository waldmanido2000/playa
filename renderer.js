const media = document.getElementById('mediaPlayer');
const queueList = document.getElementById('queue');
const mediaControls = document.getElementById('mediaControls');
const audioExtras = document.getElementById('audioExtras');
const volumeSlider = document.getElementById('volumeSlider');
const speedSelect = document.getElementById('speedSelect');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');

let queue = [];
let currentItem = null;
let originalQueue = [];
let isShuffled = false;

function updateAudioUIState() {
  const isAudio = media.src.match(/\.(mp3|wav|ogg)$/i);
  if (isAudio) {
    media.removeAttribute('controls');
    audioExtras.style.display = 'flex';
  } else {
    media.setAttribute('controls', '');
    audioExtras.style.display = 'none';
  }
}

volumeSlider.oninput = () => {
  const vol = parseFloat(volumeSlider.value);
  media.volume = vol;
  volumeSlider.title = `Volume: ${(vol * 100).toFixed(0)}%`;
};

speedSelect.onchange = () => {
  media.playbackRate = parseFloat(speedSelect.value);
};

media.addEventListener('loadedmetadata', () => {
  durationDisplay.textContent = formatTime(media.duration);
});

media.ontimeupdate = () => {
  if (!isNaN(media.duration)) {
    const pct = (media.currentTime / media.duration) * 100;
    progressBar.value = pct;
    currentTimeDisplay.textContent = formatTime(media.currentTime);
  }
};

progressBar.oninput = () => {
  if (!isNaN(media.duration)) {
    const time = (progressBar.value / 100) * media.duration;
    media.currentTime = time;
  }
};

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

document.getElementById('shuffleBtn').addEventListener('click', () => {
  const btn = document.getElementById('shuffleBtn');
  if (!isShuffled) {
    originalQueue = [...queue];
    shuffleArray(queue);
    isShuffled = true;
    btn.textContent = '↩️';
    btn.title = 'Unshuffle queue';
    currentItem = queue[0];
  } else {
    queue = [...originalQueue];
    isShuffled = false;
    btn.textContent = '🔀';
    btn.title = 'Shuffle queue';
    currentItem = queue[0];
  }
  window.queue = queue;
  renderQueue();
  play();
});

async function openFiles() {
  const filePaths = await window.electronAPI.openFileDialog();
  for (const filePath of filePaths) {
    queue.push({ type: 'local', path: filePath });
  }
  if (queue.length > 0) {
    currentItem = queue[0];
    window.queue = queue;
    renderQueue();
    play();
  }
}

function addURL() {
  const url = prompt("Enter the media URL:");
  if (url) {
    queue.push({ type: 'url', path: url });
    window.queue = queue;
    renderQueue();
  }
}

function refresh() {
  if (queue.length > 0) {
    currentItem = queue[0];
    renderQueue();
    play();
  } else {
    alert("Queue is empty.");
  }
}

function renderQueue(highlightIndex = null) {
  queueList.innerHTML = '';
  queue.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'queue-line';
    li.draggable = true;
    li.dataset.index = index;
    if (item === currentItem || index === highlightIndex) li.classList.add('playing');

    li.ondragstart = e => e.dataTransfer.setData("text/plain", index);
    li.ondragover = e => {
      e.preventDefault();
      li.style.background = '#333';
    };
    li.ondragleave = () => li.style.background = '';
    li.ondrop = e => {
      e.preventDefault();
      li.style.background = '';
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      const toIndex = parseInt(li.dataset.index, 10);
      const [moved] = queue.splice(fromIndex, 1);
      queue.splice(toIndex, 0, moved);
      window.queue = queue;
      renderQueue();
    };

    const icon = document.createElement('div');
    icon.className = 'file-icon';
    icon.textContent = item.path.match(/\.(mp4|mkv|webm)$/i) ? '🎬' : '🎵';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '❌';
    removeBtn.onclick = () => {
      const isCurrent = item === currentItem;
      queue.splice(index, 1);
      if (isCurrent) stop();
      if (isCurrent) currentItem = null;
      window.queue = queue;
      renderQueue();
    };

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = item.path.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '');
    name.ondblclick = () => {
      currentItem = item;
      renderQueue();
      play();
    };

    li.appendChild(icon);
    li.appendChild(removeBtn);
    li.appendChild(name);
    queueList.appendChild(li);
  });
}

async function play() {
  const item = currentItem ?? queue[0];
  currentItem = item;
  if (!item || !item.path) return alert("No valid media to play.");
  media.muted = false;
  media.volume = 1.0;
  media.onended = () => { if (!window.isGuessMode?.()) next(); };
  if (item.type === 'local') tryPlay(item.path);
  else alert("Online playback not implemented yet.");
}

async function tryPlay(filePath) {
  const encodedPath = encodeURI(`file://${filePath.replace(/\\/g, '/')}`);
  media.src = '';
  media.load();
  media.src = encodedPath;
  updateAudioUIState();
  try {
    await media.play();
    if (window.isGuessMode?.()) window.startGuessTimer?.();
  } catch {
    const convertedPath = await window.electronAPI.convertMedia(filePath);
    media.src = encodeURI(`file://${convertedPath.replace(/\\/g, '/')}`);
    updateAudioUIState();
    await media.play();
    if (window.isGuessMode?.()) window.startGuessTimer?.();
  }
}

function pause() {
  media.pause();
  window.stopGuessTimer?.();
}

function stop() {
  media.pause();
  media.currentTime = 0;
  window.stopGuessTimer?.();
}

function next() {
  const idx = queue.indexOf(currentItem);
  if (idx >= 0 && idx < queue.length - 1) {
    currentItem = queue[idx + 1];
    renderQueue();
    play();
  }
}

function prev() {
  const idx = queue.indexOf(currentItem);
  if (idx > 0) {
    currentItem = queue[idx - 1];
    renderQueue();
    play();
  }
}

async function saveQueue() {
  document.getElementById('queueNameInput').value = '';
  document.getElementById('nameModal').style.display = 'flex';
}

async function submitQueueName() {
  const name = document.getElementById('queueNameInput').value.trim();
  if (!name) return;
  await window.electronAPI.saveQueue(name, queue);
  document.getElementById('nameModal').style.display = 'none';
}

function closeNameModal() {
  document.getElementById('nameModal').style.display = 'none';
}

async function loadQueue() {
  const list = await window.electronAPI.getQueueNames();
  if (!list.length) return alert("No saved queues found");
  const chosen = await window.electronAPI.chooseQueue(list);
  if (!chosen) return;
  try {
    queue = await window.electronAPI.loadQueue(chosen);
    currentItem = queue[0];
    window.queue = queue;
    renderQueue();
    play();
  } catch {
    alert("Failed to load queue");
  }
}

window.queue = queue;
window.currentItem = currentItem;
window.play = play;
window.pause = pause;
window.stop = stop;
window.next = next;
window.prev = prev;
window.refresh = refresh;
window.openFiles = openFiles;
window.saveQueue = saveQueue;
window.loadQueue = loadQueue;
window.submitQueueName = submitQueueName;
window.closeNameModal = closeNameModal;
window.renderQueue = renderQueue;
