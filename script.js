// =============================================
// SISTEMA DE CONTROL VEHICULAR - RONDERO
// VERSION PROFESIONAL OPTIMIZADA
// =============================================

const App = {
    inventario: {},
    coloresCSS: {
        blanco: '#ffffff',
        negro: '#111111',
        gris: '#757575',
        rojo: '#e53935',
        azul: '#1e88e5',
        verde: '#43a047',
        café: '#6d4c41',
        amarillo: '#fdd835',
        'vino tinto': '#7b1e3a'
    }
};

// ==================== UTILIDADES ====================

function normalizar(s) {
    return (s || '').replace(/\s+/g, '').toUpperCase();
}

function escaparHTML(str) {
    return String(str || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function fechaHoy() {
    const d = new Date();
    return d.toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function mostrarToast(mensaje) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('fade-out'), 2500);
    setTimeout(() => toast.remove(), 3000);
}

function actualizarContador() {
    const total = Object.keys(App.inventario).length;
    document.getElementById('totalVehiculos').textContent = total;
}

// ==================== PERSISTENCIA ====================

function guardarEnLocalStorage() {
    const backup = {
        inventario: App.inventario,
        coloresCSS: App.coloresCSS
    };
    localStorage.setItem('inventarioVehicular', JSON.stringify(backup));
}

function cargarDesdeLocalStorage() {
    const guardado = localStorage.getItem('inventarioVehicular');
    if (!guardado) return false;
    try {
        const datos = JSON.parse(guardado);
        App.inventario = datos.inventario || {};
        if (datos.coloresCSS) App.coloresCSS = datos.coloresCSS;
        return true;
    } catch (e) {
        return false;
    }
}

// ==================== CRUD ====================

function agregarVehiculo() {
    const placaInput = document.getElementById('nuevaPlaca');
    const marcaInput = document.getElementById('nuevaMarca');
    const colorInput = document.getElementById('nuevoColor');
    const danosInput = document.getElementById('nuevosDanos');

    const placa = normalizar(placaInput.value);
    const marca = marcaInput.value.trim();
    const color = colorInput.value;
    const danos = danosInput.value.trim();

    if (!placa || !marca || !color || !danos) {
        mostrarToast('⚠️ Completa todos los campos');
        return;
    }

    if (App.inventario[placa]) {
        mostrarToast('⚠️ Esa placa ya existe');
        return;
    }

    App.inventario[placa] = { marca, color, danos };
    guardarEnLocalStorage();
    actualizarContador();

    // Limpiar
    placaInput.value = '';
    marcaInput.value = '';
    colorInput.value = '';
    danosInput.value = '';

    mostrarToast(`✅ Vehículo ${placa} registrado`);
}

function eliminarVehiculo(placa) {
    if (!confirm(`¿Eliminar vehículo ${placa}?`)) return;
    delete App.inventario[placa];
    guardarEnLocalStorage();
    actualizarContador();
    
    // Limpiar vista de búsqueda si estaba activa
    document.getElementById('resultadoRapido').style.display = 'none';
    document.getElementById('busquedaRapida').value = '';
    
    mostrarToast(`🗑️ ${placa} eliminado`);
}

function editarVehiculo(placa) {
    const v = App.inventario[placa];
    if (!v) return;

    const nMarca = prompt('Editar marca:', v.marca);
    if (nMarca === null) return;
    const nColor = prompt('Editar color:', v.color);
    if (nColor === null) return;
    const nDanos = prompt('Editar daños:', v.danos);
    if (nDanos === null) return;

    App.inventario[placa] = {
        marca: nMarca.trim(),
        color: nColor.trim().toLowerCase(),
        danos: nDanos.trim()
    };
    guardarEnLocalStorage();
    mostrarToast(`✏️ ${placa} actualizado`);
    
    // Forzar refresco visual si estamos en búsqueda rápida
    const busq = document.getElementById('busquedaRapida').value;
    if(normalizar(busq) === placa) {
        document.getElementById('busquedaRapida').dispatchEvent(new Event('input'));
    }
}

// ==================== PLANILLA ====================

function buscar() {
    const raw = document.getElementById('inputPlacas').value;
    if (!raw.trim()) {
        mostrarToast('⚠️ Pega placas primero');
        return;
    }

    const placas = raw.split(/[\n,;\s]+/).map(p => normalizar(p)).filter(Boolean);
    let filas = '';
    let encontradas = 0;

    placas.forEach(placa => {
        const v = App.inventario[placa];
        if (v) {
            encontradas++;
            const colorHex = App.coloresCSS[v.color] || '#999';
            filas += `
                <tr>
                    <td data-label="Placa"><span class="plate">${escaparHTML(placa)}</span></td>
                    <td data-label="Marca">${escaparHTML(v.marca)}</td>
                    <td data-label="Color">
                        <span class="color-dot" style="background:${colorHex}"></span>
                        ${escaparHTML(v.color)}
                    </td>
                    <td data-label="Daños">${escaparHTML(v.danos)}</td>
                </tr>
            `;
        } else {
            filas += `
                <tr>
                    <td data-label="Placa"><span class="plate">${escaparHTML(placa)}</span></td>
                    <td colspan="3" data-label="Estado"><span class="badge-notfound">⚠ No registrada</span></td>
                </tr>
            `;
        }
    });

    const stats = document.getElementById('statsRow');
    stats.style.display = 'flex';
    stats.innerHTML = `
        <div class="stat">Total: ${placas.length}</div>
        <div class="stat">Encontradas: ${encontradas}</div>
        <div class="stat">Faltantes: ${placas.length - encontradas}</div>
    `;

    document.getElementById('resultado').innerHTML = `
        <div class="table-wrap">
            <table id="tablaResultado">
                <thead>
                    <tr><th>Placa</th><th>Marca</th><th>Color</th><th>Daños</th></tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
    mostrarToast('✅ Planilla generada');
}

// ==================== UTILIDADES EXTRAS ====================

function copiarTabla() {
    const tabla = document.getElementById('tablaResultado');
    if (!tabla) return mostrarToast('⚠️ Genera la planilla primero');

    let texto = "";
    tabla.querySelectorAll('tr').forEach(tr => {
        const fila = Array.from(tr.querySelectorAll('th, td')).map(td => td.innerText.trim()).join('\t');
        texto += fila + "\n";
    });

    navigator.clipboard.writeText(texto).then(() => {
        mostrarToast('📋 Copiado al portapapeles');
    });
}

function exportarDatos() {
    const data = { inventario: App.inventario, coloresCSS: App.coloresCSS };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_rondero_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const datos = JSON.parse(e.target.result);
            App.inventario = datos.inventario || datos;
            if (datos.coloresCSS) App.coloresCSS = datos.coloresCSS;
            guardarEnLocalStorage();
            actualizarContador();
            mostrarToast('✅ Importación exitosa');
        } catch (err) {
            mostrarToast('❌ Archivo inválido');
        }
    };
    reader.readAsText(file);
}

function limpiar() {
    document.getElementById('inputPlacas').value = '';
    document.getElementById('statsRow').style.display = 'none';
    document.getElementById('resultado').innerHTML = '<div class="empty"><div class="empty-icon">🚘</div><p>Vista limpia</p></div>';
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('hoy').textContent = fechaHoy();
    cargarDesdeLocalStorage();
    actualizarContador();

    const busqInput = document.getElementById('busquedaRapida');
    busqInput.addEventListener('input', (e) => {
        const val = normalizar(e.target.value);
        const resDiv = document.getElementById('resultadoRapido');

        if (val.length < 2) {
            resDiv.style.display = 'none';
            return;
        }

        const encontrados = Object.keys(App.inventario).filter(p => p.includes(val));
        resDiv.style.display = 'block';

        if (encontrados.length === 0) {
            resDiv.innerHTML = '<span style="color:var(--err)">⚠️ No registrado</span>';
        } else {
            resDiv.innerHTML = encontrados.map(p => {
                const v = App.inventario[p];
                return `
                    <div class="search-item">
                        <div>
                            <b>${p}</b> - ${v.marca} (${v.color})<br>
                            <small>${v.danos}</small>
                        </div>
                        <div class="btn-row" style="margin-top:8px">
                            <button class="btn-primary" style="padding:4px 8px; font-size:11px" onclick="editarVehiculo('${p}')">Editar</button>
                            <button class="btn-danger" style="padding:4px 8px; font-size:11px" onclick="eliminarVehiculo('${p}')">Borrar</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    });
});
