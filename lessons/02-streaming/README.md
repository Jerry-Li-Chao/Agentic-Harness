# Lesson 2: Streaming

**Problem:** you stare at nothing until the whole reply is ready.

**Run it from the main `Agentic Harness` folder:**

```bash
node lessons/02-streaming/agent.js
```

**Or from this lesson's folder:**

```bash
node agent.js
```

**See what this lesson added, from the main folder:**

```bash
git diff --no-index lessons/01-one-question/agent.js lessons/02-streaming/agent.js
```

**Or from this lesson's folder:**

```bash
git diff --no-index ../01-one-question/agent.js agent.js
```

## New words

- **Streaming:** receiving something bit by bit while it's being made, instead of waiting for all of it. Like watching someone type, rather than getting the finished letter.
- **Buffer:** a place to hold data until there's enough of it to use.
- **Chunk:** one small JSON object from Ollama, holding a few words of the reply.

## The new code, line by line

Everything not shown here is the same as Lesson 1, so see [that note](../01-one-question/README.md) for the rest.

```js
      stream: true,
```

- Asks Ollama to send the reply as it's generated.

```js
  const decoder = new TextDecoder();
```

- Network data arrives as raw bytes (numbers), not text. A decoder turns bytes into text.

```js
  let buffer = '';
```

- Starts our holding area as empty text. It uses `let` rather than `const` because its value will keep changing.

```js
  for await (const piece of response.body) {
```

- A loop that runs each time another `piece` of data arrives from Ollama, and ends when the reply is finished.
- A piece is whatever the network delivered. It doesn't line up neatly with lines of text.

```js
    buffer += decoder.decode(piece, { stream: true });
```

- Turns the piece into text and adds it to the end of the buffer.
- `{ stream: true }` tells the decoder more is coming, so a character split across two pieces, such as `世`, isn't garbled.

```js
    const lines = buffer.split('\n');
```

- Cuts the buffer into a list at each line break (`\n`).

```js
    buffer = lines.pop(); // The last item may be an unfinished line, so keep it for later.
```

- `pop` removes the last item from the list and hands it back. We put it back in the buffer, because it may be only half a line.

```js
    for (const line of lines) {
```

- Every remaining item is a complete line, so go through them one at a time.

```js
      const chunk = JSON.parse(line);
```

- Turns the line of JSON text back into data.

```js
      process.stdout.write(chunk.message.content);
```

- Prints this chunk's text. Unlike `console.log`, `write` doesn't start a new line, so the words join up.

The `main` function changes too:

```js
    process.stdout.write('Model: ');
    await askModel(question);
    console.log(); // End the reply's line.
```

- `askModel` now does the printing itself as words arrive, so `main` prints the label first and doesn't need a returned value.
- The empty `console.log()` moves to a new line once the reply ends.

### A small example of the buffer

Say the network delivers these two pieces:

```text
Piece 1:  {"message":{"content":"Hel
Piece 2:  lo"}}\n
```

After piece 1, there's no line break yet, so the whole thing waits in the buffer. After piece 2, the buffer holds one complete line, which can be parsed safely. Without the buffer, parsing piece 1 by itself would crash.

**The idea to keep:** a reply can arrive as a stream of small JSON chunks, one per line.

## Questions from the course

### What does `of` mean in `for await (const piece of response.body)`? Is it like Python's `in`? And how does the loop know a new piece has arrived?

Yes, `of` is JavaScript's version of Python's `in`. And the loop isn't really triggered by each new piece: **it asks for the next piece, then waits until one is there.**

| | JavaScript | Python |
|---|---|---|
| **Go through items in a list** | `for (const x of list)` | `for x in list:` |
| **Same, but items arrive over time** | `for await (const x of stream)` | `async for x in stream:` |

**Watch out:** JavaScript also has a `for...in`, and it's different. It gives you the positions or property names, not the items:

```js
const list = ['a', 'b'];
for (const x of list) console.log(x);  // a, b
for (const x in list) console.log(x);  // 0, 1
```

**How the loop knows a piece has arrived.** Here's roughly what `for await` does for you:

```js
const reader = response.body.getReader();

while (true) {
  const { value, done } = await reader.read();  // Ask for the next piece, and wait
  if (done) break;                              // The reply has ended, so leave the loop
  const piece = value;
  // ...the code inside your loop runs here...
}
```

So it's an ordinary loop with an `await` in it, using the same waiting you've already seen with `fetch`. Think of it as asking a waiter, "Is my next dish ready?" and being told, "I'll bring it when it is."

Here's the sequence, from the bottom up:

1. **The data arrives:** Ollama sends bytes over a network connection. Your Mac's operating system receives them, and Node gets notified.
2. **The stream stores it:** `response.body` is a **stream**, an object that hands out data as it arrives. If your loop isn't ready yet, the stream holds the data until it is.
3. **`reader.read()` gives you a promise:** a promise is JavaScript's way of saying "I owe you this value, but it isn't ready yet." It's kept once a piece is available.
4. **`await` pauses your function:** while it waits, your loop isn't running or repeatedly checking for data, so it uses no CPU. Node just remembers where to pick up again.
5. **Node resumes your loop:** when the promise is kept, Node carries on from that exact spot with the new piece, and the loop body runs.
6. **The loop ends:** when Ollama finishes and closes the reply, `read()` returns `done: true` and the loop stops.

The part of Node that handles this waiting and resuming is called the **event loop**.

`for await` hides the reader, the promises and the event loop. That's normal, and you don't need to understand the network layers to use it safely. The rule that covers most of this is: **`await` means "pause this function here, and resume when the value is ready."**

**Try it yourself:** add this as the first line inside the `for await` loop:

```js
console.log('\n[piece arrived]', piece.length, 'bytes');
```

You'll see the pieces arrive one at a time, each a slightly different size. You can see the loop waking up for each one.

### How can `世` be split across two pieces, and why would that happen?

The network sends bytes, not characters, and `世` takes up 3 bytes.

A byte can only hold a number from 0 to 255, which is too small to give every character in every language its own number. UTF-8, the usual way of storing text as bytes, therefore uses more bytes for some characters:

| Character | Bytes in UTF-8 | Number of bytes |
|---|---|---|
| `A` | `65` | 1 |
| `世` | `228 184 150` | 3 |
| `😀` | `240 159 152 128` | 4 |

The network has no idea that your data is text. It just moves a run of bytes, and it can divide them wherever it needs to, so a split can land in the middle of a character:

```text
Piece 1: ... 228 184
Piece 2: 150 ...
```

Think of mailing a jigsaw puzzle in several boxes: the post office fills each box without caring which pieces belong together.

If you decode each piece separately, neither half is a valid character, so you get the replacement symbol `�` instead of `世`. `decoder.decode(piece, { stream: true })` prevents this. When a piece ends partway through a character, the decoder holds on to those bytes and joins them with the start of the next piece.

This split won't happen often, especially when Ollama is running on your own machine, so a program without this protection can seem fine in testing and then occasionally show `�`.

**Try it yourself:** run this from any folder:

```bash
node -e "const b = new TextEncoder().encode('世'); console.log(b); console.log(new TextDecoder().decode(b.slice(0, 2))); const d = new TextDecoder(); console.log(JSON.stringify(d.decode(b.slice(0, 2), { stream: true }))); console.log(d.decode(b.slice(2), { stream: true }));"
```

You should see the three bytes, then `�` from decoding only the first two, then `""` because the streaming decoder is holding those two, and finally `世` once the last byte arrives.

### For `世`, is it 228 true, 184 true, 150 false?

No. `stream: true` isn't attached to each byte. You pass it once per `decode` call, for a whole piece, and it means "more pieces may follow, so keep any unfinished character for later." The code in this lesson passes `true` for every piece, including the one holding `150`.

The decoder knows whether a character is finished from the bytes themselves, because UTF-8 builds that information into their binary form:

| Byte | Binary | What the start of it means |
|---|---|---|
| `228` | `11100100` | `1110`: first byte of a 3-byte character |
| `184` | `10111000` | `10`: a continuing byte |
| `150` | `10010110` | `10`: a continuing byte |

So on seeing `228`, the decoder knows to expect two more bytes. Feeding the bytes in one at a time, all with `stream: true`, gives this:

```text
228 → outputs nothing, needs 2 more
184 → outputs nothing, needs 1 more
150 → outputs 世
```

`false` is for the end of the stream. It tells the decoder that nothing more is coming, so any unfinished bytes it's holding come out as `�`.

### If `stream` is always `true`, how do we know we've reached the end of the response? Wouldn't it just continue?

No, because `stream: true` doesn't control the loop. It's only an instruction to the decoder about unfinished characters, and it has no effect on how long the response lasts.

The end comes from the network. When Ollama has sent everything, it marks the HTTP response as finished. `response.body` then reports that there are no more pieces, and `for await` exits, so the code carries on from the line after the loop.

```text
Piece arrives       → loop body runs
Piece arrives       → loop body runs
Ollama finishes     → no more pieces, loop ends
```

Think of reading a letter: you stop when you run out of pages, and your reading style has nothing to do with it.

Three similar-looking things are easy to mix up:

| Thing | Where it is | What it means |
|---|---|---|
| `stream: true` in the request body | Sent to Ollama | "Send me the reply in pieces" |
| `{ stream: true }` in `decoder.decode` | Told to the decoder | "More bytes may follow, so keep unfinished characters" |
| `"done": true` in the last JSON chunk | Sent by Ollama | "The model has finished", along with the token counts |

This lesson's code doesn't read `"done": true`. The loop ends because the response itself ends.

If a connection stays open but stops sending, the loop keeps waiting, because nothing has told it the response is over. Lesson 24 adds timeouts for this.

### If we always pop the last item, won't we drop something when we reach the end?

During the loop, no. `lines.pop()` removes the last item from `lines`, but `buffer = lines.pop();` saves it, and the next piece gets added to it.

At the end, it depends on what's left in `buffer`, because the code never looks at `buffer` again after the loop. Anything still in there would be lost.

This code gets away with it because Ollama ends every line, including the last one, with `\n`. When text ends in `\n`, `split` gives an empty string as its last item, so that empty string is all that `pop` saves:

```text
'{"a":1}\n{"b":2}\n'  → ['{"a":1}', '{"b":2}', '']   pop saves ''       nothing lost
'{"a":1}\n{"b":2}'    → ['{"a":1}', '{"b":2}']       pop saves '{"b":2}'  lost if the stream ends here
```

So the code is relying on Ollama's format. If a server left off the final `\n`, or the connection dropped partway through a line, the leftover text would be silently ignored. In this lesson that would cost, at most, the last chunk.

### How do I exit the `git diff` view?

Press `q`, for quit. You don't need to press Enter.

When the output is too long to fit on screen, Git opens it in a viewer called a pager, usually one named `less`. You can tell you're in it when you see `:` or `(END)` at the bottom of the terminal. While you're in it:

| Key | What it does |
|---|---|
| `q` | Quit and return to your prompt |
| Up and down arrows | Move one line |
| Space | Move down one screen |
| `b` | Move back one screen |

To print the output straight into the terminal without opening the viewer, put `--no-pager` right after `git`. This compares the two lessons' code when run from the main folder:

```bash
git --no-pager diff --no-index lessons/01-one-question/agent.js lessons/02-streaming/agent.js
```

### If we split on the newline and `split` removes it, how do line breaks in the model's reply survive?

You're right that `split` removes the delimiter, but it never sees the line breaks in the reply. JSON doesn't allow a real line break inside a string, so a line break in the reply is written as two ordinary characters: a backslash and an `n`.

```text
{"content":"one\ntwo"}      ← the \n here is a backslash and an n, not a real line break
```

So there are two kinds of newline in the stream:

| What | Where | What happens to it |
|---|---|---|
| Real line break | Between JSON objects | `split('\n')` removes it, and it was only a separator |
| Backslash and `n` | Inside the reply text | `split` ignores it, and `JSON.parse` turns it into a real line break |

Each line therefore always holds one complete JSON object, however many line breaks the reply contains. `process.stdout.write` then prints the real line break that `JSON.parse` produced.

In JavaScript code, `'\n'` means a real line break, which is why `split('\n')` doesn't match the backslash and `n` in the stream.

## Try it

Ask for a few sentences and watch them appear piece by piece. There's still a pause first, because `gemma4:e2b` thinks by default and this code only prints `content`.

## Break it

Try these one at a time, and predict the result first:

1. **See the thinking:** add `process.stdout.write(chunk.message.thinking || '');` above the existing `write` line.
2. **See the raw chunks:** replace the `write` line with `console.log(line);`. The last chunk has `done: true` and the token counts.
3. **Remove the protection:** delete `buffer = lines.pop();`. The program should crash on a line it can't parse.

Undo your changes with `git restore lessons/02-streaming/agent.js` from the main folder, or `git restore agent.js` from this lesson's folder.
