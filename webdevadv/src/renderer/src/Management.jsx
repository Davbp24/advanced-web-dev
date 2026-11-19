import './assets/app.css';
import React from 'react';

function Management() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

//This is the sign-in page for the scheduler application
  return (
    <>
    
    <div >
        Management
    </div>
    </>
  )
}

export default App
