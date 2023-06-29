function filtrarMsg(dados){
	return new Promise(async (resolve,reject) => {
		let apagar = false;
		
		// Verifica se deve apagar

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

		/*
			Motivos pra ignorar uma mensagem:
				- Msg do próprio bot
				- Msg de usuário bloqueado
				- Msgs no PV fora de whitelist
		*/
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