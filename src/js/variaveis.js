// VARIAVEIS
// o que o site inteiro precisa saber: quem tá selecionado e as listas fixas. carrega primeiro, porque os outros arquivos usam tudo isso

let agenteSelecionado = undefined; // o agente que tá aberto na ficha
let campanhaSelecionada = undefined; // a campanha que vc clicou na lista
let campanhaEmEdicao = undefined; // undefined = criando uma nova; senão é a campanha sendo editada
let passoAtual = 1; // em qual passo do wizard vc está

// cada perícia aponta pro atributo que afeta ela
const PERICIAS = {
	Acrobacia: "AGI",
	Adestramento: "PRE",
	Artes: "PRE",
	Atletismo: "FOR",
	Atualidades: "INT",
	Ciências: "INT",
	Crime: "AGI",
	Diplomacia: "PRE",
	Enganação: "PRE",
	Fortitude: "VIG",
	Furtividade: "AGI",
	Iniciativa: "AGI",
	Intimidação: "PRE",
	Intuição: "PRE",
	Investigação: "INT",
	Luta: "FOR",
	Medicina: "INT",
	Ocultismo: "INT",
	Percepção: "PRE",
	Pilotagem: "AGI",
	Pontaria: "AGI",
	Profissão: "INT",
	Reflexos: "AGI",
	Religião: "PRE",
	Sobrevivência: "INT",
	Tática: "INT",
	Tecnologia: "INT",
	Vontade: "PRE",
};

// placeholder já nas cores do tema (fundo escuro, texto roxo)
const IMAGEM_PADRAO_CAMPANHA = "https://placehold.co/800x300/1c1920/b46bff?text=Campanha";
