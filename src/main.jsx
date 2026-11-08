import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import WorkspaceRoot from './components/WorkspaceRoot'
import Sandbox from './Sandbox.jsx'

const useSandbox = new URLSearchParams(window.location.search).has('sandbox')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorkspaceRoot>{useSandbox ? <Sandbox /> : <App />}</WorkspaceRoot>
  </StrictMode>,
)
