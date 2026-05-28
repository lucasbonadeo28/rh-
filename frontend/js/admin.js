const API = '/api'; 
        
let pTotales = []; 
let pFiltrados = []; 
let pagina = 1; 
const pPorPagina = 10;
        
let vTotales = []; 
let vPagina = 1; 
const vPorPagina = 10;
let ventasDataGlobal = []; 

let categoriasGlobal = [];
let cPagina = 1;
const cPorPagina = 10;
let idProductoEditando = null; 

let imagenesCargadas = [];

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
    const circuloActual = document.getElementById('circulo-color-actual');
    if(circuloActual) circuloActual.style.backgroundColor = hex.value;
}

function mostrarToastAdmin(mensaje, tipo = 'success') {
    let container = document.getElementById('toast-container-admin');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-admin';
        container.style.cssText = 'position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `background: ${tipo === 'success' ? 'rgba(39, 174, 96, 0.95)' : 'rgba(231, 76, 60, 0.95)'}; color: white; padding: 16px 30px; border-radius: 12px; font-size: 0.95rem; font-weight: 600; box-shadow: 0 15px 40px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 12px; font-family: 'Montserrat', sans-serif; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); opacity: 0; transform: translateY(40px) scale(0.9);`;
    toast.innerHTML = tipo === 'success' ? `<i class="fas fa-check-circle"></i> ${mensaje}` : `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0) scale(1)'; }, 10);
    setTimeout(() => { 
        toast.style.opacity = '0'; toast.style.transform = 'translateY(20px) scale(0.9)';
        setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 400);
    }, 3000); 
}

function showCustomAlert(msg, type = 'error', reload = false) {
    mostrarToastAdmin(msg, type);
    if(reload) setTimeout(() => location.reload(), 1500);
}

function showCustomConfirm(msg, callback, btnText = "Sí") {
    let modal = document.getElementById('dinamic-confirm-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dinamic-confirm-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 99999; display: none; justify-content: center; align-items: center; padding: 20px; opacity: 0; transition: opacity 0.3s; font-family: "Montserrat", sans-serif;';
        modal.innerHTML = `
            <div style="background: #fff; padding: 30px; border-radius: 16px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transform: scale(0.9); transition: transform 0.3s;" id="dinamic-confirm-box">
                <i class="fas fa-question-circle" style="font-size: 3.5rem; color: #f39c12; margin-bottom: 15px;"></i>
                <h3 style="margin: 0 0 20px 0; color: #111; font-size: 1.1rem; line-height: 1.4;" id="dinamic-confirm-text"></h3>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="dinamic-btn-cancel" style="background: #f5f5f5; border: 1px solid #ddd; color: #555; padding: 12px 20px; border-radius: 8px; font-weight: 800; cursor: pointer; width: 100%; transition: 0.3s;">Cancelar</button>
                    <button id="dinamic-btn-confirm" style="background: #27ae60; border: none; color: #fff; padding: 12px 20px; border-radius: 8px; font-weight: 800; cursor: pointer; width: 100%; transition: 0.3s;"></button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('dinamic-btn-cancel').onclick = () => {
            modal.style.opacity = '0';
            document.getElementById('dinamic-confirm-box').style.transform = 'scale(0.9)';
            setTimeout(() => modal.style.display = 'none', 300);
        };
    }
    
    document.getElementById('dinamic-confirm-text').innerText = msg;
    const btnConf = document.getElementById('dinamic-btn-confirm');
    btnConf.innerText = btnText;
    
    const newBtnConf = btnConf.cloneNode(true);
    btnConf.parentNode.replaceChild(newBtnConf, btnConf);
    
    newBtnConf.onclick = () => {
        modal.style.opacity = '0';
        document.getElementById('dinamic-confirm-box').style.transform = 'scale(0.9)';
        setTimeout(() => { modal.style.display = 'none'; callback(); }, 300);
    };

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        document.getElementById('dinamic-confirm-box').style.transform = 'scale(1)';
    }, 10);
}

function renderizarMiniaturas() {
    let container = document.getElementById('preview-imagenes-container');
    const labelImg = document.getElementById('label-add-img');
    
    if (!container && labelImg) {
        container = document.createElement('div');
        container.id = 'preview-imagenes-container';
        container.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; width: 100%;';
        labelImg.parentNode.insertBefore(container, labelImg.nextSibling);
    }
    if(!container) return;
    
    container.innerHTML = '';
    
    imagenesCargadas.forEach((imgSrc, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 8px; border: 1px solid #ddd; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); background: #fff;';
        
        let finalSrc = imgSrc;
        if (finalSrc && !finalSrc.startsWith('data:') && !finalSrc.includes('via.placeholder')) {
            finalSrc += (finalSrc.includes('?') ? '&' : '?') + 'v=' + new Date().getTime();
        }

        div.innerHTML = `
            <img src="${finalSrc}" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="eliminarMiniatura(${index})" style="position: absolute; top: 4px; right: 4px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: 0.2s;"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    });

    if (labelImg) {
        if (imagenesCargadas.length > 0) {
            labelImg.innerHTML = `<i class="fas fa-camera"></i> <span style="font-weight:700;">Añadir más fotos (${imagenesCargadas.length}/5)</span>`;
            labelImg.classList.add('selected');
        } else {
            labelImg.innerHTML = `<i class="fas fa-camera"></i> <span>Abrir Galería</span>`;
            labelImg.classList.remove('selected');
        }
    }
}

window.eliminarMiniatura = function(index) {
    imagenesCargadas.splice(index, 1);
    renderizarMiniaturas();
};

function renderizarVariantesAdmin(variantes, currentId) {
    let container = document.getElementById('admin-variantes-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-variantes-container';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center; margin-bottom: 25px; padding: 20px; border: 2px dashed #ccc; border-radius: 12px; background: #fafafa; width: 100%; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02);';
        
        const chkUnico = document.getElementById('chk-unico');
        if (chkUnico) {
            let targetNode = chkUnico.closest('div[style*="border"]') || chkUnico.parentElement.parentElement.parentElement;
            if(targetNode && targetNode.parentNode) {
                targetNode.parentNode.insertBefore(container, targetNode);
            }
        }
    }

    container.style.display = 'flex';
    
    let html = '<span style="font-size:0.85rem; font-weight:800; color:#555; text-transform:uppercase; margin-bottom:15px; letter-spacing:1px;"><i class="fas fa-palette"></i> Colores de este modelo</span>';
    html += '<div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:center;">';
    
    if (!variantes || variantes.length === 0) {
        const hexActual = document.getElementById('add-color-hex') ? document.getElementById('add-color-hex').value : '#d4ba92';
        html += `<div id="circulo-color-actual" title="Color actual" style="width: 45px; height: 45px; border-radius: 50%; background-color: ${hexActual}; border: 3px solid #111; transform: scale(1.15); box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: background-color 0.3s;"></div>`;
        html += `<div title="Añadir nuevo color" onclick="mostrarToastAdmin('Guardá esta prenda primero para poder agregarle más colores.', 'error')" style="width: 45px; height: 45px; border-radius: 50%; background-color: #fff; display:flex; align-items:center; justify-content:center; font-size:1.4rem; cursor: pointer; transition: all 0.3s ease; margin-left: 10px; border: 2px dashed #999; color: #777; opacity: 0.8;"><i class="fas fa-plus"></i></div>`;
        
    } else {
        variantes.forEach(v => {
            const isAct = v.id === currentId;
            const border = isAct ? 'border: 3px solid #111; transform: scale(1.15); box-shadow: 0 4px 10px rgba(0,0,0,0.2);' : 'border: 1px solid #aaa; opacity: 0.6;';
            const colorHex = v.color_hex || '#d4ba92';
            const extraId = isAct ? 'id="circulo-color-actual"' : '';
            html += `<div ${extraId} title="Editar: ${v.color_nombre || v.nombre}" onclick="editarProducto(${v.id})" style="width: 45px; height: 45px; border-radius: 50%; background-color: ${colorHex}; cursor: pointer; transition: all 0.3s ease; ${border}"></div>`;
        });

        const isNewAct = currentId === null;
        const borderNew = isNewAct ? 'border: 3px solid #27ae60; transform: scale(1.15); box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3); color: #27ae60;' : 'border: 2px dashed #999; color: #777; opacity: 0.8;';
        
        if (isNewAct) {
            const hexActual = document.getElementById('add-color-hex') ? document.getElementById('add-color-hex').value : '#d4ba92';
            html += `<div id="circulo-color-actual" title="Color actual" style="width: 45px; height: 45px; border-radius: 50%; background-color: ${hexActual}; border: 3px solid #27ae60; transform: scale(1.15); box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3); margin-left:10px; transition: background-color 0.3s;"></div>`;
        } else {
            html += `<div title="Añadir nuevo color" onclick="prepararNuevaVariante('${variantes[0].codigo_modelo || variantes[0].nombre}')" style="width: 45px; height: 45px; border-radius: 50%; background-color: #fff; display:flex; align-items:center; justify-content:center; font-size:1.4rem; cursor: pointer; transition: all 0.3s ease; margin-left: 10px; ${borderNew}"><i class="fas fa-plus"></i></div>`;
        }
    }
    
    html += '</div>';
    
    if(currentId === null && variantes && variantes.length > 0) {
        html += '<div style="background:#eafaf1; padding:10px 20px; border-radius:8px; border-left: 4px solid #27ae60; margin-top: 15px; width: 100%; text-align: center;">';
        html += '<p style="color:#27ae60; font-size:0.85rem; margin:0; font-weight:700;"><i class="fas fa-info-circle"></i> Creando nuevo color. Solo elegí las fotos, escribí el nombre del color y poné el stock.</p>';
        html += '</div>';
    }

    container.innerHTML = html;
}

window.prepararNuevaVariante = function(codigoModelo) {
    idProductoEditando = null;
    
    document.getElementById('add-color-hex').value = '#d4ba92';
    document.getElementById('add-color-nombre').value = '';
    
    const chkUnico = document.getElementById('chk-unico');
    if(chkUnico) { chkUnico.checked = false; toggleTalleUnico(); }
    
    const containerTalles = document.getElementById('talles-builder-ui');
    if(containerTalles) {
        containerTalles.innerHTML = '';
        agregarTalleUI('S', 0); agregarTalleUI('M', 0); agregarTalleUI('L', 0);
    }
    
    imagenesCargadas = [];
    renderizarMiniaturas();
    const imgInput = document.getElementById('add-img');
    if(imgInput) imgInput.value = '';

    const btn = document.getElementById('btn-crear-producto');
    if(btn) {
        btn.innerHTML = '<i class="fas fa-plus"></i> Guardar Nuevo Color';
        btn.style.backgroundColor = '#27ae60';
        btn.classList.remove('btn-procesando'); // Por las dudas
    }
    
    const variantes = pTotales.filter(p => (p.codigo_modelo || p.nombre) === codigoModelo);
    renderizarVariantesAdmin(variantes, null);
};

window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', function(e) {
        if(e.target && e.target.id === 'add-color-nombre') {
            detectarColor(e.target.value);
        }
        if(e.target && e.target.id === 'add-color-hex') {
            const circuloActual = document.getElementById('circulo-color-actual');
            if(circuloActual) circuloActual.style.backgroundColor = e.target.value;
        }
    });

    const imgInput = document.getElementById('add-img');
    if (imgInput) {
        imgInput.addEventListener('change', async function() {
            if (this.files && this.files.length > 0) {
                const espaciosDisponibles = 5 - imagenesCargadas.length;
                if (espaciosDisponibles <= 0) {
                    mostrarToastAdmin("Máximo 5 fotos por prenda.", "error");
                    this.value = '';
                    return;
                }
                
                const filesToProcess = Array.from(this.files).slice(0, espaciosDisponibles);
                const label = document.getElementById('label-add-img');
                if(label) label.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Procesando...</span>';

                for (let file of filesToProcess) {
                    const b64 = await procesarImg(file);
                    imagenesCargadas.push(b64);
                }
                
                renderizarMiniaturas();
                this.value = ''; 
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.innerText && e.target.innerText.toLowerCase().includes('eliminar fotos actuales')) {
            e.preventDefault();
            imagenesCargadas = [];
            renderizarMiniaturas();
            mostrarToastAdmin("Todas las fotos removidas", "success");
        }
    });

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
        passInput.type = 'text'; eyeIcon.classList.remove('fa-eye'); eyeIcon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password'; eyeIcon.classList.remove('fa-eye-slash'); eyeIcon.classList.add('fa-eye');
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
                mostrarToastAdmin("Acceso concedido", "success");
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
    renderizarVariantesAdmin([], null);
};

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

function initTallesBuilder() {
    const container = document.getElementById('talles-builder-ui');
    if(!container) return;
    if(container.children.length === 0) {
        agregarTalleUI('S', 0); agregarTalleUI('M', 0); agregarTalleUI('L', 0);
    }
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
    const builderBox = document.getElementById('talles-builder-ui');
    const btnAddTalle = document.getElementById('btn-add-talle-ui');
    const unicoBox = document.getElementById('talle-unico-container');

    if(esUnico) {
        if(builderBox) builderBox.style.display = 'none';
        if(btnAddTalle) btnAddTalle.style.display = 'none';
        if(unicoBox) unicoBox.style.display = 'block';
    } else {
        if(builderBox) builderBox.style.display = 'flex';
        if(btnAddTalle) btnAddTalle.style.display = 'block';
        if(unicoBox) unicoBox.style.display = 'none';
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
                <div style="display:inline-flex; align-items:center; gap:4px; background:#f5f5f5; padding:6px 10px; border-radius:6px; border:1px solid #ddd; margin-right:5px; margin-bottom: 5px;">
                    <span style="font-size:0.85rem; font-weight:800; color:#111;">${t}:</span>
                    <input type="number" class="talle-input-fila-${p.id}" data-talle="${t}" value="${cant}" min="0" style="width:50px; padding:4px; text-align:center; border:1px solid #ccc; border-radius:4px; font-weight:bold; color:#111;">
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
            
            <td class="td-talles-horizontal">
                <div style="display: flex; flex-wrap: nowrap; gap: 4px; align-items: center; min-width: max-content; padding-bottom: 4px;">
                    ${tallesHtml}
                </div>
                <small style="color:${totalStockPrenda > 0 ? '#27ae60' : '#e74c3c'}; font-weight:bold; display:block; margin-top:6px;">Stock Total: ${totalStockPrenda}</small>
            </td>

            <td class="td-botones-horizontal">
                <div style="display: flex; flex-wrap: nowrap; justify-content: center; gap: 8px;">
                    <button style="background: #27ae60; color: white; border: none; padding: 10px 14px; border-radius: 4px; cursor: pointer; font-size: 1.1rem;" onclick="guardarEdicionFila(${p.id}, event)" title="Guardar Stock Rápido"><i class="fas fa-check"></i></button>
                    <button style="background: #f39c12; color: white; border: none; padding: 10px 14px; border-radius: 4px; cursor: pointer; font-size: 1.1rem;" onclick="editarProducto(${p.id})" title="Editar Detalles Completos"><i class="fas fa-pencil-alt"></i></button>
                    <button style="background: #ff6b6b; color: white; border: none; padding: 10px 14px; border-radius: 4px; cursor: pointer; font-size: 1.1rem;" onclick="borrarP(${p.id})" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </div>
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
            return mostrarToastAdmin("No hay talles. Entrá a 'Editar Prenda' para agregarlos.", "error");
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
            mostrarToastAdmin("¡Stock y precios guardados!", "success"); 
            const resI = await fetchSeguro(`${API}/productos?t=` + new Date().getTime(), { cache: 'no-store' }); 
            pTotales = await resI.json(); 
            pFiltrados = [...pTotales]; 
            renderStock(); 
        } else { 
            mostrarToastAdmin("Error al actualizar el producto.", "error"); 
            btn.innerHTML = ogHtml; 
            btn.disabled = false; 
        }
    } catch(e) { 
        mostrarToastAdmin("Error de conexión.", "error"); 
        btn.innerHTML = ogHtml; 
        btn.disabled = false; 
    }
}

function resetFormularioAdmin() {
    if(document.getElementById('add-nombre')) document.getElementById('add-nombre').value = '';
    if(document.getElementById('add-categoria')) document.getElementById('add-categoria').value = '';
    if(document.getElementById('add-precio-tarj')) document.getElementById('add-precio-tarj').value = '';
    if(document.getElementById('add-precio-efvo')) document.getElementById('add-precio-efvo').value = '';
    if(document.getElementById('add-descripcion')) document.getElementById('add-descripcion').value = '';
    if(document.getElementById('add-codigo-modelo')) document.getElementById('add-codigo-modelo').value = '';
    if(document.getElementById('add-color-hex')) document.getElementById('add-color-hex').value = '#d4ba92';
    if(document.getElementById('add-color-nombre')) document.getElementById('add-color-nombre').value = '';

    const chkUnico = document.getElementById('chk-unico');
    if(chkUnico) { chkUnico.checked = false; toggleTalleUnico(); }
    
    const containerTalles = document.getElementById('talles-builder-ui');
    if(containerTalles) {
        containerTalles.innerHTML = '';
        agregarTalleUI('S', 0); agregarTalleUI('M', 0); agregarTalleUI('L', 0);
    }
    
    imagenesCargadas = [];
    renderizarMiniaturas();
    renderizarVariantesAdmin([], null);
    
    const imgInput = document.getElementById('add-img');
    if(imgInput) imgInput.value = '';

    idProductoEditando = null;
    const btn = document.getElementById('btn-crear-producto');
    if(btn) {
        btn.classList.remove('btn-procesando');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Publicación';
        btn.style.background = '#111';
    }
    const titulo = document.getElementById('titulo-form-admin');
    if(titulo) titulo.innerText = 'Cargar Nueva Prenda';
}

function editarProducto(id) {
    const producto = pTotales.find(p => p.id === id);
    if (!producto) {
        mostrarToastAdmin("Error al cargar producto", "error");
        return;
    }

    idProductoEditando = id; 

    document.getElementById('add-nombre').value = producto.nombre || '';
    document.getElementById('add-precio-tarj').value = producto.precio_tarjeta || '';
    document.getElementById('add-precio-efvo').value = producto.precio_efectivo || '';
    document.getElementById('add-descripcion').value = producto.descripcion || '';
    document.getElementById('add-codigo-modelo').value = producto.codigo_modelo || '';
    document.getElementById('add-categoria').value = producto.categoria || '';
    
    if(producto.color_hex) document.getElementById('add-color-hex').value = producto.color_hex;
    if(producto.color_nombre) document.getElementById('add-color-nombre').value = producto.color_nombre;
    
    const chkUnico = document.getElementById('chk-unico');
    const containerTalles = document.getElementById('talles-builder-ui');
    if(containerTalles) containerTalles.innerHTML = '';
    
    if (producto.inventario_talles && producto.inventario_talles['ÚNICO'] !== undefined) {
        if(chkUnico) chkUnico.checked = true;
        toggleTalleUnico();
        const inUnico = document.getElementById('add-stock-unico');
        if(inUnico) inUnico.value = producto.inventario_talles['ÚNICO'];
    } else {
        if(chkUnico) chkUnico.checked = false;
        toggleTalleUnico();
        if (producto.inventario_talles) {
            Object.entries(producto.inventario_talles).forEach(([t, c]) => agregarTalleUI(t, c));
        }
    }

    imagenesCargadas = [];
    if (producto.imagen_url) {
        try {
            const arr = JSON.parse(producto.imagen_url);
            imagenesCargadas = Array.isArray(arr) ? arr : [producto.imagen_url];
        } catch(e) {
            imagenesCargadas = [producto.imagen_url];
        }
    }
    renderizarMiniaturas();
    
    const codigoModeloSeguro = producto.codigo_modelo || producto.nombre;
    const variantes = pTotales.filter(p => (p.codigo_modelo || p.nombre) === codigoModeloSeguro);
    renderizarVariantesAdmin(variantes, id);

    const btn = document.getElementById('btn-crear-producto');
    if(btn) {
        btn.classList.remove('btn-procesando');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Publicación';
        btn.style.backgroundColor = '#f39c12';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function borrarP(id) { 
    showCustomConfirm('¿Seguro que querés borrar este producto? Se eliminará de la base de datos.', async () => {
        try {
            const res = await fetchSeguro(`${API}/productos/${id}`, { method: 'DELETE' });
            if(res.ok) { 
                mostrarToastAdmin("Producto eliminado correctamente", "success"); 
                const resI = await fetchSeguro(`${API}/productos?t=`+new Date().getTime(), {cache:'no-store'}); 
                pTotales = await resI.json(); 
                pFiltrados = [...pTotales]; 
                renderStock(); 
            } else { 
                mostrarToastAdmin("Error al eliminar el producto.", "error"); 
            }
        } catch (error) { mostrarToastAdmin("Error de conexión.", "error"); }
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

async function ejecutarGuardadoFinal(payload, btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo al servidor...'; 
    btn.disabled = true;

    try {
        let url = `${API}/productos`; let metodo = 'POST';
        if (idProductoEditando !== null) { url = `${API}/productos/${idProductoEditando}`; metodo = 'PUT'; }

        const res = await fetchSeguro(url, { 
            method: metodo, 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });

        if(res.ok) { 
            mostrarToastAdmin(idProductoEditando ? "¡Exito! Producto actualizado." : "¡Exito! Producto guardado.", "success"); 
            resetFormularioAdmin(); 
            const resI = await fetchSeguro(`${API}/productos?t=`+new Date().getTime(), {cache:'no-store', headers: {'Cache-Control': 'no-cache'}}); 
            pTotales = await resI.json(); 
            pFiltrados = [...pTotales]; 
            renderStock(); 
        } else { 
            mostrarToastAdmin("Error al guardar.", "error"); 
            btn.classList.remove('btn-procesando');
            btn.innerHTML = idProductoEditando ? '<i class="fas fa-sync-alt"></i> Actualizar Publicación' : '<i class="fas fa-save"></i> Guardar Publicación'; 
            btn.disabled = false; 
        }
    } catch(e) { 
        mostrarToastAdmin("Error de conexión.", "error"); 
        btn.classList.remove('btn-procesando');
        btn.innerHTML = idProductoEditando ? '<i class="fas fa-sync-alt"></i> Actualizar Publicación' : '<i class="fas fa-save"></i> Guardar Publicación'; 
        btn.disabled = false; 
    }
}

async function urlABase64Forzado(url) {
    if (url.startsWith('data:image')) return url;
    
    const blobToBase64 = (blob) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });

    try {
        const res = await fetch(url, { cache: 'no-cache' });
        const blob = await res.blob();
        return await blobToBase64(blob);
    } catch (e) {
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
            const res = await fetch(proxyUrl, { cache: 'no-cache' });
            const blob = await res.blob();
            return await blobToBase64(blob);
        } catch (e2) {
            return url;
        }
    }
}

async function crearOActualizarProducto(e) {
    if(e) e.preventDefault();
    const btn = document.getElementById('btn-crear-producto');

    const nombre = document.getElementById('add-nombre') ? document.getElementById('add-nombre').value.trim() : '';
    const categoria = document.getElementById('add-categoria') ? document.getElementById('add-categoria').value : '';
    const tarj = document.getElementById('add-precio-tarj') ? document.getElementById('add-precio-tarj').value : '';
    const efvo = document.getElementById('add-precio-efvo') ? document.getElementById('add-precio-efvo').value : '';
    const desc = document.getElementById('add-descripcion') ? document.getElementById('add-descripcion').value.trim() : '';
    const codigoModelo = document.getElementById('add-codigo-modelo') ? document.getElementById('add-codigo-modelo').value.trim().toUpperCase() : '';
    const colorHex = document.getElementById('add-color-hex') ? document.getElementById('add-color-hex').value : '#d4ba92';
    const colorNombre = document.getElementById('add-color-nombre') ? document.getElementById('add-color-nombre').value.trim() : '';
    const chkUnico = document.getElementById('chk-unico');
    const esUnico = chkUnico ? chkUnico.checked : false;

    if (!nombre || !categoria || !tarj || !efvo) { 
        return mostrarToastAdmin("Por favor completa los campos obligatorios.", "error"); 
    }

    if (imagenesCargadas.length === 0) {
        return mostrarToastAdmin("Añadí al menos 1 foto.", "error");
    }

    let inventarioFinal = {};
    if (esUnico) {
        const inputStockU = document.getElementById('add-stock-unico');
        inventarioFinal['ÚNICO'] = inputStockU ? (parseInt(inputStockU.value) || 0) : 0;
    } else {
        const nombresT = document.querySelectorAll('.builder-talle-nombre');
        const cantsT = document.querySelectorAll('.builder-talle-cant');
        for(let i=0; i<nombresT.length; i++){
            const n = nombresT[i].value.trim().toUpperCase();
            const c = parseInt(cantsT[i].value) || 0;
            if(n && c > 0) inventarioFinal[n] = c;
        }
    }

    const payload = { 
        nombre, categoria, tarjeta: tarj, efectivo: efvo, descripcion: desc, 
        inventario_talles: inventarioFinal, codigo_modelo: codigoModelo, color_hex: colorHex, color_nombre: colorNombre,
        id: idProductoEditando
    };

    const accion = async () => {
        // Recién acá el botón se pone en modo procesando para no colgar la página antes de tiempo
        btn.classList.add('btn-procesando');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO FOTOS...';
        
        const imagenesFinales = [];
        let hayNuevas = imagenesCargadas.some(img => img.startsWith('data:image'));
        
        for (let i = 0; i < imagenesCargadas.length; i++) {
            let img = imagenesCargadas[i];
            if (!hayNuevas && i === 0) {
                img = await urlABase64Forzado(img);
            }
            imagenesFinales.push(img);
        }

        payload.imagen_url = JSON.stringify(imagenesFinales); 
        await ejecutarGuardadoFinal(payload, btn);
    };

    if (idProductoEditando !== null) {
        showCustomConfirm('¿Seguro que querés guardar los cambios?', accion, "Sí, actualizar");
    } else {
        showCustomConfirm('¿Seguro que querés publicar este color nuevo?', accion, "Sí, publicar");
    }
}

window.addEventListener('load', () => {
    const btnGuardar = document.getElementById('btn-crear-producto');
    if (btnGuardar) {
        const form = btnGuardar.closest('form');
        if (form) {
            form.addEventListener('submit', crearOActualizarProducto);
        } else {
            btnGuardar.addEventListener('click', crearOActualizarProducto);
        }
    }
});

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
    if(!select) return;
    if(categoriasGlobal.length === 0) select.innerHTML = '<option value="" disabled selected>No hay categorías</option>';
    else select.innerHTML = '<option value="" disabled selected>Categorías...</option>' + categoriasGlobal.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}

function renderCategorias() {
    const inicio = (cPagina - 1) * cPorPagina;
    const items = categoriasGlobal.slice(inicio, inicio + cPorPagina);
    const tbody = document.getElementById('body-categorias');
    if(!tbody) return;
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
        if(res.ok) { inputNombre.value = ''; mostrarToastAdmin('Categoría añadida', 'success'); cargarCategorias(); } 
        else { mostrarToastAdmin('La categoría ya existe', 'error'); }
    } catch(e) { mostrarToastAdmin('Error de conexión', 'error'); }
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
    if(!tbodyVentas) return;

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
    
    if(document.getElementById('pagi-info-pedidos')) document.getElementById('pagi-info-pedidos').innerText = `Página ${vPagina}`; 
    if(document.getElementById('pagi-anterior-pedidos')) document.getElementById('pagi-anterior-pedidos').disabled = vPagina === 1; 
    if(document.getElementById('pagi-siguiente-pedidos')) document.getElementById('pagi-siguiente-pedidos').disabled = inicio + vPorPagina >= vTotales.length;
}

function completarPedido(id) {
    showCustomConfirm('¿Seguro que querés marcar este pedido como realizado? Se actualizará el stock.', async () => {
        try {
            const res = await fetchSeguro(`${API}/ventas/${id}/completar`, { method: 'PATCH' });
            if(res.ok) { mostrarToastAdmin("Pedido completado", "success"); ventasDataGlobal = await (await fetchSeguro(`${API}/ventas`)).json(); vTotales = [...ventasDataGlobal]; renderPedidos(); generarEstadisticasMensuales(); } 
            else { mostrarToastAdmin("Error al actualizar el pedido.", "error"); }
        } catch (error) { mostrarToastAdmin("Error de conexión.", "error"); }
    }, "Sí");
}

function eliminarPedido(id) {
    showCustomConfirm('¿Seguro que querés borrar este pedido de la base de datos? Es una acción definitiva.', async () => {
        try {
            const res = await fetchSeguro(`${API}/ventas/${id}`, { method: 'DELETE' });
            if(res.ok) { mostrarToastAdmin("Pedido eliminado", "success"); ventasDataGlobal = await (await fetchSeguro(`${API}/ventas`)).json(); vTotales = [...ventasDataGlobal]; renderPedidos(); generarEstadisticasMensuales(); } 
            else { mostrarToastAdmin("Error al eliminar el pedido.", "error"); }
        } catch (error) { mostrarToastAdmin("Error de conexión.", "error"); }
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
        
        if(!statsAgrupadas[llaveMes]) { 
            statsAgrupadas[llaveMes] = { mesAno: llaveMes, mesNombre: `${mesesStr[f.getMonth()]} ${f.getFullYear()}`, total: 0, cantidad: 0, ventas: [] }; 
        }
        statsAgrupadas[llaveMes].total += parseFloat(v.total); 
        statsAgrupadas[llaveMes].cantidad += 1;
        statsAgrupadas[llaveMes].ventas.push(v);
    });

    const tbodyStats = document.getElementById('body-meses');
    if(tbodyStats) {
        tbodyStats.innerHTML = Object.values(statsAgrupadas).sort((a,b) => b.mesAno.localeCompare(a.mesAno)).map(m => {
            const rowId = `detalle-mes-${m.mesAno}`;
            return `
            <tr style="cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'" onclick="const f = document.getElementById('${rowId}'); f.style.display = f.style.display === 'none' ? 'table-row' : 'none'; const i = document.getElementById('icono-mes-${m.mesAno}'); i.style.transform = f.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)';">
                <td><b>${m.mesNombre}</b></td>
                <td>${m.cantidad} pedidos</td>
                <td style="color:#27ae60; font-weight:bold; font-size:1.1rem;">$${m.total.toLocaleString('es-AR')}</td>
                <td style="text-align: center; color: #888;"><i class="fas fa-chevron-down" id="icono-mes-${m.mesAno}" style="transition: 0.3s;"></i></td>
            </tr>
            <tr id="${rowId}" style="display: none; background: #fafafa;">
                <td colspan="4" style="padding: 15px 20px;">
                    <div style="background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <table style="width: 100%; min-width: auto !important; margin: 0; box-shadow: none;">
                            <thead style="background: #f0f0f0;">
                                <tr>
                                    <th style="padding: 10px; font-size: 0.75rem;">Fecha</th>
                                    <th style="padding: 10px; font-size: 0.75rem;">Cliente</th>
                                    <th style="padding: 10px; font-size: 0.75rem;">Productos Comprados</th>
                                    <th style="padding: 10px; font-size: 0.75rem;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ` + m.ventas.map(v => {
                                    const fVenta = new Date(v.fecha_creacion).toLocaleDateString('es-AR');
                                    let detalleProds = '<span style="color:#e74c3c; font-size:0.75rem;">Sin detalle</span>';
                                    if (v.detalles && v.detalles.length > 0) {
                                        detalleProds = v.detalles.map(d => `<b>${d.cantidad}x</b> ${d.nombre_producto} (Talle: ${d.talle})`).join('<br>');
                                    }
                                    return `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px; font-size: 0.85rem;">${fVenta}</td>
                                        <td style="padding: 10px; font-size: 0.85rem;"><b>${v.cliente_nombre} ${v.cliente_apellido}</b></td>
                                        <td style="padding: 10px; font-size: 0.8rem; color: #555; line-height: 1.3;">${detalleProds}</td>
                                        <td style="padding: 10px; font-size: 0.85rem; font-weight: bold; color: #27ae60;">$${v.total}</td>
                                    </tr>`;
                                }).join('') + `
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }
}

async function cargarBanners() {
    const tbody = document.getElementById('body-banners');
    if(!tbody) return;
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
    if (!imgInput.files || imgInput.files.length === 0) { return mostrarToastAdmin("Selecciona una foto primero.", "error"); }

    const file = imgInput.files[0]; const imgBase64 = await procesarImg(file);
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/banners`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ imagen_url: imgBase64 }) });
        if(res.ok) { imgInput.value = ''; mostrarToastAdmin("¡Foto agregada al carrusel!", "success"); cargarBanners(); } 
        else { mostrarToastAdmin("Error al subir.", "error"); }
    } catch (error) { mostrarToastAdmin("Error de conexión.", "error"); }
    btn.innerHTML = '<i class="fas fa-plus"></i> Añadir Foto'; btn.disabled = false;
}

function eliminarBanner(id) {
    showCustomConfirm('¿Borrar esta foto del carrusel?', async () => {
        try {
            await fetchSeguro(`${API}/banners/${id}`, { method: 'DELETE' });
            mostrarToastAdmin("Foto eliminada", "success");
            cargarBanners();
        } catch (error) { mostrarToastAdmin("Error al eliminar", "error"); }
    }, "Sí, borrar");
}

async function cargarCupones() {
    const tbody = document.getElementById('body-cupones');
    if(!tbody) return;
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

    if (!codigo || !desc || !usos) { return mostrarToastAdmin("Completa todos los campos del cupón.", "error"); }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;

    try {
        const res = await fetchSeguro(`${API}/cupones`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ codigo, descuento_porcentaje: desc, usos_disponibles: usos }) });
        if(res.ok) { document.getElementById('add-cupon-codigo').value = ''; document.getElementById('add-cupon-porcentaje').value = ''; document.getElementById('add-cupon-usos').value = ''; mostrarToastAdmin("¡Cupón creado!", "success"); cargarCupones(); } 
        else { mostrarToastAdmin("Error al crear. Ese código podría ya existir.", "error"); }
    } catch (error) { mostrarToastAdmin("Error de conexión.", "error"); }
    btn.innerHTML = 'Crear'; btn.disabled = false;
}

function eliminarCupon(id) {
    showCustomConfirm('¿Eliminar este cupón para siempre?', async () => {
        try {
            await fetchSeguro(`${API}/cupones/${id}`, { method: 'DELETE' });
            mostrarToastAdmin("Cupón eliminado", "success");
            cargarCupones();
        } catch (error) { mostrarToastAdmin("Error al eliminar", "error"); }
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