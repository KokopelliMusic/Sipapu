import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Sipapu } from 'sipapu'
import { Session } from '@supabase/gotrue-js';

window.sipapu = new Sipapu()
const Context = React.createContext<Session | null>(null)

const Index = () => {
  const [session, setSession] = React.useState<Session | null>(null)

  useEffect(() => {
    setSession(window.sipapu.client.auth.session())

    window.sipapu.client.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  return <Context.Provider value={session}>
    <App />
  </Context.Provider>
}

ReactDOM.render(
  <React.StrictMode>
    <Index />
  </React.StrictMode>,
  document.getElementById('root')
)