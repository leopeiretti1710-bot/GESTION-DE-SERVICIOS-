import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// OJO: ya NO importamos './index.css' (era el CSS del template de Vite y
// rompia los colores y el ancho). Todos los estilos viven en App.css,
// que se importa desde Layout.jsx.
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
