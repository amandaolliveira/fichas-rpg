// FUNÇÕES DE APOIO DAS CLASSES

// se o valor não veio, usa o padrão. não dá pra usar o || aqui porque o 0 é um valor válido (atributo 0 existe)
function valorOuPadrao(valor, padrao) {
	if (valor === undefined) {
		return padrao;
	}
	return valor;
}

// vida, sanidade e esforço têm sempre o mesmo formato: valor atual e máximo
function criarRecurso(recurso) {
	if (!recurso) {
		recurso = {};
	}
	return {
		atual: valorOuPadrao(recurso.atual, 0),
		maximo: valorOuPadrao(recurso.maximo, 0),
	};
}

// CLASSES
// os "moldes" do Agente e da Campanha. aqui só tem dado, nada mexe na tela

class Agente {
	// recebe um objeto só (tipo um dictionary) ao invés de vários parâmetros, assim se vc errar a ordem, não quebra
	constructor(dados = {}) {
		this.id = dados.id || crypto.randomUUID(); // o id é gerado igual no java por UUID, assim não precisa ser incremental
		this.nomePersonagem = dados.nomePersonagem || "";
		this.nomeJogador = dados.nomeJogador || "";
		this.descricao = dados.descricao || "";

		// todo atributo começa em 1, se vier preenchido usa o que veio
		const atributos = dados.atributos || {};
		this.atributos = {
			FOR: valorOuPadrao(atributos.FOR, 1),
			AGI: valorOuPadrao(atributos.AGI, 1),
			INT: valorOuPadrao(atributos.INT, 1),
			PRE: valorOuPadrao(atributos.PRE, 1),
			VIG: valorOuPadrao(atributos.VIG, 1),
		};

		this.pericias = dados.pericias || {};

		// Recursos que mudam durante a sessão: valor atual e máximo
		this.vida = criarRecurso(dados.vida);
		this.sanidade = criarRecurso(dados.sanidade);
		this.esforco = criarRecurso(dados.esforco);

		this.defesa = valorOuPadrao(dados.defesa, 10);
	}

	// recria o personagem a partir do que tiver no localStorage
	static storageParaJSON(dados) {
		return new Agente(dados);
	}
}

class Campanha {
	// mesmo esquema do Agente: um objeto só com os dados
	constructor(dados = {}) {
		this.id = dados.id || crypto.randomUUID();
		this.nome = dados.nome || "";
		this.descricao = dados.descricao || "";
		this.imagem = dados.imagem || IMAGEM_PADRAO_CAMPANHA; // se vier vazia, usa o placeholder
		this.mestre = dados.mestre || "";
		this.agentes = dados.agentes || []; // ids dos agentes que participam da campanha
		this.criadoEm = dados.criadoEm || Date.now();
	}

	// recria a campanha a partir do que tiver no localStorage
	static storageParaJSON(dados) {
		return new Campanha(dados);
	}
}
