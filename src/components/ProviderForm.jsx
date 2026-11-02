// ProviderForm: modal para crear o editar un proveedor (igual al prototipo)
// Props:
//   inicial -> proveedor a editar (null = crear uno nuevo)
//   onGuardar -> recibe los datos del formulario (el padre decide si es
//                addDoc o updateDoc)
//   onCancelar -> cierra el modal
// Concepto nuevo: este formulario usa inputs CONTROLADOS (como LoginScreen):
// cada campo vive en el estado "datos" y se actualiza con onChange.
import { useState } from 'react'

// Lista de especialidades del prototipo (sin tildes por el tema de encoding)
const ESPECIALIDADES = [
  'Plomeria',
  'Electricidad',
  'Gas',
  'Albanileria',
  'Pintura',
  'Humedad e impermeabilizacion',
  'Cerrajeria',
  'Carpinteria',
  'Aire acondicionado',
  'Otros',
]

export default function ProviderForm({ inicial, onGuardar, onCancelar }) {
  // datos: todo el formulario en un solo objeto de estado
  const [datos, setDatos] = useState(
    inicial || {
      nombre: '',
      especialidad: '',
      otrasEspecialidades: [],
      telefono: '',
      whatsapp: '',
      email: '',
      zona: '',
      disponibilidad: '',
      emergencia: false,
      estado: 'Activo',
    }
  )

  // Si el whatsapp es el mismo numero que el telefono
  const [mismoNumero, setMismoNumero] = useState(
    Boolean(datos.telefono && datos.whatsapp === datos.telefono)
  )

  // Especialidad escrita a mano para agregar a la lista
  const [otraEspecialidad, setOtraEspecialidad] = useState('')

  // Ayudante para cambiar un solo campo del objeto
  function cambiar(campo, valor) {
    setDatos((actual) => ({ ...actual, [campo]: valor }))
  }

  // Marcar / desmarcar una especialidad secundaria
  function alternarEspecialidad(especialidad) {
    const lista = datos.otrasEspecialidades.includes(especialidad)
      ? datos.otrasEspecialidades.filter((e) => e !== especialidad)
      : [...datos.otrasEspecialidades, especialidad]
    cambiar('otrasEspecialidades', lista)
  }

  function submit(e) {
    e.preventDefault()
    // Si "mismo numero" esta marcado, whatsapp = telefono
    onGuardar({
      ...datos,
      whatsapp: mismoNumero ? datos.telefono : datos.whatsapp,
    })
  }

  return (
    <div className="modal">
      <form className="modal-card provider-form" onSubmit={submit}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Uso administrativo</p>
            <h2>{inicial ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onCancelar}>
            X
          </button>
        </div>

        <div className="form-grid">
          <label className="full">
            Nombre y apellido o razon social *
            <input
              required
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
            />
          </label>

          <label>
            Especialidad principal *
            <select
              required
              value={datos.especialidad}
              onChange={(e) => cambiar('especialidad', e.target.value)}
            >
              <option value="">Seleccionar</option>
              {ESPECIALIDADES.map((esp) => (
                <option key={esp}>{esp}</option>
              ))}
            </select>
          </label>

          <label>
            Telefono *
            <input
              required
              value={datos.telefono}
              onChange={(e) => cambiar('telefono', e.target.value)}
            />
          </label>

          {/* Otras especialidades: checkboxes + campo para agregar una nueva */}
          <fieldset className="full specialties">
            <legend>Otras especialidades (opcional)</legend>
            <div>
              {ESPECIALIDADES.filter((esp) => esp !== datos.especialidad).map((esp) => (
                <label className="check-option" key={esp}>
                  <input
                    type="checkbox"
                    checked={datos.otrasEspecialidades.includes(esp)}
                    onChange={() => alternarEspecialidad(esp)}
                  />
                  {esp}
                </label>
              ))}
            </div>
            <div className="custom-specialty">
              <input
                value={otraEspecialidad}
                onChange={(e) => setOtraEspecialidad(e.target.value)}
                placeholder="Agregar nueva especialidad"
              />
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const valor = otraEspecialidad.trim()
                  if (valor && !datos.otrasEspecialidades.includes(valor)) {
                    cambiar('otrasEspecialidades', [...datos.otrasEspecialidades, valor])
                    setOtraEspecialidad('')
                  }
                }}
              >
                Agregar
              </button>
            </div>
          </fieldset>

          <label>
            WhatsApp
            <input
              disabled={mismoNumero}
              value={mismoNumero ? datos.telefono : datos.whatsapp}
              onChange={(e) => cambiar('whatsapp', e.target.value)}
            />
          </label>

          <label className="same-phone">
            <input
              type="checkbox"
              checked={mismoNumero}
              onChange={(e) => setMismoNumero(e.target.checked)}
            />
            Es el mismo numero de telefono
          </label>

          <label>
            Correo electronico
            <input
              type="email"
              value={datos.email}
              onChange={(e) => cambiar('email', e.target.value)}
            />
          </label>

          <label>
            Zona de trabajo *
            <input
              required
              value={datos.zona}
              onChange={(e) => cambiar('zona', e.target.value)}
            />
          </label>

          <label className="full">
            Disponibilidad
            <input
              value={datos.disponibilidad}
              onChange={(e) => cambiar('disponibilidad', e.target.value)}
              placeholder="Ej. lunes a viernes de 9 a 18 h"
            />
          </label>

          <label>
            Atiende urgencias
            <select
              value={datos.emergencia ? 'Si' : 'No'}
              onChange={(e) => cambiar('emergencia', e.target.value === 'Si')}
            >
              <option>Si</option>
              <option>No</option>
            </select>
          </label>

          <label>
            Estado
            <select
              value={datos.estado}
              onChange={(e) => cambiar('estado', e.target.value)}
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="primary">
            {inicial ? 'Guardar cambios' : 'Guardar proveedor'}
          </button>
        </div>
      </form>
    </div>
  )
}
