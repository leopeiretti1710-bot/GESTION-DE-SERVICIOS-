// QuickCreate: modal para crear un reclamo nuevo
// Segun el modelo del DER: guarda propiedadId e inquilinoId como referencias
// a las colecciones 'propiedades' e 'inquilinos' de Firestore.
import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function QuickCreate({ onClose, onCreate }) {
  const [propiedades, setPropiedades] = useState([])
  const [inquilinos, setInquilinos] = useState([])

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'propiedades'), (snap) => setPropiedades(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'inquilinos'), (snap) => setInquilinos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  function submit(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const riesgo = f.get('riesgo') === 'on'
    const prioridadElegida = String(f.get('prioridad'))

    const propiedadId = String(f.get('propiedadId'))
    const inquilinoId = String(f.get('inquilinoId'))
    const propiedad = propiedades.find((p) => p.id === propiedadId)
    const inquilino = inquilinos.find((i) => i.id === inquilinoId)

    const nuevoReclamo = {
      propiedadId: propiedadId || '',
      propiedadDireccion: propiedad ? propiedad.direccion : String(f.get('property')),
      inquilinoId: inquilinoId || '',
      inquilinoNombre: inquilino ? inquilino.nombre : String(f.get('tenant')),
      telefono: String(f.get('telefono') || ''),
      matricula: String(f.get('matricula') || ''),
      unidad: String(f.get('unidad') || ''),
      categoria: f.get('category'),
      descripcion: f.get('description'),
      fechaAproximada: String(f.get('fechaAproximada') || ''),
      riesgo,
      prioridad: riesgo ? 'Urgente' : prioridadElegida,
      origen: 'MEZI Propiedades',
      estado: 'Recibido',
      fechaIngreso: new Date(),
      next: 'Evaluar reclamo',
      verificado: false,
    }

    onCreate(nuevoReclamo)
    onClose()
  }

  return (
    <div className="modal">
      <form className="modal-card claim-form-modal" onSubmit={submit}>
        <div className="panel-head">
          <div><p className="eyebrow">Carga interna</p><h2>Nuevo reclamo</h2></div>
          <button type="button" className="icon-btn" onClick={onClose}>X</button>
        </div>
        <div className="form-grid">
          <label className="full">
            Propiedad *
            <select name="propiedadId" required>
              <option value="">Seleccionar propiedad</option>
              {propiedades.map((p) => <option key={p.id} value={p.id}>{p.direccion} {p.unidad ? ' - ' + p.unidad : ''}</option>)}
            </select>
          </label>
          <label className="full">
            Inquilino *
            <select name="inquilinoId" required>
              <option value="">Seleccionar inquilino</option>
              {inquilinos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </label>
          <label>
            Telefono
            <input name="telefono" placeholder="Ej. 351 555 0000" />
          </label>
          <label>
            Matricula de la propiedad
            <input name="matricula" placeholder="Ej. 123456" />
          </label>
          <label>
            Unidad (piso o depto)
            <input name="unidad" placeholder="Ej. 2 B" />
          </label>
          <label>
            Fecha aproximada de inicio
            <input type="date" name="fechaAproximada" />
          </label>
          <label>
            Prioridad
            <select name="prioridad" defaultValue="Importante">
              <option>Urgente</option>
              <option>Importante</option>
              <option>Puede esperar</option>
            </select>
          </label>
          <label>
            Categoria
            <select name="category">
              <option>Plomeria</option>
              <option>Electricidad</option>
              <option>Gas</option>
              <option>Humedad</option>
              <option>Cerraduras</option>
              <option>Otro</option>
            </select>
          </label>
          <label className="full">
            Descripcion
            <textarea name="description" required />
          </label>
          <label className="check full">
            <input type="checkbox" name="riesgo" />
            <span>Situacion de riesgo (gas, agua, electricidad, inundacion)</span>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button className="primary" type="submit">Crear reclamo</button>
        </div>
      </form>
    </div>
  )
}
