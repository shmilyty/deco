import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// add GitHub link into the DOM (instead of editing index.html)
const githubLink = document.createElement('a')
githubLink.className = 'github-link'
githubLink.href = 'https://github.com/shmilyty/deco'
githubLink.setAttribute('aria-label', 'View project on GitHub')
githubLink.target = '_blank'
githubLink.rel = 'noopener noreferrer'
githubLink.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.775.42-1.305.763-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 013.003-.403c1.02.005 2.045.138 3.003.403 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.803 5.62-5.475 5.92.43.37.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .32.218.694.825.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z"></path></svg>`

const appRoot = document.getElementById('app')
if (appRoot && appRoot.parentNode) {
  appRoot.parentNode.insertBefore(githubLink, appRoot)
} else {
  document.body.appendChild(githubLink)
}

createApp(App).mount('#app')
