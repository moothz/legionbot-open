const { loggerInfo, loggerWarn } = require("./logger");
const configs = require("./configs");
const path = require('node:path');
const fsp = require('fs').promises;

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

function getGroupNameByNumeroGrupo(numero){
	if(numero.includes("@g")){
		const resultado = dbGeral.grupos.filter(g => g.numero === numero);
		return resultado[0]?.nome ?? "generico";
	} else {
		return "pvdobot";
	}
}

function getGrupoByNome(nomeGrupo){
	const resultado = dbGeral.grupos.filter(g => g.nome === nomeGrupo);
	return resultado[0] ?? null;
}

function isSuperAdmin(numero){
	return configs.superAdmins.some(sA => numero.includes(sA)); // 'numero' pode ser o id completo: 555599887766@c.us
}

function updateDbs(callback){
	// Frases
	let data = "";

	fsp.readFile(arquivoFrases, "utf8").then(function (data) {
		dbFrases = JSON.parse(data);
		loggerInfo(`[DB] Atualizada DB de frases.`);
	}).catch(function (error) {
		loggerWarn(`[updateDbs] ERRO GRAVÍSSIMO: Não consegui ler arquivo ${arquivoFrases}: ${error}`);
	});

	fsp.readFile(arquivoDados, "utf8").then(function (data) {
		dbGeral = JSON.parse(data);
		loggerInfo(`[DB] Atualizada DB Geral.`); // ${JSON.stringify(dbGeral)}
	}).catch(function (error) {
		loggerWarn(`[updateDbs] ERRO GRAVÍSSIMO: Não consegui ler arquivo ${arquivoDados}: ${error}`);
	});

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


module.exports = { 
	updateDbs,
	saveDbGeral,
	saveDbFrases,
	getGroupNameByNumeroGrupo, 
	isSuperAdmin 
}