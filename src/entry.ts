const query = new URLSearchParams(location.search);
const workspace = ['workspace','account','invoice','local','historyBlock'].some(key => query.has(key));
const app = document.querySelector<HTMLElement>('#app')!;
const unavailable = () => { app.innerHTML='<main class="boot-load-failed"><h1>Tillward could not open</h1><p role="alert">Check your connection and try again.</p><button id="reload-tillward">Try again</button><a href="/">Back to Tillward</a></main>'; document.querySelector('#reload-tillward')!.addEventListener('click',()=>location.reload()); };
const timeout=setTimeout(()=>{if(app.querySelector('.boot-loading'))unavailable();},20000);
async function openPage() {
 try {
  // Keep imports in separate branches so each production entry gets its own CSS preloads.
  if (workspace) {
   await import('./main');
  } else {
   await import('./landing');
  }
 } catch {
  unavailable();
 } finally {
  clearTimeout(timeout);
 }
}
void openPage();
export {};
