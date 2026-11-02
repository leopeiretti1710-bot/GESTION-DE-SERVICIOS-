// Reclamos: pantalla principal (listado + KPIs + modal nuevo reclamo)
// Props:
//   busqueda -> texto del buscador del header (viene desde App)
import { useState, useEffect } from 'react'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import KpiCard from '../components/KpiCard'
import QuickCreate from '../components/QuickCreate'
import ClaimCard from '../components/ClaimCard'
import '../App.css'
import RepairDetail from './RepairDetail'

// Ayudantes: leen prioridad y estado en minuscula para comparar.
// Sirven porque reclamos viejos de prueba estan guardados con otras
// mayusculas/minusculas ("urgente" vs "Urgente") y antes no aparecian.
const prioridadDe = (r) => (r.prioridad || '').toLowerCase()
const estadoDe = (r) => (r.estado || '').toLowerCase()

export default function Reclamos({ busqueda }) {
  // Lista de reclamos que viene de Firestore
  const [reclamos, setReclamos] = useState([])

  // Controla si el modal esta abierto
  const [creating, setCreating] = useState(false)

  // Filtro seleccionado en los KPIs (null = ninguno)
  const [filtro, setFiltro] = useState(null)

  // Filtro de propiedad (para el toolbar)
  const [propiedadFiltro, setPropiedadFiltro] = useState('Todas')

  // Reclamo seleccionado (muestra el detalle cuando no es null)
  const [selected, setSelected] = useState(null)

  // ESCUCHA EN TIEMPO REAL a la coleccion 'reclamos' de Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'reclamos'),
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setReclamos(lista)
        // Si hay un reclamo abierto en el detalle, lo refrescamos con los
        // datos nuevos (y si fue eliminado, volvemos al listado solo)
        setSelected((actual) =>
          actual ? lista.find((x) => x.id === actual.id) || null : null
        )
      },
      (error) => {
        console.error('Error al leer reclamos:', error)
      }
    )
    return () => unsubscribe()
  }, [])

  // Se ejecuta cuando se crea un reclamo nuevo
  async function handleCreate(reclamo) {
    await addDoc(collection(db, 'reclamos'), {
      codigo: 'REC-' + Date.now(),
      propiedadId: reclamo.propiedadId || '',
      propiedadDireccion: reclamo.propiedadDireccion,
      inquilinoId: reclamo.inquilinoId || '',
      inquilinoNombre: reclamo.inquilinoNombre,
      telefono: reclamo.telefono || '',
      matricula: reclamo.matricula || '',
      unidad: reclamo.unidad || '',
      categoria: reclamo.categoria,
      descripcion: reclamo.descripcion,
      fechaAproximada: reclamo.fechaAproximada || '',
      riesgo: reclamo.riesgo || false,
      origen: reclamo.origen || 'MEZI Propiedades',
      prioridad: reclamo.prioridad || 'Importante',
      estado: 'Recibido',
      fechaIngreso: serverTimestamp(),
      next: 'Evaluar reclamo',
      verificado: false,
    })
    setCreating(false)
  }

  // Filtrar reclamos por propiedad + texto del buscador
  const reclamosFiltrados = reclamos.filter((r) => {
    // Filtro del dropdown (por propiedad)
    if (propiedadFiltro !== 'Todas' && r.propiedadDireccion !== propiedadFiltro) {
      return false
    }
    // Filtro del buscador del header: buscamos el texto en varios campos
    if (busqueda) {
      const texto = [
        r.codigo,
        r.propiedadDireccion,
        r.inquilinoNombre,
        r.categoria,
        r.descripcion,
      ]
        .join(' ')
        .toLowerCase()
      if (!texto.includes(busqueda.toLowerCase())) return false
    }
    return true
  })

  // Filtrar por KPI (estado)
  const reclamosPorKpi = reclamosFiltrados.filter((r) => {
    if (filtro === null) return true
    if (filtro === 'Recibidos') return estadoDe(r) === 'recibido'
    if (filtro === 'En proceso') return !['recibido', 'finalizado', 'cancelado'].includes(estadoDe(r))
    if (filtro === 'Finalizados') return estadoDe(r) === 'finalizado'
    return true
  })

  // Agrupar por prioridad (como en el prototipo)
  const grupos = [
    {
      label: 'Urgente',
      descripcion: 'Requieren atencion inmediata',
      tone: 'urgent',
      items: reclamosPorKpi.filter((r) => prioridadDe(r) === 'urgente' && !['finalizado', 'cancelado'].includes(estadoDe(r))),
    },
    {
      label: 'Importante',
      descripcion: 'Gestionar con prioridad',
      tone: 'important',
      items: reclamosPorKpi.filter((r) => prioridadDe(r) === 'importante' && !['finalizado', 'cancelado'].includes(estadoDe(r))),
    },
    {
      label: 'Puede esperar',
      descripcion: 'Seguimiento programable',
      tone: 'waiting',
      items: reclamosPorKpi.filter((r) => prioridadDe(r) === 'puede esperar' && !['finalizado', 'cancelado'].includes(estadoDe(r))),
    },
    {
      label: 'Ya resuelto',
      descripcion: 'Trabajos terminados y archivados',
      tone: 'resolved',
      items: reclamosPorKpi.filter((r) => ['finalizado', 'cancelado'].includes(estadoDe(r))),
    },
  ]

  // Lista unica de propiedades para el filtro
  const propiedades = [...new Set(reclamos.map((r) => r.propiedadDireccion))]

  return (
    <>
      {/* Encabezado con KPIs */}
      <div className="page-head with-summary">
        <div>
          <p>Gestion diaria</p>
          <div className="claims-summary">
            <KpiCard
              titulo="Recibidos"
              valor={reclamos.filter((r) => estadoDe(r) === 'recibido').length}
              tone="received"
              active={filtro === 'Recibidos'}
              onClick={() => setFiltro(filtro === 'Recibidos' ? null : 'Recibidos')}
            />
            <KpiCard
              titulo="En proceso"
              valor={reclamos.filter((r) => !['recibido', 'finalizado', 'cancelado'].includes(estadoDe(r))).length}
              tone="progress"
              active={filtro === 'En proceso'}
              onClick={() => setFiltro(filtro === 'En proceso' ? null : 'En proceso')}
            />
            <KpiCard
              titulo="Finalizados"
              valor={reclamos.filter((r) => estadoDe(r) === 'finalizado').length}
              tone="finished"
              active={filtro === 'Finalizados'}
              onClick={() => setFiltro(filtro === 'Finalizados' ? null : 'Finalizados')}
            />
          </div>
          <h1>Reclamos</h1>
        </div>

        <button className="primary" onClick={() => setCreating(true)}>
          + Nuevo reclamo
        </button>
      </div>

      {/* Si hay un reclamo seleccionado se muestra el detalle.
          Si no (selected es null), se muestra toolbar + listado */}
      {selected ? (
        <RepairDetail reclamo={selected} onBack={() => setSelected(null)} />
      ) : (
      <>
      {/* Toolbar: filtro por propiedad + contador */}
      <div className="claims-toolbar">
        <label>
          Mostrar reclamos
          <select value={propiedadFiltro} onChange={(e) => setPropiedadFiltro(e.target.value)}>
            <option value="Todas">Todos los reclamos</option>
            {propiedades.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <span><b>{reclamosPorKpi.length}</b> reclamos encontrados</span>
      </div>

      {/* Listado agrupado por prioridad */}
      <div className="claims-rows">
        {grupos.map((grupo) => (
          <section className={'claim-row ' + grupo.tone} key={grupo.label}>
            <div className="claim-row-heading">
              <div>
                <h2>{grupo.label}</h2>
                <p>{grupo.descripcion}</p>
              </div>
              <strong>{grupo.items.length}</strong>
            </div>
            <div className="claim-strip">
              {grupo.items.length > 0 ? (
                grupo.items.map((r) => (
                  <ClaimCard key={r.id} reclamo={r} onOpen={(reclamo) => setSelected(reclamo)} />
                ))
              ) : (
                <div className="claim-row-empty">No hay reclamos en esta categoria</div>
              )}
            </div>
          </section>
        ))}
      </div>
      </>
      )}

      {/* Modal */}
      {creating && (
        <QuickCreate
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  )

}