const { loggerInfo, loggerWarn } = require("./logger");
const { filtrarMsg, ignorarMsg } = require("./filtros");
const { stickersHandler, stickersBgHandler } =  require("./stickers");
const { removebgHandler } = require("./imagens")
const { getGroupNameByNumeroGrupo, isSuperAdmin } = require("./db");
const { isUserAdmin } = require("./auxiliares");
const { handlerComandosNormais } = require("./comandosNormais");

const { dispatchMessages, reagirMsg, removerPessoasGrupo, adicionarPessoasGrupo, tornarPessoasAdmin, setWrapperClient, deletaMsgs } = require("./wrappers-bot");


const handlers = [
	{
		startStrings: ["!"], // Comando precisa COMEÇAR com alguma dessas strings
		containString: ["comandos","cmd"], // Comando precisa conter alguma dessas palavras
		endStrings: [], // Comando precisa TERMINAR com alguma dessas strings
		handler: false, // Função que será chamada para processar os dados
		needsMedia: false, // Precisa vir mídia NA MENSAGEM que tem o comando
		adminOnly: false, // Comando é apenas para administradores do grupo?
		superAdminOnly: false // Comando é apenas para SUPER administradores? (definidos no configs.js)
	},
	// Figurinhas
	{
		startStrings: ["!"],
		containString: ["s", "stk", "sticker","stiker", "stricker","figurinha"],
		endStrings: ["bg"],
		handler: stickersBgHandler,
		needsMedia: false,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: ["!"],
		containString: ["s", "stk", "sticker","stiker", "stricker","figurinha"],
		endStrings: [],
		handler: stickersHandler,
		needsMedia: false,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: [],
		containString: ["!sbg", "!stbg", "!stkbg", "stickerbg", "strickerbg", "stikerbg","figurinhabg"],
		endStrings: [],
		handler: stickersBgHandler,
		needsMedia: true,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: [],
		containString: ["!s", "!st", "!stk", "sticker", "stricker", "stiker", "figurinha"],
		endStrings: [],
		handler: stickersHandler,
		needsMedia: true,
		adminOnly: false,
		superAdminOnly: false
	},

	// Manipulação de imagens
	{
		startStrings: ["!"],
		containString: ["rembg","removebg"],
		endStrings: [],
		handler: removebgHandler,
		needsMedia: false,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: [],
		containString: ["rembg","removebg","removefundo"],
		endStrings: [],
		handler: removebgHandler,
		needsMedia: true,
		adminOnly: false,
		superAdminOnly: false
	},



]

function extrairDados(msg){
	return new Promise(async (resolve,reject) => {
		try {
			const dados = {
				msg: msg,
				quotedMsg: await msg.getQuotedMessage(),
				chat: await msg.getChat(),
				nomeGrupo: getGroupNameByNumeroGrupo(),
				numeroAutor: msg.author ?? "55????????@c.us",
				contatoAutor: await msg.getContact(),
				mentions: await msg.getMentions() ?? [],
				cleanMessageText: msg.body.toLowerCase().trim() ?? ""
			}

			// Dados que dependem de promises/async
			dados.admin = isUserAdmin(dados.numeroAutor,dados.chat);
			dados.superAdmin = isSuperAdmin(dados.numeroAutor);

			// Adiciona quem está em resposta na lista de mencionados
			if(dados.quotedMsg){
				dados.mentions.push(await dados.quotedMsg.getContact());
			}

			resolve(dados);
		} catch(e){
			reject(e);
		}
	});
}


function messageHandler(msg){
	// Ordem de execução
	/*
		1. Extrai dados comuns da mensagem
		2. Verifica se deve ser ignorada
		3. Verifica se é um comando fixo
		4. Verifica se é um comando normal/criado pelos usuários
	*/

	extrairDados(msg)
	.then(ignorarMsg)
	.then(dados => {
		//loggerInfo(`[messageHandler] Dados Extraídos:`, dados);

		//////////////////////////////////////////////////////
		// Handlers de Comandos
		//////////////////////////////////////////////////////
		// Pra encontrar um handler, precisa OU ter alguma das mensagens no inicio OU conter alguma das palavras
		// Alguns comandos só podem ser utilizados por administradores ou super administradores (hard-coded)
		const handler = handlers.filter(
			h => 	((h.adminOnly ? dados.admin : true)) &&
					((h.superAdminOnly ? dados.superAdmin : true)) &&
					((h.needsMedia ? msg.hasMedia : true)) &&
					(
						(h.startStrings.length > 0 ? h.startStrings.some(hs => dados.cleanMessageText.startsWith(hs)) : true) &&
						(h.endStrings.length > 0 ? h.endStrings.some(hs => dados.cleanMessageText.endsWith(hs)) : true) &&
						(h.containString.length > 0 ? h.containString.some(hs => dados.cleanMessageText.includes(hs)) : true)
					)
		)[0]?.handler ?? handlerComandosNormais; // Se nenhum Handler pré-definido foi encontrado, testa comandos normais

		//loggerInfo(`[messageHandler] Handler? ${handler}`);
		handler(dados).then(retorno => {
			dispatchMessages(dados, retorno);
		});
	});
	/*
	.catch(e => {
		loggerWarn(`[messageHandler] Erro: ${e}`);
	});*/
}

module.exports = { messageHandler }