import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// ===== COLEÇÕES =====
client.commands = new Collection();

// ===== SISTEMAS =====
import Logger from "./src/systems/logger.js";
import { ActionSystem } from "./src/systems/actionSystem.js";
import { RankingSystem } from "./src/systems/rankingSystem.js";
import { SetinSystem } from "./src/systems/setinSystem.js";
import { TicketEliteSystem } from "./src/systems/ticketEliteSystem.js";
import { HierarchySystem } from "./src/systems/hierarchySystem.js";

client.logger = new Logger(client);
client.acoes = new ActionSystem(client);
client.ranking = new RankingSystem(client);
client.setin = new SetinSystem(client);
client.ticketElite = new TicketEliteSystem(client);
client.hierarchy = new HierarchySystem(client);

// ===== LOAD COMMANDS =====
const commandsPath = path.join(__dirname, "src", "commands");
for (const file of fs.readdirSync(commandsPath)) {
  const command = await import(`./src/commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ===== LOAD EVENTS =====
const eventsPath = path.join(__dirname, "src", "events");
for (const file of fs.readdirSync(eventsPath)) {
  const event = await import(`./src/events/${file}`);
  client.on(event.name, (...args) => event.execute(...args, client));
}

// ===== READY =====
client.once("ready", () => {
  console.log(`🟣 NINE BOT online como ${client.user.tag}`);
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
