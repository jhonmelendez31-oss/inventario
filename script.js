// =============================================
// SISTEMA DE CONTROL VEHICULAR - RONDERO
// VERSION CORREGIDA Y MEJORADA
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
  return (s || '')
    .replace(/\s+/g, '')
    .toUpperCase();
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

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function actualizarContador() {

  document.getElementById('totalVehiculos').textContent =
    Object.keys(App.inventario).length;
}

// ==================== PERSISTENCIA ====================

function guardarEnLocalStorage() {

  const backup = {
    inventario: App.inventario,
    coloresCSS: App.coloresCSS
  };

  localStorage.setItem(
    'inventarioVehicular',
    JSON.stringify(backup)
  );
}

function cargarDesdeLocalStorage() {

  const guardado =
    localStorage.getItem('inventarioVehicular');

  if (!guardado) return false;

  try {

    const datos = JSON.parse(guardado);

    App.inventario =
      datos.inventario || {};

    if (datos.coloresCSS) {
      App.coloresCSS = datos.coloresCSS;
    }

    console.log('✅ Datos restaurados desde LocalStorage');

    return true;

  } catch (error) {

    console.error(error);

    mostrarToast('❌ Error restaurando datos');

    return false;
  }
}

// ==================== CARGA INICIAL ====================

async function cargarDatos() {

  // Primero intentar LocalStorage
  const cargado = cargarDesdeLocalStorage();

  if (cargado) {
    iniciarSistema();
    return;
  }

  // Si no existe LocalStorage -> cargar JSON
  try {

    const response =
      await fetch('inventario_vehicular.json');

    if (response.ok) {

      const data = await response.json();

      App.inventario =
        data.inventario || data;

      if (data.coloresCSS) {
        App.coloresCSS = data.coloresCSS;
      }

      guardarEnLocalStorage();

      console.log('✅ Datos cargados desde JSON');
    }

  } catch (error) {

    console.log('⚠️ JSON no encontrado');

  }

  iniciarSistema();
}

// ==================== CRUD ====================

function agregarVehiculo() {

  const placa = normalizar(
    document.getElementById('nuevaPlaca').value
  );

  const marca =
    document.getElementById('nuevaMarca')
      .value
      .trim();

  const color =
    document.getElementById('nuevoColor')
      .value;

  const danos =
    document.getElementById('nuevosDanos')
      .value
      .trim();

  if (!placa || !marca || !color || !danos) {

    mostrarToast('⚠️ Completa todos los campos');

    return;
  }

  if (App.inventario[placa]) {

    mostrarToast('⚠️ Esa placa ya existe');

    return;
  }

  App.inventario[placa] = {
    marca,
    color,
    danos
  };

  guardarEnLocalStorage();

  actualizarContador();

  // Limpiar formulario
  document.getElementById('nuevaPlaca').value = '';
  document.getElementById('nuevaMarca').value = '';
  document.getElementById('nuevoColor').value = '';
  document.getElementById('nuevosDanos').value = '';

  mostrarToast(`✅ Vehículo ${placa} agregado`);
}

function editarVehiculo(placa) {

  const vehiculo = App.inventario[placa];

  if (!vehiculo) return;

  const nuevaMarca =
    prompt('Editar marca:', vehiculo.marca);

  if (nuevaMarca === null) return;

  const nuevoColor =
    prompt('Editar color:', vehiculo.color);

  if (nuevoColor === null) return;

  const nuevosDanos =
    prompt('Editar daños:', vehiculo.danos);

  if (nuevosDanos === null) return;

  App.inventario[placa] = {
    marca: nuevaMarca.trim(),
    color: nuevoColor.trim().toLowerCase(),
    danos: nuevosDanos.trim()
  };

  guardarEnLocalStorage();

  mostrarToast(`✏️ ${placa} actualizado`);

  actualizarBusquedaRapida();
}

function eliminarVehiculo(placa) {

  const confirmar =
    confirm(`¿Eliminar vehículo ${placa}?`);

  if (!confirmar) return;

  delete App.inventario[placa];

  guardarEnLocalStorage();

  actualizarContador();

  document.getElementById(
    'resultadoRapido'
  ).style.display = 'none';

  document.getElementById(
    'busquedaRapida'
  ).value = '';

  mostrarToast(`🗑️ ${placa} eliminado`);
}

// ==================== PLANILLA ====================

function buscar() {

  const raw =
    document.getElementById('inputPlacas').value;

  if (!raw.trim()) {

    mostrarToast('⚠️ Pega placas primero');

    return;
  }

  const placas = raw
    .split(/[\n,;]+/)
    .map(p => normalizar(p))
    .filter(Boolean);

  let filas = '';

  let encontradas = 0;
  let noEncontradas = 0;

  placas.forEach(placa => {

    const v = App.inventario[placa];

    if (v) {

      encontradas++;

      const color =
        App.coloresCSS[v.color] || '#999';

      const dot = `
        <span
          class="color-dot"
          style="
            background:${color};
            width:12px;
            height:12px;
            border-radius:50%;
            display:inline-block;
            margin-right:6px;
            border:1px solid #ccc;
            vertical-align:middle;
          ">
        </span>
      `;

      filas += `
        <tr>

          <td>
            <span class="plate">
              ${escaparHTML(placa)}
            </span>
          </td>

          <td>
            ${escaparHTML(v.marca)}
          </td>

          <td>
            ${dot}
            ${escaparHTML(v.color)}
          </td>

          <td>
            ${escaparHTML(v.danos)}
          </td>

          <td>
            ${fechaCorta()}
          </td>

        </tr>
      `;

    } else {

      noEncontradas++;

      filas += `
        <tr>

          <td>
            <span class="plate">
              ${escaparHTML(placa)}
            </span>
          </td>

          <td colspan="3">
            <span class="badge-notfound">
              ⚠ No encontrada
            </span>
          </td>

          <td>
            ${fechaCorta()}
          </td>

        </tr>
      `;
    }
  });

  document.getElementById(
    'statsRow'
  ).style.display = 'flex';

  document.getElementById(
    'statsRow'
  ).innerHTML = `
    <div class="stat">
      Total: ${placas.length}
    </div>

    <div class="stat">
      Encontradas: ${encontradas}
    </div>

    <div class="stat">
      No encontradas: ${noEncontradas}
    </div>
  `;

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

        <tbody>
          ${filas}
        </tbody>

      </table>

    </div>
  `;

  mostrarToast('✅ Planilla generada');
}

// ==================== COPIAR TABLA ====================

function copiarTabla() {

  const tabla =
    document.getElementById('tablaResultado');

  if (!tabla) {

    mostrarToast('⚠️ Genera la planilla primero');

    return;
  }

  let texto = '';

  tabla.querySelectorAll('tr').forEach(tr => {

    const fila =
      [...tr.querySelectorAll('th, td')]
      .map(td => td.innerText.trim())
      .join('\t');

    texto += fila + '\n';
  });

  if (navigator.clipboard) {

    navigator.clipboard
      .writeText(texto);

  } else {

    const textarea =
      document.createElement('textarea');

    textarea.value = texto;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand('copy');

    textarea.remove();
  }

  mostrarToast('✅ Tabla copiada');
}

// ==================== EXPORTAR ====================

function exportarDatos() {

  const backup = {
    inventario: App.inventario,
    coloresCSS: App.coloresCSS
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: 'application/json' }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;

  a.download =
    'inventario_backup.json';

  a.click();

  URL.revokeObjectURL(url);

  mostrarToast('💾 Backup exportado');
}

// ==================== IMPORTAR ====================

function importarDatos(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    try {

      const datos =
        JSON.parse(e.target.result);

      if (
        typeof datos !== 'object'
      ) {
        throw new Error('JSON inválido');
      }

      App.inventario =
        datos.inventario || datos;

      if (datos.coloresCSS) {
        App.coloresCSS =
          datos.coloresCSS;
      }

      guardarEnLocalStorage();

      actualizarContador();

      mostrarToast(
        '✅ Datos importados correctamente'
      );

    } catch (error) {

      console.error(error);

      mostrarToast('❌ Archivo inválido');
    }
  };

  reader.readAsText(file);
}

// ==================== LIMPIAR ====================

function limpiar() {

  document.getElementById(
    'inputPlacas'
  ).value = '';

  document.getElementById(
    'statsRow'
  ).style.display = 'none';

  document.getElementById(
    'resultado'
  ).innerHTML = `
    <div class="empty">

      <div class="empty-icon">
        🚘
      </div>

      <p>
        Usa la búsqueda rápida o pega placas
      </p>

    </div>
  `;
}

// ==================== BUSQUEDA RAPIDA ====================

function actualizarBusquedaRapida() {

  const input =
    document.getElementById(
      'busquedaRapida'
    );

  if (input) {
    input.dispatchEvent(
      new Event('input')
    );
  }
}

// ==================== INICIO ====================

function iniciarSistema() {

  document.getElementById('hoy')
    .textContent = fechaHoy();

  actualizarContador();

  const busquedaInput =
    document.getElementById(
      'busquedaRapida'
    );

  if (!busquedaInput) return;

  busquedaInput.addEventListener(
    'input',
    function(e) {

      e.target.value =
        e.target.value.toUpperCase();

      const texto =
        normalizar(e.target.value);

      const resultado =
        document.getElementById(
          'resultadoRapido'
        );

      if (texto.length < 2) {

        resultado.style.display = 'none';

        return;
      }

      // BUSQUEDA PARCIAL
      const encontrados =
        Object.keys(App.inventario)
          .filter(placa =>
            placa.includes(texto)
          );

      if (!encontrados.length) {

        resultado.style.display = 'block';

        resultado.innerHTML = `
          <span style="color:red">
            ⚠️ No registrada
          </span>
        `;

        return;
      }

      resultado.style.display = 'block';

      resultado.innerHTML =
        encontrados.map(placa => {

          const v =
            App.inventario[placa];

          return `
            <div style="
              margin-bottom:14px;
              padding-bottom:14px;
              border-bottom:1px solid #333;
            ">

              <b>✅ ${escaparHTML(placa)}</b>

              <br><br>

              <b>Marca:</b>
              ${escaparHTML(v.marca)}

              <br>

              <b>Color:</b>
              ${escaparHTML(v.color)}

              <br>

              <b>Daños:</b>
              ${escaparHTML(v.danos)}

              <br><br>

              <button
                class="btn-primary"
                onclick="editarVehiculo('${placa}')">

                ✏️ Editar

              </button>

              <button
                class="btn-danger"
                onclick="eliminarVehiculo('${placa}')">

                🗑️ Eliminar

              </button>

            </div>
          `;

        }).join('');
    }
  );

  console.log(
    '🚗 Sistema iniciado correctamente'
  );
}

// ==================== INICIAR APP ====================

cargarDatos();
