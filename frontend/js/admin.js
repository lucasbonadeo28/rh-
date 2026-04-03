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

        window.onload = () => { 
            cargarTodo(); 
            
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

        function showCustomConfirm(msg, callback) {
            const modal = document.getElementById('custom-confirm-modal');
            document.getElementById('custom-confirm-text').innerText = msg;
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

        document.getElementById('btn-confirmar-accion').addEventListener('click', () => {
            if (accionConfirmada) accionConfirmada();
            cerrarCustomConfirm();
        });

        function mostrarNombreArchivo(input, labelId, textoDefault) {
            const label = document.getElementById(labelId);
            const span = label.querySelector('span');
            const icon = label.querySelector('i');
            if (input.files && input.files.length > 0) {
                span.innerText = input.files[0].name; 
                label.classList.add('selected'); 
                icon.className = 'fas fa-check-circle'; 
            } else {
                span.innerText = textoDefault; 
                label.classList.remove('selected'); 
                icon.className = labelId === 'label-add-img' || labelId === 'label-add-banner-file' ? 'fas fa-camera' : 'fas fa-image';
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
        }

        function toggleDetalle(id) { 
            const el = document.getElementById(id); 
            el.style.display = el.style.display === 'table-row' ? 'none' : 'table-row'; 
        }

        async function cargarTodo() {
            cargarBanners(); 
            cargarCupones();

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
                showCustomAlert("Error al cargar datos desde Postgres.", "error", false);
            }
        }

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
                        <td style="text-align: center;">
                            <button class="btn-secundario" style="padding: 6px 12px; width: auto; font-size: 0.8rem;" onclick="eliminarPedido(${v.id})" title="Cancelar/Eliminar Pedido"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
            
            document.getElementById('pagi-info-pedidos').innerText = `Página ${vPagina}`; 
            document.getElementById('pagi-anterior-pedidos').disabled = vPagina === 1; 
            document.getElementById('pagi-siguiente-pedidos').disabled = inicio + vPorPagina >= vTotales.length;
        }

        function eliminarPedido(id) {
            showCustomConfirm('¿Seguro que querés cancelar y eliminar este pedido? Esta acción no se puede deshacer.', async () => {
                try {
                    const res = await fetchSeguro(`${API}/ventas/${id}`, { method: 'DELETE' });
                    if(res.ok) {
                        showCustomAlert("Pedido eliminado correctamente", "success", false);
                        
                        const resVentas = await fetchSeguro(`${API}/ventas`); 
                        if (resVentas.ok) {
                            ventasDataGlobal = await resVentas.json();
                            vTotales = [...ventasDataGlobal];
                            renderPedidos();
                            generarEstadisticasMensuales();
                        }
                    } else {
                        showCustomAlert("Error al eliminar el pedido.", "error", false);
                    }
                } catch (error) {
                    showCustomAlert("Error de conexión al intentar borrar.", "error", false);
                }
            });
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
            });
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
            btn.innerHTML = '<i class="fas fa-plus"></i> Crear';
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
            });
        }

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

                return `
                <tr>
                    <td><img src="${p.imagen_url}" style="width:60px;height:60px;object-fit:cover; border-radius:6px; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></td>
                    <td><strong>${p.nombre}</strong><br><small style="color:gray">${p.categoria}</small></td>
                    <td><input type="number" value="${p.precio_efectivo}" style="width:90px;" onchange="actPrecio(${p.id}, 'efectivo', this.value)"></td>
                    <td><input type="number" value="${p.precio_tarjeta}" style="width:90px;" onchange="actPrecio(${p.id}, 'tarjeta', this.value)"></td>
                    <td>
                        <input type="text" value="${tallesTxt}" style="width:150px; margin-bottom:5px;" onchange="actTalles(${p.id}, this.value)" placeholder="S:10, M:5">
                        <br><small style="color:#27ae60; font-weight:bold;">Stock Total Sumado: ${stockTotalSumado}</small>
                    </td>
                    <td><button class="btn-secundario" onclick="borrarP(${p.id})"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            }).join('');
            
            document.getElementById('pagi-info').innerText = `Página ${pagina}`; 
            document.getElementById('pagi-anterior').disabled = pagina === 1; 
            document.getElementById('pagi-siguiente').disabled = inicio + pPorPagina >= pFiltrados.length;
        }

        function toggleTalleUnico() { 
            const esUnico = document.getElementById('chk-unico').checked; 
            document.getElementById('add-talles').style.display = esUnico ? 'none' : 'block'; 
            document.getElementById('add-stock-unico').style.display = esUnico ? 'block' : 'none';
            document.getElementById('add-talles').classList.remove('input-error');
            document.getElementById('add-stock-unico').classList.remove('input-error');
        }
        
        function validarLetras(input) { 
            input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
        }

        function validarNumeros(input) { 
            input.value = input.value.replace(/[^0-9]/g, ''); 
        }

        async function crearProducto() { 
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
            
            if (!imgInput.files || imgInput.files.length === 0) {
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

            if(error) return showCustomAlert("Por favor, completá todos los recuadros en rojo y seleccioná una foto.", "error", false);

            if(stockIngresado <= 0) {
                return showCustomAlert("El stock no puede ser 0. Ingresá al menos 1 unidad válida.", "error", false);
            }

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
            btn.disabled = true;

            const file = imgInput.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = async () => {
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

                    const imgBase64 = canvas.toDataURL('image/jpeg', 0.7);

                    try {
                        const res = await fetchSeguro(`${API}/productos`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                nombre: nombre,
                                categoria: categoria,
                                precio_efectivo: pEfvo,
                                precio_tarjeta: pTarj,
                                descripcion: desc,
                                inventario_talles: inventarioFinal,
                                imagen_url: imgBase64
                            })
                        });

                        if(res.ok) {
                            showCustomAlert("¡Producto guardado exitosamente!", "success", false);
                            
                            document.getElementById('add-nombre').value = '';
                            document.getElementById('add-categoria').value = '';
                            document.getElementById('add-precio-tarj').value = '';
                            document.getElementById('add-precio-efvo').value = '';
                            document.getElementById('add-descripcion').value = '';
                            document.getElementById('add-talles').value = '';
                            document.getElementById('add-stock-unico').value = '';
                            imgInput.value = '';
                            mostrarNombreArchivo(imgInput, 'label-add-img', 'Abrir Galería');

                            const resI = await fetchSeguro(`${API}/productos`); 
                            const dataI = await resI.json(); 
                            pTotales = dataI; 
                            pFiltrados = [...pTotales]; 
                            renderStock();
                        } else {
                            showCustomAlert("Error al guardar el producto en la base de datos.", "error", false);
                        }
                    } catch(e) {
                        showCustomAlert("Error de conexión con el servidor.", "error", false);
                    }
                    
                    btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
                    btn.disabled = false;
                };
            };
            reader.readAsDataURL(file);
        }
        
        async function actPrecio(id, tipo, valor) { 
            console.log(`Actualizar precio ${tipo} del prod ${id} a ${valor}`); 
        }

        async function actTalles(id, txt) { 
            console.log(`Actualizar json talles del prod ${id} a: ${txt}`); 
        }

        function borrarP(id) { 
            showCustomConfirm('¿Seguro que querés borrar este producto de la base de datos? Es irreversible.', async () => {
                try {
                    const res = await fetchSeguro(`${API}/productos/${id}`, { method: 'DELETE' });
                    if(res.ok) {
                        showCustomAlert("Producto eliminado correctamente", "success", false); 
                        const resI = await fetchSeguro(`${API}/productos`); 
                        const dataI = await resI.json(); 
                        pTotales = dataI; 
                        pFiltrados = [...pTotales]; 
                        renderStock();
                    } else {
                        showCustomAlert("Error al eliminar el producto.", "error", false);
                    }
                } catch (error) {
                    showCustomAlert("Error de conexión al intentar borrar.", "error", false);
                }
            });
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
        
        function cerrarSesion() { 
            localStorage.removeItem('tokenTienda'); 
            window.location.href = 'login.html'; 
        }

        /* ==========================================
   LÓGICA DEL LOGIN DEL ADMIN
========================================== */

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

            if (data.success) {
                sessionStorage.setItem('adminLogueado', 'true');
                document.getElementById('login-wrapper').style.display = 'none';
                document.getElementById('panel-dashboard').style.display = 'block';
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

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLogueado') === 'true') {
        const loginWrapper = document.getElementById('login-wrapper');
        const panelDashboard = document.getElementById('panel-dashboard');
        if(loginWrapper) loginWrapper.style.display = 'none';
        if(panelDashboard) panelDashboard.style.display = 'block';
    }
});

function cerrarSesionLocal() {
    sessionStorage.removeItem('adminLogueado');
    const loginWrapper = document.getElementById('login-wrapper');
    const panelDashboard = document.getElementById('panel-dashboard');
    if(loginWrapper) loginWrapper.style.display = 'flex';
    if(panelDashboard) panelDashboard.style.display = 'none';
    
    const passInput = document.getElementById('login-password');
    if(passInput) passInput.value = '';
    
    if(typeof cerrarSesion === 'function') cerrarSesion();
}