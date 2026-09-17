let listaGlobalTransacciones = [];

async function obtenerCategorias() {
  const { data, error } = await _supabase.from('categorias').select('*');
  if (error) return console.error('Error al obtener categorías:', error);
  llenarSelectCategorias(data);
}

async function obtenerTransacciones() {
  const { data: transacciones, error } = await _supabase
    .from('transacciones')
    .select('*, categorias(nombre, tipo)')
    .order('fecha_registro', { ascending: false });

  if (error) return console.error('Error al obtener transacciones:', error);

  listaGlobalTransacciones = transacciones;

  const selectMes = document.getElementById('selectBalanceMes');
  const mesActual = selectMes ? selectMes.value : 'TODOS';
  
  actualizarBalancePorMes(mesActual);
}

function actualizarBalancePorMes(mesFiltro) {
  let filtrados = listaGlobalTransacciones;

  if (mesFiltro && mesFiltro !== 'TODOS') {
    filtrados = listaGlobalTransacciones.filter(t => 
      t.concepto && t.concepto.toLowerCase().includes(mesFiltro.toLowerCase())
    );
  }

  let totalDepositado = 0;
  let totalPagado = 0;

  const listaDepItems = [];
  const listaPagItems = [];

  let countDep = 0;
  let countPag = 0;

  filtrados.forEach(item => {
    if (item.estado === 'COMPLETADO') {
      const monto = parseFloat(item.monto);
      const nombreCat = item.categorias ? item.categorias.nombre : 'Varios';
      const mesConcepto = item.concepto || 'General';

      if (item.tipo_operacion === 'DEPOSITO_RECIBIDO') {
        totalDepositado += monto;
        countDep++;
        listaDepItems.push({ categoria: nombreCat, mes: mesConcepto, monto: monto });
      } else if (item.tipo_operacion === 'PAGO_GASTO') {
        totalPagado += monto;
        countPag++;
        listaPagItems.push({ categoria: nombreCat, mes: mesConcepto, monto: monto });
      }
    }
  });

  const saldoNeto = totalDepositado - totalPagado;

  const elSal = document.getElementById('saldoDisponible');
  const elDep = document.getElementById('totalDepositado');
  const elPag = document.getElementById('totalPagado');
  const elDepBar = document.getElementById('totalDepositadoBar');
  const elPagBar = document.getElementById('totalPagadoBar');

  if (elSal) elSal.innerText = `S/ ${saldoNeto.toFixed(2)}`;
  if (elDep) elDep.innerText = `S/ ${totalDepositado.toFixed(2)}`;
  if (elPag) elPag.innerText = `S/ ${totalPagado.toFixed(2)}`;
  if (elDepBar) elDepBar.innerText = `S/ ${totalDepositado.toFixed(2)}`;
  if (elPagBar) elPagBar.innerText = `S/ ${totalPagado.toFixed(2)}`;

  const subDep = document.getElementById('subCountDepMain');
  const subPag = document.getElementById('subCountPagMain');
  if (subDep) subDep.innerText = `${countDep} abono(s) registrado(s)`;
  if (subPag) subPag.innerText = `${countPag} pago(s) registrado(s)`;

  const progressFill = document.getElementById('progressBarFill');
  const porcentajeText = document.getElementById('porcentajeConsumoText');
  if (progressFill && porcentajeText) {
    let porcentaje = 0;
    if (totalDepositado > 0) {
      porcentaje = Math.min(Math.round((totalPagado / totalDepositado) * 100), 100);
    }
    progressFill.style.width = `${porcentaje}%`;
    porcentajeText.innerText = `${porcentaje}% gastado del fondo`;
  }

  const gridDep = document.getElementById('gridDetalleDepositosBalance');
  if (gridDep) {
    if (listaDepItems.length === 0) {
      gridDep.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">Sin depósitos en este periodo</span>`;
    } else {
      gridDep.innerHTML = listaDepItems.map(item => `
        <div class="service-card-balance item-income-border">
          <div style="display:flex; flex-direction:column;">
            <span class="cat-name">${item.categoria}</span>
            <span style="font-size:10px; color:var(--text-muted);">Periodo: ${item.mes}</span>
          </div>
          <span class="cat-amount text-emerald">S/ ${item.monto.toFixed(2)}</span>
        </div>
      `).join('');
    }
  }

  const gridPag = document.getElementById('gridDetallePagosBalance');
  if (gridPag) {
    if (listaPagItems.length === 0) {
      gridPag.innerHTML = `<span style="font-size:11px; color:var(--text-muted);">Sin pagos en este periodo</span>`;
    } else {
      gridPag.innerHTML = listaPagItems.map(item => `
        <div class="service-card-balance item-expense-border">
          <div style="display:flex; flex-direction:column;">
            <span class="cat-name">${item.categoria}</span>
            <span style="font-size:10px; color:var(--text-muted);">Periodo: ${item.mes}</span>
          </div>
          <span class="cat-amount text-rose">S/ ${item.monto.toFixed(2)}</span>
        </div>
      `).join('');
    }
  }
}

async function guardarNuevaTransaccion(categoria_id, concepto, monto, tipo_operacion, archivosComprobantes) {
  if (!categoria_id) {
    Swal.fire({ icon: 'warning', title: 'Categoría Faltante', text: 'Por favor, selecciona una categoría.', confirmButtonColor: '#1e293b' });
    return;
  }

  if (!concepto || concepto.trim() === '') {
    Swal.fire({ icon: 'warning', title: 'Mes Faltante', text: 'Selecciona el periodo o mes correspondiente.', confirmButtonColor: '#1e293b' });
    return;
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    Swal.fire({ icon: 'warning', title: 'Monto Inválido', text: 'El importe debe ser mayor a S/ 0.00.', confirmButtonColor: '#1e293b' });
    return;
  }

  if (!archivosComprobantes || archivosComprobantes.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Comprobante Faltante', text: 'Es obligatorio adjuntar la captura del comprobante.', confirmButtonColor: '#1e293b' });
    return;
  }

  Swal.fire({ 
    title: 'Guardando registro...', 
    text: 'Subiendo comprobante a Supabase Storage', 
    allowOutsideClick: false, 
    didOpen: () => { Swal.showLoading(); } 
  });

  const fechaActual = new Date();
  const year = fechaActual.getFullYear();
  const month = String(fechaActual.getMonth() + 1).padStart(2, '0');

  const urlsSubidas = [];

  for (let i = 0; i < archivosComprobantes.length; i++) {
    const file = archivosComprobantes[i];
    const fileExt = file.name.split('.').pop();
    const filePath = `${year}/${month}/voucher_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { error: uploadError } = await _supabase.storage
      .from('comprobantes')
      .upload(filePath, file);

    if (uploadError) {
      Swal.fire('Error de Almacenamiento', `No se pudo subir la captura: ` + uploadError.message, 'error');
      return;
    }

    const { data: urlData } = _supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    urlsSubidas.push(urlData.publicUrl);
  }

  const comprobanteFinalUrl = urlsSubidas.length === 1 ? urlsSubidas[0] : JSON.stringify(urlsSubidas);

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
    text: `Se registró correctamente el movimiento de ${concepto}.`, 
    confirmButtonColor: '#1e293b', 
    timer: 2000 
  });

  obtenerTransacciones();
}