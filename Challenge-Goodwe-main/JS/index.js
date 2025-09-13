// ===================================================================================
// SEÇÃO 1: CONFIGURAÇÃO INICIAL E AUTENTICAÇÃO
// ===================================================================================

const usuarioLogadoEmail = sessionStorage.getItem('usuarioLogadoEmail');
if (!usuarioLogadoEmail) {
    window.location.href = 'Logar.html';
}

let dispositivos = [];
let contas = JSON.parse(localStorage.getItem('contas')) || [];
const usuarioAtual = contas.find(c => c.email === usuarioLogadoEmail);

// Mapeamento de todos os elementos do HTML para variáveis JavaScript
const lista = document.getElementById("listaDispositivos"); // Agora é o container do grid de dispositivos

const modalCadastro = document.getElementById('modalDispositivo');
const formCadastro = document.getElementById("formDispositivo");
// O btnAbrirModalCadastro agora é o card "ADICIONAR NOVO DISPOSITIVO"
const btnFecharModalCadastro = modalCadastro.querySelector('.close-btn');

const modalEdicao = document.getElementById('modalEditarDispositivo');
const formEdicao = document.getElementById("formEditarDispositivo");
const btnFecharModalEdicao = modalEdicao.querySelector('.close-btn-edit');
const btnExcluirDispositivo = document.getElementById('btnExcluirDispositivo');


// ===================================================================================
// SEÇÃO 2: PERSISTÊNCIA DE DATOS (localStorage)
// ===================================================================================

/**
 * Salva os dados do usuário (dispositivos) no localStorage.
 */
function salvarDadosDoUsuario() {
    if (usuarioAtual) {
        usuarioAtual.dispositivos = dispositivos;
        localStorage.setItem('contas', JSON.stringify(contas));
    }
}

/**
 * Carrega os dados do usuário do localStorage quando a página é iniciada.
 */
function carregarDadosDoUsuario() {
    if (usuarioAtual) {
        if (!usuarioAtual.dispositivos || !Array.isArray(usuarioAtual.dispositivos)) {
            usuarioAtual.dispositivos = [];
        }
        dispositivos = usuarioAtual.dispositivos;
        
        atualizarLista();
    }
}

// ===================================================================================
// SEÇÃO 4: FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (UI)
// ===================================================================================

/** Abre o modal de edição preenchido com os dados do dispositivo selecionado. */
function abrirModalEdicao(id) { 
    const dispositivo = dispositivos.find(d => d.id === id); 
    if (dispositivo) { 
        document.getElementById('dispositivoIdEdit').value = dispositivo.id; 
        document.getElementById('nomeDispositivoEdit').value = dispositivo.nome; 
        document.getElementById('importanciaDispositivoEdit').value = dispositivo.importancia; 
        document.getElementById('consumoDispositivoEdit').value = dispositivo.consumo; 
        modalEdicao.style.display = 'flex'; 
    } 
}

/** Alterna o estado (ligado/desligado) de um dispositivo. */
function alternarEstado(id) { 
    const index = dispositivos.findIndex(d => d.id === id); 
    if (index !== -1) { 
        dispositivos[index].ligado = !dispositivos[index].ligado; 
        salvarDadosDoUsuario();
        
        // Atualiza apenas o card específico para um feedback mais rápido
        const card = document.querySelector(`.device-card[data-id="${id}"]`);
        if (card) {
            const statusSpan = card.querySelector('.device-status-toggle span');
            statusSpan.textContent = dispositivos[index].ligado ? 'ON' : 'OFF';
            statusSpan.className = dispositivos[index].ligado ? 'on' : 'off';
        }
    } 
}

/** Recria a lista de dispositivos no HTML com base nos dados atuais (AGORA COM CARDS). */
function atualizarLista() { 
    lista.innerHTML = ""; // Limpa o grid de dispositivos
    dispositivos.sort((a, b) => a.importancia - b.importancia); 

    dispositivos.forEach(d => { 
        const card = document.createElement("div"); 
        card.className = "device-card"; 
        card.dataset.id = d.id; // Adiciona um data-id para fácil referência
        card.innerHTML = `
            <div class="device-icon">
                <img src="${getDeviceIcon(d.nome)}" alt="${d.nome}">
            </div>
            <div class="device-details">
                <h3>${d.nome}</h3>
                <p>${getDeviceDescription(d.nome, d.consumo)}</p>
                <div class="device-status-toggle">
                    <span class="${d.ligado ? 'on' : 'off'}">${d.ligado ? 'ON' : 'OFF'}</span>
                    <label class="switch">
                        <input type="checkbox" onchange="alternarEstado(${d.id})" ${d.ligado ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `; 
        card.addEventListener('click', (e) => {
            // Evita que clicar no switch também abra o modal de edição
            if (!e.target.closest('.switch')) {
                abrirModalEdicao(d.id);
            }
        });
        lista.appendChild(card); 
    }); 

    // Adiciona o card "ADICIONAR NOVO DISPOSITIVO" por último
    const addNewCard = document.createElement("div");
    addNewCard.className = "device-card add-new-device";
    addNewCard.id = "btnAbrirModal"; // Mantém o ID para compatibilidade com o listener existente
    addNewCard.innerHTML = `
        <div class="add-icon">+</div>
        <h3>ADICIONAR NOVO DISPOSITIVO</h3>
    `;
    addNewCard.addEventListener('click', () => modalCadastro.style.display = 'flex'); // Re-attach listener
    lista.appendChild(addNewCard);
}

// Helper para obter ícones (pode ser expandido)
function getDeviceIcon(deviceName) {
    const lowerName = deviceName.toLowerCase();
    if (lowerName.includes('ar condicionado')) return 'https://i.imgur.com/Q2d1X2A.png'; // Exemplo de ícone
    if (lowerName.includes('cooktop') || lowerName.includes('fogão')) return 'https://i.imgur.com/R3tJpYm.png'; // Exemplo de ícone
    if (lowerName.includes('chuveiro')) return 'https://i.imgur.com/S4d1C2D.png'; // Exemplo de ícone
    if (lowerName.includes('tv')) return 'https://i.imgur.com/T5e2D3E.png';
    if (lowerName.includes('geladeira')) return 'https://i.imgur.com/U6f3E4F.png';
    if (lowerName.includes('luz') || lowerName.includes('lâmpada')) return 'https://i.imgur.com/V7g4F5G.png';
    return 'https://i.imgur.com/W8h5G6H.png'; // Ícone padrão
}

// Helper para obter descrição (pode ser aprimorado com mais detalhes)
function getDeviceDescription(deviceName, consumption) {
    const lowerName = deviceName.toLowerCase();
    if (lowerName.includes('ar condicionado')) return `9000 BTU 220V | ${consumption.toFixed(2)} kWh`;
    if (lowerName.includes('cooktop')) return `4 bocas 127V | ${consumption.toFixed(2)} kWh`;
    if (lowerName.includes('chuveiro')) return `220V | ${consumption.toFixed(2)} kWh`;
    return `${consumption.toFixed(2)} kWh`;
}


// ===================================================================================
// SEÇÃO 5: EVENT LISTENERS (Ações do Usuário)
// ===================================================================================

// Controles para abrir e fechar os modais (pop-ups)
btnFecharModalCadastro.addEventListener('click', () => {
    modalCadastro.style.display = 'none';
    formCadastro.reset(); // Limpa o formulário ao fechar
});
btnFecharModalEdicao.addEventListener('click', () => modalEdicao.style.display = 'none');

window.addEventListener('click', (event) => { 
    if (event.target === modalCadastro) {
        modalCadastro.style.display = 'none';
        formCadastro.reset(); // Limpa o formulário ao clicar fora
    }
    if (event.target === modalEdicao) modalEdicao.style.display = 'none'; 
});

// Lida com o cadastro de um novo dispositivo
formCadastro.addEventListener("submit", (e) => { 
    e.preventDefault(); 
    const dispositivo = { 
        id: Date.now(), 
        nome: document.getElementById("nomeDispositivo").value.trim(), 
        importancia: parseInt(document.getElementById("importanciaDispositivo").value), 
        consumo: parseFloat(document.getElementById("consumoDispositivo").value), 
        ligado: true 
    }; 
    dispositivos.push(dispositivo); 
    salvarDadosDoUsuario(); 
    atualizarLista(); 
    formCadastro.reset(); 
    modalCadastro.style.display = 'none'; 
});

// Lida com a edição de um dispositivo existente
formEdicao.addEventListener("submit", (e) => { 
    e.preventDefault(); 
    const id = document.getElementById('dispositivoIdEdit').value; 
    const index = dispositivos.findIndex(d => d.id == id); 
    if (index !== -1) { 
        dispositivos[index].nome = document.getElementById('nomeDispositivoEdit').value; 
        dispositivos[index].importancia = parseInt(document.getElementById('importanciaDispositivoEdit').value); 
        dispositivos[index].consumo = parseFloat(document.getElementById('consumoDispositivoEdit').value); 
    } 
    salvarDadosDoUsuario(); 
    atualizarLista(); 
    modalEdicao.style.display = 'none'; 
});

// Lida com a exclusão de um dispositivo
btnExcluirDispositivo.addEventListener('click', () => { 
    const id = document.getElementById('dispositivoIdEdit').value; 
    if (confirm('Tem certeza que deseja excluir este dispositivo?')) { 
        dispositivos = dispositivos.filter(d => d.id != id); 
        salvarDadosDoUsuario(); 
        atualizarLista(); 
        modalEdicao.style.display = 'none'; 
    } 
});

// ===================================================================================
// SEÇÃO 6: INICIALIZAÇÃO DA PÁGINA
// ===================================================================================
    
carregarDadosDoUsuario();

// Adicionar event listeners para a navegação inferior
document.querySelector('.bottom-nav').addEventListener('click', (e) => {
    e.preventDefault();
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        // Remove 'active' de todos
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
        // Adiciona 'active' ao clicado
        navItem.classList.add('active');

        // Lógica de redirecionamento baseada no item clicado
        // Usamos o atributo data-page para o redirecionamento
        const targetPage = navItem.dataset.page;
        if (targetPage && targetPage !== 'index.html') { // Não redireciona se já estiver na página 'Início'
             window.location.href = targetPage; 
        } else if (!targetPage) {
            const spanText = navItem.querySelector('span').textContent;
            switch (spanText) {
                case 'Dicas':
                    alert('Funcionalidade de Dicas em desenvolvimento!');
                    break;
                case 'Perfil':
                    alert('Funcionalidade de Perfil em desenvolvimento!');
                    break;
                // 'Início' e 'Gastos' já têm data-page e redirecionam
                // 'Mais' já tem data-page e redireciona para chatbot
            }
        }
    }
});