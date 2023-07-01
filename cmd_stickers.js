const { loggerInfo, loggerWarn } = require("./logger");
const { MessageMedia } = require('whatsapp-web.js');
const { reagirMsg } = require("./wrappers-bot");
const { removerFundoMessageMedia } = require("./exec_removeBg");

function stickersBgHandler(dados){
	loggerInfo(`[stickersBgHandler] Chegou`);

	return new Promise(async (resolve,reject) => {
		reagirMsg(dados.msg, "⏳");

		const msgMedia = (dados.msg.hasMedia ? dados.msg : (dados.quotedMsg?.hasMedia ? dados.quotedMsg : false));

		if(msgMedia){
			msgMedia.downloadMedia().then(attachmentData => {
				const imgProcessar = attachmentData.mimetype.includes("video") ? {data: msgMedia._data.body, mimetype: "image/jpeg"} : attachmentData;

				removerFundoMessageMedia(imgProcessar).then((attachmentDataNoBg) => {
					reagirMsg(dados.msg, "✅");
					resolve([{msg: attachmentDataNoBg, isSticker: true, reply: true}]);
				}).catch(e => {
					reagirMsg(dados.msg, "❌");
					reject(`[stickersBgHandler] Erro: ${e}`);		
				});
			}).catch(e => {
				reagirMsg(dados.msg, "❌");
				reject(`[stickersBgHandler] Erro: ${e}`);	
			});
		}
	});
}

function stickersHandler(dados){
	loggerInfo(`[stickersHandler] Chegou`);

	return new Promise(async (resolve,reject) => {
		reagirMsg(dados.msg, "⏳");

		const msgMedia = (dados.msg.hasMedia ? dados.msg : (dados.quotedMsg?.hasMedia ? dados.quotedMsg : false));

		if(msgMedia){
			msgMedia.downloadMedia().then(attachmentData => {
				reagirMsg(msgMedia, "✅");

				resolve([{msg: attachmentData, isSticker: true, reply: true, react: "🖼️"}]);
			}).catch(e => {
				reagirMsg(msgMedia, "❌");
				loggerWarn(`[stickersHandler] Erro: ${e}`);	
			});
		} else {
			resolve([{msg: "*Uso*: Coloque _!sticker/!figurinha_ na legenda ou responda a mensagem com a mídia!", reply: true, react: "ℹ️"}]);
		}
	});
}

module.exports = { stickersHandler, stickersBgHandler };