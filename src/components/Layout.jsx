// Layout: el "marco" de la app (sidebar + header + contenido)
// Segun el Figma, el sidebar tiene SOLO 3 secciones:
//   - Reclamos
//   - Proveedores
//   - Calendario
// Las demas entidades del dbdiagram (propiedades, inquilinos, presupuestos,
// autorizaciones, etc.) son solo BASE DE DATOS: se guardan en Firestore pero
// no tienen pantalla propia.
import { useState } from 'react'
import '../App.css'

const SECCIONES = [
  { id: 'Reclamos', nombre: 'Reclamos' },
  { id: 'Proveedores', nombre: 'Proveedores' },
  { id: 'Calendario', nombre: 'Calendario' },
]

export default function Layout({
  paginaActual,
  onNavegar,
  busqueda,
  onBuscar,
  onFormularioPublico,
  onCerrarSesion,
  usuario,
  esDemo,
  children,
}) {
  const [colapsado, setColapsado] = useState(false)
  const [menuMovil, setMenuMovil] = useState(false)

  function toggleSidebar() {
    if (window.innerWidth <= 760) setMenuMovil(!menuMovil)
    else setColapsado(!colapsado)
  }

  const correo = usuario ? usuario.email : null

  return (
    <div className={'app-shell' + (colapsado ? ' sidebar-collapsed' : '')}>

      {/* ----- SIDEBAR ----- */}
      <aside className={menuMovil ? 'sidebar open' : 'sidebar'}>

        <button
          className="icon-btn sidebar-close"
          aria-label="Cerrar menu"
          onClick={() => setMenuMovil(false)}
        >
          X
        </button>

        <div className="brand">
          <img src="/mezi-logo.png" alt="MEZI Propiedades" />
          <span>Gestion de Reparaciones</span>
        </div>

        <nav>
          {SECCIONES.map((sec) => (
            <button
              key={sec.id}
              className={paginaActual === sec.id ? 'nav active' : 'nav'}
              onClick={() => {
                onNavegar(sec.id)
                setMenuMovil(false)
              }}
            >
              {sec.nombre}
            </button>
          ))}
        </nav>

        {/* Pie del sidebar: cambia segun COMO se entro a la app.
            Sesion real (con Firebase Auth): muestra "Sesion iniciada" y el correo.
            Modo demostracion: muestra el cartel de demo. */}
        <div className="sidebar-foot">
          {esDemo ? (
            <>
              <span className="demo-dot" /> Modo demostracion
              <div>Datos guardados en Firebase</div>
            </>
          ) : (
            <>
              <span className="demo-dot" style={{ background: '#22c55e' }} /> Sesion iniciada
              <div>{correo}</div>
            </>
          )}
        </div>
      </aside>

      {/* Scrim del menu movil */}
      {menuMovil && (
        <div className="scrim" onClick={() => setMenuMovil(false)} />
      )}

      {/* ----- CONTENIDO ----- */}
      <main>
        <header>
          <button
            className="icon-btn sidebar-toggle"
            aria-label="Mostrar u ocultar menu"
            onClick={toggleSidebar}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="search">
            <input
              value={busqueda}
              onChange={(e) => onBuscar(e.target.value)}
              placeholder="Buscar reclamo, propiedad o proveedor..."
            />
          </div>

          <button className="public-link" onClick={onFormularioPublico}>
            Formulario para inquilinos
          </button>

          <button className="logout-link" onClick={onCerrarSesion}>
            Cerrar sesion
          </button>

          <div className="avatar">MP</div>
        </header>

        {/* El cartel de demostracion solo se muestra en modo demo.
            Con sesion real no aparece nada. */}
        {esDemo && (
          <div className="demo-banner">
            <strong>Prototipo demostrativo:</strong> la informacion se guarda en Firebase.
          </div>
        )}

        <section className="content">
          {children}
        </section>
      </main>
    </div>
  )
}
