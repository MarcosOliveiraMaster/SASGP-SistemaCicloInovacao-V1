// ============================================================================
// SISTEMA DE GERENCIAMENTO DE SOLUÇÕES SASGP
// ============================================================================
// Arquivo principal com todas as funcionalidades JavaScript
// ============================================================================

// Configurações globais do sistema
let currentSolutionId = null;      // ID da solução atual
let currentStep = 0;               // Step atual no formulário
let formData = {};                 // Dados do formulário
let recursosData = [];             // Dados da tabela de recursos
let pontuacaoData = {};            // Dados de pontuação (Kill Switch)
let canvasData = {};               // Dados do Canvas
let rightClickedSolutionId = null; // ID da solução clicada com botão direito

// Constantes do sistema
const totalSteps = 4; // Formulário + Recursos + KillSwitch + Canvas
const cores = ['laranja', 'azul', 'roxo']; // Cores dos cards
const iconsList = ['🤖','🦄','🧠','👩🏼‍🦰','👨🏼‍🦰','🏃🏼‍♀️','💪🏼','🎮','🏆','🧩','🛠️','📑','📊','🚀','🌎','🔥','💡'];

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

/**
 * Inicializa o sistema baseado na página atual
 * Detecta qual página está aberta e executa as funções apropriadas
 */
document.addEventListener('DOMContentLoaded', function() {
    const page = getCurrentPage();
    
    switch(page) {
        case 'index.html':
        case '':
            initIndexPage();
            break;
        case 'form-novo-projeto.html':
            initFormPage();
            break;
        case 'recursos.html':
            initRecursosPage();
            break;
        case 'killswitch.html':
            initKillSwitchPage();
            break;
        case 'canvas.html':
            initCanvasPage();
            break;
    }
    
    // Inicializa tooltips e elementos interativos
    initTooltips();
});

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Obtém o nome da página atual
 * @returns {string} Nome do arquivo HTML atual
 */
function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

/**
 * Gera um ID único para novas soluções
 * @returns {string} ID único baseado em timestamp e random
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Exibe um indicador de carregamento
 * @param {HTMLElement} element - Elemento onde mostrar o loading
 */
function showLoading(element) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

/**
 * Exibe uma mensagem de erro
 * @param {HTMLElement} element - Elemento onde mostrar o erro
 * @param {string} message - Mensagem de erro
 */
function showError(element, message) {
    element.innerHTML = `<p class="error">${message}</p>`;
}

// ============================================================================
// PÁGINA INICIAL (index.html) - MENU DE CONTEXTO
// ============================================================================

/**
 * Inicializa a página inicial
 */
function initIndexPage() {
    carregarSolucoes();
    setupContextMenuListeners();
}

/**
 * Configura os listeners para o menu de contexto (clique direito)
 */
function setupContextMenuListeners() {
    // Esconde o menu ao clicar fora
    document.addEventListener('click', function(e) {
        document.getElementById('contextMenu').style.display = 'none';
    });

    // Configura ações do menu de contexto
    document.getElementById('ctxRename').addEventListener('click', openRenamePopup);
    document.getElementById('ctxIcon').addEventListener('click', openIconPopup);
    document.getElementById('ctxDelete').addEventListener('click', openDeletePopup);

    // Configura ações dos popups
    setupPopupActions();
}

/**
 * Configura os botões e eventos dos popups
 */
function setupPopupActions() {
    // RENOMEAR - Configura botões do popup
    document.getElementById('btnCancelRename').addEventListener('click', () => closePopup('popupRename'));
    document.getElementById('btnSaveRename').addEventListener('click', async () => {
        const newName = document.getElementById('inputNewName').value;
        if (newName && rightClickedSolutionId) {
            await BancoDeDados.atualizarSolucao(rightClickedSolutionId, { nome: newName });
            closePopup('popupRename');
            carregarSolucoes(); // Recarrega o grid
        }
    });

    // ÍCONE - Configura botões do popup
    document.getElementById('btnCancelIcon').addEventListener('click', () => closePopup('popupIcon'));
    document.getElementById('btnSaveIcon').addEventListener('click', async () => {
        const selectedIcon = document.querySelector('.icon-option.selected');
        if (selectedIcon && rightClickedSolutionId) {
            await BancoDeDados.atualizarSolucao(rightClickedSolutionId, { icone: selectedIcon.textContent });
            closePopup('popupIcon');
            carregarSolucoes();
        }
    });

    // DELETAR - Configura botões do popup
    document.getElementById('btnCancelDelete').addEventListener('click', () => closePopup('popupDelete'));
    document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
        if (rightClickedSolutionId) {
            await BancoDeDados.excluirSolucao(rightClickedSolutionId);
            closePopup('popupDelete');
            carregarSolucoes();
        }
    });
}

/**
 * Abre popup para renomear solução
 */
function openRenamePopup() {
    document.getElementById('popupRename').style.display = 'flex';
    document.getElementById('inputNewName').value = '';
    document.getElementById('inputNewName').focus();
}

/**
 * Abre popup para escolher ícone
 */
function openIconPopup() {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = '';
    
    // Cria grid de 4 colunas com todos os ícones
    iconsList.forEach(icon => {
        const el = document.createElement('div');
        el.className = 'icon-option';
        el.textContent = icon;
        el.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
        });
        grid.appendChild(el);
    });
    
    // Seleciona o ícone padrão (lâmpada 💡)
    const defaultIcon = grid.querySelector('.icon-option:last-child'); // Último é a lâmpada
    if (defaultIcon) defaultIcon.classList.add('selected');

    document.getElementById('popupIcon').style.display = 'flex';
}

/**
 * Abre popup para confirmar exclusão
 */
function openDeletePopup() {
    document.getElementById('popupDelete').style.display = 'flex';
}

/**
 * Fecha um popup específico
 * @param {string} id - ID do popup a fechar
 */
function closePopup(id) {
    document.getElementById(id).style.display = 'none';
}

/**
 * Carrega soluções do Firebase
 */
async function carregarSolucoes() {
    const grid = document.getElementById('solutionsGrid');
    if (!grid) return;
    
    showLoading(grid);
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.listarSolucoes();
            
            if (resultado.success && resultado.data) {
                renderizarSolucoes(grid, resultado.data);
            } else {
                showError(grid, 'Erro ao carregar soluções.');
            }
        } else {
            // Modo demo - dados locais
            renderizarSolucoesDemo(grid);
        }
    } catch (error) {
        console.error('Erro ao carregar soluções:', error);
        showError(grid, 'Erro de conexão com o banco de dados.');
    }
}

/**
 * Renderiza soluções no grid
 * @param {HTMLElement} grid - Elemento grid container
 * @param {Array} solucoes - Array de soluções
 */
function renderizarSolucoes(grid, solucoes) {
    grid.innerHTML = '';
    
    // Renderiza cada solução
    solucoes.forEach((solucao, index) => {
        const cor = cores[index % 3];
        grid.appendChild(createSolutionCard(solucao, cor));
    });
    
    // Adiciona card para novo projeto
    grid.appendChild(createAddNewCard());
}

/**
 * Cria um card de solução
 * @param {Object} solucao - Dados da solução
 * @param {string} cor - Cor do card
 * @returns {HTMLElement} Elemento do card
 */
function createSolutionCard(solucao, cor) {
    const card = document.createElement('div');
    card.className = `solution-card ${cor}`;
    
    // Ícone padrão se não existir
    const icon = solucao.icone || '💡'; 
    
    card.innerHTML = `
        <div class="card-image">
            <div class="placeholder">${icon}</div>
        </div>
        <div class="card-title">${solucao.nome || 'Solução Digital'}</div>
    `;
    
    // Clique esquerdo: Abrir canvas da solução
    card.addEventListener('click', () => {
        localStorage.setItem('currentSolutionId', solucao.id || solucao.docId);
        window.location.href = `canvas.html?id=${solucao.id || solucao.docId}`;
    });

    // Clique direito: Mostrar menu de contexto
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Impede menu nativo do navegador
        
        rightClickedSolutionId = solucao.id || solucao.docId; // Salva ID
        
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'flex';
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
    });
    
    return card;
}

/**
 * Cria card para adicionar nova solução
 * @returns {HTMLElement} Card de adicionar
 */
function createAddNewCard() {
    const card = document.createElement('div');
    card.className = 'solution-card add-new-card';
    card.innerHTML = '+';
    card.addEventListener('click', () => {
        window.location.href = 'form-novo-projeto.html';
    });
    return card;
}

// ============================================================================
// PÁGINA DE FORMULÁRIO (form-novo-projeto.html)
// ============================================================================

/**
 * Inicializa a página do formulário
 */
function initFormPage() {
    loadFormData();
    setupFormNavigation();
    setupOptionCards();
}

/**
 * Carrega dados do formulário do localStorage
 */
function loadFormData() {
    const savedData = localStorage.getItem('formularioData');
    if (savedData) {
        formData = JSON.parse(savedData);
    }
}

/**
 * Configura navegação entre steps do formulário
 */
function setupFormNavigation() {
    showFormStep(0);
    
    document.querySelectorAll('.btn-avancar').forEach(btn => {
        btn.addEventListener('click', advanceStep);
    });
    
    document.querySelectorAll('.btn-voltar').forEach(btn => {
        btn.addEventListener('click', goBackStep);
    });
}

/**
 * Configura cards de opção (Edital, Processo, etc.)
 */
function setupOptionCards() {
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            const tipo = this.getAttribute('data-value') || this.textContent.trim();
            formData.tipoSolucao = tipo;
            saveFormData();
        });
    });
}

/**
 * Mostra um step específico do formulário
 * @param {number} stepIndex - Índice do step (0-3)
 */
function showFormStep(stepIndex) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    
    const currentStepElement = document.getElementById(`step${stepIndex}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
        currentStepElement.style.display = 'block';
        currentStep = stepIndex;
        updateProgressBar();
    }
}

/**
 * Avança para o próximo step
 */
function advanceStep() {
    if (currentStep < totalSteps - 1) {
        saveCurrentStepData();
        
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            showFormStep(currentStep + 1);
            currentElement.style.animation = '';
        }, 300);
    } else {
        saveCurrentStepData();
        window.location.href = 'recursos.html';
    }
}

/**
 * Volta para o step anterior
 */
function goBackStep() {
    if (currentStep > 0) {
        saveCurrentStepData();
        
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            showFormStep(currentStep - 1);
            currentElement.style.animation = '';
        }, 300);
    } else {
        window.location.href = 'index.html';
    }
}

/**
 * Salva dados do step atual
 */
function saveCurrentStepData() {
    const stepElement = document.getElementById(`step${currentStep}`);
    const inputs = stepElement.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
            if (input.checked) {
                formData[input.name || input.id] = input.value;
            }
        } else {
            formData[input.name || input.id] = input.value;
        }
    });
    
    saveFormData();
}

/**
 * Salva dados do formulário no localStorage
 */
function saveFormData() {
    localStorage.setItem('formularioData', JSON.stringify(formData));
}

/**
 * Atualiza a barra de progresso
 */
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// ============================================================================
// PÁGINA DE RECURSOS (recursos.html)
// ============================================================================

/**
 * Inicializa a página de recursos
 */
function initRecursosPage() {
    loadRecursosData();
    createResourcesTable();
    setupResourcesNavigation();
    setupAddRowButton();
}

/**
 * Carrega dados de recursos do localStorage
 */
function loadRecursosData() {
    const saved = localStorage.getItem('recursosData');
    if (saved) {
        recursosData = JSON.parse(saved);
    } else {
        // 4 linhas iniciais vazias
        recursosData = Array(4).fill().map(() => ({
            tipo: 'tempo',
            descricao: ''
        }));
    }
}

/**
 * Cria a tabela de recursos
 */
function createResourcesTable() {
    const tbody = document.querySelector('#resourcesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    recursosData.forEach((recurso, index) => {
        tbody.appendChild(createResourceRow(recurso, index));
    });
}

/**
 * Cria uma linha da tabela de recursos
 * @param {Object} recurso - Dados do recurso
 * @param {number} index - Índice da linha
 * @returns {HTMLElement} Elemento da linha
 */
function createResourceRow(recurso, index) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <select class="resource-type" data-index="${index}">
                <option value="tempo" ${recurso.tipo === 'tempo' ? 'selected' : ''}>Tempo</option>
                <option value="financeiro" ${recurso.tipo === 'financeiro' ? 'selected' : ''}>Financeiro</option>
                <option value="equipe" ${recurso.tipo === 'equipe' ? 'selected' : ''}>Equipe</option>
                <option value="equipamento" ${recurso.tipo === 'equipamento' ? 'selected' : ''}>Equipamento</option>
            </select>
        </td>
        <td>
            <textarea class="resource-description" data-index="${index}" 
                      placeholder="Descreva o recurso...">${recurso.descricao || ''}</textarea>
        </td>
        <td>
            <button class="delete-btn" data-index="${index}" title="Excluir linha">🗑️</button>
        </td>
    `;
    
    // Event listeners para atualização
    row.querySelector('.resource-type').addEventListener('change', updateRecursoData);
    row.querySelector('.resource-description').addEventListener('input', updateRecursoData);
    row.querySelector('.delete-btn').addEventListener('click', () => {
        recursosData.splice(index, 1);
        saveRecursosData();
        createResourcesTable();
    });
    
    return row;
}

/**
 * Atualiza dados de um recurso
 * @param {Event} event - Evento de mudança
 */
function updateRecursoData(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const type = document.querySelector(`.resource-type[data-index="${index}"]`).value;
    const descricao = document.querySelector(`.resource-description[data-index="${index}"]`).value;
    
    recursosData[index] = { tipo: type, descricao };
    saveRecursosData();
}

/**
 * Configura botão para adicionar linha
 */
function setupAddRowButton() {
    const addBtn = document.getElementById('addRowBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            recursosData.push({ tipo: 'tempo', descricao: '' });
            saveRecursosData();
            createResourcesTable();
        });
    }
}

/**
 * Salva dados de recursos no localStorage
 */
function saveRecursosData() {
    localStorage.setItem('recursosData', JSON.stringify(recursosData));
}

/**
 * Configura navegação da página de recursos
 */
function setupResourcesNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        window.location.href = 'form-novo-projeto.html';
    });
    
    document.querySelector('.btn-avancar')?.addEventListener('click', () => {
        saveRecursosData();
        window.location.href = 'killswitch.html';
    });
}

// ============================================================================
// PÁGINA KILL SWITCH (killswitch.html)
// ============================================================================

/**
 * Inicializa a página Kill Switch
 */
function initKillSwitchPage() {
    loadPontuacaoData();
    setupKillSwitchListeners();
    setupSliders();
    setupKillSwitchNavigation();
    calculateAndDisplayScore();
}

/**
 * Carrega dados de pontuação do localStorage
 */
function loadPontuacaoData() {
    const saved = localStorage.getItem('pontuacaoData');
    if (saved) {
        pontuacaoData = JSON.parse(saved);
    } else {
        pontuacaoData = {
            killSwitch: 0,
            matrizPositiva: Array(4).fill(1),
            matrizNegativa: Array(3).fill(1),
            score: 0
        };
    }
}

/**
 * Configura listeners para checkboxes do Kill Switch
 */
function setupKillSwitchListeners() {
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.checked = pontuacaoData.killSwitch >= index + 1;
        checkbox.addEventListener('change', updateKillSwitch);
    });
}

/**
 * Configura sliders das matrizes
 */
function setupSliders() {
    // Sliders da Matriz Positiva
    document.querySelectorAll('.matriz-positiva input[type="range"]').forEach((slider, index) => {
        const value = pontuacaoData.matrizPositiva[index] || 1;
        slider.value = value;
        slider.nextElementSibling.textContent = value;
        slider.addEventListener('input', updateSliderDisplay);
        slider.addEventListener('change', calculateAndDisplayScore);
    });
    
    // Sliders da Matriz Negativa
    document.querySelectorAll('.matriz-negativa input[type="range"]').forEach((slider, index) => {
        const value = pontuacaoData.matrizNegativa[index] || 1;
        slider.value = value;
        slider.nextElementSibling.textContent = value;
        slider.addEventListener('input', updateSliderDisplay);
        slider.addEventListener('change', calculateAndDisplayScore);
    });
}

/**
 * Atualiza display do valor do slider
 * @param {Event} event - Evento de input
 */
function updateSliderDisplay(event) {
    event.target.nextElementSibling.textContent = event.target.value;
}

/**
 * Atualiza contagem do Kill Switch
 */
function updateKillSwitch() {
    const checkboxes = document.querySelectorAll('.kill-switch input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    pontuacaoData.killSwitch = checkedCount;
    calculateAndDisplayScore();
}

/**
 * Calcula e exibe o score da solução
 * Fórmula: (checkboxes_marcados) * [(soma_positiva)/(soma_negativa)]
 */
function calculateAndDisplayScore() {
    // Kill Switch checkboxes
    const killSwitchCount = pontuacaoData.killSwitch;
    
    // Matriz Positiva
    const slidersPositiva = document.querySelectorAll('.matriz-positiva input[type="range"]');
    const somaPositiva = Array.from(slidersPositiva).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    
    // Matriz Negativa (mínimo 1 para evitar divisão por zero)
    const slidersNegativa = document.querySelectorAll('.matriz-negativa input[type="range"]');
    const somaNegativa = Math.max(Array.from(slidersNegativa).reduce((sum, slider) => sum + parseInt(slider.value), 0), 1);
    
    // Cálculo do score
    const score = killSwitchCount * (somaPositiva / somaNegativa);
    const scoreNormalizado = Math.min(Math.max(score, 0), 100);
    
    // Atualizar dados
    pontuacaoData.matrizPositiva = Array.from(slidersPositiva).map(s => parseInt(s.value));
    pontuacaoData.matrizNegativa = Array.from(slidersNegativa).map(s => parseInt(s.value));
    pontuacaoData.score = scoreNormalizado;
    
    // Salvar
    savePontuacaoData();
    
    // Atualizar display
    updateScoreDisplay(scoreNormalizado);
}

/**
 * Atualiza display do score
 * @param {number} score - Score normalizado (0-100)
 */
function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('scoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const scoreComment = document.getElementById('scoreComment');
    
    if (scoreElement) scoreElement.textContent = `${score.toFixed(1)}%`;
    if (scoreBar) scoreBar.style.width = `${score}%`;
    
    // Comentário baseado no score
    if (scoreComment) {
        if (score >= 80) {
            scoreComment.textContent = 'Excelente! Solução altamente recomendada.';
        } else if (score >= 60) {
            scoreComment.textContent = 'Bom potencial. Recomenda-se análise detalhada.';
        } else if (score >= 40) {
            scoreComment.textContent = 'Potencial moderado. Avaliar riscos.';
        } else {
            scoreComment.textContent = 'Necessita revisão. Potencial abaixo do esperado.';
        }
    }
}

/**
 * Salva dados de pontuação no localStorage
 */
function savePontuacaoData() {
    localStorage.setItem('pontuacaoData', JSON.stringify(pontuacaoData));
}

/**
 * Configura navegação da página Kill Switch
 */
function setupKillSwitchNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        window.location.href = 'recursos.html';
    });
    
    document.querySelector('.btn-avancar')?.addEventListener('click', () => {
        savePontuacaoData();
        window.location.href = 'canvas.html';
    });
}

// ============================================================================
// PÁGINA CANVAS (canvas.html)
// ============================================================================

/**
 * Inicializa a página do Canvas
 */
function initCanvasPage() {
    // Obtém ID da solução da URL ou gera novo
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || generateId();
    
    loadCanvasData();
    setupCanvasCells();
    setupCanvasNavigation();
}

/**
 * Carrega dados do Canvas do localStorage
 */
function loadCanvasData() {
    const saved = localStorage.getItem(`canvas_${currentSolutionId}`);
    if (saved) {
        canvasData = JSON.parse(saved);
    } else {
        // Dados iniciais vazios
        canvasData = {
            'publico-alvo': '',
            'problema-resolve': '',
            'formato-solucao': '',
            'funcionalidades': '',
            'modelo-negocio': '',
            'trl-atual': '',
            'trl-esperada': '',
            'link-prototipo': '',
            'link-pitch': '',
            'link-pdf': '',
            'escalabilidade': ''
        };
    }
    
    // Preenche células com dados carregados
    Object.keys(canvasData).forEach(campoId => {
        updateCanvasCell(campoId, canvasData[campoId]);
    });
}

/**
 * Configura listeners para as células do Canvas
 */
function setupCanvasCells() {
    const celulas = [
        'publico-alvo',
        'problema-resolve',
        'formato-solucao',
        'funcionalidades',
        'modelo-negocio',
        'trl-atual',
        'trl-esperada',
        'link-prototipo',
        'link-pitch',
        'link-pdf',
        'escalabilidade'
    ];
    
    celulas.forEach(id => {
        const celula = document.getElementById(id);
        if (celula) {
            celula.addEventListener('click', () => openCanvasEditor(id, celula.querySelector('h3').textContent));
        }
    });
}

/**
 * Atualiza o conteúdo de uma célula do Canvas
 * @param {string} campoId - ID do campo
 * @param {string} conteudo - Conteúdo do campo
 */
function updateCanvasCell(campoId, conteudo) {
    const celula = document.getElementById(campoId);
    if (!celula) return;
    
    // Trunca texto para exibição (100 caracteres)
    const textoExibido = conteudo.length > 100 ? 
        conteudo.substring(0, 100) + '...' : 
        conteudo || 'Clique para editar...';
    
    celula.querySelector('p').textContent = textoExibido;
    celula.setAttribute('data-conteudo', conteudo);
    
    // Atualiza dados
    canvasData[campoId] = conteudo;
}

/**
 * Abre editor para uma célula do Canvas
 * @param {string} campoId - ID do campo
 * @param {string} titulo - Título do campo
 */
function openCanvasEditor(campoId, titulo) {
    const conteudoAtual = canvasData[campoId] || '';
    
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content canvas-popup">
            <h2>${titulo}</h2>
            <textarea id="canvasTextarea" placeholder="Digite o conteúdo aqui...">${conteudoAtual}</textarea>
            <div class="popup-buttons">
                <button class="btn btn-secondary" id="cancelCanvas">Cancelar</button>
                <button class="btn btn-primary" id="saveCanvas">Salvar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    popup.style.display = 'flex';
    
    const textarea = popup.querySelector('#canvasTextarea');
    textarea.style.minHeight = '300px';
    textarea.style.maxHeight = '400px';
    textarea.style.overflowY = 'auto';
    textarea.focus();
    
    // Botão Cancelar
    popup.querySelector('#cancelCanvas').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    // Botão Salvar
    popup.querySelector('#saveCanvas').addEventListener('click', () => {
        const novoConteudo = textarea.value;
        updateCanvasCell(campoId, novoConteudo);
        saveCanvasData();
        document.body.removeChild(popup);
    });
    
    // Fechar com ESC
    popup.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(popup);
        }
    });
    
    // Fechar ao clicar fora
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

/**
 * Salva dados do Canvas no localStorage
 */
function saveCanvasData() {
    localStorage.setItem(`canvas_${currentSolutionId}`, JSON.stringify(canvasData));
}

/**
 * Configura navegação da página Canvas
 */
function setupCanvasNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        window.location.href = 'killswitch.html';
    });
    
    document.querySelector('.btn-finalizar')?.addEventListener('click', salvarSoluçãoCompleta);
}

/**
 * Salva a solução completa no Firebase
 */
async function salvarSoluçãoCompleta() {
    try {
        // Coletar todos os dados do localStorage
        const formularioData = JSON.parse(localStorage.getItem('formularioData') || '{}');
        const recursosData = JSON.parse(localStorage.getItem('recursosData') || '[]');
        const pontuacaoData = JSON.parse(localStorage.getItem('pontuacaoData') || '{}');
        
        // Preparar dados da solução
        const solucaoData = {
            nome: formularioData.nomeSolucao || 'Nova Solução',
            descricao: formularioData.descricaoSolucao || '',
            tipo: formularioData.tipoSolucao || 'Criar Nova Solução',
            dataCriacao: new Date().toISOString(),
            score: pontuacaoData.score || 0,
            icone: '💡' // Ícone padrão
        };
        
        // Verificar se Firebase está disponível
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.adicionarSolucao(solucaoData);
            
            if (resultado.success) {
                // Salvar dados relacionados no Firebase
                await BancoDeDados.salvarRespostasFormulario(resultado.id, formularioData);
                await BancoDeDados.salvarRecursos(resultado.id, recursosData);
                await BancoDeDados.salvarPontuacao(
                    resultado.id,
                    pontuacaoData.killSwitch || 0,
                    pontuacaoData.matrizPositiva || [1,1,1,1],
                    pontuacaoData.matrizNegativa || [1,1,1],
                    pontuacaoData.score || 0
                );
                await BancoDeDados.salvarCanvas(resultado.id, canvasData);
                
                // Limpar dados temporários
                limparDadosTemporarios();
                
                alert('✅ Solução cadastrada com sucesso!');
                window.location.href = 'index.html';
            } else {
                alert('❌ Erro ao salvar solução: ' + resultado.error);
            }
        } else {
            // Modo demo - salvar no localStorage
            const solucoes = JSON.parse(localStorage.getItem('solucoesDemo') || '[]');
            solucoes.push({
                id: currentSolutionId,
                ...solucaoData
            });
            localStorage.setItem('solucoesDemo', JSON.stringify(solucoes));
            
            // Salvar dados relacionados
            localStorage.setItem(`formulario_${currentSolutionId}`, JSON.stringify(formularioData));
            localStorage.setItem(`recursos_${currentSolutionId}`, JSON.stringify(recursosData));
            localStorage.setItem(`pontuacao_${currentSolutionId}`, JSON.stringify(pontuacaoData));
            
            limparDadosTemporarios();
            
            alert('✅ Solução salva em modo demo (localStorage).');
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        console.error('Erro ao salvar solução:', error);
        alert('❌ Erro ao salvar a solução. Verifique o console para detalhes.');
    }
}

/**
 * Limpa dados temporários do localStorage
 */
function limparDadosTemporarios() {
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosData');
    localStorage.removeItem('pontuacaoData');
    localStorage.removeItem(`canvas_${currentSolutionId}`);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Inicializa tooltips (se necessário)
 */
function initTooltips() {
    // Pode ser implementado se necessário
}

// ============================================================================
// EXPORTAÇÃO PARA ESCOPO GLOBAL
// ============================================================================

// Torna funções principais disponíveis globalmente
window.app = {
    carregarSolucoes,
    salvarSoluçãoCompleta,
    calculateAndDisplayScore
};

console.log('Sistema SASGP carregado com sucesso!');