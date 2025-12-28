// script.js - Sistema de Gerenciamento de Soluções SASGP
// VERSÃO COMPLETA CORRIGIDA - Resolve TODOS os problemas

// ============================================================================
// 1. CONFIGURAÇÕES GLOBAIS E ESTADO
// ============================================================================
let currentSolutionId = null;
let currentSolutionDocId = null;
let editMode = false;
let currentStep = 0;
let isSaving = false; // Flag para evitar salvamentos simultâneos

// Estado dos dados - CORRIGIDO: Chaves correspondem aos IDs do HTML
let formData = {
    nomeSolucao: '',
    descricaoSolucao: '',
    tipoSolucao: ''
};

let recursosTexto = '';
let pontuacaoData = {
    killSwitch: 0,
    matrizPositiva: [1, 1, 1, 1],
    matrizNegativa: [1, 1, 1],
    score: 0
};

// CanvasData com nomes IDENTICOS aos IDs do HTML
let canvasData = {
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

let solucaoAtual = null;
let tempSolutionId = null; // ID temporário durante criação

const totalSteps = 4;
const cores = ['laranja', 'azul', 'roxo'];
const iconsList = ['🤖','🦄','🧠','👩🏼‍🦰','👨🏼‍🦰','🏃🏼‍♀️','💪🏼','🎮','🏆','🧩','🛠️','📑','📊','🚀','🌎','🔥','💡'];

// ============================================================================
// 2. INICIALIZAÇÃO (ROTEAMENTO)
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema SASGP inicializando...');
    
    const page = getCurrentPage();
    console.log(`📄 Página atual: ${page}`);
    
    // Configurar tooltips
    initTooltips();
    
    // Roteamento baseado na página
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
        default:
            console.log(`ℹ️ Página não mapeada: ${page}`);
    }
});

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

function showLoading(element) {
    if (element) {
        element.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Carregando...</p>
            </div>
        `;
    }
}

function showError(element, message) {
    if (element) {
        element.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p class="error">${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// ============================================================================
// 3. PÁGINA INICIAL (INDEX)
// ============================================================================

async function initIndexPage() {
    console.log('🏠 Inicializando página inicial...');
    await carregarSolucoes();
    setupContextMenuListeners();
}

async function carregarSolucoes() {
    const grid = document.getElementById('solutionsGrid');
    if (!grid) return;
    
    showLoading(grid);
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            console.log('📡 Buscando soluções no Firebase...');
            const resultado = await BancoDeDados.listarSolucoes();
            
            if (resultado.success && resultado.data) {
                renderizarSolucoes(grid, resultado.data);
            } else {
                console.error('❌ Falha ao carregar soluções:', resultado.error);
                showError(grid, 'Erro ao carregar soluções.');
            }
        } else {
            // Modo demo (fallback)
            console.log('💾 Modo demo: carregando do localStorage');
            const demo = JSON.parse(localStorage.getItem('solucoesDemo') || '[]');
            renderizarSolucoes(grid, demo);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar soluções:', error);
        showError(grid, 'Erro de conexão com o banco de dados.');
    }
}

function renderizarSolucoes(grid, solucoes) {
    grid.innerHTML = '';
    
    if (!solucoes || solucoes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📂</div>
                <h3>Nenhuma solução encontrada</h3>
                <p>Crie sua primeira solução clicando no botão "+" abaixo</p>
            </div>
        `;
    } else {
        solucoes.forEach((solucao, index) => {
            const cor = cores[index % 3];
            grid.appendChild(createSolutionCard(solucao, cor));
        });
    }
    
    // Adicionar card para nova solução
    grid.appendChild(createAddNewCard());
}

function createSolutionCard(solucao, cor) {
    const card = document.createElement('div');
    card.className = `solution-card ${cor}`;
    
    const icon = solucao.icone || '💡';
    const score = solucao.score ? `${solucao.score.toFixed(1)}%` : '0%';
    
    card.innerHTML = `
        <div class="card-image">
            <div class="placeholder">${icon}</div>
        </div>
        <div class="card-title">${solucao.nome || 'Solução Digital'}</div>
        <div class="card-score">${score}</div>
    `;
    
    // Clique esquerdo: Abrir para edição
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirEdicaoSolucao(solucao);
    });

    // Clique direito: Menu de contexto
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        window.rightClickedSolution = {
            docId: solucao.docId,
            id: solucao.id,
            nome: solucao.nome
        };
        
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'flex';
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.style.left = `${e.pageX}px`;
        }
    });
    
    return card;
}

function createAddNewCard() {
    const card = document.createElement('div');
    card.className = 'solution-card add-new-card';
    card.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 10px;">+</div>
        <div class="card-title">Nova Solução</div>
    `;
    
    card.addEventListener('click', () => {
        limparDadosTemporarios();
        window.location.href = 'form-novo-projeto.html';
    });
    
    return card;
}

function abrirEdicaoSolucao(solucao) {
    console.log(`✏️ Abrindo solução para edição: ${solucao.nome}`);
    
    // Salvar dados para transição
    localStorage.setItem('editSolutionData', JSON.stringify(solucao));
    
    // Navegar para o formulário com parâmetros
    const params = new URLSearchParams({
        docId: solucao.docId,
        id: solucao.id,
        edit: 'true'
    });
    
    window.location.href = `form-novo-projeto.html?${params.toString()}`;
}

// ============================================================================
// 4. MENU DE CONTEXTO E POPUPS
// ============================================================================

function setupContextMenuListeners() {
    // Fechar menu ao clicar em qualquer lugar
    document.addEventListener('click', () => {
        const menu = document.getElementById('contextMenu');
        if (menu) menu.style.display = 'none';
    });

    // Configurar ações do menu
    document.getElementById('ctxRename')?.addEventListener('click', openRenamePopup);
    document.getElementById('ctxIcon')?.addEventListener('click', openIconPopup);
    document.getElementById('ctxDelete')?.addEventListener('click', openDeletePopup);

    // Configurar popups
    setupPopupActions();
}

function setupPopupActions() {
    // Renomear
    document.getElementById('btnCancelRename')?.addEventListener('click', () => closePopup('popupRename'));
    document.getElementById('btnSaveRename')?.addEventListener('click', async () => {
        const newName = document.getElementById('inputNewName').value.trim();
        
        if (newName && window.rightClickedSolution?.docId) {
            try {
                await BancoDeDados.atualizarSolucao(window.rightClickedSolution.docId, { nome: newName });
                closePopup('popupRename');
                await carregarSolucoes();
                mostrarNotificacao('✅ Nome atualizado com sucesso!', 'success');
            } catch (error) {
                mostrarNotificacao('❌ Erro ao atualizar nome', 'error');
            }
        }
    });

    // Ícone
    document.getElementById('btnCancelIcon')?.addEventListener('click', () => closePopup('popupIcon'));
    document.getElementById('btnSaveIcon')?.addEventListener('click', async () => {
        const selectedIcon = document.querySelector('.icon-option.selected');
        
        if (selectedIcon && window.rightClickedSolution?.docId) {
            try {
                await BancoDeDados.atualizarSolucao(window.rightClickedSolution.docId, { 
                    icone: selectedIcon.textContent 
                });
                closePopup('popupIcon');
                await carregarSolucoes();
                mostrarNotificacao('✅ Ícone atualizado com sucesso!', 'success');
            } catch (error) {
                mostrarNotificacao('❌ Erro ao atualizar ícone', 'error');
            }
        }
    });

    // Excluir
    document.getElementById('btnCancelDelete')?.addEventListener('click', () => closePopup('popupDelete'));
    document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
        const solucao = window.rightClickedSolution;
        
        if (solucao?.docId) {
            const btn = document.getElementById('btnConfirmDelete');
            btn.innerText = "Apagando...";
            btn.disabled = true;
            
            try {
                // Usar exclusão completa (com cascata)
                if (BancoDeDados.excluirSolucaoCompleta) {
                    await BancoDeDados.excluirSolucaoCompleta(solucao.docId, solucao.id);
                } else {
                    await BancoDeDados.excluirSolucao(solucao.docId);
                }
                
                closePopup('popupDelete');
                await carregarSolucoes();
                mostrarNotificacao('✅ Solução excluída com sucesso!', 'success');
            } catch (error) {
                mostrarNotificacao('❌ Erro ao excluir solução', 'error');
            } finally {
                btn.innerText = "Apagar";
                btn.disabled = false;
            }
        }
    });
}

function openRenamePopup() {
    if (window.rightClickedSolution) {
        document.getElementById('inputNewName').value = window.rightClickedSolution.nome || '';
        document.getElementById('popupRename').style.display = 'flex';
        document.getElementById('inputNewName').focus();
    }
}

function openIconPopup() {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = '';
    
    iconsList.forEach(icon => {
        const el = document.createElement('div');
        el.className = 'icon-option';
        el.textContent = icon;
        
        el.onclick = () => {
            document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
        };
        
        grid.appendChild(el);
    });
    
    document.getElementById('popupIcon').style.display = 'flex';
}

function openDeletePopup() {
    if (window.rightClickedSolution) {
        document.getElementById('popupDelete').style.display = 'flex';
    }
}

function closePopup(id) {
    document.getElementById(id).style.display = 'none';
}

// ============================================================================
// 5. PÁGINA 1: FORMULÁRIO
// ============================================================================

async function initFormPage() {
    console.log('📋 Inicializando página do formulário...');
    
    const params = new URLSearchParams(window.location.search);
    currentSolutionDocId = params.get('docId');
    currentSolutionId = params.get('id');
    editMode = params.get('edit') === 'true';
    
    console.log(`Modo: ${editMode ? 'Edição' : 'Criação'}`);
    console.log(`DocID: ${currentSolutionDocId}, ID: ${currentSolutionId}`);
    
    // Configurar navegação
    setupFormNavigation();
    
    // Configurar cards de opções
    setupOptionCards();
    
    // Carregar dados existentes se for edição
    if (editMode && currentSolutionDocId) {
        await carregarSolucaoExistente();
    } else {
        // Carregar dados do localStorage para nova solução
        loadFormData();
    }
}

async function carregarSolucaoExistente() {
    try {
        console.log(`🔍 Carregando solução existente: ${currentSolutionDocId}`);
        const res = await BancoDeDados.obterSolucaoPorDocId(currentSolutionDocId);
        
        if (res.success && res.data) {
            solucaoAtual = res.data;
            
            // Popular dados no formulário
            formData.nomeSolucao = solucaoAtual.nome || '';
            formData.descricaoSolucao = solucaoAtual.descricao || '';
            formData.tipoSolucao = solucaoAtual.tipo || '';
            
            // Atualizar campos visuais
            if (document.getElementById('nomeSolucao')) {
                document.getElementById('nomeSolucao').value = solucaoAtual.nome;
            }
            
            if (document.getElementById('descricaoSolucao')) {
                document.getElementById('descricaoSolucao').value = solucaoAtual.descricao;
            }
            
            // Selecionar tipo correspondente
            setTimeout(() => {
                document.querySelectorAll('.option-card').forEach(card => {
                    if (card.getAttribute('data-value') === solucaoAtual.tipo) {
                        card.classList.add('selected');
                    }
                });
            }, 100);
            
            // Atualizar título da página
            const titleEl = document.querySelector('.form-title');
            if (titleEl) {
                titleEl.textContent = `Editando: ${solucaoAtual.nome}`;
            }
            
            console.log('✅ Solução carregada com sucesso');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar solução:', error);
        mostrarNotificacao('❌ Erro ao carregar dados da solução', 'error');
    }
}

function loadFormData() {
    const saved = localStorage.getItem('formularioData');
    if (saved) {
        try {
            formData = JSON.parse(saved);
            
            if (document.getElementById('nomeSolucao')) {
                document.getElementById('nomeSolucao').value = formData.nomeSolucao || '';
            }
            
            if (document.getElementById('descricaoSolucao')) {
                document.getElementById('descricaoSolucao').value = formData.descricaoSolucao || '';
            }
            
            console.log('💾 Dados do formulário carregados do localStorage');
        } catch (error) {
            console.error('❌ Erro ao carregar dados do formulário:', error);
        }
    }
}

function setupFormNavigation() {
    // Mostrar primeiro passo
    showFormStep(0);
    
    // Configurar botões de avançar
    document.querySelectorAll('.btn-avancar').forEach(btn => {
        btn.addEventListener('click', advanceStep);
    });
    
    // Configurar botões de voltar
    document.querySelectorAll('.btn-voltar').forEach(btn => {
        btn.addEventListener('click', goBackStep);
    });
}

function setupOptionCards() {
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            // Remover seleção de todas as cards
            document.querySelectorAll('.option-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Selecionar esta card
            this.classList.add('selected');
            
            // Salvar tipo selecionado
            formData.tipoSolucao = this.getAttribute('data-value');
            saveFormData();
            
            console.log(`📌 Tipo selecionado: ${formData.tipoSolucao}`);
        });
    });
}

function showFormStep(index) {
    // Esconder todos os passos
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
        step.style.display = 'none';
    });
    
    // Mostrar passo atual
    const step = document.getElementById(`step${index}`);
    if (step) {
        step.classList.add('active');
        step.style.display = 'block';
        currentStep = index;
        updateProgressBar();
        
        console.log(`📊 Passo atual: ${index + 1}/${totalSteps}`);
    }
}

function advanceStep() {
    // Salvar dados do passo atual
    saveCurrentStepData();
    
    // Validações específicas por passo
    if (currentStep === 1 && !formData.tipoSolucao) {
        mostrarNotificacao('⚠️ Selecione um tipo de solução', 'warning');
        return;
    }
    
    if (currentStep === 2 && !formData.nomeSolucao?.trim()) {
        mostrarNotificacao('⚠️ Informe o nome da solução', 'warning');
        document.getElementById('nomeSolucao').focus();
        return;
    }
    
    // Avançar para próximo passo ou próxima página
    if (currentStep < totalSteps - 1) {
        showFormStep(currentStep + 1);
    } else {
        // Último passo: ir para recursos
        if (editMode) {
            atualizarSolucaoBasica();
        }
        
        const params = editMode ? 
            `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        
        window.location.href = `recursos.html${params}`;
    }
}

function goBackStep() {
    saveCurrentStepData();
    
    if (currentStep > 0) {
        showFormStep(currentStep - 1);
    } else {
        window.location.href = 'index.html';
    }
}

async function atualizarSolucaoBasica() {
    try {
        await BancoDeDados.atualizarSolucao(currentSolutionDocId, {
            nome: formData.nomeSolucao,
            descricao: formData.descricaoSolucao,
            tipo: formData.tipoSolucao
        });
        
        console.log('✅ Dados básicos da solução atualizados');
    } catch (error) {
        console.error('❌ Erro ao atualizar solução:', error);
    }
}

function saveCurrentStepData() {
    const step = document.getElementById(`step${currentStep}`);
    if (!step) return;
    
    // Salvar valores dos campos
    step.querySelectorAll('input, textarea').forEach(field => {
        if (field.id) {
            formData[field.id] = field.value;
        }
    });
    
    saveFormData();
}

function saveFormData() {
    localStorage.setItem('formularioData', JSON.stringify(formData));
}

function updateProgressBar() {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

// ============================================================================
// 6. PÁGINA 2: RECURSOS (PROBLEMA 01 CORRIGIDO)
// ============================================================================

async function initRecursosPage() {
    console.log('💼 Inicializando página de recursos...');
    
    const params = new URLSearchParams(window.location.search);
    currentSolutionDocId = params.get('docId');
    currentSolutionId = params.get('id');
    editMode = params.get('edit') === 'true';
    
    console.log(`Modo: ${editMode ? 'Edição' : 'Criação'}`);
    console.log(`DocID: ${currentSolutionDocId}, ID: ${currentSolutionId}`);
    
    // Gerar ID temporário se necessário (nova solução)
    if (!currentSolutionId && !editMode) {
        tempSolutionId = 'temp_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        console.log(`🆔 ID temporário gerado: ${tempSolutionId}`);
    }
    
    // Aplicar animação de entrada
    applyPageAnimation();
    
    // Carregar recursos existentes
    await loadRecursosTexto();
    
    // Configurar eventos
    setupRecursosEvents();
    
    console.log('✅ Página de recursos inicializada');
}

function applyPageAnimation() {
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.style.opacity = '0';
        formContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            formContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            formContainer.style.opacity = '1';
            formContainer.style.transform = 'translateY(0)';
        }, 100);
    }
}

async function loadRecursosTexto() {
    console.log('📥 Carregando texto de recursos...');
    
    let textoCarregado = '';
    
    // 1. Tentar carregar do banco (modo edição)
    if (editMode && currentSolutionId && typeof BancoDeDados !== 'undefined') {
        try {
            console.log(`🔍 Buscando recursos no banco para ID: ${currentSolutionId}`);
            const resultado = await BancoDeDados.obterRecursos(currentSolutionId);
            
            if (resultado.success && resultado.data !== undefined) {
                textoCarregado = resultado.data;
                console.log(`✅ Recursos carregados do banco (${textoCarregado.length} caracteres)`);
            } else {
                console.log('ℹ️ Nenhum recurso encontrado no banco');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar recursos do banco:', error);
        }
    }
    
    // 2. Se não encontrou no banco, tentar localStorage
    if (!textoCarregado) {
        // Verificar se há recursos salvos para ID temporário
        if (tempSolutionId) {
            const chaveTemp = `recursos_temp_${tempSolutionId}`;
            textoCarregado = localStorage.getItem(chaveTemp) || '';
            
            if (textoCarregado) {
                console.log(`💾 Recursos carregados do localStorage temporário: ${chaveTemp}`);
            }
        }
        
        // Se ainda não tem, tentar localStorage geral
        if (!textoCarregado) {
            textoCarregado = localStorage.getItem('recursosTexto') || '';
            if (textoCarregado) {
                console.log('💾 Recursos carregados do localStorage geral');
            }
        }
    }
    
    // Atualizar variável global e textarea
    recursosTexto = textoCarregado;
    
    const textarea = document.getElementById('recursosTexto');
    if (textarea) {
        textarea.value = recursosTexto;
        console.log(`✅ Textarea atualizado com ${recursosTexto.length} caracteres`);
    }
}

function setupRecursosEvents() {
    const textarea = document.getElementById('recursosTexto');
    const btnVoltar = document.querySelector('.btn-voltar');
    const btnAvancar = document.querySelector('.btn-avancar');
    
    if (!textarea || !btnVoltar || !btnAvancar) return;
    
    // Salvar automaticamente ao digitar (debounced)
    let saveTimeout;
    textarea.addEventListener('input', (e) => {
        recursosTexto = e.target.value;
        
        // Salvar no localStorage imediatamente
        localStorage.setItem('recursosTexto', recursosTexto);
        
        // Salvar no localStorage temporário se necessário
        if (tempSolutionId) {
            localStorage.setItem(`recursos_temp_${tempSolutionId}`, recursosTexto);
        }
        
        // Debounced save to Firebase (apenas em edição)
        if (editMode && currentSolutionId) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                salvarRecursosNoBanco();
            }, 2000);
        }
    });
    
    // Botão Voltar
    btnVoltar.addEventListener('click', async () => {
        // Salvar antes de sair
        await salvarRecursosNoBanco();
        
        // Navegar de volta
        const params = editMode ? 
            `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        
        window.location.href = `form-novo-projeto.html${params}`;
    });
    
    // Botão Avançar
    btnAvancar.addEventListener('click', async () => {
        if (isSaving) return;
        isSaving = true;
        
        const textoOriginal = btnAvancar.innerHTML;
        btnAvancar.innerHTML = '⏳ Salvando...';
        btnAvancar.disabled = true;
        
        try {
            // 1. Salvar recursos no banco
            console.log('💾 Salvando recursos antes de avançar...');
            await salvarRecursosNoBanco();
            
            // 2. Animação de saída
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                formContainer.style.opacity = '0';
                formContainer.style.transform = 'translateY(-20px)';
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // 3. Navegar para próxima página
            const params = editMode ? 
                `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
            
            window.location.href = `killswitch.html${params}`;
            
        } catch (error) {
            console.error('❌ Erro ao avançar:', error);
            mostrarNotificacao('❌ Erro ao salvar recursos', 'error');
            
            btnAvancar.innerHTML = textoOriginal;
            btnAvancar.disabled = false;
            isSaving = false;
        }
    });
}

async function salvarRecursosNoBanco() {
    // Obter texto atual
    const textarea = document.getElementById('recursosTexto');
    if (textarea) {
        recursosTexto = textarea.value.trim();
    }
    
    // Salvar no localStorage
    localStorage.setItem('recursosTexto', recursosTexto);
    
    // Se tem ID temporário, salvar com chave específica
    if (tempSolutionId) {
        localStorage.setItem(`recursos_temp_${tempSolutionId}`, recursosTexto);
    }
    
    // Salvar no Firebase se possível
    const idParaSalvar = editMode ? currentSolutionId : tempSolutionId;
    
    if (idParaSalvar && typeof BancoDeDados !== 'undefined' && recursosTexto !== '') {
        try {
            console.log(`🔥 Salvando recursos no Firebase para ID: ${idParaSalvar}`);
            const resultado = await BancoDeDados.salvarRecursos(idParaSalvar, recursosTexto);
            
            if (resultado.success) {
                console.log('✅ Recursos salvos no Firebase com sucesso');
                return resultado;
            } else {
                throw new Error(resultado.error);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar recursos no Firebase:', error);
            // Não mostrar erro ao usuário, apenas logar
            return { success: false, error: error.message };
        }
    }
    
    return { success: true };
}

// ============================================================================
// 7. PÁGINA 3: KILLSWITCH
// ============================================================================

async function initKillSwitchPage() {
    console.log('🔋 Inicializando página Kill Switch...');
    
    const params = new URLSearchParams(window.location.search);
    currentSolutionDocId = params.get('docId');
    currentSolutionId = params.get('id');
    editMode = params.get('edit') === 'true';
    
    // Carregar dados existentes
    await loadPontuacaoData();
    
    // Configurar UI
    setupKillSwitchUI();
    
    // Calcular score inicial
    calculateAndDisplayScore();
    
    // Configurar eventos
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        const params = editMode ? 
            `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        
        window.location.href = `recursos.html${params}`;
    });
    
    document.querySelector('.btn-avancar')?.addEventListener('click', () => {
        // Salvar no localStorage
        localStorage.setItem('pontuacaoData', JSON.stringify(pontuacaoData));
        
        // Navegar para canvas
        const params = editMode ? 
            `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        
        window.location.href = `canvas.html${params}`;
    });
}

async function loadPontuacaoData() {
    // Carregar do banco se for edição
    if (editMode && currentSolutionDocId) {
        try {
            const res = await BancoDeDados.obterSolucaoPorDocId(currentSolutionDocId);
            if (res.success && res.data && res.data.dadosKillswitch) {
                pontuacaoData = res.data.dadosKillswitch;
                console.log('✅ Dados de pontuação carregados do banco');
                return;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pontuação do banco:', error);
        }
    }
    
    // Carregar do localStorage
    const local = localStorage.getItem('pontuacaoData');
    if (local) {
        try {
            pontuacaoData = JSON.parse(local);
            console.log('💾 Dados de pontuação carregados do localStorage');
        } catch (error) {
            console.error('❌ Erro ao parsear dados de pontuação:', error);
        }
    }
}

function setupKillSwitchUI() {
    // Configurar checkboxes do Kill Switch
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.checked = pontuacaoData.killSwitch > index;
        checkbox.addEventListener('change', calculateAndDisplayScore);
    });
    
    // Configurar sliders da matriz positiva
    document.querySelectorAll('.matriz-positiva input[type="range"]').forEach((slider, index) => {
        const valor = pontuacaoData.matrizPositiva ? pontuacaoData.matrizPositiva[index] : 1;
        slider.value = valor;
        slider.nextElementSibling.textContent = valor;
        
        slider.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
            calculateAndDisplayScore();
        });
    });
    
    // Configurar sliders da matriz negativa
    document.querySelectorAll('.matriz-negativa input[type="range"]').forEach((slider, index) => {
        const valor = pontuacaoData.matrizNegativa ? pontuacaoData.matrizNegativa[index] : 1;
        slider.value = valor;
        slider.nextElementSibling.textContent = valor;
        
        slider.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
            calculateAndDisplayScore();
        });
    });
}

function calculateAndDisplayScore() {
    // Calcular Kill Switch
    const ksCount = document.querySelectorAll('.kill-switch input[type="checkbox"]:checked').length;
    pontuacaoData.killSwitch = ksCount;
    
    // Calcular matriz positiva
    let sumPos = 0;
    pontuacaoData.matrizPositiva = [];
    
    document.querySelectorAll('.matriz-positiva input[type="range"]').forEach((slider, index) => {
        const valor = parseInt(slider.value);
        sumPos += valor;
        pontuacaoData.matrizPositiva[index] = valor;
    });
    
    // Calcular matriz negativa
    let sumNeg = 0;
    pontuacaoData.matrizNegativa = [];
    
    document.querySelectorAll('.matriz-negativa input[type="range"]').forEach((slider, index) => {
        const valor = parseInt(slider.value);
        sumNeg += valor;
        pontuacaoData.matrizNegativa[index] = valor;
    });
    
    // Evitar divisão por zero
    if (sumNeg === 0) sumNeg = 1;
    
    // Cálculo do score (fórmula: (killSwitch * (somaPositiva / somaNegativa)) / 46.7 * 100)
    let rawScore = (ksCount * (sumPos / sumNeg));
    let score = (rawScore / 46.7) * 100;
    
    // Limitar entre 0 e 100
    score = Math.max(0, Math.min(100, score));
    pontuacaoData.score = score;
    
    // Atualizar UI
    const scoreValue = document.getElementById('scoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const scoreComment = document.getElementById('scoreComment');
    
    if (scoreValue) {
        scoreValue.textContent = `${score.toFixed(1)}%`;
        scoreValue.style.color = getScoreColor(score);
    }
    
    if (scoreBar) {
        scoreBar.style.width = `${score}%`;
        scoreBar.style.background = getScoreColor(score);
    }
    
    if (scoreComment) {
        scoreComment.textContent = getScoreComment(score);
        scoreComment.style.color = getScoreColor(score);
    }
    
    console.log(`📊 Score calculado: ${score.toFixed(1)}%`);
}

function getScoreColor(score) {
    if (score >= 80) return '#00C851'; // Verde
    if (score >= 60) return '#FFBB33'; // Amarelo
    if (score >= 40) return '#FF8800'; // Laranja
    return '#FF4444'; // Vermelho
}

function getScoreComment(score) {
    if (score >= 80) return 'Excelente! Alta prioridade.';
    if (score >= 60) return 'Bom potencial. Avaliar detalhes.';
    if (score >= 40) return 'Potencial moderado. Revisar critérios.';
    return 'Baixo potencial. Considerar alternativas.';
}

// ============================================================================
// 8. PÁGINA 4: CANVAS (PROBLEMA 03 CORRIGIDO)
// ============================================================================

async function initCanvasPage() {
    console.log('🎨 Inicializando página Canvas...');
    
    const params = new URLSearchParams(window.location.search);
    currentSolutionDocId = params.get('docId');
    currentSolutionId = params.get('id');
    editMode = params.get('edit') === 'true';
    
    console.log(`Modo: ${editMode ? 'Edição' : 'Criação'}`);
    console.log(`DocID: ${currentSolutionDocId}, ID: ${currentSolutionId}`);
    
    // Carregar dados existentes da solução
    if (editMode && currentSolutionDocId) {
        try {
            const res = await BancoDeDados.obterSolucaoPorDocId(currentSolutionDocId);
            if (res.success) {
                solucaoAtual = res.data;
                console.log('✅ Dados da solução carregados');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar solução:', error);
        }
    }
    
    // Carregar dados do canvas
    await loadCanvasData();
    
    // Configurar interações
    setupCanvasInteractions();
    
    // Configurar eventos dos botões
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        const params = editMode ? 
            `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        
        window.location.href = `killswitch.html${params}`;
    });
    
    document.querySelector('.btn-finalizar')?.addEventListener('click', async () => {
        await finalizarSalvarTudo();
    });
    
    console.log('✅ Página Canvas inicializada');
}

async function loadCanvasData() {
    console.log('📥 Carregando dados do Canvas...');
    
    // Lista de IDs dos campos do canvas (correspondem aos IDs do HTML)
    const camposCanvas = [
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
    
    // Inicializar canvasData com valores padrão
    camposCanvas.forEach(campo => {
        if (!canvasData.hasOwnProperty(campo)) {
            canvasData[campo] = '';
        }
    });
    
    // 1. Tentar carregar do Firebase (modo edição)
    if (editMode && currentSolutionId && typeof BancoDeDados !== 'undefined') {
        try {
            console.log(`🔍 Buscando canvas no banco para ID: ${currentSolutionId}`);
            const resultado = await BancoDeDados.obterCanvas(currentSolutionId);
            
            if (resultado.success && resultado.data) {
                console.log('✅ Dados do canvas encontrados no banco');
                
                // Preencher canvasData com dados do banco
                camposCanvas.forEach(campo => {
                    if (resultado.data[campo] !== undefined) {
                        canvasData[campo] = resultado.data[campo];
                    }
                });
                
                console.log('📊 CanvasData após carregar do banco:', canvasData);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar canvas do banco:', error);
        }
    }
    
    // 2. Tentar carregar do localStorage
    const canvasLocal = localStorage.getItem('canvasData');
    if (canvasLocal) {
        try {
            const dadosLocal = JSON.parse(canvasLocal);
            console.log('💾 Dados do canvas encontrados no localStorage');
            
            // Mesclar com dados locais (preservando dados do banco se existirem)
            camposCanvas.forEach(campo => {
                if (dadosLocal[campo] !== undefined && !canvasData[campo]) {
                    canvasData[campo] = dadosLocal[campo];
                }
            });
        } catch (error) {
            console.error('❌ Erro ao parsear dados do localStorage:', error);
        }
    }
    
    // 3. Atualizar UI
    updateCanvasUI();
    
    // 4. Logar dados no console (PROBLEMA 03)
    logCanvasData();
}

function updateCanvasUI() {
    console.log('🔄 Atualizando UI do Canvas...');
    
    // Para cada campo no canvasData
    Object.keys(canvasData).forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            const paragrafo = elemento.querySelector('p');
            if (paragrafo) {
                const valor = canvasData[campo] || '';
                
                // Truncar texto para preview (PROBLEMA 03)
                if (valor.length > 50) {
                    paragrafo.textContent = valor.substring(0, 50) + '...';
                    paragrafo.title = valor; // Tooltip com texto completo
                } else {
                    paragrafo.textContent = valor || 'Clique para editar...';
                }
                
                console.log(`✅ Campo "${campo}" atualizado: ${paragrafo.textContent}`);
            }
        }
    });
}

function logCanvasData() {
    console.log('📋 === DADOS DO CANVAS ===');
    console.log(`publico-alvo: ${canvasData['publico-alvo']}`);
    console.log(`problema-resolve: ${canvasData['problema-resolve']}`);
    console.log(`formato-solucao: ${canvasData['formato-solucao']}`);
    console.log(`funcionalidades: ${canvasData['funcionalidades']}`);
    console.log(`modelo-negocio: ${canvasData['modelo-negocio']}`);
    console.log(`trl-atual: ${canvasData['trl-atual']}`);
    console.log(`trl-esperada: ${canvasData['trl-esperada']}`);
    console.log(`link-prototipo: ${canvasData['link-prototipo']}`);
    console.log(`link-pitch: ${canvasData['link-pitch']}`);
    console.log(`link-pdf: ${canvasData['link-pdf']}`);
    console.log(`escalabilidade: ${canvasData['escalabilidade']}`);
    console.log('==========================');
}

function setupCanvasInteractions() {
    const idsCanvas = [
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
    
    idsCanvas.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('click', () => {
                const titulo = elemento.querySelector('h3').textContent;
                abrirEditorCanvas(id, titulo);
            });
        }
    });
}

function abrirEditorCanvas(id, titulo) {
    console.log(`✏️ Abrindo editor para: ${id}`);
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.display = 'flex';
    
    const valorAtual = canvasData[id] || '';
    
    overlay.innerHTML = `
        <div class="popup-content canvas-popup" style="max-width: 600px;">
            <h3>${titulo}</h3>
            <textarea id="canvasEditorText" 
                      style="width:100%; height:200px; padding:10px; margin:15px 0; border-radius:5px; border:2px solid var(--cinza-medio); font-family: 'Comfortaa', cursive;"
                      placeholder="Digite aqui...">${valorAtual}</textarea>
            <div class="popup-buttons">
                <button class="btn btn-secondary" id="btnCancelarCanvas">Cancelar</button>
                <button class="btn btn-primary" id="btnSalvarCanvas">Salvar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focar no textarea
    const textarea = overlay.querySelector('#canvasEditorText');
    textarea.focus();
    
    // Botão Cancelar
    overlay.querySelector('#btnCancelarCanvas').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    // Botão Salvar
    overlay.querySelector('#btnSalvarCanvas').addEventListener('click', () => {
        const novoValor = textarea.value.trim();
        
        // Atualizar canvasData
        canvasData[id] = novoValor;
        
        // Salvar no localStorage
        localStorage.setItem('canvasData', JSON.stringify(canvasData));
        
        // Atualizar UI
        updateCanvasUI();
        
        // Logar dados atualizados (PROBLEMA 03)
        logCanvasData();
        
        // Fechar overlay
        document.body.removeChild(overlay);
        
        // Mostrar notificação
        mostrarNotificacao('✅ Campo atualizado!', 'success');
    });
    
    // Fechar com ESC
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
        }
    });
}

async function finalizarSalvarTudo() {
    if (isSaving) return;
    isSaving = true;
    
    const btn = document.querySelector('.btn-finalizar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '⏳ Salvando tudo...';
    btn.disabled = true;
    
    console.log('🚀 Iniciando salvamento completo...');
    
    try {
        // 1. Coletar todos os dados
        const formD = JSON.parse(localStorage.getItem('formularioData') || '{}');
        const recTexto = recursosTexto || localStorage.getItem('recursosTexto') || '';
        const pontD = JSON.parse(localStorage.getItem('pontuacaoData') || '{}');
        
        // Garantir que temos os dados mais recentes do canvas
        await loadCanvasData();
        
        // 2. Preparar dados da solução
        const iconeFinal = (editMode && solucaoAtual?.icone) ? 
            solucaoAtual.icone : (formD.icone || '💡');
        
        const solucaoBase = {
            nome: formD.nomeSolucao || 'Solução Sem Nome',
            descricao: formD.descricaoSolucao || '',
            tipo: formD.tipoSolucao || 'Outros',
            icone: iconeFinal,
            score: pontD.score || 0,
            dadosKillswitch: pontD,
            status: 'em-analise',
            dataAtualizacao: new Date().toISOString()
        };
        
        let finalIdInterno = currentSolutionId;
        let finalDocId = currentSolutionDocId;
        
        // 3. Criar ou atualizar solução principal
        if (!editMode || !currentSolutionDocId) {
            console.log('🆕 Criando nova solução...');
            solucaoBase.dataCriacao = new Date().toISOString();
            
            const resCriacao = await BancoDeDados.adicionarSolucao(solucaoBase);
            
            if (resCriacao.success) {
                finalIdInterno = resCriacao.id;
                finalDocId = resCriacao.docId;
                console.log(`✅ Solução criada: ID=${finalIdInterno}, DocID=${finalDocId}`);
            } else {
                throw new Error(resCriacao.error || 'Erro ao criar solução');
            }
        } else {
            console.log('✏️ Atualizando solução existente...');
            const resAtualizacao = await BancoDeDados.atualizarSolucao(currentSolutionDocId, solucaoBase);
            
            if (!resAtualizacao.success) {
                throw new Error(resAtualizacao.error || 'Erro ao atualizar solução');
            }
        }
        
        // 4. Salvar recursos (PROBLEMA 01)
        console.log('💾 Salvando recursos...');
        if (recTexto.trim() && finalIdInterno) {
            const resRecursos = await BancoDeDados.salvarRecursos(finalIdInterno, recTexto);
            
            if (!resRecursos.success) {
                console.warn('⚠️ Aviso ao salvar recursos:', resRecursos.error);
            } else {
                console.log('✅ Recursos salvos com sucesso');
            }
        }
        
        // 5. Salvar canvas (PROBLEMA 03)
        console.log('🎨 Salvando canvas...');
        console.log('Dados do canvas a serem salvados:', canvasData);
        
        if (finalIdInterno) {
            const resCanvas = await BancoDeDados.salvarCanvas(finalIdInterno, canvasData);
            
            if (!resCanvas.success) {
                console.warn('⚠️ Aviso ao salvar canvas:', resCanvas.error);
            } else {
                console.log('✅ Canvas salvo com sucesso');
            }
        }
        
        // 6. Log final do canvas (PROBLEMA 03)
        logCanvasData();
        
        // 7. Notificação de sucesso
        mostrarNotificacao('✅ Solução salva com sucesso!', 'success');
        
        // 8. Limpar dados temporários
        limparDadosTemporarios();
        
        // 9. Redirecionar para página inicial
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Erro fatal ao salvar tudo:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
        
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        isSaving = false;
    }
}

// ============================================================================
// 9. FUNÇÕES UTILITÁRIAS
// ============================================================================

function limparDadosTemporarios() {
    console.log('🧹 Limpando dados temporários...');
    
    const itensParaManter = ['solucoesDemo']; // Manter dados demo se existirem
    
    // Remover apenas os dados do fluxo atual
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosTexto');
    localStorage.removeItem('pontuacaoData');
    localStorage.removeItem('canvasData');
    localStorage.removeItem('editSolutionData');
    
    // Remover recursos temporários
    if (tempSolutionId) {
        localStorage.removeItem(`recursos_temp_${tempSolutionId}`);
    }
    
    console.log('✅ Dados temporários limpos');
}

function initTooltips() {
    // Implementação básica de tooltips
    const tooltipElements = document.querySelectorAll('[title]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.title;
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            
            e.target._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (e.target._tooltip) {
                document.body.removeChild(e.target._tooltip);
                delete e.target._tooltip;
            }
        });
    });
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Implementação independente para evitar recursão
    const tipos = {
        success: { cor: '#00C851', icone: '✅' },
        warning: { cor: '#FF8800', icone: '⚠️' },
        error: { cor: '#ff4444', icone: '❌' },
        info: { cor: '#4A90E2', icone: 'ℹ️' }
    };
    
    const config = tipos[tipo] || tipos.info;
    
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${config.cor};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        font-family: 'Comfortaa', cursive;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    notificacao.innerHTML = `
        <span style="font-size: 1.2rem;">${config.icone}</span>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
    
    // Adicionar estilos de animação se não existirem
    if (!document.querySelector('#animation-styles')) {
        const style = document.createElement('style');
        style.id = 'animation-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================================
// 10. EXPORTAÇÃO PARA DEBUG
// ============================================================================

window.SistemaSASGP = {
    // Estado atual
    getEstado: () => ({
        currentSolutionId,
        currentSolutionDocId,
        editMode,
        formData,
        recursosTexto,
        pontuacaoData,
        canvasData,
        solucaoAtual
    }),
    
    // Funções principais
    carregarSolucoes,
    finalizarSalvarTudo,
    loadCanvasData,
    logCanvasData: () => {
        console.log('📋 === DADOS DO CANVAS (via SistemaSASGP) ===');
        Object.keys(canvasData).forEach(key => {
            console.log(`${key}: ${canvasData[key]}`);
        });
        console.log('=============================================');
    },
    
    // Utilitários
    limparDadosTemporarios,
    mostrarNotificacao
};

console.log('✅ Sistema SASGP carregado com sucesso!');
console.log('🛠️  Para debug, use: window.SistemaSASGP');