# Build an Agent Harness, One Small Step at a Time

A hands-on course in how AI agents work. You start with a chat that forgets everything and finish with an agent that searches the web, decides when it's done, and shows you each step as it works.

**The big idea:** the model only turns text into text. Memory, tools, loops and safety are all ordinary code around it, and that code is the harness.

## How the course works

- **One idea per lesson.** If a lesson needs two ideas, it becomes two lessons.
- **Small additions.** Most lessons add about 5–25 readable lines. The line counts below are targets, not promises.
- **Always runnable.** The program works at the end of every lesson.
- **See it fail first.** You run into each problem before you fix it, so you know why the code exists.
- **Plain tools.** JavaScript on Node, with your local Ollama and no packages until the final lesson. Nothing is hidden inside a library.

Every lesson has the same four parts:

| Part | What you do |
|---|---|
| **Problem** | See what's missing or broken |
| **Build** | Add the code and read why each part is there |
| **Try it** | Run it and see the new behavior |
| **Break it** | Change one thing on purpose and predict what happens |

**Project layout:** each lesson has its own folder in `lessons/`, with a complete, runnable copy of the code and a short note. The code stays in one file, `agent.js`, until Part 5 gives a reason to split it. Each finished lesson also gets a git tag, such as `lesson-02`.

**Model:** `gemma4:e2b` by default. It's a small model, so it will sometimes pick the wrong tool or misread a result. That's useful here, because a harness has to cope with those mistakes.

---

## Part 1: Talk to a model

### Lesson 1: One question, one answer
- **Problem:** how does a program talk to a model at all?
- **Build:** a terminal prompt, one request to Ollama, print the reply (about 25 lines).
- **Learn:** a model call is just an HTTP request.
- **Try it:** say "My name is Sam", then ask "What is my name?". It won't know.
- **Break it:** use a model name that doesn't exist and read the error.

### Lesson 2: Streaming
- **Problem:** you stare at nothing until the whole reply is ready.
- **Build:** set `stream: true` and print the pieces as they arrive (about 15 lines).
- **Learn:** a reply can arrive as a stream of small JSON chunks.
- **Break it:** print the raw chunks and find the final one with the stats.

### Lesson 3: The system prompt
- **Problem:** how do you set the model's behavior for every message?
- **Build:** add a `system` message (about 3 lines).
- **Learn:** instructions are just more text, with no special enforcement.
- **Break it:** tell it "always answer in one word", then ask it to ignore that.

---

## Part 2: Give it memory

### Lesson 4: Conversation memory
- **Problem:** the Lesson 1 forgetting.
- **Build:** keep a `messages` array and send all of it every time (about 5 lines).
- **Learn:** the model has no memory between requests. The harness re-sends the history.
- **Break it:** edit an earlier message in the array. The model believes the new version.

### Lesson 5: Watching the context fill up
- **Problem:** every turn sends more text. How much is too much?
- **Build:** print tokens used against the context limit after each reply (about 5 lines).
- **Learn:** tokens, `num_ctx`, and why memory has a limit.
- **Break it:** set `num_ctx` very low and watch the model lose the start of the conversation.

### Lesson 6: Forgetting on purpose
- **Problem:** long chats overflow, and you don't control what gets lost.
- **Build:** drop the oldest turns but always keep the system prompt (about 10 lines).
- **Learn:** you decide what the model remembers.
- **Break it:** drop the system prompt as well and watch the behavior change.

### Lesson 7: Why agents get slow
- **Problem:** the same question can take a fraction of a second or a minute.
- **Build:** print prompt time per turn, then change the system prompt mid-chat (about 5 lines).
- **Learn:** prompt caching only helps when the start of the prompt stays the same.
- **Break it:** add the current time to the system prompt and compare the timings.

---

## Part 3: Give it hands

### Lesson 8: The model asks for a tool
- **Problem:** the model can't do anything except produce text.
- **Build:** describe one `get_time` tool and print what the model requests (about 15 lines).
- **Learn:** the model never runs anything. It only asks.
- **Break it:** ask something unrelated and see that it doesn't ask for the tool.

### Lesson 9: Run the tool, send back the result
- **Problem:** the model asked, and nothing happened.
- **Build:** run the tool, add a `tool` message, call the model again (about 15 lines).
- **Learn:** a tool call is two model calls with your code in between.
- **Break it:** return a wrong time and see the model repeat it confidently.

### Lesson 10: The loop
- **Problem:** what if it needs a second tool call after seeing the first result?
- **Build:** turn Lesson 9 into a `while` loop that ends when no tool is requested (about 10 lines).
- **Learn:** this loop is the agent. "Decide if it's done" is simply the model choosing not to call a tool.
- **Try it:** ask a question that needs two tool calls.

### Lesson 11: A tool registry
- **Problem:** adding tools shouldn't mean editing the loop.
- **Build:** a `tools` list of name, description, parameters and function, plus a `calculate` tool (about 20 lines).
- **Learn:** tool descriptions are prompts, and the model picks tools by reading them.
- **Break it:** write a vague description and watch tool choice get worse.

### Lesson 12: When the model gets it wrong
- **Problem:** unknown tools, bad arguments and tools that throw errors crash the program.
- **Build:** catch them and send the error back as the tool result (about 10 lines).
- **Learn:** errors are information the model can act on.
- **Break it:** make a tool always fail and watch how the model responds.

### Lesson 13: Stopping a runaway
- **Problem:** the loop could run forever.
- **Build:** a step limit, a block on repeated identical calls, and one last turn with no tools (about 15 lines).
- **Learn:** the harness holds the final say over the loop.
- **Break it:** set the limit to 1 and read the forced answer.

---

## Part 4: Reach the web

### Lesson 14: `web_search`
- **Problem:** the model's knowledge stops at its training date.
- **Build:** search and return titles, links and snippets (about 25 lines).
- **Learn:** a real tool is just a function that returns text.
- **Try it:** ask about something recent and see the citations.

### Lesson 15: `fetch_page`
- **Problem:** snippets rarely hold the actual answer.
- **Build:** let the model open a chosen page, with its text cut to a size limit (about 25 lines).
- **Learn:** tool output spends context, so size limits matter.
- **Break it:** remove the limit, open a huge page and watch the context overflow.

### Lesson 16: Why it says "I don't know"
- **Problem:** you ask for a stock price and it tells you to go check a website. (We hit this exact bug.)
- **Build:** print what the model actually received, then make a tool that returns labeled fields (about 20 lines).
- **Learn:** debug the input first. Clean, structured results beat scraped text.
- **Break it:** return unlabeled numbers and see if it misreads them.

### Lesson 17: Untrusted content
- **Problem:** a web page can include text like "ignore your instructions".
- **Build:** a local test page containing an injection, then mark tool results as data in the system prompt (about 10 lines).
- **Learn:** prompt injection, and why instructions alone are not a security boundary. The real defense is limiting what tools can do.
- **Break it:** see whether the model obeys the page. Sometimes it will.

---

## Part 5: See inside it

### Lesson 18: Events
- **Problem:** `console.log` is scattered through the loop.
- **Build:** one `emit(event)` function for each step, and split out `loop.js` (about 20 lines).
- **Learn:** separating what happened from how it's displayed.
- **Try it:** print the same run as readable text, then as raw JSON.

### Lesson 19: Run logs
- **Problem:** when a run goes wrong, the evidence is gone.
- **Build:** save events to a file and replay them (about 15 lines).
- **Learn:** agents are hard to debug without a record of what happened.
- **Try it:** replay a failed run without calling the model.

### Lesson 20: A live timeline in the browser
- **Problem:** you want to watch each step: thinking, tool calls, results, decisions.
- **Build:** a small Node server that streams events to one web page (about 80 lines, the biggest lesson).
- **Learn:** the loop doesn't change at all, which is the payoff from Lesson 18.
- **Try it:** watch a two-search question unfold live.

---

## Part 6: Make it dependable

### Lesson 21: Stop and timeouts
- **Problem:** a stuck tool or a long reply can't be stopped.
- **Build:** pass an `AbortSignal` through the model call and the tools (about 15 lines).
- **Learn:** cancellation has to reach every layer.
- **Break it:** run a tool with a blocking `while` loop. The timeout can't fire. (A regex froze our server this way.)

### Lesson 22: Testing with a fake model
- **Problem:** real models are slow and give different answers each run.
- **Build:** swap in a scripted fake model and test the loop with `node --test` (about 30 lines).
- **Learn:** the harness can be tested without AI if the model call is passed in.
- **Try it:** write tests for the step limit and for tool errors.

### Lesson 23: Measuring the agent
- **Problem:** did your last prompt change help or hurt?
- **Build:** a handful of questions with expected answers, and a score across runs (about 30 lines).
- **Learn:** evals, and why one good run proves very little.
- **Try it:** compare `gemma4:e2b` and `qwen3.5:4b` on the same questions.

### Lesson 24: Compare with a framework
- **Problem:** what do frameworks give you, and what do they hide?
- **Build:** rebuild the agent in LangGraph or the Vercel AI SDK. Check their current docs first, since these libraries change quickly.
- **Learn:** you can now read a framework as the same loop you already wrote, and decide when one is worth using.

---

## Lesson 1 code

Tested against local Ollama with `gemma4:e2b`: it replied, then forgot the name on the next message.

```js
const readline = require('node:readline/promises');

const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });

async function askModel(question) {
  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: 'gemma4:e2b',
      messages: [{ role: 'user', content: question }],
      stream: false,
    }),
  });
  const data = await response.json();
  return data.message.content;
}

async function main() {
  while (true) {
    const question = await terminal.question('You: ');
    console.log('Model:', await askModel(question));
  }
}

main();
```

Run it with `node lessons/01-one-question/agent.js`, and press Ctrl+C to quit.
