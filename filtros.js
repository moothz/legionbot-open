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

		if(dados.msg.fromMe){
			ignorar = true;
		}

		if(ignorar){
			reject(`[ignorarMsg] ${motivo}`);
		} else {
			resolve(dados);
		}
	});
}

module.exports = { ignorarMsg, filtrarMsg };