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
  const navPosition = document.getElementById("nav-position");
  const continueBtn = document.getElementById("continue-btn");
  const mainEl = document.getElementById("main");

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
    initSwipe();
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

      const textSpan = document.createElement("span");
      textSpan.textContent = card.choices[letter];
      li.appendChild(textSpan);

      li.addEventListener("click", () => selectAnswer(letter));
      cardChoices.appendChild(li);
    });

    updateProgress();
    updateScore();
    updateNavButtons();

    // Scroll to top of card on navigation
    mainEl.scrollTo({ top: 0, behavior: "smooth" });
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
        appendCheckIcon(li, "\u2713");
      } else if (letter === selectedLetter) {
        li.classList.add("wrong");
        appendCheckIcon(li, "\u2717");
      } else {
        li.classList.add("dimmed");
      }
    });

    // Show feedback
    tapHint.classList.add("hidden");
    feedback.classList.add("visible");

    if (isCorrect) {
      feedbackResult.textContent = "\u2705 Correct!";
      feedbackResult.classList.add("is-correct");
    } else {
      const correctText = card.choices[correctLetter] || "";
      feedbackResult.textContent = `\u274C Incorrect \u2014 answer is ${correctLetter}. ${correctText}`;
      feedbackResult.classList.add("is-wrong");
    }

    cardExplanation.textContent = card.explanation || "";
    updateScore();
    updateContinueBtn();
  }

  function appendCheckIcon(li, symbol) {
    const icon = document.createElement("span");
    icon.className = "choice-check";
    icon.textContent = symbol;
    li.appendChild(icon);
  }

  function updateProgress() {
    const total = currentCards.length;
    const current = currentIndex + 1;
    const pct = (current / total) * 100;
    progressBar.style.width = pct + "%";
    progressText.textContent = `${current} / ${total}`;
    navPosition.textContent = `${current} / ${total}`;
  }

  function updateScore() {
    if (attemptedCount === 0) {
      scoreText.textContent = "0 / 0 correct";
    } else {
      const pct = Math.round((correctCount / attemptedCount) * 100);
      scoreText.textContent = `${correctCount}/${attemptedCount} correct (${pct}%)`;
    }
  }

  function updateNavButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentCards.length - 1;
  }

  function updateContinueBtn() {
    const isLast = currentIndex === currentCards.length - 1;
    continueBtn.disabled = isLast;
    continueBtn.textContent = isLast ? "End of Deck" : "Next Question \u2192";
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

  // ===== Swipe Gesture =====
  function initSwipe() {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    mainEl.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    mainEl.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;

      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Only count horizontal swipes (not scrolls)
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) goNext();
      else goPrev();
    }, { passive: true });
  }

  // ===== Event Listeners =====
  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);
  continueBtn.addEventListener("click", goNext);
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
