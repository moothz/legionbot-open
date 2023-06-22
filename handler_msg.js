
/*
	isSuperAdmin, isUserAdmin, getGroupNameByNumeroGrupo
*/

const { filtrarMsg, ignorarMsg } = require("./filtros");
const { stickersHandler } =  require("./stickers");

const handlers = [
{
	startStrings: ["!"],
	containString: ["sticker","stiker","figurinha"],
	handler: stickersHandler,
	adminOnly: false,
	superAdminOnly: false
}
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
				mentions: await msg.getMentions() ?? [],
				cleanMessageText: msg.body.toLowerCase().trim() ?? "",
				superAdmin: isSuperAdmin(numeroAutor)
			}

			// Dados que dependem de promises/async
			dados.admin = isUserAdmin(dados.numeroAutor,chat);

			// Adiciona quem está em resposta na lista de mencionados
			if(dados.quotedMsg){
				dados.mentions.push(await client.getContactById(dados.quotedMsg.author))
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

	extrairDados
	.then(ignorarMsg)
	.then(dados => {
		loggerInfo(`[messageHandler] Dados Extraídos:`, dados);

		//////////////////////////////////////////////////////
		// Handlers de Comandos
		//////////////////////////////////////////////////////
		// Pra encontrar um handler, precisa OU ter alguma das mensagens no inicio OU conter alguma das palavras
		// Alguns comandos só podem ser utilizados por administradores ou super administradores (hard-coded)
		const handler = handlers.filter(
			h => 	((h.adminOnly ? dados.admin : true)) &&
					((h.superAdminOnly ? dados.superAdmin : true)) &&
					h.startStrings.some(hs => dados.cleanMessageText.startsWith(hs)) ||
					h.containString.some(hs => dados.cleanMessageText.includes(hs))
		)[0]?.handler ?? handlerComandosNormais; // Se nenhum Handler pré-definido foi encontrado, testa comandos normais

		handler(dados).then(retorno => {
			// dispatch messages
		});
	}).catch(e => {
		loggerWarn(`[messageHandler] Erro: ${e}`);
	});
}