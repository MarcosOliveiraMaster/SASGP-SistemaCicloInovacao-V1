// banco.js - Sistema de Gerenciamento do Firebase para SASGP
// Versão corrigida com compatibilidade Firebase v9

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE
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

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Gera um ID único para soluções
 * @returns {string} ID único
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Verifica se um documento existe no Firestore
 * @param {string} docId - ID do documento
 * @param {string} colecao - Nome da coleção
 * @returns {Promise<boolean>} True se existe
 */
async function documentoExiste(docId, colecao = "ResumoSolucao") {
    try {
        const docRef = db.collection(colecao).doc(docId);
        const doc = await docRef.get();
        return doc.exists; // Firebase v9 compat mode usa .exists (propriedade)
    } catch (error) {
        console.error("❌ Erro ao verificar documento:", error);
        return false;
    }
}

// ============================================================================
// FUNÇÕES PRINCIPAIS DE GERENCIAMENTO DE SOLUÇÕES
// ============================================================================

/**
 * ADICIONAR NOVA SOLUÇÃO
 * @param {Object} dados - Dados da solução
 * @returns {Object} Resultado da operação
 */
async function adicionarSolucao(dados) {
    try {
        const id = generateId();
        const dadosCompletos = {
            id: id,
            ...dados,
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("ResumoSolucao").add(dadosCompletos);
        return { 
            success: true, 
            id: id,
            docId: docRef.id
        };
    } catch (error) {
        console.error("❌ Erro ao adicionar solução:", error);
        return { success: false, error: error.message };
    }
}

/**
 * LISTAR SOLUÇÕES
 * @returns {Object} Lista de soluções
 */
async function listarSolucoes() {
    try {
        const querySnapshot = await db.collection("ResumoSolucao")
            .orderBy("dataCriacao", "desc")
            .get();
        
        const solucoes = [];
        querySnapshot.forEach((doc) => {
            solucoes.push({ 
                docId: doc.id,
                ...doc.data()
            });
        });
        
        return { success: true, data: solucoes };
    } catch (error) {
        console.error("❌ Erro ao listar soluções:", error);
        return { success: false, error: error.message };
    }
}

/**
 * OBTER SOLUÇÃO POR DOCID
 * @param {string} docId - ID do documento Firestore
 * @returns {Object} Dados da solução
 */
async function obterSolucaoPorDocId(docId) {
    try {
        const docRef = db.collection("ResumoSolucao").doc(docId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            return { 
                success: true, 
                data: { docId: doc.id, ...doc.data() }
            };
        } else {
            return { success: false, error: "Documento não encontrado" };
        }
    } catch (error) {
        console.error("❌ Erro ao obter solução:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ATUALIZAR NOME DA SOLUÇÃO
 * @param {string} docId - ID do documento Firestore
 * @param {string} novoNome - Novo nome da solução
 * @returns {Object} Resultado da operação
 */
async function atualizarNomeSolucao(docId, novoNome) {
    try {
        // Verificar se documento existe
        const existe = await documentoExiste(docId);
        if (!existe) {
            return { success: false, error: "Documento não encontrado" };
        }
        
        const docRef = db.collection("ResumoSolucao").doc(docId);
        await docRef.update({
            nome: novoNome,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Nome da solução ${docId} atualizado: ${novoNome}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Erro ao atualizar nome:", error);
        return { success: false, error: error.message };
    }
}

/**
 * ATUALIZAR ÍCONE DA SOLUÇÃO
 * @param {string} docId - ID do documento Firestore
 * @param {string} novoIcone - Novo ícone (emoji)
 * @returns {Object} Resultado da operação
 */
async function atualizarIconeSolucao(docId, novoIcone) {
    try {
        // Verificar se documento existe
        const existe = await documentoExiste(docId);
        if (!existe) {
            return { success: false, error: "Documento não encontrado" };
        }
        
        const docRef = db.collection("ResumoSolucao").doc(docId);
        await docRef.update({
            icone: novoIcone,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Ícone da solução ${docId} atualizado: ${novoIcone}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Erro ao atualizar ícone:", error);
        return { success: false, error: error.message };
    }
}

/**
 * OBTER ID DA SOLUÇÃO PELO DOCID
 * @param {string} docId - ID do documento Firestore
 * @returns {string|null} ID da solução (campo 'id')
 */
async function obterIdDaSolucao(docId) {
    try {
        const docRef = db.collection("ResumoSolucao").doc(docId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            return data.id; // Retorna o campo 'id' do documento
        } else {
            console.error("❌ Documento não encontrado:", docId);
            return null;
        }
    } catch (error) {
        console.error("❌ Erro ao obter ID da solução:", error);
        return null;
    }
}

/**
 * EXCLUIR DOCUMENTOS DE UMA COLEÇÃO POR IDSOLUCAO
 * @param {string} colecao - Nome da coleção
 * @param {string} solucaoId - ID da solução (campo 'id')
 * @returns {number} Quantidade de documentos deletados
 */
async function excluirDocumentosPorSolucaoId(colecao, solucaoId) {
    try {
        console.log(`🔍 Buscando documentos em ${colecao} com idSolucao=${solucaoId}`);
        
        const querySnapshot = await db.collection(colecao)
            .where("idSolucao", "==", solucaoId)
            .get();
        
        if (querySnapshot.empty) {
            console.log(`ℹ️ Nenhum documento encontrado em ${colecao}`);
            return 0;
        }
        
        const batch = db.batch();
        let contador = 0;
        
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
            contador++;
        });
        
        await batch.commit();
        console.log(`✅ ${contador} documento(s) excluído(s) de ${colecao}`);
        return contador;
        
    } catch (error) {
        console.error(`❌ Erro ao excluir documentos de ${colecao}:`, error);
        throw error;
    }
}

/**
 * EXCLUIR SOLUÇÃO COMPLETAMENTE
 * @param {string} docId - ID do documento Firestore em ResumoSolucao
 * @returns {Object} Resultado da operação
 */
async function excluirSolucaoCompleta(docId) {
    try {
        console.log(`🔍 Iniciando exclusão completa da solução docId=${docId}`);
        
        // 1. Obter a solução para pegar o campo 'id'
        const solucaoResultado = await obterSolucaoPorDocId(docId);
        if (!solucaoResultado.success) {
            return { 
                success: false, 
                error: `Solução não encontrada: ${solucaoResultado.error}` 
            };
        }
        
        const solucaoData = solucaoResultado.data;
        const solucaoId = solucaoData.id; // Campo 'id' da solução
        const solucaoNome = solucaoData.nome || "Sem nome";
        
        console.log(`📋 Solução encontrada: ${solucaoNome} (id=${solucaoId})`);
        
        // 2. Lista de todas as coleções que podem ter documentos relacionados
        const colecoesParaLimpar = [
            "RespostasFormulario",
            "RecursosSolucao", 
            "PontuacaoSolucao",
            "CanvasSolucao"
        ];
        
        let totalExcluidos = 0;
        
        // 3. Excluir documentos relacionados em todas as coleções
        for (const colecao of colecoesParaLimpar) {
            try {
                const excluidos = await excluirDocumentosPorSolucaoId(colecao, solucaoId);
                totalExcluidos += excluidos;
            } catch (error) {
                console.error(`⚠️ Erro ao limpar ${colecao}:`, error);
                // Continuar com outras coleções mesmo se uma falhar
            }
        }
        
        // 4. Excluir documento principal da solução
        await db.collection("ResumoSolucao").doc(docId).delete();
        console.log(`✅ Documento principal excluído: ${docId}`);
        
        console.log(`🎯 Exclusão completa concluída!`);
        console.log(`   • Solução: ${solucaoNome}`);
        console.log(`   • ID da solução: ${solucaoId}`);
        console.log(`   • Documento Firestore: ${docId}`);
        console.log(`   • Documentos relacionados excluídos: ${totalExcluidos}`);
        
        return { 
            success: true, 
            solucaoId: solucaoId,
            solucaoNome: solucaoNome,
            docId: docId,
            documentosExcluidos: totalExcluidos
        };
        
    } catch (error) {
        console.error("❌ Erro ao excluir solução completa:", error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * VERIFICAR DOCUMENTOS RELACIONADOS (DEBUG)
 * @param {string} solucaoId - ID da solução
 * @returns {Object} Documentos encontrados
 */
async function verificarDocumentosRelacionados(solucaoId) {
    try {
        const resultado = {};
        const colecoes = ["RespostasFormulario", "RecursosSolucao", "PontuacaoSolucao", "CanvasSolucao"];
        
        for (const colecao of colecoes) {
            const querySnapshot = await db.collection(colecao)
                .where("idSolucao", "==", solucaoId)
                .get();
            
            resultado[colecao] = [];
            querySnapshot.forEach(doc => {
                resultado[colecao].push({
                    docId: doc.id,
                    ...doc.data()
                });
            });
        }
        
        return { success: true, data: resultado };
    } catch (error) {
        console.error("❌ Erro ao verificar documentos:", error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// FUNÇÕES PARA DADOS RELACIONADOS
// ============================================================================

/**
 * SALVAR RESPOSTAS DO FORMULÁRIO
 * @param {string} idSolucao - ID da solução
 * @param {Object} respostas - Dados do formulário
 */
async function salvarRespostasFormulario(idSolucao, respostas) {
    try {
        const dados = {
            idSolucao: idSolucao,
            respostas: respostas,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("RespostasFormulario").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * SALVAR RECURSOS
 * @param {string} idSolucao - ID da solução
 * @param {Array} recursos - Lista de recursos
 */
async function salvarRecursos(idSolucao, recursos) {
    try {
        const dados = {
            idSolucao: idSolucao,
            recursos: recursos,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("RecursosSolucao").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * SALVAR PONTUAÇÃO
 * @param {string} idSolucao - ID da solução
 * @param {number} killSwitch - Pontuação kill switch
 * @param {Array} matrizPositiva - Valores matriz positiva
 * @param {Array} matrizNegativa - Valores matriz negativa
 * @param {number} score - Score final
 */
async function salvarPontuacao(idSolucao, killSwitch, matrizPositiva, matrizNegativa, score) {
    try {
        const dados = {
            idSolucao: idSolucao,
            killSwitch: killSwitch,
            matrizPositiva: matrizPositiva,
            matrizNegativa: matrizNegativa,
            score: score,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("PontuacaoSolucao").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * SALVAR CANVAS
 * @param {string} idSolucao - ID da solução
 * @param {Object} canvasData - Dados do canvas
 */
async function salvarCanvas(idSolucao, canvasData) {
    try {
        const dados = {
            idSolucao: idSolucao,
            ...canvasData,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection("CanvasSolucao").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================================
// EXPORTAÇÃO DAS FUNÇÕES
// ============================================================================

window.BancoDeDados = {
    // Funções principais
    adicionarSolucao,
    listarSolucoes,
    obterSolucaoPorDocId,
    atualizarNomeSolucao,
    atualizarIconeSolucao,
    excluirSolucaoCompleta,
    obterIdDaSolucao,
    verificarDocumentosRelacionados,
    documentoExiste,
    
    // Funções de dados relacionados
    salvarRespostasFormulario,
    salvarRecursos,
    salvarPontuacao,
    salvarCanvas,
    
    // Utilitários
    generateId,
    db
};

console.log("🔥 Firebase configurado para SASGP - Versão corrigida");