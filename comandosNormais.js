const { loggerInfo, loggerWarn } = require("./logger");

function handlerComandosNormais(dados){
	//loggerInfo(`[handlerComandosNormais] Chegou`);

	return new Promise(async (resolve,reject) => {
		const mensagensEnviar = [];

		try {
			if(dados.cleanMessageText === "ping"){
				mensagensEnviar.push({msg: "Pong!", reply: true});
			}

			resolve(mensagensEnviar);
		} catch(e) {
			reject(`[handlerComandosNormais] Erro: ${e}`);
		}
	});
}

module.exports = { handlerComandosNormais };