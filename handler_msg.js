const { loggerInfo, loggerWarn } = require("./logger");
const { filtrarMsg, ignorarMsg } = require("./filtros");
const { stickersHandler, stickersBgHandler } =  require("./stickers");
const { removebgHandler } = require("./imagens")
const { getGroupNameByNumeroGrupo, isSuperAdmin } = require("./db");
const { isUserAdmin } = require("./auxiliares");
const { handlerComandosNormais } = require("./comandosNormais");
const { dispatchMessages, reagirMsg, removerPessoasGrupo, adicionarPessoasGrupo, tornarPessoasAdmin, setWrapperClient, deletaMsgs } = require("./wrappers-bot");

/* Aqui é onde os comandos fixos interpretados pelo bot serão definidos
	
	Cada comando possui propriedades que serão testadas pra saber em quais
	mensagens o comando será ativado. Quando ativado, o código irá chamar o handler informado,
	o qual deve retornar uma promise com um arrayde mensagens a serem enviadas:

	[{
		msg: String ou Objeto MessageMedia -> Mensagem a ser enviada
		isSticker: bool -> Enviar a MessageMedia como sticker
		isGif: bool -> Enviar a MessageMedia como gif
		isAudio: bool -> Enviar a MessageMedia como voice
		isFile:  bool -> Enviar a MessageMedia como arquivo
		replyCustomMsg: string -> id da mensagem para usar como reply
		reply: bool -> Usar reply ou não (enviar msg solta)
		legenda: String -> Legenda para Fotos, vídeos e GIFs
		marcarPessoas: Array de Contact de pessoas que serão marcadas
		react: String -> False ou Emoji para reagir a mensagem que originou o comando
	}, ...]

	Este array é enviado ao dispatchMessages, o qual analisa os dados e envia a mensagem de forma correta,
	implementando também um delay pra evitar resposta instantâneas, se desejado.


	Sinta-se a vontade para criar nos handlers e colocar aqui!
*/

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
	}
];

// Deu, chega! A partir daqui não é necessário editar o código mais! (Mas também, sinta-se livre se quiser)

function extrairDados(msg){
	/*
		O jeito que as coisas vem no objeto msg é simplesmente um caos,
		muitas vezes faltam dados ou vem coisa estranha, por isso foi feito esse wrapper
	*/
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
		const handler = handlers.filter(
			h => 	((h.adminOnly ? dados.admin : true)) && // Apenas para admin?
					((h.superAdminOnly ? dados.superAdmin : true)) && // Apenas para Super admin?
					((h.needsMedia ? msg.hasMedia : true)) && // Comando só pode ser executado em mensagens que contém mídia nela mesma?
					(
						(h.startStrings.length > 0 ? h.startStrings.some(hs => dados.cleanMessageText.startsWith(hs)) : true) && // Começa com
						(h.endStrings.length > 0 ? h.endStrings.some(hs => dados.cleanMessageText.endsWith(hs)) : true) && // Termina com
						(h.containString.length > 0 ? h.containString.some(hs => dados.cleanMessageText.includes(hs)) : true) // Tem essa palavra em algum lugar
					)
		)[0]?.handler ?? handlerComandosNormais; // Se nenhum Handler pré-definido foi encontrado, joga pro comandos normais

		//loggerInfo(`[messageHandler] Handler? ${handler}`);
		handler(dados).then(retorno => {
			dispatchMessages(dados, retorno);
		});
	});

	/*
	Desabilitado no desenvolvimento, pra forçar o bot a fechar e descobrir mais fácil alguns erros
	.catch(e => {
		loggerWarn(`[messageHandler] Erro: ${e}`);
	});*/
}

module.exports = { messageHandler }