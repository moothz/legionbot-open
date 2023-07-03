const { loggerInfo, loggerWarn } = require("./logger");
const { getDbGeral, saveDbGeral, getGrupoByNome, updateDbs } = require("./db");
const configs = require("./configs");
const mime = require('mime-types');
const fsp = require('fs').promises;
const path = require('node:path');
const { reagirMsg } = require("./wrappers-bot");

/*
	Os comandos de gerencia seguem o seguinte padrão

	!gerenciar-CATEGORIA-ITEM

	Categorias:
		- grupo: Boas vindas, Lembretes, 
		- cmd: NSFW, Globais, CRUD de comandos
		- roleta: Opções da roleta russa
		- twitch: Canal da twitch do grupo
		- youtube: Canais do youtube do grupo
*/

const gerenciaHandlers = {
	"info": infoGrupoHandler,
	"grupo": gerenciarGrupoHandler,
	"cmd": gerenciarCmdHandler,
	"filtros": gerenciarFiltrosHandler,
	"roleta": gerenciarRoletaHandler,
	"twitch": gerenciarTwitchHandler,
	"youtube": gerenciarYoutubeHandler
};

function getTipoMedia(tipoMensagem,isGif){
	let emojiTipoMedia, tipoMediaAdd;
	if(tipoMensagem == "chat"){
		emojiTipoMedia = "💬";
		tipoMediaAdd = "msg";
	} else
	if(tipoMensagem == "image"){
		emojiTipoMedia = "🎨";
		tipoMediaAdd = "img";
	} else
	if(tipoMensagem == "video"){
		emojiTipoMedia = "📺";
		tipoMediaAdd = "vid";
		if(isGif){
			emojiTipoMedia = "🎁";
			tipoMediaAdd = "gif";
		}
	} else
	if(tipoMensagem == "audio"){
		emojiTipoMedia = "🔉";
		tipoMediaAdd = "audio";
	} else
	if(tipoMensagem == "voice"){
		emojiTipoMedia = "🎤";
		tipoMediaAdd = "audio";
	} else
	if(tipoMensagem == "pt"){
		emojiTipoMedia = "🎤";
		tipoMediaAdd = "audio";
	}
	else if(tipoMensagem == "sticker"){
		emojiTipoMedia = "🖼";
		tipoMediaAdd = "sticker";
		
	}
	else if(tipoMensagem == "document"){
		emojiTipoMedia = "📄";
		tipoMediaAdd = "document";		
	}

	return {tipo: tipoMediaAdd, react: emojiTipoMedia};
}

function infoGrupoHandler(dados){
	return new Promise(async (resolve,reject) => {
		const grupo = getGrupoByNome(dados.nomeGrupo);
	});
}

function gerenciarHandler(dados){
	return new Promise(async (resolve,reject) => {
		const grupo = getGrupoByNome(dados.nomeGrupo);
		if(!grupo){
			resolve([{msg: "Seu grupo ainda não foi cadastrado e não pode ser gerenciado.\n\n!cadastrar nomeDoGrupo", reply: true, react: "⚠️"}]);
		} else {
			const args = dados.cleanMessageText.split(" ");
			const [x, categoria, item] = args.shift().split("-"); // ["!gerenciar","categoria", "item"]

			loggerInfo(`[gerenciarHandler] ${categoria}.${item}`);

			if(gerenciaHandlers[categoria]){
				//loggerInfo(`[gerenciarHandler] ${dados.nomeGrupo} -> ${JSON.stringify(grupo)}`);
				gerenciaHandlers[categoria](item, args, grupo, dados).then(resolve);
			} else {
				resolve([{msg: "Comando de gerência não encontrado.", reply: true, react: "🤔"}]);
			}
		}
	});
}

function gerenciarGrupoHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarGrupoHandler] ${item} -> ${JSON.stringify(args)}`);
	});
}

function gerenciarCmdHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarCmdHandler] ${item} -> ${JSON.stringify(args)}`);
	});
}

function gerenciarFiltrosHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarFiltrosHandler] ${item} -> ${JSON.stringify(args)}`);
	});
}

function gerenciarRoletaHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarRoletaHandler] ${item} -> ${JSON.stringify(args)}`);
	});
}

function gerenciarTwitchHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarTwitchHandler] ${item} -> ${JSON.stringify(args)}`);

		if(!grupo.twitch){
			// Sem canal definido
			if(item == "canal"){ // mas estão tentando definir! Cria novo objeto com valores padrões
				grupo.twitch = {
					"canal": args[0],
					"canaisZap": [grupo.numero],
					"tituloLiveOn": false,
					"tituloLiveOff": false,
					"msgOn": true,
					"imgOn": false,
					"gifOn": false,
					"audioOn": false,
					"vidOn": false,
					"imgOff": false,
					"gifOff": false,
					"audioOff": false,
					"msgOff": false,
					"vidOff": false,
					"stickerOff": false,
					"publico": false
	      		}

	      		saveDbGeral();
	      		loggerInfo(`[gerenciarTwitchHandler]${debugHeader} Criado canal da twitch '${args[0]}'!`);
	      		resolve([{msg: `[${grupo.nome}] O canal *${args[0]}* foi definido para este grupo!`, reply: true, react: "👍"}]);
			} else {
				loggerInfo(`[gerenciarTwitchHandler]${debugHeader} Tentou alterar '${item}' mas o canal ainda não foi definido.`);
				resolve([{msg: `[${grupo.nome}] Este grupo ainda não possui um canal da twitch definido.`, reply: true, react: "👎"}]);
			}
		} else {
			const debugHeader = `[${item}][${grupo.nome}@${grupo.twitch.canal}]`;

			let guardarAlteracoes = false;
			let valorAnterior = "Nenhum";
			let novoValor = "";
			let msgErro = false;
			let aguardarPromise = false; // Mensagens com mídia demoram a ser processadas

			if(item === "marcar"){
				if(grupo.opts.marcarTodosTwitch){
					valorAnterior = "Sim";
					novoValor = "Não";
				} else {
					valorAnterior = "Não";
					novoValor = "Sim";
				}

				item = "Marcar Todos do Grupo (Twitch)";
				grupo.opts.marcarTodosTwitch = !grupo.opts.marcarTodosTwitch;
				guardarAlteracoes = true;
			} else
			if(item === "mudartitulo"){
				if(grupo.opts.mudarTituloGrupoByTwitch){
					valorAnterior = "Sim";
					novoValor = "Não";
				} else {
					valorAnterior = "Não";
					novoValor = "Sim";
				}

				item = "Mudar Título do Grupo (Twitch)";
				grupo.opts.mudarTituloGrupoByTwitch = !grupo.opts.mudarTituloGrupoByTwitch;
				guardarAlteracoes = true;
			} else
			if(item === "canal"){
				valorAnterior = grupo.twitch.canal;
				novoValor = args[0];
				grupo.twitch.canal = args[0];
				guardarAlteracoes = true;
			} else
			if(item === "titulo_on"){
				valorAnterior = grupo.twitch.tituloLiveOn;
				grupo.twitch.tituloLiveOn = dados.msg.body.split(" ").slice(1).join(" ").trim();

				if(grupo.twitch.tituloLiveOn.length < 1){
					grupo.twitch.tituloLiveOn = false;
					novoValor = "Nenhum";
				} else {
					novoValor = grupo.twitch.tituloLiveOn;
				}

				guardarAlteracoes = true;
			} else
			if(item === "titulo_off"){
				valorAnterior = grupo.twitch.tituloLiveOff;
				grupo.twitch.tituloLiveOff = dados.msg.body.split(" ").slice(1).join(" ").trim();

				if(grupo.twitch.tituloLiveOff.length < 1){
					grupo.twitch.tituloLiveOff = false;
					novoValor = "Nenhum";
				} else {
					novoValor = grupo.twitch.tituloLiveOff;
				}
				guardarAlteracoes = true;
			} else
			if(item === "visibilidade"){
				if(grupo.twitch.publico){
					valorAnterior = "Visível";
					novoValor = "Oculto";
				} else {
					valorAnterior = "Oculto";
					novoValor = "Visível";
				}
				grupo.twitch.publico = !grupo.twitch.publico;
				guardarAlteracoes = true;
			} else
			if(item.startsWith("media_o")  || item.startsWith("midia_o")){
				const tipoMomento = item.includes("off") ? "Off" : "On";

				// Aqui pode ser texto, img, gif, sticker...
				loggerInfo(`[gerenciarTwitchHandler]${debugHeader} hasQuotedMsg? ${dados.msg.hasQuotedMsg}`);
				if(dados.msg.hasQuotedMsg){
					loggerInfo(`[gerenciarTwitchHandler]${debugHeader} hasMedia? ${dados.quotedMsg.hasMedia}`);
					if(dados.quotedMsg.hasMedia){
						aguardarPromise = true;
						// Se tem mídia, baixa
						const tipoMediaTwitch = getTipoMedia(dados.quotedMsg.type.toLowerCase(), dados.quotedMsg.isGif);

						loggerInfo(`[gerenciarTwitchHandler][${item}] Recebido: ${tipoMediaTwitch.tipo}, baixando...`);
						reagirMsg(dados.msg, "⏳");
						dados.quotedMsg.downloadMedia().then(attachmentData => {
							// Baixa e salva o arquivo
							const buff = Buffer.from(attachmentData.data, "base64");
							const arquivoMidia = path.join(configs.rootFolder, "media",`twitch_${grupo.nome}_${grupo.twitch.canal}_${tipoMediaTwitch.tipo}.${mime.extension(attachmentData.mimetype)}`);

							fsp.writeFile(arquivoMidia, buff).then((res) => {
								loggerInfo(`[gerenciarTwitchHandler]${debugHeader} ${tipoMediaTwitch.tipo}: ${arquivoMidia}`);
								grupo.twitch[`${tipoMediaTwitch.tipo}${tipoMomento}`] = arquivoMidia;
								saveDbGeral();
								resolve([{msg: `[${grupo.nome}] *${item}* recebido e definido como ${tipoMediaTwitch.tipo}${tipoMomento}!`, reply: true, react: tipoMediaTwitch.react}]);
							}).catch(e => {
								throw(e);
							});
						}).catch(e => {
							loggerWarn(`[gerenciarTwitchHandler]${debugHeader} '${item}' não foi possível baixar mídia de quotedMsg.\n${e}`);
							console.warn(e);
							resolve([{msg: `[${grupo.nome}] Não consegui baixar este arquivo pra definir como *${item}*. Tente enviar novamente!`, reply: true, react: "👎"}]);
						});
					} else {
						// Se não tem , é msgOn ou msgOff
						grupo.twitch[`msg${tipoMomento}`] = dados.quotedMsg.body;
						loggerInfo(`[gerenciarTwitchHandler]${debugHeader} msg${tipoMomento}: ${dados.quotedMsg.body}`);
						resolve([{msg: `[${grupo.nome}] *${item}* recebido e definido como msg${tipoMomento}:\n\n${dados.quotedMsg.body}`, reply: true, react: "💬"}]);
						guardarAlteracoes = true;
					}
				} else {
					guardarAlteracoes = false; // Não precisa
					loggerInfo(`[gerenciarTwitchHandler]${debugHeader} Não marcou mensagem com mídia.`);
					msgErro = `[${grupo.nome}] Para definir uma mídia é necessário responder à mensagem desejada.`;
				}
			} else 
			if(item.startsWith("media")  || item.startsWith("midia")){
				msgErro = `[${grupo.nome}] Você deve informar ser é uma mídia On ou Off!\n*Uso:* Responda a mensagem do conteúdo com:\n!gerenciar-twitch-media_on\nou\n!gerenciar-twitch-media_off`;
			} else
			if(item.startsWith("del")){
				// Deletar vem no argumento
				// !gerenciar-twitch-del msgoff /  !gerenciar-twitch-del vidon
				const obj = args[0];

				if(grupo.twitch[obj]){
					grupo.twitch[obj] = false;

					valorAnterior = obj;
					novoValor = "- Nada -";

					loggerInfo(`[gerenciarTwitchHandler]${debugHeader} Removido: ${obj}`);
					item = `${obj} (Removido)`; // apenas pra ficar bonito na msg de resposta
					guardarAlteracoes = true;
				} else {
					loggerInfo(`[gerenciarTwitchHandler]${debugHeader} Está tentando deletar algo estranho: ${obj}`);
					msgErro = `[${grupo.nome}] '${obj}' não é uma propriedade válida.\n*Uso*: !gerenciar-twitch-del propriedade\n\n*Valores possíveis:*\nmsgOn, imgOn, gifOn, audioOn, vidOn, imgOff, gifOff, audioOff, msgOff, vidOff e stickerOff`;
				}

			}

			if(!aguardarPromise){
				if(guardarAlteracoes){
					loggerInfo(`[gerenciarTwitchHandler]${debugHeader} Alterado '${item}': ${valorAnterior} -> ${novoValor}`);
					resolve([{msg: `[${grupo.nome}] *${item}* era _'${valorAnterior}'_ e agora é _'${novoValor}'_!`, reply: true, react: "👍"}]);
					saveDbGeral();
				} else {
					loggerInfo(`[gerenciarTwitchHandler]${debugHeader} '${item}' não existe.`);

					msgErro = msgErro ? msgErro : `[${grupo.nome}] *${item}* não é uma propriedade válida a ser definida!`;
					resolve([{msg: msgErro, reply: true, react: "👎"}]);
				}
			}
		}
	});
}

function gerenciarYoutubeHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarYoutubeHandler] ${item} -> ${JSON.stringify(args)}`);

	});
}

/*

// Debug
updateDbs().then(()=>{
	gerenciarHandler({
		nomeGrupo: "legidonlog",
		cleanMessageText: "!gerenciar-twitch-media_on [on] mutiz",
		msg: {
			body: "!gerenciar-twitch-titulo_on [ON] MUTiZZzZ"
		}
	}).then(console.log);
});
*/

module.exports = { gerenciarHandler }