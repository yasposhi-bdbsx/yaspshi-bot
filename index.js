import 'dotenv/config';
import { createRequire } from 'module';
import discordjs from 'discord.js';
const { Client, GatewayIntentBits } = discordjs;

const require = createRequire(import.meta.url);
// Loaded through require so the native TensorFlow build is used
require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs-node');
const nsfwjs = require('nsfwjs');

const TOKEN = process.env.DISCORD_TOKEN;
const THRESHOLD = parseFloat(process.env.THRESHOLD || '0.6');

if (!TOKEN || TOKEN.startsWith('paste_')) {
  console.error('Set DISCORD_TOKEN in your .env file');
  process.exit(1);
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

let model = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Returns true if the image looks explicit (Porn, Hentai or Sexy above threshold)
async function isExplicit(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const image = tf.node.decodeImage(buffer, 3);
  try {
    const predictions = await model.classify(image);
    const score = (name) => predictions.find((p) => p.className === name)?.probability || 0;
    const explicit = Math.max(score('Porn'), score('Hentai'), score('Sexy'));
    return explicit >= THRESHOLD;
  } finally {
    image.dispose();
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild || !model) return;

  const images = message.attachments.filter(
    (a) => a.url && IMAGE_TYPES.includes(a.contentType)
  );
  if (images.size === 0) return;

  let flagged = false;
  for (const att of images.values()) {
    try {
      if (await isExplicit(att.url)) {
        flagged = true;
        break;
      }
    } catch (err) {
      console.error('[scan] failed:', err.message);
    }
  }

  if (!flagged) return;

  try {
    await message.delete();
    const notice = await message.channel.send(
      `🚫 ${message.author}, your image was removed for breaking the server rules.`
    );
    setTimeout(() => notice.delete().catch(() => {}), 10_000);
  } catch (err) {
    console.error('[delete] failed (check Manage Messages permission):', err.message);
  }
});

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log('Loading NSFW model (first start downloads it, this can take a minute)...');
  model = await nsfwjs.load();
  console.log('NSFW guard is running.');
});

client.login(TOKEN);
