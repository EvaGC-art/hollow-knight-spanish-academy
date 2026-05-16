// ═══════════════════════════════ STATE ═══════════════════════════════
const DB='hallownest_v4';
let ANIM=true;
let S={
  xp:0,streak:0,soul:0,masks:5,maxMasks:5,
  qset:[],qi:0,qscore:0,qAnswered:false,qSel:null,qShield:false,qNoFail:0,
  sintMode:'morfo',sintSel:null,sintTags:{},sintClassSel:{},
  currentUser:null,users:{},
  owned:[],equipped:null,equippedBadge:null,
  bossQi:0,bossScore:0,bossMasks:3,currentBoss:null
};
function loadDB(){try{const d=localStorage.getItem(DB);if(d)S.users=JSON.parse(d)}catch(e){}}
function saveDB(){try{localStorage.setItem(DB,JSON.stringify(S.users))}catch(e){}}
function saveUser(){
  if(!S.currentUser)return;
  S.users[S.currentUser]={
    pwd:S.users[S.currentUser].pwd,
    hint:S.users[S.currentUser].hint||'',
    xp:S.xp,streak:S.streak,soul:S.soul,masks:S.masks,
    owned:S.owned,equipped:S.equipped,equippedBadge:S.equippedBadge,
    seenWelcome:S.users[S.currentUser].seenWelcome||false
  };
  saveDB();
}
function loadUser(u){
  const d=S.users[u]||{};
  S.xp=d.xp||0;S.streak=d.streak||0;S.soul=d.soul||0;S.masks=d.masks||5;
  S.owned=d.owned||[];S.equipped=d.equipped||null;S.equippedBadge=d.equippedBadge||null;
}

// ═══════════════════════════════ RANKS ═══════════════════════════════
const RANKS=[
  {min:0,   name:'Larva',          color:'#7A7A9A',title:'del Vacío'},
  {min:40,  name:'Hueco',          color:'#90A0B0',title:'sin Nombre'},
  {min:100, name:'Escarabajo',     color:'#60CCB8',title:'Explorador'},
  {min:200, name:'Guerrero',       color:'#4DA864',title:'del Reino'},
  {min:350, name:'Cazador',        color:'#C9A84C',title:'de Sombras'},
  {min:550, name:'Portador',       color:'#E09050',title:'de Almas'},
  {min:800, name:'Caballero',      color:'#9B7FD4',title:'Bendecido'},
  {min:1100,name:'Caballero Pálido',color:'#76D7EA',title:'del Alma'},
  {min:1500,name:'Señor del Vacío',color:'#E2CA70',title:'Legendario'},
  {min:2200,name:'Mente Pura',     color:'#FFFFFF', title:'Inmortal'},
];
function getRank(){let r=RANKS[0];for(const rk of RANKS)if(S.xp>=rk.min)r=rk;return r}
function getNextRank(){for(let i=0;i<RANKS.length-1;i++)if(S.xp<RANKS[i+1].min)return RANKS[i+1];return RANKS[RANKS.length-1]}
function checkRankUp(oldXp){
  const ni=RANKS.findIndex(r=>S.xp>=r.min);const oi=RANKS.findIndex(r=>oldXp>=r.min);
  if(ni>oi)return`⬡ ¡Nuevo rango: ${RANKS[ni].name} — ${RANKS[ni].title}!`;
  return'';
}

// ═══════════════════════════════ SHOP DATA ═══════════════════════════════
const AMULETOS=[
  {id:'fragil',emoji:'🦋',name:'Quimera Frágil',desc:'Frágil pero eficaz',effect:'+25% Geo por respuesta (se rompe al fallar)',price:60,bonus:{type:'geo_mult',val:1.25,breaks:true}},
  {id:'racha',emoji:'🔥',name:'Amuleto de la Racha',desc:'El poder crece con la racha',effect:'×1.5 Geo cada 3 aciertos seguidos',price:80,bonus:{type:'streak_mult',val:1.5}},
  {id:'alma',emoji:'💙',name:'Corazón de Alma',desc:'Acelera el flujo del alma',effect:'El Alma se carga un 40% más rápido',price:90,bonus:{type:'soul_boost',val:1.4}},
  {id:'maestro',emoji:'📖',name:'Marca del Maestro',desc:'La sabiduría guía tu mano',effect:'Elimina una opción incorrecta en el Coliseo',price:100,bonus:{type:'hint'}},
  {id:'corteza',emoji:'🛡️',name:'Corazón de Corteza',desc:'Tu corazón late con más fuerza',effect:'Recupera 1 máscara cada 5 aciertos seguidos',price:140,bonus:{type:'mask_regen',every:5}},
  {id:'sombra',emoji:'🌑',name:'Abrazo de Sombra',desc:'La oscuridad te protege',effect:'Anula el primer fallo de la sesión',price:180,bonus:{type:'shield'}},
  {id:'venganza',emoji:'⚡',name:'Amuleto de Venganza',desc:'La derrota te hace más fuerte',effect:'+5 Geo extra al recuperar una racha rota',price:220,bonus:{type:'revenge',val:5}},
];
const APARIENCIAS=[
  {id:'skin_default',emoji:'⚫',name:'El Hueco',desc:'Apariencia original',price:0},
  {id:'skin_gold',emoji:'🌟',name:'Capa Dorada',desc:'Teñida con brillo de Geo',price:160},
  {id:'skin_soul',emoji:'💠',name:'Espectro de Alma',desc:'Aura azul, ojos brillantes',price:200},
  {id:'skin_nightmare',emoji:'🌀',name:'Modo Pesadilla',desc:'Aura roja oscura, ojos rojos',price:320},
  {id:'skin_pure',emoji:'✨',name:'Mente Pura',desc:'Brillo blanco puro',price:480},
];
const TITULOS=[
  {id:'tit_explorer',emoji:'🗺️',name:'El Explorador',price:35},
  {id:'tit_shadow',emoji:'🌑',name:'Cazador de Sombras',price:90},
  {id:'tit_guardian',emoji:'🛡️',name:'Guardián del Reino',price:150},
  {id:'tit_alquimista',emoji:'⚗️',name:'El Alquimista',price:240},
  {id:'tit_legend',emoji:'👑',name:'Leyenda de Hallownest',price:450},
];
// Boss rewards — added to owned[] when beaten
const BOSS_REWARDS=[
  {id:'boss_mantis',emoji:'🏅',name:'Insignia de Mantis',desc:'Jefe 1 derrotado'},
  {id:'boss_collector',emoji:'💀',name:'Máscara del Coleccionista',desc:'Jefe 2 derrotado'},
  {id:'boss_radiance',emoji:'👑',name:'Corona de Radiance',desc:'Jefe 3 derrotado — Maestría'},
];
function isOwned(id){return S.owned.includes(id)}
function getEquippedAmu(){return AMULETOS.find(a=>a.id===S.equipped)||null}
function getGeoMult(){
  const a=getEquippedAmu();if(!a)return 1;
  if(a.bonus.type==='geo_mult')return a.bonus.val;
  if(a.bonus.type==='streak_mult'&&S.streak>0&&S.streak%3===0)return a.bonus.val;
  return 1;
}
function getSoulMult(){const a=getEquippedAmu();return(a&&a.bonus.type==='soul_boost')?a.bonus.val:1}

// ═══════════════════════════════ AVATAR SVG ═══════════════════════════════
function buildAvatar(size=88){
  const xp=S.xp;
  const skin=isOwned('skin_nightmare')?'nightmare':isOwned('skin_pure')?'pure':isOwned('skin_soul')?'soul':isOwned('skin_gold')?'gold':'default';
  const eyeCol=skin==='nightmare'?'#FF4040':skin==='soul'?'#9EEAF7':skin==='pure'?'#FFFFFF':'#76D7EA';
  const cloakCol=skin==='nightmare'?'#1A0A0A':skin==='gold'?'#1A1400':skin==='soul'?'#081820':'#0C0C1E';
  const auraCol=skin==='nightmare'?'rgba(176,50,50,.4)':skin==='soul'?'rgba(118,215,234,.35)':skin==='pure'?'rgba(255,255,255,.35)':'rgba(201,168,76,.15)';
  const hasCape=xp>=100,hasWeapon=xp>=200,hasShadow=xp>=350,hasHornGlow=xp>=550,hasAura=xp>=800;
  const w=size,h=Math.round(size*1.4);
  return`<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" style="width:${w}px;height:${h}px">
<defs>
  <radialGradient id="eg"><stop offset="0%" stop-color="${eyeCol}" stop-opacity=".55"/><stop offset="100%" stop-color="${eyeCol}" stop-opacity="0"/></radialGradient>
  ${hasAura?`<radialGradient id="aura"><stop offset="0%" stop-color="${eyeCol}" stop-opacity=".25"/><stop offset="100%" stop-color="${eyeCol}" stop-opacity="0"/></radialGradient>`:''}
  <filter id="gl"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
${hasShadow?`<ellipse cx="50" cy="137" rx="24" ry="5" fill="rgba(0,0,0,0.55)"/>`:''}
${hasAura?`<ellipse cx="50" cy="90" rx="38" ry="50" fill="url(#aura)" opacity=".5"/>`:''}
${hasCape?`<path d="M27,72 Q18,88 16,118 Q30,130 50,130 Q70,130 84,118 Q82,88 73,72Z" fill="${cloakCol}"/>
<path d="M33,74 Q26,90 25,115 Q35,124 50,126 Q50,120 50,105 Q42,96 33,74Z" fill="#060610" opacity=".6"/>
<ellipse cx="50" cy="74" rx="24" ry="7" fill="${cloakCol}"/>`:`<path d="M34,72 Q28,95 30,120 Q38,128 50,128 Q62,128 70,120 Q72,95 66,72Z" fill="#0C0C1E" opacity=".4"/>`}
<circle cx="50" cy="46" r="26" fill="#0C0C1E"/>
<path d="M30,28 Q24,6 32,2 Q36,16 38,26Z" fill="#0C0C1E" stroke="#14143A" stroke-width="1"/>
<path d="M70,28 Q76,6 68,2 Q64,16 62,26Z" fill="#0C0C1E" stroke="#14143A" stroke-width="1"/>
${hasHornGlow?`<circle cx="32" cy="3" r="3" fill="${eyeCol}" opacity=".5" filter="url(#gl)"/><circle cx="68" cy="3" r="3" fill="${eyeCol}" opacity=".5" filter="url(#gl)"/>`:''}
<circle cx="38" cy="45" r="12" fill="url(#eg)"/>
<circle cx="62" cy="45" r="12" fill="url(#eg)"/>
${xp>=40?`<ellipse cx="38" cy="45" rx="8" ry="8" fill="#F4F4FF"/><ellipse cx="38" cy="45" rx="5.5" ry="5.5" fill="${eyeCol}"/><circle cx="39.8" cy="43.2" r="2.2" fill="#C8F5FF" opacity=".9"/>
<ellipse cx="62" cy="45" rx="8" ry="8" fill="#F4F4FF"/><ellipse cx="62" cy="45" rx="5.5" ry="5.5" fill="${eyeCol}"/><circle cx="63.8" cy="43.2" r="2.2" fill="#C8F5FF" opacity=".9"/>`:`<ellipse cx="38" cy="45" rx="5" ry="5" fill="#1A1A3A"/><ellipse cx="62" cy="45" rx="5" ry="5" fill="#1A1A3A"/>`}
${hasWeapon?`<g transform="rotate(18,72,88)"><rect x="70" y="60" width="4.5" height="50" rx="2.2" fill="${skin==='gold'?'#E2CA70':'#C9A84C'}"/><rect x="63" y="80" width="18" height="4" rx="2" fill="#A08030"/><rect x="71" y="84" width="4" height="18" rx="1.5" fill="#7A5520"/><path d="M70,60 L72.25,50 L74.5,60Z" fill="#E2CA70"/></g>`:''}
</svg>`;
}

// ═══════════════════════════════ UTILS ═══════════════════════════════
function navTo(id){document.querySelectorAll('.nbtn').forEach(b=>b.classList.toggle('active',b.id===id));hideFP()}
function hideFP(){const fp=document.getElementById('fpanel');if(fp)fp.style.display='none'}
function mkMasks(){let h='';for(let i=0;i<5;i++)h+=`<span style="color:${i<S.masks?'#D8D8F0':'#1E1E36'};text-shadow:${i<S.masks?'0 0 6px rgba(200,200,240,.5)':'none'}">◆</span>`;return h}
function addXp(base){
  const mult=getGeoMult();const got=Math.round(base*mult);
  S.xp+=got;return got;
}
function addSoul(base){
  const mult=getSoulMult();S.soul=Math.min(100,S.soul+Math.round(base*mult));
}
function updHdr(){
  const rank=getRank();const next=getNextRank();
  document.getElementById('xpDisp').textContent=S.xp;
  document.getElementById('maskDisp').textContent=S.masks;
  document.getElementById('ebar').style.width=Math.min(100,S.soul)+'%';
  document.getElementById('ebarPct').textContent=Math.round(S.soul)+'%';
  document.getElementById('hdrRank').textContent=rank.name+' · '+rank.title;
  const ew=document.getElementById('ebarWrap');
  if(S.soul>=100){ew.classList.add('full');ew.title='¡Alma llena! Toca para fundir ⚗️'}
  else{ew.classList.remove('full');ew.title='El alma se llena al responder correctamente'}
  // Badge: equippedBadge or rank
  const allLogros=[...BOSS_REWARDS,...AMULETOS.filter(a=>isOwned(a.id))];
  const badge=S.equippedBadge?allLogros.find(l=>l.id===S.equippedBadge):null;
  document.getElementById('hdrBadge').textContent=badge?badge.emoji:rank.name.charAt(0)+'⬡';
}
function toast(msg,dur=2200){
  const t=document.getElementById('toastEl');
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',dur);
}
function showModal(title,opts,cancelCb){
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML=`<div class="modal-box">
    <div class="modal-title">${title}</div>
    ${opts.map((o,i)=>`<div class="modal-opt" id="mopt${i}">
      <div class="modal-opt-icon">${o.icon}</div>
      <div><div class="modal-opt-text">${o.text}</div><div class="modal-opt-desc">${o.desc}</div></div>
    </div>`).join('')}
    <button onclick="this.closest('.modal-overlay').remove();${cancelCb||''}" style="width:100%;margin-top:10px;padding:8px;background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:var(--r);font-family:var(--title);font-size:8px;font-weight:700;cursor:pointer;letter-spacing:1px;text-transform:uppercase">Cancelar</button>
  </div>`;
  opts.forEach((o,i)=>{ov.querySelector('#mopt'+i).onclick=()=>{ov.remove();o.action()}});
  document.body.appendChild(ov);
}

// ═══════════════════════════════ SOUL FUSE ═══════════════════════════════
function tryFuseSoul(){
  if(S.soul<100){toast('El alma no está llena ⚗️');return}
  const amu=getEquippedAmu();
  const opts=[
    {icon:'⬡',text:'+40 Geo del Alma',desc:'Convierte el alma acumulada en puro Geo',
     action:()=>{const g=addXp(40);S.soul=0;updHdr();saveUser();toast(`+${g} Geo del Alma fundida ⬡`)}},
    {icon:'◆',text:'Recuperar 1 Máscara',desc:'Restaura una máscara perdida en batalla',
     action:()=>{if(S.masks<S.maxMasks){S.masks++;}else{toast('Máscaras al máximo ◆');}S.soul=0;updHdr();saveUser();toast('Máscara recuperada ◆')}},
    {icon:'🛡️',text:'Escudo de Alma',desc:'Protege del próximo fallo en el Coliseo',
     action:()=>{S.qShield=true;S.soul=0;updHdr();saveUser();toast('Escudo de Alma activado 🛡️')}},
  ];
  if(amu&&amu.bonus.type==='soul_boost'){
    opts.push({icon:amu.emoji,text:`Potenciar ${amu.name}`,desc:'Doble efecto de tu amuleto equipado esta sesión',
     action:()=>{S._soulBoostActive=true;S.soul=0;updHdr();saveUser();toast(`${amu.emoji} ${amu.name} potenciado ✦`)}});
  }
  showModal('⚗️ Alma Fundida — Elige tu Recompensa',opts);
}

// ═══════════════════════════════ AUTH ═══════════════════════════════
function hashPwd(p){let h=0;for(let i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0}return h.toString(36)}
function showLogin(tab='login'){
  document.getElementById('mainHdr').style.display='none';
  document.getElementById('mainNav').style.display='none';
  document.getElementById('content').innerHTML=`
  <div class="login-wrap anim-fadeup">
    <div style="animation:float 3.5s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(118,215,234,.3))">${buildAvatar(90)}</div>
    <div class="login-title">Hallownest</div>
    <p style="font-size:14px;color:var(--muted);text-align:center;font-style:italic">Gramática · 2º ESO</p>
    <div class="login-box">
      <div class="login-tabs">
        <button class="login-tab${tab==='login'?' active':''}" onclick="swTab('login')">Entrar</button>
        <button class="login-tab${tab==='reg'?' active':''}" onclick="swTab('reg')">Crear cuenta</button>
        <button class="login-tab${tab==='rec'?' active':''}" onclick="swTab('rec')">Recuperar</button>
      </div>
      <div id="tf-login" style="display:${tab==='login'?'flex':'none'};flex-direction:column;gap:9px">
        <input class="finput" id="lu" placeholder="Usuario" autocapitalize="none"/>
        <input class="finput" id="lp" type="password" placeholder="Contraseña"/>
        <button class="gbtn" onclick="doLogin()">Entrar al Reino ▸</button>
      </div>
      <div id="tf-reg" style="display:${tab==='reg'?'flex':'none'};flex-direction:column;gap:9px">
        <input class="finput" id="ru" placeholder="Usuario (mín 3 caracteres)" autocapitalize="none"/>
        <input class="finput" id="rp" type="password" placeholder="Contraseña (mín 4 caracteres)"/>
        <input class="finput" id="rp2" type="password" placeholder="Repite contraseña"/>
        <input class="finput" id="rh" placeholder="Palabra clave de recuperación" autocapitalize="none"/>
        <button class="gbtn" onclick="doRegister()">Crear Personaje ▸</button>
      </div>
      <div id="tf-rec" style="display:${tab==='rec'?'flex':'none'};flex-direction:column;gap:9px">
        <input class="finput" id="rcu" placeholder="Tu usuario" autocapitalize="none"/>
        <input class="finput" id="rch" placeholder="Palabra clave secreta" autocapitalize="none"/>
        <input class="finput" id="rcn" type="password" placeholder="Nueva contraseña"/>
        <button class="gbtn" onclick="doRecover()">Recuperar acceso ▸</button>
      </div>
      <div id="authMsg" class="auth-msg"></div>
    </div>
    <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;color:var(--muted)">
      <input type="checkbox" id="animTog" ${ANIM?'checked':''} onchange="ANIM=this.checked;document.body.classList.toggle('no-anim',!ANIM)" style="accent-color:var(--gold)">Animaciones
    </label>
  </div>`;
}
function swTab(t){
  ['login','reg','rec'].forEach((x,i)=>{
    document.querySelector(`.login-tab:nth-child(${i+1})`).classList.toggle('active',x===t);
    document.getElementById('tf-'+x).style.display=x===t?'flex':'none';
  });
  document.getElementById('authMsg').textContent='';
}
function authMsg(txt,ok){const el=document.getElementById('authMsg');el.textContent=txt;el.className='auth-msg '+(ok?'auth-ok':'auth-err')}
function doLogin(){
  const u=(document.getElementById('lu').value||'').trim().toLowerCase();
  const p=document.getElementById('lp').value;
  if(!u||!p){authMsg('Rellena todos los campos');return}
  if(!S.users[u]){authMsg('Usuario no encontrado');return}
  if(S.users[u].pwd!==hashPwd(p)){authMsg('Contraseña incorrecta');return}
  S.currentUser=u;loadUser(u);enterApp();
}
function doRegister(){
  const u=(document.getElementById('ru').value||'').trim().toLowerCase();
  const p=document.getElementById('rp').value;
  const p2=document.getElementById('rp2').value;
  const h=(document.getElementById('rh').value||'').trim().toLowerCase();
  if(!u||!p||!p2||!h){authMsg('Rellena todos los campos');return}
  if(u.length<3){authMsg('Usuario mínimo 3 caracteres');return}
  if(p.length<4){authMsg('Contraseña mínimo 4 caracteres');return}
  if(p!==p2){authMsg('Las contraseñas no coinciden');return}
  if(S.users[u]){authMsg('Ese usuario ya existe');return}
  S.users[u]={pwd:hashPwd(p),hint:hashPwd(h),xp:0,streak:0,soul:0,masks:5,owned:[],equipped:null,equippedBadge:null,seenWelcome:false};
  saveDB();S.currentUser=u;loadUser(u);authMsg('¡Personaje creado!',true);setTimeout(enterApp,700);
}
function doRecover(){
  const u=(document.getElementById('rcu').value||'').trim().toLowerCase();
  const h=(document.getElementById('rch').value||'').trim().toLowerCase();
  const np=document.getElementById('rcn').value;
  if(!u||!h||!np){authMsg('Rellena todos los campos');return}
  if(!S.users[u]){authMsg('Usuario no encontrado');return}
  if(S.users[u].hint!==hashPwd(h)){authMsg('Palabra clave incorrecta');return}
  if(np.length<4){authMsg('Contraseña mínimo 4 caracteres');return}
  S.users[u].pwd=hashPwd(np);saveDB();authMsg('¡Contraseña actualizada!',true);setTimeout(()=>swTab('login'),1000);
}
function enterApp(){
  window.addEventListener('beforeunload',saveUser);
  document.getElementById('mainHdr').style.display='block';
  document.getElementById('mainNav').style.display='flex';
  updHdr();
  const seen=S.users[S.currentUser]?.seenWelcome;
  if(!seen){showWelcome();}else{showHome();}
}
function logout(){saveUser();S.currentUser=null;showLogin()}

// ═══════════════════════════════ WELCOME ═══════════════════════════════
function showWelcome(){
  // Mostramos el header y el menú inferior también en la bienvenida
  // para que el alumno pueda acceder a cualquier sección sin tener que
  // hacer scroll ni esperar a pulsar "Comenzar".
  document.getElementById('mainHdr').style.display='block';
  document.getElementById('mainNav').style.display='flex';
  updHdr();
  document.getElementById('content').innerHTML=`
  <div class="welcome-wrap anim-fadeup">
    <div style="animation:float 3.5s ease-in-out infinite;filter:drop-shadow(0 0 20px rgba(118,215,234,.3))">${buildAvatar(86)}</div>
    <div class="welcome-title">Bienvenido a<br>Hallownest</div>
    <p class="welcome-text">Este reino es tu guía para dominar la <strong style="color:var(--gold)">gramática española</strong>. Aprende a clasificar oraciones, identificar complementos y analizar sintaxis.</p>
    <p class="welcome-text" style="font-size:13px;color:var(--soul-d);margin-top:2px">Toca cualquier paso para empezar:</p>
    <div class="welcome-flow">
      <button type="button" class="wf-step" data-welcome-target="gram" onclick="return goWelcomeTap(event,'gram')" ontouchend="return goWelcomeTap(event,'gram')" aria-label="Ir a Archivos"><span class="wf-icon">📜</span><span class="wf-lbl">Archivos</span></button>
      <span class="wf-arrow" aria-hidden="true">→</span>
      <button type="button" class="wf-step" data-welcome-target="trucos" onclick="return goWelcomeTap(event,'trucos')" ontouchend="return goWelcomeTap(event,'trucos')" aria-label="Ir a Reliquias"><span class="wf-icon">✦</span><span class="wf-lbl">Reliquias</span></button>
      <span class="wf-arrow" aria-hidden="true">→</span>
      <button type="button" class="wf-step" data-welcome-target="test" onclick="return goWelcomeTap(event,'test')" ontouchend="return goWelcomeTap(event,'test')" aria-label="Ir al Coliseo"><span class="wf-icon">⚔️</span><span class="wf-lbl">Coliseo</span></button>
      <span class="wf-arrow" aria-hidden="true">→</span>
      <button type="button" class="wf-step" data-welcome-target="alq" onclick="return goWelcomeTap(event,'alq')" ontouchend="return goWelcomeTap(event,'alq')" aria-label="Ir al Alquimista"><span class="wf-icon">⚗️</span><span class="wf-lbl">Alquimista</span></button>
      <span class="wf-arrow" aria-hidden="true">→</span>
      <button type="button" class="wf-step" data-welcome-target="boss" onclick="return goWelcomeTap(event,'boss')" ontouchend="return goWelcomeTap(event,'boss')" aria-label="Ir a Jefes"><span class="wf-icon">💀</span><span class="wf-lbl">Jefes</span></button>
    </div>
    <button class="gbtn" onclick="markWelcomeSeen()" style="max-width:280px">Comenzar la Aventura ▸</button>
  </div>`;
}
function markWelcomeSeen(){
  if(S.currentUser&&S.users[S.currentUser])S.users[S.currentUser].seenWelcome=true;
  saveDB();showHome();
}
function goWelcomeTap(ev,sec){
  if(ev){ev.preventDefault();ev.stopPropagation();}
  goWelcome(sec);
  return false;
}
function goWelcome(sec){
  if(S.currentUser&&S.users[S.currentUser])S.users[S.currentUser].seenWelcome=true;
  saveDB();
  if(sec==='gram')showGram();
  else if(sec==='trucos')showTrucos();
  else if(sec==='test')showTest();
  else if(sec==='alq')showAlquimista();
  else if(sec==='boss'){
    if(S.xp>=50)showBossMenu();
    else{toast('Necesitas 50 Geo para los Jefes ⬡');showHome();}
  }
  else showHome();
}

// ═══════════════════════════════ HOME ═══════════════════════════════
function showHome(){
  navTo('n0');
  const rank=getRank();const next=getNextRank();
  const pct=next.min>rank.min?Math.min(100,Math.round(((S.xp-rank.min)/(next.min-rank.min))*100)):100;
  const amu=getEquippedAmu();
  const badge=S.equippedBadge?[...BOSS_REWARDS,...AMULETOS].find(l=>l.id===S.equippedBadge):null;
  // Boss unlock thresholds
  const bossUnlock=[50,150,300];
  document.getElementById('content').innerHTML=`
  <div class="home anim-fadeup">
    <div class="avatar-panel">
      <div class="avatar-row">
        <div style="flex-shrink:0" class="${ANIM?'anim-float':''}">${buildAvatar(75)}</div>
        <div class="av-info">
          <div class="av-name">⬡ ${S.currentUser}</div>
          <div class="av-rank" style="color:${rank.color}">${rank.name}</div>
          <div class="av-title">${rank.title}${badge?' · '+badge.emoji+' '+badge.name:''}</div>
          <div class="rank-bar"><div class="rank-fill" style="width:${pct}%;background:linear-gradient(90deg,${rank.color}88,${rank.color})"></div></div>
          <div class="av-next">→ ${next.name} en ${Math.max(0,next.min-S.xp)} Geo</div>
          ${amu?`<div style="font-size:11px;color:var(--soul);margin-top:4px">${amu.emoji} ${amu.name} equipado</div>`:''}
        </div>
      </div>
    </div>
    <div class="hcards">
      <div class="hcard" onclick="showGram()"><span class="ci">📜</span><span class="cl">Archivos</span><span class="cd">Teoría completa</span></div>
      <div class="hcard" onclick="showTrucos()"><span class="ci">✦</span><span class="cl">Reliquias</span><span class="cd">Patrones clave</span></div>
      <div class="hcard" onclick="showTest()"><span class="ci">⚔️</span><span class="cl">Coliseo</span><span class="cd">Practica y gana Geo</span></div>
      <div class="hcard" onclick="showAlquimista()"><span class="ci">⚗️</span><span class="cl">Alquimista</span><span class="cd">Analiza oraciones</span></div>
      <div class="hcard${S.xp<bossUnlock[0]?' locked':''}" onclick="${S.xp>=bossUnlock[0]?'showBossMenu()':'toast(\'Necesitas '+bossUnlock[0]+' Geo para desbloquear los Jefes ⬡\')'}">
        <span class="ci">💀</span><span class="cl">Jefes</span><span class="cd">Batalla final</span>
        ${S.xp<bossUnlock[0]?`<span class="lock-badge">🔒 ${bossUnlock[0]} Geo</span>`:''}
      </div>
      <div class="hcard" onclick="showShop()"><span class="ci">🛍️</span><span class="cl">Iselda</span><span class="cd">Tienda y logros</span></div>
    </div>
    <button onclick="logout()" style="background:none;border:1px solid var(--border);color:var(--muted);padding:6px 14px;border-radius:var(--r);font-family:var(--title);font-size:8px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer">Salir del Reino</button>
  </div>`;
}
// ═══════════════════ TRUCOS DATA ═══════════════════
const TRUCOS=[
{title:'Pasiva Perifrástica vs Refleja',icon:'🔄',color:'#9B7FD4',tips:[
  {trig:'Si ves <strong>SER + PARTICIPIO</strong> →',res:'PASIVA PERIFRÁSTICA',detail:'Sujeto paciente + fue/es/será + participio. El agente va con POR.'},
  {trig:'Si ves <strong>SE + VERBO</strong> que concuerda con un sustantivo →',res:'PASIVA REFLEJA',detail:'"Se venden pisos" → pisos es el sujeto (verbo en plural).'},
  {trig:'CLAVE: en la refleja HAY sujeto gramatical →',res:'en la perifrástica HAY complemento agente (por…)',detail:'"Se vende el piso" (refleja) ≠ "El piso fue vendido por Ana" (perifrástica)'}
],ex:'"El caso fue resuelto por la policía" (perifrástica) | "Se resolvió el caso" (refleja)'},
{title:'Copulativas vs Predicativas',icon:'⚖️',color:'#76D7EA',tips:[
  {trig:'Si el verbo es <strong>SER, ESTAR o PARECER</strong> →',res:'COPULATIVA (predicado nominal)',detail:'Solo estos 3 son copulativos en español. El atributo describe al sujeto.'},
  {trig:'TRUCO del LO: sustituye el atributo por <strong>LO</strong> invariable →',res:'si funciona → es ATRIBUTO → COPULATIVA',detail:'"María está cansada" → "María LO está" ✓ → copulativa'},
  {trig:'Si el verbo no es ninguno de esos tres →',res:'PREDICATIVA (predicado verbal)',detail:'Puede tener CD, CI, CC… pero no atributo.'}
],ex:'"El equipo está contento" → LO está ✓ (copulativa) | "El equipo ganó" (predicativa)'},
{title:'Actitud del Hablante',icon:'💬',color:'#C9A84C',tips:[
  {trig:'<strong>OJALÁ</strong> / "Que + subjuntivo" →',res:'DESIDERATIVA (expresa deseo)',detail:'"Ojalá llueva" / "Que te mejores"'},
  {trig:'<strong>QUIZÁS / TAL VEZ / A LO MEJOR</strong> →',res:'DUBITATIVA (expresa duda)',detail:'"Quizás mañana nieve" / "A lo mejor viene"'},
  {trig:'Orden o ruego con verbo en imperativo →',res:'IMPERATIVA / EXHORTATIVA',detail:'"¡Cállate!" / "Por favor, siéntate"'},
  {trig:'Emoción con ¡! + QUÉ / CUÁNTO / CÓMO →',res:'EXCLAMATIVA',detail:'"¡Qué bonita la ciudad!" / "¡Cuánto has crecido!"'},
  {trig:'Pregunta directa con ¿? →',res:'INTERROGATIVA DIRECTA',detail:'"¿Dónde vas?" — lleva signos de interrogación'},
  {trig:'Pregunta sin signos, dentro de otra frase →',res:'INTERROGATIVA INDIRECTA',detail:'"Preguntó dónde iba" — sin signos de interrogación'}
],ex:'"Ojalá apruebe" (desid.) | "Quizás venga" (dubit.) | "¡Aprueba!" (imper.)'},
{title:'Transitivas vs Intransitivas',icon:'🔁',color:'#4DA864',tips:[
  {trig:'Pregunta <strong>¿Qué + verbo?</strong> y tiene respuesta →',res:'TRANSITIVA (tiene CD)',detail:'"Come una manzana" → ¿Qué come? Una manzana ✓'},
  {trig:'El CD se sustituye por <strong>LO / LA / LOS / LAS</strong> →',res:'confirma que es TRANSITIVA',detail:'"Come una manzana" → "La come" ✓'},
  {trig:'Si NO hay CD posible →',res:'INTRANSITIVA',detail:'"Duerme profundamente" → ¿Qué duerme? No tiene sentido → intransitiva'}
],ex:'"Compró un libro" → Lo compró ✓ (transitiva) | "Llegó ayer" (intransitiva)'},
{title:'Los Usos del SE',icon:'🔀',color:'#607D8B',tips:[
  {trig:'<strong>SE REFLEXIVO</strong>: mismo sujeto hace y recibe →',res:'acción sobre sí mismo; SE = CD o CI',detail:'"María se peina" / "Pedro se arregla el flequillo"'},
  {trig:'<strong>SE RECÍPROCO</strong>: sujeto plural, acción mutua →',res:'añade "mutuamente" y tiene sentido',detail:'"Se abrazan mutuamente" ✓ / "Se saludan" ✓'},
  {trig:'<strong>SE PASIVA REFLEJA</strong>: verbo concuerda con sujeto →',res:'hay sujeto gramatical; agente oculto',detail:'"Se venden pisos" → pisos es sujeto (concuerda en plural)'},
  {trig:'<strong>SE IMPERSONAL</strong>: verbo 3ª sing., sin sujeto posible →',res:'sin sujeto; nadie específico realiza la acción',detail:'"Se investiga mucho" / "Se trabaja bien aquí"'}
],ex:'"Se venden pisos" (refleja) | "Se investiga" (impersonal) | "Se peina" (reflexiva)'},
{title:'CD vs CI',icon:'🎯',color:'#E09050',tips:[
  {trig:'<strong>CD</strong>: sustituye por <strong>LO / LA / LOS / LAS</strong> →',res:'si funciona es CD',detail:'"Vio a su madre" → "La vio" ✓ → a su madre = CD (persona con a)'},
  {trig:'<strong>CI</strong>: pregunta <strong>¿A quién? / ¿Para quién?</strong> →',res:'sustituye por LE / LES',detail:'"Dio un libro a Ana" → "Le dio un libro" ✓ → a Ana = CI'},
  {trig:'ORDEN DE IDENTIFICACIÓN →',res:'primero CD (lo/la), luego CI (le/les)',detail:'"Regaló flores (CD) a su madre (CI)"'}
],ex:'"Regaló flores (CD) a su madre (CI)" → "Se las regaló" (CD=las, CI=se)'},
{title:'Oraciones Impersonales',icon:'❄️',color:'#60CCB8',tips:[
  {trig:'Verbo meteorológico solo (llover, nevar, granizar…) →',res:'IMPERSONAL METEOROLÓGICA — sin sujeto posible',detail:'"Llueve", "Nieva", "Graniza", "Hace frío", "Hay niebla"'},
  {trig:'<strong>HABER</strong> en 3ª persona singular →',res:'IMPERSONAL CON HABER',detail:'"Hay exámenes" — "exámenes" es complemento, NO sujeto'},
  {trig:'<strong>SE</strong> + verbo 3ª sing., sin sujeto →',res:'IMPERSONAL CON SE',detail:'"Se vive bien aquí" / "Se trabaja mucho en verano"'}
],ex:'"Llueve a cántaros" | "Había mucha gente" | "Se come tarde en España"'},
{title:'Reflexivas vs Recíprocas',icon:'🪞',color:'#B03232',tips:[
  {trig:'Mismo sujeto hace Y recibe la acción →',res:'REFLEXIVA',detail:'"Pedro se peina" (Pedro se peina A SÍ MISMO)'},
  {trig:'Varios sujetos se hacen la acción MUTUAMENTE →',res:'RECÍPROCA',detail:'"Juan y Ana se quieren" (el uno al otro)'},
  {trig:'TRUCO: añade "mutuamente" →',res:'si tiene sentido → RECÍPROCA; si no → REFLEXIVA',detail:'"Se saludan mutuamente" ✓ | "Se lava mutuamente" ✗ (reflexiva)'}
],ex:'"Se lava (a sí mismo)" (reflexiva) | "Se abrazan mutuamente" (recíproca)'},
{title:'Oraciones Compuestas: Tipos',icon:'🔗',color:'#E2CA70',tips:[
  {trig:'Nexo <strong>Y, NI, E</strong> →',res:'COORDINADA COPULATIVA (suma)',detail:'"Canta y baila" / "Ni estudia ni trabaja"'},
  {trig:'Nexo <strong>PERO, SINO, MAS, AUNQUE</strong> →',res:'COORDINADA ADVERSATIVA (contrasta)',detail:'"Estudia pero no aprueba" / "No es listo, sino trabajador"'},
  {trig:'Nexo <strong>O, U, O BIEN</strong> →',res:'COORDINADA DISYUNTIVA (alternativa)',detail:'"¿Vienes o te quedas?" / "O estudias o suspendes"'},
  {trig:'Nexo <strong>QUE, SI, CUANDO, PORQUE, PARA QUE…</strong> →',res:'SUBORDINADA (una depende de la otra)',detail:'"Sé que mañana lloverá" / "Estudia porque quiere aprobar"'}
],ex:'"Canta y baila" (coord. cop.) | "Estudia pero falla" (coord. advers.) | "Sé que vendrá" (subord.)'},
{title:'Subordinadas: Tipos',icon:'📎',color:'#9B7FD4',tips:[
  {trig:'Subordinada que funciona como SUSTANTIVO (sujeto o CD) →',res:'SUBORDINADA SUSTANTIVA',detail:'"Sé [que vendrá]" (CD) / "[Que llueva] me molesta" (Sujeto)'},
  {trig:'Subordinada que modifica a un SUSTANTIVO (como adjetivo) →',res:'SUBORDINADA ADJETIVA o DE RELATIVO',detail:'"El libro [que leí]" / "La chica [que canta]" — nexo: que, quien, donde…'},
  {trig:'Subordinada de TIEMPO → cuando, mientras, antes de que →',res:'SUBORDINADA ADVERBIAL TEMPORAL',detail:'"Llámame [cuando llegues]"'},
  {trig:'Subordinada de CAUSA → porque, ya que, puesto que →',res:'SUBORDINADA ADVERBIAL CAUSAL',detail:'"Faltó [porque estaba enfermo]"'},
  {trig:'Subordinada de FINALIDAD → para que, a fin de que →',res:'SUBORDINADA ADVERBIAL FINAL',detail:'"Estudia [para que aprendas]"'},
  {trig:'Subordinada de CONCESIÓN → aunque, a pesar de que →',res:'SUBORDINADA ADVERBIAL CONCESIVA',detail:'"Vino [aunque llovía]"'},
  {trig:'Subordinada de CONDICIÓN → si, con tal de que →',res:'SUBORDINADA ADVERBIAL CONDICIONAL',detail:'"[Si estudias], aprobarás"'}
],ex:'"Quiero que vengas" (sust. CD) | "El chico que habla" (adjet.) | "Llama cuando llegues" (temporal)'},
{title:'CD vs Atributo — No los confundas',icon:'⚡',color:'#FF9090',tips:[
  {trig:'ATRIBUTO: con SER/ESTAR/PARECER + sustituye por LO invariable →',res:'es ATRIBUTO (pred. nominal)',detail:'"El gato está dormido" → "LO está" ✓ → dormido = Atributo'},
  {trig:'CD: con verbo predicativo + sustituye por LO/LA variable →',res:'es CD (pred. verbal)',detail:'"Comió la pizza" → "La comió" ✓ → la pizza = CD (no es atributo)'},
  {trig:'COMPLEMENTO PREDICATIVO: adj. con verbo predicativo que describe al sujeto →',res:'CPred. (no es atributo ni CD)',detail:'"Llegó cansado" → cansado = CPred. (describe cómo llegó él)'}
],ex:'"Está cansada" → Atr (LO está ✓) | "Come pizza" → CD (La come ✓) | "Llegó cansado" → CPred'},
{title:'Complementos Circunstanciales',icon:'📍',color:'#60CCB8',tips:[
  {trig:'¿DÓNDE? →',res:'CC de Lugar (CCL)',detail:'"Estudia en casa" → en casa = CCL'},
  {trig:'¿CUÁNDO? →',res:'CC de Tiempo (CCT)',detail:'"Llegó ayer" → ayer = CCT'},
  {trig:'¿CÓMO? →',res:'CC de Modo (CCM)',detail:'"Habla rápidamente" → rápidamente = CCM'},
  {trig:'¿CUÁNTO? →',res:'CC de Cantidad (CCCant)',detail:'"Llueve mucho" → mucho = CCCant'},
  {trig:'¿POR QUÉ? →',res:'CC de Causa (CCCausa)',detail:'"Faltó por enfermedad" → por enfermedad = CCCausa'},
  {trig:'¿PARA QUÉ? →',res:'CC de Finalidad (CCFin)',detail:'"Estudia para aprobar" → para aprobar = CCFin'}
],ex:'"Ayer (CCT) llegó a Sevilla (CCL) muy contento (CPred)"'},
];

function showTrucos(){
  navTo('n2');
  let h=`<div class="sec-hdr"><span style="font-size:18px;color:var(--gold)">✦</span><h2>Reliquias de Conocimiento</h2></div>
  <p class="sec-intro">Patrones: <strong>"Si ves X → es Y"</strong>. Toca para revelar cada secreto.</p>
  <div class="tricks-list">`;
  TRUCOS.forEach((t,i)=>{
    h+=`<div class="tcard" id="tc${i}" onclick="toggleT(${i})">
      <div class="thead" style="border-left:3px solid ${t.color}">
        <span style="font-size:17px">${t.icon}</span>
        <div class="ttitle">${t.title}</div>
        <span class="tarrow">▾</span>
      </div>
      <div class="tbody"><div class="tcontent">
        ${t.tips.map(tp=>`<div class="tip-trigger">${tp.trig} <span style="color:${t.color};font-weight:700">${tp.res}</span></div><div class="tip-detail">↳ ${tp.detail}</div>`).join('')}
        ${t.ex?`<div class="tex">${t.ex}</div>`:''}
      </div></div>
    </div>`;
  });
  document.getElementById('content').innerHTML=h+'</div>';
}
function toggleT(i){document.getElementById('tc'+i).classList.toggle('open')}

// ═══════════════════ QUIZ DATA ═══════════════════
const PREGUNTAS=[
// ACTITUD
{cat:'Actitud',q:'"Ojalá llegues a tiempo."',opts:['Dubitativa','Imperativa','Desiderativa','Enunciativa'],c:2,exp:'OJALÁ → DESIDERATIVA: expresa deseo del hablante.'},
{cat:'Actitud',q:'"Quizás mañana nieve en la sierra."',opts:['Desiderativa','Exclamativa','Dubitativa','Imperativa'],c:2,exp:'QUIZÁS → DUBITATIVA: expresa duda o posibilidad.'},
{cat:'Actitud',q:'"¡Siéntate ya mismo!"',opts:['Exclamativa','Enunciativa','Imperativa','Dubitativa'],c:2,exp:'Orden directa con imperativo → IMPERATIVA.'},
{cat:'Actitud',q:'"¡Qué bonita está la ciudad!"',opts:['Imperativa','Exclamativa','Desiderativa','Interrogativa'],c:1,exp:'Emoción con ¡! y QUÉ → EXCLAMATIVA.'},
{cat:'Actitud',q:'"Tal vez venga Pedro mañana."',opts:['Enunciativa','Desiderativa','Imperativa','Dubitativa'],c:3,exp:'TAL VEZ → DUBITATIVA.'},
{cat:'Actitud',q:'"¿Cuándo llegarás a casa?"',opts:['Enunciativa','Exclamativa','Interrogativa directa','Desiderativa'],c:2,exp:'Pregunta con signos ¿? → INTERROGATIVA DIRECTA.'},
{cat:'Actitud',q:'"Me preguntó si vendría a la fiesta."',opts:['Interrogativa directa','Interrogativa indirecta','Enunciativa','Imperativa'],c:1,exp:'Pregunta dentro de otra frase, sin signos → INTERROGATIVA INDIRECTA.'},
// COPULATIVAS
{cat:'Copulativas',q:'¿Cuál es una oración COPULATIVA?',opts:['El perro ladra fuerte','La niña come rápido','El cielo está nublado','Corre todos los días'],c:2,exp:'"ESTÁ" es copulativo. "nublado" = atributo → LO está ✓.'},
{cat:'Copulativas',q:'¿Cómo identifico el ATRIBUTO?',opts:['Sustituyo por LO/LA/LOS/LAS','Sustituyo por LO invariable','Pregunto ¿Dónde?','Busco la preposición POR'],c:1,exp:'El atributo → LO invariable: "está cansada" → "LO está" ✓.'},
{cat:'Copulativas',q:'"El equipo parece cansado." ¿Copulativa o predicativa?',opts:['Predicativa','Transitiva','Copulativa','Impersonal'],c:2,exp:'PARECER = copulativo. "cansado" = atributo (LO parece ✓).'},
{cat:'Copulativas',q:'¿Cuáles son los únicos verbos copulativos?',opts:['Andar, quedarse, hallarse','Ser, estar, parecer','Llevar, resultar, seguir','Tener, haber, hacer'],c:1,exp:'Solo SER, ESTAR y PARECER son copulativos puros en español.'},
{cat:'Copulativas',q:'"Pedro es de Granada." ¿Qué tipo de oración es?',opts:['Predicativa intransitiva','Impersonal','Copulativa','Transitiva'],c:2,exp:'"es" = copulativo. "de Granada" = atributo (lo es ✓) → COPULATIVA.'},
// PASIVA
{cat:'Pasiva',q:'¿Qué tipo es "El libro fue escrito por Cervantes"?',opts:['Pasiva refleja','Impersonal','Pasiva perifrástica','Activa'],c:2,exp:'SER + PARTICIPIO → PERIFRÁSTICA. "por Cervantes" = C. Agente.'},
{cat:'Pasiva',q:'¿Qué tipo es "Se venden pisos en esta calle"?',opts:['Perifrástica','Impersonal meteorológica','Activa','Pasiva refleja'],c:3,exp:'SE + VERBO que concuerda con sujeto (pisos) → PASIVA REFLEJA.'},
{cat:'Pasiva',q:'"La ciudad fue destruida ___ el ejército."',opts:['Con','De','Ante','Por'],c:3,exp:'El C. Agente en pasiva perifrástica siempre va con POR.'},
{cat:'Pasiva',q:'En "Se vende el piso", ¿cuál es el sujeto?',opts:['SE','No tiene sujeto','El piso','El verbo vende'],c:2,exp:'"El piso" = sujeto paciente (verbo concuerda en singular) → pasiva refleja.'},
{cat:'Pasiva',q:'Pasiva de "Ana escribió la carta":',opts:['"Se escribió la carta"','"La carta fue escrita por Ana"','"La carta se escribe"','"Ana es escritora"'],c:1,exp:'CD→sujeto + SER + PARTICIPIO + POR + sujeto original.'},
{cat:'Pasiva',q:'"Se investiga sobre el caso." ¿Qué tipo de oración es?',opts:['Pasiva refleja','Activa transitiva','Impersonal con SE','Activa reflexiva'],c:2,exp:'SE + verbo sin sujeto posible → IMPERSONAL CON SE. Diferente a refleja donde SÍ hay sujeto.'},
// TRANSITIVAS
{cat:'Predicativas',q:'"Pepe comió una manzana." ¿Transitiva o intransitiva?',opts:['Intransitiva','Copulativa','Impersonal','Transitiva'],c:3,exp:'CD: "una manzana" (¿qué comió? → la comió ✓) → TRANSITIVA.'},
{cat:'Predicativas',q:'CD "el libro" en "Leí el libro" → se sustituye por…',opts:['Le leí','Se leí','Lo leí','La leí'],c:2,exp:'CD masculino singular → LO leí.'},
{cat:'Predicativas',q:'"Llegó ayer muy tarde a casa."',opts:['Transitiva','Copulativa','Intransitiva','Impersonal'],c:2,exp:'¿Qué llegó? No tiene sentido → INTRANSITIVA.'},
{cat:'Predicativas',q:'"Los atletas corrieron la maratón." ¿Qué tipo?',opts:['Intransitiva','Copulativa','Transitiva','Impersonal'],c:2,exp:'"la maratón" = CD (la corrieron ✓) → TRANSITIVA.'},
// COMPLEMENTOS
{cat:'Complementos',q:'"Dio un regalo a su abuela." ¿Cuál es el CI?',opts:['Dio','Un regalo','No tiene CI','A su abuela'],c:3,exp:'"A su abuela" → ¿A quién? → LE → CI.'},
{cat:'Complementos',q:'El CI se sustituye por…',opts:['LO/LA/LOS/LAS','SE','LE/LES','POR'],c:2,exp:'CI → LE (sing.) o LES (plur.). CD → LO/LA/LOS/LAS.'},
{cat:'Complementos',q:'"Llegó a casa muy contento." "muy contento" es…',opts:['Atributo','CD','CA','Complemento Predicativo'],c:3,exp:'Describe al sujeto con verbo predicativo → COMPLEMENTO PREDICATIVO.'},
{cat:'Complementos',q:'"Estudia en casa por las tardes." ¿Qué complemento es "por las tardes"?',opts:['CC de Lugar','CC de Causa','CC de Tiempo','CD'],c:2,exp:'"por las tardes" responde a ¿cuándo? → CC de TIEMPO.'},
{cat:'Complementos',q:'"Faltó por enfermedad." "por enfermedad" es…',opts:['CC de Finalidad','CC de Causa','CI','CA'],c:1,exp:'"por enfermedad" responde a ¿por qué? → CC de CAUSA.'},
{cat:'Complementos',q:'"Estudia para aprobar el examen." "para aprobar" es…',opts:['CC de Causa','CC de Tiempo','CC de Finalidad','CD'],c:2,exp:'"para aprobar" responde a ¿para qué? → CC de FINALIDAD.'},
// IMPERSONALES
{cat:'Impersonales',q:'¿Cuál es IMPERSONAL?',opts:['María llegó tarde','Él durmió mucho','El coche es rojo','Llueve con fuerza'],c:3,exp:'"Llueve" = meteorológico → impersonal. Sin sujeto.'},
{cat:'Impersonales',q:'"Había mucha gente en la plaza."',opts:['Meteorológica','Con SE','Con SER','Con HABER'],c:3,exp:'HABER en 3ª sing. → siempre impersonal. "gente" no es sujeto.'},
{cat:'Impersonales',q:'"Se vive bien en esta ciudad."',opts:['Pasiva refleja','Reflexiva','Impersonal con SE','Recíproca'],c:2,exp:'SE + verbo sin sujeto posible → IMPERSONAL CON SE.'},
{cat:'Impersonales',q:'"Hace mucho frío en Burgos." ¿Qué tipo es?',opts:['Copulativa','Impersonal con HACER','Predicativa intransitiva','Pasiva refleja'],c:1,exp:'HACER para fenómenos atmosféricos → IMPERSONAL. Sin sujeto.'},
// REFLEXIVAS / RECÍPROCAS
{cat:'Reflexivas',q:'"Juan y María se miran." ¿Reflexiva o recíproca?',opts:['Reflexiva','Impersonal','Copulativa','Recíproca'],c:3,exp:'Dos sujetos, acción mutua → RECÍPROCA. "Se miran mutuamente" ✓.'},
{cat:'Reflexivas',q:'"Pedro se ducha cada mañana."',opts:['Recíproca','Impersonal','Transitiva','Reflexiva'],c:3,exp:'Sujeto hace Y recibe la acción → REFLEXIVA.'},
{cat:'Reflexivas',q:'¿Cómo distingo reflexiva de recíproca?',opts:['Por el número de verbos','Añadiendo "mutuamente": si funciona → recíproca','Por el tipo de verbo','Sustituyendo por LO/LA'],c:1,exp:'Truco del "mutuamente": "Se abrazan mutuamente" ✓ (recíproca) | "Se ducha mutuamente" ✗ (reflexiva).'},
// ESTRUCTURA
{cat:'Estructura',q:'"Marta estudia y su hermano duerme."',opts:['Simple','Subordinada','Compuesta coordinada','Impersonal'],c:2,exp:'2 proposiciones independientes con Y → COORDINADA COPULATIVA.'},
{cat:'Estructura',q:'"Sé que mañana lloverá."',opts:['Coordinada','Simple','Compuesta subordinada','Yuxtapuesta'],c:2,exp:'Una proposición depende de la otra con QUE → SUBORDINADA SUSTANTIVA.'},
{cat:'Estructura',q:'"Estudia mucho pero no aprueba."',opts:['Coordinada copulativa','Simple','Coordinada adversativa','Subordinada'],c:2,exp:'PERO = nexo coordinante adversativo → COORDINADA ADVERSATIVA.'},
{cat:'Estructura',q:'"Llámame cuando llegues a casa."',opts:['Coordinada disyuntiva','Simple','Coordinada copulativa','Compuesta subordinada'],c:3,exp:'"cuando" = nexo subordinante temporal → SUBORDINADA ADVERBIAL TEMPORAL.'},
{cat:'Estructura',q:'"Falta a clase porque está enfermo."',opts:['Coordinada','Yuxtapuesta','Subordinada causal','Subordinada temporal'],c:2,exp:'"porque" → SUBORDINADA ADVERBIAL CAUSAL.'},
{cat:'Estructura',q:'"Vino aunque llovía mucho."',opts:['Subordinada causal','Coordinada adversativa','Subordinada concesiva','Coordinada copulativa'],c:2,exp:'"aunque" → SUBORDINADA ADVERBIAL CONCESIVA.'},
{cat:'Estructura',q:'"Si estudias, aprobarás."',opts:['Temporal','Causal','Concesiva','Condicional'],c:3,exp:'"si" → SUBORDINADA ADVERBIAL CONDICIONAL.'},
{cat:'Estructura',q:'"El libro que leí era fascinante."',opts:['Subordinada sustantiva','Coordinada','Subordinada adjetiva','Simple'],c:2,exp:'"que leí" modifica al sustantivo "libro" → SUBORDINADA ADJETIVA (de relativo).'},
{cat:'Estructura',q:'"Quiero que vengas a la fiesta." ¿Qué tipo de subordinada es?',opts:['Adjetiva','Adverbial temporal','Sustantiva','Adverbial causal'],c:2,exp:'"que vengas" funciona como CD del verbo "quiero" → SUBORDINADA SUSTANTIVA.'},
// SE
{cat:'Usos del SE',q:'"Se respetan las normas." ¿Qué tipo de SE es?',opts:['Reflexivo','Recíproco','Pasiva refleja','Impersonal'],c:2,exp:'SE + verbo que concuerda con sujeto (normas, plural) → PASIVA REFLEJA.'},
{cat:'Usos del SE',q:'"Se sabe que llegará tarde." ¿Qué tipo de SE es?',opts:['Reflexivo','Pasiva refleja','Recíproco','Impersonal'],c:3,exp:'SE + verbo 3ª singular sin sujeto posible → IMPERSONAL.'},
{cat:'Usos del SE',q:'"Los amigos se ayudan." ¿Reflexiva o recíproca?',opts:['Reflexiva','Impersonal','Pasiva refleja','Recíproca'],c:3,exp:'Varios sujetos se hacen la acción mutuamente → RECÍPROCA.'},
{cat:'Usos del SE',q:'"María se peina el pelo." El SE funciona como…',opts:['Sujeto','CD','CI','Nexo'],c:2,exp:'SE reflexivo: María peina EL PELO a sí misma. El pelo = CD. SE = CI (beneficiario).'},
];

// ═══════════════════ QUIZ LOGIC ═══════════════════
function showTest(){
  navTo('n3');
  S.qset=[...PREGUNTAS].sort(()=>Math.random()-.5).slice(0,12);
  S.qi=0;S.qscore=0;S.masks=Math.max(1,S.masks);S.qAnswered=false;S.qSel=null;S.qNoFail=0;
  hideFP();renderQ();
}
function renderQ(){
  if(S.qi>=S.qset.length){showResult();return}
  const p=S.qset[S.qi],tot=S.qset.length,pct=(S.qi/tot)*100;
  const lets=['A','B','C','D'];
  const amu=getEquippedAmu();
  let hiddenIdx=-1;
  if(amu&&amu.bonus.type==='hint'){
    const wrong=p.opts.map((_,i)=>i!==p.c?i:-1).filter(i=>i>=0);
    if(wrong.length)hiddenIdx=wrong[Math.floor(Math.random()*wrong.length)];
  }
  document.getElementById('content').innerHTML=`
  <div class="qwrap">
    <div class="qprog-row"><span class="qprog-txt">Prueba ${S.qi+1}/${tot}</span><div class="masks">${mkMasks()}</div></div>
    <div class="qbar"><div class="qbar-fill" style="width:${pct}%"></div></div>
    <div class="qcard">
      <span class="qcat">${p.cat}</span>
      <div class="qtext">${p.q}</div>
    </div>
    <div class="opts" id="opts">
      ${p.opts.map((o,i)=>hiddenIdx===i?`<div style="height:49px;background:rgba(255,255,255,.02);border:1px dashed var(--border);border-radius:var(--r);display:flex;align-items:center;justify-content:center"><span style="font-size:11px;color:var(--muted);font-family:var(--title)">📖 Eliminada por el Maestro</span></div>`:`<button class="opt" id="o${i}" onclick="selOpt(${i})"><span class="oletter">${lets[i]}</span>${o}</button>`).join('')}
    </div>
    <button class="vbtn" id="vbtn" onclick="verifyQ()">Confirmar Respuesta</button>
    ${amu?`<div style="text-align:center;font-size:10px;color:var(--soul-d);margin-top:7px;font-family:var(--title)">${amu.emoji} ${amu.name}</div>`:''}
  </div>`;
  S.qAnswered=false;S.qSel=null;
}
function selOpt(i){
  if(S.qAnswered)return;
  document.querySelectorAll('.opt').forEach(b=>b.classList.remove('sel'));
  document.getElementById('o'+i).classList.add('sel');
  S.qSel=i;
  document.getElementById('vbtn').classList.add('ready');
}
function verifyQ(){
  if(S.qSel===null||S.qAnswered)return;
  S.qAnswered=true;
  const p=S.qset[S.qi];const ok=S.qSel===p.c;
  const oldXp=S.xp;
  document.querySelectorAll('.opt').forEach((b,i)=>{
    if(!b.classList.contains('opt'))return;
    b.disabled=true;
    if(i===p.c){b.classList.add('correct');b.classList.remove('sel')}
    else if(i===S.qSel&&!ok){b.classList.add('wrong');b.classList.remove('sel')}
  });
  const vb=document.getElementById('vbtn');
  vb.classList.remove('ready');vb.classList.add(ok?'ok':'no');
  vb.textContent=ok?'✦ ¡Golpe Certero!':'◆ Máscara Rota';
  let expExtra='';
  if(ok){
    S.qscore++;S.streak++;S.qNoFail++;
    const got=addXp(10);addSoul(12*getSoulMult());
    // Mask regen amuleto
    const amu=getEquippedAmu();
    if(amu&&amu.bonus.type==='mask_regen'&&S.qNoFail>0&&S.qNoFail%amu.bonus.every===0&&S.masks<S.maxMasks){S.masks++;expExtra=' ◆ Máscara recuperada.';}
    const rankUp=checkRankUp(oldXp);
    if(rankUp)expExtra+='\n🏆 '+rankUp;
    showFP(true,p.exp+expExtra,got);
  } else {
    const amu=getEquippedAmu();
    const shielded=S.qShield||(amu&&amu.bonus.type==='shield'&&!S._shieldUsed);
    if(shielded){S.qShield=false;S._shieldUsed=true;expExtra=' 🛡️ Escudo de Alma activado — máscara protegida.';}
    else{S.streak=0;S.masks=Math.max(0,S.masks-1);S.qNoFail=0;addSoul(3);
      if(amu&&amu.bonus.breaks){S.equipped=null;toast('🦋 Quimera Frágil rota...');}}
    // Revenge amuleto
    if(amu&&amu.bonus.type==='revenge'&&S.streak===0){addXp(amu.bonus.val);expExtra=` ⚡ +${amu.bonus.val} Geo de venganza.`;}
    showFP(false,p.exp+expExtra,0);
    if(S.masks<=0)setTimeout(()=>{hideFP();showResult()},2200);
  }
  updHdr();saveUser();
}
function showFP(ok,exp,got){
  const fp=document.getElementById('fpanel');
  fp.className='fpanel '+(ok?'ok':'no');
  document.getElementById('ficon').textContent=ok?'✦':'◆';
  document.getElementById('ftitle').textContent=ok?`¡Golpe Certero! +${got} Geo`:'¡Máscara Rota!';
  document.getElementById('fexp').innerHTML=exp.replace('\n','<br>');
  const nb=document.getElementById('fnext');
  nb.textContent=S.qi+1>=S.qset.length?'✦ Ver Resultado':'Continuar →';
  nb.onclick=()=>nextQ();
  fp.style.display='flex';
}
function nextQ(){hideFP();S.qi++;if(S.qi>=S.qset.length||S.masks<=0)showResult();else renderQ()}
function showResult(){
  hideFP();
  const tot=S.qset.length,pct=Math.round((S.qscore/tot)*100);
  const rank=getRank();
  let trophy,msg,stars;
  if(pct>=90){trophy='🏆';msg='El Alma Pálida te bendice';stars='⬡⬡⬡'}
  else if(pct>=70){trophy='🐝';msg='Hornet asiente ante ti';stars='⬡⬡'}
  else if(pct>=50){trophy='🗺️';msg='Quirrel estaría orgulloso';stars='⬡'}
  else{trophy='📜';msg='Regresa a las Ruinas a estudiar';stars=''}
  document.getElementById('content').innerHTML=`
  <div class="qend">
    <div style="font-size:72px;animation:pop .7s ease">${trophy}</div>
    <h2>${msg}</h2>
    <div><div class="score-big">${S.qscore}/${tot}</div><div class="score-lbl">${pct}% de aciertos</div></div>
    ${stars?`<div style="font-size:26px;letter-spacing:4px;filter:drop-shadow(0 0 6px rgba(201,168,76,.5))">${stars}</div>`:''}
    <div class="xp-box"><div class="xp-box-lbl">Estado del reino</div><div class="xp-box-val">⬡ ${S.xp} Geo · ${rank.name} · ◆ ${S.masks} máscaras</div></div>
    <button class="gbtn" onclick="showTest()" style="max-width:280px">⚔️ Repetir Coliseo</button>
    <button class="gbtn soul" onclick="showTrucos()" style="max-width:280px">✦ Repasar Reliquias</button>
    <button class="gbtn red" onclick="showHome()" style="max-width:280px">↩ Volver al Mapa</button>
  </div>`;
}

// ═══════════════════ ALQUIMISTA ═══════════════════
const MORFO_TAGS=[
  {label:'Det.',   color:'#C9A84C',bg:'rgba(201,168,76,.2)',    name:'Determinante', def:'Acompaña al sustantivo y lo presenta', ej:'el, la, un, este, mi, varios'},
  {label:'N',      color:'#9B7FD4',bg:'rgba(155,127,212,.2)',   name:'Sustantivo/Nombre', def:'Nombre de persona, lugar, cosa o idea', ej:'mesa, ciudad, María, felicidad'},
  {label:'Adj.',   color:'#4DA864',bg:'rgba(77,168,100,.2)',    name:'Adjetivo', def:'Describe o modifica al sustantivo', ej:'bonito, rápido, grande, azul'},
  {label:'V',      color:'#76D7EA',bg:'rgba(118,215,234,.2)',   name:'Verbo', def:'Expresa acción, estado o proceso', ej:'corre, es, tiene, llegó, llueve'},
  {label:'Adv.',   color:'#E09050',bg:'rgba(224,144,80,.2)',    name:'Adverbio', def:'Modifica al verbo, adjetivo u otro adverbio', ej:'ayer, aquí, mucho, rápidamente, ya'},
  {label:'Prep.',  color:'#607D8B',bg:'rgba(96,125,139,.2)',    name:'Preposición', def:'Relaciona palabras, indica dirección o causa', ej:'en, con, por, para, a, de, sobre'},
  {label:'Pron.',  color:'#EC4899',bg:'rgba(236,72,153,.18)',   name:'Pronombre', def:'Sustituye al sustantivo', ej:'él, ella, lo, le, se, me, te, nosotros'},
  {label:'Conj.',  color:'#60CCB8',bg:'rgba(96,204,184,.18)',   name:'Conjunción', def:'Une palabras o proposiciones', ej:'y, pero, porque, que, si, aunque, cuando'},
  {label:'Enl.',   color:'#A0A0C0',bg:'rgba(160,160,192,.18)', name:'Enlace/Prep.', def:'Preposición dentro de sintagma preposicional', ej:'en (en casa), por (por la mañana)'},
];
// SINT tags — function labels
const SINT_TAGS=[
  {label:'SN-Suj',  color:'#C9A84C',bg:'rgba(201,168,76,.2)',   sint:'SN',  func:'Sujeto'},
  {label:'N.S.',    color:'#E2CA70',bg:'rgba(226,202,112,.18)', sint:'',    func:'Núcleo del Sujeto'},
  {label:'NP',      color:'#76D7EA',bg:'rgba(118,215,234,.18)', sint:'NP',  func:'Núcleo del Predicado'},
  {label:'CD',      color:'#4DA864',bg:'rgba(77,168,100,.2)',   sint:'SN',  func:'Complemento Directo'},
  {label:'CI',      color:'#80E0A0',bg:'rgba(128,224,160,.18)', sint:'SN',  func:'Complemento Indirecto'},
  {label:'CC-T',    color:'#E09050',bg:'rgba(224,144,80,.2)',   sint:'SAdv',func:'CCTiempo'},
  {label:'CC-L',    color:'#F0A870',bg:'rgba(240,168,112,.18)', sint:'SPrep',func:'CCLugar'},
  {label:'CC-M',    color:'#D4A060',bg:'rgba(212,160,96,.18)',  sint:'SAdv',func:'CCModo'},
  {label:'CC-Cant', color:'#B09050',bg:'rgba(176,144,80,.18)',  sint:'SAdv',func:'CCCantidad'},
  {label:'Atr.',    color:'#9B7FD4',bg:'rgba(155,127,212,.2)',  sint:'SAdj',func:'Atributo'},
  {label:'CPred.',  color:'#C09ED8',bg:'rgba(192,158,216,.18)', sint:'SAdj',func:'CPred'},
  {label:'CA',      color:'#607D8B',bg:'rgba(96,125,139,.2)',   sint:'SPrep',func:'C.Agente'},
];

const EJERCICIOS=[
  {s:['Hoy','llueve','mucho','en','la','ciudad'],
   morfo:['Adv.','V','Adv.','Enl.','Det.','N'],
   sint:['CC-T','NP','CC-Cant','CC-L','CC-L','CC-L'],
   suj:[],pred:[0,1,2,3,4,5],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Intransitiva','Impersonal']},
   tip:'Llueve = impersonal meteorológica → sin sujeto. Hoy = CCT. Mucho = CCCantidad. En la ciudad = CCLugar.'},
  {s:['La','profesora','explicó','la','lección','con','paciencia'],
   morfo:['Det.','N','V','Det.','N','Prep.','N'],
   sint:['SN-Suj','N.S.','NP','CD','CD','CC-M','CC-M'],
   suj:[0,1],pred:[2,3,4,5,6],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Transitiva']},
   tip:'La profesora = Sujeto. Explicó = NP. La lección = CD (la explicó ✓). Con paciencia = CCModo.'},
  {s:['El','equipo','está','muy','contento'],
   morfo:['Det.','N','V','Adv.','Adj.'],
   sint:['SN-Suj','N.S.','NP','Atr.','Atr.'],
   suj:[0,1],pred:[2,3,4],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Copulativa']},
   tip:'Está = copulativo. Muy contento = Atributo (el equipo LO está ✓). Copulativa.'},
  {s:['María','se','peinó','con','esmero'],
   morfo:['N','Pron.','V','Prep.','N'],
   sint:['SN-Suj','NP','NP','CC-M','CC-M'],
   suj:[0],pred:[1,2,3,4],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Reflexiva']},
   tip:'María = Sujeto. Se peinó = núcleo reflexivo. Con esmero = CCModo. Reflexiva: sujeto = objeto.'},
  {s:['El','castillo','fue','construido','por','los','romanos'],
   morfo:['Det.','N','V','Adj.','Prep.','Det.','N'],
   sint:['SN-Suj','N.S.','NP','NP','CA','CA','CA'],
   suj:[0,1],pred:[2,3,4,5,6],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Pasiva perifrástica']},
   tip:'El castillo = Sujeto paciente. Fue construido = SER+participio. Por los romanos = CA. Pasiva perifrástica.'},
  {s:['Ana','le','regaló','flores','a','su','madre'],
   morfo:['N','Pron.','V','N','Prep.','Det.','N'],
   sint:['SN-Suj','CI','NP','CD','CI','CI','CI'],
   suj:[0],pred:[1,2,3,4,5,6],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Transitiva']},
   tip:'Ana = Sujeto. Le = CI pronombre átono. Regaló = NP. Flores = CD (las regaló ✓). A su madre = CI.'},
  {s:['Quizás','mañana','nieve','en','la','sierra'],
   morfo:['Adv.','Adv.','V','Enl.','Det.','N'],
   sint:['CC-M','CC-T','NP','CC-L','CC-L','CC-L'],
   suj:[],pred:[0,1,2,3,4,5],
   clasif:{estructura:'Simple',actitud:'Dubitativa',tipo:['Impersonal']},
   tip:'Quizás = dubitativa. Nieve = impersonal meteorológica. Mañana = CCT. En la sierra = CCL.'},
  {s:['Se','venden','muchos','pisos','en','esta','calle'],
   morfo:['Pron.','V','Det.','N','Prep.','Det.','N'],
   sint:['NP','NP','SN-Suj','N.S.','CC-L','CC-L','CC-L'],
   suj:[2,3],pred:[0,1,4,5,6],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Pasiva refleja']},
   tip:'Se venden = pasiva refleja. Muchos pisos = sujeto (verbo concuerda en plural). En esta calle = CCL.'},
  {s:['Los','niños','corrieron','por','el','parque'],
   morfo:['Det.','N','V','Prep.','Det.','N'],
   sint:['SN-Suj','N.S.','NP','CC-L','CC-L','CC-L'],
   suj:[0,1],pred:[2,3,4,5],
   clasif:{estructura:'Simple',actitud:'Enunciativa',tipo:['Intransitiva']},
   tip:'Los niños = Sujeto. Corrieron = NP. Por el parque = CCLugar. Sin CD → intransitiva.'},
  {s:['Ojalá','apruebe','el','examen'],
   morfo:['Adv.','V','Det.','N'],
   sint:['CC-M','NP','CD','CD'],
   suj:[],pred:[0,1,2,3],
   clasif:{estructura:'Simple',actitud:'Desiderativa',tipo:['Transitiva']},
   tip:'Ojalá = desiderativa. Sin sujeto explícito (tú implícito). El examen = CD (lo apruebe ✓).'},
];

let sintEj=null,sintActiveTag=null;

function showAlquimista(){
  navTo('n4');
  sintEj=EJERCICIOS[Math.floor(Math.random()*EJERCICIOS.length)];
  S.sintTags={};S.sintClassSel={};S.sintSel=null;sintActiveTag=null;S.sintMode='morfo';
  renderAlquimista();
}
function renderAlquimista(){
  const ej=sintEj,mode=S.sintMode;
  const px=mode==='morfo'?'m':'s';
  const tags=mode==='morfo'?MORFO_TAGS:SINT_TAGS;
  const allTagged=ej.s.every((_,i)=>S.sintTags[px+i]);
  document.getElementById('content').innerHTML=`
  <div class="sint-wrap">
    <div class="sint-mode-row">
      <button class="smode-btn${mode==='morfo'?' active':''}" onclick="setSintMode('morfo')">1 · Morfología</button>
      <button class="smode-btn${mode==='sint'?' active':''}" onclick="setSintMode('sint')">2 · Sintaxis</button>
    </div>
    <div class="sint-card">
      <span class="sint-lbl">${mode==='morfo'?'Etiqueta la categoría de cada palabra':'Etiqueta la función de cada palabra'}</span>
      ${mode==='sint'?renderCascade(ej):renderFlat(ej)}
      <div class="tags-section">
        <span class="tags-section-lbl">${mode==='morfo'?'Selecciona palabra → luego categoría:':'Selecciona palabra → luego función sintáctica:'}</span>
        <div class="tags-area">
          ${tags.map(t=>`<button class="tag-btn${sintActiveTag===t.label?' active-tag':''}"
            style="background:${sintActiveTag===t.label?t.bg:'rgba(255,255,255,.04)'};color:${t.color};border-color:${sintActiveTag===t.label?t.color:'var(--border2)'}"
            onclick="selTag('${t.label}')">${t.label}</button>`).join('')}
        </div>
      </div>
      ${mode==='sint'?renderClassif(ej):''}
      <div class="sint-actions">
        ${allTagged?`<button class="sint-check" onclick="${mode==='morfo'?'checkMorfo()':'checkSint()'}">Comprobar ▸</button>`:`<button class="sint-check" disabled>Etiqueta todas las palabras</button>`}
        <button class="sint-reset" onclick="resetSint()">↺</button>
        <button class="sint-help" onclick="showSintHelp('${mode}')">?</button>
      </div>
      <div class="sint-fb" id="sint-fb"></div>
      <button class="sint-next" id="sint-next" onclick="showAlquimista()">Nueva frase ▸</button>
    </div>
  </div>`;
}
function renderFlat(ej){
  return`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">
    ${ej.s.map((w,i)=>{
      const tag=S.sintTags['m'+i];const tObj=MORFO_TAGS.find(t=>t.label===tag);
      return`<div class="sword${S.sintSel===i?' selected':''}" id="sw${i}" onclick="selWord(${i})">
        <div class="sword-morfo" style="${tObj?`background:${tObj.bg};color:${tObj.color};border:1px solid ${tObj.color}40`:'opacity:0'}">${tag||'·'}</div>
        <div class="sword-text">${w}</div>
      </div>`;
    }).join('')}
  </div>`;
}
function renderCascade(ej){
  // Group words in sujeto and predicado lanes
  const sujetoIdx=ej.suj;const predIdx=ej.pred;
  function renderLaneWords(idxArr){
    return idxArr.map(i=>{
      const tag=S.sintTags['s'+i];const tObj=SINT_TAGS.find(t=>t.label===tag);
      return`<div class="sword${S.sintSel===i?' selected':''}" id="sw${i}" onclick="selWord(${i})">
        <div class="sword-sint" style="${tObj?`background:${tObj.bg};color:${tObj.color};border:1px solid ${tObj.color}40`:'opacity:0'}">${tag?tObj.func||tag:'·'}</div>
        <div class="sword-text">${ej.s[i]}</div>
      </div>`;
    }).join('');
  }
  // Build sintagma groups for display
  function renderSintGroups(idxArr, laneType){
    // Group consecutive words with same sint label into sintagma blocks
    const groups=[];let cur=[];
    idxArr.forEach(i=>{
      const tag=S.sintTags['s'+i];const prev=cur.length?S.sintTags['s'+cur[cur.length-1]]:null;
      if(cur.length&&tag!==prev){groups.push([...cur]);cur=[i];}else cur.push(i);
    });
    if(cur.length)groups.push(cur);
    return groups.map(grp=>{
      const tag=S.sintTags['s'+grp[0]];const tObj=SINT_TAGS.find(t=>t.label===tag);
      const sintLabel=tObj?tObj.sint:'';const funcLabel=tObj?tObj.func:'';
      return`<div class="sint-group">
        ${sintLabel?`<div class="sint-group-tag" style="background:${tObj.bg};color:${tObj.color};border:1px solid ${tObj.color}40">${sintLabel} — ${funcLabel}</div>`:''}
        <div class="sint-group-words">${grp.map(i=>{
          const t=S.sintTags['s'+i];const to=SINT_TAGS.find(x=>x.label===t);
          return`<div class="sword${S.sintSel===i?' selected':''}" id="sw${i}" onclick="selWord(${i})">
            <div class="sword-morfo" style="${to?`background:${to.bg};color:${to.color}`:'opacity:0'}">${t||'·'}</div>
            <div class="sword-text">${ej.s[i]}</div>
          </div>`;
        }).join('')}</div>
      </div>`;
    }).join('');
  }
  return`<div class="cascade-wrap">
    <div class="c-lane lane-suj">
      <div class="c-lane-hdr">👑 Sujeto ${sujetoIdx.length===0?'<span style="font-size:9px;color:var(--muted);font-style:italic">(sin sujeto — impersonal)</span>':''}</div>
      <div class="c-lane-body">
        ${sujetoIdx.length?renderSintGroups(sujetoIdx,'suj'):`<span style="font-size:12px;color:var(--muted);font-style:italic;padding:4px">∅ Impersonal</span>`}
      </div>
    </div>
    <div class="lane-connector"></div>
    <div class="c-lane lane-pred">
      <div class="c-lane-hdr">⚡ SV — Predicado verbal</div>
      <div class="c-lane-body">${renderSintGroups(predIdx,'pred')}</div>
    </div>
  </div>
  <div style="text-align:center;font-size:9px;color:var(--muted);font-family:var(--title);margin-bottom:10px;letter-spacing:.5px">Toca una palabra, luego su función ↓</div>`;
}
function renderClassif(ej){
  const sel=S.sintClassSel;
  return`<div class="class-section">
    <span class="class-section-lbl">Clasificación completa de la oración:</span>
    <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Estructura:</div>
    <div class="class-row">${['Simple','Coord. copulativa','Coord. adversativa','Coord. disyuntiva','Subord. sustantiva','Subord. adjetiva','Subord. adverbial'].map(c=>`<button class="class-btn${sel.estructura===c?' sel':''}" onclick="selClass('estructura','${c}')">${c}</button>`).join('')}</div>
    <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Actitud:</div>
    <div class="class-row">${['Enunciativa','Interrogativa','Exclamativa','Imperativa','Desiderativa','Dubitativa'].map(c=>`<button class="class-btn${sel.actitud===c?' sel':''}" onclick="selClass('actitud','${c}')">${c}</button>`).join('')}</div>
    <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Tipo <span style="color:var(--soul-d)">(varios posibles)</span>:</div>
    <div class="class-row">${['Transitiva','Intransitiva','Copulativa','Reflexiva','Recíproca','Impersonal','Pasiva perifrástica','Pasiva refleja'].map(c=>`<button class="class-btn${(sel.tipo||[]).includes(c)?' multi-sel':''}" onclick="toggleClass('${c}')">${c}</button>`).join('')}</div>
  </div>`;
}
function setSintMode(m){S.sintMode=m;S.sintSel=null;sintActiveTag=null;renderAlquimista()}
function selWord(i){S.sintSel=i;if(sintActiveTag){applyTag();return}renderAlquimista()}
function selTag(l){sintActiveTag=l;if(S.sintSel!==null){applyTag();return}renderAlquimista()}
function applyTag(){
  if(S.sintSel===null||!sintActiveTag)return;
  S.sintTags[(S.sintMode==='morfo'?'m':'s')+S.sintSel]=sintActiveTag;
  S.sintSel=null;renderAlquimista();
}
function selClass(k,v){S.sintClassSel[k]=v;renderAlquimista()}
function toggleClass(v){
  if(!S.sintClassSel.tipo)S.sintClassSel.tipo=[];
  const idx=S.sintClassSel.tipo.indexOf(v);
  if(idx>=0)S.sintClassSel.tipo.splice(idx,1);else S.sintClassSel.tipo.push(v);
  renderAlquimista();
}
function resetSint(){S.sintTags={};S.sintClassSel={};S.sintSel=null;sintActiveTag=null;renderAlquimista()}
function checkMorfo(){
  const ej=sintEj;let ok=0;
  ej.s.forEach((_,i)=>{if(S.sintTags['m'+i]===ej.morfo[i])ok++});
  const fb=document.getElementById('sint-fb');fb.style.display='block';
  if(ok===ej.s.length){
    fb.className='sint-fb ok';
    const got=addXp(5);addSoul(15);updHdr();saveUser();
    fb.innerHTML=`✦ ¡Morfología perfecta! +${got} Geo<br><em style="color:rgba(128,224,160,.7)">${ej.tip}</em>`;
    setTimeout(()=>{S.sintMode='sint';renderAlquimista()},1800);
  } else {
    fb.className='sint-fb no';
    const errs=ej.s.map((w,i)=>S.sintTags['m'+i]!==ej.morfo[i]?`<strong>${w}</strong> → ${ej.morfo[i]}`:'').filter(Boolean);
    fb.innerHTML=`◆ ${ok}/${ej.s.length} correctas. Revisa: ${errs.join(' · ')}`;
  }
}
function checkSint(){
  const ej=sintEj;let ok=0;
  ej.s.forEach((_,i)=>{if(S.sintTags['s'+i]===ej.sint[i])ok++});
  const sc=S.sintClassSel;
  const eOk=sc.estructura===ej.clasif.estructura;
  const aOk=sc.actitud===ej.clasif.actitud;
  const sel=sc.tipo||[];
  const tOk=ej.clasif.tipo.every(t=>sel.includes(t))&&sel.every(t=>ej.clasif.tipo.includes(t));
  const fb=document.getElementById('sint-fb');fb.style.display='block';
  if(ok===ej.s.length&&eOk&&aOk&&tOk){
    fb.className='sint-fb ok';
    const got=addXp(15);S.streak++;addSoul(20);
    const rankUp=checkRankUp(S.xp-got);
    fb.innerHTML=`✦ ¡Análisis completo! +${got} Geo${rankUp?'<br>🏆 '+rankUp:''}<br><em style="color:rgba(128,224,160,.7)">${ej.tip}</em>`;
    updHdr();saveUser();document.getElementById('sint-next').style.display='block';
  } else {
    fb.className='sint-fb no';
    const errs=ej.s.map((w,i)=>S.sintTags['s'+i]!==ej.sint[i]?`<strong>${w}</strong>→${ej.sint[i]}`:'').filter(Boolean);
    let msg=`◆ Funciones: ${ok}/${ej.s.length} ✓`;
    if(errs.length)msg+=`<br>Revisa: ${errs.join(', ')}`;
    const wc=[];
    if(!eOk)wc.push(`Estructura: ${ej.clasif.estructura}`);
    if(!aOk)wc.push(`Actitud: ${ej.clasif.actitud}`);
    if(!tOk)wc.push(`Tipo: ${ej.clasif.tipo.join(' + ')}`);
    if(wc.length)msg+=`<br>Clasificación: ${wc.join(' · ')}`;
    fb.innerHTML=msg;
  }
}
function showSintHelp(mode){
  if(mode==='morfo'){
    const opts=MORFO_TAGS.map(t=>({icon:t.label,text:t.name,desc:`${t.def}. Ej: ${t.ej}`,action:()=>{}}));
    showModal('📖 Guía de Categorías Gramaticales',opts.slice(0,6));
  } else {
    const opts=[
      {icon:'👑',text:'Sujeto (SN-Suj)',desc:'Realiza la acción. Pregunta: ¿Quién + verbo?',action:()=>{}},
      {icon:'⚡',text:'Núcleo del Predicado (NP)',desc:'El verbo principal de la oración',action:()=>{}},
      {icon:'🎯',text:'CD — Complemento Directo',desc:'¿Qué + verbo? Sustituye por LO/LA/LOS/LAS',action:()=>{}},
      {icon:'👤',text:'CI — Complemento Indirecto',desc:'¿A quién? Sustituye por LE/LES',action:()=>{}},
      {icon:'📍',text:'CC — Complemento Circunstancial',desc:'¿Dónde? ¿Cuándo? ¿Cómo? ¿Por qué?',action:()=>{}},
      {icon:'⚖️',text:'Atributo',desc:'En copulativas (ser/estar/parecer). Sustituye por LO invariable',action:()=>{}},
    ];
    showModal('📖 Guía de Funciones Sintácticas',opts);
  }
}

// ═══════════════════ SHOP ═══════════════════
let shopTab='amuletos';
function showShop(){
  navTo('n6');renderShop();
}
function renderShop(){
  const allLogros=[...BOSS_REWARDS,...TITULOS];
  const logrosOwned=allLogros.filter(l=>isOwned(l.id));
  let items=shopTab==='amuletos'?AMULETOS:shopTab==='skins'?APARIENCIAS:shopTab==='titulos'?TITULOS:logrosOwned;
  const amu=getEquippedAmu();
  document.getElementById('content').innerHTML=`
  <div class="shop-wrap anim-fadeup">
    <div class="sec-hdr"><span style="font-size:17px">🛍️</span><h2>La Tienda de Iselda</h2></div>
    <div class="shop-geo-bar">
      <div><div class="shop-geo-amt">⬡ ${S.xp}</div><div style="font-size:10px;color:var(--muted);font-family:var(--title);text-transform:uppercase;letter-spacing:1px">Geo disponible</div></div>
      ${amu?`<div style="font-size:12px;color:var(--soul)">${amu.emoji} ${amu.name}</div>`:'<div style="font-size:12px;color:var(--muted);font-style:italic">Sin amuleto</div>'}
    </div>
    <div class="shop-tabs">
      <button class="shop-tab${shopTab==='amuletos'?' active':''}" onclick="shopTab='amuletos';renderShop()">Amuletos</button>
      <button class="shop-tab${shopTab==='skins'?' active':''}" onclick="shopTab='skins';renderShop()">Apariencias</button>
      <button class="shop-tab${shopTab==='titulos'?' active':''}" onclick="shopTab='titulos';renderShop()">Títulos</button>
      <button class="shop-tab${shopTab==='logros'?' active':''}" onclick="shopTab='logros';renderShop()">Logros${logrosOwned.length?` (${logrosOwned.length})`:''}</button>
    </div>
    ${shopTab==='logros'&&!logrosOwned.length?`<div style="text-align:center;padding:30px;color:var(--muted);font-style:italic;font-size:14px">Derrota Jefes y completa el Coliseo<br>para ganar logros ✦</div>`:`
    <div class="shop-grid">
      ${items.map(item=>{
        const owned=isOwned(item.id)||item.price===0;
        const isEq=S.equipped===item.id;
        const isBadgeEq=S.equippedBadge===item.id;
        const isLogro=shopTab==='logros';
        const canAfford=S.xp>=(item.price||0);
        return`<div class="shop-item${owned?' owned':''}${isEq?' equipped-item':''}${isLogro?' logro':''}">
          ${owned?`<span class="shop-item-tag ${isEq||isBadgeEq?'tag-eq':'tag-owned'}">${isEq?'Equipado':isBadgeEq?'Insignia':'✓'}</span>`:''}
          <div class="shop-item-icon">${item.emoji}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc||''}</div>
          ${item.effect?`<div class="shop-item-effect">${item.effect}</div>`:''}
          ${!owned&&item.price?`<div class="shop-price"><span class="shop-price-amt">⬡ ${item.price}</span></div>`:''}
          <div class="shop-equip-row">
            ${owned?(
              item.type==='amuleto'||!item.type?
                `<button class="eq-btn${isEq?' uneq':''}" onclick="equipAmu('${item.id}')">${isEq?'Desequipar':'Equipar'}</button>`
              :item.id&&(item.id.startsWith('boss_')||item.id.startsWith('tit_'))?
                `<button class="eq-btn${isBadgeEq?' uneq':''}" onclick="equipBadge('${item.id}')">${isBadgeEq?'Quitar insignia':'Usar como insignia'}</button>`
              :`<span style="font-size:11px;color:var(--muted);font-style:italic;padding:4px">Equipada automáticamente</span>`
            ):`<button class="buy-btn" onclick="buyItem('${item.id}')" ${!canAfford?'disabled':''}>${!canAfford?`Faltan ${item.price-S.xp} ⬡`:'Comprar ⬡'}</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>`}
  </div>`;
}
function buyItem(id){
  const allItems=[...AMULETOS,...APARIENCIAS,...TITULOS];
  const item=allItems.find(i=>i.id===id);
  if(!item||isOwned(id))return;
  if(S.xp<item.price){toast('Geo insuficiente ⬡');return}
  S.xp-=item.price;S.owned.push(id);
  if(item.type==='amuleto')S.equipped=id;
  updHdr();saveUser();toast(`${item.emoji} ¡${item.name} obtenido!`);renderShop();
}
function equipAmu(id){
  if(!isOwned(id))return;
  S.equipped=S.equipped===id?null:id;
  saveUser();toast(S.equipped===id?`${AMULETOS.find(a=>a.id===id)?.emoji} Equipado`:'Desequipado');renderShop();updHdr();
}
function equipBadge(id){
  S.equippedBadge=S.equippedBadge===id?null:id;
  saveUser();toast(S.equippedBadge?'Insignia equipada ✦':'Insignia retirada');renderShop();updHdr();
}

// ═══════════════════ BOSS ═══════════════════
const BOSSES=[
  {id:0,name:'La Mantis de las Ruinas',emoji:'🦗',unlockXp:50,rewardId:'boss_mantis',
   text:`En las Ruinas Antiguas, una inscripción rezaba: <em>"El viejo maestro llegó tarde al aula, pero su lección permaneció grabada para siempre en la memoria de sus alumnos."</em>`,
   questions:[
     {q:'¿Qué tipo de oración es según la actitud?',opts:['Exclamativa','Enunciativa afirmativa','Dubitativa','Imperativa'],c:1,exp:'Da información sin emoción → ENUNCIATIVA AFIRMATIVA.'},
     {q:'"llegó tarde… pero su lección permaneció" — ¿qué tipo de compuesta?',opts:['Subordinada causal','Simple ampliada','Coordinada adversativa','Coordinada copulativa'],c:2,exp:'PERO = nexo coordinante adversativo → COORDINADA ADVERSATIVA.'},
     {q:'"para siempre" es un…',opts:['CD','CI','CC de Tiempo','CA'],c:2,exp:'"para siempre" → ¿cuándo/cuánto tiempo? → CC de TIEMPO.'},
     {q:'El sujeto de "su lección permaneció" es…',opts:['Las Ruinas','El viejo maestro','Su lección','No tiene sujeto'],c:2,exp:'"Su lección" concuerda con el verbo en 3ª sing. → Sujeto.'},
     {q:'"grabada en la memoria" — ¿qué función tiene?',opts:['Atributo','Complemento Predicativo','CD','CA'],c:1,exp:'"grabada" describe al sujeto con verbo "permaneció" (predicativo) → COMPLEMENTO PREDICATIVO.'},
   ]},
  {id:1,name:'El Coleccionista de Sombras',emoji:'👁️',unlockXp:150,rewardId:'boss_collector',
   text:`El Coleccionista escribió: <em>"Se leen muchos libros en Hallownest, pero pocos recuerdan las palabras del poeta que cantó al vacío cuando la oscuridad lo consumía."</em>`,
   questions:[
     {q:'"Se leen muchos libros" — ¿qué tipo de oración es?',opts:['Impersonal con SE','Activa reflexiva','Pasiva refleja','Activa transitiva'],c:2,exp:'SE + VERBO que concuerda con sujeto (libros, plural) → PASIVA REFLEJA.'},
     {q:'"muchos libros" en "se leen muchos libros" es el…',opts:['CD','Sujeto paciente','CI','CA'],c:1,exp:'En pasiva refleja, el antiguo CD pasa a SUJETO PACIENTE.'},
     {q:'"pero pocos recuerdan…" — ¿qué tipo de proposición coordina?',opts:['Copulativa','Disyuntiva','Adversativa','Yuxtapuesta'],c:2,exp:'PERO = nexo coordinante adversativo → ADVERSATIVA.'},
     {q:'"que cantó al vacío" — ¿qué tipo de subordinada es?',opts:['Sustantiva','Adverbial temporal','Adjetiva de relativo','Adverbial causal'],c:2,exp:'"que cantó" modifica al sustantivo "poeta" → SUBORDINADA ADJETIVA (de relativo).'},
     {q:'"cuando la oscuridad lo consumía" — ¿qué tipo de subordinada?',opts:['Sustantiva','Adverbial temporal','Adjetiva','Adverbial concesiva'],c:1,exp:'"cuando" → SUBORDINADA ADVERBIAL TEMPORAL.'},
   ]},
  {id:2,name:'Radiance, la Diosa de la Luz',emoji:'☀️',unlockXp:300,rewardId:'boss_radiance',
   text:`El texto sagrado decía: <em>"Ojalá los habitantes del reino recuerden que la luz verdadera no se apaga nunca, aunque la oscuridad la rodee. El poeta que escribió estas palabras murió olvidado, pero su obra fue estudiada por generaciones que buscaban la verdad."</em>`,
   questions:[
     {q:'"Ojalá los habitantes recuerden…" — ¿actitud?',opts:['Enunciativa','Imperativa','Desiderativa','Exclamativa'],c:2,exp:'OJALÁ → DESIDERATIVA: expresa deseo del hablante.'},
     {q:'"que la luz verdadera no se apaga nunca" — ¿tipo de subordinada?',opts:['Adjetiva','Sustantiva (CD)','Adverbial causal','Adverbial concesiva'],c:1,exp:'Funciona como CD de "recuerden" → SUBORDINADA SUSTANTIVA.'},
     {q:'"aunque la oscuridad la rodee" — ¿tipo de subordinada?',opts:['Causal','Adversativa coordinada','Concesiva','Condicional'],c:2,exp:'"aunque" → SUBORDINADA ADVERBIAL CONCESIVA.'},
     {q:'"fue estudiada por generaciones" — ¿qué tipo de oración?',opts:['Activa transitiva','Impersonal con SE','Pasiva refleja','Pasiva perifrástica'],c:3,exp:'SER + PARTICIPIO → PASIVA PERIFRÁSTICA. "por generaciones" = C. Agente.'},
     {q:'"que buscaban la verdad" — ¿a qué modifica?',opts:['Al verbo "estudiada"','A "poeta"','A "generaciones"','A "obra"'],c:2,exp:'"que buscaban la verdad" modifica al sustantivo "generaciones" → SUBORDINADA ADJETIVA.'},
     {q:'¿Cuál es el sujeto de "su obra fue estudiada"?',opts:['Por generaciones','El poeta','Su obra','Generaciones que buscaban'],c:2,exp:'"Su obra" es el sujeto paciente de la pasiva perifrástica.'},
   ]},
];
let bossState={qi:0,score:0,masks:3,boss:null,answered:false,sel:null};

function showBossMenu(){
  navTo('n5');
  document.getElementById('content').innerHTML=`
  <div class="boss-wrap anim-fadeup">
    <div class="sec-hdr"><span style="font-size:18px">💀</span><h2>Jefes Finales</h2></div>
    <p class="sec-intro">Analiza textos para ganar Insignias Legendarias.</p>
    ${BOSSES.map(b=>{
      const defeated=isOwned(b.rewardId);
      const locked=S.xp<b.unlockXp;
      const reward=BOSS_REWARDS.find(r=>r.id===b.rewardId);
      return`<div class="boss-card${defeated?' defeated':''}${locked?' locked':''}" onclick="${locked?`toast('Necesitas ${b.unlockXp} Geo para este Jefe ⬡')`:defeated?'':'startBoss('+b.id+')'}">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:34px">${b.emoji}</span>
          <div style="flex:1">
            <div class="boss-name">${b.name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:3px">${b.questions.length} preguntas · Recompensa: ${reward?.emoji} ${reward?.name}</div>
            ${defeated?`<div style="font-size:11px;color:var(--green);margin-top:3px;font-family:var(--title)">✓ DERROTADO</div>`:locked?`<div style="font-size:11px;color:var(--gold-d);margin-top:3px;font-family:var(--title)">🔒 Necesitas ${b.unlockXp} Geo (tienes ${S.xp})</div>`:''}
          </div>
        </div>
        ${!defeated&&!locked?`<div class="boss-hp-wrap" style="margin-top:8px"><div class="boss-hp-bar" style="width:100%"></div></div>`:''}
      </div>`;
    }).join('')}
  </div>`;
}
function startBoss(id){
  const boss=BOSSES.find(b=>b.id===id);if(!boss)return;
  bossState={qi:0,score:0,masks:3,boss:boss,answered:false,sel:null};
  renderBossQ();
}
function renderBossQ(){
  const b=bossState.boss;
  if(bossState.qi>=b.questions.length){endBoss();return}
  const q=b.questions[bossState.qi];
  const hpPct=((b.questions.length-bossState.qi)/b.questions.length)*100;
  const lets=['A','B','C','D'];
  document.getElementById('content').innerHTML=`
  <div class="qwrap">
    <div style="background:var(--panel);border:1px solid var(--red-d);border-radius:var(--r);padding:12px;margin-bottom:12px;position:relative">
      <div class="boss-name" style="font-size:13px">${b.emoji} ${b.name}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">◆ ${bossState.masks} vida${bossState.masks!==1?'s':''}</div>
      <div class="boss-hp-wrap"><div class="boss-hp-bar" id="bossHp" style="width:${hpPct}%"></div></div>
    </div>
    <div class="boss-text-box">${b.text}</div>
    <div class="qcard">
      <span class="qcat">Jefe · ${bossState.qi+1}/${b.questions.length}</span>
      <div class="qtext">${q.q}</div>
    </div>
    <div class="opts">
      ${q.opts.map((o,i)=>`<button class="opt" id="o${i}" onclick="selBossOpt(${i})"><span class="oletter">${lets[i]}</span>${o}</button>`).join('')}
    </div>
    <button class="vbtn" id="vbtn" onclick="verifyBoss()">Confirmar</button>
  </div>`;
  bossState.answered=false;bossState.sel=null;
}
function selBossOpt(i){
  if(bossState.answered)return;
  document.querySelectorAll('.opt').forEach(b=>b.classList.remove('sel'));
  document.getElementById('o'+i).classList.add('sel');
  bossState.sel=i;document.getElementById('vbtn').classList.add('ready');
}
function verifyBoss(){
  if(bossState.sel===null||bossState.answered)return;
  bossState.answered=true;
  const q=bossState.boss.questions[bossState.qi];const ok=bossState.sel===q.c;
  document.querySelectorAll('.opt').forEach((b,i)=>{
    b.disabled=true;
    if(i===q.c){b.classList.add('correct');b.classList.remove('sel')}
    else if(i===bossState.sel&&!ok){b.classList.add('wrong');b.classList.remove('sel')}
  });
  const vb=document.getElementById('vbtn');vb.classList.remove('ready');
  vb.classList.add(ok?'ok':'no');vb.textContent=ok?'✦ ¡Golpe!':'◆ Fallo';
  if(ok){bossState.score++;addXp(8);addSoul(10);updHdr();}
  else{bossState.masks--;if(bossState.masks<=0){setTimeout(()=>{hideFP();bossFailed()},1800);return}}
  // Use boss-specific feedback (not shared fpanel, render inline)
  showBossFP(ok,q.exp);
}
function showBossFP(ok,exp){
  const fp=document.getElementById('fpanel');
  fp.className='fpanel '+(ok?'ok':'no');
  document.getElementById('ficon').textContent=ok?'⚔️':'💀';
  document.getElementById('ftitle').textContent=ok?'¡Golpe al Jefe!':'¡Fallo!';
  document.getElementById('fexp').textContent=exp;
  const nb=document.getElementById('fnext');
  nb.textContent=bossState.qi+1>=bossState.boss.questions.length?'✦ Resolver':'Siguiente ▸';
  nb.onclick=()=>{hideFP();bossState.qi++;bossState.answered=false;bossState.sel=null;renderBossQ()};
  fp.style.display='flex';
}
function bossFailed(){
  document.getElementById('content').innerHTML=`
  <div class="qend">
    <div style="font-size:72px">💀</div>
    <h2>Derrotado</h2>
    <p style="color:var(--muted);font-size:14px">Vuelve a estudiar y regresa más fuerte.</p>
    <div class="xp-box"><div class="xp-box-lbl">Respuestas correctas</div><div class="xp-box-val">${bossState.score}/${bossState.boss.questions.length}</div></div>
    <button class="gbtn" onclick="startBoss(${bossState.boss.id})" style="max-width:260px">↺ Reintentar</button>
    <button class="gbtn red" onclick="showBossMenu()" style="max-width:260px">← Volver a Jefes</button>
  </div>`;
}
function endBoss(){
  hideFP();
  const b=bossState.boss;const reward=BOSS_REWARDS.find(r=>r.id===b.rewardId);
  const alreadyOwned=isOwned(b.rewardId);
  if(!alreadyOwned){S.owned.push(b.rewardId);addXp(50);addSoul(30);updHdr();saveUser();}
  document.getElementById('content').innerHTML=`
  <div class="qend">
    <div style="font-size:72px;animation:pop .7s ease">${b.emoji}</div>
    <h2>¡${b.name}<br>Derrotado!</h2>
    <div><div class="score-big">${bossState.score}/${b.questions.length}</div><div class="score-lbl">respuestas correctas</div></div>
    ${!alreadyOwned?`<div class="reward-unlock">${reward?.emoji} ¡Insignia desbloqueada: <strong>${reward?.name}</strong>!<br><span style="font-size:12px;color:var(--muted)">Equípala en Iselda → Logros</span></div>`:''}
    <div class="xp-box"><div class="xp-box-lbl">Total</div><div class="xp-box-val">⬡ ${S.xp} Geo · ${getRank().name}</div></div>
    <button class="gbtn" onclick="showShop();shopTab='logros';renderShop()" style="max-width:280px">🛍️ Ver mis Logros</button>
    <button class="gbtn soul" onclick="showBossMenu()" style="max-width:280px">← Volver a Jefes</button>
    <button class="gbtn red" onclick="showHome()" style="max-width:280px">🗺️ Al Mapa</button>
  </div>`;
}

// ═══════════════════ GRAMMAR ARCHIVES ═══════════════════
const GRAM=[
{icon:'💬',title:'Tipos por la Actitud del Hablante',color:'#C9A84C',html:`
<p class="gdesc">Según la intención del hablante al emitir la oración:</p>
<table class="gtbl"><thead><tr><th>Tipo</th><th>Característica clave</th><th>Ejemplo</th></tr></thead><tbody>
<tr><td><span class="gb gp">Enunciativa</span></td><td>Da información (afirm. o negativa)</td><td>Hoy hace sol / No llueve</td></tr>
<tr><td><span class="gb gbl">Interrogativa</span></td><td>Directa (¿?) / Indirecta (sin signos)</td><td>¿Vienes? / Preguntó si venías</td></tr>
<tr><td><span class="gb gy">Exclamativa</span></td><td>Emoción: ¡! + qué, cuánto, cómo…</td><td>¡Qué calor hace!</td></tr>
<tr><td><span class="gb gr">Imperativa</span></td><td>Orden o ruego. Verbo en imperativo</td><td>¡Ven aquí! / Siéntate, por favor</td></tr>
<tr><td><span class="gb gpk">Desiderativa</span></td><td>Deseo. Clave: <strong>ojalá</strong>, que + subj.</td><td>Ojalá apruebe / Que te mejores</td></tr>
<tr><td><span class="gb go">Dubitativa</span></td><td>Duda. Clave: <strong>quizás, tal vez</strong></td><td>Quizás llegue tarde</td></tr>
</tbody></table>
<div class="gtip">✦ OJALÁ → desiderativa siempre. QUIZÁS/TAL VEZ → dubitativa siempre. ¡Las más confundidas!</div>`},
{icon:'⚖️',title:'Copulativas vs Predicativas',color:'#76D7EA',html:`
<p class="gdesc">Según el tipo de predicado:</p>
<div class="gtip">✦ Verbos copulativos: solo <strong>SER · ESTAR · PARECER</strong></div>
<table class="gtbl" style="margin-top:10px"><thead><tr><th>Tipo</th><th>Estructura</th><th>Truco</th></tr></thead><tbody>
<tr><td><span class="gb gbl">Copulativa</span></td><td>SER/ESTAR/PARECER + atributo</td><td>Atributo → sustituye por LO invariable</td></tr>
<tr><td><span class="gb gg">Predicativa</span></td><td>Verbo predicativo + complementos</td><td>El LO no funciona como atributo</td></tr>
</tbody></table>
<div class="gex">📝 "El niño está cansado" → "LO está" ✓ → copulativa<br>"El niño come pizza" → "LO come" ≠ atributo → predicativa</div>
<div class="gtip">⚠️ Verbos semicopulativos (andar, quedarse, volverse…): se comportan como copulativos pero el atributo NO se sustituye por LO.</div>`},
{icon:'🔁',title:'Tipos de Oraciones Predicativas',color:'#4DA864',html:`
<p class="gdesc">Según cómo actúa el verbo predicativo:</p>
<table class="gtbl"><thead><tr><th>Tipo</th><th>Características</th><th>Ejemplo</th></tr></thead><tbody>
<tr><td><span class="gb gg">Transitiva</span></td><td>Tiene CD (lo/la/los/las ✓)</td><td>"Comió una pizza" → La comió ✓</td></tr>
<tr><td><span class="gb gbl">Intransitiva</span></td><td>Sin CD posible</td><td>"Duerme profundamente"</td></tr>
<tr><td><span class="gb gy">Reflexiva</span></td><td>Sujeto = actor y receptor</td><td>"Se peina" (a sí misma)</td></tr>
<tr><td><span class="gb gpk">Recíproca</span></td><td>Varios sujetos, acción mutua</td><td>"Se quieren" (mutuamente ✓)</td></tr>
<tr><td><span class="gb go">Impersonal</span></td><td>Sin sujeto posible</td><td>"Llueve" / "Hay gente" / "Se vive bien"</td></tr>
</tbody></table>
<div class="gtip">✦ CD: "¿Qué + V?" → Si responde → TRANSITIVA. Sustituye por LO/LA para confirmar.<br>✦ Recíproca: añade "mutuamente" → si tiene sentido → RECÍPROCA.</div>`},
{icon:'🔄',title:'La Voz: Activa y Pasiva',color:'#9B7FD4',html:`
<p class="gdesc">La VOZ indica si el sujeto realiza (activa) o recibe (pasiva) la acción.</p>
<table class="gtbl"><thead><tr><th>Voz</th><th>Estructura</th><th>Ejemplo</th></tr></thead><tbody>
<tr><td><span class="gb gg">Activa</span></td><td>Sujeto agente + Verbo activo</td><td>"Ana escribió la carta"</td></tr>
<tr><td><span class="gb gp">Perifrástica</span></td><td>SER + Participio + (POR + CA)</td><td>"La carta fue escrita por Ana"</td></tr>
<tr><td><span class="gb gbl">Refleja</span></td><td>SE + V (concuerda con sujeto)</td><td>"Se venden pisos"</td></tr>
</tbody></table>
<div class="gex">📝 Transformar activa → pasiva:<br>"El médico curó al paciente"<br>→ "El paciente fue curado por el médico"<br>CD → Sujeto paciente · Sujeto → CA (por…)</div>
<div class="gtip">✦ Sujeto paciente = quien RECIBE la acción.<br>✦ C. Agente = quien la REALIZA, siempre con POR.</div>`},
{icon:'🎭',title:'Usos del SE',color:'#607D8B',html:`
<p class="gdesc">El SE tiene cuatro usos distintos. ¡Clave en examen!</p>
<table class="gtbl"><thead><tr><th>Uso</th><th>Cómo reconocerlo</th><th>Ejemplo</th></tr></thead><tbody>
<tr><td><span class="gb gp">Reflexivo</span></td><td>Sujeto conocido. Acción sobre sí mismo</td><td>"María se peina"</td></tr>
<tr><td><span class="gb gpk">Recíproco</span></td><td>Sujeto plural. Añade "mutuamente" ✓</td><td>"Se abrazan (mutuamente)"</td></tr>
<tr><td><span class="gb gbl">Pasiva refleja</span></td><td>Verbo concuerda con un sust. (sujeto)</td><td>"Se venden pisos" (pisos=sujeto)</td></tr>
<tr><td><span class="gb go">Impersonal</span></td><td>Verbo 3ª sing. Sin sujeto posible</td><td>"Se investiga mucho"</td></tr>
</tbody></table>
<div class="gex">📝 Clave: ¿Hay sujeto gramatical?<br>→ SÍ = reflexivo / recíproco / refleja<br>→ NO = impersonal</div>
<div class="gtip">✦ "Se venden pisos" (refleja, pisos=sujeto) ≠ "Se vive bien" (impersonal, sin sujeto).</div>`},
{icon:'❄️',title:'Oraciones Impersonales — 4 Tipos',color:'#60CCB8',html:`
<p class="gdesc">Sin sujeto posible. Cuatro tipos que debes dominar:</p>
<table class="gtbl"><thead><tr><th>Tipo</th><th>Estructura</th><th>Ejemplos</th></tr></thead><tbody>
<tr><td><span class="gb gbl">Meteorológicas</span></td><td>Verbo meteorológico solo</td><td>Llueve, Nieva, Graniza, Llovizna</td></tr>
<tr><td><span class="gb gg">Con HABER</span></td><td>Haber + SN (3ª sing. siempre)</td><td>Hay problemas, Había gente</td></tr>
<tr><td><span class="gb gy">Con SE</span></td><td>SE + V (3ª pers., sin sujeto)</td><td>Se vive bien, Se trabaja mucho</td></tr>
<tr><td><span class="gb gp">Con HACER/SER</span></td><td>Hace frío/calor / Es tarde/pronto</td><td>Hace buen tiempo, Son las tres</td></tr>
</tbody></table>
<div class="gtip">✦ "Había mucha gente" → HABER impersonal. "gente" es complemento, NO sujeto.<br>✦ No confundas: "Se vive bien" (impersonal) vs "Se venden pisos" (pasiva refleja, sujeto=pisos).</div>`},
{icon:'🔗',title:'Oraciones por la Estructura',color:'#E2CA70',html:`
<p class="gdesc">Según el número de verbos conjugados y la relación entre proposiciones:</p>
<table class="gtbl"><thead><tr><th>Tipo</th><th>Nexos</th><th>Ejemplo</th></tr></thead><tbody>
<tr><td><span class="gb gy">Simple</span></td><td>1 solo verbo conjugado</td><td>"El gato duerme."</td></tr>
<tr><td><span class="gb gg">Coord. Copulativa</span></td><td>y, ni, e</td><td>"Canta y baila."</td></tr>
<tr><td><span class="gb gr">Coord. Adversativa</span></td><td>pero, sino, mas, aunque</td><td>"Estudia pero no aprueba."</td></tr>
<tr><td><span class="gb gbl">Coord. Disyuntiva</span></td><td>o, u, o bien</td><td>"¿Vienes o te quedas?"</td></tr>
<tr><td><span class="gb gpk">Subord. Sustantiva</span></td><td>que, si, interrogativas</td><td>"Sé que vendrá."</td></tr>
<tr><td><span class="gb go">Subord. Adjetiva</span></td><td>que, quien, donde, cuyo</td><td>"El libro que leí."</td></tr>
<tr><td><span class="gb gt">Subord. Adv. Temporal</span></td><td>cuando, mientras, antes de que</td><td>"Llámame cuando llegues."</td></tr>
<tr><td><span class="gb gp">Subord. Adv. Causal</span></td><td>porque, ya que, puesto que</td><td>"Faltó porque estaba enfermo."</td></tr>
<tr><td><span class="gb gy">Subord. Adv. Final</span></td><td>para que, a fin de que</td><td>"Estudia para que aprendas."</td></tr>
<tr><td><span class="gb gbl">Subord. Adv. Concesiva</span></td><td>aunque, a pesar de que</td><td>"Vino aunque llovía."</td></tr>
<tr><td><span class="gb gr">Subord. Adv. Condicional</span></td><td>si, con tal de que, siempre que</td><td>"Si estudias, aprobarás."</td></tr>
</tbody></table>
<div class="gtip">✦ Cuenta verbos conjugados: 1 = simple; 2+ = compuesta.<br>✦ PERO = adversativa · QUE (tras verbo de lengua/pensamiento) = sustantiva · QUE (tras sustantivo) = adjetiva.</div>`},
{icon:'🎯',title:'Los Complementos Verbales',color:'#E09050',html:`
<p class="gdesc">Complementos del predicado verbal — resumen esencial:</p>
<table class="gtbl"><thead><tr><th>Comp.</th><th>Pregunta clave</th><th>Sustitución</th><th>Ejemplo</th></tr></thead><tbody>
<tr><td><span class="gb gg">CD</span></td><td>¿Qué + V?</td><td>lo/la/los/las</td><td>"Comió una pizza" → La comió</td></tr>
<tr><td><span class="gb gbl">CI</span></td><td>¿A quién? ¿Para quién?</td><td>le/les</td><td>"Dio flores a Ana" → Le dio</td></tr>
<tr><td><span class="gb gy">CC</span></td><td>¿Dónde? ¿Cuándo? ¿Cómo?…</td><td>—</td><td>"Llegó ayer en coche"</td></tr>
<tr><td><span class="gb gp">Atr.</span></td><td>Solo en copulativas</td><td>lo (invariable)</td><td>"Está cansado" → LO está ✓</td></tr>
<tr><td><span class="gb gpk">CPred.</span></td><td>Adj. con V. predicativo</td><td>—</td><td>"Llegó cansado"</td></tr>
<tr><td><span class="gb gr">CA</span></td><td>¿Por quién? (solo en pasiva)</td><td>por + SN</td><td>"Escrito por Cervantes"</td></tr>
<tr><td><span class="gb gt">CR</span></td><td>Preposición fija + SN</td><td>—</td><td>"Confía en ti"</td></tr>
</tbody></table>
<div class="gex">📝 "Pepe regaló [flores]CD [a su madre]CI [el lunes]CC [con cariño]CC"</div>
<div class="gtip">✦ ORDEN: 1º identifica CD (lo/la) → 2º CI (le/les) → 3º CC (dónde/cuándo/cómo)<br>✦ Si no hay CD → predicativa intransitiva. Si hay → transitiva.</div>`},
];
function showGram(){
  navTo('n1');
  let h=`<div class="sec-hdr"><span style="font-size:17px">📜</span><h2>Archivos de Hallownest</h2></div>
  <p class="sec-intro">Teoría completa con ejemplos. Empieza aquí antes de practicar.</p>
  <div class="gram-list">`;
  GRAM.forEach((g,i)=>{
    h+=`<div class="gsec" id="gs${i}">
      <div class="ghdr" onclick="toggleG(${i})" style="border-left:3px solid ${g.color}">
        <span class="gicon">${g.icon}</span><span class="gtitle">${g.title}</span><span class="garrow">▾</span>
      </div>
      <div class="gbody"><div class="gcontent">${g.html}</div></div>
    </div>`;
  });
  document.getElementById('content').innerHTML=h+'</div>';
}
function toggleG(i){document.getElementById('gs'+i).classList.toggle('open')}

// ═══════════════════ INIT ═══════════════════
loadDB();
window.addEventListener('beforeunload',saveUser);
showLogin();
