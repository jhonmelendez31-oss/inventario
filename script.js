// =============================================
// SISTEMA DE CONTROL VEHICULAR - RONDERO
// =============================================

let inventario = {};
let coloresCSS = {};

// ==================== CARGA DE DATOS ====================

async function cargarDatos() {
  try {
    const response = await fetch('inventario_vehicular.json');
    if (response.ok) {
      const data = await response.json();
      inventario = data.inventario || data;
      coloresCSS = data.coloresCSS || {};
      console.log('✅ Datos cargados desde JSON');
    }
  } catch (error) {
    console.log('⚠️ JSON no encontrado, usando LocalStorage');
  }

  cargarDesdeLocalStorage();
  iniciarSistema();
}

// ==================== PERSISTENCIA ====================

function guardarEnLocalStorage() {
  const backup = { coloresCSS, inventario };
  localStorage.setItem('inventarioVehicular', JSON.stringify(backup));
}

function cargarDesdeLocalStorage() {
  const guardado = localStorage.getItem('inventarioVehicular');
  if (guardado) {
    const datos = JSON.parse(guardado);
    inventario = datos.inventario || datos;
    if (datos.coloresCSS) coloresCSS = datos.coloresCSS;
    console.log('✅ Datos restaurados desde LocalStorage');
  }
}

// ==================== UTILIDADES ====================

function normalizar(s) {
  return s.replace(/\s+/g, "").toUpperCase();
}

function fechaHoy() {
  const d = new Date();
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function fechaCorta() {
  return new Date().toLocaleDateString('es-CO');
}

function mostrarToast(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = mensaje;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function actualizarContador() {
  document.getElementById('totalVehiculos').textContent = Object.keys(inventario).length;
}

// ==================== CRUD ====================

function agregarVehiculo() {
  const placa = normalizar(document.getElementById('nuevaPlaca').value);
  const marca = document.getElementById('nuevaMarca').value.trim();
  const color = document.getElementById('nuevoColor').value;
  const danos = document.getElementById('nuevosDanos').value.trim();

  if (!placa || !marca || !color || !danos) {
    mostrarToast('⚠️ Completa todos los campos');
    return;
  }

  if (inventario[placa]) {
    mostrarToast('⚠️ Esa placa ya existe');
    return;
  }

  inventario[placa] = { marca, color, danos };
  guardarEnLocalStorage();
  actualizarContador();

  // Limpiar formulario
  document.getElementById('nuevaPlaca').value = '';
  document.getElementById('nuevaMarca').value = '';
  document.getElementById('nuevoColor').value = '';
  document.getElementById('nuevosDanos').value = '';

  mostrarToast(`✅ Vehículo ${placa} agregado correctamente`);
}

function editarVehiculo(placa) {
  const vehiculo = inventario[placa];
  if (!vehiculo) return;

  const nuevaMarca = prompt('Editar marca:', vehiculo.marca);
  if (nuevaMarca === null) return;

  const nuevoColor = prompt('Editar color:', vehiculo.color);
  if (nuevoColor === null) return;

  const nuevosDanos = prompt('Editar daños:', vehiculo.danos);
  if (nuevosDanos === null) return;

  inventario[placa] = {
    marca: nuevaMarca.trim(),
    color: nuevoColor.trim().toLowerCase(),
    danos: nuevosDanos.trim()
  };

  guardarEnLocalStorage();
  mostrarToast(`✏️ ${placa} actualizado`);
  actualizarBusquedaRapida();
}

function eliminarVehiculo(placa) {
  if (!confirm(`¿Eliminar vehículo ${placa}?`)) return;

  delete inventario[placa];
  guardarEnLocalStorage();
  actualizarContador();
  mostrarToast(`🗑️ ${placa} eliminado`);

  document.getElementById('resultadoRapido').style.display = 'none';
  document.getElementById('busquedaRapida').value = '';
}

// ==================== BÚSQUEDA Y PLANILLA ====================

function buscar() {
  const raw = document.getElementById('inputPlacas').value;

  if (!raw.trim()) {
    mostrarToast('⚠️ Pega placas primero');
    return;
  }

  const placas = raw
    .split(/[\n,;]+/)
    .map(p => normalizar(p.trim()))
    .filter(Boolean);

  let filas = '';
  let encontradas = 0;
  let noEncontradas = 0;

  placas.forEach(placa => {
    const v = inventario[placa];

    if (v) {
      encontradas++;
      const dot = `<span class="color-dot" style="background:${coloresCSS[v.color] || '#999'}"></span>`;
      filas += `
        <tr>
          <td><span class="plate">${placa}</span></td>
          <td>${v.marca}</td>
          <td>\( {dot} \){v.color}</td>
          <td>${v.danos}</td>
          <td>${fechaCorta()}</td>
        </tr>`;
    } else {
      noEncontradas++;
      filas += `
        <tr>
          <td><span class="plate">${placa}</span></td>
          <td colspan="3"><span class="badge-notfound">⚠ No encontrada</span></td>
          <td>${fechaCorta()}</td>
        </tr>`;
    }
  });

  document.getElementById('statsRow').style.display = 'flex';
  document.getElementById('statsRow').innerHTML = `
    <div class="stat">Total: ${placas.length}</div>
    <div class="stat">Encontradas: ${encontradas}</div>
    <div class="stat">No encontradas: ${noEncontradas}</div>`;

  document.getElementById('resultado').innerHTML = `
    <div class="table-wrap">
      <table id="tablaResultado">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Marca</th>
            <th>Color</th>
            <th>Daños</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;

  mostrarToast('✅ Planilla generada');
}

function copiarTabla() {
  const tabla = document.getElementById('tablaResultado');
  if (!tabla) {
    mostrarToast('⚠️ Genera la planilla primero');
    return;
  }

  let texto = '';
  tabla.querySelectorAll('tr').forEach(tr => {
    const fila = [...tr.querySelectorAll('th, td')]
      .map(td => td.innerText.trim())
      .join('\t');
    texto += fila + '\n';
  });

  navigator.clipboard.writeText(texto);
  mostrarToast('✅ Tabla copiada al portapapeles');
}

function exportarDatos() {
  const backup = { coloresCSS, inventario };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventario_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  mostrarToast('💾 Backup exportado');
}

function importarDatos(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const datos = JSON.parse(e.target.result);
      inventario = datos.inventario || datos;
      if (datos.coloresCSS) coloresCSS = datos.coloresCSS;

      actualizarContador();
      mostrarToast('✅ Datos importados correctamente');
    } catch (error) {
      mostrarToast('❌ Archivo inválido');
    }
  };
  reader.readAsText(file);
}

function limpiar() {
  document.getElementById('inputPlacas').value = '';
  document.getElementById('statsRow').style.display = 'none';
  document.getElementById('resultado').innerHTML = `
    <div class="empty">
      <div class="empty-icon">🚘</div>
      <p>Usa la búsqueda rápida o pega placas</p>
    </div>`;
}

function actualizarBusquedaRapida() {
  const input = document.getElementById('busquedaRapida');
  if (input) input.dispatchEvent(new Event('input'));
}

// ==================== INICIO ====================

function iniciarSistema() {
  document.getElementById('hoy').textContent = fechaHoy();
  actualizarContador();

  // Búsqueda rápida
  const busquedaInput = document.getElementById('busquedaRapida');
  if (busquedaInput) {
    busquedaInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.toUpperCase();
      const placa = normalizar(e.target.value);
      const resultado = document.getElementById('resultadoRapido');

      if (placa.length < 3) {
        resultado.style.display = 'none';
        return;
      }

      const v = inventario[placa];
      if (v) {
        resultado.style.display = 'block';
        resultado.innerHTML = `
          <b>✅ ${placa}</b><br><br>
          <b>Marca:</b> ${v.marca}<br>
          <b>Color:</b> ${v.color}<br>
          <b>Daños:</b> ${v.danos}<br><br>
          <button class="btn-primary" onclick="editarVehiculo('${placa}')">✏️ Editar</button>
          <button class="btn-danger" onclick="eliminarVehiculo('${placa}')">🗑️ Eliminar</button>
        `;
      } else {
        resultado.style.display = 'block';
        resultado.innerHTML = `<span style="color:red">⚠️ No registrada</span>`;
      }
    });
  }

  console.log('🚗 Sistema iniciado correctamente');
}

// Iniciar la aplicación
cargarDatos();
