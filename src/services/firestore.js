// src/services/firestore.js
// Operaciones de Firestore segun el modelo del DER (MEZI Propiedades.sql, 17 tablas).
// Usa IDs de referencia (propiedadId, inquilinoId, etc.) entre colecciones.
// Archivos se guardan como base64 en subcoleccion 'archivos' (SIN Storage, plan gratuito).

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

// ============================================================================
// COLECCIONES PRINCIPALES (mapeadas 1:1 con las tablas SQL del DER)
// ============================================================================

export const COLLECTIONS = {
  PROPIEDADES: 'propiedades',
  INQUILINOS: 'inquilinos',
  OCUPACIONES: 'ocupaciones',
  RECLAMOS: 'reclamos',
  PROVEEDORES: 'proveedores',
  ASIGNACIONES_PROVEEDORES: 'asignaciones_proveedores',
  SEGUIMIENTOS: 'seguimientos',
  PRESUPUESTOS: 'presupuestos',
  AUTORIZACIONES: 'autorizaciones',
  EVENTOS_CALENDARIO: 'eventos_calendario',
  NOTAS_PRIORITARIAS: 'notas_prioritarias',
  ARCHIVOS: 'archivos',
  HISTORIAL_RECLAMOS: 'historial_reclamos',
  NOTIFICACIONES: 'notificaciones',
  SUGERENCIAS_IA: 'sugerencias_ia',
}

// ============================================================================
// REFERENCIAS A COLECCIONES
// ============================================================================

export const refPropiedades = () => collection(db, 'propiedades')
export const refInquilinos = () => collection(db, 'inquilinos')
export const refOcupaciones = () => collection(db, 'ocupaciones')
export const refReclamos = () => collection(db, 'reclamos')
export const refProveedores = () => collection(db, 'proveedores')
export const refAsignaciones = () => collection(db, 'asignaciones_proveedores')
export const refPresupuestos = () => collection(db, 'presupuestos')
export const refAutorizaciones = () => collection(db, 'autorizaciones')
export const refEventosCalendario = () => collection(db, 'eventos_calendario')
export const refNotasPrioritarias = () => collection(db, 'notas_prioritarias')
export const refNotificaciones = () => collection(db, 'notificaciones')
export const refSugerenciasIA = () => collection(db, 'sugerencias_ia')

// Subcolecciones de reclamos
export const refSeguimientos = (reclamoId) => collection(db, 'reclamos', reclamoId, 'seguimientos')
export const refArchivos = (reclamoId) => collection(db, 'reclamos', reclamoId, 'archivos')
export const refHistorial = (reclamoId) => collection(db, 'reclamos', reclamoId, 'historial')

// ============================================================================
// ARCHIVOS (base64 en Firestore, SIN Storage)
// ============================================================================

export function leerComoDataUrl(archivo) {
  return new Promise((resolve) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result)
    lector.readAsDataURL(archivo)
  })
}

export async function comprimirImagen(archivo) {
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

export async function guardarArchivoEnReclamo(reclamoId, archivo, data) {
  const docRef = await addDoc(refArchivos(reclamoId), {
    nombreArchivo: archivo.name,
    tipoArchivo: archivo.type,
    urlArchivo: data,
    descripcion: '',
    fechaSubida: serverTimestamp(),
  })
  return docRef.id
}

export async function eliminarArchivoDeReclamo(reclamoId, archivoId) {
  await deleteDoc(doc(db, 'reclamos', reclamoId, 'archivos', archivoId))
}

// ============================================================================
// SEGUIMIENTOS (subcoleccion de reclamos)
// ============================================================================

export async function agregarSeguimiento(
  reclamoId,
  { tipoGestion, descripcion, responsable, proximaAccion, fechaProximaAccion }
) {
  return await addDoc(refSeguimientos(reclamoId), {
    fechaRegistro: serverTimestamp(),
    tipoGestion,
    descripcion,
    responsable,
    proximaAccion,
    fechaProximaAccion: fechaProximaAccion || null,
    completado: false,
  })
}

// ============================================================================
// HISTORIAL DE CAMBIOS (subcoleccion de reclamos)
// ============================================================================

export async function agregarHistorial(
  reclamoId,
  { accion, estadoAnterior, estadoNuevo, descripcion, realizadoPor }
) {
  return await addDoc(refHistorial(reclamoId), {
    fechaCambio: serverTimestamp(),
    accion,
    estadoAnterior,
    estadoNuevo,
    descripcion,
    realizadoPor,
  })
}

// ============================================================================
// PRESUPUESTOS (coleccion propia)
// ============================================================================

export async function crearPresupuesto({
  reclamoId, proveedorId, fechaPresupuesto, descripcion, importe, moneda = 'ARS', estado, observaciones,
}) {
  return await addDoc(refPresupuestos(), {
    reclamoId,
    proveedorId: proveedorId || null,
    fechaPresupuesto: fechaPresupuesto || serverTimestamp(),
    descripcion: descripcion || '',
    importe: importe || 0,
    moneda,
    estado: estado || 'Pendiente',
    observaciones: observaciones || '',
    fechaCreacion: serverTimestamp(),
  })
}

export async function actualizarPresupuesto(id, datos) {
  return await updateDoc(doc(db, 'presupuestos', id), datos)
}

// ============================================================================
// AUTORIZACIONES (coleccion propia)
// ============================================================================

export async function crearAutorizacion({
  reclamoId, presupuestoId, estado = 'Pendiente', fechaSolicitud, fechaRespuesta,
  medioContacto, importeAutorizado, observaciones,
}) {
  return await addDoc(refAutorizaciones(), {
    reclamoId,
    presupuestoId: presupuestoId || null,
    estado,
    fechaSolicitud: fechaSolicitud || serverTimestamp(),
    fechaRespuesta: fechaRespuesta || null,
    medioContacto: medioContacto || '',
    importeAutorizado: importeAutorizado || 0,
    observaciones: observaciones || '',
  })
}

export async function actualizarAutorizacion(id, datos) {
  return await updateDoc(doc(db, 'autorizaciones', id), datos)
}

// ============================================================================
// EVENTOS CALENDARIO (coleccion propia)
// ============================================================================

export async function crearEventoCalendario({
  reclamoId, proveedorId, titulo, descripcion, tipoEvento, fechaInicio, fechaFin,
  prioridad, estado = 'Pendiente', responsable, recordatorio = true,
}) {
  return await addDoc(refEventosCalendario(), {
    reclamoId: reclamoId || null,
    proveedorId: proveedorId || null,
    titulo,
    descripcion: descripcion || '',
    tipoEvento,
    fechaInicio: fechaInicio || serverTimestamp(),
    fechaFin: fechaFin || null,
    prioridad: prioridad || 'importante',
    estado,
    responsable: responsable || '',
    recordatorio,
  })
}

// ============================================================================
// NOTAS PRIORITARIAS (coleccion propia)
// ============================================================================

export async function crearNotaPrioritaria({
  reclamoId, titulo, contenido, prioridad = 'importante', fechaLimite,
  estado = 'Pendiente', ordenVisual,
}) {
  return await addDoc(refNotasPrioritarias(), {
    reclamoId: reclamoId || null,
    titulo,
    contenido: contenido || '',
    prioridad,
    fechaCreacion: serverTimestamp(),
    fechaLimite: fechaLimite || null,
    estado,
    ordenVisual: ordenVisual || 0,
  })
}

// ============================================================================
// NOTIFICACIONES (coleccion propia)
// ============================================================================

export async function crearNotificacion({
  reclamoId, tipo, canal, destinatario, asunto, mensaje, fechaProgramada,
  estadoEnvio = 'Pendiente', referenciaExterna,
}) {
  return await addDoc(refNotificaciones(), {
    reclamoId: reclamoId || null,
    tipo,
    canal,
    destinatario: destinatario || '',
    asunto: asunto || '',
    mensaje: mensaje || '',
    fechaProgramada: fechaProgramada || null,
    fechaEnvio: null,
    estadoEnvio,
    referenciaExterna: referenciaExterna || '',
  })
}

// ============================================================================
// SUGERENCIAS IA (coleccion propia)
// ============================================================================

export async function crearSugerenciaIA({
  reclamoId, tipoSugerencia, textoEntrada, respuestaGenerada,
  estadoRevision = 'Pendiente', aprobadoPor,
}) {
  return await addDoc(refSugerenciasIA(), {
    reclamoId: reclamoId || null,
    tipoSugerencia,
    textoEntrada: textoEntrada || '',
    respuestaGenerada: respuestaGenerada || '',
    fechaGeneracion: serverTimestamp(),
    estadoRevision,
    fechaAprobacion: null,
    aprobadoPor: aprobadoPor || '',
  })
}

// ============================================================================
// OCUPACIONES (vincula propiedades con inquilinos)
// ============================================================================

export async function crearOcupacion({
  propiedadId, inquilinoId, fechaInicio, fechaFin,
}) {
  return await addDoc(refOcupaciones(), {
    propiedadId,
    inquilinoId,
    fechaInicio: fechaInicio || null,
    fechaFin: fechaFin || null,
  })
}

// ============================================================================
// ESCUCHAS EN TIEMPO REAL
// ============================================================================

export function onPropiedades(callback) {
  return onSnapshot(refPropiedades(), callback)
}

export function onInquilinos(callback) {
  return onSnapshot(refInquilinos(), callback)
}

export function onOcupaciones(callback) {
  return onSnapshot(refOcupaciones(), callback)
}

export function onReclamos(callback) {
  return onSnapshot(refReclamos(), callback)
}

export function onProveedores(callback) {
  return onSnapshot(refProveedores(), callback)
}

export function onAsignaciones(callback) {
  return onSnapshot(refAsignaciones(), callback)
}

export function onPresupuestos(callback) {
  return onSnapshot(refPresupuestos(), callback)
}

export function onAutorizaciones(callback) {
  return onSnapshot(refAutorizaciones(), callback)
}

export function onEventosCalendario(callback) {
  return onSnapshot(refEventosCalendario(), callback)
}

export function onNotasPrioritarias(callback) {
  return onSnapshot(refNotasPrioritarias(), callback)
}

export function onNotificaciones(callback) {
  return onSnapshot(refNotificaciones(), callback)
}

export function onSugerenciasIA(callback) {
  return onSnapshot(refSugerenciasIA(), callback)
}

export function onSeguimientosDeReclamo(reclamoId, callback) {
  const q = query(refSeguimientos(reclamoId), orderBy('fechaRegistro', 'desc'))
  return onSnapshot(q, callback)
}

export function onArchivosDeReclamo(reclamoId, callback) {
  const q = query(refArchivos(reclamoId), orderBy('fechaSubida', 'desc'))
  return onSnapshot(q, callback)
}

export function onHistorialDeReclamo(reclamoId, callback) {
  const q = query(refHistorial(reclamoId), orderBy('fechaCambio', 'desc'))
  return onSnapshot(q, callback)
}

// ============================================================================
// ESTADOS (mapeados del DER SQL)
// ============================================================================

export const ESTADOS_RECLAMO = [
  'Recibido',
  'En evaluacion',
  'Esperando presupuesto',
  'Pendiente de autorizacion',
  'Trabajo programado',
  'En ejecucion',
  'Finalizado',
  'Cancelado',
]

export const PRIORIDADES = ['Urgente', 'Importante', 'Puede esperar']

export const ESTADOS_AUTORIZACION = [
  'Pendiente',
  'Aprobado',
  'Rechazado',
  'Aprobado parcialmente',
]

export const ESTADOS_EVENTO = ['Pendiente', 'En proceso', 'Realizada', 'Cancelada']

export const ESTADOS_NOTA = ['Pendiente', 'En proceso', 'Realizada', 'Cancelada']

export const ESTADOS_ENVIO = ['Pendiente', 'Enviado', 'Fallido']

export const ESTADOS_REVISION = ['Pendiente', 'Aprobado', 'Rechazado']
