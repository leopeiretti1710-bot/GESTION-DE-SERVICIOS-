// Proveedores: pantalla de red de proveedores (igual al prototipo)
// Dos vistas en la misma pantalla:
//   - LISTA: buscador + tarjetas de proveedores
//   - FICHA: detalle de un proveedor con sus trabajos
// Los proveedores se guardan en Firestore, coleccion 'proveedores'.
// Los trabajos se cuentan leyendo la coleccion 'reclamos' (cada reclamo
// guarda proveedorId cuando se le asigna uno desde Gestion interna).
import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, onSnapshot, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import Badge from '../components/Badge'
import ProviderForm from '../components/ProviderForm'
import '../App.css'

export default function Proveedores() {
  // Datos de Firebase
  const [proveedores, setProveedores] = useState([])
  const [reclamos, setReclamos] = useState([])

  // Vistas y modales
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null) // id del proveedor en ficha
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState(null) // proveedor a editar (null = nuevo)

  // Escucha proveedores y reclamos en tiempo real
  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'proveedores'), (snap) => {
        setProveedores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }, (e) => console.error('Error al leer proveedores:', e)),
      onSnapshot(collection(db, 'reclamos'), (snap) => {
        setReclamos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }, (e) => console.error('Error al leer reclamos:', e)),
    ]
    // Al desmontar, cortamos las dos escuchas
    return () => unsubs.forEach((u) => u())
  }, [])

  // Guardar (crear o editar) un proveedor
  async function guardarProveedor(datos) {
    if (editando) {
      // editar: updateDoc sobre el documento existente
      await updateDoc(doc(db, 'proveedores', editando.id), datos)
    } else {
      // crear: addDoc con los datos + fecha de alta
      await addDoc(collection(db, 'proveedores'), {
        ...datos,
        notes: [],
        fechaAlta: serverTimestamp(),
      })
    }
    setFormAbierto(false)
    setEditando(null)
  }

  // ----- FICHA DEL PROVEEDOR (cuando hay uno seleccionado) -----
  const proveedor = proveedores.find((p) => p.id === seleccionado) || null
  if (proveedor) {
    // Trabajos vinculados a este proveedor
    const vinculados = reclamos.filter((r) => r.proveedorId === proveedor.id)
    const activos = vinculados.filter((r) => !['Finalizado', 'Cancelado'].includes((r.estado || '').toLowerCase()))
    const finalizados = vinculados.filter((r) => (r.estado || '').toLowerCase() === 'finalizado')
    const cancelados = vinculados.filter((r) => (r.estado || '').toLowerCase() === 'cancelado')

    // Iniciales para el avatar (ej: "Juan Perez" -> "JP")
    const iniciales = (proveedor.nombre || '?')
      .split(' ')
      .map((parte) => parte[0])
      .slice(0, 2)
      .join('')

    return (
      <>
        <button className="back" onClick={() => setSeleccionado(null)}>
          ← Volver a proveedores
        </button>

        <div className="provider-detail-head">
          <div className="provider-avatar">{iniciales}</div>
          <div>
            <p className="eyebrow">Ficha del proveedor</p>
            <h1>{proveedor.nombre}</h1>
            <span>
              {proveedor.especialidad} · {proveedor.zona} · {proveedor.telefono}
            </span>
          </div>
          <button
            className="secondary provider-edit"
            onClick={() => {
              setEditando(proveedor)
              setFormAbierto(true)
            }}
          >
            Editar proveedor
          </button>
        </div>

        {/* Datos de contacto */}
        <section className="panel provider-data">
          <div>
            <small>Telefono</small>
            <b>{proveedor.telefono}</b>
          </div>
          <div>
            <small>WhatsApp</small>
            <b>{proveedor.whatsapp || 'No registrado'}</b>
          </div>
          <div>
            <small>Correo electronico</small>
            <b>{proveedor.email || 'No registrado'}</b>
          </div>
          <div>
            <small>Disponibilidad</small>
            <b>{proveedor.disponibilidad || 'No informada'}</b>
          </div>
          <div>
            <small>Urgencias</small>
            <b>{proveedor.emergencia ? 'Si' : 'No'}</b>
          </div>
          <div>
            <small>Estado</small>
            <Badge tone={proveedor.estado === 'Activo' ? 'success' : 'neutral'}>
              {proveedor.estado}
            </Badge>
          </div>
        </section>

        {/* Contadores de trabajos */}
        <div className="provider-summary">
          <div>
            <b>{vinculados.length}</b>
            <span>Trabajos registrados</span>
          </div>
          <div>
            <b>{activos.length}</b>
            <span>Trabajos activos</span>
          </div>
          <div>
            <b>{finalizados.length}</b>
            <span>Trabajos finalizados</span>
          </div>
          <div>
            <b>{cancelados.length}</b>
            <span>Trabajos cancelados</span>
          </div>
        </div>

        {/* Listas de trabajos */}
        <div className="provider-jobs">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Reclamos en curso</h2>
                <p>Trabajos que esta atendiendo actualmente</p>
              </div>
              <Badge tone="purple">{activos.length}</Badge>
            </div>
            <div className="provider-job-list">
              {activos.length ? (
                activos.map((r) => (
                  <button type="button" key={r.id}>
                    <span>
                      <b>{r.propiedadDireccion}</b>
                      <small>{r.codigo} · Ingreso {formatoFecha(r.fechaIngreso)}</small>
                      <small>{r.categoria}: {r.descripcion}</small>
                    </span>
                    <Badge>{r.estado}</Badge>
                  </button>
                ))
              ) : (
                <p className="muted">No tiene trabajos activos.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Historial de trabajos</h2>
                <p>Reclamos finalizados o cancelados</p>
              </div>
              <Badge>{finalizados.length + cancelados.length}</Badge>
            </div>
            <div className="provider-job-list">
              {finalizados.length + cancelados.length ? (
                [...finalizados, ...cancelados].map((r) => (
                  <button type="button" key={r.id}>
                    <span>
                      <b>{r.propiedadDireccion}</b>
                      <small>{r.codigo} · {r.categoria}</small>
                      <small>{r.descripcion}</small>
                    </span>
                    <Badge tone={(r.estado || '').toLowerCase() === 'cancelado' ? 'danger' : 'success'}>
                      {r.estado}
                    </Badge>
                  </button>
                ))
              ) : (
                <p className="muted">No hay trabajos finalizados cargados.</p>
              )}
            </div>
          </section>
        </div>

        {/* Modal de edicion */}
        {formAbierto && (
          <ProviderForm
            inicial={editando}
            onGuardar={guardarProveedor}
            onCancelar={() => {
              setFormAbierto(false)
              setEditando(null)
            }}
          />
        )}
      </>
    )
  }

  // ----- LISTA DE PROVEEDORES (vista por defecto) -----
  return (
    <>
      <div className="page-head">
        <div>
          <p>Red de trabajo</p>
          <h1>Proveedores</h1>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditando(null)
            setFormAbierto(true)
          }}
        >
          + Nuevo proveedor
        </button>
      </div>

      {/* Buscador por especialidad o nombre */}
      <div className="filter-row">
        <div className="search small">
          <input
            placeholder="Buscar por nombre o especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="card-grid">
        {proveedores
          .filter((p) =>
            JSON.stringify(p).toLowerCase().includes(busqueda.toLowerCase())
          )
          .map((p) => {
            // Cantidad de trabajos de este proveedor
            const trabajos = reclamos.filter((r) => r.proveedorId === p.id).length
            const iniciales = (p.nombre || '?')
              .split(' ')
              .map((x) => x[0])
              .slice(0, 2)
              .join('')
            return (
              <div className="entity-card" key={p.id}>
                <div className="provider-top">
                  <div className="provider-avatar">{iniciales}</div>
                  <Badge tone="purple">{p.especialidad}</Badge>
                </div>
                <h2>{p.nombre}</h2>
                <p>{p.zona}</p>
                <div className="entity-meta">
                  <span>
                    <small>Telefono / WhatsApp</small>
                    <b>{p.telefono}</b>
                  </span>
                  <span>
                    <small>Trabajos registrados</small>
                    <b>{trabajos}</b>
                  </span>
                </div>
                <button className="secondary full" onClick={() => setSeleccionado(p.id)}>
                  Ver ficha y trabajos
                </button>
              </div>
            )
          })}
      </div>

      {/* Mensaje si todavia no hay proveedores */}
      {proveedores.length === 0 && (
        <p className="muted">
          Todavia no hay proveedores cargados. Usa "+ Nuevo proveedor" para
          armar tu red de trabajo.
        </p>
      )}

      {/* Modal de creacion */}
      {formAbierto && (
        <ProviderForm
          inicial={editando}
          onGuardar={guardarProveedor}
          onCancelar={() => {
            setFormAbierto(false)
            setEditando(null)
          }}
        />
      )}
    </>
  )
}

// Fecha corta para los trabajos (el Timestamp de Firebase tiene toDate())
function formatoFecha(fechaIngreso) {
  if (fechaIngreso && typeof fechaIngreso.toDate === 'function') {
    try {
      return fechaIngreso.toDate().toLocaleDateString('es-AR')
    } catch (e) {
      return '...'
    }
  }
  return '...'
}
