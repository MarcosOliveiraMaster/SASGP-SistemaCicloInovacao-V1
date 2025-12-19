// Importação direta via CDN do Google para funcionamento sem necessidade de Node.js/Build tools
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do Firebase mantida conforme seu projeto
const firebaseConfig = {
    apiKey: "AIzaSyAD9Ffs9CQ4jWIl8P3mOKEYq8V5jzwMfXQ",
    authDomain: "sasgp-sistemainovacao-v1.firebaseapp.com",
    projectId: "sasgp-sistemainovacao-v1",
    storageBucket: "sasgp-sistemainovacao-v1.firebasestorage.app",
    messagingSenderId: "593160846088",
    appId: "1:593160846088:web:396c3dba0c473d68d7cabd",
    measurementId: "G-5NLX08FH2R"
};

// Inicialização do Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para gerar ID único localmente
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --- FUNÇÕES DE PERSISTÊNCIA ---

export async function adicionarSolucao(dados) {
    try {
        const id = generateId(); //
        const dadosCompletos = {
            id: id,
            ...dados,
            dataCriacao: serverTimestamp(),
            dataAtualizacao: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, "ResumoSolucao"), dadosCompletos); //
        return { success: true, id: id, docId: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar solução:", error);
        return { success: false, error: error.message };
    }
}

export async function listarSolucoes() {
    try {
        const q = query(collection(db, "ResumoSolucao"), orderBy("dataCriacao", "desc")); //
        const querySnapshot = await getDocs(q);
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

export async function atualizarSolucao(id, dados) {
    try {
        const docRef = doc(db, "ResumoSolucao", id); //
        await updateDoc(docRef, {
            ...dados,
            dataAtualizacao: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar solução:", error);
        return { success: false, error: error.message };
    }
}

export async function salvarRespostasFormulario(idSolucao, respostas) {
    try {
        const dados = {
            idSolucao: idSolucao,
            respostas: respostas,
            dataRegistro: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, "RespostasFormulario"), dados); //
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar respostas:", error);
        return { success: false, error: error.message };
    }
}

export async function salvarRecursos(idSolucao, recursos) {
    try {
        const dados = {
            idSolucao: idSolucao,
            recursos: recursos,
            dataRegistro: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, "RecursosSolucao"), dados); //
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar recursos:", error);
        return { success: false, error: error.message };
    }
}

export async function salvarPontuacao(idSolucao, killSwitch, matrizPositiva, matrizNegativa, score) {
    try {
        const dados = {
            idSolucao: idSolucao,
            killSwitch: killSwitch,
            matrizPositiva: matrizPositiva,
            matrizNegativa: matrizNegativa,
            score: score,
            dataRegistro: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, "PontuacaoSolucao"), dados); //
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar pontuação:", error);
        return { success: false, error: error.message };
    }
}

export async function salvarCanvas(idSolucao, canvasData) {
    try {
        const dados = {
            idSolucao: idSolucao,
            ...canvasData,
            dataRegistro: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, "CanvasSolucao"), dados); //
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao salvar canvas:", error);
        return { success: false, error: error.message };
    }
}

export async function buscarCanvas(idSolucao) {
    try {
        const q = query(collection(db, "CanvasSolucao"), orderBy("dataRegistro", "desc")); //
        const querySnapshot = await getDocs(q);
        
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

// Exportação das instâncias e do objeto padrão
export { db };
export default {
    adicionarSolucao,
    listarSolucoes,
    atualizarSolucao,
    salvarRespostasFormulario,
    salvarRecursos,
    salvarPontuacao,
    salvarCanvas,
    buscarCanvas
};