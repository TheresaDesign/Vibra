"effect"


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

let activeIndex = 0;
let currentBeatIndex = 0;
let isPlaying = false;
let beatInterval;
const activeBeats = new Set();
let effectIndex = 0;

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

function getCurrentLevel() {
  return levelStack[levelStack.length - 1];
}

function updateActiveItem(index) {
  sideItems.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  const label = sideLabels[index];
  if (infoText) infoText.textContent = label;

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
  beats.forEach((beat, i) => {
    beat.classList.remove("active", "marked");

    if (activeBeats.has(i + 1)) {
      beat.classList.add("marked");
    }

    if (i === currentBeatIndex) {
      beat.classList.add("active");

      const label = sideLabels[activeIndex];
      const currentInstrument = instrumentMap[label];
      if (currentInstrument && gifBox) {
        if (activeBeats.has(i + 1)) {
          gifBox.innerHTML = `<img src="gifs/${currentInstrument}.gif" alt="${currentInstrument}">`;
        } else {
          gifBox.innerHTML = `<img src="gifs/${currentInstrument}.png" alt="${currentInstrument}">`;
        }
      }
      const sound = soundMap[currentInstrument];
if (sound && activeBeats.has(i + 1)) {
  const clone = sound.cloneNode();
  clone.play().catch(err => console.warn("Autoplay prevented:", err));
}

    }
  });
}

function startSequence() {
  beatInterval = setInterval(() => {
    currentBeatIndex = (currentBeatIndex + 1) % beats.length;
    updateBeats();
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
  const currentLevel = getCurrentLevel();

  if (e.key === "ArrowRight") {
    if (currentLevel === "side") {
      activeIndex = (activeIndex + 1) % sideItems.length;
      updateActiveItem(activeIndex);
    } else if (currentLevel === "effect") {
      effectIndex = (effectIndex + 1) % effects.length;
      openSubPanel(sideItems[activeIndex]);
    }
  } else if (e.key === "ArrowLeft") {
    if (currentLevel === "side") {
      activeIndex = (activeIndex - 1 + sideItems.length) % sideItems.length;
      updateActiveItem(activeIndex);
    } else if (currentLevel === "effect") {
      effectIndex = (effectIndex - 1 + effects.length) % effects.length;
      openSubPanel(sideItems[activeIndex]);
    }
  } else if (e.key === "Enter") {
    if (currentLevel === "side") {
      levelStack.push("effect");
      openSubPanel(sideItems[activeIndex]);
    }
  } else if (e.key === "Backspace") {
    if (levelStack.length > 1) {
      e.preventDefault();
      const exited = levelStack.pop();
      if (exited === "effect") closeSubPanel();
    }
  } else if (e.key === "Escape") {
    while (levelStack.length > 1) {
      const exited = levelStack.pop();
      if (exited === "effect") closeSubPanel();
    }
  } else if (e.key === " ") {
    e.preventDefault();
    isPlaying ? stopSequence() : startSequence();
  } else if (/^[1-8]$/.test(e.key)) {
    const num = parseInt(e.key);
    activeBeats.has(num) ? activeBeats.delete(num) : activeBeats.add(num);
    updateBeats();
  }
});


updateActiveItem(activeIndex);
startSequence();

