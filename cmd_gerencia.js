const { loggerInfo, loggerWarn } = require("./logger");
const { getDbGeral, saveDbGeral, getGrupoByNome, updateDbs } = require("./db");

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
				
				loggerInfo(`[gerenciarHandler] ${dados.nomeGrupo} -> ${JSON.stringify(grupo)}`);
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
	      		loggerInfo(`[gerenciarTwitchHandler][${grupo.nome}] Criado canal da twitch '${args[0]}'!`);
	      		resolve([{msg: `[${grupo.nome}] O canal *${args[0]}* foi definido para este grupo!`, reply: true, react: "👍"}]);
			} else {
				loggerInfo(`[gerenciarTwitchHandler][${grupo.nome}] Tentou alterar '${item}' mas o canal ainda não foi definido.`);
				resolve([{msg: `[${grupo.nome}] Este grupo ainda não possui um canal da twitch definido.`, reply: true, react: "👎"}]);
			}
		} else {
			let guardarAlteracoes = true;
			let valorAnterior = "Nenhum";
			let novoValor = "";
			let msgErro = false;

			if(item === "canal"){
				valorAnterior = grupo.twitch.canal;
				novoValor = args[0];
				grupo.twitch.canal = args[0];
			} else
			if(item === "titulo_on"){
				valorAnterior = grupo.twitch.tituloLiveOn;
				grupo.twitch.tituloLiveOn = dados.msg.body.split(" ").slice(1).join(" ").trim();
				novoValor = grupo.twitch.tituloLiveOn;
			} else
			if(item === "titulo_off"){
				valorAnterior = grupo.twitch.tituloLiveOff;
				grupo.twitch.tituloLiveOff = dados.msg.body.split(" ").slice(1).join(" ").trim();
				novoValor = grupo.twitch.tituloLiveOff;
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
			} else
			if(item === "media_on" || item === "midia_on"){
				// Aqui pode ser texto, img, gif, sticker...
				if(dados.msg.hasQuotedMsg){

				} else {
					guardarAlteracoes = false; // Não precisa
					msgErro = `[${grupo.nome}] Para definir uma mídia é necessário responder à mensagem desejada.`;
				}
			}
			else {
				guardarAlteracoes = false;
			}

			if(guardarAlteracoes){
				loggerInfo(`[gerenciarTwitchHandler][${grupo.nome}] Alterado '${item}': ${valorAnterior} -> ${novoValor}`);
				resolve([{msg: `[${grupo.nome}][${args[0]}] *${item}* era _'${valorAnterior}'_ e agora é _'${novoValor}'_!`, reply: true, react: "👍"}]);
				saveDbGeral();
			} else {
				loggerInfo(`[gerenciarTwitchHandler][${grupo.nome}] '${item}' não existe.`);

				msgErro = msgErro ? msgErro : `[${grupo.nome}][${args[0]}] *${item}* não é uma propriedade válida a ser definida!`;
				resolve([{msg: msgErro, reply: true, react: "👎"}]);
			}
		}
	});
}

function gerenciarYoutubeHandler(item, args, grupo, dados){
	return new Promise(async (resolve,reject) => {
		loggerInfo(`[gerenciarYoutubeHandler] ${item} -> ${JSON.stringify(args)}`);

	});
}

updateDbs().then(()=>{
	gerenciarHandler({
		nomeGrupo: "legidonlog",
		cleanMessageText: "!gerenciar-twitch-media_on [on] mutiz",
		msg: {
			body: "!gerenciar-twitch-titulo_on [ON] MUTiZZzZ"
		}
	}).then(console.log);
});

module.exports = { gerenciarHandler }