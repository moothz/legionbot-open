const { Client, LocalAuth, version } = require('whatsapp-web.js');
const { loggerInfo, loggerWarn } = require("./logger");
const qrcode = require('qrcode-terminal');
const { initAuxiliares } = require("./auxiliares");
const configs = require("./configs");
const { messageHandler } = require("./handler_msg");
const { setWrapperClient } = require("./wrappers-bot");
const { updateDbs } = require("./db");

const client = new Client({
	authStrategy: new LocalAuth({ clientId: configs.bot.clientID }),
	ffmpegPath: configs.apps.ffmpeg,
	puppeteer: {
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
		executablePath: configs.apps.chrome,
		headless: false
	}
});

loggerInfo(`[sistema] Iniciando ${configs.bot.nome} (wwebjs ${version})`);

client.initialize();

client.on("qr", (qr) => {
	loggerInfo('[sistema] Recebido QRCode: ', qr);
	qrcode.generate(qr, {small: true});
});

client.on("authenticated", () => {
	loggerInfo('[sistema] Autenticado com sucesso.');
});

client.on("auth_failure", msg => {
	console.error('[sistema] Erro Autenticando o whatsapp, limpe os arquivos de .wwebjs_auth e tente novamente', msg);
});

client.on("ready", () => {
	loggerInfo('READY');
	initAuxiliares(client);
	setWrapperClient(client);
	updateDbs();
});

client.on("message", messageHandler);