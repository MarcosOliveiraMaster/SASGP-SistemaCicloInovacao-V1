// Configurações globais
let currentSolutionId = null;
let currentStep = 0;
const totalSteps = 4; // Formulário + Recursos + KillSwitch + Canvas

// DOMContentLoaded para página inicial
document.addEventListener('DOMContentLoaded', function() {
    // Verificar em qual página estamos
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') {
        carregarSolucoes();
        inicializarEventListeners();
    }
    
    if (path.includes('form-novo-projeto.html')) {
        inicializarFormulario();
    }
    
    if (path.includes('recursos.html')) {
        inicializarRecursos();
    }
    
    if (path.includes('killswitch.html')) {
        inicializarKillSwitch();
    }
    
    if (path.includes('canvas.html')) {
        inicializarCanvas();
    }
});

// FUNÇÕES PARA PÁGINA INICIAL
async function carregarSolucoes() {
    const grid = document.getElementById('solutionsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const banco = await import('./banco.js');
        const resultado = await banco.listarSolucoes();
        
        if (resultado.success && resultado.data) {
            exibirSolucoes(grid, resultado.data);
        } else {
            grid.innerHTML = '<p class="error">Erro ao carregar soluções.</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        grid.innerHTML = '<p class="error">Erro ao carregar soluções.</p>';
    }
}

function exibirSolucoes(grid, solucoes) {
    grid.innerHTML = '';
    
    // Adicionar cards das soluções
    solucoes.forEach((solucao, index) => {
        const cores = ['laranja', 'azul', 'roxo'];
        const cor = cores[index % 3];
        
        const card = document.createElement('div');
        card.className = `solution-card ${cor}`;
        card.innerHTML = `
            <div class="card-image">
                ${solucao.imagem ? 
                    `<img src="${solucao.imagem}" alt="${solucao.nome || 'Solução'}">` : 
                    `<div class="placeholder">💡</div>`
                }
            </div>
            <div class="card-title">${solucao.nome || 'Nova Solução'}</div>
        `;
        
        card.addEventListener('click', () => {
            // Redirecionar para detalhes ou edição
            localStorage.setItem('currentSolutionId', solucao.id);
            window.location.href = `canvas.html?id=${solucao.id}`;
        });
        
        grid.appendChild(card);
    });
    
    // Adicionar card de novo projeto
    const addCard = document.createElement('div');
    addCard.className = 'solution-card add-new-card';
    addCard.innerHTML = '+';
    addCard.addEventListener('click', () => {
        window.location.href = 'form-novo-projeto.html';
    });
    
    grid.appendChild(addCard);
}

function inicializarEventListeners() {
    // Adicionar event listeners gerais se necessário
}

// FUNÇÕES PARA FORMULÁRIO
function inicializarFormulario() {
    // Inicializar steps
    mostrarStep(0);
    atualizarProgresso();
    
    // Event listeners para botões
    document.querySelectorAll('.btn-avancar').forEach(btn => {
        btn.addEventListener('click', avancarStep);
    });
    
    document.querySelectorAll('.btn-voltar').forEach(btn => {
        btn.addEventListener('click', voltarStep);
    });
    
    // Event listeners para opções de tipo
    document.querySelectorAll('.option-card').forEach(opcao => {
        opcao.addEventListener('click', function() {
            document.querySelectorAll('.option-card').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

function mostrarStep(step) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    atualizarProgresso();
}

function avancarStep() {
    if (currentStep < totalSteps - 1) {
        // Salvar dados do step atual
        salvarStepAtual();
        
        // Animar transição
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            mostrarStep(currentStep + 1);
            currentElement.style.animation = '';
        }, 300);
    } else {
        // Último step - enviar para próxima página
        salvarStepAtual();
        window.location.href = 'recursos.html';
    }
}

function voltarStep() {
    if (currentStep > 0) {
        const currentElement = document.getElementById(`step${currentStep}`);
        currentElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            mostrarStep(currentStep - 1);
            currentElement.style.animation = '';
        }, 300);
    } else {
        window.location.href = 'index.html';
    }
}

function atualizarProgresso() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = ((currentStep + 1) / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

function salvarStepAtual() {
    // Salvar dados do formulário atual no localStorage
    const dados = {};
    
    // Coletar dados dos inputs do step atual
    const inputs = document.querySelectorAll(`#step${currentStep} input, #step${currentStep} textarea, #step${currentStep} select`);
    inputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
            if (input.checked) dados[input.name] = input.value;
        } else {
            dados[input.name || input.id] = input.value;
        }
    });
    
    // Salvar no localStorage
    const formularioData = JSON.parse(localStorage.getItem('formularioData') || '{}');
    formularioData[`step${currentStep}`] = dados;
    localStorage.setItem('formularioData', JSON.stringify(formularioData));
}

// FUNÇÕES PARA RECURSOS
function inicializarRecursos() {
    criarTabelaRecursos();
    
    // Botão adicionar linha
    document.getElementById('addRowBtn').addEventListener('click', adicionarLinhaTabela);
    
    // Botões navegação
    document.querySelector('.btn-voltar').addEventListener('click', () => {
        window.location.href = 'form-novo-projeto.html';
    });
    
    document.querySelector('.btn-avancar').addEventListener('click', () => {
        salvarRecursosTabela();
        window.location.href = 'killswitch.html';
    });
}

function criarTabelaRecursos() {
    const tbody = document.querySelector('#resourcesTable tbody');
    
    // Adicionar 4 linhas iniciais
    for (let i = 0; i < 4; i++) {
        adicionarLinhaTabela();
    }
}

function adicionarLinhaTabela() {
    const tbody = document.querySelector('#resourcesTable tbody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>
            <select class="resource-type">
                <option value="tempo">Tempo</option>
                <option value="financeiro">Financeiro</option>
                <option value="equipe">Equipe</option>
                <option value="equipamento">Equipamento</option>
            </select>
        </td>
        <td>
            <textarea class="resource-description" placeholder="Descreva o recurso..."></textarea>
        </td>
        <td>
            <textarea class="resource-value" placeholder="Valor ou quantidade..."></textarea>
        </td>
        <td>
            <button class="delete-btn" title="Excluir linha">🗑️</button>
        </td>
    `;
    
    // Event listener para botão de excluir
    row.querySelector('.delete-btn').addEventListener('click', function() {
        mostrarPopupExclusao(row);
    });
    
    tbody.appendChild(row);
}

function mostrarPopupExclusao(row) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Tem certeza?</h3>
            <p>Deseja realmente apagar esta linha?</p>
            <div class="popup-buttons">
                <button class="btn-secondary" id="cancelDelete">Cancelar</button>
                <button class="btn-primary" id="confirmDelete">Apagar linha</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    popup.style.display = 'flex';
    
    // Event listeners do popup
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    document.getElementById('confirmDelete').addEventListener('click', () => {
        row.remove();
        document.body.removeChild(popup);
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
        
        if (descricao || valor) {
            recursos.push({ tipo, descricao, valor });
        }
    });
    
    localStorage.setItem('recursosData', JSON.stringify(recursos));
}

// FUNÇÕES PARA KILL SWITCH
function inicializarKillSwitch() {
    // Inicializar sliders
    inicializarSliders();
    
    // Event listeners
    document.querySelector('.btn-voltar').addEventListener('click', () => {
        window.location.href = 'recursos.html';
    });
    
    document.querySelector('.btn-avancar').addEventListener('click', () => {
        calcularScore();
        window.location.href = 'canvas.html';
    });
}

function inicializarSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
        
        // Inicializar valor
        valueDisplay.textContent = slider.value;
    });
}

function calcularScore() {
    // Kill Switch checkboxes
    const killSwitches = document.querySelectorAll('.kill-switch input[type="checkbox"]');
    const killSwitchCount = Array.from(killSwitches).filter(cb => cb.checked).length;
    
    // Matriz Positiva
    const slidersPositiva = document.querySelectorAll('.matriz-positiva input[type="range"]');
    const somaPositiva = Array.from(slidersPositiva).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    
    // Matriz Negativa
    const slidersNegativa = document.querySelectorAll('.matriz-negativa input[type="range"]');
    const somaNegativa = Math.max(Array.from(slidersNegativa).reduce((sum, slider) => sum + parseInt(slider.value), 0), 1);
    
    // Cálculo do score
    const score = killSwitchCount * (somaPositiva / somaNegativa);
    const scoreNormalizado = Math.min(Math.max(score, 0), 100);
    
    // Salvar no localStorage
    const dados = {
        killSwitch: killSwitchCount,
        matrizPositiva: somaPositiva,
        matrizNegativa: somaNegativa,
        score: scoreNormalizado,
        data: new Date().toISOString()
    };
    
    localStorage.setItem('pontuacaoData', JSON.stringify(dados));
    
    // Atualizar display
    document.getElementById('scoreValue').textContent = `${scoreNormalizado.toFixed(1)}%`;
    document.getElementById('scoreBar').style.width = `${scoreNormalizado}%`;
}

// FUNÇÕES PARA CANVAS
function inicializarCanvas() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSolutionId = urlParams.get('id') || generateId();
    
    // Carregar dados existentes se houver
    carregarDadosCanvas();
    
    // Configurar células do canvas
    configurarCelulasCanvas();
    
    // Event listeners
    document.querySelector('.btn-voltar').addEventListener('click', () => {
        window.location.href = 'killswitch.html';
    });
    
    document.querySelector('.btn-finalizar').addEventListener('click', salvarTudo);
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
            celula.addEventListener('click', () => abrirPopupCelula(id, celula.querySelector('h3').textContent));
        }
    });
}

function abrirPopupCelula(campoId, titulo) {
    const popup = document.createElement('div');
    popup.className = 'canvas-popup';
    popup.innerHTML = `
        <h2>${titulo}</h2>
        <textarea id="popupTextarea" placeholder="Digite o conteúdo...">${localStorage.getItem(`canvas_${campoId}`) || ''}</textarea>
        <div class="btn-container">
            <button class="btn-secondary" id="cancelPopup">Cancelar</button>
            <button class="btn-primary" id="savePopup">Salvar</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    popup.style.display = 'flex';
    
    // Configurar altura máxima para scroll
    const textarea = popup.querySelector('textarea');
    textarea.style.maxHeight = '300px';
    textarea.style.overflowY = 'auto';
    
    // Event listeners
    document.getElementById('cancelPopup').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    document.getElementById('savePopup').addEventListener('click', () => {
        const conteudo = textarea.value;
        localStorage.setItem(`canvas_${campoId}`, conteudo);
        atualizarCelulaCanvas(campoId, conteudo);
        document.body.removeChild(popup);
    });
    
    // Fechar ao pressionar ESC
    document.addEventListener('keydown', function fecharPopup(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(popup);
            document.removeEventListener('keydown', fecharPopup);
        }
    });
}

function atualizarCelulaCanvas(campoId, conteudo) {
    const celula = document.getElementById(campoId);
    if (celula) {
        const textoExibido = conteudo.length > 100 ? 
            conteudo.substring(0, 100) + '...' : 
            conteudo;
        
        celula.querySelector('p').textContent = textoExibido;
        celula.setAttribute('data-conteudo', conteudo);
    }
}

async function carregarDadosCanvas() {
    if (!currentSolutionId) return;
    
    try {
        const banco = await import('./banco.js');
        const resultado = await banco.buscarCanvas(currentSolutionId);
        
        if (resultado.success && resultado.data) {
            // Preencher células com dados existentes
            Object.keys(resultado.data).forEach(key => {
                if (key.startsWith('canvas_')) {
                    const campoId = key.replace('canvas_', '');
                    const conteudo = resultado.data[key];
                    atualizarCelulaCanvas(campoId, conteudo);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dados do canvas:', error);
    }
}

async function salvarTudo() {
    try {
        const banco = await import('./banco.js');
        
        // Coletar todos os dados
        const formularioData = JSON.parse(localStorage.getItem('formularioData') || '{}');
        const recursosData = JSON.parse(localStorage.getItem('recursosData') || '[]');
        const pontuacaoData = JSON.parse(localStorage.getItem('pontuacaoData') || '{}');
        
        // Coletar dados do canvas
        const canvasData = {};
        document.querySelectorAll('.canvas-cell').forEach(celula => {
            const id = celula.id;
            const conteudo = celula.getAttribute('data-conteudo') || '';
            canvasData[`canvas_${id}`] = conteudo;
        });
        
        // Salvar solução
        const solucaoData = {
            nome: formularioData.step2?.nomeSolucao || 'Nova Solução',
            descricao: formularioData.step3?.descricaoSolucao || '',
            dataCriacao: new Date().toISOString()
        };
        
        const resultado = await banco.adicionarSolucao(solucaoData);
        
        if (resultado.success) {
            // Salvar outros dados
            await banco.salvarRespostasFormulario(resultado.id, formularioData);
            await banco.salvarRecursos(resultado.id, recursosData);
            await banco.salvarPontuacao(
                resultado.id,
                pontuacaoData.killSwitch || 0,
                pontuacaoData.matrizPositiva || 0,
                pontuacaoData.matrizNegativa || 1,
                pontuacaoData.score || 0
            );
            await banco.salvarCanvas(resultado.id, canvasData);
            
            // Limpar localStorage
            localStorage.removeItem('formularioData');
            localStorage.removeItem('recursosData');
            localStorage.removeItem('pontuacaoData');
            
            // Redirecionar para página inicial
            alert('Solução salva com sucesso!');
            window.location.href = 'index.html';
        } else {
            alert('Erro ao salvar solução: ' + resultado.error);
        }
    } catch (error) {
        console.error('Erro ao salvar tudo:', error);
        alert('Erro ao salvar os dados. Tente novamente.');
    }
}

// Função auxiliar para gerar ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}