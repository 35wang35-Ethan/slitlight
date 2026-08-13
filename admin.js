const defaults={heroTitle:'讓影像不再只是被觀看，\n而是真正被「理解」。',heroText:'介於廣告美學與內容行銷之間，我們不只拍攝畫面，\n更透過「觀點企劃」整理您的品牌靈魂，\n讓每一幀影像都有意義。',cta:'預約品牌影像診斷',phone:'02-1234-5678',email:'hello@seamoflight.com',line:'@seamoflight',instagramUrl:'',facebookUrl:'',lineUrl:''};
const data={...defaults,...JSON.parse(localStorage.getItem('slit-content-v2')||'{}')};
const login=document.querySelector('#login');
const dashboard=document.querySelector('#dashboard');
const form=document.querySelector('#cmsForm');
function openDashboard(){login.classList.add('d-none');dashboard.classList.remove('d-none');Object.keys(defaults).forEach(key=>form.elements[key].value=data[key]||'')}
if(sessionStorage.getItem('slit-admin'))openDashboard();
document.querySelector('#loginForm').addEventListener('submit',event=>{event.preventDefault();if(event.currentTarget.user.value==='admin'&&event.currentTarget.pass.value==='seam2026'){sessionStorage.setItem('slit-admin','1');openDashboard()}else alert('帳號或密碼不正確')});
form.addEventListener('submit',event=>{event.preventDefault();Object.keys(defaults).forEach(key=>data[key]=form.elements[key].value);localStorage.setItem('slit-content-v2',JSON.stringify(data));document.querySelector('#saved').classList.remove('d-none')});
document.querySelector('#logout').addEventListener('click',()=>{sessionStorage.removeItem('slit-admin');location.reload()});
