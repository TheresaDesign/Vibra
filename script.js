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

const effects = ["Reverb", "Equalizer", "Distortion", "Pitch"];


const reverbSettings = [
  { delay: 0.0, feedback: 0.0 },  // Stufe 0: Kein Reverb
  { delay: 0.05, feedback: 0.2 }, // Stufe 1
  { delay: 0.1, feedback: 0.4 },  // Stufe 2
  { delay: 0.15, feedback: 0.6 }  // Stufe 3: Stark
];

const equalizerModes = ["flat", "highpass", "bandpass", "lowpass"];
const equalizerModeIndex = {
  "tom": 0,
  "kick": 0,
  "snare": 0,
  "clap": 0,
  "hat": 0
};
let currentEqualizerIndex = 0;

let currentPitchIndex = 3; // Mitte = normal (0)
const pitchModes = [-6, -3, 0, 3, 6];
const pitchModeIndex = {
  "tom": 2,
  "kick": 2,
  "snare": 2,
  "clap": 2,
  "hat": 2
};


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

function openEqualizerBox(instrumentKey) {
  const visual = document.getElementById("reverb-visual");
  visual.style.display = "none";

  let existing = document.getElementById("equalizer-box");
  if (existing) existing.remove();

  const box = document.createElement("div");
  box.id = "equalizer-box";
  box.classList.add("equalizer-box");

  equalizerModes.forEach((mode, i) => {
    const svgWrapper = document.createElement("div");
    svgWrapper.classList.add("eq-svg");
    if (i === currentEqualizerIndex) {
      svgWrapper.classList.add("focused");
      svgWrapper.innerHTML = `<img src="svg/${mode}.svg" alt="${mode}">`;
    } else {
      svgWrapper.innerHTML = `<img src="svg/${mode}.svg" alt="${mode}">`;
    }
    box.appendChild(svgWrapper);
  });

  document.body.appendChild(box);
}

let currentDistortionIndex = 0;
const distortionModes = [0, 1, 2, 3]; // vier Stufen
const distortionModeIndex = {
  "tom": 0,
  "kick": 0,
  "snare": 0,
  "clap": 0,
  "hat": 0
};

function createDistortionCurve(amount) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function openDistortionBox(key) {
  let box = document.getElementById("distortion-box");
  if (box) box.remove();

  const container = document.createElement("div");
  container.id = "distortion-box";
  container.className = "distortion-box";

  const index = distortionModeIndex[key] ?? 0;

  for (let i = 0; i < distortionModes.length; i++) {
    const row = document.createElement("div");
    row.className = "dist-row";
    if (i === index) row.classList.add("focused");

    const arrow = document.createElement("div");
    arrow.className = "arrow";
    arrow.textContent = i === index ? "→" : "";

    const svg = document.createElement("div");
    svg.className = "dist-svg";
    const img = document.createElement("img");
    img.src = `svg/dist${i + 1}.svg`;
    svg.appendChild(img);

    row.appendChild(arrow);
    row.appendChild(svg);
    container.appendChild(row);
  }

  document.body.appendChild(container);

  // Effekt anwenden
  const amount = [0, 100, 300, 600][index];
  const curve = createDistortionCurve(amount);
  if (instruments[key]) {
    if (!instruments[key].distortionNode) {
      const node = audioCtx.createWaveShaper();
      node.oversample = "4x";
      instruments[key].output.disconnect();
      instruments[key].output.connect(node).connect(audioCtx.destination);
      instruments[key].distortionNode = node;
    }
    instruments[key].distortionNode.curve = curve;
  }
}

function openPitchBox(key) {
  let box = document.getElementById("pitch-box");
  if (box) box.remove();

  const container = document.createElement("div");
  container.id = "pitch-box";
  container.className = "pitch-box";

  const lineWrapper = document.createElement("div");
  lineWrapper.className = "pitch-line-wrapper";

  const line = document.createElement("div");
  line.className = "pitch-line";

  const point = document.createElement("div");
  point.className = "pitch-point";

  lineWrapper.appendChild(line);
  lineWrapper.appendChild(point);
  container.appendChild(lineWrapper);
  document.body.appendChild(container);

  // Position des Punktes entlang der Linie
  const index = pitchModeIndex[key] ?? 2;
  const percentage = index / 4;
  point.style.left = `${percentage * 100}%`;
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

function showNotReadyNotice() {
  const overlay = document.createElement("div");
  overlay.className = "notready-overlay";

  const box = document.createElement("div");
  box.className = "notready-box";
  box.innerHTML = `
    <p>Upsi! We're not finished here yet</p>
    <button id="notready-close">Got it!</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById("notready-close").addEventListener("click", () => {
    overlay.remove();
  });
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

    for (const key in activeBeatsByInstrument) {
      const beatsForInstrument = activeBeatsByInstrument[key];
      if (!beatsForInstrument.has(beatNumber)) continue;

      const sound = soundMap[key];
      if (!sound) continue;

      const source = audioCtx.createBufferSource();

      const pitch = pitchModes[pitchModeIndex[key] ?? 2];
      source.playbackRate.value = Math.pow(2, pitch / 12); // Pitch in Halbtönen


      fetch(sound.src)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          source.buffer = audioBuffer;

          const gainNode = audioCtx.createGain();
          gainNode.gain.value = volumeMap[key] ?? 1;

          let nodeChainStart = source;
          let nodeChainEnd = gainNode;

          // === REVERB ===
          const reverbAmount = reverbLevels[key];
          if (reverbAmount > 0) {
            const convolver = audioCtx.createConvolver();
            convolver.buffer = createImpulseResponse(2, 2);

            const wetGain = audioCtx.createGain();
            const dryGain = audioCtx.createGain();
            wetGain.gain.value = reverbAmount / 3;
            dryGain.gain.value = 1 - wetGain.gain.value;

            nodeChainStart.connect(convolver);
            nodeChainStart.connect(dryGain);

            convolver.connect(wetGain);
            wetGain.connect(gainNode);
            dryGain.connect(gainNode);
          } else {
            nodeChainStart.connect(gainNode);
          }

          // === EQUALIZER ===
          const eqMode = equalizerModes[equalizerModeIndex[key]];
          let afterEQNode = gainNode;
          if (eqMode !== "flat") {
            const filter = audioCtx.createBiquadFilter();
            switch (eqMode) {
              case "highpass":
                filter.type = "highpass";
                filter.frequency.value = 500;
                break;
              case "bandpass":
                filter.type = "bandpass";
                filter.frequency.value = 1000;
                break;
              case "lowpass":
                filter.type = "lowpass";
                filter.frequency.value = 1000;
                break;
            }
            afterEQNode.connect(filter);
            afterEQNode = filter;
          }

          // === DISTORTION ===
          const distAmount = [0, 100, 300, 600][distortionModeIndex[key]];
          if (distAmount > 0) {
            const distortionNode = audioCtx.createWaveShaper();
            distortionNode.curve = createDistortionCurve(distAmount);
            distortionNode.oversample = "4x";
            afterEQNode.connect(distortionNode);
            distortionNode.connect(audioCtx.destination);
          } else {
            afterEQNode.connect(audioCtx.destination);
          }

          source.start();
        });
    }
  }, 400);

  isPlaying = true;
}

function updateDistortionBoxUI() {
  const box = document.getElementById("distortion-box");
  if (!box) return;
  const rows = box.querySelectorAll(".dist-row");

  rows.forEach((row, i) => {
    const arrow = row.querySelector(".arrow");
    row.classList.toggle("focused", i === currentDistortionIndex);
    if (arrow) arrow.textContent = i === currentDistortionIndex ? "→" : "";
  });
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
      } else if (level === "equalizer" && key) {
        currentEqualizerIndex = (currentEqualizerIndex + 1) % equalizerModes.length;
        equalizerModeIndex[key] = currentEqualizerIndex;
        openEqualizerBox(key);
        }
        else if (level === "distortion" && key) {
        currentDistortionIndex = (currentDistortionIndex + 1) % distortionModes.length;
        distortionModeIndex[key] = currentDistortionIndex;
        openDistortionBox(key);
        }
        else if (level === "pitch" && key) {
        const newIndex = Math.min(4, pitchModeIndex[key] + 1);
        pitchModeIndex[key] = newIndex;
        openPitchBox(key);
      }
      pitchModeIndex[key] = newIndex;
      openPitchBox(key);



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
      } else if (level === "equalizer" && key) {
        currentEqualizerIndex = (currentEqualizerIndex - 1 + equalizerModes.length) % equalizerModes.length;
        equalizerModeIndex[key] = currentEqualizerIndex;
        openEqualizerBox(key);
        }
        else if (level === "distortion" && key) {
        currentDistortionIndex = (currentDistortionIndex - 1 + distortionModes.length) % distortionModes.length;
        distortionModeIndex[key] = currentDistortionIndex;
        openDistortionBox(key);
        }
        else if (level === "pitch" && key) {
        const newIndex = Math.max(0, pitchModeIndex[key] - 1);
        pitchModeIndex[key] = newIndex;
        openPitchBox(key);
      }
      pitchModeIndex[key] = newIndex;
      openPitchBox(key);

      break;

    case "Enter":
    if (level === "side") {
    const currentItem = sideItems[activeIndex];
    if (currentItem.classList.contains("unfinished")) {
      showNotReadyNotice();
      return;
    }

    levelStack.push("effect");
    openSubPanel(currentItem);
  } else if (level === "effect") {
    const focusedEffect = effects[effectIndex % effects.length];// Effektliste schließen

    if (focusedEffect === "Reverb" && key) {
      levelStack.push("reverb");
      updateReverbVisual(key);
    } else if (focusedEffect === "Equalizer" && key) {
      levelStack.push("equalizer");
      openEqualizerBox(key);
    } else if (focusedEffect === "Distortion" && key) {
      levelStack.push("distortion");
      openDistortionBox(key);
    } else if (focusedEffect === "Pitch" && key) {
      levelStack.push("pitch");
      openPitchBox(key);
  
    
  }}
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
        if (level === "equalizer") {
        const eqBox = document.getElementById("equalizer-box");
        if (eqBox) eqBox.remove();
        }
        if (level === "distortion") {
        const distBox = document.getElementById("distortion-box");
        if (distBox) distBox.remove();
        }
        if (level === "pitch") {
        const pitchBox = document.getElementById("pitch-box");
        if (pitchBox) pitchBox.remove();
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