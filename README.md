# AI Usage

Widget flutuante para Windows que mostra, numa tela só, quanto da cota semanal
você já gastou em cada assinatura de IA que usa no terminal: **Claude Code**,
**Codex**, **Grok Build** e **Kimi Code**. Cada linha traz a barra de consumo,
quando a janela reinicia e um veredito para a decisão de plano:

<p align="center">
  <img src="docs/widget.png" alt="O widget mostrando as quatro fontes lado a lado, cada uma com barra semanal e selo" width="350">
  <img src="docs/tokens.png" alt="A aba de tokens por modelo, disponível na visão individual do Claude" width="350">
</p>

> As imagens acima usam dados de demonstração.

| Selo | Significa | O que fazer |
|---|---|---|
| **SOBRA** | gastou bem menos do que a semana já andou | candidato a descer o plano |
| **NO RITMO** | consumo acompanha a semana | manter |
| **ESTOURA** | vai acabar antes de reiniciar | frear, mover volume para outra ferramenta ou subir |

O traço claro em cada barra marca quanto da semana já passou. Barra atrás do
traço = sobra; barra na frente = vai faltar. O veredito não olha só o instante
atual: guarda até 12 semanas fechadas por fonte e pesa o histórico mais que a
semana corrente. Regra prática: só troque de plano depois de 3 ou 4 semanas
com o mesmo selo.

## Por que existe

Cada CLI de IA tem seu próprio limite semanal, e nenhum te avisa até estourar.
Descobrir o estado de cada um exige abrir o navegador, autenticar e ler uma
página diferente por ferramenta, um atrito grande o bastante pra ninguém
fazer no dia a dia. O resultado é bater no teto no meio de uma tarefa longa,
sem aviso, ou pagar por plano maior do que o uso real justifica.

## Zero configuração

Não tem login nem chave para colar. O widget lê as credenciais que cada CLI já
guarda na sua máquina e consulta o mesmo endpoint de uso que o próprio CLI usa:

| Ferramenta | Credencial lida | Endpoint |
|---|---|---|
| Claude Code | `%USERPROFILE%\.claude\.credentials.json` | `api.anthropic.com/api/oauth/usage` |
| Codex | `%USERPROFILE%\.codex\auth.json` | `chatgpt.com/backend-api/wham/usage` |
| Grok Build | `%USERPROFILE%\.grok\auth.json` | `cli-chat-proxy.grok.com` (billing) e `auth.x.ai` (renovação de token) |
| Kimi Code | credencial local do Kimi CLI | `api.kimi.com` e `auth.kimi.com` |

Ferramenta que nunca logou nesta máquina simplesmente não aparece. Nenhuma
dessas credenciais é copiada, reenviada a outro servidor ou modificada: a
leitura é local e somente leitura. Não há telemetria, não há conta própria do
widget, nem qualquer conexão além dessas consultas de uso.

## Instalar

Baixe `AI-Usage-Setup-<versão>.exe` na aba **Releases** deste repositório e
execute. Windows 10/11 64 bits. Sem login, sem chave de API: se você já usa
Claude Code, Codex, Grok Build ou Kimi Code autenticados nesta máquina, o
widget já encontra a credencial sozinho.

## Rodar do código

Requisitos: Windows 10/11 64 bits e Node.js já instalado (pra rodar `npm`; o
Electron do próprio app é baixado no passo abaixo).

```powershell
git clone https://github.com/AIgorrocha/ai-usage-widget.git
cd ai-usage-widget
npm install
npm run preparar   # baixa o Electron (~100 MB), só na primeira vez
npm test           # 58 verificações
npm start
npm run dist        # gera release\AI-Usage-Setup-<versão>.exe
```

O passo `npm run preparar` não é opcional: o Electron não baixa o binário
durante o `npm install`, só no primeiro uso. Sem esse passo, o `npm start`
parece travado enquanto baixa em silêncio.

## Uso

| Onde | O quê |
|---|---|
| Barra de topo | Arrasta a janela |
| ▲ | Fixa sobre as outras janelas |
| ↻ | Atualiza agora (o widget já atualiza sozinho em ciclo) |
| ▢ | Modo compacto |
| Abas por fonte | Alterna entre a visão "Todos" e cada ferramenta isolada |
| Rodapé (na visão de uma fonte) | Abre e fecha a aba de tokens gastos por modelo |
| Botão de recolher | Esconde na bandeja |
| Ícone da bandeja | Mostra/esconde; clique direito abre o menu |

Posição da janela, modo compacto e fonte selecionada ficam guardados entre uma
abertura e outra. No primeiro uso o widget já se registra para abrir com o
Windows; desligue pelo menu da bandeja em **Iniciar com o Windows**, ou pelo
terminal com `npm run autostart:off` (existe também `:on` e `:status`).

## Comportamento em falhas

| Situação | O que acontece |
|---|---|
| Credencial expirada ou ausente | Aviso pedindo pra autenticar naquela ferramenta; último valor conhecido continua visível, marcado |
| Sem conexão | Continua tentando, dobrando o intervalo de 5 até 30 minutos por fonte |
| Resposta em formato inesperado | O campo vira travessão; o resto da tela continua funcionando |

O widget prefere mostrar um dado velho e avisado a inventar um novo.

## Desenvolvimento

```powershell
npm test                 # node:test, sem framework
npm run icons            # regenera os ícones da bandeja
```

Estrutura:

```
main.js               janela, bandeja, ciclo de atualização, IPC
preload.js             ponte mínima entre processo principal e janela
index.html              a interface
renderer.js             desenha os dados na tela
lib/creds.js            credencial e chamada de uso do Claude Code
lib/codex-creds.js      credencial e chamada de uso do Codex
lib/codex-usage.js      | lib/codex-view-model.js
lib/grok-creds.js       credencial e chamada de uso do Grok Build
lib/grok-usage.js       | lib/grok-view-model.js
lib/kimi-creds.js       credencial, OAuth e chamada de uso do Kimi Code
lib/kimi-usage.js       | lib/kimi-oauth.js | lib/kimi-view-model.js
lib/usage.js            chamada HTTP e view-model do Claude Code
lib/view-model.js       converte a resposta bruta no que a tela mostra
lib/token-usage.js      tokens por modelo (aba do Claude), índice incremental
lib/history.js          histórico semanal por fonte e o cálculo do veredito
lib/window-state.js     posição e preferências, validadas contra os monitores
lib/poll-policy.js      intervalo entre consultas e recuo em caso de falha
lib/autostart.js        o atalho da pasta Inicializar
tools/                  ícones, empacotamento, início automático por CLI
test/                   fixtures com a estrutura real de cada API e as verificações
```

A janela roda com isolamento de contexto ligado e sem integração com Node
(`contextIsolation: true`, `nodeIntegration: false`): o processo que fala com
as APIs é separado do que desenha a tela, e só números e textos já prontos
cruzam essa ponte.

## Limitações conhecidas

- **Só Windows.** O código é portável, mas o início automático usa atalho da
  pasta Inicializar, que é específico do Windows.
- **Tokens não viram percentual de limite.** A aba de tokens (só na visão do
  Claude) informa consumo por modelo, não prevê quando você bate no teto.
- **A aba de tokens é por máquina**, não por conta: se você usa o Claude Code
  em mais de um computador, cada widget mostra só a sua parte.
- **Não é oficial** e não tem vínculo com Anthropic, OpenAI, xAI ou Moonshot
  AI. Usa o mesmo endpoint que cada CLI já usa, com a credencial que ela
  mesma guarda localmente.

## Origem e licença

Derivado do [claude-widget](https://github.com/giovani-junior-dev/claude-widget)
de Giovani Junior (MIT), que mostrava só o Claude Code, cada fonte numa aba.
Esta versão junta Claude Code, Codex, Grok Build e Kimi Code numa tela só,
acrescenta o histórico semanal e o veredito de plano, e troca a identidade
visual. Licença MIT; o aviso de copyright original está em `LICENSE`.
