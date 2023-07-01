const { loggerInfo, loggerWarn } = require("./logger");
const { getDbGeral } = require("./db");
const { getTodosNumerosGrupo, reagirMsg } = require("./wrappers-bot");


function chamarAtencaoHandler(dados){
	return new Promise(async (resolve,reject) => {

		const dbGeral = getDbGeral();

		const retorno = {
			msg: "🚨 *Atenção* a todos!⚠️\n_Sua atenção foi requistada neste grupo imediatamente._",
			react: "🚨",
			reply: false,
			marcarPessoas: getTodosNumerosGrupo(dados.chat,dbGeral.listaIgnoreMentions)
		}

		loggerInfo(`[chamarAtencaoHandler] ${JSON.stringify(retorno)}`);

		if(dados.quotedMsg){
			// Marcou alguma mensagem
			if(dados.quotedMsg.hasMedia){
				// Se tem mídia, baixa e reenvia!
				const extraMsg = dados.cleanMessageText.includes(" ") ? dados.msg.body.substring(dados.msg.body.indexOf(' ') + 1)+"\n" : "";

				dados.quotedMsg.downloadMedia().then(attachmentData => {
					retorno.legenda = `${retorno.msg}\n\n${extraMsg}${dados.quotedMsg.body}`;
					retorno.msg = attachmentData;
					resolve([retorno]);
				}).catch(e => {
					loggerWarn(`[chamarAtencaoHandler] ${dados.nomeAutor} (${dados.numeroAutor}) pediu atenção em mídia mas não consegui baixar.`);
					// Não conseguiu baixar a mídia por algum motivo, manda só o texto
					retorno.msg += `\n\n${extraMsg}${dados.quotedMsg.body}`;
					resolve([retorno]);
				});
			} else {
				// Manda apenas o texto junto
				retorno.msg += "\n\n" + dados.quotedMsg.body;
				resolve([retorno]);
			}
		} else {
			// Atenção solto no grupo, verifica se a pessoa escreveu algo tipo "!atenção olhem o zap"
			if(dados.cleanMessageText.includes(" ")){
				const extraMsg = dados.msg.body.substring(dados.msg.body.indexOf(' ') + 1);
				if(extraMsg.length > 0){
					retorno.msg += "\n\n" + extraMsg;
				}
			}

			resolve([retorno]);
		}
	});
}

module.exports = { chamarAtencaoHandler }