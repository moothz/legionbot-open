function filtrarMsg(dados){
	return new Promise(async (resolve,reject) => {
		let apagar = false;
		
		if(apagar){
			await dados.msg.delete(true);
		}

		resolve(dados);
	});
}

function ignorarMsg(dados){
	return new Promise(async (resolve,reject) => {
		let ignorar = false;
		let motivo;

		if(ignorar){
			resolve(dados);
		} else {
			reject(`[ignorarMsg] ${motivo}`);
		}
	});
}

module.exports = { ignorarMsg, filtrarMsg };