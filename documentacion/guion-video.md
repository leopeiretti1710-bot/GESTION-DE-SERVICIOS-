# Guion de locucion - Video demostrativo

**Proyecto:** Gestion de Reparaciones MEZI
**Duracion del video:** 2 minutos 20 segundos (con voz en off incluida en el archivo final)
**Ritmo sugerido:** unas 130 palabras por minuto, con pausas entre bloques.
Los tiempos corresponden al video final: no los leas, usalos solo para ubicarte.

---

## 0:00 - Introduccion (diapositiva)

Este es Gestion de Reparaciones MEZI: una herramienta para registrar y seguir
cada reclamo, desde el aviso hasta que el trabajo termina.

(Hay una pausa mientras se inicia sesion. Retoma la lectura cuando aparezca
el panel de Reclamos.)

## 0:24 - Panel principal (Reclamos)

En el panel se ven los reclamos recibidos, en proceso y finalizados,
organizados por prioridad.

## 0:36 - Nuevo reclamo

Cargar un caso es simple: propiedad e inquilino se escriben como texto y, si
no existen, se crean automaticamente.

## 0:42 - Ficha del reclamo

Cada reclamo tiene su ficha con datos, descripcion y archivos adjuntos, para
que cualquier persona del equipo pueda retomarlo.

## 0:49 - Gestion interna

Aca se asigna al proveedor y se programa la visita. Todo queda guardado y
pasa al calendario.

## 0:56 - Presupuestos

Despues se carga el presupuesto del trabajo.

## 1:01 - Autorizacion

Y se registra la decision del propietario: aprobado, rechazado o parcial.

## 1:06 - Calendario

El calendario muestra los reclamos activos en su fecha y destaca los urgentes
en la lista de la derecha.

## 1:14 - Proveedores

El modulo de Proveedores reune la red de tecnicos con su especialidad, zona y
contacto. En cada ficha se ven los trabajos vinculados.

## 1:28 - Formulario publico

El inquilino tambien puede cargar su reclamo desde un formulario publico, sin
ingresar al sistema. Puede adjuntar fotos, ver una vista previa antes de
enviar, y las imagenes quedan guardadas comprimidas con el reclamo.

## 1:48 - Diapositiva de cierre

El objetivo es centralizar y dar seguimiento a cada reparacion. El alcance son
tres modulos - Reclamos, Proveedores y Calendario - mas el formulario publico,
con datos en Firebase y acceso con usuario y contrasena.

Los limites: al usar el plan gratuito, los archivos se guardan como base64 en
la base, sin Firebase Storage. No hay avisos automaticos por WhatsApp, porque
requieren una API de pago y un servidor. Y el mensaje con IA es una
demostracion.

Asi, cada reparacion queda registrada, ordenada y con un responsable claro.

---

## Datos tecnicos del video

- Fuente: captura directa de la pagina con CDP (Playwright), no captura de
  escritorio, para que no aparezca ninguna otra ventana.
- Audio: voz en off grabada aparte (PTT de WhatsApp en Opus) y mezclada en el MP4 final.
- Resolucion: 1440 x 900, 25 cuadros por segundo, formato MP4.
- Secuencia: intro, inicio de sesion, Reclamos, nuevo reclamo, detalle,
  gestion interna, presupuestos, autorizacion, calendario, proveedores,
  ficha del proveedor, formulario publico con fotografias y cierre.
