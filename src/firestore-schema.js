// firestore-schema.js
// ============================================================================
// MODELO DE LA BASE DE DATOS EN FIRESTORE
// Basado 1:1 en el dbdiagram (MEZI Propiedades.sql, 17 tablas).
//
// Firestore es NoSQL: no hay tablas ni claves foraneas. El equivalente es:
//   - Tabla SQL      -> coleccion de Firestore
//   - Fila SQL       -> documento (con ID automatico)
//   - id_xxx int     -> campo xxxId (string) con el ID del documento referido
//
// Las colecciones se CREAN SOLO en Firebase cuando se escribe el primer
// documento. Para crearlas todas ya, correr:  node scripts/inicializar-db.mjs
// ============================================================================

/*
 * ----------------------------------------------------------------------
 * 1. propiedades
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),          // era id_propiedad
 *   direccion: string,                // obligatorio
 *   barrio: string,
 *   piso: string,
 *   unidad: string,
 *   tipoInmueble: string,
 *   propietarioNombre: string,
 *   propietarioTelefono: string,
 *   propietarioEmail: string,
 *   observaciones: string,
 *   activa: boolean,                  // default true
 *   fechaRegistro: timestamp,         // default ahora
 * }
 *
 * RELACIONES: ninguna entrante. Es el punto de partida.
 * La referencian: ocupaciones.propiedadId, reclamos.propiedadId
 */

/*
 * ----------------------------------------------------------------------
 * 2. inquilinos
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),          // era id_inquilino
 *   nombre: string,                   // obligatorio
 *   telefono: string,
 *   email: string,
 *   observaciones: string,
 * }
 *
 * RELACIONES: la referencian ocupaciones.inquilinoId, reclamos.inquilinoId
 */

/*
 * ----------------------------------------------------------------------
 * 3. ocupaciones  (historial de quien vivio/vive cada propiedad)
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   propiedadId: string,              // FK -> propiedades.id
 *   inquilinoId: string,              // FK -> inquilinos.id
 *   fechaInicio: string ('YYYY-MM-DD'),
 *   fechaFin: string ('YYYY-MM-DD'),  // vacio = sigue viviendo ahi
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 4. reclamos  (coleccion central del sistema)
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   codigo: string,                   // unico, ej: 'REC-1730000000000'
 *   propiedadId: string,              // FK -> propiedades.id (obligatorio)
 *   inquilinoId: string,              // FK -> inquilinos.id
 *   fechaIngreso: timestamp,          // default ahora
 *   categoria: string,                // obligatorio
 *   descripcion: string,              // obligatorio
 *   fechaInicioProblema: string,      // era fecha_inicio_problema
 *   riesgoInmediato: boolean,         // default false
 *   prioridad: 'urgente' | 'importante' | 'puede_esperar',
 *   estado: 'recibido' | 'en_evaluacion' | 'esperando_presupuesto'
 *         | 'pendiente_autorizacion' | 'programado' | 'en_ejecucion'
 *         | 'resuelto' | 'cancelado',  // default 'recibido'
 *   origen: string,                   // 'MEZI Propiedades' | 'Inquilino'
 *   responsableMezi: string,
 *   proximaAccion: string,
 *   fechaProximaAccion: timestamp,
 *   fechaResolucion: timestamp,
 *   verificado: boolean,              // default false
 *   descripcionSolucion: string,
 *   costoFinal: number,
 *   responsablePago: string,
 *   observacionesInternas: string,
 *   reclamoAnteriorId: string,        // FK -> reclamos.id (reclamos ligados)
 *
 *   // Campos de lectura rapida (denormalizados, para no hacer 3 lecturas):
 *   propiedadDireccion: string,
 *   inquilinoNombre: string,
 *   telefono: string,
 *   matricula: string,
 *   unidad: string,
 *   proveedorId: string,
 *   proveedorNombre: string,
 *   presupuesto: number,
 *   autorizacion: string,
 *   fechaProgramada: string,
 *   next: string,
 * }
 *
 * SUBCOLECCIONES (equivalen a las tablas relacionadas por id_reclamo):
 *   reclamos/{id}/seguimientos   -> tabla seguimientos
 *   reclamos/{id}/archivos       -> tabla archivos
 *   reclamos/{id}/historial      -> tabla historial_reclamos
 */

/*
 * ----------------------------------------------------------------------
 * 5. proveedores
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   nombre: string,                   // obligatorio
 *   especialidad: string,
 *   telefono: string,
 *   whatsapp: string,
 *   email: string,
 *   zonaTrabajo: string,
 *   observaciones: string,
 *   activo: boolean,                  // default true
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 6. asignaciones_proveedores  (N:M entre reclamos y proveedores)
 * ----------------------------------------------------------------------
 * Un proveedor puede trabajar en varios reclamos y un reclamo puede
 * tener varios proveedores.
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id (obligatorio)
 *   proveedorId: string,              // FK -> proveedores.id (obligatorio)
 *   fechaAsignacion: timestamp,       // default ahora
 *   estadoTrabajo: string,
 *   descripcionTrabajo: string,
 *   fechaVisita: timestamp,
 *   fechaFinalizacion: timestamp,
 *   costoTrabajo: number,
 *   observaciones: string,
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 7. seguimientos  -> SUBCOLECCION reclamos/{id}/seguimientos
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   fechaRegistro: timestamp,         // default ahora
 *   tipoGestion: string,
 *   descripcion: string,              // obligatorio
 *   responsable: string,
 *   proximaAccion: string,
 *   fechaProximaAccion: timestamp,
 *   completado: boolean,              // default false
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 8. presupuestos
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id (obligatorio)
 *   proveedorId: string,              // FK -> proveedores.id
 *   fechaPresupuesto: string ('YYYY-MM-DD'),
 *   descripcion: string,
 *   importe: number,
 *   moneda: string,                   // default 'ARS'
 *   estado: string,
 *   observaciones: string,
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 9. autorizaciones
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id (obligatorio)
 *   presupuestoId: string,            // FK -> presupuestos.id
 *   estado: 'pendiente' | 'aprobado' | 'rechazado' | 'aprobado_parcialmente',
 *   fechaSolicitud: timestamp,
 *   fechaRespuesta: timestamp,
 *   medioContacto: string,
 *   importeAutorizado: number,
 *   observaciones: string,
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 10. eventos_calendario
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id
 *   proveedorId: string,              // FK -> proveedores.id
 *   titulo: string,                   // obligatorio
 *   descripcion: string,
 *   tipoEvento: string,
 *   fechaInicio: timestamp | string,  // obligatorio
 *   fechaFin: timestamp,
 *   prioridad: 'urgente' | 'importante' | 'puede_esperar',
 *   estado: 'pendiente' | 'en_proceso' | 'realizada' | 'cancelada',
 *   responsable: string,
 *   recordatorio: boolean,            // default true
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 11. notas_prioritarias  (lo mas urgente de la pantalla Calendario)
 * ----------------------------------------------------------------------
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id
 *   titulo: string,                   // obligatorio
 *   contenido: string,
 *   prioridad: 'urgente' | 'importante' | 'puede_esperar',  // default importante
 *   fechaCreacion: timestamp,         // default ahora
 *   fechaLimite: timestamp,
 *   estado: 'pendiente' | 'en_proceso' | 'realizada' | 'cancelada',
 *   ordenVisual: number,
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 12. archivos  -> SUBCOLECCION reclamos/{id}/archivos
 * ----------------------------------------------------------------------
 * Se guarda el archivo como base64 dentro de urlArchivo (sin Firebase
 * Storage, plan gratuito). Firestore admite documentos de hasta 1 MB.
 * {
 *   id: string (automatico),
 *   nombreArchivo: string,            // obligatorio
 *   tipoArchivo: string,
 *   urlArchivo: string,               // base64 dataURL (obligatorio)
 *   descripcion: string,
 *   fechaSubida: timestamp,           // default ahora
 *   tamano: number,                   // bytes aproximados, para el control
 * }
 * Nota: el DER tambien permite archivos ligados a presupuestos
 * (presupuestoId) y autorizaciones (autorizacionId). Si se necesitan,
 * se agregan esos campos al documento.
 */

/*
 * ----------------------------------------------------------------------
 * 13. historial_reclamos  -> SUBCOLECCION reclamos/{id}/historial
 * ----------------------------------------------------------------------
 * Auditoria de cambios: nunca se borran movimientos anteriores.
 * {
 *   id: string (automatico),
 *   fechaCambio: timestamp,           // default ahora
 *   accion: string,                   // obligatorio
 *   estadoAnterior: string,
 *   estadoNuevo: string,
 *   descripcion: string,
 *   realizadoPor: string,
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 14. notificaciones
 * ----------------------------------------------------------------------
 * Resumen dos veces por semana y alertas urgentes inmediatas.
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id
 *   tipo: string,                     // obligatorio
 *   canal: string,                    // obligatorio
 *   destinatario: string,
 *   asunto: string,
 *   mensaje: string,
 *   fechaProgramada: timestamp,
 *   fechaEnvio: timestamp,
 *   estadoEnvio: string,              // default 'pendiente'
 *   referenciaExterna: string,
 * }
 */

/*
 * ----------------------------------------------------------------------
 * 15. sugerencias_ia
 * ----------------------------------------------------------------------
 * Las sugerencias requieren revision antes de ejecutar acciones.
 * {
 *   id: string (automatico),
 *   reclamoId: string,                // FK -> reclamos.id
 *   tipoSugerencia: string,
 *   textoEntrada: string,
 *   respuestaGenerada: string,
 *   fechaGeneracion: timestamp,       // default ahora
 *   estadoRevision: string,           // default 'pendiente'
 *   fechaAprobacion: timestamp,
 *   aprobadoPor: string,
 * }
 */

// ============================================================================
// VALORES PERMITIDOS (los CHECK del SQL)
// ============================================================================

export const PRIORIDADES = ['urgente', 'importante', 'puede_esperar']

export const ESTADOS_RECLAMO = [
  'recibido',
  'en_evaluacion',
  'esperando_presupuesto',
  'pendiente_autorizacion',
  'programado',
  'en_ejecucion',
  'resuelto',
  'cancelado',
]

export const ESTADOS_AUTORIZACION = [
  'pendiente',
  'aprobado',
  'rechazado',
  'aprobado_parcialmente',
]

export const ESTADOS_EVENTO = ['pendiente', 'en_proceso', 'realizada', 'cancelada']

export const ESTADOS_ENVIO = ['pendiente', 'enviado', 'fallido']

// ============================================================================
// MAPA DE RELACIONES (las flechas del dbdiagram)
// ============================================================================
// propiedades  <--- ocupaciones ---> inquilinos
// propiedades  <--- reclamos ---> inquilinos
// reclamos     <--- reclamos (reclamoAnteriorId, reclamos ligados)
// reclamos     <--- asignaciones_proveedores ---> proveedores
// reclamos     <--- seguimientos
// reclamos     <--- presupuestos ---> proveedores
// reclamos     <--- autorizaciones ---> presupuestos
// reclamos     <--- eventos_calendario ---> proveedores
// reclamos     <--- notas_prioritarias
// reclamos     <--- archivos (tambien presupuestos y autorizaciones)
// reclamos     <--- historial_reclamos
// reclamos     <--- notificaciones
// reclamos     <--- sugerencias_ia
