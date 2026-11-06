# Lesson 2: Streaming

**Problem:** you stare at nothing until the whole reply is ready.

**Run it:**

```bash
node lessons/02-streaming/agent.js
```

**See what this lesson added:**

```bash
git diff --no-index lessons/01-one-question/agent.js lessons/02-streaming/agent.js
```

## What to read in `agent.js`

- `stream: true` asks Ollama to send the reply as it's generated.
- `for await (const piece of response.body)` runs each time more data arrives.
- `buffer` holds text until a complete line has arrived, because the network can split a line in two.
- `lines.pop()` sets aside the last item, which may be unfinished.
- `process.stdout.write` prints without a new line, so the words join up.

**The idea to keep:** a reply can arrive as a stream of small JSON chunks, one per line.

## Try it

Ask for a few sentences and watch them appear piece by piece. There's still a pause first, because `gemma4:e2b` thinks by default and this code only prints `content`.

## Break it

Try these one at a time, and predict the result first:

1. **See the thinking:** add `process.stdout.write(chunk.message.thinking || '');` above the existing `write` line.
2. **See the raw chunks:** replace the `write` line with `console.log(line);`. The last chunk has `done: true` and the token counts.
3. **Remove the protection:** delete `buffer = lines.pop();`. The program should crash on a line it can't parse.

Undo your changes with `git restore lessons/02-streaming/agent.js`.
