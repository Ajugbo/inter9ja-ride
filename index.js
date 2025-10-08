import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';

function App(){
  const [message, setMessage] = React.useState('Loading...');
  React.useEffect(()=>{
    axios.get((process.env.REACT_APP_API_BASE || 'http://localhost:4000') + '/api/health')
      .then(r=>setMessage(r.data.ok ? 'Backend: OK' : 'Backend: No') )
      .catch(()=>setMessage('Backend unreachable'));
  },[]);
  return (<div style={{padding:24,fontFamily:'Arial'}}>
    <h1>🚖 Inter9ja Ride</h1>
    <p>{message}</p>
    <p>This is a demo frontend — register/login and booking are implemented in backend API.</p>
  </div>);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
