// menu-contexto.js - Gerenciamento do Menu de Contexto

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando menu de contexto...');
    
    // Verificar se estamos na página inicial
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    if (page === 'index.html' || page === '') {
        initContextMenu();
    }
});

function initContextMenu() {
    console.log('⚙️ Configurando menu de contexto...');
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        const menu = document.getElementById('contextMenu');
        const isClickInsideMenu = menu?.contains(e.target);
        
        if (menu && !isClickInsideMenu) {
            menu.style.display = 'none';
        }
    });
    
    // Configurar eventos dos itens do menu
    setupMenuItems();
    
    console.log('✅ Menu de contexto configurado');
}

function setupMenuItems() {
    // Renomear
    const ctxRename = document.getElementById('ctxRename');
    if (ctxRename) {
        ctxRename.addEventListener('click', function(e) {
            e.stopPropagation();
            openRenamePopup();
        });
    }
    
    // Ícone
    const ctxIcon = document.getElementById('ctxIcon');
    if (ctxIcon) {
        ctxIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            openIconPopup();
        });
    }
    
    // Excluir
    const ctxDelete = document.getElementById('ctxDelete');
    if (ctxDelete) {
        ctxDelete.addEventListener('click', function(e) {
            e.stopPropagation();
            openDeletePopup();
        });
    }
    
    // ============ NOVOS BOTÕES ============
    // Avaliação
    const ctxAvaliacao = document.getElementById('ctxAvaliacao');
    if (ctxAvaliacao) {
        ctxAvaliacao.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirAvaliacao();
        });
    }
    
    // Histórico
    const ctxHistorico = document.getElementById('ctxHistorico');
    if (ctxHistorico) {
        ctxHistorico.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirHistorico();
        });
    }
}

function abrirAvaliacao() {
    console.log('⭐ Iniciando abertura da página de avaliação...');
    
    if (!window.rightClickedSolution) {
        console.error('❌ Nenhuma solução selecionada');
        mostrarNotificacao('❌ Nenhuma solução selecionada', 'error');
        return;
    }
    
    const solucao = window.rightClickedSolution;
    console.log('📊 Solução selecionada para avaliação:', solucao);
    
    // Verificar dados necessários
    if (!solucao.docId || !solucao.id) {
        console.error('❌ Dados da solução incompletos:', solucao);
        mostrarNotificacao('❌ Dados da solução incompletos', 'error');
        return;
    }
    
    // Construir URL com parâmetros
    const url = `avaliacao.html?docId=${encodeURIComponent(solucao.docId)}&id=${encodeURIComponent(solucao.id)}`;
    console.log('🔗 Navegando para:', url);
    
    // Fechar menu de contexto
    const menu = document.getElementById('contextMenu');
    if (menu) menu.style.display = 'none';
    
    // Navegar para a página
    window.location.href = url;
}

function abrirHistorico() {
    console.log('📋 Iniciando abertura da página de histórico...');
    
    if (!window.rightClickedSolution) {
        console.error('❌ Nenhuma solução selecionada');
        mostrarNotificacao('❌ Nenhuma solução selecionada', 'error');
        return;
    }
    
    const solucao = window.rightClickedSolution;
    console.log('📊 Solução selecionada para histórico:', solucao);
    
    // Verificar dados necessários
    if (!solucao.docId || !solucao.id) {
        console.error('❌ Dados da solução incompletos:', solucao);
        mostrarNotificacao('❌ Dados da solução incompletos', 'error');
        return;
    }
    
    // Construir URL com parâmetros
    const url = `historico.html?docId=${encodeURIComponent(solucao.docId)}&id=${encodeURIComponent(solucao.id)}`;
    console.log('🔗 Navegando para:', url);
    
    // Fechar menu de contexto
    const menu = document.getElementById('contextMenu');
    if (menu) menu.style.display = 'none';
    
    // Navegar para a página
    window.location.href = url;
}

// Função para mostrar notificação (fallback)
function mostrarNotificacao(mensagem, tipo = 'info') {
    console.log(`📢 Notificação [${tipo}]: ${mensagem}`);
    
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'error' ? '#ff4444' : tipo === 'success' ? '#00C851' : '#4A90E2'};
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
    
    const icone = tipo === 'error' ? '❌' : tipo === 'success' ? '✅' : 'ℹ️';
    notificacao.innerHTML = `<span style="font-size: 1.2rem;">${icone}</span><span>${mensagem}</span>`;
    
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
    
    // Adicionar estilos de animação
    if (!document.querySelector('#menu-notif-styles')) {
        const style = document.createElement('style');
        style.id = 'menu-notif-styles';
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

console.log('✅ Menu de Contexto carregado');