import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/authContext.jsx'

const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

  if (response.status === 403 && !requestUrl.includes('/clientAuth/login')) {
    const payload = await response.clone().json().catch(() => null);
    if (payload?.message?.toLowerCase().includes('subscription has expired')) {
      window.dispatchEvent(new Event('subscription-expired'));
    }
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter> */}
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)