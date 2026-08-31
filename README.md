# ChatGPT Answers a Question — How It Works

A teaching demo with a real, working bigram language model built from
scratch in JavaScript — type a question and watch it generate an answer
one word at a time, with the candidate next-word probabilities shown live.

**No API key, no external AI service, no internet connection required.**
Unlike a real chatbot, this can't safely call a private language model from
a public GitHub Pages site (that would expose a secret key to anyone
viewing the page source) — so instead it builds and runs its own tiny
language model entirely in the browser.

## Files
