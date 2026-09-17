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

  let totalDepositado = 0;
  let totalPagado = 0;

  transacciones.forEach(item => {
    if (item.estado === 'COMPLETADO') {
      const monto = parseFloat(item.monto);
      if (item.tipo_operacion === 'DEPOSITO_RECIBIDO') totalDepositado += monto;
      if (item.tipo_operacion === 'PAGO_GASTO') totalPagado += monto;
    }
  });

  actualizarTarjetasBalance(totalDepositado, totalPagado);
  renderizarListaTransacciones(transacciones);
}

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

  Swal.fire({ title: 'Guardando registro...', text: 'Subiendo comprobante a Supabase', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

  // Subida de archivos a Supabase Storage SIN BLOQUEOS
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

  // Inserción directa
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

  Swal.fire({ icon: 'success', title: '¡Operación Guardada!', text: `Se registró correctamente el pago/depósito de ${concepto}.`, confirmButtonColor: '#10b981', timer: 2000 });

  obtenerTransacciones();
}