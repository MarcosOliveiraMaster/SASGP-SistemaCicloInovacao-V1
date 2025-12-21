// ============================================================================
// SISTEMA DE GERENCIAMENTO DE SOLUÇÕES SASGP
// ============================================================================
// Arquivo principal com todas as funcionalidades JavaScript
// ============================================================================

// ==============================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// ==============================

let currentSolutionId = null;
let currentSolutionDocId = null;
let currentStep = 0;
let formData = {};
let recursosData = [];
let pontuacaoData = {};
let canvasData = {};
let rightClickedSolutionDocId = null;
let rightClickedSolutionId = null;

const totalSteps = 4;
const cores = ['laranja', 'azul', 'roxo'];
const iconsList = ['🤖','🦄','🧠','👩🏼‍🦰','👨🏼‍🦰','🏃🏼‍♀️','💪🏼','🎮','🏆','🧩','🛠️','📑','📊','🚀','🌎','🔥','💡'];
const avaliadoresList = ['Simone', 'Gabriel', 'Diego', 'Emily', 'Tandero'];

// ============================================================================
// INICIALIZAÇÃO DO SISTEMA
// ============================================================================

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
        case 'avaliacao.html':
            initAvaliacaoPage();
            break;
        case 'historico.html':
            initHistoricoPage();
            break;
    }
    
    initTooltips();
});

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoading(element) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showError(element, message) {
    element.innerHTML = `<p class="error">${message}</p>`;
}

// ============================================================================
// PÁGINA INICIAL (index.html) - MENU DE CONTEXTO ATUALIZADO
// ============================================================================

function initIndexPage() {
    carregarSolucoes();
    setupContextMenuListeners();
}

function setupContextMenuListeners() {
    document.addEventListener('click', function() {
        document.getElementById('contextMenu').style.display = 'none';
    });

    document.getElementById('ctxRename').addEventListener('click', openRenamePopup);
    document.getElementById('ctxIcon').addEventListener('click', openIconPopup);
    document.getElementById('ctxAvaliar').addEventListener('click', abrirAvaliacao);
    document.getElementById('ctxHistorico').addEventListener('click', abrirHistorico);
    document.getElementById('ctxDelete').addEventListener('click', openDeletePopup);

    setupPopupActions();
}

// NOVAS FUNÇÕES PARA MENU DE CONTEXTO
function abrirAvaliacao() {
    if (rightClickedSolutionDocId && rightClickedSolutionId) {
        // Salvar IDs para uso na página de avaliação
        localStorage.setItem('avaliacaoSolutionDocId', rightClickedSolutionDocId);
        localStorage.setItem('avaliacaoSolutionId', rightClickedSolutionId);
        window.location.href = `avaliacao.html?id=${rightClickedSolutionId}`;
    }
}

function abrirHistorico() {
    if (rightClickedSolutionDocId && rightClickedSolutionId) {
        // Salvar IDs para uso na página de histórico
        localStorage.setItem('historicoSolutionDocId', rightClickedSolutionDocId);
        localStorage.setItem('historicoSolutionId', rightClickedSolutionId);
        window.location.href = `historico.html?id=${rightClickedSolutionId}`;
    }
}

function setupPopupActions() {
    // Configurações anteriores (rename, icon, delete) mantidas
    document.getElementById('btnCancelRename').addEventListener('click', () => {
        closePopup('popupRename');
    });
    
    document.getElementById('btnSaveRename').addEventListener('click', async () => {
        const newName = document.getElementById('inputNewName').value.trim();
        
        if (newName && rightClickedSolutionDocId) {
            console.log(`📝 Renomeando solução ${rightClickedSolutionDocId} para: ${newName}`);
            
            document.getElementById('btnSaveRename').textContent = 'Salvando...';
            document.getElementById('btnSaveRename').disabled = true;
            
            try {
                const resultado = await BancoDeDados.atualizarNomeSolucao(
                    rightClickedSolutionDocId, 
                    newName
                );
                
                if (resultado.success) {
                    showNotification('Nome atualizado com sucesso!', 'success');
                    closePopup('popupRename');
                    carregarSolucoes();
                } else {
                    throw new Error(resultado.error || 'Erro desconhecido');
                }
            } catch (error) {
                console.error('❌ Erro ao renomear:', error);
                showNotification('Erro ao atualizar nome. Tente novamente.', 'error');
            } finally {
                document.getElementById('btnSaveRename').textContent = 'Salvar';
                document.getElementById('btnSaveRename').disabled = false;
            }
        } else {
            showNotification('Digite um nome válido', 'warning');
        }
    });
    
    // Popup Mudar Ícone (mantido)
    document.getElementById('btnCancelIcon').addEventListener('click', () => {
        closePopup('popupIcon');
    });
    
    document.getElementById('btnSaveIcon').addEventListener('click', async () => {
        const selectedIcon = document.querySelector('.icon-option.selected');
        
        if (selectedIcon && rightClickedSolutionDocId) {
            const novoIcone = selectedIcon.textContent;
            
            document.getElementById('btnSaveIcon').textContent = 'Salvando...';
            document.getElementById('btnSaveIcon').disabled = true;
            
            try {
                const resultado = await BancoDeDados.atualizarIconeSolucao(
                    rightClickedSolutionDocId, 
                    novoIcone
                );
                
                if (resultado.success) {
                    showNotification('Ícone atualizado com sucesso!', 'success');
                    closePopup('popupIcon');
                    carregarSolucoes();
                } else {
                    throw new Error(resultado.error || 'Erro desconhecido');
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar ícone:', error);
                showNotification('Erro ao atualizar ícone. Tente novamente.', 'error');
            } finally {
                document.getElementById('btnSaveIcon').textContent = 'Salvar';
                document.getElementById('btnSaveIcon').disabled = false;
            }
        } else {
            showNotification('Selecione um ícone', 'warning');
        }
    });
    
    // Popup Excluir (mantido)
    document.getElementById('btnCancelDelete').addEventListener('click', () => {
        closePopup('popupDelete');
    });
    
    document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
        if (rightClickedSolutionDocId) {
            console.log(`🗑️ Iniciando exclusão da solução ${rightClickedSolutionDocId}`);
            
            const btnConfirm = document.getElementById('btnConfirmDelete');
            const btnCancel = document.getElementById('btnCancelDelete');
            
            btnConfirm.textContent = 'Excluindo...';
            btnConfirm.disabled = true;
            btnCancel.disabled = true;
            
            try {
                const resultado = await BancoDeDados.excluirSolucaoCompleta(
                    rightClickedSolutionDocId
                );
                
                if (resultado.success) {
                    showNotification('Solução excluída com sucesso!', 'success');
                    closePopup('popupDelete');
                    carregarSolucoes();
                } else {
                    throw new Error(resultado.error || 'Erro desconhecido');
                }
            } catch (error) {
                console.error('❌ Erro ao excluir solução:', error);
                showNotification('Erro ao excluir solução. Tente novamente.', 'error');
            } finally {
                btnConfirm.textContent = 'Apagar';
                btnConfirm.disabled = false;
                btnCancel.disabled = false;
            }
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
    
    const defaultIcon = grid.querySelector('.icon-option:last-child');
    if (defaultIcon) defaultIcon.classList.add('selected');

    document.getElementById('popupIcon').style.display = 'flex';
}

function openDeletePopup() {
    document.getElementById('popupDelete').style.display = 'flex';
}

function closePopup(id) {
    document.getElementById(id).style.display = 'none';
}

// ALTERAÇÃO NO CLIQUE DA SOLUÇÃO (item 1 da solicitação)
function createSolutionCard(solucao, cor) {
    const card = document.createElement('div');
    card.className = `solution-card ${cor}`;
    
    const icon = solucao.icone || '💡'; 
    
    card.innerHTML = `
        <div class="card-image">
            <div class="placeholder">${icon}</div>
        </div>
        <div class="card-title">${solucao.nome || 'Solução Digital'}</div>
    `;
    
    // CLIQUE ESQUERDO: Alterado para ir para form-novo-projeto (início do processo)
    card.addEventListener('click', (e) => {
        if (e.button !== 2) {
            // Limpar dados temporários para começar novo processo
            localStorage.removeItem('formularioData');
            localStorage.removeItem('recursosData');
            localStorage.removeItem('pontuacaoData');
            localStorage.removeItem('editingMode');
            
            // Se quiser editar a solução existente, seria necessário carregar os dados
            // Mas conforme solicitado, vamos iniciar novo processo
            window.location.href = 'form-novo-projeto.html';
        }
    });

    // CLIQUE DIREITO: Menu de contexto
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        rightClickedSolutionDocId = solucao.docId;
        rightClickedSolutionId = solucao.id;
        
        console.log(`🖱️ Solução clicada: docId=${rightClickedSolutionDocId}, id=${rightClickedSolutionId}`);
        
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
            renderizarSolucoesDemo(grid);
        }
    } catch (error) {
        console.error('Erro ao carregar soluções:', error);
        showError(grid, 'Erro de conexão com o banco de dados.');
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

// ============================================================================
// PÁGINA DE FORMULÁRIO (form-novo-projeto.html)
// ============================================================================

function initFormPage() {
    loadFormData();
    setupFormNavigation();
    setupOptionCards();
}

function loadFormData() {
    const savedData = localStorage.getItem('formularioData');
    if (savedData) {
        formData = JSON.parse(savedData);
    }
}

function setupFormNavigation() {
    showFormStep(0);
    
    document.querySelectorAll('.btn-avancar').forEach(btn => {
        btn.addEventListener('click', advanceStep);
    });
    
    document.querySelectorAll('.btn-voltar').forEach(btn => {
        btn.addEventListener('click', goBackStep);
    });
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
            if (input.checked) {
                formData[input.name || input.id] = input.value;
            }
        } else {
            formData[input.name || input.id] = input.value;
        }
    });
    
    saveFormData();
}

function saveFormData() {
    localStorage.setItem('formularioData', JSON.stringify(formData));
}

function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// ============================================================================
// PÁGINA KILL SWITCH (killswitch.html) - COM CORREÇÕES
// ============================================================================

function initKillSwitchPage() {
    loadPontuacaoData();
    setupKillSwitchListeners();
    setupSliders();
    setupKillSwitchNavigation();
    calculateAndDisplayScore();
}

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

function setupKillSwitchListeners() {
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.checked = pontuacaoData.killSwitch >= index + 1;
        checkbox.addEventListener('change', updateKillSwitch);
    });
}

function setupSliders() {
    // NOVO: Atualizar cor dos sliders para laranja
    document.querySelectorAll('.matriz-positiva input[type="range"]').forEach((slider, index) => {
        const value = pontuacaoData.matrizPositiva[index] || 1;
        slider.value = value;
        slider.nextElementSibling.textContent = value;
        updateSliderBackground(slider); // NOVA FUNÇÃO
        slider.addEventListener('input', handleSliderInput);
        slider.addEventListener('change', calculateAndDisplayScore);
    });
    
    document.querySelectorAll('.matriz-negativa input[type="range"]').forEach((slider, index) => {
        const value = pontuacaoData.matrizNegativa[index] || 1;
        slider.value = value;
        slider.nextElementSibling.textContent = value;
        updateSliderBackground(slider); // NOVA FUNÇÃO
        slider.addEventListener('input', handleSliderInput);
        slider.addEventListener('change', calculateAndDisplayScore);
    });
}

// NOVA FUNÇÃO: Atualizar background do slider para laranja
function updateSliderBackground(slider) {
    const value = slider.value;
    const min = slider.min || 1;
    const max = slider.max || 10;
    const percent = ((value - min) / (max - min)) * 100;
    
    // Atualizar cor da parte preenchida para laranja
    slider.style.background = `linear-gradient(to right, #FF6B35 0%, #FF6B35 ${percent}%, #e0e0e0 ${percent}%, #e0e0e0 100%)`;
}

function handleSliderInput(event) {
    const slider = event.target;
    slider.nextElementSibling.textContent = slider.value;
    updateSliderBackground(slider);
}

function updateKillSwitch() {
    const checkboxes = document.querySelectorAll('.kill-switch input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    pontuacaoData.killSwitch = checkedCount;
    calculateAndDisplayScore();
}

// CORREÇÃO DA FÓRMULA (item 2 da solicitação)
function calculateAndDisplayScore() {
    const killSwitchCount = pontuacaoData.killSwitch;
    
    const slidersPositiva = document.querySelectorAll('.matriz-positiva input[type="range"]');
    const somaPositiva = Array.from(slidersPositiva).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    
    const slidersNegativa = document.querySelectorAll('.matriz-negativa input[type="range"]');
    const somaNegativa = Math.max(Array.from(slidersNegativa).reduce((sum, slider) => sum + parseInt(slider.value), 0), 1);
    
    // NOVA FÓRMULA: (46,666 / (a * (x/y))) * 100
    let score = 0;
    if (killSwitchCount > 0 && somaNegativa > 0 && somaPositiva > 0) {
        score = (46.666 / (killSwitchCount * (somaPositiva / somaNegativa))) * 100;
    }
    
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
    if (scoreBar) {
        scoreBar.style.width = `${score}%`;
        scoreBar.style.backgroundColor = score >= 60 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#F44336';
    }
    
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

function savePontuacaoData() {
    localStorage.setItem('pontuacaoData', JSON.stringify(pontuacaoData));
}

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

function initCanvasPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || generateId();
    
    loadCanvasData();
    setupCanvasCells();
    setupCanvasNavigation();
}

function loadCanvasData() {
    const saved = localStorage.getItem(`canvas_${currentSolutionId}`);
    if (saved) {
        canvasData = JSON.parse(saved);
    } else {
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
    
    Object.keys(canvasData).forEach(campoId => {
        updateCanvasCell(campoId, canvasData[campoId]);
    });
}

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

function updateCanvasCell(campoId, conteudo) {
    const celula = document.getElementById(campoId);
    if (!celula) return;
    
    const textoExibido = conteudo.length > 100 ? 
        conteudo.substring(0, 100) + '...' : 
        conteudo || 'Clique para editar...';
    
    celula.querySelector('p').textContent = textoExibido;
    celula.setAttribute('data-conteudo', conteudo);
    
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
    textarea.style.minHeight = '300px';
    textarea.style.maxHeight = '400px';
    textarea.style.overflowY = 'auto';
    textarea.focus();
    
    popup.querySelector('#cancelCanvas').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    popup.querySelector('#saveCanvas').addEventListener('click', () => {
        const novoConteudo = textarea.value;
        updateCanvasCell(campoId, novoConteudo);
        saveCanvasData();
        document.body.removeChild(popup);
    });
    
    popup.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(popup);
        }
    });
    
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

function saveCanvasData() {
    localStorage.setItem(`canvas_${currentSolutionId}`, JSON.stringify(canvasData));
}

function setupCanvasNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        window.location.href = 'killswitch.html';
    });
    
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
            icone: '💡',
            status: 'Em análise' // Status padrão
        };
        
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.adicionarSolucao(solucaoData);
            
            if (resultado.success) {
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
                
                limparDadosTemporarios();
                
                showNotification('✅ Solução cadastrada com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showNotification('❌ Erro ao salvar solução: ' + resultado.error, 'error');
            }
        } else {
            const solucoes = JSON.parse(localStorage.getItem('solucoesDemo') || '[]');
            solucoes.push({
                id: currentSolutionId,
                ...solucaoData
            });
            localStorage.setItem('solucoesDemo', JSON.stringify(solucoes));
            
            localStorage.setItem(`formulario_${currentSolutionId}`, JSON.stringify(formularioData));
            localStorage.setItem(`recursos_${currentSolutionId}`, JSON.stringify(recursosData));
            localStorage.setItem(`pontuacao_${currentSolutionId}`, JSON.stringify(pontuacaoData));
            
            limparDadosTemporarios();
            
            showNotification('✅ Solução salva em modo demo (localStorage).', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Erro ao salvar solução:', error);
        showNotification('❌ Erro ao salvar a solução. Verifique o console para detalhes.', 'error');
    }
}

function limparDadosTemporarios() {
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosData');
    localStorage.removeItem('pontuacaoData');
    localStorage.removeItem(`canvas_${currentSolutionId}`);
}

// ============================================================================
// PÁGINA AVALIAÇÃO (avaliacao.html) - NOVA FUNCIONALIDADE
// ============================================================================

function initAvaliacaoPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || localStorage.getItem('avaliacaoSolutionId');
    
    if (!currentSolutionId) {
        showNotification('Nenhuma solução selecionada para avaliação', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    carregarStatusSolucao();
    carregarAvaliacoes();
    setupAvaliacaoListeners();
    setupEstrelasMedia();
}

async function carregarStatusSolucao() {
    const statusSelect = document.getElementById('statusSelect');
    if (!statusSelect) return;
    
    try {
        const docId = localStorage.getItem('avaliacaoSolutionDocId');
        if (docId && typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.obterStatusSolucao(docId);
            if (resultado.success) {
                statusSelect.value = resultado.status || '';
            }
        }
        
        statusSelect.addEventListener('change', async function() {
            const novoStatus = this.value;
            const docId = localStorage.getItem('avaliacaoSolutionDocId');
            
            if (docId && typeof BancoDeDados !== 'undefined') {
                const resultado = await BancoDeDados.atualizarStatusSolucao(docId, novoStatus);
                if (resultado.success) {
                    showNotification('Status atualizado com sucesso!', 'success');
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar status:', error);
    }
}

async function carregarAvaliacoes() {
    const grid = document.getElementById('avaliacoesGrid');
    if (!grid) return;
    
    showLoading(grid);
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.listarAvaliacoes(currentSolutionId);
            
            if (resultado.success && resultado.data) {
                renderizarAvaliacoes(grid, resultado.data);
                calcularMediaEstrelas(resultado.data);
            } else {
                grid.innerHTML = '<div class="no-data">Nenhuma avaliação encontrada</div>';
            }
        } else {
            // Modo demo
            const avaliacoesDemo = JSON.parse(localStorage.getItem(`avaliacoes_${currentSolutionId}`) || '[]');
            renderizarAvaliacoes(grid, avaliacoesDemo);
            calcularMediaEstrelas(avaliacoesDemo);
        }
    } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        showError(grid, 'Erro ao carregar avaliações.');
    }
}

function renderizarAvaliacoes(grid, avaliacoes) {
    grid.innerHTML = '';
    
    if (avaliacoes.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'avaliacao-card empty';
        emptyCard.innerHTML = `
            <div class="avaliacao-content">
                <span class="avaliacao-icon">📝</span>
                <h3>Nenhuma Avaliação</h3>
                <p>Clique em "Nova Avaliação" para adicionar a primeira</p>
            </div>
        `;
        grid.appendChild(emptyCard);
        return;
    }
    
    avaliacoes.forEach(avaliacao => {
        const card = document.createElement('div');
        card.className = 'avaliacao-card';
        
        const estrelas = '★'.repeat(avaliacao.estrelas) + '☆'.repeat(5 - avaliacao.estrelas);
        
        card.innerHTML = `
            <div class="avaliacao-header">
                <span class="avaliador">${avaliacao.avaliador || 'Avaliador'}</span>
                <span class="data">${formatarData(avaliacao.dataRegistro)}</span>
            </div>
            <div class="estrelas-avaliacao">${estrelas}</div>
            <div class="comentario">${avaliacao.comentario || 'Sem comentário'}</div>
        `;
        
        grid.appendChild(card);
    });
}

function calcularMediaEstrelas(avaliacoes) {
    if (!avaliacoes || avaliacoes.length === 0) {
        updateEstrelasMedia(0);
        return;
    }
    
    const soma = avaliacoes.reduce((total, av) => total + (av.estrelas || 0), 0);
    const media = soma / avaliacoes.length;
    updateEstrelasMedia(media);
}

function updateEstrelasMedia(media) {
    const container = document.getElementById('estrelasMedia');
    if (!container) return;
    
    container.innerHTML = '';
    const estrelasInteiras = Math.floor(media);
    const temMeia = media % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
        const estrela = document.createElement('span');
        estrela.className = 'estrela-media';
        
        if (i < estrelasInteiras) {
            estrela.textContent = '★';
        } else if (i === estrelasInteiras && temMeia) {
            estrela.textContent = '⭐';
        } else {
            estrela.textContent = '☆';
        }
        
        container.appendChild(estrela);
    }
    
    const texto = document.createElement('span');
    texto.className = 'media-texto';
    texto.textContent = ` (${media.toFixed(1)})`;
    container.appendChild(texto);
}

function setupAvaliacaoListeners() {
    // Botão Nova Avaliação
    document.getElementById('btnNovaAvaliacao').addEventListener('click', openNovaAvaliacaoPopup);
    
    // Botão Voltar
    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Configurar estrelas no popup
    setupEstrelasInput();
}

function setupEstrelasInput() {
    const estrelasContainer = document.querySelector('.estrelas-input');
    if (!estrelasContainer) return;
    
    const estrelas = estrelasContainer.querySelectorAll('.estrela');
    const estrelasValue = document.getElementById('estrelasValue');
    
    estrelas.forEach(estrela => {
        estrela.addEventListener('click', function() {
            const valor = parseInt(this.getAttribute('data-value'));
            
            // Atualizar visual das estrelas
            estrelas.forEach((e, index) => {
                if (index < valor) {
                    e.textContent = '★';
                    e.style.color = '#FFD700';
                } else {
                    e.textContent = '☆';
                    e.style.color = '#ccc';
                }
            });
            
            estrelasValue.value = valor;
        });
    });
}

function openNovaAvaliacaoPopup() {
    const popup = document.getElementById('popupNovaAvaliacao');
    if (!popup) return;
    
    // Resetar formulário
    document.getElementById('avaliadorSelect').value = '';
    document.getElementById('comentarioAvaliacao').value = '';
    
    // Resetar estrelas
    const estrelas = document.querySelectorAll('.estrela');
    estrelas.forEach(e => {
        e.textContent = '☆';
        e.style.color = '#ccc';
    });
    document.getElementById('estrelasValue').value = '0';
    
    popup.style.display = 'flex';
    
    // Configurar botões do popup
    document.getElementById('btnCancelarAvaliacao').onclick = () => {
        popup.style.display = 'none';
    };
    
    document.getElementById('btnSalvarAvaliacao').onclick = salvarNovaAvaliacao;
}

async function salvarNovaAvaliacao() {
    const avaliador = document.getElementById('avaliadorSelect').value;
    const comentario = document.getElementById('comentarioAvaliacao').value;
    const estrelas = parseInt(document.getElementById('estrelasValue').value);
    
    if (!avaliador || !comentario || estrelas === 0) {
        showNotification('Preencha todos os campos da avaliação', 'warning');
        return;
    }
    
    const avaliacaoData = {
        avaliador,
        comentario,
        estrelas,
        dataRegistro: new Date().toISOString()
    };
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.salvarAvaliacao(currentSolutionId, avaliacaoData);
            
            if (resultado.success) {
                showNotification('Avaliação salva com sucesso!', 'success');
                document.getElementById('popupNovaAvaliacao').style.display = 'none';
                carregarAvaliacoes();
            } else {
                throw new Error(resultado.error);
            }
        } else {
            // Modo demo
            const avaliacoes = JSON.parse(localStorage.getItem(`avaliacoes_${currentSolutionId}`) || '[]');
            avaliacoes.push({
                ...avaliacaoData,
                docId: generateId()
            });
            localStorage.setItem(`avaliacoes_${currentSolutionId}`, JSON.stringify(avaliacoes));
            
            showNotification('Avaliação salva (modo demo)', 'success');
            document.getElementById('popupNovaAvaliacao').style.display = 'none';
            carregarAvaliacoes();
        }
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        showNotification('Erro ao salvar avaliação', 'error');
    }
}

// ============================================================================
// PÁGINA HISTÓRICO (historico.html) - NOVA FUNCIONALIDADE
// ============================================================================

function initHistoricoPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || localStorage.getItem('historicoSolutionId');
    
    if (!currentSolutionId) {
        showNotification('Nenhuma solução selecionada para histórico', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    
    carregarRelatorios();
    setupHistoricoListeners();
}

async function carregarRelatorios() {
    const container = document.getElementById('historicoContainer');
    if (!container) return;
    
    showLoading(container);
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.listarRelatorios(currentSolutionId);
            
            if (resultado.success && resultado.data) {
                renderizarRelatorios(container, resultado.data);
            } else {
                container.innerHTML = '<div class="no-data">Nenhum relatório encontrado</div>';
            }
        } else {
            const relatoriosDemo = JSON.parse(localStorage.getItem(`relatorios_${currentSolutionId}`) || '[]');
            renderizarRelatorios(container, relatoriosDemo);
        }
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showError(container, 'Erro ao carregar relatórios.');
    }
}

function renderizarRelatorios(container, relatorios) {
    container.innerHTML = '';
    
    if (relatorios.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'relatorio-card empty';
        emptyCard.innerHTML = `
            <div class="relatorio-content">
                <span class="relatorio-icon">📋</span>
                <h3>Nenhum Relatório</h3>
                <p>Clique em "Adicionar Relatório" para criar o primeiro</p>
            </div>
        `;
        container.appendChild(emptyCard);
        return;
    }
    
    relatorios.forEach(relatorio => {
        const card = document.createElement('div');
        card.className = 'relatorio-card';
        card.dataset.docId = relatorio.docId;
        
        card.innerHTML = `
            <div class="relatorio-header">
                <h3 class="relatorio-titulo">${relatorio.titulo || 'Sem título'}</h3>
                <button class="delete-relatorio-btn" title="Excluir relatório">🗑️</button>
            </div>
            <div class="relatorio-meta">
                <span class="relatorio-autor">${relatorio.autor || 'Autor desconhecido'}</span>
                <span class="relatorio-data">${formatarData(relatorio.dataRegistro)}</span>
            </div>
            <div class="relatorio-descricao">${relatorio.descricao || 'Sem descrição'}</div>
        `;
        
        // Evento para excluir relatório
        const deleteBtn = card.querySelector('.delete-relatorio-btn');
        deleteBtn.addEventListener('click', () => {
            const docId = relatorio.docId;
            openConfirmarExclusaoPopup(docId, card);
        });
        
        container.appendChild(card);
    });
}

function setupHistoricoListeners() {
    // Botão Adicionar Relatório
    document.getElementById('btnAdicionarRelatorio').addEventListener('click', openAdicionarRelatorioPopup);
    
    // Botão Voltar
    document.getElementById('btnVoltarHistorico').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

function openAdicionarRelatorioPopup() {
    const popup = document.getElementById('popupRelatorio');
    if (!popup) return;
    
    // Resetar formulário
    document.getElementById('tituloRelatorio').value = '';
    document.getElementById('autorRelatorio').value = '';
    document.getElementById('descricaoRelatorio').value = '';
    
    popup.style.display = 'flex';
    
    document.getElementById('btnCancelarRelatorio').onclick = () => {
        popup.style.display = 'none';
    };
    
    document.getElementById('btnSalvarRelatorio').onclick = salvarNovoRelatorio;
}

async function salvarNovoRelatorio() {
    const titulo = document.getElementById('tituloRelatorio').value.trim();
    const autor = document.getElementById('autorRelatorio').value.trim();
    const descricao = document.getElementById('descricaoRelatorio').value.trim();
    
    if (!titulo || !autor || !descricao) {
        showNotification('Preencha todos os campos do relatório', 'warning');
        return;
    }
    
    const relatorioData = {
        titulo,
        autor,
        descricao,
        dataRegistro: new Date().toISOString()
    };
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.salvarRelatorio(currentSolutionId, relatorioData);
            
            if (resultado.success) {
                showNotification('Relatório salvo com sucesso!', 'success');
                document.getElementById('popupRelatorio').style.display = 'none';
                carregarRelatorios();
            } else {
                throw new Error(resultado.error);
            }
        } else {
            const relatorios = JSON.parse(localStorage.getItem(`relatorios_${currentSolutionId}`) || '[]');
            relatorios.push({
                ...relatorioData,
                docId: generateId()
            });
            localStorage.setItem(`relatorios_${currentSolutionId}`, JSON.stringify(relatorios));
            
            showNotification('Relatório salvo (modo demo)', 'success');
            document.getElementById('popupRelatorio').style.display = 'none';
            carregarRelatorios();
        }
    } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        showNotification('Erro ao salvar relatório', 'error');
    }
}

function openConfirmarExclusaoPopup(docId, cardElement) {
    const popup = document.getElementById('popupConfirmarExclusao');
    if (!popup) return;
    
    popup.style.display = 'flex';
    
    document.getElementById('btnCancelarExclusao').onclick = () => {
        popup.style.display = 'none';
    };
    
    document.getElementById('btnConfirmarExclusao').onclick = async () => {
        try {
            if (typeof BancoDeDados !== 'undefined') {
                const resultado = await BancoDeDados.excluirRelatorio(docId);
                
                if (resultado.success) {
                    showNotification('Relatório excluído com sucesso!', 'success');
                    popup.style.display = 'none';
                    carregarRelatorios();
                } else {
                    throw new Error(resultado.error);
                }
            } else {
                // Modo demo
                const relatorios = JSON.parse(localStorage.getItem(`relatorios_${currentSolutionId}`) || '[]');
                const novosRelatorios = relatorios.filter(r => r.docId !== docId);
                localStorage.setItem(`relatorios_${currentSolutionId}`, JSON.stringify(novosRelatorios));
                
                showNotification('Relatório excluído (modo demo)', 'success');
                popup.style.display = 'none';
                cardElement.remove();
            }
        } catch (error) {
            console.error('Erro ao excluir relatório:', error);
            showNotification('Erro ao excluir relatório', 'error');
        }
    };
}

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS
// ============================================================================

function formatarData(dataString) {
    if (!dataString) return 'Data desconhecida';
    
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dataString;
    }
}

function showNotification(message, type = 'info') {
    const existing = document.getElementById('global-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'global-notification';
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-text">${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#FF9800'};
        color: white;
        padding: 15px 20px;
        border-radius: var(--borda-arredondada);
        box-shadow: var(--sombra-media);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-family: 'Comfortaa', cursive;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

function initTooltips() {
    // Pode ser implementado se necessário
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

function renderizarSolucoesDemo(grid) {
    const solucoesDemo = JSON.parse(localStorage.getItem('solucoesDemo') || '[]');
    renderizarSolucoes(grid, solucoesDemo);
}

// ============================================================================
// ANIMAÇÕES CSS
// ============================================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    /* Estilos para avaliações */
    .avaliacao-card {
        background: white;
        border-radius: var(--borda-arredondada);
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: var(--sombra-leve);
        border: 1px solid var(--cinza-claro);
    }
    
    .avaliacao-card.empty {
        text-align: center;
        padding: 40px 20px;
        border: 2px dashed var(--cinza-medio);
    }
    
    .avaliacao-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 0.9em;
        color: var(--cinza-escuro);
    }
    
    .estrelas-avaliacao {
        font-size: 1.5em;
        color: #FFD700;
        margin-bottom: 10px;
    }
    
    .comentario {
        line-height: 1.5;
        color: var(--cinza-escuro);
    }
    
    /* Estilos para histórico */
    .relatorio-card {
        background: white;
        border-radius: var(--borda-arredondada);
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: var(--sombra-leve);
        border-left: 4px solid var(--cor-laranja);
    }
    
    .relatorio-card.empty {
        text-align: center;
        padding: 40px 20px;
        border: 2px dashed var(--cinza-medio);
    }
    
    .relatorio-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .relatorio-titulo {
        margin: 0;
        color: var(--cor-laranja);
        font-size: 1.2em;
    }
    
    .delete-relatorio-btn {
        background: none;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
        color: var(--cinza-medio);
        transition: var(--transicao);
    }
    
    .delete-relatorio-btn:hover {
        color: #f44336;
    }
    
    .relatorio-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.9em;
        color: var(--cinza-medio);
        margin-bottom: 15px;
    }
    
    .relatorio-descricao {
        line-height: 1.6;
        color: var(--cinza-escuro);
        white-space: pre-line;
    }
    
    /* Estrelas média */
    .estrelas-media {
        font-size: 2em;
        text-align: center;
        margin: 20px 0;
    }
    
    .estrela-media {
        margin: 0 5px;
    }
    
    .media-texto {
        font-size: 0.6em;
        vertical-align: middle;
        color: var(--cinza-escuro);
    }
`;
document.head.appendChild(style);

// ============================================================================
// EXPORTAÇÃO PARA ESCOPO GLOBAL
// ============================================================================

window.app = {
    carregarSolucoes,
    salvarSoluçãoCompleta,
    calculateAndDisplayScore,
    carregarAvaliacoes,
    carregarRelatorios
};

console.log('Sistema SASGP atualizado com sucesso!');