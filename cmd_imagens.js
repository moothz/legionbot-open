const { loggerInfo, loggerWarn } = require("./logger");
const { removerFundoMessageMedia } = require("./exec_removeBg");
const { nomeRandom } = require("./auxiliares");
const { reagirMsg } = require("./wrappers-bot");

function removebgHandler(dados){
	return new Promise(async (resolve,reject) => {
		reagirMsg(dados.msg, "⏳");

		const msgMedia = (dados.msg.hasMedia ? dados.msg : (dados.quotedMsg?.hasMedia ? dados.quotedMsg : false));

		if(msgMedia){
			msgMedia.downloadMedia().then(attachmentData => {

				const imgProcessar = attachmentData.mimetype.includes("video") ? {data: msgMedia._data.body, mimetype: "image/jpeg"} : attachmentData;
				
				removerFundoMessageMedia(imgProcessar).then((attachmentDataNoBg) => {
					reagirMsg(dados.msg, "✅");

					attachmentDataNoBg.filename = `${dados.nomeGrupo}_rembg_${nomeRandom()}.png`;
					resolve([{msg: attachmentDataNoBg, isFile: true, reply: true}]);
				}).catch(e => {
					reagirMsg(dados.msg, "❌");
					reject(`[removebgHandler] Erro: ${e}`);		
				});
			}).catch(e => {
				reagirMsg(dados.msg, "❌");
				reject(`[removebgHandler] Erro: ${e}`);	
			});
		}
	});
}

module.exports = { removebgHandler }