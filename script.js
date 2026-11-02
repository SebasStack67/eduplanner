// 1. IMPORTACIONES DE FIREBASE (Obligatoriamente arriba del todo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc,
  doc,
  query, 
  where, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// 2. CONFIGURACIÓN E INICIALIZACIÓN
const firebaseConfig = {
  apiKey: "AIzaSyBiYp-VfXK0t-_bROL2QK2fZHbFe5dSvyU",
  authDomain: "eduplanner-9d2ec.firebaseapp.com",
  projectId: "eduplanner-9d2ec",
  storageBucket: "eduplanner-9d2ec.firebasestorage.app",
  messagingSenderId: "145593910568",
  appId: "1:145593910568:web:fc5b9c83d12a480c9b3c1d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("EduPlanner: JavaScript y Firebase conectados correctamente.");

// Variable global para identificar al usuario actual
let usuarioActualUid = null;

// Selección de elementos del DOM
const formulario = document.getElementById("taskForm");
const inputTarea = document.getElementById("tareaInput");
const inputFecha = document.getElementById("fechaInput");
const listaTareas = document.getElementById("listaTareas");
const mensajeInicial = document.getElementById("mensajeInicial");
const contadorTareas = document.getElementById("contadorTareas");
const btnEliminarTodo = document.getElementById("btnEliminarTodo");
const btnModoOscuro = document.getElementById("btnModoOscuro");

// Elementos de Autenticación en la interfaz
const openAuthBtn = document.getElementById("open-auth-btn");
const authModal = document.getElementById("auth-modal");
const closeAuthBtn = document.getElementById("close-auth-btn");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const userInfo = document.getElementById("user-info");
const userEmailSpan = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// --- 1. MODO OSCURO ---
if (localStorage.getItem("modoOscuro") === "activado") {
    document.body.classList.add("dark-mode");
    if (btnModoOscuro) btnModoOscuro.textContent = "☀️ Modo Claro";
}

if (btnModoOscuro) {
    btnModoOscuro.addEventListener("click", function() {
        document.body.classList.toggle("dark-mode");
        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("modoOscuro", "activado");
            btnModoOscuro.textContent = "☀️ Modo Claro";
        } else {
            localStorage.setItem("modoOscuro", "desactivado");
            btnModoOscuro.textContent = "🌙 Modo Oscuro";
        }
    });
}

// --- 2. FUNCIONES DE CONTADOR Y RENDERIZADO EN PANTALLA ---
function actualizarContador(totalTareas) {
    if (contadorTareas) {
        contadorTareas.textContent = totalTareas === 1 ? "1 tarea" : `${totalTareas} tareas`;
    }

    if (totalTareas === 0) {
        if (mensajeInicial) mensajeInicial.style.display = "block";
        if (btnEliminarTodo) btnEliminarTodo.style.display = "none";
    } else {
        if (mensajeInicial) mensajeInicial.style.display = "none";
        if (btnEliminarTodo) btnEliminarTodo.style.display = "block";
    }
}

// Función auxiliar para construir el <li> en el DOM conectado a Firestore
function renderizarTareasEnPantalla(tareas) {
    // Limpiamos la lista actual (excepto el mensaje inicial)
    const elementosLi = listaTareas.querySelectorAll("li:not(#mensajeInicial)");
    elementosLi.forEach(li => li.remove());

    tareas.forEach(item => {
        const nuevaLi = document.createElement("li");
        
        const infoDiv = document.createElement("div");
        
        const textoSpan = document.createElement("span");
        textoSpan.className = "texto-tarea";
        textoSpan.textContent = item.title;
        infoDiv.appendChild(textoSpan);

        if (item.fecha) {
            const fechaSpan = document.createElement("span");
            fechaSpan.className = "fecha-tarea";
            fechaSpan.textContent = item.fecha.startsWith("📅") ? item.fecha : `📅 ${item.fecha}`;
            infoDiv.appendChild(fechaSpan);
        }

        // Botón de completar / eliminar de Firestore
        const botonCompletar = document.createElement("button");
        botonCompletar.textContent = "✓ Completar";
        botonCompletar.className = "btn-completar";

        botonCompletar.addEventListener("click", async function() {
            try {
                await deleteDoc(doc(db, "tasks", item.id));
            } catch (error) {
                console.error("Error al eliminar la tarea de la nube:", error);
            }
        });

        nuevaLi.appendChild(infoDiv);
        nuevaLi.appendChild(botonCompletar);
        listaTareas.appendChild(nuevaLi);
    });

    actualizarContador(tareas.length);
}

// --- 3. CONEXIÓN CON FIREBASE FIRESTORE (SINCRONIZACIÓN) ---
function escucharTareasFirestore(userId) {
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    
    onSnapshot(q, (snapshot) => {
        const tareas = [];
        snapshot.forEach((docSnap) => {
            tareas.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderizarTareasEnPantalla(tareas);
    });
}

async function agregarTareaFirestore(titulo, fecha) {
    if (!usuarioActualUid) {
        alert("Debes iniciar sesión para guardar tareas en la nube.");
        if (authModal) authModal.style.display = "flex";
        return;
    }

    try {
        await addDoc(collection(db, "tasks"), {
            title: titulo,
            fecha: fecha || "",
            userId: usuarioActualUid,
            completed: false,
            createdAt: new Date()
        });
    } catch (error) {
        console.error("Error al guardar la tarea:", error);
    }
}

// --- 4. EVENTO SUBMIT (AGREGAR TAREAS) ---
if (formulario) {
    formulario.addEventListener("submit", function(evento) {
        evento.preventDefault();

        const textoIngresado = inputTarea.value.trim();
        const fechaIngresada = inputFecha.value;

        if (textoIngresado === "") {
            alert("¡Atención! Debes escribir el nombre de una tarea.");
            inputTarea.focus();
            return;
        }

        // Separación por comas
        const tareasArray = textoIngresado.split(",");

        tareasArray.forEach(function(tareaTexto) {
            const textoLimpio = tareaTexto.trim();
            if (textoLimpio !== "") {
                agregarTareaFirestore(textoLimpio, fechaIngresada);
            }
        });

        // Limpiar campos del formulario
        inputTarea.value = "";
        inputFecha.value = "";
        inputTarea.focus();
    });
}

// --- 5. CONTROL DE AUTENTICACIÓN (LOGIN / REGISTRO) ---
if (openAuthBtn && authModal) {
    openAuthBtn.addEventListener("click", () => { authModal.style.display = "flex"; });
}
if (closeAuthBtn && authModal) {
    closeAuthBtn.addEventListener("click", () => { authModal.style.display = "none"; });
}

if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
        const email = authEmail.value;
        const password = authPassword.value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("¡Cuenta creada con éxito!");
            authModal.style.display = "none";
        } catch (error) {
            alert("Error al registrarse: " + error.message);
        }
    });
}

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const email = authEmail.value;
        const password = authPassword.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("¡Sesión iniciada correctamente!");
            authModal.style.display = "none";
        } catch (error) {
            alert("Error al iniciar sesión: " + error.message);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        alert("Sesión cerrada.");
    });
}

// Observador del estado de sesión en tiempo real
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioActualUid = user.uid;
        if (openAuthBtn) openAuthBtn.style.display = "none";
        if (userInfo) userInfo.style.display = "flex";
        if (userEmailSpan) userEmailSpan.textContent = user.email;

        // Activa la sincronización en tiempo real para las tareas de este usuario
        escucharTareasFirestore(user.uid);
    } else {
        usuarioActualUid = null;
        if (openAuthBtn) openAuthBtn.style.display = "block";
        if (userInfo) userInfo.style.display = "none";
        renderizarTareasEnPantalla([]);
    }
});