import styles from './App.module.css'
import Dashboard from './components/Dashboard/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <div style={{ width: '100%', height: '100%' }}>
        <Dashboard />
      </div>
    </ErrorBoundary>
  )
}
