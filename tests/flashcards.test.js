import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const data = JSON.parse(readFileSync(join(root, "flashcards.json"), "utf-8"));
const { decks } = data;

// ---------------------------------------------------------------------------
// flashcards.json structure
// ---------------------------------------------------------------------------
describe("flashcards.json structure", () => {
  it("has a top-level decks array", () => {
    assert.ok(Array.isArray(decks));
    assert.ok(decks.length > 0, "decks array should not be empty");
  });

  it("contains exactly 6 decks", () => {
    assert.equal(decks.length, 6);
  });

  it("each deck has a name and a cards array", () => {
    for (const deck of decks) {
      assert.ok(typeof deck.deck === "string", "deck.deck should be a string");
      assert.ok(deck.deck.length > 0, "deck name should not be empty");
      assert.ok(Array.isArray(deck.cards), "deck.cards should be an array");
      assert.ok(deck.cards.length > 0, "deck should have at least one card");
    }
  });
});

// ---------------------------------------------------------------------------
// Card schema
// ---------------------------------------------------------------------------
describe("card schema", () => {
  const allCards = decks.flatMap((d) => d.cards);

  it("every card has required fields", () => {
    for (const card of allCards) {
      assert.ok("question" in card, "card should have a question");
      assert.ok("choices" in card, "card should have choices");
      assert.ok("answer" in card, "card should have an answer");
      assert.ok("explanation" in card, "card should have an explanation field");
    }
  });

  it("every card has a non-empty question", () => {
    for (const card of allCards) {
      assert.ok(
        typeof card.question === "string" && card.question.length > 0,
        `question should be a non-empty string, got: "${card.question}"`
      );
    }
  });

  it("every card has a valid answer letter (A-D)", () => {
    for (const card of allCards) {
      assert.match(
        card.answer,
        /^[A-D]$/,
        `answer should be A-D, got: "${card.answer}"`
      );
    }
  });

  it("every card's answer letter exists in its choices", () => {
    for (const card of allCards) {
      assert.ok(
        card.answer in card.choices,
        `answer "${card.answer}" not found in choices: ${JSON.stringify(Object.keys(card.choices))}`
      );
    }
  });

  it("every card has at least 2 choices", () => {
    for (const card of allCards) {
      const n = Object.keys(card.choices).length;
      assert.ok(n >= 2, `card should have at least 2 choices, got ${n}`);
    }
  });

  it("choice keys are uppercase letters", () => {
    for (const card of allCards) {
      for (const key of Object.keys(card.choices)) {
        assert.match(key, /^[A-D]$/, `choice key should be A-D, got: "${key}"`);
      }
    }
  });

  it("choice values are strings (warns on empty)", () => {
    let emptyCount = 0;
    for (const card of allCards) {
      for (const [key, val] of Object.entries(card.choices)) {
        assert.ok(typeof val === "string", `choice ${key} should be a string`);
        if (val.length === 0) emptyCount++;
      }
    }
    // Allow up to 2 empty choices from PDF extraction artifacts
    assert.ok(
      emptyCount <= 2,
      `expected at most 2 empty choice values, got ${emptyCount}`
    );
  });
});

// ---------------------------------------------------------------------------
// Deck-specific counts
// ---------------------------------------------------------------------------
describe("deck card counts", () => {
  const expectedCounts = [
    ["Midterm - Foundations and Legal/Ethical Frameworks", 20],
    ["Midterm - Physical Assessment and Diagnostic Findings", 20],
    ["Midterm - Personality Disorders and Defense Mechanisms", 20],
    ["Midterm - Pediatric and Adolescent Psychiatry", 20],
    ["Midterm - Mood Disorders and Psychosis", 10],
    ["Review Questions", 100],
  ];

  for (const [name, expected] of expectedCounts) {
    it(`"${name}" has ${expected} cards`, () => {
      const deck = decks.find((d) => d.deck === name);
      assert.ok(deck, `deck "${name}" should exist`);
      assert.equal(deck.cards.length, expected);
    });
  }

  it("total card count is 190", () => {
    const total = decks.reduce((sum, d) => sum + d.cards.length, 0);
    assert.equal(total, 190);
  });
});

// ---------------------------------------------------------------------------
// Review Questions have explanations
// ---------------------------------------------------------------------------
describe("Review Questions explanations", () => {
  const reviewDeck = decks.find((d) => d.deck === "Review Questions");

  it("every review question has an explanation", () => {
    for (const card of reviewDeck.cards) {
      assert.ok(
        typeof card.explanation === "string" && card.explanation.length > 0,
        `review question should have an explanation: "${card.question.slice(0, 60)}..."`
      );
    }
  });
});

