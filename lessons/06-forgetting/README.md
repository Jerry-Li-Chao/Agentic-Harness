# Lesson 6: Forgetting on purpose

**Problem:** long chats overflow the context, and in Lesson 5, Ollama chose what to drop without telling you. You want to make that choice yourself.

**Run it from the main `Agentic Harness` folder:**

```bash
node lessons/06-forgetting/agent.js
```

**Or from this lesson's folder:**

```bash
node agent.js
```

Press Ctrl+C to quit.

**See what this lesson added, from the main folder:**

```bash
git diff --no-index lessons/05-context/agent.js lessons/06-forgetting/agent.js
```

**Or from this lesson's folder:**

```bash
git diff --no-index ../05-context/agent.js agent.js
```

## New words

- **Exchange:** one question and its reply. That's two messages.
- **Function:** a named block of code you can run by using its name. You've been using `askModel` and `main`, and this lesson adds a function that doesn't talk to the model at all.

## The new code, line by line

Everything not shown here is the same as Lesson 5, so see [that note](../05-context/README.md) for the rest.

```js
const CONTEXT_LIMIT = 4096;
```

- Lesson 5 used 128 so you could reach the limit quickly. This lesson raises it, so anything forgotten here is down to your code and not Ollama.

```js
const MAX_EXCHANGES = 2;
```

- How many earlier exchanges to keep. Two is very low on purpose, so you can see forgetting happen within a few messages.

```js
function forgetOldMessages() {
```

- Creates a function with this name. It has no `async`, because it never has to wait for anything.

```js
  const allowed = 1 + MAX_EXCHANGES * 2 + 1;
```

- Works out how many messages the list may hold: 1 system prompt, 2 messages per exchange, and 1 new question. With `MAX_EXCHANGES` at 2, that's 6.

```js
  while (messages.length > allowed) {
```

- `messages.length` is how many items are in the list. `while` repeats the code inside for as long as the condition is true, so this keeps going until the list is short enough.

```js
    messages.splice(1, 2);
```

- `splice` removes items from a list. The first number is where to start, and the second is how many to remove.
- List positions count from 0, so position 0 is the system prompt and position 1 is the oldest message after it.
- Starting at 1 is the whole trick: **the system prompt can never be removed.** Removing 2 takes out one question and its reply, so they stay paired.

```js
  forgetOldMessages();
```

- Runs the function. It goes right after your new question is added and before anything is sent.

## What we saw

```text
You: My name is Sam.
Model: Hi Sam.
[33 of 4096 tokens: 29 in, 4 out]
You: Name one planet.
Model: Earth.
[49 of 4096 tokens: 46 in, 3 out]
You: What is my name?
Model: Your name is Sam.
[69 of 4096 tokens: 63 in, 6 out]
You: Name one color.
Model: Blue.
[67 of 4096 tokens: 64 in, 3 out]
You: Name one fruit.
Model: Apple.
[67 of 4096 tokens: 64 in, 3 out]
You: What is my name?
Model: I do not know your name.
[69 of 4096 tokens: 61 in, 8 out]
```

- **The "in" number stops climbing.** It settles around 60, however long you chat. In Lesson 5, it just kept growing.
- **The model still forgets.** The difference is that your code now decides what goes, by a rule you can read and change. The limit is 4096, so Ollama isn't cutting anything here.

## The limits of this approach

This rule counts messages, not tokens. A single long reply can be far bigger than several short ones, so two exchanges could still overflow a small context. Counting tokens is more accurate, but it takes more code, and the idea is the same.

It also treats every message alike, so it drops "My name is Sam" just as readily as "Name one color". Keeping what matters is the next step: Lessons 7 and 8 replace old messages with a summary, which is known as compaction.

## Questions from the course

None yet.

## Try it

Say your name, ask three unrelated questions, then ask for your name again. Then set `MAX_EXCHANGES` to `10` and try the same chat. It should remember.

## Break it

Try these one at a time, and predict the result first:

1. **Drop the system prompt too:** set `SYSTEM_PROMPT` to `'Always answer in one word.'`, and change the `splice` line to `messages.splice(0, 2);`. Then ask `Name a planet.`, `Name a color.`, `Name a fruit.` and `Tell me about the sea.` When we tried this, the first three got one word each, and the fourth got a long essay of 578 tokens. With `splice(1, 2)`, the same question got "Vast".
2. **Remove only one message:** change it to `messages.splice(1, 1);`, then have a long chat with `console.log(messages);` as the first line of `askModel`. See how the list can now start with a reply that has no question.

Lesson 6 isn't committed yet, so undo your changes by hand for now. Once it's committed, use `git restore lessons/06-forgetting/agent.js` from the main folder, or `git restore agent.js` from this lesson's folder.
