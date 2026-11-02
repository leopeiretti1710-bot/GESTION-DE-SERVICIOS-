// KpiCard: tarjeta resumen (Recibidos / En proceso / Finalizados)
// Props:
//   titulo  -> texto de la tarjeta
//   valor   -> numero a mostrar
//   tone    -> color: 'received' (magenta), 'progress' (amarillo), 'finished' (verde)
//   active  -> si esta seleccionada (true/false)
//   onClick -> que hacer al clickear
export default function KpiCard({ titulo, valor, tone, active, onClick }) {
  // Clase CSS: siempre 'summary-card', mas el tone, mas 'active' si corresponde
  const clase = 'summary-card ' + tone + (active ? ' active' : '')

  return (
    <button className={clase} onClick={onClick}>
      <span>{titulo}</span>
      <b>{valor}</b>
    </button>
  )
}