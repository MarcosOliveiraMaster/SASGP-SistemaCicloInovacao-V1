// banco.js - Camada de Dados SASGP (Firebase Compat v9)

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

// Inicializar Firebase (Verificação de segurança para não duplicar instância)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ============================================================================
// 2. FUNÇÕES AUXILIARES
// ============================================================================

// Gerador de ID único interno (para vincular coleções)
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================================================
// 3. CRUD PRINCIPAL (RESUMO SOLUÇÃO)
// ============================================================================

// Cria uma nova solução
async function adicionarSolucao(dados) {
    try {
        const idInterno = generateId(); // Gera o ID de vínculo
        const dadosCompletos = {
            id: idInterno, // Salva o ID interno dentro do documento
            ...dados,
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Adiciona à coleção principal
        const docRef = await db.collection("ResumoSolucao").add(dadosCompletos);
        
        // Retorna sucesso com ambos os IDs
        return { success: true, id: idInterno, docId: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar solução:", error);
        return { success: false, error: error.message };
    }
}

// Lista todas as soluções (Usado na Home)
async function listarSolucoes() {
    try {
        const querySnapshot = await db.collection("ResumoSolucao")
            .orderBy("dataAtualizacao", "desc") // Ordena pela última edição
            .get();
            
        const solucoes = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            solucoes.push({
                docId: doc.id, // ID do Firestore (essencial para Update/Delete)
                ...data        // Espalha os dados (inclui o 'id' interno)
            });
        });
        return { success: true, data: solucoes };
    } catch (error) {
        console.error("Erro ao listar soluções:", error);
        return { success: false, error: error.message };
    }
}

// Obtém uma única solução para o Modo de Edição
async function obterSolucaoPorDocId(docId) {
    try {
        const doc = await db.collection("ResumoSolucao").doc(docId).get();
        if (doc.exists) {
            return { success: true, data: { docId: doc.id, ...doc.data() } };
        } else {
            return { success: false, error: "Solução não encontrada" };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Atualiza dados (Renomear, mudar ícone, salvar formulário)
async function atualizarSolucao(docId, dados) {
    try {
        const docRef = db.collection("ResumoSolucao").doc(docId);
        await docRef.update({
            ...dados,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar solução:", error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// 4. CRUD DE DADOS RELACIONADOS (Recursos, Pontuação, Canvas)
// ============================================================================

// --- RECURSOS ---
async function salvarRecursos(idSolucao, recursos) {
    try {
        // Primeiro, removemos os antigos para evitar duplicação no modo edição
        await deletarColecaoPorIdSolucao("RecursosSolucao", idSolucao);

        // Salva o novo array como um único documento ou vários (aqui salvando como objeto contendo array)
        // OBS: Para facilitar a leitura, salvamos um documento contendo a lista
        const dados = { 
            idSolucao, 
            listaRecursos: recursos, 
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp() 
        };
        await db.collection("RecursosSolucao").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function listarRecursos(idSolucao) {
    try {
        // Pega o registro mais recente
        const snapshot = await db.collection("RecursosSolucao")
            .where("idSolucao", "==", idSolucao)
            .orderBy("dataRegistro", "desc")
            .limit(1)
            .get();
            
        if (!snapshot.empty) {
            const doc = snapshot.docs[0].data();
            // Retorna a lista salva (ou array vazio se não existir)
            // Se o formato antigo salvava itens individuais, precisaria adaptar, 
            // mas o script.js novo envia um array completo.
            return { success: true, data: doc.listaRecursos || [] }; 
        }
        return { success: true, data: [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// --- PONTUAÇÃO ---
async function salvarPontuacao(idSolucao, killSwitch, matrizPositiva, matrizNegativa, score) {
    try {
        await deletarColecaoPorIdSolucao("PontuacaoSolucao", idSolucao);
        
        const dados = { 
            idSolucao, 
            killSwitch, 
            matrizPositiva, 
            matrizNegativa, 
            score, 
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp() 
        };
        await db.collection("PontuacaoSolucao").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function obterPontuacao(idSolucao) {
    try {
        const snapshot = await db.collection("PontuacaoSolucao")
            .where("idSolucao", "==", idSolucao)
            .orderBy("dataRegistro", "desc")
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return { success: true, data: snapshot.docs[0].data() };
        }
        return { success: false, error: "Sem pontuação" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// --- CANVAS ---
async function salvarCanvas(idSolucao, canvasData) {
    try {
        await deletarColecaoPorIdSolucao("CanvasSolucao", idSolucao);
        
        const dados = { 
            idSolucao, 
            ...canvasData, 
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp() 
        };
        await db.collection("CanvasSolucao").add(dados);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function obterCanvas(idSolucao) {
    try {
        const snapshot = await db.collection("CanvasSolucao")
            .where("idSolucao", "==", idSolucao)
            .orderBy("dataRegistro", "desc")
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return { success: true, data: snapshot.docs[0].data() };
        }
        return { success: false, error: "Sem canvas" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function salvarRespostasFormulario(idSolucao, respostas) {
    // Mantendo compatibilidade se necessário, mas o ResumoSolucao já guarda o básico
    try {
        // Opcional: Salvar histórico de alterações do form
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================================
// 5. EXCLUSÃO COMPLETA (CASCATA)
// ============================================================================

// Função auxiliar para deletar documentos de uma query
async function deletarColecaoPorIdSolucao(nomeColecao, idInterno) {
    const snapshot = await db.collection(nomeColecao).where("idSolucao", "==", idInterno).get();
    
    // Firestore não deleta em massa nativamente, precisamos usar Batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
}

async function excluirSolucaoCompleta(docId, idInterno) {
    try {
        console.log(`Iniciando exclusão completa. DocId: ${docId}, IdInterno: ${idInterno}`);

        // 1. Excluir dados relacionados (Filhos)
        // Mesmo que o idInterno venha null (erro de legados), tentamos prosseguir
        if (idInterno) {
            await deletarColecaoPorIdSolucao("RecursosSolucao", idInterno);
            await deletarColecaoPorIdSolucao("PontuacaoSolucao", idInterno);
            await deletarColecaoPorIdSolucao("CanvasSolucao", idInterno);
            await deletarColecaoPorIdSolucao("RespostasFormulario", idInterno); // Se houver
        }

        // 2. Excluir o documento principal (Pai)
        await db.collection("ResumoSolucao").doc(docId).delete();

        return { success: true };
    } catch (error) {
        console.error("Erro na exclusão completa:", error);
        return { success: false, error: error.message };
    }
}

// Função de exclusão simples (fallback)
async function excluirSolucao(docId) {
    try {
        await db.collection("ResumoSolucao").doc(docId).delete();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================================================
// 6. EXPORTAÇÃO GLOBAL
// ============================================================================
window.BancoDeDados = {
    db,
    adicionarSolucao,
    listarSolucoes,
    obterSolucaoPorDocId,
    atualizarSolucao,
    salvarRecursos,
    listarRecursos,
    salvarPontuacao,
    obterPontuacao,
    salvarCanvas,
    obterCanvas,
    salvarRespostasFormulario,
    excluirSolucao,
    excluirSolucaoCompleta
};