// ===================================================================================
// CHATBOT SCRIPT - Chamada Direta à API Gemini (Uso Local Apenas)
// ===================================================================================

// --- ATENÇÃO DE SEGURANÇA ---
// Sua API Key do Google Gemini está exposta neste arquivo JavaScript.
// ISSO SÓ É ACEITÁVEL SE O PROGRAMA PERMANECER LOCAL NO SEU COMPUTADOR.
// NUNCA DEPLOY ISSO EM UM AMBIENTE PÚBLICO NA WEB!
// PARA DEPLOY PÚBLICO, É IMPRESCINDÍVEL USAR UM BACKEND PROXY.
const GEMINI_API_KEY = 'SUA_CHAVE'; // <<< SUBSTITUA PELA SUA CHAVE REAL

// --- Configuração Inicial ---
const usuarioLogadoEmail = sessionStorage.getItem('usuarioLogadoEmail');
if (!usuarioLogadoEmail) {
    window.location.href = 'Logar.html';
}

let contas = JSON.parse(localStorage.getItem('contas')) || [];
const usuarioAtual = contas.find(c => c.email === usuarioLogadoEmail);

if (!usuarioAtual || !usuarioAtual.dispositivos) {
    if (usuarioAtual) {
        usuarioAtual.dispositivos = [];
    } else {
        window.location.href = 'Logar.html';
    }
}
let dispositivos = usuarioAtual.dispositivos; // Referência aos dispositivos do usuário logado

// Elementos do DOM: Obtenção de referências para os elementos HTML interativos
const chatMessagesEl = document.getElementById('chatMessages');
const chatInputEl = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const btnVoltar = document.getElementById('btnVoltar');
const relogioChatbotEl = document.getElementById('relogio-chatbot');


// --- Funções de UI ---
/**
 * Adiciona uma mensagem ao chat.
 * @param {string} text O texto da mensagem.
 * @param {string} role 'user' ou 'bot'. (No CSS, as classes são user-message e bot-message)
 * @param {boolean} isMarkdown Se a mensagem deve ser processada como Markdown.
 */
function addMessage(text, role, isMarkdown = false) {
    const messageDiv = document.createElement('div');
    // Adiciona a classe no formato 'role-message' para corresponder ao CSS
    messageDiv.classList.add('message', `${role}-message`); 

    if (isMarkdown) {
        // Converte Markdown para HTML usando marked e sanitiza para segurança com DOMPurify
        const html = marked.parse(text);
        messageDiv.innerHTML = DOMPurify.sanitize(html);
    } else {
        messageDiv.textContent = text;
    }

    chatMessagesEl.appendChild(messageDiv);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; // Rola para o final da conversa
}

/**
 * Atualiza o conteúdo de uma mensagem existente no chat.
 * @param {HTMLElement} messageDiv O elemento DIV da mensagem a ser atualizada.
 * @param {string} newText O novo texto da mensagem.
 * @param {boolean} isMarkdown Se o novo texto deve ser processado como Markdown.
 */
function updateMessage(messageDiv, newText, isMarkdown = false) {
    if (isMarkdown) {
        const html = marked.parse(newText);
        messageDiv.innerHTML = DOMPurify.sanitize(html);
    } else {
        messageDiv.textContent = newText;
    }
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; // Rola para o final
}

/**
 * Atualiza o display do relógio no cabeçalho do chatbot.
 */
function atualizarRelogio() {
    relogioChatbotEl.textContent = new Date().toLocaleTimeString('pt-BR');
}
setInterval(atualizarRelogio, 1000); // Inicia a atualização do relógio a cada segundo

// --- Persistência de Dados ---
/**
 * Salva o estado atual dos dispositivos do usuário logado no localStorage.
 * Garante que as mudanças feitas via chatbot sejam persistidas.
 */
function salvarDadosDoUsuario() {
    if (usuarioAtual) {
        usuarioAtual.dispositivos = dispositivos;
        localStorage.setItem('contas', JSON.stringify(contas));
    }
}

// --- Lógica do Chatbot ---

/**
 * Processa a mensagem do usuário, priorizando comandos locais e, se não houver,
 * chama a API Gemini diretamente.
 * @param {string} userMessage A mensagem digitada pelo usuário.
 * @returns {Promise<string>} A resposta do bot (texto).
 */
async function getBotResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();
    let localResponse = null; // Variável para armazenar a resposta se for um comando local.

    // === COMANDOS LOCAIS (prioridade 1) ===
    // Estes comandos são processados diretamente no frontend, interagindo com os dados da aplicação.

    // 1. Perguntas sobre o aplicativo
    if (lowerCaseMessage.includes('aplicativo') || lowerCaseMessage.includes('app') || lowerCaseMessage.includes('funciona')) {
        localResponse = "Este aplicativo permite que você gerencie seus dispositivos de energia, visualize o consumo total e monitore o status da sua bateria. Você pode cadastrar, editar e desligar dispositivos, além de otimizar o consumo.";
    }
    // 2. Perguntas sobre produtos GoodWe (Placeholder - resposta genérica)
    else if (lowerCaseMessage.includes('goodwe') || lowerCaseMessage.includes('inversor') || lowerCaseMessage.includes('bateria goodwe')) {
        localResponse = "Os produtos GoodWe são soluções avançadas para energia solar, incluindo inversores e sistemas de armazenamento de bateria. Eles são conhecidos pela eficiência e confiabilidade. Para informações detalhadas sobre um modelo específico, consulte o site oficial ou um especialista. (Esta é uma resposta genérica, em um sistema real, a IA buscaria em uma base de conhecimento GoodWe).";
    }
    // 3. Cadastrar dispositivos (lógica para extrair nome, importância, consumo e adicionar)
    else if (lowerCaseMessage.includes('cadastrar dispositivo') || lowerCaseMessage.includes('adicionar dispositivo')) {
        const parts = lowerCaseMessage.split(' ');
        const nomeIndex = parts.indexOf('nome');
        const importanciaIndex = parts.indexOf('importancia');
        const consumoIndex = parts.indexOf('consumo');

        if (nomeIndex !== -1 && importanciaIndex !== -1 && consumoIndex !== -1 &&
            parts[nomeIndex + 1] && parts[importanciaIndex + 1] && parts[consumoIndex + 1]) {

            const nome = parts[nomeIndex + 1];
            const importancia = parseInt(parts[importanciaIndex + 1]);
            const consumo = parseFloat(parts[consumoIndex + 1]);

            if (nome && !isNaN(importancia) && importancia >= 1 && importancia <= 3 && !isNaN(consumo) && consumo > 0) {
                const novoDispositivo = {
                    id: Date.now(),
                    nome: nome.replace(/_/g, ' '),
                    importancia: importancia,
                    consumo: consumo,
                    ligado: true
                };
                // CORREÇÃO: Usando 'novoDispositivo' em vez de 'novoDisitivo'
                dispositivos.push(novoDispositivo); 
                salvarDadosDoUsuario();
                localResponse = `Dispositivo '${novoDispositivo.nome}' com importância ${novoDispositivo.importancia} e consumo ${novoDispositivo.consumo} kWh cadastrado com sucesso!`;
            } else {
                localResponse = "Para cadastrar um dispositivo, preciso do nome, importância (1-3) e consumo (kWh). Ex: 'cadastrar dispositivo nome_da_tv importancia 2 consumo 0.1'.";
            }
        } else {
            localResponse = "Para cadastrar um dispositivo, preciso do nome, importância (1-3) e consumo (kWh). Ex: 'cadastrar dispositivo nome_da_tv importancia 2 consumo 0.1'.";
        }
    }
    // 4. Desligar dispositivos (lógica para encontrar e desligar um dispositivo pelo nome)
    else if (lowerCaseMessage.includes('desligar dispositivo') || lowerCaseMessage.includes('desligar o') || lowerCaseMessage.includes('apagar o')) {
        const parts = lowerCaseMessage.split(' ');
        const keywordIndex = parts.indexOf('desligar') !== -1 ? parts.indexOf('desligar') : parts.indexOf('apagar');
        
        let deviceNameToToggle = '';
        if (keywordIndex !== -1 && parts.length > keywordIndex + 1) {
            deviceNameToToggle = parts.slice(keywordIndex + 1).join(' ').trim();
            deviceNameToToggle = deviceNameToToggle.replace(/^(o|a|os|as)\s+/, '').replace(/^(luz|ar|tv|geladeira)\s+/, '');
        }

        if (deviceNameToToggle) {
            const foundDevice = dispositivos.find(d => d.nome.toLowerCase().includes(deviceNameToToggle) && d.ligado);
            
            if (foundDevice) {
                foundDevice.ligado = false;
                salvarDadosDoUsuario();
                localResponse = `Dispositivo '${foundDevice.nome}' foi desligado com sucesso.`;
            } else {
                localResponse = `Não encontrei um dispositivo ligado chamado '${deviceNameToToggle}'. Você pode listar os dispositivos para verificar os nomes?`;
            }
        } else {
            localResponse = "Para desligar um dispositivo, me diga o nome dele. Ex: 'desligar a TV' ou 'desligar o ar condicionado'.";
        }
    }
    // 5. Status de energia da casa (lógica para exibir consumo e status da bateria)
    else if (lowerCaseMessage.includes('status energia') || lowerCaseMessage.includes('consumo atual') || lowerCaseMessage.includes('nivel bateria')) {
        const consumoTotalAtual = dispositivos.filter(d => d.ligado).reduce((acc, d) => acc + d.consumo, 0);
        
        const usuarioDadosEnergia = contas.find(c => c.email === usuarioLogadoEmail);
        let nivelBateria = usuarioDadosEnergia?.nivelBateriaKWh || 0;
        let maxBateria = usuarioDadosEnergia?.maxBateriaKWh || 3000;
        let modoOperacaoAtual = usuarioDadosEnergia?.modoOperacao || 'concessionaria';
        let porcentagemBateria = (nivelBateria / maxBateria) * 100;

        localResponse = `Seu consumo atual é de ${consumoTotalAtual.toFixed(2)} kWh.<br>`;
        localResponse += `Sua bateria está em ${porcentagemBateria.toFixed(0)}% (${nivelBateria.toFixed(0)} kWh de ${maxBateria} kWh).<br>`;
        localResponse += `O modo de operação atual é **${modoOperacaoAtual}**.`; // Exemplo de uso de Markdown
    }
    // 6. Listar dispositivos (lógica para listar todos os dispositivos do usuário)
    else if (lowerCaseMessage.includes('listar dispositivos') || lowerCaseMessage.includes('quais dispositivos tenho')) {
        if (dispositivos.length === 0) {
            localResponse = "Você não tem nenhum dispositivo cadastrado.";
        } else {
            localResponse = "Seus dispositivos cadastrados:\n";
            dispositivos.forEach(d => {
                localResponse += `- **${d.nome}** (Importância: ${d.importancia}, Consumo: ${d.consumo} kWh) - _${d.ligado ? 'Ligado' : 'Desligado'}_\n`;
            });
            // `marked.parse` converterá \n para <br> no HTML
        }
    }
    // 7. Ligar dispositivo (lógica para encontrar e ligar um dispositivo pelo nome)
    else if (lowerCaseMessage.includes('ligar dispositivo') || lowerCaseMessage.includes('ligar o')) {
        const parts = lowerCaseMessage.split(' ');
        const keywordIndex = parts.indexOf('ligar');
        let deviceNameToToggle = '';
        if (keywordIndex !== -1 && parts.length > keywordIndex + 1) {
            deviceNameToToggle = parts.slice(keywordIndex + 1).join(' ').trim();
            deviceNameToToggle = deviceNameToToggle.replace(/^(o|a|os|as)\s+/, '');
        }

        if (deviceNameToToggle) {
            const foundDevice = dispositivos.find(d => d.nome.toLowerCase().includes(deviceNameToToggle) && !d.ligado);
            
            if (foundDevice) {
                foundDevice.ligado = true;
                salvarDadosDoUsuario();
                localResponse = `Dispositivo '${foundDevice.nome}' foi ligado com sucesso.`;
            } else {
                localResponse = `Não encontrei um dispositivo desligado chamado '${deviceNameToToggle}'. Ele já pode estar ligado ou o nome está incorreto.`;
            }
        } else {
            localResponse = "Para ligar um dispositivo, me diga o nome dele. Ex: 'ligar a TV'.";
        }
    }

    // === CHAMADA DIRETA À API GEMINI (prioridade 2) ===
    // Se nenhum comando local for correspondido, envia a mensagem para a API Gemini.
    if (localResponse !== null) {
        return localResponse; // Retorna a resposta local se um comando foi processado.
    } else {
        try {
            // Requisição POST para a API Gemini do Google
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: userMessage }] }], // Formato da mensagem para a API Gemini
                    generationConfig: { temperature: 0.9, topP: 0.8, maxOutputTokens: 500 } // Configurações da geração da resposta
                })
            });

            // Verifica se a requisição HTTP foi bem-sucedida
            if (!res.ok) {
                // Tenta ler o corpo do erro para uma mensagem mais específica
                const errorBody = await res.json().catch(() => ({ error: { message: res.statusText } }));
                throw new Error(`Erro na API Gemini (${res.status}): ${errorBody.error?.message || res.statusText}`);
            }

            const data = await res.json(); // Analisa a resposta JSON
            
            // LOG PARA DEBUG: Imprima a resposta completa no console para inspecionar a estrutura
            console.log("Resposta bruta da API Gemini:", data); 

            let reply = 'Não consegui gerar resposta.'; // Mensagem padrão de fallback

            // VERIFICAÇÃO APRIMORADA DA ESTRUTURA DA RESPOSTA
            if (data && data.error) {
                // Se a resposta contém um objeto de erro da API Gemini
                reply = `Erro da API Gemini: ${data.error.message || JSON.stringify(data.error)}`;
            } else if (data?.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
                // Se 'candidates' existe, é um array e tem pelo menos um elemento
                reply = data.candidates[0]?.content?.parts[0]?.text || reply;
            }
            // Se 'data' não tiver 'error' nem 'candidates' válidos, 'reply' permanece com o valor padrão.

            return reply;

        } catch (error) {
            console.error("Erro ao comunicar com a API Gemini diretamente:", error);
            // Mensagem de erro amigável para o usuário com detalhes para depuração
            return `Desculpe, tive um problema para me conectar com o assistente de IA. Detalhes: ${error.message}. Por favor, verifique sua API Key ou tente novamente mais tarde.`;
        }
    }
}

// --- Event Listeners ---
// Escuta o evento de 'click' no botão de enviar mensagem
sendMessageBtn.addEventListener('click', async (e) => {
    if (e) e.preventDefault(); // Impede o envio padrão do formulário, que recarregaria a página.

    const userMessage = chatInputEl.value.trim(); // Pega o texto do input, removendo espaços extras.
    if (!userMessage) return; // Não faz nada se a mensagem estiver vazia.

    addMessage(userMessage, 'user'); // Adiciona a mensagem do usuário ao chat.
    chatInputEl.value = ''; // Limpa o campo de input.

    // Adiciona uma mensagem de "digitando..." para feedback visual enquanto espera a resposta da IA.
    const typingMessageDiv = document.createElement('div');
    typingMessageDiv.classList.add('message', 'bot-message');
    typingMessageDiv.innerHTML = 'Digitando...'; // Texto simples, não Markdown aqui.
    chatMessagesEl.appendChild(typingMessageDiv);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

    // Desabilita o input e o botão para evitar que o usuário envie múltiplas mensagens rapidamente.
    chatInputEl.disabled = true;
    sendMessageBtn.disabled = true;

    try {
        const botResponse = await getBotResponse(userMessage); // Obtém a resposta do bot (local ou da IA).
        
        // Atualiza a mensagem de "digitando..." com a resposta real.
        // Assume que a resposta da IA (ou de comandos locais) pode conter Markdown.
        updateMessage(typingMessageDiv, botResponse, true); // Processa como Markdown.
    } catch (error) {
        console.error("Erro no processamento da resposta do bot:", error);
        // Em caso de erro, atualiza a mensagem com um aviso.
        updateMessage(typingMessageDiv, `Erro ao obter resposta: ${error.message}`, false);
    } finally {
        // Reabilita o input e o botão, independentemente do sucesso ou erro.
        chatInputEl.disabled = false;
        sendMessageBtn.disabled = false;
        chatInputEl.focus(); // Coloca o foco de volta no input para facilitar a próxima mensagem.
    }
});

// Escuta o evento de 'keypress' no campo de input para enviar a mensagem ao pressionar 'Enter'.
chatInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessageBtn.click(); // Simula um clique no botão de enviar.
    }
});

// Escuta o evento de 'click' no botão de voltar.
btnVoltar.addEventListener('click', () => {
    window.location.href = 'index.html'; // Redireciona para a página principal.
});
