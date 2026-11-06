# Lesson 1: One question, one answer

**Problem:** how does a program talk to a model at all?

**Run it:**

```bash
node lessons/01-one-question/agent.js
```

Press Ctrl+C to quit.

## What to read in `agent.js`

- `readline` reads what you type in the terminal.
- `askModel(question)` sends one HTTP request to Ollama and returns the reply's text.
- `messages` is the whole conversation the model sees. Here it's only your latest question.
- `stream: false` waits for the complete reply.
- `while (true)` asks for your next question, forever.

**The idea to keep:** a model call is just an HTTP request.

## Try it

Say `My name is Sam`, then ask `What is my name?`. It won't know, because the second request never contained the first message.

## Break it

Change the model name to `not-a-real-model` and predict what happens before you run it. Ollama replies with an error and no `message` field, so `data.message.content` crashes the program.
