import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('zoneboard: missing #app element in index.html')
}

app.innerHTML = `
  <main class="placeholder">
    <h1>zoneboard</h1>
    <p>A departure-board world clock. Coming soon.</p>
  </main>
`