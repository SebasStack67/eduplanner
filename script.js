// ==========================================
// 1. CONFIGURACIÓN Y INICIALIZACIÓN DE FIREBASE
// ==========================================
// Reemplaza los datos dentro de firebaseConfig si difieren de las llaves de tu proyecto
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "eduplanner-9d2ec.firebaseapp.com",
    projectId: "eduplanner-9d2ec",
    storageBucket: "eduplanner-9d2ec.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase si aún no ha sido inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

let usuarioActual = null;

// ==========================================
// 2. REFERENCIAS AL DOM (HTML)
// ==========================================
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userEmailDisplay = document.getElementById('user-email');
const themeToggleBtn = document.getElementById('theme-toggle'); // Botón de modo oscuro

// ==========================================
// 3. MODO OSCURO (PERSISTENTE EN LOCALSTORAGE)
// ==========================================
function inicializarModoOscuro() {
    const modoOscuroGuardado = localStorage.getItem('eduplanner_theme') === 'dark';
    if (modoOscuroGuardado) {
        document.body.classList.add('dark-mode');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const esOscuro = document.body.classList.contains('dark-mode');
            localStorage.setItem('eduplanner_theme', esOscuro ? 'dark' : 'light');
        });
    }
}

// Inicializar el tema de la aplicación al cargar
inicializarModoOscuro();

// ==========================================
// 4. AUTENTICACIÓN Y ESTADO DE SESIÓN
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // Sesión activa: Usar la nube (Firestore)
        usuarioActual = user;
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-block';

        console.log("Sesión activa en Firestore con:", user.email);
        cargarTareasFirestore(user.uid);
    } else {
        // Sin sesión: Usar almacenamiento local (localStorage)
        usuarioActual = null;
        if (userEmailDisplay) userEmailDisplay.textContent = '';
        if (btnLogin) btnLogin.style.display = 'inline-block';
        if (btnLogout) btnLogout.style.display = 'none';

        console.log("Modo local activo (sin inicio de sesión)");
        cargarTareasLocalStorage();
    }
});

// ==========================================
// 5. GESTIÓN DE TAREAS (LOCAL VS NUBE)
// ==========================================

// Guardar nueva tarea
if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const textoTarea = taskInput.value.trim();

        if (textoTarea === '') return;

        if (usuarioActual) {
            // Guardar en Firestore (Nube)
            db.collection('tasks').add({
                nombre: textoTarea,
                userId: usuarioActual.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                taskInput.value = '';
            }).catch((error) => {
                console.error("Error al guardar en Firestore:", error);
            });
        } else {
            // Guardar en LocalStorage (Computador)
            let tareasLocales = JSON.parse(localStorage.getItem('eduplanner_tareas_locales')) || [];
            const nuevaTarea = {
                id: Date.now().toString(),
                nombre: textoTarea
            };
            tareasLocales.push(nuevaTarea);
            localStorage.setItem('eduplanner_tareas_locales', JSON.stringify(tareasLocales));

            taskInput.value = '';
            cargarTareasLocalStorage();
        }
    });
}

// Cargar tareas desde Firestore
function cargarTareasFirestore(uid) {
    db.collection('tasks')
        .where('userId', '==', uid)
        .onSnapshot((snapshot) => {
            let tareas = [];
            snapshot.forEach((doc) => {
                tareas.push({ id: doc.id, ...doc.data() });
            });
            renderizarTareas(tareas, true);
        });
}

// Cargar tareas desde LocalStorage
function cargarTareasLocalStorage() {
    let tareasLocales = JSON.parse(localStorage.getItem('eduplanner_tareas_locales')) || [];
    renderizarTareas(tareasLocales, false);
}

// Eliminar tarea (detecta origen local o nube)
function eliminarTarea(id, esDeNube) {
    if (esDeNube) {
        db.collection('tasks').doc(id).delete();
    } else {
        let tareasLocales = JSON.parse(localStorage.getItem('eduplanner_tareas_locales')) || [];
        tareasLocales = tareasLocales.filter(tarea => tarea.id !== id);
        localStorage.setItem('eduplanner_tareas_locales', JSON.stringify(tareasLocales));
        cargarTareasLocalStorage();
    }
}

// ==========================================
// 6. DIBUJAR TAREAS EN EL HTML
// ==========================================
function renderizarTareas(tareas, esDeNube) {
    if (!taskList) return;

    taskList.innerHTML = '';

    if (tareas.length === 0) {
        taskList.innerHTML = '<p class="sin-tareas">No hay tareas registradas.</p>';
        return;
    }

    tareas.forEach((tarea) => {
        const li = document.createElement('li');
        li.className = 'tarea-item';
        li.innerHTML = `
            <span>${tarea.nombre}</span>
            <button class="btn-eliminar" onclick="eliminarTarea('${tarea.id}', ${esDeNube})">Eliminar</button>
        `;
        taskList.appendChild(li);
    });
}