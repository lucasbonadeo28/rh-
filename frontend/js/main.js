const API = '/api'; 

let carrito = []; 
let productosCargados = []; 
let productosNuevos = []; 
let favoritos = []; 
let prodSeleccionado = null; 
let filtrandoFavoritos = false; 
let costoEnvio = 0;
let cuponAplicado = { codigo: null, descuento: 0 };
let banners = [];
let currentSlide = 0;
let slideInterval;
let touchStartX = 0;
let touchEndX = 0;

let vistaActual = 'home';
let categoriaActual = 'Todos';
let ordenActual = 'default';
let talleTemporal = null; 

window.onload = async () => { 
    window.scrollTo(0, 0);

    try { 
        const favData = JSON.parse(localStorage.getItem('favsLucTienda'));
        favoritos = Array.isArray(favData) ? favData : []; 
    } catch(e) { favoritos = []; }
    
    try { 
        const cartData = JSON.parse(localStorage.getItem('carritoLucTienda'));
        carrito = Array.isArray(cartData) ? cartData : []; 
    } catch(e) { carrito = []; }
    
    actualizarContadores(); 
    renderizarCarritoSidebar();
    
    initBeneficiosSlider();
    initCustomSelect();

    await fetchBanners();
    await fetchProductos(); 
    
    await renderizarCategoriasDinamicas();

    const vistaGuardada = sessionStorage.getItem('tiendaVista') || 'home';
    const catGuardada = sessionStorage.getItem('tiendaCat') || 'Todos';

    document.querySelectorAll('.chk-talle').forEach(cb => {
        cb.checked = false;
        cb.onchange = function() {
            if (this.checked) {
                document.querySelectorAll('.chk-talle').forEach(otro => {
                    if (otro !== this) otro.checked = false;
                });
            }
            aplicarFiltrosCatalogo();
        };
    });

    if (vistaGuardada === 'favoritos') {
        mostrarFavoritos();
    } else {
        cambiarVista(vistaGuardada, catGuardada);
    }
};

// NUEVA FUNCIÓN: Procesa el texto de la BD y devuelve un array de fotos
function obtenerArrayImagenes(imgData) {
    if (!imgData) return ['https://via.placeholder.com/400x500?text=Sin+Imagen'];
    try {
        const arr = JSON.parse(imgData);
        if (Array.isArray(arr) && arr.length > 0) return arr;
        return [imgData];
    } catch(e) {
        return [imgData];
    }
}

async function renderizarCategoriasDinamicas() {
    let categoriasUnicas = [];
    
    try {
        const res = await fetch(`${API}/categorias`);
        if (res.ok) {
            const data = await res.json();
            categoriasUnicas = data.map(c => c.nombre);
        }
    } catch (error) {
        console.error("Error al cargar las categorías:", error);
    }

    const navCenter = document.getElementById('nav-menu-celular');
    if (navCenter) {
        navCenter.innerHTML = `<a class="filter-link active" onclick="cambiarVista('catalogo', 'Todos')">TODO</a>` + 
            categoriasUnicas.map(cat => `<a class="filter-link" onclick="cambiarVista('catalogo', '${cat}')">${cat.toUpperCase()}</a>`).join('');
    }

    const sidebarDesktop = document.querySelector('#sidebar-desktop .filter-list');
    if (sidebarDesktop) {
        sidebarDesktop.innerHTML = `<li><a onclick="cambiarCategoriaMobile('Todos')" class="cat-link active">Todos</a></li>` +
            categoriasUnicas.map(cat => `<li><a onclick="cambiarCategoriaMobile('${cat}')" class="cat-link">${cat}</a></li>`).join('');
    }

    const mobilePills = document.querySelector('#filter-sidebar .pills-container');
    if (mobilePills) {
        mobilePills.innerHTML = `<button class="filter-pill active" onclick="cambiarCategoriaMobile('Todos')">TODOS</button>` +
            categoriasUnicas.map(cat => `<button class="filter-pill" onclick="cambiarCategoriaMobile('${cat}')">${cat.toUpperCase()}</button>`).join('');
    }

    const footerCols = document.querySelectorAll('.footer-col');
    if (footerCols.length > 1) {
        const footerUl = footerCols[1].querySelector('ul');
        if (footerUl) {
            footerUl.innerHTML = categoriasUnicas.map(cat => `<li><a onclick="cambiarVista('catalogo', '${cat}')">${cat}</a></li>`).join('');
        }
    }
}

function guardarCarrito() {
    localStorage.setItem('carritoLucTienda', JSON.stringify(carrito));
}

async function fetchProductos() {
    try {
        const resTodos = await fetch(`${API}/productos`);
        if(resTodos.ok) {
            const data = await resTodos.json();
            productosCargados = Array.isArray(data) ? data : [];
        }
    } catch (err) { 
        productosCargados = [];
    }

    try {
        const resNuevos = await fetch(`${API}/productos/nuevos`);
        if(resNuevos.ok) {
            const data = await resNuevos.json();
            productosNuevos = Array.isArray(data) ? data : productosCargados.slice(0, 8);
        } else {
            productosNuevos = productosCargados.slice(0, 8);
        }
    } catch(e) {
        productosNuevos = productosCargados.slice(0, 8);
    }
}

async function fetchBanners() {
    try {
        const res = await fetch(`${API}/banners/home`);
        if(res.ok) {
            const data = await res.json();
            if(Array.isArray(data) && data.length > 0) {
                banners = data;
            } else {
                banners = [{ id: 1, imagen_url: 'https://via.placeholder.com/1400x600/111111/ffffff?text=CARRUSEL+VACIO+1' }];
            }
        } else {
            banners = [{ id: 1, imagen_url: 'https://via.placeholder.com/1400x600/111111/ffffff?text=CARRUSEL+VACIO+1' }];
        }
    } catch (error) { 
        banners = [{ id: 1, imagen_url: 'https://via.placeholder.com/1400x600/111111/ffffff?text=CARRUSEL+VACIO+1' }];
    }
    renderBanners();
}

function renderBanners() {
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');
    
    if(!track || !dotsContainer || banners.length === 0) return;
    
    track.innerHTML = banners.map(b => `<div class="carousel-item"><img src="${b.imagen_url}" alt="Banner"></div>`).join('');
    dotsContainer.innerHTML = banners.map((b, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('');
    
    iniciarAutoplay();
    iniciarSwipe(); 
}

function updateCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if(!track) return;
    
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((d, i) => { 
        if(i === currentSlide) {
            d.classList.add('active'); 
        } else {
            d.classList.remove('active'); 
        }
    });
}

function nextSlide() { 
    currentSlide = (currentSlide + 1) % banners.length; 
    updateCarousel(); 
}

function prevSlide() { 
    currentSlide = (currentSlide - 1 + banners.length) % banners.length; 
    updateCarousel(); 
}

function goToSlide(index) { 
    currentSlide = index; 
    updateCarousel(); 
    reiniciarAutoplay(); 
}

function iniciarAutoplay() { 
    slideInterval = setInterval(nextSlide, 5000); 
}

function reiniciarAutoplay() { 
    clearInterval(slideInterval); 
    iniciarAutoplay(); 
}

function iniciarSwipe() {
    const track = document.getElementById('carousel-track');
    if(!track) return;

    track.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(slideInterval);
    }, {passive: true});

    track.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        iniciarAutoplay();
    }, {passive: true});
}

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) {
        nextSlide();
    }
    if (touchEndX - touchStartX > swipeThreshold) {
        prevSlide();
    }
}

function initCustomSelect() {
    const wrapper = document.getElementById('custom-sort-select');
    if(!wrapper) return;
    
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const optionsContainer = wrapper.querySelector('.custom-options');
    const options = wrapper.querySelectorAll('.custom-option');
    const triggerText = document.getElementById('custom-select-text');

    trigger.addEventListener('click', function(e) {
        e.stopPropagation(); 
        closeAllSelects(wrapper); 
        wrapper.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', function() {
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const value = this.getAttribute('data-value');
            const text = this.innerText;
            
            triggerText.innerText = text;
            ordenActual = value; 
            wrapper.classList.remove('open');
            aplicarFiltrosCatalogo();
        });
    });

    document.addEventListener('click', function() { 
        wrapper.classList.remove('open'); 
    });
}

function closeAllSelects(except = null) {
    document.querySelectorAll('.custom-select-wrapper').forEach(select => {
        if(select !== except) {
            select.classList.remove('open');
        }
    });
}

function abrirFiltrosMobile() {
    document.getElementById('filter-sidebar').classList.add('active');
    document.getElementById('filter-overlay').classList.add('active');
}

function cerrarFiltrosMobile() {
    document.getElementById('filter-sidebar').classList.remove('active');
    document.getElementById('filter-overlay').classList.remove('active');
}

function cambiarCategoriaMobile(cat) {
    categoriaActual = cat;
    
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if(btn.innerText.trim().toLowerCase() === cat.toLowerCase()) {
            btn.classList.add('active'); 
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.cat-link').forEach(a => {
        if(a.innerText.trim().toLowerCase() === cat.toLowerCase()) {
            a.classList.add('active'); 
        } else {
            a.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.nav-center .filter-link').forEach(l => {
        const text = l.innerText.trim().toLowerCase();
        const catLower = cat.toLowerCase();
        if(text === catLower || (catLower === 'todos' && text === 'todo')) {
            l.classList.add('active'); 
        } else {
            l.classList.remove('active');
        }
    });

    if (vistaActual === 'home') {
        cambiarVista('catalogo', cat);
    } else {
        aplicarFiltrosCatalogo();
        if(window.innerWidth <= 992) {
            document.getElementById('bread-cat-nombre').innerText = cat === 'Todos' ? 'Productos' : cat;
        }
    }
    cerrarFiltrosMobile(); 
}

function cambiarVista(vista, categoria = 'Todos') {
    document.getElementById('input-buscador-nav').value = '';
    window.scrollTo(0, 0); 

    vistaActual = vista;
    categoriaActual = categoria;
    filtrandoFavoritos = false;
    
    sessionStorage.setItem('tiendaVista', vista);
    sessionStorage.setItem('tiendaCat', categoria);
    document.documentElement.setAttribute('data-vista-activa', vista);
    
    document.querySelectorAll('.filter-checkbox-list input[type="checkbox"]').forEach(cb => cb.checked = false); 
    
    if (vista === 'home') {
        document.getElementById('grid-home').innerHTML = generarGridHTML(productosNuevos);
        document.querySelectorAll('.nav-center .filter-link').forEach(l => l.classList.remove('active'));
    } 
    else if (vista === 'catalogo') {
        if(window.innerWidth <= 992) { 
            document.getElementById('bread-cat-nombre').innerText = categoria === 'Todos' ? 'Productos' : categoria; 
        }
        
        document.querySelectorAll('.nav-center .filter-link').forEach(l => {
            const text = l.innerText.trim().toLowerCase();
            const catLower = categoria.toLowerCase();
            if(text === catLower || (catLower === 'todos' && text === 'todo')) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });
        
        aplicarFiltrosCatalogo(); 
    }
    
    if(document.getElementById('nav-menu-celular') && document.getElementById('nav-menu-celular').classList.contains('active')) {
        toggleMenuMobile();
    }
}

function ejecutarBusquedaNav(event) {
    const txt = event.target.value.toLowerCase().trim();
    if (txt === "") { 
        cambiarVista('catalogo', 'Todos'); 
        return; 
    }
    
    window.scrollTo(0, 0);
    vistaActual = 'catalogo'; 
    categoriaActual = 'Todos'; 
    filtrandoFavoritos = false;

    sessionStorage.setItem('tiendaVista', 'catalogo');
    sessionStorage.setItem('tiendaCat', 'Todos');
    document.documentElement.setAttribute('data-vista-activa', 'catalogo');

    document.getElementById('titulo-catalogo').innerText = `Resultados para: "${txt}"`;
    
    const listafiltrada = productosCargados.filter(p => (p.nombre || '').toLowerCase().includes(txt));
    const grid = document.getElementById('grid-catalogo');
    if (grid) {
        grid.innerHTML = generarGridHTML(listafiltrada);
    }
}

function aplicarFiltrosCatalogo() {
    try {
        const checkboxes = document.querySelectorAll('.chk-talle:checked');
        const tallesSeleccionados = Array.from(new Set(Array.from(checkboxes).map(cb => cb.value)));
        let listaFiltrada = Array.isArray(productosCargados) ? [...productosCargados] : [];

        if (categoriaActual !== 'Todos') {
            listaFiltrada = listaFiltrada.filter(p => p && p.categoria === categoriaActual);
        }
        
        if (tallesSeleccionados.length > 0) {
            listaFiltrada = listaFiltrada.filter(p => {
                if (!p || !p.inventario_talles) return false;
                return tallesSeleccionados.some(talle => p.inventario_talles[talle] !== undefined);
            });
        }

        if (ordenActual === 'menor') {
            listaFiltrada.sort((a, b) => parseFloat(a.precio_tarjeta || 0) - parseFloat(b.precio_tarjeta || 0));
        } else if (ordenActual === 'mayor') {
            listaFiltrada.sort((a, b) => parseFloat(b.precio_tarjeta || 0) - parseFloat(a.precio_tarjeta || 0));
        } else if (ordenActual === 'a-z') {
            listaFiltrada.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        } else if (ordenActual === 'z-a') {
            listaFiltrada.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
        } else if (ordenActual === 'nuevo') {
            listaFiltrada.sort((a, b) => (b.id || 0) - (a.id || 0)); 
        } else if (ordenActual === 'viejo') {
            listaFiltrada.sort((a, b) => (a.id || 0) - (b.id || 0));
        }

        const grid = document.getElementById('grid-catalogo');
        if (grid) {
            grid.innerHTML = generarGridHTML(listaFiltrada);
        }
    } catch (error) {
        const grid = document.getElementById('grid-catalogo');
        if (grid) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; margin-top:50px; color:var(--secondary);">No hay productos en esta categoría.</p>';
        }
    }
}

function generarGridHTML(lista) {
    if(!lista || !Array.isArray(lista) || lista.length === 0) {
        let msj = filtrandoFavoritos ? "Aún no tenés productos en favoritos." : "No hay productos en esta categoría.";
        return `<div style="grid-column: 1/-1; text-align:center; padding: 60px 20px;"><i class="fas fa-box-open" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i><p style="color:var(--secondary); font-size: 1.1rem; margin: 0; font-weight: 500;">${msj}</p></div>`;
    }
    
    return lista.map(p => { 
        if (!p) return ''; 
        
        let stockTotalPrenda = 0;
        if (p.inventario_talles && typeof p.inventario_talles === 'object') {
            Object.values(p.inventario_talles).forEach(cant => stockTotalPrenda += (parseInt(cant) || 0));
        }
        const productoAgotado = stockTotalPrenda <= 0; 

        const esFav = favoritos.includes(p.id) ? 'active' : ''; 
        const nombre = p.nombre || 'Producto sin nombre';
        const pTarj = p.precio_tarjeta || p.tarjeta || 0;
        const pEfvo = p.precio_efectivo || p.efectivo || 0;

        // ACÁ AGARRAMOS LA FOTO 0 PARA EL GRID PRINCIPAL
        const arrayFotos = obtenerArrayImagenes(p.imagen_url);
        const imgUrl = arrayFotos[0];

        return `
        <div class="card">
            <div class="img-wrapper ${productoAgotado ? 'agotado' : ''}" onclick="abrirDetalle(${p.id})">
                <button class="btn-fav ${esFav}" onclick="toggleFavorito(${p.id}, event)" title="Añadir a favoritos"><i class="fas fa-heart"></i></button>
                ${productoAgotado ? '<div class="badge-agotado">SIN STOCK</div>' : ''}
                <img src="${imgUrl}">
            </div>
            <div class="card-info">
                <h4 onclick="abrirDetalle(${p.id})">${nombre}</h4>
                <div class="precios-container" onclick="abrirDetalle(${p.id})">
                    <p class="p-tarj">$${pTarj}</p>
                    <p class="p-efvo"><strong>$${pEfvo}</strong> con<br>Transferencia/depósito</p>
                </div>
                <button class="btn-card-add ${productoAgotado ? 'disabled' : ''}" ${productoAgotado ? 'disabled' : `onclick="abrirDetalle(${p.id})"`}>
                    ${productoAgotado ? 'AGOTADO' : 'AGREGAR AL CARRITO'}
                </button>
            </div>
        </div>`; 
    }).join(''); 
}

function initBeneficiosSlider() {
    const slider = document.getElementById('pf-benefits-slider');
    const dotsContainer = document.getElementById('pf-dots-container');
    
    if(!slider || !dotsContainer) return;
    
    const dots = dotsContainer.querySelectorAll('.dot');
    
    slider.addEventListener('scroll', () => {
        let index = Math.round(slider.scrollLeft / slider.clientWidth);
        dots.forEach((dot, i) => { 
            if (i === index) {
                dot.classList.add('active'); 
            } else {
                dot.classList.remove('active'); 
            }
        });
    });
    
    dots.forEach((dot, i) => { 
        dot.addEventListener('click', () => { 
            slider.scrollTo({ left: i * slider.clientWidth, behavior: 'smooth' }); 
        }); 
    });
}

function mostrarToast(mensaje, tipo = 'success') { 
    const container = document.getElementById('toast-container'); 
    container.innerHTML = ''; 
    const toast = document.createElement('div'); 
    toast.className = `toast ${tipo}`; 
    toast.innerHTML = tipo === 'success' ? `<i class="fas fa-check-circle"></i> ${mensaje}` : `<i class="fas fa-exclamation-circle"></i> ${mensaje}`; 
    container.appendChild(toast); 
    
    setTimeout(() => { 
        if (container.contains(toast)) container.removeChild(toast); 
    }, 3000); 
}

function toggleMenuMobile() { 
    document.getElementById('nav-menu-celular').classList.toggle('active'); 
}

function toggleFavorito(id, event) { 
    if(event) event.stopPropagation(); 
    
    if (favoritos.includes(id)) { 
        favoritos = favoritos.filter(f => f !== id); 
        mostrarToast('Eliminado de favoritos', 'error'); 
    } else { 
        favoritos.push(id); 
        mostrarToast('Agregado a favoritos', 'success'); 
    } 
    
    localStorage.setItem('favsLucTienda', JSON.stringify(favoritos)); 
    actualizarContadores(); 
    
    if(filtrandoFavoritos) {
        mostrarFavoritos(); 
    } else { 
        if (vistaActual === 'home') { 
            const grid = document.getElementById('grid-home');
            if (grid) grid.innerHTML = generarGridHTML(productosNuevos); 
        } else if (vistaActual === 'catalogo') { 
            aplicarFiltrosCatalogo(); 
        } 
    }
}

function toggleFavoritoModal(event) {
    if (!prodSeleccionado) return; 
    toggleFavorito(prodSeleccionado.id, event);
    const btnFav = document.getElementById('btn-fav-modal');
    if (favoritos.includes(prodSeleccionado.id)) {
        btnFav.classList.add('active'); 
    } else {
        btnFav.classList.remove('active');
    }
}

function mostrarFavoritos() { 
    window.scrollTo(0, 0);
    filtrandoFavoritos = true; 
    vistaActual = 'catalogo'; 
    
    sessionStorage.setItem('tiendaVista', 'favoritos');
    document.documentElement.setAttribute('data-vista-activa', 'favoritos');
    document.getElementById('titulo-catalogo').innerText = `Mis Favoritos (${favoritos.length})`; 
    
    const listaFavs = productosCargados.filter(p => favoritos.includes(p.id)); 
    const grid = document.getElementById('grid-catalogo');
    if (grid) {
        grid.innerHTML = generarGridHTML(listaFavs);
    }
    
    document.querySelectorAll('.cat-link').forEach(a => a.classList.remove('active'));
    if(document.getElementById('nav-menu-celular') && document.getElementById('nav-menu-celular').classList.contains('active')) {
        toggleMenuMobile();
    }
}

function seleccionarTalleDOM(elemento, talle) {
    const hermanos = elemento.parentElement.querySelectorAll('.talle-label');
    hermanos.forEach(el => el.classList.remove('selected'));
    
    elemento.classList.add('selected');
    talleTemporal = talle;
}

function abrirDetalle(id) { 
    prodSeleccionado = productosCargados.find(p => p.id === id); 
    if(!prodSeleccionado) return;

    talleTemporal = null; 

    // MINI GALERÍA
    const arrayFotos = obtenerArrayImagenes(prodSeleccionado.imagen_url);
    document.getElementById('det-img-url').src = arrayFotos[0]; 

    const galeria = document.getElementById('det-mini-gallery');
    if (galeria) {
        if (arrayFotos.length > 1) {
            galeria.innerHTML = arrayFotos.map(src => `<img src="${src}" onclick="document.getElementById('det-img-url').src = this.src" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ccc;">`).join('');
            galeria.style.display = 'flex';
        } else {
            galeria.style.display = 'none';
            galeria.innerHTML = '';
        }
    }

    document.getElementById('det-titulo').innerText = prodSeleccionado.nombre || 'Producto'; 
    document.getElementById('det-precio-tarj').innerText = `$${prodSeleccionado.precio_tarjeta || prodSeleccionado.tarjeta || 0} Tarjeta`; 
    document.getElementById('det-precio-efvo').innerText = `$${prodSeleccionado.precio_efectivo || prodSeleccionado.efectivo || 0} Transf.`; 
    document.getElementById('det-descripcion').innerText = prodSeleccionado.descripcion || 'Sin descripción disponible.'; 
    
    const btnFavModal = document.getElementById('btn-fav-modal');
    if (favoritos.includes(prodSeleccionado.id)) { 
        btnFavModal.classList.add('active'); 
    } else { 
        btnFavModal.classList.remove('active'); 
    }

    let totalStock = 0;
    if (prodSeleccionado.inventario_talles) {
        Object.values(prodSeleccionado.inventario_talles).forEach(cant => totalStock += parseInt(cant) || 0);
    }
    const estaAgotado = totalStock <= 0;
    const btnComprarModal = document.getElementById('btn-add-modal');

    if (estaAgotado) {
        btnComprarModal.innerHTML = '<i class="fas fa-times-circle"></i> Producto Agotado';
        btnComprarModal.disabled = true;
        btnComprarModal.style.background = '#ccc';
    } else {
        btnComprarModal.innerHTML = '<i class="fas fa-shopping-bag"></i> Añadir al Carrito';
        btnComprarModal.disabled = false;
        btnComprarModal.style.background = ''; 
    }

    const containerTalles = document.getElementById('det-talles-container'); 
    containerTalles.innerHTML = ''; 
    
    if(prodSeleccionado.inventario_talles) { 
        if(prodSeleccionado.inventario_talles['ÚNICO'] !== undefined) { 
            const stockUnico = parseInt(prodSeleccionado.inventario_talles['ÚNICO']) || 0;
            if(stockUnico <= 0) {
                containerTalles.innerHTML = `<p style="font-size:1rem; color:var(--danger); font-weight:700; margin:0;">Agotado</p>`; 
                talleTemporal = null;
            } else {
                containerTalles.innerHTML = `<p style="font-size:1rem; color:var(--success); font-weight:700; margin:0;">Talle Único</p>`; 
                talleTemporal = 'ÚNICO';
            }
        } else { 
            let htmlTalles = '';
            Object.entries(prodSeleccionado.inventario_talles).forEach(([talle, stock]) => { 
                const sinStock = stock <= 0 ? 'sin-stock' : ''; 
                const onclick = stock > 0 ? `onclick="seleccionarTalleDOM(this, '${talle}')"` : `onclick="mostrarToast('Este talle se encuentra agotado', 'error')"`; 
                htmlTalles += `<div class="talle-label ${sinStock}" ${onclick}>${talle}</div>`; 
            }); 
            containerTalles.innerHTML = htmlTalles;
        } 
    } else {
        containerTalles.innerHTML = `<p style="font-size:1rem; color:var(--success); font-weight:700; margin:0;">Talle Único</p>`;
        talleTemporal = 'ÚNICO';
    }
    document.getElementById('modal-detalle-producto').style.display = 'flex'; 
}

function cerrarDetalle() { 
    document.getElementById('modal-detalle-producto').style.display = 'none'; 
}

function agregarDesdeDetalle() { 
    let talleElegido = "Único"; 
    if(prodSeleccionado.inventario_talles && prodSeleccionado.inventario_talles['ÚNICO'] === undefined) { 
        if(!talleTemporal) return mostrarToast("Por favor elegí un talle disponible", "error"); 
        talleElegido = talleTemporal; 
    } else {
        talleElegido = 'ÚNICO';
    }
    
    const idUnico = `${prodSeleccionado.id}-${talleElegido}`; 
    const item = carrito.find(i => i.idUnico === idUnico); 
    
    const fotoCarrito = obtenerArrayImagenes(prodSeleccionado.imagen_url)[0];

    if(item) { 
        item.cantidad++; 
    } else { 
        carrito.push({ 
            idUnico: idUnico, 
            id: prodSeleccionado.id, 
            nombre: `${prodSeleccionado.nombre} (${talleElegido})`, 
            talle: talleElegido, 
            precio_efectivo: prodSeleccionado.precio_efectivo || prodSeleccionado.efectivo, 
            precio_tarjeta: prodSeleccionado.precio_tarjeta || prodSeleccionado.tarjeta, 
            cantidad: 1, 
            imagen_url: fotoCarrito 
        }); 
    } 
    
    actualizarContadores(); 
    guardarCarrito(); 
    cerrarDetalle(); 
    mostrarToast("Añadido al carrito", "success"); 
    abrirCarritoSidebar(); 
}

function abrirCarritoSidebar() { 
    if(carrito.length === 0) return mostrarToast("Tu carrito está vacío", "error"); 
    document.getElementById('cart-sidebar').classList.add('active'); 
    document.getElementById('cart-overlay').classList.add('active'); 
    renderizarCarritoSidebar(); 
}

function cerrarCarritoSidebar() { 
    document.getElementById('cart-sidebar').classList.remove('active'); 
    document.getElementById('cart-overlay').classList.remove('active'); 
}

function renderizarCarritoSidebar() { 
    const lista = document.getElementById('lista-carrito-sidebar'); 
    let subtotal = 0; 
    
    if(carrito.length === 0) { 
        lista.innerHTML = '<p style="text-align:center; color:gray; margin-top:50px;">No hay productos.</p>'; 
        document.getElementById('subtotal-sidebar').innerText = '0'; 
        document.getElementById('fila-descuento-sidebar').style.display = 'none';
        return; 
    } 
    
    lista.innerHTML = carrito.map(p => { 
        subtotal += (p.precio_efectivo * p.cantidad); 
        return `
        <div class="cart-item-row">
            <div style="display:flex; align-items:center;">
                <img src="${p.imagen_url || 'https://via.placeholder.com/400x500?text=Sin+Imagen'}">
                <div style="max-width: 130px;">
                    <strong style="display:block; font-size: 0.85rem; color:var(--primary); line-height: 1.2; margin-bottom:4px; font-weight:500;">${p.nombre}</strong>
                    <span style="color:var(--success); font-size:0.85rem; font-weight:bold;">$${p.precio_efectivo}</span>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap: 15px;">
                <div class="cant-control">
                    <button class="btn-cant" onclick="ajustarCantidad('${p.idUnico}', -1)">-</button>
                    <span style="font-weight:600; font-size:0.9rem;">${p.cantidad}</span>
                    <button class="btn-cant" onclick="ajustarCantidad('${p.idUnico}', 1)">+</button>
                </div>
                <button class="btn-eliminar-item" onclick="eliminarDelCarrito('${p.idUnico}')" title="Eliminar de una"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>`; 
    }).join(''); 
    
    let totalFinalCarrito = subtotal;

    if (cuponAplicado && cuponAplicado.descuento > 0) {
        let descuento = (subtotal * cuponAplicado.descuento) / 100;
        totalFinalCarrito = subtotal - descuento;
        document.getElementById('fila-descuento-sidebar').style.display = 'flex';
        document.getElementById('nombre-descuento-sidebar').innerText = `Cupón ${cuponAplicado.descuento}% OFF`;
        document.getElementById('valor-descuento-sidebar').innerText = `-$${Math.round(descuento)}`;
    } else {
        document.getElementById('fila-descuento-sidebar').style.display = 'none';
    }

    document.getElementById('subtotal-sidebar').innerText = Math.round(totalFinalCarrito); 
}

function ajustarCantidad(idUnico, delta) { 
    const item = carrito.find(p => p.idUnico === idUnico); 
    if(item) { 
        item.cantidad += delta; 
        if(item.cantidad <= 0) carrito = carrito.filter(p => p.idUnico !== idUnico); 
        renderizarCarritoSidebar(); 
        actualizarContadores();
        guardarCarrito(); 
    } 
    if(carrito.length === 0) cerrarCarritoSidebar(); 
}

function eliminarDelCarrito(idUnico) {
    carrito = carrito.filter(p => p.idUnico !== idUnico);
    renderizarCarritoSidebar();
    actualizarContadores();
    guardarCarrito(); 
    mostrarToast("Producto eliminado", "success");
    if(carrito.length === 0) cerrarCarritoSidebar();
}

function toggleInputCupon() {
    const caja = document.getElementById('caja-input-cupon');
    const btnMostrar = document.getElementById('btn-mostrar-cupon');
    if (caja.style.display === 'none') {
        caja.style.display = 'flex';
        btnMostrar.style.display = 'none';
    }
}

async function aplicarCuponReal() {
    const inputCodigo = document.getElementById('input-codigo-cupon');
    const codigo = inputCodigo.value.trim();
    const msj = document.getElementById('mensaje-cupon');

    if (!codigo) return;

    try {
        const res = await fetch(`${API}/validar-cupon`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ codigo: codigo })
        });
        
        const data = await res.json();
        
        if (data.success) {
            cuponAplicado = { codigo: codigo.toUpperCase(), descuento: data.descuento };
            
            msj.style.color = "var(--success)";
            msj.innerText = `¡Cupón de ${data.descuento}% aplicado!`;
            inputCodigo.disabled = true;
            
            mostrarToast("Cupón aplicado con éxito", "success");
            renderizarCarritoSidebar(); 
            recalcularTotalPaso2(); 
        } else {
            msj.style.color = "var(--danger)";
            msj.innerText = data.message;
            inputCodigo.value = '';
        }
    } catch (err) {
        mostrarToast("Error al validar el cupón con el servidor", "error");
    }
}

function irAlCheckout() { 
    cerrarCarritoSidebar(); 
    document.getElementById('modal-principal').style.display = 'flex'; 
    document.getElementById('paso-2-formulario').style.display = 'flex'; 
    document.getElementById('pantalla-exito').style.display = 'none'; 
    recalcularTotalPaso2(); 
}

function cerrarCheckoutModal() { 
    document.getElementById('modal-principal').style.display = 'none'; 
}

function calcularEnvio() { 
    const cp = document.getElementById('chk-cp').value; 
    if(!cp || cp.length < 4) return mostrarToast('Ingresá un CP válido de 4 números', 'error'); 
    
    costoEnvio = (cp === '3000') ? 2500 : 6500; 
    const txt = document.getElementById('txt-costo-envio'); 
    txt.style.display = 'block'; 
    txt.innerText = (cp === '3000') ? `Envío a Santa Fe Capital: $${costoEnvio}` : `Envío por Correo Argentino: $${costoEnvio}`; 
    
    recalcularTotalPaso2(); 
    mostrarToast('Costo de envío actualizado', 'success'); 
}

function recalcularTotalPaso2() { 
    const metodo = document.querySelector('input[name="metodoPago"]:checked').value; 
    let totalPrendas = 0; 
    
    document.getElementById('resumen-checkout-paso2').innerHTML = carrito.map(p => { 
        const precio = metodo === 'transferencia' ? p.precio_efectivo : p.precio_tarjeta; 
        totalPrendas += (precio * p.cantidad); 
        return `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; padding-bottom: 5px; font-size:0.9rem; color:#555;">
            <span>${p.cantidad}x ${p.nombre}</span>
            <strong style="color:var(--primary)">$${precio * p.cantidad}</strong>
        </div>`; 
    }).join(''); 

    let descuentoMonto = 0;
    if (cuponAplicado && cuponAplicado.descuento > 0) {
        descuentoMonto = (totalPrendas * cuponAplicado.descuento) / 100;
        document.getElementById('resumen-checkout-paso2').innerHTML += `
        <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:0.95rem; color:var(--success); font-weight:bold;">
            <span><i class="fas fa-tag"></i> Descuento (${cuponAplicado.descuento}%)</span>
            <span>-$${Math.round(descuentoMonto)}</span>
        </div>`;
    }

    const subtotalConDescuento = totalPrendas - descuentoMonto;
    
    document.getElementById('checkout-envio-final').innerText = `$${costoEnvio}`; 
    document.getElementById('checkout-total-final').innerText = Math.round(subtotalConDescuento + costoEnvio); 
}

function actualizarContadores() { 
    document.getElementById('cart-count').innerText = carrito.reduce((a, b) => a + b.cantidad, 0); 
    document.getElementById('fav-count').innerText = favoritos.length; 
}

function validarLetras(input) { 
    input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
}
function validarNumeros(input) { 
    input.value = input.value.replace(/[^0-9]/g, ''); 
}
function validarTelefono(input) { 
    let val = input.value.replace(/[^0-9+]/g, ''); 
    if (!val.startsWith('+54')) val = '+54'; 
    input.value = val; 
}

async function finalizarCompra() { 
    let errorFormulario = false; 
    let mensajeError = "Faltan datos o son incorrectos. Revisá los recuadros rojos.";

    ['chk-nom', 'chk-ape', 'chk-mail', 'chk-tel', 'chk-dir'].forEach(id => { 
        const el = document.getElementById(id); 
        let invalido = false; 
        const valor = el.value.trim();

        if(!valor) invalido = true; 
        if(id === 'chk-tel' && valor.length !== 13) invalido = true; 
        
        if(id === 'chk-mail') { 
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
            if(!regexEmail.test(valor)) { 
                invalido = true; 
                mensajeError = "El email ingresado no es válido."; 
            } 
        }

        if((id === 'chk-nom' || id === 'chk-ape') && valor.length < 2) invalido = true; 
        
        if(invalido) { 
            el.classList.add('input-invalido'); 
            errorFormulario = true; 
        } else { 
            el.classList.remove('input-invalido'); 
        } 
    }); 
    
    if(costoEnvio === 0) { 
        document.getElementById('chk-cp').classList.add('input-invalido'); 
        errorFormulario = true; 
        mensajeError = "Por favor calculá el costo de envío primero."; 
    } else { 
        document.getElementById('chk-cp').classList.remove('input-invalido'); 
    }

    if(errorFormulario) { 
        return mostrarToast(mensajeError, "error"); 
    }
    
    const metodo = document.querySelector('input[name="metodoPago"]:checked').value; 
    const totalFinal = document.getElementById('checkout-total-final').innerText; 
    const btn = document.getElementById('btn-pagar');

    btn.innerHTML = '<i class="fas fa-spinner ruedita-girando"></i> PROCESANDO...'; 
    btn.disabled = true; 
    btn.style.opacity = '0.7';

    const payload = { 
        total: totalFinal, 
        metodo_pago: metodo, 
        costoEnvio: costoEnvio, 
        cupon_usado: cuponAplicado.codigo, 
        cliente: { 
            nombre: document.getElementById('chk-nom').value, 
            apellido: document.getElementById('chk-ape').value, 
            email: document.getElementById('chk-mail').value, 
            telefono: document.getElementById('chk-tel').value, 
            direccion: document.getElementById('chk-dir').value 
        }, 
        productos: carrito.map(p => ({ 
            id: p.id, 
            nombre: p.nombre, 
            talle: p.talle, 
            cantidad: p.cantidad, 
            precio_pagado: (metodo === 'transferencia' ? p.precio_efectivo : p.precio_tarjeta), 
            precio: (metodo === 'transferencia' ? p.precio_efectivo : p.precio_tarjeta) 
        })) 
    };

    try {
        if (metodo === 'transferencia') {
            
            let ordenIdStr = "000001"; 
            
            try {
                const res = await fetch(`${API}/comprar`, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify(payload) 
                });
                const data = await res.json();
                
                if(data.success && data.orden_id) {
                    ordenIdStr = String(data.orden_id).padStart(6, '0');
                } else {
                    ordenIdStr = String(Math.floor(Math.random() * 9999) + 1).padStart(6, '0');
                }
            } catch(e) {
                console.log("El backend no respondió, se generará una orden temporal");
                ordenIdStr = String(Math.floor(Math.random() * 9999) + 1).padStart(6, '0');
            }

            let textoWsp = `Hola, te hablo para informarte de que hice el pedido #${ordenIdStr}, queria saber como proseguir.`;
            let msjWsp = encodeURIComponent(textoWsp);
            
            const btnWsp = document.getElementById('btn-wsp-exito');
            if(btnWsp) {
                btnWsp.href = `https://api.whatsapp.com/send?phone=5493426286435&text=${msjWsp}`;
            }

            document.getElementById('paso-2-formulario').style.display = 'none'; 
            document.getElementById('pantalla-exito').style.display = 'flex'; 
            
            carrito = []; 
            guardarCarrito();
            actualizarContadores(); 

        } else if (metodo === 'mercadopago') {
            const resMP = await fetch(`${API}/crear_preferencia`, { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ items: payload.productos, cliente: payload.cliente, costoEnvio: payload.costoEnvio }) 
            });

            if(!resMP.ok) throw new Error("No hay respuesta del servidor");
            
            const dataMP = await resMP.json();
            
            if (dataMP.init_point) { 
                window.location.href = dataMP.init_point; 
            } else { 
                throw new Error("Mercado Pago falló"); 
            }
        }
    } catch (err) { 
        mostrarToast("Hubo un error al procesar la compra. Intentá nuevamente.", "error"); 
        btn.innerHTML = 'Confirmar Pedido'; 
        btn.disabled = false; 
        btn.style.opacity = '1'; 
    }
}