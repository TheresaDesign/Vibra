
document.getElementById("openPopup").addEventListener("click", function () {
    document.getElementById("popup").classList.remove("hidden");
});

document.getElementById("closePopup").addEventListener("click", function () {
    document.getElementById("popup").classList.add("hidden");
});


let sideItems = document.querySelectorAll(".side-item");
let activeIndex = 0;

const sideLabels = [
    "Tom",              // 0
    "Kick",             // 1
    "Snare",            // 2
    "Clap",             // 3
    "Hat",              // 4
    "Effects",          // 5
    "Beats per minute", // 6
    "More"              // 7
];

const gifMap = {
    "Tom": "gifs/tom.png",
    "Kick": "gifs/kick.png",
    "Snare": "gifs/snare.png",
    "Clap": "gifs/clap.png",
    "Hat": "gifs/hat.png"
};

function updateActiveItem(index) {
    sideItems.forEach((item, i) => {
        item.classList.toggle("active", i === index);
    });

    // Update Information Label
    const label = sideLabels[index] || "";
    const infoText = document.querySelector(".information p");
    if (infoText) infoText.textContent = label;

    // Update GIF
    const gifBox = document.querySelector(".gif-box");
    const gifPath = gifMap[label];
    if (gifBox) {
        if (gifPath) {
            gifBox.innerHTML = `<img src="${gifPath}" alt="${label}">`;
        } else {
            gifBox.innerHTML = ""; // Leeren, wenn kein GIF
        }
    }
}

// Erste Initialisierung
updateActiveItem(activeIndex);

// Tastatursteuerung
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
        activeIndex = (activeIndex + 1) % sideItems.length;
        updateActiveItem(activeIndex);
    } else if (e.key === "ArrowLeft") {
        activeIndex = (activeIndex - 1 + sideItems.length) % sideItems.length;
        updateActiveItem(activeIndex);
    } else if (e.key === "Enter") {
        openSubPanel(sideItems[activeIndex]);
    }
});

function openSubPanel(targetItem) {
    console.log("Subpanel öffnen für:", targetItem);
}