const defaults={heroTitle:'讓影像不再只是被觀看，\n而是真正被「理解」。',heroText:'介於廣告美學與內容行銷之間，我們不只拍攝畫面，\n更透過「觀點企劃」整理您的品牌靈魂，\n讓每一幀影像都有意義。',cta:'預約品牌影像診斷',phone:'02-1234-5678',email:'hello@seamoflight.com',line:'@seamoflight'};
const content={...defaults,...JSON.parse(localStorage.getItem('slit-content-v2')||'{}')};
document.querySelectorAll('[data-content]').forEach(el=>{const v=content[el.dataset.content];if(v)el.innerHTML=v.replace(/\n/g,'<br>')});
addEventListener('scroll',()=>document.querySelector('.navbar')?.classList.toggle('scrolled',scrollY>50));
document.querySelectorAll('.faq-button').forEach(btn=>btn.onclick=()=>{const p=btn.nextElementSibling;p.classList.toggle('d-none');btn.lastElementChild.textContent=p.classList.contains('d-none')?'+':'−'});
document.querySelector('#contactForm')?.addEventListener('submit',e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.textContent='已收到您的需求 ✓';btn.disabled=true;e.currentTarget.reset()});
