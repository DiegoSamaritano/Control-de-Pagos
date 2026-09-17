let listaGlobalTransacciones = [];

// Obtener la lista de categorías desde Supabase
async function obtenerCategorias() {
  const { data, error } = await _supabase.from('categorias').select('*');
  if (error) return console.error('Error al obtener categorías:', error);
  llenarSelectCategorias(data);
}

// Obtener todas las transacciones registradas
async function obtenerTransacciones() {
  const { data: transacciones, error } = await _supabase
    .from('transacciones')
    .select('*, categorias(nombre, tipo)')
    .order('fecha_registro', { ascending: false });

  if (error) return console.error('Error al obtener transacciones:', error);

  listaGlobalTransacciones = transacciones;

  // Por defecto actualizamos el balance con el mes seleccionado o todo el historial
  const selectMes = document.getElementById('selectBalanceMes');
  const mesActual = selectMes ? selectMes.value : 'Septiembre';
  actualizarBalancePorMes(mesActual);
  renderizarListaTransacciones(transacciones);
}

// Función para filtrar en el Historial (Boletas o Depósitos)
function filtrarMovimientos(tipo) {
  const titulo = document.getElementById('tituloLista');

  if (tipo === 'TODOS') {
    if (titulo) titulo.innerHTML = `<i class="ph-bold ph-list-checks"></i> Historial por Categorías`;
    renderizarListaTransacciones(listaGlobalTransacciones);
  } else if (tipo === 'PAGO_GASTO') {
    if (titulo) titulo.innerHTML = `<i class="ph-bold ph-receipt"></i> Boletas y Recibos por Categoría`;
    renderizarListaTransacciones(listaGlobalTransacciones.filter(t => t.tipo_operacion === 'PAGO_GASTO'));
  } else if (tipo === 'DEPOSITO_RECIBIDO') {
    if (titulo) titulo.innerHTML = `<i class="ph-bold ph-arrows-down-up"></i> Depósitos Recibidos por Categoría`;
    renderizarListaTransacciones(listaGlobalTransacciones.filter(t => t.tipo_operacion === 'DEPOSITO_RECIBIDO'));
  }
}

// Cálculo real de Saldo y Desglose de Gastos por Servicios
function actualizarBalancePorMes(mesFiltro) {
  let filtrados = listaGlobalTransacciones;

  if (mesFiltro && mesFiltro !== 'TODOS') {
    filtrados = listaGlobalTransacciones.filter(t => 
      t.concepto && t.concepto.toLowerCase().includes(mesFiltro.toLowerCase())
    );
  }

  let totalDepositado = 0;
  let totalPagado = 0;

  // Objeto de acumulación por categoría
  const desgloses = {
    uni: { monto: 0, count: 0 },
    alquiler: { monto: 0, count: 0 },
    internet: { monto: 0, count: 0 },
    semanal: { monto: 0, count: 0 },
    adicionales: { monto: 0, count: 0 }
  };

  filtrados.forEach(item => {
    if (item.estado === 'COMPLETADO') {
      const monto = parseFloat(item.monto);
      
      if (item.tipo_operacion === 'DEPOSITO_RECIBIDO') {
        totalDepositado += monto;
      } else if (item.tipo_operacion === 'PAGO_GASTO') {
        totalPagado += monto;

        const nombreCat = item.categorias ? item.categorias.nombre.toLowerCase() : '';

        if (nombreCat.includes('universidad')) {
          desgloses.uni.monto += monto;
          desgloses.uni.count++;
        } else if (nombreCat.includes('alquiler') || nombreCat.includes('cuarto')) {
          desgloses.alquiler.monto += monto;
          desgloses.alquiler.count++;
        } else if (nombreCat.includes('internet')) {
          desgloses.internet.monto += monto;
          desgloses.internet.count++;
        } else if (nombreCat.includes('semanal') || nombreCat.includes('semana')) {
          desgloses.semanal.monto += monto;
          desgloses.semanal.count++;
        } else {
          desgloses.adicionales.monto += monto;
          desgloses.adicionales.count++;
        }
      }
    }
  });

  const saldoNeto = totalDepositado - totalPagado;

  // 1. Mostrar Totales Generales
  const elDep = document.getElementById('totalDepositado');
  const elPag = document.getElementById('totalPagado');
  const elSal = document.getElementById('saldoDisponible');

  if (elDep) elDep.innerText = `S/ ${totalDepositado.toFixed(2)}`;
  if (elPag) elPag.innerText = `S/ ${totalPagado.toFixed(2)}`;
  if (elSal) elSal.innerText = `S/ ${saldoNeto.toFixed(2)}`;

  // 2. Barra de Porcentaje de Consumo del Fondo
  const porcentaje = totalDepositado > 0 ? Math.min(Math.round((totalPagado / totalDepositado) * 100), 100) : 0;
  const barFill = document.getElementById('progressBarFill');
  const txtPorcentaje = document.getElementById('porcentajeConsumoText');
  
  if (barFill) barFill.style.width = `${porcentaje}%`;
  if (txtPorcentaje) txtPorcentaje.innerText = `${porcentaje}% gastado del fondo`;

  // Badge visual
  const badge = document.getElementById('badgeEstadoCuenta');
  if (badge) {
    if (saldoNeto >= 0) {
      badge.className = 'health-badge positive';
      badge.innerHTML = `<i class="ph-bold ph-shield-check"></i> Estado al Día`;
    } else {
      badge.className = 'health-badge negative';
      badge.innerHTML = `<i class="ph-bold ph-warning"></i> Saldo Negativo`;
    }
  }

  // 3. Renderizar Desglose por Servicios Específicos
  document.getElementById('montoUni').innerText = `S/ ${desgloses.uni.monto.toFixed(2)}`;
  document.getElementById('subCountUni').innerText = `${desgloses.uni.count} pago(s) registrado(s)`;

  document.getElementById('montoAlquiler').innerText = `S/ ${desgloses.alquiler.monto.toFixed(2)}`;
  document.getElementById('subCountAlquiler').innerText = `${desgloses.alquiler.count} pago(s) registrado(s)`;

  document.getElementById('montoInternet').innerText = `S/ ${desgloses.internet.monto.toFixed(2)}`;
  document.getElementById('subCountInternet').innerText = `${desgloses.internet.count} pago(s) registrado(s)`;

  document.getElementById('montoSemanal').innerText = `S/ ${desgloses.semanal.monto.toFixed(2)}`;
  document.getElementById('subCountSemanal').innerText = `${desgloses.semanal.count} abono(s) registrado(s)`;

  document.getElementById('montoAdicionales').innerText = `S/ ${desgloses.adicionales.monto.toFixed(2)}`;
  document.getElementById('subCountAdicionales').innerText = `${desgloses.adicionales.count} gasto(s) adicional(es)`;
}
  // 1. Actualización de Valores Principales
  const elDep = document.getElementById('totalDepositado');
  const elPag = document.getElementById('totalPagado');
  const elSal = document.getElementById('saldoDisponible');

  if (elDep) elDep.innerText = `S/ ${totalDepositado.toFixed(2)}`;
  if (elPag) elPag.innerText = `S/ ${totalPagado.toFixed(2)}`;
  if (elSal) elSal.innerText = `S/ ${saldoNeto.toFixed(2)}`;

  // Subtítulos de conteo de operaciones
  const txtDep = document.getElementById('cantDepositosText');
  const txtPag = document.getElementById('cantPagosText');
  if (txtDep) txtDep.innerText = `${countDepositos} depósito(s) en total`;
  if (txtPag) txtPag.innerText = `${countPagos} pago(s) en total`;

  // 2. Porcentaje de Ejecución de Fondos
  const porcentaje = totalDepositado > 0 ? Math.min(Math.round((totalPagado / totalDepositado) * 100), 100) : 0;
  const barFill = document.getElementById('progressBarFill');
  const txtPorcentaje = document.getElementById('porcentajeConsumoText');
  
  if (barFill) barFill.style.width = `${porcentaje}%`;
  if (txtPorcentaje) txtPorcentaje.innerText = `${porcentaje}% gastado del fondo`;

  // Insignia visual del Estado de la Cuenta
  const badge = document.getElementById('badgeEstadoCuenta');
  if (badge) {
    if (saldoNeto >= 0) {
      badge.className = 'health-badge positive';
      badge.innerHTML = `<i class="ph-bold ph-trend-up"></i> Balance Positivo`;
    } else {
      badge.className = 'health-badge negative';
      badge.innerHTML = `<i class="ph-bold ph-trend-down"></i> Déficit Detectado`;
    }
  }

  // 3. Cálculo de KPIs Financieros Específicos
  // Categoría de Mayor Gasto
  let catMayorGasto = '--';
  let montoMayorGasto = 0;
  for (const cat in gastosPorCategoria) {
    if (gastosPorCategoria[cat] > montoMayorGasto) {
      montoMayorGasto = gastosPorCategoria[cat];
      catMayorGasto = cat;
    }
  }

  const kpiCat = document.getElementById('kpiMayorGastoCat');
  const kpiMonto = document.getElementById('kpiMayorGastoMonto');
  if (kpiCat) kpiCat.innerText = catMayorGasto;
  if (kpiMonto) kpiMonto.innerText = `S/ ${montoMayorGasto.toFixed(2)}`;

  // Ticket Promedio por Pago
  const promedioPago = countPagos > 0 ? (totalPagado / countPagos) : 0;
  const kpiProm = document.getElementById('kpiPromedioPago');
  if (kpiProm) kpiProm.innerText = `S/ ${promedioPago.toFixed(2)}`;

  // Cobertura de Fondos (Ratio)
  const ratio = totalPagado > 0 ? (totalDepositado / totalPagado).toFixed(1) : (totalDepositado > 0 ? '1.0' : '0.0');
  const kpiRatio = document.getElementById('kpiRatioCobertura');
  if (kpiRatio) kpiRatio.innerText = `${ratio}x`;
}

// Guardar nueva transacción en Supabase
async function guardarNuevaTransaccion(categoria_id, concepto, monto, tipo_operacion, archivosComprobantes) {
  
  if (!categoria_id) {
    Swal.fire({ icon: 'warning', title: 'Categoría Faltante', text: 'Por favor, selecciona una categoría.', confirmButtonColor: '#10b981' });
    return;
  }

  if (!concepto || concepto.trim() === '') {
    Swal.fire({ icon: 'warning', title: 'Mes Faltante', text: 'Selecciona el periodo o mes correspondiente.', confirmButtonColor: '#10b981' });
    return;
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    Swal.fire({ icon: 'warning', title: 'Monto Inválido', text: 'El importe a liquidar debe ser mayor a S/ 0.00.', confirmButtonColor: '#10b981' });
    return;
  }

  if (!archivosComprobantes || archivosComprobantes.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Comprobante Faltante', text: 'Es obligatorio adjuntar la captura del comprobante de operación.', confirmButtonColor: '#10b981' });
    return;
  }

  Swal.fire({ 
    title: 'Guardando registro...', 
    text: 'Subiendo comprobante a Supabase', 
    allowOutsideClick: false, 
    didOpen: () => { Swal.showLoading(); } 
  });

  // Subida de archivos a Supabase Storage (permite múltiples vouchers sin límite)
  const urlsSubidas = [];

  for (let i = 0; i < archivosComprobantes.length; i++) {
    const file = archivosComprobantes[i];
    const fileExt = file.name.split('.').pop();
    const fileName = `voucher_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadError } = await _supabase.storage
      .from('comprobantes')
      .upload(fileName, file);

    if (uploadError) {
      Swal.fire('Error de Almacenamiento', `No se pudo subir la captura #${i + 1}: ` + uploadError.message, 'error');
      return;
    }

    const { data: urlData } = _supabase.storage
      .from('comprobantes')
      .getPublicUrl(fileName);

    urlsSubidas.push(urlData.publicUrl);
  }

  const comprobanteFinalUrl = urlsSubidas.length === 1 ? urlsSubidas[0] : JSON.stringify(urlsSubidas);

  // Inserción directa en la base de datos
  const { error } = await _supabase.from('transacciones').insert([{
    categoria_id,
    concepto,
    monto: montoNum,
    tipo_operacion,
    estado: 'COMPLETADO',
    comprobante_url: comprobanteFinalUrl,
    fecha_completado: new Date().toISOString()
  }]);

  if (error) {
    Swal.fire('Error de Registro', 'No se guardó el movimiento: ' + error.message, 'error');
    return;
  }

  Swal.fire({ 
    icon: 'success', 
    title: '¡Operación Guardada!', 
    text: `Se registró correctamente el pago/depósito de ${concepto}.`, 
    confirmButtonColor: '#10b981', 
    timer: 2000 
  });

  obtenerTransacciones();
}