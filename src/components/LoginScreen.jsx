// LoginScreen: puerta de entrada al panel con Firebase Auth real
// Props:
//   onVolver -> vuelve al formulario de inquilinos
//   onEntrar -> entra al panel (ya autenticado o en modo demostracion)
// Concepto: usa signInWithEmailAndPassword de Firebase Auth.
// Si el login falla, muestra el error y ofrece seguir en modo demostracion.
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export default function LoginScreen({ onVolver, onEntrar }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrar, setMostrar] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    if (!email.trim() || !password) {
      setError('Completa el correo electronico y la contrasena.')
      setCargando(false)
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // El onAuthStateChanged de App.jsx se encargara de redirigir al panel
    } catch (err) {
      let mensaje = 'Error al iniciar sesion.'
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        mensaje = 'Correo electronico o contrasena incorrectos.'
      } else if (err.code === 'auth/user-not-found') {
        mensaje = 'No existe una cuenta con ese correo electronico.'
      } else if (err.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos. Intentalo de nuevo mas tarde.'
      }
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/mezi-logo.png" alt="MEZI Propiedades" />

        <p className="eyebrow">Panel privado</p>
        <h1>Acceso administrativo</h1>
        <p className="login-intro">
          Ingresa con las credenciales de MEZI Propiedades.
        </p>

        <form onSubmit={submit}>
          <label>
            Correo electronico
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Contrasena
            <div className="password-field">
              <input
                type={mostrar ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setMostrar(!mostrar)}>
                {mostrar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          {error && <div className="login-error">{error}</div>}

          <button
            className="primary full"
            type="submit"
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className="auth-pending">
          <b>Modo demostracion</b>
          <p>
            Si aun no tienes cuenta creada, puedes seguir usando el panel en
            modo demostracion. Los cambios se guardan en Firebase pero sin
            autenticacion de usuario.
          </p>
          <button className="secondary full" onClick={onEntrar}>
            Continuar en modo demostracion
          </button>
        </div>

        <button className="back-to-public" onClick={onVolver}>
          ← Volver al formulario de inquilinos
        </button>
      </div>
    </div>
  )
}
