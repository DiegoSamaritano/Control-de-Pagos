const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let bufferMontoManual = "";

const CATEGORIAS_DEFAULT = [
  { id: 1, nombre: 'Universidad' },
  { id: 2, nombre: 'Internet' },
  { id: 3, nombre: 'Alquiler de Cuarto' },
  { id: 4, nombre: 'Transferencia Semanal' },
  { id: 5, nombre: 'Gastos Adicionales' }
];

function cambiarSeccion(seccion, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
  const btnActivo = document.getElementById(`nav-${seccion}`);
  if (btnActivo) btnActivo.classList.add('active');

  const secDashboard = document.getElementById('sec-dashboard');
  const secBalance = document.getElementById('sec-balance');
  const secHistorial = document.getElementById('sec-historial');

  if (secDashboard) secDashboard.style.display = 'none';
  if (secBalance) secBalance.style.display = 'none';
  if (secHistorial) secHistorial.style.display = 'none';

  if (seccion === 'dashboard') {
    if (secDashboard) secDashboard.style.display = 'block';
  } else if (seccion === 'balance') {
    if (secBalance) secBalance.style.display = 'block';
  } else if (seccion === 'boletas') {
    if (secHistorial) secHistorial.style.display = 'block';
    filtrarMovimientos('PAGO_GASTO');
  } else if (seccion === 'depositos') {
    if (secHistorial) secHistorial.style.display = 'block';
    filtrarMovimientos('DEPOSITO_RECIBIDO');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarRestoFormulario() {
  const contenedor = document.getElementById('seccionesRestantesFormulario');
  if (contenedor) contenedor.style.display = 'block';
}

function resetearFormularioAInicial() {
  const contenedor = document.getElementById('seccionesRestantesFormulario');
  if (contenedor) contenedor.style.display = 'none';
  
  const radios = document.querySelectorAll('input[name="tipoOperacion"]');
  radios.forEach(r => r.checked = false);
}

function llenarSelectCategorias(categorias) {
  const contenedor = document.getElementById('gridCategorias');
  if (!contenedor) return;

  const lista = (categorias && categorias.length > 0) ? categorias : CATEGORIAS_DEFAULT;

  contenedor.innerHTML = lista.map((c, index) => {
    let icono = 'ph-tag';
    const nombre = c.nombre.toLowerCase();

    if (nombre.includes('universidad')) icono = 'ph-graduation-cap';
    else if (nombre.includes('internet')) icono = 'ph-wifi-high';
    else if (nombre.includes('alquiler') || nombre.includes('cuarto')) icono = 'ph-house-line';
    else if (nombre.includes('semanal') || nombre.includes('semana')) icono = 'ph-hand-coins';
    else if (nombre.includes('adicional')) icono = 'ph-receipt';

    const esPrimero = index === 0;

    return `
      <div class="cat-card ${esPrimero ? 'selected' : ''}" onclick="seleccionarTarjetaCategoria(${c.id}, '${c.nombre}', this)">
        <i class="ph-bold ${icono}"></i>
        <span>${c.nombre}</span>
      </div>
    `;
  }).join('');

  if (lista.length > 0) {
    seleccionarTarjetaCategoria(lista[0].id, lista[0].nombre, contenedor.children[0]);
  }

  renderizarTarjetasMeses();
}

function seleccionarTarjetaCategoria(id, nombreCategoria, elemento) {
  document.querySelectorAll('.cat-card').forEach(card => card.classList.remove('selected'));
  if (elemento) elemento.classList.add('selected');

  const catInput = document.getElementById('categoriaIdInput');
  if (catInput) catInput.value = id;

  const nombre = nombreCategoria.toLowerCase();
  const wrapperSemanal = document.getElementById('wrapperOpcionesSemanal');
  const wrapperKeypad = document.getElementById('wrapperKeypad');

  if (nombre.includes('semana') || nombre.includes('semanal')) {
    if (wrapperSemanal) wrapperSemanal.style.display = 'block';
    if (wrapperKeypad) wrapperKeypad.style.display = 'none';
    bufferMontoManual = "";
    const primeraTarjeta = wrapperSemanal ? wrapperSemanal.querySelector('.semanal-card') : null;
    seleccionarMontoSemanal(150, primeraTarjeta);
  } else if (nombre.includes('adicional')) {
    if (wrapperSemanal) wrapperSemanal.style.display = 'none';
    if (wrapperKeypad) wrapperKeypad.style.display = 'block';
    bufferMontoManual = "";
    actualizarDisplayMonto(0);
  } else {
    if (wrapperSemanal) wrapperSemanal.style.display = 'none';
    if (wrapperKeypad) wrapperKeypad.style.display = 'none';
    bufferMontoManual = "";

    let montoFijo = 0;
    if (nombre.includes('universidad')) montoFijo = 877;
    else if (nombre.includes('internet')) montoFijo = 75;
    else if (nombre.includes('alquiler') || nombre.includes('cuarto')) montoFijo = 510;

    actualizarDisplayMonto(montoFijo);
  }
}

function seleccionarMontoSemanal(monto, elemento) {
  document.querySelectorAll('.semanal-card').forEach(card => card.classList.remove('selected'));
  if (elemento) elemento.classList.add('selected');
  actualizarDisplayMonto(monto);
}

function pressNumpad(key) {
  if (key === 'back') {
    bufferMontoManual = bufferMontoManual.slice(0, -1);
  } else if (key === '.') {
    if (!bufferMontoManual.includes('.')) {
      bufferMontoManual += bufferMontoManual === "" ? "0." : ".";
    }
  } else {
    if (bufferMontoManual.includes('.')) {
      const parts = bufferMontoManual.split('.');
      if (parts[1].length >= 2) return;
    }
    bufferMontoManual += key;
  }

  const montoFinal = parseFloat(bufferMontoManual) || 0;
  actualizarDisplayMonto(montoFinal);
}

function actualizarDisplayMonto(monto) {
  const input = document.getElementById('montoInput');
  const text = document.getElementById('displayMontoText');

  if (input) input.value = monto;
  if (text) text.innerText = `S/ ${parseFloat(monto).toFixed(2)}`;
}

function renderizarTarjetasMeses() {
  const contenedor = document.getElementById('gridMeses');
  if (!contenedor) return;

  contenedor.innerHTML = MESES.map((mes, index) => `
    <div class="month-card ${index === 8 ? 'selected' : ''}" onclick="seleccionarTarjetaMes('${mes}', this)">
      ${mes}
    </div>
  `).join('');

  const mesInput = document.getElementById('mesInput');
  if (mesInput) mesInput.value = MESES[8];
}

function seleccionarTarjetaMes(mes, elemento) {
  document.querySelectorAll('.month-card').forEach(card => card.classList.remove('selected'));
  if (elemento) elemento.classList.add('selected');
  const mesInput = document.getElementById('mesInput');
  if (mesInput) mesInput.value = mes;
}

function renderizarListaTransacciones(items) {
  const contenedor = document.getElementById('listaCategoriasAgrupadas');
  if (!contenedor) return;

  if (!items || items.length === 0) {
    contenedor.innerHTML = `<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px;">Sin registros en este periodo.</p>`;
    return;
  }

  const grupos = {};
  items.forEach(item => {
    const nombreCat = item.categorias ? item.categorias.nombre : 'General';
    if (!grupos[nombreCat]) grupos[nombreCat] = [];
    grupos[nombreCat].push(item);
  });

  contenedor.innerHTML = Object.keys(grupos).map((nombreCat, index) => {
    const registros = grupos[nombreCat];
    
    let iconoCat = 'ph-tag';
    const nameLower = nombreCat.toLowerCase();
    if (nameLower.includes('universidad')) iconoCat = 'ph-graduation-cap';
    else if (nameLower.includes('internet')) iconoCat = 'ph-wifi-high';
    else if (nameLower.includes('alquiler') || nameLower.includes('cuarto')) iconoCat = 'ph-house-line';
    else if (nameLower.includes('semanal') || nameLower.includes('semana')) iconoCat = 'ph-hand-coins';
    else if (nameLower.includes('adicional')) iconoCat = 'ph-receipt';

    return `
      <div class="service-card" style="margin-bottom:8px; flex-direction:column; align-items:stretch; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="service-card-header">
            <div class="service-icon uni"><i class="ph-bold ${iconoCat}"></i></div>
            <div class="service-titles">
              <h4>${nombreCat}</h4>
              <span class="service-sub">${registros.length} registro(s)</span>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
          ${registros.map(t => {
            const esDeposito = t.tipo_operacion === 'DEPOSITO_RECIBIDO';
            return `
              <div class="month-row-item" onclick="abrirModalDetalle(${t.id})" style="cursor:pointer;">
                <span class="m-name">${t.concepto}</span>
                <span class="m-val ${esDeposito ? 'text-emerald' : ''}">S/ ${parseFloat(t.monto).toFixed(2)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function toggleDetalleMesesBalance(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (contenedor) {
    contenedor.style.display = (contenedor.style.display === 'none' || contenedor.style.display === '') ? 'flex' : 'none';
  }
}

function abrirModalDetalle(id) {
  const t = listaGlobalTransacciones.find(item => item.id === id);
  if (!t) return;

  const esDeposito = t.tipo_operacion === 'DEPOSITO_RECIBIDO';
  const nombreCat = t.categorias ? t.categorias.nombre : 'General';

  const fechaObj = new Date(t.fecha_completado || t.fecha_registro);
  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  document.getElementById('modalCategoriaBadge').innerText = nombreCat;
  document.getElementById('modalConceptoTitle').innerText = `Periodo: ${t.concepto}`;
  document.getElementById('modalMontoText').innerText = `S/ ${parseFloat(t.monto).toFixed(2)}`;
  document.getElementById('modalFechaText').innerText = fechaFormateada;
  document.getElementById('modalTipoText').innerText = esDeposito ? 'Depósito Recibido' : 'Pago Realizado';
  
  const contenedorVouchers = document.getElementById('modalVouchersGrid');
  let urls = [];

  try {
    urls = JSON.parse(t.comprobante_url);
    if (!Array.isArray(urls)) urls = [t.comprobante_url];
  } catch(e) {
    urls = [t.comprobante_url];
  }

  contenedorVouchers.innerHTML = urls.map(url => `
    <a href="${url}" target="_blank" class="voucher-img-container">
      <img src="${url}" alt="Comprobante">
    </a>
  `).join('');

  document.getElementById('modalDetalle').style.display = 'flex';
}

function cerrarModalDetalle() {
  document.getElementById('modalDetalle').style.display = 'none';
}