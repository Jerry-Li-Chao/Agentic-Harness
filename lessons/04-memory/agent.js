const readline = require('node:readline/promises');

const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });

const SYSTEM_PROMPT = 'You are a helpful assistant. Keep answers short.';

// The whole conversation so far. The model remembers nothing, so we send all of this every time.
const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

async function askModel(question) {
  messages.push({ role: 'user', content: question });

  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: 'gemma4:e2b',
      messages: messages,
      stream: true,
    }),
  });

  // Ollama sends one JSON object per line, but network pieces can split a line in two.
  // So we hold text in `buffer` until a full line has arrived.
  const decoder = new TextDecoder();
  let buffer = '';
  let reply = ''; // Collects the model's words so we can save them afterward.

  for await (const piece of response.body) {
    buffer += decoder.decode(piece, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // The last item may be an unfinished line, so keep it for later.

    for (const line of lines) {
      const chunk = JSON.parse(line);
      process.stdout.write(chunk.message.content);
      reply += chunk.message.content;
    }
  }

  messages.push({ role: 'assistant', content: reply });
}

async function main() {
  while (true) {
    const question = await terminal.question('You: ');
    process.stdout.write('Model: ');
    await askModel(question);
    console.log(); // End the reply's line.
  }
}

main();
