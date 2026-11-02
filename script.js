// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN (Versión Clásica v8)
// ==========================================
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "eduplanner-9d2ec.firebaseapp.com",
    projectId: "eduplanner-9d2ec",
    storageBucket: "eduplanner-9d2ec.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
let usuarioActual = null;


// ==========================================
// 2. SELECCIÓN DE ELEMENTOS DEL DOM
// ==========================================
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter'); // O el ID que uses para tu contador
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userEmailDisplay = document.getElementById('user-email');
const themeToggleBtn = document.getElementById('theme-toggle');
const btnDeleteAll = document.getElementById('btn-delete-all');


// ==========================================
// 3. MODO OSCURO
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
inicializarModoOscuro();


// ==========================================
// 4. FUNCIONES DE TAREAS Y CONTADOR
// ==========================================
function actualizarContador(cantidad) {
    if (taskCounter) {
        taskCounter.textContent = cantidad;
    }
}

function renderizarTareas(tareas, esDeNube) {
    if (!taskList) return;

    taskList.innerHTML = '';

    if (tareas.length === 0) {
        taskList.innerHTML = '<p class="sin-tareas">No hay tareas registradas.</p>';
        actualizarContador(0);
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

    actualizarContador(tareas.length);
}

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
// 5. CONEXIÓN CON FIRESTORE (NUBE)
// ==========================================
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

function cargarTareasLocalStorage() {
    let tareasLocales = JSON.parse(localStorage.getItem('eduplanner_tareas_locales')) || [];
    renderizarTareas(tareasLocales, false);
}


// ==========================================
// 6. EVENTO SUBMIT (AGREGAR TAREAS)
// ==========================================
if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const textoTarea = taskInput.value.trim();

        if (textoTarea === '') return;

        if (usuarioActual) {
            // Guardar en la nube (Firestore)
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
            // Guardar localmente (LocalStorage)
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


// ==========================================
// 7. BOTÓN ELIMINAR TODO
// ==========================================
if (btnDeleteAll) {
    btnDeleteAll.addEventListener('click', () => {
        if (usuarioActual) {
            // Si está en la nube, se pueden borrar las de Firestore (opcional)
            db.collection('tasks').where('userId', '==', usuarioActual.uid).get().then((snapshot) => {
                snapshot.forEach((doc) => {
                    doc.ref.delete();
                });
            });
        } else {
            // Si es local, limpia el localStorage
            localStorage.removeItem('eduplanner_tareas_locales');
            cargarTareasLocalStorage();
        }
    });
}


// ==========================================
// 8. CONTROL DE AUTENTICACIÓN Y SESIÓN
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-block';

        cargarTareasFirestore(user.uid);
    } else {
        usuarioActual = null;
        if (userEmailDisplay) userEmailDisplay.textContent = '';
        if (btnLogin) btnLogin.style.display = 'inline-block';
        if (btnLogout) btnLogout.style.display = 'none';

        cargarTareasLocalStorage();
    }
});