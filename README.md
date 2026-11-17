# C.A.R.L.

Sistema web para criação e gerenciamento de fichas de RPG.

## Objetivo

Permitir que jogadores criem, consultem e organizem as fichas dos seus personagens em um só lugar, com cálculo automático de atributos e rolagem de dados para testes. Projeto da disciplina de Desenvolvimento Web I, da Universidade do Contestado.

## Integrantes

- Carlos Eduardo Bordin de Paula
- Amanda Oliveira do Amaral

## Features

- Menu de navegação entre as telas: Início, Dados, Ficha, Agentes, Campanhas, Sessões, Guia e Perfil
- **Agentes (fichas)**: seguindo o CRUD
  - Validação dos atributos pela regra do Ordem Paranormal: de 0 a 3, só um pode ficar em 0 e a soma não passa de 9
  - Contador de pontos restantes que fica vermelho quando passa do limite
  - Vida, sanidade e esforço com valor atual e máximo (o atual não pode passar do máximo)
  - Pesquisa por personagem ou jogador, filtro por campanha e ordenação por nome ou vida
- **Campanhas**: criar e editar num "wizard" de 4 passos, ver os detalhes e excluir
  - Cada campanha escolhe quais agentes participam
  - Excluir um agente tira ele das campanhas; excluir uma campanha apaga as sessões dela
- **Sessões**: cada sessão é de uma campanha
  - Status: agendada -> em andamento -> concluída (ou agendada -> cancelada)
  - só começa se a campanha tiver agente, só uma em andamento por campanha, não dá pra agendar no passado e sessão concluída/cancelada não edita mais
  - Pesquisa por título ou anotações, filtro por status e por campanha (funcionam juntos) e ordenação por data ou título
- **Rolagem de dados** (funcionalidade exclusiva do nosso site): um d20 por ponto no atributo da perícia, fica o maior; com atributo 0 rola 2 e fica o menor. Dado 3D com three.js e som
  - Histórico das rolagens salvo, com crítico (20) e desastre (1) marcados
  - Se o agente estiver numa sessão em andamento, a rolagem fica ligada a ela
- **Início (dashboard)**: indicadores calculados dos registros: agentes, campanhas, agentes sem campanha, média de agentes por campanha, vida média, campanha mais recente, sessões agendadas e concluídas, próxima sessão e rolagens/críticos
- **Perfil**: nome do jogador salvo e abas com os seus agentes, as campanhas que joga e as que mestra
- Guia com orientações sobre atributos, recursos e defesa
- Mensagens de aviso
- Salva tudo no localStorage
- Responsividade em celular

## Como executar

Instalar a extensão Live Server no VSCODE, e iniciar no navegador

Ou acessar no Git Pages: https://amandaolliveira.github.io/fichas-rpg/src/

## Tecnologias

HTML5, CSS, JavaScript e Bootstrap 5 (com Bootstrap Icons). O dado 3D usa three.js, seguindo um tutorial da biblioteca

## Responsabilidades

- **Carlos**:
Transformar a ideia visual em classes CSS e o layout responsivo; Troca de seções; Dado 3d; Estatisticas; Organização das pastas/arquivos .js; Abstração dos objetos usando as classes nativas do js; Tela de inicio; Tela de dados;
- **Amanda**: Ideia da identidade visual e esquema de cores; design geral; alguns cards; Guia; Local Storage, ;validação nos formularios; avisos; sessões (status, filtros e ordenação); histórico de rolagens; perfil; documentação no README

## Créditos

Inspiração no sistema de Ordem Paranormal