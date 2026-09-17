const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let bufferMontoManual = "";

// NAVEGACIÓN INFERIOR MAESTRA
function cambiarSeccion(seccion, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
  let btnActivo = document.getElementById(`nav-${seccion}`);
  if (!btnActivo && seccion === 'boletas') btnActivo = document.getElementById('nav-historial');
  if (btnActivo) btnActivo.classList.add('active');

  const secDashboard = document.getElementById('sec-dashboard');
  const secBalance = document.getElementById('sec-balance');
  const secBoletas = document.getElementById('sec-boletas') || document.getElementById('sec-historial');
  const secDepositos = document.getElementById('sec-depositos');

  if (secDashboard) secDashboard.style.display = 'none';
  if (secBalance) secBalance.style.display = 'none';
  if (secBoletas) secBoletas.style.display = 'none';
  if (secDepositos) secDepositos.style.display = 'none';

  if (seccion === 'dashboard') {
    if (secDashboard) secDashboard.style.display = 'block';
  } else if (seccion === 'balance') {
    if (secBalance) secBalance.style.display = 'block';
    if (typeof obtenerTransacciones === 'function') obtenerTransacciones();
  } else if (seccion === 'boletas' || seccion === 'historial') {
    if (secBoletas) secBoletas.style.display = 'block';
    if (typeof filtrarRecibosPorMes === 'function') filtrarRecibosPorMes('TODOS');
  } else if (seccion === 'depositos') {
    if (secDepositos) secDepositos.style.display = 'block';
    if (typeof filtrarDepositosPorMes === 'function') filtrarDepositosPorMes('TODOS');
  }
}

// SELECCIONAR TIPO PASO 1 (TRANSICIÓN DEL POLLITO GRANDE AL MINI POLLITO LATERAL)
function seleccionarTipoPaso1(tipo) {
  const overlay = document.getElementById('chickenTransitionOverlay');
  const asistenteGrande = document.getElementById('wrapperAsistentePollito');
  const miniPollito = document.getElementById('wrapperMiniPollito');
  const p2 = document.getElementById('paso2Categoria');
  const p3 = document.getElementById('paso3Detalles');

  // Activar animación en pantalla completa del pollito
  if (overlay) {
    overlay.classList.add('active');
  }

  setTimeout(() => {
    if (asistenteGrande) asistenteGrande.style.display = 'none';
    if (miniPollito) miniPollito.style.display = 'flex';

    if (p2) {
      p2.style.display = 'block';
      p2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (p3) p3.style.display = 'none';

    // Desvanecer el overlay
    if (overlay) {
      overlay.classList.remove('active');
    }
  }, 650); // Tiempo de la transición fluida
}

function resetearFormularioAInicial() {
  const asistenteGrande = document.getElementById('wrapperAsistentePollito');
  const miniPollito = document.getElementById('wrapperMiniPollito');
  const p2 = document.getElementById('paso2Categoria');
  const p3 = document.getElementById('paso3Detalles');

  if (asistenteGrande) asistenteGrande.style.display = 'flex'; // Vuelve el pollito grande al inicio
  if (miniPollito) miniPollito.style.display = 'none'; // Oculta el mini pollito
  if (p2) p2.style.display = 'none';
  if (p3) p3.style.display = 'none';
  document.querySelectorAll('input[name="tipoOperacion"]').forEach(r => r.checked = false);
}

function llenarSelectCategorias(categorias) {
  const contenedor = document.getElementById('gridCategorias');
  if (!contenedor) return;

  const lista = (categorias && categorias.length > 0) ? categorias : [
    { id: 1, nombre: 'Universidad' },
    { id: 2, nombre: 'Internet' },
    { id: 3, nombre: 'Alquiler de Cuarto' },
    { id: 4, nombre: 'Transferencia Semanal' },
    { id: 5, nombre: 'Gastos Adicionales' }
  ];

  contenedor.innerHTML = lista.map((c) => {
    let icono = 'ph-tag';
    const n = c.nombre.toLowerCase();
    if (n.includes('universidad')) icono = 'ph-graduation-cap';
    else if (n.includes('internet')) icono = 'ph-wifi-high';
    else if (n.includes('alquiler') || n.includes('cuarto')) icono = 'ph-house-line';
    else if (n.includes('semanal')) icono = 'ph-hand-coins';
    else if (n.includes('adicional')) icono = 'ph-receipt';

    return `
      <div class="cat-card" onclick="seleccionarCategoriaPaso2(${c.id}, '${c.nombre}', this)">
        <i class="ph-bold ${icono}"></i>
        <span>${c.nombre}</span>
      </div>
    `;
  }).join('');

  renderizarTarjetasMeses();
}

function seleccionarCategoriaPaso2(id, nombreCategoria, elemento) {
  document.querySelectorAll('.cat-card').forEach(card => card.classList.remove('selected'));
  if (elemento) elemento.classList.add('selected');

  document.getElementById('categoriaIdInput').value = id;
  const p3 = document.getElementById('paso3Detalles');
  if (p3) {
    p3.style.display = 'block';
    p3.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const n = nombreCategoria.toLowerCase();
  const wrapperSemanal = document.getElementById('wrapperOpcionesSemanal');
  const wrapperKeypad = document.getElementById('wrapperKeypad');

  if (n.includes('semana')) {
    if (wrapperSemanal) wrapperSemanal.style.display = 'block';
    if (wrapperKeypad) wrapperKeypad.style.display = 'none';
    seleccionarMontoSemanal(150, wrapperSemanal.querySelector('.semanal-card'));
  } else if (n.includes('adicional')) {
    if (wrapperSemanal) wrapperSemanal.style.display = 'none';
    if (wrapperKeypad) wrapperKeypad.style.display = 'block';
    bufferMontoManual = "";
    actualizarDisplayMonto(0);
  } else {
    if (wrapperSemanal) wrapperSemanal.style.display = 'none';
    if (wrapperKeypad) wrapperKeypad.style.display = 'none';
    let montoFijo = 0;
    if (n.includes('universidad')) montoFijo = 877;
    else if (n.includes('internet')) montoFijo = 75;
    else if (n.includes('alquiler') || n.includes('cuarto')) montoFijo = 510;
    actualizarDisplayMonto(montoFijo);
  }
}

function seleccionarMontoSemanal(monto, elemento) {
  document.querySelectorAll('.semanal-card').forEach(card => card.classList.remove('selected'));
  if (elemento) elemento.classList.add('selected');
  actualizarDisplayMonto(monto);
}

function pressNumpad(key) {
  if (key === 'back') bufferMontoManual = bufferMontoManual.slice(0, -1);
  else if (key === '.') { if (!bufferMontoManual.includes('.')) bufferMontoManual += "."; }
  else bufferMontoManual += key;
  actualizarDisplayMonto(parseFloat(bufferMontoManual) || 0);
}

function actualizarDisplayMonto(monto) {
  document.getElementById('montoInput').value = monto;
  document.getElementById('displayMontoText').innerText = `S/ ${parseFloat(monto).toFixed(2)}`;
}

function renderizarTarjetasMeses() {
  const contenedor = document.getElementById('gridMeses');
  if (!contenedor) return;
  contenedor.innerHTML = MESES.map((mes, index) => `
    <div class="month-card ${index === 8 ? 'selected' : ''}" onclick="seleccionarTarjetaMes('${mes}', this)">${mes}</div>
  `).join('');
  document.getElementById('mesInput').value = MESES[8];
}

function seleccionarTarjetaMes(mes, elemento) {
  document.querySelectorAll('.month-card').forEach(card => card.classList.remove('selected'));
  if (elemento) elemento.classList.add('selected');
  document.getElementById('mesInput').value = mes;
}

// RECIBOS DE PAGOS (DESPLIEGUE PROGRESIVO)
function filtrarRecibosPorMes(mesFiltro) {
  const container = document.getElementById('gridTodasCategoriasRecibos');
  if (!container) return;

  let filtrados = listaGlobalTransacciones.filter(t => t.tipo_operacion === 'PAGO_GASTO');

  if (mesFiltro !== 'TODOS') {
    filtrados = filtrados.filter(t => t.concepto && t.concepto.toLowerCase().includes(mesFiltro.toLowerCase()));
  }

  if (filtrados.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Sin recibos en este periodo.</p>`;
    return;
  }

  const grupos = {};
  filtrados.forEach(t => {
    const nombre = t.categorias ? t.categorias.nombre : 'Varios';
    if (!grupos[nombre]) grupos[nombre] = [];
    grupos[nombre].push(t);
  });

  container.innerHTML = Object.keys(grupos).map((catName, index) => {
    const items = grupos[catName];
    let icono = 'ph-receipt';
    const nLower = catName.toLowerCase();
    if (nLower.includes('universidad')) icono = 'ph-graduation-cap';
    else if (nLower.includes('internet')) icono = 'ph-wifi-high';
    else if (nLower.includes('alquiler') || nLower.includes('cuarto')) icono = 'ph-house-line';
    else if (nLower.includes('semanal')) icono = 'ph-hand-coins';

    const panelId = `recibo_cat_${index}`;

    return `
      <div class="category-row-card" style="flex-direction:column; align-items:stretch; gap:0; cursor:pointer;" onclick="toggleDespliegueRecibo('${panelId}')">
        <div class="cat-row-left" style="padding: 4px 0; justify-content: space-between; width: 100%;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="cat-row-icon"><i class="ph-bold ${icono}"></i></div>
            <div class="cat-row-info">
              <h4>${catName}</h4>
              <span>${items.length} registro(s) - Toca para desplegar</span>
            </div>
          </div>
          <i class="ph-bold ph-caret-down" style="color:var(--text-muted);"></i>
        </div>

        <div id="${panelId}" style="display: none; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          ${items.map(item => `
            <div class="month-row-item" onclick="event.stopPropagation(); abrirModalDetalle(${item.id})" style="cursor:pointer; padding:12px; background:#f8fafc; border:1px solid var(--border-color); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:13px; color:var(--brand-primary);"><i class="ph-bold ph-calendar-blank"></i> Periodo: ${item.concepto}</strong>
                <span style="display:block; font-size:11px; color:var(--text-muted); margin-top:2px;">Haz clic para ver voucher, monto y detalles</span>
              </div>
              <span style="font-weight:800; font-size:14px; color:var(--brand-primary);">S/ ${parseFloat(item.monto).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function toggleDespliegueRecibo(id) {
  const panel = document.getElementById(id);
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  }
}

// DEPÓSITOS RECIBIDOS (DESPLIEGUE PROGRESIVO)
function filtrarDepositosPorMes(mesFiltro) {
  const container = document.getElementById('gridTodasCategoriasDepositos');
  if (!container) return;

  let filtrados = listaGlobalTransacciones.filter(t => t.tipo_operacion === 'DEPOSITO_RECIBIDO');

  if (mesFiltro !== 'TODOS') {
    filtrados = filtrados.filter(t => t.concepto && t.concepto.toLowerCase().includes(mesFiltro.toLowerCase()));
  }

  if (filtrados.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Sin depósitos en este periodo.</p>`;
    return;
  }

  const grupos = {};
  filtrados.forEach(t => {
    const nombre = t.categorias ? t.categorias.nombre : 'Varios';
    if (!grupos[nombre]) grupos[nombre] = [];
    grupos[nombre].push(t);
  });

  container.innerHTML = Object.keys(grupos).map((catName, index) => {
    const items = grupos[catName];
    const panelId = `deposito_cat_${index}`;

    return `
      <div class="category-row-card" style="flex-direction:column; align-items:stretch; gap:0; cursor:pointer;" onclick="toggleDespliegueDeposito('${panelId}')">
        <div class="cat-row-left" style="padding: 4px 0; justify-content: space-between; width: 100%;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="cat-row-icon" style="background:#d1fae5; color:var(--accent-emerald);">
              <i class="ph-bold ph-arrow-down-left"></i>
            </div>
            <div class="cat-row-info">
              <h4>${catName}</h4>
              <span>${items.length} abono(s) - Toca para desplegar</span>
            </div>
          </div>
          <i class="ph-bold ph-caret-down" style="color:var(--text-muted);"></i>
        </div>

        <div id="${panelId}" style="display: none; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          ${items.map(item => `
            <div class="month-row-item" onclick="event.stopPropagation(); abrirModalDetalle(${item.id})" style="cursor:pointer; padding:12px; background:#f0fdf4; border:1px solid #a7f3d0; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:13px; color:var(--brand-primary);"><i class="ph-bold ph-calendar-blank"></i> Periodo: ${item.concepto}</strong>
                <span style="display:block; font-size:11px; color:var(--text-muted); margin-top:2px;">Haz clic para ver voucher, monto y detalles</span>
              </div>
              <span style="font-weight:800; font-size:14px; color:var(--accent-emerald);">S/ ${parseFloat(item.monto).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function toggleDespliegueDeposito(id) {
  const panel = document.getElementById(id);
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  }
}

function abrirModalDetalle(id) {
  const t = listaGlobalTransacciones.find(item => item.id === id);
  if (!t) return;

  const esDeposito = t.tipo_operacion === 'DEPOSITO_RECIBIDO';
  const nombreCat = t.categorias ? t.categorias.nombre : 'General';

  const fechaObj = new Date(t.fecha_completado || t.fecha_registro);
  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true 
  });

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
    <div class="voucher-img-container" onclick="abrirVisorImagenAmplia('${url}')">
      <img src="${url}" alt="Comprobante">
    </div>
  `).join('');

  document.getElementById('modalDetalle').style.display = 'flex';
}

function cerrarModalDetalle() {
  document.getElementById('modalDetalle').style.display = 'none';
}

function abrirVisorImagenAmplia(url) {
  const target = document.getElementById('imageViewerTarget');
  const overlay = document.getElementById('modalImageViewer');
  if (target && overlay) {
    target.src = url;
    overlay.style.display = 'flex';
  }
}

function cerrarVisorImagenAmplia() {
  const overlay = document.getElementById('modalImageViewer');
  if (overlay) overlay.style.display = 'none';
}

function toggleSeccionBalance(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}