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

const totalSteps = 4;
const cores = ['laranja', 'azul', 'roxo'];

// ==============================
// FUNÇÕES UTILITÁRIAS
// ==============================

// Gerar ID único para soluções
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Verificar em qual página estamos
function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

// Exibir mensagem de carregamento
function showLoading(element) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

// Exibir mensagem de erro
function showError(element, message) {
    element.innerHTML = `<p class="error">${message}</p>`;
}

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

// ==============================
// PÁGINA INICIAL (index.html)
// ==============================

function initIndexPage() {
    carregarSolucoes();
    setupEventListeners();
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
            // Fallback para demonstração
            renderizarSolucoesDemo(grid);
        }
    } catch (error) {
        console.error('Erro ao carregar soluções:', error);
        showError(grid, 'Erro de conexão com o banco de dados.');
    }
}

function renderizarSolucoes(grid, solucoes) {
    grid.innerHTML = '';
    
    // Renderizar soluções existentes
    solucoes.forEach((solucao, index) => {
        const cor = cores[index % 3];
        grid.appendChild(createSolutionCard(solucao, cor));
    });
    
    // Adicionar card para novo projeto
    grid.appendChild(createAddNewCard());
}

function renderizarSolucoesDemo(grid) {
    grid.innerHTML = '';
    
    // Dados de demonstração
    const demoSolutions = [
        { id: 'demo1', nome: 'Sistema de Gestão', descricao: 'Solução para gestão de projetos' },
        { id: 'demo2', nome: 'Portal do Cliente', descricao: 'Portal para clientes SASGP' },
        { id: 'demo3', nome: 'Analytics Dashboard', descricao: 'Dashboard de análises preditivas' },
        { id: 'demo4', nome: 'App Mobile', descricao: 'Aplicativo móvel para colaboradores' },
    ];
    
    demoSolutions.forEach((solucao, index) => {
        const cor = cores[index % 3];
        grid.appendChild(createSolutionCard(solucao, cor));
    });
    
    grid.appendChild(createAddNewCard());
}

function createSolutionCard(solucao, cor) {
    const card = document.createElement('div');
    card.className = `solution-card ${cor}`;
    card.innerHTML = `
        <div class="card-image">
            <div class="placeholder">💡</div>
        </div>
        <div class="card-title">${solucao.nome || 'Solução Digital'}</div>
    `;
    
    card.addEventListener('click', () => {
        localStorage.setItem('currentSolutionId', solucao.id || solucao.docId);
        window.location.href = `canvas.html?id=${solucao.id || solucao.docId}`;
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

function setupEventListeners() {
    // Adicionar event listeners específicos da página inicial, se necessário
}

// ==============================
// PÁGINA DE FORMULÁRIO (form-novo-projeto.html)
// ==============================

function initFormPage() {
    loadFormData();
    setupFormNavigation();
    setupOptionCards();
    setupFormValidation();
}

function loadFormData() {
    const savedData = localStorage.getItem('formularioData');
    if (savedData) {
        formData = JSON.parse(savedData);
    }
}

function setupFormNavigation() {
    // Mostrar primeiro step
    showFormStep(0);
    
    // Configurar botões de navegação
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
            // Remover seleção de todos
            document.querySelectorAll('.option-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Selecionar este
            this.classList.add('selected');
            
            // Salvar escolha
            const tipo = this.getAttribute('data-value') || this.textContent.trim();
            formData.tipoSolucao = tipo;
            saveFormData();
        });
    });
}

function setupFormValidation() {
    // Configurar validação em tempo real, se necessário
}

function showFormStep(stepIndex) {
    // Esconder todos os steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    
    // Mostrar step atual
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
        // Salvar dados do step atual
        saveCurrentStepData();
        
        // Animar transição
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            showFormStep(currentStep + 1);
            currentElement.style.animation = '';
        }, 300);
    } else {
        // Último step - ir para próxima página
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
    // Coletar dados do step atual
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
        // Dados iniciais com 4 linhas vazias
        recursosData = Array(4).fill().map(() => ({
            tipo: 'tempo',
            descricao: '',
            valor: ''
        }));
    }
}

function createResourcesTable() {
    const tbody = document.querySelector('#resourcesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    recursosData.forEach((recurso, index) => {
        const row = createResourceRow(recurso, index);
        tbody.appendChild(row);
    });
}

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
            <textarea class="resource-value" data-index="${index}" 
                      placeholder="Valor ou quantidade...">${recurso.valor || ''}</textarea>
        </td>
        <td>
            <button class="delete-btn" data-index="${index}" title="Excluir linha">🗑️</button>
        </td>
    `;
    
    // Configurar event listeners
    row.querySelector('.resource-type').addEventListener('change', updateRecursoData);
    row.querySelector('.resource-description').addEventListener('input', updateRecursoData);
    row.querySelector('.resource-value').addEventListener('input', updateRecursoData);
    row.querySelector('.delete-btn').addEventListener('click', showDeleteConfirmation);
    
    return row;
}

function updateRecursoData(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    const type = document.querySelector(`.resource-type[data-index="${index}"]`).value;
    const descricao = document.querySelector(`.resource-description[data-index="${index}"]`).value;
    const valor = document.querySelector(`.resource-value[data-index="${index}"]`).value;
    
    recursosData[index] = { tipo: type, descricao, valor };
    saveRecursosData();
}

function showDeleteConfirmation(event) {
    const index = parseInt(event.target.getAttribute('data-index'));
    
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Tem certeza?</h3>
            <p>Deseja realmente apagar esta linha?</p>
            <div class="popup-buttons">
                <button class="btn btn-secondary" id="cancelDelete">Cancelar</button>
                <button class="btn btn-primary" id="confirmDelete">Apagar linha</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    popup.style.display = 'flex';
    
    // Configurar botões do popup
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    document.getElementById('confirmDelete').addEventListener('click', () => {
        deleteResourceRow(index);
        document.body.removeChild(popup);
    });
    
    // Fechar ao clicar fora
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

function deleteResourceRow(index) {
    recursosData.splice(index, 1);
    saveRecursosData();
    createResourcesTable();
}

function setupAddRowButton() {
    const addBtn = document.getElementById('addRowBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            recursosData.push({ tipo: 'tempo', descricao: '', valor: '' });
            saveRecursosData();
            createResourcesTable();
        });
    }
}

function saveRecursosData() {
    localStorage.setItem('recursosData', JSON.stringify(recursosData));
}

function setupResourcesNavigation() {
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        window.location.href = 'form-novo-projeto.html';
    });
    
    document.querySelector('.btn-avancar')?.addEventListener('click', () => {
        saveRecursosData();
        window.location.href = 'killswitch.html';
    });
}

// ==============================
// PÁGINA KILL SWITCH (killswitch.html)
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
    // Checkboxes do Kill Switch
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.checked = pontuacaoData.killSwitch >= index + 1;
        checkbox.addEventListener('change', updateKillSwitch);
    });
}

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

function updateSliderDisplay(event) {
    event.target.nextElementSibling.textContent = event.target.value;
}

function updateKillSwitch() {
    const checkboxes = document.querySelectorAll('.kill-switch input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    pontuacaoData.killSwitch = checkedCount;
    calculateAndDisplayScore();
}

function calculateAndDisplayScore() {
    // Coletar dados atuais
    const killSwitchCount = pontuacaoData.killSwitch;
    
    const slidersPositiva = document.querySelectorAll('.matriz-positiva input[type="range"]');
    const somaPositiva = Array.from(slidersPositiva).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    
    const slidersNegativa = document.querySelectorAll('.matriz-negativa input[type="range"]');
    const somaNegativa = Math.max(Array.from(slidersNegativa).reduce((sum, slider) => sum + parseInt(slider.value), 0), 1);
    
    // Calcular score
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

function updateScoreDisplay(score) {
    const scoreElement = document.getElementById('scoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const scoreComment = document.getElementById('scoreComment');
    
    if (scoreElement) scoreElement.textContent = `${score.toFixed(1)}%`;
    if (scoreBar) scoreBar.style.width = `${score}%`;
    
    // Atualizar comentário baseado no score
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

// ==============================
// PÁGINA CANVAS (canvas.html)
// ==============================

function initCanvasPage() {
    // Obter ID da solução da URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || generateId();
    
    // Carregar dados existentes
    loadCanvasData();
    
    // Configurar células do canvas
    setupCanvasCells();
    
    // Configurar navegação
    setupCanvasNavigation();
}

function loadCanvasData() {
    const saved = localStorage.getItem(`canvas_${currentSolutionId}`);
    if (saved) {
        canvasData = JSON.parse(saved);
    } else {
        // Dados iniciais
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
    
    // Preencher células com dados carregados
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
    
    // Atualizar dados
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
    
    // Configurar textarea
    const textarea = popup.querySelector('#canvasTextarea');
    textarea.style.minHeight = '300px';
    textarea.style.maxHeight = '400px';
    textarea.style.overflowY = 'auto';
    textarea.focus();
    
    // Configurar botões
    popup.querySelector('#cancelCanvas').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
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
        // Coletar todos os dados
        const formularioData = JSON.parse(localStorage.getItem('formularioData') || '{}');
        const recursosData = JSON.parse(localStorage.getItem('recursosData') || '[]');
        const pontuacaoData = JSON.parse(localStorage.getItem('pontuacaoData') || '{}');
        
        // Preparar dados da solução
        const solucaoData = {
            nome: formularioData.nomeSolucao || 'Nova Solução',
            descricao: formularioData.descricaoSolucao || '',
            tipo: formularioData.tipoSolucao || 'Criar Nova Solução',
            dataCriacao: new Date().toISOString(),
            score: pontuacaoData.score || 0
        };
        
        // Verificar se temos acesso ao Firebase
        if (typeof BancoDeDados !== 'undefined') {
            // Salvar no Firebase
            const resultado = await BancoDeDados.adicionarSolucao(solucaoData);
            
            if (resultado.success) {
                // Salvar dados relacionados
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
                
                // Redirecionar com mensagem
                alert('✅ Solução cadastrada com sucesso!');
                window.location.href = 'index.html';
            } else {
                alert('❌ Erro ao salvar solução: ' + resultado.error);
            }
        } else {
            // Modo demo - salvar apenas no localStorage
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

function limparDadosTemporarios() {
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosData');
    localStorage.removeItem('pontuacaoData');
    
    // Limpar dados do canvas desta solução
    localStorage.removeItem(`canvas_${currentSolutionId}`);
}

// ==============================
// FUNÇÕES AUXILIARES GERAIS
// ==============================

function initTooltips() {
    // Inicializar tooltips se necessário
    document.querySelectorAll('[title]').forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    // Implementação de tooltip simples
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = event.target.title;
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
    
    tooltip.id = 'dynamic-tooltip';
    document.body.appendChild(tooltip);
}

function hideTooltip() {
    const tooltip = document.getElementById('dynamic-tooltip');
    if (tooltip) {
        document.body.removeChild(tooltip);
    }
}

// ==============================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ==============================

// Torna as funções disponíveis globalmente se necessário
window.app = {
    carregarSolucoes,
    salvarSoluçãoCompleta,
    calculateAndDisplayScore
};

console.log('Sistema SASGP carregado com sucesso!');