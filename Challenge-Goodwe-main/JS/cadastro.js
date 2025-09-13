document.getElementById('formCadastro').addEventListener('submit', function(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;

    if (senha !== confirmarSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    // NOVO: Adiciona a propriedade "dispositivos" ao criar a conta
    const novaConta = { nome, email, senha, dispositivos: [] };

    let contas = JSON.parse(localStorage.getItem('contas')) || [];

    // Verifica se o email já existe
    const emailExistente = contas.some(conta => conta.email === email);
    if (emailExistente) {
        alert("Este e-mail já está cadastrado!");
        return;
    }

    contas.push(novaConta);
    localStorage.setItem('contas', JSON.stringify(contas));

    alert("Conta criada com sucesso! Por favor, faça o login.");
    window.location.href = "Logar.html";
});