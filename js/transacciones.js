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
  renderizarListaTransacciones(transacciones);
}

function filtrarMovimientos(tipo) {
  const titulo = document.getElementById('tituloLista');

  if (tipo === 'TODOS') {
    if (titulo) titulo.innerHTML = `<i class="ph-bold ph-list-checks"></i> Historial por Categorías`;
    renderizarListaTransacciones(listaGlobalTransacciones);
  } else if (tipo === 'PAGO_GASTO') {
    if (titulo) titulo.innerHTML = `<i class="ph-bold ph-receipt"></i> Recibos de Pagos`;
    renderizarListaTransacciones(listaGlobalTransacciones.filter(t => t.tipo_operacion === 'PAGO_GASTO'));
  } else if (tipo === 'DEPOSITO_RECIBIDO') {
    if (titulo) titulo.innerHTML = `<i class="ph-bold ph-arrows-down-up"></i> Depósitos Recibidos`;
    renderizarListaTransacciones(listaGlobalTransacciones.filter(t => t.tipo_operacion === 'DEPOSITO_RECIBIDO'));
  }
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

  const desgloses = {
    depSemanal: { monto: 0, count: 0, meses: {} },
    depDirectos: { monto: 0, count: 0, meses: {} },
    uni: { monto: 0, count: 0, meses: {} },
    alquiler: { monto: 0, count: 0, meses: {} },
    internet: { monto: 0, count: 0, meses: {} },
    semanal: { monto: 0, count: 0, meses: {} },
    adicionales: { monto: 0, count: 0, meses: {} }
  };

  filtrados.forEach(item => {
    if (item.estado === 'COMPLETADO') {
      const monto = parseFloat(item.monto);
      const mes = item.concepto || 'General';
      const nombreCat = item.categorias ? item.categorias.nombre.toLowerCase() : '';
      
      if (item.tipo_operacion === 'DEPOSITO_RECIBIDO') {
        totalDepositado += monto;

        if (nombreCat.includes('semanal') || nombreCat.includes('semana')) {
          desgloses.depSemanal.monto += monto;
          desgloses.depSemanal.count++;
          desgloses.depSemanal.meses[mes] = (desgloses.depSemanal.meses[mes] || 0) + monto;
        } else {
          desgloses.depDirectos.monto += monto;
          desgloses.depDirectos.count++;
          desgloses.depDirectos.meses[mes] = (desgloses.depDirectos.meses[mes] || 0) + monto;
        }

      } else if (item.tipo_operacion === 'PAGO_GASTO') {
        totalPagado += monto;

        if (nombreCat.includes('universidad')) {
          desgloses.uni.monto += monto;
          desgloses.uni.count++;
          desgloses.uni.meses[mes] = (desgloses.uni.meses[mes] || 0) + monto;
        } else if (nombreCat.includes('alquiler') || nombreCat.includes('cuarto')) {
          desgloses.alquiler.monto += monto;
          desgloses.alquiler.count++;
          desgloses.alquiler.meses[mes] = (desgloses.alquiler.meses[mes] || 0) + monto;
        } else if (nombreCat.includes('internet')) {
          desgloses.internet.monto += monto;
          desgloses.internet.count++;
          desgloses.internet.meses[mes] = (desgloses.internet.meses[mes] || 0) + monto;
        } else if (nombreCat.includes('semanal') || nombreCat.includes('semana')) {
          desgloses.semanal.monto += monto;
          desgloses.semanal.count++;
          desgloses.semanal.meses[mes] = (desgloses.semanal.meses[mes] || 0) + monto;
        } else {
          desgloses.adicionales.monto += monto;
          desgloses.adicionales.count++;
          desgloses.adicionales.meses[mes] = (desgloses.adicionales.meses[mes] || 0) + monto;
        }
      }
    }
  });

  const saldoNeto = totalDepositado - totalPagado;

  const elDep = document.getElementById('totalDepositado');
  const elPag = document.getElementById('totalPagado');
  const elSal = document.getElementById('saldoDisponible');

  if (elDep) elDep.innerText = `S/ ${totalDepositado.toFixed(2)}`;
  if (elPag) elPag.innerText = `S/ ${totalPagado.toFixed(2)}`;
  if (elSal) elSal.innerText = `S/ ${saldoNeto.toFixed(2)}`;

  const porcentaje = totalDepositado > 0 ? Math.min(Math.round((totalPagado / totalDepositado) * 100), 100) : 0;
  const barFill = document.getElementById('progressBarFill');
  const txtPorcentaje = document.getElementById('porcentajeConsumoText');
  
  if (barFill) barFill.style.width = `${porcentaje}%`;
  if (txtPorcentaje) txtPorcentaje.innerText = `${porcentaje}% gastado`;

  const badge = document.getElementById('badgeEstadoCuenta');
  if (badge) {
    if (saldoNeto >= 0) {
      badge.className = 'health-badge positive';
      badge.innerHTML = `<i class="ph-bold ph-shield-check"></i> Balance al Día`;
    } else {
      badge.className = 'health-badge negative';
      badge.innerHTML = `<i class="ph-bold ph-warning"></i> Saldo Negativo`;
    }
  }

  const renderCardData = (montoId, subId, dropdownId, dataObj, labelSub) => {
    const elMonto = document.getElementById(montoId);
    const elSub = document.getElementById(subId);
    const elDrop = document.getElementById(dropdownId);

    if (elMonto) elMonto.innerText = `S/ ${dataObj.monto.toFixed(2)}`;
    if (elSub) elSub.innerText = `${dataObj.count} ${labelSub}`;

    if (elDrop) {
      const llavesMeses = Object.keys(dataObj.meses);
      if (llavesMeses.length === 0) {
        elDrop.innerHTML = `<span style="font-size:10px; color:var(--text-muted); padding:4px;">Sin registros en este periodo</span>`;
      } else {
        elDrop.innerHTML = llavesMeses.map(m => `
          <div class="month-row-item">
            <span class="m-name">${m}</span>
            <span class="m-val">S/ ${dataObj.meses[m].toFixed(2)}</span>
          </div>
        `).join('');
      }
    }
  };

  renderCardData('montoDepSemanal', 'subCountDepSemanal', 'months-dep-semanal', desgloses.depSemanal, 'abonos');
  renderCardData('montoDepDirectos', 'subCountDepDirectos', 'months-dep-directos', desgloses.depDirectos, 'abonos');

  renderCardData('montoUni', 'subCountUni', 'months-pago-uni', desgloses.uni, 'pagos');
  renderCardData('montoAlquiler', 'subCountAlquiler', 'months-pago-alquiler', desgloses.alquiler, 'pagos');
  renderCardData('montoInternet', 'subCountInternet', 'months-pago-net', desgloses.internet, 'pagos');
  renderCardData('montoSemanal', 'subCountSemanal', 'months-pago-semanal', desgloses.semanal, 'pagos');
  renderCardData('montoAdicionales', 'subCountAdicionales', 'months-pago-extra', desgloses.adicionales, 'gastos');
}

// Guardar comprobantes con organización en Storage por Año/Mes para escalar
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
    Swal.fire({ icon: 'warning', title: 'Monto Inválido', text: 'El importe debe ser mayor a S/ 0.00.', confirmButtonColor: '#10b981' });
    return;
  }

  if (!archivosComprobantes || archivosComprobantes.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Comprobante Faltante', text: 'Es obligatorio adjuntar la captura del comprobante.', confirmButtonColor: '#10b981' });
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
    // Estructura limpia: YYYY/MM/voucher_timestamp.ext
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
    confirmButtonColor: '#10b981', 
    timer: 2000 
  });

  obtenerTransacciones();
}