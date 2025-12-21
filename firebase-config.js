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

// Inicialização do Firebase
let firebaseApp;
let db;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore(firebaseApp);
    console.log("Firebase inicializado com sucesso!");
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
}

// Disponibiliza globalmente (para compatibilidade)
window.firebaseApp = firebaseApp;
window.db = db;