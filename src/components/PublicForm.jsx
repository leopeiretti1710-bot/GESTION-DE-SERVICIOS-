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
  // Fotos elegidas: los archivos en si (para guardarlos) y sus vistas previas
  const [fotosElegidas, setFotosElegidas] = useState([])
  const [vistasPrevia, setVistasPrevia] = useState([])

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

  // ----- FOTOS: vista previa chica + guardado como base64 -----
  // Cuando el usuario elige imagenes, creamos una URL local de cada una
  // para mostrar la miniatura antes de enviar.
  function elegirFotos(e) {
    const archivos = Array.from(e.target.files || [])
    // Liberamos las URLs de las vistas anteriores (limpieza de memoria)
    vistasPrevia.forEach((v) => URL.revokeObjectURL(v.url))
    setFotosElegidas(archivos)
    setVistasPrevia(archivos.map((a) => ({ url: URL.createObjectURL(a), nombre: a.name })))
  }

  // Saca una foto de la lista antes de enviar
  function quitarFoto(indice) {
    URL.revokeObjectURL(vistasPrevia[indice].url)
    setVistasPrevia(vistasPrevia.filter((_, i) => i !== indice))
    setFotosElegidas(fotosElegidas.filter((_, i) => i !== indice))
  }

  // Lee un archivo y lo convierte a texto base64 (data URL)
  function leerComoDataUrl(archivo) {
    return new Promise((resolve) => {
      const lector = new FileReader()
      lector.onload = () => resolve(lector.result)
      lector.readAsDataURL(archivo)
    })
  }

  // Achica la imagen para que pese poco (Firestore admite docs de 1 MB)
  async function comprimirImagen(archivo) {
    const dataUrl = await leerComoDataUrl(archivo)
    const imagen = await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = dataUrl
    })
    const maxLado = 1200
    const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(imagen.width * escala)
    canvas.height = Math.round(imagen.height * escala)
    canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.75)
  }

  async function submit(e) {
    e.preventDefault()

    const f = new FormData(e.currentTarget)
    const riesgo = f.get('riesgo') === 'on'
    const importancia = String(f.get('importancia'))

    const codigo = 'REC-' + Date.now()

    // La propiedad se escribe a mano. Si ya existe en la base (misma
    // direccion) se usa su documento; si no, se crea automaticamente.
    const direccionEscrita = String(f.get('direccion') || '').trim()
    let propiedadId = ''
    const propiedadExistente = propiedades.find(
      (p) => (p.direccion || '').toLowerCase() === direccionEscrita.toLowerCase()
    )
    if (propiedadExistente) {
      propiedadId = propiedadExistente.id
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
        observaciones: 'Creada automaticamente desde el formulario publico.',
        activa: true,
        fechaRegistro: serverTimestamp(),
      })
      propiedadId = nueva.id
    }

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
    const reclamoNuevo = await addDoc(collection(db, 'reclamos'), {
      codigo,
      propiedadId,
      propiedadDireccion: direccionEscrita,
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

    // Las fotos elegidas se guardan como base64 en la subcoleccion 'archivos'
    // del reclamo (igual que en el detalle, sin Firebase Storage).
    for (const foto of fotosElegidas) {
      try {
        const data = await comprimirImagen(foto)
        await addDoc(collection(db, 'reclamos', reclamoNuevo.id, 'archivos'), {
          nombreArchivo: foto.name,
          tipoArchivo: foto.type,
          tamano: Math.round(data.length * 0.75),
          data,
          fechaSubida: new Date(),
        })
      } catch (errorFoto) {
        console.error('No se pudo guardar una foto:', errorFoto)
      }
    }

    // Limpiamos las vistas previa (y liberamos la memoria de las URLs)
    vistasPrevia.forEach((v) => URL.revokeObjectURL(v.url))
    setFotosElegidas([])
    setVistasPrevia([])

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
              Direccion de la propiedad *
              <input
                name="direccion"
                required
                placeholder="Ej. Moron 1240"
                list="lista-propiedades-publica"
              />
              {/* Sugerencias opcionales mientras escribe */}
              <datalist id="lista-propiedades-publica">
                {propiedades.map((p) => (
                  <option key={p.id} value={p.direccion} />
                ))}
              </datalist>
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
              {/* Zona de carga estilizada: al tocarla se abre el explorador.
                  El input nativo queda oculto dentro del label. */}
              <div className="upload-zone">
                <span className="upload-icon">+</span>
                <span>
                  <b>Toca para agregar fotos</b>
                  <small>JPG o PNG · podes elegir varias</small>
                </span>
              </div>
              <input
                type="file"
                name="fotos"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={elegirFotos}
              />
              {/* Vistas previas chicas de las fotos elegidas */}
              {vistasPrevia.length > 0 && (
                <div className="fotos-preview">
                  {vistasPrevia.map((vista, indice) => (
                    <div className="foto-mini" key={vista.url}>
                      <img src={vista.url} alt={vista.nombre} />
                      <button
                        type="button"
                        aria-label="Quitar foto"
                        onClick={(e) => {
                          // Evita que el label abra el explorador de archivos
                          e.preventDefault()
                          e.stopPropagation()
                          quitarFoto(indice)
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
