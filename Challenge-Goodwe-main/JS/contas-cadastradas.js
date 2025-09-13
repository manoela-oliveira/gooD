function carregarContas() {
    const contas = JSON.parse(localStorage.getItem('contas')) || [];
    const container = document.getElementById('listaContas');
    container.innerHTML = '';

    if (contas.length === 0) {
        container.innerHTML = "<p>Nenhuma conta cadastrada ainda.</p>";
        return;
    }

    contas.forEach((conta, index) => {
        const div = document.createElement('div');
        div.className = "conta";
        div.innerHTML = `
            <strong>Nome:</strong> ${conta.nome}<br>
            <strong>Email:</strong> ${conta.email}<br>
            <strong>Senha:</strong> ${conta.senha}
            <button class="btn-excluir" onclick="excluirConta(${index})">Excluir</button>
        `;
        container.appendChild(div);
    });
}

function excluirConta(index) {
    let contas = JSON.parse(localStorage.getItem('contas')) || [];
    contas.splice(index, 1);
    localStorage.setItem('contas', JSON.stringify(contas));
    carregarContas();
}

carregarContas();