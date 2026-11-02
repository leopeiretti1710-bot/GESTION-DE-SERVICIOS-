// RepairDetail: pantalla de detalle completa (5 tabs + acciones + eliminar)
// Los archivos se guardan como base64 en la subcoleccion 'archivos' de Firestore
// (SIN Firebase Storage, para funcionar en el plan gratuito).
import { useState, useEffect, useRef } from 'react'
import {
  updateDoc,
  deleteDoc,
  doc,
  collection,
  addDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import Badge from '../components/Badge'

const ESTADOS = [
  'Recibido',
  'En evaluacion',
  'Esperando presupuesto',
  'Pendiente de autorizacion',
  'Trabajo programado',
  'En ejecucion',
  'Finalizado',
  'Cancelado',
]

export default function RepairDetail({ reclamo, onBack }) {
  const [tab, setTab] = useState('Resumen')
  const [estadoElegido, setEstadoElegido] = useState(reclamo.estado || 'Recibido')
  const [toast, setToast] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [proveedorElegido, setProveedorElegido] = useState(reclamo.proveedorId || '')
  const [autorizacionElegida, setAutorizacionElegida] = useState(reclamo.autorizacion || 'Pendiente')
  const [fechaVisita, setFechaVisita] = useState(reclamo.fechaProgramada || '')

  const inputArchivosRef = useRef(null)
  const [archivos, setArchivos] = useState([])
  const [historial, setHistorial] = useState([])
  const [seguimientos, setSeguimientos] = useState([])
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)

  const [proveedores, setProveedores] = useState([])

  // Escucha proveedores en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'proveedores'), (snap) => {
      setProveedores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // Fecha de ingreso formateada
  let fechaTexto = 'Sin fecha'
  if (reclamo.fechaIngreso && typeof reclamo.fechaIngreso.toDate === 'function') {
    try {
      fechaTexto = reclamo.fechaIngreso.toDate().toLocaleDateString('es-AR')
    } catch (e) {
      fechaTexto = 'Sin fecha'
    }
  }

  // Sincroniza estado y autorizacion select con los datos del documento
  useEffect(() => {
    setEstadoElegido(reclamo.estado || 'Recibido')
  }, [reclamo.estado])
  useEffect(() => {
    setAutorizacionElegida(reclamo.autorizacion || 'Pendiente')
  }, [reclamo.autorizacion])

  // Escucha archivos, historial y seguimientos en tiempo real
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'reclamos', reclamo.id, 'archivos'), (snap) => {
      setArchivos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsub2 = onSnapshot(collection(db, 'reclamos', reclamo.id, 'historial'), (snap) => {
      setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsub3 = onSnapshot(collection(db, 'reclamos', reclamo.id, 'seguimientos'), (snap) => {
      setSeguimientos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [reclamo.id])

  function mostrarToast(mensaje) {
    setToast(mensaje)
    setTimeout(() => setToast(''), 2500)
  }

  async function guardarEstado() {
    if (estadoElegido === reclamo.estado) {
      mostrarToast('El estado ya es ese')
      return
    }
    await updateDoc(doc(db, 'reclamos', reclamo.id), {
      estado: estadoElegido,
    })
    await addDoc(collection(db, 'reclamos', reclamo.id, 'historial'), {
      fechaCambio: new Date(),
      accion: 'Cambio de estado',
      estadoAnterior: reclamo.estado,
      estadoNuevo: estadoElegido,
      descripcion: 'Estado cambiado a "' + estadoElegido + '".',
      realizadoPor: 'Usuario del sistema',
    })
    mostrarToast('Estado actualizado a "' + estadoElegido + '"')
  }

  async function cerrarReparacion() {
    await updateDoc(doc(db, 'reclamos', reclamo.id), {
      estado: 'Finalizado',
      next: '',
    })
    await addDoc(collection(db, 'reclamos', reclamo.id, 'historial'), {
      fechaCambio: new Date(),
      accion: 'Cierre de reparacion',
      estadoAnterior: reclamo.estado,
      estadoNuevo: 'Finalizado',
      descripcion: 'Reparacion finalizada por MEZI Propiedades.',
      realizadoPor: 'Usuario del sistema',
    })
    setEstadoElegido('Finalizado')
    mostrarToast('Reparacion finalizada')
  }

  async function asignarProveedor() {
    const elegido = proveedores.find((p) => p.id === proveedorElegido)
    await updateDoc(doc(db, 'reclamos', reclamo.id), {
      proveedorId: elegido ? elegido.id : '',
      proveedorNombre: elegido ? elegido.nombre : '',
    })
    await addDoc(collection(db, 'reclamos', reclamo.id, 'seguimientos'), {
      fechaRegistro: new Date(),
      tipoGestion: 'Asignacion',
      descripcion: elegido
        ? 'Proveedor asignado: ' + elegido.nombre + ' (' + elegido.especialidad + ')'
        : 'Proveedor desasignado.',
      responsable: 'Usuario del sistema',
    })
    mostrarToast(elegido ? 'Proveedor asignado' : 'Proveedor desasignado')
  }

  async function guardarPresupuesto(monto) {
    await updateDoc(doc(db, 'reclamos', reclamo.id), {
      presupuesto: monto,
      estado: 'Pendiente de autorizacion',
    })
    // Coleccion 'presupuestos' del dbdiagram: un documento por presupuesto
    await addDoc(collection(db, 'presupuestos'), {
      reclamoId: reclamo.id,
      proveedorId: reclamo.proveedorId || '',
      importe: monto,
      moneda: 'ARS',
      estado: 'Pendiente',
      descripcion: 'Trabajo de ' + (reclamo.categoria || '').toLowerCase(),
      fechaCreacion: new Date(),
    })
    await addDoc(collection(db, 'reclamos', reclamo.id, 'seguimientos'), {
      fechaRegistro: new Date(),
      tipoGestion: 'Presupuesto',
      descripcion: 'Presupuesto agregado por $' + monto.toLocaleString('es-AR') + '.',
      responsable: 'Usuario del sistema',
    })
    mostrarToast('Presupuesto registrado: $' + monto.toLocaleString('es-AR'))
  }

  async function guardarAutorizacion(decision) {
    await updateDoc(doc(db, 'reclamos', reclamo.id), {
      autorizacion: decision,
    })
    // Coleccion 'autorizaciones' del dbdiagram: un documento por decision
    await addDoc(collection(db, 'autorizaciones'), {
      reclamoId: reclamo.id,
      estado: decision,
      importeAutorizado: reclamo.presupuesto || 0,
      fechaRespuesta: new Date(),
      medioContacto: '',
      observaciones: '',
    })
    await addDoc(collection(db, 'reclamos', reclamo.id, 'seguimientos'), {
      fechaRegistro: new Date(),
      tipoGestion: 'Autorizacion',
      descripcion: 'Autorizacion del propietario: ' + decision + '.',
      responsable: 'Usuario del sistema',
    })
    mostrarToast('Autorizacion: ' + decision)
  }

  function mostrarMensajeIA() {
    const monto = reclamo.presupuesto ? formatoDinero(reclamo.presupuesto) : '(sin presupuesto)'
    mostrarToast(
      'Mensaje preparado: Hola, le enviamos el presupuesto de ' + monto +
      ' para ' + (reclamo.propiedadDireccion || 'su propiedad') + '.'
    )
  }

  // ----- ARCHIVOS (base64 en Firestore, SIN Storage) -----
  function abrirExplorador() {
    inputArchivosRef.current?.click()
  }

  function leerComoDataUrl(archivo) {
    return new Promise((resolve) => {
      const lector = new FileReader()
      lector.onload = () => resolve(lector.result)
      lector.readAsDataURL(archivo)
    })
  }

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

  async function guardarArchivos(e) {
    const elegidos = Array.from(e.target.files || [])
    if (!elegidos.length) return
    setSubiendoArchivo(true)

    const actuales = archivos
    const espacioUsado = actuales.reduce((total, a) => total + (a.tamano || 0), 0)
    const nuevas = []

    for (const archivo of elegidos) {
      const esImagen = archivo.type.startsWith('image')

      // Firestore admite documentos de hasta 1 MB, cuidamos el espacio
      if (!esImagen && archivo.size > 500 * 1024) {
        mostrarToast('"' + archivo.name + '" pesa mas de 500 KB. Usa una version mas liviana.')
        continue
      }
      if (espacioUsado + nuevas.reduce((t, a) => t + a.tamano, 0) > 900 * 1024) {
        mostrarToast('No hay mas espacio en este reclamo. Elimina algun archivo primero.')
        break
      }

      // Las imagenes se comprimen; el resto se guarda tal cual
      const data = esImagen ? await comprimirImagen(archivo) : await leerComoDataUrl(archivo)
      nuevas.push({
        nombreArchivo: archivo.name,
        tipoArchivo: archivo.type,
        tamano: esImagen ? Math.round(data.length * 0.75) : archivo.size,
        data,
        fechaSubida: new Date(),
      })
    }

    if (!nuevas.length) {
      setSubiendoArchivo(false)
      return
    }

    for (const n of nuevas) {
      await addDoc(collection(db, 'reclamos', reclamo.id, 'archivos'), n)
    }

    mostrarToast(nuevas.length + ' archivo(s) guardados')
    setSubiendoArchivo(false)
    e.target.value = '' // permite volver a elegir el mismo archivo
  }

  async function borrarArchivo(idArchivo) {
    await deleteDoc(doc(db, 'reclamos', reclamo.id, 'archivos', idArchivo))
    mostrarToast('Archivo eliminado')
  }

  async function programarVisita() {
    if (!fechaVisita) {
      mostrarToast('Elegi una fecha primero')
      return
    }
    await updateDoc(doc(db, 'reclamos', reclamo.id), {
      fechaProgramada: fechaVisita,
      estado: 'Trabajo programado',
      next: 'Visita programada',
    })
    // Coleccion 'eventos_calendario' del dbdiagram: un documento por visita.
    // El Calendario lee esta coleccion para mostrar los eventos.
    await addDoc(collection(db, 'eventos_calendario'), {
      reclamoId: reclamo.id,
      proveedorId: reclamo.proveedorId || '',
      titulo: 'Visita - ' + (reclamo.categoria || 'Reparacion'),
      descripcion: (reclamo.propiedadDireccion || '') + ' - ' + (reclamo.descripcion || ''),
      tipoEvento: 'Visita',
      fechaInicio: fechaVisita,
      prioridad: reclamo.prioridad || 'Importante',
      estado: 'Pendiente',
      responsable: reclamo.proveedorNombre || 'Sin asignar',
      recordatorio: true,
    })
    await addDoc(collection(db, 'reclamos', reclamo.id, 'seguimientos'), {
      fechaRegistro: new Date(),
      tipoGestion: 'Programacion',
      descripcion: 'Visita programada para ' + fechaVisita + '.',
      responsable: 'Usuario del sistema',
      fechaProximaAccion: new Date(fechaVisita),
    })
    mostrarToast('Visita programada para el ' + fechaVisita)
  }

  async function eliminarReclamo() {
    setBorrando(true)
    // Primero borrar archivos de la subcoleccion
    for (const a of archivos) {
      try {
        await deleteDoc(doc(db, 'reclamos', reclamo.id, 'archivos', a.id))
      } catch (e) {}
    }
    await deleteDoc(doc(db, 'reclamos', reclamo.id))
    onBack()
  }

  return (
    <>
      <button className="back" onClick={onBack}>
        ← Volver a reparaciones
      </button>

      {/* Cabecera: codigo, titulo, subtitulo y badges */}
      <div className="detail-head">
        <div>
          <span className="claim">{reclamo.codigo || reclamo.id}</span>
          <h1>{reclamo.categoria} · {reclamo.propiedadDireccion}</h1>
          <p>Matricula {reclamo.matricula || 'pendiente'} · Ingreso el {fechaTexto} por {reclamo.inquilinoNombre}</p>
        </div>
        <div>
          {/* Badges: prioridad y estado (con ternarios para el color) */}
          <Badge tone={reclamo.prioridad === 'Urgente' ? 'danger' : reclamo.prioridad === 'Importante' ? 'warning' : 'neutral'}>
            {reclamo.prioridad || 'Sin prioridad'}
          </Badge>
          <Badge
            tone={
              reclamo.estado === 'Finalizado'
                ? 'success'
                : (reclamo.estado || '').toLowerCase().includes('autoriz')
                  ? 'warning'
                  : 'neutral'
            }
          >
            {reclamo.estado || 'Sin estado'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={tab === 'Resumen' ? 'active' : ''} onClick={() => setTab('Resumen')}>Resumen</button>
        <button className={tab === 'Gestion interna' ? 'active' : ''} onClick={() => setTab('Gestion interna')}>Gestion interna</button>
        <button className={tab === 'Presupuestos' ? 'active' : ''} onClick={() => setTab('Presupuestos')}>Presupuestos</button>
        <button className={tab === 'Autorizacion' ? 'active' : ''} onClick={() => setTab('Autorizacion')}>Autorizacion</button>
        <button className={tab === 'Historial' ? 'active' : ''} onClick={() => setTab('Historial')}>Historial</button>
      </div>

      {/* Grilla principal */}
      <div className="detail-grid">
        <div className="detail-main">

          {/* ----- TAB RESUMEN ----- */}
          {tab === 'Resumen' && (
            <>
              <div className="panel">
                <h2>Informacion del reclamo</h2>
                <div className="info-grid">
                  <Info l="Inquilino" v={reclamo.inquilinoNombre || 'Sin nombre'} />
                  <Info l="Telefono" v={reclamo.telefono || 'Sin registrar'} />
                  <Info l="Matricula" v={reclamo.matricula || 'Pendiente de identificacion'} />
                  <Info l="Direccion" v={reclamo.propiedadDireccion || 'Sin direccion'} />
                  <Info l="Unidad" v={reclamo.unidad || 'No corresponde'} />
                  <Info l="Origen" v={reclamo.origen || 'MEZI Propiedades'} />
                  <Info l="Fecha de ingreso" v={fechaTexto} />
                  <Info l="Inicio aproximado" v={reclamo.fechaAproximada || 'No informado'} />
                  <Info l="Categoria" v={reclamo.categoria || 'Sin categoria'} />
                  <Info l="Evaluacion de riesgo" v={reclamo.riesgo ? 'Riesgo informado' : 'Sin riesgo informado'} />
                </div>
                <div className="description">
                  <small>Descripcion original</small>
                  <p>{reclamo.descripcion}</p>
                </div>
              </div>

              <div className="panel">
                <h2>Documentacion</h2>

                {/* Lista de archivos ya guardados en Firebase (base64) */}
                {(archivos.length > 0) && (
                  <div className="file-list">
                    {archivos.map((archivo) => (
                      <div className="file-item" key={archivo.id}>
                        <div className="file-info">
                          <b>{archivo.nombreArchivo}</b>
                          <small>
                            {archivo.tipoArchivo || 'archivo'} · {Math.round((archivo.tamano || 0) / 1024)} KB
                          </small>
                        </div>
                        <div className="file-actions">
                          {/* Ver / descargar: el href base64 abre el archivo */}
                          <a href={archivo.data} download={archivo.nombreArchivo}>
                            Descargar
                          </a>
                          <button className="danger-link" onClick={() => borrarArchivo(archivo.id)}>
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boton que abre el explorador de archivos */}
                <div className="empty-upload">
                  {(archivos.length > 0
                    ? 'Agregar mas fotos o documentos'
                    : 'Sin archivos adjuntos · ')}
                  <button onClick={abrirExplorador} disabled={subiendoArchivo}>
                    {subiendoArchivo ? 'Subiendo...' : 'Agregar fotos o documentos'}
                  </button>
                </div>

                {/* Input oculto: acepta imagenes y PDFs */}
                <input
                  ref={inputArchivosRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={guardarArchivos}
                />
              </div>
            </>
          )}

          {/* ----- TAB GESTION INTERNA ----- */}
          {tab === 'Gestion interna' && (
            <div className="panel">
              <h2>Gestion interna</h2>
              <p className="muted">
                Proximo paso planificado: <b>{reclamo.next || 'Definir proximo paso'}</b>
              </p>

              {/* Asignar proveedor al reclamo */}
              <label>
                Proveedor asignado
                <select
                  value={proveedorElegido}
                  onChange={(e) => setProveedorElegido(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} - {p.especialidad}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary" onClick={asignarProveedor}>
                Asignar proveedor
              </button>
              {reclamo.proveedorNombre && (
                <p className="muted">
                  Actualmente trabaja aca: <b>{reclamo.proveedorNombre}</b>
                </p>
              )}

              {/* Programar la visita del proveedor */}
              <label>
                Programar visita
                <input
                  type="date"
                  value={fechaVisita}
                  onChange={(e) => setFechaVisita(e.target.value)}
                />
              </label>
              <button className="primary" onClick={programarVisita}>
                Programar visita
              </button>
              {reclamo.fechaProgramada && (
                <p className="muted">
                  Visita agendada para el <b>{reclamo.fechaProgramada}</b>
                </p>
              )}

              {/* Seguimientos de la subcoleccion */}
              {(seguimientos.length > 0) && (
                <div className="timeline">
                  <h3>Seguimientos</h3>
                  {seguimientos.map((s) => (
                    <div key={s.id}>
                      <p>{s.descripcion}</p>
                      <small>{s.tipoGestion} · {s.responsable || 'Sistema'}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----- TAB PRESUPUESTOS ----- */}
          {tab === 'Presupuestos' && (
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h2>Presupuestos</h2>
                  <p>Importes en pesos argentinos</p>
                </div>
              </div>

              {reclamo.presupuesto ? (
                /* Si ya hay presupuesto: ficha con proveedor y monto */
                <div className="quote">
                  <div>
                    <b>{reclamo.proveedorNombre || 'Proveedor sin asignar'}</b>
                    <p>Trabajo de {(reclamo.categoria || '').toLowerCase()}</p>
                  </div>
                  <strong>{formatoDinero(reclamo.presupuesto)}</strong>
                </div>
              ) : (
                /* Si no hay presupuesto: formulario para cargarlo */
                <FormPresupuesto onGuardar={guardarPresupuesto} />
              )}
            </div>
          )}

          {/* ----- TAB AUTORIZACION ----- */}
          {tab === 'Autorizacion' && (
            <div className="panel">
              <h2>Autorizacion del propietario</h2>
              <Info
                l="Presupuesto asociado"
                v={reclamo.presupuesto ? formatoDinero(reclamo.presupuesto) : 'Sin presupuesto'}
              />
              <label>
                Estado de autorizacion
                <select
                  value={autorizacionElegida}
                  onChange={(e) => setAutorizacionElegida(e.target.value)}
                >
                  {['Pendiente', 'Aprobado', 'Rechazado', 'Aprobado parcialmente'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <button className="primary" onClick={() => guardarAutorizacion(autorizacionElegida)}>
                Guardar autorizacion
              </button>
              <button
                className="secondary"
                onClick={mostrarMensajeIA}
              >
                Preparar mensaje con IA (demostracion)
              </button>
            </div>
          )}

          {/* ----- TAB HISTORIAL (subcoleccion) ----- */}
          {tab === 'Historial' && (
            <div className="panel">
              <h2>Historial de gestiones</h2>
              {(historial.length > 0) ? (
                <div className="timeline">
                  {historial.map((h) => (
                    <div key={h.id}>
                      <i />
                      <div>
                        <p>{h.descripcion}</p>
                        <small>
                          {h.accion} · {h.realizadoPor || 'Sistema'}
                          {h.estadoAnterior && h.estadoNuevo
                            ? ' (' + h.estadoAnterior + ' → ' + h.estadoNuevo + ')'
                            : ''}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Todavia no hay movimientos registrados.</p>
              )}
            </div>
          )}

        </div>

        {/* Columna derecha: estado y acciones */}
        <aside className="detail-side">
          <div className="panel">
            <h3>Estado y acciones</h3>
            <label>
              Estado actual
              {/* Select controlado: el valor vive en estadoElegido */}
              <select
                value={estadoElegido}
                onChange={(e) => setEstadoElegido(e.target.value)}
              >
                {ESTADOS.map((estado) => (
                  <option key={estado}>{estado}</option>
                ))}
              </select>
            </label>
            <button className="primary full" onClick={guardarEstado}>
              Guardar cambios
            </button>

            {/* Solo tiene sentido cerrar si todavia no termino o cancelo */}
            {estadoElegido !== 'Finalizado' && estadoElegido !== 'Cancelado' && (
              <button className="secondary full" onClick={cerrarReparacion}>
                Cerrar reparacion
              </button>
            )}

            {/* Eliminar: abre la ventana de confirmacion propia */}
            <button
              className="danger full"
              onClick={() => setConfirmarEliminar(true)}
              disabled={borrando}
            >
              Eliminar reclamo
            </button>
          </div>

          <div className="panel">
            <h3>Proveedor</h3>
            <b>{reclamo.proveedorNombre || 'Sin asignar'}</b>
            <p className="muted">Asigná uno desde Gestion interna</p>
          </div>
        </aside>
      </div>

      {/* Toast: cartelito de confirmacion abajo a la derecha */}
      {toast && <div className="toast">{toast}</div>}

      {/* Ventana de confirmacion propia para eliminar (reemplaza al
          confirm() del navegador, que mostraba "localhost:5173 dice") */}
      {confirmarEliminar && (
        <div className="modal">
          <div className="modal-card">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Accion irreversible</p>
                <h2>Eliminar reclamo</h2>
              </div>
            </div>
            <p>
              El reclamo <b>{reclamo.codigo || reclamo.id}</b> se va a borrar de
              forma permanente en Firebase (incluyendo archivos adjuntos).
              Esta accion no se puede deshacer.
            </p>
            <div className="form-actions">
              <button
                className="secondary"
                onClick={() => setConfirmarEliminar(false)}
              >
                Cancelar
              </button>
              <button className="danger" onClick={eliminarReclamo} disabled={borrando}>
                {borrando ? 'Eliminando...' : 'Eliminar para siempre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Info: muestra una etiqueta chica y un valor (lo usa la grilla de datos)
function Info({ l, v }) {
  return (
    <div className="info">
      <small>{l}</small>
      <b>{v}</b>
    </div>
  )
}

// Formato de dinero argentino: 185000 -> "$ 185.000"
function formatoDinero(n) {
  if (!n) return '$ 0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

// FormPresupuesto: formularito para cargar el importe
function FormPresupuesto({ onGuardar }) {
  const [monto, setMonto] = useState('')
  return (
    <div className="empty-state">
      <p>Todavia no hay presupuestos registrados.</p>
      <div className="inline-form">
        <input
          type="number"
          placeholder="Importe"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
        {/* El && evita guardar si el input esta vacio */}
        <button className="primary" onClick={() => monto && onGuardar(Number(monto))}>
          Agregar presupuesto
        </button>
      </div>
    </div>
  )
}
