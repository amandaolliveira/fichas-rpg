// STORAGE

const CHAVE_AGENTES = "carl-agentes";
const CHAVE_CAMPANHAS = "carl-campanhas";
const CHAVE_SELECIONADO = "carl-agente-selecionado"; // salva só o id do agente, não o objeto inteiro

// mesmo se vc quiser guardar um objeto no localstorage, só aceita texto - então vc tem que transformar o objeto em texto antes de guardar
function salvarNoStorage(chave, lista) {
	localStorage.setItem(chave, JSON.stringify(lista));
}

// traz seja oq tiver salvo, se não tiver nada traz UNDEFINED
function carregarDoStorage(chave) {
	const texto = localStorage.getItem(chave);
	if (texto === null) {
		return undefined;
	}

	// tratativa de erro com o try catch
	try {
		return JSON.parse(texto);
	} catch (erro) {
		console.log("não deu pra ler o " + chave + " do localStorage, começando do zero");
		return undefined;
	}
}
