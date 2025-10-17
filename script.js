const rarityStrips = [
  { class: "rare-turquoise", carousel: "carousel-rare-turquoise", label: "rare-turquoise", order: 1 },
  { class: "rare-gold", carousel: "carousel-rare-gold", label: "rare-gold", order: 2 },
  { class: "rare-red", carousel: "carousel-rare-red", label: "rare-red", order: 3 },
  { class: "rare-blue", carousel: "carousel-rare-blue", label: "rare-blue", order: 4 },
  { class: "rare-grey", carousel: "carousel-rare-grey", label: "rare-grey", order: 5 }
];

let participants = [];

function renderParticipants() {
  participants.sort((a, b) => a.rarity.order - b.rarity.order);

  const list = document.querySelector(".participants-list");
  list.innerHTML = "";

  participants.forEach(obj => {
    const el = document.createElement("div");
    el.className = "participant " + obj.rarity.class;
    el.textContent = obj.name;

    const rareStrip = document.createElement("div");
    rareStrip.className = "rare-strip " + obj.rarity.class;
    el.appendChild(rareStrip);

    const cross = document.createElement("div");
    cross.className = "delete-cross";
    el.appendChild(cross);

    cross.addEventListener("click", e => {
      e.stopPropagation();
      participants = participants.filter(p => p.name !== obj.name);
      renderParticipants();
    });

    list.appendChild(el);
  });
}

document.getElementById("addParticipantButton").onclick = function () {
  const input = document.getElementById("participantName");
  const name = input.value.trim();
  if (name && !participants.find(p => p.name === name)) {
    const rarity = rarityStrips[Math.floor(Math.random() * rarityStrips.length)];
    participants.push({ name, rarity });
    renderParticipants();
    input.value = "";
  }
};


const carousel = document.getElementById("carousel");

let items = [];
let animationFrameId = null;
let startTime = 0;
let lastTimestamp = 0;

const MINDURATION = 9000;
const BASEDURATION = 21000;
const PARTICIPANTTHRESHOLD = 6;

let totalDuration;

const accelPart = 0.34;
const decelPart = 1 - accelPart;
const maxSpeed = 2200;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateRandomOrder(participants, length = 100) {
  let result = [];
  while (result.length < length) {
    let copy = participants.slice();
    shuffleArray(copy);
    result = result.concat(copy);
  }
  return result.slice(0, length);
}

function buildCarousel() {
  carousel.innerHTML = "";
  const data = generateRandomOrder(participants, 100);
  data.forEach(obj => {
    const div = document.createElement("div");
    div.className = "carousel-item " + obj.rarity.carousel;
    div.textContent = obj.name;

    const rareStrip = document.createElement("div");
    rareStrip.className = "carousel-rare-strip " + obj.rarity.carousel;
    div.appendChild(rareStrip);

    carousel.appendChild(div);
  });
  items = carousel.querySelectorAll(".carousel-item");
}

function playRandomRouletteVideo() {
  const video = document.getElementById("rouletteVideo");
  const videoSource = document.getElementById("videoSource");
  const videos = ["millerscashe.mp4"];
  const randomIndex = Math.floor(Math.random() * videos.length);
  videoSource.src = videos[randomIndex];
  video.load();
  video.style.display = "block"; // Показываем видео
  video.play();
}



function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function calcSpeed(progress) {
  if (progress < accelPart) {
    const localProgress = progress / accelPart;
    return maxSpeed * easeInOutQuad(localProgress);
  } else {
    const localProgress = (progress - accelPart) / decelPart;
    return maxSpeed * (1 - easeInOutQuad(localProgress));
  }
}

function getWinnerName() {
  const indicator = document.querySelector(".roulette-indicator");
  const indicatorRect = indicator.getBoundingClientRect();
  const indicatorCenterX = indicatorRect.left + indicatorRect.width / 2;
  let winnerName = null;
  items.forEach(item => {
    const itemRect = item.getBoundingClientRect();
    if (itemRect.left < indicatorCenterX && itemRect.right > indicatorCenterX) {
      winnerName = item.textContent.trim();
    }
  });
  if (!winnerName && items.length > 0) {
    winnerName = items[0].textContent.trim();
  }
  return winnerName;
}

// Функции для показа и скрытия модального окна победителя

function showWinner(name, isFinal = false) {
  document.getElementById("rouletteSection").style.display = "none";
  document.getElementById("winnerName").innerText = name;
  document.getElementById("modalOverlay").style.display = "flex";

  // Если нужно, можно обработать isFinal для других стилей (необходимо в CSS)
  const winnerSection = document.getElementById("winnerSection");
  if (isFinal) {
    winnerSection.classList.add("final");
  } else {
    winnerSection.classList.remove("final");
  }
}

function closeWinner() {
  document.getElementById("modalOverlay").style.display = "none";
  document.querySelector(".top-blocks").style.display = "flex";
  document.querySelector(".roulette-btn-wrapper").style.display = "flex";
  document.querySelector(".case-content").style.display = "block";
  renderParticipants();
}

// Кнопка "Убрать победителя"
document.getElementById("removeWinnerBtn").addEventListener("click", () => {
  const winnerName = document.getElementById("winnerName").innerText;
  participants = participants.filter(p => p.name !== winnerName);
  renderParticipants();
  closeWinner();
});

// Кнопка "Закрыть"
document.getElementById("closeWinnerBtn").addEventListener("click", () => {
  closeWinner();
});

// Анимация и логика прокрутки кейса по кнопке "Открыть кейс"
document.getElementById("openCase").onclick = function () {

  if (participants.length === 0) return;
  playRandomRouletteVideo();
  document.querySelector(".top-blocks").style.display = "none";
  document.querySelector(".roulette-btn-wrapper").style.display = "none";
  document.querySelector(".case-content").style.display = "none";
  document.getElementById("rouletteSection").style.display = "block";

  buildCarousel();
  carousel.scrollLeft = 0;

  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  startTime = 0;
  lastTimestamp = 0;
  totalDuration = participants.length > PARTICIPANTTHRESHOLD ? BASEDURATION : MINDURATION;

  animationFrameId = requestAnimationFrame(function animate(currentTime) {
    if (!startTime) startTime = currentTime;
    if (!lastTimestamp) lastTimestamp = currentTime;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    const speed = calcSpeed(progress);

    const deltaTime = currentTime - lastTimestamp;
    const deltaScroll = (speed * deltaTime) / 1000;
    const maxScroll = carousel.scrollWidth / 2;

    carousel.scrollLeft += deltaScroll;
    if (carousel.scrollLeft > maxScroll) carousel.scrollLeft -= maxScroll;

    lastTimestamp = currentTime;

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      animationFrameId = null;
      const winner = getWinnerName();
      showWinner(winner);
	  
	  // Скрываем видео после завершения рулетки
	  const video = document.getElementById("rouletteVideo");
      video.pause();
      video.style.display = "none";
    
    }
  });
};

// Автоматический цикл Дон Дигидон
async function donDigidonCycle() {
  
  while (participants.length > 1) {
	playRandomRouletteVideo();
    document.querySelector(".top-blocks").style.display = "none";
    document.querySelector(".roulette-btn-wrapper").style.display = "none";
    document.querySelector(".case-content").style.display = "none";
    document.getElementById("rouletteSection").style.display = "block";

    buildCarousel();
    carousel.scrollLeft = 0;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    let eliminated = await new Promise(resolve => {
      startTime = 0;
      lastTimestamp = 0;
      totalDuration = participants.length > PARTICIPANTTHRESHOLD ? BASEDURATION : MINDURATION;

      function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        if (!lastTimestamp) lastTimestamp = currentTime;

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        const speed = calcSpeed(progress);

        const deltaTime = currentTime - lastTimestamp;
        const deltaScroll = (speed * deltaTime) / 1000;
        const maxScroll = carousel.scrollWidth / 2;

        carousel.scrollLeft += deltaScroll;
        if (carousel.scrollLeft > maxScroll) carousel.scrollLeft -= maxScroll;

        lastTimestamp = currentTime;

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          animationFrameId = null;
          const winner = getWinnerName();
          showWinner(winner);
          resolve(winner);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    });

    participants = participants.filter(p => p.name !== eliminated);
    await new Promise(r => setTimeout(r, 2000)); // пауза после выбытия
    closeWinner();
	
	 // Скрываем видео после окончания круга
    const video = document.getElementById("rouletteVideo");
    video.pause();
    video.style.display = "none";

    if (participants.length === 1) {
      showWinner(participants[0].name, true);
    }
  }

  // Показать финального победителя
  if (participants.length === 1) {
    showWinner(participants[0].name, true);
  }
}

document.getElementById("donDigidon").onclick = function () {
  if (participants.length === 0) return;
  donDigidonCycle();
};

// Загрузка фона и параллакс
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

document.getElementById("loadBackgroundBtn").addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.body.style.backgroundImage = `url(${e.target.result})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.addEventListener("mousemove", parallaxEffect);
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  }
});

function parallaxEffect(event) {
  const strength = 15;
  const x = (window.innerWidth / 2 - event.clientX) / strength;
  const y = (window.innerHeight / 2 - event.clientY) / strength;
  document.body.style.backgroundPosition = `calc(50% + ${x}px) calc(50% + ${y}px)`;
}

function disableParallax() {
  document.body.removeEventListener("mousemove", parallaxEffect);
  document.body.style.backgroundPosition = "center center";
}

document.addEventListener('DOMContentLoaded', function() {
  const d = new Date();
  const dateStr = d.toLocaleDateString('ru-RU');
  document.getElementById('current-date').textContent = dateStr;
});

