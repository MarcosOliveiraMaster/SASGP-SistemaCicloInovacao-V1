// utilitarios.js - Funções utilitárias para o SASGP

window.UtilitariosSASGP = {
    // Formata uma data para o formato brasileiro
    formatarData: function(dataString) {
        if (!dataString) return 'Data não informada';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) {
                return 'Data inválida';
            }
            
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Data inválida';
        }
    },
    
    // Calcula a média de estrelas de uma lista de avaliações
    calcularMediaEstrelas: function(avaliacoes) {
        if (!avaliacoes || avaliacoes.length === 0) {
            return 0;
        }
        
        const total = avaliacoes.reduce((soma, avaliacao) => {
            return soma + (avaliacao.estrelas || 0);
        }, 0);
        
        return Math.round((total / avaliacoes.length) * 10) / 10;
    },
    
    // Mostra uma notificação na tela
    mostrarNotificacao: function(mensagem, tipo = 'info') {
        // Verifica se já existe uma notificação do sistema SASGP
        if (window.SistemaSASGP && typeof window.SistemaSASGP.mostrarNotificacao === 'function') {
            return window.SistemaSASGP.mostrarNotificacao(mensagem, tipo);
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
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Comfortaa', cursive;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        notificacao.innerHTML = `
            <span style="font-size: 1.2rem;">${config.icone}</span>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(notificacao);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notificacao.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.parentNode.removeChild(notificacao);
                }
            }, 300);
        }, 3000);
        
        // Adiciona estilos de animação se não existirem
        if (!document.querySelector('#notificacao-styles')) {
            const style = document.createElement('style');
            style.id = 'notificacao-styles';
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
    },
    
    // Valida um e-mail
    validarEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Formata um número como moeda brasileira
    formatarMoeda: function(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    },
    
    // Gera um ID único
    gerarIdUnico: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Limita um texto a um número máximo de caracteres
    limitarTexto: function(texto, maxCaracteres) {
        if (!texto) return '';
        if (texto.length <= maxCaracteres) return texto;
        return texto.substring(0, maxCaracteres) + '...';
    },
    
    // Converte um timestamp do Firebase para string ISO
    converterTimestampParaISO: function(timestamp) {
        if (!timestamp) return '';
        if (timestamp.toDate) {
            return timestamp.toDate().toISOString();
        }
        return timestamp;
    }
};

console.log('✅ Utilitários SASGP carregados com sucesso!');