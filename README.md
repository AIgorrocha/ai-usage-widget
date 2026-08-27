# AI Usage

Widget flutuante para Windows que mostra, numa tela só, quanto da cota semanal
você já gastou em cada assinatura de IA que usa no terminal: **Claude Code**,
**Codex**, **Grok Build** e **Kimi Code**. Cada linha traz a barra de consumo,
quando a janela reinicia e um veredito para a decisão de plano:

| Selo | Significa | O que fazer |
|---|---|---|
| **SOBRA** | gastou bem menos do que a semana já andou | candidato a descer o plano |
| **NO RITMO** | consumo acompanha a semana | manter |
| **ESTOURA** | vai acabar antes de reiniciar | frear, mover volume para outra ferramenta ou subir |

O traço claro em cada barra marca quanto da semana já passou. Barra atrás do
traço = sobra; barra na frente = vai faltar. Regra prática: só troque de plano
depois de 3 ou 4 semanas com o mesmo selo.

## Zero configuração

Não tem login nem chave para colar. O widget lê as credenciais que cada CLI já
guarda na sua máquina e consulta o mesmo endpoint de uso que o próprio CLI usa:

| Ferramenta | Credencial lida | Endpoint |
|---|---|---|
| Claude Code | `%USERPROFILE%\.claude\.credentials.json` | `api.anthropic.com/api/oauth/usage` |
| Codex | `%USERPROFILE%\.codex\auth.json` | `chatgpt.com/backend-api/wham/usage` |
| Grok Build | `%USERPROFILE%\.grok\auth.json` | `cli-chat-proxy.grok.com/v1/billing` |
| Kimi Code | credencial local do Kimi CLI | API oficial do Kimi |

Ferramenta que nunca logou nesta máquina simplesmente não aparece. Nada sai do
computador além dessas consultas; não há telemetria. No primeiro uso o widget
já se registra para abrir com o Windows (desligue pelo menu da bandeja).

## Instalar

Baixe `AI-Usage-Setup-<versão>.exe` em Releases e execute. Windows 10/11 64 bits.

## Rodar do código

```powershell
git clone <este repositório>
cd ai-usage-widget
npm install
npm run preparar   # baixa o Electron (~100 MB) uma vez
npm test
npm start
npm run dist       # gera release\AI-Usage-Setup-<versão>.exe
```

## Uso

| Onde | O quê |
|---|---|
| Barra de topo | Arrasta a janela |
| ▲ | Fixa sobre as outras janelas |
| ↻ | Atualiza agora (o widget já atualiza sozinho em ciclo) |
| ▢ | Modo compacto |
| Botão de recolher | Esconde na bandeja |
| Ícone da bandeja | Mostra/esconde; clique direito abre o menu |

## Origem e licença

Derivado do [claude-widget](https://github.com/giovani-junior-dev/claude-widget)
de Giovani Junior (MIT), que mostrava cada fonte numa aba. Esta versão junta
tudo numa tela, acrescenta o veredito de plano e troca a identidade visual.
Licença MIT; o aviso de copyright original está em `LICENSE`.
