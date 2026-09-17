document.addEventListener('DOMContentLoaded', () => {

  const fileInput = document.getElementById('comprobanteDirectoInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const label = document.getElementById('fileNameLabel');
      const files = e.target.files;

      if (files.length > 0) {
        label.innerText = `${files.length} captura(s) seleccionada(s)`;
      } else {
        label.innerText = 'Seleccionar voucher o tomar foto';
      }
    });
  }

  const form = document.getElementById('formTransaccion');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const radioSeleccionado = document.querySelector('input[name="tipoOperacion"]:checked');
      if (!radioSeleccionado) {
        Swal.fire({ icon: 'warning', title: 'Selección Requerida', text: 'Por favor, selecciona si es Pago o Depósito en el Paso 1.', confirmButtonColor: '#10b981' });
        return;
      }

      const categoria_id = document.getElementById('categoriaIdInput').value;
      const mes = document.getElementById('mesInput').value;
      const monto = document.getElementById('montoInput').value;
      const tipo_operacion = radioSeleccionado.value;
      const filesArr = fileInput ? Array.from(fileInput.files) : [];

      const concepto = `${mes}`;

      await guardarNuevaTransaccion(categoria_id, concepto, monto, tipo_operacion, filesArr);

      if (fileInput) fileInput.value = '';
      const label = document.getElementById('fileNameLabel');
      if (label) label.innerText = 'Seleccionar voucher o tomar foto';

      resetearFormularioAInicial();
    });
  }

  // Cargar datos iniciales
  obtenerCategorias();
  obtenerTransacciones();
});