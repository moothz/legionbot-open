const { loggerInfo, loggerWarn } = require("./logger");
const configs = require("./configs");
const path = require('node:path');
const fsp = require('fs').promises;
const { nomeRandom } = require("./auxiliares");
const { reagirMsg } = require("./wrappers-bot");

const arquivoDados = path.join(configs.rootFolder,"db","dados.json");
const arquivoFrases = path.join(configs.rootFolder,"db","frases-zap.json");

let dbFrases = {
	"frases": []
};

let dbGeral = {
	"pvBot_grupoCustom": {},
	"grupos": [],
	"listaIgnoreMentions": []
};

function cadastrarHandler(dados){
	return new Promise(async (resolve,reject) => {
		reagirMsg(dados.msg, "⏳");

		if(dados.nomeGrupo == "generico"){
			const msg = dados.cleanMessageText;
			// !cadastrar nome do grupo
			const st = msg.indexOf(' ');

			let nomeEscolhido;
			if(st < 1){ // Não informou nome pro grupo, pega o titulo do grupo
				nomeEscolhido = dados.chat.name;
			}	else {
				// Pega tudo depois do primeiro espaço
				nomeEscolhido = msg.substring(st + 1);
			}

			// Remove todos os whitespace e caracteres especiais, só deixa letra e número.
			nomeEscolhido = nomeEscolhido.replace(/(\||[^a-z0-9_\-]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/gi, '');

			while(getGrupoByNome(nomeEscolhido)){
				const novoNome = `${nomeEscolhido}_${nomeRandom()}`;
				loggerInfo(`[handlerCadastrar] '${nomeEscolhido}' já existe, gerando novo -> '${novoNome}'`);

				nomeEscolhido = novoNome;
			}

			// Criar novo
			const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
			const dataCriacao = (new Date(Date.now() - tzoffset)).toISOString().replace(/T/, ' ').replace(/\..+/, '');

			const novoGrupo = {
				"nome": nomeEscolhido,
				"numero": dados.chat.groupMetadata.id._serialized,
				"dataCriacao": dataCriacao,
				"comandosMutados": [],
				"opts": {
					"incluirGenericos": true,
					"incluirNSFW": true,
					"gptAutoReply": true,
					"marcarTodosYoutube": true,
					"marcarTodosTwitch": true,
					"mudarTituloGrupoByTwitch": true,
					"grupoPermiteLembretePraTodos": true,
					"msgBoasVindas": false,
					"tempoForaRoleta": 300000,
					"autostt": false,
					"sttKey": false
				},
				"twitch": false,
				"gpt": {
					"permiteImg": false,
					"maxTokens": 500,
					"tempoCooldownUser": 90000,
					"img_tempoCooldownUser": 180000,
					"tempoCooldownGrupo": 60000,
					"img_tempoCooldownGrupo": 300000,
					"blocked": []
				}
			};

			dbGeral.grupos.push(novoGrupo);
			saveDbGeral();

			resolve([{msg: `🤖 ${dados.nomeAutor}, este grupo foi cadastrado como _'${nomeEscolhido}'_!\nOs administradores podem gerenciá-lo aqui ou no PV do bot enviando:\n\n!gerenciar-grupo ${nomeEscolhido}`, react: "✍️"}]);
		} else {
			resolve([{msg: `🤖 ${dados.nomeAutor}, este grupo já está cadastrado como _'${dados.nomeGrupo}'_!\nOs administradores podem gerenciá-lo aqui ou no PV do bot enviando:\n\n!gerenciar-grupo ${dados.nomeGrupo}`, react: "🤔"}]);
		}
	});
}

function getGroupNameByNumeroGrupo(numero){
	if(numero.includes("@g")){
		const resultado = dbGeral.grupos.filter(g => g.numero === numero);
		return resultado[0]?.nome ?? "generico";
	} else {
		return "pvdobot";
	}
}

function getGrupoByNumero(numero){
	const resultado = dbGeral.grupos.filter(g => g.numero === numero);
	return resultado[0] ?? null;
}

function getGrupoByNome(nomeGrupo){
	const resultado = dbGeral.grupos.filter(g => g.nome === nomeGrupo);
	return resultado[0] ?? null;
}

function isSuperAdmin(numero){
	return configs.superAdmins.some(sA => numero.includes(sA)); // 'numero' pode ser o id completo: 555599887766@c.us
}

function updateDbs(){
	return new Promise(async (resolve,reject) => {
		// Frases
		let data = "";

		fsp.readFile(arquivoFrases, "utf8").then(function (data) {
			dbFrases = JSON.parse(data);
			loggerInfo(`[DB] Atualizada DB de frases.`);
		}).catch(function (error) {
			loggerWarn(`[updateDbs] ERRO GRAVÍSSIMO: Não consegui ler arquivo ${arquivoFrases}: ${error}`);
			reject();
		});

		fsp.readFile(arquivoDados, "utf8").then(function (data) {
			dbGeral = JSON.parse(data);
			loggerInfo(`[DB] Atualizada DB Geral.`); // ${JSON.stringify(dbGeral)}
			resolve();
		}).catch(function (error) {
			loggerWarn(`[updateDbs] ERRO GRAVÍSSIMO: Não consegui ler arquivo ${arquivoDados}: ${error}`);
			reject();
		});
	});

}

function getDbGeral(){
	return dbGeral;
}

function saveDbGeral(){
	let data = JSON.stringify(dbGeral, null, 2);
	fsp.writeFile(arquivoDados, data).then((res) => {
		loggerInfo("[db] Gravadas alterações db geral.");
	}).catch(e => {
		loggerWarn(`[updateDbs] ERRO GRAVÍSSIMO: Não consegui gravar arquivo ${arquivoDados}`);
	});
}

function saveDbFrases(){
	let data = JSON.stringify(dbFrases, null, 2);
	fsp.writeFile(arquivoFrases, data).then((res) => {
		loggerInfo("[db] Gravadas alterações db frases.");
	}).catch(e => {
		loggerWarn(`[updateDbs] ERRO GRAVÍSSIMO: Não consegui gravar arquivo ${arquivoDados}`);
	});
}


function getAllStreams(){
	return [];
}

module.exports = { 
	updateDbs,
	getDbGeral,
	saveDbGeral,
	saveDbFrases,
	getGrupoByNome,
	getGroupNameByNumeroGrupo, 
	isSuperAdmin,
	cadastrarHandler,
	getAllStreams
}