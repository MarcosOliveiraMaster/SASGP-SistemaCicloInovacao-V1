// banco.js - Camada de Dados SASGP (Versão Final Corrigida e Completa)

// ============================================================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAD9Ffs9CQ4jWIl8P3mOKEYq8V5jzwMfXQ",
    authDomain: "sasgp-sistemainovacao-v1.firebaseapp.com",
    projectId: "sasgp-sistemainovacao-v1",
    storageBucket: "sasgp-sistemainovacao-v1.firebasestorage.app",
    messagingSenderId: "593160846088",
    appId: "1:593160846088:web:396c3dba0c473d68d7cabd",
    measurementId: "G-5NLX08FH2R"
};

// Inicialização segura
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ============================================================================
// 2. FUNÇÕES AUXILIARES
// ============================================================================

// Gera ID interno único para vincular coleções
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Limpa documentos antigos de uma coleção específica para um ID de solução
async function deletarColecaoPorIdSolucao(nomeColecao, idInterno) {
    try {
        console.log(`🧹 Limpando coleção ${nomeColecao} para ID ${idInterno}`);
        const snapshot = await db.collection(nomeColecao).where("idSolucao", "==", idInterno).get();
        
        if (snapshot.empty) {
            console.log(`✅ Nenhum documento para limpar em ${nomeColecao}`);
            return;
        }

        const batch = db.batch();
        let count = 0;
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });
        
        await batch.commit();
        console.log(`✅ ${count} documento(s) removido(s) de ${nomeColecao}`);
    } catch (error) {
        console.error(`❌ Erro ao limpar coleção ${nomeColecao}:`, error);
        throw error;
    }
}

// ============================================================================
// 3. RESUMO DA SOLUÇÃO (CRUD PRINCIPAL)
// ============================================================================

async function adicionarSolucao(dados) {
    try {
        const idInterno = generateId();
        
        // Prepara objeto completo com valores padrão
        const dadosCompletos = {
            id: idInterno,
            nome: dados.nome || 'Solução Sem Nome',
            descricao: dados.descricao || '',
            tipo: dados.tipo || 'Outros',
            icone: dados.icone || '💡',
            score: dados.score || 0,
            status: dados.status || 'em-analise',
            dadosKillswitch: dados.dadosKillswitch || {},
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("ResumoSolucao").add(dadosCompletos);
        console.log("✅ Solução criada:", {
            docId: docRef.id,
            id: idInterno,
            nome: dadosCompletos.nome
        });
        
        return { 
            success: true, 
            id: idInterno, 
            docId: docRef.id,
            data: dadosCompletos
        };
    } catch (error) {
        console.error("❌ Erro ao adicionar solução:", error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

async function listarSolucoes() {
    try {
        console.log("📋 Listando soluções...");
        const snapshot = await db.collection("ResumoSolucao")
            .orderBy("dataAtualizacao", "desc")
            .get();
            
        const lista = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            lista.push({
                docId: doc.id,
                ...data,
                // Converter timestamps para strings
                dataCriacao: data.dataCriacao ? data.dataCriacao.toDate().toISOString() : '',
                dataAtualizacao: data.dataAtualizacao ? data.dataAtualizacao.toDate().toISOString() : ''
            });
        });
        
        console.log(`✅ ${lista.length} solução(ões) encontrada(s)`);
        return { success: true, data: lista };
    } catch (error) {
        console.error("❌ Erro ao listar soluções:", error);
        return { 
            success: false, 
            error: error.message,
            data: []
        };
    }
}

async function obterSolucaoPorDocId(docId) {
    try {
        console.log(`🔍 Buscando solução com DocID: ${docId}`);
        const doc = await db.collection("ResumoSolucao").doc(docId).get();
        
        if (doc.exists) {
            const data = doc.data();
            const resultado = {
                docId: doc.id,
                ...data,
                dataCriacao: data.dataCriacao ? data.dataCriacao.toDate().toISOString() : '',
                dataAtualizacao: data.dataAtualizacao ? data.dataAtualizacao.toDate().toISOString() : ''
            };
            
            console.log(`✅ Solução encontrada: ${resultado.nome}`);
            return { success: true, data: resultado };
        } else {
            console.log(`❌ Solução não encontrada: ${docId}`);
            return { success: false, error: "Solução não encontrada" };
        }
    } catch (error) {
        console.error(`❌ Erro ao obter solução ${docId}:`, error);
        return { success: false, error: error.message };
    }
}

async function atualizarSolucao(docId, dados) {
    try {
        console.log(`✏️ Atualizando solução ${docId}:`, dados);
        
        const dadosAtualizacao = {
            ...dados,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("ResumoSolucao").doc(docId).update(dadosAtualizacao);
        console.log(`✅ Solução ${docId} atualizada com sucesso`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Erro ao atualizar solução ${docId}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code 
        };
    }
}

// ============================================================================
// 4. RECURSOS (TEXTO SIMPLES)
// ============================================================================

async function salvarRecursos(idSolucao, textoRecursos) {
    try {
        console.log(`💾 Salvando recursos para solução ${idSolucao}`);
        console.log(`Conteúdo: ${textoRecursos ? textoRecursos.substring(0, 100) + '...' : '(vazio)'}`);
        
        // 1. Limpa registros anteriores deste ID
        await deletarColecaoPorIdSolucao("RecursosSolucao", idSolucao);

        // 2. Salva o novo texto
        const docRef = await db.collection("RecursosSolucao").add({
            idSolucao: idSolucao,
            recursos: textoRecursos || "", // Aceita string vazia
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Recursos salvos com sucesso! DocID: ${docRef.id}`);
        return { 
            success: true, 
            docId: docRef.id,
            message: "Recursos salvos com sucesso"
        };
    } catch (error) {
        console.error(`❌ Erro ao salvar recursos para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

async function obterRecursos(idSolucao) {
    try {
        console.log(`🔍 Buscando recursos para solução ${idSolucao}`);
        
        const snapshot = await db.collection("RecursosSolucao")
            .where("idSolucao", "==", idSolucao)
            .orderBy("dataRegistro", "desc")
            .limit(1)
            .get();
            
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const dados = doc.data();
            const recursos = dados.recursos || "";
            
            console.log(`✅ Recursos encontrados (${recursos.length} caracteres)`);
            return { 
                success: true, 
                data: recursos,
                docId: doc.id,
                dataRegistro: dados.dataRegistro ? dados.dataRegistro.toDate().toISOString() : '',
                message: "Recursos carregados com sucesso"
            };
        }
        
        console.log(`ℹ️ Nenhum recurso encontrado para solução ${idSolucao}`);
        return { 
            success: true, 
            data: "",
            message: "Nenhum recurso cadastrado"
        };
    } catch (error) {
        console.error(`❌ Erro ao obter recursos para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            data: "",
            code: error.code
        };
    }
}

// ============================================================================
// 5. CANVAS DE PRODUTO
// ============================================================================

async function salvarCanvas(idSolucao, canvasData) {
    try {
        console.log(`🎨 Salvando canvas para solução ${idSolucao}`);
        console.log("Dados recebidos:", canvasData);
        
        // 1. Limpa registros anteriores
        await deletarColecaoPorIdSolucao("CanvasSolucao", idSolucao);

        // 2. Definir campos esperados (correspondem aos IDs do HTML)
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
        
        // 3. Preparar dados para salvar
        const dadosParaSalvar = {
            idSolucao: idSolucao,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 4. Adicionar cada campo com valor padrão se não existir
        camposCanvas.forEach(campo => {
            dadosParaSalvar[campo] = canvasData[campo] || "";
        });
        
        console.log("Dados formatados para Firebase:", dadosParaSalvar);

        // 5. Salvar no Firestore
        const docRef = await db.collection("CanvasSolucao").add(dadosParaSalvar);
        
        console.log(`✅ Canvas salvo com sucesso! DocID: ${docRef.id}`);
        
        // 6. Logar no console
        console.log("📋 === DADOS DO CANVAS SALVOS ===");
        camposCanvas.forEach(campo => {
            console.log(`${campo}: ${dadosParaSalvar[campo]}`);
        });
        console.log("=================================");
        
        return { 
            success: true, 
            docId: docRef.id,
            data: dadosParaSalvar,
            message: "Canvas salvo com sucesso"
        };
    } catch (error) {
        console.error(`❌ Erro ao salvar canvas para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

async function obterCanvas(idSolucao) {
    try {
        console.log(`🔍 Buscando canvas para solução ${idSolucao}`);
        
        const snapshot = await db.collection("CanvasSolucao")
            .where("idSolucao", "==", idSolucao)
            .orderBy("dataRegistro", "desc")
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const dados = doc.data();
            
            console.log(`✅ Canvas encontrado para solução ${idSolucao}`);
            console.log("Dados do canvas:", dados);
            
            return { 
                success: true, 
                data: dados,
                docId: doc.id,
                dataRegistro: dados.dataRegistro ? dados.dataRegistro.toDate().toISOString() : '',
                message: "Canvas carregado com sucesso"
            };
        }
        
        console.log(`ℹ️ Nenhum canvas encontrado para solução ${idSolucao}`);
        return { 
            success: true, 
            data: {},
            message: "Nenhum canvas cadastrado"
        };
    } catch (error) {
        console.error(`❌ Erro ao obter canvas para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            data: {},
            code: error.code
        };
    }
}

// ============================================================================
// 6. EXCLUSÃO E UTILITÁRIOS
// ============================================================================

// Exclusão completa (Cascata)
async function excluirSolucaoCompleta(docId, idInterno) {
    try {
        console.log("🗑️ Iniciando exclusão completa da solução...");
        console.log(`DocID: ${docId}, ID Interno: ${idInterno}`);
        
        // Se tivermos o ID interno, limpamos as coleções filhas
        if (idInterno) {
            console.log("🧹 Limpando coleções filhas...");
            await deletarColecaoPorIdSolucao("RecursosSolucao", idInterno);
            await deletarColecaoPorIdSolucao("CanvasSolucao", idInterno);
            await deletarColecaoPorIdSolucao("Avaliacoes", idInterno);
            await deletarColecaoPorIdSolucao("Historicos", idInterno);
            console.log("✅ Coleções filhas limpas");
        }

        // Exclui o documento pai
        console.log(`🗑️ Excluindo documento principal ${docId}...`);
        await db.collection("ResumoSolucao").doc(docId).delete();
        
        console.log("✅ Solução excluída completamente");
        return { 
            success: true, 
            message: "Solução excluída com sucesso" 
        };
    } catch (error) {
        console.error("❌ Erro na exclusão completa:", error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

// Exclusão Simples (Fallback)
async function excluirSolucao(docId) {
    try {
        console.log(`🗑️ Excluindo solução ${docId}...`);
        await db.collection("ResumoSolucao").doc(docId).delete();
        
        console.log("✅ Solução excluída");
        return { 
            success: true, 
            message: "Solução excluída com sucesso" 
        };
    } catch (error) {
        console.error(`❌ Erro ao excluir solução ${docId}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

// ============================================================================
// 7. FUNÇÕES DE AVALIAÇÃO (CORRIGIDAS - SEM NECESSIDADE DE ÍNDICES COMPOSTOS)
// ============================================================================

async function listarAvaliacoes(idSolucao) {
    try {
        console.log(`⭐ Listando avaliações para solução ${idSolucao}`);
        
        // Método alternativo que não requer índice composto
        // Primeiro filtramos por idSolucao, depois ordenamos localmente
        const snapshot = await db.collection("Avaliacoes")
            .where("idSolucao", "==", idSolucao)
            .get();
            
        const lista = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            lista.push({
                docId: doc.id,
                ...data,
                dataRegistro: data.dataRegistro ? data.dataRegistro.toDate().toISOString() : ''
            });
        });
        
        // Ordenar manualmente por data (mais recente primeiro)
        lista.sort((a, b) => {
            const dateA = new Date(a.dataRegistro);
            const dateB = new Date(b.dataRegistro);
            return dateB - dateA; // Ordem descendente
        });
        
        console.log(`✅ ${lista.length} avaliação(ões) encontrada(s)`);
        return { 
            success: true, 
            data: lista,
            message: "Avaliações carregadas com sucesso"
        };
    } catch (error) {
        console.error(`❌ Erro ao listar avaliações para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            data: [],
            code: error.code
        };
    }
}

async function salvarAvaliacao(idSolucao, avaliacaoData) {
    try {
        console.log(`⭐ Salvando avaliação para solução ${idSolucao}`);
        console.log('📤 Dados da avaliação recebidos:', avaliacaoData);
        
        const dadosCompletos = {
            idSolucao: idSolucao,
            avaliador: avaliacaoData.avaliador || "Anônimo",
            estrelas: avaliacaoData.estrelas || 0,
            comentario: avaliacaoData.comentario || "",
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("Avaliacoes").add(dadosCompletos);
        
        console.log(`✅ Avaliação salva com sucesso! DocID: ${docRef.id}`);
        console.log('📄 Dados salvos na coleção Avaliacoes:', dadosCompletos);
        
        return { 
            success: true, 
            docId: docRef.id,
            data: dadosCompletos,
            message: "Avaliação salva com sucesso"
        };
    } catch (error) {
        console.error(`❌ Erro ao salvar avaliação para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

async function excluirRelatorio(docId) {
    try {
        console.log(`🗑️ Excluindo avaliação ${docId}...`);
        await db.collection("Avaliacoes").doc(docId).delete();
        
        console.log("✅ Avaliação excluída");
        return { 
            success: true, 
            message: "Avaliação excluída com sucesso" 
        };
    } catch (error) {
        console.error(`❌ Erro ao excluir avaliação ${docId}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

// ============================================================================
// 8. FUNÇÕES DE HISTÓRICO (CORRIGIDAS - SEM NECESSIDADE DE ÍNDICES COMPOSTOS)
// ============================================================================

async function listarHistoricos(idSolucao) {
    try {
        console.log(`📋 Listando histórico para solução ${idSolucao}`);
        
        // Método alternativo que não requer índice composto
        const snapshot = await db.collection("Historicos")
            .where("idSolucao", "==", idSolucao)
            .get();
            
        const lista = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            lista.push({
                docId: doc.id,
                ...data,
                dataRegistro: data.dataRegistro ? data.dataRegistro.toDate().toISOString() : ''
            });
        });
        
        // Ordenar manualmente por data (mais recente primeiro)
        lista.sort((a, b) => {
            const dateA = new Date(a.dataRegistro);
            const dateB = new Date(b.dataRegistro);
            return dateB - dateA; // Ordem descendente
        });
        
        console.log(`✅ ${lista.length} item(ns) de histórico encontrado(s)`);
        return { 
            success: true, 
            data: lista,
            message: "Histórico carregado com sucesso"
        };
    } catch (error) {
        console.error(`❌ Erro ao listar histórico para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            data: [],
            code: error.code
        };
    }
}

async function salvarHistorico(idSolucao, historicoData) {
    try {
        console.log(`📝 Salvando histórico para solução ${idSolucao}`);
        console.log("📤 Dados do histórico recebidos:", historicoData);
        
        const dadosCompletos = {
            idSolucao: idSolucao,
            autor: historicoData.autor || "Anônimo",
            titulo: historicoData.titulo || "",
            descricao: historicoData.descricao || historicoData.comentario || "",
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("Historicos").add(dadosCompletos);
        
        console.log(`✅ Histórico salvo com sucesso! DocID: ${docRef.id}`);
        console.log("📄 Dados salvos na coleção Historicos:", dadosCompletos);
        
        return { 
            success: true, 
            docId: docRef.id,
            data: dadosCompletos,
            message: "Histórico salvo com sucesso"
        };
    } catch (error) {
        console.error(`❌ Erro ao salvar histórico para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

async function excluirHistorico(docId) {
    try {
        console.log(`🗑️ Excluindo histórico ${docId}...`);
        await db.collection("Historicos").doc(docId).delete();
        
        console.log("✅ Histórico excluído");
        return { 
            success: true, 
            message: "Histórico excluído com sucesso" 
        };
    } catch (error) {
        console.error(`❌ Erro ao excluir histórico ${docId}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

// ============================================================================
// 9. FUNÇÕES DE STATUS E UTILITÁRIOS
// ============================================================================

async function atualizarStatusSolucao(docId, novoStatus) {
    try {
        console.log(`🔄 Atualizando status da solução ${docId} para: ${novoStatus}`);
        
        await db.collection("ResumoSolucao").doc(docId).update({
            status: novoStatus,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("✅ Status atualizado com sucesso");
        return { 
            success: true, 
            message: "Status atualizado com sucesso" 
        };
    } catch (error) {
        console.error(`❌ Erro ao atualizar status da solução ${docId}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

async function calcularMediaAvaliacoes(idSolucao) {
    try {
        console.log(`📊 Calculando média das avaliações para solução ${idSolucao}`);
        
        const resultado = await listarAvaliacoes(idSolucao);
        
        if (!resultado.success || !resultado.data) {
            throw new Error(resultado.error || "Erro ao buscar avaliações");
        }
        
        const avaliacoes = resultado.data;
        let totalEstrelas = 0;
        let totalAvaliacoes = 0;
        
        avaliacoes.forEach(avaliacao => {
            totalEstrelas += avaliacao.estrelas || 0;
            totalAvaliacoes++;
        });
        
        const media = totalAvaliacoes > 0 ? totalEstrelas / totalAvaliacoes : 0;
        
        console.log(`✅ Média calculada: ${media.toFixed(1)} (${totalAvaliacoes} avaliações)`);
        
        return { 
            success: true, 
            media: media,
            totalAvaliacoes: totalAvaliacoes,
            totalEstrelas: totalEstrelas
        };
    } catch (error) {
        console.error(`❌ Erro ao calcular média das avaliações para solução ${idSolucao}:`, error);
        return { 
            success: false, 
            error: error.message,
            code: error.code
        };
    }
}

// ============================================================================
// 10. FUNÇÕES DE DEBUG E VERIFICAÇÃO
// ============================================================================

async function verificarAvaliacoesNoFirebase(idSolucao) {
    try {
        console.log(`🔍 Verificando avaliações no Firebase para solução ${idSolucao}...`);
        
        const snapshot = await db.collection("Avaliacoes").get();
        const avaliacoesDaSolucao = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.idSolucao === idSolucao) {
                avaliacoesDaSolucao.push({
                    docId: doc.id,
                    ...data,
                    dataRegistro: data.dataRegistro ? data.dataRegistro.toDate().toISOString() : ''
                });
            }
        });
        
        console.log(`📊 Encontradas ${avaliacoesDaSolucao.length} avaliações para esta solução`);
        console.log("📄 Detalhes:", avaliacoesDaSolucao);
        
        return {
            success: true,
            data: avaliacoesDaSolucao,
            total: avaliacoesDaSolucao.length
        };
    } catch (error) {
        console.error('❌ Erro ao verificar avaliações:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function verificarHistoricosNoFirebase(idSolucao) {
    try {
        console.log(`🔍 Verificando históricos no Firebase para solução ${idSolucao}...`);
        
        const snapshot = await db.collection("Historicos").get();
        const historicosDaSolucao = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.idSolucao === idSolucao) {
                historicosDaSolucao.push({
                    docId: doc.id,
                    ...data,
                    dataRegistro: data.dataRegistro ? data.dataRegistro.toDate().toISOString() : ''
                });
            }
        });
        
        console.log(`📊 Encontrados ${historicosDaSolucao.length} históricos para esta solução`);
        console.log("📄 Detalhes:", historicosDaSolucao);
        
        return {
            success: true,
            data: historicosDaSolucao,
            total: historicosDaSolucao.length
        };
    } catch (error) {
        console.error('❌ Erro ao verificar históricos:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================================
// 11. EXPORTAÇÃO GLOBAL
// ============================================================================
window.BancoDeDados = {
    // Referência do Firestore
    db,
    
    // Soluções (CRUD Principal)
    adicionarSolucao,
    listarSolucoes,
    obterSolucaoPorDocId,
    atualizarSolucao,
    excluirSolucao,
    excluirSolucaoCompleta,
    
    // Recursos
    salvarRecursos,
    obterRecursos,
    
    // Canvas
    salvarCanvas,
    obterCanvas,
    
    // Avaliações
    listarAvaliacoes,
    salvarAvaliacao,
    excluirRelatorio,
    
    // Histórico
    listarHistoricos,
    salvarHistorico,
    excluirHistorico,
    
    // Status e Utilitários
    atualizarStatusSolucao,
    calcularMediaAvaliacoes,
    
    // Funções de Verificação (Debug)
    verificarAvaliacoesNoFirebase,
    verificarHistoricosNoFirebase,
    
    // Funções de compatibilidade (legado)
    salvarPontuacao: async function(idSolucao, k, mp, mn, s) { 
        console.log("⚠️ Função de compatibilidade: salvarPontuacao");
        return { success: true, message: "Pontuação agora salva no resumo da solução" };
    },
    
    obterPontuacao: async function(idSolucao) { 
        console.log("⚠️ Função de compatibilidade: obterPontuacao");
        return { 
            success: false, 
            error: "Use obterSolucaoPorDocId para obter dados completos" 
        };
    },
    
    // Utilitário para debug
    debug: {
        listarColecoes: async function() {
            try {
                const colecoes = ["ResumoSolucao", "RecursosSolucao", "CanvasSolucao", "Avaliacoes", "Historicos"];
                const resultados = {};
                
                for (const colecao of colecoes) {
                    const snapshot = await db.collection(colecao).limit(5).get();
                    resultados[colecao] = snapshot.size;
                }
                
                console.log("📊 Estatísticas das coleções:", resultados);
                return resultados;
            } catch (error) {
                console.error("❌ Erro ao listar coleções:", error);
                return { error: error.message };
            }
        },
        
        listarDocumentos: async function(nomeColecao) {
            try {
                console.log(`🔍 Listando documentos da coleção: ${nomeColecao}`);
                const snapshot = await db.collection(nomeColecao).limit(20).get();
                
                const documentos = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Converter timestamps para strings
                    Object.keys(data).forEach(key => {
                        if (data[key] && data[key].toDate) {
                            data[key] = data[key].toDate().toISOString();
                        }
                    });
                    documentos.push({
                        id: doc.id,
                        ...data
                    });
                });
                
                console.log(`✅ ${documentos.length} documento(s) encontrado(s) em ${nomeColecao}`);
                console.log("📄 Documentos:", documentos);
                return documentos;
            } catch (error) {
                console.error(`❌ Erro ao listar documentos da coleção ${nomeColecao}:`, error);
                return { error: error.message };
            }
        },
        
        limparColecao: async function(nomeColecao) {
            try {
                if (!confirm(`⚠️ TEM CERTEZA que deseja limpar TODOS os documentos da coleção "${nomeColecao}"? Esta ação é IRREVERSÍVEL!`)) {
                    return { success: false, message: "Operação cancelada pelo usuário" };
                }
                
                console.log(`🧹 Limpando coleção ${nomeColecao}...`);
                const snapshot = await db.collection(nomeColecao).get();
                
                if (snapshot.empty) {
                    console.log(`✅ Coleção ${nomeColecao} já está vazia`);
                    return { success: true, message: "Coleção já está vazia" };
                }
                
                const batch = db.batch();
                let count = 0;
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                    count++;
                });
                
                await batch.commit();
                console.log(`✅ ${count} documento(s) removido(s) da coleção ${nomeColecao}`);
                
                return { 
                    success: true, 
                    message: `${count} documento(s) removido(s)`,
                    count: count
                };
            } catch (error) {
                console.error(`❌ Erro ao limpar coleção ${nomeColecao}:`, error);
                return { 
                    success: false, 
                    error: error.message,
                    code: error.code
                };
            }
        },
        
        testarConexao: async function() {
            try {
                console.log("🔗 Testando conexão com Firebase...");
                const testDoc = await db.collection("ResumoSolucao").limit(1).get();
                console.log(`✅ Conexão OK. Coleção ResumoSolucao tem ${testDoc.size} documento(s)`);
                return { success: true, message: "Conexão estabelecida com sucesso" };
            } catch (error) {
                console.error("❌ Erro na conexão com Firebase:", error);
                return { success: false, error: error.message };
            }
        }
    }
};

console.log("✅ Banco de Dados SASGP carregado com sucesso!");
console.log("📊 Coleções disponíveis: ResumoSolucao, RecursosSolucao, CanvasSolucao, Avaliacoes, Historicos");
console.log("🔗 Para debug, use: window.BancoDeDados.debug");
console.log("🔍 Para verificar dados específicos, use: window.BancoDeDados.verificarAvaliacoesNoFirebase(id) ou verificarHistoricosNoFirebase(id)");