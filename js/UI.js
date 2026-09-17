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

window.mostrarRestoFormulario = function() {
  const contenedor = document.getElementById('seccionesRestantesFormulario');
  if (contenedor) {
    contenedor.style.display = 'block';
  }
};

window.resetearFormularioAInicial = function() {
  const contenedor = document.getElementById('seccionesRestantesFormulario');
  if (contenedor) {
    contenedor.style.display = 'none';
  }
  
  const radios = document.querySelectorAll('input[name="tipoOperacion"]');
  radios.forEach(r => r.checked = false);
};

function cambiarSeccion(seccion, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${seccion}`).classList.add('active');

  const secDashboard = document.getElementById('sec-dashboard');
  const secBalance = document.getElementById('sec-balance');
  const secHistorial = document.getElementById('sec-historial');
  
  const topbarTitle = document.getElementById('topbarTitle');
  const topbarSubtitle = document.getElementById('topbarSubtitle');

  // Ocultar todas las secciones primero
  secDashboard.style.display = 'none';
  secBalance.style.display = 'none';
  secHistorial.style.display = 'none';

  if (seccion === 'dashboard') {
    secDashboard.style.display = 'block';
    topbarTitle.innerText = 'Nuevo Pago / Depósito';
    topbarSubtitle.innerText = 'Sube aquí el comprobante y completa los datos de la operación.';
  } else if (seccion === 'balance') {
    secBalance.style.display = 'block';
    topbarTitle.innerText = 'Balance General';
    topbarSubtitle.innerText = 'Estado neto de la cuenta, ingresos totales acumulados y gastos registrados.';
  } else if (seccion === 'boletas') {
    secHistorial.style.display = 'block';
    topbarTitle.innerText = 'Historial de Recibos';
    topbarSubtitle.innerText = 'Consulta los pagos de servicios y universidad con sus capturas.';
    filtrarMovimientos('PAGO_GASTO');
  } else if (seccion === 'depositos') {
    secHistorial.style.display = 'block';
    topbarTitle.innerText = 'Historial de Depósitos';
    topbarSubtitle.innerText = 'Consulta las transferencias y abonados recibidos.';
    filtrarMovimientos('DEPOSITO_RECIBIDO');
  }
}

function actualizarTarjetasBalance(totalDepositado, totalPagado) {
  const elDep = document.getElementById('totalDepositado');
  const elPag = document.getElementById('totalPagado');
  const elSal = document.getElementById('saldoDisponible');

  if (elDep) elDep.innerText = `S/ ${totalDepositado.toFixed(2)}`;
  if (elPag) elPag.innerText = `S/ ${totalPagado.toFixed(2)}`;
  if (elSal) elSal.innerText = `S/ ${(totalDepositado - totalPagado).toFixed(2)}`;
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

  const labelComprobanteTitle = document.getElementById('comprobanteTitleLabel');
  const labelFileName = document.getElementById('fileNameLabel');

  if (nombre.includes('alquiler') || nombre.includes('cuarto')) {
    labelComprobanteTitle.innerText = "5. Comprobante / Recibo (Permite 1 o 2 Capturas)";
    labelFileName.innerText = "Haz clic aquí para seleccionar la(s) captura(s)";
  } else {
    labelComprobanteTitle.innerText = "5. Comprobante / Recibo (Obligatorio)";
    labelFileName.innerText = "Haz clic aquí para seleccionar la captura";
  }

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
    contenedor.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 24px;">No se encontraron registros en esta sección.</p>`;
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

    const estaActivo = index === 0 ? 'active' : '';

    return `
      <div class="accordion-item ${estaActivo}" id="acc-item-${index}">
        <div class="accordion-header" onclick="toggleAccordion('acc-item-${index}')">
          <div class="accordion-title-box">
            <i class="ph-bold ${iconoCat}"></i>
            <span>${nombreCat}</span>
          </div>
          <div class="accordion-meta">
            <span class="badge-count">${registros.length} Registro(s)</span>
            <i class="ph-bold ph-caret-down arrow-icon"></i>
          </div>
        </div>

        <div class="accordion-content">
          <div class="months-items-grid">
            ${registros.map(t => {
              const esDeposito = t.tipo_operacion === 'DEPOSITO_RECIBIDO';
              return `
                <div class="tx-item-card" onclick="abrirModalDetalle(${t.id})">
                  <div class="tx-info-main">
                    <span class="tx-category ${esDeposito ? 'cat-ingreso' : 'cat-gasto'}">
                      Mes: ${t.concepto}
                    </span>
                    <p class="tx-title">${t.concepto}</p>
                  </div>

                  <div class="tx-right-side">
                    <span class="tx-monto-bold">S/ ${parseFloat(t.monto).toFixed(2)}</span>
                    <span class="chevron-icon"><i class="ph-bold ph-caret-right"></i> Ver comprobante</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAccordion(idElemento) {
  const item = document.getElementById(idElemento);
  if (item) {
    item.classList.toggle('active');
  }
}

function filtrarPorBuscador(texto) {
  const query = texto.toLowerCase().trim();
  
  if (query === "") {
    renderizarListaTransacciones(listaGlobalTransacciones);
    return;
  }

  const filtrados = listaGlobalTransacciones.filter(t => {
    const mesConcepto = t.concepto ? t.concepto.toLowerCase() : "";
    const categoria = t.categorias ? t.categorias.nombre.toLowerCase() : "";
    return mesConcepto.includes(query) || categoria.includes(query);
  });

  renderizarListaTransacciones(filtrados);
}

function abrirModalDetalle(id) {
  const t = listaGlobalTransacciones.find(item => item.id === id);
  if (!t) return;

  const esDeposito = t.tipo_operacion === 'DEPOSITO_RECIBIDO';
  const nombreCat = t.categorias ? t.categorias.nombre : 'General';

  const fechaObj = new Date(t.fecha_completado || t.fecha_registro);
  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaFormateada = fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

  document.getElementById('modalCategoriaBadge').innerText = nombreCat;
  document.getElementById('modalCategoriaBadge').className = `tx-category ${esDeposito ? 'cat-ingreso' : 'cat-gasto'}`;
  document.getElementById('modalConceptoTitle').innerText = `Periodo: ${t.concepto}`;
  document.getElementById('modalMontoText').innerText = `S/ ${parseFloat(t.monto).toFixed(2)}`;
  document.getElementById('modalFechaText').innerText = `${fechaFormateada} - ${horaFormateada}`;
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
      <img src="${url}" alt="Comprobante de operación">
      <div class="img-overlay-hover"><i class="ph-bold ph-arrows-out-simple"></i> Ampliar</div>
    </a>
  `).join('');

  document.getElementById('modalDetalle').style.display = 'flex';
}

function cerrarModalDetalle() {
  document.getElementById('modalDetalle').style.display = 'none';
}