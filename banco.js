// banco.js - Usando Firebase v9 em modo de compatibilidade

// Configuração do Firebase
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

// GERADOR DE ID ÚNICO
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// FUNÇÕES PARA SOLUÇÕES
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
        return { success: true, id: id, docId: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar solução:", error);
        return { success: false, error: error.message };
    }
}

async function listarSolucoes() {
    try {
        const querySnapshot = await db.collection("ResumoSolucao")
            .orderBy("dataCriacao", "desc")
            .get();
        
        const solucoes = [];
        querySnapshot.forEach((doc) => {
            solucoes.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: solucoes };
    } catch (error) {
        console.error("Erro ao listar soluções:", error);
        return { success: false, error: error.message };
    }
}

async function atualizarSolucao(id, dados) {
    try {
        const docRef = db.collection("ResumoSolucao").doc(id);
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

// FUNÇÕES PARA FORMULÁRIO
async function salvarRespostasFormulario(idSolucao, respostas) {
    try {
        const dados = {
            idSolucao: idSolucao,
            respostas: respostas,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("RespostasFormulario").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar respostas:", error);
        return { success: false, error: error.message };
    }
}

// FUNÇÕES PARA RECURSOS
async function salvarRecursos(idSolucao, recursos) {
    try {
        const dados = {
            idSolucao: idSolucao,
            recursos: recursos,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("RecursosSolucao").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar recursos:", error);
        return { success: false, error: error.message };
    }
}

// FUNÇÕES PARA PONTUAÇÃO
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
        
        const docRef = await db.collection("PontuacaoSolucao").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar pontuação:", error);
        return { success: false, error: error.message };
    }
}

// FUNÇÕES PARA CANVAS
async function salvarCanvas(idSolucao, canvasData) {
    try {
        const dados = {
            idSolucao: idSolucao,
            ...canvasData,
            dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection("CanvasSolucao").add(dados);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar canvas:", error);
        return { success: false, error: error.message };
    }
}

async function buscarCanvas(idSolucao) {
    try {
        const querySnapshot = await db.collection("CanvasSolucao")
            .orderBy("dataRegistro", "desc")
            .get();
        
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            if (data.idSolucao === idSolucao) {
                return { success: true, data: { id: doc.id, ...data } };
            }
        }
        
        return { success: true, data: null };
    } catch (error) {
        console.error("Erro ao buscar canvas:", error);
        return { success: false, error: error.message };
    }
}

// Exportar funções para uso global
window.BancoDeDados = {
    adicionarSolucao,
    listarSolucoes,
    atualizarSolucao,
    salvarRespostasFormulario,
    salvarRecursos,
    salvarPontuacao,
    salvarCanvas,
    buscarCanvas,
    db
};