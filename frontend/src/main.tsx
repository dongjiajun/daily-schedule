import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installAuthInterceptor } from './core/lib/authInterceptor'
import { moduleRegistry } from './core/lib/moduleRegistry'
import { calendarModule } from './modules/calendar'
import { petModule } from './modules/pet'

installAuthInterceptor()

// Feature flag: VITE_USE_MODULE_CALENDAR=false 可回退到旧路由
if (import.meta.env.VITE_USE_MODULE_CALENDAR !== 'false') {
  moduleRegistry.register(calendarModule)
}
moduleRegistry.register(petModule)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
