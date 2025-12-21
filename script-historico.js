// script-historico.js - Sistema de Histórico de Desenvolvimento

let solucaoId = null;
let solucaoDocId = null;
let relatoriosData = [];
let relatorioParaExcluir = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Obter IDs da solução do localStorage
    solucaoId = localStorage.getItem('historicoSolucaoId');
    solucaoDocId = localStorage.getItem('historicoSolucaoDocId');
    
    if (!solucaoId || !solucaoDocId) {
        alert('Erro: ID da solução não encontrado.');
        window.location.href = 'index.html';
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados
    carregarDadosSolucao();
    carregarRelatorios();
});

// Configurar eventos
function setupEventListeners() {
    // Botão Voltar
    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Botão Adicionar Relatório
    document.getElementById('btnAdicionarRelatorio').addEventListener('click', abrirPopupRelatorio);
    
    // Configurar popups
    setupPopupRelatorio();
    setupPopupExclusao();
}

// Configurar popup de relatório
function setupPopupRelatorio() {
    const popup = document.getElementById('popupRelatorio');
    
    // Botão Cancelar
    document.getElementById('btnCancelarRelatorio').addEventListener('click', () => {
        popup.style.display = 'none';
        resetarFormularioRelatorio();
    });
    
    // Botão Salvar
    document.getElementById('btnSalvarRelatorio').addEventListener('click', salvarRelatorio);
    
    // Fechar popup ao clicar fora
    popup.addEventListener('click', function(e) {
        if (e.target === this) {
            popup.style.display = 'none';
            resetarFormularioRelatorio();
        }
    });
}

// Configurar popup de exclusão
function setupPopupExclusao() {
    const popup = document.getElementById('popupConfirmarExclusao');
    
    // Botão Cancelar
    document.getElementById('btnCancelarExclusao').addEventListener('click', () => {
        popup.style.display = 'none';
        relatorioParaExcluir = null;
    });
    
    // Botão Confirmar Exclusão
    document.getElementById('btnConfirmarExclusao').addEventListener('click', excluirRelatorio);
    
    // Fechar popup ao clicar fora
    popup.addEventListener('click', function(e) {
        if (e.target === this) {
            popup.style.display = 'none';
            relatorioParaExcluir = null;
        }
    });
}

// Abrir popup de relatório
function abrirPopupRelatorio() {
    document.getElementById('popupRelatorio').style.display = 'flex';
    document.getElementById('tituloRelatorio').focus();
}

// Resetar formulário de relatório
function resetarFormularioRelatorio() {
    document.getElementById('tituloRelatorio').value = '';
    document.getElementById('autorRelatorio').value = '';
    document.getElementById('descricaoRelatorio').value = '';
}

// Carregar dados da solução
async function carregarDadosSolucao() {
    try {
        const resultado = await BancoDeDados.obterSolucaoPorDocId(solucaoDocId);
        if (resultado.success && resultado.data) {
            document.getElementById('tituloSolucao').textContent = 
                `Histórico: ${resultado.data.nome || 'Solução'}`;
        }
    } catch (error) {
        console.error('Erro ao carregar dados da solução:', error);
    }
}

// Carregar relatórios
async function carregarRelatorios() {
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.listarRelatorios(solucaoId);
        
        if (resultado.success && resultado.data) {
            relatoriosData = resultado.data;
            renderizarRelatorios();
        } else {
            mostrarContainerVazio();
        }
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        mostrarContainerVazio();
    }
}

// Renderizar relatórios
function renderizarRelatorios() {
    const container = document.getElementById('relatoriosContainer');
    container.innerHTML = '';
    
    if (relatoriosData.length === 0) {
        mostrarContainerVazio();
        return;
    }
    
    relatoriosData.forEach(relatorio => {
        const card = criarCardRelatorio(relatorio);
        container.appendChild(card);
    });
}

// Criar card de relatório
function criarCardRelatorio(relatorio) {
    const card = document.createElement('div');
    card.className = 'relatorio-card';
    
    // Formatar data
    const data = relatorio.dataRegistro ? 
        new Date(relatorio.dataRegistro.toDate()).toLocaleDateString('pt-BR') : 
        'Data não disponível';
    
    card.innerHTML = `
        <div class="relatorio-header">
            <h4>${relatorio.titulo || 'Sem título'}</h4>
            <button class="btn-delete-relatorio" data-id="${relatorio.docId}">
                🗑️
            </button>
        </div>
        <div class="relatorio-meta">
            <span class="relatorio-autor">${relatorio.autor || 'Autor não informado'}</span>
            <span class="relatorio-data">${data}</span>
        </div>
        <div class="relatorio-descricao">
            ${relatorio.descricao || 'Sem descrição'}
        </div>
    `;
    
    // Adicionar evento de exclusão
    const btnDelete = card.querySelector('.btn-delete-relatorio');
    btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmarExclusao(relatorio.docId, relatorio.titulo);
    });
    
    return card;
}

// Mostrar container vazio
function mostrarContainerVazio() {
    const container = document.getElementById('relatoriosContainer');
    container.innerHTML = `
        <div class="relatorio-vazio">
            <div class="relatorio-vazio-icon">📄</div>
            <h3>Nenhum relatório encontrado</h3>
            <p>Clique em "Adicionar Relatório" para criar o primeiro relatório.</p>
        </div>
    `;
}

// Confirmar exclusão
function confirmarExclusao(docId, titulo) {
    relatorioParaExcluir = docId;
    const popup = document.getElementById('popupConfirmarExclusao');
    popup.querySelector('p').textContent = 
        `Tem certeza que deseja excluir o relatório "${titulo || 'este relatório'}?"`;
    popup.style.display = 'flex';
}

// Excluir relatório
async function excluirRelatorio() {
    if (!relatorioParaExcluir) return;
    
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.excluirRelatorio(relatorioParaExcluir);
        
        if (resultado.success) {
            showNotification('Relatório excluído com sucesso!', 'success');
            
            // Fechar popup e recarregar
            document.getElementById('popupConfirmarExclusao').style.display = 'none';
            relatorioParaExcluir = null;
            carregarRelatorios();
        } else {
            showNotification('Erro ao excluir relatório', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir relatório:', error);
        showNotification('Erro ao excluir relatório', 'error');
    }
}

// Salvar relatório
async function salvarRelatorio() {
    const titulo = document.getElementById('tituloRelatorio').value;
    const autor = document.getElementById('autorRelatorio').value;
    const descricao = document.getElementById('descricaoRelatorio').value;
    
    // Validação
    if (!titulo.trim()) {
        showNotification('Digite um título', 'warning');
        return;
    }
    
    if (!autor.trim()) {
        showNotification('Digite o nome do autor', 'warning');
        return;
    }
    
    if (!descricao.trim()) {
        showNotification('Digite a descrição', 'warning');
        return;
    }
    
    // Dados do relatório
    const relatorioData = {
        titulo: titulo.trim(),
        autor: autor.trim(),
        descricao: descricao.trim(),
        dataRegistro: new Date().toISOString()
    };
    
    try {
        // Esta função precisa ser adicionada ao banco.js
        const resultado = await BancoDeDados.salvarRelatorio(solucaoId, relatorioData);
        
        if (resultado.success) {
            showNotification('Relatório salvo com sucesso!', 'success');
            
            // Fechar popup e recarregar
            document.getElementById('popupRelatorio').style.display = 'none';
            resetarFormularioRelatorio();
            carregarRelatorios();
        } else {
            showNotification('Erro ao salvar relatório', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar relatório:', error);
        showNotification('Erro ao salvar relatório', 'error');
    }
}

// Função de notificação
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message); // Temporário
}