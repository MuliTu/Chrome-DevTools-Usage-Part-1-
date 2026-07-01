import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// No top-level StrictMode — ReviewsSection mounts its own StrictMode
// so the double-invoke effect is isolated to the reviews island (Scenario 12)
createRoot(document.getElementById('root')).render(<App />)
