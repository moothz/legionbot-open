const { loggerInfo, loggerWarn } = require("./logger");
const { getAllStreams } = require("./db");
const { Twitch } = require("@livecord/notify");


// Auxiliares
const delayLiveOff = 120000; // delay live off pra quando a pessoa tá só reiniciando
let canaisLiveOff = [];
let clientBot = undefined;

const twitchNotify = new Twitch({ 
	client: {
		id: configs.twitch.idClient,
		token: configs.twitch.access_token,
	},
	interval: 30000
});

twitchNotify.on("ready", (ready) => {
    loggerInfo(`[twitchNotify] Twitch connected at: ${ready}`);
});

twitchNotify.on("live", channel => {
	const startedAt = new Date(channel.started_at);
	const agora = new Date();

	const canalNoDelayOff = canaisLiveOff.includes(channel.user_login); // Recém fechou a live e reabriu
	const notifAtrasada = agora - startedAt > 60000; // Se passou mais de 1 minuto desde que começou, ja tava on quando o bot ligou, não envia de novo

	if(notifAtrasada || canalNoDelayOff){ 
	    loggerInfo(`[twitchNotify][IGNORADO] ${channel.user_name} tá ON! ${JSON.stringify(channel)} (delay off? ${canalNoDelayOff})\n[twitchNotify][${agora} - ${startedAt}]`);
	} else {
		loggerInfo(`[twitchNotify] ${channel.user_name} tá ON! ${JSON.stringify(channel)} (delay off? ${canalNoDelayOff})\n[twitchNotify][${agora} - ${startedAt}]`);

		canaisLiveOff = canaisLiveOff.filter(e => e !== channel.user_login); // Remove da lista de off pra não avisar pós delay

		setTimeout(async (canal,stream) =>{
			await notificaStatusStream(true, canal, stream);
		}, toAtualNotif, channel.user_login, channel);
		toAtualNotif += 1500;

		if(toAtualNotif > 15000){
			toAtualNotif = 0;
		}
	}
	
});

twitchNotify.on("offline", channel => {
    loggerInfo(`[twitchNotify] ${channel.user_name} tá OFF! ${JSON.stringify(channel)}, notificando em ${(delayLiveOff+toAtualNotif)/1000}s`);
    canaisLiveOff.push(channel.user_login);

    setTimeout(async (canal,stream) =>{
    	if(canaisLiveOff.includes(canal)){
	    	loggerInfo(`[twitchNotify] Notificando ${canal} offline (passou ${delayLiveOff/1000}s)`);
    		canaisLiveOff = canaisLiveOff.filter(e => e !== canal);
			await notificaStatusStream(false, canal, stream);
    	} else {
    		loggerInfo(`[twitchNotify] Desisti de notificar ${canal} pois ficou online de novo.`);
    	}
	}, delayLiveOff + toAtualNotif, channel.user_login, channel);
	toAtualNotif += 1500;

	if(toAtualNotif > 15000){
		toAtualNotif = 0;
	}
});

function swapRedAndGreenEmojis(text) {
	// Define a mapping of red and green emojis
	const emojiMap = {
		'🔴': '🟢',
		'🟢': '🔴',
		'❤️': '💚',
		'💚': '❤️',
		'🌹': '🍏',
		'🍏': '🌹',
		'🟥': '🟩',
		'🟩': '🟥'
	};

	// Use regular expressions to match and replace emojis
	const regex = new RegExp(Object.keys(emojiMap).join('|'), 'g');
	const replacedText = text.replace(regex, (match) => emojiMap[match]);

	return replacedText;
}

async function notificaStatusStream(status,nomeCanal,stream = false){
	const idNotif = Math.floor(Math.random() * 1000000);
	if(stream){
		loggerInfo(`[notificaStatusStream][${idNotif}[debug] ${JSON.stringify(stream,null,"\t")}`);
	}

	if(canaisLiveOff.includes(nomeCanal)){
		loggerInfo(`[notificaStatusStream] Desisti de notificar ${canal} pois ficou online de novo antes do tempo.`);
		canaisLiveOff = canaisLiveOff.filter(e => e !== canal);
	}

	/*
	stream:
		{
		    "id": "",
		    "user_id": "",
		    "user_login": "",
		    "user_name": "",
		    "game_id": "",
		    "game_name": "",
		    "type": "live",
		    "title": "",
		    "viewer_count": 0,
		    "started_at": "",
		    "language": "",
		    "thumbnail_url": "",
		    "tag_ids": [ "" ],
		    "is_mature": true
		}

		


	*/
	let gruposCanal = getGroupsByTwitchChannel(nomeCanal);
	loggerInfo(`[notificaStatusStream][${idNotif}[${status}] Canal '${nomeCanal}', ${gruposCanal.length} grupos.`);
	const client = getClient();
	let vidOff = undefined;
	let gifOff = undefined;
	let stickerOff = undefined;
	let imgOff = undefined;
	let audioOff = undefined;
	let msgOff = undefined;
	let canaisZap = undefined;
	let audioOn = undefined;
	let gifOn = undefined;
	let imgOn = undefined;
	let msgOn = undefined;
	let stickerOn = undefined;
	let vidOn = undefined;
	let msgOnGenerica = undefined;

	if(status){
		//ON	
		const tsAtual = Math.floor((new Date().getTime()) / 1000);

		for(let gp of gruposCanal){
			vidOn = false;
			gifOn = false;
			stickerOn = false;
			imgOn = false;
			audioOn = false;
			msgOn = false;
			canaisZap = false;
			loggerInfo(`[notificaStatusStream][${idNotif}[ON] Processando agora: ${gp.nome}`); // \n${JSON.stringify(gp,null,"\t")}

			let ultimoAviso = 0;
			if(gp.twitch.tsUltimoAvisoOn){
				ultimoAviso = gp.twitch.tsUltimoAvisoOn;
			}
			let minutosPassadosDesdeUltimoAviso = Math.floor(tsAtual - ultimoAviso)/60;
			if(minutosPassadosDesdeUltimoAviso >= configs.tempoEntreAvisosTwitch){
				canaisZap = gp.twitch.canaisZap;
				audioOn = gp.twitch.audioOn;
				gifOn = gp.twitch.gifOn;
				imgOn = gp.twitch.imgOn;
				msgOn = gp.twitch.msgOn;
				stickerOn = gp.twitch.stickerOn;
				vidOn = gp.twitch.vidOn;
				let grupoWhats = false;
				try{
					loggerInfo(`[notificaStatusStream][${idNotif}[ON] getChatById ${gp.twitch.canaisZap[0]}`);
					grupoWhats = await clientBot.getChatById(gp.twitch.canaisZap[0]);
					//loggerInfo(`[notificaStatusStream][${idNotif}[ON] GRUPO WHATS:\n ${JSON.stringify(grupoWhats,null,"\t")}`);
				} catch(e){
					grupoWhats = false;
				}

				if(grupoWhats){
					if(msgOn !== false && msgOn !== true && configs.enviarTwitchGrupaoZueira && !avisoLivesGrupaoHoje.includes(nomeCanal)){
						// Tem msgOn personalizado, envia no grupão tb
						//canaisZap.push(configs.idGrupaoZueira);
						avisoLivesGrupaoHoje.push(nomeCanal);
						loggerInfo(JSON.stringify(avisoLivesGrupaoHoje,null,"\t"));
					}
				
					loggerInfo(`[notificaStatusStream][${idNotif} Avisando sobre '${nomeCanal}' em '${gp.nome}' (grupos ${JSON.stringify(canaisZap)})!`);
	
					msgOnGenerica = `⚠️ ATENÇÃO!⚠️\n\n🌟 *{nomeCanal}* ✨ está _online_ streamando *{jogo}*!\n_{titulo}_\n\nhttps://twitch.tv/{nomeCanal}`;
	
					///////////////////
					// Ativar modo apenas admin
					///////////////////
					const liveOnApenasAdmin = gp.opts.liveOnApenasAdmin ?? false;
					if(liveOnApenasAdmin){
						grupoWhats.setMessagesAdminsOnly(true);
					}
					///////////////////
					// Mudar Título
					///////////////////
					let problemaMudarTitulo = "";
					if(gp.opts.mudarTituloGrupoByTwitch){
						try{
							// Mudar titulo
							let tituloGrupo = grupoWhats.name || "";
							let novoTitulo = "";
	
							if(gp.twitch.tituloLiveOn !== false){
								novoTitulo = gp.twitch.tituloLiveOn;
								loggerInfo(`[notificaStatusStream][${idNotif}[tituloON] ${gp.nome} tem titulo ON personalizado.`);
							} else {
								loggerInfo(`[notificaStatusStream][${idNotif}[tituloON] ${gp.nome} apenas inverte o titulo`);
								novoTitulo = tituloGrupo.replace("OFF","ON").replace("off","on").replace("Off","On").replace("oFf","On").replace("ofF","On").replace("OFf","On").replace("OfF","On").replace("oFF","ON");
								novoTitulo = swapRedAndGreenEmojis(novoTitulo);
							}
							
							loggerInfo(`[notificaStatusStream][${idNotif}[tituloON] '${tituloGrupo}' -> '${novoTitulo}'`);
							if(novoTitulo.length > 0){
								if(tituloGrupo != novoTitulo){
									const deuCerto = await grupoWhats.setSubject(novoTitulo);
									if(deuCerto){
										loggerInfo(`[notificaStatusStream][${idNotif}[tituloON] Alterado título do grupo ${gp.nome}.`);
									} else {
										const souAdmin = isUserAdminById(configs.meuNumero,grupoWhats) ? "Sim" : "Não";
										clientBot.sendMessage(gp.twitch.canaisZap[0],configs.msgs.ajudaTituloAdmin.replace("{resposta}", souAdmin));
										loggerInfo(`[notificaStatusStream][${idNotif}[tituloON] ERRO DE ADMIN Alterando título do grupo ${gp.nome}.`);
									}
										
									//problemaMudarTitulo = `\n_⚠️ O bot não está conseguindo mudar o título do grupo atualmente devido a uma atualização no WhatsApp._\n\n${novoTitulo}`;
								} else {
									loggerInfo("[notificaStatusStream][tituloON] Eram iguais, não mudei.");
								}
							} else {
								loggerWarn(`[notificaStatusStream][${idNotif}[tituloON] Ocorreu algum erro quando tentei alterar o titulo do grupo ${gp.nome}: \n ${JSON.stringify(gp,null,"\t")}\n${JSON.stringify(grupoWhats,null,"\t")}`);
							}
						} catch(e){
							loggerWarn(`[notificaStatusStream][${idNotif} Ocorreu algum erro quando tentei alterar o titulo do grupo ${gp.nome}: ${e}\n ${JSON.stringify(gp,null,"\t")}\n${JSON.stringify(grupoWhats,null,"\t")}`);
						}
					}
					///////////////////
					// Mídia
					///////////////////
					if(vidOn){
						loggerInfo("\t- Canal tem vidOn, enviando...");
						loggerInfo(vidOn);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								const media = await MessageMedia.fromFilePath(vidOn.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"video/mp4");
								if(media){
									clientBot.sendMessage(numeroCanal,media);
									logMensagemEnviada("sendMessage",media,{},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
					if(gifOn){
						loggerInfo("\t- Canal tem gifOn, enviando...");
						loggerInfo(gifOn);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							//clientBot.sendMessage(message.from,`[tentei enviar gif/vid da live on mas o zapzap está bloqueando temporariamente]`).then(enviaMsgOk).catch(enviaMsgErro);
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${gifOn} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(gifOn.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"image/gif");
								if(media){
									clientBot.sendMessage(numeroCanal,media,{sendVideoAsGif: true});
									logMensagemEnviada("sendMessage",media,{sendVideoAsGif: true},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
					if(stickerOn){
						loggerInfo("\t- Canal tem stickerOn, enviando...");
						loggerInfo(stickerOn);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							//clientBot.sendMessage(message.from,`[tentei enviar gif/vid da live on mas o zapzap está bloqueando temporariamente]`).then(enviaMsgOk).catch(enviaMsgErro);
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${stickerOn} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(stickerOn.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"image/webp");
								if(media){
									clientBot.sendMessage(numeroCanal,media,{sendMediaAsSticker: true, stickerAuthor: "legion", stickerName: `${nomeCanal} ON!`});
									logMensagemEnviada("sendMessage",media,{sendMediaAsSticker: true, stickerAuthor: "legion", stickerName: `${nomeCanal} ON!`},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
	
					if(audioOn){
						loggerInfo("\t- Canal tem audioOn, enviando...");
						loggerInfo(audioOn);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${audioOn} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(audioOn,"audio/mpeg");
								if(media){
	
									clientBot.sendMessage(numeroCanal,media,{sendAudioAsVoice: true});
									logMensagemEnviada("sendMessage",media,{sendAudioAsVoice: true},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
	
					// Msg de texto dá delay pra enviar midia
					let mensagemOn = ``;
					let ajudaIgnorar = "\n\n"+configs.msgs.descIgnorar;
					if(!gp.opts.marcarTodosTwitch){
						ajudaIgnorar = "";
					}
					
					if(msgOn === true){
						mensagemOn = `${msgOnGenerica}${ajudaIgnorar}`;
					} else if(msgOn !== false){
						mensagemOn = `${msgOn}${ajudaIgnorar}`;
					}

					mensagemOn = mensagemOn.replace(/{nomeCanal}/g, nomeCanal);
					if(stream){
						mensagemOn = mensagemOn.replace(/{titulo}/g, stream.title);
						mensagemOn = mensagemOn.replace(/{jogo}/g, stream.game_name);
						mensagemOn = mensagemOn.replace(/{title}/g, stream.title);
						mensagemOn = mensagemOn.replace(/{game}/g, stream.game_name);
					}
	
					if(mensagemOn.length > 0){
						loggerInfo("\t- Canal tem msgOn");
						loggerInfo(mensagemOn);
						
						let toEnvio = 3000;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							//let gpEnviandoAtual = getGroupByNumeroGrupo(canalZap);
							loggerInfo(`[notificaStatusStream][${idNotif}[${toEnvio}][${gp.nome}] Enviando msg on para '${canalZap}...`);
	
							let opts = {};
							if(gp.opts.marcarTodosTwitch && (canalZap != configs.idGrupaoZueira)){
								opts.mentions = await getTodosNumerosGrupo(grupoWhats);
							}
	
							//Envia gerada random do chat GPT
							if(gp.twitch.gpt){
								let cttRnd = `${Math.floor(Math.random() * 1000000)}@c.us`;
								
								if(gp.twitch.gpt.customTextoLiveOn){
									const msgChatGPT = gpt_getChatCompletion({from: cttRnd, react: false}, gp.nome, cttRnd, `${gp.twitch.canal} está online na twitch.tv. Crie uma mensage muito animada chamando todos os membros do grupo para comparecer`, true);
									loggerInfo(`[notificaStatusStream][${idNotif} Gerando msg random pro chat GPT: ${JSON.stringify(msgChatGPT)}`);
									mensagemOn = `${msgChatGPT[0].msg}\n\n${mensagemOn}`;
								}
	
								// Imagem gerada
								if(gp.twitch.gpt.liveon){
									cttRnd = `${Math.floor(Math.random() * 1000000)}@c.us`;
									const respChatGpt = await gpt_ImageGeneration({from: cttRnd}, cttRnd, gp.twitch.gpt.liveon, true);
									const imgChatGpt = respChatGpt[0];
									if(!(typeof imgChatGpt.msg === 'string' || imgChatGpt.msg instanceof String)){
										setTimeout(async (numeroCanal, img) => {
											clientBot.sendMessage(numeroCanal, img.msg, {caption: `🟩 Live On!`});
										}, toEnvio + 1000, canalZap, imgChatGpt);
									}
								}
							}
	
							if(imgOn){
								loggerInfo("\t- Canal tem imgOn, enviando msgOn como legenda...");
								loggerInfo(imgOn);
								setTimeout(async (numeroCanal, msgOnEnv, optsMsg, imagemOn) => {
									loggerInfo(`[notificaStatusStream][${idNotif} Enviando imgOn para ${numeroCanal}`);
									const media = await MessageMedia.fromFilePath(imagemOn.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"image/jpeg");
									if(numeroCanal == configs.idGrupaoZueira){
										optsMsg.mentions = undefined;	// não marca no grupão
										msgOnEnv = msgOnEnv.replace(configs.descIgnorar,"");
									}
									optsMsg.caption = msgOnEnv;
	
									clientBot.sendMessage(numeroCanal,media,optsMsg);
									logMensagemEnviada("sendMessage",media,optsMsg,canalZap);
								}, toEnvio, canalZap, mensagemOn, opts, imgOn);
								toEnvio += 5000;
							} else {
								loggerInfo("\t- Canal SEM imgOn, enviando msgOn como msg normal...");
								setTimeout((numeroCanal, msgOnEnv, optsMsg) => {
									loggerInfo(`[notificaStatusStream][${idNotif} Enviando msgOn para ${numeroCanal}`);
									if(numeroCanal == configs.idGrupaoZueira){
										optsMsg.mentions = undefined; // não marca no grupão
									}
									clientBot.sendMessage(numeroCanal, msgOnEnv, optsMsg);
									//notificaCriador(`${numeroCanal}\n\n${msgOnEnv}`);
									logMensagemEnviada("sendMessage",msgOnEnv,{},numeroCanal);
								},toEnvio, canalZap, mensagemOn, opts);
							}
							
							toEnvio += 5000;
	
						}
					}
					gp.twitch.tsUltimoAviso = Math.floor((new Date().getTime()) / 1000);
				} else {
					const msgErrZap = `[notificaStatusStream][${idNotif}[${status}][${nomeCanal}] Erro Buscando grupoWhats do ID: ${gp.twitch.canaisZap[0]}`;
					loggerWarn(msgErrZap);
					notificaCriador(msgErrZap);
				}
			} else {
				loggerInfo(`[notificaStatusStream][${idNotif} Skippando aviso do grupo ${gp.nome}/${gp.twitch.canal} pois arrecém se passaram ${minutosPassadosDesdeUltimoAviso} minutos desde o útlimo.`);
			}

			loggerInfo(`[notificaStatusStream][${idNotif}[ON] -------------- Processado.`);
		}
	} else {
		// Off
		const tsAtual = Math.floor((new Date().getTime()) / 1000);
		for(let gp of gruposCanal){
			loggerInfo(`[notificaStatusStream][${idNotif}[OFF] Processando agora: ${gp.nome}`); // \n${JSON.stringify(gp,null,"\t")}
			vidOff = false;
			gifOff = false;
			stickerOff = false;
			imgOff = false;
			audioOff = false;
			msgOff = false;
			canaisZap = false;

			let ultimoAviso = 0;
			if(gp.twitch.tsUltimoAvisoOff){
				ultimoAviso = gp.twitch.tsUltimoAvisoOff;
			}
			let minutosPassadosDesdeUltimoAviso = Math.floor(tsAtual - ultimoAviso)/60;
			if(minutosPassadosDesdeUltimoAviso >= configs.tempoEntreAvisosTwitch){
				vidOff = gp.twitch.vidOff;
				gifOff = gp.twitch.gifOff;
				stickerOff = gp.twitch.stickerOff;
				imgOff = gp.twitch.imgOff;
				audioOff = gp.twitch.audioOff;
				msgOff = gp.twitch.msgOff;
				canaisZap = gp.twitch.canaisZap;

				let grupoWhats = false;
				try{
					loggerInfo(`[notificaStatusStream][${idNotif}[OFF] getChatById ${gp.twitch.canaisZap[0]}`);
					grupoWhats = await clientBot.getChatById(gp.twitch.canaisZap[0]);
					//loggerInfo(`[notificaStatusStream][${idNotif}[OFF] GRUPO WHATS:\n ${JSON.stringify(grupoWhats,null,"\t")}`);
				} catch(e){
					grupoWhats = false;
				}

				if(grupoWhats){
					///////////////////
					// Desativar modo apenas admin
					///////////////////
					const liveOnApenasAdmin = gp.opts.liveOnApenasAdmin ?? false;
					if(liveOnApenasAdmin){
						grupoWhats.setMessagesAdminsOnly(false);
					}
					///////////////////
					// Mudar Título
					///////////////////
					if(gp.opts.mudarTituloGrupoByTwitch){
						try{
							// Mudar titulo
							let tituloGrupo = grupoWhats.name || "";
							let novoTitulo = "";
	
							if(gp.twitch.tituloLiveOff !== false){
								novoTitulo = gp.twitch.tituloLiveOff;
								loggerInfo(`[notificaStatusStream][${idNotif}[tituloOFF] ${gp.nome} tem titulo OFF personalizado.`);
							} else {
								loggerInfo(`[notificaStatusStream][${idNotif}[tituloOFF] ${gp.nome} apenas inverte o titulo`);
								novoTitulo = tituloGrupo.replace("ON","OFF").replace("On","Off").replace("oN","oFF").replace("on","off");
								novoTitulo = swapRedAndGreenEmojis(novoTitulo);
							}
							
							loggerInfo(`[notificaStatusStream][${idNotif}[tituloOFF] '${tituloGrupo}' -> ${novoTitulo}`);
							if(novoTitulo.length > 0){
								if(tituloGrupo != novoTitulo){
									const deuCerto = await grupoWhats.setSubject(novoTitulo);
									if(deuCerto){
										loggerInfo(`[notificaStatusStream][${idNotif}[tituloOFF] Alterado título do grupo ${gp.nome}.`);
									} else {
										const souAdmin = isUserAdminById(configs.meuNumero,grupoWhats) ? "Sim" : "Não";
										clientBot.sendMessage(gp.twitch.canaisZap[0],configs.msgs.ajudaTituloAdmin.replace("{resposta}", souAdmin));
										loggerInfo(`[notificaStatusStream][${idNotif}[tituloOFF] ERRO DE ADMIN Alterando título do grupo ${gp.nome}.`);
									}
									
								} else {
									loggerInfo("[notificaStatusStream][tituloOFF] Eram iguais, não mudei.");
								}
							} else {
								loggerWarn(`[notificaStatusStream][${idNotif}[tituloOFF] Ocorreu algum erro quando tentei alterar o titulo do grupo ${gp.nome}: ${e}\n ${JSON.stringify(gp,null,"\t")}\n${JSON.stringify(grupoWhats,null,"\t")}`);
							}
						} catch(e){
							loggerWarn(`[notificaStatusStream][${idNotif} Ocorreu algum erro quando tentei alterar o titulo do grupo ${gp.nome}: ${e}\n ${JSON.stringify(gp,null,"\t")}\n${JSON.stringify(grupoWhats,null,"\t")}`);
						}
	
					}
					///////////////////
					// Mídia
					///////////////////
	
					//Envia gerada random do chat GPT
					if(gp.twitch.gpt){
						let cttRnd = `${Math.floor(Math.random() * 1000000)}@c.us`;
	
						// Imagem gerada
						if(gp.twitch.gpt.liveoff){
							const respChatGpt = await gpt_ImageGeneration({from: cttRnd, react: false}, gp.nome, cttRnd, gp.twitch.gpt.liveoff, true);
							const imgChatGpt = respChatGpt[0];
	
							if(!(typeof imgChatGpt.msg === 'string' || imgChatGpt.msg instanceof String)){
								let toEnvio = 6000;
								for(let canalZap of canaisZap){
									setTimeout(async (numeroCanal, img) => {
										clientBot.sendMessage(numeroCanal, img.msg, {caption: `🟥 Live off!`});
									}, toEnvio, canalZap, imgChatGpt);
									toEnvio += 5000;
								}
							}
						}
					}
	
					if(vidOff){
						loggerInfo("\t- Canal tem vidOff, enviando...");
						loggerInfo(vidOff);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${vidOff} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(vidOff.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"video/mp4");
								if(media){
									clientBot.sendMessage(numeroCanal,media);
									logMensagemEnviada("sendMessage",media,{},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
					if(gifOff){
						loggerInfo("\t- Canal tem gifOff, enviando...");
						loggerInfo(gifOff);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${gifOff} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(gifOff.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"image/gif");
								if(media){
									clientBot.sendMessage(numeroCanal,media,{sendVideoAsGif: true});
									logMensagemEnviada("sendMessage",media,{sendVideoAsGif: true},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
					if(stickerOff){
						loggerInfo("\t- Canal tem stickerOff, enviando...");
						loggerInfo(stickerOff);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${stickerOff} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(stickerOff.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"image/webp");
								if(media){
									clientBot.sendMessage(numeroCanal,media,{sendMediaAsSticker: true, stickerAuthor: "legion", stickerName: `${nomeCanal} OFF!`});
									logMensagemEnviada("sendMessage",media,{sendMediaAsSticker: true, stickerAuthor: "legion", stickerName: `${nomeCanal} OFF!`},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
	
					if(imgOff){
						loggerInfo("\t- Canal tem imgOff, enviando...");
						loggerInfo(imgOff);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${imgOff} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(imgOff.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"image/jpeg");
								if(media){
									clientBot.sendMessage(numeroCanal,media);
									logMensagemEnviada("sendMessage",media,{},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
					if(audioOff){
						loggerInfo("\t- Canal tem audioOff, enviando...");
						loggerInfo(audioOff);
						let toEnvio = 0;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								loggerInfo(`[notificaStatusStream][${idNotif} Enviando ${audioOff} para ${numeroCanal}`);
								const media = await MessageMedia.fromFilePath(audioOff.replace(/\//g,"\\").replace("\\home\\","c:\\users\\"),"audio/mpeg");
								if(media){
									clientBot.sendMessage(numeroCanal,media,{sendAudioAsVoice: true});
									logMensagemEnviada("sendMessage",media,{sendAudioAsVoice: true},canalZap);
								}
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					}
	
					// Msg de texto dá delay pra enviar midia
					if(msgOff !== false){
						loggerInfo("\t- Canal tem msgOff, enviando...");
						msgOff = msgOff.replace(/{nomeCanal}/g, nomeCanal);
						if(stream){
							msgOff = msgOff.replace(/{titulo}/g, stream.title);
							msgOff = msgOff.replace(/{jogo}/g, stream.game_name);
							msgOff = msgOff.replace(/{title}/g, stream.title);
							msgOff = msgOff.replace(/{game}/g, stream.game_name);
						}

						loggerInfo(msgOff);
						
						let toEnvio = 3000;
						let canalZap = undefined;
						for(canalZap of canaisZap){
							setTimeout(async (numeroCanal) => {
								clientBot.sendMessage(numeroCanal, msgOff);
								//notificaCriador(`${numeroCanal}\n\n${msgOff}`);
								logMensagemEnviada("sendMessage",msgOff,{mentions: 0},canalZap);
							},toEnvio,canalZap);
							toEnvio += 5000;
						}
					
					}
				} else {
					const msgErrZap = `[notificaStatusStream][${idNotif}[${status}][${nomeCanal}] Erro Buscando grupoWhats do ID: ${gp.twitch.canaisZap[0]}`;
					loggerWarn(msgErrZap);
					notificaCriador(msgErrZap);
				}

			} else {
				loggerInfo(`[notificaStatusStream][${idNotif} Skippando aviso off do grupo ${gp.nome}/${gp.twitch.canal} pois arrecém se passaram ${minutosPassadosDesdeUltimoAviso} minutos desde o útlimo.`);
			}
			loggerInfo(`[notificaStatusStream][${idNotif}[OFF] -------------- Processado.`);
		}
	}
}

function addCanaisMonitorados(streamsMonitoradas){
	twitchNotify.follow(streamsMonitoradas);
	loggerInfo(`[twitchNotify] Seguindo ${streamsMonitoradas.length} streams.`);
}

function removerMonitoramentoCanal(nomeCanal){
	console.log(`[removerMonitoramentoCanal] ${nomeCanal}`);
	twitchNotify.unfollow([ nomeCanal ]);
}

function setMonitoramentoTwitchClient(client){
	clientBot = client;
}

module.exports = { addCanaisMonitorados, removerMonitoramentoCanal, setMonitoramentoTwitchClient }