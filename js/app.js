document.addEventListener('DOMContentLoaded', () => {

  const fileInput = document.getElementById('comprobanteDirectoInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const label = document.getElementById('fileNameLabel');
      const files = e.target.files;

      if (files.length === 1) {
        label.innerText = `1 captura adjuntada: ${files[0].name}`;
      } else if (files.length === 2) {
        label.innerText = `2 capturas adjuntadas: ${files[0].name}, ${files[1].name}`;
      } else if (files.length > 2) {
        alert('Solo se permite adjuntar máximo 2 imágenes.');
        fileInput.value = '';
        label.innerText = 'Adjuntar captura obligatoria';
      } else {
        label.innerText = 'Adjuntar captura obligatoria';
      }
    });
  }

  const form = document.getElementById('formTransaccion');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const radioSeleccionado = document.querySelector('input[name="tipoOperacion"]:checked');
      if (!radioSeleccionado) {
        Swal.fire({ icon: 'warning', title: 'Selección Requerida', text: 'Por favor, selecciona primero la naturaleza de la operación.', confirmButtonColor: '#10b981' });
        return;
      }

      const categoria_id = document.getElementById('categoriaIdInput').value;
      const mes = document.getElementById('mesInput').value;
      const monto = document.getElementById('montoInput').value;
      const tipo_operacion = radioSeleccionado.value;
      const fileInput = document.getElementById('comprobanteDirectoInput');
      const archivos = fileInput ? Array.from(fileInput.files) : [];

      const concepto = `${mes}`;

      await guardarNuevaTransaccion(categoria_id, concepto, monto, tipo_operacion, archivos);

      if (fileInput) fileInput.value = '';
      const label = document.getElementById('fileNameLabel');
      if (label) label.innerText = 'Adjuntar captura obligatoria';

      // Resetear el formulario ocultando los pasos nuevamente
      resetearFormularioAInicial();
    });
  }

  obtenerCategorias();
  obtenerTransacciones();
});