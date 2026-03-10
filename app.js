(() => {
  "use strict";

  // ===== DOM elements =====
  const deckSelect = document.getElementById("deck-select");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const cardEl = document.getElementById("card");
  const cardScene = document.getElementById("card-scene");
  const cardQuestion = document.getElementById("card-question");
  const cardChoices = document.getElementById("card-choices");
  const cardAnswer = document.getElementById("card-answer");
  const cardExplanation = document.getElementById("card-explanation");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // ===== State =====
  let allDecks = [];
  let currentCards = [];
  let currentIndex = 0;

  // ===== Init =====
  async function init() {
    const resp = await fetch("flashcards.json");
    const data = await resp.json();
    allDecks = data.decks;
    populateDeckSelector();
    loadDeck(0);
  }

  function populateDeckSelector() {
    allDecks.forEach((deck, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${deck.deck} (${deck.cards.length})`;
      deckSelect.appendChild(opt);
    });
  }

  // ===== Deck Loading =====
  function loadDeck(deckIndex) {
    currentCards = [...allDecks[deckIndex].cards];
    currentIndex = 0;
    unflipCard();
    renderCard();
  }

  // ===== Shuffle =====
  function shuffleCards() {
    for (let i = currentCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
    }
    currentIndex = 0;
    unflipCard();
    renderCard();
  }

  // ===== Rendering =====
  function renderCard() {
    const card = currentCards[currentIndex];
    if (!card) return;

    // Question
    cardQuestion.textContent = card.question;

    // Choices
    cardChoices.innerHTML = "";
    if (card.choices && Object.keys(card.choices).length > 0) {
      for (const [letter, text] of Object.entries(card.choices)) {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.className = "choice-letter";
        span.textContent = letter + ".";
        li.appendChild(span);
        li.appendChild(document.createTextNode(" " + text));
        cardChoices.appendChild(li);
      }
    }

    // Answer (back side)
    const answerLetter = card.answer;
    const answerText = card.choices?.[answerLetter] || "";
    cardAnswer.textContent = answerLetter
      ? `${answerLetter}. ${answerText}`
      : "No answer available";

    // Explanation
    cardExplanation.textContent = card.explanation || "";

    // Progress
    updateProgress();
    updateNavButtons();

    // Dynamically size the card-scene to fit whichever face is taller
    requestAnimationFrame(resizeCardScene);
  }

  function resizeCardScene() {
    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");
    const flipped = cardEl.classList.contains("is-flipped");
    const activeHeight = flipped ? back.scrollHeight : front.scrollHeight;
    const minH = Math.max(activeHeight, 200);
    cardScene.style.minHeight = minH + "px";
    cardEl.style.minHeight = minH + "px";
    for (const face of [front, back]) {
      face.style.minHeight = minH + "px";
    }
  }

  function updateProgress() {
    const total = currentCards.length;
    const current = currentIndex + 1;
    const pct = (current / total) * 100;
    progressBar.style.width = pct + "%";
    progressText.textContent = `Card ${current} of ${total}`;
  }

  function updateNavButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentCards.length - 1;
  }

  // ===== Card Flip =====
  function flipCard() {
    cardEl.classList.toggle("is-flipped");
    requestAnimationFrame(resizeCardScene);
  }

  function unflipCard() {
    cardEl.classList.remove("is-flipped");
  }

  // ===== Navigation =====
  function goNext() {
    if (currentIndex < currentCards.length - 1) {
      currentIndex++;
      unflipCard();
      renderCard();
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      unflipCard();
      renderCard();
    }
  }

  // ===== Event Listeners =====
  cardScene.addEventListener("click", flipCard);

  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  shuffleBtn.addEventListener("click", shuffleCards);

  deckSelect.addEventListener("change", (e) => {
    loadDeck(Number(e.target.value));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === " ") {
      e.preventDefault();
      flipCard();
    }
  });

  // Resize on flip transition end
  cardEl.addEventListener("transitionend", resizeCardScene);

  // ===== Start =====
  init();
})();

