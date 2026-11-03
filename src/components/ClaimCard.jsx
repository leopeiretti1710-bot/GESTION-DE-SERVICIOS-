// ClaimCard: tarjeta de un reclamo (como en el prototipo Figma)
import Badge from './Badge'

// Props:
//   reclamo  -> objeto con los datos del reclamo
//   onOpen    -> funcion que se ejecuta al clickear "Ver detalle"
export default function ClaimCard({ reclamo, onOpen }) {
  // Funcion para dar color al estado
  function colorEstado(estado) {
    if (!estado) return 'neutral'
    if (estado === 'Finalizado') return 'success'
    if (estado === 'Recibido') return 'purple'
    if (estado.toLowerCase().includes('autoriz')) return 'warning'
    if (estado === 'En ejecucion') return 'blue'
    return 'neutral'
  }

  // Funcion para dar color a la prioridad
  function colorPrioridad(prioridad) {
    if (prioridad === 'Urgente') return 'danger'
    if (prioridad === 'Importante') return 'warning'
    return 'neutral'
  }

  // Valores seguros (por si falta algun campo)
  const codigo = reclamo.codigo || reclamo.id || 'Sin codigo'
  const estado = reclamo.estado || 'Sin estado'
  const propiedad = reclamo.propiedadDireccion || 'Sin propiedad'
  const inquilino = reclamo.inquilinoNombre || 'Sin inquilino'
  const prioridad = reclamo.prioridad || 'Sin prioridad'
  const categoria = reclamo.categoria || 'Sin categoria'

  // Fecha de ingreso (puede ser null mientras Firebase confirma)
  let fechaTexto = '...'
  if (reclamo.fechaIngreso && typeof reclamo.fechaIngreso.toDate === 'function') {
    try {
      fechaTexto = reclamo.fechaIngreso.toDate().toLocaleDateString('es-AR')
    } catch (e) {
      fechaTexto = '...'
    }
  }

  return (
    <article className="repair-card claim-strip-card">
      {/* Fila superior: codigo + estado */}
      <div className="repair-card-top">
        <span className="claim">{codigo}</span>
        <Badge tone={colorEstado(estado)}>{estado}</Badge>
      </div>

      {/* Propiedad e inquilino */}
      <h4>{propiedad}</h4>
      <p className="repair-tenant">{inquilino}</p>

      {/* Etiquetas: prioridad, categoria, fecha */}
      <div className="repair-tags">
        <Badge tone={colorPrioridad(prioridad)}>{prioridad}</Badge>
        <span>{categoria}</span>
        <span>Ingreso {fechaTexto}</span>
      </div>

      {/* Proxima accion */}
      <div className="repair-action">
        <small>Proxima accion</small>
        <b>{reclamo.next || 'Sin acciones pendientes'}</b>
        {reclamo.nextDate && <span>{reclamo.nextDate}</span>}
      </div>

      {/* Proveedor */}
      <div className="repair-provider">
        <small>Proveedor asignado</small>
        <b>{reclamo.proveedorNombre || 'Sin asignar'}</b>
      </div>

      {/* Boton ver detalle */}
      <button className="repair-detail" onClick={() => onOpen(reclamo)}>
        Ver detalle completo <span>-&gt;</span>
      </button>
    </article>
  )
}