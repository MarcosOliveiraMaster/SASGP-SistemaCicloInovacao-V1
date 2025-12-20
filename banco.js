// Banco de dados adaptado para GitHub Pages

// Função para gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Verifica se Firebase está inicializado
function verificarFirebase() {
    if (!window.db) {
        console.error("Firebase não está inicializado!");
        return false;
    }
    return true;
}

// --- FUNÇÕES DE PERSISTÊNCIA ---

async function adicionarSolucao(dados) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const id = generateId();
        const dadosCompletos = {
            id: id,
            ...dados,
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await window.db.collection("ResumoSolucao").add(dadosCompletos);
        return { success: true, id: id, docId: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar solução:", error);
        return { success: false, error: error.message };
    }
}

async function listarSolucoes() {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const querySnapshot = await window.db.collection("ResumoSolucao")
            .orderBy("dataCriacao", "desc")
            .get();
        
        const solucoes = [];
        querySnapshot.forEach((doc) => {
            solucoes.push({ 
                id: doc.id, 
                ...doc.data(),
                // Garante que a data seja um objeto Date válido
                dataCriacao: doc.data().dataCriacao ? doc.data().dataCriacao.toDate() : new Date()
            });
        });
        
        return { success: true, data: solucoes };
    } catch (error) {
        console.error("Erro ao listar soluções:", error);
        return { success: false, error: error.message };
    }
}

async function atualizarSolucao(id, dados) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const docRef = window.db.collection("ResumoSolucao").doc(id);
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

async function salvarRespostasFormulario(idSolucao, respostas) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const dados = {
            idSolucao: idSolucao,
            respostas: respostas,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await window.db.collection("RespostasFormulario").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar respostas:", error);
        return { success: false, error: error.message };
    }
}

async function salvarRecursos(idSolucao, recursos) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const dados = {
            idSolucao: idSolucao,
            recursos: recursos,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await window.db.collection("RecursosSolucao").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar recursos:", error);
        return { success: false, error: error.message };
    }
}

async function salvarPontuacao(idSolucao, killSwitch, matrizPositiva, matrizNegativa, score) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const dados = {
            idSolucao: idSolucao,
            killSwitch: killSwitch,
            matrizPositiva: matrizPositiva,
            matrizNegativa: matrizNegativa,
            score: score,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await window.db.collection("PontuacaoSolucao").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar pontuação:", error);
        return { success: false, error: error.message };
    }
}

async function salvarCanvas(idSolucao, canvasData) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const dados = {
            idSolucao: idSolucao,
            ...canvasData,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await window.db.collection("CanvasSolucao").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar canvas:", error);
        return { success: false, error: error.message };
    }
}

async function buscarCanvas(idSolucao) {
    if (!verificarFirebase()) {
        return { success: false, error: "Firebase não inicializado" };
    }
    
    try {
        const querySnapshot = await window.db.collection("CanvasSolucao")
            .where("idSolucao", "==", idSolucao)
            .orderBy("dataRegistro", "desc")
            .limit(1)
            .get();
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { success: true, data: { id: doc.id, ...doc.data() } };
        }
        
        return { success: true, data: null };
    } catch (error) {
        console.error("Erro ao buscar canvas:", error);
        return { success: false, error: error.message };
    }
}

// Disponibiliza funções globalmente para acesso em outros arquivos
window.banco = {
    adicionarSolucao,
    listarSolucoes,
    atualizarSolucao,
    salvarRespostasFormulario,
    salvarRecursos,
    salvarPontuacao,
    salvarCanvas,
    buscarCanvas,
    generateId
};