import {THEMES,PALETTES,TRACKS,DEFAULT,escapeHTML as E,formatDate,slug,normalizeProject,musicSource,buildInvitation} from './invitation.js';

const icons={
  palette:'<circle cx="12" cy="12" r="9"/><path d="M12 3c-5 0-9 4-9 9s4 9 9 9h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 1-2.8h2a4 4 0 0 0 4-4c0-4.5-4-7.5-9-7.5"/><path d="M7 10h.01M10 7h.01M15 7h.01M17 10h.01" stroke-width="2.5"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  music:'<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4M18 4h4M3 18v4M1 20h4"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
  'arrow-right':'<path d="M4 12h15m-5-5 5 5-5 5"/>',
  monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  smartphone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  rotate:'<path d="M20 7v5h-5M4 17v-5h5M6.1 6.1a8 8 0 0 1 13.4 3.4M4.5 14.5a8 8 0 0 0 13.4 3.4"/>',
  mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  'shield-check':'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  chevron:'<path d="m7 10 5 5 5-5"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  play:'<path d="m9 5 10 7-10 7V5Z"/>',
  pause:'<path d="M9 5v14M16 5v14"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  file:'<path d="M14 2H5v20h14V7l-5-5Z"/><path d="M14 2v6h5M8 13h8M8 17h6"/>',
  volume:'<path d="m11 5-6 4H2v6h3l6 4V5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.sparkles}</svg>`;
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
const STEPS=[
  {id:'theme',name:'Tema',icon:'palette',title:'Pilih suasana kalian',description:'Awal yang indah untuk cerita selamanya.'},
  {id:'details',name:'Detail',icon:'heart',title:'Tuliskan cerita kalian',description:'Detail personal yang membuatnya berarti.'},
  {id:'photos',name:'Foto',icon:'image',title:'Kenangan dalam gambar',description:'Biarkan foto kalian bercerita.'},
  {id:'music',name:'Musik',icon:'music',title:'Nada untuk selamanya',description:'Satu lagu, begitu banyak kenangan.'},
  {id:'animation',name:'Animasi',icon:'sparkles',title:'Hidupkan setiap momen',description:'Gerakan lembut, kesan yang tak terlupakan.'}
];
let state=structuredClone(DEFAULT),activeStep='theme',themeFilter='all',collectionFilter='all',detailsTab='couple',device='desktop';
let db=null,saveTimer,previewTimer,toastTimer,persistPromise=Promise.resolve(),trackAudio=null,playingTrack=null,dirty=false,revision=0;
const panel=document.getElementById('panel-content'),frame=document.getElementById('invitation-frame'),dialog=document.getElementById('app-dialog');

function toast(message){clearTimeout(toastTimer);const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');toastTimer=setTimeout(()=>el.classList.remove('visible'),4200);}
function saveStatus(text,ok=true){const el=document.getElementById('save-status');el.innerHTML=`<span style="background:${ok?'#799076':'#b29261'}"></span> ${E(text)}`;}
async function openDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open('everafter-studio',1);request.onupgradeneeded=()=>request.result.createObjectStore('projects');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function readProject(){return new Promise((resolve,reject)=>{const request=db.transaction('projects','readonly').objectStore('projects').get('current');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function writeProject(snapshot){return new Promise((resolve,reject)=>{const transaction=db.transaction('projects','readwrite');transaction.objectStore('projects').put(snapshot,'current');transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);});}
function persist(){clearTimeout(saveTimer);if(!db){saveStatus('Mode sesi — simpan cadangan',false);return Promise.resolve(false);}const snapshot=structuredClone(state),savedRevision=revision;persistPromise=persistPromise.catch(()=>{}).then(()=>writeProject(snapshot)).then(()=>{if(revision===savedRevision){dirty=false;saveStatus('Disimpan di perangkat');}return true;}).catch(()=>{saveStatus('Penyimpanan penuh — simpan cadangan',false);return false;});return persistPromise;}
function queueSave(){revision++;dirty=true;saveStatus('Menyimpan…');clearTimeout(saveTimer);saveTimer=setTimeout(persist,550);}
function update(changes,{panelRefresh=false,immediate=false}={}){state={...state,...changes};queueSave();if(panelRefresh)renderPanel();if(immediate)renderPreview();else{clearTimeout(previewTimer);previewTimer=setTimeout(renderPreview,280);}}
function stopTrack(){if(trackAudio){trackAudio.pause();trackAudio.src='';trackAudio=null;}playingTrack=null;document.querySelectorAll('[data-play-track]').forEach(b=>{b.innerHTML=icon('play');b.setAttribute('aria-label','Dengarkan '+b.dataset.trackName);});}
function pauseFrame(){frame.contentWindow?.postMessage({type:'everafter:pause'},'*');}
function renderRail(){document.getElementById('rail-tools').innerHTML=STEPS.map(s=>`<button class="rail-button ${s.id===activeStep?'active':''}" data-step="${s.id}" ${s.id===activeStep?'aria-current="step"':''}>${icon(s.icon)}<span>${s.name}</span></button>`).join('');}
function selectStep(step){if(!STEPS.some(s=>s.id===step))return;showStudio();if(step!==activeStep)stopTrack();activeStep=step;renderRail();renderPanel();panel.scrollTop=0;if(innerWidth<=650)document.querySelector('.editor-panel').scrollIntoView({behavior:'smooth',block:'start'});}
function miniTheme(t,selected=false){return `<div class="theme-art ${t.id}" style="--card-bg:${t.bg};--card-ink:${t.ink}"><span class="mini-eyebrow">THE WEDDING OF</span><span class="mini-names">${E(state.nickname1||'Nadia')}<br><em>&amp;</em><br>${E(state.nickname2||'Arya')}</span><span class="mini-date">${E(formatDate(state.date).toUpperCase())}</span>${t.id==='botanical'||t.id==='romantic'?'<span class="mini-flower">❧</span><span class="mini-flower second">❧</span>':''}</div><div class="theme-meta"><span>${t.name}</span>${t.tag?`<span class="theme-tag">${t.tag}</span>`:''}</div><span class="theme-caption">${t.caption}</span>`;}
const selectField=(key,options)=>`<div class="select-wrap"><select class="styled-select" data-field="${key}" aria-label="${key==='font'?'Tipografi':'Zona waktu'}">${options.map(([val,label])=>`<option value="${val}" ${state[key]===val?'selected':''}>${label}</option>`).join('')}</select><span data-icon="chevron"></span></div>`;
const field=(key,label,type='text',extras='')=>`<div class="form-group"><label for="field-${key}">${label}</label><input id="field-${key}" class="field" data-field="${key}" type="${type}" value="${E(state[key])}" ${type==='text'&&!extras.includes('maxlength')?'maxlength="150"':''} ${extras}></div>`;
const textarea=(key,label,rows=4,max=3000)=>`<div class="form-group"><label for="field-${key}">${label}</label><textarea id="field-${key}" class="field" data-field="${key}" rows="${rows}" maxlength="${max}">${E(state[key])}</textarea></div>`;
const toggle=(key,label,description='')=>`<div class="toggle-row"><div><strong>${label}</strong>${description?`<p>${description}</p>`:''}</div><label class="toggle"><input type="checkbox" data-field="${key}" ${state[key]?'checked':''} aria-label="${label}"><span></span></label></div>`;

function renderPanel(){
  const step=STEPS.find(s=>s.id===activeStep);document.getElementById('step-number').textContent=`LANGKAH 0${STEPS.indexOf(step)+1} / 05`;document.getElementById('panel-title').textContent=step.title;document.getElementById('panel-description').textContent=step.description;
  if(activeStep==='theme'){
    const filtered=THEMES.filter(t=>themeFilter==='all'||t.category===themeFilter);
    panel.innerHTML=`<div class="segmented" role="group" aria-label="Kategori tema">${[['all','Semua'],['natural','Natural'],['minimal','Minimalis']].map(([v,n])=>`<button data-theme-filter="${v}" class="${themeFilter===v?'active':''}" aria-pressed="${themeFilter===v}">${n}</button>`).join('')}</div><div class="theme-grid">${filtered.map(t=>`<button class="theme-card ${state.theme===t.id?'selected':''}" data-theme="${t.id}" aria-pressed="${state.theme===t.id}">${miniTheme(t,state.theme===t.id)}</button>`).join('')}</div><hr class="panel-divider"><div class="section-label"><span>Palet warna</span><small>Sesuaikan dengan gayamu</small></div><div class="swatches">${PALETTES.map(p=>`<button class="swatch ${state.accent===p.color?'selected':''}" data-color="${p.color}" style="--swatch:${p.color}" aria-label="${p.name}" aria-pressed="${state.accent===p.color}" title="${p.name}"></button>`).join('')}<label class="custom-color" title="Pilih warna sendiri">+<input type="color" data-field="accent" value="${state.accent}" aria-label="Warna pilihan sendiri"></label></div><p class="small-note" id="color-label">${E(PALETTES.find(p=>p.color===state.accent)?.name||'Warna pilihan kalian')}</p><hr class="panel-divider"><label class="field-label" for="font-select">Sentuhan tipografi</label><div class="select-wrap"><select class="styled-select" id="font-select" data-field="font"><option value="cormorant" ${state.font==='cormorant'?'selected':''}>Cormorant — romantis & elegan</option><option value="georgia" ${state.font==='georgia'?'selected':''}>Georgia — klasik & abadi</option><option value="sans" ${state.font==='sans'?'selected':''}>DM Sans — modern & sederhana</option></select><span data-icon="chevron"></span></div><div class="soft-tip"><span data-icon="sparkles"></span><span>Ini baru permulaan. Semua tema bisa kalian ubah sesuai cerita dan kepribadian kalian.</span></div>`;
  }else if(activeStep==='details'){
    let content='';
    if(detailsTab==='couple')content=`<div class="section-label">PASANGAN PERTAMA <small>Sang pemilik separuh hati</small></div>${field('partner1','Nama lengkap')}${field('nickname1','Nama panggilan','text','maxlength="25"')}${field('parents1','Nama orang tua / keterangan')}<hr class="panel-divider"><div class="section-label">PASANGAN KEDUA <small>Sang pelengkap cerita</small></div>${field('partner2','Nama lengkap')}${field('nickname2','Nama panggilan','text','maxlength="25"')}${field('parents2','Nama orang tua / keterangan')}<button class="button button-primary button-block" data-details-tab="event">Lanjut ke detail acara ${icon('arrow-right')}</button>`;
    if(detailsTab==='event')content=`${field('ceremony','Nama acara')}${field('date','Tanggal pernikahan','date','min="2020-01-01" max="2100-12-31"')}<div class="form-row">${field('time','Mulai','time')}${field('endTime','Selesai','time')}</div><div class="form-group"><label>Zona waktu</label>${selectField('zone',[['WIB','WIB — Indonesia Barat'],['WITA','WITA — Indonesia Tengah'],['WIT','WIT — Indonesia Timur']])}</div>${field('venue','Nama tempat')}${textarea('address','Alamat lengkap',3,500)}<hr class="panel-divider">${field('phone','WhatsApp penerima RSVP','tel','placeholder="Contoh: 081234567890" inputmode="tel" maxlength="18"')}<p class="field-help">Isi nomor WhatsApp kalian untuk menampilkan konfirmasi kehadiran. Pesan tamu akan dikirim lewat WhatsApp. Kosongkan jika tidak diperlukan.</p><hr class="panel-divider">${toggle('showCountdown','Hitung mundur','Hitung setiap momen menuju hari istimewa.')}`;
    if(detailsTab==='story')content=`${textarea('greeting','Kalimat pembuka',4,1000)}${field('quote','Kutipan di sampul')}${toggle('showStory','Tampilkan kisah cinta','Bagikan perjalanan kecil menuju selamanya.')}<hr class="panel-divider">${field('storyTitle','Judul cerita')}${textarea('story','Cerita kalian',8)}<p class="small-note">Setiap kisah punya keindahannya sendiri. Tulis dengan kata-kata kalian.</p>`;
    panel.innerHTML=`<div class="details-tabs" role="group" aria-label="Detail undangan">${[['couple','Pasangan'],['event','Acara'],['story','Cerita']].map(([v,n])=>`<button data-details-tab="${v}" class="${detailsTab===v?'active':''}" aria-pressed="${detailsTab===v}">${n}</button>`).join('')}</div>${content}`;
  }else if(activeStep==='photos'){
    panel.innerHTML=`<div class="section-label">Foto sampul <small>Kesan pertama yang indah</small></div><button class="cover-upload" data-action="upload-cover"><img src="${E(state.cover)}" alt="Foto sampul saat ini" style="object-position:${state.coverPosition}% center"><span class="cover-overlay">${icon('image')} Ganti foto sampul</span></button><div class="cover-controls"><label for="cover-position">Posisi foto</label><input id="cover-position" data-field="coverPosition" type="range" min="0" max="100" value="${state.coverPosition}" aria-label="Posisi foto sampul"></div><hr class="panel-divider">${toggle('showGallery','Galeri kenangan','Simpan potongan momen favorit kalian.')}<div class="section-label"><span>Foto galeri</span><small>${state.gallery.length} / 6 foto</small></div><button class="upload-zone" data-action="upload-gallery" data-drop="gallery">${icon('upload')}<strong>Klik atau letakkan foto di sini</strong><small>JPG, PNG, WebP · maksimal 12 MB / foto</small></button><div class="gallery-grid">${state.gallery.map((src,i)=>`<div class="gallery-item"><img src="${E(src)}" alt="Foto galeri ${i+1}"><button data-remove-photo="${i}" aria-label="Hapus foto galeri ${i+1}">${icon('close')}</button></div>`).join('')}</div><div class="soft-tip">${icon('image')}<span>Foto akan dioptimalkan agar undangan tetap ringan. Gunakan foto vertikal untuk sampul terbaik.</span></div>`;
  }else if(activeStep==='music'){
    const tracks=[...TRACKS,...(state.customMusic?[{id:'custom',name:state.customMusicName||'Lagu pilihan kalian',description:'Musik unggahan pribadi',src:state.customMusic}]:[])];
    panel.innerHTML=`${toggle('musicEnabled','Musik latar','Mengalun saat tamu membuka undangan.')}<hr class="panel-divider"><div class="section-label">Pilih alunan kalian <small>Instrumental original</small></div><div class="track-list">${tracks.map(t=>`<div class="track-card ${state.music===t.id?'selected':''}"><button class="track-play" data-play-track="${t.id}" data-track-name="${E(t.name)}" aria-label="${playingTrack===t.id?'Jeda':'Dengarkan'} ${E(t.name)}">${icon(playingTrack===t.id?'pause':'play')}</button><div class="track-info"><p class="track-title">${E(t.name)}</p><p class="track-sub">${t.description}</p></div><button class="track-select" data-select-track="${t.id}" aria-label="Pilih ${E(t.name)}" aria-pressed="${state.music===t.id}">${state.music===t.id?'✓':''}</button></div>`).join('')}</div><hr class="panel-divider"><div class="section-label">Atau, lagu yang punya cerita</div><button class="upload-zone" data-action="upload-music" data-drop="music">${icon('upload')}<strong>Unggah lagu kalian</strong><small>MP3, WAV, OGG, M4A · maksimal 15 MB</small></button><hr class="panel-divider"><div class="section-label"><span>Volume musik</span><small id="volume-label">${state.volume}%</small></div><div class="range-row">${icon('volume')}<input data-field="volume" type="range" min="0" max="100" value="${state.volume}" aria-label="Volume musik"></div><div class="soft-tip">${icon('music')}<span>Musik mulai setelah tamu menekan “Buka undangan”. Pilih lagu yang kalian miliki atau boleh digunakan.</span></div>`;
  }else{
    const animations=[['gentle','✧','Gentle Flow','Gerakan lembut, nuansa sinematik'],['fade','◌','Soft Fade','Muncul perlahan dengan anggun'],['rise','↑','Elegant Rise','Melangkah naik, mengalir ringan'],['none','—','Tanpa animasi','Tenang, sederhana, dan tetap indah']];
    panel.innerHTML=`<div class="section-label">Gaya gerakan <small>Sedikit keajaiban</small></div><div class="animation-options">${animations.map(([id,symbol,name,desc])=>`<button class="animation-card ${state.animation===id?'selected':''}" data-animation="${id}" aria-pressed="${state.animation===id}"><span class="animation-icon">${symbol}</span><span><strong>${name}</strong><small>${desc}</small></span>${state.animation===id?'<span class="check">✓</span>':''}</button>`).join('')}</div><hr class="panel-divider">${toggle('petals','Kelopak berjatuhan','Sentuhan romantis yang lembut dan natural.')}<button class="replay-button" data-action="replay">${icon('rotate')} Putar ulang animasi</button><div class="soft-tip">${icon('sparkles')}<span>Animasi menyesuaikan pengaturan gerakan perangkat tamu, agar semua orang tetap nyaman.</span></div>`;
  }
  hydrateIcons(panel);
}

function renderPreview(){
  clearTimeout(previewTimer);let scroll=0;try{scroll=frame.contentWindow.scrollY;}catch{}
  frame.onload=()=>{if(scroll)frame.contentWindow.scrollTo(0,scroll);};frame.srcdoc=buildInvitation(state);
  document.getElementById('preview-address').innerHTML=`${icon('lock')} undangan / ${E(slug((state.nickname1||state.partner1)+'-dan-'+(state.nickname2||state.partner2)))}`;
}
function showStudio(){document.getElementById('studio').hidden=false;document.getElementById('templates-page').hidden=true;document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav==='studio'));}
function showTemplates(){stopTrack();document.getElementById('studio').hidden=true;document.getElementById('templates-page').hidden=false;document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav==='templates'));renderCollection();window.scrollTo({top:0,behavior:'smooth'});}
function renderCollection(){
  const themes=THEMES.filter(t=>collectionFilter==='all'||t.category===collectionFilter);
  document.getElementById('templates-page').innerHTML=`<div class="eyebrow"><span></span> A CANVAS FOR YOUR LOVE STORY</div><h1>Temukan yang terasa <em>seperti kalian.</em></h1><p>Dari taman yang hangat hingga malam yang penuh pesona.<br>Setiap desain siap dirangkai menjadi cerita kalian sendiri.</p><div class="template-filter">${[['all','Semua koleksi'],['natural','Natural'],['minimal','Minimalis'],['romantic','Romantis']].map(([v,n])=>`<button data-collection-filter="${v}" class="filter-chip ${collectionFilter===v?'active':''}" aria-pressed="${collectionFilter===v}">${n}</button>`).join('')}</div><div class="template-collection">${themes.map(t=>`<article class="collection-card">${miniTheme(t)}<button class="button ${state.theme===t.id?'button-primary':'button-light'}" data-collection-theme="${t.id}">${state.theme===t.id?'Tema kalian saat ini':'Gunakan template'} ${icon('arrow-up-right')}</button></article>`).join('')}</div>`;
}

function openDialog(content,className=''){stopTrack();dialog.className='app-dialog '+className;document.getElementById('dialog-content').innerHTML=`<button class="dialog-close" data-action="close-dialog" aria-label="Tutup dialog">${icon('close')}</button>${content}`;if(!dialog.open)dialog.showModal();hydrateIcons(dialog);}
function closeDialog(){const preview=dialog.querySelector('iframe');preview?.contentWindow?.postMessage({type:'everafter:pause'},'*');dialog.close();}
function showPreview(){pauseFrame();openDialog('<iframe id="fullscreen-invitation" title="Pratinjau lengkap undangan" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"></iframe>','preview-dialog');document.getElementById('fullscreen-invitation').srcdoc=buildInvitation(state,{standalone:true});}
function showExport(){
  openDialog(`<div class="dialog-icon">${icon('download')}</div><div class="dialog-eyebrow">YOUR FOREVER, READY TO GO</div><h2>Cerita indah, siap dibagikan.</h2><p>Unduh website undangan kalian sebagai satu file HTML. Foto, musik, dan desain ikut tersimpan di dalamnya.</p><div class="export-summary"><span>♡</span><div>${E(state.nickname1||state.partner1)} &amp; ${E(state.nickname2||state.partner2)}<small>${E(formatDate(state.date))} · ${E(THEMES.find(t=>t.id===state.theme).name)}</small></div></div><div class="export-buttons"><button class="button button-primary button-block" data-action="download-html" id="download-html">${icon('download')} Unduh website undangan</button><button class="button button-light button-block" data-action="backup">${icon('file')} Simpan cadangan proyek (.json)</button></div><p class="export-note">File HTML dapat dibuka langsung di browser. Untuk tautan publik bagi tamu, unggah file tersebut ke hosting pilihan kalian. Studio ini menyimpan editan di perangkat ini.</p>`);
}
function showGuide(){openDialog(`<div class="dialog-eyebrow">A LITTLE GUIDE TO YOUR FOREVER</div><h2>Dari ide menjadi<br>undangan istimewa.</h2><div class="guide-steps"><div class="guide-step"><span>1</span><div><strong>Temukan suasana kalian</strong><p>Pilih tema, warna, dan tipografi yang mencerminkan kepribadian kalian.</p></div></div><div class="guide-step"><span>2</span><div><strong>Rangkai setiap detail</strong><p>Tulis nama dan detail acara, tambahkan foto, lalu pilih lagu serta gerakan favorit.</p></div></div><div class="guide-step"><span>3</span><div><strong>Lihat kisahnya hidup</strong><p>Gunakan pratinjau desktop atau ponsel. Buka pratinjau lengkap untuk mencoba musik dan undangan.</p></div></div><div class="guide-step"><span>4</span><div><strong>Bawa cerita kalian ke dunia</strong><p>Ekspor file website lengkap. Unggah ke hosting untuk mendapatkan tautan publik, atau simpan cadangan untuk diedit kembali.</p></div></div></div><button class="button button-primary button-block" data-action="close-dialog">Mulai merangkai ${icon('arrow-right')}</button><p class="export-note">Perubahan tersimpan otomatis di browser ini. Simpan cadangan sebelum berganti perangkat atau menghapus data browser.</p>`);}
function showProjects(){openDialog(`<div class="dialog-eyebrow">A HOME FOR YOUR STORY</div><h2>Undangan kalian.</h2><p>Satu ruang untuk merangkai cerita yang istimewa.</p><div class="saved-project"><strong>${E(state.nickname1||state.partner1)} &amp; ${E(state.nickname2||state.partner2)}</strong><p>${E(formatDate(state.date))} · ${E(THEMES.find(t=>t.id===state.theme).name)}</p></div><div class="project-actions"><button class="button button-primary button-block" data-action="close-dialog">Lanjutkan mengedit ${icon('arrow-right')}</button><button class="button button-light button-block" data-action="backup">${icon('download')} Simpan cadangan proyek</button><button class="button button-light button-block" data-action="import">${icon('upload')} Buka proyek dari perangkat</button><button class="button button-light button-block danger-button" data-action="new-project">Mulai undangan baru</button></div><p class="export-note">Proyek aktif disimpan pada browser dan perangkat ini.</p>`);}

function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function backup(){downloadBlob(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'everafter-'+slug(state.nickname1+'-'+state.nickname2)+'.json');toast('Cadangan proyek berhasil diunduh.');}
const readAsDataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('File tidak dapat dibaca.'));reader.readAsDataURL(blob);});
async function embeddedAsset(src,cache){if(!src||src.startsWith('data:'))return src;if(!cache.has(src))cache.set(src,fetch(src).then(r=>{if(!r.ok)throw new Error('Aset gagal dimuat. Coba lagi saat koneksi stabil.');return r.blob();}).then(readAsDataURL));return cache.get(src);}
async function exportHTML(){
  const button=document.getElementById('download-html');if(!button)return;button.disabled=true;button.textContent='Merangkai foto & musik…';
  try{
    const snapshot=structuredClone(state),cache=new Map();
    const [cover,gallery,music,sans,serif,italic,licenses]=await Promise.all([embeddedAsset(snapshot.cover,cache),Promise.all(snapshot.gallery.map(src=>embeddedAsset(src,cache))),snapshot.musicEnabled?embeddedAsset(musicSource(snapshot),cache):null,embeddedAsset('assets/dm-sans.ttf',cache),embeddedAsset('assets/cormorant.ttf',cache),embeddedAsset('assets/cormorant-italic.ttf',cache),Promise.all(['assets/DM-Sans-OFL.txt','assets/Cormorant-Garamond-OFL.txt'].map(src=>fetch(src).then(r=>{if(!r.ok)throw new Error('Lisensi font gagal dimuat. Coba lagi.');return r.text();}))).then(texts=>texts.join('\n\n'))]);
    snapshot.cover=cover;snapshot.gallery=gallery;if(music){snapshot.music='custom';snapshot.customMusic=music;}
    const html=buildInvitation(snapshot,{standalone:true,fonts:{sans,serif,italic,licenses}});
    downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'undangan-'+slug(snapshot.nickname1+'-dan-'+snapshot.nickname2)+'.html');
    toast('Website lengkap berhasil diunduh. Siap menjadi kenangan.');button.innerHTML=icon('check')+' Unduh kembali';
  }catch(err){toast(err.message||'Ekspor gagal. Silakan coba lagi.');button.innerHTML=icon('download')+' Coba unduh lagi';}finally{button.disabled=false;}
}

async function optimizeImage(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Pilih foto JPG, PNG, atau WebP.');
  if(file.size>12*1024*1024)throw new Error('Ukuran foto maksimal 12 MB.');
  const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#f8f4ec';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.86);
}
async function handleImages(files,target){
  if(!files.length)return;
  try{
    if(target==='cover'){const image=await optimizeImage(files[0]);update({cover:image,coverPosition:50},{panelRefresh:true,immediate:true});toast('Foto sampul sudah diganti.');}
    else{const available=6-state.gallery.length;if(!available){toast('Galeri sudah penuh. Hapus foto untuk menambahkan yang baru.');return;}const chosen=Array.from(files).slice(0,available);const images=await Promise.all(chosen.map(optimizeImage));update({gallery:[...state.gallery,...images]},{panelRefresh:true,immediate:true});toast(images.length+' foto kenangan ditambahkan.'+(files.length>available?' Galeri dibatasi 6 foto.':''));}
  }catch(err){toast(err.message||'Foto tidak dapat dibaca. Coba foto lain.');}
}
async function handleMusic(file){
  if(!file)return;
  if(file.size>15*1024*1024){toast('Ukuran lagu maksimal 15 MB.');return;}
  const mime=file.type||({mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4'}[file.name.split('.').pop().toLowerCase()]);
  if(!mime?.startsWith('audio/')||!document.createElement('audio').canPlayType(mime)){toast('Format ini belum didukung. Coba MP3, WAV, OGG, atau M4A.');return;}
  try{stopTrack();const data=await readAsDataURL(new Blob([file],{type:mime}));update({customMusic:data,customMusicName:file.name.replace(/\.[^.]+$/,''),music:'custom',musicEnabled:true},{panelRefresh:true,immediate:true});toast('Lagu kalian sudah siap mengalun.');}catch{toast('Lagu tidak dapat dibaca. Coba file lain.');}
}
async function playTrack(id){
  if(playingTrack===id){stopTrack();return;}
  stopTrack();pauseFrame();const track=id==='custom'?{src:state.customMusic}:TRACKS.find(t=>t.id===id);if(!track?.src)return;
  const audio=new Audio(track.src);trackAudio=audio;audio.volume=state.volume/100;playingTrack=id;
  const button=document.querySelector(`[data-play-track="${id}"]`);if(button){button.innerHTML=icon('pause');button.setAttribute('aria-label','Jeda '+button.dataset.trackName);}
  audio.addEventListener('ended',()=>{if(trackAudio===audio)stopTrack();});
  audio.addEventListener('error',()=>{if(trackAudio===audio){stopTrack();toast('Musik gagal dimuat. Coba lagi.');}});
  try{await audio.play();}catch{if(trackAudio===audio){stopTrack();toast('Musik belum bisa diputar. Ketuk tombol putar lagi.');}}
}
async function importProject(file){if(!file)return;if(file.size>40*1024*1024){toast('File proyek terlalu besar. Maksimal 40 MB.');return;}try{const raw=JSON.parse(await file.text());if(raw.version!==1||!raw.partner1||!raw.partner2)throw new Error('Gunakan file cadangan Everafter yang valid.');const imported=normalizeProject(raw);stopTrack();state=imported;queueSave();closeDialog();renderRail();renderPanel();renderPreview();toast('Cerita kalian berhasil dibuka kembali.');}catch(err){toast(err instanceof SyntaxError?'File JSON tidak valid.':err.message||'Proyek tidak dapat dibuka.');}}

document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.step){selectStep(b.dataset.step);return;}
  if(b.dataset.nav){b.dataset.nav==='templates'?showTemplates():showStudio();return;}
  if(b.dataset.theme){const t=THEMES.find(t=>t.id===b.dataset.theme);update({theme:t.id,accent:t.accent},{panelRefresh:true,immediate:true});return;}
  if(b.dataset.collectionTheme){const t=THEMES.find(t=>t.id===b.dataset.collectionTheme);update({theme:t.id,accent:t.accent},{panelRefresh:true,immediate:true});selectStep('theme');toast('Template '+t.name+' siap kalian personalisasi.');return;}
  if(b.dataset.themeFilter){themeFilter=b.dataset.themeFilter;renderPanel();return;}
  if(b.dataset.collectionFilter){collectionFilter=b.dataset.collectionFilter;renderCollection();return;}
  if(b.dataset.color){update({accent:b.dataset.color},{panelRefresh:true,immediate:true});return;}
  if(b.dataset.detailsTab){detailsTab=b.dataset.detailsTab;renderPanel();panel.scrollTop=0;return;}
  if(b.dataset.device){device=b.dataset.device;document.getElementById('preview-viewport').classList.toggle('mobile',device==='mobile');document.querySelectorAll('[data-device]').forEach(el=>{el.classList.toggle('selected',el.dataset.device===device);el.setAttribute('aria-pressed',el.dataset.device===device);});return;}
  if(b.dataset.removePhoto!==undefined){update({gallery:state.gallery.filter((_,i)=>i!==Number(b.dataset.removePhoto))},{panelRefresh:true,immediate:true});return;}
  if(b.dataset.selectTrack){stopTrack();update({music:b.dataset.selectTrack},{panelRefresh:true,immediate:true});return;}
  if(b.dataset.playTrack){playTrack(b.dataset.playTrack);return;}
  if(b.dataset.animation){update({animation:b.dataset.animation},{panelRefresh:true,immediate:true});return;}
  const action=b.dataset.action;
  if(action==='preview')showPreview();
  if(action==='export')showExport();
  if(action==='close-dialog')closeDialog();
  if(action==='guide')showGuide();
  if(action==='projects')showProjects();
  if(action==='download-html')exportHTML();
  if(action==='backup')backup();
  if(action==='upload-cover')document.getElementById('cover-upload').click();
  if(action==='upload-gallery')document.getElementById('gallery-upload').click();
  if(action==='upload-music')document.getElementById('music-upload').click();
  if(action==='import')document.getElementById('project-import').click();
  if(action==='replay'){frame.contentWindow?.postMessage({type:'everafter:replay'},'*');toast('Animasi diputar ulang.');}
  if(action==='new-project')openDialog(`<div class="dialog-eyebrow">A NEW CHAPTER</div><h2>Mulai cerita yang baru?</h2><p>Undangan aktif akan diganti dengan contoh awal. Simpan cadangan jika ingin mengedit undangan ini lagi nanti.</p><div class="export-buttons"><button class="button button-light" data-action="backup">${icon('download')} Simpan cadangan dulu</button></div><div class="confirm-row"><button class="button button-light" data-action="projects">Kembali</button><button class="button button-primary" data-action="reset-confirmed">Mulai baru</button></div>`);
  if(action==='reset-confirmed'){stopTrack();state=structuredClone(DEFAULT);activeStep='theme';themeFilter='all';detailsTab='couple';queueSave();showStudio();renderRail();renderPanel();panel.scrollTop=0;renderPreview();closeDialog();toast('Lembaran baru, cerita yang baru.');}
});

function handleField(e){
  const el=e.target;if(!el.dataset.field)return;const key=el.dataset.field;let value=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;
  if((el.type==='date'||el.type==='time')&&!value)return;
  if(el.type==='date'&&!el.validity.valid)return;
  if(key==='accent'&&!/^#[a-f0-9]{6}$/i.test(value))return;
  update({[key]:value});
  if(key==='volume'){document.getElementById('volume-label').textContent=value+'%';if(trackAudio)trackAudio.volume=value/100;}
  if(key==='coverPosition'){const image=panel.querySelector('.cover-upload img');if(image)image.style.objectPosition=value+'% center';}
  if(key==='accent'){document.querySelectorAll('[data-color]').forEach(b=>{b.classList.toggle('selected',b.dataset.color===value);b.setAttribute('aria-pressed',b.dataset.color===value);});document.getElementById('color-label').textContent=PALETTES.find(p=>p.color===value)?.name||'Warna pilihan kalian';}
}
document.addEventListener('input',handleField);
// Select controls emit input in modern browsers; changes also cover older engines.
document.addEventListener('change',e=>{if(e.target.tagName==='SELECT'&&state[e.target.dataset.field]!==e.target.value)handleField(e);});
for(const [id,target] of [['cover-upload','cover'],['gallery-upload','gallery']])document.getElementById(id).addEventListener('change',e=>{handleImages(e.target.files,target);e.target.value='';});
document.getElementById('music-upload').addEventListener('change',e=>{handleMusic(e.target.files[0]);e.target.value='';});
document.getElementById('project-import').addEventListener('change',e=>{importProject(e.target.files[0]);e.target.value='';});
document.addEventListener('dragover',e=>{const zone=e.target.closest('[data-drop]');if(zone){e.preventDefault();zone.classList.add('dragover');}});
document.addEventListener('dragleave',e=>{const zone=e.target.closest('[data-drop]');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('dragover');});
document.addEventListener('drop',e=>{const zone=e.target.closest('[data-drop]');if(!zone)return;e.preventDefault();zone.classList.remove('dragover');if(zone.dataset.drop==='music')handleMusic(e.dataTransfer.files[0]);else handleImages(e.dataTransfer.files,zone.dataset.drop);});
dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDialog();}});
dialog.addEventListener('close',()=>{dialog.querySelector('iframe')?.contentWindow?.postMessage({type:'everafter:pause'},'*');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTrack();if(dirty)persist();}});
window.addEventListener('pagehide',()=>{if(dirty)persist();});

hydrateIcons();
try{db=await openDatabase();const saved=await readProject();if(saved)state=normalizeProject(saved);else await persist();}catch{saveStatus('Mode sesi — simpan cadangan',false);toast('Penyimpanan browser belum tersedia. Gunakan cadangan proyek agar cerita tetap tersimpan.');}
renderRail();renderPanel();renderPreview();
