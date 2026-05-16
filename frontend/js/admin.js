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
let categoriasGlobal = [];
let cPagina = 1;
const cPorPagina = 10;
let idProductoEditando = null;

const mapaColores = {
    'rojo': '#ff0000', 'azul': '#0000ff', 'verde': '#008000', 'amarillo': '#ffff00', 
    'negro': '#000000', 'blanco': '#ffffff', 'gris': '#808080', 
    'marron': '#8b4513', 'marrón': '#8b4513', 'rosa': '#ffc0cb', 'naranja': '#ffa500', 
    'violeta': '#ee82ee', 'celeste': '#87ceeb', 'beige': '#f5f5dc', 'crema': '#fffdd0', 
    'arena': '#d4ba92', 'mostaza': '#e1ad01', 'bordo': '#800000', 'bordó': '#800000', 
    'militar': '#4b5320', 'marino': '#000080', 'camel': '#c19a6b', 'fucsia': '#ff00ff',
    'coral': '#ff7f50', 'vison': '#ccb8a5', 'visón': '#ccb8a5', 'tiza': '#f5f5f0',
    'oliva': '#808000', 'esmeralda': '#50c878', 'turquesa': '#40e0d0', 'lila': '#c8a2c8',
    'salmon': '#fa8072', 'salmón': '#fa8072', 'terracota': '#e2725b', 'habano': '#593c1f',
    'crudo': '#f3e5ab', 'hueso': '#e3dac9', 'lima': '#bfff00', 'ocre': '#cc7722',
    'guinda': '#800000', 'ciruela': '#dda0dd', 'pastel': '#aec6cf',
    'francia': '#318ce7', 'melange': '#d3d3d3', 'ingles': '#1b4d3e', 'inglés': '#1b4d3e'
};

const colorDefectoHex = '#d4ba92'; 

function detectarColor(texto) {
    const hex = document.getElementById('add-color-hex');
    const colorLower = texto.toLowerCase().trim();
    if(mapaColores[colorLower]) {
        hex.value = mapaColores[colorLower];
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // === INYECCIÓN CSS PARA ARREGLAR EL ADMIN EN CELULAR ===
    const adminStyles = document.createElement('style');
    adminStyles.innerHTML = `
        @media (max-width: 768px) {
            .admin-container { padding: 10px; }
            #talles-builder-box { padding: 15px 10px; margin-top: 15px; }
            .builder-talle-nombre, .builder-talle-cant { width: 100% !important; flex: 1; }
            #talles-builder-ui > div { flex-wrap: wrap; }
            .form-group input, .form-group textarea, .form-group select { width: 100% !important; box-sizing: border-box; }
            table { display: block; overflow-x: auto; white-space: nowrap; }
            .swal2-popup { width: 90% !important; }
        }
    `;
    document.head.appendChild(adminStyles);

    const inputColorNombre = document.getElementById('add-color-nombre');
    if (inputColorNombre) {
        inputColorNombre.addEventListener('input', (e) => detectarColor(e.target.value));
    }

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

        btn.innerText = 'Verificando...'; btn.disabled = true; errorMsg.style.display = 'none';

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
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
            errorMsg.innerText = 'Error de conexión.';
            errorMsg.style.display = 'block';
        } finally {
            btn.innerText = 'Ingresar'; btn.disabled = false;
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
    if (sessionStorage.getItem('adminLogueado') === 'true') { cargarTodo(); }
};

function showCustomAlert(msg, type = 'error', reload = false) {
    reloadAfterAlert = reload;
    const modal = document.getElementById('custom-alert-modal');
    const icon = document.getElementById('custom-alert-icon');
    document.getElementById('custom-alert-text').innerText = msg;
    if(type === 'success') icon.innerHTML = '<i class="fas fa-check-circle" style="color:#27ae60;"></i>';
    else icon.innerHTML = '<i class="fas fa-times-circle" style="color:#e74c3c;"></i>';
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10); 
}

function cerrarCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; if(reloadAfterAlert) location.reload(); }, 200);
}

function showCustomConfirm(msg, callback, btnText = "Sí") {
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('custom-confirm-text').innerText = msg;
    document.getElementById('btn-confirmar-accion').innerText = btnText;
    accionConfirmada = callback;
    modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10);
}

function cerrarCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; accionConfirmada = null; }, 200);
}

document.getElementById('btn-confirmar-accion')?.addEventListener('click', () => {
    if (accionConfirmada) accionConfirmada(); cerrarCustomConfirm();
});

function mostrarNombreArchivo(input, labelId, textoDefault) {
    const label = document.getElementById(labelId);
    if (input.files && input.files.length > 0) {
        label.innerText = input.files.length === 1 ? input.files[0].name : `${input.files.length} fotos elegidas`;
        label.classList.add('selected'); 
    } else {
        label.innerText = textoDefault; label.classList.remove('selected'); 
    }
}

async function fetchSeguro(url, opciones = {}) {
    const res = await fetch(url, opciones); return res;
}

function verTab(id) { 
    document.documentElement.setAttribute('data-active-tab', id);
    document.querySelectorAll('.tab-link').forEach(l => {
        if(l.getAttribute('onclick').includes(id)) l.classList.add('active');
        else l.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function toggleDetalle(id) { 
    const el = document.getElementById(id); 
    el.style.display = el.style.display === 'table-row' ? 'none' : 'table-row'; 
}

function initTallesBuilder() {
    const inputTalles = document.getElementById('add-talles');
    if(!inputTalles || document.getElementById('talles-builder-box')) return;

    inputTalles.style.display = 'none'; 

    const mainBox = document.createElement('div');
    mainBox.id = 'talles-builder-box';
    mainBox.style.gridColumn = '1 / -1'; 
    mainBox.style.width = '100%';
    mainBox.style.display = 'block';
    mainBox.style.clear = 'both';
    mainBox.style.background = '#f9f9f9';
    mainBox.style.border = '1px solid #ddd';
    mainBox.style.borderRadius = '8px';
    mainBox.style.padding = '15px';
    mainBox.style.marginTop = '25px';
    mainBox.style.marginBottom = '25px';
    mainBox.style.boxSizing = 'border-box';

    mainBox.innerHTML = '<h4 style="margin-top:0; margin-bottom:15px; font-size:0.95rem; color:#333; text-transform:uppercase;">Stock por Talles</h4>';

    const container = document.createElement('div');
    container.id = 'talles-builder-ui';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '10px';

    const btnAdd = document.createElement('button');
    btnAdd.id = 'btn-add-talle-ui';
    btnAdd.type = 'button';
    btnAdd.className = 'btn-secundario';
    btnAdd.innerHTML = '<i class="fas fa-plus"></i> Añadir Talle';
    btnAdd.style.padding = '10px 15px';
    btnAdd.style.fontSize = '0.85rem';
    btnAdd.style.width = 'auto';
    btnAdd.style.marginTop = '15px';
    btnAdd.onclick = () => agregarTalleUI('', 0);

    mainBox.appendChild(container);
    mainBox.appendChild(btnAdd);

    const btnSubmitForm = document.getElementById('btn-crear-producto');
    if (btnSubmitForm && btnSubmitForm.parentNode) {
        btnSubmitForm.parentNode.insertBefore(mainBox, btnSubmitForm);
    } else {
        inputTalles.parentNode.insertBefore(mainBox, inputTalles.nextSibling);
    }

    agregarTalleUI('S', 0); agregarTalleUI('M', 0); agregarTalleUI('L', 0);
}

function agregarTalleUI(nombre = '', cantidad = 0) {
    const container = document.getElementById('talles-builder-ui');
    if(!container) return;
    const div = document.createElement('div');
    div.style.display = 'flex'; div.style.alignItems = 'center'; div.style.gap = '10px';
    div.style.background = '#ffffff'; div.style.padding = '10px'; div.style.borderRadius = '6px';
    div.style.border = '1px solid #eee'; div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';

    div.innerHTML = `
        <input type="text" placeholder="Talle (Ej: M)" value="${nombre}" class="builder-talle-nombre" style="width: 80px; text-transform: uppercase; border: 1px solid #ccc; border-radius: 4px; padding: 8px; text-align: center; font-weight: bold; outline:none;">
        <span style="font-weight: 800; color:#aaa;">:</span>
        <input type="number" placeholder="Cant." value="${cantidad}" class="builder-talle-cant" min="0" style="width: 80px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; text-align: center; font-weight: bold; outline:none;">
        <button type="button" style="background:transparent; border:none; color: #e74c3c; cursor: pointer; font-size:1.1rem; padding:5px 10px;" onclick="this.parentNode.remove()" title="Eliminar talle"><i class="fas fa-trash-alt"></i></button>
    `;
    container.appendChild(div);
}

function toggleTalleUnico() { 
    const esUnico = document.getElementById('chk-unico').checked; 
    const builderBox = document.getElementById('talles-builder-box');

    if(esUnico) {
        if(builderBox) builderBox.style.display = 'none';
        document.getElementById('add-stock-unico').style.display = 'block';
    } else {
        if(builderBox) builderBox.style.display = 'block';
        document.getElementById('add-stock-unico').style.display = 'none';
    }
}

async function cargarTodo() {
    initTallesBuilder();
    cargarBanners(); cargarCupones(); cargarCategorias();
    try {
        const resI = await fetchSeguro(`${API}/productos?t=` + new Date().getTime(), { cache: 'no-store' }); 
        pTotales = await resI.json(); 
        pFiltrados = [...pTotales]; 
        renderStock();
        
        const resVentas = await fetchSeguro(`${API}/ventas`, { cache: 'no-store' }); 
        if (resVentas.ok) {
            ventasDataGlobal = await resVentas.json();
            vTotales = [...ventasDataGlobal];
            renderPedidos();
            generarEstadisticasMensuales();
        }
    } catch (err) { 
        showCustomAlert("Error al cargar datos.", "error", false);
    }
}

function renderStock() {
    const inicio = (pagina - 1) * pPorPagina; 
    const items = pFiltrados.slice(inicio, inicio + pPorPagina);
    
    document.getElementById('body-inventario').innerHTML = items.map(p => {
        let colorHexFinal = p.color_hex || ''; 
        if (!colorHexFinal) {
            const textoBuscar = ((p.nombre || '') + ' ' + (p.descripcion || '')).toLowerCase();
            const clavesColores = Object.keys(mapaColores);
            const claveEncontrada = clavesColores.find(clave => textoBuscar.includes(clave.toLowerCase()));
            if (claveEncontrada) { colorHexFinal = mapaColores[claveEncontrada]; } 
            else { colorHexFinal = colorDefectoHex; }
        }

        const colorCircleHTML = `<span class="product-color-indicator" style="background-color: ${colorHexFinal}; display:inline-block; width:14px; height:14px; border-radius:50%; border:1px solid #ccc; vertical-align:middle; margin-right:6px;"></span>`;

        let totalStockPrenda = 0;
        let tallesHtml = "";
        let inventario = p.inventario_talles || {};

        if (inventario['ÚNICO'] !== undefined) {
            totalStockPrenda = parseInt(inventario['ÚNICO']) || 0;
            tallesHtml = `
            <div style="background:#eafaf1; border:1px solid #27ae60; padding:4px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:5px;">
                <span style="font-size:0.8rem; font-weight:800; color:#27ae60;">ÚNICO:</span>
                <input type="number" id="talle-unico-${p.id}" value="${totalStockPrenda}" min="0" style="width:55px; padding:4px; text-align:center; border:1px solid #27ae60; border-radius:4px; font-weight:bold; color:#111;">
            </div>`;
        } else {
            const claves = Object.keys(inventario);
            claves.forEach(t => {
                const cant = parseInt(inventario[t]) || 0;
                totalStockPrenda += cant;
                tallesHtml += `
                <div style="display:inline-flex; align-items:center; gap:4px; background:#f5f5f5; padding:4px 8px; border-radius:6px; border:1px solid #ddd; margin-bottom:4px; margin-right:4px;">
                    <span style="font-size:0.8rem; font-weight:800; color:#444;">${t}:</span>
                    <input type="number" class="talle-input-fila-${p.id}" data-talle="${t}" value="${cant}" min="0" style="width:45px; padding:3px; text-align:center; border:1px solid #ccc; border-radius:4px; font-weight:bold; color:#111;">
                </div>`;
            });
            if (claves.length === 0) tallesHtml = `<span style="color:red; font-size:0.8rem; font-weight:bold;">Sin talles cargados</span>`;
        }

        let mainImg = 'https://via.placeholder.com/60';
        try { 
            const arr = JSON.parse(p.imagen_url); 
            if(Array.isArray(arr) && arr.length > 0) mainImg = arr[0]; 
            else mainImg = p.imagen_url; 
        } catch(e) { mainImg = p.imagen_url; }
        
        if (mainImg && !mainImg.startsWith('data:')) {
            mainImg += (mainImg.includes('?') ? '&' : '?') + 'v=' + new Date().getTime();
        }

        return `
        <tr>
            <td><img src="${mainImg}" style="width:60px;height:60px;object-fit:cover; border-radius:6px; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></td>
            <td>
                <div style="display:flex; align-items:center;">
                    ${colorCircleHTML}
                    <strong>${p.nombre}</strong>
                </div>
                <small style="color:gray; display:block; margin-left:20px;">${p.categoria}</small>
            </td>
            <td><input type="number" id="efvo-${p.id}" value="${p.precio_efectivo}" style="width:90px; padding:5px;"></td>
            <td><input type="number" id="tarj-${p.id}" value="${p.precio_tarjeta}" style="width:90px; padding:5px;"></td>
            
            <td>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 240px;">
                    ${tallesHtml}
                </div>
                <small style="color:${totalStockPrenda > 0 ? '#27ae60' : '#e74c3c'}; font-weight:bold; display:block; margin-top:6px;">Stock Total: ${totalStockPrenda}</small>
            </td>

            <td style="text-align: center;">
                <button style="background: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 1.1rem;" onclick="guardarEdicionFila(${p.id}, event)" title="Guardar Stock Rápido"><i class="fas fa-check"></i></button>
                <button style="background: #f39c12; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 1.1rem;" onclick="editarProducto(${p.id})" title="Editar Detalles Completos"><i class="fas fa-pencil-alt"></i></button>
                <button style="background: #ff6b6b; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 1.1rem;" onclick="borrarP(${p.id})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');
    
    document.getElementById('pagi-info').innerText = `Página ${pagina}`; 
    document.getElementById('pagi-anterior').disabled = pagina === 1; 
    document.getElementById('pagi-siguiente').disabled = inicio + pPorPagina >= pFiltrados.length;
}

async function guardarEdicionFila(id, event) {
    const efvo = document.getElementById(`efvo-${id}`).value;
    const tarj = document.getElementById(`tarj-${id}`).value;
    
    let inventarioFinal = {};
    const inputUnico = document.getElementById(`talle-unico-${id}`);
    
    if (inputUnico) {
        inventarioFinal['ÚNICO'] = parseInt(inputUnico.value) || 0;
    } else {
        const inputsTalles = document.querySelectorAll(`.talle-input-fila-${id}`);
        inputsTalles.forEach(input => {
            const cant = parseInt(input.value) || 0;
            inventarioFinal[input.getAttribute('data-talle')] = cant;
        });
        
        if (inputsTalles.length === 0) {
            return showCustomAlert("No hay talles. Entrá a 'Editar Prenda' para agregarlos.", "error", false);
        }
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
            showCustomAlert("¡Stock y precios guardados!", "success", false); 
            const resI = await fetchSeguro(`${API}/productos?t=` + new Date().getTime(), { cache: 'no-store' }); 
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

// === FIX 3: RELLENAR TODOS LOS CAMPOS AL EDITAR ===
function editarProducto(id) {
    const producto = pTotales.find(p => p.id === id);
    if (!producto) return;
    idProductoEditando = id;
    
    document.getElementById('add-nombre').value = producto.nombre || '';
    document.getElementById('add-categoria').value = producto.categoria || '';
    document.getElementById('add-precio-tarj').value = producto.precio_tarjeta || producto.tarjeta || '';
    document.getElementById('add-precio-efvo').value = producto.precio_efectivo || producto.efectivo || '';
    document.getElementById('add-descripcion').value = producto.descripcion || '';
    
    document.getElementById('add-codigo-modelo').value = producto.codigo_modelo || '';
    document.getElementById('add-color-hex').value = producto.color_hex || '#d4ba92';
    document.getElementById('add-color-nombre').value = producto.color_nombre || '';

    const chkUnico = document.getElementById('chk-unico');
    const inputStockUnico = document.getElementById('add-stock-unico');
    const containerTalles = document.getElementById('talles-builder-ui');

    if(containerTalles) containerTalles.innerHTML = '';

    if (producto.inventario_talles && producto.inventario_talles['ÚNICO'] !== undefined) {
        chkUnico.checked = true;
        toggleTalleUnico();
        inputStockUnico.value = producto.inventario_talles['ÚNICO'];
    } else {
        chkUnico.checked = false;
        toggleTalleUnico();
        if (producto.inventario_talles) {
            Object.entries(producto.inventario_talles).forEach(([t, c]) => agregarTalleUI(t, c));
        } else {
            agregarTalleUI('S', 0);
        }
        inputStockUnico.value = '';
    }

    const imgInput = document.getElementById('add-img');
    const labelImg = document.getElementById('label-add-img');
    if(imgInput) { imgInput.value = ''; }
    if(labelImg) { labelImg.innerText = 'Reemplazar Foto (Opcional)'; labelImg.classList.remove('selected'); }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    verTab('tab-inventario');
    const btn = document.getElementById('btn-crear-producto');
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Publicación';
    btn.style.background = '#f39c12';
}

function limpiarFormularioAdmin() {
    document.getElementById('add-nombre').value = '';
    document.getElementById('add-categoria').value = '';
    document.getElementById('add-precio-tarj').value = '';
    document.getElementById('add-precio-efvo').value = '';
    document.getElementById('add-descripcion').value = '';
    
    document.getElementById('add-codigo-modelo').value = '';
    document.getElementById('add-color-hex').value = '#d4ba92';
    document.getElementById('add-color-nombre').value = '';

    const chkUnico = document.getElementById('chk-unico');
    if(chkUnico) { chkUnico.checked = false; toggleTalleUnico(); }
    
    const containerTalles = document.getElementById('talles-builder-ui');
    if(containerTalles) {
        containerTalles.innerHTML = '';
        agregarTalleUI('S', 0); agregarTalleUI('M', 0); agregarTalleUI('L', 0);
    }
    
    const imgInput = document.getElementById('add-img');
    const labelImg = document.getElementById('label-add-img');
    if(imgInput) { imgInput.value = ''; }
    if(labelImg) { labelImg.innerText = 'Subir Foto Principal'; labelImg.classList.remove('selected'); }

    idProductoEditando = null;
    const btn = document.getElementById('btn-crear-producto');
    btn.innerHTML = '<i class="fas fa-plus"></i> Guardar Publicación';
    btn.style.background = '#111';
}

function borrarP(id) { 
    showCustomConfirm('¿Seguro que querés borrar este producto? Se eliminará de la base de datos.', async () => {
        try {
            const res = await fetchSeguro(`${API}/productos/${id}`, { method: 'DELETE' });
            if(res.ok) { 
                showCustomAlert("Producto eliminado correctamente", "success", false); 
                const resI = await fetchSeguro(`${API}/productos?t=`+new Date().getTime(), {cache:'no-store'}); 
                pTotales = await resI.json(); 
                pFiltrados = [...pTotales]; 
                renderStock(); 
            } else { 
                showCustomAlert("Error al eliminar el producto.", "error", false); 
            }
        } catch (error) { showCustomAlert("Error de conexión.", "error", false); }
    }, "Sí, borrar");
}

function paginaSiguiente() { const inicio = (pagina - 1) * pPorPagina; if (inicio + pPorPagina < pFiltrados.length) { pagina++; renderStock(); } }
function paginaAnterior() { if (pagina > 1) { pagina--; renderStock(); } }

function filtrarInventario() { 
    const txt = document.getElementById('buscador-admin').value.toLowerCase(); 
    pFiltrados = txt === "" ? [...pTotales] : pTotales.filter(p => p.nombre.toLowerCase().includes(txt)); 
    pagina = 1; renderStock(); 
}

function validarLetras(input) { input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9-]/g, ''); }
function validarNumeros(input) { input.value = input.value.replace(/[^0-9]/g, ''); }

const procesarImg = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image(); img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        }; reader.readAsDataURL(file);
    });
};

// === FIX 4: CONFIRMACIÓN Y MANEJO DE FOTO AL EDITAR ===
async function ejecutarGuardadoFinal(payload, base64Images, btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...'; 
    btn.disabled = true;

    try {
        let url = `${API}/productos`; let metodo = 'POST';
        if (idProductoEditando !== null) { url = `${API}/productos/${idProductoEditando}`; metodo = 'PUT'; }

        if (base64Images.length > 0) payload.imagen_url = JSON.stringify(base64Images);

        const res = await fetchSeguro(url, { 
            method: metodo, 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });

        if(res.ok) { 
            showCustomAlert(idProductoEditando ? "¡Producto actualizado!" : "¡Producto creado!", "success", false); 
            limpiarFormularioAdmin(); 
            // === FIX 5: ROMPER CACHÉ AL ACTUALIZAR LA LISTA ===
            const resI = await fetchSeguro(`${API}/productos?t=`+new Date().getTime(), {cache:'no-store', headers: {'Cache-Control': 'no-cache'}}); 
            pTotales = await resI.json(); 
            pFiltrados = [...pTotales]; 
            renderStock(); 
        } else { 
            showCustomAlert("Error al guardar.", "error", false); 
            btn.innerHTML = idProductoEditando ? '<i class="fas fa-sync-alt"></i> Actualizar Publicación' : '<i class="fas fa-plus"></i> Guardar Publicación'; 
            btn.disabled = false; 
        }
    } catch(e) { 
        showCustomAlert("Error de conexión.", "error", false); 
        btn.innerHTML = idProductoEditando ? '<i class="fas fa-sync-alt"></i> Actualizar Publicación' : '<i class="fas fa-plus"></i> Guardar Publicación'; 
        btn.disabled = false; 
    }
}

async function crearOActualizarProducto(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-crear-producto');
    const nombre = document.getElementById('add-nombre').value;
    const categoria = document.getElementById('add-categoria').value;
    const tarj = document.getElementById('add-precio-tarj').value;
    const efvo = document.getElementById('add-precio-efvo').value;
    const desc = document.getElementById('add-descripcion').value;
    const esUnico = document.getElementById('chk-unico').checked;
    const imgInput = document.getElementById('add-img');
    
    const codigoModelo = document.getElementById('add-codigo-modelo').value.trim().toUpperCase();
    const colorHex = document.getElementById('add-color-hex').value;
    const colorNombre = document.getElementById('add-color-nombre').value.trim();

    if (!nombre || !categoria || !tarj || !efvo) { 
        return showCustomAlert("Por favor completa los campos obligatorios.", "error", false); 
    }

    let inventarioFinal = {};
    if (esUnico) {
        const stockU = parseInt(document.getElementById('add-stock-unico').value) || 0;
        inventarioFinal['ÚNICO'] = stockU;
    } else {
        const nombresT = document.querySelectorAll('.builder-talle-nombre');
        const cantsT = document.querySelectorAll('.builder-talle-cant');
        for(let i=0; i<nombresT.length; i++){
            const n = nombresT[i].value.trim().toUpperCase();
            const c = parseInt(cantsT[i].value) || 0;
            if(n && c > 0) inventarioFinal[n] = c;
        }
    }

    const base64Images = []; 
    if (imgInput.files && imgInput.files.length > 0) { 
        const filesToProcess = Array.from(imgInput.files).slice(0, 5); 
        for (let file of filesToProcess) { base64Images.push(await procesarImg(file)); } 
    }
    
    const payload = { 
        nombre, 
        categoria, 
        tarjeta: tarj, 
        efectivo: efvo, 
        descripcion: desc, 
        inventario_talles: inventarioFinal,
        codigo_modelo: codigoModelo,
        color_hex: colorHex,
        color_nombre: colorNombre
    };

    if (idProductoEditando !== null) {
        showCustomConfirm('¿Seguro que querés guardar los cambios de esta prenda?', async () => {
            await ejecutarGuardadoFinal(payload, base64Images, btn);
        }, "Guardar Cambios");
    } else {
        await ejecutarGuardadoFinal(payload, base64Images, btn);
    }
}

async function cargarCategorias() {
    try {
        const res = await fetchSeguro(`${API}/categorias`);
        if(res.ok) {
            categoriasGlobal = await res.json();
            renderCategorias(); actualizarSelectCategorias();
        }
    } catch(e) {}
}

function actualizarSelectCategorias() {
    const select = document.getElementById('add-categoria');
    if(categoriasGlobal.length === 0) select.innerHTML = '<option value="" disabled selected>No hay categorías</option>';
    else select.innerHTML = '<option value="" disabled selected>Categorías...</option>' + categoriasGlobal.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

function renderCategorias() {
    const inicio = (cPagina - 1) * cPorPagina;
    const items = categoriasGlobal.slice(inicio, inicio + cPorPagina);
    const tbody = document.getElementById('body-categorias');
    if(categoriasGlobal.length === 0) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:gray; padding:20px;">Aún no hay categorías creadas.</td></tr>';
    else tbody.innerHTML = items.map(c => `<tr><td>#${c.id}</td><td style="font-weight:bold; text-transform:capitalize;">${c.nombre}</td><td style="text-align: center;"><button class="btn-secundario" onclick="eliminarCategoria(${c.id})"><i class="fas fa-trash-alt"></i> Borrar</button></td></tr>`).join('');
    
    if (document.getElementById('pagi-info-cat')) document.getElementById('pagi-info-cat').innerText = `Página ${cPagina}`;
    if (document.getElementById('pagi-anterior-cat')) document.getElementById('pagi-anterior-cat').disabled = cPagina === 1;
    if (document.getElementById('pagi-siguiente-cat')) document.getElementById('pagi-siguiente-cat').disabled = inicio + cPorPagina >= categoriasGlobal.length;
}

function paginaAnteriorCat() { if (cPagina > 1) { cPagina--; renderCategorias(); } }
function paginaSiguienteCat() { if ((cPagina * cPorPagina) < categoriasGlobal.length) { cPagina++; renderCategorias(); } }

async function agregarCategoria(e) {
    e.preventDefault();
    const inputNombre = document.getElementById('add-nombre-categoria');
    const nombre = inputNombre.value.trim();
    const btn = document.getElementById('btn-submit-categoria');
    if (!nombre) return;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
    try {
        const res = await fetchSeguro(`${API}/categorias`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({nombre}) });
        if(res.ok) { inputNombre.value = ''; showCustomAlert('Categoría añadida', 'success'); cargarCategorias(); } 
        else { showCustomAlert('La categoría ya existe', 'error'); }
    } catch(e) { showCustomAlert('Error de conexión', 'error'); }
    btn.innerHTML = '<i class="fas fa-plus"></i> Añadir'; btn.disabled = false;
}

function eliminarCategoria(id) {
    showCustomConfirm('¿Borrar categoría?', async () => {
        try { await fetchSeguro(`${API}/categorias/${id}`, {method:'DELETE'}); cargarCategorias(); } catch(e) {}
    });
}

function renderPedidos() {
    const inicio = (vPagina - 1) * vPorPagina; const items = vTotales.slice(inicio, inicio + vPorPagina);
    const tbodyVentas = document.getElementById('body-pedidos');

    if(vTotales.length === 0) {
        tbodyVentas.innerHTML = '<tr><td colspan="6" style="text-align:center; color:gray;">Aún no hay pedidos registrados.</td></tr>';
    } else {
        tbodyVentas.innerHTML = items.map(v => {
            const fecha = new Date(v.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
            let detalleTxt = '<span style="color:#e74c3c;">Sin detalle</span>';
            if (v.detalles && v.detalles.length > 0) { detalleTxt = v.detalles.map(d => `<b>${d.cantidad}x</b> ${d.nombre_producto} (Talle: ${d.talle})`).join('<br>'); }
            return `
            <tr>
                <td>#${v.id}</td>
                <td><strong>${fecha}</strong></td>
                <td><div style="font-weight:600;">${v.cliente_nombre} ${v.cliente_apellido}</div><small style="color:gray;">${v.cliente_email} / ${v.cliente_telefono}</small></td>
                <td>${detalleTxt}</td>
                <td style="color:#27ae60; font-weight:bold;">$${v.total}</td>
                <td style="text-align: center;"><button class="btn-secundario" onclick="eliminarPedido(${v.id})"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`;
        }).join('');
    }
    
    document.getElementById('pagi-info-pedidos').innerText = `Página ${vPagina}`; 
    document.getElementById('pagi-anterior-pedidos').disabled = vPagina === 1; 
    document.getElementById('pagi-siguiente-pedidos').disabled = inicio + vPorPagina >= vTotales.length;
}

function completarPedido(id) {
    showCustomConfirm('¿Seguro que querés marcar este pedido como realizado? Se actualizará el stock.', async () => {
        try {
            const res = await fetchSeguro(`${API}/ventas/${id}/completar`, { method: 'PATCH' });
            if(res.ok) { showCustomAlert("Pedido completado", "success", false); ventasDataGlobal = await (await fetchSeguro(`${API}/ventas`)).json(); vTotales = [...ventasDataGlobal]; renderPedidos(); generarEstadisticasMensuales(); } 
            else { showCustomAlert("Error al actualizar el pedido.", "error", false); }
        } catch (error) { showCustomAlert("Error de conexión.", "error", false); }
    }, "Sí");
}

function eliminarPedido(id) {
    showCustomConfirm('¿Seguro que querés borrar este pedido de la base de datos? Es una acción definitiva.', async () => {
        try {
            const res = await fetchSeguro(`${API}/ventas/${id}`, { method: 'DELETE' });
            if(res.ok) { showCustomAlert("Pedido eliminado", "success", false); ventasDataGlobal = await (await fetchSeguro(`${API}/ventas`)).json(); vTotales = [...ventasDataGlobal]; renderPedidos(); generarEstadisticasMensuales(); } 
            else { showCustomAlert("Error al eliminar el pedido.", "error", false); }
        } catch (error) { showCustomAlert("Error de conexión.", "error", false); }
    }, "Sí, borrar");
}

function paginaSiguientePedidos() { const inicio = (vPagina - 1) * vPorPagina; if (inicio + vPorPagina < vTotales.length) { vPagina++; renderPedidos(); } }
function paginaAnteriorPedidos() { if (vPagina > 1) { vPagina--; renderPedidos(); } }

function generarEstadisticasMensuales() {
    const statsAgrupadas = {};
    const mesesStr = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    ventasDataGlobal.forEach(v => {
        const f = new Date(v.fecha_creacion);
        const llaveMes = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
        
        if(!statsAgrupadas[llaveMes]) { statsAgrupadas[llaveMes] = { mesAno: llaveMes, mesNombre: `${mesesStr[f.getMonth()]} ${f.getFullYear()}`, total: 0, cantidad: 0 }; }
        statsAgrupadas[llaveMes].total += parseFloat(v.total); statsAgrupadas[llaveMes].cantidad += 1;
    });

    const tbodyStats = document.getElementById('body-meses');
    tbodyStats.innerHTML = Object.values(statsAgrupadas).sort((a,b) => b.mesAno.localeCompare(a.mesAno)).map(m => `<tr><td><b>${m.mesNombre}</b></td><td>${m.cantidad} pedidos</td><td style="color:#27ae60; font-weight:bold; font-size:1.1rem;">$${m.total.toLocaleString('es-AR')}</td></tr>`).join('');
}

async function cargarBanners() {
    const tbody = document.getElementById('body-banners');
    try {
        const res = await fetchSeguro(`${API}/banners`);
        if(res.ok) {
            const banners = await res.json();
            if(banners.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:gray;">Aún no has subido ninguna foto al carrusel.</td></tr>'; return; }
            tbody.innerHTML = banners.map(b => `<tr><td><img src="${b.imagen_url}" style="height:60px; border-radius:4px; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></td><td>---</td><td>---</td><td style="text-align: center;"><button class="btn-secundario" onclick="eliminarBanner(${b.id})"><i class="fas fa-trash-alt"></i> Borrar</button></td></tr>`).join('');
        }
    } catch (err) { console.error(err); }
}

async function agregarBanner(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-banner');
    const imgInput = document.getElementById('add-banner-file');
    if (!imgInput.files || imgInput.files.length === 0) { return showCustomAlert("Selecciona una foto primero.", "error", false); }

    const file = imgInput.files[0]; const imgBase64 = await procesarImg(file);
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/banners`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ imagen_url: imgBase64 }) });
        if(res.ok) { imgInput.value = ''; showCustomAlert("¡Foto agregada al carrusel!", "success", false); cargarBanners(); } 
        else { showCustomAlert("Error al subir.", "error", false); }
    } catch (error) { showCustomAlert("Error de conexión.", "error", false); }
    btn.innerHTML = '<i class="fas fa-plus"></i> Añadir Foto'; btn.disabled = false;
}

function eliminarBanner(id) {
    showCustomConfirm('¿Borrar esta foto del carrusel?', async () => {
        try {
            await fetchSeguro(`${API}/banners/${id}`, { method: 'DELETE' });
            showCustomAlert("Foto eliminada", "success", false);
            cargarBanners();
        } catch (error) { showCustomAlert("Error al eliminar", "error", false); }
    }, "Sí, borrar");
}

async function cargarCupones() {
    const tbody = document.getElementById('body-cupones');
    try {
        const res = await fetchSeguro(`${API}/cupones`);
        if(res.ok) {
            const cupones = await res.json();
            if(cupones.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:gray;">Aún no has creado ningún cupón de descuento.</td></tr>'; return; }
            tbody.innerHTML = cupones.map(c => `<tr><td><strong>${c.codigo}</strong></td><td style="font-weight:bold; color:var(--success);">${c.descuento_porcentaje}%</td><td>${c.usos_disponibles > 0 ? `<b>${c.usos_disponibles}</b> usos rest.` : '<span style="color:red;">Agotado</span>'}</td><td style="text-align: center;"><button class="btn-secundario" onclick="eliminarCupon(${c.id})"><i class="fas fa-trash-alt"></i></button></td></tr>`).join('');
        }
    } catch (err) { console.error(err); }
}

async function agregarCupon(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-cupon');
    const codigo = document.getElementById('add-cupon-codigo').value;
    const desc = document.getElementById('add-cupon-porcentaje').value;
    const usos = document.getElementById('add-cupon-usos').value;

    if (!codigo || !desc || !usos) { return showCustomAlert("Completa todos los campos del cupón.", "error", false); }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/cupones`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, descuento_porcentaje: desc, usos_disponibles: usos }) });
        if(res.ok) { document.getElementById('add-cupon-codigo').value = ''; document.getElementById('add-cupon-porcentaje').value = ''; document.getElementById('add-cupon-usos').value = ''; showCustomAlert("¡Cupón creado!", "success", false); cargarCupones(); } 
        else { showCustomAlert("Error al crear. Ese código podría ya existir.", "error", false); }
    } catch (error) { showCustomAlert("Error de conexión.", "error", false); }
    btn.innerHTML = 'Crear'; btn.disabled = false;
}

function eliminarCupon(id) {
    showCustomConfirm('¿Eliminar este cupón para siempre?', async () => {
        try {
            await fetchSeguro(`${API}/cupones/${id}`, { method: 'DELETE' });
            showCustomAlert("Cupón eliminado", "success", false);
            cargarCupones();
        } catch (error) { showCustomAlert("Error al eliminar", "error", false); }
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
                if (v.detalles) { v.detalles.forEach(item => { if (item.producto_id === p.id) { cantVendida += parseInt(item.cantidad) || 0; } }); }

                if (dia <= 7) v1 += cantVendida; else if (dia <= 14) v2 += cantVendida; else if (dia <= 21) v3 += cantVendida; else v4 += cantVendida;
            }
        });

        let ventaMensual = v1 + v2 + v3 + v4;
        let stockActual = 0;
        if (p.inventario_talles && typeof p.inventario_talles === 'object') { Object.values(p.inventario_talles).forEach(c => stockActual += parseInt(c) || 0); }

        csvContent += `${nombreLimpio},${v1},,,,${v2},,,,${v3},,,,${v4},,,${stockActual},${ventaMensual}\n`; 
    }); 
    
    const encodedUri = encodeURI(csvContent); 
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Control_Mensual_RH.csv"); 
    document.body.appendChild(link); link.click(); document.body.removeChild(link); 
}

const addProductForm = document.getElementById('add-product-form');
if (addProductForm) { addProductForm.addEventListener('submit', crearOActualizarProducto); }