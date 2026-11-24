import './assets/app.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
//This is the sign-in page for the scheduler application
  return (
    <>
    
    <div id="sign-in-page">

      <div className="title1">
        <h1>Scheduler Portal</h1>
      </div>
     
      <div className="inputText">
        <input placeholder="username"></input>
        <input placeholder="password"></input>
      </div>
     
      <button id="sign-in-button" onClick={() => {navigate('/management')}}>Sign In</button>

    </div>
    </>
  )
}

export default App
