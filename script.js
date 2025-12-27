// script.js - Sistema de Gerenciamento de Soluções SASGP
// Versão Atualizada - Correções de Navegação, Context Menu e Cálculo Math

// ==============================
// CONFIGURAÇÕES GLOBAIS E CONSTANTES
// ==============================

let currentSolutionId = null;     // ID Interno (gerado pelo sistema)
let currentSolutionDocId = null;  // ID do Documento Firestore
let currentStep = 0;
let formData = {};
let recursosData = [];
let pontuacaoData = {};
let canvasData = {};
let solucaoAtual = null; 
let editMode = false;

const totalSteps = 4;
const cores = ['laranja', 'azul', 'roxo'];
const iconsList = ['🤖','🦄','🧠','👩🏼‍🦰','👨🏼‍🦰','🏃🏼‍♀️','💪🏼','🎮','🏆','🧩','🛠️','📑','📊','🚀','🌎','🔥','💡'];

// ==============================
// INICIALIZAÇÃO DO SISTEMA
// ==============================

document.addEventListener('DOMContentLoaded', function() {
    const page = getCurrentPage();
    
    // Inicialização baseada na página atual
    if (page === 'index.html' || page === '') {
        initIndexPage();
    } else if (page.includes('form-novo-projeto.html')) {
        initFormPage();
    } else if (page.includes('recursos.html')) {
        initRecursosPage();
    } else if (page.includes('killswitch.html')) {
        initKillSwitchPage();
    } else if (page.includes('canvas.html')) {
        initCanvasPage();
    }
    
    initTooltips();
});

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || 'index.html';
}

function showLoading(element) {
    if(element) element.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando...</p></div>';
}

function showError(element, message) {
    if(element) {
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

// ==============================
// PÁGINA INICIAL (index.html) E CONTEXT MENU
// ==============================

async function initIndexPage() {
    await carregarSolucoes();
    setupContextMenuListeners();
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
                showError(grid, 'Erro ao carregar soluções do banco de dados.');
            }
        } else {
            // Modo demo/fallback
            const solucoesDemo = JSON.parse(localStorage.getItem('solucoesDemo') || '[]');
            renderizarSolucoes(grid, solucoesDemo);
        }
    } catch (error) {
        console.error('Erro ao carregar soluções:', error);
        showError(grid, 'Erro ao conectar com o banco de dados.');
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
    
    // CLIQUE ESQUERDO: Navegar para FORMULÁRIO (Edição)
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        // Garante que vai para a página inicial do fluxo de edição
        abrirEdicaoSolucao(solucao);
    });

    // CLIQUE DIREITO: Menu de Contexto
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Armazena dados essenciais para as ações
        // docId: ID do documento no Firestore (usado para update/delete)
        // id: ID interno da solução (usado para deletar coleções filhas)
        window.rightClickedSolution = {
            docId: solucao.docId, 
            id: solucao.id,       
            nome: solucao.nome
        };
        
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'flex';
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
    });
    
    return card;
}

function abrirEdicaoSolucao(solucao) {
    // Salva dados temporários para facilitar o carregamento
    localStorage.setItem('editSolutionData', JSON.stringify(solucao));
    
    // Redireciona explicitamente para o formulário de novo projeto
    // Passando docId (Firestore) e id (Interno)
    const params = new URLSearchParams({
        docId: solucao.docId,
        id: solucao.id,
        edit: 'true'
    });
    
    window.location.href = `form-novo-projeto.html?${params.toString()}`;
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

// ==============================
// MENU DE CONTEXTO (AÇÕES)
// ==============================

function setupContextMenuListeners() {
    // Esconder menu ao clicar fora
    document.addEventListener('click', function() {
        const menu = document.getElementById('contextMenu');
        if(menu) menu.style.display = 'none';
    });

    // Vincular botões do menu
    const btnRename = document.getElementById('ctxRename');
    const btnIcon = document.getElementById('ctxIcon');
    const btnDelete = document.getElementById('ctxDelete');

    if(btnRename) btnRename.addEventListener('click', openRenamePopup);
    if(btnIcon) btnIcon.addEventListener('click', openIconPopup);
    if(btnDelete) btnDelete.addEventListener('click', openDeletePopup);

    // Configurar ações dos Popups
    setupPopupActions();
}

function setupPopupActions() {
    // --- RENOMEAR ---
    document.getElementById('btnCancelRename')?.addEventListener('click', () => closePopup('popupRename'));
    document.getElementById('btnSaveRename')?.addEventListener('click', async () => {
        const newName = document.getElementById('inputNewName').value.trim();
        
        if (newName && window.rightClickedSolution?.docId) {
            try {
                // Chama atualização usando o docId do Firestore
                const resultado = await BancoDeDados.atualizarSolucao(
                    window.rightClickedSolution.docId, 
                    { nome: newName }
                );
                
                if (resultado.success) {
                    closePopup('popupRename');
                    carregarSolucoes(); // Recarrega a grid
                    mostrarNotificacao('✅ Nome atualizado com sucesso!', 'success');
                } else {
                    mostrarNotificacao('❌ Erro: ' + resultado.error, 'error');
                }
            } catch (error) {
                console.error(error);
                mostrarNotificacao('❌ Erro ao processar', 'error');
            }
        } else {
            mostrarNotificacao('Digite um nome válido', 'warning');
        }
    });

    // --- ÍCONE ---
    document.getElementById('btnCancelIcon')?.addEventListener('click', () => closePopup('popupIcon'));
    document.getElementById('btnSaveIcon')?.addEventListener('click', async () => {
        const selectedIcon = document.querySelector('.icon-option.selected');
        
        if (selectedIcon && window.rightClickedSolution?.docId) {
            try {
                const resultado = await BancoDeDados.atualizarSolucao(
                    window.rightClickedSolution.docId, 
                    { icone: selectedIcon.textContent }
                );
                
                if (resultado.success) {
                    closePopup('popupIcon');
                    carregarSolucoes();
                    mostrarNotificacao('✅ Ícone atualizado!', 'success');
                } else {
                    mostrarNotificacao('❌ Erro: ' + resultado.error, 'error');
                }
            } catch (error) {
                console.error(error);
                mostrarNotificacao('❌ Erro ao atualizar ícone', 'error');
            }
        } else {
            mostrarNotificacao('Selecione um ícone', 'warning');
        }
    });

    // --- EXCLUIR ---
    document.getElementById('btnCancelDelete')?.addEventListener('click', () => closePopup('popupDelete'));
    document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
        const solucao = window.rightClickedSolution;
        
        if (solucao?.docId) {
            const btnConfirm = document.getElementById('btnConfirmDelete');
            btnConfirm.innerText = "Apagando...";
            btnConfirm.disabled = true;

            try {
                // Tenta usar a função completa de exclusão (será criada no banco.js)
                // Passamos docId (para apagar o resumo) e id (para apagar os filhos)
                let resultado;
                if (BancoDeDados.excluirSolucaoCompleta) {
                    resultado = await BancoDeDados.excluirSolucaoCompleta(solucao.docId, solucao.id);
                } else {
                    // Fallback se a função nova não existir ainda
                    resultado = await BancoDeDados.excluirSolucao(solucao.docId);
                }

                if (resultado.success) {
                    closePopup('popupDelete');
                    carregarSolucoes();
                    mostrarNotificacao('✅ Solução e dados excluídos!', 'success');
                } else {
                    mostrarNotificacao('❌ Erro ao excluir: ' + resultado.error, 'error');
                }
            } catch (error) {
                console.error(error);
                mostrarNotificacao('❌ Erro inesperado', 'error');
            } finally {
                btnConfirm.innerText = "Apagar";
                btnConfirm.disabled = false;
            }
        }
    });
}

function openRenamePopup() {
    const popup = document.getElementById('popupRename');
    const input = document.getElementById('inputNewName');
    
    if (window.rightClickedSolution) {
        input.value = window.rightClickedSolution.nome || '';
        popup.style.display = 'flex';
        input.focus();
    }
}

function openIconPopup() {
    const popup = document.getElementById('popupIcon');
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
    
    // Seleção padrão
    if(grid.firstChild) grid.firstChild.classList.add('selected');
    popup.style.display = 'flex';
}

function openDeletePopup() {
    const popup = document.getElementById('popupDelete');
    if (window.rightClickedSolution) {
        popup.style.display = 'flex';
    }
}

function closePopup(id) {
    document.getElementById(id).style.display = 'none';
}

// ==============================
// PÁGINA DE FORMULÁRIO (Novo Projeto)
// ==============================

async function initFormPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionDocId = urlParams.get('docId');
    currentSolutionId = urlParams.get('id');
    editMode = urlParams.get('edit') === 'true';
    
    // Configura navegação entre passos
    setupFormNavigation();
    setupOptionCards();
    
    // Carrega dados
    await loadFormData();
    
    // Se estiver editando, busca dados frescos do banco
    if (editMode && currentSolutionDocId) {
        await carregarSolucaoExistente();
    }
}

async function loadFormData() {
    const savedData = localStorage.getItem('formularioData');
    if (savedData) {
        formData = JSON.parse(savedData);
        // Popula campos
        if (document.getElementById('nomeSolucao')) document.getElementById('nomeSolucao').value = formData.nomeSolucao || '';
        if (document.getElementById('descricaoSolucao')) document.getElementById('descricaoSolucao').value = formData.descricaoSolucao || '';
    }
}

async function carregarSolucaoExistente() {
    if (!currentSolutionDocId) return;
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.obterSolucaoPorDocId(currentSolutionDocId);
            
            if (resultado.success && resultado.data) {
                solucaoAtual = resultado.data;
                
                // Preencher campos
                if (solucaoAtual.nome) {
                    formData.nomeSolucao = solucaoAtual.nome;
                    const inputNome = document.getElementById('nomeSolucao');
                    if(inputNome) inputNome.value = solucaoAtual.nome;
                }
                
                if (solucaoAtual.descricao) {
                    formData.descricaoSolucao = solucaoAtual.descricao;
                    const inputDesc = document.getElementById('descricaoSolucao');
                    if(inputDesc) inputDesc.value = solucaoAtual.descricao;
                }
                
                if (solucaoAtual.tipo) {
                    formData.tipoSolucao = solucaoAtual.tipo;
                    // Marca visualmente a opção
                    setTimeout(() => {
                        document.querySelectorAll('.option-card').forEach(card => {
                            if (card.getAttribute('data-value') === solucaoAtual.tipo) {
                                card.classList.add('selected');
                            }
                        });
                    }, 100);
                }

                // Título da página
                const titleEl = document.querySelector('.form-title');
                if(titleEl) titleEl.textContent = `Editando: ${solucaoAtual.nome}`;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
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
            formData.tipoSolucao = this.getAttribute('data-value');
            saveFormData();
        });
    });
}

function showFormStep(index) {
    document.querySelectorAll('.form-step').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const step = document.getElementById(`step${index}`);
    if (step) {
        step.classList.add('active');
        step.style.display = 'block';
        currentStep = index;
        updateProgressBar();
    }
}

function advanceStep() {
    saveCurrentStepData();
    
    // Validações
    if (currentStep === 1 && !formData.tipoSolucao) {
        mostrarNotificacao('Selecione um tipo de solução', 'warning');
        return;
    }
    if (currentStep === 2 && !formData.nomeSolucao) {
        mostrarNotificacao('Informe o nome da solução', 'warning');
        document.getElementById('nomeSolucao').focus();
        return;
    }
    
    // Próximo passo ou Finalizar
    if (currentStep < totalSteps - 1) {
        showFormStep(currentStep + 1);
    } else {
        // Último passo do form -> Vai para Recursos
        if (editMode && currentSolutionDocId) atualizarSolucaoBasica();
        
        const params = editMode ? `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
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
    } catch(e) { console.error(e); }
}

function saveCurrentStepData() {
    const stepEl = document.getElementById(`step${currentStep}`);
    if(!stepEl) return;
    
    stepEl.querySelectorAll('input, textarea').forEach(input => {
        formData[input.id] = input.value;
    });
    saveFormData();
}

function saveFormData() {
    localStorage.setItem('formularioData', JSON.stringify(formData));
}

function updateProgressBar() {
    const bar = document.getElementById('progressBar');
    if(bar) bar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
}

// ==============================
// PÁGINA RECURSOS
// ==============================

async function initRecursosPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionDocId = urlParams.get('docId');
    currentSolutionId = urlParams.get('id');
    editMode = urlParams.get('edit') === 'true';

    await loadRecursosData();
    renderRecursosTable();
    
    document.getElementById('addRowBtn')?.addEventListener('click', () => {
        recursosData.push({ tipo: 'tempo', descricao: '' });
        renderRecursosTable();
    });

    // Navegação
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        const params = editMode ? `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        window.location.href = `form-novo-projeto.html${params}`;
    });
    
    document.querySelector('.btn-avancar')?.addEventListener('click', () => {
        localStorage.setItem('recursosData', JSON.stringify(recursosData));
        const params = editMode ? `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        window.location.href = `killswitch.html${params}`;
    });
}

async function loadRecursosData() {
    if (editMode && currentSolutionId) {
        try {
            const res = await BancoDeDados.listarRecursos(currentSolutionId);
            if (res.success && res.data.length > 0) {
                recursosData = res.data;
                return;
            }
        } catch(e) { console.error(e); }
    }
    
    const local = localStorage.getItem('recursosData');
    recursosData = local ? JSON.parse(local) : [
        { tipo: 'tempo', descricao: '' },
        { tipo: 'financeiro', descricao: '' },
        { tipo: 'equipe', descricao: '' },
        { tipo: 'equipamento', descricao: '' }
    ];
}

function renderRecursosTable() {
    const tbody = document.querySelector('#resourcesTable tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    recursosData.forEach((rec, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <select onchange="updateRecurso(${idx}, 'tipo', this.value)">
                    <option value="tempo" ${rec.tipo === 'tempo' ? 'selected' : ''}>Tempo</option>
                    <option value="financeiro" ${rec.tipo === 'financeiro' ? 'selected' : ''}>Financeiro</option>
                    <option value="equipe" ${rec.tipo === 'equipe' ? 'selected' : ''}>Equipe</option>
                    <option value="equipamento" ${rec.tipo === 'equipamento' ? 'selected' : ''}>Equipamento</option>
                </select>
            </td>
            <td>
                <textarea oninput="updateRecurso(${idx}, 'descricao', this.value)" placeholder="Descrição...">${rec.descricao || ''}</textarea>
            </td>
            <td><button class="delete-btn" onclick="removeRecurso(${idx})">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateRecurso = (idx, field, val) => {
    recursosData[idx][field] = val;
    localStorage.setItem('recursosData', JSON.stringify(recursosData));
};

window.removeRecurso = (idx) => {
    if(recursosData.length > 1) {
        recursosData.splice(idx, 1);
        renderRecursosTable();
    } else {
        mostrarNotificacao('Mínimo 1 recurso necessário', 'warning');
    }
};

// ==============================
// PÁGINA KILL SWITCH (CÁLCULO DO SCORE)
// ==============================

async function initKillSwitchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionDocId = urlParams.get('docId');
    currentSolutionId = urlParams.get('id');
    editMode = urlParams.get('edit') === 'true';

    await loadPontuacaoData();
    setupKillSwitchUI();
    calculateAndDisplayScore();
    
    // Navegação
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        const params = editMode ? `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        window.location.href = `recursos.html${params}`;
    });
    
    document.querySelector('.btn-avancar')?.addEventListener('click', () => {
        localStorage.setItem('pontuacaoData', JSON.stringify(pontuacaoData));
        const params = editMode ? `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        window.location.href = `canvas.html${params}`;
    });
}

async function loadPontuacaoData() {
    if (editMode && currentSolutionId) {
        try {
            const res = await BancoDeDados.obterPontuacao(currentSolutionId);
            if (res.success && res.data) {
                pontuacaoData = res.data;
                return;
            }
        } catch(e) { console.error(e); }
    }
    
    const local = localStorage.getItem('pontuacaoData');
    pontuacaoData = local ? JSON.parse(local) : {
        killSwitch: 0,
        matrizPositiva: [1,1,1,1],
        matrizNegativa: [1,1,1],
        score: 0
    };
}

function setupKillSwitchUI() {
    // Checkboxes Kill Switch
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach((cb, idx) => {
        cb.checked = pontuacaoData.killSwitch > idx;
        cb.addEventListener('change', calculateAndDisplayScore);
    });
    
    // Sliders
    const slidersPos = document.querySelectorAll('.matriz-positiva input[type="range"]');
    slidersPos.forEach((sl, idx) => {
        sl.value = pontuacaoData.matrizPositiva[idx] || 1;
        sl.nextElementSibling.textContent = sl.value;
        sl.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
            calculateAndDisplayScore();
        });
    });
    
    const slidersNeg = document.querySelectorAll('.matriz-negativa input[type="range"]');
    slidersNeg.forEach((sl, idx) => {
        sl.value = pontuacaoData.matrizNegativa[idx] || 1;
        sl.nextElementSibling.textContent = sl.value;
        sl.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
            calculateAndDisplayScore();
        });
    });
}

function calculateAndDisplayScore() {
    // 1. KillSwitch Count
    const checks = document.querySelectorAll('.kill-switch input[type="checkbox"]:checked');
    const ksCount = checks.length;
    pontuacaoData.killSwitch = ksCount;
    
    // 2. Soma Positiva
    let sumPos = 0;
    document.querySelectorAll('.matriz-positiva input[type="range"]').forEach((sl, i) => {
        const val = parseInt(sl.value);
        sumPos += val;
        pontuacaoData.matrizPositiva[i] = val;
    });
    
    // 3. Soma Negativa
    let sumNeg = 0;
    document.querySelectorAll('.matriz-negativa input[type="range"]').forEach((sl, i) => {
        const val = parseInt(sl.value);
        sumNeg += val;
        pontuacaoData.matrizNegativa[i] = val;
    });
    if (sumNeg === 0) sumNeg = 1;
    
    // ==========================================
    // CÁLCULO ATUALIZADO (Dividindo por 46.7)
    // ==========================================
    
    // Fórmula base
    let rawResult = (ksCount * (sumPos / sumNeg));
    
    // Aplicando a normalização solicitada
    let finalScore = (rawResult / 46.7) * 100;
    
    // Limites (0 a 100)
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    pontuacaoData.score = finalScore;
    
    // Update UI
    const scoreEl = document.getElementById('scoreValue');
    const barEl = document.getElementById('scoreBar');
    const commentEl = document.getElementById('scoreComment');
    
    if(scoreEl) {
        scoreEl.textContent = `${finalScore.toFixed(1)}%`;
        scoreEl.style.color = getScoreColor(finalScore);
    }
    if(barEl) {
        barEl.style.width = `${finalScore}%`;
        barEl.style.background = getScoreColor(finalScore);
    }
    if(commentEl) {
        commentEl.textContent = getScoreComment(finalScore);
        commentEl.style.color = getScoreColor(finalScore);
    }
}

function getScoreColor(s) {
    if(s >= 80) return '#00C851';
    if(s >= 60) return '#FFBB33';
    if(s >= 40) return '#FF8800';
    return '#FF4444';
}

function getScoreComment(s) {
    if(s >= 80) return 'Excelente! Solução altamente recomendada.';
    if(s >= 60) return 'Bom potencial. Recomenda-se análise.';
    if(s >= 40) return 'Potencial moderado. Avaliar riscos.';
    return 'Necessita revisão. Baixo potencial.';
}

// ==============================
// PÁGINA CANVAS E SALVAMENTO FINAL
// ==============================

async function initCanvasPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionDocId = urlParams.get('docId');
    currentSolutionId = urlParams.get('id');
    editMode = urlParams.get('edit') === 'true';

    await loadCanvasData();
    setupCanvasInteractions();
    
    document.querySelector('.btn-voltar')?.addEventListener('click', () => {
        const params = editMode ? `?docId=${currentSolutionDocId}&id=${currentSolutionId}&edit=true` : '';
        window.location.href = `killswitch.html${params}`;
    });
    
    document.querySelector('.btn-finalizar')?.addEventListener('click', finalizarSalvarTudo);
}

async function loadCanvasData() {
    if (editMode && currentSolutionId) {
        try {
            const res = await BancoDeDados.obterCanvas(currentSolutionId);
            if (res.success && res.data) {
                canvasData = res.data;
                updateCanvasUI();
                return;
            }
        } catch(e) { console.error(e); }
    }
    
    const local = localStorage.getItem('canvasData'); // Corrigido key para ser consistente se quiser
    if(local) canvasData = JSON.parse(local);
    else canvasData = {};
    updateCanvasUI();
}

function setupCanvasInteractions() {
    document.querySelectorAll('.canvas-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const id = cell.id;
            const title = cell.querySelector('h3').innerText;
            openCanvasEditor(id, title);
        });
    });
}

function updateCanvasUI() {
    Object.keys(canvasData).forEach(key => {
        const cell = document.getElementById(key);
        if(cell) {
            const p = cell.querySelector('p');
            const val = canvasData[key];
            p.textContent = val && val.length > 50 ? val.substr(0,50)+'...' : (val || 'Clique para editar...');
        }
    });
}

function openCanvasEditor(id, title) {
    // Cria modal dinâmico simples
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="popup-content canvas-popup">
            <h3>${title}</h3>
            <textarea style="width:100%; height:200px; margin:10px 0;">${canvasData[id] || ''}</textarea>
            <div class="popup-buttons">
                <button class="btn btn-secondary">Cancelar</button>
                <button class="btn btn-primary">Salvar</button>
            </div>
        </div>
    `;
    
    const close = () => document.body.removeChild(overlay);
    
    overlay.querySelector('.btn-secondary').onclick = close;
    overlay.querySelector('.btn-primary').onclick = () => {
        const val = overlay.querySelector('textarea').value;
        canvasData[id] = val;
        updateCanvasUI();
        localStorage.setItem('canvasData', JSON.stringify(canvasData)); // Salva localmente
        close();
    };
    
    document.body.appendChild(overlay);
}

async function finalizarSalvarTudo() {
    const btn = document.querySelector('.btn-finalizar');
    btn.innerHTML = '⏳ Salvando...';
    btn.disabled = true;
    
    try {
        const formD = JSON.parse(localStorage.getItem('formularioData') || '{}');
        const recD = JSON.parse(localStorage.getItem('recursosData') || '[]');
        const pontD = JSON.parse(localStorage.getItem('pontuacaoData') || '{}');
        const canD = canvasData; // Já está na memória
        
        const solucaoBase = {
            nome: formD.nomeSolucao || 'Sem Nome',
            descricao: formD.descricaoSolucao || '',
            tipo: formD.tipoSolucao || 'Outros',
            icone: formD.icone || '💡', // Mantém ícone se existir
            score: pontD.score || 0,
            dataAtualizacao: new Date().toISOString()
        };
        
        // Se NÃO estiver editando, adiciona data criação
        if(!editMode) solucaoBase.dataCriacao = new Date().toISOString();
        
        let finalIdInterno = currentSolutionId;
        
        if (editMode && currentSolutionDocId) {
            // ATUALIZAR
            await BancoDeDados.atualizarSolucao(currentSolutionDocId, solucaoBase);
            // Atualizar sub-coleções (Delete + Create ou Update - aqui vamos simplificar salvando novos)
            // Idealmente o banco.js trataria update inteligente, mas vamos re-salvar
            await BancoDeDados.salvarRecursos(finalIdInterno, recD);
            await BancoDeDados.salvarPontuacao(finalIdInterno, pontD.killSwitch, pontD.matrizPositiva, pontD.matrizNegativa, pontD.score);
            await BancoDeDados.salvarCanvas(finalIdInterno, canD);
            
            mostrarNotificacao('✅ Solução atualizada!', 'success');
        } else {
            // CRIAR NOVO
            const res = await BancoDeDados.adicionarSolucao(solucaoBase);
            if(res.success) {
                finalIdInterno = res.id; // O id interno gerado
                await BancoDeDados.salvarRecursos(finalIdInterno, recD);
                await BancoDeDados.salvarPontuacao(finalIdInterno, pontD.killSwitch, pontD.matrizPositiva, pontD.matrizNegativa, pontD.score);
                await BancoDeDados.salvarCanvas(finalIdInterno, canD);
                mostrarNotificacao('✅ Solução criada!', 'success');
            }
        }
        
        setTimeout(() => {
            limparDadosTemporarios();
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error(error);
        mostrarNotificacao('Erro ao salvar: ' + error.message, 'error');
        btn.innerHTML = 'Erro ao Salvar';
        btn.disabled = false;
    }
}

function limparDadosTemporarios() {
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosData');
    localStorage.removeItem('pontuacaoData');
    localStorage.removeItem('canvasData');
    localStorage.removeItem('editSolutionData');
}

function initTooltips() {
    // Implementação básica de tooltips se houver elementos com data-tooltip
}

function mostrarNotificacao(msg, tipo) {
    const div = document.createElement('div');
    div.className = `notification ${tipo}`; // Requer CSS apropriado
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.right = '20px';
    div.style.background = tipo === 'success' ? '#00C851' : '#ff4444';
    div.style.color = '#fff';
    div.style.padding = '15px';
    div.style.borderRadius = '5px';
    div.style.zIndex = 9999;
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// Exportar para debug
window.SistemaSASGP = {
    carregarSolucoes
};