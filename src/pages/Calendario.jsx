// Calendario: agenda real con el mes actual.
// Como en el Figma: muestra TODOS los reclamos activos (no finalizados ni
// cancelados). Cada reclamo aparece en el dia de su fecha programada (visita)
// o de su fecha aproximada de inicio. Los urgentes van primero en la lista
// de la derecha y se resaltan en rojo (.hot) en el dia.
// Tambien muestra los eventos de la coleccion 'eventos_calendario'
// (visitas programadas desde el detalle del reclamo).
import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Badge from '../components/Badge'
import '../App.css'

// Convierte la fecha de un reclamo o evento a texto 'YYYY-MM-DD'.
// Acepta strings ('2026-11-05') y timestamps de Firebase.
function fechaTexto(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  if (typeof fecha.toDate === 'function') {
    try { return fecha.toDate().toISOString().slice(0, 10) } catch (e) { return '' }
  }
  return ''
}

export default function Calendario() {
  const [reclamos, setReclamos] = useState([])
  const [eventos, setEventos] = useState([])
  const [mes, setMes] = useState(new Date())

  // Escucha reclamos y eventos en tiempo real
  useEffect(() => {
    const un1 = onSnapshot(collection(db, 'reclamos'), (snap) => {
      setReclamos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (e) => console.error('Error al leer reclamos:', e))
    const un2 = onSnapshot(collection(db, 'eventos_calendario'), (snap) => {
      setEventos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (e) => console.error('Error al leer eventos:', e))
    return () => { un1(); un2() }
  }, [])

  // Reclamos activos: se muestran en el calendario
  const activos = reclamos.filter(
    (r) => !['Finalizado', 'Cancelado'].includes(r.estado)
  )

  // ------------------------------------------------------------------
  // Eventos por dia: juntamos reclamos activos + eventos de visitas
  // ------------------------------------------------------------------
  const eventosPorDia = {}

  function agregar(fechaStr, item) {
    if (!fechaStr) return
    if (!eventosPorDia[fechaStr]) eventosPorDia[fechaStr] = []
    eventosPorDia[fechaStr].push(item)
  }

  activos.forEach((r) => {
    // Prioridad: fecha programada (visita). Si no hay, fecha aproximada.
    const fecha = fechaTexto(r.fechaProgramada) || fechaTexto(r.fechaAproximada)
    agregar(fecha, {
      tipo: 'reclamo',
      id: r.id,
      titulo: r.next || r.categoria || 'Reclamo',
      prioridad: r.prioridad,
      descripcion: (r.propiedadDireccion || '') + ' - ' + (r.inquilinoNombre || ''),
    })
  })

  eventos.forEach((e) => {
    agregar(fechaTexto(e.fechaInicio), {
      tipo: 'evento',
      id: e.id,
      titulo: e.titulo || 'Evento',
      prioridad: e.prioridad,
      descripcion: e.descripcion || '',
    })
  })

  // ------------------------------------------------------------------
  // Lista "Lo mas urgente": reclamos activos, urgentes primero (como el
  // Figma), maximo 5.
  // ------------------------------------------------------------------
  const urgentes = activos
    .slice()
    .sort((a, b) => {
      const ua = (a.prioridad || '') === 'Urgente' ? 0 : 1
      const ub = (b.prioridad || '') === 'Urgente' ? 0 : 1
      return ua - ub
    })
    .slice(0, 5)

  // ------------------------------------------------------------------
  // Grilla del mes real
  // ------------------------------------------------------------------
  const nombreMes = mes.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
  const cantidadDias = ultimoDia.getDate()
  const inicioSemana = (primerDia.getDay() + 6) % 7

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const mesAnterior = new Date(mes.getFullYear(), mes.getMonth() - 1, 1)
  const mesSiguiente = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)

  return (
    <>
      <div className="page-head">
        <div><p>Agenda de trabajo</p><h1>Calendario</h1></div>
        <div className="calendar-title">
          <button className="secondary" onClick={() => setMes(mesAnterior)}>←</button>
          <h2 style={{ margin: '0 10px' }}>{nombreMes}</h2>
          <button className="secondary" onClick={() => setMes(mesSiguiente)}>→</button>
        </div>
      </div>

      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: inicioSemana }).map((_, i) => <span key={'b' + i} className="calendar-blank" />)}
            {Array.from({ length: cantidadDias }, (_, i) => {
              const dia = i + 1
              const fechaISO = new Date(mes.getFullYear(), mes.getMonth(), dia).toISOString().slice(0, 10)
              const delDia = eventosPorDia[fechaISO] || []
              const esHoy = new Date(mes.getFullYear(), mes.getMonth(), dia).getTime() === hoy.getTime()
              return (
                <button
                  type="button" key={dia}
                  className={`calendar-day${delDia.length ? ' has-event' : ''}${esHoy ? ' hoy' : ''}`}
                >
                  <b>{dia}</b>
                  {delDia.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className={(item.prioridad || '').toLowerCase() === 'urgente' ? 'hot' : ''}
                    >
                      {item.titulo}
                    </span>
                  ))}
                  {delDia.length > 2 && (
                    <span>+{delDia.length - 2} mas</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <aside className="urgent-notes">
          <div className="urgent-notes-head">
            <div><p className="eyebrow">Atencion prioritaria</p><h2>Lo mas urgente</h2></div>
            <Badge tone="danger">{urgentes.length}</Badge>
          </div>
          {urgentes.length ? (
            urgentes.map((r, i) => (
              <button type="button" key={r.id} className="secondary full">
                <span className="urgent-order">{i + 1}</span>
                <span>
                  <b>{r.next || 'Definir proxima accion'}</b>
                  <small>
                    {(r.propiedadDireccion || 'Sin propiedad')} · {fechaTexto(r.fechaProgramada) || fechaTexto(r.fechaAproximada) || 'Sin fecha'}
                  </small>
                </span>
                <Badge tone={(r.prioridad || '') === 'Urgente' ? 'danger' : (r.prioridad || '') === 'Importante' ? 'warning' : 'neutral'}>
                  {r.prioridad || 'Sin prioridad'}
                </Badge>
              </button>
            ))
          ) : (
            <p className="muted">No hay reclamos activos.</p>
          )}
        </aside>
      </div>
    </>
  )
}
