# 🤖 legionbot-open

Código fonte do *legionbot*, liberado pra galera hospedar seu próprio bot do zap sem depender de mim!

Criei o bot pra aprender os detalhes de usar *javascript* com *nodejs*, então o código da versão que está rodando é simplesmente um caos e cheia de gambiarras. Essa versão que posto aqui, vai servir pra tentar aplicar boas práticas e também tentar deixar o código mais acessível, sem chamadas que bloqueiam o código e mais modular, para que novas funções possam ser implementadas por outras pessoas sem grandes dificuldades.

## Checklist de coisas pra implementar

Estas são funções que o legionbot já faz (ou pretendo fazer), mas que preciso reescrever e adaptar nesta versão.
- [ ] Handlers básicos
    - [X] Handler msgs
    - [ ] Handler Reacts
    - [ ] Reescrever o `wrappers-bot.js`
    - [ ] Handler Comandos Normais

- [ ] Gerencia
    - [ ] Preferências do grupo
    - [ ] CRUD comandos

- [ ] Filtros de Mensagens  
    - [X] Mensagens do bot
    - [ ] Whitelist no PV
    - [ ] Travazaps
    - [ ] Mensagens NSFW
    - [ ] Links
    - [ ] Palavras pré-definidas

- [ ] Comandos Fixos
    - [X] Stickers
        - [X] Stickers normais
        - [X] Stickers sem fundo
        - [ ] Transformar sticker em foto/vídeo/arquivo
    - [ ] Manipulação de imagens
        - [X] Remover Fundo
        - [ ] Distort/Mogrify
        - [ ] NeedsMoreJPEG
    - [ ] !atenção
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

1. **Debian e derivados**
```sh
$ curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
$ sudo apt install -y nodejs
```
2. **Windows**:
    Acesse o site oficial do [nodejs](https://nodejs.org/), baixe e instale a versão LTS.

### ffmpeg
Acesse o site oficial do [ffmpeg](https://ffmpeg.org/download.html) e faça o download dos executáveis. Coloque em uma pasta que você saiba o caminho, pois vai precisar configurar o mesmo no `configs.js`.

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

O legionbot usa os seguintes pacotes:
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