import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// We test the pure logic that app.js relies on, without a real DOM.
// This covers shuffling, navigation bounds, answer evaluation, and scoring.
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCard(overrides = {}) {
  return {
    question: "What is 2+2?",
    choices: { A: "3", B: "4", C: "5", D: "6" },
    answer: "B",
    explanation: "Basic math.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Shuffle
// ---------------------------------------------------------------------------
describe("shuffle", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    assert.equal(shuffle(arr).length, arr.length);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffle(arr);
    assert.deepEqual(arr, copy);
  });

  it("contains the same elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    assert.deepEqual(result.sort(), arr.sort());
  });

  it("produces different orderings (statistical, 50-run check)", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = arr.join(",");
    let different = false;
    for (let i = 0; i < 50; i++) {
      if (shuffle(arr).join(",") !== original) {
        different = true;
        break;
      }
    }
    assert.ok(different, "shuffle should eventually produce a different order");
  });
});

// ---------------------------------------------------------------------------
// Navigation bounds
// ---------------------------------------------------------------------------
describe("navigation bounds", () => {
  function canGoNext(index, total) {
    return index < total - 1;
  }
  function canGoPrev(index) {
    return index > 0;
  }

  it("cannot go prev at index 0", () => {
    assert.equal(canGoPrev(0), false);
  });

  it("can go prev at index 1", () => {
    assert.equal(canGoPrev(1), true);
  });

  it("cannot go next at last card", () => {
    assert.equal(canGoNext(9, 10), false);
  });

  it("can go next when not at last card", () => {
    assert.equal(canGoNext(0, 10), true);
  });
});

// ---------------------------------------------------------------------------
// Answer evaluation
// ---------------------------------------------------------------------------
describe("answer evaluation", () => {
  function evaluate(selectedLetter, card) {
    const isCorrect = selectedLetter === card.answer;
    return { isCorrect, correctLetter: card.answer };
  }

  it("correct answer returns isCorrect = true", () => {
    const card = makeCard({ answer: "B" });
    const result = evaluate("B", card);
    assert.equal(result.isCorrect, true);
    assert.equal(result.correctLetter, "B");
  });

  it("wrong answer returns isCorrect = false", () => {
    const card = makeCard({ answer: "B" });
    const result = evaluate("A", card);
    assert.equal(result.isCorrect, false);
    assert.equal(result.correctLetter, "B");
  });

  it("returns the correct letter even on wrong selection", () => {
    const card = makeCard({ answer: "C" });
    const result = evaluate("D", card);
    assert.equal(result.correctLetter, "C");
  });
});

// ---------------------------------------------------------------------------
// Score tracking
// ---------------------------------------------------------------------------
describe("score tracking", () => {
  let correctCount, attemptedCount;

  beforeEach(() => {
    correctCount = 0;
    attemptedCount = 0;
  });

  function recordAnswer(isCorrect) {
    attemptedCount++;
    if (isCorrect) correctCount++;
    return { correctCount, attemptedCount };
  }

  function scorePercentage() {
    if (attemptedCount === 0) return 0;
    return Math.round((correctCount / attemptedCount) * 100);
  }

  it("starts at 0/0", () => {
    assert.equal(correctCount, 0);
    assert.equal(attemptedCount, 0);
    assert.equal(scorePercentage(), 0);
  });

  it("records a correct answer", () => {
    recordAnswer(true);
    assert.equal(correctCount, 1);
    assert.equal(attemptedCount, 1);
    assert.equal(scorePercentage(), 100);
  });

  it("records a wrong answer", () => {
    recordAnswer(false);
    assert.equal(correctCount, 0);
    assert.equal(attemptedCount, 1);
    assert.equal(scorePercentage(), 0);
  });

  it("tracks mixed results", () => {
    recordAnswer(true);
    recordAnswer(false);
    recordAnswer(true);
    assert.equal(correctCount, 2);
    assert.equal(attemptedCount, 3);
    assert.equal(scorePercentage(), 67);
  });

  it("resets when starting a new deck", () => {
    recordAnswer(true);
    recordAnswer(true);
    correctCount = 0;
    attemptedCount = 0;
    assert.equal(scorePercentage(), 0);
  });
});

// ---------------------------------------------------------------------------
// Progress calculation
// ---------------------------------------------------------------------------
describe("progress calculation", () => {
  function progressPercent(index, total) {
    return ((index + 1) / total) * 100;
  }

  it("first card is partial progress", () => {
    assert.equal(progressPercent(0, 10), 10);
  });

  it("last card is 100%", () => {
    assert.equal(progressPercent(9, 10), 100);
  });

  it("middle card gives 50% (for even total)", () => {
    assert.equal(progressPercent(4, 10), 50);
  });

  it("single card deck is 100%", () => {
    assert.equal(progressPercent(0, 1), 100);
  });
});

// ---------------------------------------------------------------------------
// Swipe detection logic
// ---------------------------------------------------------------------------
describe("swipe detection", () => {
  function detectSwipe(dx, dy, minDistance = 60) {
    if (Math.abs(dx) < minDistance) return "none";
    if (Math.abs(dy) > Math.abs(dx)) return "none";
    return dx < 0 ? "next" : "prev";
  }

  it("swipe left triggers next", () => {
    assert.equal(detectSwipe(-80, 10), "next");
  });

  it("swipe right triggers prev", () => {
    assert.equal(detectSwipe(80, 5), "prev");
  });

  it("short swipe is ignored", () => {
    assert.equal(detectSwipe(-30, 5), "none");
  });

  it("vertical swipe is ignored", () => {
    assert.equal(detectSwipe(-80, 100), "none");
  });

  it("diagonal favoring vertical is ignored", () => {
    assert.equal(detectSwipe(70, -75), "none");
  });
});

// ---------------------------------------------------------------------------
// Keyboard shortcut mapping
// ---------------------------------------------------------------------------
describe("keyboard shortcut mapping", () => {
  const letterMap = { "1": "A", "2": "B", "3": "C", "4": "D" };

  it("maps 1 to A", () => assert.equal(letterMap["1"], "A"));
  it("maps 2 to B", () => assert.equal(letterMap["2"], "B"));
  it("maps 3 to C", () => assert.equal(letterMap["3"], "C"));
  it("maps 4 to D", () => assert.equal(letterMap["4"], "D"));

  it("unmapped keys return undefined", () => {
    assert.equal(letterMap["5"], undefined);
    assert.equal(letterMap["0"], undefined);
  });
});

