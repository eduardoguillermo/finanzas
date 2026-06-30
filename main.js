// ═══════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════
const K = {
    rubros:'f_r_v2_2', bancos:'f_bancos_v2_4', tarjetas:'f_tarjetas_v2_4',
    servicios:'f_servicios_v2_4', corrientes:'f_corrientes_v2_4',
    transferencias:'f_transferencias_v3', cuotas:'f_cuotas_v3', historico:'f_historico_v3',
    cuentasUSD:'f_cuentasUSD_v3', tarjetasUSD:'f_tarjetasUSD_v3',
    serviciosUSD:'f_serviciosUSD_v3', corrientesUSD:'f_corrientesUSD_v3',
    tipoCambio:'f_tipoCambio_v3',
    instrumentos:'f_instrumentos_v1',
    acciones:'f_acciones_v1',
    ingresos:'f_ingresos_v1'
};
let listaRubros        = leer(K.rubros)        || ["Carnicería / Verdulería","Supermercado / Almacén","Gastos Auto / Combustible"];
let listaBancos        = leer(K.bancos)        || [];
let listaTarjetas      = leer(K.tarjetas)      || [];
let listaServicios     = leer(K.servicios)     || [];
let listaCorrientes    = leer(K.corrientes)    || [];
let listaTransferencias= leer(K.transferencias)|| [];
let listaCuotas        = leer(K.cuotas)        || [];
let historicoMeses     = leer(K.historico)     || [];
let listaCuentasUSD    = leer(K.cuentasUSD)    || [];
let listaTarjetasUSD   = leer(K.tarjetasUSD)   || [];
let listaServiciosUSD  = leer(K.serviciosUSD)  || [];
let listaCorrientesUSD = leer(K.corrientesUSD) || [];
let tipoCambio         = leer(K.tipoCambio)    || 1200;
let listaInstrumentos  = leer(K.instrumentos)  || [];
let listaAcciones      = leer(K.acciones)      || [];
let listaIngresos      = leer(K.ingresos)      || [];
let listaPresupRubros    = leer('f_presup_rubros_v1')    || {};
let listaPresupRubrosUSD = leer('f_presup_rubros_usd_v1') || {};
let listaRubrosUSD       = leer('f_rubros_usd_v1')        || ['Electrónica','Servicios Online','Transferencias','Varios USD'];
let tabActivo = null;
let filtroCorrientes = '';
let filtroClase = '';
let _syncTimer = null;
let _syncPendiente = false;
let _syncActivo = false;

// ── Snapshots locales (backup en localStorage, igual que Gestión Docente) ──
const CF_BKUP_KEY = 'cf_backups';
const CF_BKUP_MAX = 10;

function cfCargarSnapshots() {
    try { return JSON.parse(localStorage.getItem(CF_BKUP_KEY)) || []; } catch(e) { return []; }
}
function cfGuardarSnapshots(bkups) {
    try { localStorage.setItem(CF_BKUP_KEY, JSON.stringify(bkups)); } catch(e) {}
}
function cfSnapshotData() {
    return JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,
        listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,
        listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,
        listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos});
}
function cfHacerSnapshot(manual=false) {
    try {
        const bkups = cfCargarSnapshots();
        bkups.unshift({
            ts: Date.now(),
            manual,
            label: manual ? 'Manual' : 'Automático',
            data: cfSnapshotData()
        });
        // Mantener máximo CF_BKUP_MAX: priorizar borrar automáticos viejos
        if(bkups.length > CF_BKUP_MAX) {
            const idxAuto = [...bkups.map((b,i)=>({b,i}))].reverse().find(x=>!x.b.manual);
            if(idxAuto) bkups.splice(idxAuto.i, 1); else bkups.pop();
        }
        cfGuardarSnapshots(bkups);
    } catch(e) {}
}
function cfFmtTs(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'});
}
function cfRestaurarSnapshot(ts) {
    if(!confirm('¿Restaurar este snapshot? Los datos actuales se guardarán como snapshot antes de restaurar.')) return;
    cfHacerSnapshot(false); // guardar estado actual antes
    const bkups = cfCargarSnapshots();
    const bkup = bkups.find(b=>b.ts===ts);
    if(!bkup) { alert('Snapshot no encontrado'); return; }
    try {
        const d = JSON.parse(bkup.data);
        if(d.listaBancos)        listaBancos        = d.listaBancos;
        if(d.listaTarjetas)      listaTarjetas      = d.listaTarjetas;
        if(d.listaServicios)     listaServicios     = d.listaServicios;
        if(d.listaCorrientes)    listaCorrientes    = d.listaCorrientes;
        if(d.listaRubros)        listaRubros        = d.listaRubros;
        if(d.listaTransferencias)listaTransferencias= d.listaTransferencias;
        if(d.listaCuotas)        listaCuotas        = d.listaCuotas;
        if(d.historicoMeses)     historicoMeses     = d.historicoMeses;
        if(d.listaCuentasUSD)    listaCuentasUSD    = d.listaCuentasUSD;
        if(d.listaTarjetasUSD)   listaTarjetasUSD   = d.listaTarjetasUSD;
        if(d.listaServiciosUSD)  listaServiciosUSD  = d.listaServiciosUSD;
        if(d.listaCorrientesUSD) listaCorrientesUSD = d.listaCorrientesUSD;
        if(d.tipoCambio)         tipoCambio         = d.tipoCambio;
        if(d.listaInstrumentos)  listaInstrumentos  = d.listaInstrumentos;
        if(d.listaAcciones)      listaAcciones      = d.listaAcciones;
        if(d.listaPresupRubros)  listaPresupRubros  = d.listaPresupRubros;
        if(d.listaPresupRubrosUSD) listaPresupRubrosUSD = d.listaPresupRubrosUSD;
        if(d.listaRubrosUSD)     listaRubrosUSD     = d.listaRubrosUSD;
        guardar();
        document.getElementById('modal-cf-snapshots')?.remove();
        renderTabs(); renderContenido();
        alert('✅ Snapshot restaurado: ' + cfFmtTs(ts));
    } catch(e) { alert('Error al restaurar: ' + e.message); }
}
function cfBorrarSnapshot(ts) {
    if(!confirm('¿Eliminar este snapshot?')) return;
    const bkups = cfCargarSnapshots().filter(b=>b.ts!==ts);
    cfGuardarSnapshots(bkups);
    cfMostrarSnapshots();
}
function cfMostrarSnapshots() {
    document.getElementById('modal-cf-snapshots')?.remove();
    const bkups = cfCargarSnapshots();
    const ov = document.createElement('div');
    ov.id = 'modal-cf-snapshots';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);z-index:3000;display:flex;align-items:center;justify-content:center;';
    const rows = bkups.length ? bkups.map(b=>`
        <tr>
            <td style="padding:8px 6px;font-size:13px;">${cfFmtTs(b.ts)}</td>
            <td style="padding:8px 6px;font-size:12px;color:${b.manual?'#15803d':'#6b7280'};">${b.label}</td>
            <td style="padding:8px 6px;text-align:right;">
                <button onclick="cfRestaurarSnapshot(${b.ts})" style="background:#0f766e;color:white;border:none;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer;margin-right:4px;">Restaurar</button>
                <button onclick="cfBorrarSnapshot(${b.ts})" style="background:#dc2626;color:white;border:none;border-radius:4px;padding:3px 8px;font-size:12px;cursor:pointer;">✕</button>
            </td>
        </tr>`).join('') : '<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">Sin snapshots guardados</td></tr>';
    ov.innerHTML = `<div style="background:white;border-radius:10px;padding:24px;min-width:420px;max-width:90vw;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;font-size:16px;">💾 Snapshots locales</h3>
            <button onclick="document.getElementById('modal-cf-snapshots').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
        </div>
        <p style="font-size:12px;color:#64748b;margin:0 0 12px;">Backups guardados automáticamente en este dispositivo (máx. 10).</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:2px solid #e2e8f0;">
                <th style="padding:6px;text-align:left;font-size:12px;color:#64748b;">Fecha</th>
                <th style="padding:6px;text-align:left;font-size:12px;color:#64748b;">Tipo</th>
                <th style="padding:6px;text-align:right;font-size:12px;color:#64748b;">Acción</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;">
            <button onclick="cfHacerSnapshot(true);cfMostrarSnapshots();" style="background:#4f46e5;color:white;border:none;border-radius:4px;padding:6px 14px;font-size:13px;cursor:pointer;">📸 Guardar snapshot ahora</button>
            <button onclick="document.getElementById('modal-cf-snapshots').remove()" style="background:#f1f5f9;color:#334155;border:none;border-radius:4px;padding:6px 14px;font-size:13px;cursor:pointer;">Cerrar</button>
        </div>
    </div>`;
    document.body.appendChild(ov);
}

function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } }
function guardar() {
    try {
        localStorage.setItem(K.rubros,         JSON.stringify(listaRubros));
        localStorage.setItem(K.bancos,         JSON.stringify(listaBancos));
        localStorage.setItem(K.tarjetas,       JSON.stringify(listaTarjetas));
        localStorage.setItem(K.servicios,      JSON.stringify(listaServicios));
        localStorage.setItem(K.corrientes,     JSON.stringify(listaCorrientes));
        localStorage.setItem(K.transferencias, JSON.stringify(listaTransferencias));
        localStorage.setItem(K.cuotas,         JSON.stringify(listaCuotas));
        localStorage.setItem(K.historico,      JSON.stringify(historicoMeses));
        localStorage.setItem(K.cuentasUSD,     JSON.stringify(listaCuentasUSD));
        localStorage.setItem(K.tarjetasUSD,    JSON.stringify(listaTarjetasUSD));
        localStorage.setItem(K.serviciosUSD,   JSON.stringify(listaServiciosUSD));
        localStorage.setItem(K.corrientesUSD,  JSON.stringify(listaCorrientesUSD));
        localStorage.setItem(K.tipoCambio,     JSON.stringify(tipoCambio));
        localStorage.setItem(K.instrumentos,   JSON.stringify(listaInstrumentos));
        localStorage.setItem(K.acciones,       JSON.stringify(listaAcciones));
        localStorage.setItem('f_presup_rubros_v1',     JSON.stringify(listaPresupRubros));
        localStorage.setItem('f_presup_rubros_usd_v1', JSON.stringify(listaPresupRubrosUSD));
        localStorage.setItem('f_rubros_usd_v1',         JSON.stringify(listaRubrosUSD));
        localStorage.setItem(K.ingresos,       JSON.stringify(listaIngresos));
        syncDebounce();
    } catch(e) {
        if(e.name==='QuotaExceededError'||e.code===22||e.code===1014) {
            alert('⚠️ Almacenamiento local lleno. Exportá un backup ahora y considerá eliminar meses históricos antiguos.');
        } else { console.error('Error al guardar:', e); }
    }
    // Backup automático en carpeta local si está vinculada
    if (window._cfFolderHandle) cfBackupEnCarpeta(window._cfFolderHandle);
}

// ═══════════════════════════════════════════
//  FORMATO
// ═══════════════════════════════════════════
function fmt(n) { return '$ ' + Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtN(n)   { return Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtUSD(n) { return 'USD ' + (Math.round(n*100)/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmt(n) { return '$ '   + Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function clon(x)   { return JSON.parse(JSON.stringify(x)); }
const PALETA_RUBROS = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
function colorRubro(r) { const i = listaRubros.indexOf(r); return i>=0 ? PALETA_RUBROS[i % PALETA_RUBROS.length] : '#94a3b8'; }

function parseNum(str) {
    const s=String(str).trim();
    if(s.includes(',')&&s.includes('.')) return s.lastIndexOf(',')>s.lastIndexOf('.')?parseFloat(s.replace(/\./g,'').replace(',','.'))||0:parseFloat(s.replace(/,/g,''))||0;
    if(s.includes(',')){ const p=s.split(','); return p[p.length-1].length<=2?parseFloat(s.replace(',','.'))||0:parseFloat(s.replace(/,/g,''))||0; }
    if(s.includes('.')){ const p=s.split('.'); return p[p.length-1].length<=2?parseFloat(s)||0:parseFloat(s.replace(/\./g,''))||0; }
    return parseFloat(s)||0;
}

// ═══════════════════════════════════════════
//  SYNC AUTOMÁTICO DRIVE
// ═══════════════════════════════════════════
function syncSetBadge(estado) {
    const b = document.getElementById('sync-badge');
    if(!b) return;
    if(estado === 'ok')       { b.innerText='✅ Drive sync'; b.style.cssText='font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;background:#dcfce7;color:#15803d;cursor:default;'; }
    else if(estado === 'pend'){ b.innerText='⏳ Sin sincronizar'; b.style.cssText='font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;background:#fef9c3;color:#854d0e;cursor:default;'; }
    else if(estado === 'sync'){ b.innerText='☁️ Sincronizando...'; b.style.cssText='font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;background:#dbeafe;color:#1d4ed8;cursor:default;'; }
    else if(estado === 'err') { b.innerText='⚠️ Error sync'; b.style.cssText='font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;background:#fee2e2;color:#b91c1c;cursor:default;'; }
    else if(estado === 'noauth'){ b.innerText='☁️ Drive'; b.style.cssText='font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;background:#f1f5f9;color:#64748b;cursor:pointer;'; }
}
function syncDebounce() {
    if(!gToken) gTokenCargarLocal();
    if(!gToken) { syncSetBadge('noauth'); return; }
    _syncPendiente = true;
    syncSetBadge('pend');
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(syncSilencioso, 30000);
}

// ID del archivo sync único en Drive (para sobreescribir en lugar de crear nuevos)
let _driveFileId = null;

async function syncSilencioso() {
    // No bloquear si _syncActivo — forzamos reset si lleva más de 30s colgado
    if(_syncActivo) { _syncActivo = false; }
    if(!gToken) return;
    _syncActivo = true;
    syncSetBadge('sync');
    try {
        const groqKey = localStorage.getItem('groq_api_key')||'';
        const data = JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos,groqKey});

        // Si no tenemos el ID del archivo, buscarlo en Drive
        if(!_driveFileId) {
            const listR = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=name%3D%22backup_autosync.json%22',
                {headers:{Authorization:'Bearer '+gToken}});
            if(listR.ok) {
                const listD = await listR.json();
                if(listD.files && listD.files.length > 0) _driveFileId = listD.files[0].id;
            } else if(listR.status === 401) { gTokenLimpiar(); _syncActivo=false; syncSetBadge('err'); return; }
        }

        let resp;
        if(_driveFileId) {
            // Sobreescribir archivo existente (PATCH)
            resp = await fetch('https://www.googleapis.com/upload/drive/v3/files/'+_driveFileId+'?uploadType=media',
                {method:'PATCH', headers:{Authorization:'Bearer '+gToken,'Content-Type':'application/json'}, body:data});
        } else {
            // Crear archivo nuevo con nombre fijo
            const meta = JSON.stringify({name:'backup_autosync.json',parents:['appDataFolder']});
            const form = new FormData();
            form.append('metadata', new Blob([meta],{type:'application/json'}));
            form.append('file', new Blob([data],{type:'application/json'}));
            resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {method:'POST', headers:{Authorization:'Bearer '+gToken}, body:form});
        }

        if(resp.ok) {
            const f = await resp.json();
            if(f.id) _driveFileId = f.id;
            _syncPendiente = false;
            syncSetBadge('ok');
        } else {
            if(resp.status === 401) { gTokenLimpiar(); _driveFileId=null; }
            syncSetBadge('err');
        }
    } catch(e) { syncSetBadge('err'); }
    _syncActivo = false;
}

async function syncAlSalir() {
    // Recuperar token persistido si la variable en memoria está vacía
    if(!gToken) gTokenCargarLocal();
    if(!gToken) {
        // Si no hay token, intentar obtenerlo silenciosamente
        const ok = await new Promise(resolve => {
            driveGetToken(t => { if(t) resolve(true); else resolve(false); });
            setTimeout(()=>resolve(false), 8000);
        });
        if(!ok) { alert('Para sincronizar antes de salir, autenticá Drive con el botón ☁️ Drive.'); return; }
    }
    if(!_syncPendiente) {
        alert('✅ Backup al día. Ya podés cerrar la pestaña.');
        window.close();
        return;
    }
    clearTimeout(_syncTimer);
    _syncActivo = false; // reset por si estaba colgado
    await syncSilencioso();
    if(!_syncPendiente) {
        alert('✅ Sincronizado con Drive. Ya podés cerrar la pestaña.');
    } else {
        alert('⚠️ No se pudo sincronizar. Usá el botón ☁️ Drive manualmente antes de cerrar.');
    }
}


// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  CARPETA LOCAL — File System Access API + IndexedDB
// ═══════════════════════════════════════════════════════════════
const CF_FOLDER_DB    = 'cf-folder-db';
const CF_FOLDER_STORE = 'handles';
const CF_FOLDER_KEY   = 'carpeta';
const CF_MAX_BK       = 7;

function cfAbrirFolderDB() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(CF_FOLDER_DB, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(CF_FOLDER_STORE);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}

async function cfGuardarHandle(handle) {
    try {
        const db = await cfAbrirFolderDB();
        const tx = db.transaction(CF_FOLDER_STORE, 'readwrite');
        tx.objectStore(CF_FOLDER_STORE).put(handle, CF_FOLDER_KEY);
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
        db.close();
    } catch(e) { console.warn('cfGuardarHandle:', e); }
}

async function cfLeerHandle() {
    try {
        const db = await cfAbrirFolderDB();
        const tx = db.transaction(CF_FOLDER_STORE, 'readonly');
        const req = tx.objectStore(CF_FOLDER_STORE).get(CF_FOLDER_KEY);
        const handle = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
        db.close();
        return handle || null;
    } catch(e) { return null; }
}

async function cfVerificarPermiso(handle) {
    try {
        const opts = { mode: 'readwrite' };
        if (await handle.queryPermission(opts) === 'granted') return true;
        if (await handle.requestPermission(opts) === 'granted') return true;
        return false;
    } catch(e) { return false; }
}

async function cfSeleccionarCarpeta() {
    if (!('showDirectoryPicker' in window)) {
        alert('Tu navegador no soporta la selección de carpeta local. Usá Chrome o Brave.');
        return;
    }
    try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        await cfGuardarHandle(handle);
        window._cfFolderHandle = handle;
        cfActualizarEstadoCarpeta(handle.name);
        await cfBackupEnCarpeta(handle);
    } catch(e) {
        if (e.name !== 'AbortError') console.warn('cfSeleccionarCarpeta:', e);
    }
}

function cfActualizarEstadoCarpeta(nombre) {
    const btn = document.getElementById('btn-cf-carpeta');
    const st  = document.getElementById('cf-carpeta-status');
    if (btn) btn.title = 'Carpeta: ' + nombre;
    if (st)  { st.textContent = '📁 ' + nombre; st.style.display = 'inline'; }
}

async function cfBackupEnCarpeta(handle) {
    if (!handle) return;
    const ok = await cfVerificarPermiso(handle);
    if (!ok) return;
    try {
        const fecha  = new Date().toISOString().slice(0, 10);
        const nombre = 'cf_backup_' + fecha + '.json';
        const data   = {listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,
                        listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,
                        listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,
                        listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,
                        listaRubrosUSD,listaIngresos};
        const fileHandle = await handle.getFileHandle(nombre, { create: true });
        const writable   = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        const entries = [];
        for await (const entry of handle.values()) {
            if (entry.kind === 'file' && entry.name.startsWith('cf_backup_') && entry.name.endsWith('.json'))
                entries.push(entry.name);
        }
        entries.sort().reverse();
        for (const old of entries.slice(CF_MAX_BK)) {
            try { await handle.removeEntry(old); } catch(e) {}
        }
        cfActualizarEstadoCarpeta(handle.name);
    } catch(e) { console.warn('cfBackupEnCarpeta:', e); }
}

async function cfRestaurarCarpeta() {
    try {
        const handle = await cfLeerHandle();
        if (!handle) return;
        const ok = await cfVerificarPermiso(handle);
        if (!ok) return;
        window._cfFolderHandle = handle;
        cfActualizarEstadoCarpeta(handle.name);
    } catch(e) { console.warn('cfRestaurarCarpeta:', e); }
}

document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Control Financiero ' + APP_VERSION;
    // Snapshot local al cerrar con X (beforeunload — síncrono, siempre funciona)
    window.addEventListener('beforeunload', () => { cfHacerSnapshot(false); });
    // Snapshot + intento Drive al ocultar pestaña
    document.addEventListener('visibilitychange', () => {
        if(document.visibilityState === 'hidden') {
            cfHacerSnapshot(false);
            if(!gToken) gTokenCargarLocal();
            if(gToken && _syncPendiente) syncSilencioso();
        }
    });
    renderTabs();
    renderContenido();
    cfRestaurarCarpeta();
});

// ═══════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════
function renderTabs() {
    const bar = document.getElementById('tabs-bar');
    bar.innerHTML = '';
    const mkTab = (label, activo, onclick, estilo) => {
        const t = document.createElement('div');
        t.className = 'tab' + (activo ? ' activo' : '');
        if (activo && estilo) t.style.cssText = estilo;
        t.innerHTML = label;
        t.onclick = onclick;
        bar.appendChild(t);
    };
    mkTab('<span>📊 Mes Actual</span>',  tabActivo===null,       ()=>{ tabActivo=null;       renderTabs(); renderContenido(); });
    mkTab('<span>🎯 Presupuesto</span>', tabActivo==='presupuesto', ()=>{ tabActivo='presupuesto'; renderTabs(); renderContenido(); }, 'background:#f5f3ff;color:#6d28d9;border-color:#c4b5fd;');
    mkTab('<span>💵 Dólares</span>',     tabActivo==='dolares',  ()=>{ tabActivo='dolares';  renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#15803d;border-color:#86efac;');
    mkTab('<span>📈 Reportes</span>',    tabActivo==='reportes',    ()=>{ tabActivo='reportes';    renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#166534;border-color:#86efac;');
    mkTab('<span>📊 Inversiones</span>', tabActivo==='inversiones', ()=>{ tabActivo='inversiones'; renderTabs(); renderContenido(); }, 'background:#fef9c3;color:#854d0e;border-color:#fde047;');
    mkTab('<span>📅 Anual</span>',      tabActivo==='anual',       ()=>{ tabActivo='anual';       renderTabs(); renderContenido(); }, 'background:#eff6ff;color:#1d4ed8;border-color:#93c5fd;');
    // Badge sync + botón Salir — siempre visible en la tab bar
    const spacer = document.createElement('div'); spacer.style.cssText='flex:1;';
    bar.appendChild(spacer);
    const badgeEl = document.createElement('span'); badgeEl.id='sync-badge';
    badgeEl.style.cssText='font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;background:#f1f5f9;color:#64748b;cursor:pointer;align-self:center;white-space:nowrap;';
    badgeEl.innerText='☁️ Drive'; badgeEl.onclick=syncAlSalir;
    bar.appendChild(badgeEl);
    const backupEl = document.createElement('button'); backupEl.id='btn-backup-global';
    backupEl.style.cssText='background:#4285f4;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:6px;align-self:center;white-space:nowrap;';
    backupEl.innerText='☁️ BK'; backupEl.title='Subir backup ahora';
    backupEl.onclick=driveSubir;
    bar.appendChild(backupEl);
    const restoreEl = document.createElement('button'); restoreEl.id='btn-restore-global';
    restoreEl.style.cssText='background:#4285f4;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:4px;align-self:center;white-space:nowrap;';
    restoreEl.innerText='📂 BK'; restoreEl.title='Restaurar backup';
    restoreEl.onclick=driveRestaurar;
    bar.appendChild(restoreEl);
    const snapshotEl = document.createElement('button'); snapshotEl.id='btn-snapshot-local';
    snapshotEl.style.cssText='background:#0f766e;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:4px;align-self:center;white-space:nowrap;';
    snapshotEl.innerText='💾 Local'; snapshotEl.title='Ver/restaurar snapshots locales';
    snapshotEl.onclick=cfMostrarSnapshots;
    bar.appendChild(snapshotEl);
    const aiEl = document.createElement('button'); aiEl.id='btn-ai-panel';
    aiEl.style.cssText='background:#4f46e5;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:4px;align-self:center;white-space:nowrap;';
    aiEl.innerText='\uD83E\uDD16 IA'; aiEl.title='Consultar datos con IA';
    aiEl.onclick=toggleAIPanel;
    bar.appendChild(aiEl);
    const cacheEl = document.createElement('button'); cacheEl.id='btn-clear-cache';
    cacheEl.style.cssText='background:#475569;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:4px;align-self:center;white-space:nowrap;';
    cacheEl.innerText='🗑️ Cache'; cacheEl.title='Limpiar caché y recargar';
    cacheEl.onclick=limpiarCache;
    bar.appendChild(cacheEl);
    const salirEl = document.createElement('button'); salirEl.id='btn-salir';
    salirEl.style.cssText='background:#334155;color:white;border:none;border-radius:4px;padding:5px 12px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:6px;align-self:center;white-space:nowrap;';
    salirEl.innerText='🚪 Salir'; salirEl.onclick=syncAlSalir;
    bar.appendChild(salirEl);

    [...historicoMeses].reverse().forEach(mes => {
        const t = document.createElement('div');
        t.className = 'tab historico' + (tabActivo===mes.id ? ' activo' : '');
        t.innerHTML = `<span>🗂 ${mes.nombre}</span><span class="tab-x">✕</span>`;
        t.onclick = e => {
            if (e.target.classList.contains('tab-x')) {
                if (confirm(`¿Eliminar "${mes.nombre}"?`)) {
                    historicoMeses = historicoMeses.filter(m=>m.id!==mes.id);
                    if (tabActivo===mes.id) tabActivo = null;
                    guardar(); renderTabs(); renderContenido();
                }
                return;
            }
            tabActivo = mes.id; renderTabs(); renderContenido();
        };
        bar.appendChild(t);
    });
}

function renderContenido() {
    const app = document.getElementById('app-content');
    app.innerHTML = '';
    if      (tabActivo===null)       { app.appendChild(buildMesActual()); bindMesActual(); render(); iniciarTimerYPF(); }
    else if (tabActivo==='dolares')  { app.appendChild(buildDolares());   bindDolares();   renderDolares(); actualizarTCDolares(); }
    else if (tabActivo==='presupuesto')  { app.appendChild(buildPresupuesto()); }
    else if (tabActivo==='reportes')    { app.appendChild(buildReportes()); }
    else if (tabActivo==='inversiones') { app.appendChild(buildInversiones()); bindInversiones(); actualizarInversiones(); iniciarTimerYPF(); }
    else if (tabActivo==='anual')       { app.appendChild(buildAnual()); }
    else {
        const mes = historicoMeses.find(m=>m.id===tabActivo);
        if (mes) app.appendChild(buildHistorico(mes));
    }
}

// ═══════════════════════════════════════════
//  HELPERS DOM
// ═══════════════════════════════════════════
function el(tag, cls) { const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function addOpt(sel, val, txt, selected=false) { const o=el('option'); o.value=val; o.innerText=txt; if(selected) o.selected=true; sel.appendChild(o); }
function fila(tds) { const tr=el('tr'); tds.forEach(td=>tr.appendChild(td)); return tr; }
function tdHTML(html, cls) { const td=el('td',cls); td.innerHTML=html; return td; }
function tdTxt(txt, cls)   { const td=el('td',cls); td.style.fontSize='12px'; td.innerText=txt; return td; }
function setTxt(id,v) { const e=document.getElementById(id); if(e) e.innerText=v; }
function tdBtn(label, fn, cls='no-print') { const td=el('td','tc '+(cls||'')); const b=el('button','btn-del'); b.innerText=label; b.onclick=fn; td.appendChild(b); return td; }
function vGet(id) { return document.getElementById(id)?.value?.trim()||''; }
function nGet(id) { return parseFloat(document.getElementById(id)?.value)||0; }
function medioNom(id) {
    const b=listaBancos.find(x=>x.id===id); if(b) return '🏦 '+b.nombre;
    const t=listaTarjetas.find(x=>x.id===id); if(t) return '💳 '+t.nombre;
    return '—';
}
function esCuentaLiq(id) {
    const b=listaBancos.find(x=>x.id===id);
    return b ? (b.autoDescontar===true) : false;
}
function inpNum(val, onChange) {
    const inp=el('input'); inp.type='text'; inp.className='inp tr';
    let last=Math.round(val);
    inp.value=fmtN(last);
    inp.addEventListener('focus', ()=>{ inp.value=last; });
    inp.addEventListener('change', e=>{
        const v=Math.round(parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.'))||0);
        last=v; onChange(v); inp.value=fmtN(v);
    });
    inp.addEventListener('blur', e=>{
        const v=Math.round(parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.'))||0);
        if(v!==last){ last=v; onChange(v); }
        inp.value=fmtN(last);
    });
    inp._setVal=v=>{ last=Math.round(v); if(document.activeElement!==inp) inp.value=fmtN(last); };
    return inp;
}
function inpNumUSD(val, onChange) {
    const inp=el('input'); inp.type='text'; inp.className='inp tr';
    let last=Math.round(val*100)/100;
    inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    inp.addEventListener('focus', ()=>{ inp.value=last; });
    inp.addEventListener('change', e=>{
        const v=Math.round(parseNum(e.target.value)*100)/100;
        last=v; onChange(v);
        inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    });
    inp.addEventListener('blur', e=>{
        const v=Math.round(parseNum(e.target.value)*100)/100;
        if(v!==last){ last=v; onChange(v); }
        inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    });
    inp._setVal=v=>{ last=Math.round(v*100)/100; if(document.activeElement!==inp) inp.value=last.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); };
    return inp;
}
function tdInpNum(val, onChange, cls) { const td=el('td',cls); td.appendChild(inpNum(val,onChange)); return td; }
function tdInpDate(val, onChange) { const td=el('td'); const i=el('input'); i.type='date'; i.className='inp'; i.value=val||''; i.onchange=e=>onChange(e.target.value); td.appendChild(i); return td; }
function selMediosPesos(selId, onChange) {
    const sel=el('select'); sel.className='inp';
    listaBancos.forEach(b=>addOpt(sel,b.id,'🏦 '+b.nombre,b.id===selId));
    listaTarjetas.forEach(t=>addOpt(sel,t.id,'💳 '+t.nombre,t.id===selId));
    sel.onchange=e=>onChange(e.target.value);
    return sel;
}

// ═══════════════════════════════════════════
//  HTML MES ACTUAL
// ═══════════════════════════════════════════
function buildMesActual() {
    const d = document.createElement('div');
    d.innerHTML = `
    <div class="container">
      <header class="no-print">
        <div>
          <h2 style="margin:0;font-size:20px;">Gestión Financiera y Control de Gastos <span id="app-version-tag" style="font-size:13px;color:#4f46e5;font-weight:bold;">${APP_VERSION}</span></h2>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button class="btn" onclick="mostrarInformeSemanal()" style="background:#7c3aed;color:white;font-size:12px;padding:7px 12px;">📊 Informe Semanal</button>
          <button class="btn btn-mes"   id="btn-nuevo-mes">🔄 Abrir Nuevo Mes</button>
          <button class="btn btn-blue"  id="btn-exportar">💾 Exportar</button>
          <button class="btn btn-green" id="btn-importar-trigger">📥 Importar</button>
          <input type="file" id="input-backup" accept=".json" style="display:none;">
          <button class="btn btn-dark"  onclick="window.print()">🖨️ PDF</button>
          <button class="btn" id="btn-cf-carpeta" onclick="cfSeleccionarCarpeta()" title="Vincular carpeta para backup automático" style="background:#0f766e;color:white;font-size:12px;padding:7px 12px;">📂 Carpeta</button>
          <span id="cf-carpeta-status" style="display:none;font-size:10px;color:#34d399;font-weight:700;"></span>

        </div>
      </header>
      <div class="grid-dashboard">
        <div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco Disponible</h4><p id="d-bancos" style="color:#0284c7;">$ 0</p></div>
        <div class="card-bal" id="card-pend" style="border-left:5px solid #ef4444;"><h4>Fijos Pendientes</h4><p id="d-pendiente" style="color:#ef4444;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #f59e0b;cursor:pointer;" onclick="toggleProyectado()">
          <h4 style="display:flex;justify-content:space-between;align-items:center;">Saldo Proyectado <span id="d-proy-toggle" style="font-size:10px;color:#94a3b8;">▼ detalle</span></h4>
          <p id="d-proyectado" style="color:#f59e0b;">$ 0</p>
          <small id="d-proyectado-sub" style="font-size:10px;color:#94a3b8;"></small>
          <div id="d-proy-detalle" style="display:none;margin-top:10px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:11px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="color:#0284c7;">🏦 Banco disponible</span>
              <span id="d-proy-banco" style="color:#0284c7;font-weight:bold;">$ 0</span>
            </div>
            <div id="d-proy-fijos-list"></div>
            <div id="d-proy-corr-list"></div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0;font-weight:bold;">
              <span style="color:#f59e0b;">= Saldo proyectado</span>
              <span id="d-proy-total" style="color:#f59e0b;">$ 0</span>
            </div>
          </div>
        </div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Total Deuda Tarjetas</h4><p id="d-tarjetas" style="color:#a855f7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #10b981;cursor:pointer;" onclick="actualizarYPF()" title="Click para actualizar">
          <h4 style="display:flex;justify-content:space-between;align-items:center;">YPF.BA <span id="ypf-badge-hora" style="font-size:9px;color:#94a3b8;font-weight:normal;"></span></h4>
          <p id="ypf-usd" style="color:#10b981;margin:2px 0;">USD —</p>
          <small id="ypf-ars" style="font-size:11px;color:#64748b;"></small>
          <small id="ypf-det" style="font-size:10px;color:#94a3b8;display:block;margin-top:2px;"></small>
        </div>
        <div class="card-bal" style="border-left:5px solid #6366f1;padding-bottom:12px;">
          <h4>Presupuesto Mes</h4>
          <div style="margin-top:8px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">
              <span style="font-size:10px;color:#64748b;text-transform:uppercase;">Fijos</span>
              <span id="d-presup-srv-vals" style="font-size:12px;font-weight:bold;color:#6366f1;">$ 0 / $ 0</span>
            </div>
            <div style="background:#e2e8f0;border-radius:3px;height:5px;margin-bottom:3px;"><div id="d-presup-srv-barf" style="height:5px;border-radius:3px;width:0%;background:#6366f1;transition:width 0.3s;"></div></div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px;margin-bottom:2px;">
              <span style="font-size:10px;color:#64748b;text-transform:uppercase;">Corrientes</span>
              <span id="d-presup-corr-vals" style="font-size:12px;font-weight:bold;color:#10b981;">$ 0 / $ 0</span>
            </div>
            <div style="background:#e2e8f0;border-radius:3px;height:5px;margin-bottom:3px;"><div id="d-presup-corr-barf" style="height:5px;border-radius:3px;width:0%;background:#10b981;transition:width 0.3s;"></div></div>
            <small id="d-presup-pct" style="font-size:10px;color:#94a3b8;">configurá límites en Rubros</small>
          </div>
        </div>
      </div>
      <div class="grid-principal">
        <div>
          <div class="panel panel-bancos no-print">
            <h3 class="panel-title">🏦 Cuentas Bancarias / Efectivo</h3>
            <div class="form-block">
              <form id="form-banco">
                <div class="form-group"><label>Nombre</label><input type="text" id="banco-nombre" required placeholder="Ej. Galicia, MercadoPago"></div>
                <div class="form-group"><label>Saldo ($)</label><input type="number" id="banco-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-blue">Añadir Cuenta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:40%">Cuenta</th><th style="width:30%" class="tr">Saldo ($)</th><th style="width:20%" class="tc">Auto⬇</th><th style="width:10%" class="no-print"></th></tr></thead><tbody id="t-bancos"></tbody></table>
            <div style="margin-top:8px;text-align:right;">
              <button type="button" onclick="abrirModalIngreso()" style="background:none;border:1px solid #0284c7;color:#0284c7;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;line-height:1.6;">💰 Ingresar fondos</button>
            </div>
            <div id="panel-historial-ingresos" style="margin-top:16px;display:none;">
              <h4 style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">📋 Historial de Ingresos</h4>
              <table style="font-size:12px;width:100%;border-collapse:collapse;">
                <thead><tr style="background:#f0fdf4;"><th style="padding:6px 8px;text-align:left;color:#166534;">Fecha</th><th style="padding:6px 8px;text-align:left;color:#166534;">Cuenta</th><th style="padding:6px 8px;text-align:left;color:#166534;">Descripción</th><th style="padding:6px 8px;text-align:right;color:#166534;">Monto</th><th style="padding:6px 8px;" class="no-print"></th></tr></thead>
                <tbody id="t-ingresos"></tbody>
              </table>
            </div>
          </div>
          <!-- Modal Ingresar Fondos -->
          <div id="modal-ingreso" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:white;border-radius:12px;padding:24px;width:340px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.3);">
              <h3 style="margin:0 0 16px;color:#166534;font-size:16px;">💰 Ingresar Fondos</h3>
              <div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Cuenta destino</label><select id="ing-cuenta" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;"></select></div>
              <div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Monto ($)</label><input type="number" id="ing-monto" min="0" step="1" value="" placeholder="0" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Descripción</label><input type="text" id="ing-desc" placeholder="Ej. Sueldo, Cobro cliente..." style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="margin-bottom:20px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Fecha</label><input type="date" id="ing-fecha" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button onclick="cerrarModalIngreso()" style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:6px;background:white;cursor:pointer;font-size:14px;">Cancelar</button>
                <button onclick="confirmarIngreso()" style="padding:8px 20px;border:none;border-radius:6px;background:#0284c7;color:white;cursor:pointer;font-size:14px;font-weight:bold;">✓ Confirmar</button>
              </div>
            </div>
          </div>
          <div class="panel panel-tarjetas no-print">
            <h3 class="panel-title">💳 Tarjetas de Crédito</h3>
            <div class="form-block">
              <form id="form-tarjeta">
                <div class="form-group"><label>Nombre</label><input type="text" id="tarjeta-nombre" required placeholder="Ej. Visa Galicia"></div>
                <div class="form-group"><label>Saldo base ($)</label><input type="number" id="tarjeta-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-purple">Registrar Tarjeta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:55%">Tarjeta</th><th style="width:35%" class="tr">Consumo ($)</th><th style="width:10%" class="no-print"></th></tr></thead><tbody id="t-tarjetas"></tbody></table>
          </div>
          <div class="panel panel-transf no-print">
            <h3 class="panel-title">↔️ Transferencias entre Cuentas</h3>
            <div class="form-block">
              <form id="form-transf">
                <div class="form-row"><div><label>Origen</label><select id="transf-origen" required></select></div><div><label>Destino</label><select id="transf-destino" required></select></div></div>
                <div class="form-row"><div><label>Monto ($)</label><input type="number" id="transf-monto" required placeholder="0" step="1"></div><div><label>Fecha</label><input type="date" id="transf-fecha" required></div></div>
                <button type="submit" class="btn btn-add btn-amber">Registrar Transferencia</button>
              </form>
            </div>
            <table><thead><tr><th style="width:18%">Fecha</th><th style="width:30%">Origen</th><th style="width:30%">Destino</th><th style="width:17%" class="tr">Monto</th><th style="width:5%" class="no-print"></th></tr></thead><tbody id="t-transf"></tbody></table>
          </div>
          <div class="panel no-print" style="border-top:4px solid #6366f1;">
            <h3 class="panel-title">💳 Compras en Cuotas</h3>
            <div class="form-block">
              <form id="form-cuota">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="cuota-desc" required placeholder="Ej. TV Samsung"></div>
                  <div><label>Monto Total ($)</label><input type="number" id="cuota-total" required placeholder="0" step="1"></div>
                  <div><label>Cant. Cuotas</label><input type="number" id="cuota-cant" required placeholder="12" min="2" step="1"></div>
                </div>
                <div class="form-row">
                  <div><label>Medio de Pago</label><select id="cuota-medio" required></select></div>
                  <div style="display:flex;align-items:flex-end;"><div id="cuota-preview" style="font-size:12px;color:#6366f1;font-weight:bold;padding:9px 0;"></div></div>
                </div>
                <button type="submit" class="btn btn-add" style="background:#6366f1;">Registrar Compra en Cuotas</button>
              </form>
            </div>
            <table><thead><tr><th style="width:35%">Descripción</th><th style="width:20%" class="tr">Cuota ($)</th><th style="width:20%" class="tc">Progreso</th><th style="width:18%" class="tr">Resto ($)</th><th style="width:7%" class="no-print"></th></tr></thead><tbody id="t-cuotas"></tbody></table>
          </div>
          <div class="panel panel-rubros no-print">
            <h3 class="panel-title">⚙️ Rubros de Gasto Corriente</h3>
            <div class="form-block">
              <form id="form-rubro" style="display:grid;grid-template-columns:2fr 1fr;gap:10px;">
                <input type="text" id="rubro-nombre" required placeholder="Ej. Carnicería">
                <button type="submit" class="btn" style="background:#64748b;color:white;">Crear Rubro</button>
              </form>
            </div>
            <div id="rubros-lista" class="rubros-wrap"></div>
          </div>
        </div>
        <div>
          <div class="panel panel-servicios">
            <h3 class="panel-title">📋 Servicios y Vencimientos Fijos</h3>
            <div class="form-block no-print">
              <form id="form-servicio">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="srv-nombre" required placeholder="Ej. Luz, Internet"></div>
                  <div><label>Presupuesto ($)</label><input type="number" id="srv-presupuesto" required placeholder="0" step="1"></div>
                  <div><label>Vto.</label><input type="date" id="srv-vto" required></div>
                </div>
                <div class="form-row" style="margin-bottom:12px;">
                  <div><label>Clase</label><select id="srv-clase" required><option value="M">M — Mío</option><option value="O">O — Oma</option><option value="X">X — Otros</option></select></div>
                  <div><label>Rubro</label><select id="srv-rubro"><option value="">— Sin rubro —</option></select></div>
                  <div style="flex:3"><label>Nota (opcional)</label><input type="text" id="srv-nota" placeholder="Ej. Contrato N° 1234, renovación anual"></div>
                </div>
                <button type="submit" class="btn btn-add btn-indigo">Configurar Servicio Fijo</button>
              </form>
            </div>
            <table><thead><tr>
              <th style="width:16%">Servicio</th><th style="width:6%" class="tc">Clase</th><th style="width:10%" class="tc">Rubro</th><th style="width:10%" class="tc">Vto.</th>
              <th style="width:10%" class="tr">Presup.</th><th style="width:10%" class="tr">Pagado</th>
              <th style="width:11%" class="tc">F.Pago</th><th style="width:14%">Medio</th>
              <th style="width:9%" class="tc">Estado</th><th style="width:4%" class="no-print"></th>
            </tr></thead><tbody id="t-servicios"></tbody><tfoot id="t-servicios-foot"></tfoot></table>
          </div>
          <div class="panel panel-corrientes">
            <h3 class="panel-title">🛍️ Gastos Corrientes / Caja Diaria</h3>
            <div class="form-block no-print">
              <form id="form-corriente">
                <div class="form-row">
                  <div style="flex:1.5"><label>Rubro</label><select id="corr-rubro" required></select></div>
                  <div style="flex:2"><label>Detalle</label><input type="text" id="corr-detalle" required placeholder="Ej. Nafta YPF"></div>
                  <div><label>Monto ($)</label><input type="number" id="corr-monto" required placeholder="0" step="1"></div>
                  <div><label>Pagar con</label><select id="corr-medio" required></select></div>
                </div>
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
                  <div><label>Clase</label><select id="corr-clase" style="padding:7px 10px;border:1px solid #cbd5e1;border-radius:4px;font-size:13px;">
                    <option value="M">M — Mío</option>
                    <option value="O">O — Oma</option>
                    <option value="X">X — Otros</option>
                  </select></div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="corr-es-ingreso" style="width:16px;height:16px;accent-color:#10b981;cursor:pointer;">
                    <label for="corr-es-ingreso" style="font-size:13px;color:#334155;text-transform:none;font-weight:bold;cursor:pointer;">Es un ingreso</label>
                  </div>
                </div>
                <button type="submit" class="btn btn-add btn-green">Asentar Gasto Corriente</button>
              </form>
            </div>
            <div class="no-print" style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <input type="text" id="filtro-corrientes" placeholder="🔍 Buscar por rubro o detalle..." style="flex:1;min-width:180px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:4px;font-size:13px;" oninput="filtroCorrientes=this.value.toLowerCase();render();">
              <select id="filtro-clase" style="width:130px;flex-shrink:0;padding:7px 10px;border:1px solid #cbd5e1;border-radius:4px;font-size:13px;background:white;color:#1e293b;" onchange="filtroClase=this.value;render();"><option value="">Todas las clases</option><option value="M">M — Mío</option><option value="O">O — Oma</option><option value="X">X — Otros</option></select>
              <button class="btn" style="background:#f1f5f9;color:#334155;padding:7px 12px;font-size:12px;flex-shrink:0;" onclick="filtroCorrientes='';filtroClase='';document.getElementById('filtro-corrientes').value='';document.getElementById('filtro-clase').value='';render();">✕</button>
            </div>
            <div id="wrap-corrientes"></div>
          </div>
        </div>
      </div>
    </div>`;
    return d;
}

function bindMesActual() {
    const g = id => document.getElementById(id);
    g('form-banco')?.addEventListener('submit', altaBanco);
    g('form-tarjeta')?.addEventListener('submit', altaTarjeta);
    g('form-servicio')?.addEventListener('submit', altaServicio);
    g('form-corriente')?.addEventListener('submit', altaCorriente);
    g('form-transf')?.addEventListener('submit', altaTransferencia);
    g('form-cuota')?.addEventListener('submit', altaCuota);
    g('form-rubro')?.addEventListener('submit', altaRubro);
    g('input-backup')?.addEventListener('change', importar);
    g('btn-exportar')?.addEventListener('click', exportar);
    g('btn-importar-trigger')?.addEventListener('click', ()=>g('input-backup')?.click());
    g('btn-nuevo-mes')?.addEventListener('click', nuevoMes);
    g('cuota-total')?.addEventListener('input', previewCuota);
    g('cuota-cant')?.addEventListener('input', previewCuota);
}

// ═══════════════════════════════════════════
//  RENDER MES ACTUAL
// ═══════════════════════════════════════════
function render() {
    const tB=document.getElementById('t-bancos'); if(!tB) return;
    const tT=document.getElementById('t-tarjetas'), tS=document.getElementById('t-servicios');
    const tTr=document.getElementById('t-transf'), rL=document.getElementById('rubros-lista');
    const sRubro=document.getElementById('corr-rubro'), sMedio=document.getElementById('corr-medio');
    const sOrig=document.getElementById('transf-origen'), sDest=document.getElementById('transf-destino');
    const sMedCuota=document.getElementById('cuota-medio');
    tB.innerHTML=''; tT.innerHTML=''; tS.innerHTML=''; tTr.innerHTML=''; rL.innerHTML='';
    [sMedio,sOrig,sDest,sMedCuota].forEach(s=>{ if(s) s.innerHTML=''; });
    listaBancos.forEach(b=>{ [sMedio,sOrig,sDest,sMedCuota].forEach(s=>{ if(s) addOpt(s,b.id,'🏦 '+b.nombre); }); });
    listaTarjetas.forEach(t=>{ [sMedio,sOrig,sDest,sMedCuota].forEach(s=>{ if(s) addOpt(s,t.id,'💳 '+t.nombre); }); });
    if(sRubro){ sRubro.innerHTML=''; [...listaRubros].sort((a,b)=>a.localeCompare(b,'es')).forEach(r=>addOpt(sRubro,r,r)); }
    const sSrvRubro=document.getElementById('srv-rubro');
    if(sSrvRubro){ sSrvRubro.innerHTML='<option value="">— Sin rubro —</option>'; [...listaRubros].sort((a,b)=>a.localeCompare(b,'es')).forEach(r=>addOpt(sSrvRubro,r,r)); }
    listaRubros.forEach(r=>{
        const b=el('div','rubro-badge'); 
        const col=colorRubro(r);
        b.style.cssText='border-left:4px solid '+col+';background:'+col+'18;';
        b.innerHTML=`<span style="color:${col};font-weight:bold;">${r}</span>`;
        const x=el('button'); x.type='button'; x.innerText='✕'; x.onclick=()=>elimRubro(r);
        b.appendChild(x); rL.appendChild(b);
    });
    // Bancos
    listaBancos.forEach(b=>{
        const tdT=el('td','tc'); const tog=el('input'); tog.type='checkbox'; tog.checked=b.autoDescontar||false;
        tog.style.cssText='width:16px;height:16px;cursor:pointer;accent-color:#4f46e5;';
        tog.onchange=e=>{ b.autoDescontar=e.target.checked; guardar(); };
        tdT.appendChild(tog);
        const inpB = inpNum(b.saldo, v=>{ b.saldo=v; guardar(); calcDash(); });
        inpB.id = 'saldo-b-'+b.id;
        const tdSB = el('td','tr'); tdSB.appendChild(inpB);
        tB.appendChild(fila([tdHTML(`<b>${b.nombre}</b>`), tdSB, tdT, tdBtn('✕',()=>elimBanco(b.id))]));
    });
    if(!listaBancos.length) tB.innerHTML='<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin cuentas.</td></tr>';
    // Historial de ingresos
    const panelHist = document.getElementById('panel-historial-ingresos');
    const tI = document.getElementById('t-ingresos');
    if(panelHist && tI) {
        tI.innerHTML = '';
        if(listaIngresos.length) {
            panelHist.style.display = 'block';
            [...listaIngresos].reverse().forEach(ing => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f0fdf4';
                tr.innerHTML = `<td style="padding:5px 8px;color:#475569;">${ing.fecha||'—'}</td><td style="padding:5px 8px;font-weight:bold;color:#166534;">${ing.bancoNombre||'—'}</td><td style="padding:5px 8px;color:#475569;">${ing.descripcion||'—'}</td><td style="padding:5px 8px;text-align:right;font-weight:bold;color:#16a34a;">${fmt(ing.monto)}</td><td style="padding:5px 8px;" class="no-print"><button onclick="elimIngreso('${ing.id}')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button></td>`;
                tI.appendChild(tr);
            });
        } else {
            panelHist.style.display = 'none';
        }
    }
    // Tarjetas
    listaTarjetas.forEach(t=>{
        const inp=inpNum(t.saldo,v=>{ t.saldo=v; guardar(); calcDash(); }); inp.id='saldo-t-'+t.id;
        const tdS=el('td','tr'); tdS.appendChild(inp);
        tT.appendChild(fila([tdHTML(`<b>${t.nombre}</b>`),tdS,tdBtn('✕',()=>elimTarjeta(t.id))]));
    });
    if(!listaTarjetas.length) tT.innerHTML='<tr><td colspan="3" class="tc" style="color:#94a3b8;padding:12px;">Sin tarjetas.</td></tr>';
    // Transferencias
    if(!listaTransferencias.length) { tTr.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>'; }
    else { [...listaTransferencias].reverse().forEach(t=>{
        const tdM=el('td','tr'); tdM.style.cssText='font-weight:bold;color:#f59e0b;'; tdM.innerText=fmt(t.monto);
        tTr.appendChild(fila([tdTxt(t.fecha||'—'),tdTxt(t.origenNombre),tdTxt(t.destinoNombre),tdM,tdBtn('✕',()=>elimTransferencia(t.id))]));
    }); }
    // Servicios (ordenados)
    [...listaServicios].sort((a,b)=>{ const est=s=>s.pagado>=s.presupuesto&&s.presupuesto>0?2:s.pagado>0?1:0; return est(a)!==est(b)?est(a)-est(b):a.nombre.localeCompare(b.nombre,'es'); }).forEach(s=>{
        const selCl=el('select'); selCl.className='inp';
        ['M','O','X'].forEach(op=>{ const o=el('option'); o.value=op; o.innerText=op; if((s.clase||'M')===op) o.selected=true; selCl.appendChild(o); });
        selCl.onchange=e=>{ s.clase=e.target.value; guardar(); };
        const tdCl=el('td','tc'); tdCl.appendChild(selCl);
        // Select rubro inline
        const selRub=el('select'); selRub.className='inp'; selRub.style.cssText='font-size:11px;max-width:90px;';
        addOpt(selRub,'','— —');
        listaRubros.forEach(r=>{ const o=el('option'); o.value=r; o.innerText=r; if((s.rubro||'')===r) o.selected=true; selRub.appendChild(o); });
        selRub.onchange=e=>{ s.rubro=e.target.value; guardar(); };
        const tdRub=el('td','tc'); tdRub.appendChild(selRub);
        const estSpan=el('span'); estSpan.id='est-'+s.id; estSpan.style.cssText='font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;';
        const tdEst=el('td','tc'); tdEst.appendChild(estSpan);
        const tdPag=el('td','tr');
        const inpPag=inpNum(s.pagado, v=>{
            const diff=v-s.pagado;
            if(diff!==0){
                const bk=listaBancos.find(b=>b.id===s.medioPagoId);
                const tk=listaTarjetas.find(t=>t.id===s.medioPagoId);
                if(bk) bk.saldo-=diff;
                else if(tk) tk.saldo+=diff;
            }
            s.pagado=v; guardar(); calcDash();
            if(s.presupuesto>0 && v>s.presupuesto) alert('⚠️ Pagado ('+fmt(v)+') supera el presupuesto ('+fmt(s.presupuesto)+') en '+fmt(v-s.presupuesto)+'.');
        });
        tdPag.appendChild(inpPag);
        const tr=el('tr');
        const tdNom=el('td'); tdNom.style.maxWidth='0'; tdNom.style.overflow='hidden'; tdNom.style.textOverflow='ellipsis'; tdNom.style.whiteSpace='nowrap';
        const nomSpan2=el('span'); nomSpan2.style.fontWeight='bold'; nomSpan2.innerText=s.nombre;
        const notaEdit=el('input'); notaEdit.type='text'; notaEdit.className='inp'; notaEdit.style.cssText='margin-top:3px;font-size:11px;color:#854d0e;background:#fefce8;border-color:#fde68a;display:'+(s.nota||document.activeElement===notaEdit?'block':'none')+';';
        notaEdit.placeholder='Nota...'; notaEdit.value=s.nota||'';
        notaEdit.onchange=e=>{ s.nota=e.target.value.trim(); guardar(); };
        notaEdit.onfocus=()=>{ notaEdit.style.display='block'; };
        const noteBtn=el('span'); noteBtn.innerText=s.nota?'📝':'＋'; noteBtn.style.cssText='font-size:10px;cursor:pointer;color:#94a3b8;margin-left:5px;';
        noteBtn.title='Agregar/editar nota'; noteBtn.onclick=()=>{ notaEdit.style.display=notaEdit.style.display==='none'?'block':'none'; if(notaEdit.style.display==='block') notaEdit.focus(); };
        tdNom.appendChild(nomSpan2); tdNom.appendChild(noteBtn); tdNom.appendChild(notaEdit);
        [tdNom, tdCl, tdRub, tdInpDate(s.fVto,v=>{ s.fVto=v; guardar(); }),
         tdInpNum(s.presupuesto,v=>{ s.presupuesto=v; guardar(); calcDash(); },'tr'),
         tdPag, tdInpDate(s.fPago,v=>{ s.fPago=v; guardar(); }),
         (()=>{ const td=el('td'); td.appendChild(selMediosPesos(s.medioPagoId,v=>{ s.medioPagoId=v; guardar(); calcDash(); })); return td; })(),
         tdEst,
         (()=>{ const td=el('td','tc no-print'); td.style.whiteSpace='nowrap';
                const bDup=el('button','btn'); bDup.style.cssText='background:#f1f5f9;color:#334155;padding:3px 7px;font-size:11px;margin-right:3px;'; bDup.innerText='\u29c9'; bDup.title='Duplicar servicio';
                bDup.onclick=()=>{ const copia=Object.assign({},clon(s),{id:'s_'+Date.now(),nombre:s.nombre+' (copia)',pagado:0,fPago:''}); listaServicios.push(copia); guardar(); render(); };
                const bDel=el('button','btn-del'); bDel.innerText='\u2715'; bDel.onclick=()=>elimServicio(s.id);
                td.appendChild(bDup); td.appendChild(bDel); return td; })()
        ].forEach(td=>tr.appendChild(td));
        tS.appendChild(tr);
    });
    if(!listaServicios.length) tS.innerHTML='<tr><td colspan="10" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios.</td></tr>';
    // Totales fila servicios
    const tSFoot = document.getElementById('t-servicios-foot');
    if(tSFoot) {
        const sTotPres = listaServicios.reduce((a,s)=>a+s.presupuesto,0);
        const sTotPag  = listaServicios.reduce((a,s)=>a+s.pagado,0);
        const sTotPend = listaServicios.reduce((a,s)=>a+Math.max(0,s.presupuesto-s.pagado),0);
        tSFoot.innerHTML = '<tr style="background:#f1f5f9;font-weight:bold;font-size:12px;border-top:2px solid #e2e8f0;">'
            + '<td style="padding:6px 8px;color:#334155;">TOTAL</td>'
            + '<td></td><td></td>'
            + '<td style="padding:6px 8px;text-align:right;color:#4f46e5;">'+fmt(sTotPres)+'</td>'
            + '<td style="padding:6px 8px;text-align:right;color:#10b981;">'+fmt(sTotPag)+'</td>'
            + '<td></td><td></td>'
            + '<td style="padding:6px 8px;text-align:center;color:#ef4444;font-size:11px;">'+fmt(sTotPend)+' pend.</td>'
            + '<td></td></tr>';
    }
    renderCuotas();
    // Corrientes
    const wC=document.getElementById('wrap-corrientes');
    if(wC){
        wC.innerHTML='';
        const tbl=el('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;';
        const thead=el('thead'); thead.innerHTML='<tr><th style="width:6%" class="tc">Clase</th><th style="width:18%">Rubro</th><th style="width:23%">Detalle</th><th style="width:15%">Medio</th><th style="width:12%;text-align:center;">F. Pago</th><th style="width:14%;text-align:right;">Monto ($)</th><th style="width:6%" class="no-print"></th></tr>';
        const tbody=el('tbody');
        if(!listaCorrientes.length) { tbody.innerHTML='<tr><td colspan="6" class="tc" style="color:#94a3b8;padding:15px;">Sin egresos corrientes.</td></tr>'; }
        else { listaCorrientes.filter(c=>(!filtroCorrientes||(c.rubro+' '+c.detalle).toLowerCase().includes(filtroCorrientes))&&(!filtroClase||(c.clase||'M')===filtroClase)).forEach(c=>{
            const selR=el('select'); selR.className='inp'; listaRubros.forEach(r=>addOpt(selR,r,r,r===c.rubro)); selR.onchange=e=>{ c.rubro=e.target.value; guardar(); };
            const inpD=el('input'); inpD.type='text'; inpD.className='inp'; inpD.value=c.detalle; inpD.onchange=e=>{ c.detalle=e.target.value.trim(); guardar(); };
            const inpFP=el('input'); inpFP.type='date'; inpFP.className='inp'; inpFP.value=c.fechaPago||'';
            inpFP.onchange=e=>{
                const prev=c.fechaPago, next=e.target.value, factor=c.esIngreso?1:-1;
                if(!prev&&next&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo+=c.monto*factor; }
                if(prev&&!next&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo-=c.monto*factor; }
                c.fechaPago=next; guardar(); render();
            };
            const inpM=inpNum(c.monto,v=>{
                const diff=v-c.monto;
                if(c.fechaPago&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo+=c.esIngreso?diff:-diff; }
                c.monto=v; guardar(); calcDash();
            });
            inpM.style.cssText='font-weight:bold;color:'+(c.esIngreso?'#0284c7':'#10b981')+';';
            const claseColor={'M':'#0284c7','O':'#a855f7','X':'#64748b'};
            const cc=claseColor[c.clase||'M'];
            const selCl=el('select'); selCl.className='inp'; selCl.style.cssText='padding:3px 4px;font-size:11px;font-weight:bold;color:'+cc+';border-color:'+cc+'44;background:'+cc+'11;';
            ['M','O','X'].forEach(op=>{ const o=el('option'); o.value=op; o.innerText=op; if((c.clase||'M')===op) o.selected=true; selCl.appendChild(o); });
            selCl.onchange=e=>{ c.clase=e.target.value; const nc=claseColor[c.clase]; selCl.style.cssText='padding:3px 4px;font-size:11px;font-weight:bold;color:'+nc+';border-color:'+nc+'44;background:'+nc+'11;'; guardar(); };
            const tdCl=el('td','tc'); tdCl.appendChild(selCl);
            const tdR=el('td'); tdR.appendChild(selR);
            const tdD=el('td'); tdD.appendChild(inpD);
            const tdM=el('td'); tdM.style.color='#64748b'; tdM.innerText=(c.esIngreso?'⬆ ':'')+medioNom(c.medioPagoId);
            const tdFP=el('td','tc'); tdFP.appendChild(inpFP);
            const tdMon=el('td','tr'); tdMon.appendChild(inpM);
            const tdX=el('td','tc no-print'); const bX=el('button','btn-del'); bX.innerText='✕'; bX.onclick=()=>elimCorriente(c.id); tdX.appendChild(bX);
            const tr=el('tr'); [tdCl,tdR,tdD,tdM,tdFP,tdMon,tdX].forEach(td=>tr.appendChild(td)); tbody.appendChild(tr);
        }); }
        tbl.appendChild(thead); tbl.appendChild(tbody); wC.appendChild(tbl);

        // Subtotal filtrado
        const corrFiltradas = listaCorrientes.filter(c=>(!filtroCorrientes||(c.rubro+' '+c.detalle).toLowerCase().includes(filtroCorrientes))&&(!filtroClase||(c.clase||'M')===filtroClase));
        const subEgr = corrFiltradas.filter(c=>!c.esIngreso).reduce((a,c)=>a+c.monto,0);
        const subIng = corrFiltradas.filter(c=>c.esIngreso).reduce((a,c)=>a+c.monto,0);
        const subPag = corrFiltradas.filter(c=>!c.esIngreso&&c.fechaPago).reduce((a,c)=>a+c.monto,0);
        const subDiv = el('div'); subDiv.style.cssText='margin-top:8px;padding:8px 12px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;display:flex;gap:16px;flex-wrap:wrap;align-items:center;';
        if(filtroCorrientes||filtroClase) {
            const badgeTxt = [filtroCorrientes?'"'+filtroCorrientes+'"':'', filtroClase?'Clase '+filtroClase:''].filter(Boolean).join(' · ');
            subDiv.innerHTML = '<span style="color:#64748b;font-weight:bold;">🔍 '+badgeTxt+'</span>'
                + '<span style="color:#ef4444;">Egresos: <b>'+fmt(subEgr)+'</b></span>'
                + (subIng>0?'<span style="color:#0284c7;">Ingresos: <b>'+fmt(subIng)+'</b></span>':'')
                + '<span style="color:#10b981;">Pagado: <b>'+fmt(subPag)+'</b></span>'
                + '<span style="color:#94a3b8;">('+corrFiltradas.length+' registro'+(corrFiltradas.length!==1?'s':'')+')</span>';
        } else {
            const totEgr = listaCorrientes.filter(c=>!c.esIngreso).reduce((a,c)=>a+c.monto,0);
            const totIng = listaCorrientes.filter(c=>c.esIngreso).reduce((a,c)=>a+c.monto,0);
            const totPag = listaCorrientes.filter(c=>!c.esIngreso&&c.fechaPago).reduce((a,c)=>a+c.monto,0);
            subDiv.innerHTML = '<span style="color:#64748b;font-weight:bold;">Total</span>'
                + '<span style="color:#ef4444;">Egresos: <b>'+fmt(totEgr)+'</b></span>'
                + (totIng>0?'<span style="color:#0284c7;">Ingresos: <b>'+fmt(totIng)+'</b></span>':'')
                + '<span style="color:#10b981;">Pagado: <b>'+fmt(totPag)+'</b></span>'
                + '<span style="color:#94a3b8;">('+listaCorrientes.length+' registros)</span>';
        }
        wC.appendChild(subDiv);
    }
    calcDash();
    if(!_alertasMostradas){ _alertasMostradas=true; setTimeout(modalVencimientos, 300); }
}

// ─────────────────────────────────────────────────────────────────
//  PRESUPUESTO POR RUBRO
// ─────────────────────────────────────────────────────────────────
function renderPresupRubros() {
    const wrap = document.getElementById('rubros-presup-wrap'); if(!wrap) return;
    if(!listaRubros.length){ wrap.innerHTML=''; return; }
    // Calcular gastado este mes por rubro (corrientes sin filtro)
    const gastado = {};
    listaCorrientes.filter(c=>c.fechaPago&&!c.esIngreso).forEach(c=>{ gastado[c.rubro]=(gastado[c.rubro]||0)+c.monto; });
    let html = '<div style="font-size:10px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Presupuesto mensual por rubro</div>';
    listaRubros.forEach(r=>{
        const pres = listaPresupRubros[r]||0;
        const gast = gastado[r]||0;
        const pct = pres>0 ? Math.min(100,Math.round(gast/pres*100)) : 0;
        const col = colorRubro(r);
        const alerta = pres>0 && gast>=pres;
        const bg = alerta ? '#fef2f2' : '#f8fafc';
        const barColor = alerta ? '#ef4444' : col;
        html += '<div style="background:'+bg+';border-radius:6px;padding:8px 10px;margin-bottom:6px;border:1px solid '+(alerta?'#fca5a5':'#e2e8f0')+';">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
        html += '<span style="font-size:12px;font-weight:bold;color:'+col+';">'+r+'</span>';
        html += '<div style="display:flex;align-items:center;gap:6px;">';
        html += '<span style="font-size:11px;color:#64748b;">'+fmt(gast)+(pres>0?' / '+fmt(pres):'')+'</span>';
        if(alerta) html += '<span style="font-size:10px;font-weight:bold;padding:1px 6px;border-radius:4px;background:#fee2e2;color:#b91c1c;">SUPERADO</span>';
        html += '</div></div>';
        html += '<div style="display:flex;align-items:center;gap:4px;margin-top:5px;">';
        html += '<span style="font-size:10px;color:#94a3b8;">Ppto. $</span>';
        html += '<input type="number" min="0" step="1" value="'+(pres||'')+'" placeholder="Sin límite" ';
        html += 'style="width:110px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;" ';
        html += 'data-rubro="'+r.replace(/"/g,'&quot;')+'" onchange="actualizarPresupRubro(this)" onblur="actualizarPresupRubro(this)">';
        html += '</div></div>';
    });
    wrap.innerHTML = html;
}
function actualizarPresupRubro(inp) {
    const r = inp.getAttribute('data-rubro');
    const v = parseFloat(inp.value)||0;
    if(v>0) listaPresupRubros[r]=v; else delete listaPresupRubros[r];
    guardar(); renderPresupRubros();
    if(tabActivo==='presupuesto') renderContenido();
}

// ═══════════════════════════════════════════
//  DASHBOARD PESOS
// ═══════════════════════════════════════════
function calcDash() {
    const mDeb={}; listaBancos.forEach(b=>mDeb[b.id]=0); listaTarjetas.forEach(t=>mDeb[t.id]=0);
    let totalPag=0, fijosPend=0;
    listaServicios.forEach(s=>{
        if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined){ mDeb[s.medioPagoId]+=Math.round(s.pagado); totalPag+=Math.round(s.pagado); }
        if(s.presupuesto>s.pagado) fijosPend+=Math.round(s.presupuesto-s.pagado);
        const sp=document.getElementById('est-'+s.id);
        if(sp){
            if(s.pagado>=s.presupuesto&&s.presupuesto>0){sp.innerText='PAGADO';sp.style.background='#e6f4ea';sp.style.color='#137333';}
            else if(s.pagado>0){sp.innerText='PARCIAL';sp.style.background='#fef7e0';sp.style.color='#b06000';}
            else{sp.innerText='PENDIENTE';sp.style.background='#fce8e6';sp.style.color='#c5221f';}
        }
    });
    listaCorrientes.forEach(c=>{
        if(c.fechaPago){
            if(!c.esIngreso){ totalPag+=Math.round(c.monto); if(mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=Math.round(c.monto); }
            else { if(mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]-=Math.round(c.monto); }
        }
    });
    let sumaBancos=0;
    listaBancos.forEach(b=>{
        b.saldo=Math.round(b.saldo); sumaBancos+=b.saldo;
        const inpB=document.getElementById('saldo-b-'+b.id);
        if(inpB){ if(inpB._setVal) inpB._setVal(b.saldo); else if(document.activeElement!==inpB) inpB.value=fmtN(b.saldo); }
    });
    let sumaTarjetas=0;
    listaTarjetas.forEach(t=>{
        t.saldo=Math.round(t.saldo);
        const total=t.saldo+(mDeb[t.id]||0); sumaTarjetas+=total;
        const inp=document.getElementById('saldo-t-'+t.id);
        if(inp){ if(inp._setVal) inp._setVal(total); else if(document.activeElement!==inp) inp.value=fmtN(total); }
    });
    setTxt('d-bancos',   fmt(sumaBancos));
    setTxt('d-tarjetas', fmt(sumaTarjetas));
    setTxt('d-pendiente',fmt(Math.round(fijosPend)));
    const cp=document.getElementById('card-pend'); if(cp) cp.style.borderLeftColor=fijosPend>0?'#ef4444':'#10b981';
    // Saldo proyectado: bancos disponibles - fijos pendientes - corrientes sin fecha (gastos)
    const corrSinFecha = listaCorrientes.filter(c=>!c.fechaPago&&!c.esIngreso).reduce((a,c)=>a+c.monto,0);
    const saldoProyectado = sumaBancos - fijosPend - corrSinFecha;
    setTxt('d-proyectado', fmt(saldoProyectado));
    setTxt('d-proy-total', fmt(saldoProyectado));
    const dp = document.getElementById('d-proyectado');
    if(dp) dp.style.color = saldoProyectado >= 0 ? '#f59e0b' : '#ef4444';
    const dpT = document.getElementById('d-proy-total');
    if(dpT) dpT.style.color = saldoProyectado >= 0 ? '#f59e0b' : '#ef4444';
    const dps = document.getElementById('d-proyectado-sub');
    if(dps) dps.innerText = 'Banco ' + fmt(sumaBancos) + ' − Pend. ' + fmt(fijosPend + corrSinFecha);
    // Detalle proyectado
    const dpBanco = document.getElementById('d-proy-banco');
    if(dpBanco) dpBanco.innerText = fmt(sumaBancos);
    const dpFijos = document.getElementById('d-proy-fijos-list');
    if(dpFijos) {
        const fijosItems = listaServicios.filter(s=>s.presupuesto>s.pagado);
        if(fijosItems.length) {
            dpFijos.innerHTML = '<div style="color:#64748b;font-size:10px;text-transform:uppercase;margin:4px 0 2px;">Fijos pendientes</div>' +
                fijosItems.map(s=>{
                    const pend = s.presupuesto - s.pagado;
                    return '<div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:8px;"><span style="color:#64748b;">− '+s.nombre+'</span><span style="color:#ef4444;">'+fmt(pend)+'</span></div>';
                }).join('');
        } else {
            dpFijos.innerHTML = '<div style="color:#10b981;font-size:10px;padding:2px 0;">✓ Todos los fijos pagados</div>';
        }
    }
    const dpCorr = document.getElementById('d-proy-corr-list');
    if(dpCorr) {
        const corrItems = listaCorrientes.filter(c=>!c.fechaPago&&!c.esIngreso);
        if(corrItems.length) {
            dpCorr.innerHTML = '<div style="color:#64748b;font-size:10px;text-transform:uppercase;margin:4px 0 2px;">Corrientes sin pagar</div>' +
                corrItems.map(c=>{
                    return '<div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:8px;"><span style="color:#64748b;">− '+(c.detalle||c.rubro||'Sin detalle')+'</span><span style="color:#f59e0b;">'+fmt(c.monto)+'</span></div>';
                }).join('');
        }
    }
    // Presupuesto pesos — Fijos
    const totalSrvPresup = listaServicios.reduce((a,s)=>a+s.presupuesto,0);
    const totalSrvPag    = listaServicios.reduce((a,s)=>a+s.pagado,0);
    const pctSrv = totalSrvPresup>0 ? Math.min(100,Math.round(totalSrvPag/totalSrvPresup*100)) : 0;
    const superadoSrv = totalSrvPresup>0 && totalSrvPag>=totalSrvPresup;
    const barSrv = superadoSrv ? '#10b981' : pctSrv>=80 ? '#f59e0b' : '#6366f1';
    const pSrvV=document.getElementById('d-presup-srv-vals');
    const pSrvB=document.getElementById('d-presup-srv-barf');
    if(pSrvV){ pSrvV.innerText=fmt(totalSrvPag)+' / '+fmt(totalSrvPresup); pSrvV.style.color=barSrv; }
    if(pSrvB){ pSrvB.style.width=pctSrv+'%'; pSrvB.style.background=barSrv; }
    // Presupuesto pesos — Corrientes por rubro
    const totalPresup  = Object.values(listaPresupRubros).reduce((a,b)=>a+b,0);
    const totalGastado = listaCorrientes.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
    const pct = totalPresup>0 ? Math.min(100,Math.round(totalGastado/totalPresup*100)) : 0;
    const superado = totalPresup>0 && totalGastado>=totalPresup;
    const barColor = superado ? '#ef4444' : pct>=80 ? '#f59e0b' : '#10b981';
    const pCorrV=document.getElementById('d-presup-corr-vals');
    const pCorrB=document.getElementById('d-presup-corr-barf');
    const pPct=document.getElementById('d-presup-pct');
    if(pCorrV){ pCorrV.innerText=fmt(totalGastado)+' / '+fmt(totalPresup); pCorrV.style.color=barColor; }
    if(pCorrB){ pCorrB.style.width=pct+'%'; pCorrB.style.background=barColor; }
    if(pPct){ pPct.innerText=totalPresup>0?pct+'% corrientes'+(superado?' · ¡SUPERADO!':pct>=80?' · cerca del límite':''):'configurá límites en Rubros'; pPct.style.color=superado?'#ef4444':pct>=80?'#f59e0b':'#94a3b8'; }
}

// ═══════════════════════════════════════════
//  ALTAS PESOS
// ═══════════════════════════════════════════
function altaBanco(e) { e.preventDefault(); listaBancos.push({id:'b_'+Date.now(),nombre:vGet('banco-nombre'),saldo:nGet('banco-saldo'),autoDescontar:false}); guardar(); e.target.reset(); render(); }

// ── Ingresar Fondos ──────────────────────────────────────────
function abrirModalIngreso() {
    const sel = document.getElementById('ing-cuenta');
    if(!sel) return;
    sel.innerHTML = '';
    listaBancos.forEach(b => { const o=document.createElement('option'); o.value=b.id; o.textContent='🏦 '+b.nombre; sel.appendChild(o); });
    document.getElementById('ing-monto').value = '';
    document.getElementById('ing-desc').value = '';
    document.getElementById('ing-fecha').value = new Date().toISOString().slice(0,10);
    const m = document.getElementById('modal-ingreso');
    m.style.display = 'flex';
}
function cerrarModalIngreso() {
    document.getElementById('modal-ingreso').style.display = 'none';
}
function confirmarIngreso() {
    const bancoId = document.getElementById('ing-cuenta').value;
    const monto = parseFloat(document.getElementById('ing-monto').value)||0;
    const desc = document.getElementById('ing-desc').value.trim()||'Sin descripción';
    const fecha = document.getElementById('ing-fecha').value||new Date().toISOString().slice(0,10);
    if(!bancoId){ alert('Seleccioná una cuenta.'); return; }
    if(monto<=0){ alert('Ingresá un monto mayor a cero.'); return; }
    const banco = listaBancos.find(b=>b.id===bancoId);
    if(!banco){ alert('Cuenta no encontrada.'); return; }
    banco.saldo += monto;
    listaIngresos.push({id:'ing_'+Date.now(), bancoId, bancoNombre:banco.nombre, monto, descripcion:desc, fecha});
    guardar();
    cerrarModalIngreso();
    render();
}
function elimIngreso(id) {
    const ing = listaIngresos.find(i=>i.id===id);
    if(!ing) return;
    if(!confirm('¿Eliminar este ingreso? Se restará el monto del saldo de la cuenta.')) return;
    const banco = listaBancos.find(b=>b.id===ing.bancoId);
    if(banco) banco.saldo -= ing.monto;
    listaIngresos = listaIngresos.filter(i=>i.id!==id);
    guardar();
    render();
}
function altaTarjeta(e) { e.preventDefault(); listaTarjetas.push({id:'t_'+Date.now(),nombre:vGet('tarjeta-nombre'),saldo:nGet('tarjeta-saldo')}); guardar(); e.target.reset(); render(); }
function altaServicio(e) {
    e.preventDefault();
    const medioId=(listaTarjetas[0]?.id)||(listaBancos.find(b=>!b.autoDescontar)?.id)||(listaBancos[0]?.id)||'';
    listaServicios.push({id:'s_'+Date.now(),nombre:vGet('srv-nombre'),presupuesto:nGet('srv-presupuesto'),pagado:0,fVto:vGet('srv-vto'),fPago:'',medioPagoId:medioId,clase:vGet('srv-clase')||'M',rubro:vGet('srv-rubro')||'',nota:vGet('srv-nota')||''});
    guardar(); e.target.reset(); render();
}
function altaCorriente(e) {
    e.preventDefault();
    const medioId=vGet('corr-medio'); if(!medioId){alert('Configure un medio de pago.'); return;}
    const monto=nGet('corr-monto'), esIngreso=document.getElementById('corr-es-ingreso')?.checked||false;
    const clase=vGet('corr-clase')||'M';
    listaCorrientes.push({id:'c_'+Date.now(),rubro:vGet('corr-rubro'),detalle:vGet('corr-detalle'),monto,fechaPago:'',medioPagoId:medioId,esIngreso,clase});
    const chk=document.getElementById('corr-es-ingreso'); if(chk) chk.checked=false;
    guardar(); e.target.reset(); render();
}
function altaTransferencia(e) {
    e.preventDefault();
    const origenId=vGet('transf-origen'), destinoId=vGet('transf-destino'), monto=nGet('transf-monto'), fecha=vGet('transf-fecha');
    if(origenId===destinoId){alert('Origen y destino no pueden ser iguales.');return;}
    if(monto<=0){alert('Monto mayor a cero.');return;}
    const orig=listaBancos.find(b=>b.id===origenId)||listaTarjetas.find(t=>t.id===origenId);
    const dest=listaBancos.find(b=>b.id===destinoId)||listaTarjetas.find(t=>t.id===destinoId);
    if(orig) orig.saldo-=monto; if(dest) dest.saldo+=monto;
    listaTransferencias.push({id:'tr_'+Date.now(),origenId,destinoId,monto,fecha,origenNombre:orig?.nombre||'?',destinoNombre:dest?.nombre||'?'});
    guardar(); e.target.reset(); render();
}
function altaRubro(e) {
    e.preventDefault(); const nombre=vGet('rubro-nombre');
    if(!nombre||listaRubros.includes(nombre)) return;
    listaRubros.push(nombre); guardar(); document.getElementById('rubro-nombre').value=''; render();
}
function previewCuota() {
    const total=parseFloat(document.getElementById('cuota-total')?.value)||0, cant=parseInt(document.getElementById('cuota-cant')?.value)||0;
    const prev=document.getElementById('cuota-preview'); if(prev) prev.innerText=(total>0&&cant>0)?'Cuota: '+fmt(Math.ceil(total/cant))+'/mes':'';
}
function altaCuota(e) {
    e.preventDefault();
    const desc=vGet('cuota-desc'), total=nGet('cuota-total'), cant=parseInt(document.getElementById('cuota-cant')?.value)||0, medioId=vGet('cuota-medio');
    if(!desc||total<=0||cant<2){alert('Completá todos los campos.');return;}
    const montoCuota=Math.ceil(total/cant);
    const cuota={id:'cuota_'+Date.now(),descripcion:desc,montoTotal:total,totalCuotas:cant,montoCuota,medioPagoId:medioId,cuotaActual:1};
    listaCuotas.push(cuota);
    listaServicios.push({id:'s_cuota_'+cuota.id+'_1',nombre:desc+' (1/'+cant+')',presupuesto:montoCuota,pagado:0,fVto:'',fPago:'',medioPagoId:medioId,clase:'M',esCuota:true,cuotaId:cuota.id});
    guardar(); e.target.reset(); document.getElementById('cuota-preview').innerText=''; render();
}
function renderCuotas() {
    const tC=document.getElementById('t-cuotas'); if(!tC) return;
    const sM=document.getElementById('cuota-medio');
    if(sM&&!sM.options.length){ listaBancos.forEach(b=>addOpt(sM,b.id,'🏦 '+b.nombre)); listaTarjetas.forEach(t=>addOpt(sM,t.id,'💳 '+t.nombre)); }
    tC.innerHTML='';
    if(!listaCuotas.length){ tC.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin cuotas.</td></tr>'; return; }
    listaCuotas.forEach(c=>{
        const resto=c.montoCuota*(c.totalCuotas-c.cuotaActual), pct=Math.round((c.cuotaActual/c.totalCuotas)*100);
        const tr=el('tr');
        tr.innerHTML=`<td style="font-size:12px;"><b>${c.descripcion}</b></td><td class="tr" style="font-size:12px;font-weight:bold;color:#6366f1;">${fmt(c.montoCuota)}</td>
            <td class="tc" style="font-size:11px;"><div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;margin-bottom:3px;"><div style="background:#6366f1;height:8px;border-radius:4px;width:${pct}%;"></div></div>${c.cuotaActual}/${c.totalCuotas}</td>
            <td class="tr" style="font-size:12px;color:#64748b;">${fmt(resto)}</td><td class="tc no-print"></td>`;
        const btn=el('button','btn-del'); btn.innerText='✕'; btn.onclick=()=>elimCuota(c.id); tr.lastElementChild.appendChild(btn);
        tC.appendChild(tr);
    });
}

// ═══════════════════════════════════════════
//  ELIMINACIONES PESOS
// ═══════════════════════════════════════════
function elimBanco(id)   { if(confirm('¿Remover esta cuenta?')) { listaBancos=listaBancos.filter(b=>b.id!==id); guardar(); render(); } }
function elimTarjeta(id) { if(confirm('¿Remover esta tarjeta?')){ listaTarjetas=listaTarjetas.filter(t=>t.id!==id); guardar(); render(); } }
function elimServicio(id){ listaServicios=listaServicios.filter(s=>s.id!==id); guardar(); render(); }
function elimCuota(id)   { if(!confirm('¿Eliminar esta cuota?')) return; listaCuotas=listaCuotas.filter(c=>c.id!==id); listaServicios=listaServicios.filter(s=>s.cuotaId!==id); guardar(); render(); }
function elimRubro(r)    { if(listaCorrientes.some(c=>c.rubro===r)){alert('Rubro en uso.');return;} listaRubros=listaRubros.filter(x=>x!==r); guardar(); render(); }
function elimCorriente(id) {
    const c=listaCorrientes.find(x=>x.id===id);
    if(c&&c.fechaPago&&esCuentaLiq(c.medioPagoId)){ const bk=listaBancos.find(b=>b.id===c.medioPagoId); if(bk) bk.saldo+=c.esIngreso?-c.monto:c.monto; }
    listaCorrientes=listaCorrientes.filter(x=>x.id!==id); guardar(); render();
}
function elimTransferencia(id) {
    const t=listaTransferencias.find(x=>x.id===id);
    if(t){ const o=listaBancos.find(b=>b.id===t.origenId)||listaTarjetas.find(x=>x.id===t.origenId); const d=listaBancos.find(b=>b.id===t.destinoId)||listaTarjetas.find(x=>x.id===t.destinoId); if(o) o.saldo+=t.monto; if(d) d.saldo-=t.monto; }
    listaTransferencias=listaTransferencias.filter(x=>x.id!==id); guardar(); render();
}

// ═══════════════════════════════════════════
//  NUEVO MES
// ═══════════════════════════════════════════
function nombreMes() { return new Date().toLocaleString('es-AR',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase()); }
function nuevoMes() {
    const nombre=nombreMes(), sufijo=historicoMeses.some(m=>m.nombre===nombre)?' ('+Date.now()+')':'';
    if(!confirm(`🔄 ¿Abrir nuevo período mensual?\n→ Se archivará "${nombre+sufijo}"\n→ Bancos/tarjetas se ajustan\n→ Servicios fijos se conservan sin pagos\n→ Caja diaria y transferencias se vacían`)) return;
    historicoMeses.push({id:'mes_'+Date.now(),nombre:nombre+sufijo,fechaCierre:new Date().toISOString(),
        datos:{listaBancos:clon(listaBancos),listaTarjetas:clon(listaTarjetas),listaServicios:clon(listaServicios),
               listaCorrientes:clon(listaCorrientes),listaTransferencias:clon(listaTransferencias),
               listaRubros:clon(listaRubros),listaCuotas:clon(listaCuotas),
               listaCuentasUSD:clon(listaCuentasUSD),listaTarjetasUSD:clon(listaTarjetasUSD),
               listaServiciosUSD:clon(listaServiciosUSD),listaCorrientesUSD:clon(listaCorrientesUSD),tipoCambio}});
    // Ajustar tarjetas pesos (bancos ya tienen sus saldos actualizados)
    const mDeb={}; listaTarjetas.forEach(t=>mDeb[t.id]=0);
    listaServicios.forEach(s=>{ if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c=>{ if(c.fechaPago&&mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    listaTarjetas.forEach(t=>{ t.saldo=Math.round(t.saldo+(mDeb[t.id]||0)); });
    // Presupuestos: para rubros sin límite, usar gasto real del mes que cierra
    const gastadoMes={};
    listaCorrientes.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{
        gastadoMes[c.rubro]=(gastadoMes[c.rubro]||0)+Math.round(c.monto);
    });
    listaRubros.forEach(r=>{
        if(!(listaPresupRubros[r]>0) && gastadoMes[r]>0) listaPresupRubros[r]=gastadoMes[r];
    });
    // USD: mismo criterio
    const gastadoMesUSD={};
    listaCorrientesUSD.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{
        gastadoMesUSD[c.rubro]=(gastadoMesUSD[c.rubro]||0)+c.monto;
    });
    listaRubrosUSD.forEach(r=>{
        if(!(listaPresupRubrosUSD[r]>0) && gastadoMesUSD[r]>0) listaPresupRubrosUSD[r]=Math.round(gastadoMesUSD[r]*100)/100;
    });
    // Limpiar pesos
    listaServicios.forEach(s=>{ s.pagado=0; s.fPago=''; if(!s.esCuota) s.fVto=''; });
    listaCorrientes=listaCorrientes.filter(c=>!c.fechaPago);
    listaTransferencias=[];
    // Generar cuotas
    listaCuotas.forEach(c=>{ if(c.cuotaActual<c.totalCuotas){ c.cuotaActual++; listaServicios.push({id:'s_cuota_'+c.id+'_'+c.cuotaActual,nombre:c.descripcion+' ('+c.cuotaActual+'/'+c.totalCuotas+')',presupuesto:c.montoCuota,pagado:0,fVto:'',fPago:'',medioPagoId:c.medioPagoId,clase:'M',esCuota:true,cuotaId:c.id}); } });
    listaCuotas=listaCuotas.filter(c=>c.cuotaActual<c.totalCuotas);
    // Ajustar tarjetas USD
    const mDU={}; listaTarjetasUSD.forEach(t=>mDU[t.id]=0);
    listaServiciosUSD.forEach(s=>{ if(s.pagado>0&&mDU[s.medioPagoId]!==undefined) mDU[s.medioPagoId]+=s.pagado; });
    listaCorrientesUSD.forEach(c=>{ if(mDU[c.medioPagoId]!==undefined) mDU[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    listaTarjetasUSD.forEach(t=>{ t.saldo=Math.round((t.saldo+(mDU[t.id]||0))*100)/100; });
    // Limpiar USD
    listaServiciosUSD.forEach(s=>{ s.pagado=0; s.fPago=''; if(!s.esCuota) s.fVto=''; });
    listaCorrientesUSD=[];
    guardar(); renderTabs(); renderContenido();
    alert('✅ Mes "'+nombre+sufijo+'" archivado. Nuevo período abierto.');
}

// ═══════════════════════════════════════════
//  BACKUP
// ═══════════════════════════════════════════
function exportar() {
    const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
    const data={listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos};
    const lnk=document.createElement('a'); lnk.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data));
    lnk.download='backup_finanzas_'+ts+'.json'; document.body.appendChild(lnk); lnk.click(); lnk.remove();
}
function cargarDatos(res) {
    listaBancos         = res.listaBancos         || [];
    listaTarjetas       = res.listaTarjetas       || [];
    listaServicios      = res.listaServicios      || [];
    listaCorrientes     = res.listaCorrientes     || [];
    listaRubros         = res.listaRubros         || [];
    listaTransferencias = res.listaTransferencias || [];
    listaCuotas         = res.listaCuotas         || [];
    historicoMeses      = res.historicoMeses      || [];
    listaCuentasUSD     = res.listaCuentasUSD     || [];
    listaTarjetasUSD    = res.listaTarjetasUSD    || [];
    listaServiciosUSD   = res.listaServiciosUSD   || [];
    listaCorrientesUSD  = res.listaCorrientesUSD  || [];
    tipoCambio          = res.tipoCambio          || 1200;
    listaInstrumentos   = res.listaInstrumentos   || [];
    listaAcciones       = res.listaAcciones       || [];
    if(res.listaPresupRubros)    listaPresupRubros    = res.listaPresupRubros;
    if(res.listaPresupRubrosUSD) listaPresupRubrosUSD = res.listaPresupRubrosUSD;
    if(res.listaRubrosUSD)       listaRubrosUSD       = res.listaRubrosUSD;
    if(res.listaIngresos)        listaIngresos        = res.listaIngresos;
    if(res.groqKey)            localStorage.setItem('groq_api_key', res.groqKey);
}
function importar(event) {
    const file=event.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=e=>{ try { const res=JSON.parse(e.target.result); if(!res.listaBancos){alert('Backup inválido.');return;} cargarDatos(res); guardar(); renderTabs(); renderContenido(); alert('Backup importado correctamente.'); } catch(err){ alert('Error: '+err.message); } };
    r.readAsText(file); event.target.value='';
}

// ═══════════════════════════════════════════
//  MODAL VENCIMIENTOS
// ═══════════════════════════════════════════
function esFeriado(f) {
    const mm=String(f.getMonth()+1).padStart(2,'0'), dd=String(f.getDate()).padStart(2,'0'), cl=mm+'-'+dd;
    if(['01-01','03-24','04-02','05-01','05-25','06-20','07-09','10-12','11-20','12-08','12-25'].includes(cl)) return true;
    const ss=calcPascua(f.getFullYear()), fD=d=>String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    return cl===fD(ss.jue)||cl===fD(ss.vie);
}
function calcPascua(y) {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mes=Math.floor((h+l-7*m+114)/31)-1,dia=(h+l-7*m+114)%31+1;
    const p=new Date(y,mes,dia); const jue=new Date(p); jue.setDate(p.getDate()-3); const vie=new Date(p); vie.setDate(p.getDate()-2); return {jue,vie};
}
function esHabil(d) { const dw=d.getDay(); return dw!==0&&dw!==6&&!esFeriado(d); }
function proximosHabiles(desde,n) { const dias=[]; const cur=new Date(desde); cur.setHours(0,0,0,0); while(dias.length<n){ cur.setDate(cur.getDate()+1); if(esHabil(cur)) dias.push(new Date(cur)); } return dias; }
function modalVencimientos() {
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    const habiles=proximosHabiles(hoy,5), limite=habiles[habiles.length-1];
    const proximos=listaServicios.filter(s=>{ if(!s.fVto) return false; if(s.pagado>=s.presupuesto&&s.presupuesto>0) return false; const v=new Date(s.fVto+'T00:00:00'); return v>=hoy&&v<=limite; });
    // Cuotas por terminar: 1 o 2 cuotas restantes
    const cuotasTerminando = listaCuotas.filter(c=>(c.totalCuotas-c.cuotaActual)<=2);
    if(!proximos.length && !cuotasTerminando.length) return;
    const fmtF=d=>d.toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});
    const conDias2=proximos.map(s=>{ const v=new Date(s.fVto+'T00:00:00'); let dh=0; const cur=new Date(hoy); while(cur<v){cur.setDate(cur.getDate()+1);if(esHabil(cur))dh++;} return {...s,vtoDate:v,diasH:dh}; }).sort((a,b)=>a.vtoDate-b.vtoDate);
    let itemsHtml='';
    if(proximos.length){
        itemsHtml += '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Vencimientos próximos</div>';
        itemsHtml += conDias2.map(s=>{ const urg=s.diasH<=2, lbl=s.diasH===0?'¡Hoy!':s.diasH===1?'1 día hábil':s.diasH+' días hábiles'; const pend=s.presupuesto>0?fmt(s.presupuesto-s.pagado):'—'; const sub=s.pagado>0?'Pago parcial · Resta '+pend:'Pendiente · '+pend; return '<div class="vto-item '+(urg?'urgente':'proximo')+'"><div><div class="vto-nombre">'+s.nombre+'</div><div class="vto-sub">'+sub+'</div></div><div class="vto-fecha"><div class="vto-dias">'+lbl+'</div><div class="vto-txt">'+fmtF(s.vtoDate)+'</div></div></div>'; }).join('');
    }
    if(cuotasTerminando.length){
        itemsHtml += '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin:'+(proximos.length?'16px':'0')+'px 0 8px;">⚡ Cuotas por terminar</div>';
        itemsHtml += cuotasTerminando.map(c=>{ const rest=c.totalCuotas-c.cuotaActual; const lbl=rest===0?'Última cuota':rest===1?'Quedan 2 cuotas':'Quedan '+rest+' cuotas'; return '<div class="vto-item proximo"><div><div class="vto-nombre">'+c.descripcion+'</div><div class="vto-sub">'+fmt(c.montoCuota)+'/mes · Cuota '+c.cuotaActual+' de '+c.totalCuotas+'</div></div><div class="vto-fecha"><div class="vto-dias" style="background:#f3e8ff;color:#7c3aed;">'+lbl+'</div></div></div>'; }).join('');
    }
    const ov=el('div','modal-overlay no-print'); ov.id='modal-vto';
    const titulo = proximos.length && cuotasTerminando.length ? 'Vencimientos y cuotas próximas' : proximos.length ? 'Vencimientos en los próximos 5 días hábiles' : 'Cuotas por terminar';
    ov.innerHTML='<div class="modal-box"><div class="modal-header"><span style="font-size:20px;">⚠️</span><h3>'+titulo+'</h3></div><div class="modal-body">'+itemsHtml+'</div><div class="modal-footer"><button class="btn btn-dark" onclick="document.getElementById(\'modal-vto\').remove()">Entendido</button></div></div>';
    document.body.appendChild(ov);
}

// ═══════════════════════════════════════════
//  DÓLARES
// ═══════════════════════════════════════════
function buildDolares() {
    const d=document.createElement('div');
    d.innerHTML=`
    <div class="container">
      <header class="no-print" style="border-bottom:3px solid #16a34a;">
        <div><h2 style="margin:0;font-size:20px;">💵 Gestión en Dólares</h2><p class="version-tag" style="color:#16a34a;">Cuentas, tarjetas y operatoria en USD</p></div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div id="dol-tc-badge" style="font-size:13px;font-weight:bold;color:#15803d;padding:8px 14px;background:#f0fdf4;border-radius:6px;border:2px solid #86efac;">USD Oficial: cargando...</div>
          <button class="btn no-print" id="btn-dol-actualizar" style="background:#16a34a;color:white;">🔄 Actualizar TC</button>
        </div>
      </header>
      <div class="grid-dashboard" style="margin-top:20px;">
        <div class="card-bal" style="border-left:5px solid #16a34a;"><h4>USD Disponibles</h4><p id="usd-disp" style="color:#16a34a;">USD 0</p><small id="usd-disp-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>USD a Pagar (tarjetas)</h4><p id="usd-pagar" style="color:#a855f7;">USD 0</p><small id="usd-pagar-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" id="card-usd-bal" style="border-left:5px solid #f59e0b;"><h4>Balance USD</h4><p id="usd-bal" style="color:#f59e0b;">USD 0</p><small id="usd-bal-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" id="card-usd-comp" style="border-left:5px solid #94a3b8;"><h4>USD a Comprar</h4><p id="usd-comp" style="color:#94a3b8;">—</p><small id="usd-comp-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" style="border-left:5px solid #10b981;">
          <h4>Presupuesto Mes USD</h4>
          <div style="margin-top:6px;">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Servicios Fijos</div>
            <div id="d-presup-usd-srv-vals" style="font-size:15px;font-weight:bold;color:#10b981;">USD 0 <span style="font-size:12px;color:#94a3b8;">/ USD 0</span></div>
            <div style="background:#e2e8f0;border-radius:4px;height:5px;margin:4px 0 2px;"><div id="d-presup-usd-srv-barf" style="height:5px;border-radius:4px;width:0%;background:#10b981;transition:width 0.3s;"></div></div>
            <small id="d-presup-usd-srv-pct" style="font-size:10px;color:#94a3b8;">0%</small>
          </div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:3px;">Corrientes por Rubro</div>
            <div id="d-presup-usd-vals" style="font-size:15px;font-weight:bold;color:#10b981;">USD 0 <span style="font-size:12px;color:#94a3b8;">/ USD 0</span></div>
            <div style="background:#e2e8f0;border-radius:4px;height:5px;margin:4px 0 2px;"><div id="d-presup-usd-barf" style="height:5px;border-radius:4px;width:0%;background:#10b981;transition:width 0.3s;"></div></div>
            <small id="d-presup-usd-pct" style="font-size:10px;color:#94a3b8;">0% · configurá límites en Rubros USD</small>
          </div>
        </div>
      </div>
      <div class="grid-principal">
        <div>
          <div class="panel no-print" style="border-top:4px solid #16a34a;">
            <h3 class="panel-title">🏦 Cuentas en USD</h3>
            <div class="form-block">
              <form id="form-cusd">
                <div class="form-group"><label>Nombre</label><input type="text" id="cusd-nombre" required placeholder="Ej. Billetera USD"></div>
                <div class="form-group"><label>Saldo (USD)</label><input type="number" id="cusd-saldo" required value="0" step="0.01"></div>
                <button type="submit" class="btn btn-add" style="background:#16a34a;">Añadir Cuenta USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:40%">Cuenta</th><th style="width:28%" class="tr">Saldo (USD)</th><th style="width:27%" class="tr">En pesos</th><th style="width:5%"></th></tr></thead><tbody id="t-cusd"></tbody></table>
          </div>
          <div class="panel no-print" style="border-top:4px solid #a855f7;">
            <h3 class="panel-title">💳 Tarjetas en USD</h3>
            <div class="form-block">
              <form id="form-tusd">
                <div class="form-group"><label>Nombre</label><input type="text" id="tusd-nombre" required placeholder="Ej. Visa Santander USD"></div>
                <div class="form-group"><label>Saldo base (USD)</label><input type="number" id="tusd-saldo" required value="0" step="0.01"></div>
                <button type="submit" class="btn btn-add" style="background:#a855f7;">Registrar Tarjeta USD</button>
              </form>
            </div>
            <div id="t-tusd"></div>
          </div>
        </div>
        <div>
          <div class="panel" style="border-top:4px solid #4f46e5;">
            <h3 class="panel-title">📋 Servicios Fijos en USD</h3>
            <div class="form-block no-print">
              <form id="form-susd">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="susd-nombre" required placeholder="Ej. Netflix, AWS"></div>
                  <div><label>Monto (USD)</label><input type="number" id="susd-presupuesto" required placeholder="0" step="0.01"></div>
                  <div><label>Vto.</label><input type="date" id="susd-vto" required></div>
                </div>
                <button type="submit" class="btn btn-add" style="background:#4f46e5;">Configurar Servicio USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:22%">Servicio</th><th style="width:13%" class="tc">Vto.</th><th style="width:12%" class="tr">Presup.</th><th style="width:12%" class="tr">Pagado</th><th style="width:12%" class="tc">F.Pago</th><th style="width:15%">Medio</th><th style="width:9%" class="tc">Estado</th><th style="width:4%" class="no-print"></th></tr></thead><tbody id="t-susd"></tbody></table>
          </div>
          <div class="panel" style="border-top:4px solid #10b981;">
            <h3 class="panel-title">🛍️ Gastos Corrientes en USD</h3>
            <div class="form-block no-print">
              <form id="form-ccusd">
                <div class="form-row">
                  <div style="flex:1.5"><label>Rubro</label><select id="ccusd-rubro" required></select></div>
                  <div style="flex:2"><label>Detalle</label><input type="text" id="ccusd-detalle" required placeholder="Ej. Amazon"></div>
                  <div><label>Monto (USD)</label><input type="number" id="ccusd-monto" required placeholder="0" step="0.01"></div>
                  <div><label>Pagar con</label><select id="ccusd-medio" required></select></div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <input type="checkbox" id="ccusd-ingreso" style="width:16px;height:16px;accent-color:#10b981;cursor:pointer;">
                  <label for="ccusd-ingreso" style="font-size:13px;color:#334155;text-transform:none;font-weight:bold;cursor:pointer;">Es un ingreso</label>
                </div>
                <button type="submit" class="btn btn-add" style="background:#10b981;">Asentar Gasto en USD</button>
              </form>
            </div>
            <div id="wrap-ccusd"></div>
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0;">
              <div style="font-size:12px;font-weight:bold;color:#334155;text-transform:uppercase;margin-bottom:8px;">⚙️ Rubros USD</div>
              <div id="rubros-usd-lista" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;"></div>
              <form id="form-rubro-usd" style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:12px;">
                <input type="text" id="rubro-usd-nombre" placeholder="Ej. Electrónica" style="padding:7px;border:1px solid #cbd5e1;border-radius:4px;font-size:13px;">
                <button type="submit" class="btn" style="background:#16a34a;color:white;font-size:12px;">+ Agregar</button>
              </form>
            </div>
            <div id="rubros-presup-usd-wrap" style="margin-top:14px;"></div>
          </div>
        </div>
      </div>
    </div>`;
    return d;
}

function bindDolares() {
    const g=id=>document.getElementById(id);
    g('form-cusd')?.addEventListener('submit', altaCuentaUSD);
    g('form-tusd')?.addEventListener('submit', altaTarjetaUSD);
    g('form-susd')?.addEventListener('submit', altaServicioUSD);
    g('form-ccusd')?.addEventListener('submit', altaCorrienteUSD);
    g('btn-dol-actualizar')?.addEventListener('click', actualizarTCDolares);
    g('form-rubro-usd')?.addEventListener('submit', e=>{
        e.preventDefault();
        const nombre = document.getElementById('rubro-usd-nombre')?.value?.trim();
        if(!nombre||listaRubrosUSD.includes(nombre)) return;
        listaRubrosUSD.push(nombre); guardar();
        document.getElementById('rubro-usd-nombre').value='';
        renderDolares();
    });
}

function calcMDU() {
    const mDU={};
    listaTarjetasUSD.forEach(t=>mDU[t.id]=0);
    listaCuentasUSD.forEach(c=>mDU[c.id]=0);
    listaServiciosUSD.forEach(s=>{ if(s.pagado>0&&mDU[s.medioPagoId]!==undefined) mDU[s.medioPagoId]+=s.pagado; });
    listaCorrientesUSD.forEach(c=>{ if(mDU[c.medioPagoId]!==undefined) mDU[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    return mDU;
}

async function actualizarTCDolares() {
    const btn = document.getElementById('btn-dol-actualizar');
    if(btn){ btn.disabled=true; btn.innerText='⏳ Actualizando...'; }
    try {
        const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await res.json();
        tipoCambio = data.oficial.value_sell;
        guardar();
        const badge = document.getElementById('dol-tc-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(tipoCambio) + ' (venta)';
        calcDashUSD();
    } catch(e) {
        const badge = document.getElementById('dol-tc-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(tipoCambio) + ' (guardado)';
    }
    if(btn){ btn.disabled=false; btn.innerText='🔄 Actualizar TC'; }
}

function calcDashUSD() {
    const mDU=calcMDU(), tc=tipoCambio;
    const totalDisp=listaCuentasUSD.reduce((a,c)=>a+c.saldo,0);
    const totalTarj=listaTarjetasUSD.reduce((a,t)=>a+(t.saldo+(mDU[t.id]||0)),0);
    const balance=totalDisp-totalTarj;
    setTxt('usd-disp',      fmtUSD(totalDisp));
    setTxt('usd-disp-ars',  fmt(totalDisp*tc));
    setTxt('usd-pagar',     fmtUSD(totalTarj));
    setTxt('usd-pagar-ars', fmt(totalTarj*tc));
    setTxt('usd-bal',       fmtUSD(balance));
    setTxt('usd-bal-ars',   fmt(Math.abs(balance)*tc));
    const dBal=document.getElementById('usd-bal'), cBal=document.getElementById('card-usd-bal');
    const dComp=document.getElementById('usd-comp'), dCA=document.getElementById('usd-comp-ars'), cComp=document.getElementById('card-usd-comp');
    if(dBal) dBal.style.color=balance>=0?'#16a34a':'#ef4444';
    if(cBal) cBal.style.borderLeftColor=balance>=0?'#16a34a':'#ef4444';
    if(balance<0){ const f=Math.abs(balance); if(dComp){dComp.innerText=fmtUSD(f);dComp.style.color='#ef4444';} if(dCA) dCA.innerText=fmt(f*tc); if(cComp) cComp.style.borderLeftColor='#ef4444'; }
    else { if(dComp){dComp.innerText='—';dComp.style.color='#94a3b8';} if(dCA) dCA.innerText=''; if(cComp) cComp.style.borderLeftColor='#94a3b8'; }
    // Presupuesto USD — servicios fijos
    const totalSrvPresupUSD = listaServiciosUSD.reduce((a,s)=>a+s.presupuesto,0);
    const totalSrvPagadoUSD = listaServiciosUSD.reduce((a,s)=>a+s.pagado,0);
    const pctSrvUSD = totalSrvPresupUSD>0 ? Math.min(100,Math.round(totalSrvPagadoUSD/totalSrvPresupUSD*100)) : 0;
    const superadoSrvUSD = totalSrvPresupUSD>0 && totalSrvPagadoUSD>=totalSrvPresupUSD;
    const barSrvUSD = superadoSrvUSD ? '#ef4444' : pctSrvUSD>=80 ? '#f59e0b' : '#10b981';
    const psvEl=document.getElementById('d-presup-usd-srv-vals');
    const psbEl=document.getElementById('d-presup-usd-srv-barf');
    const pspEl=document.getElementById('d-presup-usd-srv-pct');
    if(psvEl){ psvEl.innerHTML=fmtUSD(totalSrvPagadoUSD)+' <span style="font-size:12px;color:#94a3b8;">/ '+fmtUSD(totalSrvPresupUSD)+'</span>'; psvEl.style.color=barSrvUSD; }
    if(psbEl){ psbEl.style.width=pctSrvUSD+'%'; psbEl.style.background=barSrvUSD; }
    if(pspEl){ pspEl.innerText=totalSrvPresupUSD>0?pctSrvUSD+'% pagado'+(superadoSrvUSD?' · ¡PAGADO!':pctSrvUSD>=80?' · casi completo':''):'Sin servicios USD'; pspEl.style.color=superadoSrvUSD?'#10b981':pctSrvUSD>=80?'#f59e0b':'#94a3b8'; }
    // Presupuesto USD — corrientes por rubro
    const totalPresupUSD = Object.values(listaPresupRubrosUSD).reduce((a,b)=>a+b,0);
    const totalGastadoUSD = listaCorrientesUSD.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
    const pctUSD = totalPresupUSD>0 ? Math.min(100,Math.round(totalGastadoUSD/totalPresupUSD*100)) : 0;
    const superadoUSD = totalPresupUSD>0 && totalGastadoUSD>=totalPresupUSD;
    const barColorUSD = superadoUSD ? '#ef4444' : pctUSD>=80 ? '#f59e0b' : '#10b981';
    const pvEl=document.getElementById('d-presup-usd-vals');
    const pbEl=document.getElementById('d-presup-usd-barf');
    const ppEl=document.getElementById('d-presup-usd-pct');
    if(pvEl){ pvEl.innerHTML=fmtUSD(totalGastadoUSD)+' <span style="font-size:12px;color:#94a3b8;">/ '+fmtUSD(totalPresupUSD)+'</span>'; pvEl.style.color=barColorUSD; }
    if(pbEl){ pbEl.style.width=pctUSD+'%'; pbEl.style.background=barColorUSD; }
    if(ppEl){ ppEl.innerText=totalPresupUSD>0?pctUSD+'% usado'+(superadoUSD?' · ¡SUPERADO!':pctUSD>=80?' · cerca del límite':''):'0% · configurá límites en Rubros USD'; ppEl.style.color=superadoUSD?'#ef4444':pctUSD>=80?'#f59e0b':'#94a3b8'; }
    // Actualizar consumo en tabla tarjetas sin reconstruir
    const rowsTU=document.querySelectorAll('#t-tusd tr');
    listaTarjetasUSD.forEach((t,i)=>{ if(rowsTU[i]){ const tds=rowsTU[i].querySelectorAll('td'); const consumo=mDU[t.id]||0; if(tds[2]) tds[2].innerText=consumo>0?fmtUSD(consumo):'—'; if(tds[3]) tds[3].innerText=fmt((t.saldo+consumo)*tc); } });
    // Actualizar estado servicios USD
    listaServiciosUSD.forEach(s=>{ const sp=document.getElementById('estu-'+s.id); if(sp){ if(s.pagado>=s.presupuesto&&s.presupuesto>0){sp.innerText='PAGADO';sp.style.background='#e6f4ea';sp.style.color='#137333';} else if(s.pagado>0){sp.innerText='PARCIAL';sp.style.background='#fef7e0';sp.style.color='#b06000';} else{sp.innerText='PENDIENTE';sp.style.background='#fce8e6';sp.style.color='#c5221f';} } });
}

function renderDolares() {
    const tCU=document.getElementById('t-cusd'), tTU=document.getElementById('t-tusd'), tSU=document.getElementById('t-susd');
    if(!tCU) return;
    tCU.innerHTML=''; tTU.innerHTML=''; tSU.innerHTML='';
    const selR=document.getElementById('ccusd-rubro'), selM=document.getElementById('ccusd-medio');
    if(selR){ selR.innerHTML=''; listaRubrosUSD.forEach(r=>addOpt(selR,r,r)); }
    if(selM){ selM.innerHTML=''; listaTarjetasUSD.forEach(t=>addOpt(selM,t.id,'💳 '+t.nombre)); listaCuentasUSD.forEach(c=>addOpt(selM,c.id,'🏦 '+c.nombre)); }
    const mDU=calcMDU();
    // Rubros USD badges
    const rUSDLista = document.getElementById('rubros-usd-lista');
    if(rUSDLista){
        rUSDLista.innerHTML='';
        listaRubrosUSD.forEach(r=>{
            const b=el('div'); b.style.cssText='background:#dcfce7;border-left:4px solid #16a34a;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;display:flex;align-items:center;gap:6px;';
            const s=el('span'); s.style.color='#15803d'; s.innerText=r;
            const x=el('button'); x.type='button'; x.innerText='✕'; x.style.cssText='border:none;background:transparent;color:#ef4444;cursor:pointer;font-weight:bold;font-size:12px;padding:0;';
            x.onclick=()=>{
                if(listaCorrientesUSD.some(c=>c.rubro===r)){alert('Rubro en uso.');return;}
                listaRubrosUSD=listaRubrosUSD.filter(x=>x!==r);
                delete listaPresupRubrosUSD[r];
                guardar(); renderDolares();
            };
            b.appendChild(s); b.appendChild(x); rUSDLista.appendChild(b);
        });
    }
    // Cuentas USD
    let totCU=0;
    listaCuentasUSD.forEach(c=>{ totCU+=c.saldo;
        const inp=inpNumUSD(c.saldo,v=>{ c.saldo=v; guardar(); calcDashUSD(); }); inp.style.color='#16a34a'; inp.style.fontWeight='bold';
        const tdS=el('td','tr'); tdS.appendChild(inp);
        const tdA=el('td','tr'); tdA.style.cssText='color:#64748b;font-size:12px;'; tdA.innerText=fmt(c.saldo*tipoCambio);
        tCU.appendChild(fila([tdHTML(`<b>${c.nombre}</b>`),tdS,tdA,tdBtn('✕',()=>elimCuentaUSD(c.id))]));
    });
    if(listaCuentasUSD.length){ const trT=el('tr'); trT.style.background='#f8fafc'; trT.innerHTML=`<td><b>Total</b></td><td class="tr" style="color:#16a34a;font-weight:bold;">${fmtUSD(totCU)}</td><td class="tr" style="font-weight:bold;">${fmt(totCU*tipoCambio)}</td><td></td>`; tCU.appendChild(trT); }
    else tCU.innerHTML='<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin cuentas USD.</td></tr>';
    // Tarjetas USD - cards
    let totTU=0;
    if(!listaTarjetasUSD.length){ tTU.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;">Sin tarjetas USD.</p>'; }
    else {
        listaTarjetasUSD.forEach(function(t){
            const consumo=mDU[t.id]||0, total=t.saldo+consumo; totTU+=total;
            const card=el('div'); card.style.cssText='border:1px solid #e2e8f0;border-left:4px solid #a855f7;border-radius:6px;padding:12px;margin-bottom:8px;background:white;';
            const row1=el('div'); row1.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
            const nom=el('span'); nom.style.cssText='font-weight:bold;color:#1e293b;font-size:14px;'; nom.innerText=t.nombre;
            const btnX=el('button','btn-del'); btnX.innerText='\u2715'; btnX.onclick=function(){ elimTarjetaUSD(t.id); };
            row1.appendChild(nom); row1.appendChild(btnX);
            const mkC=function(label,node,color){ const c=el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 10px;'; const l=el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;'; l.innerText=label; const v=el('div'); v.style.cssText='font-size:15px;font-weight:bold;color:'+(color||'#1e293b')+';'; if(typeof node==='string') v.innerText=node; else v.appendChild(node); c.appendChild(l); c.appendChild(v); return c; };
            const inp=inpNumUSD(t.saldo,function(v){ t.saldo=v; guardar(); calcDashUSD(); });
            inp.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;font-size:15px;font-weight:bold;color:#a855f7;background:white;text-align:right;';
            const row2=el('div'); row2.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;';
            row2.appendChild(mkC('Saldo Base',inp,'#a855f7'));
            row2.appendChild(mkC('Consumo Mes',consumo>0?fmtUSD(consumo):'\u2014','#6366f1'));
            const cP=el('div'); cP.style.cssText='background:#f0f9ff;border-radius:4px;padding:6px 10px;'; const lP=el('div'); lP.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;'; lP.innerText='En Pesos'; const vP=el('div'); vP.style.cssText='font-size:15px;font-weight:bold;color:#0284c7;'; vP.innerText=fmt(total*tipoCambio); cP.appendChild(lP); cP.appendChild(vP);
            card.appendChild(row1); card.appendChild(row2); card.appendChild(cP); tTU.appendChild(card);
        });
        const tot=el('div'); tot.style.cssText='background:#f8fafc;border-radius:6px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:4px;';
        tot.innerHTML='<span style="font-weight:bold;color:#1e293b;">Total</span><div style="text-align:right;"><div style="font-weight:bold;color:#a855f7;font-size:15px;">'+fmtUSD(totTU)+'</div><div style="font-size:13px;color:#0284c7;">'+fmt(totTU*tipoCambio)+'</div></div>';
        tTU.appendChild(tot);
    }
    // Servicios USD
    [...listaServiciosUSD].sort((a,b)=>{ const est=s=>s.pagado>=s.presupuesto&&s.presupuesto>0?2:s.pagado>0?1:0; return est(a)!==est(b)?est(a)-est(b):a.nombre.localeCompare(b.nombre,'es'); }).forEach(s=>{
        const medSel=el('select'); medSel.className='inp';
        listaTarjetasUSD.forEach(t=>addOpt(medSel,t.id,'💳 '+t.nombre,t.id===s.medioPagoId));
        listaCuentasUSD.forEach(c=>addOpt(medSel,c.id,'🏦 '+c.nombre,c.id===s.medioPagoId));
        medSel.onchange=e=>{ s.medioPagoId=e.target.value; guardar(); calcDashUSD(); };
        const estSpan=el('span'); estSpan.id='estu-'+s.id; estSpan.style.cssText='font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;';
        const tdEst=el('td','tc'); tdEst.appendChild(estSpan);
        const tr=el('tr');
        [tdHTML(`<b>${s.nombre}</b>`), tdInpDate(s.fVto,v=>{ s.fVto=v; guardar(); }),
         (()=>{ const td=el('td','tr'); td.appendChild(inpNumUSD(s.presupuesto,v=>{ s.presupuesto=v; guardar(); calcDashUSD(); })); return td; })(),
         (()=>{ const td=el('td','tr');
            td.appendChild(inpNumUSD(s.pagado,v=>{
                const diff=v-s.pagado;
                if(diff!==0){ const tk=listaTarjetasUSD.find(t=>t.id===s.medioPagoId), ck=listaCuentasUSD.find(c=>c.id===s.medioPagoId); if(tk) tk.saldo+=diff; else if(ck) ck.saldo-=diff; }
                s.pagado=v; guardar(); calcDashUSD();
            })); return td; })(),
         tdInpDate(s.fPago,v=>{ s.fPago=v; guardar(); }),
         (()=>{ const td=el('td'); td.appendChild(medSel); return td; })(),
         tdEst, tdBtn('✕',()=>elimServicioUSD(s.id))
        ].forEach(td=>tr.appendChild(td));
        tSU.appendChild(tr);
    });
    if(!listaServiciosUSD.length) tSU.innerHTML='<tr><td colspan="8" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios USD.</td></tr>';
    // Corrientes USD
    const wCU=document.getElementById('wrap-ccusd');
    if(wCU){
        wCU.innerHTML='';
        const tbl=el('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;';
        const thead=el('thead'); thead.innerHTML='<tr><th style="width:20%">Rubro</th><th style="width:27%">Detalle</th><th style="width:17%">Medio</th><th style="width:13%;text-align:center;">F. Pago</th><th style="width:15%;text-align:right;">Monto (USD)</th><th style="width:8%" class="no-print"></th></tr>';
        const tbody=el('tbody');
        if(!listaCorrientesUSD.length){ tbody.innerHTML='<tr><td colspan="6" class="tc" style="color:#94a3b8;padding:15px;">Sin gastos corrientes en USD.</td></tr>'; }
        else { listaCorrientesUSD.forEach(c=>{
            const medio=listaTarjetasUSD.find(t=>t.id===c.medioPagoId)||listaCuentasUSD.find(x=>x.id===c.medioPagoId);
            const mNom=(c.esIngreso?'⬆ ':'')+((medio?(listaTarjetasUSD.find(t=>t.id===c.medioPagoId)?'💳 ':'🏦 ')+medio.nombre:'Desconocido'));
            const selR2=el('select'); selR2.className='inp'; listaRubrosUSD.forEach(r=>addOpt(selR2,r,r,r===c.rubro)); selR2.onchange=e=>{ c.rubro=e.target.value; guardar(); };
            const inpD=el('input'); inpD.type='text'; inpD.className='inp'; inpD.value=c.detalle; inpD.onchange=e=>{ c.detalle=e.target.value.trim(); guardar(); };
            const inpFP=el('input'); inpFP.type='date'; inpFP.className='inp'; inpFP.value=c.fechaPago||'';
            inpFP.onchange=e=>{ c.fechaPago=e.target.value; guardar(); calcDashUSD(); };
            const inpM=inpNumUSD(c.monto,v=>{ c.monto=v; guardar(); calcDashUSD(); });
            inpM.style.cssText='font-weight:bold;color:'+(c.esIngreso?'#0284c7':'#10b981')+';';
            const tdR2=el('td'); tdR2.appendChild(selR2);
            const tdD=el('td'); tdD.appendChild(inpD);
            const tdM=el('td'); tdM.style.color='#64748b'; tdM.innerText=mNom;
            const tdFP=el('td','tc'); tdFP.appendChild(inpFP);
            const tdMon=el('td','tr'); tdMon.appendChild(inpM);
            const tdX=el('td','tc no-print'); const bX=el('button','btn-del'); bX.innerText='✕'; bX.onclick=()=>elimCorrienteUSD(c.id); tdX.appendChild(bX);
            const tr=el('tr'); [tdR2,tdD,tdM,tdFP,tdMon,tdX].forEach(td=>tr.appendChild(td)); tbody.appendChild(tr);
        }); }
        tbl.appendChild(thead); tbl.appendChild(tbody); wCU.appendChild(tbl);
    }
    calcDashUSD();
    renderPresupRubrosUSD();
}

// ALTAS USD
function altaCuentaUSD(e)    { e.preventDefault(); listaCuentasUSD.push({id:'cu_'+Date.now(),nombre:vGet('cusd-nombre'),saldo:parseFloat(document.getElementById('cusd-saldo').value)||0}); guardar(); e.target.reset(); renderDolares(); }
function altaTarjetaUSD(e)   { e.preventDefault(); listaTarjetasUSD.push({id:'tu_'+Date.now(),nombre:vGet('tusd-nombre'),saldo:parseFloat(document.getElementById('tusd-saldo').value)||0}); guardar(); e.target.reset(); renderDolares(); }
function altaServicioUSD(e)  { e.preventDefault(); const mId=listaTarjetasUSD[0]?.id||listaCuentasUSD[0]?.id||''; listaServiciosUSD.push({id:'su_'+Date.now(),nombre:vGet('susd-nombre'),presupuesto:parseFloat(document.getElementById('susd-presupuesto').value)||0,pagado:0,fVto:vGet('susd-vto'),fPago:'',medioPagoId:mId}); guardar(); e.target.reset(); renderDolares(); }
function altaCorrienteUSD(e) {
    e.preventDefault();
    const medioId=document.getElementById('ccusd-medio').value; if(!medioId){alert('Configure un medio de pago USD.');return;}
    const monto=parseFloat(document.getElementById('ccusd-monto').value)||0, esIngreso=document.getElementById('ccusd-ingreso')?.checked||false;
    listaCorrientesUSD.push({id:'cc_'+Date.now(),rubro:document.getElementById('ccusd-rubro').value,detalle:vGet('ccusd-detalle'),monto,fechaPago:'',medioPagoId:medioId,esIngreso});
    const chk=document.getElementById('ccusd-ingreso'); if(chk) chk.checked=false;
    guardar(); e.target.reset(); renderDolares();
}
// ELIMINACIONES USD
function elimCuentaUSD(id)    { if(confirm('¿Remover cuenta USD?'))  { listaCuentasUSD=listaCuentasUSD.filter(c=>c.id!==id);       guardar(); renderDolares(); } }
function elimTarjetaUSD(id)   { if(confirm('¿Remover tarjeta USD?')) { listaTarjetasUSD=listaTarjetasUSD.filter(t=>t.id!==id);     guardar(); renderDolares(); } }
function elimServicioUSD(id)  { listaServiciosUSD=listaServiciosUSD.filter(s=>s.id!==id);                                          guardar(); renderDolares(); }
function elimCorrienteUSD(id) { listaCorrientesUSD=listaCorrientesUSD.filter(x=>x.id!==id);                                       guardar(); renderDolares(); }


function dibujarTorta(canvasId, leyId, items, fmtVal, coloresFijos) {
    const total = items.reduce(function(a,i){ return a+i.valor; }, 0);
    if (!total) return;
    const paleta = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
    // Si hay colores fijos, no ordenar (mantener orden del caller); si no, ordenar por valor desc
    const itemsOrd = coloresFijos ? items : items.slice().sort(function(a,b){ return b.valor-a.valor; });
    setTimeout(function(){
        const tw = document.getElementById(canvasId); if(!tw) return;
        const cv = el('canvas'); cv.width=300; cv.height=300; tw.appendChild(cv);
        const ctx = cv.getContext('2d'); const cx=150,cy=150,r=120,ri=60; let ang=-Math.PI/2;
        itemsOrd.forEach(function(it,i){
            const pct=it.valor/total, a2=ang+pct*2*Math.PI, col=coloresFijos?coloresFijos[i]:paleta[i%paleta.length];
            ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,a2); ctx.closePath();
            ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
            if(pct>0.05){ const ma=ang+(a2-ang)/2;
                ctx.fillStyle='white'; ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
                ctx.fillText((pct*100).toFixed(0)+'%', cx+(r*0.68)*Math.cos(ma), cy+(r*0.68)*Math.sin(ma)); }
            ang=a2;
        });
        ctx.beginPath(); ctx.arc(cx,cy,ri,0,2*Math.PI); ctx.fillStyle='white'; ctx.fill();
        ctx.fillStyle='#1e293b'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('Total',cx,cy-10); ctx.fillStyle='#4f46e5'; ctx.fillText(fmtVal(total),cx,cy+10);
        const ley = document.getElementById(leyId);
        if(ley){ ley.innerHTML=''; itemsOrd.forEach(function(it,i){
            const d=el('div'); d.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:8px;';
            d.innerHTML='<div style="width:12px;height:12px;border-radius:3px;background:'+(coloresFijos?coloresFijos[i]:paleta[i%paleta.length])+';flex-shrink:0;"></div>';
            const span1=el('span'); span1.style.cssText='font-size:12px;font-weight:bold;color:#1e293b;'; span1.innerText=it.label;
            const span2=el('span'); span2.style.cssText='font-size:11px;color:#64748b;'; span2.innerText=fmtVal(it.valor)+' · '+(it.valor/total*100).toFixed(1)+'%';
            d.appendChild(span1); d.appendChild(span2); ley.appendChild(d);
        }); }
    },50);
}

function mkTortaDoble(id1, ley1, tit1, id2, ley2, tit2, color1, color2) {
    const d = el('div');
    d.style.cssText = 'background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid '+color1+';padding:20px;margin-bottom:16px;';
    d.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">' +
            '<div>' +
                '<h4 style="margin:0 0 14px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 '+tit1+'</h4>' +
                '<div style="display:flex;align-items:flex-start;gap:16px;">' +
                    '<div id="'+id1+'"></div>' +
                    '<div id="'+ley1+'" style="max-height:240px;overflow-y:auto;flex:1;min-width:0;"></div>' +
                '</div>' +
            '</div>' +
            '<div style="border-left:1px solid #e2e8f0;padding-left:24px;">' +
                '<h4 style="margin:0 0 14px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 '+tit2+'</h4>' +
                '<div style="display:flex;align-items:flex-start;gap:16px;">' +
                    '<div id="'+id2+'"></div>' +
                    '<div id="'+ley2+'" style="max-height:240px;overflow-y:auto;flex:1;min-width:0;"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    return d;
}

// ═══════════════════════════════════════════
//  REPORTES
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
//  PESTAÑA PRESUPUESTO
// ═══════════════════════════════════════════
function buildPresupuesto() {
    const wrap = el('div','container'); wrap.style.paddingTop = '24px';

    // ── Header ──
    const hdr = el('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;padding-bottom:14px;border-bottom:3px solid #6d28d9;';
    const mes = new Date().toLocaleDateString('es-AR',{month:'long',year:'numeric'});
    hdr.innerHTML = '<div><h2 style="margin:0;font-size:22px;color:#1e293b;">🎯 Presupuesto Mensual</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">'+mes.charAt(0).toUpperCase()+mes.slice(1)+' · Edición directa en cada rubro</p></div>';
    wrap.appendChild(hdr);

    // ── Calcular gastado por rubro (pesos) ──
    const gastado = {};
    listaCorrientes.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{
        gastado[c.rubro]=(gastado[c.rubro]||0)+c.monto;
    });
    // Fijos con rubro asignado
    const fijosPrespRubro = {}; const fijosPagRubro = {};
    listaServicios.filter(s=>s.rubro).forEach(s=>{
        fijosPrespRubro[s.rubro]=(fijosPrespRubro[s.rubro]||0)+s.presupuesto;
        fijosPagRubro[s.rubro]=(fijosPagRubro[s.rubro]||0)+s.pagado;
    });
    // Rubros con gasto pero sin presupuesto también se muestran
    const todosRubros = new Set([...listaRubros, ...Object.keys(gastado), ...Object.keys(fijosPrespRubro)]);

    const totalPresup = Object.values(listaPresupRubros).reduce((a,b)=>a+b,0);
    const totalGast   = listaRubros.reduce((a,r)=>a+(gastado[r]||0),0);
    const totalPct    = totalPresup>0 ? Math.min(100,Math.round(totalGast/totalPresup*100)) : 0;
    const totalLib    = Math.max(0, totalPresup - totalGast);
    const totalExc    = totalGast > totalPresup && totalPresup>0 ? totalGast - totalPresup : 0;

    // ── Cards resumen ──
    const cardStyle = 'border-radius:10px;padding:16px 18px;display:flex;flex-direction:column;gap:4px;';
    let cards = '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:28px;">';
    cards += '<div style="background:#f5f3ff;border:1px solid #ddd6fe;'+cardStyle+'"><span style="font-size:11px;font-weight:bold;color:#6d28d9;text-transform:uppercase;">Presupuesto total</span><span style="font-size:22px;font-weight:bold;color:#4c1d95;">'+fmt(totalPresup)+'</span></div>';
    cards += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;'+cardStyle+'"><span style="font-size:11px;font-weight:bold;color:#16a34a;text-transform:uppercase;">Gastado</span><span style="font-size:22px;font-weight:bold;color:#15803d;">'+fmt(totalGast)+'</span><span style="font-size:11px;color:#16a34a;">'+totalPct+'% del presupuesto</span></div>';
    cards += '<div style="background:'+(totalLib>0?'#eff6ff':'#fff7ed')+';border:1px solid '+(totalLib>0?'#bfdbfe':'#fed7aa')+';'+cardStyle+'"><span style="font-size:11px;font-weight:bold;color:'+(totalLib>0?'#1d4ed8':'#c2410c')+';text-transform:uppercase;">'+( totalLib>0 ? 'Libre' : 'Excedido' )+'</span><span style="font-size:22px;font-weight:bold;color:'+(totalLib>0?'#1e40af':'#ea580c')+';">'+fmt(totalLib>0?totalLib:totalExc)+'</span></div>';
    const rubrosConPresup = listaRubros.filter(r=>listaPresupRubros[r]>0).length;
    cards += '<div style="background:#f8fafc;border:1px solid #e2e8f0;'+cardStyle+'"><span style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;">Rubros con límite</span><span style="font-size:22px;font-weight:bold;color:#334155;">'+rubrosConPresup+' / '+listaRubros.length+'</span></div>';
    cards += '</div>';
    wrap.insertAdjacentHTML('beforeend', cards);

    // ── Barra global ──
    const barGlobColor = totalPct>=100 ? '#ef4444' : totalPct>=80 ? '#f59e0b' : '#6d28d9';
    let barGlob = '<div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px 20px;margin-bottom:28px;">';
    barGlob += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    barGlob += '<span style="font-size:13px;font-weight:bold;color:#334155;">Ejecución global del presupuesto</span>';
    barGlob += '<span style="font-size:13px;font-weight:bold;color:'+barGlobColor+';">'+totalPct+'%</span></div>';
    barGlob += '<div style="background:#e2e8f0;border-radius:6px;height:12px;">';
    barGlob += '<div style="background:'+barGlobColor+';height:12px;border-radius:6px;width:'+Math.min(100,totalPct)+'%;transition:width 0.4s;"></div></div>';
    barGlob += '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:#94a3b8;">';
    barGlob += '<span>'+fmt(totalGast)+' gastado</span><span>'+fmt(totalPresup)+' presupuestado</span></div>';
    barGlob += '</div>';
    wrap.insertAdjacentHTML('beforeend', barGlob);

    // ── Título sección rubros ──
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 14px;font-size:13px;font-weight:bold;color:#6d28d9;text-transform:uppercase;letter-spacing:.05em;">Rubros en pesos</h3>');

    // ── Grid de rubros ──
    let grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:32px;" id="presup-rubros-grid">';
    const rubrosArr = [...todosRubros];
    rubrosArr.forEach(r => {
        const pres = listaPresupRubros[r]||0;
        const gast = gastado[r]||0;
        const pct  = pres>0 ? Math.min(100,Math.round(gast/pres*100)) : 0;
        const lib  = pres>0 ? pres-gast : 0;
        const col  = colorRubro(r);
        const superado = pres>0 && gast>=pres;
        const sinPresup = pres===0;
        const barCol = superado ? '#ef4444' : pct>=80 ? '#f59e0b' : col;
        const bgCard = superado ? '#fff5f5' : sinPresup ? '#f8fafc' : 'white';
        const borderCard = superado ? '1px solid #fca5a5' : sinPresup ? '1px solid #e2e8f0' : '1px solid #e2e8f0';
        const borderTop = 'border-top:3px solid '+(superado?'#ef4444':sinPresup?'#cbd5e1':col)+';';

        let card = '<div style="background:'+bgCard+';border-radius:10px;border:'+borderCard+';'+borderTop+'padding:14px 16px;">';
        // Nombre + badge estado
        card += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">';
        card += '<span style="font-size:13px;font-weight:bold;color:'+col+';">'+r+'</span>';
        if(superado) card += '<span style="font-size:10px;font-weight:bold;padding:2px 7px;border-radius:4px;background:#fee2e2;color:#b91c1c;">SUPERADO</span>';
        else if(sinPresup) card += '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:#f1f5f9;color:#94a3b8;">Sin límite</span>';
        else if(pct>=80) card += '<span style="font-size:10px;font-weight:bold;padding:2px 7px;border-radius:4px;background:#fef3c7;color:#92400e;">'+pct+'%</span>';
        else card += '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:#f0fdf4;color:#15803d;">'+pct+'%</span>';
        card += '</div>';

        // Montos
        card += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">';
        card += '<span style="color:#64748b;">Gastado: <b style="color:'+(superado?'#ef4444':'#334155')+';">'+fmt(gast)+'</b></span>';
        if(pres>0) card += '<span style="color:#64748b;">'+( lib>=0?'Libre':'Exceso')+': <b style="color:'+(lib>=0?'#16a34a':'#ef4444')+';">'+fmt(Math.abs(lib))+'</b></span>';
        card += '</div>';
        // Fijos asignados a este rubro
        const fPresR=fijosPrespRubro[r]||0; const fPagR=fijosPagRubro[r]||0;
        if(fPresR>0||fPagR>0){
            card += '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:6px 8px;margin-bottom:8px;font-size:11px;">';
            card += '<span style="color:#854d0e;font-weight:bold;">📋 Fijos: </span>';
            card += '<span style="color:#92400e;">Presup. <b>'+fmt(fPresR)+'</b></span>';
            card += ' &nbsp;·&nbsp; <span style="color:#15803d;">Pagado <b>'+fmt(fPagR)+'</b></span>';
            card += '</div>';
        }

        // Barra
        if(pres>0){
            card += '<div style="background:#e2e8f0;border-radius:4px;height:7px;margin-bottom:10px;">';
            card += '<div style="background:'+barCol+';height:7px;border-radius:4px;width:'+Math.min(100,pct)+'%;"></div></div>';
        }

        // Input presupuesto
        const safeR = r.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
        card += '<div style="display:flex;align-items:center;gap:6px;">';
        card += '<span style="font-size:11px;color:#94a3b8;white-space:nowrap;">Límite $</span>';
        card += '<input type="number" min="0" step="1" value="'+(pres||'')+'" placeholder="Sin límite" ';
        card += 'style="flex:1;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;background:white;color:#1e293b;" ';
        card += 'data-rubro="'+safeR+'" onchange="actualizarPresupRubro(this)" onblur="actualizarPresupRubro(this)">';
        card += '</div>';
        card += '</div>';
        grid += card;
    });
    grid += '</div>';
    wrap.insertAdjacentHTML('beforeend', grid);

    // ── USD ──────────────────────────────────────────────
    if(listaRubrosUSD && listaRubrosUSD.length) {
        wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 14px;font-size:13px;font-weight:bold;color:#0284c7;text-transform:uppercase;letter-spacing:.05em;">Rubros en dólares</h3>');
        const gastadoUSD = {};
        listaCorrientesUSD.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{
            gastadoUSD[c.rubro]=(gastadoUSD[c.rubro]||0)+c.monto;
        });
        const todosRubrosUSD = new Set([...listaRubrosUSD, ...Object.keys(gastadoUSD)]);
        let gridUSD = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:24px;">';
        [...todosRubrosUSD].forEach(r => {
            const pres = listaPresupRubrosUSD[r]||0;
            const gast = gastadoUSD[r]||0;
            const pct  = pres>0 ? Math.min(100,Math.round(gast/pres*100)) : 0;
            const lib  = pres>0 ? pres-gast : 0;
            const superado = pres>0 && gast>=pres;
            const sinPresup = pres===0;
            const barCol = superado ? '#ef4444' : pct>=80 ? '#f59e0b' : '#0284c7';
            const bgCard = superado ? '#fff5f5' : sinPresup ? '#f8fafc' : 'white';
            const safeR = r.replace(/&/g,'&amp;').replace(/"/g,'&quot;');

            let card = '<div style="background:'+bgCard+';border-radius:10px;border:1px solid #e2e8f0;border-top:3px solid '+(superado?'#ef4444':sinPresup?'#cbd5e1':'#0284c7')+';padding:14px 16px;">';
            card += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">';
            card += '<span style="font-size:13px;font-weight:bold;color:#0284c7;">'+r+'</span>';
            if(superado) card += '<span style="font-size:10px;font-weight:bold;padding:2px 7px;border-radius:4px;background:#fee2e2;color:#b91c1c;">SUPERADO</span>';
            else if(sinPresup) card += '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:#f1f5f9;color:#94a3b8;">Sin límite</span>';
            else card += '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:#f0fdf4;color:#15803d;">'+pct+'%</span>';
            card += '</div>';
            card += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">';
            card += '<span style="color:#64748b;">Gastado: <b style="color:'+(superado?'#ef4444':'#334155')+';">'+fmtUSD(gast)+'</b></span>';
            if(pres>0) card += '<span style="color:#64748b;">'+(lib>=0?'Libre':'Exceso')+': <b style="color:'+(lib>=0?'#16a34a':'#ef4444')+';">'+fmtUSD(Math.abs(lib))+'</b></span>';
            card += '</div>';
            if(pres>0){
                card += '<div style="background:#e2e8f0;border-radius:4px;height:7px;margin-bottom:10px;">';
                card += '<div style="background:'+barCol+';height:7px;border-radius:4px;width:'+Math.min(100,pct)+'%;"></div></div>';
            }
            card += '<div style="display:flex;align-items:center;gap:6px;">';
            card += '<span style="font-size:11px;color:#94a3b8;white-space:nowrap;">Límite USD</span>';
            card += '<input type="number" min="0" step="0.01" value="'+(pres||'')+'" placeholder="Sin límite" ';
            card += 'style="flex:1;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;background:white;color:#1e293b;" ';
            card += 'data-rubro="'+safeR+'" onchange="actualizarPresupRubroUSD(this)" onblur="actualizarPresupRubroUSD(this)">';
            card += '</div></div>';
            gridUSD += card;
        });
        gridUSD += '</div>';
        wrap.insertAdjacentHTML('beforeend', gridUSD);
    }

    return wrap;
}

function buildReportes() {
    const wrap=el('div','container'); wrap.style.paddingTop='20px';
    const hdr=el('div'); hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #4f46e5;';
    hdr.innerHTML=`<div><h2 style="margin:0;font-size:22px;color:#1e293b;">📈 Reportes Financieros</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}</p></div><button onclick="exportarExcel()" class="btn no-print" style="font-size:12px;padding:8px 14px;background:#10b981;color:white;margin-right:6px;">📥 Exportar Excel</button><button onclick="window.print()" class="btn btn-dark no-print" style="font-size:12px;padding:8px 14px;">🖨️ Imprimir</button>`;
    wrap.appendChild(hdr);

    // ── REPORTE 1 ──────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#4f46e5;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 1 · Resumen del Mes Actual</h3>');

    // Bancos
    let totB=0; listaBancos.forEach(b=>totB+=b.saldo);
    let cB=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #0284c7;padding:16px;margin-bottom:0px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🏦 Cuentas Bancarias</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Cuenta</th><th style="padding:6px;text-align:right;">Saldo Disponible</th></tr>`;
    listaBancos.forEach(b=>{ cB+=`<tr><td style="padding:5px 6px;font-weight:bold;">${b.nombre}</td><td style="padding:5px 6px;text-align:right;color:#0284c7;font-weight:bold;">${fmt(b.saldo)}</td></tr>`; });
    cB+=`<tr style="background:#f8fafc;font-weight:bold;"><td style="padding:6px;">TOTAL</td><td style="padding:6px;text-align:right;color:#0284c7;">${fmt(totB)}</td></tr></table></div>`;

    // Tarjetas
    const mDeb={}; listaTarjetas.forEach(t=>mDeb[t.id]=0);
    listaServicios.forEach(s=>{ if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c=>{ if(c.fechaPago&&mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    let totT=0;
    let cT=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">💳 Tarjetas de Crédito</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Tarjeta</th><th style="padding:6px;text-align:right;">Saldo base</th><th style="padding:6px;text-align:right;">Consumo mes</th><th style="padding:6px;text-align:right;">Total deuda</th></tr>`;
    listaTarjetas.forEach(t=>{ const c=mDeb[t.id]||0,tot=t.saldo+c; totT+=tot; cT+=`<tr><td style="padding:5px 6px;font-weight:bold;">${t.nombre}</td><td style="padding:5px 6px;text-align:right;">${fmt(t.saldo)}</td><td style="padding:5px 6px;text-align:right;color:#a855f7;">${fmt(c)}</td><td style="padding:5px 6px;text-align:right;font-weight:bold;color:#a855f7;">${fmt(tot)}</td></tr>`; });
    cT+=`<tr style="background:#f8fafc;font-weight:bold;"><td colspan="3" style="padding:6px;">TOTAL DEUDA</td><td style="padding:6px;text-align:right;color:#a855f7;">${fmt(totT)}</td></tr></table></div>`;

    const g1=el('div'); g1.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:16px;';
    g1.innerHTML=cB+cT; wrap.appendChild(g1);

    // Servicios fijos
    let totPres=0,totPag=0,totPend=0;
    listaServicios.forEach(s=>{ totPres+=s.presupuesto; totPag+=s.pagado; if(s.presupuesto>s.pagado) totPend+=(s.presupuesto-s.pagado); });
    let tSrv=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos del Mes</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:center;">Clase</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pendiente</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
    listaServicios.forEach((s,ri)=>{
        const pend=Math.max(0,s.presupuesto-s.pagado), cc={'M':'#0284c7','O':'#a855f7','X':'#64748b'}[s.clase||'M'];
        let ec='#c5221f',eb='#fce8e6',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';} else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
        tSrv+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${s.clase||'M'}</span></td><td style="padding:5px 6px;text-align:right;">${fmt(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(s.pagado)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pend)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`;
    });
    tSrv+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td></td><td style="text-align:right;">${fmt(totPres)}</td><td style="text-align:right;color:#10b981;">${fmt(totPag)}</td><td style="text-align:right;color:#ef4444;">${fmt(totPend)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tSrv);

    // Por clase
    const clases=[{k:'M',label:'M — Mío',color:'#0284c7'},{k:'O',label:'O — Oma',color:'#a855f7'},{k:'X',label:'X — Otros',color:'#64748b'}];
    let tCl=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #6366f1;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Servicios Fijos por Clase</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Clase</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pendiente</th><th style="padding:6px;text-align:right;">%</th></tr>`;
    clases.forEach(cl=>{ const sc=listaServicios.filter(s=>(s.clase||'M')===cl.k); const p=sc.reduce((a,s)=>a+s.presupuesto,0),pg=sc.reduce((a,s)=>a+s.pagado,0),pe=sc.reduce((a,s)=>a+Math.max(0,s.presupuesto-s.pagado),0),pct=totPres>0?((p/totPres)*100).toFixed(1):'0.0';
        tCl+=`<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;"><span style="font-weight:bold;padding:2px 8px;border-radius:4px;background:${cl.color}22;color:${cl.color};">${cl.label}</span></td><td style="padding:5px 6px;text-align:right;font-weight:bold;">${fmt(p)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(pg)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pe)}</td><td style="padding:5px 6px;text-align:right;">${pct}%</td></tr>`; });
    tCl+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${fmt(totPres)}</td><td style="text-align:right;color:#10b981;">${fmt(totPag)}</td><td style="text-align:right;color:#ef4444;">${fmt(totPend)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tCl);

    // Gráficos dobles pesos
    const srvConPres = listaServicios.filter(function(s){ return s.presupuesto>0; });

    const porR={},porRSF={};
    const esPagoTarjeta = r => r && r.toLowerCase().includes('tarjeta');
    listaCorrientes.filter(c=>c.fechaPago&&!esPagoTarjeta(c.rubro)).forEach(c=>{ porR[c.rubro]=(porR[c.rubro]||0)+c.monto; });
    listaCorrientes.filter(c=>!c.fechaPago&&!esPagoTarjeta(c.rubro)).forEach(c=>{ porRSF[c.rubro]=(porRSF[c.rubro]||0)+c.monto; });
    const totCorr=Object.values(porR).reduce((a,b)=>a+b,0);
    const todosR=new Set([...Object.keys(porR),...Object.keys(porRSF)]);
    // Tabla corrientes con clase
    const claseColorMap={'M':'#0284c7','O':'#a855f7','X':'#64748b'};
    // Calcular porR con clase
    const porRConClase={};
    listaCorrientes.filter(c=>c.fechaPago&&!esPagoTarjeta(c.rubro)).forEach(c=>{
        if(!porRConClase[c.rubro]) porRConClase[c.rubro]={monto:0,clase:c.clase||'M'};
        porRConClase[c.rubro].monto+=c.monto;
    });
    let tCorr=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🛍️ Gastos Corrientes por Rubro</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:center;">Clase</th><th style="padding:6px;text-align:left;">Rubro</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Sin confirmar</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
    [...todosR].sort().forEach(r=>{
        const pg=porR[r]||0,sf=porRSF[r]||0,pct=totCorr>0?((pg/totCorr)*100).toFixed(1):'0.0',col=colorRubro(r);
        const clase=(porRConClase[r]&&porRConClase[r].clase)||'M';
        const cc=claseColorMap[clase];
        tCorr+=`<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${clase}</span></td>
            <td style="padding:5px 6px;"><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0;display:inline-block;"></span><b style="color:${col};">${r}</b></span></td>
            <td style="padding:5px 6px;text-align:right;color:#10b981;font-weight:bold;">${fmt(pg)}</td>
            <td style="padding:5px 6px;text-align:right;color:#94a3b8;">${fmt(sf)}</td>
            <td style="padding:5px 6px;text-align:right;">${pct}%</td>
        </tr>`; });
    tCorr+=`<tr style="background:#f8fafc;font-weight:bold;"><td></td><td>TOTAL</td><td style="text-align:right;color:#10b981;">${fmt(totCorr)}</td><td style="text-align:right;color:#94a3b8;">${fmt(Object.values(porRSF).reduce((a,b)=>a+b,0))}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tCorr);

    // Subtotales corrientes por clase
    const clases3=['M','O','X'], claseLabels={'M':'M — Mío','O':'O — Oma','X':'X — Otros'};
    let tClaseCorr=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Gastos Corrientes por Clase</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Clase</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
    clases3.forEach(function(cl){
        const total=listaCorrientes.filter(c=>c.fechaPago&&(c.clase||'M')===cl&&!esPagoTarjeta(c.rubro)).reduce((a,c)=>a+c.monto,0);
        const pct=totCorr>0?((total/totCorr)*100).toFixed(1):'0.0';
        const cc=claseColorMap[cl];
        tClaseCorr+=`<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;"><span style="font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${claseLabels[cl]}</span></td><td style="padding:5px 6px;text-align:right;font-weight:bold;">${fmt(total)}</td><td style="padding:5px 6px;text-align:right;">${pct}%</td></tr>`;
    });
    tClaseCorr+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;color:#10b981;">${fmt(totCorr)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tClaseCorr);

    // Card doble: servicios fijos + corrientes pesos
    const itemsCorrPesos = Object.entries(porR).map(function(e){ return {label:e[0],valor:e[1]}; });
    if(srvConPres.length>0 || itemsCorrPesos.length>0){
        const divDoble = mkTortaDoble(
            'torta-srv','torta-srv-ley','Servicios Fijos · Presupuesto',
            'torta-corr','torta-corr-ley','Gastos Corrientes · por Rubro',
            '#4f46e5','#10b981'
        );
        wrap.appendChild(divDoble);
        if(srvConPres.length>0)
            dibujarTorta('torta-srv','torta-srv-ley', srvConPres.map(function(s){ return {label:s.nombre,valor:s.presupuesto}; }), fmt);
        if(itemsCorrPesos.length>0){
            const colsCorrPesos = itemsCorrPesos.map(function(it){ return colorRubro(it.label); });
            dibujarTorta('torta-corr','torta-corr-ley', itemsCorrPesos, fmt, colsCorrPesos);
        }
    }


    // ── SECCIÓN DÓLARES ────────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#16a34a;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Resumen en Dólares · Mes Actual</h3>');
    if(listaCuentasUSD.length>0||listaTarjetasUSD.length>0||listaServiciosUSD.length>0){
        const mDU2=calcMDU(), tc=tipoCambio;
        const tD=listaCuentasUSD.reduce((a,c)=>a+c.saldo,0), tTU=listaTarjetasUSD.reduce((a,t)=>a+(t.saldo+(mDU2[t.id]||0)),0), bal=tD-tTU;
        const gU=el('div'); gU.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px;';
        gU.innerHTML=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #16a34a;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD Disponibles</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#16a34a;">${fmtUSD(tD)}</p><small style="color:#64748b;">${fmt(tD*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #a855f7;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Pagar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#a855f7;">${fmtUSD(tTU)}</p><small style="color:#64748b;">${fmt(tTU*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal>=0?'#16a34a':'#ef4444'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">Balance USD</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal>=0?'#16a34a':'#ef4444'};">${fmtUSD(bal)}</p><small style="color:#64748b;">${fmt(Math.abs(bal)*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal<0?'#ef4444':'#94a3b8'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Comprar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal<0?'#ef4444':'#94a3b8'};">${bal<0?fmtUSD(Math.abs(bal)):'—'}</p><small style="color:#64748b;">${bal<0?fmt(Math.abs(bal)*tc):''}</small></div>`;
        wrap.appendChild(gU);
        if(listaServiciosUSD.length>0){
            let tSU=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos en USD · TC ${fmt(tc)}</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pend. (USD)</th><th style="padding:6px;text-align:right;">Pend. (ARS)</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
            let tpU=0,pgU=0,peU=0;
            listaServiciosUSD.forEach((s,ri)=>{ const pe=Math.max(0,s.presupuesto-s.pagado); tpU+=s.presupuesto; pgU+=s.pagado; peU+=pe; let ec='#c5221f',eb='#fce8e6',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';} else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
                tSU+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:right;">${fmtUSD(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmtUSD(s.pagado)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmtUSD(pe)}</td><td style="padding:5px 6px;text-align:right;color:#64748b;">${fmt(pe*tc)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`; });
            tSU+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${fmtUSD(tpU)}</td><td style="text-align:right;color:#10b981;">${fmtUSD(pgU)}</td><td style="text-align:right;color:#ef4444;">${fmtUSD(peU)}</td><td style="text-align:right;">${fmt(peU*tc)}</td><td></td></tr></table></div>`;
            wrap.insertAdjacentHTML('beforeend',tSU);
        }
        // Card doble USD: servicios fijos + corrientes
        const srvUSDConPres = listaServiciosUSD.filter(function(s){ return s.presupuesto>0; });
        const porRubroUSD = {};
        listaCorrientesUSD.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{ porRubroUSD[c.rubro]=(porRubroUSD[c.rubro]||0)+c.monto; });
        const itemsCorrUSD = Object.entries(porRubroUSD).map(function(e){ return {label:e[0],valor:e[1]}; });
        if(srvUSDConPres.length>0 || itemsCorrUSD.length>0){
            const divDobleUSD = mkTortaDoble(
                'torta-srv-usd','torta-srv-usd-ley','Servicios Fijos USD · Presupuesto',
                'torta-corr-usd','torta-corr-usd-ley','Gastos Corrientes USD · por Rubro',
                '#4f46e5','#10b981'
            );
            wrap.appendChild(divDobleUSD);
            if(srvUSDConPres.length>0)
                dibujarTorta('torta-srv-usd','torta-srv-usd-ley', srvUSDConPres.map(function(s){ return {label:s.nombre,valor:s.presupuesto}; }), fmtUSD);
            if(itemsCorrUSD.length>0){
                const colsCorrUSD = itemsCorrUSD.map(function(it){ return colorRubro(it.label); });
                dibujarTorta('torta-corr-usd','torta-corr-usd-ley', itemsCorrUSD, fmtUSD, colsCorrUSD);
            }
        }

    } else { wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;margin-bottom:24px;">Sin datos en dólares para este mes.</div>'); }

    // ── REPORTE 2: ACUMULADO 12 MESES ─────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#f59e0b;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 2 · Análisis por Rubro · Últimos 12 Meses</h3>');
    const ultimos12=[...historicoMeses].slice(-12);
    const mesesData=ultimos12.map(m=>({nombre:m.nombre,datos:m.datos}));
    mesesData.push({nombre:'Mes Actual',datos:{listaCorrientes,listaServicios,listaRubros}});
    const todosRub2=new Set();
    mesesData.forEach(m=>{
        (m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>todosRub2.add(c.rubro));
        (m.datos.listaServicios||[]).filter(s=>s.rubro).forEach(s=>todosRub2.add(s.rubro));
    });
    const rubrosArr=[...todosRub2].sort();
    // Filtro dinámico Reporte 2
    let filtroR2='';
    const fwR2=el('div'); fwR2.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:12px;';
    fwR2.innerHTML='<label style="font-size:12px;color:#64748b;font-weight:bold;">Filtrar rubro:</label>';
    const selR2=el('select'); selR2.style.cssText='padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;color:#334155;';
    addOpt(selR2,'','— Todos los rubros —');
    rubrosArr.forEach(r=>addOpt(selR2,r,r));
    selR2.onchange=e=>{ filtroR2=e.target.value; renderTablaR2(); };
    fwR2.appendChild(selR2); wrap.appendChild(fwR2);
    const contR2=el('div'); wrap.appendChild(contR2);
    const renderTablaR2=()=>{
        const rubFilt=filtroR2?[filtroR2]:rubrosArr;
        if(!rubFilt.length){ contR2.innerHTML='<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;">Sin datos.</div>'; return; }
        let t2=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;"><thead><tr style="background:#1e293b;"><th style="padding:7px 8px;text-align:left;color:white;">Rubro</th>`;
        mesesData.forEach(m=>{ t2+=`<th style="padding:7px 8px;text-align:right;color:white;">${m.nombre.replace(' de ',' ')}</th>`; });
        t2+=`<th style="padding:7px 8px;text-align:right;color:#f59e0b;">TOTAL</th></tr></thead><tbody>`;
        const totMes=new Array(mesesData.length).fill(0); let totGen=0;
        rubFilt.forEach((rub,ri)=>{
            let totR=0;
            t2+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};"><td style="padding:5px 8px;font-weight:bold;color:#334155;">${rub}</td>`;
            mesesData.forEach((m,mi)=>{
                const sc=(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===rub&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
                const sfPres=(m.datos.listaServicios||[]).filter(sv=>sv.rubro===rub).reduce((a,sv)=>a+sv.presupuesto,0);
                const sfPag=(m.datos.listaServicios||[]).filter(sv=>sv.rubro===rub).reduce((a,sv)=>a+sv.pagado,0);
                const s=sc+sfPres;
                const tip=sfPres>0?` title="Corrientes: ${fmt(sc)} | Fijos presup: ${fmt(sfPres)} | Fijos pag: ${fmt(sfPag)}"`:''; 
                totMes[mi]+=s; totR+=s;
                t2+=`<td style="padding:5px 8px;text-align:right;color:${s>0?'#10b981':'#94a3b8'};font-weight:${s>0?'bold':'normal'};"${tip}>${s>0?fmt(s):'—'}</td>`;
            });
            totGen+=totR;
            t2+=`<td style="padding:5px 8px;text-align:right;font-weight:bold;color:#f59e0b;">${fmt(totR)}</td></tr>`;
        });
        t2+=`<tr style="background:#f1f5f9;font-weight:bold;"><td style="padding:7px 8px;color:#1e293b;">TOTAL</td>`;
        totMes.forEach(t=>{ t2+=`<td style="padding:7px 8px;text-align:right;color:#4f46e5;">${fmt(t)}</td>`; });
        t2+=`<td style="padding:7px 8px;text-align:right;color:#f59e0b;">${fmt(totGen)}</td></tr></tbody></table></div>`;
        // Participación
        const topR=rubFilt.map(r=>({rubro:r,total:mesesData.reduce((a,m)=>a+(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===r&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((b,c)=>b+c.monto,0)+(m.datos.listaServicios||[]).filter(sv=>sv.rubro===r).reduce((b,sv)=>b+sv.presupuesto,0),0)})).sort((a,b)=>b.total-a.total);
        const totAc=topR.reduce((a,r)=>a+r.total,0);
        let res=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Participación por Rubro (acumulado)</h4>`;
        topR.forEach(r=>{ const pct=totAc>0?(r.total/totAc*100).toFixed(1):0; res+=`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:bold;color:#334155;">${r.rubro}</span><span style="color:#64748b;">${fmt(r.total)} · ${pct}%</span></div><div style="background:#e2e8f0;border-radius:4px;height:10px;"><div style="background:linear-gradient(90deg,#f59e0b,#f97316);height:10px;border-radius:4px;width:${Math.round(pct)}%;"></div></div></div>`; });
        res+=`<div style="font-size:12px;color:#64748b;text-align:right;margin-top:8px;font-weight:bold;">Total acumulado: ${fmt(totAc)}</div></div>`;
        contR2.innerHTML=t2+res;
    }
    renderTablaR2();

    // ── REPORTE 3: CLASE O ─────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#a855f7;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 3 · Detalle Clase O — Mes Actual</h3>');

    // Fijos clase O
    const srvO = listaServicios.filter(s=>(s.clase||'M')==='O');
    const srvOPagados = srvO.filter(s=>s.pagado>0);
    const srvOPendientes = srvO.filter(s=>s.presupuesto>s.pagado);
    const totOFijPag = srvOPagados.reduce((a,s)=>a+s.pagado,0);
    const totOFijPend = srvOPendientes.reduce((a,s)=>a+(s.presupuesto-s.pagado),0);

    // Corrientes clase O (solo egresos)
    const corrO = listaCorrientes.filter(c=>(c.clase||'M')==='O'&&!c.esIngreso);
    const totOCorr = corrO.reduce((a,c)=>a+c.monto,0);
    const totOTotal = totOFijPag + totOCorr;

    // Cards resumen
    let rO = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">';
    const mkCard = (label,val,color) => `<div style="background:#f8fafc;border-radius:8px;padding:14px;text-align:center;border:1px solid #e2e8f0;"><div style="font-size:11px;color:#64748b;margin-bottom:6px;text-transform:uppercase;">${label}</div><div style="font-size:20px;font-weight:bold;color:${color};">${fmt(val)}</div></div>`;
    rO += mkCard('Fijos pagados', totOFijPag, '#10b981');
    rO += mkCard('Fijos pendientes', totOFijPend, '#ef4444');
    rO += mkCard('Corrientes', totOCorr, '#a855f7');
    rO += mkCard('Total erogado', totOTotal, '#1e293b');
    rO += '</div>';

    // Tabla fijos
    if(srvO.length){
        rO += '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;margin-bottom:16px;">';
        rO += '<h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Servicios Fijos — Clase O</h4>';
        rO += '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:center;">F. Pago</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:center;">Estado</th></tr>';
        srvO.forEach((s,ri)=>{
            const pag = s.pagado, pend = s.presupuesto - s.pagado;
            let ec='#c5221f',eb='#fce8e6',et='PENDIENTE';
            if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';}
            else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
            const fp = s.fPago ? new Date(s.fPago+'T00:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'}) : '—';
            rO += `<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:center;color:#64748b;">${fp}</td><td style="padding:5px 6px;text-align:right;">${fmt(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;font-weight:bold;">${fmt(pag)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`;
        });
        rO += `<tr style="background:#f8fafc;font-weight:bold;"><td colspan="3" style="padding:6px;">Pagado / Pendiente</td><td style="padding:6px;text-align:right;color:#10b981;">${fmt(totOFijPag)}</td><td style="padding:6px;text-align:center;color:#ef4444;">${fmt(totOFijPend)} pend.</td></tr>`;
        rO += '</table></div>';
    }

    // Tabla corrientes
    if(corrO.length){
        rO += '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;margin-bottom:24px;">';
        rO += '<h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Gastos Corrientes — Clase O</h4>';
        rO += '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Rubro</th><th style="padding:6px;text-align:left;">Detalle</th><th style="padding:6px;text-align:center;">F. Pago</th><th style="padding:6px;text-align:right;">Monto</th></tr>';
        corrO.forEach((c,ri)=>{
            const fp = c.fechaPago ? new Date(c.fechaPago+'T00:00:00').toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'}) : '—';
            rO += `<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${c.rubro||'—'}</td><td style="padding:5px 6px;color:#64748b;">${c.detalle||'—'}</td><td style="padding:5px 6px;text-align:center;color:#64748b;">${fp}</td><td style="padding:5px 6px;text-align:right;color:#a855f7;font-weight:bold;">${fmt(c.monto)}</td></tr>`;
        });
        rO += `<tr style="background:#f8fafc;font-weight:bold;"><td colspan="3" style="padding:6px;">TOTAL CORRIENTES</td><td style="padding:6px;text-align:right;color:#a855f7;">${fmt(totOCorr)}</td></tr>`;
        rO += '</table></div>';
    }

    if(!srvO.length && !corrO.length){
        rO += '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;margin-bottom:24px;">Sin datos de Clase O para este mes.</div>';
    }

    wrap.insertAdjacentHTML('beforeend', rO);
    return wrap;
}

// ═══════════════════════════════════════════
//  VISTA HISTÓRICA
// ═══════════════════════════════════════════
function buildHistorico(mes) {
    const db=mes.datos, wrap=el('div');
    const banner=el('div','hist-banner no-print'); banner.innerHTML=`<span style="font-size:20px;">🗂</span><div><strong>Período Cerrado: ${mes.nombre}</strong><div style="font-size:11px;margin-top:2px;">Vista de sólo lectura</div></div>`; wrap.appendChild(banner);
    let sB=0,sT=0,tP=0,fP=0;
    db.listaBancos.forEach(b=>sB+=b.saldo); db.listaTarjetas.forEach(t=>sT+=t.saldo);
    db.listaServicios.forEach(s=>{ tP+=s.pagado; if(s.presupuesto>s.pagado) fP+=(s.presupuesto-s.pagado); });
    db.listaCorrientes.forEach(c=>tP+=c.monto);
    const cont=el('div','container'); cont.style.paddingTop='15px';
    cont.innerHTML=`<div class="grid-dashboard"><div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco (Cierre)</h4><p style="color:#0284c7;">${fmt(sB)}</p></div><div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Deuda Tarjetas (Cierre)</h4><p style="color:#a855f7;">${fmt(sT)}</p></div><div class="card-bal" style="border-left:5px solid #10b981;"><h4>Total Egresado</h4><p style="color:#10b981;">${fmt(tP)}</p></div><div class="card-bal" style="border-left:5px solid ${fP>0?'#ef4444':'#10b981'};"><h4>Fijos Pendientes al Cierre</h4><p style="color:${fP>0?'#ef4444':'#10b981'};">${fmt(fP)}</p></div></div>`;
    const gp=el('div','grid-principal');
    const left=el('div'); left.innerHTML=roSimple('🏦 Bancos al Cierre','panel-bancos',['Cuenta','Saldo'],db.listaBancos.map(b=>[b.nombre,fmt(b.saldo)]))+roSimple('💳 Tarjetas al Cierre','panel-tarjetas',['Tarjeta','Deuda'],db.listaTarjetas.map(t=>[t.nombre,fmt(t.saldo)]))+roTransf(db);
    const right=el('div'); right.innerHTML=roServicios(db)+roCorrientes(db);
    gp.appendChild(left); gp.appendChild(right); cont.appendChild(gp); wrap.appendChild(cont);
    return wrap;
}
function roSimple(titulo,cls,headers,rows) {
    const ths=headers.map(h=>`<th>${h}</th>`).join('');
    const trs=!rows.length?`<tr><td colspan="${headers.length}" class="tc" style="color:#94a3b8;padding:12px;">Sin datos</td></tr>`:rows.map(r=>`<tr>${r.map((c,i)=>`<td class="ro-cell${i>0?' ro-money':''}">${c}</td>`).join('')}</tr>`).join('');
    return `<div class="panel ${cls}"><h3 class="panel-title">${titulo}</h3><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}
function roTransf(db) {
    const trs=!(db.listaTransferencias||[]).length?'<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>':db.listaTransferencias.map(t=>`<tr><td class="ro-cell ro-muted">${t.fecha||'—'}</td><td class="ro-cell ro-muted">${t.origenNombre}</td><td class="ro-cell ro-muted">${t.destinoNombre}</td><td class="ro-cell ro-money" style="color:#f59e0b;">${fmt(t.monto)}</td></tr>`).join('');
    return `<div class="panel panel-transf"><h3 class="panel-title">↔️ Transferencias</h3><table><thead><tr><th>Fecha</th><th>Origen</th><th>Destino</th><th class="tr">Monto</th></tr></thead><tbody>${trs}</tbody></table></div>`;
}
function roServicios(db) {
    const mNom=id=>{ const b=(db.listaBancos||[]).find(x=>x.id===id); const t=(db.listaTarjetas||[]).find(x=>x.id===id); return b?'🏦 '+b.nombre:t?'💳 '+t.nombre:'—'; };
    const rows=db.listaServicios.map(s=>{ let ec='#c5221f',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';et='PAGADO';} else if(s.pagado>0){ec='#b06000';et='PARCIAL';} return `<tr><td class="ro-cell"><b>${s.nombre}</b></td><td class="ro-cell ro-muted">${s.fVto||'—'}</td><td class="ro-cell ro-money">${fmt(s.presupuesto)}</td><td class="ro-cell ro-money">${fmt(s.pagado)}</td><td class="ro-cell ro-muted tc">${s.fPago||'—'}</td><td class="ro-cell ro-muted">${mNom(s.medioPagoId)}</td><td class="tc"><span style="font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;background:${ec}22;color:${ec}">${et}</span></td></tr>`; }).join()||'<tr><td colspan="7" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios</td></tr>';
    return `<div class="panel panel-servicios"><h3 class="panel-title">📋 Servicios Fijos</h3><table><thead><tr><th style="width:22%">Servicio</th><th style="width:13%">Vto.</th><th style="width:12%" class="tr">Presup.</th><th style="width:12%" class="tr">Pagado</th><th style="width:12%" class="tc">F.Pago</th><th style="width:18%">Medio</th><th style="width:11%" class="tc">Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function roCorrientes(db) {
    const mNom=id=>{ const b=(db.listaBancos||[]).find(x=>x.id===id); const t=(db.listaTarjetas||[]).find(x=>x.id===id); return b?'🏦 '+b.nombre:t?'💳 '+t.nombre:'—'; };
    const rows=!db.listaCorrientes.length?'<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin egresos.</td></tr>':db.listaCorrientes.map(c=>`<tr><td class="ro-cell">${c.rubro}</td><td class="ro-cell">${c.detalle}</td><td class="ro-cell ro-muted">${mNom(c.medioPagoId)}</td><td class="ro-cell ro-muted tc">${c.fechaPago||'—'}</td><td class="ro-cell ro-green tr">${fmt(c.monto)}</td></tr>`).join('');
    return `<div class="panel panel-corrientes"><h3 class="panel-title">🛍️ Gastos Corrientes</h3><table><thead><tr><th style="width:22%">Rubro</th><th style="width:28%">Detalle</th><th style="width:23%">Medio</th><th style="width:12%" class="tc">F.Pago</th><th style="width:15%" class="tr">Monto</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}


// ═══════════════════════════════════════════
//  INVERSIONES
// ═══════════════════════════════════════════
let _cotizaciones = {};
let _dolarOficial = 0;

function buildInversiones() {
    const d = document.createElement('div');
    const hdrStyle = 'border-bottom:3px solid #d97706;';
    d.innerHTML = '<div class="container">' +
      '<header class="no-print" style="' + hdrStyle + '">' +
        '<div><h2 style="margin:0;font-size:20px;">📊 Inversiones</h2>' +
        '<p class="version-tag" style="color:#d97706;">Portfolio personal</p></div>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
          '<div id="inv-dolar-badge" style="font-size:12px;color:#64748b;padding:6px 10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">Cargando dólar...</div>' +
          '<button class="btn no-print" id="btn-inv-actualizar" style="background:#d97706;color:white;">🔄 Actualizar cotizaciones</button>' +
        '</div>' +
      '</header>' +
      '<div class="grid-dashboard" style="margin-top:20px;">' +
        '<div class="card-bal" style="border-left:5px solid #10b981;cursor:pointer;" onclick="actualizarYPF()" title="Click para actualizar"><h4 style="display:flex;justify-content:space-between;align-items:center;">YPF.BA <span id="ypf-badge-hora-inv" style="font-size:9px;color:#94a3b8;font-weight:normal;"></span></h4><p id="ypf-usd-inv" style="color:#10b981;margin:2px 0;">USD —</p><small id="ypf-ars-inv" style="font-size:11px;color:#64748b;"></small><small id="ypf-det-inv" style="font-size:10px;color:#94a3b8;display:block;margin-top:2px;"></small></div>' +
        '<div class="card-bal" style="border-left:5px solid #d97706;"><h4>Total Portfolio (ARS)</h4><p id="inv-total-ars" style="color:#d97706;">$ 0</p></div>' +
        '<div class="card-bal" style="border-left:5px solid #16a34a;"><h4>Total Portfolio (USD)</h4><p id="inv-total-usd" style="color:#16a34a;">USD 0</p></div>' +
        '<div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Instrumentos Manuales</h4><p id="inv-total-manual" style="color:#0284c7;">$ 0</p></div>' +
        '<div class="card-bal" style="border-left:5px solid #6366f1;"><h4>Acciones</h4><p id="inv-total-acciones" style="color:#6366f1;">$ 0</p></div>' +
      '</div>' +
      '<div class="grid-principal">' +
        '<div>' +
          '<div class="panel no-print" style="border-top:4px solid #0284c7;">' +
            '<h3 class="panel-title">🏦 Instrumentos Manuales</h3>' +
            '<div class="form-block"><form id="form-instrumento">' +
              '<div class="form-row">' +
                '<div style="flex:2"><label>Nombre</label><input type="text" id="inst-nombre" required placeholder="Ej. Super Ahorro Santander"></div>' +
                '<div><label>Moneda</label><select id="inst-moneda"><option value="ARS">$ Pesos</option><option value="USD">USD Dólares</option></select></div>' +
                '<div><label>Monto</label><input type="number" id="inst-monto" required value="0" step="0.01"></div>' +
                '<div><label>Vencimiento</label><input type="date" id="inst-vto"></div>' +
              '</div>' +
              '<button type="submit" class="btn btn-add btn-blue">Agregar Instrumento</button>' +
            '</form></div>' +
            '<div id="t-instrumentos"></div>' +
          '</div>' +
          '<div class="panel no-print" style="border-top:4px solid #6366f1;">' +
            '<h3 class="panel-title">📈 Acciones</h3>' +
            '<div class="form-block"><form id="form-accion">' +
              '<div class="form-row">' +
                '<div><label>Ticker (con .BA)</label><input type="text" id="acc-ticker" required placeholder="YPFD.BA" style="text-transform:uppercase;" title="Incluir sufijo .BA para acciones argentinas"></div>' +
                '<div style="flex:2"><label>Descripción</label><input type="text" id="acc-desc" required placeholder="Ej. YPF Derecho"></div>' +
                '<div><label>Cantidad</label><input type="number" id="acc-cant" required value="1" step="1" min="1"></div>' +
              '</div>' +
              '<button type="submit" class="btn btn-add" style="background:#6366f1;">Agregar Acción</button>' +
            '</form></div>' +
            '<div id="t-acciones"></div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #6366f1;padding:20px;margin-bottom:16px;">' +
            '<h3 class="panel-title">Cotización histórica · 30 días</h3>' +
            '<div id="inv-charts-wrap" style="display:flex;flex-direction:column;gap:20px;">' +
              '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0;">Cargando datos...</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    return d;
}

function bindInversiones() {
    document.getElementById('form-instrumento')?.addEventListener('submit', altaInstrumento);
    document.getElementById('form-accion')?.addEventListener('submit', altaAccion);
    document.getElementById('btn-inv-actualizar')?.addEventListener('click', actualizarInversiones);
    document.getElementById('acc-ticker')?.addEventListener('input', function(e) { e.target.value = e.target.value.toUpperCase(); });
}

function altaInstrumento(e) {
    e.preventDefault();
    const moneda = document.getElementById('inst-moneda').value;
    const monto = parseFloat(document.getElementById('inst-monto').value) || 0;
    listaInstrumentos.push({id:'inst_'+Date.now(), nombre:vGet('inst-nombre'), moneda, monto, vto:vGet('inst-vto')});
    guardar(); e.target.reset(); renderInstrumentos(); calcDashInv();
}
function altaAccion(e) {
    e.preventDefault();
    const ticker = vGet('acc-ticker').toUpperCase();
    if(listaAcciones.find(function(a){ return a.ticker===ticker; })){ alert('Ese ticker ya está agregado.'); return; }
    listaAcciones.push({id:'acc_'+Date.now(), ticker, desc:vGet('acc-desc'), cant:parseInt(document.getElementById('acc-cant').value)||1});
    guardar(); e.target.reset(); actualizarInversiones();
}
function elimInstrumento(id) { listaInstrumentos=listaInstrumentos.filter(function(x){ return x.id!==id; }); guardar(); renderInstrumentos(); calcDashInv(); }
function elimAccion(id)      { listaAcciones=listaAcciones.filter(function(x){ return x.id!==id; });         guardar(); renderAcciones(); calcDashInv(); }

function renderInstrumentos() {
    const wrap = document.getElementById('t-instrumentos'); if(!wrap) return;
    wrap.innerHTML = '';
    if(!listaInstrumentos.length){
        wrap.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;font-size:13px;">Sin instrumentos.</p>';
        return;
    }
    const tc = _dolarOficial > 0 ? _dolarOficial : tipoCambio;
    listaInstrumentos.forEach(function(inst) {
        const moneda = inst.moneda || 'ARS';
        const montoARS = moneda === 'USD' ? inst.monto * tc : inst.monto;
        const montoStr = moneda === 'USD' ? fmtUSD(inst.monto) : fmt(inst.monto);
        const monedaColor = moneda === 'USD' ? '#15803d' : '#1d4ed8';
        const monedaBg    = moneda === 'USD' ? '#dcfce7' : '#dbeafe';
        const vtoStr = inst.vto ? new Date(inst.vto+'T00:00:00').toLocaleDateString('es-AR') : '—';
        const borderColor = moneda === 'USD' ? '#16a34a' : '#0284c7';

        const card = el('div');
        card.style.cssText = 'border:1px solid #e2e8f0;border-left:4px solid '+borderColor+';border-radius:6px;padding:12px;margin-bottom:8px;background:white;';

        // Fila 1: nombre + badge moneda + botón eliminar
        const row1 = el('div');
        row1.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
        const izq = el('div'); izq.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const nomSpan = el('span'); nomSpan.style.cssText='font-weight:bold;color:#1e293b;font-size:14px;'; nomSpan.innerText=inst.nombre;
        const badge = el('span'); badge.style.cssText='font-size:10px;font-weight:bold;padding:2px 7px;border-radius:4px;background:'+monedaBg+';color:'+monedaColor+';'; badge.innerText=moneda;
        izq.appendChild(nomSpan); izq.appendChild(badge);
        const btnX = el('button','btn-del'); btnX.innerText='✕'; btnX.onclick=function(){ elimInstrumento(inst.id); };
        row1.appendChild(izq); row1.appendChild(btnX);

        // Fila 2: monto editable + en pesos + vencimiento
        const row2 = el('div');
        row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;align-items:center;';

        const mkCell = function(label, contenido) {
            const c = el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 8px;';
            const l = el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; l.innerText=label;
            c.appendChild(l); c.appendChild(contenido); return c;
        };

        // Monto editable
        let inpMonto;
        if(moneda === 'USD'){
            inpMonto = inpNumUSD(inst.monto, function(v){ inst.monto=v; guardar(); renderInstrumentos(); calcDashInv(); });
            inpMonto.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:14px;font-weight:bold;color:'+monedaColor+';background:white;text-align:right;';
        } else {
            inpMonto = inpNum(inst.monto, function(v){ inst.monto=v; guardar(); renderInstrumentos(); calcDashInv(); });
            inpMonto.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:14px;font-weight:bold;color:'+monedaColor+';background:white;text-align:right;';
        }

        const vEnPesos = el('div'); vEnPesos.style.cssText='font-size:14px;font-weight:bold;color:#0284c7;'; vEnPesos.innerText=moneda==='USD'?fmt(montoARS):'—';
        const vVto = el('div'); vVto.style.cssText='font-size:13px;font-weight:bold;color:#334155;'; vVto.innerText=vtoStr;

        row2.appendChild(mkCell(moneda==='USD'?'Monto (USD)':'Monto ($)', inpMonto));
        row2.appendChild(mkCell('En pesos', vEnPesos));
        row2.appendChild(mkCell('Vencimiento', vVto));

        card.appendChild(row1); card.appendChild(row2);
        wrap.appendChild(card);
    });
}

function renderAcciones() {
    const wrap = document.getElementById('t-acciones'); if(!wrap) return;
    wrap.innerHTML = '';
    if(!listaAcciones.length){
        wrap.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;font-size:13px;">Sin acciones. Agregá un ticker para empezar.</p>';
        return;
    }
    listaAcciones.forEach(function(a) {
        const cot = _cotizaciones[a.ticker] || {};
        const precio = cot.precio || 0, variacion = cot.variacion || 0;
        const esLocal = a.ticker.toUpperCase().endsWith('.BA');
        const tc = _dolarOficial > 0 ? _dolarOficial : tipoCambio;
        // Valuación siempre en pesos para el dashboard
        const valuacionARS = esLocal ? precio * a.cant : precio * a.cant * tc;
        const varColor = variacion > 0 ? '#16a34a' : variacion < 0 ? '#ef4444' : '#64748b';
        const varStr = (variacion > 0 ? '+' : '') + variacion.toFixed(2) + '%';
        const varBg = variacion > 0 ? '#dcfce7' : variacion < 0 ? '#fee2e2' : '#f1f5f9';

        const card = el('div');
        card.style.cssText = 'border:1px solid #e2e8f0;border-left:4px solid #6366f1;border-radius:6px;padding:12px;margin-bottom:8px;background:white;';

        // Fila 1: ticker + descripción + botón eliminar
        const row1 = el('div');
        row1.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
        const tickerSpan = el('span');
        tickerSpan.style.cssText = 'font-weight:bold;color:#6366f1;font-size:15px;';
        tickerSpan.innerText = a.ticker;
        const descSpan = el('span');
        descSpan.style.cssText = 'font-size:12px;color:#64748b;margin-left:10px;';
        descSpan.innerText = a.desc;
        const izq = el('div'); izq.appendChild(tickerSpan); izq.appendChild(descSpan);
        const btnX = el('button','btn-del'); btnX.innerText='✕'; btnX.onclick=function(){ elimAccion(a.id); };
        row1.appendChild(izq); row1.appendChild(btnX);

        // Fila 2: cantidad editable + precio + variación + valuación
        const row2 = el('div');
        row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;';

        const mkCell = function(label, valor, color) {
            const c = el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 8px;';
            const l = el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; l.innerText=label;
            const v = el('div'); v.style.cssText='font-size:14px;font-weight:bold;color:'+(color||'#1e293b')+';'; v.innerText=valor;
            c.appendChild(l); c.appendChild(v); return c;
        };

        // Celda cantidad: editable
        const celdaCant = el('div'); celdaCant.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 8px;';
        const lCant = el('div'); lCant.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; lCant.innerText='Cantidad';
        const inpCant = el('input'); inpCant.type='number'; inpCant.value=a.cant; inpCant.min='1';
        inpCant.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 6px;font-size:14px;font-weight:bold;color:#1e293b;background:white;text-align:center;';
        inpCant.onchange = function(e){ a.cant=parseInt(e.target.value)||1; guardar(); renderAcciones(); calcDashInv(); };
        celdaCant.appendChild(lCant); celdaCant.appendChild(inpCant);

        const celdaVar = el('div'); celdaVar.style.cssText='background:'+varBg+';border-radius:4px;padding:6px 8px;';
        const lVar = el('div'); lVar.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;'; lVar.innerText='Variación';
        const vVar = el('div'); vVar.style.cssText='font-size:14px;font-weight:bold;color:'+varColor+';'; vVar.innerText=precio?varStr:'—';
        celdaVar.appendChild(lVar); celdaVar.appendChild(vVar);

        row2.appendChild(celdaCant);
        const precioStr = precio ? (esLocal ? fmt(precio) : fmtUSD(precio)) : 'Actualizando...';
        const valStr    = valuacionARS ? fmt(valuacionARS) + (esLocal ? '' : ' ≈') : '—';
        row2.appendChild(mkCell('Precio', precioStr, '#1e293b'));
        row2.appendChild(celdaVar);
        row2.appendChild(mkCell('Valuación (ARS)', valStr, '#6366f1'));

        card.appendChild(row1); card.appendChild(row2);
        wrap.appendChild(card);
    });
}

function calcDashInv() {
    const tc = _dolarOficial > 0 ? _dolarOficial : tipoCambio;
    const totalManual = listaInstrumentos.reduce(function(a,i){
        return a + ((i.moneda==='USD') ? i.monto*tc : i.monto);
    }, 0);
    const totalAcc = listaAcciones.reduce(function(a,ac){
        const p=(_cotizaciones[ac.ticker]||{}).precio||0;
        const esL=ac.ticker.toUpperCase().endsWith('.BA');
        const tc2=_dolarOficial>0?_dolarOficial:tipoCambio;
        return a+(esL?p*ac.cant:p*ac.cant*tc2);
    }, 0);
    const totalARS = totalManual + totalAcc;
    const totalUSD = _dolarOficial > 0 ? totalARS / _dolarOficial : 0;
    setTxt('inv-total-ars',     fmt(totalARS));
    setTxt('inv-total-usd',     fmtUSD(totalUSD));
    setTxt('inv-total-manual',  fmt(totalManual));
    setTxt('inv-total-acciones',fmt(totalAcc));
}

async function actualizarInversiones() {
    const btn = document.getElementById('btn-inv-actualizar');
    if(btn){ btn.disabled=true; btn.innerText='⏳ Actualizando...'; }

    // 1. Dólar oficial
    try {
        const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await res.json();
        _dolarOficial = data.oficial.value_sell;
        const badge = document.getElementById('inv-dolar-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(_dolarOficial) + ' (venta)';
    } catch(e) { console.warn('Error dólar:', e); }

    // 2. Cotizaciones vía Yahoo Finance + allorigins proxy
    for(let i=0; i<listaAcciones.length; i++) {
        const acc = listaAcciones[i];
        try {
            const url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+acc.ticker+'?interval=1d&range=30d';
            const proxy = 'https://corsproxy.io/?' + url;
            const res = await fetch(proxy);
            const data = await res.json();
            if(!data.chart || !data.chart.result || !data.chart.result[0]) {
                console.warn('Sin datos para '+acc.ticker+'. Error:', data.chart && data.chart.error);
                continue;
            }
            const result = data.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;

            const historia = [];
            for(let j=0; j<timestamps.length; j++) {
                if(closes[j] != null) {
                    const fecha = new Date(timestamps[j]*1000).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'});
                    historia.push({fecha: fecha, cierre: closes[j]});
                }
            }

            const precio = meta.regularMarketPrice || closes.filter(function(c){ return c!=null; }).pop() || 0;
            const prevClose = meta.chartPreviousClose || 0;
            const variacion = prevClose > 0 ? ((precio - prevClose) / prevClose) * 100 : 0;

            _cotizaciones[acc.ticker] = {precio: precio, variacion: variacion, historia: historia};
        } catch(e) { console.warn('Error cotización '+acc.ticker+':', e); }
    }

    renderInstrumentos();
    renderAcciones();
    calcDashInv();
    renderGraficosInv();

    if(btn){ btn.disabled=false; btn.innerText='🔄 Actualizar cotizaciones'; }
}

function renderGraficosInv() {
    const wrap = document.getElementById('inv-charts-wrap'); if(!wrap) return;
    wrap.innerHTML = '';

    if(!listaAcciones.length){
        wrap.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0;">Agregá acciones para ver los gráficos.</p>';
        return;
    }

    listaAcciones.forEach(function(acc, ai) {
        const cot = _cotizaciones[acc.ticker];
        if(!cot || !cot.historia.length) return;

        const hist = cot.historia;
        const div = el('div'); div.style.marginBottom = '24px';

        const titulo = el('h4'); titulo.style.cssText='font-size:12px;font-weight:bold;color:#1e293b;margin:0 0 12px;';
        titulo.innerText = acc.ticker + ' — ' + acc.desc;
        div.appendChild(titulo);

        const selDiv = el('div'); selDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
        const modos = ['Precio','Total ARS','Total USD'];
        const canvasId = 'chart-'+acc.ticker.replace('.','_')+'-'+ai;

        modos.forEach(function(m, mi) {
            const btn = el('button'); btn.className='btn';
            btn.style.cssText = 'font-size:11px;padding:4px 10px;' + (mi===0?'background:#6366f1;color:white;':'background:#f1f5f9;color:#334155;');
            btn.innerText = m;
            btn.onclick = function() {
                for(let k=0; k<selDiv.children.length; k++) selDiv.children[k].style.cssText='font-size:11px;padding:4px 10px;background:'+(k===mi?'#6366f1;color:white;':'#f1f5f9;color:#334155;');
                dibujarLineaInv(canvasId, hist, acc, mi, _dolarOficial);
            };
            selDiv.appendChild(btn);
        });

        const cvEl = el('canvas'); cvEl.id = canvasId; cvEl.style.cssText='width:100%;height:180px;';
        div.appendChild(selDiv); div.appendChild(cvEl);
        wrap.appendChild(div);

        setTimeout(function(){ dibujarLineaInv(canvasId, hist, acc, 0, _dolarOficial); }, 80*ai);
    });
}

function dibujarLineaInv(canvasId, hist, acc, modo, dolarOficial) {
    const cv = document.getElementById(canvasId); if(!cv) return;
    const W = cv.offsetWidth || 400, H = 180;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const valores = hist.map(function(h) {
        if(modo===0) return h.cierre;
        if(modo===1) return h.cierre * acc.cant;
        return dolarOficial > 0 ? (h.cierre * acc.cant / dolarOficial) : 0;
    });
    const fmtEje = modo===2 ? fmtUSD : fmt;
    const col = modo===0 ? '#6366f1' : modo===1 ? '#d97706' : '#16a34a';

    const minV = Math.min.apply(null, valores), maxV = Math.max.apply(null, valores);
    const rng = maxV - minV || 1;
    const pad = {t:20, r:10, b:30, l:75};
    const W2 = W - pad.l - pad.r, H2 = H - pad.t - pad.b;

    function xPos(i) { return pad.l + i * (W2 / (valores.length-1 || 1)); }
    function yPos(v) { return pad.t + H2 - (v-minV)/rng*H2; }

    // Área
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(valores[0]));
    valores.forEach(function(v,i){ if(i>0) ctx.lineTo(xPos(i), yPos(v)); });
    ctx.lineTo(xPos(valores.length-1), H-pad.b);
    ctx.lineTo(xPos(0), H-pad.b);
    ctx.closePath();
    ctx.fillStyle = col+'22'; ctx.fill();

    // Línea
    ctx.beginPath(); ctx.moveTo(xPos(0), yPos(valores[0]));
    valores.forEach(function(v,i){ if(i>0) ctx.lineTo(xPos(i), yPos(v)); });
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();

    // Eje Y - solo min y max con fondo blanco
    [minV, maxV].forEach(function(v) {
        const y = yPos(v);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y);
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();
        const label = fmtEje(v);
        ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left';
        const tw3 = ctx.measureText(label).width + 8;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(pad.l+4, y-19, tw3, 17);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(label, pad.l+6, y-6);
    });
    // Eje X
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(hist.length/5));
    hist.forEach(function(h, i) { if(i%step===0 || i===hist.length-1) ctx.fillText(h.fecha, xPos(i), H-pad.b+16); });
    // Punto final con caja
    const lastX = xPos(valores.length-1), lastY = yPos(valores[valores.length-1]);
    ctx.beginPath(); ctx.arc(lastX, lastY, 5, 0, 2*Math.PI); ctx.fillStyle=col; ctx.fill();
    const lastLabel = fmtEje(valores[valores.length-1]);
    ctx.font = 'bold 13px Arial';
    const tw2 = ctx.measureText(lastLabel).width + 14;
    const bx = Math.min(lastX - tw2/2, W - pad.r - tw2 - 2);
    const by = Math.max(pad.t + 2, lastY - 34);
    ctx.fillStyle = col; ctx.fillRect(bx, by, tw2, 22);
    ctx.fillStyle = 'white'; ctx.textAlign = 'center';
    ctx.fillText(lastLabel, bx + tw2/2, by + 16);
}

// ─────────────────────────────────────────────────────────────────
//  PRESUPUESTO POR RUBRO USD
// ─────────────────────────────────────────────────────────────────
function renderPresupRubrosUSD() {
    const wrap = document.getElementById('rubros-presup-usd-wrap'); if(!wrap) return;
    const gastado = {};
    listaCorrientesUSD.filter(c=>c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{ gastado[c.rubro]=(gastado[c.rubro]||0)+c.monto; });
    // Union de rubros configurados + rubros con gasto real (aunque no estén en listaRubrosUSD)
    const todosRubros = [...new Set([...listaRubrosUSD, ...Object.keys(gastado)])].sort();
    if(!todosRubros.length){ wrap.innerHTML=''; return; }
    let html = '<div style="font-size:10px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Presupuesto mensual por rubro (USD)</div>';
    todosRubros.forEach(r=>{
        const pres = listaPresupRubrosUSD[r]||0;
        const gast = gastado[r]||0;
        const pct = pres>0 ? Math.min(100,Math.round(gast/pres*100)) : 0;
        const col = colorRubro(r);
        const alerta = pres>0 && gast>=pres;
        const bg = alerta ? '#fef2f2' : '#f8fafc';
        const barColor = alerta ? '#ef4444' : col;
        const enLista = listaRubrosUSD.includes(r);
        html += '<div style="background:'+bg+';border-radius:6px;padding:8px 10px;margin-bottom:6px;border:1px solid '+(alerta?'#fca5a5':'#e2e8f0')+'">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
        html += '<span style="font-size:12px;font-weight:bold;color:'+col+';">'+r;
        if(!enLista) html += ' <span style="font-size:9px;color:#f59e0b;font-weight:normal;">(sin categoría)</span>';
        html += '</span>';
        html += '<div style="display:flex;align-items:center;gap:6px;">';
        html += '<span style="font-size:11px;color:#64748b;">'+fmtUSD(gast)+(pres>0?' / '+fmtUSD(pres):'')+'</span>';
        if(alerta) html += '<span style="font-size:10px;font-weight:bold;padding:1px 6px;border-radius:4px;background:#fee2e2;color:#b91c1c;">SUPERADO</span>';
        html += '</div></div>';
        html += '<div style="display:flex;align-items:center;gap:4px;margin-top:5px;">';
        html += '<span style="font-size:10px;color:#94a3b8;">Ppto. USD</span>';
        html += '<input type="number" min="0" step="0.01" value="'+(pres||'')+'" placeholder="Sin límite" ';
        html += 'style="width:110px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:11px;" ';
        html += 'data-rubro="'+r.replace(/"/g,'&quot;')+'" onchange="actualizarPresupRubroUSD(this)" onblur="actualizarPresupRubroUSD(this)">';
        html += '</div></div>';
    });
    wrap.innerHTML = html;
}
function actualizarPresupRubroUSD(inp) {
    const r = inp.getAttribute('data-rubro');
    const v = parseFloat(inp.value)||0;
    if(v>0) listaPresupRubrosUSD[r]=v; else delete listaPresupRubrosUSD[r];
    guardar(); renderPresupRubrosUSD(); calcDashUSD();
}

// ═══════════════════════════════════════════
//  GOOGLE DRIVE
// ═══════════════════════════════════════════
const APP_VERSION = 'v3.7.34';
const GDRIVE_CLIENT_ID='1049169592532-is5j1j4s1bmgrc9tsq48slrgul8fbj17.apps.googleusercontent.com';
const GDRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const GTOKEN_KEY='cf_gtoken';
const GTOKEN_EXP_KEY='cf_gtoken_exp';
let gToken=null;
let _alertasMostradas=false;

// Persistencia de token en localStorage con expiración
function gTokenGuardar(token, expiresInSec) {
    const exp = Date.now() + (expiresInSec||3500)*1000;
    try { localStorage.setItem(GTOKEN_KEY, token); localStorage.setItem(GTOKEN_EXP_KEY, String(exp)); } catch(e){}
    gToken = token;
}
function gTokenCargarLocal() {
    try {
        const t = localStorage.getItem(GTOKEN_KEY);
        const exp = parseInt(localStorage.getItem(GTOKEN_EXP_KEY)||'0');
        if(t && exp && Date.now() < exp - 60000) { gToken = t; return true; }
    } catch(e){}
    return false;
}
function gTokenLimpiar() {
    gToken = null;
    try { localStorage.removeItem(GTOKEN_KEY); localStorage.removeItem(GTOKEN_EXP_KEY); } catch(e){}
}

function driveCargarGoogle(cb) {
    if(typeof google!=='undefined'){ cb(); return; }
    const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client';
    s.onload=cb; s.onerror=()=>alert('No se pudo cargar Google. Verificá la conexión.'); document.head.appendChild(s);
}
function driveGetToken(cb) {
    // Intentar token guardado primero (evita popup al reabrir)
    if(gTokenCargarLocal()){ cb(gToken); return; }
    driveCargarGoogle(()=>{
        if(gToken){ cb(gToken); return; }
        const client=google.accounts.oauth2.initTokenClient({
            client_id:GDRIVE_CLIENT_ID, scope:GDRIVE_SCOPE,
            hint:'', prompt:'',
            callback:resp=>{
                if(resp.error==='interaction_required' || resp.error==='user_logged_out'){
                    const c2=google.accounts.oauth2.initTokenClient({client_id:GDRIVE_CLIENT_ID,scope:GDRIVE_SCOPE,hint:'',callback:r2=>{ if(r2.error){alert('Error: '+r2.error);return;} gTokenGuardar(r2.access_token, r2.expires_in); cb(gToken); }});
                    c2.requestAccessToken(); return;
                }
                if(resp.error){alert('Error Google: '+resp.error);return;}
                gTokenGuardar(resp.access_token, resp.expires_in);
                syncSetBadge(_syncPendiente?'pend':'noauth');
                cb(gToken);
            }
        });
        client.requestAccessToken({prompt:''});
    });
}
function driveSubir() {
    driveGetToken(token=>{
        const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
        const nombre='backup_finanzas_'+ts+'.json';
        const data=JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos});
        const meta=JSON.stringify({name:nombre,parents:['appDataFolder']});
        const form=new FormData();
        form.append('metadata',new Blob([meta],{type:'application/json'}));
        form.append('file',new Blob([data],{type:'application/json'}));
        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+token},body:form})
        .then(r=>r.json()).then(f=>{ if(f.id){ _syncPendiente=false; syncSetBadge('ok'); alert('Backup guardado en Drive: '+nombre); } else{alert('Error al subir: '+JSON.stringify(f));gTokenLimpiar();} })
        .catch(e=>{alert('Error: '+e.message);gTokenLimpiar();});
    });
}
function driveRestaurar() {
    driveGetToken(token=>{
        fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&orderBy=modifiedTime+desc&pageSize=50',{headers:{Authorization:'Bearer '+token}})
        .then(r=>r.json()).then(data=>{
            // Listar todos los backups: manuales + autosync
            const arch=(data.files||[]).filter(f=>f.name.startsWith('backup_'));
            mostrarModalDrive(arch,token);
        }).catch(e=>{alert('Error al listar Drive: '+e.message);gTokenLimpiar();});
    });
}
function mostrarModalDrive(arch,token) {
    document.getElementById('modal-drive')?.remove();
    const ov=el('div'); ov.id='modal-drive';
    ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;';
    const box=el('div'); box.style.cssText='background:white;border-radius:12px;width:480px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);overflow:hidden;';
    const hdr=el('div'); hdr.style.cssText='background:#1e293b;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;';
    const h3=el('h3'); h3.style.cssText='margin:0;color:white;font-size:15px;'; h3.innerText='☁️ Backups en Google Drive';
    const bX=el('button'); bX.innerText='✕'; bX.style.cssText='background:transparent;border:none;color:white;font-size:18px;cursor:pointer;'; bX.onclick=()=>ov.remove();
    hdr.appendChild(h3); hdr.appendChild(bX);
    const body=el('div'); body.style.cssText='padding:20px;max-height:50vh;overflow-y:auto;';
    if(!arch.length){ body.innerHTML='<p style="color:#64748b;text-align:center;padding:20px;">Sin backups en Drive. Usá ☁️ Subir para crear el primero.</p>'; }
    else { arch.forEach(f=>{
        const item=el('div'); item.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:8px;cursor:pointer;';
        item.onmouseover=()=>item.style.background='#f1f5f9'; item.onmouseout=()=>item.style.background='';
        const fecha=new Date(f.modifiedTime).toLocaleString('es-AR');
        const esAutoSync = f.name === 'backup_autosync.json';
        const label = esAutoSync ? '🔄 Autosync — ' + fecha : f.name;
        const lft=el('div'); lft.innerHTML=`<div style="font-size:13px;font-weight:bold;color:#1e293b;">${label}</div><div style="font-size:11px;color:#64748b;">${fecha}${esAutoSync?' · sync automático':''}</div>`;
        const btn=el('span'); btn.innerText='Restaurar →'; btn.style.cssText='font-size:11px;color:#4285f4;font-weight:bold;';
        item.appendChild(lft); item.appendChild(btn); item.onclick=()=>driveCargar(f.id,f.name,token,ov); body.appendChild(item);
    }); }
    const foot=el('div'); foot.style.cssText='padding:16px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;';
    const bC=el('button','btn'); bC.style.cssText='background:#e2e8f0;color:#334155;'; bC.innerText='Cancelar'; bC.onclick=()=>ov.remove(); foot.appendChild(bC);
    box.appendChild(hdr); box.appendChild(body); box.appendChild(foot); ov.appendChild(box); document.body.appendChild(ov);
}
function driveCargar(id,nombre,token,modal) {
    if(!confirm('Restaurar "'+nombre+'"? Se reemplazarán todos los datos.')) return;
    modal.remove();
    fetch('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media',{headers:{Authorization:'Bearer '+token}})
    .then(r=>r.json()).then(res=>{
        if(!res.listaBancos){alert('Backup inválido.');return;}
        cargarDatos(res); guardar(); renderTabs(); renderContenido();
        alert('Backup restaurado: '+nombre);
    }).catch(e=>alert('Error al descargar: '+e.message));
}

// ═══════════════════════════════════════════
//  SERVICE WORKER
// ═══════════════════════════════════════════
if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
        navigator.serviceWorker.register('./sw.js').then(reg=>{
            console.log('SW:', reg.scope);
            reg.addEventListener('updatefound', ()=>{
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', ()=>{
                    if(newWorker.state==='installed' && navigator.serviceWorker.controller){
                        const banner = document.createElement('div');
                        banner.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:12px 20px;border-radius:8px;z-index:9999;display:flex;align-items:center;gap:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-size:13px;';
                        banner.innerHTML='🆕 Nueva versión disponible. <button onclick="window.location.reload()" style="background:#4f46e5;color:white;border:none;border-radius:4px;padding:5px 12px;cursor:pointer;font-weight:bold;font-size:12px;">Actualizar</button>';
                        document.body.appendChild(banner);
                    }
                });
            });
        }).catch(e=>console.log('SW error:',e));
    });
}

// ═══════════════════════════════════════════
//  RESUMEN ANUAL
// ═══════════════════════════════════════════

function toggleProyectado() {
    const det = document.getElementById('d-proy-detalle');
    const tog = document.getElementById('d-proy-toggle');
    if(!det) return;
    const visible = det.style.display !== 'none';
    det.style.display = visible ? 'none' : 'block';
    if(tog) tog.innerText = visible ? '▼ detalle' : '▲ cerrar';
}


// ═══════════════════════════════════════════
//  INDICADOR YPF.BA
// ═══════════════════════════════════════════
let _ypfTimer = null;

function _ypfSetUI(precioARS, dolar, horaStr, fuera) {
    const cant = 442;
    const totalARS = precioARS * cant;
    const totalUSD = dolar > 0 ? totalARS / dolar : 0;
    const txtUSD = 'USD ' + totalUSD.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    const txtARS = fmt(totalARS) + ' ARS';
    const det = cant + ' acc × ' + fmt(Math.round(precioARS)) + ' ÷ ' + fmt(dolar);
    [['ypf-usd','ypf-ars','ypf-det','ypf-badge-hora'],
     ['ypf-usd-inv','ypf-ars-inv','ypf-det-inv','ypf-badge-hora-inv']].forEach(function(ids){
        const u=document.getElementById(ids[0]);
        const a=document.getElementById(ids[1]);
        const d=document.getElementById(ids[2]);
        const h=document.getElementById(ids[3]);
        if(u) u.innerText = txtUSD;
        if(a) a.innerText = txtARS;
        if(d) d.innerText = det;
        if(h) h.innerText = fuera ? 'Fuera de horario' : (horaStr ? 'Act. '+horaStr : '');
    });
}

async function actualizarYPF() {
    const ahora = new Date();
    const dia = ahora.getDay();
    const hora = ahora.getHours();
    const esHorario = dia>=1 && dia<=5 && hora>=10 && hora<19;

    [['ypf-usd'],['ypf-usd-inv']].forEach(function(ids){
        const u=document.getElementById(ids[0]); if(u) u.innerText='⏳ ...';
    });

    try {
        const ypfAcc = listaAcciones.find(function(a){ return a.ticker && a.ticker.toUpperCase().includes('YPF'); });
        const ticker = ypfAcc ? ypfAcc.ticker : 'YPFD.BA';
        const proxy = 'https://corsproxy.io/?https://query2.finance.yahoo.com/v8/finance/chart/'+ticker+'?interval=1d&range=5d';
        const res = await fetch(proxy);
        const data = await res.json();
        const precioARS = data.chart.result[0].meta.regularMarketPrice || 0;

        let dolar = _dolarOficial || tipoCambio || 0;
        if(!dolar) {
            const rd = await fetch('https://api.bluelytics.com.ar/v2/latest');
            const dd = await rd.json();
            dolar = dd.oficial.value_sell;
            _dolarOficial = dolar;
        }

        const horaStr = ahora.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
        _ypfSetUI(precioARS, dolar, horaStr, !esHorario);
    } catch(e) {
        [['ypf-usd'],['ypf-usd-inv']].forEach(function(ids){
            const u=document.getElementById(ids[0]); if(u) u.innerText='Error ↺';
        });
        console.warn('YPF error:', e);
    }
}



// ═══════════════════════════════════════════
//  PANEL IA — CONSULTA EN LENGUAJE NATURAL
// ═══════════════════════════════════════════
let _aiHistorial = [];

function buildContextoApp() {
    const tc = _dolarOficial || tipoCambio || 1;
    const bancoTotal = listaBancos.reduce(function(a,b){ return a+b.saldo; }, 0);
    const tarjTotal  = listaTarjetas.reduce(function(a,t){ return a+t.saldo; }, 0);
    const fijosPend  = listaServicios.filter(function(s){ return s.presupuesto>s.pagado; }).reduce(function(a,s){ return a+(s.presupuesto-s.pagado); }, 0);
    const corrEgr    = listaCorrientes.filter(function(c){ return c.fechaPago&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta')); });
    const corrIng    = listaCorrientes.filter(function(c){ return c.fechaPago&&c.esIngreso; });
    const totalEgr   = corrEgr.reduce(function(a,c){ return a+c.monto; }, 0);
    const totalIng   = corrIng.reduce(function(a,c){ return a+c.monto; }, 0);
    const porRubro = {};
    corrEgr.forEach(function(c){ porRubro[c.rubro]=(porRubro[c.rubro]||0)+c.monto; });
    const cuentasUSD  = listaCuentasUSD.reduce(function(a,b){ return a+b.saldo; }, 0);
    const corrUSDEgr  = listaCorrientesUSD.filter(function(c){ return c.fechaPago&&!c.esIngreso; }).reduce(function(a,c){ return a+c.monto; }, 0);
    const corrUSDIng  = listaCorrientesUSD.filter(function(c){ return c.fechaPago&&c.esIngreso; }).reduce(function(a,c){ return a+c.monto; }, 0);
    const servUSDPag  = listaServiciosUSD.filter(function(s){ return s.pagado>0; }).reduce(function(a,s){ return a+s.pagado; }, 0);
    const cuotasActivas = listaCuotas.filter(function(c){ return c.cuotaActual<=c.totalCuotas; });
    const hist3 = historicoMeses.slice(-3).map(function(m){ return {
        nombre: m.nombre,
        banco: (m.datos.listaBancos||[]).reduce(function(a,b){ return a+b.saldo; },0),
        egresado: (m.datos.listaCorrientes||[]).filter(function(c){ return c.fechaPago&&!c.esIngreso; }).reduce(function(a,c){ return a+c.monto; },0) +
                  (m.datos.listaServicios||[]).filter(function(s){ return s.pagado>0; }).reduce(function(a,s){ return a+s.pagado; },0)
    }; });

    var lines = [];
    lines.push('Sos un asistente financiero personal. Respondé en español, de forma concisa y directa. Usá números con formato local argentino.');
    lines.push('');
    lines.push('=== DATOS FINANCIEROS ACTUALES ===');
    lines.push('');
    lines.push('BANCOS Y EFECTIVO:');
    listaBancos.forEach(function(b){ lines.push('- ' + b.nombre + ': $' + b.saldo.toLocaleString('es-AR')); });
    lines.push('TOTAL BANCO: $' + bancoTotal.toLocaleString('es-AR'));
    lines.push('');
    lines.push('TARJETAS (deuda):');
    listaTarjetas.forEach(function(t){ lines.push('- ' + t.nombre + ': $' + t.saldo.toLocaleString('es-AR')); });
    lines.push('TOTAL DEUDA: $' + tarjTotal.toLocaleString('es-AR'));
    lines.push('');
    lines.push('SERVICIOS FIJOS:');
    listaServicios.forEach(function(s){ lines.push('- ' + s.nombre + ': ppto $' + (s.presupuesto||0).toLocaleString('es-AR') + ' | pagado $' + (s.pagado||0).toLocaleString('es-AR') + ' | pendiente $' + Math.max(0,(s.presupuesto||0)-(s.pagado||0)).toLocaleString('es-AR')); });
    lines.push('FIJOS PENDIENTES: $' + fijosPend.toLocaleString('es-AR'));
    lines.push('');
    lines.push('GASTOS CORRIENTES MES (pagados):');
    corrEgr.forEach(function(c){ lines.push('- [' + c.rubro + '] ' + c.detalle + ': $' + c.monto.toLocaleString('es-AR')); });
    lines.push('TOTAL EGRESADO: $' + totalEgr.toLocaleString('es-AR'));
    lines.push('');
    lines.push('INGRESOS MES:');
    corrIng.forEach(function(c){ lines.push('- ' + c.detalle + ': $' + c.monto.toLocaleString('es-AR')); });
    lines.push('TOTAL INGRESOS: $' + totalIng.toLocaleString('es-AR'));
    lines.push('');
    lines.push('GASTOS POR RUBRO:');
    Object.entries(porRubro).sort(function(a,b){ return b[1]-a[1]; }).forEach(function(e){ lines.push('- ' + e[0] + ': $' + e[1].toLocaleString('es-AR')); });
    lines.push('');
    lines.push('CUOTAS ACTIVAS:');
    cuotasActivas.forEach(function(c){ lines.push('- ' + c.descripcion + ': cuota ' + c.cuotaActual + '/' + c.totalCuotas + ' $' + (c.montoCuota||0).toLocaleString('es-AR')); });
    lines.push('');
    lines.push('DOLARES:');
    lines.push('- TC oficial: $' + tc.toLocaleString('es-AR'));
    lines.push('- Cuentas USD: ' + cuentasUSD.toFixed(2) + ' (ARS $' + (cuentasUSD*tc).toLocaleString('es-AR') + ')');
    lines.push('- Gastos USD: ' + corrUSDEgr.toFixed(2));
    lines.push('- Ingresos USD: ' + corrUSDIng.toFixed(2));
    lines.push('- Servicios USD pagados: ' + servUSDPag.toFixed(2));
    lines.push('');
    lines.push('HISTORICO 3 MESES:');
    hist3.forEach(function(m){ lines.push('- ' + m.nombre + ': banco $' + m.banco.toLocaleString('es-AR') + ' | egresado $' + m.egresado.toLocaleString('es-AR')); });
    lines.push('');
    lines.push('PRESUPUESTOS POR RUBRO:');
    Object.entries(listaPresupRubros).filter(function(e){ return e[1]>0; }).forEach(function(e){ lines.push('- ' + e[0] + ': $' + e[1].toLocaleString('es-AR')); });
    return lines.join('\n');
}

function toggleAIPanel() {
    var existing = document.getElementById('ai-panel');
    if(existing) {
        existing.style.transform = 'translateX(100%)';
        setTimeout(function(){ existing.remove(); _aiPanelAbierto=false; }, 300);
        return;
    }
    _aiPanelAbierto = true;
    _aiHistorial = [];
    var panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.style.cssText = 'position:fixed;top:0;right:0;width:380px;max-width:95vw;height:100vh;background:#1e293b;border-left:2px solid #4f46e5;z-index:200;display:flex;flex-direction:column;transition:transform 0.3s ease;transform:translateX(100%);box-shadow:-4px 0 24px rgba(0,0,0,0.4);';
    var header = '<div style="background:#0f172a;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;flex-shrink:0;">';
    header += '<div><div style="font-size:14px;font-weight:bold;color:#e2e8f0;">\uD83E\uDD16 Consulta IA</div>';
    header += '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">Pregunt\u00e1 sobre tus datos financieros</div></div>';
    header += '<button onclick="toggleAIPanel()" style="background:#334155;color:#e2e8f0;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:13px;">\u2715</button></div>';
    var mensajes = '<div id="ai-mensajes" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">';
    mensajes += '<div style="background:#0f172a;border-radius:8px;padding:12px;border:1px solid #334155;font-size:12px;color:#94a3b8;">';
    mensajes += 'Hola! Podés preguntarme:<br><br>';
    mensajes += '\u2022 <em>\u00BFCuánto gasté en supermercado?</em><br>';
    mensajes += '\u2022 <em>\u00BFCuál es mi rubro más caro?</em><br>';
    mensajes += '\u2022 <em>\u00BFCuánto me queda después de pagar todo?</em><br>';
    mensajes += '\u2022 <em>Comparar gastos vs presupuesto</em><br>';
    mensajes += '\u2022 <em>\u00BFCuánto debo en cuotas?</em>';
    mensajes += '</div></div>';
    var footer = '<div style="padding:12px;border-top:1px solid #334155;flex-shrink:0;">';
    footer += '<div style="display:flex;gap:8px;">';
    footer += '<input id="ai-input" type="text" placeholder="Escrib\u00ed tu pregunta..." ';
    footer += 'style="flex:1;padding:10px;border:1px solid #475569;border-radius:6px;background:#0f172a;color:#e2e8f0;font-size:13px;" ';
    footer += 'onkeydown=\"if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();enviarConsultaAI();}\">';
    footer += '<button onclick="enviarConsultaAI()" id="ai-send-btn" style="background:#4f46e5;color:white;border:none;border-radius:6px;padding:10px 14px;cursor:pointer;font-size:16px;">\u27A4</button>';
    footer += '</div><div style="font-size:10px;color:#475569;margin-top:6px;text-align:center;">Enter para enviar · Powered by Claude</div></div>';
    panel.innerHTML = header + mensajes + footer;
    document.body.appendChild(panel);
    requestAnimationFrame(function(){ panel.style.transform='translateX(0)'; });
    setTimeout(function(){ var i=document.getElementById('ai-input'); if(i) i.focus(); }, 350);
}

function aiAgregarMensaje(texto, esUsuario) {
    var wrap = document.getElementById('ai-mensajes'); if(!wrap) return null;
    var div = document.createElement('div');
    div.style.cssText = 'padding:10px 12px;border-radius:8px;font-size:13px;line-height:1.5;max-width:92%;white-space:pre-wrap;' +
        (esUsuario ? 'background:#4f46e5;color:white;align-self:flex-end;margin-left:auto;' : 'background:#0f172a;color:#e2e8f0;border:1px solid #334155;align-self:flex-start;');
    div.innerText = texto;
    wrap.appendChild(div);
    wrap.scrollTop = wrap.scrollHeight;
    return div;
}

async function enviarConsultaAI() {
    var inp = document.getElementById('ai-input'); if(!inp) return;
    var pregunta = inp.value.trim(); if(!pregunta) return;
    var btn = document.getElementById('ai-send-btn');
    inp.value = '';
    inp.disabled = true;
    if(btn) btn.disabled = true;
    aiAgregarMensaje(pregunta, true);
    var typing = aiAgregarMensaje('\u23F3 Analizando...', false);
    _aiHistorial.push({ role: 'user', content: pregunta });

    // Verificar API key de Gemini
    var apiKey = localStorage.getItem('groq_api_key') || '';
    if(!apiKey) {
        var k = prompt('Ingres\u00e1 tu API key de Groq (se guarda solo en este dispositivo):');
        if(!k || !k.trim()) { inp.disabled=false; if(btn) btn.disabled=false; return; }
        apiKey = k.trim();
        localStorage.setItem('groq_api_key', apiKey);
    }

    // Armar historial para Groq (formato OpenAI compatible)
    var messages = _aiHistorial.map(function(m, i) {
        return {
            role: m.role,
            content: i === 0 ? buildContextoApp() + '\n\n=== PREGUNTA ===\n' + m.content : m.content
        };
    });

    try {
        var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                max_tokens: 1024
            })
        });
        var data = await res.json();
        if(data.error) {
            if(res.status === 401 || res.status === 403) {
                localStorage.removeItem('groq_api_key');
                if(typing) typing.innerText = '\u26A0\uFE0F API key inv\u00e1lida. Recargá y volvé a ingresarla.';
            } else {
                if(typing) typing.innerText = '\u26A0\uFE0F Error: ' + (data.error.message || 'desconocido');
            }
            _aiHistorial.pop();
        } else {
            var respuesta = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'Sin respuesta.';
            if(typing) typing.innerText = respuesta;
            _aiHistorial.push({ role: 'assistant', content: respuesta });
        }
    } catch(e) {
        if(typing) typing.innerText = '\u26A0\uFE0F Error al conectar con Groq.';
        _aiHistorial.pop();
    }
    inp.disabled = false;
    if(btn) btn.disabled = false;
    inp.focus();
}



// ═══════════════════════════════════════════
//  INFORME SEMANAL DE PRESUPUESTO
// ═══════════════════════════════════════════
function mostrarInformeSemanal() {
    document.querySelectorAll('.modal-bg-informe').forEach(function(m){ m.remove(); });

    const hoy    = new Date();
    const anio   = hoy.getFullYear();
    const mes    = hoy.getMonth();
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const totalDias = ultimoDia.getDate();

    function lunesAnterior(fecha) {
        const d = new Date(fecha);
        const dia = d.getDay();
        const diff = dia === 0 ? -6 : 1 - dia;
        d.setDate(d.getDate() + diff);
        return d;
    }

    const semanas = [];
    let inicioSem = lunesAnterior(primerDia);
    while (inicioSem <= ultimoDia) {
        const finSem = new Date(inicioSem);
        finSem.setDate(finSem.getDate() + 6);
        const desde = new Date(Math.max(inicioSem, primerDia));
        const hasta = new Date(Math.min(finSem, ultimoDia));
        semanas.push({ desde: desde, hasta: hasta, ini: new Date(inicioSem), fin: new Date(finSem) });
        inicioSem = new Date(finSem);
        inicioSem.setDate(inicioSem.getDate() + 1);
    }

    const totalPresup = Object.values(listaPresupRubros).reduce(function(a,b){ return a+b; }, 0);

    const gastadoPorRubro = {};
    listaCorrientes.filter(function(c){ return c.fechaPago && !c.esIngreso && !(c.rubro && c.rubro.toLowerCase().includes('tarjeta')); }).forEach(function(c){
        gastadoPorRubro[c.rubro] = (gastadoPorRubro[c.rubro]||0) + c.monto;
    });
    listaServicios.filter(function(s){ return s.pagado > 0; }).forEach(function(s){
        gastadoPorRubro[s.nombre] = (gastadoPorRubro[s.nombre]||0) + s.pagado;
    });

    function gastadoHasta(fecha) {
        const fStr = fecha.toISOString().slice(0,10);
        let total = 0;
        listaCorrientes.filter(function(c){ return c.fechaPago && !c.esIngreso && !(c.rubro && c.rubro.toLowerCase().includes('tarjeta')) && c.fechaPago <= fStr; }).forEach(function(c){ total += c.monto; });
        listaServicios.filter(function(s){ return s.pagado > 0 && (!s.fPago || s.fPago <= fStr); }).forEach(function(s){ total += s.pagado; });
        return total;
    }

    function fmtFecha(d) { return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0'); }

    const gastadoTotal = Object.values(gastadoPorRubro).reduce(function(a,b){ return a+b; }, 0);
    const desvioTotal  = gastadoTotal - totalPresup;

    // ── Tabla semanas ──
    var rowsSem = '';
    semanas.forEach(function(s, i) {
        const esFutura  = s.desde > hoy;
        const diasHasta = Math.round((s.hasta - primerDia) / 86400000) + 1;
        const presupAcum = totalDias > 0 ? Math.round(totalPresup / totalDias * Math.min(diasHasta, totalDias)) : 0;
        const gastAcum   = esFutura ? null : gastadoHasta(s.hasta);
        const desvio     = gastAcum !== null ? gastAcum - presupAcum : null;
        const remanente  = totalPresup - (gastAcum !== null ? gastAcum : 0);
        const esActual   = hoy >= s.desde && hoy <= s.fin;
        const bg = esActual ? 'background:#1e3a5f;' : (i%2===0 ? '' : 'background:#1e293b;');
        const colDesv = desvio === null ? '#475569' : (desvio > 0 ? '#ef4444' : '#10b981');
        const colRem  = remanente >= 0 ? '#10b981' : '#ef4444';
        rowsSem += '<tr style="' + bg + (esFutura ? '' : '') + '">';
        rowsSem += '<td style="padding:7px 8px;color:#e2e8f0;">' + (esActual ? '<span style="font-size:9px;background:#7c3aed;color:white;border-radius:3px;padding:1px 5px;margin-right:4px;">HOY</span>' : '') + 'S' + (i+1) + ' <span style="color:#e2e8f0;font-size:10px;">(' + fmtFecha(s.desde) + '–' + fmtFecha(s.hasta) + ')</span></td>';
        rowsSem += '<td style="padding:7px 8px;text-align:right;color:#e2e8f0;">' + fmt(presupAcum) + '</td>';
        rowsSem += '<td style="padding:7px 8px;text-align:right;color:' + (esFutura ? '#475569' : '#f59e0b') + ';font-weight:bold;">' + (gastAcum !== null ? fmt(gastAcum) : '—') + '</td>';
        rowsSem += '<td style="padding:7px 8px;text-align:right;font-weight:bold;color:' + colDesv + ';">' + (desvio !== null ? (desvio > 0 ? '+' : '') + fmt(desvio) : '—') + '</td>';
        rowsSem += '<td style="padding:7px 8px;text-align:right;color:' + colRem + ';font-weight:bold;">' + fmt(remanente) + '</td>';
        rowsSem += '</tr>';
    });

    // ── Tabla rubros ──
    const rubrosConPresup = Object.keys(listaPresupRubros).filter(function(r){ return listaPresupRubros[r] > 0; });
    var rowsRub = '';
    rubrosConPresup.forEach(function(r, i) {
        const pres = listaPresupRubros[r];
        const gast = gastadoPorRubro[r] || 0;
        const desv = gast - pres;
        const col  = desv > 0 ? '#ef4444' : '#10b981';
        rowsRub += '<tr style="' + (i%2===0?'':'background:#1e293b;') + '">';
        rowsRub += '<td style="padding:6px 8px;color:#e2e8f0;">' + r + '</td>';
        rowsRub += '<td style="padding:6px 8px;text-align:right;color:#e2e8f0;">' + fmt(pres) + '</td>';
        rowsRub += '<td style="padding:6px 8px;text-align:right;color:#f59e0b;font-weight:bold;">' + fmt(gast) + '</td>';
        rowsRub += '<td style="padding:6px 8px;text-align:right;font-weight:bold;color:' + col + ';">' + (desv > 0 ? '+' : '') + fmt(desv) + '</td>';
        rowsRub += '</tr>';
    });

    var body = '';
    // Resumen general
    body += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">';
    body += '<div class="vto-item"><div><div class="vto-nombre">Presupuesto mes</div><div class="vto-sub">' + fmt(totalPresup) + '</div></div></div>';
    body += '<div class="vto-item"><div><div class="vto-nombre">Gastado total</div><div class="vto-sub" style="color:#f59e0b;">' + fmt(gastadoTotal) + '</div></div></div>';
    body += '<div class="vto-item"><div><div class="vto-nombre">Desvío total</div><div class="vto-sub" style="color:' + (desvioTotal > 0 ? '#ef4444' : '#10b981') + ';font-weight:bold;">' + (desvioTotal > 0 ? '+' : '') + fmt(desvioTotal) + '</div></div></div>';
    body += '</div>';

    // Tabla semanas
    body += '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">';
    body += '<thead><tr style="background:#1e293b;"><th style="padding:7px 8px;text-align:left;color:#e2e8f0;font-size:10px;">Semana</th><th style="padding:7px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Ppto. acum.</th><th style="padding:7px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Gastado acum.</th><th style="padding:7px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Desvío</th><th style="padding:7px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Remanente</th></tr></thead>';
    body += '<tbody>' + rowsSem + '</tbody></table>';

    // Tabla rubros
    if(rowsRub) {
        body += '<div style="font-size:10px;font-weight:bold;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;">Desvío por rubro</div>';
        body += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        body += '<thead><tr style="background:#1e293b;"><th style="padding:6px 8px;text-align:left;color:#e2e8f0;font-size:10px;">Rubro</th><th style="padding:6px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Presupuesto</th><th style="padding:6px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Gastado</th><th style="padding:6px 8px;text-align:right;color:#e2e8f0;font-size:10px;">Desvío</th></tr></thead>';
        body += '<tbody>' + rowsRub + '</tbody></table>';
    }

    const titulo = '📊 Informe Semanal — ' + primerDia.toLocaleString('es-AR',{month:'long',year:'numeric'});
    const ov = el('div','modal-overlay no-print modal-bg-informe');
    ov.style.zIndex = '1100';
    ov.onclick = function(e){ if(e.target===ov) ov.remove(); };
    ov.innerHTML = '<div class="modal-box" style="max-width:600px;width:95%;max-height:90vh;overflow-y:auto;">' +
        '<div class="modal-header"><span style="font-size:20px;">📊</span><h3>' + titulo + '</h3></div>' +
        '<div class="modal-body">' + body + '</div>' +
        '<div class="modal-footer"><button class="btn btn-dark" onclick="document.querySelector(\'.modal-bg-informe\').remove()">Cerrar</button></div>' +
        '</div>';
    document.body.appendChild(ov);
}

function iniciarTimerYPF() {
    clearInterval(_ypfTimer);
    actualizarYPF();
    _ypfTimer = setInterval(function() {
        const ahora = new Date();
        const dia = ahora.getDay();
        const hora = ahora.getHours();
        if(dia>=1 && dia<=5 && hora>=10 && hora<19) actualizarYPF();
    }, 3600000);
}


function buildAnual() {
    const wrap = el('div','container'); wrap.style.paddingTop='20px';

    // Header
    const hdr = el('div');
    hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #1d4ed8;';
    hdr.innerHTML=`<div><h2 style="margin:0;font-size:22px;color:#1e293b;">📅 Resumen Anual</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">Últimos 12 períodos cerrados + mes actual</p></div><button onclick="exportarExcel()" class="btn no-print" style="font-size:12px;padding:8px 14px;background:#10b981;color:white;">📥 Exportar Excel</button>`;
    wrap.appendChild(hdr);

    // Construir array de meses: hasta 12 históricos + mes actual
    const ultimos = [...historicoMeses].slice(-12).filter(m => !(m.nombre.includes('Mayo') && m.nombre.includes('2026')));
    const mesesArr = ultimos.map(m => ({ nombre: m.nombre, datos: m.datos, cerrado: true }));
    mesesArr.push({ nombre: 'Mes Actual', datos: { listaBancos, listaTarjetas, listaServicios, listaCorrientes, listaCuentasUSD, listaServiciosUSD, listaCorrientesUSD, tipoCambio }, cerrado: false });

    if (mesesArr.length === 1) {
        wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:32px;text-align:center;color:#94a3b8;">Todavía no hay períodos cerrados. Cerrá el primer mes para ver el resumen anual.</div>');
        return wrap;
    }

    // ── TABLA 1: MÉTRICAS FINANCIERAS ─────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 14px;font-size:14px;font-weight:bold;color:#1d4ed8;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Métricas por Período</h3>');

    function calcMes(m) {
        const db = m.datos;
        let banco = 0, deudaTarj = 0, egresado = 0, ingresos = 0;
        // Banco
        (db.listaBancos||[]).forEach(b => banco += b.saldo);
        // Deuda tarjetas
        const mDeb = {}; (db.listaTarjetas||[]).forEach(t => { mDeb[t.id]=0; deudaTarj+=t.saldo; });
        (db.listaServicios||[]).forEach(s => { if(s.pagado>0 && mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
        (db.listaCorrientes||[]).forEach(c => { if(c.fechaPago && mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
        deudaTarj += Object.values(mDeb).reduce((a,v)=>a+v,0);
        // Egresado e ingresos corrientes
        (db.listaCorrientes||[]).filter(c=>c.fechaPago && !(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c => {
            if(c.esIngreso) ingresos += c.monto; else egresado += c.monto;
        });
        // Fijos pagados
        (db.listaServicios||[]).forEach(s => { if(s.pagado>0) egresado += s.pagado; });
        // USD en ARS
        const tc = db.tipoCambio || tipoCambio || 1;
        let bancoUSD = 0;
        (db.listaCuentasUSD||[]).forEach(b => bancoUSD += b.saldo);
        (db.listaServiciosUSD||[]).filter(s=>s.pagado>0).forEach(s => egresado += s.pagado * tc);
        (db.listaCorrientesUSD||[]).filter(c=>c.fechaPago&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c => {
            if(c.esIngreso) ingresos += c.monto * tc; else egresado += c.monto * tc;
        });
        const balance = ingresos - egresado;
        return { banco, bancoUSD, deudaTarj, egresado, ingresos, balance, tc };
    }

    const resultados = mesesArr.map(m => ({ nombre: m.nombre, cerrado: m.cerrado, ...calcMes(m) }));

    // Tabla horizontal
    const cols = ['banco','deudaTarj','ingresos','egresado','balance'];
    const labels = { banco:'🏦 Banco ($)', deudaTarj:'💳 Deuda Tarj.', ingresos:'📈 Ingresos', egresado:'📤 Egresado', balance:'⚖️ Balance' };
    let tbl = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #1d4ed8;padding:16px;margin-bottom:20px;overflow-x:auto;">
<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:700px;">
<thead><tr style="background:#1e293b;">
<th style="padding:8px;text-align:left;color:white;white-space:nowrap;">Métrica</th>`;
    resultados.forEach(r => { tbl += `<th style="padding:8px;text-align:right;color:${r.cerrado?'#94a3b8':'#fbbf24'};white-space:nowrap;">${r.nombre.replace(' de ',' ')}</th>`; });
    tbl += `</tr></thead><tbody>`;

    cols.forEach((col,ci) => {
        const vals = resultados.map(r => r[col]);
        const maxAbs = Math.max(...vals.map(v=>Math.abs(v)));
        tbl += `<tr style="background:${ci%2===0?'white':'#f8fafc'};">
<td style="padding:7px 8px;font-weight:bold;color:#334155;white-space:nowrap;">${labels[col]}</td>`;
        resultados.forEach(r => {
            const v = r[col];
            let color = '#334155';
            if(col==='balance') color = v>=0?'#10b981':'#ef4444';
            else if(col==='deudaTarj') color = '#a855f7';
            else if(col==='ingresos') color = '#0284c7';
            else if(col==='egresado') color = '#f59e0b';
            // mini barra inline
            const pct = maxAbs>0?Math.round(Math.abs(v)/maxAbs*60):0;
            const barColor = col==='balance'?(v>=0?'#10b981':'#ef4444'):(col==='deudaTarj'?'#a855f7':col==='ingresos'?'#0284c7':col==='egresado'?'#f59e0b':'#1d4ed8');
            tbl += `<td style="padding:7px 8px;text-align:right;">
<div style="font-weight:bold;color:${color};font-size:10px;">${fmt(v)}</div>
<div style="background:#e2e8f0;border-radius:2px;height:3px;margin-top:3px;"><div style="background:${barColor};height:3px;border-radius:2px;width:${pct}%;"></div></div>
</td>`;
        });
        tbl += `</tr>`;
    });
    tbl += `</tbody></table></div>`;
    wrap.insertAdjacentHTML('beforeend', tbl);

    // ── TABLA 2: GASTOS POR RUBRO ─────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 14px;font-size:14px;font-weight:bold;color:#f59e0b;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Gastos por Rubro · Todos los Períodos</h3>');

    const todosRubs = new Set();
    mesesArr.forEach(m => {
        (m.datos.listaCorrientes||[]).filter(c=>c.fechaPago && !(c.rubro&&c.rubro.toLowerCase().includes('tarjeta')) && !c.esIngreso).forEach(c=>todosRubs.add(c.rubro||'Sin rubro'));
        (m.datos.listaServicios||[]).filter(s=>s.rubro).forEach(s=>todosRubs.add(s.rubro));
    });
    const rubArr = [...todosRubs].sort();

    // Filtro dinámico Anual
    let filtroAnual='';
    const fwA=el('div'); fwA.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:12px;';
    fwA.innerHTML='<label style="font-size:12px;color:#64748b;font-weight:bold;">Filtrar rubro:</label>';
    const selA=el('select'); selA.style.cssText='padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;color:#334155;';
    addOpt(selA,'','— Todos los rubros —');
    rubArr.forEach(r=>addOpt(selA,r,r));
    selA.onchange=e=>{ filtroAnual=e.target.value; renderTablaAnual(); };
    fwA.appendChild(selA); wrap.appendChild(fwA);
    const contAnual=el('div'); wrap.appendChild(contAnual);
    const renderTablaAnual=()=>{
        const rubFilt=filtroAnual?[filtroAnual]:rubArr;
        if(!rubFilt.length){ contAnual.innerHTML=''; return; }
        let t2 = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:20px;overflow-x:auto;">
<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:700px;">
<thead><tr style="background:#1e293b;">
<th style="padding:8px;text-align:left;color:white;">Rubro</th>`;
        resultados.forEach(r => { t2 += `<th style="padding:8px;text-align:right;color:${r.cerrado?'#94a3b8':'#fbbf24'};white-space:nowrap;">${r.nombre.replace(' de ',' ')}</th>`; });
        t2 += `<th style="padding:8px;text-align:right;color:#f59e0b;">TOTAL</th><th style="padding:8px;text-align:right;color:#f59e0b;">PROM</th></tr></thead><tbody>`;
        const totMes = new Array(resultados.length).fill(0);
        let totGen = 0;
        rubFilt.forEach((rub, ri) => {
            let totR = 0;
            t2 += `<tr style="background:${ri%2===0?'white':'#f8fafc'};">
<td style="padding:6px 8px;font-weight:bold;color:#334155;">${rub}</td>`;
            resultados.forEach((r, mi) => {
                const mesData = mesesArr[mi].datos;
                const sc = (mesData.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===rub&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
                const sfPres = (mesData.listaServicios||[]).filter(sv=>sv.rubro===rub).reduce((a,sv)=>a+sv.presupuesto,0);
                const sfPag  = (mesData.listaServicios||[]).filter(sv=>sv.rubro===rub).reduce((a,sv)=>a+sv.pagado,0);
                const s = sc + sfPres;
                const tip = sfPres>0 ? ` title="Corrientes: ${fmt(sc)} | Fijos presup: ${fmt(sfPres)} | Fijos pag: ${fmt(sfPag)}"` : '';
                totMes[mi] += s; totR += s;
                t2 += `<td style="padding:6px 8px;text-align:right;color:${s>0?'#10b981':'#94a3b8'};font-weight:${s>0?'bold':'normal'};"${tip}>${s>0?fmt(s):'—'}</td>`;
            });
            totGen += totR;
            const promR = totR / (resultados.filter((_,i) => {
                const mesData = mesesArr[i].datos;
                return (mesData.listaCorrientes||[]).some(c=>c.fechaPago&&c.rubro===rub&&!c.esIngreso) || (mesData.listaServicios||[]).some(sv=>sv.rubro===rub);
            }).length || 1);
            t2 += `<td style="padding:6px 8px;text-align:right;font-weight:bold;color:#f59e0b;">${fmt(totR)}</td>`;
            t2 += `<td style="padding:6px 8px;text-align:right;color:#64748b;font-size:10px;">${fmt(promR)}</td></tr>`;
        });
        t2 += `<tr style="background:#f1f5f9;font-weight:bold;">
<td style="padding:7px 8px;color:#1e293b;">TOTAL PERÍODO</td>`;
        totMes.forEach(t => { t2 += `<td style="padding:7px 8px;text-align:right;color:#4f46e5;">${fmt(t)}</td>`; });
        t2 += `<td style="padding:7px 8px;text-align:right;color:#f59e0b;">${fmt(totGen)}</td>`;
        t2 += `<td style="padding:7px 8px;text-align:right;color:#64748b;font-size:10px;">${fmt(totGen/resultados.length)}</td></tr>`;
        t2 += `</tbody></table></div>`;
        contAnual.innerHTML = t2;
    }
    if (rubArr.length) renderTablaAnual();

    // ── TARJETAS RESUMEN (KPIs) ───────────────────────────────
    const promedioBalance = resultados.slice(0,-1).reduce((a,r)=>a+r.balance,0) / Math.max(resultados.length-1,1);
    const mejorMes = [...resultados].sort((a,b)=>b.balance-a.balance)[0];
    const peorMes  = [...resultados].sort((a,b)=>a.balance-b.balance)[0];
    const totalEgr = resultados.slice(0,-1).reduce((a,r)=>a+r.egresado,0);
    const totalIng = resultados.slice(0,-1).reduce((a,r)=>a+r.ingresos,0);

    wrap.insertAdjacentHTML('beforeend',`
<h3 style="margin:20px 0 14px;font-size:14px;font-weight:bold;color:#7c3aed;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">KPIs del Período</h3>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px;">
  <div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:4px solid #10b981;padding:14px;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Balance promedio mensual</div>
    <div style="font-size:18px;font-weight:bold;color:${promedioBalance>=0?'#10b981':'#ef4444'};">${fmt(promedioBalance)}</div>
  </div>
  <div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:4px solid #0284c7;padding:14px;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Total egresado (períodos cerrados)</div>
    <div style="font-size:18px;font-weight:bold;color:#f59e0b;">${fmt(totalEgr)}</div>
  </div>
  <div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:4px solid #a855f7;padding:14px;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Total ingresos (períodos cerrados)</div>
    <div style="font-size:18px;font-weight:bold;color:#0284c7;">${fmt(totalIng)}</div>
  </div>
  <div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:4px solid #f59e0b;padding:14px;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Mejor período</div>
    <div style="font-size:14px;font-weight:bold;color:#10b981;">${mejorMes.nombre.replace(' de ',' ')}</div>
    <div style="font-size:11px;color:#64748b;">${fmt(mejorMes.balance)}</div>
  </div>
  <div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:4px solid #ef4444;padding:14px;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Peor período</div>
    <div style="font-size:14px;font-weight:bold;color:#ef4444;">${peorMes.nombre.replace(' de ',' ')}</div>
    <div style="font-size:11px;color:#64748b;">${fmt(peorMes.balance)}</div>
  </div>
</div>`);

    // ── RESUMEN USD ───────────────────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:20px 0 14px;font-size:14px;font-weight:bold;color:#16a34a;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Resumen en Dólares · Todos los Períodos</h3>');

    // Tabla métricas USD
    const mesesUSD = ultimos.filter(m => !(m.nombre.includes('Mayo') && m.nombre.includes('2026'))).map(m => ({ nombre: m.nombre, datos: m.datos }));
    mesesUSD.push({ nombre: 'Mes Actual', datos: { listaCuentasUSD, listaTarjetasUSD, listaServiciosUSD, listaCorrientesUSD } });

    function calcMesUSD(m) {
        const db = m.datos;
        let cuentas = 0, egresado = 0, ingresos = 0;
        (db.listaCuentasUSD||[]).forEach(b => cuentas += b.saldo);
        (db.listaServiciosUSD||[]).filter(s=>s.pagado>0).forEach(s => egresado += s.pagado);
        (db.listaCorrientesUSD||[]).filter(c=>c.fechaPago&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c => {
            if(c.esIngreso) ingresos += c.monto; else egresado += c.monto;
        });
        return { cuentas, egresado, ingresos, balance: ingresos - egresado };
    }

    const resUSD = mesesUSD.map(m => ({ nombre: m.nombre, ...calcMesUSD(m) }));
    const tieneUSD = resUSD.some(r => r.cuentas > 0 || r.egresado > 0 || r.ingresos > 0);

    if(!tieneUSD) {
        wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:20px;text-align:center;color:#94a3b8;margin-bottom:20px;">Sin movimientos en dólares registrados.</div>');
    } else {
        const colsUSD = ['cuentas','ingresos','egresado','balance'];
        const labUSD = { cuentas:'🏦 Cuentas USD', ingresos:'📈 Ingresos', egresado:'📤 Egresado', balance:'⚖️ Balance' };
        let tUSD = '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #16a34a;padding:16px;margin-bottom:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;"><thead><tr style="background:#1e293b;"><th style="padding:8px;text-align:left;color:white;">Métrica</th>';
        resUSD.forEach(r => { tUSD += '<th style="padding:8px;text-align:right;color:#94a3b8;white-space:nowrap;">'+r.nombre.replace(' de ',' ')+'</th>'; });
        tUSD += '</tr></thead><tbody>';
        colsUSD.forEach((col,ci) => {
            const vals = resUSD.map(r=>r[col]);
            const maxAbs = Math.max(...vals.map(v=>Math.abs(v)));
            tUSD += '<tr style="background:'+(ci%2===0?'white':'#f8fafc')+'"><td style="padding:7px 8px;font-weight:bold;color:#334155;">'+labUSD[col]+'</td>';
            resUSD.forEach(r => {
                const v = r[col];
                let color = '#334155';
                if(col==='balance') color = v>=0?'#10b981':'#ef4444';
                else if(col==='egresado') color = '#f59e0b';
                else if(col==='ingresos') color = '#0284c7';
                else if(col==='cuentas') color = '#16a34a';
                const pct = maxAbs>0?Math.round(Math.abs(v)/maxAbs*60):0;
                const barColor = col==='balance'?(v>=0?'#10b981':'#ef4444'):col==='egresado'?'#f59e0b':col==='ingresos'?'#0284c7':'#16a34a';
                tUSD += '<td style="padding:7px 8px;text-align:right;"><div style="font-weight:bold;color:'+color+';font-size:10px;">'+fmtUSD(v)+'</div><div style="background:#e2e8f0;border-radius:2px;height:3px;margin-top:3px;"><div style="background:'+barColor+';height:3px;border-radius:2px;width:'+pct+'%;"></div></div></td>';
            });
            tUSD += '</tr>';
        });
        tUSD += '</tbody></table></div>';
        wrap.insertAdjacentHTML('beforeend', tUSD);

        // Tabla rubros USD acumulado
        const rubsUSD = new Set();
        mesesUSD.forEach(m => (m.datos.listaCorrientesUSD||[]).filter(c=>!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>rubsUSD.add(c.rubro||'Sin rubro')));
        const rubArrUSD = [...rubsUSD].sort();
        if(rubArrUSD.length) {
            let tR = '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:16px;overflow-x:auto;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Gastos por Rubro USD</h4><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;"><thead><tr style="background:#1e293b;"><th style="padding:8px;text-align:left;color:white;">Rubro</th>';
            resUSD.forEach(r => { tR += '<th style="padding:8px;text-align:right;color:#94a3b8;white-space:nowrap;">'+r.nombre.replace(' de ',' ')+'</th>'; });
            tR += '<th style="padding:8px;text-align:right;color:#f59e0b;">TOTAL</th></tr></thead><tbody>';
            rubArrUSD.forEach((rub,ri) => {
                let totR = 0;
                tR += '<tr style="background:'+(ri%2===0?'white':'#f8fafc')+'"><td style="padding:6px 8px;font-weight:bold;color:#334155;">'+rub+'</td>';
                mesesUSD.forEach(m => {
                    const s = (m.datos.listaCorrientesUSD||[]).filter(c=>c.rubro===rub&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
                    totR += s;
                    tR += '<td style="padding:6px 8px;text-align:right;color:'+(s>0?'#10b981':'#94a3b8')+';font-weight:'+(s>0?'bold':'normal')+';font-size:10px;">'+(s>0?fmtUSD(s):'—')+'</td>';
                });
                tR += '<td style="padding:6px 8px;text-align:right;font-weight:bold;color:#f59e0b;font-size:10px;">'+fmtUSD(totR)+'</td></tr>';
            });
            tR += '</tbody></table></div>';
            wrap.insertAdjacentHTML('beforeend', tR);
        }
    }

    // ── GRÁFICO EVOLUCIÓN DE SALDOS ─────────────────────────
    if (resultados.length >= 2) {
        wrap.insertAdjacentHTML('beforeend','<h3 style="margin:20px 0 14px;font-size:14px;font-weight:bold;color:#0284c7;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Evolución de Saldos · Banco y Balance</h3>');

        const W = 700, H = 220, PAD = { top: 20, right: 20, bottom: 50, left: 80 };
        const chartW = W - PAD.left - PAD.right;
        const chartH = H - PAD.top - PAD.bottom;
        const n = resultados.length;

        const bancos  = resultados.map(r => r.banco);
        const balances = resultados.map(r => r.balance);
        const nombres  = resultados.map(r => r.nombre.replace(' de ',' ').replace('Mes Actual','Actual'));

        const allVals = [...bancos, ...balances];
        const minV = Math.min(...allVals);
        const maxV = Math.max(...allVals);
        const rng  = maxV - minV || 1;
        const yMin = minV - rng * 0.1;
        const yMax = maxV + rng * 0.1;
        const yRng = yMax - yMin;

        function xPos(i) { return PAD.left + (i / (n - 1)) * chartW; }
        function yPos(v) { return PAD.top + chartH - ((v - yMin) / yRng) * chartH; }
        function fmtK(v) {
            const abs = Math.abs(v);
            const sign = v < 0 ? '-' : '';
            if(abs >= 1000000) return sign + (abs/1000000).toFixed(1) + 'M';
            if(abs >= 1000)    return sign + Math.round(abs/1000) + 'K';
            return sign + Math.round(abs);
        }

        // Línea banco (azul)
        const ptsB = bancos.map((v,i) => xPos(i)+','+yPos(v)).join(' ');
        // Área banco
        const areaB = 'M'+xPos(0)+','+yPos(bancos[0])+' '+bancos.map((v,i)=>'L'+xPos(i)+','+yPos(v)).join(' ')+' L'+xPos(n-1)+','+yPos(yMin)+' L'+xPos(0)+','+yPos(yMin)+' Z';
        // Línea balance (verde/rojo según valor)
        const ptsBal = balances.map((v,i) => xPos(i)+','+yPos(v)).join(' ');

        // Grilla horizontal (4 líneas)
        let grid = '';
        for(let i=0;i<=4;i++) {
            const v = yMin + (yRng/4)*i;
            const y = yPos(v);
            grid += '<line x1="'+PAD.left+'" y1="'+y+'" x2="'+(PAD.left+chartW)+'" y2="'+y+'" stroke="#e2e8f0" stroke-width="1"/>';
            grid += '<text x="'+(PAD.left-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+fmtK(v)+'</text>';
        }

        // Línea de cero si está en rango
        let zeroLine = '';
        if(yMin <= 0 && yMax >= 0) {
            const yz = yPos(0);
            zeroLine = '<line x1="'+PAD.left+'" y1="'+yz+'" x2="'+(PAD.left+chartW)+'" y2="'+yz+'" stroke="#64748b" stroke-width="1" stroke-dasharray="4,3"/>';
        }

        // Puntos y etiquetas X
        let puntosBanco = '', puntosBalance = '', labelsX = '';
        resultados.forEach((r,i) => {
            const xb = xPos(i), yb = yPos(bancos[i]);
            const xbal = xPos(i), ybal = yPos(balances[i]);
            const balColor = balances[i] >= 0 ? '#10b981' : '#ef4444';
            puntosBanco   += '<circle cx="'+xb+'" cy="'+yb+'" r="4" fill="#0284c7" stroke="white" stroke-width="2"/>';
            puntosBalance += '<circle cx="'+xbal+'" cy="'+ybal+'" r="4" fill="'+balColor+'" stroke="white" stroke-width="2"/>';
            // Label eje X (rotado, cada N si hay muchos)
            const mostrar = n <= 7 || i % Math.ceil(n/7) === 0 || i === n-1;
            if(mostrar) {
                labelsX += '<text x="'+xb+'" y="'+(H-PAD.bottom+14)+'" text-anchor="middle" font-size="8" fill="#64748b" transform="rotate(-30 '+xb+' '+(H-PAD.bottom+14)+')">'+nombres[i]+'</text>';
            }
        });

        const svgChart = '<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:16px;margin-bottom:20px;overflow-x:auto;">' +
            '<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:'+W+'px;display:block;">' +
            // Área banco
            '<path d="'+areaB+'" fill="#0284c7" opacity="0.08"/>' +
            // Grilla
            grid + zeroLine +
            // Líneas
            '<polyline points="'+ptsB+'" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
            '<polyline points="'+ptsBal+'" fill="none" stroke="#10b981" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="5,3"/>' +
            // Puntos
            puntosBanco + puntosBalance +
            // Labels X
            labelsX +
            // Eje Y label
            '<text x="12" y="'+(PAD.top+chartH/2)+'" text-anchor="middle" font-size="9" fill="#94a3b8" transform="rotate(-90 12 '+(PAD.top+chartH/2)+')">$ ARS</text>' +
            // Leyenda
            '<rect x="'+PAD.left+'" y="'+(H-16)+'" width="10" height="3" fill="#0284c7" rx="1"/>' +
            '<text x="'+(PAD.left+14)+'" y="'+(H-12)+'" font-size="9" fill="#0284c7">Banco</text>' +
            '<line x1="'+(PAD.left+60)+'" y1="'+(H-13)+'" x2="'+(PAD.left+70)+'" y2="'+(H-13)+'" stroke="#10b981" stroke-width="2" stroke-dasharray="4,2"/>' +
            '<text x="'+(PAD.left+74)+'" y="'+(H-12)+'" font-size="9" fill="#10b981">Balance</text>' +
            '</svg></div>';

        wrap.insertAdjacentHTML('beforeend', svgChart);
    }

    return wrap;
}

// ═══════════════════════════════════════════
//  EXPORTAR EXCEL
// ═══════════════════════════════════════════
function exportarExcel() {
    // Usamos SheetJS via CDN (se carga dinámicamente si no está)
    function generarXLSX() {
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();

        // ── Hoja 1: Mes Actual - Bancos ──
        const datBancos = [['Cuenta','Saldo']];
        listaBancos.forEach(b => datBancos.push([b.nombre, b.saldo]));
        datBancos.push(['TOTAL', listaBancos.reduce((a,b)=>a+b.saldo,0)]);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datBancos), 'Bancos');

        // ── Hoja 2: Servicios Fijos ──
        const datServ = [['Nombre','Presupuesto','Pagado','Pendiente','Clase']];
        listaServicios.forEach(s => datServ.push([s.nombre, s.presupuesto||0, s.pagado||0, Math.max(0,(s.presupuesto||0)-(s.pagado||0)), s.clase||'']));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datServ), 'Fijos');

        // ── Hoja 3: Gastos Corrientes ──
        const datCorr = [['Fecha','Rubro','Detalle','Monto','Tipo','Medio de Pago']];
        listaCorrientes.filter(c=>c.fechaPago).forEach(c => {
            const mp = [...listaBancos,...listaTarjetas].find(x=>x.id===c.medioPagoId);
            datCorr.push([c.fechaPago||'', c.rubro||'', c.detalle||'', c.monto, c.esIngreso?'Ingreso':'Egreso', mp?mp.nombre:'—']);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datCorr), 'Corrientes');

        // ── Hoja 4: Dólares Corrientes ──
        const datCorrUSD = [['Fecha Pago','Rubro','Detalle','Monto USD','Tipo']];
        listaCorrientesUSD.filter(c=>c.fechaPago).forEach(c => datCorrUSD.push([c.fechaPago||'', c.rubro||'', c.detalle||'', c.monto, c.esIngreso?'Ingreso':'Egreso']));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datCorrUSD), 'Corrientes USD');

        // ── Hoja 5: Resumen Anual ──
        const ultimos = [...historicoMeses].slice(-12).filter(m => !(m.nombre.includes('Mayo') && m.nombre.includes('2026')));
        const mesesArr2 = ultimos.map(m => ({ nombre: m.nombre, datos: m.datos }));
        mesesArr2.push({ nombre: 'Mes Actual', datos: { listaBancos, listaTarjetas, listaServicios, listaCorrientes } });

        const datAnual = [['Período','Banco ($)','Deuda Tarj.','Ingresos','Egresado','Balance']];
        mesesArr2.forEach(m => {
            const db = m.datos;
            let banco=0, deudaTarj=0, egresado=0, ingresos=0;
            (db.listaBancos||[]).forEach(b=>banco+=b.saldo);
            const mDeb2={}; (db.listaTarjetas||[]).forEach(t=>{mDeb2[t.id]=0; deudaTarj+=t.saldo;});
            (db.listaServicios||[]).forEach(s=>{ if(s.pagado>0&&mDeb2[s.medioPagoId]!==undefined) mDeb2[s.medioPagoId]+=s.pagado; });
            (db.listaCorrientes||[]).forEach(c=>{ if(c.fechaPago&&mDeb2[c.medioPagoId]!==undefined) mDeb2[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
            deudaTarj += Object.values(mDeb2).reduce((a,v)=>a+v,0);
            (db.listaCorrientes||[]).filter(c=>c.fechaPago&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{ if(c.esIngreso) ingresos+=c.monto; else egresado+=c.monto; });
            (db.listaServicios||[]).forEach(s=>{ if(s.pagado>0) egresado+=s.pagado; });
            datAnual.push([m.nombre, banco, deudaTarj, ingresos, egresado, ingresos-egresado]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datAnual), 'Resumen Anual');

        // ── Hoja 6: Rubros acumulado ──
        const datRubros = [['Rubro']];
        const rubSet = new Set();
        mesesArr2.forEach(m => (m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))&&!c.esIngreso).forEach(c=>rubSet.add(c.rubro||'Sin rubro')));
        const rubArr2 = [...rubSet].sort();
        mesesArr2.forEach(m => datRubros[0].push(m.nombre));
        datRubros[0].push('TOTAL');
        rubArr2.forEach(rub => {
            const row = [rub];
            let tot = 0;
            mesesArr2.forEach(m => {
                const s = (m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===rub&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
                row.push(s||0); tot+=s;
            });
            row.push(tot);
            datRubros.push(row);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datRubros), 'Rubros Acumulado');

        // ── Hoja 7: Rubros USD acumulado ──
        const datRubrosUSD = [['Rubro']];
        const rubSetUSD = new Set();
        mesesArr2.forEach(m => (m.datos.listaCorrientesUSD||[]).filter(c=>!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>rubSetUSD.add(c.rubro||'Sin rubro')));
        const rubArrUSD2 = [...rubSetUSD].sort();
        mesesArr2.forEach(m => datRubrosUSD[0].push(m.nombre));
        datRubrosUSD[0].push('TOTAL');
        rubArrUSD2.forEach(rub => {
            const row = [rub];
            let tot = 0;
            mesesArr2.forEach(m => {
                const s = (m.datos.listaCorrientesUSD||[]).filter(c=>c.rubro===rub&&!c.esIngreso&&!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).reduce((a,c)=>a+c.monto,0);
                row.push(s||0); tot+=s;
            });
            row.push(tot);
            datRubrosUSD.push(row);
        });
        if(rubArrUSD2.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datRubrosUSD), 'Rubros USD');

        // ── Hoja 8: Resumen Anual USD ──
        const datAnualUSD = [['Período','Cuentas USD','Ingresos USD','Egresado USD','Balance USD']];
        mesesArr2.forEach(m => {
            const db = m.datos;
            let cuentas=0, egresado=0, ingresos=0;
            (db.listaCuentasUSD||[]).forEach(b=>cuentas+=b.saldo);
            (db.listaServiciosUSD||[]).filter(s=>s.pagado>0).forEach(s=>egresado+=s.pagado);
            (db.listaCorrientesUSD||[]).filter(c=>!(c.rubro&&c.rubro.toLowerCase().includes('tarjeta'))).forEach(c=>{ if(c.esIngreso) ingresos+=c.monto; else egresado+=c.monto; });
            datAnualUSD.push([m.nombre, cuentas, ingresos, egresado, ingresos-egresado]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datAnualUSD), 'Resumen Anual USD');

        // Descargar
        const d = new Date(), ts = d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
        XLSX.writeFile(wb, `control_financiero_${ts}.xlsx`);
    }

    // SheetJS cargado localmente (offline-ready)
    generarXLSX();
}



function limpiarCache() {
    if(!confirm('¿Limpiar caché y recargar la app?')) return;
    const doNavegar = function() {
        caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); })
        .finally(function(){
            const base = location.href.split('?')[0];
            location.href = base + '?v=' + Date.now();
        });
    };
    if(navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(function(regs){
            return Promise.all(regs.map(function(r){ return r.unregister(); }));
        }).then(doNavegar).catch(doNavegar);
    } else { doNavegar(); }
}

