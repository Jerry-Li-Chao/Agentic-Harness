const readline = require("node:readline/promises");

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// How many tokens the model can see at once: the history plus the reply it's writing.
const CONTEXT_LIMIT = 128;

const SYSTEM_PROMPT = "You are a helpful assistant. Keep answers short.";

// The whole conversation so far. The model remembers nothing, so we send all of this every time.
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

async function askModel(question) {
  messages.push({ role: "user", content: question });

  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    body: JSON.stringify({
      model: "gemma4:e2b",
      messages: messages,
      stream: true,
      think: false, // Turn off hidden thinking, so the token counts match what you see.
      options: { num_ctx: CONTEXT_LIMIT },
    }),
  });

  // Ollama sends one JSON object per line, but network pieces can split a line in two.
  // So we hold text in `buffer` until a full line has arrived.
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = ""; // Collects the model's words so we can save them afterward.

  for await (const piece of response.body) {
    buffer += decoder.decode(piece, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // The last item may be an unfinished line, so keep it for later.

    for (const line of lines) {
      const chunk = JSON.parse(line);
      process.stdout.write(chunk.message.content);
      reply += chunk.message.content;

      // The last chunk has `done: true` and carries the token counts.
      if (chunk.done) {
        const used = chunk.prompt_eval_count + chunk.eval_count;
        console.log(
          `\n[${used} of ${CONTEXT_LIMIT} tokens: ${chunk.prompt_eval_count} in, ${chunk.eval_count} out]`,
        );
      }
    }
  }

  messages.push({ role: "assistant", content: reply });
}

async function main() {
  while (true) {
    const question = await terminal.question("You: ");
    process.stdout.write("Model: ");
    await askModel(question);
  }
}

main();
