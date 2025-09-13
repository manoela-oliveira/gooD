// ===================================================================================
// SEÇÃO 1: CONFIGURAÇÃO INICIAL E AUTENTICAÇÃO
// ===================================================================================

const usuarioLogadoEmail = sessionStorage.getItem('usuarioLogadoEmail');
if (!usuarioLogadoEmail) {
    window.location.href = 'Logar.html';
}

let dispositivos = []; // Ainda precisamos dos dispositivos para calcular o consumo
let contas = JSON.parse(localStorage.getItem('contas')) || [];
const usuarioAtual = contas.find(c => c.email === usuarioLogadoEmail);

// Variáveis para a simulação da bateria (MOVIDAS DO index.js)
const maxBateriaKWh = 3000;
let nivelBateriaKWh = 0;
let estadoBateria = 'carregando';
let modoOperacao = 'concessionaria';
let otimizacaoAutomaticaRealizada = false;

// Mapeamento de elementos DOM (MOVIDOS DO index.js)
const limiteOtimizacaoInputEl = document.getElementById('limiteOtimizacaoInput');
const btnSalvarLimiteEl = document.getElementById('btnSalvarLimite');
const bateriaInternaEl = document.getElementById('bateria-interna');
const bateriaPorcentagemEl = document.getElementById('bateria-porcentagem');
const btnMudarModoEl = document.getElementById('btnMudarModo');
const statusConsumo = document.getElementById("statusConsumo");
const btnVerificarConsumo = document.getElementById("btnVerificarConsumo");
const mensagemDiv = document.getElementById("mensagem");
const relogioStatusEl = document.getElementById('relogio-status');
const btnVoltarEl = document.getElementById('btnVoltar');


// ===================================================================================
// SEÇÃO 2: PERSISTÊNCIA DE DADOS (localStorage)
// ===================================================================================

/**
 * Salva os dados do usuário (dispositivos, bateria, otimização) no localStorage.
 * Agora gerencia os dados de bateria e otimização, e também os dispositivos.
 */
function salvarDadosDoUsuario() {
    if (usuarioAtual) {
        // Dispositivos são salvos aqui também para que as mudanças da bateria (desligar) sejam persistidas.
        usuarioAtual.dispositivos = dispositivos; 
        usuarioAtual.limiteOtimizacao = parseInt(limiteOtimizacaoInputEl.value);
        usuarioAtual.nivelBateriaKWh = nivelBateriaKWh;
        usuarioAtual.estadoBateria = estadoBateria;
        usuarioAtual.modoOperacao = modoOperacao;
        usuarioAtual.maxBateriaKWh = maxBateriaKWh; 

        localStorage.setItem('contas', JSON.stringify(contas));
    }
}

/**
 * Carrega os dados do usuário do localStorage quando a página é iniciada.
 * Agora gerencia os dados de bateria e otimização, e também os dispositivos.
 */
function carregarDadosDoUsuario() {
    if (usuarioAtual) {
        if (!usuarioAtual.dispositivos || !Array.isArray(usuarioAtual.dispositivos)) {
            usuarioAtual.dispositivos = [];
        }
        dispositivos = usuarioAtual.dispositivos;

        limiteOtimizacaoInputEl.value = usuarioAtual.limiteOtimizacao || 50;

        nivelBateriaKWh = usuarioAtual.nivelBateriaKWh !== undefined ? usuarioAtual.nivelBateriaKWh : 0;
        estadoBateria = usuarioAtual.estadoBateria || 'carregando';
        modoOperacao = usuarioAtual.modoOperacao || 'concessionaria';
        
        // Atualiza a interface com os dados carregados
        atualizarConsumoTotal();
        atualizarDisplayBateria();
        atualizarBotaoModo();
    }
}


// ===================================================================================
// SEÇÃO 3: SIMULAÇÃO DA BATERIA E OTIMIZAÇÃO AUTOMÁTICA (MOVIDAS DO index.js)
// ===================================================================================

/**
 * O "motor" da aplicação. Roda a cada 2 segundos para simular carga/descarga
 * e verificar se a otimização automática é necessária.
 */
function simularBateria() {
    // Para obter o consumo mais atualizado, precisamos garantir que `dispositivos` esteja sincronizado.
    // Uma forma seria recarregar `dispositivos` do localStorage aqui, ou garantir que `index.js` salve-os frequentemente.
    // Para simplificar, assumimos que `dispositivos` local está razoavelmente atualizado.
    let contasAtualizadas = JSON.parse(localStorage.getItem('contas')) || [];
    const usuarioAtualizado = contasAtualizadas.find(c => c.email === usuarioLogadoEmail);
    if(usuarioAtualizado) {
        dispositivos = usuarioAtualizado.dispositivos; // Sincroniza dispositivos
    }

    const consumoAtual = dispositivos.filter(d => d.ligado).reduce((acc, d) => acc + d.consumo, 0);

    // Lógica de carga/descarga baseada no modo de operação
    if (modoOperacao === 'concessionaria') {
        if (nivelBateriaKWh < maxBateriaKWh) {
            nivelBateriaKWh += 50; // Taxa de carregamento fixa
            estadoBateria = 'carregando';
            if (nivelBateriaKWh >= maxBateriaKWh) {
                nivelBateriaKWh = maxBateriaKWh;
                estadoBateria = 'cheia';
            }
        } else {
            estadoBateria = 'cheia';
        }
    } else { // modoOperacao === 'bateria'
        if (nivelBateriaKWh > 0) {
            nivelBateriaKWh -= (consumoAtual / 2);
            estadoBateria = 'descarregando';
            if (nivelBateriaKWh <= 0) {
                nivelBateriaKWh = 0;
                estadoBateria = 'vazia';
                // Se a bateria acabar, desliga tudo
                dispositivos.forEach(d => d.ligado = false);
                salvarDadosDoUsuario(); // Salva dispositivos desligados
                mensagemDiv.textContent = "Bateria esgotada! Dispositivos desligados.";
                mensagemDiv.style.color = "#dc3545";
            }
        } else {
            estadoBateria = 'vazia';
        }
    }
    
    salvarDadosDoUsuario(); // Salva o estado da bateria a cada simulação
    atualizarDisplayBateria();
    atualizarConsumoTotal(); // Atualiza o consumo total aqui também

    // Lógica de verificação para otimização automática
    const porcentagemAtual = (nivelBateriaKWh / maxBateriaKWh) * 100;
    const limiteDefinido = parseInt(limiteOtimizacaoInputEl.value);

    if (modoOperacao === 'bateria' && porcentagemAtual < limiteDefinido) {
        if (!otimizacaoAutomaticaRealizada) {
            otimizarConsumo(false);
            otimizacaoAutomaticaRealizada = true;
        }
    } else if (porcentagemAtual >= limiteDefinido) {
        otimizacaoAutomaticaRealizada = false;
    }
}

/**
 * Função centralizada para desligar dispositivos em cascata de prioridade.
 * @param {boolean} manual - Indica se a chamada foi feita por um clique do usuário.
 */
function otimizarConsumo(manual = false) {
    let acoesRealizadas = [];
    let otimizacaoFeita = false;

    // Para obter o consumo mais atualizado, precisamos garantir que `dispositivos` esteja sincronizado.
    let contasAtualizadas = JSON.parse(localStorage.getItem('contas')) || [];
    const usuarioAtualizado = contasAtualizadas.find(c => c.email === usuarioLogadoEmail);
    if(usuarioAtualizado) {
        dispositivos = usuarioAtualizado.dispositivos; // Sincroniza dispositivos
    }

    // Itera sobre as prioridades, da menor (3) para a maior (1)
    for (const prioridade of [3, 2, 1]) {
        const paraDesligar = dispositivos.filter(d => d.importancia === prioridade && d.ligado);
        if (paraDesligar.length > 0) {
            paraDesligar.forEach(d => { d.ligado = false; });
            acoesRealizadas.push(`importância ${prioridade}`);
            otimizacaoFeita = true;
            break;
        }
    }
    
    if (otimizacaoFeita) {
        salvarDadosDoUsuario(); // Salva os dispositivos modificados
        // Se houver uma lista de dispositivos na página index.html, ela precisará ser atualizada.
        // Isso pode ser feito com um 'storage' event listener, ou simplesmente esperando a recarga da página.
        atualizarConsumoTotal();
        atualizarDisplayBateria(); // A bateria também é afetada.
        const prefixo = manual ? "Otimização Manual:" : "Otimização Automática:";
        mensagemDiv.textContent = `${prefixo} Dispositivos de ${acoesRealizadas.join(' e ')} foram desligados.`;
        mensagemDiv.style.color = "#ffc107";
    } else if (manual) {
        mensagemDiv.textContent = "Nenhum dispositivo de baixa prioridade para otimizar.";
        mensagemDiv.style.color = "#17a2b8";
    }
}


// ===================================================================================
// SEÇÃO 4: FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (UI) (MOVIDAS DO index.js)
// ===================================================================================

/** Atualiza o visual da barra de bateria (cor, largura e texto). */
function atualizarDisplayBateria() { 
    const porcentagem = (nivelBateriaKWh / maxBateriaKWh) * 100; 
    bateriaPorcentagemEl.textContent = `${Math.floor(porcentagem)}%`; 
    bateriaInternaEl.style.width = `${porcentagem}%`; 
    bateriaInternaEl.textContent = `${nivelBateriaKWh.toFixed(0)} kWh`; 
    bateriaInternaEl.className = 'bateria-interna'; 
    if (estadoBateria) { 
        bateriaInternaEl.classList.add(estadoBateria); 
    } 
}

/** Atualiza o texto e a cor do botão de modo de operação. */
function atualizarBotaoModo() { 
    if (modoOperacao === 'concessionaria') { 
        btnMudarModoEl.textContent = 'Mudar para Modo Bateria'; 
        btnMudarModoEl.className = 'concessionaria'; 
    } else { 
        btnMudarModoEl.textContent = 'Mudar para Concessionária'; 
        btnMudarModoEl.className = 'bateria'; 
    } 
}

/** Atualiza o relógio a cada segundo. */
function atualizarRelogioStatus() { 
    relogioStatusEl.textContent = new Date().toLocaleTimeString('pt-BR'); 
}

/** Calcula e exibe o consumo total dos dispositivos que estão ligados. */
function atualizarConsumoTotal() { 
    // Para obter o consumo mais atualizado, precisamos garantir que `dispositivos` esteja sincronizado.
    let contasAtualizadas = JSON.parse(localStorage.getItem('contas')) || [];
    const usuarioAtualizado = contasAtualizadas.find(c => c.email === usuarioLogadoEmail);
    if(usuarioAtualizado) {
        dispositivos = usuarioAtualizado.dispositivos; // Sincroniza dispositivos
    }
    if (!dispositivos) return; 
    const totalConsumo = dispositivos.filter(d => d.ligado).reduce((acc, d) => acc + d.consumo, 0); 
    statusConsumo.textContent = `Consumo atual dos dispositivos: ${totalConsumo.toFixed(2)} kWh`; 
}


// ===================================================================================
// SEÇÃO 5: EVENT LISTENERS (Ações do Usuário) (MOVIDOS DO index.js)
// ===================================================================================

// Salva o novo limite de otimização definido pelo usuário
btnSalvarLimiteEl.addEventListener('click', () => { 
    const novoLimite = parseInt(limiteOtimizacaoInputEl.value); 
    if (novoLimite >= 1 && novoLimite <= 100) { 
        salvarDadosDoUsuario(); 
        alert(`Limite para otimização automática salvo em ${novoLimite}%.`); 
    } else { 
        alert("Por favor, insira um valor entre 1 e 100."); 
    } 
});

// Otimização manual
btnVerificarConsumo.addEventListener("click", () => otimizarConsumo(true));

// Alterna entre os modos de operação (concessionária/bateria)
btnMudarModoEl.addEventListener('click', () => { 
    if (modoOperacao === 'concessionaria') { 
        if (nivelBateriaKWh <= 0) { 
            alert("Bateria vazia! Não é possível mudar para este modo."); 
            return; 
        } 
        modoOperacao = 'bateria'; 
    } else { 
        modoOperacao = 'concessionaria'; 
    } 
    salvarDadosDoUsuario(); 
    atualizarBotaoModo(); 
});

// Botão Voltar
btnVoltarEl.addEventListener('click', () => {
    window.location.href = 'index.html';
});


// ===================================================================================
// SEÇÃO 6: INICIALIZAÇÃO DA PÁGINA (MOVIDAS DO index.js)
// ===================================================================================

carregarDadosDoUsuario();
setInterval(simularBateria, 2000); // Inicia o "motor" da bateria
setInterval(atualizarRelogioStatus, 1000); // Inicia o relógio