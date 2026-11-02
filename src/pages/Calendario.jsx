// Calendario: agenda real con el mes actual.
// Lee los eventos de la coleccion 'eventos_calendario' (según tabla SQL del DER).
import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import Badge from '../components/Badge'
import '../App.css'

export default function Calendario({ onOpen }) {
  const [eventos, setEventos] = useState([])
  const [mes, setMes] = useState(new Date())
  useEffect(() => {
    const q = query(collection(db, 'eventos_calendario'), orderBy('fechaInicio', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setEventos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (e) => console.error('Error al leer eventos:', e))
    return () => unsub()
  }, [])

  const opcionesMes = { month: 'long', year: 'numeric' }
  const nombreMes = mes.toLocaleDateString('es-AR', opcionesMes)

  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
  const cantidadDias = ultimoDia.getDate()
  const inicioSemana = (primerDia.getDay() + 6) % 7

  // Agrupar eventos por fecha de inicio (YYYY-MM-DD)
  const eventosPorDia = {}
  eventos.forEach((e) => {
    const fecha = e.fechaInicio
    if (fecha) {
      let fechaStr = fecha
      if (fecha.toDate) fechaStr = fecha.toDate().toISOString().slice(0, 10)
      else if (typeof fecha === 'string') fechaStr = fecha.slice(0, 10)
      if (!eventosPorDia[fechaStr]) eventosPorDia[fechaStr] = []
      eventosPorDia[fechaStr].push(e)
    }
  })

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const mesAnterior = new Date(mes.getFullYear(), mes.getMonth() - 1, 1)
  const mesSiguiente = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)

  const urgentes = eventos.filter(
    (e) => (e.prioridad || '').toLowerCase() === 'urgente' && (e.estado || '').toLowerCase() !== 'cancelada'
  )

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
              const evs = eventosPorDia[fechaISO] || []
              const esHoy = new Date(mes.getFullYear(), mes.getMonth(), dia).getTime() === hoy.getTime()
              return (
                <button
                  type="button" key={dia}
                  className={`calendar-day${evs.length ? ' has-event' : ''}${esHoy ? ' hoy' : ''}`}
                  onClick={() => { if (evs.length && onOpen) onOpen(evs[0]) }}
                >
                  <b>{dia}</b>
                  {evs.length ? (
                    <span className={(evs[0].prioridad || '').toLowerCase() === 'urgente' ? 'hot' : ''}>
                      {evs[0].titulo || 'Evento'}
                    </span>
                  ) : null}
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
            urgentes.map((e, i) => (
              <button type="button" key={e.id} className="secondary full" onClick={() => { if (onOpen) onOpen(e) }}>
                <span className="urgent-order">{i + 1}</span>
                <span>
                  <b>{e.titulo}</b>
                  <small>{e.descripcion} · {e.fechaInicio || 'Sin fecha'}</small>
                </span>
                <Badge tone="danger">{e.prioridad}</Badge>
              </button>
            ))
          ) : (
            <p className="muted">No hay eventos urgentes pendientes.</p>
          )}
        </aside>
      </div>
    </>
  )
}
