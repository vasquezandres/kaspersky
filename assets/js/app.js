
async function include(selector, url){
  const el=document.querySelector(selector); if(!el) return;
  const res=await fetch(url); el.innerHTML=await res.text();
  if(url.includes('header.html')){ const btn=document.getElementById('hamburger'); const nav=document.getElementById('nav');
    btn?.addEventListener('click',()=>nav.classList.toggle('open')); wireThemeToggle(); }
}
const THEME_KEY="kp-theme";
function setTheme(t){ document.documentElement.setAttribute("data-theme",t); localStorage.setItem(THEME_KEY,t);
  const label=document.querySelector("#theme-toggle span"); if(label) label.textContent=t==="dark"?"Modo claro":"Modo oscuro";}
function initTheme(){ setTheme(localStorage.getItem(THEME_KEY)||"light"); }
export function getActiveSheetName(){ const url=new URL(window.location.href); const q=url.searchParams.get("sheet");
  if(q){ localStorage.setItem("kp-sheet",q); return q;} return localStorage.getItem("kp-sheet")||"kaspersky";}
export function formatPrice(n){ return new Intl.NumberFormat('es-PA',{style:'currency',currency:'USD'}).format(+n||0); }
export function goToQuote(params){ const u=new URL(location.origin+"/cotizar.html"); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v))); location.href=u.toString(); }
function wireThemeToggle(){ document.getElementById('theme-toggle')?.addEventListener('click',()=>{ const t=document.documentElement.getAttribute('data-theme')||'light'; setTheme(t==='light'?'dark':'light');});}
function setYear(){ const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear(); }
function initFab(){ document.getElementById('fab-whatsapp')?.addEventListener('click',()=>{
  window.open('https://wa.me/50768886778?text='+encodeURIComponent('Hola, quiero una cotización de Kaspersky.'),'_blank','noopener');});}
document.addEventListener('DOMContentLoaded', async ()=>{ initTheme(); await include('[data-include=header]','/components/header.html'); await include('[data-include=footer]','/components/footer.html'); setYear(); initFab(); });
export { include, setTheme };

// --- Script para envío del formulario de contacto con redirección ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const graciasURL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8080/gracias.html'
    : '/gracias.html';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch('https://formspree.io/f/xldaeanj', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (res.ok) {
        window.location.href = graciasURL; // ✅ redirige siempre
      } else {
        alert('No pudimos enviar el formulario. Intenta de nuevo o escríbenos por WhatsApp.');
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      alert('Error de red. Intenta nuevamente.');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
