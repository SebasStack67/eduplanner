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