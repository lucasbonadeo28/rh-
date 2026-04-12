const API = '/api'; 
        
let pTotales = []; 
let pFiltrados = []; 
let pagina = 1; 
const pPorPagina = 10;
        
let vTotales = []; 
let vPagina = 1; 
const vPorPagina = 10;
let ventasDataGlobal = []; 
let reloadAfterAlert = false; 

let accionConfirmada = null;

// LÓGICA CATEGORÍAS
let categoriasGlobal = [];
let cPagina = 1;
const cPorPagina = 10;

// ==========================================
// VARIABLE MÁGICA PARA MODO EDICIÓN
// ==========================================
let idProductoEditando = null;

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogueado') === 'true') {
        const loginWrapper = document.getElementById('login-wrapper');
        const panelDashboard = document.getElementById('panel-dashboard');
        if(loginWrapper) loginWrapper.style.display = 'none';
        if(panelDashboard) panelDashboard.style.display = 'block';
    }
});

function togglePassword() {
    const passInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('toggle-eye');
    
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

const formLogin = document.getElementById('form-login');
if(formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');
        const btn = document.getElementById('btn-submit-login');

        btn.innerText = 'Verificando...';
        btn.disabled = true;
        errorMsg.style.display = 'none';

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();

            if (res.ok && data.success) { 
                sessionStorage.setItem('adminLogueado', 'true');
                document.getElementById('login-wrapper').style.display = 'none';
                document.getElementById('panel-dashboard').style.display = 'block';
                cargarTodo();
            } else {
                errorMsg.innerText = data.message || 'Credenciales incorrectas';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            errorMsg.innerText = 'Error de conexión. ¿Está prendido el servidor?';
            errorMsg.style.display = 'block';
        } finally {
            btn.innerText = 'Ingresar';
            btn.disabled = false;
        }
    });
}

function cerrarSesionLocal() {
    sessionStorage.removeItem('adminLogueado');
    const loginWrapper = document.getElementById('login-wrapper');
    const panelDashboard = document.getElementById('panel-dashboard');
    if(loginWrapper) loginWrapper.style.display = 'flex';
    if(panelDashboard) panelDashboard.style.display = 'none';
    
    const passInput = document.getElementById('login-password');
    if(passInput) passInput.value = '';
}

window.onload = () => { 
    if (sessionStorage.getItem('adminLogueado') === 'true') {
        cargarTodo(); 
    }
    
    const tabGuardada = sessionStorage.getItem('adminTabActiva') || 'tab-pedidos';
    document.querySelectorAll('.tab-link').forEach(l => {
        if(l.getAttribute('onclick').includes(tabGuardada)) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
};

function showCustomAlert(msg, type = 'error', reload = false) {
    reloadAfterAlert = reload;
    const modal = document.getElementById('custom-alert-modal');
    const icon = document.getElementById('custom-alert-icon');
    
    document.getElementById('custom-alert-text').innerText = msg;
    
    if(type === 'success') {
        icon.innerHTML = '<i class="fas fa-check-circle" style="color:#27ae60;"></i>';
    } else {
        icon.innerHTML = '<i class="fas fa-times-circle" style="color:#e74c3c;"></i>';
    }
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10); 
}

function cerrarCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        if(reloadAfterAlert) location.reload(); 
    }, 200);
}

function showCustomConfirm(msg, callback, btnText = "Sí") {
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('custom-confirm-text').innerText = msg;
    document.getElementById('btn-confirmar-accion').innerText = btnText;
    accionConfirmada = callback;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function cerrarCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        accionConfirmada = null;
    }, 200);
}

document.getElementById('btn-confirmar-accion')?.addEventListener('click', () => {
    if (accionConfirmada) accionConfirmada();
    cerrarCustomConfirm();
});

function mostrarNombreArchivo(input, labelId, textoDefault) {
    const label = document.getElementById(labelId);
    const span = label.querySelector('span');
    const icon = label.querySelector('i');
    
    if (input.files && input.files.length > 0) {
        span.innerText = input.files.length === 1 ? input.files[0].name : `${input.files.length} fotos elegidas`; 
        label.classList.add('selected'); 
        icon.className = 'fas fa-check-circle'; 
    } else {
        // En modo edición, mostramos el mensaje correcto si no hay archivo
        span.innerText = idProductoEditando ? 'Reemplazar Fotos (Opcional)' : textoDefault; 
        label.classList.remove('selected'); 
        icon.className = idProductoEditando ? 'fas fa-images' : 'fas fa-camera';
    }
    label.classList.remove('input-error');
}

async function fetchSeguro(url, opciones = {}) {
    const res = await fetch(url, opciones);
    return res;
}

function verTab(id) { 
    document.documentElement.setAttribute('data-active-tab', id);
    sessionStorage.setItem('adminTabActiva', id);
    document.querySelectorAll('.tab-link').forEach(l => {
        if(l.getAttribute('onclick').includes(id)) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function toggleDetalle(id) { 
    const el = document.getElementById(id); 
    el.style.display = el.style.display === 'table-row' ? 'none' : 'table-row'; 
}

async function cargarTodo() {
    cargarBanners(); 
    cargarCupones();
    cargarCategorias();

    try {
        const resI = await fetchSeguro(`${API}/productos`); 
        const dataI = await resI.json(); 
        pTotales = dataI; 
        pFiltrados = [...pTotales]; 
        renderStock();

        const resVentas = await fetchSeguro(`${API}/ventas`); 
        if (resVentas.ok) {
            ventasDataGlobal = await resVentas.json();
            vTotales = [...ventasDataGlobal];
            renderPedidos();
            generarEstadisticasMensuales();
        }
    } catch (err) { 
        console.error("Error conectando a BD:", err); 
        showCustomAlert("Error al cargar datos.", "error", false);
    }
}

// LÓGICA CATEGORÍAS
async function cargarCategorias() {
    try {
        const res = await fetchSeguro(`${API}/categorias`);
        if(res.ok) {
            categoriasGlobal = await res.json();
            renderCategorias();
            actualizarSelectCategorias();
        }
    } catch(e) { console.error(e); }
}

function actualizarSelectCategorias() {
    const select = document.getElementById('add-categoria');
    if(categoriasGlobal.length === 0) {
        select.innerHTML = '<option value="" disabled selected>No hay categorías</option>';
    } else {
        select.innerHTML = '<option value="" disabled selected>Categoría...</option>' + 
            categoriasGlobal.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    }
}

function renderCategorias() {
    const inicio = (cPagina - 1) * cPorPagina;
    const items = categoriasGlobal.slice(inicio, inicio + cPorPagina);
    const tbody = document.getElementById('body-categorias');

    if(categoriasGlobal.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:gray; padding:20px;">Aún no hay categorías creadas.</td></tr>';
    } else {
        tbody.innerHTML = items.map(c => `
            <tr>
                <td>#${c.id}</td>
                <td style="font-weight:bold; text-transform:capitalize;">${c.nombre}</td>
                <td style="text-align: center;">
                    <button class="btn-secundario" onclick="eliminarCategoria(${c.id})"><i class="fas fa-trash-alt"></i> Borrar</button>
                </td>
            </tr>
        `).join('');
    }
    document.getElementById('pagi-info-cat').innerText = `Página ${cPagina}`;
    document.getElementById('pagi-anterior-cat').disabled = cPagina === 1;
    document.getElementById('pagi-siguiente-cat').disabled = inicio + cPorPagina >= categoriasGlobal.length;
}

function paginaAnteriorCat() { if (cPagina > 1) { cPagina--; renderCategorias(); } }
function paginaSiguienteCat() { if ((cPagina * cPorPagina) < categoriasGlobal.length) { cPagina++; renderCategorias(); } }

async function agregarCategoria(e) {
    e.preventDefault();
    const inputNombre = document.getElementById('add-nombre-categoria');
    const nombre = inputNombre.value.trim();
    const btn = document.getElementById('btn-submit-categoria');

    if (!nombre) return;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/categorias`, {
            method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nombre})
        });
        if(res.ok) {
            inputNombre.value = '';
            showCustomAlert('Categoría añadida', 'success');
            cargarCategorias();
        } else {
            showCustomAlert('La categoría ya existe', 'error');
        }
    } catch(e) {
        showCustomAlert('Error de conexión', 'error');
    }
    btn.innerHTML = '<i class="fas fa-plus"></i> Añadir';
    btn.disabled = false;
}

function eliminarCategoria(id) {
    showCustomConfirm('¿Borrar categoría?', async () => {
        try {
            await fetchSeguro(`${API}/categorias/${id}`, {method:'DELETE'});
            cargarCategorias();
        } catch(e) {}
    });
}

// LÓGICA INVENTARIO - CON BOTÓN DE EDITAR AÑADIDO
function renderStock() {
    const inicio = (pagina - 1) * pPorPagina; 
    const items = pFiltrados.slice(inicio, inicio + pPorPagina);
    
    document.getElementById('body-inventario').innerHTML = items.map(p => {
        let tallesTxt = "";
        let stockTotalSumado = 0;

        if (p.inventario_talles && typeof p.inventario_talles === 'object') {
            tallesTxt = Object.entries(p.inventario_talles).map(([t, c]) => `${t}:${c}`).join(', ');
            Object.values(p.inventario_talles).forEach(cantidad => {
                stockTotalSumado += parseInt(cantidad) || 0;
            });
        }

        let mainImg = 'https://via.placeholder.com/60';
        try { 
            const arr = JSON.parse(p.imagen_url); 
            if(Array.isArray(arr) && arr.length > 0) mainImg = arr[0]; 
            else mainImg = p.imagen_url; 
        } catch(e) { 
            mainImg = p.imagen_url; 
        }

        return `
        <tr>
            <td><img src="${mainImg}" style="width:60px;height:60px;object-fit:cover; border-radius:6px; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></td>
            <td><strong>${p.nombre}</strong><br><small style="color:gray">${p.categoria}</small></td>
            <td><input type="number" id="efvo-${p.id}" value="${p.precio_efectivo}" style="width:90px; padding:5px;"></td>
            <td><input type="number" id="tarj-${p.id}" value="${p.precio_tarjeta}" style="width:90px; padding:5px;"></td>
            <td>
                <input type="text" id="talles-${p.id}" value="${tallesTxt}" style="width:150px; margin-bottom:5px; padding:5px;" placeholder="S:10, M:5">
                <br><small style="color:#27ae60; font-weight:bold;">Stock Total: ${stockTotalSumado}</small>
            </td>
            <td style="text-align: center; vertical-align: middle;">
                <div style="display: flex; justify-content: center; gap: 8px;">
                    <button style="background: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;" onclick="guardarEdicionFila(${p.id}, event)" title="Guardar Edición Rápida">
                        <i class="fas fa-check"></i>
                    </button>
                    <button style="background: #f39c12; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;" onclick="editarProducto(${p.id})" title="Editar Prenda">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button style="background: #ff6b6b; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;" onclick="borrarP(${p.id})" title="Eliminar Producto">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
    
    document.getElementById('pagi-info').innerText = `Página ${pagina}`; 
    document.getElementById('pagi-anterior').disabled = pagina === 1; 
    document.getElementById('pagi-siguiente').disabled = inicio + pPorPagina >= pFiltrados.length;
}

// FUNCIÓN PARA EDITAR LA PRENDA EN EL FORMULARIO
function editarProducto(id) {
    const producto = pTotales.find(p => p.id === id);
    if (!producto) return;

    idProductoEditando = id;
    
    const titulo = document.getElementById('titulo-form-admin');
    if(titulo) titulo.innerText = `Editando: ${producto.nombre}`;
    
    document.getElementById('add-nombre').value = producto.nombre || '';
    document.getElementById('add-categoria').value = producto.categoria || '';
    document.getElementById('add-precio-tarj').value = producto.precio_tarjeta || producto.tarjeta || '';
    document.getElementById('add-precio-efvo').value = producto.precio_efectivo || producto.efectivo || '';
    document.getElementById('add-descripcion').value = producto.descripcion || '';

    const chkUnico = document.getElementById('chk-unico');
    const inputTalles = document.getElementById('add-talles');
    const inputStockUnico = document.getElementById('add-stock-unico');

    if (producto.inventario_talles && producto.inventario_talles['ÚNICO'] !== undefined) {
        chkUnico.checked = true;
        inputTalles.style.display = 'none';
        inputStockUnico.style.display = 'block';
        inputStockUnico.value = producto.inventario_talles['ÚNICO'];
        inputTalles.value = '';
    } else {
        chkUnico.checked = false;
        inputTalles.style.display = 'block';
        inputStockUnico.style.display = 'none';
        if (producto.inventario_talles) {
            inputTalles.value = Object.entries(producto.inventario_talles).map(([t, c]) => `${t}:${c}`).join(', ');
        } else {
            inputTalles.value = '';
        }
        inputStockUnico.value = '';
    }

    const btnGuardar = document.getElementById('btn-crear-producto');
    btnGuardar.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    btnGuardar.style.background = '#f39c12';
    
    const labelImg = document.getElementById('label-add-img');
    labelImg.innerHTML = '<i class="fas fa-images"></i> <span>Reemplazar Fotos (Opcional)</span>';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limpiarFormularioAdmin() {
    const titulo = document.getElementById('titulo-form-admin');
    if(titulo) titulo.innerText = 'Cargar Nueva Prenda';
    
    document.getElementById('add-nombre').value = '';
    document.getElementById('add-categoria').value = '';
    document.getElementById('add-precio-tarj').value = '';
    document.getElementById('add-precio-efvo').value = '';
    document.getElementById('add-descripcion').value = '';
    document.getElementById('add-talles').value = '';
    document.getElementById('add-stock-unico').value = '';
    document.getElementById('chk-unico').checked = false;
    toggleTalleUnico();
    
    const imgInput = document.getElementById('add-img');
    imgInput.value = '';
    mostrarNombreArchivo(imgInput, 'label-add-img', 'Abrir Galería');

    idProductoEditando = null;
    
    const btnGuardar = document.getElementById('btn-crear-producto');
    btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
    btnGuardar.style.background = '#111';
    btnGuardar.disabled = false;
}

// FUNCIÓN PARA EL TICK VERDE (QUEDA IGUAL)
async function guardarEdicionFila(id, event) {
    const efvo = document.getElementById(`efvo-${id}`).value;
    const tarj = document.getElementById(`tarj-${id}`).value;
    const tallesTxt = document.getElementById(`talles-${id}`).value.trim();

    let inventarioFinal = {};
    if (tallesTxt) {
        tallesTxt.split(',').forEach(item => {
            const parts = item.split(':');
            if (parts.length === 2) {
                inventarioFinal[parts[0].trim().toUpperCase()] = parseInt(parts[1].trim());
            }
        });
    } else {
        return showCustomAlert("Debes ingresar al menos un talle o ÚNICO:1", "error", false);
    }

    const btn = event.currentTarget;
    const ogHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/productos/${id}`, {
            method: 'PATCH', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                precio_efectivo: efvo, 
                precio_tarjeta: tarj, 
                inventario_talles: inventarioFinal 
            })
        });

        if (res.ok) {
            showCustomAlert("¡Cambios guardados correctamente!", "success", false);
            const resI = await fetchSeguro(`${API}/productos`); 
            pTotales = await resI.json(); 
            pFiltrados = [...pTotales]; 
            renderStock();
        } else {
            showCustomAlert("Error al actualizar el producto.", "error", false);
            btn.innerHTML = ogHtml;
            btn.disabled = false;
        }
    } catch(e) { 
        showCustomAlert("Error de conexión.", "error", false);
        btn.innerHTML = ogHtml;
        btn.disabled = false;
    }
}

function borrarP(id) { 
    showCustomConfirm('¿Seguro que querés borrar este producto de la base de datos?', async () => {
        try {
            const res = await fetchSeguro(`${API}/productos/${id}`, { method: 'DELETE' });
            if(res.ok) {
                showCustomAlert("Producto eliminado correctamente", "success", false); 
                const resI = await fetchSeguro(`${API}/productos`); 
                pTotales = await resI.json(); 
                pFiltrados = [...pTotales]; 
                renderStock();
            } else {
                showCustomAlert("Error al eliminar el producto.", "error", false);
            }
        } catch (error) {
            showCustomAlert("Error de conexión.", "error", false);
        }
    }, "Sí, borrar");
}

function paginaSiguiente() { 
    const inicio = (pagina - 1) * pPorPagina;
    if (inicio + pPorPagina < pFiltrados.length) {
        pagina++; 
        renderStock(); 
    }
}

function paginaAnterior() { 
    if (pagina > 1) {
        pagina--; 
        renderStock(); 
    }
}

function filtrarInventario() { 
    const txt = document.getElementById('buscador-admin').value.toLowerCase(); 
    pFiltrados = txt === "" ? [...pTotales] : pTotales.filter(p => p.nombre.toLowerCase().includes(txt)); 
    pagina = 1; 
    renderStock(); 
}

function toggleTalleUnico() { 
    const esUnico = document.getElementById('chk-unico').checked; 
    document.getElementById('add-talles').style.display = esUnico ? 'none' : 'block'; 
    document.getElementById('add-stock-unico').style.display = esUnico ? 'block' : 'none';
    document.getElementById('add-talles').classList.remove('input-error');
    document.getElementById('add-stock-unico').classList.remove('input-error');
}

function validarLetras(input) { 
    input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9]/g, ''); 
}

function validarNumeros(input) { 
    input.value = input.value.replace(/[^0-9]/g, ''); 
}

// PROCESADOR DE IMÁGENES MULTIPLES
const procesarImg = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image(); 
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.readAsDataURL(file);
    });
};

// ==========================================
// FUNCIÓN CENTRAL PARA GUARDAR Y ACTUALIZAR
// ==========================================
async function guardarOActualizarProducto() { 
    const btn = document.getElementById('btn-crear-producto');
    const nombre = document.getElementById('add-nombre').value.trim();
    const categoria = document.getElementById('add-categoria').value;
    const pTarj = document.getElementById('add-precio-tarj').value;
    const pEfvo = document.getElementById('add-precio-efvo').value;
    const desc = document.getElementById('add-descripcion').value.trim();
    const esUnico = document.getElementById('chk-unico').checked;
    const imgInput = document.getElementById('add-img');

    let error = false;

    if (!nombre) { document.getElementById('add-nombre').classList.add('input-error'); error = true; }
    if (!categoria) { document.getElementById('add-categoria').classList.add('input-error'); error = true; }
    if (!pTarj) { document.getElementById('add-precio-tarj').classList.add('input-error'); error = true; }
    if (!pEfvo) { document.getElementById('add-precio-efvo').classList.add('input-error'); error = true; }
    if (!desc) { document.getElementById('add-descripcion').classList.add('input-error'); error = true; }
    
    // Solo da error la foto si estamos creando uno NUEVO
    if (idProductoEditando === null && (!imgInput.files || imgInput.files.length === 0)) {
        document.getElementById('label-add-img').classList.add('input-error');
        error = true;
    }

    let inventarioFinal = {};
    let stockIngresado = 0;

    if (esUnico) {
        const stock = document.getElementById('add-stock-unico').value;
        if (!stock) { document.getElementById('add-stock-unico').classList.add('input-error'); error = true; }
        else { 
            inventarioFinal["ÚNICO"] = parseInt(stock); 
            stockIngresado = parseInt(stock);
        }
    } else {
        const tallesTxt = document.getElementById('add-talles').value.trim();
        if (!tallesTxt) { document.getElementById('add-talles').classList.add('input-error'); error = true; }
        else {
            tallesTxt.split(',').forEach(item => {
                const parts = item.split(':');
                if(parts.length === 2) {
                    let cant = parseInt(parts[1].trim());
                    inventarioFinal[parts[0].trim().toUpperCase()] = cant;
                    stockIngresado += cant;
                }
            });
        }
    }

    if(error) return showCustomAlert("Por favor, completá todos los recuadros rojos.", "error", false);
    if(stockIngresado <= 0) return showCustomAlert("El stock no puede ser 0.", "error", false);

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    btn.disabled = true;

    try {
        let imgDataToSave = null;
        
        // Si subió fotos nuevas, las procesamos (ya sea nuevo o editando)
        if (imgInput.files && imgInput.files.length > 0) {
            const base64Images = [];
            const filesToProcess = Array.from(imgInput.files).slice(0, 5); 
            for (let file of filesToProcess) { 
                base64Images.push(await procesarImg(file)); 
            }
            imgDataToSave = JSON.stringify(base64Images);
        }

        const bodyPayload = {
            nombre: nombre,
            categoria: categoria,
            precio_efectivo: pEfvo,
            precio_tarjeta: pTarj,
            descripcion: desc,
            inventario_talles: inventarioFinal
        };

        // Solo sobreescribimos la imagen si hay una nueva cargada
        if (imgDataToSave) {
            bodyPayload.imagen_url = imgDataToSave;
        }

        let url = `${API}/productos`;
        let metodo = 'POST'; // Crear nuevo por defecto

        if (idProductoEditando !== null) {
            url = `${API}/productos/${idProductoEditando}`;
            metodo = 'PUT'; // Actualizar
        }

        const res = await fetchSeguro(url, {
            method: metodo,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(bodyPayload)
        });

        if(res.ok) {
            showCustomAlert(idProductoEditando ? "¡Producto actualizado exitosamente!" : "¡Producto creado exitosamente!", "success", false);
            
            limpiarFormularioAdmin();

            const resI = await fetchSeguro(`${API}/productos`); 
            pTotales = await resI.json(); 
            pFiltrados = [...pTotales]; 
            renderStock();
        } else {
            showCustomAlert("Error al guardar el producto.", "error", false);
            btn.innerHTML = idProductoEditando ? '<i class="fas fa-sync-alt"></i> Actualizar' : '<i class="fas fa-save"></i> Guardar';
            btn.disabled = false;
        }
    } catch(e) {
        showCustomAlert("Error de conexión con el servidor.", "error", false);
        btn.innerHTML = idProductoEditando ? '<i class="fas fa-sync-alt"></i> Actualizar' : '<i class="fas fa-save"></i> Guardar';
        btn.disabled = false;
    }
}

// PEDIDOS
function renderPedidos() {
    const inicio = (vPagina - 1) * vPorPagina; 
    const items = vTotales.slice(inicio, inicio + vPorPagina);
    const tbodyVentas = document.getElementById('body-pedidos');

    if(vTotales.length === 0) {
        tbodyVentas.innerHTML = '<tr><td colspan="8" style="text-align:center; color:gray;">Aún no hay pedidos.</td></tr>';
    } else {
        tbodyVentas.innerHTML = items.map(v => {
            const fecha = new Date(v.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
            let detalleTxt = '<span style="color:#e74c3c;">Sin detalle</span>';
            
            if (v.detalles && v.detalles.length > 0) {
                detalleTxt = v.detalles.map(d => `<b>${d.cantidad}x</b> ${d.nombre_producto} <small>(Talle: ${d.talle})</small>`).join('<br>');
            }
            
            const telLimpio = v.cliente_telefono ? v.cliente_telefono.replace(/[^0-9]/g, '') : '';

            return `
            <tr>
                <td>#${v.id}</td>
                <td><strong>${fecha}</strong></td>
                <td>
                    <div style="font-weight:600; color:#2c3e50;">${v.cliente_nombre} ${v.cliente_apellido}</div>
                    <a href="https://wa.me/${telLimpio}" target="_blank" style="color:#25D366; text-decoration:none; font-weight:bold; display:block; margin: 4px 0;" title="Abrir WhatsApp">
                        <i class="fab fa-whatsapp" style="font-size:1.1em;"></i> ${v.cliente_telefono || 'Sin teléfono'}
                    </a>
                    <small style="color:#888;">${v.cliente_email || ''}</small>
                </td>
                <td><span style="background:#ecf0f1; padding:4px 8px; border-radius:4px; font-size:0.8rem; text-transform:capitalize;">${v.metodo_pago}</span></td>
                <td><span style="background:${v.estado === 'Completado' ? '#e8f8f5' : '#fff3cd'}; color:${v.estado === 'Completado' ? '#27ae60' : '#f39c12'}; padding:4px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;">${v.estado}</span></td>
                <td style="font-size: 0.85rem; line-height: 1.4;">${detalleTxt}</td>
                <td><strong style="color:#27ae60;">$${v.total}</strong></td>
                <td style="text-align: center; vertical-align: middle;">
                    <div style="display: flex; justify-content: center; gap: 8px;">
                        ${v.estado !== 'Completado' ? `<button style="background: #27ae60; color: white; border: none; border-radius: 6px; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;" onclick="completarPedido(${v.id})" title="Marcar como Realizado"><i class="fas fa-check"></i></button>` : ''}
                        <button style="background: #ff6b6b; color: white; border: none; border-radius: 6px; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;" onclick="eliminarPedido(${v.id})" title="Borrar Pedido"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }
    
    document.getElementById('pagi-info-pedidos').innerText = `Página ${vPagina}`; 
    document.getElementById('pagi-anterior-pedidos').disabled = vPagina === 1; 
    document.getElementById('pagi-siguiente-pedidos').disabled = inicio + vPorPagina >= vTotales.length;
}

function completarPedido(id) {
    showCustomConfirm('¿Seguro que querés marcar este pedido como realizado?', async () => {
        try {
            const res = await fetchSeguro(`${API}/ventas/${id}/completar`, { method: 'PATCH' });
            if(res.ok) {
                showCustomAlert("Pedido completado", "success", false);
                ventasDataGlobal = await (await fetchSeguro(`${API}/ventas`)).json();
                vTotales = [...ventasDataGlobal];
                renderPedidos();
                generarEstadisticasMensuales();
            } else {
                showCustomAlert("Error al actualizar el pedido.", "error", false);
            }
        } catch (error) {
            showCustomAlert("Error de conexión.", "error", false);
        }
    }, "Sí");
}

function eliminarPedido(id) {
    showCustomConfirm('¿Seguro que querés borrar este pedido de la base de datos?', async () => {
        try {
            const res = await fetchSeguro(`${API}/ventas/${id}`, { method: 'DELETE' });
            if(res.ok) {
                showCustomAlert("Pedido eliminado", "success", false);
                ventasDataGlobal = await (await fetchSeguro(`${API}/ventas`)).json();
                vTotales = [...ventasDataGlobal];
                renderPedidos();
                generarEstadisticasMensuales();
            } else {
                showCustomAlert("Error al eliminar el pedido.", "error", false);
            }
        } catch (error) {
            showCustomAlert("Error de conexión.", "error", false);
        }
    }, "Sí, borrar");
}

function paginaSiguientePedidos() { 
    const inicio = (vPagina - 1) * vPorPagina;
    if (inicio + vPorPagina < vTotales.length) {
        vPagina++; 
        renderPedidos(); 
    }
}

function paginaAnteriorPedidos() { 
    if (vPagina > 1) {
        vPagina--; 
        renderPedidos(); 
    }
}

function generarEstadisticasMensuales() {
    const statsAgrupadas = {};
    const mesesStr = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    ventasDataGlobal.forEach(v => {
        const f = new Date(v.fecha_creacion);
        const llaveMes = `${f.getFullYear()} - ${mesesStr[f.getMonth()]}`;
        
        if(!statsAgrupadas[llaveMes]) {
            statsAgrupadas[llaveMes] = { mes: llaveMes, ventas_totales: 0, recaudado: 0, arrayVentas: [] };
        }
        statsAgrupadas[llaveMes].ventas_totales += 1;
        statsAgrupadas[llaveMes].recaudado += parseFloat(v.total);
        statsAgrupadas[llaveMes].arrayVentas.push(v); 
    });

    const tbodyStats = document.getElementById('body-meses');
    const keys = Object.keys(statsAgrupadas);
    
    if(keys.length === 0) {
        tbodyStats.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay datos para mostrar.</td></tr>';
    } else {
        tbodyStats.innerHTML = keys.map((k, i) => {
            const m = statsAgrupadas[k];
            const detallesMesHTML = m.arrayVentas.map(venta => {
                const fechaStr = new Date(venta.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
                let itemsStr = '<span style="color:#e74c3c;">Sin detalle</span>';
                if (venta.detalles && venta.detalles.length > 0) {
                    itemsStr = venta.detalles.map(item => `<b>${item.cantidad}x</b> ${item.nombre_producto} (Talle: ${item.talle})`).join(' | ');
                }
                return `
                <div class="venta-card">
                    <strong style="color: #2c3e50;">(${fechaStr}) - ${venta.cliente_nombre} ${venta.cliente_apellido}</strong> - <span style="color:#27ae60; font-weight:bold;">$${venta.total}</span> <small style="color: gray; text-transform:capitalize;">(${venta.metodo_pago})</small>
                    <br><span style="color: #555; font-size: 13px; margin-top:5px; display:block;">👕 ${itemsStr}</span>
                </div>`;
            }).join('');

            return `
            <tr class="fila-mes" onclick="toggleDetalle('det-${i}')">
                <td><b>${m.mes}</b> <i class="fas fa-chevron-down" style="font-size:0.8rem; color:#aaa; margin-left:10px;"></i></td>
                <td>${m.ventas_totales} Pedidos</td>
                <td style="color:#27ae60; font-weight:bold; font-size:1.1rem;">$${m.recaudado.toLocaleString('es-AR')}</td>
            </tr>
            <tr id="det-${i}" class="fila-detalle">
                <td colspan="3" style="padding: 15px;">
                    ${detallesMesHTML}
                </td>
            </tr>
            `;
        }).join('');
    }
}

async function cargarBanners() {
    const tbody = document.getElementById('body-banners');
    try {
        const res = await fetchSeguro(`${API}/banners`);
        if(res.ok) {
            const banners = await res.json();
            if(banners.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No hay fotos cargadas.</td></tr>';
                return;
            }
            tbody.innerHTML = banners.map(b => `
                <tr>
                    <td style="font-weight: bold; color: #888;">#${b.id}</td>
                    <td><img src="${b.imagen_url}" class="banner-preview" alt="Preview"></td>
                    <td style="font-size: 0.8rem; color: #777;">[Imagen cargada desde archivo]</td>
                    <td style="text-align: center;">
                        <button class="btn-secundario" onclick="eliminarBanner(${b.id})"><i class="fas fa-trash-alt"></i> Borrar</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) { 
        console.error(err); 
    }
}

async function agregarBanner(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-banner');
    const fileInput = document.getElementById('add-banner-file');

    if (!fileInput.files || fileInput.files.length === 0) {
        return showCustomAlert("Seleccioná una imagen primero.", "error", false);
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
        const imgBase64 = reader.result;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const res = await fetchSeguro(`${API}/banners`, {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ imagen_url: imgBase64 })
            });
            
            if(res.ok) {
                fileInput.value = ''; 
                const label = document.getElementById('label-add-banner-file');
                label.querySelector('span').innerText = 'Abrir Galería';
                label.classList.remove('selected');
                label.querySelector('i').className = 'fas fa-camera';

                showCustomAlert("¡Banner agregado!", "success", false);
                cargarBanners(); 
            } else {
                showCustomAlert("Error al subir el banner.", "error", false);
            }
        } catch (error) {
            showCustomAlert("Error de conexión.", "error", false);
        }
        btn.innerHTML = '<i class="fas fa-plus"></i> Añadir Foto';
        btn.disabled = false;
    };

    reader.readAsDataURL(file);
}

function eliminarBanner(id) {
    showCustomConfirm('¿Seguro que querés borrar esta foto del carrusel?', async () => {
        try {
            await fetchSeguro(`${API}/banners/${id}`, { method: 'DELETE' });
            showCustomAlert("Foto eliminada", "success", false);
            cargarBanners();
        } catch (error) {
            showCustomAlert("Error al eliminar", "error", false);
        }
    }, "Sí, borrar");
}

async function cargarCupones() {
    const tbody = document.getElementById('body-cupones');
    try {
        const res = await fetchSeguro(`${API}/cupones`);
        if(res.ok) {
            const cupones = await res.json();
            if(cupones.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No hay cupones creados.</td></tr>';
                return;
            }
            tbody.innerHTML = cupones.map(c => `
                <tr>
                    <td><strong style="color:var(--brand-brown); font-size:1.1rem; text-transform:uppercase;">${c.codigo}</strong></td>
                    <td style="font-weight: bold; color: var(--success);">${c.descuento_porcentaje}% OFF</td>
                    <td>${c.usos_disponibles > 0 ? `<strong>${c.usos_disponibles}</strong> usos rest.` : '<span style="color:red;">Agotado</span>'}</td>
                    <td style="text-align: center;">
                        <button class="btn-secundario" onclick="eliminarCupon(${c.id})"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) { 
        console.error(err); 
    }
}

async function agregarCupon(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-cupon');
    const codigo = document.getElementById('add-cupon-codigo').value.trim();
    const descuento = document.getElementById('add-cupon-porcentaje').value;
    const usos = document.getElementById('add-cupon-usos').value;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/cupones`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ codigo, descuento_porcentaje: descuento, usos_disponibles: usos })
        });
        
        if(res.ok) {
            document.getElementById('add-cupon-codigo').value = ''; 
            document.getElementById('add-cupon-porcentaje').value = ''; 
            document.getElementById('add-cupon-usos').value = ''; 
            showCustomAlert("¡Cupón creado y listo para usarse!", "success", false);
            cargarCupones(); 
        } else {
            showCustomAlert("Ese código de cupón ya existe. Elegí otro nombre.", "error", false);
        }
    } catch (error) {
        showCustomAlert("Error de conexión.", "error", false);
    }
    btn.innerHTML = 'Crear';
    btn.disabled = false;
}

function eliminarCupon(id) {
    showCustomConfirm('¿Seguro que querés eliminar y desactivar este cupón de descuento?', async () => {
        try {
            await fetchSeguro(`${API}/cupones/${id}`, { method: 'DELETE' });
            showCustomAlert("Cupón eliminado", "success", false);
            cargarCupones();
        } catch (error) {
            showCustomAlert("Error al eliminar", "error", false);
        }
    }, "Sí, borrar");
}

function descargarExcel() { 
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    
    csvContent += "PRENDAS,SEMANA 1,,,,SEMANA 2,,,,SEMANA 3,,,,SEMANA 4,,,,TOTAL\n"; 
    csvContent += "Articulo,VEN TA,ENT RA,SA LE,SAL DO,VEN TA,ENT RA,SA LE,SAL DO,VEN TA,ENT RA,SA LE,SAL DO,VEN TA,ENT RA,SA LE,SAL DO,VENTA MENSUAL\n"; 

    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    pTotales.forEach(p => { 
        let nombreLimpio = p.nombre ? p.nombre.replace(/,/g, '') : ''; 

        let v1 = 0, v2 = 0, v3 = 0, v4 = 0;

        ventasDataGlobal.forEach(v => {
            const fechaVenta = new Date(v.fecha_creacion);
            if (fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === anioActual) {
                let dia = fechaVenta.getDate();
                let cantVendida = 0;
                
                if (v.detalles) {
                    v.detalles.forEach(item => {
                        if (item.producto_id === p.id) {
                            cantVendida += parseInt(item.cantidad) || 0;
                        }
                    });
                }

                if (dia <= 7) v1 += cantVendida;
                else if (dia <= 14) v2 += cantVendida;
                else if (dia <= 21) v3 += cantVendida;
                else v4 += cantVendida;
            }
        });

        let ventaMensual = v1 + v2 + v3 + v4;
        
        let stockActual = 0;
        if (p.inventario_talles && typeof p.inventario_talles === 'object') {
            Object.values(p.inventario_talles).forEach(c => stockActual += parseInt(c) || 0);
        }

        csvContent += `${nombreLimpio},${v1},,,,${v2},,,,${v3},,,,${v4},,,${stockActual},${ventaMensual}\n`; 
    }); 
    
    const encodedUri = encodeURI(csvContent); 
    const link = document.createElement("a"); 
    link.setAttribute("href", encodedUri); 
    link.setAttribute("download", "Control_Mensual_RH.csv"); 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link); 
}