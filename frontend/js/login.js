async function iniciarSesion() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-pass').value;
    
    try {
        // Se cambió el localhost por la ruta relativa para que funcione en Render
        const res = await fetch('/api/admin/login', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            // Guardamos el Carnet VIP (Token)
            localStorage.setItem('tokenTienda', data.token);
            window.location.href = 'admin.html'; // Te manda al admin
        } else {
            document.getElementById('error-msg').style.display = 'block';
            document.getElementById('error-msg').innerText = data.error || 'Credenciales incorrectas';
        }
    } catch (err) {
        document.getElementById('error-msg').style.display = 'block';
        document.getElementById('error-msg').innerText = 'Error de conexión. ¿Está prendido el servidor?';
    }
}