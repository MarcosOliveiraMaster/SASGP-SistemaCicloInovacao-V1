// script-extra.js - Sistema de Avaliação e Histórico SASGP
// Versão Completa com Integração Firebase

// ============================================================================
// 1. VARIÁVEIS GLOBAIS
// ============================================================================
let solucaoAtualAvaliacao = null;
let solucaoAtualHistorico = null;
let avaliacoesCarregadas = [];
let historicosCarregados = [];
let avaliacaoSelecionada = null;
let historicoSelecionado = null;

// ============================================================================
// 2. INICIALIZAÇÃO DAS PÁGINAS
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando sistema de avaliação e histórico...');
    
    const page = getCurrentPage();
    console.log(`📄 Página atual: ${page}`);
    
    switch(page) {
        case 'avaliacao.html':
            initAvaliacaoPage();
            break;
        case 'historico.html':
            initHistoricoPage();
            break;
    }
});

function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop() || '';
}

// ============================================================================
// 3. PÁGINA DE AVALIAÇÃO - COMPLETA
// ============================================================================

async function initAvaliacaoPage() {
    console.log('⭐ Inicializando página de avaliação...');
    
    try {
        // Verificar se BancoDeDados está disponível
        if (typeof BancoDeDados === 'undefined') {
            throw new Error('Banco de dados não carregado');
        }
        
        const params = new URLSearchParams(window.location.search);
        const docId = params.get('docId');
        const id = params.get('id');
        
        console.log(`📌 Parâmetros: DocID=${docId}, ID=${id}`);
        
        if (!docId || !id) {
            mostrarNotificacao('❌ Solução não identificada. Redirecionando...', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Carregar dados da solução
        console.log('🔍 Carregando dados da solução...');
        const resultado = await BancoDeDados.obterSolucaoPorDocId(docId);
        
        if (!resultado.success) {
            throw new Error(resultado.error || 'Solução não encontrada');
        }
        
        solucaoAtualAvaliacao = resultado.data;
        console.log('✅ Dados da solução carregados:', solucaoAtualAvaliacao.nome);
        
        // Carregar dados na interface
        carregarDadosSolucaoAvaliacao();
        
        // Carregar avaliações
        await carregarAvaliacoes(id);
        
        // Configurar eventos
        configurarEventosAvaliacao();
        
        console.log('✅ Página de avaliação inicializada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar página de avaliação:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
        
        // Mostrar estado de erro na interface
        const grid = document.getElementById('avaliacoesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1;">
                    <div class="error-icon">❌</div>
                    <h3>Erro ao carregar dados</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                        Voltar para início
                    </button>
                </div>
            `;
        }
    }
}

function carregarDadosSolucaoAvaliacao() {
    if (!solucaoAtualAvaliacao) {
        console.warn('⚠️ Nenhuma solução carregada para exibir dados');
        return;
    }
    
    console.log('📊 Carregando dados da solução na interface...');
    
    try {
        // Atualizar informações básicas
        const nomeElement = document.getElementById('nomeSolucaoAvaliacao');
        const scoreElement = document.getElementById('scoreSolucao');
        const dataCriacaoElement = document.getElementById('dataCriacaoSolucao');
        
        if (nomeElement) nomeElement.textContent = solucaoAtualAvaliacao.nome || 'Solução sem nome';
        if (scoreElement) scoreElement.textContent = `${solucaoAtualAvaliacao.score || 0}%`;
        if (dataCriacaoElement) {
            dataCriacaoElement.textContent = solucaoAtualAvaliacao.dataCriacao 
                ? UtilitariosSASGP.formatarData(solucaoAtualAvaliacao.dataCriacao)
                : 'Data não disponível';
        }
        
        // Atualizar status
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const selectStatus = document.getElementById('selectStatus');
        
        if (statusDot) {
            statusDot.className = 'status-dot ' + (solucaoAtualAvaliacao.status || 'em-analise');
        }
        
        if (statusText) {
            statusText.textContent = formatarStatus(solucaoAtualAvaliacao.status);
        }
        
        if (selectStatus) {
            selectStatus.value = solucaoAtualAvaliacao.status || 'em-analise';
        }
        
        console.log('✅ Dados da solução carregados na interface');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados na interface:', error);
    }
}

function formatarStatus(status) {
    const statusMap = {
        'em-analise': 'Em Análise',
        'aprovada-aguardando': 'Aprovada - Aguardando',
        'aprovada-execucao': 'Aprovada - Em Execução',
        'arquivada': 'Arquivada',
        'reprovada': 'Reprovada'
    };
    return statusMap[status] || status || 'Em Análise';
}

async function carregarAvaliacoes(idSolucao) {
    console.log(`📥 Carregando avaliações para solução ${idSolucao}...`);
    
    const grid = document.getElementById('avaliacoesGrid');
    const semAvaliacoes = document.getElementById('semAvaliacoes');
    
    if (grid) {
        grid.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p>Carregando avaliações...</p>
            </div>
        `;
    }
    
    try {
        const resultado = await BancoDeDados.listarAvaliacoes(idSolucao);
        
        if (!resultado.success) {
            throw new Error(resultado.error || 'Erro ao carregar avaliações');
        }
        
        avaliacoesCarregadas = resultado.data || [];
        console.log(`✅ ${avaliacoesCarregadas.length} avaliação(ões) carregada(s)`);
        
        atualizarResumoAvaliacoes();
        renderizarAvaliacoes();
        
    } catch (error) {
        console.error('❌ Erro ao carregar avaliações:', error);
        
        if (grid) {
            grid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1;">
                    <div class="error-icon">⚠️</div>
                    <p>Não foi possível carregar as avaliações</p>
                    <button class="btn btn-secondary" onclick="carregarAvaliacoes('${idSolucao}')">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
        
        if (semAvaliacoes) {
            semAvaliacoes.style.display = 'block';
        }
    }
}

function atualizarResumoAvaliacoes() {
    console.log('📈 Atualizando resumo das avaliações...');
    
    const averageValue = document.getElementById('averageValue');
    const averageCount = document.getElementById('averageCount');
    const averageStars = document.getElementById('averageStars');
    
    if (!averageValue || !averageCount || !averageStars) {
        console.warn('⚠️ Elementos do resumo não encontrados');
        return;
    }
    
    if (!avaliacoesCarregadas || avaliacoesCarregadas.length === 0) {
        averageValue.textContent = '0.0';
        averageCount.textContent = '0 avaliações';
        averageStars.innerHTML = '☆☆☆☆☆';
        console.log('ℹ️ Nenhuma avaliação para calcular resumo');
        return;
    }
    
    // Calcular média
    const totalEstrelas = avaliacoesCarregadas.reduce((sum, avaliacao) => {
        return sum + (parseInt(avaliacao.estrelas) || 0);
    }, 0);
    
    const media = totalEstrelas / avaliacoesCarregadas.length;
    const mediaArredondada = Math.round(media * 10) / 10; // Uma casa decimal
    
    // Atualizar UI
    averageValue.textContent = mediaArredondada.toFixed(1);
    averageCount.textContent = `${avaliacoesCarregadas.length} avaliação(ões)`;
    
    // Criar visualização de estrelas
    const estrelasCheias = Math.floor(media);
    const temMeiaEstrela = (media - estrelasCheias) >= 0.5;
    const estrelasVazias = 5 - estrelasCheias - (temMeiaEstrela ? 1 : 0);
    
    let estrelasHTML = '★'.repeat(estrelasCheias);
    if (temMeiaEstrela) estrelasHTML += '⭐';
    estrelasHTML += '☆'.repeat(estrelasVazias);
    
    averageStars.innerHTML = estrelasHTML;
    
    console.log(`📊 Média calculada: ${mediaArredondada.toFixed(1)} estrelas`);
}

function renderizarAvaliacoes() {
    console.log('🎨 Renderizando avaliações...');
    console.log('📊 Total de avaliações carregadas:', avaliacoesCarregadas.length);
    
    const grid = document.getElementById('avaliacoesGrid');
    const semAvaliacoes = document.getElementById('semAvaliacoes');
    
    if (!grid) {
        console.error('❌ Grid de avaliações não encontrado');
        return;
    }
    
    grid.innerHTML = '';
    
    if (!avaliacoesCarregadas || avaliacoesCarregadas.length === 0) {
        console.log('ℹ️ Nenhuma avaliação para renderizar');
        grid.style.display = 'none';
        if (semAvaliacoes) {
            semAvaliacoes.style.display = 'block';
            semAvaliacoes.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 20px;">📝</div>
                <h3>Nenhuma avaliação encontrada</h3>
                <p>Seja o primeiro a avaliar esta solução!</p>
                <button class="btn btn-primary" onclick="abrirModalAvaliacao()" style="margin-top: 20px;">
                    + Adicionar Avaliação
                </button>
            `;
        }
        return;
    }
    
    grid.style.display = 'grid';
    if (semAvaliacoes) {
        semAvaliacoes.style.display = 'none';
    }
    
    // Aplicar filtros
    let avaliacoesFiltradas = [...avaliacoesCarregadas];
    const filtroAutor = document.getElementById('filterAutor')?.value || 'todos';
    const filtroEstrelas = document.getElementById('filterEstrelas')?.value || 'todos';
    
    console.log(`🎯 Filtros: Autor=${filtroAutor}, Estrelas=${filtroEstrelas}`);
    
    if (filtroAutor !== 'todos') {
        avaliacoesFiltradas = avaliacoesFiltradas.filter(a => a.avaliador === filtroAutor);
    }
    
    if (filtroEstrelas !== 'todos') {
        avaliacoesFiltradas = avaliacoesFiltradas.filter(a => a.estrelas == filtroEstrelas);
    }
    
    console.log(`📈 ${avaliacoesFiltradas.length} avaliação(ões) após filtros`);
    
    // Renderizar cards
    avaliacoesFiltradas.forEach((avaliacao, index) => {
        console.log(`📄 Renderizando avaliação ${index + 1}: ${avaliacao.avaliador} - ${avaliacao.estrelas} estrelas`);
        const card = criarCardAvaliacao(avaliacao);
        grid.appendChild(card);
    });
    
    // Se não houver avaliações após filtro
    if (avaliacoesFiltradas.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <h3>Nenhuma avaliação encontrada</h3>
                <p>Tente alterar os filtros ou adicionar uma nova avaliação.</p>
                <button class="btn btn-primary" onclick="abrirModalAvaliacao()" style="margin-top: 20px;">
                    + Adicionar Avaliação
                </button>
            </div>
        `;
    }
    
    console.log('✅ Renderização de avaliações concluída');
}

function criarCardAvaliacao(avaliacao) {
    const card = document.createElement('div');
    card.className = 'card-avaliacao';
    card.dataset.docId = avaliacao.docId;
    
    // Formatar data
    const dataFormatada = avaliacao.dataRegistro 
        ? UtilitariosSASGP.formatarData(avaliacao.dataRegistro)
        : 'Data não disponível';
    
    // Criar estrelas
    const estrelas = parseInt(avaliacao.estrelas) || 0;
    const estrelasHTML = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
    
    // Truncar comentário se for muito longo
    const comentario = avaliacao.comentario || '(Sem comentário)';
    const comentarioResumo = comentario.length > 150 
        ? comentario.substring(0, 150) + '...' 
        : comentario;
    
    card.innerHTML = `
        <div class="card-avaliacao-header">
            <div>
                <div class="card-avaliador">${avaliacao.avaliador || 'Anônimo'}</div>
                <div class="card-estrelas">${estrelasHTML}</div>
            </div>
            <div class="card-data">${dataFormatada}</div>
        </div>
        <div class="card-comentario">${comentarioResumo}</div>
    `;
    
    // Clique para ver detalhes
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirDetalhesAvaliacao(avaliacao);
    });
    
    return card;
}

function configurarEventosAvaliacao() {
    console.log('⚙️ Configurando eventos da página de avaliação...');
    
    // Botão atualizar status
    const btnAtualizarStatus = document.getElementById('btnAtualizarStatus');
    if (btnAtualizarStatus) {
        btnAtualizarStatus.addEventListener('click', async () => {
            const selectStatus = document.getElementById('selectStatus');
            if (!selectStatus || !solucaoAtualAvaliacao) return;
            
            const novoStatus = selectStatus.value;
            
            // Botão de loading
            const textoOriginal = btnAtualizarStatus.innerHTML;
            btnAtualizarStatus.innerHTML = '⏳ Atualizando...';
            btnAtualizarStatus.disabled = true;
            
            try {
                const resultado = await BancoDeDados.atualizarStatusSolucao(
                    solucaoAtualAvaliacao.docId, 
                    novoStatus
                );
                
                if (resultado.success) {
                    solucaoAtualAvaliacao.status = novoStatus;
                    carregarDadosSolucaoAvaliacao();
                    mostrarNotificacao('✅ Status atualizado com sucesso!', 'success');
                } else {
                    throw new Error(resultado.error || 'Erro ao atualizar status');
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar status:', error);
                mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
            } finally {
                btnAtualizarStatus.innerHTML = textoOriginal;
                btnAtualizarStatus.disabled = false;
            }
        });
    }
    
    // Botão filtrar
    const btnFiltrar = document.getElementById('btnFiltrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', renderizarAvaliacoes);
    }
    
    // Botão adicionar avaliação
    const btnAdicionarAvaliacao = document.getElementById('btnAdicionarAvaliacao');
    if (btnAdicionarAvaliacao) {
        btnAdicionarAvaliacao.addEventListener('click', abrirModalAvaliacao);
    }
    
    // Configurar eventos dos modais
    configurarEventosModaisAvaliacao();
    
    console.log('✅ Eventos da página de avaliação configurados');
}

function configurarEventosModaisAvaliacao() {
    console.log('⚙️ Configurando eventos dos modais de avaliação...');
    
    // ============ MODAL DE NOVA AVALIAÇÃO ============
    // Configurar estrelas
    document.querySelectorAll('.estrela').forEach(estrela => {
        estrela.addEventListener('click', function() {
            const valor = parseInt(this.dataset.value);
            selecionarEstrelas(valor);
        });
    });
    
    // Contador de caracteres do comentário
    const comentarioInput = document.getElementById('comentarioAvaliacao');
    if (comentarioInput) {
        comentarioInput.addEventListener('input', function() {
            const contador = document.getElementById('charCount');
            if (!contador) return;
            
            const charCount = this.value.length;
            contador.textContent = charCount;
            contador.className = 'char-counter';
            
            if (charCount > 450) {
                contador.classList.add('warning');
            }
            if (charCount >= 500) {
                contador.classList.add('error');
            }
        });
    }
    
    // Botão salvar avaliação
    const btnSalvarAvaliacao = document.getElementById('salvarAvaliacao');
    if (btnSalvarAvaliacao) {
        btnSalvarAvaliacao.addEventListener('click', salvarAvaliacao);
    }
    
    // Botão cancelar avaliação
    const btnCancelAvaliacao = document.getElementById('cancelAvaliacao');
    if (btnCancelAvaliacao) {
        btnCancelAvaliacao.addEventListener('click', () => {
            fecharModal('modalAvaliacao');
        });
    }
    
    // Fechar modais com botão X
    const closeModalAvaliacao = document.getElementById('closeModalAvaliacao');
    if (closeModalAvaliacao) {
        closeModalAvaliacao.addEventListener('click', () => {
            fecharModal('modalAvaliacao');
        });
    }
    
    const closeModalDetalhes = document.getElementById('closeModalDetalhes');
    if (closeModalDetalhes) {
        closeModalDetalhes.addEventListener('click', () => {
            fecharModal('modalDetalhesAvaliacao');
        });
    }
    
    const closeModalConfirmacao = document.getElementById('closeModalConfirmacao');
    if (closeModalConfirmacao) {
        closeModalConfirmacao.addEventListener('click', () => {
            fecharModal('modalConfirmacaoExclusao');
        });
    }
    
    // ============ MODAL DE DETALHES ============
    const btnFecharDetalhes = document.getElementById('fecharDetalhes');
    if (btnFecharDetalhes) {
        btnFecharDetalhes.addEventListener('click', () => {
            fecharModal('modalDetalhesAvaliacao');
        });
    }
    
    const btnExcluirAvaliacao = document.getElementById('excluirAvaliacao');
    if (btnExcluirAvaliacao) {
        btnExcluirAvaliacao.addEventListener('click', () => {
            if (avaliacaoSelecionada) {
                abrirModalConfirmacaoExclusao();
            }
        });
    }
    
    // ============ MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ============
    const btnConfirmarExclusao = document.getElementById('confirmarExclusao');
    if (btnConfirmarExclusao) {
        btnConfirmarExclusao.addEventListener('click', excluirAvaliacao);
    }
    
    const btnCancelarExclusao = document.getElementById('cancelarExclusao');
    if (btnCancelarExclusao) {
        btnCancelarExclusao.addEventListener('click', () => {
            fecharModal('modalConfirmacaoExclusao');
        });
    }
    
    console.log('✅ Eventos dos modais configurados');
}

function abrirModalAvaliacao() {
    console.log('📝 Abrindo modal de nova avaliação...');
    
    // Resetar formulário
    const selectAvaliador = document.getElementById('selectAvaliador');
    const comentarioInput = document.getElementById('comentarioAvaliacao');
    const charCount = document.getElementById('charCount');
    
    if (selectAvaliador) selectAvaliador.value = 'Simone';
    if (comentarioInput) {
        comentarioInput.value = '';
        if (charCount) charCount.textContent = '0';
    }
    
    selecionarEstrelas(0);
    
    // Abrir modal
    abrirModal('modalAvaliacao');
}

function selecionarEstrelas(valor) {
    console.log(`⭐ Selecionando ${valor} estrela(s)`);
    
    const estrelas = document.querySelectorAll('.estrela');
    const ratingValue = document.getElementById('ratingValue');
    
    if (!estrelas.length || !ratingValue) return;
    
    estrelas.forEach((estrela, index) => {
        const estrelaValor = parseInt(estrela.dataset.value);
        
        if (estrelaValor <= valor) {
            estrela.textContent = '★';
            estrela.classList.add('selecionada');
            estrela.classList.add('animada');
            
            // Remover animação após 500ms
            setTimeout(() => {
                estrela.classList.remove('animada');
            }, 500);
        } else {
            estrela.textContent = '☆';
            estrela.classList.remove('selecionada');
        }
    });
    
    ratingValue.textContent = valor;
}

async function salvarAvaliacao() {
    console.log('💾 Salvando nova avaliação...');
    
    const avaliador = document.getElementById('selectAvaliador')?.value;
    const comentario = document.getElementById('comentarioAvaliacao')?.value.trim();
    const estrelas = parseInt(document.getElementById('ratingValue')?.textContent || '0');
    
    // Validações
    if (!avaliador) {
        mostrarNotificacao('⚠️ Selecione um avaliador', 'warning');
        return;
    }
    
    if (estrelas === 0) {
        mostrarNotificacao('⚠️ Selecione uma nota de 1 a 5 estrelas', 'warning');
        return;
    }
    
    if (!solucaoAtualAvaliacao?.id) {
        mostrarNotificacao('❌ Solução não identificada', 'error');
        return;
    }
    
    // Botão de loading
    const btnSalvar = document.getElementById('salvarAvaliacao');
    if (!btnSalvar) return;
    
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.innerHTML = '⏳ Salvando...';
    btnSalvar.disabled = true;
    
    try {
        const dadosAvaliacao = {
            avaliador: avaliador,
            comentario: comentario,
            estrelas: estrelas
        };
        
        console.log('📤 Enviando dados para o Firebase:', dadosAvaliacao);
        
        const resultado = await BancoDeDados.salvarAvaliacao(
            solucaoAtualAvaliacao.id, 
            dadosAvaliacao
        );
        
        if (resultado.success) {
            mostrarNotificacao('✅ Avaliação salva com sucesso!', 'success');
            fecharModal('modalAvaliacao');
            
            // ============ CORREÇÃO AQUI ============
            // Recarregar TODAS as avaliações (não apenas carregar novamente)
            console.log('🔄 Recarregando lista de avaliações...');
            
            // Forçar um reload completo dos dados
            await carregarAvaliacoes(solucaoAtualAvaliacao.id);
            
            // Atualizar o resumo das avaliações
            atualizarResumoAvaliacoes();
            
            // Forçar re-renderização
            renderizarAvaliacoes();
            
            console.log('✅ Lista de avaliações atualizada após salvar');
            
        } else {
            throw new Error(resultado.error || 'Erro ao salvar avaliação');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar avaliação:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;
    }
}

function abrirDetalhesAvaliacao(avaliacao) {
    console.log('🔍 Abrindo detalhes da avaliação:', avaliacao.docId);
    
    avaliacaoSelecionada = avaliacao;
    
    // Preencher detalhes
    const detalheAvaliador = document.getElementById('detalheAvaliador');
    const detalheEstrelas = document.getElementById('detalheEstrelas');
    const detalheData = document.getElementById('detalheData');
    const detalheComentario = document.getElementById('detalheComentario');
    
    if (detalheAvaliador) detalheAvaliador.textContent = avaliacao.avaliador || 'Anônimo';
    if (detalheEstrelas) {
        const estrelas = parseInt(avaliacao.estrelas) || 0;
        detalheEstrelas.innerHTML = '★'.repeat(estrelas) + '☆'.repeat(5 - estrelas);
    }
    if (detalheData) {
        detalheData.textContent = avaliacao.dataRegistro 
            ? UtilitariosSASGP.formatarData(avaliacao.dataRegistro)
            : 'Data não disponível';
    }
    if (detalheComentario) {
        detalheComentario.textContent = avaliacao.comentario || '(Sem comentário)';
    }
    
    abrirModal('modalDetalhesAvaliacao');
}

function abrirModalConfirmacaoExclusao() {
    console.log('⚠️ Abrindo modal de confirmação de exclusão');
    abrirModal('modalConfirmacaoExclusao');
}

async function excluirAvaliacao() {
    if (!avaliacaoSelecionada) {
        mostrarNotificacao('❌ Nenhuma avaliação selecionada', 'error');
        return;
    }
    
    console.log('🗑️ Excluindo avaliação:', avaliacaoSelecionada.docId);
    
    const btnConfirmar = document.getElementById('confirmarExclusao');
    if (!btnConfirmar) return;
    
    const textoOriginal = btnConfirmar.innerHTML;
    btnConfirmar.innerHTML = '⏳ Excluindo...';
    btnConfirmar.disabled = true;
    
    try {
        const resultado = await BancoDeDados.excluirRelatorio(avaliacaoSelecionada.docId);
        
        if (resultado.success) {
            mostrarNotificacao('✅ Avaliação excluída com sucesso!', 'success');
            
            // Fechar modais
            fecharModal('modalConfirmacaoExclusao');
            fecharModal('modalDetalhesAvaliacao');
            
            // Recarregar avaliações
            await carregarAvaliacoes(solucaoAtualAvaliacao.id);
            
            // Limpar seleção
            avaliacaoSelecionada = null;
        } else {
            throw new Error(resultado.error || 'Erro ao excluir avaliação');
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir avaliação:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnConfirmar.innerHTML = textoOriginal;
        btnConfirmar.disabled = false;
    }
}

// ============================================================================
// 4. PÁGINA DE HISTÓRICO - COMPLETA
// ============================================================================

async function initHistoricoPage() {
    console.log('📋 Inicializando página de histórico...');
    
    try {
        // Verificar se BancoDeDados está disponível
        if (typeof BancoDeDados === 'undefined') {
            throw new Error('Banco de dados não carregado');
        }
        
        const params = new URLSearchParams(window.location.search);
        const docId = params.get('docId');
        const id = params.get('id');
        
        console.log(`📌 Parâmetros: DocID=${docId}, ID=${id}`);
        
        if (!docId || !id) {
            mostrarNotificacao('❌ Solução não identificada. Redirecionando...', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        // Carregar dados da solução
        console.log('🔍 Carregando dados da solução...');
        const resultado = await BancoDeDados.obterSolucaoPorDocId(docId);
        
        if (!resultado.success) {
            throw new Error(resultado.error || 'Solução não encontrada');
        }
        
        solucaoAtualHistorico = resultado.data;
        console.log('✅ Dados da solução carregados:', solucaoAtualHistorico.nome);
        
        // Carregar dados na interface
        carregarDadosSolucaoHistorico();
        
        // Carregar histórico
        await carregarHistoricos(id);
        
        // Configurar eventos
        configurarEventosHistorico();
        
        console.log('✅ Página de histórico inicializada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar página de histórico:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
        
        // Mostrar estado de erro na interface
        const grid = document.getElementById('historicosGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1;">
                    <div class="error-icon">❌</div>
                    <h3>Erro ao carregar dados</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                        Voltar para início
                    </button>
                </div>
            `;
        }
    }
}

function carregarDadosSolucaoHistorico() {
    if (!solucaoAtualHistorico) {
        console.warn('⚠️ Nenhuma solução carregada para exibir dados');
        return;
    }
    
    console.log('📊 Carregando dados da solução na interface...');
    
    try {
        // Atualizar informações básicas
        const nomeElement = document.getElementById('nomeSolucaoHistorico');
        const tipoElement = document.getElementById('tipoSolucao');
        const dataElement = document.getElementById('ultimaAtualizacao');
        
        if (nomeElement) nomeElement.textContent = solucaoAtualHistorico.nome || 'Solução sem nome';
        if (tipoElement) tipoElement.textContent = solucaoAtualHistorico.tipo || 'Não informado';
        if (dataElement) {
            dataElement.textContent = solucaoAtualHistorico.dataAtualizacao 
                ? UtilitariosSASGP.formatarData(solucaoAtualHistorico.dataAtualizacao)
                : 'Data não disponível';
        }
        
        // Atualizar status
        const statusDot = document.getElementById('statusDotHistorico');
        const statusText = document.getElementById('statusTextHistorico');
        
        if (statusDot) {
            statusDot.className = 'status-dot ' + (solucaoAtualHistorico.status || 'em-analise');
        }
        
        if (statusText) {
            statusText.textContent = formatarStatus(solucaoAtualHistorico.status);
        }
        
        console.log('✅ Dados da solução carregados na interface');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados na interface:', error);
    }
}

async function carregarHistoricos(idSolucao) {
    console.log(`📥 Carregando histórico para solução ${idSolucao}...`);
    
    const grid = document.getElementById('historicosGrid');
    const semHistoricos = document.getElementById('semHistoricos');
    
    if (grid) {
        grid.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p>Carregando histórico...</p>
            </div>
        `;
    }
    
    try {
        // Verificar se a função existe no BancoDeDados
        if (typeof BancoDeDados.listarHistoricos !== 'function') {
            throw new Error('Função listarHistoricos não disponível');
        }
        
        const resultado = await BancoDeDados.listarHistoricos(idSolucao);
        
        if (!resultado.success) {
            throw new Error(resultado.error || 'Erro ao carregar histórico');
        }
        
        historicosCarregados = resultado.data || [];
        console.log(`✅ ${historicosCarregados.length} item(ns) de histórico carregado(s)`);
        
        renderizarHistoricos();
        
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        
        if (grid) {
            grid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1;">
                    <div class="error-icon">⚠️</div>
                    <p>Não foi possível carregar o histórico</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">${error.message}</p>
                    <button class="btn btn-secondary" onclick="carregarHistoricos('${idSolucao}')">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
        
        if (semHistoricos) {
            semHistoricos.style.display = 'block';
        }
    }
}

function renderizarHistoricos() {
    console.log('🎨 Renderizando históricos...');
    console.log('📊 Total de históricos carregados:', historicosCarregados.length);
    
    const grid = document.getElementById('historicosGrid');
    const semHistoricos = document.getElementById('semHistoricos');
    
    if (!grid) {
        console.error('❌ Grid de histórico não encontrado');
        return;
    }
    
    grid.innerHTML = '';
    
    if (!historicosCarregados || historicosCarregados.length === 0) {
        console.log('ℹ️ Nenhum item de histórico para renderizar');
        grid.style.display = 'none';
        if (semHistoricos) {
            semHistoricos.style.display = 'block';
            semHistoricos.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 20px;">📋</div>
                <h3>Nenhum registro no histórico</h3>
                <p>Adicione a primeira etapa de desenvolvimento!</p>
                <button class="btn btn-primary" onclick="abrirModalHistorico()" style="margin-top: 20px;">
                    + Adicionar Etapa
                </button>
            `;
        }
        return;
    }
    
    grid.style.display = 'grid';
    if (semHistoricos) {
        semHistoricos.style.display = 'none';
    }
    
    // Aplicar filtros
    let historicosFiltrados = [...historicosCarregados];
    const filtroAutor = document.getElementById('filterAutorHistorico')?.value || 'todos';
    const ordenacao = document.getElementById('filterOrdenacao')?.value || 'desc';
    
    console.log(`🎯 Filtros: Autor=${filtroAutor}, Ordenação=${ordenacao}`);
    
    if (filtroAutor !== 'todos') {
        historicosFiltrados = historicosFiltrados.filter(h => h.autor === filtroAutor);
    }
    
    // Ordenar por data
    historicosFiltrados.sort((a, b) => {
        try {
            const dateA = new Date(a.dataRegistro || 0);
            const dateB = new Date(b.dataRegistro || 0);
            return ordenacao === 'desc' ? dateB - dateA : dateA - dateB;
        } catch (error) {
            return 0;
        }
    });
    
    console.log(`📈 ${historicosFiltrados.length} item(ns) de histórico após filtros`);
    
    // Renderizar cards
    historicosFiltrados.forEach((historico, index) => {
        console.log(`📄 Renderizando histórico ${index + 1}: ${historico.titulo} - ${historico.autor}`);
        const card = criarCardHistorico(historico);
        grid.appendChild(card);
    });
    
    // Se não houver histórico após filtro
    if (historicosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <h3>Nenhum registro encontrado</h3>
                <p>Tente alterar os filtros ou adicionar um novo registro.</p>
                <button class="btn btn-primary" onclick="abrirModalHistorico()" style="margin-top: 20px;">
                    + Adicionar Etapa
                </button>
            </div>
        `;
    }
    
    console.log('✅ Renderização de históricos concluída');
}

function criarCardHistorico(historico) {
    const card = document.createElement('div');
    card.className = 'card-historico';
    card.dataset.docId = historico.docId;
    
    // Formatar data
    const dataFormatada = historico.dataRegistro 
        ? UtilitariosSASGP.formatarData(historico.dataRegistro)
        : 'Data não disponível';
    
    // Truncar descrição se for muito longa
    const descricao = historico.descricao || historico.comentario || '(Sem descrição)';
    const descricaoResumo = descricao.length > 150 
        ? descricao.substring(0, 150) + '...' 
        : descricao;
    
    card.innerHTML = `
        <div class="card-historico-header">
            <div>
                <div class="card-titulo">${historico.titulo || 'Sem título'}</div>
                <div class="card-autor-historico">${historico.autor || 'Anônimo'}</div>
            </div>
            <div class="card-data-historico">${dataFormatada}</div>
        </div>
        <div class="card-descricao">${descricaoResumo}</div>
    `;
    
    // Clique para ver detalhes
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirDetalhesHistorico(historico);
    });
    
    return card;
}



function configurarEventosHistorico() {
    console.log('⚙️ Configurando eventos da página de histórico...');
    
    // Botão filtrar
    const btnFiltrarHistorico = document.getElementById('btnFiltrarHistorico');
    if (btnFiltrarHistorico) {
        btnFiltrarHistorico.addEventListener('click', renderizarHistoricos);
    }
    
    // Botão adicionar histórico
    const btnAdicionarHistorico = document.getElementById('btnAdicionarHistorico');
    if (btnAdicionarHistorico) {
        btnAdicionarHistorico.addEventListener('click', abrirModalHistorico);
    }
    
    // Configurar eventos dos modais
    configurarEventosModaisHistorico();
    
    console.log('✅ Eventos da página de histórico configurados');
}

function configurarEventosModaisHistorico() {
    console.log('⚙️ Configurando eventos dos modais de histórico...');
    
    // ============ MODAL DE NOVO HISTÓRICO ============
    // Contador de caracteres do título
    const tituloInput = document.getElementById('tituloHistorico');
    if (tituloInput) {
        tituloInput.addEventListener('input', function() {
            const contador = document.getElementById('charCountTitulo');
            if (contador) {
                contador.textContent = this.value.length;
            }
        });
    }
    
    // Contador de caracteres da descrição
    const descricaoInput = document.getElementById('comentarioHistorico');
    if (descricaoInput) {
        descricaoInput.addEventListener('input', function() {
            const contador = document.getElementById('charCountHistorico');
            if (!contador) return;
            
            const charCount = this.value.length;
            contador.textContent = charCount;
            contador.className = 'char-counter';
            
            if (charCount > 900) {
                contador.classList.add('warning');
            }
            if (charCount >= 1000) {
                contador.classList.add('error');
            }
        });
    }
    
    // Botão salvar histórico
    const btnSalvarHistorico = document.getElementById('salvarHistorico');
    if (btnSalvarHistorico) {
        btnSalvarHistorico.addEventListener('click', salvarHistorico);
    }
    
    // Botão cancelar histórico
    const btnCancelHistorico = document.getElementById('cancelHistorico');
    if (btnCancelHistorico) {
        btnCancelHistorico.addEventListener('click', () => {
            fecharModal('modalHistorico');
        });
    }
    
    // Fechar modais com botão X
    const closeModalHistorico = document.getElementById('closeModalHistorico');
    if (closeModalHistorico) {
        closeModalHistorico.addEventListener('click', () => {
            fecharModal('modalHistorico');
        });
    }
    
    const closeModalDetalhesHistorico = document.getElementById('closeModalDetalhesHistorico');
    if (closeModalDetalhesHistorico) {
        closeModalDetalhesHistorico.addEventListener('click', () => {
            fecharModal('modalDetalhesHistorico');
        });
    }
    
    const closeModalConfirmacaoHistorico = document.getElementById('closeModalConfirmacaoHistorico');
    if (closeModalConfirmacaoHistorico) {
        closeModalConfirmacaoHistorico.addEventListener('click', () => {
            fecharModal('modalConfirmacaoExclusaoHistorico');
        });
    }
    
    // ============ MODAL DE DETALHES ============
    const btnFecharDetalhesHistorico = document.getElementById('fecharDetalhesHistorico');
    if (btnFecharDetalhesHistorico) {
        btnFecharDetalhesHistorico.addEventListener('click', () => {
            fecharModal('modalDetalhesHistorico');
        });
    }
    
    const btnExcluirHistorico = document.getElementById('excluirHistorico');
    if (btnExcluirHistorico) {
        btnExcluirHistorico.addEventListener('click', () => {
            if (historicoSelecionado) {
                abrirModalConfirmacaoExclusaoHistorico();
            }
        });
    }
    
    // ============ MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ============
    const btnConfirmarExclusaoHistorico = document.getElementById('confirmarExclusaoHistorico');
    if (btnConfirmarExclusaoHistorico) {
        btnConfirmarExclusaoHistorico.addEventListener('click', excluirHistorico);
    }
    
    const btnCancelarExclusaoHistorico = document.getElementById('cancelarExclusaoHistorico');
    if (btnCancelarExclusaoHistorico) {
        btnCancelarExclusaoHistorico.addEventListener('click', () => {
            fecharModal('modalConfirmacaoExclusaoHistorico');
        });
    }
    
    console.log('✅ Eventos dos modais de histórico configurados');
}

function abrirModalHistorico() {
    console.log('📝 Abrindo modal de novo histórico...');
    
    // Resetar formulário
    const selectAutor = document.getElementById('selectAutorHistorico');
    const tituloInput = document.getElementById('tituloHistorico');
    const descricaoInput = document.getElementById('comentarioHistorico');
    const charCountTitulo = document.getElementById('charCountTitulo');
    const charCountHistorico = document.getElementById('charCountHistorico');
    
    if (selectAutor) selectAutor.value = 'Simone';
    if (tituloInput) {
        tituloInput.value = '';
        if (charCountTitulo) charCountTitulo.textContent = '0';
    }
    if (descricaoInput) {
        descricaoInput.value = '';
        if (charCountHistorico) charCountHistorico.textContent = '0';
    }
    
    // Abrir modal
    abrirModal('modalHistorico');
}

async function salvarHistorico() {
    console.log('💾 Salvando novo histórico...');
    
    const autor = document.getElementById('selectAutorHistorico')?.value;
    const titulo = document.getElementById('tituloHistorico')?.value.trim();
    const descricao = document.getElementById('comentarioHistorico')?.value.trim();
    
    // Validações
    if (!autor) {
        mostrarNotificacao('⚠️ Selecione um autor', 'warning');
        return;
    }
    
    if (!titulo) {
        mostrarNotificacao('⚠️ Informe um título para a etapa', 'warning');
        return;
    }
    
    if (!descricao) {
        mostrarNotificacao('⚠️ Descreva a etapa de desenvolvimento', 'warning');
        return;
    }
    
    if (!solucaoAtualHistorico?.id) {
        mostrarNotificacao('❌ Solução não identificada', 'error');
        return;
    }
    
    // Verificar se a função existe
    if (typeof BancoDeDados.salvarHistorico !== 'function') {
        mostrarNotificacao('❌ Função não disponível. Atualize o banco.js', 'error');
        return;
    }
    
    // Botão de loading
    const btnSalvar = document.getElementById('salvarHistorico');
    if (!btnSalvar) return;
    
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.innerHTML = '⏳ Salvando...';
    btnSalvar.disabled = true;
    
    try {
        const dadosHistorico = {
            autor: autor,
            titulo: titulo,
            descricao: descricao
        };
        
        console.log('📤 Enviando dados para o Firebase:', dadosHistorico);
        
        const resultado = await BancoDeDados.salvarHistorico(
            solucaoAtualHistorico.id, 
            dadosHistorico
        );
        
        if (resultado.success) {
            mostrarNotificacao('✅ Histórico salvo com sucesso!', 'success');
            fecharModal('modalHistorico');
            
            // ============ CORREÇÃO AQUI ============
            // Recarregar TODOS os históricos
            console.log('🔄 Recarregando lista de históricos...');
            
            // Forçar um reload completo dos dados
            await carregarHistoricos(solucaoAtualHistorico.id);
            
            // Forçar re-renderização
            renderizarHistoricos();
            
            console.log('✅ Lista de históricos atualizada após salvar');
            
        } else {
            throw new Error(resultado.error || 'Erro ao salvar histórico');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar histórico:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;
    }
}

function abrirDetalhesHistorico(historico) {
    console.log('🔍 Abrindo detalhes do histórico:', historico.docId);
    
    historicoSelecionado = historico;
    
    // Preencher detalhes
    const detalheAutor = document.getElementById('detalheAutorHistorico');
    const detalheTitulo = document.getElementById('detalheTituloHistorico');
    const detalheData = document.getElementById('detalheDataHistorico');
    const detalheDescricao = document.getElementById('detalheDescricaoHistorico');
    
    if (detalheAutor) detalheAutor.textContent = historico.autor || 'Anônimo';
    if (detalheTitulo) detalheTitulo.textContent = historico.titulo || 'Sem título';
    if (detalheData) {
        detalheData.textContent = historico.dataRegistro 
            ? UtilitariosSASGP.formatarData(historico.dataRegistro)
            : 'Data não disponível';
    }
    if (detalheDescricao) {
        detalheDescricao.textContent = historico.descricao || historico.comentario || '(Sem descrição)';
    }
    
    abrirModal('modalDetalhesHistorico');
}

function abrirModalConfirmacaoExclusaoHistorico() {
    console.log('⚠️ Abrindo modal de confirmação de exclusão do histórico');
    abrirModal('modalConfirmacaoExclusaoHistorico');
}

async function recarregarDadosAvaliacao() {
    if (!solucaoAtualAvaliacao?.id) {
        console.error('❌ ID da solução não disponível para recarregar avaliações');
        return;
    }
    
    console.log('🔄 Forçando recarregamento de avaliações...');
    
    // Limpar cache
    avaliacoesCarregadas = [];
    
    // Recarregar dados do Firebase
    await carregarAvaliacoes(solucaoAtualAvaliacao.id);
    
    // Atualizar resumo
    atualizarResumoAvaliacoes();
    
    // Re-renderizar
    renderizarAvaliacoes();
}

async function recarregarDadosHistorico() {
    if (!solucaoAtualHistorico?.id) {
        console.error('❌ ID da solução não disponível para recarregar históricos');
        return;
    }
    
    console.log('🔄 Forçando recarregamento de históricos...');
    
    // Limpar cache
    historicosCarregados = [];
    
    // Recarregar dados do Firebase
    await carregarHistoricos(solucaoAtualHistorico.id);
    
    // Re-renderizar
    renderizarHistoricos();
}

async function excluirHistorico() {
    if (!historicoSelecionado) {
        mostrarNotificacao('❌ Nenhum registro selecionado', 'error');
        return;
    }
    
    console.log('🗑️ Excluindo histórico:', historicoSelecionado.docId);
    
    // Verificar se a função existe
    if (typeof BancoDeDados.excluirHistorico !== 'function') {
        mostrarNotificacao('❌ Função não disponível. Atualize o banco.js', 'error');
        return;
    }
    
    const btnConfirmar = document.getElementById('confirmarExclusaoHistorico');
    if (!btnConfirmar) return;
    
    const textoOriginal = btnConfirmar.innerHTML;
    btnConfirmar.innerHTML = '⏳ Excluindo...';
    btnConfirmar.disabled = true;
    
    try {
        const resultado = await BancoDeDados.excluirHistorico(historicoSelecionado.docId);
        
        if (resultado.success) {
            mostrarNotificacao('✅ Histórico excluído com sucesso!', 'success');
            
            // Fechar modais
            fecharModal('modalConfirmacaoExclusaoHistorico');
            fecharModal('modalDetalhesHistorico');
            
            // Recarregar histórico
            await carregarHistoricos(solucaoAtualHistorico.id);
            
            // Limpar seleção
            historicoSelecionado = null;
        } else {
            throw new Error(resultado.error || 'Erro ao excluir histórico');
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir histórico:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnConfirmar.innerHTML = textoOriginal;
        btnConfirmar.disabled = false;
    }
}

// ============================================================================
// 5. FUNÇÕES UTILITÁRIAS COMPARTILHADAS
// ============================================================================

function abrirModal(modalId) {
    console.log(`📂 Abrindo modal: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Fechar modal com ESC
        const fecharComEsc = (e) => {
            if (e.key === 'Escape') {
                fecharModal(modalId);
                document.removeEventListener('keydown', fecharComEsc);
            }
        };
        document.addEventListener('keydown', fecharComEsc);
        
        // Fechar modal clicando fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModal(modalId);
            }
        });
    } else {
        console.warn(`⚠️ Modal não encontrado: ${modalId}`);
    }
}

function fecharModal(modalId) {
    console.log(`📪 Fechando modal: ${modalId}`);
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Botão recarregar avaliações
const btnRecarregarAvaliacoes = document.getElementById('btnRecarregarAvaliacoes');
if (btnRecarregarAvaliacoes) {
    btnRecarregarAvaliacoes.addEventListener('click', async () => {
        const textoOriginal = btnRecarregarAvaliacoes.innerHTML;
        btnRecarregarAvaliacoes.innerHTML = '⏳ Atualizando...';
        btnRecarregarAvaliacoes.disabled = true;
        
        await recarregarDadosAvaliacao();
        
        btnRecarregarAvaliacoes.innerHTML = textoOriginal;
        btnRecarregarAvaliacoes.disabled = false;
        mostrarNotificacao('✅ Avaliações atualizadas!', 'success');
    });
}

// Botão recarregar históricos
const btnRecarregarHistoricos = document.getElementById('btnRecarregarHistoricos');
if (btnRecarregarHistoricos) {
    btnRecarregarHistoricos.addEventListener('click', async () => {
        const textoOriginal = btnRecarregarHistoricos.innerHTML;
        btnRecarregarHistoricos.innerHTML = '⏳ Atualizando...';
        btnRecarregarHistoricos.disabled = true;
        
        await recarregarDadosHistorico();
        
        btnRecarregarHistoricos.innerHTML = textoOriginal;
        btnRecarregarHistoricos.disabled = false;
        mostrarNotificacao('✅ Histórico atualizado!', 'success');
    });
}

async function debugVerificarAvaliacoesNoFirebase() {
    if (!solucaoAtualAvaliacao?.id) {
        console.error('❌ ID da solução não disponível');
        return;
    }
    
    console.log('🔍 DEBUG: Verificando avaliações no Firebase...');
    
    try {
        // Usar a função diretamente para ver resultados brutos
        const resultado = await BancoDeDados.listarAvaliacoes(solucaoAtualAvaliacao.id);
        
        if (resultado.success) {
            console.log('📊 Dados brutos do Firebase:', resultado.data);
            console.log('📈 Total de avaliações encontradas:', resultado.data.length);
            
            // Verificar cada avaliação
            resultado.data.forEach((avaliacao, index) => {
                console.log(`📄 Avaliação ${index + 1}:`, {
                    id: avaliacao.docId,
                    avaliador: avaliacao.avaliador,
                    estrelas: avaliacao.estrelas,
                    comentario: avaliacao.comentario?.substring(0, 50) + '...',
                    data: avaliacao.dataRegistro
                });
            });
        } else {
            console.error('❌ Erro ao buscar avaliações:', resultado.error);
        }
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

async function debugVerificarHistoricosNoFirebase() {
    if (!solucaoAtualHistorico?.id) {
        console.error('❌ ID da solução não disponível');
        return;
    }
    
    console.log('🔍 DEBUG: Verificando históricos no Firebase...');
    
    try {
        const resultado = await BancoDeDados.listarHistoricos(solucaoAtualHistorico.id);
        
        if (resultado.success) {
            console.log('📊 Dados brutos do Firebase:', resultado.data);
            console.log('📈 Total de históricos encontrados:', resultado.data.length);
            
            resultado.data.forEach((historico, index) => {
                console.log(`📄 Histórico ${index + 1}:`, {
                    id: historico.docId,
                    autor: historico.autor,
                    titulo: historico.titulo,
                    descricao: historico.descricao?.substring(0, 50) + '...',
                    data: historico.dataRegistro
                });
            });
        } else {
            console.error('❌ Erro ao buscar históricos:', resultado.error);
        }
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

// Adicionar ao objeto global para debug
window.debugSistema = {
    verificarAvaliacoes: debugVerificarAvaliacoesNoFirebase,
    verificarHistoricos: debugVerificarHistoricosNoFirebase,
    recarregarAvaliacoes: recarregarDadosAvaliacao,
    recarregarHistoricos: recarregarDadosHistorico
};

function mostrarNotificacao(mensagem, tipo = 'info') {
    console.log(`📢 Notificação [${tipo}]: ${mensagem}`);
    
    // Usar UtilitariosSASGP se disponível
    if (window.UtilitariosSASGP && typeof window.UtilitariosSASGP.mostrarNotificacao === 'function') {
        return window.UtilitariosSASGP.mostrarNotificacao(mensagem, tipo);
    }
    
    // Fallback básico
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
// 6. EXPORTAÇÃO PARA DEBUG E DESENVOLVIMENTO
// ============================================================================

window.SistemaAvaliacaoHistorico = {
    // Estado atual
    getEstado: () => ({
        solucaoAtualAvaliacao,
        solucaoAtualHistorico,
        avaliacoesCarregadas,
        historicosCarregados,
        avaliacaoSelecionada,
        historicoSelecionado
    }),
    
    // Funções da página de avaliação
    carregarAvaliacoes,
    atualizarResumoAvaliacoes,
    renderizarAvaliacoes,
    abrirModalAvaliacao,
    salvarAvaliacao,
    excluirAvaliacao,
    
    // Funções da página de histórico
    carregarHistoricos,
    renderizarHistoricos,
    abrirModalHistorico,
    salvarHistorico,
    excluirHistorico,
    
    // Funções utilitárias
    abrirModal,
    fecharModal,
    mostrarNotificacao,
    
    // Recarregar dados
    recarregarTudo: async () => {
        if (solucaoAtualAvaliacao) {
            await carregarAvaliacoes(solucaoAtualAvaliacao.id);
        }
        if (solucaoAtualHistorico) {
            await carregarHistoricos(solucaoAtualHistorico.id);
        }
    }
};

console.log('✅ Sistema de Avaliação e Histórico carregado com sucesso!');
console.log('🛠️  Para debug, use: window.SistemaAvaliacaoHistorico');