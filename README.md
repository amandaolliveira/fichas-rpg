# C.A.R.L.

Sistema web para criação e gerenciamento de fichas de RPG.

## Objetivo

Permitir que jogadores criem, consultem e organizem as fichas dos seus personagens
em um só lugar, com cálculo automático de atributos e rolagem de dados para testes.
Também dá pra organizar as campanhas, as sessões de jogo de cada uma e o histórico das rolagens.
Projeto da disciplina de Desenvolvimento Web I, da Universidade do Contestado.

## Integrantes

- Carlos Eduardo Bordin de Paula
- Amanda Oliveira do Amaral

## Funcionalidades

- Menu de navegação entre as telas: Início, Dados, Ficha, Agentes, Campanhas, Sessões, Guia e Perfil
- **Agentes (fichas)**: criar, listar, editar e excluir (com modal de confirmação)
  - Validação dos atributos pela regra do Ordem Paranormal: de 0 a 3, só um pode ficar em 0 e a soma não passa de 9
  - Contador de pontos restantes que fica vermelho quando passa do limite
  - Vida, sanidade e esforço com valor atual e máximo (o atual não pode passar do máximo)
  - Pesquisa por personagem ou jogador, filtro por campanha e ordenação por nome ou vida
- **Campanhas**: criar e editar num wizard de 4 passos, ver os detalhes e excluir
  - Cada campanha escolhe quais agentes participam
  - Excluir um agente tira ele das campanhas; excluir uma campanha apaga as sessões dela
- **Sessões**: cada sessão é de uma campanha
  - Status: agendada → em andamento → concluída (ou agendada → cancelada)
  - Regras: só começa se a campanha tiver agente, só uma em andamento por campanha, não dá pra agendar no passado e sessão concluída/cancelada não edita mais
  - Pesquisa por título ou anotações, filtro por status e por campanha (funcionam juntos) e ordenação por data ou título
- **Rolagem de dados** (funcionalidade do tema): um d20 por ponto no atributo da perícia, fica o maior; com atributo 0 rola 2 e fica o menor. Dado 3D com three.js e som
  - Histórico das rolagens salvo, com crítico (20) e desastre (1) marcados
  - Se o agente estiver numa sessão em andamento, a rolagem fica ligada a ela
- **Início (dashboard)**: indicadores calculados dos registros: agentes, campanhas, agentes sem campanha, média de agentes por campanha, vida média, campanha mais recente, sessões agendadas e concluídas, próxima sessão e rolagens/críticos
- **Perfil**: nome do jogador salvo e abas com os seus agentes, as campanhas que joga e as que mestra
- Guia com orientações sobre atributos, recursos e defesa
- Avisos (alertas do Bootstrap) quando salva, exclui ou tem erro no formulário
- Tudo fica salvo no localStorage e volta quando recarrega a página
- Layout responsivo pra computador e celular

## Como executar

Não precisa instalar nada, é só HTML, CSS e JavaScript.

1. Baixe ou clone o repositório: `git clone https://github.com/amandaolliveira/fichas-rpg.git`
2. Abra o arquivo `src/index.html` no navegador (ou use a extensão Live Server do VS Code)

Precisa de internet pra carregar o Bootstrap, os ícones, as fontes e o three.js (vêm de CDN).

Site publicado: (pendente)

## Estrutura

```
src/
├── index.html
├── css/style.css
├── img/          (ícones e imagens)
├── sound/        (som do dado)
└── js/
    ├── variaveis.js    (variáveis globais e listas fixas)
    ├── classes.js      (classes Agente, Campanha e Sessao)
    ├── storage.js      (salvar e carregar do localStorage)
    ├── aviso.js        (alertas)
    ├── dados3d.js      (dado 3D)
    ├── rolagem.js      (perícias e rolagem)
    ├── agentes.js      (lista e cards de agentes)
    ├── ficha.js        (formulário da ficha e validação)
    ├── campanhas.js    (lista e detalhes das campanhas)
    ├── wizard.js       (criar/editar campanha)
    ├── sessoes.js      (sessões, status e filtros)
    ├── historico.js    (histórico de rolagens)
    ├── estatisticas.js (indicadores do início)
    ├── perfil.js       (perfil do jogador)
    └── main.js         (troca de seções, carrega por último)
```

## Tecnologias

HTML5, CSS, JavaScript e Bootstrap 5 (com Bootstrap Icons). O dado 3D usa three.js.

## Responsabilidades

- **Carlos**: identidade visual e CSS do site, layout responsivo, seção de dados com o dado 3D, campanhas e wizard,
  estatísticas do início e organização do JavaScript em arquivos
- **Amanda**: card de agente, tela do guia, localStorage, validação da ficha, avisos, sessões (status, filtros e ordenação),
  histórico de rolagens, perfil e README

## Créditos

Diagrama de atributos: arte do site Ordem Paranormal (uso educacional).
