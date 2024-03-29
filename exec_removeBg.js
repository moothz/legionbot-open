const { loggerInfo, loggerWarn } = require("./logger");
const { MessageMedia } = require('whatsapp-web.js');
const configs = require("./configs");
const path = require('node:path');
const { exec } = require('child_process');
const { nomeRandom, apagarArquivos } = require("./auxiliares");
const mime = require('mime-types');
const fsp = require('fs').promises;

function removerFundoMessageMedia(attachmentData){
	loggerInfo(`[removerFundoMessageMedia] Chegou`);

	return new Promise(async (resolve,reject) => {
		const nRand = nomeRandom();

		// Se receber vídeo, pega o thumb
		
		const buff = Buffer.from(attachmentData.data, "base64");
		const arquivoTempEntrada = path.join(configs.rootFolder,"temp",`rembg_${nRand}_in.${mime.extension(attachmentData.mimetype)}`);
		const arquivoTempSaida = path.join(configs.rootFolder,"temp",`rembg_${nRand}_out.png`);

		loggerInfo(`[removerFundoMessageMedia] Removendo fundo: '${arquivoTempEntrada}' -> '${arquivoTempSaida}'...`);
		fsp.writeFile(arquivoTempEntrada, buff).then((res) => {
			try{
				exec(`${configs.apps.removebg} i ${arquivoTempEntrada} ${arquivoTempSaida}`, (error, stdout, stderr) => {
					if (stderr || error || stdout.includes("erro")) {
						loggerWarn(`[removerFundoMessageMedia] Erro:\n${error}\n${stderr}\n${stdout}\n----`);
						reject(`[removerFundoMessageMedia] ${error}, ${stderr}`);
					} else {
						apagarArquivos([arquivoTempEntrada,arquivoTempSaida]);
						resolve(MessageMedia.fromFilePath(arquivoTempSaida,"image/png"));
					}
				});
			} catch (e){
				throw e;
			}
		}).catch(e => {
			loggerWarn(`[removerFundoMessageMedia] Erro tentando gravar arquivo:\n${e}`);
			reject(e);
		});
		
	});
}


module.exports = { removerFundoMessageMedia }