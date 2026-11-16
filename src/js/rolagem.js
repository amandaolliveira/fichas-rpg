// ROLAGEM DE DADOS
// a lista de perícias e o resultado da rolagem. a parte 3D quem faz é o dados3d.js

// usa o template para criar todas perícias na lista de dados
const modeloPericia = document.getElementById("modelo-pericia");

for (const nome in PERICIAS) {
	const atributo = PERICIAS[nome];
	const pericia = modeloPericia.content.firstElementChild.cloneNode(true);

	pericia.dataset.pericia = nome;
	pericia.querySelector("span").textContent = nome;

	document.getElementById("dados-" + atributo).append(pericia);
}

const somDado = new Audio("sound/dado_rolando.mp3");

function rolarD20() {
	return Math.floor(Math.random() * 20) + 1;
}

// quantos d20 rolar: um por ponto no atributo da perícia. sem agente selecionado rola 1.
// atributo 0 é a regra do Ordem Paranormal: rola 2 e fica com o MENOR
function montarRolagem(pericia) {
	const atributo = PERICIAS[pericia];
	let pontos = 1;
	if (agenteSelecionado) {
		pontos = agenteSelecionado.atributos[atributo];
	}

	const quantidade = Math.max(pontos, 1) + (pontos === 0 ? 1 : 0);
	const valores = [];
	for (let i = 0; i < quantidade; i++) {
		valores.push(rolarD20());
	}

	let resultado;
	if (pontos === 0) {
		resultado = Math.min(...valores);
	} else {
		resultado = Math.max(...valores);
	}

	return { atributo: atributo, pontos: pontos, valores: valores, resultado: resultado };
}

// a linha com cada dado que caiu; o que valeu fica marcado (só o primeiro, se tiver repetido)
function mostrarValoresDosDados(lista, rolagem) {
	lista.replaceChildren();
	let jaMarcou = false;
	for (const valor of rolagem.valores) {
		const item = document.createElement("li");
		item.textContent = valor;
		if (valor === rolagem.resultado && !jaMarcou) {
			item.classList.add("valeu");
			jaMarcou = true;
		}
		lista.append(item);
	}
}

function mostrarResultado(pericia, rolagem) {
	const dialog = document.getElementById("resultado-rolagem");
	dialog.querySelector(".resultado-pericia").textContent = pericia;
	dialog.querySelector(".resultado-valor").textContent = rolagem.resultado;

	const regra = rolagem.valores.length + "d20, fica o " + (rolagem.pontos === 0 ? "menor" : "maior");
	dialog.querySelector(".resultado-regra").textContent = rolagem.atributo + " " + rolagem.pontos + " · " + regra;
	mostrarValoresDosDados(dialog.querySelector(".resultado-dados"), rolagem);
	dialog.classList.add("rolando"); // esconde o resultado enquanto o dado rola
	dialog.showModal();

	rolarDados3D(dialog.querySelector(".mesa-3d"), rolagem.valores, function () {
		dialog.classList.remove("rolando");
	});

	somDado.currentTime = 0;
	somDado.play();
}

// um clique só pra lista toda, ao invés de um por dado. o closest sobe no html até achar o .dado que foi clicado
document.querySelector(".categorias-pericias").addEventListener("click", function (evento) {
	if (evento.target.tagName !== "IMG") {
		return;
	}

	const dado = evento.target.closest(".dado");
	mostrarResultado(dado.dataset.pericia, montarRolagem(dado.dataset.pericia));
});

document.getElementById("resultado-rolagem").addEventListener("click", function () {
	const dialog = document.getElementById("resultado-rolagem");
	if (dialog.classList.contains("fechando")) {
		return;
	}

	dialog.classList.add("fechando");
	// o once faz o evento rodar uma vez só e se apagar sozinho, senão ia acumulando a cada clique
	dialog.addEventListener(
		"animationend",
		function () {
			dialog.classList.remove("fechando");
			dialog.close();
		},
		{ once: true },
	);
});
