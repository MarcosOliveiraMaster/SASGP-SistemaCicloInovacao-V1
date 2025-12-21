// script.js - Sistema de Gerenciamento de Soluções SASGP

// ==============================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// ==============================

let currentSolutionId = null;
let currentStep = 0;
let formData = {};
let recursosData = [];
let pontuacaoData = {};
let canvasData = {};
let rightClickedSolutionId = null; // Armazena o ID da solução clicada com botão direito

const totalSteps = 4;
const cores = ['laranja', 'azul', 'roxo'];
const iconsList = ['🤖','🦄','🧠','👩🏼‍🦰','👨🏼‍🦰','🏃🏼‍♀️','💪🏼','🎮','🏆','🧩','🛠️','📑','📊','🚀','🌎','🔥','💡'];

// ==============================
// INICIALIZAÇÃO DO SISTEMA
// ==============================

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
    
    // Inicializar tooltips e elementos interativos
    initTooltips();
});

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

function showLoading(element) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showError(element, message) {
    element.innerHTML = `<p class="error">${message}</p>`;
}

// ==============================
// PÁGINA INICIAL (index.html) E CONTEXT MENU
// ==============================

function initIndexPage() {
    carregarSolucoes();
    setupContextMenuListeners();
}

// Configura os ouvintes para o menu de contexto (clique direito)
function setupContextMenuListeners() {
    // Esconder menu ao clicar fora
    document.addEventListener('click', function(e) {
        document.getElementById('contextMenu').style.display = 'none';
    });

    // Ações do menu
    document.getElementById('ctxRename').addEventListener('click', openRenamePopup);
    document.getElementById('ctxIcon').addEventListener('click', openIconPopup);
    document.getElementById('ctxDelete').addEventListener('click', openDeletePopup);

    // Popups
    setupPopupActions();
}

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
        }
    } catch (error) {
        console.error('Erro ao carregar soluções:', error);
    }
}

function renderizarSolucoes(grid, solucoes) {
    grid.innerHTML = '';
    solucoes.forEach((solucao, index) => {
        const cor = cores[index % 3];
        grid.appendChild(createSolutionCard(solucao, cor));
    });
    grid.appendChild(createAddNewCard());
}

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
    
    // Clique esquerdo: Abrir canvas
    card.addEventListener('click', () => {
        localStorage.setItem('currentSolutionId', solucao.id || solucao.docId);
        window.location.href = `canvas.html?id=${solucao.id || solucao.docId}`;
    });

    // Clique direito: Menu de Contexto
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Impede menu nativo do navegador
        
        rightClickedSolutionId = solucao.id; // Salva o ID da solução clicada
        
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'flex';
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
    });
    
    return card;
}

function createAddNewCard() {
    const card = document.createElement('div');
    card.className = 'solution-card add-new-card';
    card.innerHTML = '+';
    card.addEventListener('click', () => {
        window.location.href = 'form-novo-projeto.html';
    });
    return card;
}

// --- FUNÇÕES DOS POPUPS DO MENU DE CONTEXTO ---

function setupPopupActions() {
    // RENOMEAR
    document.getElementById('btnCancelRename').addEventListener('click', () => closePopup('popupRename'));
    document.getElementById('btnSaveRename').addEventListener('click', async () => {
        const newName = document.getElementById('inputNewName').value;
        if (newName && rightClickedSolutionId) {
            await BancoDeDados.atualizarSolucao(rightClickedSolutionId, { nome: newName });
            closePopup('popupRename');
            carregarSolucoes(); // Recarrega o grid
        }
    });

    // ÍCONE
    document.getElementById('btnCancelIcon').addEventListener('click', () => closePopup('popupIcon'));
    document.getElementById('btnSaveIcon').addEventListener('click', async () => {
        const selectedIcon = document.querySelector('.icon-option.selected');
        if (selectedIcon && rightClickedSolutionId) {
            await BancoDeDados.atualizarSolucao(rightClickedSolutionId, { icone: selectedIcon.textContent });
            closePopup('popupIcon');
            carregarSolucoes();
        }
    });

    // DELETAR
    document.getElementById('btnCancelDelete').addEventListener('click', () => closePopup('popupDelete'));
    document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
        if (rightClickedSolutionId) {
            await BancoDeDados.excluirSolucao(rightClickedSolutionId);
            closePopup('popupDelete');
            carregarSolucoes();
        }
    });
}

function openRenamePopup() {
    document.getElementById('popupRename').style.display = 'flex';
    document.getElementById('inputNewName').value = '';
    document.getElementById('inputNewName').focus();
}

function openIconPopup() {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = '';
    
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
    
    // Selecionar o padrão
    const defaultIcon = grid.querySelector('.icon-option:last-child'); // Lâmpada
    if (defaultIcon) defaultIcon.classList.add('selected');

    document.getElementById('popupIcon').style.display = 'flex';
}

function openDeletePopup() {
    document.getElementById('popupDelete').style.display = 'flex';
}

function closePopup(id) {
    document.getElementById(id).style.display = 'none';
}

// ==============================
// PÁGINA DE FORMULÁRIO
// ==============================

function initFormPage() {
    loadFormData();
    setupFormNavigation();
    setupOptionCards();
}

function loadFormData() {
    const savedData = localStorage.getItem('formularioData');
    if (savedData) formData = JSON.parse(savedData);
}

function setupFormNavigation() {
    showFormStep(0);
    document.querySelectorAll('.btn-avancar').forEach(btn => btn.addEventListener('click', advanceStep));
    document.querySelectorAll('.btn-voltar').forEach(btn => btn.addEventListener('click', goBackStep));
}

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

function saveCurrentStepData() {
    const stepElement = document.getElementById(`step${currentStep}`);
    const inputs = stepElement.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
            if (input.checked) formData[input.name || input.id] = input.value;
        } else {
            formData[input.name || input.id] = input.value;
        }
    });
    saveFormData();
}

function saveFormData() { localStorage.setItem('formularioData', JSON.stringify(formData)); }
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
}

// ==============================
// PÁGINA DE RECURSOS (recursos.html)
// ==============================

function initRecursosPage() {
    loadRecursosData();
    createResourcesTable();
    setupResourcesNavigation();
    setupAddRowButton();
}

function loadRecursosData() {
    const saved = localStorage.getItem('recursosData');
    if (saved) {
        recursosData = JSON.parse(saved);
    } else {
        recursosData = Array(4).fill().map(() => ({ tipo: 'tempo', descricao: '' }));
    }
}

function createResourcesTable() {
    const tbody = document.querySelector('#resourcesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    recursosData.forEach((recurso, index) => tbody.appendChild(createResourceRow(recurso, index)));
}

function createResourceRow(recurso, index) {
    const row = document.createElement('tr');
    // Nota: Coluna Valor removida conforme pedido
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
            <textarea class="resource-description" data-index="${index}" placeholder="Descreva o recurso...">${recurso.descricao || ''}</textarea>
        </td>
        <td>
            <button class="delete-btn" data-index="${index}" title="Excluir linha">🗑️</button>
        </td>
    `;
    
    row.querySelector('.resource-type').addEventListener('change', updateRecursoData);
    row.querySelector('.resource-description').addEventListener('input', updateRecursoData);
    row.querySelector('.delete-btn').addEventListener('click', (e) => {
        recursosData.splice(index, 1);
        saveRecursosData();
        createResourcesTable();
    });
    
    return row;
}

function updateRecursoData(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const type = document.querySelector(`.resource-type[data-index="${index}"]`).value;
    const descricao = document.querySelector(`.resource-description[data-index="${index}"]`).value;
    recursosData[index] = { tipo: type, descricao };
    saveRecursosData();
}

function setupAddRowButton() {
    const addBtn = document.getElementById('addRowBtn');
    if (addBtn) addBtn.addEventListener('click', () => {
        recursosData.push({ tipo: 'tempo', descricao: '' });
        saveRecursosData();
        createResourcesTable();
    });
}

function saveRecursosData() { localStorage.setItem('recursosData', JSON.stringify(recursosData)); }
function setupResourcesNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => window.location.href = 'form-novo-projeto.html');
    document.querySelector('.btn-avancar')?.addEventListener('click', () => { saveRecursosData(); window.location.href = 'killswitch.html'; });
}

// ==============================
// PÁGINA KILL SWITCH
// ==============================

function initKillSwitchPage() {
    loadPontuacaoData();
    setupKillSwitchListeners();
    setupSliders();
    setupKillSwitchNavigation();
    calculateAndDisplayScore();
}

function loadPontuacaoData() {
    const saved = localStorage.getItem('pontuacaoData');
    if (saved) pontuacaoData = JSON.parse(saved);
    else pontuacaoData = { killSwitch: 0, matrizPositiva: Array(4).fill(1), matrizNegativa: Array(3).fill(1), score: 0 };
}

function setupKillSwitchListeners() {
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.checked = pontuacaoData.killSwitch >= index + 1;
        checkbox.addEventListener('change', updateKillSwitch);
    });
}

function setupSliders() {
    document.querySelectorAll('.matriz-positiva input[type="range"]').forEach((slider, index) => {
        const value = pontuacaoData.matrizPositiva[index] || 1;
        slider.value = value;
        slider.nextElementSibling.textContent = value;
        slider.addEventListener('input', (e) => e.target.nextElementSibling.textContent = e.target.value);
        slider.addEventListener('change', calculateAndDisplayScore);
    });
    
    document.querySelectorAll('.matriz-negativa input[type="range"]').forEach((slider, index) => {
        const value = pontuacaoData.matrizNegativa[index] || 1;
        slider.value = value;
        slider.nextElementSibling.textContent = value;
        slider.addEventListener('input', (e) => e.target.nextElementSibling.textContent = e.target.value);
        slider.addEventListener('change', calculateAndDisplayScore);
    });
}

function updateKillSwitch() {
    const checkboxes = document.querySelectorAll('.kill-switch input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    pontuacaoData.killSwitch = checkedCount;
    calculateAndDisplayScore();
}

function calculateAndDisplayScore() {
    const killSwitchCount = pontuacaoData.killSwitch;
    const slidersPositiva = document.querySelectorAll('.matriz-positiva input[type="range"]');
    const somaPositiva = Array.from(slidersPositiva).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    const slidersNegativa = document.querySelectorAll('.matriz-negativa input[type="range"]');
    const somaNegativa = Math.max(Array.from(slidersNegativa).reduce((sum, slider) => sum + parseInt(slider.value), 0), 1);
    
    const score = killSwitchCount * (somaPositiva / somaNegativa);
    const scoreNormalizado = Math.min(Math.max(score, 0), 100);
    
    pontuacaoData.matrizPositiva = Array.from(slidersPositiva).map(s => parseInt(s.value));
    pontuacaoData.matrizNegativa = Array.from(slidersNegativa).map(s => parseInt(s.value));
    pontuacaoData.score = scoreNormalizado;
    savePontuacaoData();
    updateScoreDisplay(scoreNormalizado);
}

function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('scoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const scoreComment = document.getElementById('scoreComment');
    
    if (scoreElement) scoreElement.textContent = `${score.toFixed(1)}%`;
    if (scoreBar) scoreBar.style.width = `${score}%`;
    if (scoreComment) {
        if (score >= 80) scoreComment.textContent = 'Excelente! Solução altamente recomendada.';
        else if (score >= 60) scoreComment.textContent = 'Bom potencial. Recomenda-se análise detalhada.';
        else if (score >= 40) scoreComment.textContent = 'Potencial moderado. Avaliar riscos.';
        else scoreComment.textContent = 'Necessita revisão. Potencial abaixo do esperado.';
    }
}

function savePontuacaoData() { localStorage.setItem('pontuacaoData', JSON.stringify(pontuacaoData)); }
function setupKillSwitchNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => window.location.href = 'recursos.html');
    document.querySelector('.btn-avancar')?.addEventListener('click', () => { savePontuacaoData(); window.location.href = 'canvas.html'; });
}

// ==============================
// PÁGINA CANVAS
// ==============================

function initCanvasPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || generateId();
    loadCanvasData();
    setupCanvasCells();
    setupCanvasNavigation();
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function loadCanvasData() {
    const saved = localStorage.getItem(`canvas_${currentSolutionId}`);
    if (saved) canvasData = JSON.parse(saved);
    else {
        canvasData = {
            'publico-alvo': '', 'problema-resolve': '', 'formato-solucao': '', 'funcionalidades': '',
            'modelo-negocio': '', 'trl-atual': '', 'trl-esperada': '', 'link-prototipo': '',
            'link-pitch': '', 'link-pdf': '', 'escalabilidade': ''
        };
    }
    Object.keys(canvasData).forEach(campoId => updateCanvasCell(campoId, canvasData[campoId]));
}

function setupCanvasCells() {
    const celulas = ['publico-alvo', 'problema-resolve', 'formato-solucao', 'funcionalidades', 'modelo-negocio', 'trl-atual', 'trl-esperada', 'link-prototipo', 'link-pitch', 'link-pdf', 'escalabilidade'];
    celulas.forEach(id => {
        const celula = document.getElementById(id);
        if (celula) celula.addEventListener('click', () => openCanvasEditor(id, celula.querySelector('h3').textContent));
    });
}

function updateCanvasCell(campoId, conteudo) {
    const celula = document.getElementById(campoId);
    if (!celula) return;
    const textoExibido = conteudo.length > 100 ? conteudo.substring(0, 100) + '...' : conteudo || 'Clique para editar...';
    celula.querySelector('p').textContent = textoExibido;
    canvasData[campoId] = conteudo;
}

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
    textarea.style.minHeight = '300px'; textarea.focus();
    
    popup.querySelector('#cancelCanvas').addEventListener('click', () => document.body.removeChild(popup));
    popup.querySelector('#saveCanvas').addEventListener('click', () => {
        updateCanvasCell(campoId, textarea.value);
        saveCanvasData();
        document.body.removeChild(popup);
    });
}

function saveCanvasData() { localStorage.setItem(`canvas_${currentSolutionId}`, JSON.stringify(canvasData)); }
function setupCanvasNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => window.location.href = 'killswitch.html');
    document.querySelector('.btn-finalizar')?.addEventListener('click', salvarSoluçãoCompleta);
}

async function salvarSoluçãoCompleta() {
    try {
        const formularioData = JSON.parse(localStorage.getItem('formularioData') || '{}');
        const recursosData = JSON.parse(localStorage.getItem('recursosData') || '[]');
        const pontuacaoData = JSON.parse(localStorage.getItem('pontuacaoData') || '{}');
        
        const solucaoData = {
            nome: formularioData.nomeSolucao || 'Nova Solução',
            descricao: formularioData.descricaoSolucao || '',
            tipo: formularioData.tipoSolucao || 'Criar Nova Solução',
            dataCriacao: new Date().toISOString(),
            score: pontuacaoData.score || 0,
            icone: '💡' // Ícone padrão
        };
        
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.adicionarSolucao(solucaoData);
            if (resultado.success) {
                await BancoDeDados.salvarRespostasFormulario(resultado.id, formularioData);
                await BancoDeDados.salvarRecursos(resultado.id, recursosData);
                await BancoDeDados.salvarPontuacao(resultado.id, pontuacaoData.killSwitch, pontuacaoData.matrizPositiva, pontuacaoData.matrizNegativa, pontuacaoData.score);
                await BancoDeDados.salvarCanvas(resultado.id, canvasData);
                
                limparDadosTemporarios();
                alert('✅ Solução cadastrada com sucesso!');
                window.location.href = 'index.html';
            } else {
                alert('❌ Erro ao salvar solução: ' + resultado.error);
            }
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('❌ Erro inesperado.');
    }
}

function limparDadosTemporarios() {
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosData');
    localStorage.removeItem('pontuacaoData');
    localStorage.removeItem(`canvas_${currentSolutionId}`);
}

function initTooltips() { /* Tooltips podem ser adicionados aqui */ }