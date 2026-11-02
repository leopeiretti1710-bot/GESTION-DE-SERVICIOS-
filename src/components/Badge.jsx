// Badge: etiqueta de color (estado, prioridad, etc.)
// Props:
//   tone    -> color: 'purple', 'danger', 'warning', 'success', 'blue', 'neutral'
//   children -> texto a mostrar
export default function Badge({ tone, children }) {
  // Si no se pasa tone, usamos 'neutral'
  const clase = 'badge' + (tone ? ' ' + tone : '')
  return <span className={clase}>{children}</span>
}