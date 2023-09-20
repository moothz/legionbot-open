const { loggerInfo, loggerWarn } = require("./logger");
const { dispatchMessages, reagirMsg, removerPessoasGrupo, adicionarPessoasGrupo, tornarPessoasAdmin, setWrapperClient, deletaMsgs, isUserAdminInChat } = require("./wrappers-bot");
const { filtrarMsg, ignorarMsg } = require("./filtros");
const { getGroupNameByNumeroGrupo, isSuperAdmin, cadastrarHandler } = require("./db");

// Handlers de comandos
const { handlerComandosNormais } = require("./cmd_comandosNormais");
const { stickersHandler, stickersBgHandler } =	require("./cmd_stickers");
const { chamarAtencaoHandler } = require("./cmd_atencao");
const { removebgHandler } = require("./cmd_imagens");
const { gerenciarHandler } = require("./cmd_gerencia");

/* Aqui é onde os comandos fixos interpretados pelo bot serão definidos
	
	Cada comando possui propriedades que serão testadas pra saber em quais
	mensagens o comando será ativado. Quando ativado, o código irá chamar o handler informado,
	o qual deve retornar uma promise com um arrayde mensagens a serem enviadas:

	[{
		msg: String ou Objeto MessageMedia -> Mensagem a ser enviada
		isSticker: bool -> Enviar a MessageMedia como sticker
		isGif: bool -> Enviar a MessageMedia como gif
		isAudio: bool -> Enviar a MessageMedia como voice
		isFile:	bool -> Enviar a MessageMedia como arquivo
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
		containStrings: ["exemplo","example"], // Comando precisa conter alguma dessas palavras
		endStrings: [], // Comando precisa TERMINAR com alguma dessas strings
		handler: false, // Função que será chamada para processar os dados
		needsMedia: false, // Precisa vir mídia NA MENSAGEM que tem o comando
		needsQuote: false, // Precisa ter alguma mensagem marcada
		apenasTextoCompleto: false, // Se true, a mensagem precisa ser EXATAMENTE igual ao comando, se não, precisa apenas conter
		apenasPalavaInteira: true, // Se true, apenas considera palavra inteira, por exemplo, se true, o comando !s não ativaria com !super
		apenasInicio: true, // Se true, só considera que o comando estiver no começo da mensagem
		adminOnly: false, // Comando é apenas para administradores do grupo?
		superAdminOnly: false // Comando é apenas para SUPER administradores? (definidos no configs.js)
	},

	// Administração
	{
		startStrings: ["!gerenciar-","!g-"],
		containStrings: ["info", "grupo-","cmd-","filtros-","roleta-","twitch-","youtube-"],
		endStrings: [],
		handler: gerenciarHandler,
		needsMedia: false,
		needsQuote: false,
		apenasTextoCompleto: false,
		apenasPalavaInteira: false,
		apenasInicio: true,
		adminOnly: true,
		superAdminOnly: false
	},
	{
		startStrings: ["!"],
		containStrings: ["cadastrar"],
		endStrings: [],
		handler: cadastrarHandler,
		needsMedia: false,
		needsQuote: false,
		apenasTextoCompleto: false,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: true,
		superAdminOnly: false
	},

	// Atenção
	{
		startStrings: ["!"],
		containStrings: ["atencao","atenção"],
		endStrings: [],
		handler: chamarAtencaoHandler,
		needsMedia: false,
		needsQuote: false,
		apenasTextoCompleto: false,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: true,
		superAdminOnly: false
	},

	// Figurinhas
	{
		startStrings: ["!"],
		containStrings: ["s", "stk", "sticker","stiker", "stricker","figurinha"],
		endStrings: ["bg"],
		handler: stickersBgHandler,
		needsMedia: false,
		needsQuote: false,
		apenasTextoCompleto: true,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: ["!"],
		containStrings: ["s", "stk", "sticker","stiker", "stricker","figurinha"],
		endStrings: [],
		handler: stickersHandler,
		needsMedia: false,
		needsQuote: false,
		apenasTextoCompleto: true,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: [],
		containStrings: ["!sbg", "!stbg", "!stkbg", "stickerbg", "strickerbg", "stikerbg","figurinhabg"],
		endStrings: [],
		handler: stickersBgHandler,
		needsMedia: true,
		needsQuote: false,
		apenasTextoCompleto: true,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: [],
		containStrings: ["!s", "!st", "!stk", "sticker", "stricker", "stiker", "figurinha"],
		endStrings: [],
		handler: stickersHandler,
		needsMedia: true,
		needsQuote: false,
		apenasTextoCompleto: true,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: false,
		superAdminOnly: false
	},

	// Manipulação de imagens
	{
		startStrings: ["!"],
		containStrings: ["rembg","removebg"],
		endStrings: [],
		handler: removebgHandler,
		needsMedia: false,
		needsQuote: false,
		apenasTextoCompleto: false,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: false,
		superAdminOnly: false
	},
	{
		startStrings: [],
		containStrings: ["rembg","removebg","removefundo"],
		endStrings: [],
		handler: removebgHandler,
		needsMedia: true,
		needsQuote: false,
		apenasTextoCompleto: false,
		apenasPalavaInteira: true,
		apenasInicio: true,
		adminOnly: false,
		superAdminOnly: false
	}
];

// Deu, chega! A partir daqui não é necessário editar o código mais! (Mas também, sinta-se livre se quiser)
function gerarPossiveisComandos(handler) {
	let { startStrings, endStrings, containStrings } = handler;
	const combinations = [];

	startStrings = startStrings.length == 0 ? [""] : startStrings;
	containStrings = containStrings.length == 0 ? [""] : containStrings;
	endStrings = endStrings.length == 0 ? [""] : endStrings;

	startStrings.forEach((start) => {
		containStrings.forEach((contain) => {
			endStrings.forEach((end) => {
				const combination = start + contain + end;
				combinations.push(combination);
			});
		});
	});

	return combinations;
}

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
				nomeGrupo: getGroupNameByNumeroGrupo(msg.from),
				idGrupo: msg.from.includes("@g") ? msg.from : false,
				nomeAutor: msg._data.notifyName ?? "pessoa",
				numeroAutor: msg.author ?? "55????????@c.us",
				contatoAutor: await msg.getContact(),
				mentions: await msg.getMentions() ?? [],
				cleanMessageText: msg.body.toLowerCase().trim().replace("! ", "!") ?? ""
			}

			// Dados que dependem de promises/async
			dados.admin = isUserAdminInChat(dados.contatoAutor, dados.chat);
			dados.superAdmin = isSuperAdmin(dados.numeroAutor);

			// Adiciona quem está em resposta na lista de mencionados
			if(dados.quotedMsg){
				dados.mentions.unshift(await dados.quotedMsg.getContact());
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
		//loggerInfo(`[messageHandler] Dados Extraídos:\n${JSON.stringify(dados,null,"\t")}`);

		//////////////////////////////////////////////////////
		// Handlers de Comandos
		//////////////////////////////////////////////////////
		const handler = handlers.filter(
			h => { 	
				const vereditoAdm = ((h.adminOnly ? dados.admin : true)); // Apenas para admin?
				const vereditoSuperAdm = ((h.superAdminOnly ? dados.superAdmin : true)); // Apenas para Super admin?
				const vereditoMedia = ((h.needsMedia ? msg.hasMedia : true)); // Comando só pode ser executado em mensagens que contém mídia nela mesma?
				const vereditoQuote = ((h.needsQuote ? msg.hasQuotedMsg : true)); // Comando só pode ser executado em mensagens que contém um quote (msg em resposta)
				
				const comandosPossiveis = gerarPossiveisComandos(h);
				let vereditoStrings = false;

				if(h.apenasTextoCompleto){
					// Apenas se o comando for exatamente igual a mensagem que a pessoa enviou
					vereditoStrings = comandosPossiveis.some(cmd => dados.cleanMessageText === cmd);
				} else {
					if(h.apenasInicio){
						if(h.apenasPalavaInteira){ // Apenas se COMEÇA com alguma das strings INTEIRA
							vereditoStrings = comandosPossiveis.some(cmd => dados.cleanMessageText.split(" ")[0] == cmd);
						} else { // Apenas se COMEÇA com alguma das strings
							vereditoStrings = comandosPossiveis.some(cmd => dados.cleanMessageText.startsWith(cmd));
						}
					} else {
						// Não precisa ser no começo, se tiver algo no meio da mensagem, ok
						vereditoStrings = comandosPossiveis.some(cmd => dados.cleanMessageText.includes(cmd));
					}
				}

				const vereditoFinal = vereditoAdm && vereditoSuperAdm && vereditoMedia && vereditoQuote && vereditoStrings;

				return vereditoFinal;
			}
		)[0]?.handler ?? handlerComandosNormais; // Se nenhum Handler pré-definido foi encontrado, joga pro comandos normais

		handler(dados).then(retorno => {
			//loggerInfo(`[messageHandler] retorno:\n${JSON.stringify(retorno,null,"\t")}`);

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