const { loggerInfo, loggerWarn } = require("./logger");
const fs = require('fs');

let clientBot;

function nomeRandom(){
	return `${Math.floor(Math.random() * 1000000)}`;
}

function apagarArquivos(arquivos,tempo=120000){
	if(!Array.isArray(arquivos)){
		arquivos = [arquivos];
	}

	setTimeout((arqs) => {
		for(let arq of arqs){
			loggerInfo(`[apagarArquivo] ${arq}`);
			fs.unlinkSync(arq);
		}
	}, tempo, arquivos);
}

function initAuxiliares(client){
	clientBot = client;

	getContactById = clientBot.getContactById;
}



module.exports = { initAuxiliares, nomeRandom, apagarArquivos }