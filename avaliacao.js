// avaliacao.js - Sistema completo de avaliação de soluções

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================

let solucaoAtual = {
    docId: null,
    id: null,
    nome: '',
    status: '',
    tipo: '',
    dataCriacao: '',
    score: 0
};

let avaliacoes = [];
let avaliacaoParaExcluir = null;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de avaliação...');
    
    // Obter IDs da solução
    carregarIdsSolucao();
    
    // Configurar eventos
    configurarEventos();
    
    // Carregar dados iniciais
    if (solucaoAtual.docId && solucaoAtual.id) {
        carregarDadosSolucao();
        carregarAvaliacoes();
    } else {
        mostrarErro('Solução não identificada');
    }
});

// ============================================================================
// CARREGAMENTO DE DADOS
// ============================================================================

function carregarIdsSolucao() {
    // Tentar obter da URL primeiro
    const urlParams = new URLSearchParams(window.location.search);
    solucaoAtual.id = urlParams.get('id');
    
    // Tentar obter do localStorage
    solucaoAtual.docId = localStorage.getItem('avaliacaoSolucaoDocId');
    solucaoAtual.id = solucaoAtual.id || localStorage.getItem('avaliacaoSolucaoId');
    
    console.log('📋 IDs carregados:', solucaoAtual);
}

async function carregarDadosSolucao() {
    try {
        // Atualizar título da página
        document.getElementById('pageTitle').textContent = 'Avaliação de Solução';
        
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.obterSolucaoPorDocId(solucaoAtual.docId);
            
            if (resultado.success && resultado.data) {
                atualizarDadosSolucaoUI(resultado.data);
            } else {
                throw new Error('Solução não encontrada no banco de dados');
            }
        } else {
            // Modo demo
            const solucoes = JSON.parse(localStorage.getItem('solucoesDemo') || '[]');
            const solucao = solucoes.find(s => s.docId === solucaoAtual.docId || s.id === solucaoAtual.id);
            
            if (solucao) {
                atualizarDadosSolucaoUI(solucao);
            } else {
                throw new Error('Solução não encontrada em modo demo');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados da solução:', error);
        mostrarNotificacao('Erro ao carregar dados da solução', 'error');
    }
}

function atualizarDadosSolucaoUI(dados) {
    solucaoAtual = { ...solucaoAtual, ...dados };
    
    // Atualizar UI
    document.getElementById('pageSubtitle').textContent = `Avaliando: ${dados.nome || 'Solução sem nome'}`;
    document.getElementById('infoNome').textContent = dados.nome || 'Não informado';
    document.getElementById('infoTipo').textContent = dados.tipo || 'Não informado';
    document.getElementById('infoData').textContent = UtilitariosSASGP.formatarData(dados.dataCriacao);
    document.getElementById('infoScore').textContent = dados.score ? `${dados.score.toFixed(1)}%` : 'Não calculado';
    
    // Atualizar status
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect && dados.status) {
        statusSelect.value = dados.status;
        atualizarStatusIndicator(dados.status);
    }
}

async function carregarAvaliacoes() {
    const grid = document.getElementById('gridAvaliacoes');
    const semAvaliacoes = document.getElementById('semAvaliacoes');
    
    if (!grid) return;
    
    // Mostrar loading
    grid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando avaliações...</p>
        </div>
    `;
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.listarAvaliacoes(solucaoAtual.id);
            
            if (resultado.success && resultado.data) {
                avaliacoes = resultado.data;
                renderizarAvaliacoes();
            } else {
                avaliacoes = [];
                renderizarAvaliacoes();
            }
        } else {
            // Modo demo
            const chave = `avaliacoes_${solucaoAtual.id}`;
            avaliacoes = JSON.parse(localStorage.getItem(chave) || '[]');
            renderizarAvaliacoes();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar avaliações:', error);
        mostrarNotificacao('Erro ao carregar avaliações', 'error');
        
        grid.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p>Erro ao carregar avaliações</p>
                <button class="btn btn-secondary" onclick="carregarAvaliacoes()">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// ============================================================================
// RENDERIZAÇÃO DE AVALIAÇÕES
// ============================================================================

function renderizarAvaliacoes() {
    const grid = document.getElementById('gridAvaliacoes');
    const semAvaliacoes = document.getElementById('semAvaliacoes');
    
    if (!grid) return;
    
    // Aplicar filtros
    let avaliacoesFiltradas = [...avaliacoes];
    
    const filtroAvaliador = document.getElementById('filtroAvaliador')?.value;
    const filtroEstrelas = document.getElementById('filtroEstrelas')?.value;
    
    if (filtroAvaliador) {
        avaliacoesFiltradas = avaliacoesFiltradas.filter(a => a.avaliador === filtroAvaliador);
    }
    
    if (filtroEstrelas) {
        avaliacoesFiltradas = avaliacoesFiltradas.filter(a => a.estrelas == filtroEstrelas);
    }
    
    // Ordenar por data (mais recente primeiro)
    avaliacoesFiltradas.sort((a, b) => {
        const dataA = new Date(a.dataRegistro || 0);
        const dataB = new Date(b.dataRegistro || 0);
        return dataB - dataA;
    });
    
    // Verificar se há avaliações
    if (avaliacoesFiltradas.length === 0) {
        grid.innerHTML = '';
        semAvaliacoes.style.display = 'block';
        
        const textoFiltro = filtroAvaliador || filtroEstrelas ? 
            'com os filtros aplicados' : '';
        
        semAvaliacoes.querySelector('p').textContent = 
            `Nenhuma avaliação encontrada ${textoFiltro}`;
        
        atualizarMediaEstrelas([]);
        return;
    }
    
    semAvaliacoes.style.display = 'none';
    
    // Renderizar cards
    grid.innerHTML = '';
    avaliacoesFiltradas.forEach((avaliacao, index) => {
        const card = criarCardAvaliacao(avaliacao, index);
        grid.appendChild(card);
    });
    
    // Atualizar média
    atualizarMediaEstrelas(avaliacoesFiltradas);
}

function criarCardAvaliacao(avaliacao, index) {
    const card = document.createElement('div');
    card.className = 'card-avaliacao';
    card.dataset.index = index;
    card.dataset.rating = avaliacao.estrelas || 0;
    card.dataset.docId = avaliacao.docId;
    
    // Formatar data
    const dataFormatada = UtilitariosSASGP.formatarData(avaliacao.dataRegistro);
    
    // Criar estrelas
    const estrelas = avaliacao.estrelas || 0;
    const estrelasHTML = '⭐'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
    
    // Limitar comentário para preview
    const comentarioPreview = avaliacao.comentario ?
        (avaliacao.comentario.length > 150 ? 
            avaliacao.comentario.substring(0, 150) + '...' : 
            avaliacao.comentario) :
        'Sem comentário';
    
    card.innerHTML = `
        <div class="card-avaliacao-header">
            <div class="card-avaliador">${avaliacao.avaliador || 'Avaliador não informado'}</div>
            <div class="card-data">${dataFormatada}</div>
        </div>
        <div class="card-estrelas">${estrelasHTML}</div>
        <div class="card-comentario">${comentarioPreview}</div>
    `;
    
    // Evento de clique para ver detalhes
    card.addEventListener('click', () => {
        abrirDetalhesAvaliacao(avaliacao);
    });
    
    return card;
}

function atualizarMediaEstrelas(avaliacoesLista) {
    if (!avaliacoesLista || avaliacoesLista.length === 0) {
        document.getElementById('estrelasMedia').textContent = '☆☆☆☆☆';
        document.getElementById('mediaValor').textContent = '0.0';
        document.getElementById('mediaContador').textContent = '0 avaliações';
        return;
    }
    
    const media = UtilitariosSASGP.calcularMediaEstrelas(avaliacoesLista);
    const estrelasInteiras = Math.floor(media);
    const temMeia = media % 1 >= 0.5;
    
    let estrelasHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= estrelasInteiras) {
            estrelasHTML += '⭐';
        } else if (i === estrelasInteiras + 1 && temMeia) {
            estrelasHTML += '⭐½';
        } else {
            estrelasHTML += '☆';
        }
    }
    
    document.getElementById('estrelasMedia').textContent = estrelasHTML;
    document.getElementById('mediaValor').textContent = media.toFixed(1);
    document.getElementById('mediaContador').textContent = 
        `${avaliacoesLista.length} avaliação${avaliacoesLista.length !== 1 ? 's' : ''}`;
}

// ============================================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================================

function configurarEventos() {
    // Botão Voltar
    document.getElementById('btnVoltar').addEventListener('click', () => {
        window.location.href = 'inicio.html';
    });
    
    // Botão Nova Avaliação
    document.getElementById('btnNovaAvaliacao').addEventListener('click', abrirModalNovaAvaliacao);
    document.getElementById('btnPrimeiraAvaliacao').addEventListener('click', abrirModalNovaAvaliacao);
    
    // Status select
    document.getElementById('statusSelect').addEventListener('change', atualizarStatusSolucao);
    
    // Filtros
    document.getElementById('filtroAvaliador').addEventListener('change', renderizarAvaliacoes);
    document.getElementById('filtroEstrelas').addEventListener('change', renderizarAvaliacoes);
    
    // Modal Nova Avaliação
    configurarModalNovaAvaliacao();
    
    // Modal Detalhes
    configurarModalDetalhes();
    
    // Modal Confirmação Exclusão
    configurarModalConfirmacao();
    
    // Contador de caracteres no comentário
    document.getElementById('comentario').addEventListener('input', atualizarContadorCaracteres);
}

function configurarModalNovaAvaliacao() {
    const modal = document.getElementById('modalNovaAvaliacao');
    const btnFechar = document.getElementById('fecharModal');
    const btnCancelar = document.getElementById('cancelarAvaliacao');
    const btnSalvar = document.getElementById('salvarAvaliacao');
    
    // Estrelas interativas
    const estrelas = document.querySelectorAll('.estrelas-container .estrela');
    estrelas.forEach(estrela => {
        estrela.addEventListener('click', function() {
            const valor = parseInt(this.dataset.value);
            selecionarEstrelas(valor);
        });
        
        estrela.addEventListener('mouseenter', function() {
            const valor = parseInt(this.dataset.value);
            destacarEstrelas(valor);
        });
    });
    
    // Container de estrelas
    const containerEstrelas = document.querySelector('.estrelas-container');
    containerEstrelas.addEventListener('mouseleave', function() {
        const valorAtual = parseInt(document.getElementById('ratingValue').value);
        destacarEstrelas(valorAtual);
    });
    
    // Fechar modal
    const fecharModal = () => {
        modal.style.display = 'none';
        resetarFormularioAvaliacao();
    };
    
    btnFechar.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
    
    // Salvar avaliação
    btnSalvar.addEventListener('click', salvarAvaliacao);
    
    // Fechar com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            fecharModal();
        }
    });
}

function configurarModalDetalhes() {
    const modal = document.getElementById('modalDetalhesAvaliacao');
    const btnFechar = document.getElementById('fecharDetalhes');
    const btnFechar2 = document.getElementById('fecharDetalhesBtn');
    const btnExcluir = document.getElementById('excluirAvaliacao');
    
    const fecharModal = () => {
        modal.style.display = 'none';
        avaliacaoParaExcluir = null;
    };
    
    btnFechar.addEventListener('click', fecharModal);
    btnFechar2.addEventListener('click', fecharModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
    
    btnExcluir.addEventListener('click', () => {
        if (avaliacaoParaExcluir) {
            fecharModal();
            abrirModalConfirmacaoExclusao(avaliacaoParaExcluir);
        }
    });
}

function configurarModalConfirmacao() {
    const modal = document.getElementById('modalConfirmacao');
    const btnCancelar = document.getElementById('cancelarExclusao');
    const btnConfirmar = document.getElementById('confirmarExclusao');
    
    const fecharModal = () => {
        modal.style.display = 'none';
    };
    
    btnCancelar.addEventListener('click', fecharModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) fecharModal();
    });
    
    btnConfirmar.addEventListener('click', excluirAvaliacaoConfirmada);
}

// ============================================================================
// FUNÇÕES DO FORMULÁRIO DE AVALIAÇÃO
// ============================================================================

function abrirModalNovaAvaliacao() {
    const modal = document.getElementById('modalNovaAvaliacao');
    modal.style.display = 'flex';
    
    // Resetar formulário
    resetarFormularioAvaliacao();
    
    // Focar no primeiro campo
    document.getElementById('avaliador').focus();
}

function resetarFormularioAvaliacao() {
    document.getElementById('avaliador').value = '';
    document.getElementById('ratingValue').value = '0';
    document.getElementById('comentario').value = '';
    document.getElementById('dataAvaliacao').value = new Date().toISOString().split('T')[0];
    
    // Resetar estrelas
    destacarEstrelas(0);
    document.getElementById('ratingLabel').textContent = 'Selecione de 1 a 5 estrelas';
    document.getElementById('ratingLabel').removeAttribute('data-value');
    
    // Resetar contador
    atualizarContadorCaracteres();
}

function selecionarEstrelas(valor) {
    document.getElementById('ratingValue').value = valor;
    destacarEstrelas(valor);
    
    // Adicionar animação
    const estrelaSelecionada = document.querySelector(`.estrela[data-value="${valor}"]`);
    if (estrelaSelecionada) {
        estrelaSelecionada.classList.add('animada');
        setTimeout(() => estrelaSelecionada.classList.remove('animada'), 500);
    }
}

function destacarEstrelas(valor) {
    const estrelas = document.querySelectorAll('.estrelas-container .estrela');
    const ratingLabel = document.getElementById('ratingLabel');
    
    estrelas.forEach(estrela => {
        const estrelaValor = parseInt(estrela.dataset.value);
        
        if (estrelaValor <= valor) {
            estrela.textContent = '⭐';
            estrela.style.color = '#FFD700';
            estrela.classList.add('selecionada');
        } else {
            estrela.textContent = '☆';
            estrela.style.color = 'var(--cinza-300)';
            estrela.classList.remove('selecionada');
        }
    });
    
    // Atualizar label
    if (valor > 0) {
        ratingLabel.textContent = `${valor} estrela${valor !== 1 ? 's' : ''}`;
        ratingLabel.setAttribute('data-value', valor);
    } else {
        ratingLabel.textContent = 'Selecione de 1 a 5 estrelas';
        ratingLabel.removeAttribute('data-value');
    }
}

function atualizarContadorCaracteres() {
    const textarea = document.getElementById('comentario');
    const counter = document.getElementById('charCount');
    const maxLength = 500;
    
    const length = textarea.value.length;
    counter.textContent = length;
    
    // Atualizar classes
    counter.parentElement.classList.remove('warning', 'error');
    
    if (length > maxLength * 0.8) {
        counter.parentElement.classList.add('warning');
    }
    
    if (length > maxLength) {
        counter.parentElement.classList.add('error');
    }
}

// ============================================================================
// GERENCIAMENTO DE AVALIAÇÕES
// ============================================================================

async function salvarAvaliacao() {
    const avaliador = document.getElementById('avaliador').value;
    const rating = parseInt(document.getElementById('ratingValue').value);
    const comentario = document.getElementById('comentario').value.trim();
    const dataAvaliacao = document.getElementById('dataAvaliacao').value;
    
    // Validação
    if (!avaliador) {
        mostrarNotificacao('Selecione um avaliador', 'warning');
        document.getElementById('avaliador').focus();
        return;
    }
    
    if (rating < 1 || rating > 5) {
        mostrarNotificacao('Selecione uma avaliação de 1 a 5 estrelas', 'warning');
        return;
    }
    
    if (!comentario) {
        mostrarNotificacao('Digite um comentário para a avaliação', 'warning');
        document.getElementById('comentario').focus();
        return;
    }
    
    if (comentario.length > 500) {
        mostrarNotificacao('O comentário deve ter no máximo 500 caracteres', 'warning');
        return;
    }
    
    // Preparar dados
    const avaliacaoData = {
        avaliador,
        estrelas: rating,
        comentario,
        dataRegistro: dataAvaliacao ? new Date(dataAvaliacao).toISOString() : new Date().toISOString()
    };
    
    const modal = document.getElementById('modalNovaAvaliacao');
    const btnSalvar = document.getElementById('salvarAvaliacao');
    const btnCancelar = document.getElementById('cancelarAvaliacao');
    
    // Desabilitar botões durante o salvamento
    btnSalvar.disabled = true;
    btnCancelar.disabled = true;
    btnSalvar.innerHTML = '<span class="btn-icon">⏳</span> Salvando...';
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.salvarAvaliacao(solucaoAtual.id, avaliacaoData);
            
            if (resultado.success) {
                mostrarNotificacao('✅ Avaliação salva com sucesso!', 'success');
                
                // Fechar modal
                modal.style.display = 'none';
                resetarFormularioAvaliacao();
                
                // Recarregar avaliações
                await carregarAvaliacoes();
                
                // Destacar nova avaliação
                setTimeout(() => {
                    const novaAvaliacao = document.querySelector('.card-avaliacao:nth-child(1)');
                    if (novaAvaliacao) {
                        novaAvaliacao.classList.add('nova');
                        setTimeout(() => novaAvaliacao.classList.remove('nova'), 2000);
                    }
                }, 500);
            } else {
                throw new Error(resultado.error);
            }
        } else {
            // Modo demo
            const chave = `avaliacoes_${solucaoAtual.id}`;
            const avaliacoesDemo = JSON.parse(localStorage.getItem(chave) || '[]');
            
            avaliacoesDemo.unshift({
                ...avaliacaoData,
                docId: Date.now().toString() + Math.random().toString(36).substr(2)
            });
            
            localStorage.setItem(chave, JSON.stringify(avaliacoesDemo));
            
            mostrarNotificacao('✅ Avaliação salva (modo demo)', 'success');
            modal.style.display = 'none';
            resetarFormularioAvaliacao();
            await carregarAvaliacoes();
        }
    } catch (error) {
        console.error('❌ Erro ao salvar avaliação:', error);
        mostrarNotificacao('❌ Erro ao salvar avaliação: ' + error.message, 'error');
    } finally {
        // Reabilitar botões
        btnSalvar.disabled = false;
        btnCancelar.disabled = false;
        btnSalvar.innerHTML = '<span class="btn-icon">💾</span> Salvar Avaliação';
    }
}

function abrirDetalhesAvaliacao(avaliacao) {
    const modal = document.getElementById('modalDetalhesAvaliacao');
    
    // Preencher dados
    document.getElementById('detalhesAvaliador').textContent = avaliacao.avaliador || 'Avaliador não informado';
    document.getElementById('detalhesData').textContent = UtilitariosSASGP.formatarData(avaliacao.dataRegistro);
    
    // Estrelas
    const estrelas = avaliacao.estrelas || 0;
    const estrelasHTML = '⭐'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
    document.getElementById('detalhesEstrelas').textContent = estrelasHTML;
    
    // Comentário
    document.getElementById('detalhesComentario').textContent = avaliacao.comentario || 'Sem comentário';
    
    // Configurar botão de exclusão (apenas se for do usuário atual)
    // Em um sistema real, verificaria se o usuário tem permissão
    const btnExcluir = document.getElementById('excluirAvaliacao');
    btnExcluir.style.display = 'block';
    avaliacaoParaExcluir = avaliacao;
    
    // Abrir modal
    modal.style.display = 'flex';
}

function abrirModalConfirmacaoExclusao(avaliacao) {
    const modal = document.getElementById('modalConfirmacao');
    avaliacaoParaExcluir = avaliacao;
    modal.style.display = 'flex';
}

async function excluirAvaliacaoConfirmada() {
    if (!avaliacaoParaExcluir || !avaliacaoParaExcluir.docId) {
        mostrarNotificacao('Nenhuma avaliação selecionada para exclusão', 'warning');
        return;
    }
    
    const modal = document.getElementById('modalConfirmacao');
    const btnConfirmar = document.getElementById('confirmarExclusao');
    const btnCancelar = document.getElementById('cancelarExclusao');
    
    // Desabilitar botões
    btnConfirmar.disabled = true;
    btnCancelar.disabled = true;
    btnConfirmar.innerHTML = '<span class="btn-icon">⏳</span> Excluindo...';
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.excluirRelatorio(avaliacaoParaExcluir.docId);
            
            if (resultado.success) {
                mostrarNotificacao('✅ Avaliação excluída com sucesso!', 'success');
                modal.style.display = 'none';
                
                // Remover da lista local
                avaliacoes = avaliacoes.filter(a => a.docId !== avaliacaoParaExcluir.docId);
                renderizarAvaliacoes();
            } else {
                throw new Error(resultado.error);
            }
        } else {
            // Modo demo
            const chave = `avaliacoes_${solucaoAtual.id}`;
            const avaliacoesDemo = JSON.parse(localStorage.getItem(chave) || '[]');
            const novasAvaliacoes = avaliacoesDemo.filter(a => a.docId !== avaliacaoParaExcluir.docId);
            
            localStorage.setItem(chave, JSON.stringify(novasAvaliacoes));
            
            mostrarNotificacao('✅ Avaliação excluída (modo demo)', 'success');
            modal.style.display = 'none';
            
            // Atualizar lista
            avaliacoes = novasAvaliacoes;
            renderizarAvaliacoes();
        }
    } catch (error) {
        console.error('❌ Erro ao excluir avaliação:', error);
        mostrarNotificacao('❌ Erro ao excluir avaliação: ' + error.message, 'error');
    } finally {
        // Reabilitar botões
        btnConfirmar.disabled = false;
        btnCancelar.disabled = false;
        btnConfirmar.innerHTML = '<span class="btn-icon">🗑️</span> Excluir';
        avaliacaoParaExcluir = null;
    }
}

// ============================================================================
// GERENCIAMENTO DE STATUS
// ============================================================================

async function atualizarStatusSolucao() {
    const statusSelect = document.getElementById('statusSelect');
    const novoStatus = statusSelect.value;
    
    if (!novoStatus) {
        mostrarNotificacao('Selecione um status válido', 'warning');
        return;
    }
    
    if (!solucaoAtual.docId) {
        mostrarNotificacao('Solução não identificada para atualização', 'error');
        return;
    }
    
    try {
        if (typeof BancoDeDados !== 'undefined') {
            const resultado = await BancoDeDados.atualizarStatusSolucao(solucaoAtual.docId, novoStatus);
            
            if (resultado.success) {
                mostrarNotificacao('✅ Status atualizado com sucesso!', 'success');
                atualizarStatusIndicator(novoStatus);
                solucaoAtual.status = novoStatus;
            } else {
                throw new Error(resultado.error);
            }
        } else {
            // Modo demo
            const chave = `status_${solucaoAtual.id}`;
            localStorage.setItem(chave, novoStatus);
            
            mostrarNotificacao('✅ Status atualizado (modo demo)', 'success');
            atualizarStatusIndicator(novoStatus);
            solucaoAtual.status = novoStatus;
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        mostrarNotificacao('❌ Erro ao atualizar status: ' + error.message, 'error');
        
        // Reverter seleção
        statusSelect.value = solucaoAtual.status || '';
    }
}

function atualizarStatusIndicator(status) {
    const indicator = document.getElementById('statusIndicator');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');
    
    // Remover todas as classes anteriores
    dot.className = 'status-dot';
    
    // Adicionar classe correta
    dot.classList.add(status);
    
    // Atualizar texto
    const statusTexts = {
        'em-analise': 'Em análise',
        'aprovada-aguardando': 'Aprovada aguardando execução',
        'aprovada-execucao': 'Aprovada em Execução',
        'arquivada': 'Arquivada',
        'reprovada': 'Reprovada'
    };
    
    text.textContent = statusTexts[status] || 'Status desconhecido';
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    if (typeof UtilitariosSASGP !== 'undefined' && UtilitariosSASGP.mostrarNotificacao) {
        UtilitariosSASGP.mostrarNotificacao(mensagem, tipo);
    } else {
        // Fallback básico
        alert(`${tipo.toUpperCase()}: ${mensagem}`);
    }
}

function mostrarErro(mensagem) {
    const grid = document.getElementById('gridAvaliacoes');
    if (grid) {
        grid.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p>${mensagem}</p>
                <button class="btn btn-secondary" onclick="window.location.href='inicio.html'">
                    ← Voltar ao Início
                </button>
            </div>
        `;
    }
    
    mostrarNotificacao(mensagem, 'error');
}

// ============================================================================
// EXPORTAÇÃO PARA DEBUG
// ============================================================================

window.AvaliacaoApp = {
    solucaoAtual,
    avaliacoes,
    carregarDadosSolucao,
    carregarAvaliacoes,
    renderizarAvaliacoes,
    salvarAvaliacao,
    atualizarStatusSolucao
};

console.log('📊 Sistema de avaliação carregado com sucesso!');