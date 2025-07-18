const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Reverb simulieren
function createImpulseResponse(duration = 2, decay = 2, reverse = false) {
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioCtx.createBuffer(2, length, sampleRate);
  for (let i = 0; i < 2; i++) {
    const channelData = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      const n = reverse ? length - j : j;
      channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
  }
  return impulse;
}



document.getElementById("openPopup").addEventListener("click", function () {
    document.getElementById("popup").classList.remove("hidden");
});

document.getElementById("closePopup").addEventListener("click", function () {
    document.getElementById("popup").classList.add("hidden");
});




const sideItems = document.querySelectorAll(".side-item");
const beats = document.querySelectorAll(".beats");
const infoText = document.querySelector(".information p");
const gifBox = document.querySelector(".gif-box");
const soundMap = {
  "tom": new Audio("sounds/tom.mp3"),
  "kick": new Audio("sounds/kick.mp3"),
  "snare": new Audio("sounds/snare.mp3"),
  "clap": new Audio("sounds/clap.mp3"),
  "hat": new Audio("sounds/hat.mp3")
};
const volumeMap = {
  "tom": 1,
  "kick": 1,
  "snare": 1,
  "clap": 1,
  "hat": 1
};

const colorMap = {
  "Tom": "#FAC2FF",
  "Kick": "#FF3172",
  "Snare": "#6EEBCB",
  "Clap": "#FF955C",
  "Hat": "#5583E7",
  "Effects": "#9a80bfff",
  "Beats per minute": "#9a80bfff",
  "More": "#9a80bfff"
};

let activeIndex = 0;
let currentBeatIndex = 0;
let isPlaying = false;
let beatInterval;
const activeBeatsByInstrument = {
  "tom": new Set(),
  "kick": new Set(),
  "snare": new Set(),
  "clap": new Set(),
  "hat": new Set()
};
let effectIndex = 0;

const reverbLevels = {
  "tom": 0,
  "kick": 0,
  "snare": 0,
  "clap": 0,
  "hat": 0
};

const reverbLevelSizes = [0, 30, 60, 120];


// Ebenen-Stack (z. B. ["side", "effect"])
let levelStack = ["side"];

const sideLabels = [
  "Tom", "Kick", "Snare", "Clap", "Hat",
  "Effects", "Beats per minute", "More"
];

const instrumentMap = {
  "Tom": "tom",
  "Kick": "kick",
  "Snare": "snare",
  "Clap": "clap",
  "Hat": "hat"
};

const effects = ["Reverb", "Delay", "Distortion", "Pitch"];

const reverbSettings = [
  { delay: 0.0, feedback: 0.0 },  // Stufe 0: Kein Reverb
  { delay: 0.05, feedback: 0.2 }, // Stufe 1
  { delay: 0.1, feedback: 0.4 },  // Stufe 2
  { delay: 0.15, feedback: 0.6 }  // Stufe 3: Stark
];

function getCurrentLevel() {
  return levelStack[levelStack.length - 1];
}
function updateReverbVisual(instrument) {
     console.log("Update visual for", instrument);
  const visual = document.getElementById("reverb-visual");
  const inner = document.getElementById("reverb-level");

  if (!instrument || !(instrument in reverbLevels)) {
    visual.style.display = "none";
    return;
  }

  const level = reverbLevels[instrument];
  const size = reverbLevelSizes[level];

  visual.style.display = "flex";
  inner.style.width = `${size}px`;
  inner.style.height = `${size}px`;
}


function updateActiveItem(index) {
  sideItems.forEach((item, i) => {
    const label = sideLabels[i];
    const color = colorMap[label] || "#fff";

    item.classList.toggle("active", i === index);
    if (i === index) {
      item.style.backgroundColor = color;
    } else {
      item.style.backgroundColor = "";
    }
  });

  const label = sideLabels[index];
  if (infoText) {
    infoText.textContent = label;
    infoText.style.color = colorMap[label] || "#fff";
  }

  const imgKey = instrumentMap[label];
  if (gifBox) {
    if (imgKey) {
      gifBox.innerHTML = `<img src="gifs/${imgKey}.png" alt="${label}">`;
    } else {
      gifBox.innerHTML = "";
    }
  }

  updateBeats();
}

function updateBeats() {
  const label = sideLabels[activeIndex];
  const currentInstrument = instrumentMap[label];

  beats.forEach((beat, i) => {
    beat.classList.remove("active", "marked");

    const beatIndex = i + 1;

    // Nur markieren, wenn currentInstrument gültig ist:
    if (currentInstrument && activeBeatsByInstrument[currentInstrument].has(beatIndex)) {
      beat.classList.add("marked");
    }

    if (i === currentBeatIndex) {
      beat.classList.add("active");

      // Wenn Instrument gewählt ist und Beat aktiv ist → Animation + ggf. Ton
      if (currentInstrument && activeBeatsByInstrument[currentInstrument].has(beatIndex)) {
        gifBox.innerHTML = `<img src="gifs/${currentInstrument}.gif" alt="${currentInstrument}">`;
      } else if (currentInstrument) {
        gifBox.innerHTML = `<img src="gifs/${currentInstrument}.png" alt="${currentInstrument}">`;
      }
    }
  });
}


function startSequence() {
  beatInterval = setInterval(() => {
    currentBeatIndex = (currentBeatIndex + 1) % beats.length;
    updateBeats();

    const beatNumber = currentBeatIndex + 1;

    // Alle Instrumente durchgehen:
    for (const key in activeBeatsByInstrument) {
      const beatsForInstrument = activeBeatsByInstrument[key];
      if (beatsForInstrument.has(beatNumber)) {
        const sound = soundMap[key];
        if (sound) {
          const source = audioCtx.createBufferSource();

    fetch(sound.src)
    .then(res => res.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        source.buffer = audioBuffer;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = volumeMap[key] ?? 1;

        const reverbAmount = reverbLevels[key];
        if (reverbAmount > 0) {
        const convolver = audioCtx.createConvolver();
        convolver.buffer = createImpulseResponse(2, 2); // konstant halten

        const wetGain = audioCtx.createGain();
        const dryGain = audioCtx.createGain();

        const wet = reverbAmount / 3;
        wetGain.gain.value = wet;
        dryGain.gain.value = 1 - wet;

        source.connect(convolver);
        source.connect(dryGain);

        convolver.connect(wetGain);
        wetGain.connect(gainNode);
        dryGain.connect(gainNode);
        } else {
        source.connect(gainNode);
        }


        gainNode.connect(audioCtx.destination);
        source.start();
  });

        }
      }
    }

  }, 400);

  isPlaying = true;
}


function stopSequence() {
  clearInterval(beatInterval);
  isPlaying = false;
}

function openSubPanel(targetItem) {
  const existing = document.querySelector(".effect-box");
  if (existing) existing.remove();

  const label = sideLabels[activeIndex];
  if (!instrumentMap[label]) return; // Nur für Instrumente

  const box = document.createElement("div");
  box.classList.add("effect-box");

  effects.forEach((effect, i) => {
    const effectItem = document.createElement("div");
    effectItem.classList.add("effect-item");
    if (i === effectIndex % effects.length) {
      effectItem.classList.add("focused");
      effectItem.innerHTML = `<span class="arrow">➤</span> ${effect}`;
    } else {
      effectItem.textContent = effect;
    }
    box.appendChild(effectItem);
  });

  targetItem.appendChild(box);
}

function closeSubPanel() {
  const box = document.querySelector(".effect-box");
  if (box) box.remove();
}

document.addEventListener("keydown", (e) => {
  const level = getCurrentLevel();
  const label = sideLabels[activeIndex];
  const key = instrumentMap[label];

  switch (e.key) {
    case "ArrowRight":
      if (level === "side") {
        activeIndex = (activeIndex + 1) % sideItems.length;
        updateActiveItem(activeIndex);
      } else if (level === "effect") {
        effectIndex = (effectIndex + 1) % effects.length;
        openSubPanel(sideItems[activeIndex]);
      } else if (level === "reverb" && key) {
        reverbLevels[key] = Math.min(3, reverbLevels[key] + 1);
        updateReverbVisual(key);
      }
      break;

    case "ArrowLeft":
      if (level === "side") {
        activeIndex = (activeIndex - 1 + sideItems.length) % sideItems.length;
        updateActiveItem(activeIndex);
      } else if (level === "effect") {
        effectIndex = (effectIndex - 1 + effects.length) % effects.length;
        openSubPanel(sideItems[activeIndex]);
      } else if (level === "reverb" && key) {
        reverbLevels[key] = Math.max(0, reverbLevels[key] - 1);
        updateReverbVisual(key);
      }
      break;

    case "Enter":
      if (level === "side") {
        levelStack.push("effect");
        openSubPanel(sideItems[activeIndex]);
      } else if (level === "effect") {
        const focusedEffect = effects[effectIndex % effects.length];
        if (focusedEffect === "Reverb" && key) {
          levelStack.push("reverb");
          updateReverbVisual(key);
        }
      }
      break;

    case "Backspace":
      if (levelStack.length > 1) {
        e.preventDefault();
        const exited = levelStack.pop();
        if (exited === "reverb") {
          document.getElementById("reverb-visual").style.display = "none";
        }
        if (exited === "effect") closeSubPanel();
      }
      break;

    case "Escape":
      while (levelStack.length > 1) {
        const exited = levelStack.pop();
        if (exited === "effect") closeSubPanel();
      }
      break;

    case " ":
      e.preventDefault();
      isPlaying ? stopSequence() : startSequence();
      break;

    default:
  if (/^[1-8]$/.test(e.key)) {
    const beatIndex = parseInt(e.key, 10) - 1;
    const label = sideLabels[activeIndex];
    const key = instrumentMap[label];

    if (!key) return;

    const beatNumber = beatIndex + 1;

    // Beat umschalten
    if (activeBeatsByInstrument[key].has(beatNumber)) {
      activeBeatsByInstrument[key].delete(beatNumber);
    } else {
      activeBeatsByInstrument[key].add(beatNumber);
    }

    updateBeats();
  }
  break;

  }
});



updateActiveItem(activeIndex);
startSequence();