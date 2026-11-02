// 1. Las importaciones de Firebase van obligatoriamente arriba del todo
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// 2. La configuración y la inicialización
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

// 3. A partir de aquí hacia abajo puedes colocar el resto de tu código 
// (como tus funciones de tareas, el modo oscuro, etc.)

console.log("EduPlanner: JavaScript conectado correctamente.");

// Selección de elementos del DOM
const formulario = document.getElementById("taskForm");
const inputTarea = document.getElementById("tareaInput");
const inputFecha = document.getElementById("fechaInput");
const listaTareas = document.getElementById("listaTareas");
const mensajeInicial = document.getElementById("mensajeInicial");
const contadorTareas = document.getElementById("contadorTareas");
const btnEliminarTodo = document.getElementById("btnEliminarTodo");
const btnModoOscuro = document.getElementById("btnModoOscuro");

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

// --- 2. FUNCIONES DE CONTADOR Y ALMACENAMIENTO ---

// Actualizar el número de tareas en pantalla y visibilidad de controles
function actualizarContador() {
    const tareas = listaTareas.querySelectorAll("li:not(#mensajeInicial)");
    const total = tareas.length;
    
    if (contadorTareas) {
        contadorTareas.textContent = total === 1 ? "1 tarea" : `${total} tareas`;
    }

    if (total === 0) {
        if (mensajeInicial) mensajeInicial.style.display = "block";
        if (btnEliminarTodo) btnEliminarTodo.style.display = "none";
    } else {
        if (mensajeInicial) mensajeInicial.style.display = "none";
        if (btnEliminarTodo) btnEliminarTodo.style.display = "block";
    }
}

// Guardar tareas en localStorage (Guarda objeto con texto y fecha)
function guardarTareasEnLocalStorage() {
    const lis = listaTareas.querySelectorAll("li:not(#mensajeInicial)");
    const tareas = [];
    
    lis.forEach(li => {
        const texto = li.querySelector(".texto-tarea").textContent;
        const fecha = li.querySelector(".fecha-tarea") ? li.querySelector(".fecha-tarea").textContent : "";
        tareas.push({ texto, fecha });
    });
    
    localStorage.setItem("misTareasEduPlanner", JSON.stringify(tareas));
    actualizarContador();
}

// Cargar tareas al abrir la página
function cargarTareas() {
    const tareasGuardadas = JSON.parse(localStorage.getItem("misTareasEduPlanner")) || [];
    
    tareasGuardadas.forEach(item => {
        crearElementoEnDOM(item.texto, item.fecha);
    });
    
    actualizarContador();
}

// Función auxiliar para construir el <li> en el DOM
function crearElementoEnDOM(texto, fecha) {
    if (mensajeInicial) mensajeInicial.style.display = "none";

    const nuevaLi = document.createElement("li");
    
    // Contenedor de información (Texto + Fecha)
    const infoDiv = document.createElement("div");
    
    const textoSpan = document.createElement("span");
    textoSpan.className = "texto-tarea";
    textoSpan.textContent = texto;
    infoDiv.appendChild(textoSpan);

    if (fecha) {
        const fechaSpan = document.createElement("span");
        fechaSpan.className = "fecha-tarea";
        fechaSpan.textContent = fecha.startsWith("📅") ? fecha : `📅 ${fecha}`;
        infoDiv.appendChild(fechaSpan);
    }

    // Botón de completar
    const botonCompletar = document.createElement("button");
    botonCompletar.textContent = "✓ Completar";
    botonCompletar.className = "btn-completar";

    botonCompletar.addEventListener("click", function() {
        nuevaLi.remove();
        guardarTareasEnLocalStorage();
    });

    nuevaLi.appendChild(infoDiv);
    nuevaLi.appendChild(botonCompletar);
    listaTareas.appendChild(nuevaLi);
}

// Cargar tareas iniciales
cargarTareas();

// --- 3. EVENTO SUBMIT (AGREGAR TAREAS) ---
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
            crearElementoEnDOM(textoLimpio, fechaIngresada);
        }
    });

    guardarTareasEnLocalStorage();

    // Limpiar campos del formulario
    inputTarea.value = "";
    inputFecha.value = "";
    inputTarea.focus();
});

// --- 4. BOTÓN ELIMINAR TODO ---
if (btnEliminarTodo) {
    btnEliminarTodo.addEventListener("click", function() {
        if (confirm("¿Estás seguro de que deseas borrar TODAS las tareas pendientes?")) {
            const tareas = listaTareas.querySelectorAll("li:not(#mensajeInicial)");
            tareas.forEach(li => li.remove());
            guardarTareasEnLocalStorage();
        }
    });
}

// --- CONEXIÓN DE BOTONES CON ADDEXTENLISTENER ---
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Botón de Modo Oscuro (Cambia "btn-modo-oscuro" por el ID de tu botón en el HTML)
  const btnModoOscuro = document.getElementById("btn-modo-oscuro");
  if (btnModoOscuro) {
    btnModoOscuro.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }

  // 2. Botón de Agregar Tareas (Cambia "btn-agregar-tarea" por el ID de tu botón)
  const btnAgregarTarea = document.getElementById("btn-agregar-tarea");
  if (btnAgregarTarea) {
    btnAgregarTarea.addEventListener("click", () => {
      // Llama aquí a tu función original que agrega tareas o pon la lógica directamente
      console.log("Botón de tarea presionado");
    });
  }

});

