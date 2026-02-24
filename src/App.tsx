// src/App.tsx
import './App.css'

function App() {
  return (
    <div className="container" style={{ width: '300px', padding: '1rem' }}>
      <h1>Nexus</h1>
      <p>PreSend-Guard is active.</p>
      <button onClick={() => alert('Settings coming soon!')}>
        설정 바로가기
      </button>
    </div>
  )
}

export default App