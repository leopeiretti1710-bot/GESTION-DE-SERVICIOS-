// QuickCreate: modal para crear un reclamo nuevo
// La propiedad se escribe en un INPUT de texto (no lista desplegable).
// Al guardar, si la propiedad no existe en la coleccion 'propiedades'
// se crea automaticamente, y el reclamo guarda propiedadId (modelo DER).
import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
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

  async function submit(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const riesgo = f.get('riesgo') === 'on'
    const prioridadElegida = String(f.get('prioridad'))

    // La propiedad se escribe a mano: texto limpio (sin espacios de mas)
    const direccionEscrita = String(f.get('propiedad') || '').trim()
    const inquilinoId = String(f.get('inquilinoId'))
    const inquilino = inquilinos.find((i) => i.id === inquilinoId)

    // Buscamos la propiedad en la base por direccion (ignora mayusculas).
    // Si no existe, se crea ahora en la coleccion 'propiedades'.
    let propiedadId = ''
    const existente = propiedades.find(
      (p) => (p.direccion || '').toLowerCase() === direccionEscrita.toLowerCase()
    )
    if (existente) {
      propiedadId = existente.id
    } else {
      const nueva = await addDoc(collection(db, 'propiedades'), {
        direccion: direccionEscrita,
        barrio: '',
        piso: '',
        unidad: String(f.get('unidad') || ''),
        tipoInmueble: '',
        propietarioNombre: '',
        propietarioTelefono: '',
        propietarioEmail: '',
        observaciones: 'Creada automaticamente al generar un reclamo.',
        activa: true,
        fechaRegistro: serverTimestamp(),
      })
      propiedadId = nueva.id
    }

    const nuevoReclamo = {
      propiedadId,
      propiedadDireccion: direccionEscrita,
      inquilinoId: inquilinoId || '',
      inquilinoNombre: inquilino ? inquilino.nombre : '',
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
          {/* INPUT de texto: el usuario escribe la propiedad a mano.
              Si no existe en la base, se guarda como propiedad nueva. */}
          <label className="full">
            Propiedad *
            <input
              name="propiedad"
              required
              placeholder="Ej. Moron 1240"
              list="lista-propiedades"
            />
            {/* Sugerencias opcionales mientras escribe (no es obligatorio
                elegir de aca, es solo ayuda visual) */}
            <datalist id="lista-propiedades">
              {propiedades.map((p) => <option key={p.id} value={p.direccion} />)}
            </datalist>
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
