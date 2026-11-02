// App: controla QUE pantalla se muestra en todo momento
// Vistas: login, publica, app
// Segun el Figma, la app tiene solo 3 pantallas principales:
//   Reclamos, Proveedores y Calendario.
// Las entidades del dbdiagram (propiedades, inquilinos, presupuestos,
// autorizaciones, eventos_calendario, etc.) son SOLO base de datos:
// se guardan en Firestore desde las pantallas del Figma.
import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import Layout from './components/Layout'
import LoginScreen from './components/LoginScreen'
import PublicForm from './components/PublicForm'
import Reclamos from './pages/Reclamos'
import Proveedores from './pages/Proveedores'
import Calendario from './pages/Calendario'

function App() {
  const [vista, setVista] = useState('login')
  const [page, setPage] = useState('Reclamos')
  const [busqueda, setBusqueda] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [authListo, setAuthListo] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user)
      setAuthListo(true)
      if (user) setVista('app')
    })
    return () => unsub()
  }, [])

  if (!authListo) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="eyebrow">MEZI Propiedades</p>
          <h1>Cargando...</h1>
        </div>
      </div>
    )
  }

  if (vista === 'publica') {
    return <PublicForm onVolver={() => setVista('login')} />
  }

  if (vista === 'login') {
    if (usuario) setVista('app')
    return (
      <LoginScreen
        onVolver={() => setVista('publica')}
        onEntrar={() => setVista('app')}
      />
    )
  }

  const cerrarSesion = async () => {
    try { await signOut(auth) } catch (e) { console.error('Error al cerrar sesion:', e) }
    setUsuario(null)
    setVista('login')
  }

  return (
    <Layout
      paginaActual={page}
      onNavegar={setPage}
      busqueda={busqueda}
      onBuscar={setBusqueda}
      onFormularioPublico={() => setVista('publica')}
      onCerrarSesion={cerrarSesion}
      usuario={usuario}
      // esDemo: verdadero solo si entro con el boton de demostracion
      // (sin usuario de Firebase). Con sesion real es falso.
      esDemo={!usuario}
    >
      {page === 'Reclamos' && <Reclamos busqueda={busqueda} />}
      {page === 'Proveedores' && <Proveedores />}
      {page === 'Calendario' && <Calendario />}
    </Layout>
  )
}

export default App
