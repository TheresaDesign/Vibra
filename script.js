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
          const clone = sound.cloneNode();
          clone.volume = volumeMap[key] ?? 1;
          clone.play();
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
  const label = sideLabels[activeIndex];
  const key = instrumentMap[label]; // z. B. "tom"

  // ❗ Nur wenn du im Untermenü bist ("effect") darfst du Beats setzen:
  if (getCurrentLevel() === "effect" && key && activeBeatsByInstrument[key]) {

        const num = parseInt(e.key);
        const beatSet = activeBeatsByInstrument[key];
        
        if (beatSet.has(num)) {
        beatSet.delete(num);
        } else {
        beatSet.add(num);
        }

        updateBeats(); // Darstellungs-Update
  }
  } else if (e.key.toLowerCase() === "a") {
    const label = sideLabels[activeIndex];
    const key = instrumentMap[label];
    if (key && volumeMap[key] !== undefined) {
      volumeMap[key] = Math.max(0, volumeMap[key] - 0.1);
      console.log(`${key} volume: ${volumeMap[key].toFixed(2)}`);
    }
  } else if (e.key.toLowerCase() === "d") {
    const label = sideLabels[activeIndex];
    const key = instrumentMap[label];
    if (key && volumeMap[key] !== undefined) {
      volumeMap[key] = Math.min(1, volumeMap[key] + 0.1);
      console.log(`${key} volume: ${volumeMap[key].toFixed(2)}`);
    }
  }
});



updateActiveItem(activeIndex);
startSequence();

