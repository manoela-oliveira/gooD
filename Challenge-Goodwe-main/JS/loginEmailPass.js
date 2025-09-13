// START OF FILE js/loginEmailPass.js (Antigo logar.js)
document.querySelector('.login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const senha = document.getElementById('password').value;
    const contas = JSON.parse(localStorage.getItem('contas')) || [];
    const contaEncontrada = contas.find(conta => conta.email === email && conta.senha === senha);

    if (contaEncontrada) {
        sessionStorage.setItem('usuarioLogadoEmail', contaEncontrada.email);
        window.location.href = "index.html";
    } else {
        alert("Email ou senha incorretos!");
    }
});
// END OF FILE js/loginEmailPass.js