# Lesson 4: Conversation memory

**Problem:** in Lesson 1, you said "My name is Sam", and on the next message the model had no idea. It still forgets everything between questions.

**Run it from the main `Agentic Harness` folder:**

```bash
node lessons/04-memory/agent.js
```

**Or from this lesson's folder:**

```bash
node agent.js
```

Press Ctrl+C to quit.

**See what this lesson added, from the main folder:**

```bash
git diff --no-index lessons/03-system-prompt/agent.js lessons/04-memory/agent.js
```

**Or from this lesson's folder:**

```bash
git diff --no-index ../03-system-prompt/agent.js agent.js
```

## The big idea

**The model has no memory between requests.** Each request starts from nothing. It only seems to remember because the harness sends the whole conversation again every time.

It's like talking to someone who forgets everything the moment they reply. To keep the conversation going, you hand them a full transcript along with each new question. They read it all and seem to remember, but the memory is in the transcript.

## New words

- **History:** the list of everything said so far in the conversation.
- **Assistant:** the role for the model's own messages, alongside `system` and `user`.

## The new code, line by line

Everything not shown here is the same as Lesson 3, so see [that note](../03-system-prompt/README.md) for the rest.

```js
const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
```

- This creates the history, starting with just the system prompt.
- It sits outside `askModel`, so it lasts between questions. In Lesson 3, the list was built inside `askModel`, so it was thrown away after each call.
- It uses `const` even though the list grows. `const` means the name always points to the same list, and you can still add things to that list.

```js
  messages.push({ role: 'user', content: question });
```

- `push` adds an item to the end of a list. This adds your new question to the history before it's sent.

```js
      messages: messages,
```

- Sends the whole history. The left `messages` is the name Ollama expects, and the right `messages` is our list.

```js
  let reply = '';
```

- An empty piece of text that will collect the model's words. Streaming delivers the reply in small bits, so we have to put them back together to save it.

```js
      reply += chunk.message.content;
```

- `+=` adds to the end of what's already there. Each new bit of the reply joins the rest.

```js
  messages.push({ role: 'assistant', content: reply });
```

- This runs after the loop has finished, so `reply` is complete. It saves the reply into the history so the model can see what it said.

## What gets sent

After you say "My name is Sam" and get a reply, your next question sends all of this:

```js
[
  { role: 'system', content: 'You are a helpful assistant. Keep answers short.' },
  { role: 'user', content: 'My name is Sam.' },
  { role: 'assistant', content: 'Hello, Sam!' },
  { role: 'user', content: 'What is my name?' },
]
```

The list grows with every turn, so each request is bigger than the last. Lesson 5 measures that growth.

The history also only lives in your program's memory, so it's gone when you press Ctrl+C.

## Questions from the course

None yet.

## Try it

Say `My name is Sam.`, then ask `What is my name?`. It should now know. When we ran this, it replied "Your name is Sam."

## Break it

Try these one at a time, and predict the result first:

1. **See what's sent:** add `console.log(messages);` as the first line of `askModel`, then have a short chat and watch the list grow.
2. **Lose its side of the chat:** delete the `messages.push({ role: 'assistant', content: reply });` line. It still has your messages, so it may still know your name, but ask `What did you just say?`.
3. **Plant a false memory:** replace the `messages` line with the code below, then ask `What is my name and what food do I love?`. You never typed any of this, but the model can't tell, because the history is just text your program sent.

```js
const messages = [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: 'My name is Alex and I love pizza.' },
  { role: 'assistant', content: 'Nice to meet you, Alex!' },
];
```

Lesson 4 isn't committed yet, so undo your changes by hand for now. Once it's committed, use `git restore lessons/04-memory/agent.js` from the main folder, or `git restore agent.js` from this lesson's folder.
