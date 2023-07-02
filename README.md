# 🤖 legionbot-open

**⚠️ ATENÇÃO**: Repositório ainda sendo organizado, apenas para curiosos, zero garantias.

Código fonte do *legionbot*, liberado pra galera hospedar seu próprio bot do zap sem depender de mim!

Criei o bot pra aprender os detalhes de usar *javascript* com *nodejs*, então o código da versão que está rodando é simplesmente um caos e cheia de gambiarras. Essa versão que posto aqui, vai servir pra tentar aplicar boas práticas e também tentar deixar o código mais acessível, sem chamadas que bloqueiam o código e mais modular, para que novas funções possam ser implementadas por outras pessoas sem grandes dificuldades.

*O código desse repositório está funcional, então você pode rodar e testar as funções já implementadas.*

## Checklist de coisas pra implementar

Estas são funções que o legionbot já faz (+ umas novas que pretendo fazer), mas que preciso reescrever e adaptar nesta versão.
- [ ] Handlers básicos
	- [X] Handler msgs
	- [ ] Handler Reacts
	- [ ] Reescrever o `wrappers-bot.js` (código antigo lixo)
	- [ ] Handler Comandos Normais

- [ ] Gerencia
	- [X] Estruturar base de dados
	- [X] Cadastro de Grupo
	- [ ] Preferências do grupo
	- [ ] CRUD comandos

- [ ] Filtros de Mensagens  
	- [X] Mensagens do bot
	- [ ] SPAM
	- [ ] Whitelist no PV
	- [ ] Travazaps
	- [ ] Mensagens NSFW
	- [ ] Links
	- [ ] Palavras pré-definidas

- [ ] Comandos Fixos
	- [ ] Stickers
		- [X] Stickers normais
		- [X] Stickers sem fundo
		- [ ] Transformar sticker em foto/vídeo/arquivo
	- [ ] Manipulação de imagens
		- [X] Remover Fundo
		- [ ] Distort/Mogrify
		- [ ] NeedsMoreJPEG
	- [X] !atenção
	- [ ] Roleta
	- [ ] GPT 
	- [ ] JrMuNews
	- [ ] Horóscopo
	- [ ] Lembretes
	- [ ] Roubar
	- [ ] Clima
	- [ ] Google
	- [ ] Wikipedia
	- [ ] Text-to-Speech
	- [ ] Speech-to-Text
	- [ ] Deletar
	- [ ] ELOs LoL e Valorant
	- [ ] Baixar Instagram
	- [ ] Baixar do Tiktok
	- [ ] Listas
	- [ ] Fechar/Abrir grupo
	- [ ] Custom Requests
		- [ ] InstaSiPt
		- [ ] RAB aviões

- [ ] Notificação de Live e Vídeos
	- [ ] Twitch
	- [ ] Youtube
	- [ ] Kick (sem API por enquanto)

- [ ] Projetos Futuros
	- [ ] Tutoriais em GIF
	- [ ] NSFW Horários específicos
	- [ ] !add contato em grupo


## Como eu faço pra rodar?

É difícil explicar tudo, mas vou tentar. É interessante que você entenda um pouquinho de programação pra facilitar, mas não é necessário se tiver paciência pra seguir um tutorial e usar o Google em caso de problemas.

### O que eu preciso pra começar?

- Algum computador que rode Windows ou Linux
	- Pode ser o teu PC de casa, um notebook, um raspberry pi, um beaglebone... Recomendo pelo menos 4Gb de RAM
- Um celular com WhatsApp instalado e um número cadastrado
	- *NÃO USE* o seu próprio número, você **será** banido

### Quais programas preciso instalar?

#### nodejs v16 ou superior

1. **Se você está usando Debian e derivados**:
```sh
$ curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
$ sudo apt install -y nodejs
```
2. **Se você está no Windows:**
	Acesse o site oficial do [nodejs](https://nodejs.org/), baixe e instale a versão LTS.

### ffmpeg
Acesse o site oficial do [ffmpeg](https://ffmpeg.org/download.html) e faça o download dos executáveis. Coloque em uma pasta que você saiba o caminho, pois vai precisar configurar o mesmo no `configs.js`.

### ImageMagick
O bot utiliza o liquify do ImageMagick pra fazer as funções *distort* e *JPEG*.

Acesse o site oficial do [ImageMagick](https://imagemagick.org/script/download.php), faça o download e instale. Estou usando a versão `ImageMagick-7.1.1-12-Q16-HDRI-x64-dll.exe`, mas qualquer uma que intale o executável `mogrify.exe` serve.
Anote a pasta onde foi instalado, pois vai precisar configurar o mesmo no `configs.js`.

### python3 & rembg

O bot utiliza a ferramenta **rembg** para remover fundo das imagens, que foi escrita em *python*. 

1. Instale o python3
	>https://www.python.org/downloads/
2. Em um termimal, execute:
```sh
	pip install rembg[cli]
```
Você também pode usar o poder da placa de vídeo do servidor, se for possível. Visite o repositório oficial do [rembg](https://github.com/danielgatis/rembg) para mais informações.

3. Descubra onde está o executável do *rembg*
	- No windows, digite em um novo terminal: `where rembg`
	- No linux, digite em um novo terminal: `which rembg`
	Isso retornará o caminho completo do executável (script) do *rembg*, copie e guarde este valor para colar no arquivo `configs.js`

### legionbot

Com os pré-requisitos instalados, agora é hora de clonar ou baixar esse repositório e instalar as dependência.

O legionbot usa os seguintes pacotes (nesta versão, a final terá bem mais):
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js): **Excelente** biblioteca para manipulação do WhatsappWeb
- [winston](https://github.com/winstonjs/winston): Gerenciador de logs
- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file): Extensão do gerenciador de logs para orgaização
- [mime-types](https://github.com/jshttp/mime-types): Identificar extensão e tipo de arquivos

1. Navegue até o diretório onde estão os arquivos do bot e instale os pacotes necessários utilizando:

```sh
npm install
```
2. Abra o arquivo `configs.js` com seu editor de preferência e edite as variáveis conforme especificado
3. Agora execute o bot usando:
```sh
node index.js
```

4. Escaneie o qr-code e *voilá*, só alegria!


## Como eu contribuo?

Financeiramente? Me manda um cafézinho no [tipa.aí](https://tipa.ai/moothz)!

Teu negócio é programar e quer fazer uma função nova pro bot? O principal é implementar um handler!
Seu handler vai receber uma variável recheadinha de informações das mensagens que chegam (uma por vez), ele só precisa retornar um array de objetos que chamo de mensagens a enviar.

Você vai precisar saber usar, pelo menos um pouco, a biblioteca [wwebjs](https://docs.wwebjs.dev/).

Aqui vai o link direto pra documentação dos objetos que você precisa conhecer:
- [Message](https://docs.wwebjs.dev/Message.html)
- [MessageMedia](https://docs.wwebjs.dev/MessageMedia.html)
- [Contact](https://docs.wwebjs.dev/Contact.html)


```js
// Exemplo do que vem na variável 'dados':
const dados = {
	msg: [Objeto Message], // da mensagem recebida
	quotedMsg: [Objeto Message], // da mensagem em resposta, se existir
	chat: [Objeto Chat], // no contexto da mensagem (grupo, pv)
	nomeGrupo: "pvdobot", // Nome do grupo no cadastro, 'generico' para sem cadastro ou 'pvdobot'
	nomeAutor: "pessoa",
	numeroAutor: "55????????@c.us",
	contatoAutor: [Objeto Contact], // da pessoa que enviou a mensagem
	mentions: [Objetos Contact, Contact, ...], // das pessoas @marcadas na mensagem + quem foi respondido (quote)
	cleanMessageText: "bom dia, grupo!", // Mensagem em texto plano que a pessoa enviou, sanitizada
	admin: false, // Quem enviou é admin do grupo?
	superAdmin: // Quem enviou é admin do BOT? (Lista personalizada no configs.js)
};

// Copie o código abaixo e divirta-se! É importante que seja retornado uma promise.
// Recomendo que use sempre o 'resolve' e inclua a mensagem de erro na resposta para o usuário
// Caso chame um 'reject', o bot vai ignorar e mostrar os erros nos logs/terminal
function seuHandler(dados){
	return new Promise(async (resolve, reject) => {
		// Uma mensagem possui vários parâmetros, você só precisa definir os que for usar!
		// No exemplo abaixo coloquei todos os possíveis
		const novaMensagem = {
			msg: `Oi, ${dados.nomeAutor} eu sou um handler de exemplo!`, // Aqui pode ser um texto plano ou arquivo (abaixo)
			react: "☺️", // Após responder, reagir com esse emoji ou nada (false)
			reply: true, // Responder a mensagem que originou o comando (true) ou só enviar solta no chat (false)?
			isSticker: false, // A mídia será enviada como sticker
			isGif: false, // A mídia será enviada como gif
			isAudio: false, // A mídia será enviada como mensagem de voz
			isFile: false, // A mídia será enviada como arquivo
			replyCustomMsg: false, // ID de uma mensagem personalizada pro bot responder (colocar em quote)
			legenda: false, // Caso seja uma foto, vídeo ou gif, você pode especificar uma legenda
			marcarPessoas: [Objetos Contact, Contact, ...] // Array de Contact das pessoas que o bot vai marcar na mensagem
		};

		const novaMensagemMidia = {
			msg: MessageMedia.fromFilePath("fotos_da_festa.jpg"), // Para enviar mídia, você precisa usar o objeto MessagaMedia
			legenda: "estavamos lindo nessa fotinha",
			react: "😎",
			reply: false
		};

		// Colocamos todas as mensagens a serem enviadas (1 comando pode gerar várias respostas!) no array
		const mensagensEnviar = [novaMensagem, novaMensagemMidia];

		// E tchau! Boa viagem, mensagensEnviar!
		resolve(mensagensEnviar);
	}
}
```