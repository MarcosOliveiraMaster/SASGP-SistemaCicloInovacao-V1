// script-avaliacao.js - Sistema de Avaliação de Soluções

let solucaoId = null;
let solucaoDocId = null;
let avaliacoesData = [];
let statusAtual = '';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Obter IDs da solução do localStorage
    solucaoId = localStorage.getItem('avaliacaoSolucaoId');
    solucaoDocId = localStorage.getItem('avaliacaoSolucaoDocId');
    
    if (!solucaoId || !solucaoDocId) {
        alert('Erro: ID da solução não encontrado.');
        window.location.href = 'index.html';
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados
    carregarDadosSolucao();
    carregarAvaliacoes();
    carregarStatus();
});

// Configurar eventos
function setupEventListeners() {
    // Botão Voltar
    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Botão Nova Avaliação
    document.getElementById('btnNovaAvaliacao').addEventListener('click', abrirPopupAvaliacao);
    
    // Status select
    document.getElementById('statusSelect').addEventListener('change', salvarStatus);
    
    // Configurar popup de avaliação
    setupPopupAvaliacao();
}

// Configurar popup de avaliação
function setupPopupAvaliacao() {
    const popup = document.getElementById('popupNovaAvaliacao');
    
    // Botão Cancelar
    document.getElementById('btnCancelarAvaliacao').addEventListener('click', () => {
        popup.style.display = 'none';
        resetarFormularioAvaliacao();
    });
    
    // Botão Salvar
    document.getElementById('btnSalvarAvaliacao').addEventListener('click', salvarAvaliacao);
    
    // Seleção de estrelas
    document.querySelectorAll('.estrela').forEach(estrela => {
        estrela.addEventListener('click', function() {
            const valor = parseInt(this.getAttribute('data-value'));
            selecionarEstrelas(valor);
        });
    });
    
    // Fechar popup ao clicar fora
    popup.addEventListener('click', function(e) {
        if (e.target === this) {
            popup.style.display = 'none';
            resetarFormularioAvaliacao();
        }
    });
}

// Abrir popup de avaliação
function abrirPopupAvaliacao() {
    document.getElementById('popupNovaAvaliacao').style.display = 'flex';
    document.getElementById('comentarioAvaliacao').focus();
}

// Selecionar estrelas
function selecionarEstrelas(valor) {
    // Resetar todas
    document.querySelectorAll('.estrela').forEach(e => e.textContent = '☆');
    
    // Marcar até o valor selecionado
    for (let i = 1; i <= valor; i++) {
        const estrela = document.querySelector(`.estrela[data-value="${i}"]`);
        if (estrela) estrela.textContent = '⭐';
    }
    
    document.getElementById('estrelasValue').value = valor;
}

// Resetar formulário de avaliação
function resetarFormularioAvaliacao() {
    document.getElementById('avaliadorSelect').value = '';
    document.getElementById('comentarioAvaliacao').value = '';
    document.getElementById('estrelasValue').value = '0';
    document.querySelectorAll('.estrela').forEach(e => e.textContent = '☆');
}

// Carregar dados da solução
async function carregarDadosSolucao() {
    try {
        const resultado = await BancoDeDados.obterSolucaoPorDocId(solucaoDocId);
        if (resultado.success && resultado.data) {
            document.getElementById('tituloSolucao').textContent = 
                `Avaliar: ${resultado.data.nome || 'Solução'}`;
        }
    } catch (error) {
        console.error('Erro ao carregar dados da solução:', error);
    }
}

// Carregar avaliações
async function carregarAvaliacoes() {
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.listarAvaliacoes(solucaoId);
        
        if (resultado.success && resultado.data) {
            avaliacoesData = resultado.data;
            renderizarAvaliacoes();
            calcularMediaEstrelas();
        } else {
            mostrarGridVazio();
        }
    } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        mostrarGridVazio();
    }
}

// Renderizar avaliações no grid
function renderizarAvaliacoes() {
    const grid = document.getElementById('avaliacoesGrid');
    grid.innerHTML = '';
    
    if (avaliacoesData.length === 0) {
        mostrarGridVazio();
        return;
    }
    
    avaliacoesData.forEach(avaliacao => {
        const card = criarCardAvaliacao(avaliacao);
        grid.appendChild(card);
    });
}

// Criar card de avaliação
function criarCardAvaliacao(avaliacao) {
    const card = document.createElement('div');
    card.className = 'avaliacao-card';
    
    // Formatar data
    const data = avaliacao.dataRegistro ? 
        new Date(avaliacao.dataRegistro.toDate()).toLocaleDateString('pt-BR') : 
        'Data não disponível';
    
    // Criar estrelas
    const estrelas = '⭐'.repeat(avaliacao.estrelas || 0) + 
                     '☆'.repeat(5 - (avaliacao.estrelas || 0));
    
    card.innerHTML = `
        <div class="avaliacao-header">
            <h4>${avaliacao.avaliador || 'Avaliador'}</h4>
            <span class="avaliacao-data">${data}</span>
        </div>
        <div class="avaliacao-estrelas">${estrelas}</div>
        <div class="avaliacao-comentario">
            ${avaliacao.comentario || 'Sem comentário'}
        </div>
    `;
    
    return card;
}

// Mostrar grid vazio
function mostrarGridVazio() {
    const grid = document.getElementById('avaliacoesGrid');
    grid.innerHTML = `
        <div class="avaliacao-vazia">
            <div class="avaliacao-vazia-icon">📝</div>
            <h3>Nenhuma avaliação encontrada</h3>
            <p>Clique em "Nova Avaliação" para adicionar a primeira avaliação.</p>
        </div>
    `;
}

// Calcular média das estrelas
function calcularMediaEstrelas() {
    if (avaliacoesData.length === 0) {
        document.getElementById('estrelasMedia').textContent = '☆☆☆☆☆';
        return;
    }
    
    const totalEstrelas = avaliacoesData.reduce((sum, av) => sum + (av.estrelas || 0), 0);
    const media = totalEstrelas / avaliacoesData.length;
    
    // Arredondar para meia estrela
    const estrelasCheias = Math.floor(media);
    const meiaEstrela = media - estrelasCheias >= 0.5;
    
    let estrelasHTML = '⭐'.repeat(estrelasCheias);
    if (meiaEstrela) estrelasHTML += '½';
    estrelasHTML += '☆'.repeat(5 - estrelasCheias - (meiaEstrela ? 1 : 0));
    
    document.getElementById('estrelasMedia').innerHTML = estrelasHTML;
}

// Carregar status atual
async function carregarStatus() {
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.obterStatusSolucao(solucaoDocId);
        
        if (resultado.success && resultado.status) {
            statusAtual = resultado.status;
            document.getElementById('statusSelect').value = statusAtual;
        }
    } catch (error) {
        console.error('Erro ao carregar status:', error);
    }
}

// Salvar status
async function salvarStatus() {
    const novoStatus = document.getElementById('statusSelect').value;
    
    if (!novoStatus) return;
    
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.atualizarStatusSolucao(solucaoDocId, novoStatus);
        
        if (resultado.success) {
            statusAtual = novoStatus;
            showNotification('Status atualizado com sucesso!', 'success');
        } else {
            showNotification('Erro ao atualizar status', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar status:', error);
        showNotification('Erro ao salvar status', 'error');
    }
}

// Salvar avaliação
async function salvarAvaliacao() {
    const avaliador = document.getElementById('avaliadorSelect').value;
    const comentario = document.getElementById('comentarioAvaliacao').value;
    const estrelas = parseInt(document.getElementById('estrelasValue').value);
    
    // Validação
    if (!avaliador) {
        showNotification('Selecione um avaliador', 'warning');
        return;
    }
    
    if (!comentario.trim()) {
        showNotification('Digite um comentário', 'warning');
        return;
    }
    
    if (estrelas < 1 || estrelas > 5) {
        showNotification('Selecione entre 1 e 5 estrelas', 'warning');
        return;
    }
    
    // Dados da avaliação
    const avaliacaoData = {
        avaliador: avaliador,
        comentario: comentario.trim(),
        estrelas: estrelas,
        dataRegistro: new Date().toISOString()
    };
    
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.salvarAvaliacao(solucaoId, avaliacaoData);
        
        if (resultado.success) {
            showNotification('Avaliação salva com sucesso!', 'success');
            
            // Fechar popup e recarregar
            document.getElementById('popupNovaAvaliacao').style.display = 'none';
            resetarFormularioAvaliacao();
            carregarAvaliacoes();
        } else {
            showNotification('Erro ao salvar avaliação', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        showNotification('Erro ao salvar avaliação', 'error');
    }
}

// Função de notificação (reutilizar do script principal)
function showNotification(message, type = 'info') {
    // Implementar ou importar do script.js
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message); // Temporário
}