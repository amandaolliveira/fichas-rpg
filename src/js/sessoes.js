// SESSÕES
// cada sessão (dia de jogo) é de uma campanha

const sessoes = [];

// mesmo esquema dos agentes e campanhas. aqui não tem sessão de exemplo, começa vazio
const sessoesSalvas = carregarDoStorage(CHAVE_SESSOES);
if (sessoesSalvas) {
	for (const dados of sessoesSalvas) {
		sessoes.push(Sessao.storageParaJSON(dados));
	}
}

function salvarSessoes() {
	salvarNoStorage(CHAVE_SESSOES, sessoes);
}

function buscarSessao(id) {
	for (const sessao of sessoes) {
		if (sessao.id === id) {
			return sessao;
		}
	}
	return undefined;
}

// todas as sessões de uma campanha
function sessoesDaCampanha(campanhaId) {
	const lista = [];
	for (const sessao of sessoes) {
		if (sessao.campanhaId === campanhaId) {
			lista.push(sessao);
		}
	}
	return lista;
}
