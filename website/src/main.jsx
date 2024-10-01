import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
