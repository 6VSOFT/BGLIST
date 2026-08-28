import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import './index.css'

registerSW({ onNeedRefresh() { if (window.confirm('有新版本可用，立即更新吗？')) window.location.reload() } })
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>)
