# Lesson 1: One question, one answer

**Problem:** how does a program talk to a model at all?

**Run it from the main `Agentic Harness` folder:**

```bash
node lessons/01-one-question/agent.js
```

**Or from this lesson's folder:**

```bash
node agent.js
```

Press Ctrl+C to quit.

## Start here: the pieces involved

You don't need any programming background for this lesson. Four things work together:

| Piece | Think of it as | Its job here |
|---|---|---|
| **JavaScript** | A language | The language our instructions are written in |
| **`agent.js`** | A recipe | A text file holding those instructions. By itself, it does nothing |
| **Node** | The cook | The program that reads the recipe and carries it out |
| **Ollama** | A separate kitchen | A program on your Mac that runs the AI model |

So when you type `node agent.js`, you're saying: "Node, please carry out the instructions in this file."

### What is Node, and why do we need it?

JavaScript was created to run inside web browsers. A file of JavaScript can't run by itself, because something has to understand it, and your Mac's terminal doesn't.

**Node** is a free program that runs JavaScript outside a browser. It also lets that code do things a web page normally can't, such as reading what you type in the terminal.

### Why this combination?

- **It needs little setup.** Node already includes what this lesson uses, so there's nothing else to install.
- **It carries over to later lessons.** Web pages use JavaScript too, so the same language works when we build the browser timeline in Lesson 20.
- **It matches your chat app.** That project is JavaScript on Node as well.

Python would have worked just as well. The ideas in this course aren't tied to any one language.

## The code, line by line

### Part 1: Get ready to read your typing

```js
const readline = require('node:readline/promises');
```

- `require(...)` loads a tool that comes with Node. This one, `readline`, reads text typed into the terminal.
- `const readline =` saves that tool under the name `readline` so we can use it later. `const` means "this name won't be pointed at something else."

```js
const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
```

- This sets up a connection to your terminal and names it `terminal`.
- `process.stdin` is the keyboard input, and `process.stdout` is the text shown on screen.

### Part 2: A function that asks the model

```js
async function askModel(question) {
```

- A **function** is a named set of steps you can run whenever you want. This one is called `askModel`.
- `question` is the input it receives.
- `async` means some steps involve waiting, and the function is allowed to wait for them.

```js
  const response = await fetch('http://127.0.0.1:11434/api/chat', {
```

- `fetch` sends a request over the network, the same kind of request a browser makes to load a page.
- The address is Ollama. `127.0.0.1` means "this computer", `11434` is the port Ollama listens on, and `/api/chat` is the chat feature.
- `await` means "wait here until the answer comes back."
- The reply gets saved as `response`.

```js
    method: 'POST',
```

- `POST` means "I'm sending you some data." Our data is the question.

```js
    body: JSON.stringify({
```

- `body` is the data we're sending.
- `JSON.stringify` turns our JavaScript data into plain text in a format called **JSON**, because network requests carry text.

```js
      model: 'gemma4:e2b',
```

- Which AI model Ollama should use.

```js
      messages: [{ role: 'user', content: question }],
```

- **This is the most important line in the file.** It's everything the model will see.
- The `[ ]` makes a list, and it holds one message: who said it (`user`) and what they said (your question).
- Because the list only ever holds your latest question, the model has no memory.

```js
      stream: false,
```

- Wait and send the whole reply at once. Lesson 2 changes this.

```js
    }),
  });
```

- These only close the brackets opened above. The request is now complete.

```js
  const data = await response.json();
```

- The reply also arrives as JSON text. This turns it back into data JavaScript can use, and saves it as `data`.

```js
  return data.message.content;
}
```

- `return` hands a result back to whoever called the function.
- `data.message.content` means "inside `data`, inside `message`, the `content`", which is the reply's text.
- The `}` ends the function.

### Part 3: The main program

```js
async function main() {
```

- Another function, holding the program's main steps. `main` is just a traditional name.

```js
  while (true) {
```

- A **loop**: repeat what's inside these brackets. `true` never stops being true, so it repeats until you press Ctrl+C.

```js
    const question = await terminal.question('You: ');
```

- Shows `You: `, waits for you to type and press Enter, then saves your text as `question`.

```js
    console.log('Model:', await askModel(question));
```

- Calls our function with your question, waits for the reply, and prints it after `Model:`.

```js
  }
}
```

- These close the loop and the function.

```js
main();
```

- Nothing has actually run until now. The code above only *defined* the functions, and this line starts the program.

### The whole journey

1. You type a question.
2. `main` gives it to `askModel`.
3. `askModel` sends it to Ollama and waits.
4. Ollama runs the model and sends back a reply.
5. `main` prints the reply.
6. The loop goes back to step 1, keeping nothing from this round.

**The idea to keep:** a model call is just an HTTP request.

## Questions from the course

### If we already waited for the response, why do we need to `await` the data too?

```js
const response = await fetch(...);
const data = await response.json();
```

The two `await`s wait for different things, because the reply arrives in two stages.

1. **First `await` (`fetch`):** waits only for the **start** of the reply. That's the status (such as "200 OK") and some basic information, called headers. The main content, called the **body**, may still be on its way.
2. **Second `await` (`response.json()`):** waits for the **rest of the body** to arrive, then turns that JSON text into data JavaScript can use.

It's like getting a parcel delivered in two parts:

- **`await fetch(...)`:** the courier calls to say "your parcel is on its way, and it's the right one." You know it's coming, but you can't open it yet.
- **`await response.json()`:** the parcel arrives and you unpack it.

**Why it's built this way:** it lets your program react before the whole body arrives. A program could check the status first and skip downloading a large reply if something went wrong. Streaming in Lesson 2 relies on this too: once `fetch` finishes, the body is still arriving, so a loop can read each piece as it comes in.

**A detail specific to this lesson's code:** with `stream: false`, Ollama generates the whole reply before sending anything back. So the long wait actually happens at the first `await`, and the second is usually almost instant. It's still required, because `response.json()` always has to wait until the body has been fully read.

**Try it yourself:** remove the second `await` and print the result:

```js
const data = response.json();
console.log(data);
```

You'll see `Promise { <pending> }`. A **promise** is JavaScript's way of saying "I owe you this value, but it isn't ready yet", and `await` is how you wait for it. The next line, `data.message.content`, would then crash, because that IOU has no `message` inside it yet.

## Try it

Say `My name is Sam`, then ask `What is my name?`. It won't know, because the second request never contained the first message.

## Break it

Change the model name to `not-a-real-model` and predict what happens before you run it. Ollama replies with an error and no `message` field, so `data.message.content` crashes the program.
