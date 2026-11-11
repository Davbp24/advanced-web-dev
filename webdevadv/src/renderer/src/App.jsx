

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <p>Hello, World!</p>
    </>
  )
}

export default App
