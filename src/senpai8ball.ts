import { Client, Message } from "discord.js";

const client = new Client({ intents: [] });

const responses: string[] = [
  "Yes.",
  "No.",
  "Maybe.",
  "Ask again later.",
  "Definitely!",
  "I don't think so.",
  "Absolutely!",
  "Not in a million years.",
];

client.on("messageCreate", (message: Message) => {
  if (message.content.startsWith("!8ball")) {
    const randomIndex = Math.floor(Math.random() * responses.length);
    const reply = responses[randomIndex];
    message.reply(reply);
  }
});

export default client;
