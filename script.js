// script.js - Versão GitHub Pages Compatível

// ==============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==============================================

let currentSolutionId = null;
let currentStep = 0;
let totalSteps = 4;
let currentFormData = {};
let canvasData = {};
let recursosData = [];
let pontuacaoData = {};

// ==============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("SASGP - Sistema de Inovação inicializando...");
    
    // Carregar dados do localStorage
    carregarDadosLocalStorage();
    
    // Determinar qual página está ativa
    const pagina = identificarPaginaAtual();
    
    // Inicializar a página correspondente
    switch(pagina) {
        case 'index':
            inicializarPaginaInicial();
            break;
        case 'form-novo-projeto':
            inicializarFormulario();
            break;
        case 'recursos':
            inicializarRecursos();
            break;
        case 'killswitch':
            inicializarKillSwitch();
            break;
        case 'canvas':
            inicializarCanvas();
            break;
        default:
            console.log("Página não identificada, redirecionando para inicial...");
            window.location.href = 'index.html';
    }
    
    // Configurar listeners globais
    configurarListenersGlobais();
});

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

function identificarPaginaAtual() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) return 'index';
    if (path.includes('form-novo-projeto.html')) return 'form-novo-projeto';
    if (path.includes('recursos.html')) return 'recursos';
    if (path.includes('killswitch.html')) return 'killswitch';
    if (path.includes('canvas.html')) return 'canvas';
    return 'index';
}

function carregarDadosLocalStorage() {
    // Carregar dados do formulário
    const formData = localStorage.getItem('formularioData');
    if (formData) {
        currentFormData = JSON.parse(formData);
    }
    
    // Carregar recursos
    const recursos = localStorage.getItem('recursosData');
    if (recursos) {
        recursosData = JSON.parse(recursos);
    }
    
    // Carregar pontuação
    const pontuacao = localStorage.getItem('pontuacaoData');
    if (pontuacao) {
        pontuacaoData = JSON.parse(pontuacao);
    }
    
    // Carregar dados do canvas
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('canvas_')) {
            canvasData[key] = localStorage.getItem(key);
        }
    });
}

function salvarDadosLocalStorage() {
    localStorage.setItem('formularioData', JSON.stringify(currentFormData));
    localStorage.setItem('recursosData', JSON.stringify(recursosData));
    localStorage.setItem('pontuacaoData', JSON.stringify(pontuacaoData));
    
    // Salvar dados do canvas
    Object.keys(canvasData).forEach(key => {
        localStorage.setItem(key, canvasData[key]);
    });
}

function limparDadosLocalStorage() {
    localStorage.removeItem('formularioData');
    localStorage.removeItem('recursosData');
    localStorage.removeItem('pontuacaoData');
    
    // Limpar apenas dados do canvas
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('canvas_')) {
            localStorage.removeItem(key);
        }
    });
    
    currentFormData = {};
    recursosData = [];
    pontuacaoData = {};
    canvasData = {};
}

function configurarListenersGlobais() {
    // Listener para botões de voltar
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-voltar')) {
            e.preventDefault();
            navegarVoltar();
        }
    });
    
    // Listener para tecla ESC (fechar popups)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.querySelector('.popup-overlay');
            if (popup) {
                document.body.removeChild(popup);
            }
        }
    });
}

function navegarVoltar() {
    const pagina = identificarPaginaAtual();
    
    switch(pagina) {
        case 'form-novo-projeto':
            window.location.href = 'index.html';
            break;
        case 'recursos':
            window.location.href = 'form-novo-projeto.html';
            break;
        case 'killswitch':
            window.location.href = 'recursos.html';
            break;
        case 'canvas':
            window.location.href = 'killswitch.html';
            break;
        default:
            window.history.back();
    }
}

// ==============================================
// PÁGINA INICIAL (index.html)
// ==============================================

function inicializarPaginaInicial() {
    console.log("Inicializando página inicial...");
    carregarSolucoesDoBanco();
    
    // Configurar botão de novo projeto
    const addButtons = document.querySelectorAll('.add-new-card, .solution-card[onclick*="novo"]');
    addButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            limparDadosLocalStorage();
            window.location.href = 'form-novo-projeto.html';
        });
    });
}

async function carregarSolucoesDoBanco() {
    const grid = document.getElementById('solutionsGrid');
    if (!grid) return;
    
    // Mostrar estado de carregamento
    grid.innerHTML = `
        <div class="loading" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>Conectando ao banco de dados...</p>
        </div>
    `;
    
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !window.db) {
        grid.innerHTML = `
            <div class="error" style="grid-column: 1 / -1;">
                <h3>Erro de Conexão</h3>
                <p>Não foi possível conectar ao banco de dados.</p>
                <p>Verifique sua conexão com a internet.</p>
                <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
        return;
    }
    
    try {
        // Usar a função do banco.js global
        const resultado = await window.banco.listarSolucoes();
        
        if (resultado.success) {
            if (resultado.data && resultado.data.length > 0) {
                exibirSolucoesNoGrid(grid, resultado.data);
            } else {
                exibirMensagemSemSolucoes(grid);
            }
        } else {
            exibirErroCarregamento(grid, resultado.error);
        }
    } catch (error) {
        console.error("Erro ao carregar soluções:", error);
        exibirErroCarregamento(grid, error.message);
    }
}

function exibirSolucoesNoGrid(grid, solucoes) {
    grid.innerHTML = '';
    
    // Ordenar por data (mais recente primeiro)
    solucoes.sort((a, b) => {
        const dateA = a.dataCriacao ? new Date(a.dataCriacao) : new Date(0);
        const dateB = b.dataCriacao ? new Date(b.dataCriacao) : new Date(0);
        return dateB - dateA;
    });
    
    // Adicionar cards de soluções
    solucoes.forEach((solucao, index) => {
        const cores = ['laranja', 'azul', 'roxo'];
        const cor = cores[index % 3];
        
        const card = document.createElement('div');
        card.className = `solution-card ${cor}`;
        card.setAttribute('data-id', solucao.id || solucao.docId);
        card.setAttribute('data-docid', solucao.docId || solucao.id);
        
        // Formatar data
        let dataFormatada = 'Data não disponível';
        if (solucao.dataCriacao) {
            const data = solucao.dataCriacao instanceof Date ? 
                solucao.dataCriacao : new Date(solucao.dataCriacao);
            dataFormatada = data.toLocaleDateString('pt-BR');
        }
        
        card.innerHTML = `
            <div class="card-image">
                ${solucao.imagem ? 
                    `<img src="${solucao.imagem}" alt="${solucao.nome || 'Solução'}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\'>💡</div>'">` : 
                    `<div class="placeholder">💡</div>`
                }
            </div>
            <div class="card-title">${solucao.nome || 'Solução sem nome'}</div>
            <div class="card-date">${dataFormatada}</div>
        `;
        
        card.addEventListener('click', function() {
            const solutionId = this.getAttribute('data-docid') || this.getAttribute('data-id');
            if (solutionId) {
                window.location.href = `canvas.html?id=${solutionId}`;
            }
        });
        
        grid.appendChild(card);
    });
    
    // Adicionar card de nova solução
    const addCard = document.createElement('div');
    addCard.className = 'solution-card add-new-card';
    addCard.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 10px;">+</div>
        <div style="font-size: 0.9rem;">Nova Solução</div>
    `;
    
    addCard.addEventListener('click', function() {
        limparDadosLocalStorage();
        window.location.href = 'form-novo-projeto.html';
    });
    
    grid.appendChild(addCard);
}

function exibirMensagemSemSolucoes(grid) {
    grid.innerHTML = `
        <div class="solution-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <h3>Nenhuma solução cadastrada</h3>
            <p>Comece criando sua primeira solução digital!</p>
            <button class="btn btn-primary" onclick="window.location.href='form-novo-projeto.html'">
                Criar Primeira Solução
            </button>
        </div>
    `;
}

function exibirErroCarregamento(grid, mensagem) {
    grid.innerHTML = `
        <div class="error" style="grid-column: 1 / -1;">
            <h3>Erro ao carregar soluções</h3>
            <p>${mensagem || 'Erro desconhecido'}</p>
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="carregarSolucoesDoBanco()">
                    Tentar Novamente
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='form-novo-projeto.html'">
                    Criar Nova Solução
                </button>
            </div>
        </div>
    `;
}

// ==============================================
// FORMULÁRIO (form-novo-projeto.html)
// ==============================================

function inicializarFormulario() {
    console.log("Inicializando formulário...");
    
    // Configurar progresso
    atualizarProgressoFormulario();
    
    // Inicializar steps
    mostrarStepFormulario(0);
    
    // Configurar opções
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.option-card').forEach(c => {
                c.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Salvar seleção
            const tipo = this.getAttribute('data-value');
            if (!currentFormData.step1) currentFormData.step1 = {};
            currentFormData.step1.tipoSolucao = tipo;
            salvarDadosLocalStorage();
        });
    });
    
    // Preencher dados existentes
    preencherDadosFormulario();
    
    // Configurar navegação
    configurarNavegacaoFormulario();
}

function mostrarStepFormulario(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
        currentStep = step;
        atualizarProgressoFormulario();
    }
}

function atualizarProgressoFormulario() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = ((currentStep + 1) / 4) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

function preencherDadosFormulario() {
    // Preencher step 2 (nome)
    if (currentFormData.step2 && currentFormData.step2.nomeSolucao) {
        const inputNome = document.getElementById('nomeSolucao');
        if (inputNome) inputNome.value = currentFormData.step2.nomeSolucao;
    }
    
    // Preencher step 3 (descrição)
    if (currentFormData.step3 && currentFormData.step3.descricaoSolucao) {
        const textareaDesc = document.getElementById('descricaoSolucao');
        if (textareaDesc) textareaDesc.value = currentFormData.step3.descricaoSolucao;
    }
    
    // Preencher step 1 (tipo selecionado)
    if (currentFormData.step1 && currentFormData.step1.tipoSolucao) {
        const cardSelecionado = document.querySelector(`.option-card[data-value="${currentFormData.step1.tipoSolucao}"]`);
        if (cardSelecionado) {
            cardSelecionado.classList.add('selected');
        }
    }
}

function configurarNavegacaoFormulario() {
    // Botão avançar
    document.querySelectorAll('.btn-avancar').forEach(btn => {
        btn.addEventListener('click', function() {
            if (validarStepAtual()) {
                salvarStepAtual();
                avancarStepFormulario();
            }
        });
    });
    
    // Botão voltar
    document.querySelectorAll('.btn-voltar').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep > 0) {
                voltarStepFormulario();
            } else {
                window.location.href = 'index.html';
            }
        });
    });
}

function validarStepAtual() {
    switch(currentStep) {
        case 1: // Step 1 - Tipo de solução
            const selecionado = document.querySelector('.option-card.selected');
            if (!selecionado) {
                alert('Por favor, selecione um tipo de solução');
                return false;
            }
            break;
            
        case 2: // Step 2 - Nome da solução
            const nomeInput = document.getElementById('nomeSolucao');
            if (!nomeInput || nomeInput.value.trim() === '') {
                alert('Por favor, insira um nome para a solução');
                nomeInput.focus();
                return false;
            }
            break;
            
        case 3: // Step 3 - Descrição
            const descInput = document.getElementById('descricaoSolucao');
            if (!descInput || descInput.value.trim() === '') {
                alert('Por favor, insira uma descrição para a solução');
                descInput.focus();
                return false;
            }
            break;
    }
    return true;
}

function salvarStepAtual() {
    const dados = {};
    
    switch(currentStep) {
        case 0:
            // Step 0 não tem dados
            break;
            
        case 1:
            const selecionado = document.querySelector('.option-card.selected');
            if (selecionado) {
                dados.tipoSolucao = selecionado.getAttribute('data-value');
                currentFormData.step1 = dados;
            }
            break;
            
        case 2:
            const nomeInput = document.getElementById('nomeSolucao');
            if (nomeInput) {
                dados.nomeSolucao = nomeInput.value.trim();
                currentFormData.step2 = dados;
            }
            break;
            
        case 3:
            const descInput = document.getElementById('descricaoSolucao');
            if (descInput) {
                dados.descricaoSolucao = descInput.value.trim();
                currentFormData.step3 = dados;
            }
            break;
    }
    
    salvarDadosLocalStorage();
}

function avancarStepFormulario() {
    if (currentStep < 3) {
        // Animar transição
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.opacity = '0';
        currentElement.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            mostrarStepFormulario(currentStep + 1);
            
            const nextElement = document.getElementById(`step${currentStep + 1}`);
            nextElement.style.opacity = '0';
            nextElement.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                nextElement.style.opacity = '1';
                nextElement.style.transform = 'translateX(0)';
                currentElement.style.opacity = '';
                currentElement.style.transform = '';
            }, 50);
        }, 300);
    } else {
        // Último step - ir para recursos
        salvarStepAtual();
        window.location.href = 'recursos.html';
    }
}

function voltarStepFormulario() {
    if (currentStep > 0) {
        // Animar transição
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.opacity = '0';
        currentElement.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            mostrarStepFormulario(currentStep - 1);
            
            const prevElement = document.getElementById(`step${currentStep - 1}`);
            prevElement.style.opacity = '0';
            prevElement.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                prevElement.style.opacity = '1';
                prevElement.style.transform = 'translateX(0)';
                currentElement.style.opacity = '';
                currentElement.style.transform = '';
            }, 50);
        }, 300);
    }
}

// ==============================================
// RECURSOS (recursos.html)
// ==============================================

function inicializarRecursos() {
    console.log("Inicializando recursos...");
    
    // Inicializar tabela
    criarTabelaRecursos();
    
    // Configurar botões
    document.querySelector('.btn-voltar').addEventListener('click', function() {
        salvarRecursosTabela();
        window.location.href = 'form-novo-projeto.html';
    });
    
    document.querySelector('.btn-avancar').addEventListener('click', function() {
        salvarRecursosTabela();
        window.location.href = 'killswitch.html';
    });
    
    // Botão adicionar linha
    document.getElementById('addRowBtn').addEventListener('click', adicionarLinhaRecurso);
}

function criarTabelaRecursos() {
    const tbody = document.querySelector('#resourcesTable tbody');
    if (!tbody) return;
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Se houver dados salvos, carregá-los
    if (recursosData.length > 0) {
        recursosData.forEach(recurso => {
            adicionarLinhaRecursoComDados(recurso);
        });
    } else {
        // Adicionar 3 linhas padrão
        for (let i = 0; i < 3; i++) {
            adicionarLinhaRecurso();
        }
    }
}

function adicionarLinhaRecurso() {
    const tbody = document.querySelector('#resourcesTable tbody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="resource-type">
                <option value="tempo">Tempo</option>
                <option value="financeiro">Financeiro</option>
                <option value="equipe">Equipe</option>
                <option value="equipamento">Equipamento</option>
                <option value="tecnologia">Tecnologia</option>
                <option value="outro">Outro</option>
            </select>
        </td>
        <td>
            <textarea class="resource-description" placeholder="Descreva detalhadamente o recurso necessário..."></textarea>
        </td>
        <td>
            <input type="text" class="resource-value" placeholder="Valor, quantidade ou tempo...">
        </td>
        <td>
            <button class="delete-btn" title="Excluir linha">🗑️</button>
        </td>
    `;
    
    // Configurar botão de excluir
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        if (tbody.querySelectorAll('tr').length > 1) {
            mostrarConfirmacaoExclusao(row);
        } else {
            alert('É necessário manter pelo menos uma linha na tabela.');
        }
    });
    
    tbody.appendChild(row);
}

function adicionarLinhaRecursoComDados(recurso) {
    const tbody = document.querySelector('#resourcesTable tbody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="resource-type">
                <option value="tempo" ${recurso.tipo === 'tempo' ? 'selected' : ''}>Tempo</option>
                <option value="financeiro" ${recurso.tipo === 'financeiro' ? 'selected' : ''}>Financeiro</option>
                <option value="equipe" ${recurso.tipo === 'equipe' ? 'selected' : ''}>Equipe</option>
                <option value="equipamento" ${recurso.tipo === 'equipamento' ? 'selected' : ''}>Equipamento</option>
                <option value="tecnologia" ${recurso.tipo === 'tecnologia' ? 'selected' : ''}>Tecnologia</option>
                <option value="outro" ${recurso.tipo === 'outro' ? 'selected' : ''}>Outro</option>
            </select>
        </td>
        <td>
            <textarea class="resource-description" placeholder="Descreva detalhadamente o recurso necessário...">${recurso.descricao || ''}</textarea>
        </td>
        <td>
            <input type="text" class="resource-value" placeholder="Valor, quantidade ou tempo..." value="${recurso.valor || ''}">
        </td>
        <td>
            <button class="delete-btn" title="Excluir linha">🗑️</button>
        </td>
    `;
    
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        if (tbody.querySelectorAll('tr').length > 1) {
            mostrarConfirmacaoExclusao(row);
        } else {
            alert('É necessário manter pelo menos uma linha na tabela.');
        }
    });
    
    tbody.appendChild(row);
}

function mostrarConfirmacaoExclusao(row) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este recurso?</p>
            <div class="popup-buttons">
                <button class="btn btn-secondary" id="cancelDelete">Cancelar</button>
                <button class="btn btn-primary" id="confirmDelete" style="background-color: #ff4444;">Excluir</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    popup.style.display = 'flex';
    
    // Fechar popup
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    document.getElementById('confirmDelete').addEventListener('click', () => {
        row.remove();
        document.body.removeChild(popup);
        salvarRecursosTabela(); // Salvar após exclusão
    });
    
    // Fechar ao clicar fora
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            document.body.removeChild(popup);
        }
    });
}

function salvarRecursosTabela() {
    const recursos = [];
    const rows = document.querySelectorAll('#resourcesTable tbody tr');
    
    rows.forEach(row => {
        const tipo = row.querySelector('.resource-type').value;
        const descricao = row.querySelector('.resource-description').value;
        const valor = row.querySelector('.resource-value').value;
        
        if (descricao.trim() || valor.trim()) {
            recursos.push({
                tipo: tipo,
                descricao: descricao.trim(),
                valor: valor.trim()
            });
        }
    });
    
    recursosData = recursos;
    salvarDadosLocalStorage();
}

// ==============================================
// KILL SWITCH (killswitch.html)
// ==============================================

function inicializarKillSwitch() {
    console.log("Inicializando Kill Switch...");
    
    // Inicializar sliders
    inicializarSlidersKillSwitch();
    
    // Carregar dados salvos
    carregarDadosKillSwitch();
    
    // Configurar botões
    document.querySelector('.btn-voltar').addEventListener('click', function() {
        calcularScore(); // Calcular antes de sair
        window.location.href = 'recursos.html';
    });
    
    document.querySelector('.btn-avancar').addEventListener('click', function() {
        calcularScore();
        window.location.href = 'canvas.html';
    });
    
    // Atualizar score em tempo real
    configurarAtualizacaoScoreTempoReal();
}

function inicializarSlidersKillSwitch() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        
        // Configurar valor inicial
        valueDisplay.textContent = slider.value;
        
        // Atualizar quando mudar
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
            calcularScore();
        });
    });
}

function carregarDadosKillSwitch() {
    if (pontuacaoData.killSwitchChecks) {
        // Restaurar checkboxes
        const checkboxes = document.querySelectorAll('.kill-switch input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            if (pontuacaoData.killSwitchChecks[index]) {
                checkbox.checked = true;
            }
        });
    }
    
    if (pontuacaoData.sliderValues) {
        // Restaurar sliders
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach((slider, index) => {
            if (pontuacaoData.sliderValues[index]) {
                slider.value = pontuacaoData.sliderValues[index];
                slider.nextElementSibling.textContent = pontuacaoData.sliderValues[index];
            }
        });
    }
}

function configurarAtualizacaoScoreTempoReal() {
    // Atualizar score quando checkboxes mudarem
    document.querySelectorAll('.kill-switch input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', calcularScore);
    });
    
    // Calcular score inicial
    calcularScore();
}

function calcularScore() {
    // Coletar dados dos checkboxes
    const killSwitchChecks = Array.from(
        document.querySelectorAll('.kill-switch input[type="checkbox"]')
    ).map(cb => cb.checked);
    
    // Coletar valores dos sliders positivos
    const slidersPositiva = Array.from(
        document.querySelectorAll('.matriz-positiva input[type="range"]')
    ).map(slider => parseInt(slider.value));
    
    // Coletar valores dos sliders negativos
    const slidersNegativa = Array.from(
        document.querySelectorAll('.matriz-negativa input[type="range"]')
    ).map(slider => parseInt(slider.value));
    
    // Calcular scores
    const killSwitchScore = killSwitchChecks.filter(Boolean).length;
    const somaPositiva = slidersPositiva.reduce((a, b) => a + b, 0);
    const somaNegativa = Math.max(slidersNegativa.reduce((a, b) => a + b, 0), 1);
    
    // Fórmula de pontuação
    let score = 0;
    if (killSwitchScore > 0) {
        score = (killSwitchScore * (somaPositiva / somaNegativa)) * 10;
    }
    
    // Limitar entre 0 e 100
    score = Math.min(Math.max(score, 0), 100);
    
    // Salvar dados
    pontuacaoData = {
        killSwitchChecks: killSwitchChecks,
        sliderValues: [...slidersPositiva, ...slidersNegativa],
        killSwitch: killSwitchScore,
        matrizPositiva: somaPositiva,
        matrizNegativa: somaNegativa,
        score: score,
        dataCalculo: new Date().toISOString()
    };
    
    // Atualizar display
    atualizarDisplayScore(score);
    
    // Salvar no localStorage
    salvarDadosLocalStorage();
}

function atualizarDisplayScore(score) {
    const scoreValue = document.getElementById('scoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const scoreComment = document.getElementById('scoreComment');
    
    if (scoreValue) scoreValue.textContent = `${score.toFixed(1)}%`;
    if (scoreBar) scoreBar.style.width = `${score}%`;
    
    // Comentário baseado no score
    let comentario = '';
    let cor = '';
    
    if (score >= 80) {
        comentario = 'Excelente! Solução altamente viável.';
        cor = '#4CAF50';
    } else if (score >= 60) {
        comentario = 'Bom! Solução viável com alguns ajustes.';
        cor = '#8BC34A';
    } else if (score >= 40) {
        comentario = 'Médio. Avalie cuidadosamente os riscos.';
        cor = '#FFC107';
    } else if (score >= 20) {
        comentario = 'Baixo. Recomenda-se revisão completa.';
        cor = '#FF9800';
    } else {
        comentario = 'Crítico. Necessita reformulação significativa.';
        cor = '#F44336';
    }
    
    if (scoreComment) {
        scoreComment.textContent = comentario;
        scoreComment.style.color = cor;
    }
    
    // Atualizar cor da barra
    if (scoreBar) {
        if (score >= 80) scoreBar.style.backgroundColor = '#4CAF50';
        else if (score >= 60) scoreBar.style.backgroundColor = '#8BC34A';
        else if (score >= 40) scoreBar.style.backgroundColor = '#FFC107';
        else if (score >= 20) scoreBar.style.backgroundColor = '#FF9800';
        else scoreBar.style.backgroundColor = '#F44336';
    }
}

// ==============================================
// CANVAS (canvas.html)
// ==============================================

function inicializarCanvas() {
    console.log("Inicializando Canvas...");
    
    // Obter ID da solução da URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || window.banco.generateId();
    
    // Carregar dados existentes
    carregarDadosCanvas();
    
    // Configurar células do canvas
    configurarCelulasCanvas();
    
    // Configurar botões
    document.querySelector('.btn-voltar').addEventListener('click', function() {
        window.location.href = 'killswitch.html';
    });
    
    document.querySelector('.btn-finalizar').addEventListener('click', async function() {
        await finalizarESalvarSolucao();
    });
}

function carregarDadosCanvas() {
    // Carregar do localStorage
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
        const conteudo = localStorage.getItem(`canvas_${id}`);
        if (conteudo) {
            atualizarCelulaCanvas(id, conteudo);
        }
    });
    
    // Tentar carregar do banco se tiver ID
    if (currentSolutionId && currentSolutionId.length > 10) { // ID válido do Firebase
        carregarCanvasDoBanco();
    }
}

async function carregarCanvasDoBanco() {
    try {
        const resultado = await window.banco.buscarCanvas(currentSolutionId);
        if (resultado.success && resultado.data) {
            // Preencher células com dados do banco
            Object.keys(resultado.data).forEach(key => {
                if (key.startsWith('canvas_')) {
                    const campoId = key.replace('canvas_', '');
                    const conteudo = resultado.data[key];
                    atualizarCelulaCanvas(campoId, conteudo);
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar canvas do banco:", error);
    }
}

function configurarCelulasCanvas() {
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
            celula.addEventListener('click', () => abrirEditorCelula(id));
        }
    });
}

function abrirEditorCelula(campoId) {
    const celula = document.getElementById(campoId);
    if (!celula) return;
    
    const titulo = celula.querySelector('h3').textContent;
    const conteudoAtual = celula.getAttribute('data-conteudo') || 
                         celula.querySelector('p').textContent;
    
    // Criar popup de edição
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content" style="max-width: 600px;">
            <h2>${titulo}</h2>
            <textarea id="editorCanvas" 
                      placeholder="Digite o conteúdo aqui..." 
                      style="width: 100%; min-height: 200px; margin: 20px 0; padding: 15px; border-radius: 10px; border: 2px solid var(--cinza-medio); font-family: 'Comfortaa', cursive;"
                      maxlength="1000">${conteudoAtual !== 'Clique para editar...' ? conteudoAtual : ''}</textarea>
            <div style="text-align: right; font-size: 0.9rem; color: var(--cinza-escuro); margin-bottom: 20px;">
                Caracteres: <span id="charCount">${conteudoAtual.length}</span>/1000
            </div>
            <div class="popup-buttons">
                <button class="btn btn-secondary" id="cancelEdit">Cancelar</button>
                <button class="btn btn-primary" id="saveEdit">Salvar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    popup.style.display = 'flex';
    
    // Configurar contador de caracteres
    const textarea = document.getElementById('editorCanvas');
    const charCount = document.getElementById('charCount');
    
    textarea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });
    
    // Focar no textarea
    textarea.focus();
    
    // Configurar botões
    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    document.getElementById('saveEdit').addEventListener('click', () => {
        const novoConteudo = textarea.value.trim();
        if (novoConteudo) {
            atualizarCelulaCanvas(campoId, novoConteudo);
            document.body.removeChild(popup);
        } else {
            alert('Por favor, insira algum conteúdo.');
        }
    });
    
    // Fechar com ESC
    popup.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(popup);
        }
    });
}

function atualizarCelulaCanvas(campoId, conteudo) {
    const celula = document.getElementById(campoId);
    if (!celula) return;
    
    // Salvar no objeto canvasData
    canvasData[`canvas_${campoId}`] = conteudo;
    
    // Atualizar visualização (truncar se muito longo)
    let textoExibido = conteudo;
    if (conteudo.length > 100) {
        textoExibido = conteudo.substring(0, 97) + '...';
    }
    
    celula.querySelector('p').textContent = textoExibido;
    celula.setAttribute('data-conteudo', conteudo);
    
    // Salvar no localStorage
    localStorage.setItem(`canvas_${campoId}`, conteudo);
    
    // Mudar estilo para indicar que tem conteúdo
    celula.style.borderColor = 'var(--cor-laranja)';
    celula.style.background = 'rgba(255, 107, 53, 0.05)';
}

async function finalizarESalvarSolucao() {
    // Coletar todos os dados
    const dadosCompletos = {
        // Dados do formulário
        nome: currentFormData.step2?.nomeSolucao || 'Solução sem nome',
        descricao: currentFormData.step3?.descricaoSolucao || '',
        tipo: currentFormData.step1?.tipoSolucao || 'solucao',
        
        // Dados do canvas
        ...canvasData,
        
        // Dados de pontuação
        pontuacao: pontuacaoData,
        
        // Metadados
        dataCriacao: new Date().toISOString(),
        status: 'ativa'
    };
    
    try {
        // Mostrar loading
        const btnFinalizar = document.querySelector('.btn-finalizar');
        const textoOriginal = btnFinalizar.textContent;
        btnFinalizar.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div> Salvando...';
        btnFinalizar.disabled = true;
        
        // Salvar no Firebase
        const resultado = await window.banco.adicionarSolucao(dadosCompletos);
        
        if (resultado.success) {
            console.log("Solução salva com ID:", resultado.id);
            
            // Salvar dados adicionais
            if (recursosData.length > 0) {
                await window.banco.salvarRecursos(resultado.id, recursosData);
            }
            
            if (Object.keys(pontuacaoData).length > 0) {
                await window.banco.salvarPontuacao(
                    resultado.id,
                    pontuacaoData.killSwitch || 0,
                    pontuacaoData.matrizPositiva || 0,
                    pontuacaoData.matrizNegativa || 1,
                    pontuacaoData.score || 0
                );
            }
            
            if (Object.keys(canvasData).length > 0) {
                await window.banco.salvarCanvas(resultado.id, canvasData);
            }
            
            // Limpar dados locais
            limparDadosLocalStorage();
            
            // Mostrar mensagem de sucesso
            alert('🎉 Solução salva com sucesso!');
            
            // Redirecionar para página inicial
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            throw new Error(resultado.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error("Erro ao salvar solução:", error);
        
        // Restaurar botão
        const btnFinalizar = document.querySelector('.btn-finalizar');
        btnFinalizar.textContent = textoOriginal;
        btnFinalizar.disabled = false;
        
        // Tentar salvar localmente como fallback
        try {
            const solucoesLocais = JSON.parse(localStorage.getItem('solucoesLocais') || '[]');
            solucoesLocais.push({
                ...dadosCompletos,
                id: 'local_' + Date.now(),
                dataSalvamento: new Date().toISOString()
            });
            localStorage.setItem('solucoesLocais', JSON.stringify(solucoesLocais));
            
            alert('⚠️ Solução salva localmente (sem conexão com o banco).\nOs dados serão sincronizados quando a conexão for restabelecida.');
            limparDadosLocalStorage();
            window.location.href = 'index.html';
            
        } catch (fallbackError) {
            alert('❌ Erro ao salvar a solução. Por favor, copie seus dados e tente novamente.\nErro: ' + error.message);
        }
    }
}

// ==============================================
// FUNÇÕES DE BACKUP E SINCRONIZAÇÃO
// ==============================================

async function sincronizarSolucoesLocais() {
    try {
        const solucoesLocais = JSON.parse(localStorage.getItem('solucoesLocais') || '[]');
        
        if (solucoesLocais.length === 0) return;
        
        console.log(`Sincronizando ${solucoesLocais.length} soluções locais...`);
        
        for (const solucao of solucoesLocais) {
            try {
                const resultado = await window.banco.adicionarSolucao(solucao);
                if (resultado.success) {
                    console.log(`Solução ${solucao.id} sincronizada com sucesso`);
                }
            } catch (err) {
                console.error(`Erro ao sincronizar solução ${solucao.id}:`, err);
            }
        }
        
        // Remover sincronizadas
        localStorage.removeItem('solucoesLocais');
        console.log("Sincronização concluída");
        
    } catch (error) {
        console.error("Erro na sincronização:", error);
    }
}

// Executar sincronização ao carregar a página inicial
if (identificarPaginaAtual() === 'index') {
    setTimeout(sincronizarSolucoesLocais, 2000);
}

// ==============================================
// EXPORTAÇÕES PARA USO GLOBAL
// ==============================================

// Tornar funções essenciais disponíveis globalmente
window.carregarSolucoesDoBanco = carregarSolucoesDoBanco;
window.finalizarESalvarSolucao = finalizarESalvarSolucao;
window.limparDadosLocalStorage = limparDadosLocalStorage;

console.log("Script.js carregado e pronto!");