import './App.css';
import { Sipapu } from 'sipapu'

function App() {

  const signUp = async () => {
    const email = 'test@example.com'
    const password = 'test1234'
    const username = 'test'

    try {
      await window.sipapu.signUp(email, password, username)
    } catch (error: any) {
      const errors = document.getElementById('errors-signup')!
      errors.appendChild(document.createTextNode(error.message))
      alert('Something happened')
      console.log(error)
    }
  }

  const signIn = async () => {
    const email = 'test@example.com'
    const password = 'test1234'

    try {
      await window.sipapu.signIn(email, password)
    } catch (error: any) {
      const errors = document.getElementById('errors-signin')!
      errors.innerHTML = '<p>' + error.message + '</p>'
      console.log(error)
    }
  }

  const logOut = async () => {
    try {
      await window.sipapu.signOut()
    } catch (error: any) {
      alert(error.message)
      console.log(error)
    }
  }

  if (window.sipapu.isLoggedIn()) {
    return <div>
      <h1>You are logged in!</h1>
      <h2>As user: {window.sipapu.client.auth.session()?.user?.id}</h2>
      <button onClick={logOut}>Log out</button>

    </div>
  } else {
    return <div>
      <div style={{ display: 'flex', height: '20vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        Sign in
        <input id="email" type="text" placeholder="email" />
        <input id="password" type="password" placeholder="password" />
        <button onClick={signIn}>Sign in</button>
        <p id="errors-signin"></p>
      </div>
      <div style={{ display: 'flex', height: '20vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        Sign up
        <input id="email" type="text" placeholder="email" />
        <input id="password" type="password" placeholder="password" />
        <button onClick={signUp}>Sign up</button>
        <p id="errors-signup"></p>
      </div>
    </div> 
  }    

}

export default App;
