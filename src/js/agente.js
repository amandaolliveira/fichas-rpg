// cada perícia aponta pro atributo que afeta ela
const PERICIAS = {
	'Acrobacia': 'AGI',
	'Adestramento': 'PRE',
	'Artes': 'PRE',
	'Atletismo': 'FOR',
	'Atualidades': 'INT',
	'Ciências': 'INT',
	'Crime': 'AGI',
	'Diplomacia': 'PRE',
	'Enganação': 'PRE',
	'Fortitude': 'VIG',
	'Furtividade': 'AGI',
	'Iniciativa': 'AGI',
	'Intimidação': 'PRE',
	'Intuição': 'PRE',
	'Investigação': 'INT',
	'Luta': 'FOR',
	'Medicina': 'INT',
	'Ocultismo': 'INT',
	'Percepção': 'PRE',
	'Pilotagem': 'AGI',
	'Pontaria': 'AGI',
	'Profissão': 'INT',
	'Reflexos': 'AGI',
	'Religião': 'PRE',
	'Sobrevivência': 'INT',
	'Tática': 'INT',
	'Tecnologia': 'INT',
	'Vontade': 'PRE'
};

class Agente {
	constructor({ // passa um dictionary ao invés de parâmetros, assim se vc errar a ordem, não quebra
		id = crypto.randomUUID(),
		nomePersonagem = '',
		nomeJogador = '',
		descricao = '',
		atributos = {},
		pericias = {},
		vida = {},
		sanidade = {},
		esforco = {},
		defesa = 10
	} = {}) {
		this.id = id; // o id é gerado igual no java por UUID, assim não precisa ser incremental
		this.nomePersonagem = nomePersonagem;
		this.nomeJogador = nomeJogador;
		this.descricao = descricao;

		this.atributos = {
			FOR: 1,
			AGI: 1,
			INT: 1,
			PRE: 1,
			VIG: 1,
			...atributos // se vier uma lista de atributos preenchida, essa linha faz substituir pelos novos vindo nos parâmetros
		};

		this.pericias = { ...pericias };

		// Recursos que mudam durante a sessão: valor atual e máximo
		this.vida = { atual: 0, maximo: 0, ...vida };
		this.sanidade = { atual: 0, maximo: 0, ...sanidade };
		this.esforco = { atual: 0, maximo: 0, ...esforco };

		this.defesa = defesa;
	}

	// recria o personagem a partir do que tiver no localStorage
	static storageParaJSON(dados) {
		return new Agente(dados);
	}
}
