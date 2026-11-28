import './assets/app.css';
import React from 'react';

function Error404() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

//This is the sign-in page for the scheduler application
  return (
    <>
    
    <div >
        Error404
    </div>
    </>
  )
}

export default Error404;
