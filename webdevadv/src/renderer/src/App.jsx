import './assets/app.css';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping');
  const navigate = useNavigate();
//This is the sign-in page for the scheduler application
  return (
    <>
    
    <div id="sign-in-page">

      <div class="title1"> 
        <h1>Scheduler Portal</h1>
      </div>
     
      <div class="inputText"> 
        <input placeholder="username"></input>
        <input placeholder="password"></input>
      </div>
     
      <button id="sign-in-button" onClick={() => {navigate('/management')}}>Sign In</button>

    </div>
    </>
  )
}

export default App
