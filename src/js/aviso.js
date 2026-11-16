// AVISOS
// as mensagens que aparecem no canto da tela (salvou, excluiu, deu erro...). usa o alert do bootstrap

// tipo pode ser "success", "danger", "warning" ou "info" (são as cores do bootstrap: alert-success, alert-danger...)
function mostrarAviso(texto, tipo) {
	if (!tipo) {
		tipo = "success";
	}

	const container = document.querySelector(".avisos");

	const aviso = document.createElement("div");
	aviso.className = "alert alert-" + tipo + " alert-dismissible fade show aviso";
	aviso.setAttribute("role", "alert");
	aviso.textContent = texto;

	// o X pra fechar. o data-bs-dismiss já faz o bootstrap fechar sozinho, não precisa de js pra isso
	const fechar = document.createElement("button");
	fechar.type = "button";
	fechar.className = "btn-close";
	fechar.setAttribute("data-bs-dismiss", "alert");
	fechar.setAttribute("aria-label", "Fechar");
	aviso.append(fechar);

	container.append(aviso);

	// some sozinho depois de 4 segundos (se a pessoa não fechou antes)
	setTimeout(function () {
		if (aviso.isConnected) {
			bootstrap.Alert.getOrCreateInstance(aviso).close();
		}
	}, 4000);
}
