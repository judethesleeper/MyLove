const relationshipStart = new Date("2025-01-01T00:00:00");
const today = new Date();

const photoSlides = [
  {
    src: "photo_3.jpeg",
    alt: "A sweet photo together",
    caption: "One of those moments I want to keep forever."
  },
  {
    src: "photo_2.jpeg",
    alt: "A candid moment together",
    caption: "A soft memory, caught in one frame."
  },
  {
    src: "photo_1.jpeg",
    alt: "A close memory together",
    caption: "The kind of photo that makes my heart feel calm."
  },
  {
    src: "photo_4.jpeg",
    alt: "A lovely photo together",
    caption: "Another little piece of us."
  }
];

function diffInDays(start, end) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / msPerDay);
}

function diffInMonths(start, end) {
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(months, 0);
}

function nextJanuaryFirst(fromDate) {
  return new Date(fromDate.getFullYear() + 1, 0, 1);
}

const daysTogether = diffInDays(relationshipStart, today);
const monthsTogether = diffInMonths(relationshipStart, today);
const nextSpecialDay = nextJanuaryFirst(today);
const daysUntilSpecial = Math.ceil((nextSpecialDay - today) / (1000 * 60 * 60 * 24));
const nextSpecialLabel = nextSpecialDay.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
});

document.getElementById("daysTogether").textContent = daysTogether.toLocaleString();
document.getElementById("monthsTogether").textContent = monthsTogether.toLocaleString();
document.getElementById("countdown").textContent =
  `${daysUntilSpecial} day${daysUntilSpecial === 1 ? "" : "s"}`;

document.getElementById("sinceText").textContent =
  `Since January 1, 2025, we have had ${daysTogether} beautiful days together.`;
document.getElementById("specialText").textContent =
  `Only ${daysUntilSpecial} day${daysUntilSpecial === 1 ? "" : "s"} until ${nextSpecialLabel}.`;

const galleryImage = document.getElementById("galleryImage");
const galleryCaption = document.getElementById("galleryCaption");
const galleryDots = document.getElementById("galleryDots");
const prevButton = document.querySelector(".gallery-button.prev");
const nextButton = document.querySelector(".gallery-button.next");

let currentIndex = 0;
let autoAdvance;

function renderDots() {
  galleryDots.innerHTML = "";
  photoSlides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = `dot${index === currentIndex ? " active" : ""}`;
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to photo ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    galleryDots.appendChild(dot);
  });
}

function showSlide(index) {
  currentIndex = (index + photoSlides.length) % photoSlides.length;
  const slide = photoSlides[currentIndex];
  galleryImage.style.opacity = "0.35";
  galleryImage.style.transform = "scale(1.03)";

  window.setTimeout(() => {
    galleryImage.src = slide.src;
    galleryImage.alt = slide.alt;
    galleryCaption.textContent = slide.caption;
    galleryImage.style.opacity = "1";
    galleryImage.style.transform = "scale(1)";
    renderDots();
  }, 150);
}

function changeSlide(direction) {
  showSlide(currentIndex + direction);
  restartAutoAdvance();
}

function restartAutoAdvance() {
  window.clearInterval(autoAdvance);
  autoAdvance = window.setInterval(() => showSlide(currentIndex + 1), 5000);
}

prevButton.addEventListener("click", () => changeSlide(-1));
nextButton.addEventListener("click", () => changeSlide(1));

function createHeart() {
  const heartsLayer = document.getElementById("heartsLayer");
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.animationDuration = `${7 + Math.random() * 5}s`;
  heart.style.opacity = `${0.2 + Math.random() * 0.35}`;
  heart.style.transform = `rotate(45deg) scale(${0.65 + Math.random() * 0.7})`;
  heartsLayer.appendChild(heart);
  window.setTimeout(() => heart.remove(), 12000);
}

showSlide(0);
restartAutoAdvance();
window.setInterval(createHeart, 700);
