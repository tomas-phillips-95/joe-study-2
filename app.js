(() => {
  "use strict";

  // ===== DOM elements =====
  const deckSelect = document.getElementById("deck-select");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const scoreText = document.getElementById("score-text");
  const cardQuestion = document.getElementById("card-question");
  const cardChoices = document.getElementById("card-choices");
  const tapHint = document.getElementById("tap-hint");
  const feedback = document.getElementById("feedback");
  const feedbackResult = document.getElementById("feedback-result");
  const cardExplanation = document.getElementById("card-explanation");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // ===== State =====
  let allDecks = [];
  let currentCards = [];
  let currentIndex = 0;
  let answered = false;
  let correctCount = 0;
  let attemptedCount = 0;

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
    correctCount = 0;
    attemptedCount = 0;
    resetAnswerState();
    renderCard();
  }

  // ===== Shuffle =====
  function shuffleCards() {
    for (let i = currentCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
    }
    currentIndex = 0;
    correctCount = 0;
    attemptedCount = 0;
    resetAnswerState();
    renderCard();
  }

  // ===== Answer State =====
  function resetAnswerState() {
    answered = false;
    feedback.classList.remove("visible");
    tapHint.classList.remove("hidden");
    feedbackResult.className = "feedback-result";
    feedbackResult.textContent = "";
    cardExplanation.textContent = "";
  }

  // ===== Rendering =====
  function renderCard() {
    const card = currentCards[currentIndex];
    if (!card) return;

    resetAnswerState();
    cardQuestion.textContent = card.question;

    // Build choice list
    cardChoices.innerHTML = "";
    const letters = Object.keys(card.choices || {});
    letters.forEach((letter) => {
      const li = document.createElement("li");
      li.dataset.letter = letter;

      const span = document.createElement("span");
      span.className = "choice-letter";
      span.textContent = letter + ".";
      li.appendChild(span);
      li.appendChild(document.createTextNode(" " + card.choices[letter]));

      li.addEventListener("click", () => selectAnswer(letter));
      cardChoices.appendChild(li);
    });

    updateProgress();
    updateScore();
    updateNavButtons();
  }

  // ===== Answer Selection =====
  function selectAnswer(selectedLetter) {
    if (answered) return;
    answered = true;
    attemptedCount++;

    const card = currentCards[currentIndex];
    const correctLetter = card.answer;
    const isCorrect = selectedLetter === correctLetter;

    if (isCorrect) correctCount++;

    // Mark all choices
    const items = cardChoices.querySelectorAll("li");
    items.forEach((li) => {
      const letter = li.dataset.letter;
      li.classList.add("answered");

      if (letter === correctLetter) {
        li.classList.add("correct");
      } else if (letter === selectedLetter) {
        li.classList.add("wrong");
      } else {
        li.classList.add("dimmed");
      }
    });

    // Show feedback
    tapHint.classList.add("hidden");
    feedback.classList.add("visible");

    if (isCorrect) {
      feedbackResult.textContent = "Correct!";
      feedbackResult.classList.add("is-correct");
    } else {
      const correctText = card.choices[correctLetter] || "";
      feedbackResult.textContent = `Incorrect — the answer is ${correctLetter}. ${correctText}`;
      feedbackResult.classList.add("is-wrong");
    }

    cardExplanation.textContent = card.explanation || "";
    updateScore();
  }

  function updateProgress() {
    const total = currentCards.length;
    const current = currentIndex + 1;
    const pct = (current / total) * 100;
    progressBar.style.width = pct + "%";
    progressText.textContent = `Card ${current} of ${total}`;
  }

  function updateScore() {
    if (attemptedCount === 0) {
      scoreText.textContent = "0 / 0 correct";
    } else {
      const pct = Math.round((correctCount / attemptedCount) * 100);
      scoreText.textContent = `${correctCount} / ${attemptedCount} correct (${pct}%)`;
    }
  }

  function updateNavButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentCards.length - 1;
  }

  // ===== Navigation =====
  function goNext() {
    if (currentIndex < currentCards.length - 1) {
      currentIndex++;
      renderCard();
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      renderCard();
    }
  }

  // ===== Event Listeners =====
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
    } else if (["1", "2", "3", "4"].includes(e.key)) {
      const letterMap = { "1": "A", "2": "B", "3": "C", "4": "D" };
      selectAnswer(letterMap[e.key]);
    }
  });

  // ===== Start =====
  init();
})();
