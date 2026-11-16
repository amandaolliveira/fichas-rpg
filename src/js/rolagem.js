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

function mostrarResultado(pericia, valor) {
	const dialog = document.getElementById("resultado-rolagem");
	dialog.querySelector(".resultado-pericia").textContent = pericia;
	dialog.querySelector(".resultado-valor").textContent = valor;
	dialog.classList.add("rolando"); // esconde o resultado enquanto o dado rola
	dialog.showModal();

	rolarDado3D(dialog.querySelector(".mesa-3d"), valor, function () {
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
	mostrarResultado(dado.dataset.pericia, rolarD20());
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
