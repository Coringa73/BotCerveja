const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

client.once('clientReady', () => {
    console.log(`Bot ligado como ${client.user.tag}`);

    // Aviso de que está online
    const canal = client.channels.cache.get(CHANNEL_ID);
    if (canal) canal.send(`⚡ BotCerveja está online e pronto!`);

    // Executa todos os dias às 09:00
    cron.schedule('0 9 * * *', () => {
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-PT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const canal = client.channels.cache.get(CHANNEL_ID);
        if (canal) canal.send(`📅 Hoje é **${dataFormatada}**.`);
    }, {
        timezone: "Europe/Lisbon"
    });
});

client.login(TOKEN);