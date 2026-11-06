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
