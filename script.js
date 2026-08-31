/*
 * ChatGPT Answers a Question — teaching demo
 * ----------------------------------------------
 * A real, working bigram language model, built from a small built-in corpus:
 *   1. The corpus is tokenized into words.
 *   2. For every word, we record which words follow it, and how often.
 *   3. To "answer," we start from a word related to the question and
 *      repeatedly pick the next word based on those learned probabilities.
 *
 * This is the same core mechanism as a real language model — predicting
 * the next token from probabilities learned from text — just with a tiny
 * hand-picked corpus and single-word context instead of billions of
 * examples and a huge attention-based network.
 */

// A small built-in corpus the model "learns" from. Larger and more varied
// text produces more varied, coherent output.
const corpus = `
Artificial intelligence is a field of computer science focused on building
systems that can perform tasks which normally require human intelligence.
Machine learning is a branch of artificial intelligence where systems learn
patterns from data instead of following rules written by a programmer.
A language model learns to predict the next word in a sentence by studying
huge amounts of text and noticing which words tend to follow which.
Neural networks are inspired loosely by the brain and are built from layers
of simple units that combine and transform information.
Training a model means adjusting its internal numbers so its predictions
get closer and closer to the correct answer over many examples.
Data is the raw material that machine learning systems learn from, and the
quality of that data strongly shapes the quality of the model.
Computers process information using numbers, so text, images, and sound
must all be converted into numbers before a model can learn from them.
Predicting the next word sounds simple, but doing it well across every
topic requires learning grammar, facts, and reasoning patterns from text.
Large language models are called large because they are trained on massive
datasets using billions of internal parameters.
A good answer balances being accurate, being relevant to the question, and
being clearly explained in plain language.
`;

// ---- Build the bigram model ----

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/\n/g, ' ')
    .match(/[a-z']+|[.,!?]/g) || [];
}

const words = tokenize(corpus);

// bigramTable[word] = { nextWord: count, ... }
const bigramTable = {};
for (let i = 0; i < words.length - 1; i++) {
  const current = words[i];
  const next = words[i + 1];
  if (!bigramTable[current]) bigramTable[current] = {};
  bigramTable[current][next] = (bigramTable[current][next] || 0) + 1;
}

// Turn a word's follower counts into a sorted probability list.
function candidatesFor(word) {
  const table = bigramTable[word];
  if (!table) return [];
  const total = Object.values(table).reduce((a, b) => a + b, 0);
  return Object.entries(table)
    .map(([w, count]) => ({ word: w, prob: count / total }))
    .sort((a, b) => b.prob - a.prob);
}

// Sample a next word, weighted by probability (not just always picking #1 —
// this mirrors how real models sample rather than always taking the single
// most likely token, which tends to produce repetitive text).
function sampleNext(candidates) {
  const r = Math.random();
  let acc = 0;
  for (const c of candidates) {
    acc += c.prob;
    if (r <= acc) return c.word;
  }
  return candidates[candidates.length - 1].word;
}

// Pick a sensible starting word: the last recognizable word in the
// question that also exists in our vocabulary, or a fallback.
function pickStartWord(question) {
  const qWords = tokenize(question).reverse();
  for (const w of qWords) {
    if (bigramTable[w]) return w;
  }
  const fallbacks = ['a', 'machine', 'artificial', 'data', 'training'];
  return fallbacks.find((w) => bigramTable[w]) || Object.keys(bigramTable)[0];
}

// ---- UI wiring ----

const askInput = document.getElementById('askInput');
const askBtn = document.getElementById('askBtn');
const sampleBtn = document.getElementById('sampleBtn');
const answerBox = document.getElementById('answerBox');
const predictPanel = document.getElementById('predictPanel');
const predictList = document.getElementById('predictList');

function renderCandidates(candidates, chosenWord) {
  predictPanel.style.display = 'block';
  predictList.innerHTML = '';
  candidates.slice(0, 5).forEach((c) => {
    const pct = Math.round(c.prob * 100);
    const row = document.createElement('div');
    row.className = 'predict-row' + (c.word === chosenWord ? ' chosen' : '');
    row.innerHTML = `
      <div class="predict-word">${c.word}</div>
      <div class="predict-bar"><div class="predict-bar-fill" style="width:${pct}%"></div></div>
      <div class="predict-pct">${pct}%</div>
    `;
    predictList.appendChild(row);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAnswer(question) {
  askBtn.disabled = true;
  answerBox.innerHTML = '';

  let currentWord = pickStartWord(question);
  const outputWords = [currentWord];
  answerBox.innerHTML = `<span class="word-live">${currentWord}</span>`;

  const MAX_WORDS = 28;

  for (let i = 0; i < MAX_WORDS; i++) {
    const candidates = candidatesFor(currentWord);
    if (candidates.length === 0) break;

    const nextWord = sampleNext(candidates);
    renderCandidates(candidates, nextWord);

    await sleep(280);

    outputWords.push(nextWord);
    answerBox.innerHTML =
      outputWords.slice(0, -1).join(' ') +
      ` <span class="word-live">${nextWord}</span>`;

    currentWord = nextWord;
    if (nextWord === '.' && outputWords.length > 10) break;
  }

  // Clean up spacing around punctuation and finalize.
  const finalText = outputWords
    .join(' ')
    .replace(/\s+([.,!?])/g, '$1');
  answerBox.textContent = finalText.charAt(0).toUpperCase() + finalText.slice(1);

  askBtn.disabled = false;
}

askBtn.addEventListener('click', () => {
  const question = askInput.value.trim() || 'How does a language model work?';
  generateAnswer(question);
});

sampleBtn.addEventListener('click', () => {
  askInput.value = 'How does a language model learn to answer questions?';
});

askInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    askBtn.click();
  }
});
