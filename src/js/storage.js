// STORAGE
// salva e carrega as listas no localStorage, pra não perder tudo quando recarrega a página

// as chaves onde cada coisa fica guardada no navegador
const CHAVE_AGENTES = "carl-agentes";
const CHAVE_CAMPANHAS = "carl-campanhas";

// o localStorage só guarda texto, então o JSON.stringify transforma a lista em texto
function salvarNoStorage(chave, lista) {
	localStorage.setItem(chave, JSON.stringify(lista));
}

// devolve a lista que tava salva, ou undefined se nunca salvou nada
function carregarDoStorage(chave) {
	const texto = localStorage.getItem(chave);
	if (texto === null) {
		return undefined;
	}
	return JSON.parse(texto);
}
