// PublicForm: formulario publico para que el inquilino cargue su reclamo
// (pantalla nueva del prototipo)
// Props:
//   onVolver -> vuelve a la pantalla de acceso
// Concepto: usamos FormData para leer todos los valores al enviar, incluyendo
// el checkbox de riesgo. Guardamos propiedadId (ref a coleccion 'propiedades')
// segun el modelo del DER.
import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Badge from './Badge'

export default function PublicForm({ onVolver }) {
  // Si ya se envio, aca guardamos el codigo para mostrar la pantalla de gracias
  const [enviado, setEnviado] = useState('')
  const [propiedades, setPropiedades] = useState([])
  const [inquilinos, setInquilinos] = useState([])

  // Carga propiedades e inquilinos en tiempo real para los selects / referencias
  useEffect(() => {
    const un1 = onSnapshot(collection(db, 'propiedades'), (snap) => {
      setPropiedades(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const un2 = onSnapshot(collection(db, 'inquilinos'), (snap) => {
      setInquilinos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => { un1(); un2() }
  }, [])

  async function submit(e) {
    e.preventDefault()

    const f = new FormData(e.currentTarget)
    const riesgo = f.get('riesgo') === 'on'
    const importancia = String(f.get('importancia'))

    const codigo = 'REC-' + Date.now()
    const propiedadId = String(f.get('propiedadId'))
    const propiedad = propiedades.find((p) => p.id === propiedadId)
    const nombreInquilino = String(f.get('nombre'))

    // Referencia 'inquilinoId' del dbdiagram: si el inquilino ya existe
    // (mismo nombre) usamos su documento; si no, lo creamos ahora.
    let inquilinoId = ''
    const existente = inquilinos.find(
      (i) => (i.nombre || '').toLowerCase() === nombreInquilino.toLowerCase()
    )
    if (existente) {
      inquilinoId = existente.id
    } else {
      const nuevo = await addDoc(collection(db, 'inquilinos'), {
        nombre: nombreInquilino,
        telefono: String(f.get('telefono')),
        email: '',
        fechaRegistro: serverTimestamp(),
      })
      inquilinoId = nuevo.id
    }

    // Guardamos el reclamo en Firestore con origen "Inquilino"
    await addDoc(collection(db, 'reclamos'), {
      codigo,
      propiedadId: propiedadId || '',
      propiedadDireccion: propiedad
        ? propiedad.direccion
        : String(f.get('direccion')),
      inquilinoId,
      inquilinoNombre: nombreInquilino,
      telefono: String(f.get('telefono')),
      matricula: String(f.get('matricula')),
      unidad: String(f.get('unidad')),
      categoria: String(f.get('categoria')),
      descripcion: String(f.get('descripcion')),
      fechaAproximada: String(f.get('fechaAproximada')),
      disponibilidad: String(f.get('disponibilidad')),
      riesgo,
      origen: 'Inquilino',
      prioridad: riesgo ? 'Urgente' : importancia,
      estado: 'Recibido',
      fechaIngreso: serverTimestamp(),
      next: 'Evaluar reclamo',
    })

    setEnviado(codigo)
  }

  // ----- Pantalla de agradecimiento (despues de enviar) -----
  if (enviado) {
    return (
      <div className="public-page">
        <div className="public-nav">
          <img src="/mezi-logo.png" alt="MEZI Propiedades" />
          <button onClick={onVolver}>Acceso MEZI</button>
        </div>

        <div className="success-card">
          <p className="eyebrow">Solicitud recibida</p>
          <h1>Gracias, registramos tu reclamo</h1>
          <p>
            El equipo de MEZI Propiedades revisara la informacion y se
            comunicara con vos.
          </p>
          <div className="claim-number">
            <small>Numero de reclamo</small>
            <b>{enviado}</b>
          </div>
          <p className="muted">Guarda este numero para futuras consultas.</p>
          <button className="primary" onClick={() => setEnviado('')}>
            Enviar otra solicitud
          </button>
        </div>
      </div>
    )
  }

  // ----- Formulario (mientras no se envio nada) -----
  return (
    <div className="public-page">
      <div className="public-nav">
        <img src="/mezi-logo.png" alt="MEZI Propiedades" />
        <button onClick={onVolver}>Acceso MEZI</button>
      </div>

      <div className="public-hero">
        <Badge tone="purple">Formulario para inquilinos</Badge>
        <h1>Solicitud de reparacion</h1>
        <p>
          Contanos que ocurrio. Te vamos a pedir solo la informacion necesaria
          para gestionar la solucion.
        </p>
      </div>

      <form className="public-form" onSubmit={submit}>
        {/* Seccion 1: datos personales y de la propiedad */}
        <section>
          <h2>1. Tus datos y la propiedad</h2>
          <div className="form-grid">
            <label>
              Nombre y apellido *
              <input name="nombre" required placeholder="Ej. Juan Perez" />
            </label>
            <label>
              Telefono *
              <input name="telefono" required placeholder="Ej. 351 555 0000" />
            </label>
            <label className="full">
              Propiedad *
              <select name="propiedadId" required>
                <option value="">Seleccionar propiedad</option>
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.direccion} {p.unidad ? ' - ' + p.unidad : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="full">
              Numero de matricula de la propiedad *
              <input name="matricula" required placeholder="Ej. 123456" />
            </label>
            <label>
              Unidad, piso o departamento
              <input name="unidad" placeholder="Ej. 2 B" />
            </label>
            <label>
              Fecha aproximada de inicio
              <input type="date" name="fechaAproximada" />
            </label>
          </div>
        </section>

        {/* Seccion 2: el problema */}
        <section>
          <h2>2. Que problema encontraste?</h2>
          <div className="form-grid">
            <label>
              Tipo de problema *
              <select name="categoria" required>
                <option>Plomeria</option>
                <option>Electricidad</option>
                <option>Gas</option>
                <option>Humedad</option>
                <option>Cerraduras</option>
                <option>Otro</option>
              </select>
            </label>
            <label>
              Importancia del reclamo *
              <select name="importancia" required defaultValue="">
                <option value="" disabled>
                  Selecciona una opcion
                </option>
                <option>Urgente</option>
                <option>Importante</option>
                <option>Puede esperar</option>
              </select>
            </label>
            <label className="full">
              Descripcion *
              <textarea
                name="descripcion"
                required
                placeholder="Describe que sucede, donde y desde cuando..."
              />
            </label>
            <label className="full">
              Fotografias
              <input type="file" name="fotos" multiple accept="image/*" />
            </label>
          </div>
        </section>

        {/* Seccion 3: seguridad y disponibilidad */}
        <section>
          <h2>3. Seguridad y disponibilidad</h2>
          <label className="check">
            <input type="checkbox" name="riesgo" />
            <span>
              Hay peligro para personas (gas, agua, riesgo electrico,
              inundacion)?
            </span>
          </label>
          <label>
            Disponibilidad horaria (opcional)
            <input
              name="disponibilidad"
              placeholder="Ej. lunes a viernes de 14 a 18 h"
            />
          </label>
        </section>

        <div className="form-actions">
          <button className="primary">Enviar solicitud de reparacion</button>
        </div>

        <p className="muted">
          La informacion sera utilizada exclusivamente para gestionar este
          reclamo.
        </p>
      </form>
    </div>
  )
}
