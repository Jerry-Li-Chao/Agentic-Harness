# Lesson 5: Watching the context fill up

**Problem:** every turn sends more text. How much is too much, and what happens when you go past it?

**Run it from the main `Agentic Harness` folder:**

```bash
node lessons/05-context/agent.js
```

**Or from this lesson's folder:**

```bash
node agent.js
```

Press Ctrl+C to quit.

**See what this lesson added, from the main folder:**

```bash
git diff --no-index lessons/04-memory/agent.js lessons/05-context/agent.js
```

**Or from this lesson's folder:**

```bash
git diff --no-index ../04-memory/agent.js agent.js
```

## New words

- **Token:** the unit of text a model reads and writes. It's often a word or part of a word. In English, one token is very roughly 4 characters, but the only way to get an exact count is to ask the model's tokenizer.
- **Context:** all the text the model can see at one moment: the history plus the reply it's writing.
- **Context limit:** the most tokens that fit in the context. Think of it as a desk of a fixed size: when it's full, something has to fall off for anything new to fit.
- **`num_ctx`:** Ollama's setting for the context limit.

## The new code, line by line

Everything not shown here is the same as Lesson 4, so see [that note](../04-memory/README.md) for the rest.

```js
const CONTEXT_LIMIT = 4096;
```

- A name for our limit, so that it only has to be set in one place.
- 128 is very small on purpose, so you reach the limit within a few messages. Real chats use far more, such as 4096 or above.

```js
      options: { num_ctx: CONTEXT_LIMIT },
```

- `options` holds settings for how the model runs. This one tells Ollama how large the context should be.

```js
      think: false,
```

- `gemma4:e2b` normally thinks privately before it answers, and those tokens count in the totals even though this code doesn't print them. Turning this off makes the numbers match what you see. From this lesson on, the course keeps it off, and later lessons build thinking ourselves.

```js
      if (chunk.done) {
```

- `if` runs the code inside its `{ }` only when the condition is true. Only the last chunk has `done: true`, so this runs once per reply.

```js
        const used = chunk.prompt_eval_count + chunk.eval_count;
```

- `prompt_eval_count` is how many tokens the model read this turn.
- `eval_count` is how many tokens it wrote this turn.
- Adding them gives the tokens used this turn.

```js
        console.log(`\n[${used} of ${CONTEXT_LIMIT} tokens: ${chunk.prompt_eval_count} in, ${chunk.eval_count} out]`);
```

- Backticks (`` ` ``) make a template: text that can have values placed inside it. Each `${...}` gets replaced by the value inside it.
- `\n` ends the reply's line. That's why the `console.log()` in `main` from Lesson 4 is gone.

## What we saw

With short messages, the number of tokens read grows every turn, because the whole history is sent again:

```text
You: My name is Sam.
Model: Hello, Sam.
[34 of 128 tokens: 29 in, 5 out]
You: Name one planet.
Model: Earth.
[50 of 128 tokens: 47 in, 3 out]
You: What is my name?
Model: Your name is Sam.
[70 of 128 tokens: 64 in, 6 out]
You: Name one color.
Model: Blue.
[86 of 128 tokens: 83 in, 3 out]
You: Name one fruit.
Model: Apple.
[102 of 128 tokens: 99 in, 3 out]
You: What is my name?
Model: Your name is Sam.
[122 of 128 tokens: 116 in, 6 out]
```

The "in" numbers grow: 29, 47, 64, 83, 99, 116.

## What happens at the limit

Long answers get you there much sooner:

```text
You: My name is Sam.
Model: Hi Sam.
[33 of 128 tokens: 29 in, 4 out]
You: Tell me about the moon in four sentences.
[110 of 128 tokens: 51 in, 59 out]
You: Tell me about the sun in four sentences.
[185 of 128 tokens: 128 in, 57 out]
You: What is my name?
Model: I do not know your name.
[112 of 128 tokens: 104 in, 8 out]
```

(The moon and sun answers are left out here.)

Three things to notice:

- **The model forgot the name**, even though our `messages` list still held it. Our program sent everything, and the oldest part didn't reach the model. That list isn't the same as what the model sees.
- **There was no error.** Nothing warned you. The model confidently said you never told it your name, which is why it's useful to print these numbers.
- **"Used" can be higher than the limit.** Our number adds up everything read and written over the turn, and it doesn't all have to be in view at the same moment. Treat it as a warning sign, not an exact measure of what fits.

Lesson 6 takes control of what gets forgotten, so that it isn't left to chance.

## Questions from the course

### Hidden thinking made the token counts confusing. Can we turn it off?

Yes. With thinking on, a reply of "Hello, Sam!" cost 125 output tokens. With `think: false`, a similar reply, "Hi Sam.", cost 4. From this lesson on, the course keeps thinking off, and Part 7 builds it ourselves, starting simple. That works because thinking is just more text the model writes before its answer.

### When I asked my name, why did the "in" number drop back down? Don't we always send the full conversation?

Our program does send the full conversation. The "in" number counts what the model actually read, and Ollama cut the history down before the model saw it.

When the history won't fit in `num_ctx`, Ollama drops whole messages, starting with the oldest. It keeps the system prompt and the newest message. In this chat, the long answer about the sun used 133 tokens on its own, which is more than the 128 limit, so nothing older could fit past it, and it was dropped too:

```text
Our program sent:          system, then 7 messages
The model actually read:   system, "what is my name"
```

That's why the "in" number fell to 28, the same size as the very first turn, which also had only the system prompt and one short message. It's also why the model didn't know the name: "My name is Jerry" was gone before it read anything.

So there are two lists to keep apart: what your program sends, and what the model reads. The "in" number describes the second one. A sudden drop in it is a sign that history was cut.

### Why is the limit 128 in this lesson?

A small limit lets you see the lesson's point within a few messages, without a long chat. It's far too small for real use.

## Try it

Chat for a few turns and watch the "in" number climb until it reaches the limit. Ask for something long, then see how much the next turn's "in" number jumps.

## Break it

Try these one at a time, and predict the result first:

1. **Make it forget:** say `My name is Sam.`, ask for two long answers, then ask `What is my name?`.
2. **Print what it can't see:** add `console.log(messages.length);` as the first line of `askModel`. The list keeps growing even as the model forgets.
3. **Give it room:** set `CONTEXT_LIMIT` to `4096` and repeat the first exercise. It should remember your name.

Undo your changes with `git restore lessons/05-context/agent.js` from the main folder, or `git restore agent.js` from this lesson's folder.
