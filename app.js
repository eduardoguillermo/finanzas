// ═══════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════
const K = {
    rubros:'f_r_v2_2', bancos:'f_bancos_v2_4', tarjetas:'f_tarjetas_v2_4',
    servicios:'f_servicios_v2_4', corrientes:'f_corrientes_v2_4',
    transferencias:'f_transferencias_v3', cuotas:'f_cuotas_v3', historico:'f_historico_v3',
    transferenciasUSD:'f_transferenciasUSD_v1',
    cuentasUSD:'f_cuentasUSD_v3', tarjetasUSD:'f_tarjetasUSD_v3',
    serviciosUSD:'f_serviciosUSD_v3', corrientesUSD:'f_corrientesUSD_v3',
    tipoCambio:'f_tipoCambio_v3',
    comprasUSD:'f_comprasUSD_v1',
    instrumentos:'f_instrumentos_v1',
    acciones:'f_acciones_v1',
    ingresos:'f_ingresos_v1',
    ingresosUSD:'f_ingresosUSD_v1',
    ingresosPresup:'f_ingresosPresup_v1',
    pagosTarjeta:'f_pagosTarjeta_v1',
    pagosTarjetaUSD:'f_pagosTarjetaUSD_v1'
};
let listaRubros        = leer(K.rubros)        || ["Carnicería / Verdulería","Supermercado / Almacén","Gastos Auto / Combustible"];
let listaBancos        = leer(K.bancos)        || [];
let listaTarjetas      = leer(K.tarjetas)      || [];
let listaServicios     = leer(K.servicios)     || [];
let listaCorrientes    = leer(K.corrientes)    || [];
let listaTransferencias= leer(K.transferencias)|| [];
let listaTransferenciasUSD = leer(K.transferenciasUSD) || [];
let listaCuotas        = leer(K.cuotas)        || [];
let historicoMeses     = leer(K.historico)     || [];
let listaCuentasUSD    = leer(K.cuentasUSD)    || [];
let listaComprasUSD    = leer(K.comprasUSD)    || [];
let listaTarjetasUSD   = leer(K.tarjetasUSD)   || [];
let listaServiciosUSD  = leer(K.serviciosUSD)  || [];
let listaCorrientesUSD = leer(K.corrientesUSD) || [];
let tipoCambio         = leer(K.tipoCambio)    || 1200;
let listaInstrumentos  = leer(K.instrumentos)  || [];
let listaAcciones      = leer(K.acciones)      || [];
let listaIngresos      = leer(K.ingresos)      || [];
let listaIngresosUSD   = leer(K.ingresosUSD)   || [];
let listaIngresosPresup = leer(K.ingresosPresup) || [];
let listaPagosTarjeta  = leer(K.pagosTarjeta)  || [];
let listaPagosTarjetaUSD = leer(K.pagosTarjetaUSD) || [];
let listaPresupRubros    = leer('f_presup_rubros_v1')    || {};
let listaPresupRubrosUSD = leer('f_presup_rubros_usd_v1') || {};
let listaRubrosUSD       = leer('f_rubros_usd_v1')        || ['Electrónica','Servicios Online','Transferencias','Varios USD'];
let tabActivo = null;
let movBancoSelId = null; // cuenta bancaria seleccionada en la pestaña Movimientos
let movMesSelYM = null; // mes (YYYY-MM) seleccionado en la pestaña Movimientos
let movMoneda = 'ARS'; // 'ARS' | 'USD' — moneda seleccionada en la pestaña Movimientos
let movCuentaUSDSelId = null; // cuenta USD seleccionada en la pestaña Movimientos
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
        listaTransferencias,listaTransferenciasUSD,listaComprasUSD,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,
        listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,
        listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos,listaIngresosUSD,listaIngresosPresup,
        listaPagosTarjeta,listaPagosTarjetaUSD});
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
        if(d.listaTransferenciasUSD)listaTransferenciasUSD= d.listaTransferenciasUSD;
        if(d.listaComprasUSD)    listaComprasUSD    = d.listaComprasUSD;
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
        if(d.listaIngresos)      listaIngresos      = d.listaIngresos;
        if(d.listaIngresosUSD)   listaIngresosUSD   = d.listaIngresosUSD;
        if(d.listaIngresosPresup) listaIngresosPresup = d.listaIngresosPresup;
        if(d.listaPagosTarjeta)  listaPagosTarjeta  = d.listaPagosTarjeta;
        if(d.listaPagosTarjetaUSD) listaPagosTarjetaUSD = d.listaPagosTarjetaUSD;
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
        localStorage.setItem(K.transferenciasUSD, JSON.stringify(listaTransferenciasUSD));
        localStorage.setItem(K.comprasUSD,     JSON.stringify(listaComprasUSD));
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
        localStorage.setItem(K.ingresosUSD,    JSON.stringify(listaIngresosUSD));
        localStorage.setItem(K.ingresosPresup, JSON.stringify(listaIngresosPresup));
        localStorage.setItem(K.pagosTarjeta,   JSON.stringify(listaPagosTarjeta));
        localStorage.setItem(K.pagosTarjetaUSD,JSON.stringify(listaPagosTarjetaUSD));
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
function cfFechaLocal(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function fmtN(n)   { return Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtUSD(n) { return 'USD ' + (Math.round(n*100)/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function clon(x)   { return JSON.parse(JSON.stringify(x)); }
const PALETA_RUBROS = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
function colorRubro(r) { const i = listaRubros.indexOf(r); return i>=0 ? PALETA_RUBROS[i % PALETA_RUBROS.length] : '#94a3b8'; }
function colorRubroUSD(r) { const i = listaRubrosUSD.indexOf(r); return i>=0 ? PALETA_RUBROS[i % PALETA_RUBROS.length] : '#94a3b8'; }

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
        const gmailProcessed = cfGmailGetProcessed();
        const data = JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaTransferenciasUSD,listaComprasUSD,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos,listaIngresosUSD,listaIngresosPresup,listaPagosTarjeta,listaPagosTarjetaUSD,groqKey,gmailProcessed});

        const folderId = await new Promise(res => driveEnsureFolder(gToken, res));

        // Si no tenemos el ID del archivo, buscarlo en la carpeta visible
        if(!_driveFileId) {
            const q = encodeURIComponent(`name='backup_autosync.json' and '${folderId}' in parents and trashed=false`);
            const listR = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
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
            // Crear archivo nuevo con nombre fijo, dentro de la carpeta visible
            const meta = JSON.stringify({name:'backup_autosync.json',parents:[folderId]});
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

    // 1) Snapshot local — siempre
    let snapOk = false;
    try { cfHacerSnapshot(true); snapOk = true; } catch(e) { console.warn('Snapshot:', e); }

    // 2) Backup en carpeta local — solo si está vinculada
    let carpetaEstado = null; // null = no vinculada
    if (window._cfFolderHandle) {
        try {
            const permOk = await cfVerificarPermiso(window._cfFolderHandle);
            if (permOk) { await cfBackupEnCarpeta(window._cfFolderHandle); carpetaEstado = true; }
            else carpetaEstado = false;
        } catch(e) { carpetaEstado = false; }
    }

    // 3) Drive
    if(!gToken) {
        const ok = await new Promise(resolve => {
            driveGetToken(t => { if(t) resolve(true); else resolve(false); });
            setTimeout(()=>resolve(false), 8000);
        });
        if(!ok) gToken = null;
    }
    let driveLinea;
    if(gToken) {
        if(_syncPendiente) {
            clearTimeout(_syncTimer);
            _syncActivo = false;
            await syncSilencioso();
            driveLinea = _syncPendiente ? '⚠️ Drive: no se pudo sincronizar' : '✅ Drive: sincronizado';
        } else {
            driveLinea = '✅ Drive: al día';
        }
    } else {
        driveLinea = '⚠️ Drive: sin autenticar, no se sincronizó';
    }

    const lineas = [
        '📦 Backup al salir',
        '',
        (snapOk ? '✅' : '❌') + ' Snapshot local: ' + (snapOk ? 'guardado' : 'error'),
        (carpetaEstado === null ? '➖ Carpeta local: no vinculada' : (carpetaEstado ? '✅ Carpeta local: guardado' : '❌ Carpeta local: error')),
        driveLinea
    ];
    alert(lineas.join('\n'));
    window.close();
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

// Solo consulta el permiso (queryPermission) sin pedirlo — no requiere gesto del usuario,
// así que es seguro llamarla en automático al abrir la app.
async function cfPermisoOtorgado(handle) {
    try { return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted'; }
    catch(e) { return false; }
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
        const fecha  = cfFechaLocal();
        const nombre = 'cf_backup_' + fecha + '.json';
        const data   = {listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,
                        listaTransferencias,listaTransferenciasUSD,listaComprasUSD,listaCuotas,historicoMeses,listaCuentasUSD,
                        listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,
                        listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,
                        listaRubrosUSD,listaIngresos,listaIngresosUSD,listaIngresosPresup,listaPagosTarjeta,listaPagosTarjetaUSD};
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
        window._cfFolderHandlePendiente = handle; // por si hace falta reautorizar
        const ok = await cfPermisoOtorgado(handle);
        if (!ok) { cfMostrarBannerReauthCarpeta(handle); return; }
        window._cfFolderHandle = handle;
        cfActualizarEstadoCarpeta(handle.name);
    } catch(e) { console.warn('cfRestaurarCarpeta:', e); }
}

// Banner discreto: el permiso de la carpeta venció y necesita un click real del usuario
// (la API no permite renovarlo en automático — requiere gesto del usuario).
function cfMostrarBannerReauthCarpeta(handle) {
    if (document.getElementById('cf-reauth-carpeta')) return;
    const b = document.createElement('div');
    b.id = 'cf-reauth-carpeta';
    b.style.cssText = 'position:fixed;bottom:16px;left:16px;background:#1e293b;color:#f1f5f9;padding:10px 14px;border-radius:8px;z-index:9998;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);font-size:12.5px;max-width:320px;';
    b.innerHTML = '🔒 La carpeta local (' + handle.name + ') necesita que confirmes el acceso de nuevo.'
        + '<button id="cf-reauth-btn" style="background:#0f766e;color:white;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">Reautorizar</button>'
        + '<span id="cf-reauth-x" style="cursor:pointer;color:#94a3b8;padding:0 2px;">✕</span>';
    document.body.appendChild(b);
    document.getElementById('cf-reauth-x').onclick = () => b.remove();
    document.getElementById('cf-reauth-btn').onclick = async () => {
        try {
            const granted = await handle.requestPermission({ mode: 'readwrite' }) === 'granted';
            if (granted) {
                window._cfFolderHandle = handle;
                cfActualizarEstadoCarpeta(handle.name);
                b.remove();
            } else {
                alert('No se otorgó el permiso. Podés vincular la carpeta de nuevo con el botón 📂 Carpeta.');
            }
        } catch(e) { alert('Error al reautorizar: ' + e.message); }
    };
}

function cfToggleMesesMenu() {
    const existente = document.getElementById('meses-menu');
    if (existente) { existente.remove(); return; }
    const btn = document.getElementById('btn-meses-cerrados');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const m = document.createElement('div'); m.id='meses-menu';
    m.style.cssText='position:fixed;top:'+(rect.bottom+4)+'px;left:'+Math.max(4,rect.right-260)+'px;background:white;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:3000;overflow:hidden;min-width:260px;max-height:360px;overflow-y:auto;';
    const lista = [...historicoMeses].reverse();
    if (!lista.length) {
        const vacio = document.createElement('div');
        vacio.innerText = 'Todavía no hay meses cerrados';
        vacio.style.cssText = 'padding:14px;font-size:12px;color:#94a3b8;text-align:center;';
        m.appendChild(vacio);
    } else {
        lista.forEach((mes, i) => {
            const o = document.createElement('div');
            o.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:9px 12px;font-size:13px;cursor:pointer;color:#1e293b;' + (i>0 ? 'border-top:1px solid #f1f5f9;' : '') + (tabActivo===mes.id ? 'background:#f0fdfa;font-weight:700;' : '');
            o.onmouseover = () => { if (tabActivo!==mes.id) o.style.background = '#f8fafc'; };
            o.onmouseout  = () => { if (tabActivo!==mes.id) o.style.background = ''; };
            const nombreSpan = document.createElement('span');
            nombreSpan.innerText = '🗂 ' + mes.nombre;
            nombreSpan.onclick = () => { m.remove(); tabActivo = mes.id; renderTabs(); renderContenido(); window.scrollTo(0, 0); };
            nombreSpan.style.flex = '1';
            const xSpan = document.createElement('span');
            xSpan.innerText = '✕'; xSpan.style.cssText = 'color:#94a3b8;font-size:11px;padding-left:10px;';
            xSpan.onclick = () => {
                if (confirm('¿Eliminar "' + mes.nombre + '"?')) {
                    historicoMeses = historicoMeses.filter(x=>x.id!==mes.id);
                    if (tabActivo===mes.id) tabActivo = null;
                    guardar(); m.remove(); renderTabs(); renderContenido();
                }
            };
            o.appendChild(nombreSpan); o.appendChild(xSpan);
            m.appendChild(o);
        });
    }
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function cerrar(){ document.getElementById('meses-menu')?.remove(); document.removeEventListener('click', cerrar); }, {once:true}), 0);
}

function cfToggleMenuMas() {
    const existente = document.getElementById('mas-menu');
    if (existente) { existente.remove(); return; }
    const btn = document.getElementById('btn-mas');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const m = document.createElement('div'); m.id='mas-menu';
    m.style.cssText='position:fixed;top:'+(rect.bottom+4)+'px;right:'+Math.max(4, window.innerWidth-rect.right)+'px;background:white;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:3000;overflow:hidden;min-width:230px;';

    const mkLabel = (texto) => {
        const l = document.createElement('div');
        l.innerText = texto;
        l.style.cssText = 'padding:8px 14px 4px;font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;';
        return l;
    };
    const mkOpt = (label, fn, borde) => {
        const o = document.createElement('div');
        o.innerText = label;
        o.style.cssText = 'padding:10px 14px;font-size:12px;cursor:pointer;color:#1e293b;' + (borde ? 'border-top:1px solid #e2e8f0;' : '');
        o.onmouseover = () => o.style.background = '#f1f5f9';
        o.onmouseout  = () => o.style.background = '';
        o.onclick = () => { m.remove(); fn(); };
        return o;
    };

    // Estado de Drive calculado al vuelo (mismo criterio que syncSetBadge)
    let estadoDrive = '⏳ Drive: sin sincronizar';
    if (!gTokenCargarLocal() && !gToken) estadoDrive = '☁️ Drive: sin conectar';
    else if (_syncActivo) estadoDrive = '☁️ Drive: sincronizando...';
    else if (!_syncPendiente) estadoDrive = '✅ Drive: sincronizado';
    const estadoEl = document.createElement('div');
    estadoEl.innerText = estadoDrive;
    estadoEl.style.cssText = 'padding:8px 14px;font-size:11px;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;';

    m.appendChild(mkLabel('Backup y datos'));
    m.appendChild(estadoEl);
    m.appendChild(mkOpt('☁️ Subir backup a Drive', driveSubir, false));
    m.appendChild(mkOpt('📂 Restaurar backup de Drive', driveRestaurar, false));
    if (!cfEsMovil()) m.appendChild(mkOpt('📧 Gmail: login + chequear', cfGmailLoginYChequear, false));
    m.appendChild(mkOpt('🔍 Revisar pendientes', cfRevisarPendientes, false));
    m.appendChild(mkOpt('💾 Snapshots locales', cfMostrarSnapshots, false));
    m.appendChild(mkOpt('🗑️ Limpiar caché y recargar', limpiarCache, false));

    m.appendChild(mkLabel('Otros'));
    m.appendChild(mkOpt('❓ Ayuda', () => window.open('./instructivo.html','_blank','width=1100,height=750,resizable=yes,scrollbars=yes'), false));
    m.appendChild(mkOpt('🤖 Consultar con IA', toggleAIPanel, false));

    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function cerrar(){ document.getElementById('mas-menu')?.remove(); document.removeEventListener('click', cerrar); }, {once:true}), 0);
}

function cfToggleMenuMasMes() {
    const existente = document.getElementById('mas-mes-menu');
    if (existente) { existente.remove(); return; }
    const btn = document.getElementById('btn-mas-mes');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const anchoMenu = 220;
    const left = Math.max(4, Math.min(rect.left, window.innerWidth - anchoMenu - 8));
    const m = document.createElement('div'); m.id='mas-mes-menu';
    m.style.cssText='position:fixed;top:'+(rect.bottom+4)+'px;left:'+left+'px;background:white;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:3000;overflow:hidden;min-width:'+anchoMenu+'px;';
    const mkOpt = (label, fn, borde) => {
        const o = document.createElement('div');
        o.innerText = label;
        o.style.cssText = 'padding:10px 14px;font-size:12px;cursor:pointer;color:#1e293b;' + (borde ? 'border-top:1px solid #e2e8f0;' : '');
        o.onmouseover = () => o.style.background = '#f1f5f9';
        o.onmouseout  = () => o.style.background = '';
        o.onclick = () => { m.remove(); fn(); };
        return o;
    };
    m.appendChild(mkOpt('📊 Informe Semanal', mostrarInformeSemanal, false));
    m.appendChild(mkOpt('💾 Exportar', exportar, false));
    m.appendChild(mkOpt('📥 Importar', () => document.getElementById('input-backup')?.click(), false));
    m.appendChild(mkOpt('🖨️ PDF', () => window.print(), false));
    m.appendChild(mkOpt('📂 Carpeta local', cfSeleccionarCarpeta, true));
    document.body.appendChild(m);
    setTimeout(() => document.addEventListener('click', function cerrar(){ document.getElementById('mas-mes-menu')?.remove(); document.removeEventListener('click', cerrar); }, {once:true}), 0);
}




document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Control Financiero ' + APP_VERSION;
    // Pedir almacenamiento persistente: evita que el navegador evicte IndexedDB
    // (y con eso el handle de la carpeta local) por presión de espacio o inactividad.
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(()=>{});
    }
    // Reconecta/renueva el token de Drive en silencio al abrir (sin popup), para que
    // al tocar Salir el backup a Drive sea instantáneo y no se pierda el permiso
    // del navegador para cerrar la ventana con window.close().
    driveGetToken(() => {});
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
    setTimeout(() => { chequearCierreAutomatico(); }, 1000);
    // Módulo Gmail: chequear mails de Santander automáticamente en PC
    setTimeout(() => { cfGmailChequear(); }, 800);
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
        t.onclick = () => { onclick(); window.scrollTo(0, 0); };
        bar.appendChild(t);
    };
    mkTab('<span>📊 Mes Actual</span>',  tabActivo===null,       ()=>{ tabActivo=null;       renderTabs(); renderContenido(); });
    mkTab('<span>🏦 Movimientos</span>', tabActivo==='movimientos', ()=>{ tabActivo='movimientos'; renderTabs(); renderContenido(); }, 'background:#f0f9ff;color:#0284c7;border-color:#7dd3fc;');
    mkTab('<span>🎯 Presupuesto</span>', tabActivo==='presupuesto', ()=>{ tabActivo='presupuesto'; renderTabs(); renderContenido(); }, 'background:#f5f3ff;color:#6d28d9;border-color:#c4b5fd;');
    mkTab('<span>💵 Dólares</span>',     tabActivo==='dolares',  ()=>{ tabActivo='dolares';  renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#15803d;border-color:#86efac;');
    mkTab('<span>📈 Reportes</span>',    tabActivo==='reportes',    ()=>{ tabActivo='reportes';    renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#166534;border-color:#86efac;');
    mkTab('<span>📊 Inversiones</span>', tabActivo==='inversiones', ()=>{ tabActivo='inversiones'; renderTabs(); renderContenido(); }, 'background:#fef9c3;color:#854d0e;border-color:#fde047;');
    mkTab('<span>📅 Anual</span>',      tabActivo==='anual',       ()=>{ tabActivo='anual';       renderTabs(); renderContenido(); }, 'background:#eff6ff;color:#1d4ed8;border-color:#93c5fd;');
    // Badge sync + botón Salir — siempre visible en la tab bar
    const spacer = document.createElement('div'); spacer.style.cssText='flex:1;';
    bar.appendChild(spacer);
    // Elemento oculto: mantiene compatibilidad con syncSetBadge() (usado por el resto del código)
    // sin mostrar un botón propio — el estado de Drive se muestra dentro del dropdown "Más".
    const syncBadgeOculto = document.createElement('span'); syncBadgeOculto.id='sync-badge';
    syncBadgeOculto.style.cssText='display:none;';
    bar.appendChild(syncBadgeOculto);

    const masEl = document.createElement('button'); masEl.id='btn-mas';
    masEl.style.cssText='background:#475569;color:white;border:none;border-radius:4px;padding:5px 12px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:4px;align-self:center;white-space:nowrap;';
    masEl.innerText='⋯ Más';
    masEl.onclick=(e)=>{ e.stopPropagation(); cfToggleMenuMas(); };
    bar.appendChild(masEl);

    const salirEl = document.createElement('button'); salirEl.id='btn-salir';
    salirEl.style.cssText='background:#334155;color:white;border:none;border-radius:4px;padding:5px 12px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:6px;align-self:center;white-space:nowrap;';
    salirEl.innerText='🚪 Salir'; salirEl.onclick=syncAlSalir;
    bar.appendChild(salirEl);

    const mesesEl = document.createElement('button'); mesesEl.id='btn-meses-cerrados';
    mesesEl.style.cssText='background:#0f766e;color:white;border:none;border-radius:4px;padding:5px 10px;font-size:12px;font-weight:bold;cursor:pointer;margin-left:6px;align-self:center;white-space:nowrap;display:flex;align-items:center;gap:4px;';
    mesesEl.innerHTML = '📅 Meses cerrados' + (historicoMeses.length ? ' <span style="background:rgba(255,255,255,0.25);border-radius:10px;padding:0 6px;font-size:10px;">' + historicoMeses.length + '</span>' : '');
    mesesEl.onclick = (e) => { e.stopPropagation(); cfToggleMesesMenu(); };
    bar.appendChild(mesesEl);
    if (tabActivo && historicoMeses.some(m => m.id === tabActivo)) {
        const mesActivo = historicoMeses.find(m => m.id === tabActivo);
        const badgeMes = document.createElement('div');
        badgeMes.className = 'tab activo';
        badgeMes.innerHTML = '<span>🗂 ' + mesActivo.nombre + '</span><span class="tab-x">✕</span>';
        badgeMes.onclick = (e) => {
            if (e.target.classList.contains('tab-x')) { tabActivo = null; renderTabs(); renderContenido(); window.scrollTo(0, 0); return; }
            cfToggleMesesMenu();
        };
        bar.appendChild(badgeMes);
    }
}

function renderContenido() {
    const app = document.getElementById('app-content');
    app.innerHTML = '';
    if      (tabActivo===null)       { app.appendChild(buildMesActual()); bindMesActual(); render(); iniciarTimerYPF(); }
    else if (tabActivo==='dolares')  { app.appendChild(buildDolares());   bindDolares();   renderDolares(); actualizarTCDolares(); }
    else if (tabActivo==='movimientos') { app.appendChild(buildMovimientos()); }
    else if (tabActivo==='presupuesto')  { app.appendChild(buildPresupuesto()); }
    else if (tabActivo==='reportes')    { app.appendChild(buildReportes()); }
    else if (tabActivo==='inversiones') { app.appendChild(buildInversiones()); bindInversiones(); actualizarInversiones(); iniciarTimerYPF(listaAcciones.some(function(a){ return a.ticker && a.ticker.toUpperCase().includes('YPF'); })); }
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
function inpNumPagado(val, onChange) {
    const inp=el('input'); inp.type='text'; inp.className='inp tr'; inp.placeholder='0';
    let last=Math.round(val);
    inp.value = last===0 ? '' : fmtN(last);
    inp.addEventListener('focus', ()=>{ inp.value = last===0 ? '' : last; });
    inp.addEventListener('change', e=>{
        const v=Math.round(parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.'))||0);
        last=v; onChange(v); inp.value = v===0 ? '' : fmtN(v);
    });
    inp.addEventListener('blur', e=>{
        const v=Math.round(parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.'))||0);
        if(v!==last){ last=v; onChange(v); }
        inp.value = last===0 ? '' : fmtN(last);
    });
    inp._setVal=v=>{ last=Math.round(v); if(document.activeElement!==inp) inp.value = last===0 ? '' : fmtN(last); };
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
          <button class="btn btn-mes"   id="btn-nuevo-mes">🔄 Abrir Nuevo Mes</button>
          <button class="btn" id="btn-chequear-mails" onclick="cfRevisarPendientes()" style="background:#0f766e;color:white;font-size:12px;padding:7px 12px;">📧 Chequear mails</button>
          <button class="btn" id="btn-mas-mes" style="background:#475569;color:white;font-size:12px;padding:7px 12px;">⋯ Más</button>
          <input type="file" id="input-backup" accept=".json" style="display:none;">
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
            <h3 class="panel-title" style="display:flex;align-items:center;">🏦 Cuentas Bancarias / Efectivo ${btnAyuda('bancos')}</h3>
            <button type="button" onclick="abrirModalIngreso()" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#0d9488;border:none;color:#fff;border-radius:6px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:12px;">💰 Ingresar fondos</button>
            <div class="form-block">
              <form id="form-banco">
                <div class="form-group"><label>Nombre</label><input type="text" id="banco-nombre" required placeholder="Ej. Galicia, MercadoPago"></div>
                <div class="form-group"><label>Saldo ($)</label><input type="number" id="banco-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-blue">Añadir Cuenta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:40%">Cuenta</th><th style="width:30%" class="tr">Saldo ($)</th><th style="width:20%" class="tc">Auto⬇</th><th style="width:10%" class="no-print"></th></tr></thead><tbody id="t-bancos"></tbody></table>
            <div id="panel-historial-ingresos" style="margin-top:16px;display:none;">
              <h4 style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">📋 Historial de Ingresos</h4>
              <table style="font-size:12px;width:100%;border-collapse:collapse;">
                <thead><tr style="background:#f0fdf4;"><th style="padding:6px 8px;text-align:left;color:#166534;">Fecha</th><th style="padding:6px 8px;text-align:left;color:#166534;">Cuenta</th><th style="padding:6px 8px;text-align:left;color:#166534;">Descripción</th><th style="padding:6px 8px;text-align:right;color:#166534;">Monto</th><th style="padding:6px 8px;" class="no-print"></th></tr></thead>
                <tbody id="t-ingresos"></tbody>
              </table>
            </div>
          </div>
          <!-- Modal Editar Saldo -->
          <div id="modal-editar-saldo" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:white;border-radius:12px;padding:24px;width:340px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.3);">
              <h3 style="margin:0 0 16px;color:#0f172a;font-size:16px;">✏️ Editar saldo</h3>
              <div style="margin-bottom:4px;font-size:13px;color:#64748b;">Cuenta</div>
              <div id="eds-nombre" style="margin-bottom:12px;font-weight:bold;font-size:14px;"></div>
              <div style="margin-bottom:20px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Nuevo saldo ($)</label><input type="number" id="eds-saldo" step="1" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button onclick="cerrarModalEditarSaldo()" style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:6px;background:white;cursor:pointer;font-size:14px;">Cancelar</button>
                <button onclick="confirmarEditarSaldo()" style="padding:8px 20px;border:none;border-radius:6px;background:#0d9488;color:white;cursor:pointer;font-size:14px;font-weight:bold;">✓ Guardar</button>
              </div>
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
            <h3 class="panel-title" style="display:flex;align-items:center;">💳 Tarjetas de Crédito ${btnAyuda('tarjetas')}</h3>
            <div class="form-block">
              <form id="form-tarjeta">
                <div class="form-group"><label>Nombre</label><input type="text" id="tarjeta-nombre" required placeholder="Ej. Visa Galicia"></div>
                <div class="form-group"><label>Saldo base ($)</label><input type="number" id="tarjeta-saldo" required value="0" step="1"></div>
                <div class="form-group"><label>Vencimiento actual ($)</label><input type="number" id="tarjeta-vencimiento" value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-purple">Registrar Tarjeta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:32%">Tarjeta</th><th style="width:24%" class="tr">Saldo total ($)</th><th style="width:24%" class="tr">Vencimiento ($)</th><th style="width:12%" class="no-print"></th><th style="width:8%" class="no-print"></th></tr></thead><tbody id="t-tarjetas"></tbody></table>
            <div id="wrap-pagos-tarjeta"></div>
          </div>
          <div class="panel panel-transf no-print">
            <h3 class="panel-title" style="display:flex;align-items:center;">↔️ Transferencias entre Cuentas ${btnAyuda('transferencias')}</h3>
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
            <h3 class="panel-title" style="display:flex;align-items:center;">💳 Compras en Cuotas ${btnAyuda('cuotas')}</h3>
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
            <h3 class="panel-title" style="display:flex;align-items:center;">⚙️ Rubros de Gasto Corriente ${btnAyuda('rubros')}</h3>
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
            <h3 class="panel-title" style="display:flex;align-items:center;">📋 Servicios y Vencimientos Fijos ${btnAyuda('servicios')}</h3>
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
            <h3 class="panel-title" style="display:flex;align-items:center;">🛍️ Gastos Corrientes / Caja Diaria ${btnAyuda('corrientes')}</h3>
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
    g('btn-nuevo-mes')?.addEventListener('click', () => nuevoMes());
    g('btn-mas-mes')?.addEventListener('click', (e)=>{ e.stopPropagation(); cfToggleMenuMasMes(); });
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
    [...listaRubros].sort((a,b)=>a.localeCompare(b,'es')).forEach(r=>{
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
        const tdSB = el('td','tr'); tdSB.innerHTML = `<span style="font-weight:bold;">${fmt(b.saldo)}</span> <button type="button" onclick="abrirModalEditarSaldo('${b.id}')" title="Editar saldo" style="border:none;background:none;cursor:pointer;color:#64748b;font-size:13px;vertical-align:-1px;">✏️</button>`;
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
                tr.innerHTML = `<td style="padding:5px 8px;color:#475569;">${ing.fecha||'—'}</td><td style="padding:5px 8px;font-weight:bold;color:#166534;">${ing.bancoNombre||'—'}</td><td style="padding:5px 8px;color:#fff;background:#0f172a;">${ing.descripcion||'—'}</td><td style="padding:5px 8px;text-align:right;font-weight:bold;color:#16a34a;">${fmt(ing.monto)}</td><td style="padding:5px 8px;" class="no-print"><button onclick="elimIngreso('${ing.id}')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button></td>`;
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
        const inpV=inpNum(t.vencimiento||0,v=>{ t.vencimiento=v; guardar(); }); inpV.id='venc-t-'+t.id;
        const tdV=el('td','tr'); tdV.appendChild(inpV);
        const tdPagar=el('td','tc no-print'); const bPagar=el('button','btn-secondary btn-sm'); bPagar.innerText='💳 Pagar'; bPagar.style.cssText='font-size:11px;padding:4px 8px;'; bPagar.onclick=()=>abrirModalPagoTarjeta(t.id); tdPagar.appendChild(bPagar);
        tT.appendChild(fila([tdHTML(`<b>${t.nombre}</b>`),tdS,tdV,tdPagar,tdBtn('✕',()=>elimTarjeta(t.id))]));
    });
    if(!listaTarjetas.length) tT.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin tarjetas.</td></tr>';
    const wPT = document.getElementById('wrap-pagos-tarjeta');
    if (wPT) {
        const ultimosPagos = [...listaPagosTarjeta].reverse().slice(0, 5);
        if (!ultimosPagos.length) { wPT.innerHTML = ''; }
        else {
            wPT.innerHTML = '<div style="font-size:11px;font-weight:bold;color:#94a3b8;text-transform:uppercase;margin:10px 0 4px;">Últimos pagos de tarjeta</div>'
                + ultimosPagos.map(p => {
                    const [y,m,d] = (p.fecha||'').split('-');
                    const fechaCorta = (d&&m) ? d+'/'+m : (p.fecha||'');
                    const tit = 'Pagado desde ' + p.bancoNombre + ' el ' + p.fecha;
                    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:12px;padding:5px 8px;border-bottom:1px solid #f1f5f9;">
                    <span title="${tit}" style="color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">✅ ${fechaCorta} ${p.tarjetaNombre}</span>
                    <span style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><b style="color:#a855f7;">-${fmt(p.monto)}</b><button onclick="elimPagoTarjeta('${p.id}')" style="border:none;background:none;color:#cbd5e1;cursor:pointer;font-size:13px;">✕</button></span>
                </div>`;
                }).join('');
        }
    }
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
        const inpPag=inpNumPagado(s.pagado, v=>{
            const diff=v-s.pagado;
            if(diff!==0){
                const bk=listaBancos.find(b=>b.id===s.medioPagoId);
                const tk=listaTarjetas.find(t=>t.id===s.medioPagoId);
                if(bk) bk.saldo-=diff;
                else if(tk) tk.saldo+=diff;
            }
            s.pagado=v; guardar(); calcDash(); render();
            if(s.presupuesto>0 && v>s.presupuesto) alert('⚠️ Pagado ('+fmt(v)+') supera el presupuesto ('+fmt(s.presupuesto)+') en '+fmt(v-s.presupuesto)+'.');
        });
        tdPag.appendChild(inpPag);
        const tr=el('tr');
        const tdNom=el('td'); tdNom.style.maxWidth='0'; tdNom.style.overflow='hidden'; tdNom.style.textOverflow='ellipsis'; tdNom.style.whiteSpace='nowrap';
        const nomSpan2=el('input'); nomSpan2.type='text'; nomSpan2.value=s.nombre; nomSpan2.style.cssText='font-weight:bold;border:none;background:transparent;width:100%;padding:2px 0;color:inherit;font-size:inherit;';
        nomSpan2.onchange=e=>{ const v=e.target.value.trim(); if(v){ s.nombre=v; guardar(); } else { e.target.value=s.nombre; } };
        nomSpan2.onfocus=e=>{ e.target.style.background='#0f172a'; e.target.style.borderBottom='1px solid #4f46e5'; };
        nomSpan2.onblur=e=>{ e.target.style.background='transparent'; e.target.style.borderBottom='none'; };
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
                c.monto=v; guardar(); calcDash(); render();
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
    const v = parseFloat(inp.value.replace(/\./g,''))||0;
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
    document.getElementById('ing-fecha').value = cfFechaLocal();
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
    const fecha = document.getElementById('ing-fecha').value||cfFechaLocal();
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

// ── Ingresar Fondos USD ──────────────────────────────────────
function abrirModalIngresoUSD() {
    const sel = document.getElementById('ingusd-cuenta');
    if(!sel) return;
    sel.innerHTML = '';
    listaCuentasUSD.forEach(c => { const o=document.createElement('option'); o.value=c.id; o.textContent='🏦 '+c.nombre; sel.appendChild(o); });
    document.getElementById('ingusd-monto').value = '';
    document.getElementById('ingusd-desc').value = '';
    document.getElementById('ingusd-fecha').value = cfFechaLocal();
    const m = document.getElementById('modal-ingreso-usd');
    m.style.display = 'flex';
}
function cerrarModalIngresoUSD() {
    document.getElementById('modal-ingreso-usd').style.display = 'none';
}
function confirmarIngresoUSD() {
    const cuentaId = document.getElementById('ingusd-cuenta').value;
    const monto = parseFloat(document.getElementById('ingusd-monto').value)||0;
    const desc = document.getElementById('ingusd-desc').value.trim()||'Sin descripción';
    const fecha = document.getElementById('ingusd-fecha').value||cfFechaLocal();
    if(!cuentaId){ alert('Seleccioná una cuenta.'); return; }
    if(monto<=0){ alert('Ingresá un monto mayor a cero.'); return; }
    const cuenta = listaCuentasUSD.find(c=>c.id===cuentaId);
    if(!cuenta){ alert('Cuenta no encontrada.'); return; }
    cuenta.saldo = Math.round((cuenta.saldo + monto)*100)/100;
    listaIngresosUSD.push({id:'ingusd_'+Date.now(), cuentaId, cuentaNombre:cuenta.nombre, monto, descripcion:desc, fecha});
    guardar();
    cerrarModalIngresoUSD();
    calcDashUSD();
    renderDolares();
}
function elimIngresoUSD(id) {
    const ing = listaIngresosUSD.find(i=>i.id===id);
    if(!ing) return;
    if(!confirm('¿Eliminar este ingreso? Se restará el monto del saldo de la cuenta.')) return;
    const cuenta = listaCuentasUSD.find(c=>c.id===ing.cuentaId);
    if(cuenta) cuenta.saldo = Math.round((cuenta.saldo - ing.monto)*100)/100;
    listaIngresosUSD = listaIngresosUSD.filter(i=>i.id!==id);
    guardar();
    calcDashUSD();
    renderDolares();
}

let edsBancoId = null;
function abrirModalEditarSaldo(bancoId) {
    const banco = listaBancos.find(b=>b.id===bancoId);
    if(!banco) return;
    edsBancoId = bancoId;
    document.getElementById('eds-nombre').innerText = banco.nombre;
    document.getElementById('eds-saldo').value = banco.saldo;
    document.getElementById('modal-editar-saldo').style.display = 'flex';
}
function cerrarModalEditarSaldo() {
    document.getElementById('modal-editar-saldo').style.display = 'none';
    edsBancoId = null;
}
function confirmarEditarSaldo() {
    const banco = listaBancos.find(b=>b.id===edsBancoId);
    if(!banco){ alert('Cuenta no encontrada.'); return; }
    const nuevo = parseFloat(document.getElementById('eds-saldo').value);
    if(isNaN(nuevo)){ alert('Ingresá un saldo válido.'); return; }
    banco.saldo = Math.round(nuevo);
    guardar();
    cerrarModalEditarSaldo();
    calcDash();
    render();
}

// ── Ingresos informativos de Presupuesto (no tocan cuentas bancarias) ──
function calcTotalPresupuestoPesos() {
    return Object.values(listaPresupRubros).reduce((a,b)=>a+b,0);
}
function abrirModalIngresoPresup() {
    document.getElementById('ip-concepto').value = '';
    document.getElementById('ip-monto').value = '';
    document.getElementById('ip-fecha').value = cfFechaLocal();
    document.getElementById('ip-tipo').value = 'Fijo';
    document.getElementById('modal-ingreso-presup').style.display = 'flex';
}
function cerrarModalIngresoPresup() {
    document.getElementById('modal-ingreso-presup').style.display = 'none';
}
function confirmarIngresoPresup() {
    const mesActual = cfFechaLocal().slice(0,7);
    const delMes = listaIngresosPresup.filter(i=>(i.fecha||'').slice(0,7)===mesActual);
    if(delMes.length>=4){ alert('Ya cargaste el máximo de 4 ingresos para este mes.'); return; }
    const concepto = (document.getElementById('ip-concepto').value||'').trim();
    const monto = parseFloat(document.getElementById('ip-monto').value)||0;
    const fecha = document.getElementById('ip-fecha').value||cfFechaLocal();
    const tipo = document.getElementById('ip-tipo').value||'Fijo';
    if(!concepto){ alert('Ingresá un concepto.'); return; }
    if(monto<=0){ alert('Ingresá un monto mayor a cero.'); return; }
    listaIngresosPresup.push({id:'ip_'+Date.now(), concepto, monto, fecha, tipo});
    guardar();
    document.getElementById('ip-concepto').value = '';
    document.getElementById('ip-monto').value = '';
    document.getElementById('ip-fecha').value = cfFechaLocal();
    document.getElementById('ip-tipo').value = 'Fijo';
    refrescarIngresosPresupUI();
}
function elimIngresoPresup(id) {
    if(!confirm('¿Eliminar este ingreso?')) return;
    listaIngresosPresup = listaIngresosPresup.filter(i=>i.id!==id);
    guardar();
    refrescarIngresosPresupUI();
}
function refrescarIngresosPresupUI() {
    const mesActual = cfFechaLocal().slice(0,7);
    const items = listaIngresosPresup.filter(i=>(i.fecha||'').slice(0,7)===mesActual).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
    const total = items.reduce((a,i)=>a+i.monto,0);
    const totalPresup = calcTotalPresupuestoPesos();
    const balance = total - totalPresup;
    const esSuperavit = balance>=0;
    const color = esSuperavit ? '#16a34a' : '#ef4444';
    const bg = esSuperavit ? '#f0fdf4' : '#fef2f2';
    const border = esSuperavit ? '#bbf7d0' : '#fecaca';
    const lleno = items.length>=4;

    const card = document.getElementById('ip-card');
    if(card){ card.style.background = bg; card.style.borderColor = border; }
    const cardTotal = document.getElementById('ip-card-total'); if(cardTotal) cardTotal.textContent = fmt(total);
    const cardCount = document.getElementById('ip-card-count'); if(cardCount) cardCount.textContent = items.length+' de 4 registros · tocá para ver detalle';
    const cardBadge = document.getElementById('ip-card-badge'); if(cardBadge){ cardBadge.textContent = esSuperavit?'SUPERÁVIT':'DÉFICIT'; cardBadge.style.background = color+'22'; cardBadge.style.color = color; }
    const cardBal = document.getElementById('ip-card-balance'); if(cardBal){ cardBal.textContent = (esSuperavit?'+ ':'− ')+fmt(Math.abs(balance)); cardBal.style.color = color; }

    const modalTotal = document.getElementById('ip-modal-total'); if(modalTotal) modalTotal.textContent = fmt(total);
    const modalBadge = document.getElementById('ip-modal-badge'); if(modalBadge){ modalBadge.textContent = esSuperavit?'SUPERÁVIT':'DÉFICIT'; modalBadge.style.background = color+'22'; modalBadge.style.color = color; }
    const modalBalance = document.getElementById('ip-modal-balance'); if(modalBalance){ modalBalance.textContent = (esSuperavit?'+ ':'− ')+fmt(Math.abs(balance)); modalBalance.style.color = color; }

    const lista = document.getElementById('ip-lista');
    if(lista){
        if(items.length){
            lista.innerHTML = items.map(i=>{
                const fechaCorta = i.fecha ? i.fecha.slice(8,10)+'/'+i.fecha.slice(5,7) : '—';
                const tipoColor = i.tipo==='Variable' ? '#a855f7' : '#0284c7';
                return '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #f1f5f9;border-radius:8px;padding:8px 12px;">'
                    +'<div><b style="font-size:13px;color:#1e293b;">'+i.concepto+'</b>'
                    +'<div style="font-size:11px;color:#94a3b8;margin-top:2px;">'+fechaCorta+' · <span style="color:'+tipoColor+';font-weight:bold;">'+(i.tipo||'Fijo')+'</span></div></div>'
                    +'<div style="display:flex;align-items:center;gap:10px;"><b style="font-size:14px;color:#0284c7;">'+fmt(i.monto)+'</b>'
                    +'<button onclick="elimIngresoPresup(\''+i.id+'\')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button></div></div>';
            }).join('');
        } else {
            lista.innerHTML = '<div style="text-align:center;padding:12px;color:#94a3b8;font-size:12px;">Sin ingresos cargados este mes.</div>';
        }
    }
    const addBtn = document.getElementById('ip-add-btn');
    if(addBtn){ addBtn.disabled = lleno; addBtn.style.cursor = lleno?'not-allowed':'pointer'; addBtn.style.opacity = lleno?'0.5':'1'; }
}
function altaTarjeta(e) { e.preventDefault(); listaTarjetas.push({id:'t_'+Date.now(),nombre:vGet('tarjeta-nombre'),saldo:nGet('tarjeta-saldo'),vencimiento:nGet('tarjeta-vencimiento')}); guardar(); e.target.reset(); render(); }
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
function elimServicio(id){
    const s=listaServicios.find(x=>x.id===id);
    if(s && s.pagado>0){
        const bk=listaBancos.find(b=>b.id===s.medioPagoId);
        const tk=listaTarjetas.find(t=>t.id===s.medioPagoId);
        if(bk) bk.saldo+=s.pagado; else if(tk) tk.saldo-=s.pagado;
    }
    listaServicios=listaServicios.filter(x=>x.id!==id); guardar(); render();
}
function elimCuota(id)   {
    if(!confirm('¿Eliminar esta cuota?')) return;
    listaServicios.filter(s=>s.cuotaId===id && s.pagado>0).forEach(s=>{
        const bk=listaBancos.find(b=>b.id===s.medioPagoId);
        const tk=listaTarjetas.find(t=>t.id===s.medioPagoId);
        if(bk) bk.saldo+=s.pagado; else if(tk) tk.saldo-=s.pagado;
    });
    listaCuotas=listaCuotas.filter(c=>c.id!==id); listaServicios=listaServicios.filter(s=>s.cuotaId!==id); guardar(); render();
}
function elimRubro(r)    { if(listaCorrientes.some(c=>c.rubro===r) || listaServicios.some(s=>s.rubro===r)){alert('Rubro en uso.');return;} listaRubros=listaRubros.filter(x=>x!==r); guardar(); render(); }
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
// ═══════════════════════════════════════════
//  CIERRE AUTOMÁTICO DE MES (al abrir la app tras cruzar el 1° del mes)
// ═══════════════════════════════════════════
function sumarMesYM(ym, n) {
    let [y,m] = ym.split('-').map(Number);
    m += n;
    while (m > 12) { m -= 12; y++; }
    while (m < 1)  { m += 12; y--; }
    return y + '-' + String(m).padStart(2,'0');
}
function nombreDesdeYM(ym) {
    const nombres = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const [y,m] = ym.split('-');
    const n = nombres[parseInt(m,10)-1] + ' de ' + y;
    return n.charAt(0).toUpperCase() + n.slice(1);
}
function chequearCierreAutomatico() {
    if (!historicoMeses.length) return; // sin cierres previos, no hay base para detectar mes atrasado
    let ultimoYM = null;
    historicoMeses.forEach(m => { const ym = mesNombreToYM(m.nombre); if (ym && (!ultimoYM || ym > ultimoYM)) ultimoYM = ym; });
    if (!ultimoYM) return;
    const mesActualYM = cfFechaLocal().slice(0,7);
    const pendientes = [];
    let cursor = sumarMesYM(ultimoYM, 1);
    while (cursor < mesActualYM) { pendientes.push(cursor); cursor = sumarMesYM(cursor, 1); }
    if (pendientes.length) mostrarModalCierreAutomatico(pendientes);
}
function previewMovimientosLive(bancoId, ym) {
    const esDelMes = fecha => (fecha || '').slice(0,7) === ym;
    const mov = [];
    listaIngresos.forEach(i => { if (i.bancoId === bancoId && esDelMes(i.fecha)) mov.push({ monto: i.monto }); });
    if (esCuentaLiq(bancoId)) {
        listaCorrientes.forEach(c => { if (c.medioPagoId === bancoId && c.fechaPago && esDelMes(c.fechaPago)) mov.push({ monto: c.esIngreso ? c.monto : -c.monto }); });
        listaServicios.forEach(s => { if (s.medioPagoId === bancoId && s.pagado > 0 && s.fPago && esDelMes(s.fPago)) mov.push({ monto: -s.pagado }); });
    }
    listaTransferencias.forEach(t => {
        if (t.origenId === bancoId && esDelMes(t.fecha))  mov.push({ monto: -t.monto });
        if (t.destinoId === bancoId && esDelMes(t.fecha)) mov.push({ monto: t.monto });
    });
    listaComprasUSD.forEach(c => {
        if (c.origenId === bancoId && esDelMes(c.fecha)) mov.push({ monto: -c.montoARS });
    });
    return mov;
}
function mostrarModalCierreAutomatico(pendientes) {
    if (document.getElementById('modal-cierre-auto')) return;
    const mesConDatos = pendientes[0]; // el primer mes pendiente es el que tiene los movimientos en vivo
    let filasSaldos = listaBancos.map(b => '<tr><td style="padding:5px 8px;font-size:13px;">' + b.nombre + '</td><td style="padding:5px 8px;text-align:right;font-size:13px;font-weight:bold;">' + fmt(b.saldo) + '</td></tr>').join('');
    let totIngresos = 0, totEgresos = 0;
    listaBancos.forEach(b => { previewMovimientosLive(b.id, mesConDatos).forEach(m => { if (m.monto > 0) totIngresos += m.monto; else totEgresos += m.monto; }); });
    const listaMesesTxt = pendientes.map(nombreDesdeYM).join(', ');
    const div = document.createElement('div');
    div.id = 'modal-cierre-auto';
    div.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;';
    div.innerHTML = '<div style="background:white;border-radius:12px;padding:24px;width:380px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
        '<h3 style="margin:0 0 12px;color:#0f172a;font-size:16px;">🔄 Cierre de mes pendiente</h3>' +
        '<p style="font-size:13px;color:#64748b;margin:0 0 14px;">Pasaste el 1° del mes sin cerrar el período anterior. Se va a archivar: <b>' + listaMesesTxt + '</b>' + (pendientes.length > 1 ? ' (' + (pendientes.length - 1) + ' de esos meses no tienen movimientos registrados).' : '.') + '</p>' +
        '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Saldos que quedarían archivados como cierre de ' + nombreDesdeYM(mesConDatos) + '</div>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">' + filasSaldos + '</table>' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px;"><span>Ingresos del período: <b style="color:#16a34a;">+' + fmt(totIngresos) + '</b></span><span>Egresos: <b style="color:#dc2626;">' + fmt(totEgresos) + '</b></span></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
        '<button id="btn-cierre-auto-cancelar" style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:6px;background:white;cursor:pointer;font-size:14px;">Ahora no</button>' +
        '<button id="btn-cierre-auto-confirmar" style="padding:8px 20px;border:none;border-radius:6px;background:#0284c7;color:white;cursor:pointer;font-size:14px;font-weight:bold;">✓ Cerrar y archivar</button>' +
        '</div></div>';
    document.body.appendChild(div);
    document.getElementById('btn-cierre-auto-cancelar').onclick = () => div.remove();
    document.getElementById('btn-cierre-auto-confirmar').onclick = () => { div.remove(); ejecutarCierreAutomatico(pendientes); };
}
function ejecutarCierreAutomatico(pendientes) {
    pendientes.forEach(ym => { nuevoMes({auto:true, nombre: nombreDesdeYM(ym)}); });
    guardar(); renderTabs(); renderContenido();
    alert('✅ Se archivaron automáticamente ' + pendientes.length + ' mes(es): ' + pendientes.map(nombreDesdeYM).join(', ') + '.');
}
function nuevoMes(opts) {
    opts = opts || {};
    const auto = !!opts.auto;
    const nombre = opts.nombre || nombreMes(), sufijo=historicoMeses.some(m=>m.nombre===nombre)?' ('+Date.now()+')':'';
    if(!auto && !confirm(`🔄 ¿Abrir nuevo período mensual?\n→ Se archivará "${nombre+sufijo}"\n→ Bancos/tarjetas se ajustan\n→ Servicios fijos se conservan sin pagos\n→ Caja diaria y transferencias se vacían`)) return false;
    historicoMeses.push({id:'mes_'+Date.now(),nombre:nombre+sufijo,fechaCierre:new Date().toISOString(),
        datos:{listaBancos:clon(listaBancos),listaTarjetas:clon(listaTarjetas),listaServicios:clon(listaServicios),
               listaCorrientes:clon(listaCorrientes),listaTransferencias:clon(listaTransferencias),
               listaRubros:clon(listaRubros),listaCuotas:clon(listaCuotas),
               listaCuentasUSD:clon(listaCuentasUSD),listaTarjetasUSD:clon(listaTarjetasUSD),
               listaServiciosUSD:clon(listaServiciosUSD),listaCorrientesUSD:clon(listaCorrientesUSD),
               listaTransferenciasUSD:clon(listaTransferenciasUSD),listaComprasUSD:clon(listaComprasUSD),tipoCambio}});
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
    listaTransferenciasUSD=[];
    listaComprasUSD=[];
    guardar(); renderTabs(); renderContenido();
    if(!auto) alert('✅ Mes "'+nombre+sufijo+'" archivado. Nuevo período abierto.');
    return true;
}

// ═══════════════════════════════════════════
//  BACKUP
// ═══════════════════════════════════════════
function exportar() {
    const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
    const data={listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaTransferenciasUSD,listaComprasUSD,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos,listaIngresosUSD,listaIngresosPresup,listaPagosTarjeta,listaPagosTarjetaUSD,gmailProcessed:cfGmailGetProcessed()};
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
    listaTransferenciasUSD = res.listaTransferenciasUSD || [];
    listaComprasUSD      = res.listaComprasUSD      || [];
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
    if(res.listaIngresosUSD)     listaIngresosUSD     = res.listaIngresosUSD;
    if(res.listaIngresosPresup)  listaIngresosPresup  = res.listaIngresosPresup;
    if(res.listaPagosTarjeta)    listaPagosTarjeta    = res.listaPagosTarjeta;
    if(res.listaPagosTarjetaUSD) listaPagosTarjetaUSD = res.listaPagosTarjetaUSD;
    if(res.groqKey)            localStorage.setItem('groq_api_key', res.groqKey);
    if(res.gmailProcessed && Array.isArray(res.gmailProcessed)) {
        // Unión con lo que ya tiene este dispositivo (no pisar, sumar) para no hacer
        // reaparecer mails que este dispositivo ya había tratado.
        const propios = cfGmailGetProcessed();
        const mapa = new Map(propios.map(x => [x.id, x.ts]));
        res.gmailProcessed.forEach(x => {
            if (x && x.id) mapa.set(x.id, Math.max(mapa.get(x.id) || 0, x.ts || Date.now()));
        });
        const fusionado = Array.from(mapa, ([id, ts]) => ({ id, ts }));
        try { localStorage.setItem(CF_GMAIL_PROCESSED_KEY, JSON.stringify(fusionado)); } catch(e) {}
    }
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
        itemsHtml += cuotasTerminando.map(c=>{ const rest=c.totalCuotas-c.cuotaActual; const lbl=rest===0?'Última cuota':rest===1?'Quedan 2 cuotas':'Quedan '+rest+' cuotas'; return '<div class="vto-item cuota"><div><div class="vto-nombre">'+c.descripcion+'</div><div class="vto-sub">'+fmt(c.montoCuota)+'/mes · Cuota '+c.cuotaActual+' de '+c.totalCuotas+'</div></div><div class="vto-fecha"><div class="vto-dias" style="background:#f3e8ff;color:#7c3aed;">'+lbl+'</div></div></div>'; }).join('');
    }
    const ov=el('div','modal-overlay no-print'); ov.id='modal-vto';
    const titulo = proximos.length && cuotasTerminando.length ? 'Vencimientos y cuotas próximas' : proximos.length ? 'Vencimientos en los próximos 5 días hábiles' : 'Cuotas por terminar';
    ov.innerHTML='<div class="modal-box"><div class="modal-header"><span style="font-size:20px;">⚠️</span><h3>'+titulo+'</h3></div><div class="modal-body">'+itemsHtml+'</div><div class="modal-footer"><button class="btn btn-dark" onclick="document.getElementById(\'modal-vto\').remove()">Entendido</button></div></div>';
    document.body.appendChild(ov);
}

// ═══════════════════════════════════════════
//  MOVIMIENTOS BANCARIOS (saldo inicio de mes + detalle diario por cuenta)
// ═══════════════════════════════════════════
// Junta, para una cuenta bancaria dada, todos los eventos del mes en curso que impactan
// su saldo: ingresos directos, corrientes/servicios pagados (solo si la cuenta es líquida,
// mismo criterio que usa el resto de la app vía esCuentaLiq) y transferencias propias.
function mesNombreToYM(nombre) {
    if (!nombre) return null;
    const meses = {enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',julio:'07',agosto:'08',septiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'};
    const m = nombre.toLowerCase().match(/^(\w+) de (\d{4})/);
    if (!m || !meses[m[1]]) return null;
    return m[2] + '-' + meses[m[1]];
}
function historicoMesPorYM(ym) {
    const cerrados = historicoMeses.filter(m => mesNombreToYM(m.nombre) === ym);
    return cerrados.length ? cerrados[cerrados.length - 1] : null;
}
function getSaldoBancoMes(bancoId, mesYM) {
    const mesActualYM = cfFechaLocal().slice(0,7);
    if (!mesYM || mesYM === mesActualYM) {
        const b = listaBancos.find(x => x.id === bancoId);
        return b ? b.saldo : 0;
    }
    const entry = historicoMesPorYM(mesYM);
    if (!entry) return null;
    const b = (entry.datos.listaBancos || []).find(x => x.id === bancoId);
    return b ? b.saldo : null;
}
function computeMovimientosBanco(bancoId, mesYM) {
    const mesActualYM = cfFechaLocal().slice(0,7);
    const targetYM = mesYM || mesActualYM;
    const esDelMes = fecha => (fecha || '').slice(0,7) === targetYM;
    const esMesActual = targetYM === mesActualYM;
    let fCorrientes = listaCorrientes, fServicios = listaServicios, fTransferencias = listaTransferencias, fComprasUSD = listaComprasUSD;
    if (!esMesActual) {
        const entry = historicoMesPorYM(targetYM);
        fCorrientes = (entry && entry.datos.listaCorrientes) || [];
        fServicios = (entry && entry.datos.listaServicios) || [];
        fTransferencias = (entry && entry.datos.listaTransferencias) || [];
        fComprasUSD = (entry && entry.datos.listaComprasUSD) || [];
    }
    const mov = [];
    listaIngresos.forEach(i => { if (i.bancoId === bancoId && esDelMes(i.fecha)) mov.push({ fecha: i.fecha || '', detalle: '💰 ' + (i.descripcion || 'Ingreso'), monto: i.monto, orden: 0 }); });
    if (esCuentaLiq(bancoId)) {
        fCorrientes.forEach(c => { if (c.medioPagoId === bancoId && c.fechaPago && esDelMes(c.fechaPago)) mov.push({ fecha: c.fechaPago, detalle: (c.esIngreso ? '⬆ ' : '🛒 ') + c.rubro + (c.detalle ? ' — ' + c.detalle : ''), monto: c.esIngreso ? c.monto : -c.monto, orden: 1 }); });
        fServicios.forEach(s => { if (s.medioPagoId === bancoId && s.pagado > 0 && s.fPago && esDelMes(s.fPago)) mov.push({ fecha: s.fPago, detalle: '📋 ' + s.nombre, monto: -s.pagado, orden: 1 }); });
    }
    fTransferencias.forEach(t => {
        if (t.origenId === bancoId && esDelMes(t.fecha))  mov.push({ fecha: t.fecha || '', detalle: '↗ Transferencia a ' + (t.destinoNombre || '?'), monto: -t.monto, orden: 2 });
        if (t.destinoId === bancoId && esDelMes(t.fecha)) mov.push({ fecha: t.fecha || '', detalle: '↙ Transferencia de ' + (t.origenNombre || '?'), monto: t.monto, orden: 2 });
    });
    fComprasUSD.forEach(c => {
        if (c.origenId === bancoId && esDelMes(c.fecha)) mov.push({ fecha: c.fecha || '', detalle: '💱 Compra USD → ' + (c.destinoNombre || '?'), monto: -c.montoARS, orden: 2 });
    });
    mov.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.orden - b.orden));
    return mov;
}

// ── Equivalentes en USD: misma lógica, pero sobre listaCuentasUSD.
// No existe un toggle "autoDescontar" para cuentas USD (a diferencia de listaBancos),
// así que cualquier cuenta USD se considera líquida por defecto.
function getSaldoBancoMesUSD(cuentaId, mesYM) {
    const mesActualYM = cfFechaLocal().slice(0,7);
    if (!mesYM || mesYM === mesActualYM) {
        const c = listaCuentasUSD.find(x => x.id === cuentaId);
        return c ? c.saldo : 0;
    }
    const entry = historicoMesPorYM(mesYM);
    if (!entry) return null;
    const c = (entry.datos.listaCuentasUSD || []).find(x => x.id === cuentaId);
    return c ? c.saldo : null;
}
function computeMovimientosBancoUSD(cuentaId, mesYM) {
    const mesActualYM = cfFechaLocal().slice(0,7);
    const targetYM = mesYM || mesActualYM;
    const esDelMes = fecha => (fecha || '').slice(0,7) === targetYM;
    const esMesActual = targetYM === mesActualYM;
    let fCorrientes = listaCorrientesUSD, fServicios = listaServiciosUSD, fTransferencias = listaTransferenciasUSD, fCompras = listaComprasUSD;
    if (!esMesActual) {
        const entry = historicoMesPorYM(targetYM);
        fCorrientes = (entry && entry.datos.listaCorrientesUSD) || [];
        fServicios = (entry && entry.datos.listaServiciosUSD) || [];
        fTransferencias = (entry && entry.datos.listaTransferenciasUSD) || [];
        fCompras = (entry && entry.datos.listaComprasUSD) || [];
    }
    const mov = [];
    listaIngresosUSD.forEach(i => { if (i.cuentaId === cuentaId && esDelMes(i.fecha)) mov.push({ fecha: i.fecha || '', detalle: '💰 ' + (i.descripcion || 'Ingreso'), monto: i.monto, orden: 0 }); });
    fCorrientes.forEach(c => { if (c.medioPagoId === cuentaId && c.fechaPago && esDelMes(c.fechaPago)) mov.push({ fecha: c.fechaPago, detalle: (c.esIngreso ? '⬆ ' : '🛒 ') + c.rubro + (c.detalle ? ' — ' + c.detalle : ''), monto: c.esIngreso ? c.monto : -c.monto, orden: 1 }); });
    fServicios.forEach(s => { if (s.medioPagoId === cuentaId && s.pagado > 0 && s.fPago && esDelMes(s.fPago)) mov.push({ fecha: s.fPago, detalle: '📋 ' + s.nombre, monto: -s.pagado, orden: 1 }); });
    fTransferencias.forEach(t => {
        if (t.origenId === cuentaId && esDelMes(t.fecha))  mov.push({ fecha: t.fecha || '', detalle: '↗ Transferencia a ' + (t.destinoNombre || '?'), monto: -t.monto, orden: 2 });
        if (t.destinoId === cuentaId && esDelMes(t.fecha)) mov.push({ fecha: t.fecha || '', detalle: '↙ Transferencia de ' + (t.origenNombre || '?'), monto: t.monto, orden: 2 });
    });
    fCompras.forEach(c => {
        if (c.destinoId === cuentaId && esDelMes(c.fecha)) mov.push({ fecha: c.fecha || '', detalle: '💱 Compra USD desde ' + (c.origenNombre || '?'), monto: c.montoUSD, orden: 2 });
    });
    mov.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.orden - b.orden));
    return mov;
}

function buildMovimientos() {
    const wrap = el('div', 'container'); wrap.style.paddingTop = '20px';
    const hdr = el('div'); hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #0284c7;';
    hdr.innerHTML = '<div><h2 style="margin:0;font-size:22px;color:#1e293b;">🏦 Movimientos Bancarios' + btnAyuda('movimientos') + '</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">Saldo al inicio del mes y movimientos diarios por cuenta</p></div>';
    wrap.appendChild(hdr);

    if (!listaBancos.length && !listaCuentasUSD.length) {
        const vacio = el('div'); vacio.style.cssText = 'background:white;border:1px dashed #cbd5e1;border-radius:8px;padding:24px;text-align:center;color:#94a3b8;font-size:13px;';
        vacio.innerText = 'No hay cuentas cargadas todavía.';
        wrap.appendChild(vacio);
        return wrap;
    }
    // Si la moneda seleccionada no tiene cuentas, volvemos a la que sí tenga.
    if (movMoneda === 'ARS' && !listaBancos.length) movMoneda = 'USD';
    if (movMoneda === 'USD' && !listaCuentasUSD.length) movMoneda = 'ARS';

    if (!movBancoSelId || !listaBancos.some(b => b.id === movBancoSelId)) movBancoSelId = listaBancos[0]?.id || null;
    if (!movCuentaUSDSelId || !listaCuentasUSD.some(c => c.id === movCuentaUSDSelId)) movCuentaUSDSelId = listaCuentasUSD[0]?.id || null;
    const mesActualYM = cfFechaLocal().slice(0,7);
    if (!movMesSelYM) movMesSelYM = mesActualYM;

    const selRow = el('div'); selRow.style.cssText = 'margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;';

    // Toggle de moneda (solo si hay cuentas en ambas monedas — si no, no tiene sentido elegir)
    if (listaBancos.length && listaCuentasUSD.length) {
        const tog = el('div'); tog.style.cssText = 'display:flex;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;';
        const btnA = el('button'); btnA.type = 'button'; btnA.innerText = '🏦 ARS';
        const btnU = el('button'); btnU.type = 'button'; btnU.innerText = '💵 USD';
        const estiloOn = 'padding:8px 14px;font-size:13px;font-weight:bold;border:none;cursor:pointer;background:#0284c7;color:white;';
        const estiloOff = 'padding:8px 14px;font-size:13px;font-weight:bold;border:none;cursor:pointer;background:white;color:#64748b;';
        btnA.style.cssText = movMoneda === 'ARS' ? estiloOn : estiloOff;
        btnU.style.cssText = movMoneda === 'USD' ? (estiloOn.replace('#0284c7','#16a34a')) : estiloOff;
        btnA.onclick = () => { movMoneda = 'ARS'; renderTabs(); renderContenido(); };
        btnU.onclick = () => { movMoneda = 'USD'; renderTabs(); renderContenido(); };
        tog.appendChild(btnA); tog.appendChild(btnU);
        selRow.appendChild(tog);
    }

    const sel = el('select'); sel.id = 'mov-banco-sel'; sel.className = 'inp'; sel.style.cssText = 'max-width:280px;font-size:13px;padding:8px 10px;';
    if (movMoneda === 'ARS') {
        listaBancos.forEach(b => addOpt(sel, b.id, '🏦 ' + b.nombre, b.id === movBancoSelId));
        sel.onchange = e => { movBancoSelId = e.target.value; renderMovimientosDetalle(); };
    } else {
        listaCuentasUSD.forEach(c => addOpt(sel, c.id, '💵 ' + c.nombre, c.id === movCuentaUSDSelId));
        sel.onchange = e => { movCuentaUSDSelId = e.target.value; renderMovimientosDetalle(); };
    }
    selRow.appendChild(sel);

    const selMes = el('select'); selMes.id = 'mov-mes-sel'; selMes.className = 'inp'; selMes.style.cssText = 'max-width:220px;font-size:13px;padding:8px 10px;';
    addOpt(selMes, mesActualYM, '📅 Mes actual', movMesSelYM === mesActualYM);
    const vistos = new Set([mesActualYM]);
    for (let i = historicoMeses.length - 1; i >= 0; i--) {
        const ym = mesNombreToYM(historicoMeses[i].nombre);
        if (!ym || vistos.has(ym)) continue;
        vistos.add(ym);
        addOpt(selMes, ym, '📅 ' + historicoMeses[i].nombre, movMesSelYM === ym);
    }
    selMes.onchange = e => { movMesSelYM = e.target.value; renderMovimientosDetalle(); };
    selRow.appendChild(selMes);
    wrap.appendChild(selRow);

    const det = el('div'); det.id = 'mov-detalle';
    wrap.appendChild(det);
    setTimeout(renderMovimientosDetalle, 0);
    return wrap;
}

function renderMovimientosDetalle() {
    if (movMoneda === 'USD') return renderMovimientosDetalleGenerico({
        cuentaId: movCuentaUSDSelId, listaCuentas: listaCuentasUSD,
        getSaldo: getSaldoBancoMesUSD, computeMov: computeMovimientosBancoUSD,
        formatFn: fmtUSD, colorTema: '#16a34a', bgTema: '#f0fdf4', borderTema: '#bbf7d0'
    });
    return renderMovimientosDetalleGenerico({
        cuentaId: movBancoSelId, listaCuentas: listaBancos,
        getSaldo: getSaldoBancoMes, computeMov: computeMovimientosBanco,
        formatFn: fmt, colorTema: '#0284c7', bgTema: '#f0f9ff', borderTema: '#7dd3fc'
    });
}

function renderMovimientosDetalleGenerico(cfg) {
    const det = document.getElementById('mov-detalle');
    if (!det) return;
    const cuenta = cfg.listaCuentas.find(c => c.id === cfg.cuentaId);
    if (!cuenta) { det.innerHTML = '<div style="background:white;border:1px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No hay cuentas en esta moneda.</div>'; return; }

    const mesActualYM = cfFechaLocal().slice(0,7);
    const targetYM = movMesSelYM || mesActualYM;
    const esMesActual = targetYM === mesActualYM;
    const fmt2 = cfg.formatFn;
    const saldoRef = cfg.getSaldo(cuenta.id, targetYM);

    if (saldoRef === null) {
        det.innerHTML = '<div style="background:white;border:1px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;color:#94a3b8;font-size:13px;">No hay datos archivados para esta cuenta en el mes seleccionado.</div>';
        return;
    }

    const mov = cfg.computeMov(cuenta.id, targetYM);
    const totalMov = mov.reduce((a, m) => a + m.monto, 0);
    const saldoInicio = Math.round((saldoRef - totalMov) * 100) / 100;
    const totalIngresos = mov.filter(m => m.monto > 0).reduce((a, m) => a + m.monto, 0);
    const totalEgresos = mov.filter(m => m.monto < 0).reduce((a, m) => a + m.monto, 0);
    const lblSaldoActual = esMesActual ? 'Saldo actual' : 'Saldo al cierre';

    let cards = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">';
    cards += '<div style="background:white;border:1px solid #cbd5e1;border-top:4px solid #64748b;border-radius:8px;padding:14px;"><span style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;">Saldo inicio de mes</span><br><span style="font-size:20px;font-weight:bold;color:#1e293b;">' + fmt2(saldoInicio) + '</span></div>';
    cards += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-top:4px solid #16a34a;border-radius:8px;padding:14px;"><span style="font-size:11px;font-weight:bold;color:#16a34a;text-transform:uppercase;">Ingresos del mes</span><br><span style="font-size:20px;font-weight:bold;color:#16a34a;">+' + fmt2(totalIngresos) + '</span></div>';
    cards += '<div style="background:#fef2f2;border:1px solid #fecaca;border-top:4px solid #dc2626;border-radius:8px;padding:14px;"><span style="font-size:11px;font-weight:bold;color:#dc2626;text-transform:uppercase;">Egresos del mes</span><br><span style="font-size:20px;font-weight:bold;color:#dc2626;">' + fmt2(totalEgresos) + '</span></div>';
    cards += '<div style="background:' + cfg.bgTema + ';border:1px solid ' + cfg.borderTema + ';border-top:4px solid ' + cfg.colorTema + ';border-radius:8px;padding:14px;"><span style="font-size:11px;font-weight:bold;color:' + cfg.colorTema + ';text-transform:uppercase;">' + lblSaldoActual + '</span><br><span style="font-size:20px;font-weight:bold;color:' + cfg.colorTema + ';">' + fmt2(saldoRef) + '</span></div>';
    cards += '</div>';

    let tablaHtml;
    if (!mov.length) {
        tablaHtml = '<div style="background:white;border:1px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;color:#94a3b8;font-size:13px;">Sin movimientos registrados este mes en esta cuenta.</div>';
    } else {
        let filas = '';
        let running = saldoInicio;
        let fechaAnterior = null;
        let filaIdx = 0;
        filas += '<tr style="background:#f8fafc;"><td colspan="2" style="padding:6px 10px;font-size:11px;font-weight:bold;color:#64748b;">Saldo al inicio del mes</td><td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:bold;color:#1e293b;">' + fmt2(saldoInicio) + '</td></tr>';
        mov.forEach(m => {
            running = Math.round((running + m.monto) * 100) / 100;
            const fechaLbl = m.fecha ? m.fecha.split('-').reverse().join('/') : '—';
            if (m.fecha !== fechaAnterior) {
                filas += '<tr><td colspan="3" style="padding:10px 4px 2px;font-size:11px;font-weight:bold;color:' + cfg.colorTema + ';border-top:1px solid #e2e8f0;">📅 ' + fechaLbl + '</td></tr>';
                fechaAnterior = m.fecha;
            }
            const colorMonto = m.monto >= 0 ? '#16a34a' : '#dc2626';
            const signo = m.monto >= 0 ? '+' : '';
            const bgFila = (filaIdx % 2 === 0) ? '#ffffff' : '#cbd5e1';
            filaIdx++;
            filas += '<tr style="background:' + bgFila + ';"><td style="padding:5px 10px 5px 20px;font-size:12px;color:#1e293b;">' + m.detalle + '</td>' +
                '<td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:bold;color:' + colorMonto + ';">' + signo + fmt2(m.monto) + '</td>' +
                '<td style="padding:5px 10px;text-align:right;font-size:12px;color:#64748b;">' + fmt2(running) + '</td></tr>';
        });
        filas += '<tr style="background:' + cfg.bgTema + ';"><td colspan="2" style="padding:6px 10px;font-size:11px;font-weight:bold;color:' + cfg.colorTema + ';border-top:2px solid ' + cfg.borderTema + ';">' + lblSaldoActual + '</td><td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:bold;color:' + cfg.colorTema + ';border-top:2px solid ' + cfg.borderTema + ';">' + fmt2(saldoRef) + '</td></tr>';
        tablaHtml = '<div style="background:white;border:1px solid #cbd5e1;border-radius:8px;padding:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><tbody>' + filas + '</tbody></table></div>';
    }

    det.innerHTML = cards + tablaHtml;
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
            <h3 class="panel-title" style="display:flex;align-items:center;">🏦 Cuentas en USD ${btnAyuda('dolares')}</h3>
            <button type="button" onclick="abrirModalIngresoUSD()" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#16a34a;border:none;color:#fff;border-radius:6px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:12px;">💰 Ingresar fondos (USD)</button>
            <div class="form-block">
              <form id="form-cusd">
                <div class="form-group"><label>Nombre</label><input type="text" id="cusd-nombre" required placeholder="Ej. Billetera USD"></div>
                <div class="form-group"><label>Saldo (USD)</label><input type="number" id="cusd-saldo" required value="0" step="0.01"></div>
                <button type="submit" class="btn btn-add" style="background:#16a34a;">Añadir Cuenta USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:40%">Cuenta</th><th style="width:28%" class="tr">Saldo (USD)</th><th style="width:27%" class="tr">En pesos</th><th style="width:5%"></th></tr></thead><tbody id="t-cusd"></tbody></table>
            <div id="panel-historial-ingresos-usd" style="margin-top:16px;display:none;">
              <h4 style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">📋 Historial de Ingresos USD</h4>
              <table style="font-size:12px;width:100%;border-collapse:collapse;">
                <thead><tr style="background:#f0fdf4;"><th style="padding:6px 8px;text-align:left;color:#166534;">Fecha</th><th style="padding:6px 8px;text-align:left;color:#166534;">Cuenta</th><th style="padding:6px 8px;text-align:left;color:#166534;">Descripción</th><th style="padding:6px 8px;text-align:right;color:#166534;">Monto</th><th style="padding:6px 8px;" class="no-print"></th></tr></thead>
                <tbody id="t-ingresos-usd"></tbody>
              </table>
            </div>
          </div>
          <!-- Modal Ingresar Fondos USD -->
          <div id="modal-ingreso-usd" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;">
            <div style="background:white;border-radius:12px;padding:24px;width:340px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.3);">
              <h3 style="margin:0 0 16px;color:#166534;font-size:16px;">💰 Ingresar Fondos (USD)</h3>
              <div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Cuenta destino</label><select id="ingusd-cuenta" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;"></select></div>
              <div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Monto (USD)</label><input type="number" id="ingusd-monto" min="0" step="0.01" value="" placeholder="0" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Descripción</label><input type="text" id="ingusd-desc" placeholder="Ej. Sueldo, Cobro cliente..." style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="margin-bottom:20px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Fecha</label><input type="date" id="ingusd-fecha" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>
              <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button onclick="cerrarModalIngresoUSD()" style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:6px;background:white;cursor:pointer;font-size:14px;">Cancelar</button>
                <button onclick="confirmarIngresoUSD()" style="padding:8px 20px;border:none;border-radius:6px;background:#16a34a;color:white;cursor:pointer;font-size:14px;font-weight:bold;">✓ Confirmar</button>
              </div>
            </div>
          </div>
          <div class="panel no-print" style="border-top:4px solid #a855f7;">
            <h3 class="panel-title" style="display:flex;align-items:center;">💳 Tarjetas en USD ${btnAyuda('dolares')}</h3>
            <div class="form-block">
              <form id="form-tusd">
                <div class="form-group"><label>Nombre</label><input type="text" id="tusd-nombre" required placeholder="Ej. Visa Santander USD"></div>
                <div class="form-group"><label>Saldo base (USD)</label><input type="number" id="tusd-saldo" required value="0" step="0.01"></div>
                <div class="form-group"><label>Vencimiento actual (USD)</label><input type="number" id="tusd-vencimiento" value="0" step="0.01"></div>
                <button type="submit" class="btn btn-add" style="background:#a855f7;">Registrar Tarjeta USD</button>
              </form>
            </div>
            <div id="t-tusd"></div>
            <div id="wrap-pagos-tarjeta-usd"></div>
          </div>
          <div class="panel no-print" style="border-top:4px solid #f59e0b;">
            <h3 class="panel-title" style="display:flex;align-items:center;">↔️ Transferencias USD ${btnAyuda('dolares')}</h3>
            <div class="form-block">
              <form id="form-transf-usd">
                <div class="form-row"><div><label>Origen</label><select id="transfusd-origen" required></select></div><div><label>Destino</label><select id="transfusd-destino" required></select></div></div>
                <div class="form-row"><div><label>Monto (USD)</label><input type="number" id="transfusd-monto" required placeholder="0" step="0.01"></div><div><label>Fecha</label><input type="date" id="transfusd-fecha" required></div></div>
                <button type="submit" class="btn btn-add btn-amber">Registrar Transferencia USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:18%">Fecha</th><th style="width:30%">Origen</th><th style="width:30%">Destino</th><th style="width:17%" class="tr">Monto</th><th style="width:5%" class="no-print"></th></tr></thead><tbody id="t-transf-usd"></tbody></table>
          </div>
          <div class="panel no-print" style="border-top:4px solid #0ea5e9;">
            <h3 class="panel-title" style="display:flex;align-items:center;">💱 Comprar Dólares ${btnAyuda('dolares')}</h3>
            <div class="form-block">
              <form id="form-compra-usd">
                <div class="form-row"><div><label>Cuenta origen (pesos)</label><select id="comprausd-origen" required></select></div><div><label>Cuenta destino (USD)</label><select id="comprausd-destino" required></select></div></div>
                <div class="form-row"><div><label>Monto a debitar ($)</label><input type="number" id="comprausd-monto" required placeholder="0" step="1"></div><div><label>Tipo de cambio</label><input type="number" id="comprausd-tc" required placeholder="0" step="0.01"></div></div>
                <div class="form-row"><div><label>Fecha</label><input type="date" id="comprausd-fecha" required></div><div style="display:flex;align-items:flex-end;"><div id="comprausd-preview" style="font-size:13px;color:#0ea5e9;font-weight:bold;padding-bottom:9px;">Ingresá monto y TC para ver el equivalente en USD</div></div></div>
                <button type="submit" class="btn btn-add" style="background:#0ea5e9;">Registrar Compra de USD</button>
              </form>
            </div>
            <table><thead><tr><th style="width:14%">Fecha</th><th style="width:20%">Origen</th><th style="width:20%">Destino</th><th style="width:14%" class="tr">Monto $</th><th style="width:10%" class="tr">TC</th><th style="width:14%" class="tr">USD</th><th style="width:5%" class="no-print"></th></tr></thead><tbody id="t-compra-usd"></tbody></table>
          </div>
        </div>
        <div>
          <div class="panel" style="border-top:4px solid #4f46e5;">
            <h3 class="panel-title" style="display:flex;align-items:center;">📋 Servicios Fijos en USD ${btnAyuda('dolares')}</h3>
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
            <h3 class="panel-title" style="display:flex;align-items:center;">🛍️ Gastos Corrientes en USD ${btnAyuda('dolares')}</h3>
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
    g('form-transf-usd')?.addEventListener('submit', altaTransferenciaUSD);
    g('form-compra-usd')?.addEventListener('submit', altaCompraUSD);
    g('btn-dol-actualizar')?.addEventListener('click', actualizarTCDolares);
    const inpM=g('comprausd-monto'), inpTC=g('comprausd-tc');
    [inpM,inpTC].forEach(inp=>inp?.addEventListener('input', actualizarPreviewCompraUSD));
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
    // Transferencias USD
    const tTrU=document.getElementById('t-transf-usd'), selOU=document.getElementById('transfusd-origen'), selDU=document.getElementById('transfusd-destino');
    [selOU,selDU].forEach(s=>{ if(s) s.innerHTML=''; });
    listaCuentasUSD.forEach(c=>{ [selOU,selDU].forEach(s=>{ if(s) addOpt(s,c.id,'🏦 '+c.nombre); }); });
    listaTarjetasUSD.forEach(t=>{ [selOU,selDU].forEach(s=>{ if(s) addOpt(s,t.id,'💳 '+t.nombre); }); });
    if(tTrU){
        tTrU.innerHTML='';
        if(!listaTransferenciasUSD.length) { tTrU.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>'; }
        else { [...listaTransferenciasUSD].reverse().forEach(t=>{
            const tdM=el('td','tr'); tdM.style.cssText='font-weight:bold;color:#f59e0b;'; tdM.innerText=fmtUSD(t.monto);
            tTrU.appendChild(fila([tdTxt(t.fecha||'—'),tdTxt(t.origenNombre),tdTxt(t.destinoNombre),tdM,tdBtn('✕',()=>elimTransferenciaUSD(t.id))]));
        }); }
    }
    // Comprar Dólares
    const tCompU=document.getElementById('t-compra-usd'), selCOr=document.getElementById('comprausd-origen'), selCDest=document.getElementById('comprausd-destino'), inpCTC=document.getElementById('comprausd-tc');
    if(selCOr){ selCOr.innerHTML=''; listaBancos.forEach(b=>addOpt(selCOr,b.id,'🏦 '+b.nombre)); }
    if(selCDest){ selCDest.innerHTML=''; listaCuentasUSD.forEach(c=>addOpt(selCDest,c.id,'🏦 '+c.nombre)); }
    if(inpCTC && !inpCTC.value && tipoCambio) inpCTC.value = tipoCambio;
    if(tCompU){
        tCompU.innerHTML='';
        if(!listaComprasUSD.length) { tCompU.innerHTML='<tr><td colspan="7" class="tc" style="color:#94a3b8;padding:12px;">Sin compras registradas.</td></tr>'; }
        else { [...listaComprasUSD].reverse().forEach(c=>{
            const tdM=el('td','tr'); tdM.style.cssText='font-weight:bold;color:#dc2626;'; tdM.innerText=fmt(c.montoARS);
            const tdTC=el('td','tr'); tdTC.style.color='#64748b'; tdTC.innerText=fmt(c.tc);
            const tdU=el('td','tr'); tdU.style.cssText='font-weight:bold;color:#16a34a;'; tdU.innerText=fmtUSD(c.montoUSD);
            tCompU.appendChild(fila([tdTxt(c.fecha||'—'),tdTxt(c.origenNombre),tdTxt(c.destinoNombre),tdM,tdTC,tdU,tdBtn('✕',()=>elimCompraUSD(c.id))]));
        }); }
    }
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
    // Historial de ingresos USD
    const panelHistU = document.getElementById('panel-historial-ingresos-usd');
    const tIU = document.getElementById('t-ingresos-usd');
    if(panelHistU && tIU) {
        tIU.innerHTML = '';
        if(listaIngresosUSD.length) {
            panelHistU.style.display = 'block';
            [...listaIngresosUSD].reverse().forEach(ing => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f0fdf4';
                tr.innerHTML = `<td style="padding:5px 8px;color:#475569;">${ing.fecha||'—'}</td><td style="padding:5px 8px;font-weight:bold;color:#166534;">${ing.cuentaNombre||'—'}</td><td style="padding:5px 8px;color:#fff;background:#0f172a;">${ing.descripcion||'—'}</td><td style="padding:5px 8px;text-align:right;font-weight:bold;color:#16a34a;">${fmtUSD(ing.monto)}</td><td style="padding:5px 8px;" class="no-print"><button onclick="elimIngresoUSD('${ing.id}')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button></td>`;
                tIU.appendChild(tr);
            });
        } else {
            panelHistU.style.display = 'none';
        }
    }
    // Tarjetas USD - cards
    let totTU=0;
    if(!listaTarjetasUSD.length){ tTU.innerHTML='<p style="color:#94a3b8;padding:12px;text-align:center;">Sin tarjetas USD.</p>'; }
    else {
        listaTarjetasUSD.forEach(function(t){
            const consumo=mDU[t.id]||0, total=t.saldo+consumo; totTU+=total;
            const card=el('div'); card.style.cssText='border:1px solid #e2e8f0;border-left:4px solid #a855f7;border-radius:6px;padding:12px;margin-bottom:8px;background:white;';
            const row1=el('div'); row1.style.cssText='display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
            const nom=el('span'); nom.style.cssText='font-weight:bold;color:#1e293b;font-size:14px;'; nom.innerText=t.nombre;
            const btnsWrap=el('div'); btnsWrap.style.cssText='display:flex;align-items:center;gap:6px;';
            const btnPagar=el('button','btn-secondary btn-sm'); btnPagar.innerText='💳 Pagar'; btnPagar.style.cssText='font-size:11px;padding:4px 8px;'; btnPagar.onclick=function(){ abrirModalPagoTarjetaUSD(t.id); };
            const btnX=el('button','btn-del'); btnX.innerText='\u2715'; btnX.onclick=function(){ elimTarjetaUSD(t.id); };
            btnsWrap.appendChild(btnPagar); btnsWrap.appendChild(btnX);
            row1.appendChild(nom); row1.appendChild(btnsWrap);
            const mkC=function(label,node,color){ const c=el('div'); c.style.cssText='background:#f8fafc;border-radius:4px;padding:6px 10px;'; const l=el('div'); l.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;'; l.innerText=label; const v=el('div'); v.style.cssText='font-size:15px;font-weight:bold;color:'+(color||'#1e293b')+';'; if(typeof node==='string') v.innerText=node; else v.appendChild(node); c.appendChild(l); c.appendChild(v); return c; };
            const inp=inpNumUSD(t.saldo,function(v){ t.saldo=v; guardar(); calcDashUSD(); });
            inp.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;font-size:15px;font-weight:bold;color:#a855f7;background:white;text-align:right;';
            const inpV=inpNumUSD(t.vencimiento||0,function(v){ t.vencimiento=v; guardar(); });
            inpV.style.cssText='width:100%;border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;font-size:15px;font-weight:bold;color:#ea580c;background:white;text-align:right;';
            const row2=el('div'); row2.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;';
            row2.appendChild(mkC('Saldo Base',inp,'#a855f7'));
            row2.appendChild(mkC('Vencimiento',inpV,'#ea580c'));
            row2.appendChild(mkC('Consumo Mes',consumo>0?fmtUSD(consumo):'\u2014','#6366f1'));
            const cP=el('div'); cP.style.cssText='background:#f0f9ff;border-radius:4px;padding:6px 10px;'; const lP=el('div'); lP.style.cssText='font-size:10px;color:#94a3b8;text-transform:uppercase;margin-bottom:3px;'; lP.innerText='En Pesos'; const vP=el('div'); vP.style.cssText='font-size:15px;font-weight:bold;color:#0284c7;'; vP.innerText=fmt(total*tipoCambio); cP.appendChild(lP); cP.appendChild(vP);
            card.appendChild(row1); card.appendChild(row2); card.appendChild(cP); tTU.appendChild(card);
        });
        const tot=el('div'); tot.style.cssText='background:#f8fafc;border-radius:6px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;margin-top:4px;';
        tot.innerHTML='<span style="font-weight:bold;color:#1e293b;">Total</span><div style="text-align:right;"><div style="font-weight:bold;color:#a855f7;font-size:15px;">'+fmtUSD(totTU)+'</div><div style="font-size:13px;color:#0284c7;">'+fmt(totTU*tipoCambio)+'</div></div>';
        tTU.appendChild(tot);
    }
    const wPTU = document.getElementById('wrap-pagos-tarjeta-usd');
    if (wPTU) {
        const ultimosPagosU = [...listaPagosTarjetaUSD].reverse().slice(0, 5);
        if (!ultimosPagosU.length) { wPTU.innerHTML = ''; }
        else {
            wPTU.innerHTML = '<div style="font-size:11px;font-weight:bold;color:#94a3b8;text-transform:uppercase;margin:10px 0 4px;">Últimos pagos de tarjeta USD</div>'
                + ultimosPagosU.map(p => {
                    const [y,m,d] = (p.fecha||'').split('-');
                    const fechaCorta = (d&&m) ? d+'/'+m : (p.fecha||'');
                    const tit = 'Pagado desde ' + p.cuentaNombre + ' el ' + p.fecha;
                    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:12px;padding:5px 8px;border-bottom:1px solid #f1f5f9;">
                    <span title="${tit}" style="color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">✅ ${fechaCorta} ${p.tarjetaNombre}</span>
                    <span style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><b style="color:#a855f7;">-${fmtUSD(p.monto)}</b><button onclick="elimPagoTarjetaUSD('${p.id}')" style="border:none;background:none;color:#cbd5e1;cursor:pointer;font-size:13px;">✕</button></span>
                </div>`;
                }).join('');
        }
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
            const inpM=inpNumUSD(c.monto,v=>{
                const diff=v-c.monto;
                if(diff!==0){ const cuentaMedio=listaCuentasUSD.find(x=>x.id===c.medioPagoId); if(cuentaMedio) cuentaMedio.saldo += c.esIngreso ? diff : -diff; }
                c.monto=v; guardar(); calcDashUSD();
            });
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
function altaTarjetaUSD(e)   { e.preventDefault(); listaTarjetasUSD.push({id:'tu_'+Date.now(),nombre:vGet('tusd-nombre'),saldo:parseFloat(document.getElementById('tusd-saldo').value)||0,vencimiento:parseFloat(document.getElementById('tusd-vencimiento').value)||0}); guardar(); e.target.reset(); renderDolares(); }
function altaServicioUSD(e)  { e.preventDefault(); const mId=listaTarjetasUSD[0]?.id||listaCuentasUSD[0]?.id||''; listaServiciosUSD.push({id:'su_'+Date.now(),nombre:vGet('susd-nombre'),presupuesto:parseFloat(document.getElementById('susd-presupuesto').value)||0,pagado:0,fVto:vGet('susd-vto'),fPago:'',medioPagoId:mId}); guardar(); e.target.reset(); renderDolares(); }
function altaCorrienteUSD(e) {
    e.preventDefault();
    const medioId=document.getElementById('ccusd-medio').value; if(!medioId){alert('Configure un medio de pago USD.');return;}
    const monto=parseFloat(document.getElementById('ccusd-monto').value)||0, esIngreso=document.getElementById('ccusd-ingreso')?.checked||false;
    listaCorrientesUSD.push({id:'cc_'+Date.now(),rubro:document.getElementById('ccusd-rubro').value,detalle:vGet('ccusd-detalle'),monto,fechaPago:'',medioPagoId:medioId,esIngreso});
    const cuentaMedio=listaCuentasUSD.find(c=>c.id===medioId);
    if(cuentaMedio) cuentaMedio.saldo += esIngreso ? monto : -monto;
    const chk=document.getElementById('ccusd-ingreso'); if(chk) chk.checked=false;
    guardar(); e.target.reset(); renderDolares();
}
function altaTransferenciaUSD(e) {
    e.preventDefault();
    const origenId=vGet('transfusd-origen'), destinoId=vGet('transfusd-destino'), monto=nGet('transfusd-monto'), fecha=vGet('transfusd-fecha');
    if(String(origenId)===String(destinoId)){alert('Origen y destino no pueden ser iguales.');return;}
    if(monto<=0){alert('Monto mayor a cero.');return;}
    const orig=listaCuentasUSD.find(c=>String(c.id)===String(origenId))||listaTarjetasUSD.find(t=>String(t.id)===String(origenId));
    const dest=listaCuentasUSD.find(c=>String(c.id)===String(destinoId))||listaTarjetasUSD.find(t=>String(t.id)===String(destinoId));
    if(!orig||!dest){ alert('No se pudo identificar origen o destino. Probá recargar la página (Ctrl+Shift+R) e intentá de nuevo.'); return; }
    orig.saldo-=monto; dest.saldo+=monto;
    listaTransferenciasUSD.push({id:'tru_'+Date.now(),origenId,destinoId,monto,fecha,origenNombre:orig?.nombre||'?',destinoNombre:dest?.nombre||'?'});
    guardar(); e.target.reset(); renderDolares();
}
// ELIMINACIONES USD
function elimCuentaUSD(id)    { if(confirm('¿Remover cuenta USD?'))  { listaCuentasUSD=listaCuentasUSD.filter(c=>c.id!==id);       guardar(); renderDolares(); } }
function elimTarjetaUSD(id)   { if(confirm('¿Remover tarjeta USD?')) { listaTarjetasUSD=listaTarjetasUSD.filter(t=>t.id!==id);     guardar(); renderDolares(); } }
function elimServicioUSD(id)  {
    const s=listaServiciosUSD.find(x=>x.id===id);
    if(s && s.pagado>0){
        const tk=listaTarjetasUSD.find(t=>t.id===s.medioPagoId);
        const ck=listaCuentasUSD.find(c=>c.id===s.medioPagoId);
        if(tk) tk.saldo-=s.pagado; else if(ck) ck.saldo+=s.pagado;
    }
    listaServiciosUSD=listaServiciosUSD.filter(x=>x.id!==id); guardar(); renderDolares();
}
function elimCorrienteUSD(id) {
    const c=listaCorrientesUSD.find(x=>x.id===id);
    if(c){ const cuentaMedio=listaCuentasUSD.find(x=>x.id===c.medioPagoId); if(cuentaMedio) cuentaMedio.saldo += c.esIngreso ? -c.monto : c.monto; }
    listaCorrientesUSD=listaCorrientesUSD.filter(x=>x.id!==id); guardar(); renderDolares();
}
function elimTransferenciaUSD(id) {
    const t=listaTransferenciasUSD.find(x=>x.id===id);
    if(t){ const o=listaCuentasUSD.find(c=>String(c.id)===String(t.origenId))||listaTarjetasUSD.find(x=>String(x.id)===String(t.origenId)); const d=listaCuentasUSD.find(c=>String(c.id)===String(t.destinoId))||listaTarjetasUSD.find(x=>String(x.id)===String(t.destinoId)); if(o) o.saldo+=t.monto; if(d) d.saldo-=t.monto; }
    listaTransferenciasUSD=listaTransferenciasUSD.filter(x=>x.id!==id); guardar(); renderDolares();
}
function actualizarPreviewCompraUSD() {
    const prev=document.getElementById('comprausd-preview'); if(!prev) return;
    const monto=parseFloat(document.getElementById('comprausd-monto')?.value)||0;
    const tc=parseFloat(document.getElementById('comprausd-tc')?.value)||0;
    if(monto>0 && tc>0) prev.innerText='≈ '+fmtUSD(monto/tc)+' al TC ingresado';
    else prev.innerText='Ingresá monto y TC para ver el equivalente en USD';
}
function altaCompraUSD(e) {
    e.preventDefault();
    const origenId=vGet('comprausd-origen'), destinoId=vGet('comprausd-destino'), montoARS=nGet('comprausd-monto'), tc=nGet('comprausd-tc'), fecha=vGet('comprausd-fecha');
    if(montoARS<=0){alert('El monto en pesos debe ser mayor a cero.');return;}
    if(tc<=0){alert('Ingresá un tipo de cambio válido.');return;}
    const orig=listaBancos.find(b=>String(b.id)===String(origenId));
    const dest=listaCuentasUSD.find(c=>String(c.id)===String(destinoId));
    if(!orig||!dest){ alert('No se pudo identificar la cuenta origen o destino. Probá recargar la página (Ctrl+Shift+R) e intentá de nuevo.'); return; }
    const montoUSD=Math.round((montoARS/tc)*100)/100;
    orig.saldo-=montoARS; dest.saldo+=montoUSD;
    listaComprasUSD.push({id:'cu_compra_'+Date.now(),origenId,destinoId,montoARS,tc,montoUSD,fecha,origenNombre:orig.nombre,destinoNombre:dest.nombre});
    guardar(); e.target.reset();
    const prev=document.getElementById('comprausd-preview'); if(prev) prev.innerText='Ingresá monto y TC para ver el equivalente en USD';
    renderDolares();
}
function elimCompraUSD(id) {
    const c=listaComprasUSD.find(x=>x.id===id);
    if(c){ const o=listaBancos.find(b=>String(b.id)===String(c.origenId)); const d=listaCuentasUSD.find(x=>String(x.id)===String(c.destinoId)); if(o) o.saldo+=c.montoARS; if(d) d.saldo-=c.montoUSD; }
    listaComprasUSD=listaComprasUSD.filter(x=>x.id!==id); guardar(); renderDolares();
}


function dibujarTorta(canvasId, leyId, items, fmtVal, coloresFijos) {
    const total = items.reduce(function(a,i){ return a+i.valor; }, 0);
    if (!total) return;
    const paleta = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
    // Emparejar cada item con su color (fijo o de paleta) ANTES de ordenar, para no perder la correspondencia
    const itemsConColor = items.map(function(it,i){ return { item: it, color: coloresFijos ? coloresFijos[i] : paleta[i%paleta.length] }; });
    // Ordenar torta y leyenda por monto, de mayor a menor
    itemsConColor.sort(function(a,b){ return b.item.valor - a.item.valor; });
    const itemsOrd = itemsConColor.map(function(x){ return x.item; });
    const coloresOrd = itemsConColor.map(function(x){ return x.color; });
    setTimeout(function(){
        const tw = document.getElementById(canvasId); if(!tw) return;
        const cv = el('canvas'); cv.width=300; cv.height=300; tw.appendChild(cv);
        const ctx = cv.getContext('2d'); const cx=150,cy=150,r=120,ri=60; let ang=-Math.PI/2;
        itemsOrd.forEach(function(it,i){
            const pct=it.valor/total, a2=ang+pct*2*Math.PI, col=coloresOrd[i];
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
            d.innerHTML='<div style="width:12px;height:12px;border-radius:3px;background:'+coloresOrd[i]+';flex-shrink:0;"></div>';
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
    hdr.innerHTML = '<div><h2 style="margin:0;font-size:22px;color:#1e293b;display:flex;align-items:center;">🎯 Presupuesto Mensual'+btnAyuda('presupuesto')+'</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">'+mes.charAt(0).toUpperCase()+mes.slice(1)+' · Edición directa en cada rubro</p></div>';
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

    // ── Ingresos del mes (informativo) vs Presupuesto — tarjeta compacta + modal ──
    const mesActualYM = cfFechaLocal().slice(0,7);
    const ingresosDelMes = listaIngresosPresup.filter(i=>(i.fecha||'').slice(0,7)===mesActualYM).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
    const totalIngresosPresup = ingresosDelMes.reduce((a,i)=>a+i.monto,0);
    const balanceMes = totalIngresosPresup - totalPresup;
    const esSuperavit = balanceMes >= 0;
    const balColor = esSuperavit ? '#16a34a' : '#ef4444';
    const balBg = esSuperavit ? '#f0fdf4' : '#fef2f2';
    const balBorder = esSuperavit ? '#bbf7d0' : '#fecaca';
    const lleno = ingresosDelMes.length>=4;

    // Tarjeta compacta clickeable
    let ingCard = '<div id="ip-card" onclick="abrirModalIngresoPresup()" style="cursor:pointer;background:'+balBg+';border:1px solid '+balBorder+';border-radius:10px;padding:16px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">';
    ingCard += '<div><span style="font-size:11px;font-weight:bold;color:#6d28d9;text-transform:uppercase;letter-spacing:.05em;">💵 Ingresos del mes</span>';
    ingCard += '<div id="ip-card-total" style="font-size:24px;font-weight:bold;color:#1e293b;margin-top:4px;">'+fmt(totalIngresosPresup)+'</div>';
    ingCard += '<span id="ip-card-count" style="font-size:11px;color:#94a3b8;">'+ingresosDelMes.length+' de 4 registros · tocá para ver detalle</span></div>';
    ingCard += '<div style="text-align:right;"><span id="ip-card-badge" style="font-size:10px;font-weight:bold;padding:3px 9px;border-radius:4px;background:'+balColor+'22;color:'+balColor+';">'+(esSuperavit?'SUPERÁVIT':'DÉFICIT')+'</span>';
    ingCard += '<div id="ip-card-balance" style="font-size:14px;font-weight:bold;color:'+balColor+';margin-top:4px;">'+(esSuperavit?'+ ':'− ')+fmt(Math.abs(balanceMes))+'</div></div>';
    ingCard += '</div>';
    wrap.insertAdjacentHTML('beforeend', ingCard);

    // Modal: detalle + alta de ingresos (no cierra al agregar/borrar, se refresca in-place)
    let ingModal = '<div id="modal-ingreso-presup" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;align-items:center;justify-content:center;" onclick="if(event.target===this) cerrarModalIngresoPresup()">';
    ingModal += '<div style="background:white;border-radius:12px;padding:24px;width:380px;max-width:90vw;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">';
    ingModal += '<h3 style="margin:0 0 4px;color:#6d28d9;font-size:16px;">💵 Ingresos del mes</h3>';
    ingModal += '<div style="font-size:11px;color:#94a3b8;margin-bottom:14px;">Informativo · no afecta cuentas bancarias</div>';

    // Resumen balance dentro del modal
    ingModal += '<div style="background:'+balBg+';border:1px solid '+balBorder+';border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
    ingModal += '<div><span style="font-size:10px;font-weight:bold;color:'+balColor+';text-transform:uppercase;">Balance vs. presupuesto</span>';
    ingModal += '<div style="font-size:11px;color:#64748b;margin-top:2px;">Ingresos <b id="ip-modal-total">'+fmt(totalIngresosPresup)+'</b> · Presupuesto '+fmt(totalPresup)+'</div></div>';
    ingModal += '<div style="text-align:right;"><div id="ip-modal-balance" style="font-size:18px;font-weight:bold;color:'+balColor+';">'+(esSuperavit?'+ ':'− ')+fmt(Math.abs(balanceMes))+'</div>';
    ingModal += '<span id="ip-modal-badge" style="font-size:10px;font-weight:bold;padding:2px 8px;border-radius:4px;background:'+balColor+'22;color:'+balColor+';">'+(esSuperavit?'SUPERÁVIT':'DÉFICIT')+'</span></div>';
    ingModal += '</div>';

    // Lista de conceptos
    ingModal += '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Conceptos cargados</div>';
    ingModal += '<div id="ip-lista" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">';
    if(ingresosDelMes.length) {
        ingresosDelMes.forEach(i=>{
            const fechaCorta = i.fecha ? i.fecha.slice(8,10)+'/'+i.fecha.slice(5,7) : '—';
            const tipoColor = i.tipo==='Variable' ? '#a855f7' : '#0284c7';
            ingModal += '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #f1f5f9;border-radius:8px;padding:8px 12px;">';
            ingModal += '<div><b style="font-size:13px;color:#1e293b;">'+i.concepto+'</b>';
            ingModal += '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">'+fechaCorta+' · <span style="color:'+tipoColor+';font-weight:bold;">'+(i.tipo||'Fijo')+'</span></div></div>';
            ingModal += '<div style="display:flex;align-items:center;gap:10px;">';
            ingModal += '<b style="font-size:14px;color:#0284c7;">'+fmt(i.monto)+'</b>';
            ingModal += '<button onclick="elimIngresoPresup(\''+i.id+'\')" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button>';
            ingModal += '</div></div>';
        });
    } else {
        ingModal += '<div style="text-align:center;padding:12px;color:#94a3b8;font-size:12px;">Sin ingresos cargados este mes.</div>';
    }
    ingModal += '</div>';

    // Form de alta
    ingModal += '<div style="border-top:1px dashed #e2e8f0;padding-top:14px;">';
    ingModal += '<div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:8px;">Agregar ingreso</div>';
    ingModal += '<div style="margin-bottom:10px;"><input type="text" id="ip-concepto" placeholder="Concepto (Ej. Sueldo, VSS, clases...)" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"></div>';
    ingModal += '<div style="display:flex;gap:8px;margin-bottom:10px;">';
    ingModal += '<input type="number" id="ip-monto" min="0" step="1" placeholder="Monto $" style="flex:1;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;">';
    ingModal += '<input type="date" id="ip-fecha" style="flex:1;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;">';
    ingModal += '</div>';
    ingModal += '<div style="margin-bottom:14px;"><select id="ip-tipo" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;font-size:14px;box-sizing:border-box;"><option value="Fijo">Fijo</option><option value="Variable">Variable</option></select></div>';
    ingModal += '<div style="display:flex;gap:8px;justify-content:flex-end;">';
    ingModal += '<button onclick="cerrarModalIngresoPresup()" style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:6px;background:white;cursor:pointer;font-size:14px;">Cerrar</button>';
    ingModal += '<button id="ip-add-btn" onclick="confirmarIngresoPresup()" '+(lleno?'disabled':'')+' style="padding:8px 20px;border:none;border-radius:6px;background:#6d28d9;color:white;cursor:'+(lleno?'not-allowed':'pointer')+';font-size:14px;font-weight:bold;opacity:'+(lleno?'0.5':'1')+';">＋ Agregar</button>';
    ingModal += '</div></div>';

    ingModal += '</div></div>';
    wrap.insertAdjacentHTML('beforeend', ingModal);

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
        card += '<input type="text" inputmode="numeric" value="'+(pres?pres.toLocaleString('es-AR'):'')+'" placeholder="Sin límite" ';
        card += 'style="flex:1;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;background:white;color:#1e293b;" ';
        card += 'oninput="this.value=this.value.replace(/\\D/g,\'\').replace(/\\B(?=(\\d{3})+(?!\\d))/g,\'.\')" ';
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
    let cB=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #0284c7;padding:16px;margin-bottom:0px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🏦 Cuentas Bancarias</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Cuenta</th><th style="padding:6px;text-align:right;">Saldo Disponible</th></tr>`;
    listaBancos.forEach(b=>{ cB+=`<tr><td style="padding:5px 6px;font-weight:bold;">${b.nombre}</td><td style="padding:5px 6px;text-align:right;color:#0284c7;font-weight:bold;">${fmt(b.saldo)}</td></tr>`; });
    cB+=`<tr style="background:#f8fafc;font-weight:bold;"><td style="padding:6px;">TOTAL</td><td style="padding:6px;text-align:right;color:#0284c7;">${fmt(totB)}</td></tr></table></div>`;

    // Tarjetas
    const mDeb={}; listaTarjetas.forEach(t=>mDeb[t.id]=0);
    listaServicios.forEach(s=>{ if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c=>{ if(c.fechaPago&&mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    let totT=0;
    let cT=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">💳 Tarjetas de Crédito</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Tarjeta</th><th style="padding:6px;text-align:right;">Saldo base</th><th style="padding:6px;text-align:right;">Consumo mes</th><th style="padding:6px;text-align:right;">Total deuda</th></tr>`;
    listaTarjetas.forEach(t=>{ const c=mDeb[t.id]||0,tot=t.saldo+c; totT+=tot; cT+=`<tr><td style="padding:5px 6px;font-weight:bold;">${t.nombre}</td><td style="padding:5px 6px;text-align:right;">${fmt(t.saldo)}</td><td style="padding:5px 6px;text-align:right;color:#a855f7;">${fmt(c)}</td><td style="padding:5px 6px;text-align:right;font-weight:bold;color:#a855f7;">${fmt(tot)}</td></tr>`; });
    cT+=`<tr style="background:#f8fafc;font-weight:bold;"><td colspan="3" style="padding:6px;">TOTAL DEUDA</td><td style="padding:6px;text-align:right;color:#a855f7;">${fmt(totT)}</td></tr></table></div>`;

    const g1=el('div'); g1.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:16px;';
    g1.innerHTML=cB+cT; wrap.appendChild(g1);

    // Servicios fijos
    let totPres=0,totPag=0,totPend=0;
    listaServicios.forEach(s=>{ totPres+=s.presupuesto; totPag+=s.pagado; if(s.presupuesto>s.pagado) totPend+=(s.presupuesto-s.pagado); });
    let tSrv=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos del Mes</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:center;">Clase</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pendiente</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
    listaServicios.forEach((s,ri)=>{
        const pend=Math.max(0,s.presupuesto-s.pagado), cc={'M':'#0284c7','O':'#a855f7','X':'#64748b'}[s.clase||'M'];
        let ec='#c5221f',eb='#fce8e6',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';} else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
        tSrv+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;background:${cc}22;color:${cc};">${s.clase||'M'}</span></td><td style="padding:5px 6px;text-align:right;">${fmt(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(s.pagado)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pend)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`;
    });
    tSrv+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td></td><td style="text-align:right;">${fmt(totPres)}</td><td style="text-align:right;color:#10b981;">${fmt(totPag)}</td><td style="text-align:right;color:#ef4444;">${fmt(totPend)}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tSrv);

    // Por clase
    const clases=[{k:'M',label:'M — Mío',color:'#0284c7'},{k:'O',label:'O — Oma',color:'#a855f7'},{k:'X',label:'X — Otros',color:'#64748b'}];
    let tCl=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #6366f1;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Servicios Fijos por Clase</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Clase</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pendiente</th><th style="padding:6px;text-align:right;">%</th></tr>`;
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
    let tCorr=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:16px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🛍️ Gastos Corrientes por Rubro</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:center;">Clase</th><th style="padding:6px;text-align:left;">Rubro</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Sin confirmar</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
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
    let tClaseCorr=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Gastos Corrientes por Clase</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Clase</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
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
        gU.innerHTML=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #16a34a;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD Disponibles</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#16a34a;">${fmtUSD(tD)}</p><small style="color:#64748b;">${fmt(tD*tc)}</small></div><div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #a855f7;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Pagar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#a855f7;">${fmtUSD(tTU)}</p><small style="color:#64748b;">${fmt(tTU*tc)}</small></div><div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal>=0?'#16a34a':'#ef4444'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">Balance USD</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal>=0?'#16a34a':'#ef4444'};">${fmtUSD(bal)}</p><small style="color:#64748b;">${fmt(Math.abs(bal)*tc)}</small></div><div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal<0?'#ef4444':'#94a3b8'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Comprar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal<0?'#ef4444':'#94a3b8'};">${bal<0?fmtUSD(Math.abs(bal)):'—'}</p><small style="color:#64748b;">${bal<0?fmt(Math.abs(bal)*tc):''}</small></div>`;
        wrap.appendChild(gU);
        if(listaServiciosUSD.length>0){
            let tSU=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos en USD · TC ${fmt(tc)}</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pend. (USD)</th><th style="padding:6px;text-align:right;">Pend. (ARS)</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
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
                const colsCorrUSD = itemsCorrUSD.map(function(it){ return colorRubroUSD(it.label); });
                dibujarTorta('torta-corr-usd','torta-corr-usd-ley', itemsCorrUSD, fmtUSD, colsCorrUSD);
            }
        }

    } else { wrap.insertAdjacentHTML('beforeend','<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;margin-bottom:24px;">Sin datos en dólares para este mes.</div>'); }

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
        if(!rubFilt.length){ contR2.innerHTML='<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;">Sin datos.</div>'; return; }
        let t2=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;"><thead><tr style="background:#1e293b;"><th style="padding:7px 8px;text-align:left;color:white;">Rubro</th>`;
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
        let res=`<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Participación por Rubro (acumulado)</h4>`;
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
        rO += '<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;margin-bottom:16px;">';
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
        rO += '<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;margin-bottom:24px;">';
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
        rO += '<div style="background:white;color:#1e293b;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;margin-bottom:24px;">Sin datos de Clase O para este mes.</div>';
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
    const rows=db.listaServicios.map(s=>{ let ec='#c5221f',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';et='PAGADO';} else if(s.pagado>0){ec='#b06000';et='PARCIAL';} return `<tr><td class="ro-cell"><b>${s.nombre}</b></td><td class="ro-cell ro-muted">${s.rubro||'—'}</td><td class="ro-cell ro-muted">${s.fVto||'—'}</td><td class="ro-cell ro-money">${fmt(s.presupuesto)}</td><td class="ro-cell ro-money">${fmt(s.pagado)}</td><td class="ro-cell ro-muted tc">${s.fPago||'—'}</td><td class="ro-cell ro-muted">${mNom(s.medioPagoId)}</td><td class="tc"><span style="font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;background:${ec}22;color:${ec}">${et}</span></td></tr>`; }).join()||'<tr><td colspan="8" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios</td></tr>';
    return `<div class="panel panel-servicios"><h3 class="panel-title">📋 Servicios Fijos</h3><table><thead><tr><th style="width:18%">Servicio</th><th style="width:12%">Rubro</th><th style="width:10%">Vto.</th><th style="width:11%" class="tr">Presup.</th><th style="width:11%" class="tr">Pagado</th><th style="width:11%" class="tc">F.Pago</th><th style="width:16%">Medio</th><th style="width:11%" class="tc">Estado</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
let _ypfCache = null; // {precioARS, dolar, horaStr, fuera} del último fetch exitoso

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
    document.getElementById('btn-inv-actualizar')?.addEventListener('click', function(){ actualizarInversiones(true); });
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
    guardar(); e.target.reset(); actualizarInversiones(true);
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
        inpCant.onchange = function(e){
            a.cant=parseInt(e.target.value)||1;
            guardar(); renderAcciones(); calcDashInv();
            if(a.ticker && a.ticker.toUpperCase().includes('YPF') && _ypfCache){
                _ypfSetUI(_ypfCache.precioARS, _ypfCache.dolar, _ypfCache.horaStr, _ypfCache.fuera, a.cant);
            }
        };
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

// Cadena de proxies CORS con fallback: si uno falla (403/429/503/caído), prueba el siguiente.
// Los proxies gratuitos son inestables por naturaleza (rate limits, caídas temporales),
// así que en vez de depender de uno solo, probamos varios en orden.
// Cada intento tiene timeout propio para no colgarse esperando un proxy caído.
const CORS_PROXIES = [
    function(url){ return 'https://api.allorigins.win/raw?url='+encodeURIComponent(url); },
    function(url){ return 'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(url); },
    function(url){ return 'https://corsproxy.io/?url='+encodeURIComponent(url); }
];
const CORS_PROXY_TIMEOUT_MS = 8000;

async function fetchConTimeout(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), ms);
    try {
        return await fetch(url, {signal: ctrl.signal});
    } finally {
        clearTimeout(t);
    }
}

async function fetchViaProxyJSON(targetUrl) {
    // Antes: probaba los proxies en cadena, uno a la vez (si el primero tardaba
    // 8s en fallar, recién ahí arrancaba el segundo). Ahora: los 3 salen en
    // simultáneo y nos quedamos con el primero que responda bien — la latencia
    // pasa a ser la del proxy más rápido, no la suma de los que fallan antes.
    const intentos = CORS_PROXIES.map(async (mk, i) => {
        const proxied = mk(targetUrl);
        let res;
        try {
            res = await fetchConTimeout(proxied, CORS_PROXY_TIMEOUT_MS);
        } catch(e) {
            throw (e && e.name==='AbortError') ? new Error('proxy '+i+' timeout ('+CORS_PROXY_TIMEOUT_MS+'ms)') : e;
        }
        if(!res.ok) throw new Error('proxy '+i+' status '+res.status);
        const data = await res.json();
        if(!data) throw new Error('proxy '+i+' respuesta vacía');
        return data;
    });
    try {
        return await Promise.any(intentos);
    } catch(aggErr) {
        const detalles = (aggErr && aggErr.errors ? aggErr.errors : [aggErr]).map(e => (e && e.message) || String(e)).join(' | ');
        throw new Error('todos los proxies fallaron: ' + detalles);
    }
}

async function fetchCotizacionTicker(acc) {
    const url = 'https://query2.finance.yahoo.com/v8/finance/chart/'+acc.ticker+'?interval=1d&range=30d';
    const data = await fetchViaProxyJSON(url);
    if(!data || !data.chart || !data.chart.result || !data.chart.result[0]) {
        throw new Error('Sin datos para '+acc.ticker+'. Error: '+(data && data.chart && data.chart.error));
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

    return {precio: precio, variacion: variacion, historia: historia};
}

let _ultimaActualizacionInv = 0;
const INV_CACHE_TTL_MS = 90000; // no repreguntar si se actualizó hace menos de 90s

async function actualizarInversiones(force) {
    const btn = document.getElementById('btn-inv-actualizar');

    // Cache corta: si ya tenemos cotización de todos los tickers actuales y no pasó el TTL, no repreguntamos.
    const todasEnCache = listaAcciones.length>0 && listaAcciones.every(function(a){ return !!_cotizaciones[a.ticker]; });
    if(!force && todasEnCache && (Date.now() - _ultimaActualizacionInv) < INV_CACHE_TTL_MS) {
        renderInstrumentos(); renderAcciones(); calcDashInv(); renderGraficosInv();
        return;
    }

    if(btn){ btn.disabled=true; btn.innerText='⏳ Actualizando...'; }

    // 1. Dólar oficial
    try {
        const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await res.json();
        _dolarOficial = data.oficial.value_sell;
        const badge = document.getElementById('inv-dolar-badge');
        if(badge) badge.innerText = 'USD Oficial: ' + fmt(_dolarOficial) + ' (venta)';
    } catch(e) { console.warn('Error dólar:', e); }

    // 2. Cotizaciones vía Yahoo Finance + cadena de proxies CORS, EN PARALELO (antes era secuencial)
    await Promise.allSettled(listaAcciones.map(function(acc) {
        return fetchCotizacionTicker(acc).then(function(cot) {
            _cotizaciones[acc.ticker] = cot;
        }).catch(function(e) {
            console.warn('Error cotización '+acc.ticker+':', e);
        });
    }));

    _ultimaActualizacionInv = Date.now();

    renderInstrumentos();
    renderAcciones();
    calcDashInv();
    renderGraficosInv();

    // Actualizar el widget YPF con la cotización ya obtenida arriba, sin volver a pegarle a los proxies
    const ypfAcc = listaAcciones.find(function(a){ return a.ticker && a.ticker.toUpperCase().includes('YPF'); });
    if(ypfAcc && _cotizaciones[ypfAcc.ticker]) {
        const ahora = new Date();
        const dia = ahora.getDay(), hora = ahora.getHours();
        const esHorario = dia>=1 && dia<=5 && hora>=10 && hora<19;
        const horaStr = ahora.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
        _ypfSetUI(_cotizaciones[ypfAcc.ticker].precio, _dolarOficial||tipoCambio||0, horaStr, !esHorario, ypfAcc.cant);
        _ypfCache = {precioARS: _cotizaciones[ypfAcc.ticker].precio, dolar: _dolarOficial||tipoCambio||0, horaStr: horaStr, fuera: !esHorario};
    }

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
        const col = colorRubroUSD(r);
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
// ── HELPER: botón de ayuda contextual ──
function btnAyuda(ancla) {
    return `<button onclick="window.open('./instructivo.html#${ancla}','_blank','width=1100,height=750,resizable=yes,scrollbars=yes')" title="Ver ayuda" style="background:#f59e0b;border:none;color:#1e293b;border-radius:50%;width:20px;height:20px;font-size:10px;font-weight:800;cursor:pointer;padding:0;line-height:1;margin-left:8px;flex-shrink:0;vertical-align:middle;box-shadow:0 1px 4px rgba(0,0,0,0.3);" class="no-print">?</button>`;
}

const APP_VERSION = 'v3.8.9';
const GDRIVE_CLIENT_ID='1049169592532-is5j1j4s1bmgrc9tsq48slrgul8fbj17.apps.googleusercontent.com';
const GDRIVE_SCOPE='https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.readonly';
const CF_DRIVE_FOLDER = 'ControlFinanciero';
let _cfFolderId = null;
const CF_GMAIL_PROCESSED_KEY = 'cf_gmail_processed';
const GTOKEN_KEY='cf_gtoken';
const GTOKEN_EXP_KEY='cf_gtoken_exp';
const GTOKEN_SCOPE_KEY='cf_gtoken_scope_v';
const GTOKEN_SCOPE_VERSION='2'; // v2: carpeta visible "ControlFinanciero" (drive.file) en vez de appDataFolder oculta
let gToken=null;
let _alertasMostradas=false;

// Persistencia de token en localStorage con expiración
function gTokenGuardar(token, expiresInSec) {
    const exp = Date.now() + (expiresInSec||3500)*1000;
    try { localStorage.setItem(GTOKEN_KEY, token); localStorage.setItem(GTOKEN_EXP_KEY, String(exp)); localStorage.setItem(GTOKEN_SCOPE_KEY, GTOKEN_SCOPE_VERSION); } catch(e){}
    gToken = token;
}
function gTokenCargarLocal() {
    try {
        const t = localStorage.getItem(GTOKEN_KEY);
        const exp = parseInt(localStorage.getItem(GTOKEN_EXP_KEY)||'0');
        const scopeV = localStorage.getItem(GTOKEN_SCOPE_KEY);
        // Token viejo (scope appDataFolder) no sirve para la carpeta visible: se descarta y se re-pide consentimiento
        if(t && exp && Date.now() < exp - 60000 && scopeV === GTOKEN_SCOPE_VERSION) { gToken = t; return true; }
    } catch(e){}
    return false;
}
function gTokenLimpiar() {
    gToken = null;
    try { localStorage.removeItem(GTOKEN_KEY); localStorage.removeItem(GTOKEN_EXP_KEY); localStorage.removeItem(GTOKEN_SCOPE_KEY); } catch(e){}
}

// Busca (o crea) la carpeta visible "ControlFinanciero" en el Drive del usuario
function driveEnsureFolder(token, cb) {
    if(_cfFolderId){ cb(_cfFolderId); return; }
    const q = encodeURIComponent(`name='${CF_DRIVE_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,{headers:{Authorization:'Bearer '+token}})
    .then(r=>r.json()).then(data=>{
        if(data.files && data.files.length){ _cfFolderId = data.files[0].id; cb(_cfFolderId); return; }
        fetch('https://www.googleapis.com/drive/v3/files',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({name:CF_DRIVE_FOLDER,mimeType:'application/vnd.google-apps.folder'})})
        .then(r=>r.json()).then(f=>{ _cfFolderId=f.id; cb(_cfFolderId); })
        .catch(()=>{ syncSetBadge('err'); });
    }).catch(()=>{ syncSetBadge('err'); });
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
        driveEnsureFolder(token, folderId=>{
            const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
            const nombre='backup_finanzas_'+ts+'.json';
            const data=JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaTransferenciasUSD,listaComprasUSD,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio,listaInstrumentos,listaAcciones,listaPresupRubros,listaPresupRubrosUSD,listaRubrosUSD,listaIngresos,listaIngresosUSD,listaIngresosPresup,listaPagosTarjeta,listaPagosTarjetaUSD});
            const meta=JSON.stringify({name:nombre,parents:[folderId]});
            const form=new FormData();
            form.append('metadata',new Blob([meta],{type:'application/json'}));
            form.append('file',new Blob([data],{type:'application/json'}));
            fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+token},body:form})
            .then(r=>r.json()).then(f=>{ if(f.id){ _syncPendiente=false; syncSetBadge('ok'); alert('Backup guardado en Drive: '+nombre); } else{alert('Error al subir: '+JSON.stringify(f));gTokenLimpiar();} })
            .catch(e=>{alert('Error: '+e.message);gTokenLimpiar();});
        });
    });
}
function driveRestaurar() {
    driveGetToken(token=>{
        driveEnsureFolder(token, folderId=>{
            const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
            fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime+desc&pageSize=50`,{headers:{Authorization:'Bearer '+token}})
            .then(r=>r.json()).then(data=>{
                // Listar todos los backups: manuales + autosync
                const arch=(data.files||[]).filter(f=>f.name.startsWith('backup_'));
                mostrarModalDrive(arch,token);
            }).catch(e=>{alert('Error al listar Drive: '+e.message);gTokenLimpiar();});
        });
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

function _ypfSetUI(precioARS, dolar, horaStr, fuera, cantParam) {
    const ypfAcc = listaAcciones.find(function(a){ return a.ticker && a.ticker.toUpperCase().includes('YPF'); });
    const cant = cantParam || (ypfAcc ? ypfAcc.cant : 442);
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
        const yUrl = 'https://query2.finance.yahoo.com/v8/finance/chart/'+ticker+'?interval=1d&range=5d';
        const data = await fetchViaProxyJSON(yUrl);
        if(!data || !data.chart || !data.chart.result || !data.chart.result[0]) throw new Error('respuesta sin datos de cotización');
        const precioARS = data.chart.result[0].meta.regularMarketPrice || 0;

        let dolar = _dolarOficial || tipoCambio || 0;
        if(!dolar) {
            const rd = await fetch('https://api.bluelytics.com.ar/v2/latest');
            const dd = await rd.json();
            dolar = dd.oficial.value_sell;
            _dolarOficial = dolar;
        }

        const horaStr = ahora.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
        _ypfCache = {precioARS, dolar, horaStr, fuera: !esHorario};
        _ypfSetUI(precioARS, dolar, horaStr, !esHorario, ypfAcc ? ypfAcc.cant : undefined);
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
        const fStr = cfFechaLocal(fecha);
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

function iniciarTimerYPF(skipImmediate) {
    clearInterval(_ypfTimer);
    // skipImmediate: en la pestaña Inversiones, actualizarInversiones() ya trae la cotización
    // de YPF (si está en listaAcciones) y actualiza este mismo widget — evita pedirla 2 veces.
    if(!skipImmediate) actualizarYPF();
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
            tbl += `<td style="padding:7px 8px;text-align:right;">
<div style="font-weight:bold;color:${color};font-size:10px;">${fmt(v)}</div>
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
                tUSD += '<td style="padding:7px 8px;text-align:right;"><div style="font-weight:bold;color:'+color+';font-size:10px;">'+fmtUSD(v)+'</div></td>';
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


// ════════════════════════════════════════════════════
//  MÓDULO GMAIL API · Control Financiero Producción
//  Detección automática mails Santander
// ════════════════════════════════════════════════════

const CF_SANTANDER_QUERY = '(subject:(Pagaste OR "débito automático" OR "débito con tu") OR from:info@mercadopago.com OR (from:eduardo.bodega@gmail.com has:attachment)) newer_than:30d';
const CF_COMPROBANTE_REMITENTE = 'eduardo.bodega@gmail.com';

function cfEsMovil() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Los IDs se guardan con timestamp para podar por antigüedad en vez de por cantidad fija:
// así nunca se "cae" del registro un ID que todavía podría reaparecer en la búsqueda de
// Gmail (que mira los últimos 30 días) y el mail no vuelve a mostrarse como si fuera nuevo.
const CF_GMAIL_PROCESSED_DIAS = 45; // > 30 días de la query, con margen

function cfGmailGetProcessed() {
    let lista;
    try { lista = JSON.parse(localStorage.getItem(CF_GMAIL_PROCESSED_KEY)) || []; } catch(e) { return []; }
    const ahora = Date.now();
    lista = lista.map(x => typeof x === 'string' ? { id: x, ts: ahora } : x); // migración formato viejo
    const limite = ahora - CF_GMAIL_PROCESSED_DIAS * 86400000;
    return lista.filter(x => x.ts >= limite);
}

function cfGmailMarkProcessed(id) {
    const lista = cfGmailGetProcessed();
    if (!lista.some(x => x.id === id)) {
        lista.push({ id, ts: Date.now() });
        try { localStorage.setItem(CF_GMAIL_PROCESSED_KEY, JSON.stringify(lista)); } catch(e) {}
    }
}

function cfGmailIsProcessed(id) { return cfGmailGetProcessed().some(x => x.id === id); }

function cfGmailDecodeBody(encoded) {
    try {
        const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    } catch(e) { return ''; }
}

function cfGmailExtraerTexto(payload) {
    if (!payload) return '';
    if (payload.body && payload.body.data) return cfGmailDecodeBody(payload.body.data);
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body && part.body.data)
                return cfGmailDecodeBody(part.body.data);
        }
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body && part.body.data)
                return cfGmailDecodeBody(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (part.parts) { const sub = cfGmailExtraerTexto(part); if (sub) return sub; }
        }
    }
    return '';
}

function cfParsearMailSantander(texto) {
    if (!texto) return null;
    const esSantander = /santander/i.test(texto) && /monto|consumo|d.?bito/i.test(texto);
    if (!esSantander) return null;
    const t = texto.replace(/\*/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const resultado = { moneda: 'ARS', monto: null, comercio: '', fecha: '', hora: '', cuotas: null, tarjeta: '', tipo_tarjeta: 'Tarjeta', tipo: 'gasto' };
    const rUSD = /Monto\s*(?:\n\s*)?U\$S\s?([\d.,]+)/i.exec(t);
    const rARS = /Monto\s*(?:\n\s*)?\$([\d.,]+)/i.exec(t);
    if (rUSD) { resultado.moneda = 'USD'; resultado.monto = parseFloat(rUSD[1].replace(/\./g,'').replace(',','.')); }
    else if (rARS) { resultado.moneda = 'ARS'; resultado.monto = parseFloat(rARS[1].replace(/\./g,'').replace(',','.')); }
    const rCuotas  = /Cuotas\s*(?:\n\s*)?(\d+)/i.exec(t);
    if (rCuotas) resultado.cuotas = parseInt(rCuotas[1]);
    const rComercio = /Comercio\s*(?:\n\s*)?([A-ZÁÉÍÓÚÑ0-9 .*\-&]+)/i.exec(t);
    if (rComercio) resultado.comercio = rComercio[1].trim();
    const rFecha = /Fecha\s*(?:\n\s*)?(\d{2})\/(\d{2})\/(\d{4})/i.exec(t);
    if (rFecha) resultado.fecha = `${rFecha[3]}-${rFecha[2]}-${rFecha[1]}`;
    const rHora = /Hora\s*(?:\n\s*)?(\d{2}:\d{2})/i.exec(t);
    if (rHora) resultado.hora = rHora[1];
    const rTarjeta = /terminada en (\d{4})/i.exec(t);
    if (rTarjeta) resultado.tarjeta = rTarjeta[1];
    if (/american express|amex/i.test(t)) resultado.tipo_tarjeta = 'Amex';
    else if (/visa/i.test(t)) resultado.tipo_tarjeta = 'Visa Crédito';
    resultado.tipo = (resultado.cuotas && resultado.cuotas > 1) ? 'cuota' : 'gasto';
    return resultado;
}

function cfParsearMailMercadoPago(texto) {
    if (!texto) return null;
    const esMP = /mercado\s*pago/i.test(texto) && /(pagaste|compraste)/i.test(texto);
    if (!esMP) return null;
    const t = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const resultado = { moneda: 'ARS', monto: null, comercio: '', fecha: '', hora: '', cuotas: null, tarjeta: '', tipo_tarjeta: 'Tarjeta', tipo: 'gasto', origen: 'MercadoPago' };
    const rComercio = /Le compraste a\s*([^\n]+)/i.exec(t);
    if (rComercio) resultado.comercio = rComercio[1].trim();
    const rMonto = /Pagaste\s*\$\s?([\d.,]+)/i.exec(t);
    if (rMonto) resultado.monto = parseFloat(rMonto[1].replace(/\./g, '').replace(',', '.'));
    const rCuotas = /(\d+)\s*cuota/i.exec(t);
    if (rCuotas) resultado.cuotas = parseInt(rCuotas[1]);
    const rTarjeta = /\*{2,4}\s?(\d{4})/.exec(t);
    if (rTarjeta) resultado.tarjeta = rTarjeta[1];
    if (/american express|amex/i.test(t)) resultado.tipo_tarjeta = 'Amex';
    else if (/visa/i.test(t)) resultado.tipo_tarjeta = 'Visa Crédito';
    else if (/santander/i.test(t)) resultado.tipo_tarjeta = 'Santander Crédito';
    resultado.tipo = (resultado.cuotas && resultado.cuotas > 1) ? 'cuota' : 'gasto';
    return resultado;
}

const CF_MP_TRANSFER_RUBROS = {
    'carlos alfredo irrera': 'Sodero',
    'miguel angel torres': 'Jardinero',
    'edgardo sebastian soria': 'Delivery',
    'elvira reina tito': 'Carnicería / Verdulería'
};

function cfNormalizarNombre(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function cfGmailHeader(payload, nombre) {
    if (!payload || !payload.headers) return '';
    const h = payload.headers.find(x => x.name && x.name.toLowerCase() === nombre.toLowerCase());
    return h ? h.value : '';
}

function cfGmailBuscarAdjunto(payload) {
    if (!payload) return null;
    if (payload.body && payload.body.attachmentId && payload.filename) {
        return { attachmentId: payload.body.attachmentId, mimeType: payload.mimeType || '', filename: payload.filename };
    }
    if (payload.parts) {
        for (const part of payload.parts) {
            const r = cfGmailBuscarAdjunto(part);
            if (r) return r;
        }
    }
    return null;
}

function cfGmailB64UrlToB64(s) {
    return s.replace(/-/g, '+').replace(/_/g, '/');
}

async function cfGmailDescargarAdjunto(token, messageId, attachmentId) {
    const resp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        { headers: { Authorization: 'Bearer ' + token } });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data && data.data ? cfGmailB64UrlToB64(data.data) : null;
}

function cfParsearMailMercadoPagoTransferencia(texto) {
    if (!texto) return null;
    const esTransf = /ya enviamos tu transferencia/i.test(texto);
    if (!esTransf) return null;
    const t = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const resultado = { moneda: 'ARS', monto: null, comercio: '', fecha: '', hora: '', cuotas: null, tarjeta: '', tipo_tarjeta: 'Transferencia', tipo: 'gasto', origen: 'MercadoPago' };
    const rMonto = /transferencia de\s*\$\s?([\d.,]+)/i.exec(t);
    if (rMonto) resultado.monto = parseFloat(rMonto[1].replace(/\./g, '').replace(',', '.'));
    const rNombre = /Nombre y apellido:\s*([^\n]+)/i.exec(t);
    if (rNombre) resultado.comercio = rNombre[1].trim();
    const rubro = CF_MP_TRANSFER_RUBROS[cfNormalizarNombre(resultado.comercio)];
    if (rubro) resultado.rubroSugerido = rubro;
    resultado.tipo = 'gasto';
    return resultado;
}

async function cfGmailBuscarGastos(token) {
    const query = encodeURIComponent(CF_SANTANDER_QUERY);
    const resp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=20`, { headers: { Authorization: 'Bearer ' + token } });
    if (!resp.ok) { console.error('[CF Gmail] Error:', resp.status); return []; }
    const data = await resp.json();
    if (!data.messages || !data.messages.length) return [];
    const gastos = [];
    for (const msg of data.messages) {
        if (cfGmailIsProcessed(msg.id)) continue;
        const det = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json());
        const texto = cfGmailExtraerTexto(det.payload);
        let datos = cfParsearMailSantander(texto) || cfParsearMailMercadoPago(texto) || cfParsearMailMercadoPagoTransferencia(texto);

        // Sin match de texto: si es un reenvío tuyo con adjunto, tratarlo como comprobante manual
        if (!datos) {
            const from = cfGmailHeader(det.payload, 'From');
            const esReenvioComprobante = from && from.toLowerCase().includes(CF_COMPROBANTE_REMITENTE);
            if (esReenvioComprobante) {
                const adj = cfGmailBuscarAdjunto(det.payload);
                if (adj) {
                    const b64 = await cfGmailDescargarAdjunto(token, msg.id, adj.attachmentId);
                    if (b64) {
                        datos = { moneda: 'ARS', monto: null, comercio: '', fecha: '', hora: '', cuotas: null, tarjeta: '', tipo_tarjeta: 'Transferencia', tipo: 'gasto', origen: 'Comprobante MP' };
                        const rubro = CF_MP_TRANSFER_RUBROS[cfNormalizarNombre(texto)];
                        if (rubro) datos.rubroSugerido = rubro;
                        datos._attachmentDataUrl = `data:${adj.mimeType || 'image/jpeg'};base64,${b64}`;
                        datos._attachmentEsPdf = /pdf/i.test(adj.mimeType || '');
                    }
                }
            }
        }

        if (datos) {
            if (!datos.fecha && det.internalDate) {
                const d = new Date(parseInt(det.internalDate));
                datos.fecha = cfFechaLocal(d);
            }
            datos._gmailId = msg.id;
            gastos.push(datos);
        }
    }
    return gastos;
}

function cfGmailYaRegistrado(datos) {
    const needle = (datos.comercio || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const fecha  = datos.fecha || '';
    const monto  = datos.monto || 0;
    const enARS = listaCorrientes.some(c => Math.abs(c.monto - monto) < 0.01 && c.fechaPago === fecha && (c.detalle || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(needle));
    const enUSD = listaCorrientesUSD.some(c => Math.abs(c.monto - monto) < 0.01 && c.fechaPago === fecha && (c.detalle || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(needle));
    const enServ = listaServicios.some(s => Math.abs((s.pagado || 0) - monto) < 0.01 && s.fPago === fecha);
    const enServUSD = listaServiciosUSD.some(s => Math.abs((s.pagado || 0) - monto) < 0.01 && s.fPago === fecha);
    return enARS || enUSD || enServ || enServUSD;
}

function cfBuscarServicioMatch(comercio, esUSD) {
    const lista = esUSD ? listaServiciosUSD : listaServicios;
    if (!comercio || !lista || !lista.length) return null;
    const needle = comercio.toLowerCase().replace(/[^a-z0-9]/g, '');
    return lista.find(s => {
        if (s.pagado >= s.presupuesto && s.presupuesto > 0) return false;
        const hay = (s.nombre || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (needle.length >= 4 && hay.includes(needle.substring(0, Math.min(needle.length, 8)))) return true;
        if (hay.length >= 4 && needle.includes(hay.substring(0, Math.min(hay.length, 8)))) return true;
        return false;
    }) || null;
}

let cfGmailQueue = [];
let cfGmailIdx   = 0;
let cfGmailDatosActual = null; // mail atado al modal actualmente abierto (no depende del índice de la cola)

function cfGmailMostrarSiguiente() {
    if (cfGmailIdx >= cfGmailQueue.length) return;
    const datos = cfGmailQueue[cfGmailIdx];
    if (cfGmailYaRegistrado(datos)) {
        console.log('[CF Gmail] Duplicado detectado, saltando:', datos.comercio, datos.fecha);
        if (datos._gmailId) cfGmailMarkProcessed(datos._gmailId);
        cfGmailIdx++;
        if (cfGmailIdx < cfGmailQueue.length) setTimeout(cfGmailMostrarSiguiente, 200);
        return;
    }
    const servicioMatch = cfBuscarServicioMatch(datos.comercio, datos.moneda === 'USD');
    if (servicioMatch) {
        cfAbrirModalPagoServicio(datos, servicioMatch);
    } else {
        cfAbrirModalGasto(datos);
    }
}

function cfGmailLoginYChequear() {
    gTokenLimpiar();
    driveCargarGoogle(() => {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GDRIVE_CLIENT_ID, scope: GDRIVE_SCOPE,
            callback: resp => {
                if (resp.error) { alert('Error Google: ' + resp.error); return; }
                gTokenGuardar(resp.access_token, resp.expires_in);
                cfGmailChequear(true);
            }
        });
        client.requestAccessToken({ prompt: 'consent' });
    });
}

async function cfGmailChequear(manual = false) {
    if (document.getElementById('cf-gmail-overlay')) return; // no pisar la cola mientras hay un modal abierto
    if (cfEsMovil() && !manual) return; // en mobile solo corre si es chequeo manual (ej. tras login desde 🔍 Pendientes)
    if (manual) cfGmailToast('🔄 Revisando mails...');
    if (!gTokenCargarLocal()) {
        // Token vencido o ausente: intentar renovar en silencio (sin popup) si hay sesión Google activa
        const renovado = await new Promise(resolve => {
            driveGetToken(t => resolve(!!t));
            setTimeout(() => resolve(false), 8000);
        });
        if (!renovado) {
            console.log('[CF Gmail] Sin token válido y no se pudo renovar en silencio.');
            cfGmailToast('⚠️ Gmail: sesión vencida. Tocá 📧 Gmail para reautenticar.', true);
            return;
        }
    }
    console.log('[CF Gmail] Chequeando mails Santander...');
    try {
        const gastos = await cfGmailBuscarGastos(gToken);
        if (!gastos.length) {
            console.log('[CF Gmail] Sin gastos nuevos.');
            if (manual) cfGmailToast('✅ Sin mails pendientes.');
            return;
        }
        console.log(`[CF Gmail] ${gastos.length} gasto(s) nuevo(s).`);
        if (manual) cfGmailToast(`📬 ${gastos.length} gasto(s) nuevo(s) encontrado(s).`);
        cfGmailQueue = gastos;
        cfGmailIdx   = 0;
        setTimeout(cfGmailMostrarSiguiente, manual ? 800 : 5500);
    } catch(e) {
        console.error('[CF Gmail] Error:', e.message);
        if (manual) cfGmailToast('❌ Error al revisar mails.', true);
    }
}

// Botón "🔍 Pendientes" — chequeo manual, habilitado también en mobile.
// Usa el token existente sin forzar relogin; si no hay token válido, pide login (una vez).
async function cfRevisarPendientes() {
    if (document.getElementById('cf-gmail-overlay')) { cfGmailToast('⏳ Terminá de revisar el mail actual primero.'); return; }
    cfGmailToast('🔄 Revisando mails pendientes...');
    if (!gTokenCargarLocal()) {
        const renovado = await new Promise(resolve => {
            driveGetToken(t => resolve(!!t));
            setTimeout(() => resolve(false), 8000);
        });
        if (!renovado) {
            cfGmailLoginYChequear();
            return;
        }
    }
    try {
        const gastos = await cfGmailBuscarGastos(gToken);
        if (!gastos.length) {
            cfGmailToast('✅ Sin mails pendientes.');
            return;
        }
        cfGmailToast(`📬 ${gastos.length} gasto(s) pendiente(s) encontrado(s).`);
        cfGmailQueue = gastos;
        cfGmailIdx   = 0;
        setTimeout(cfGmailMostrarSiguiente, 800);
    } catch(e) {
        console.error('[CF Revisar Pendientes] Error:', e.message);
        cfGmailToast('❌ Error al revisar mails.', true);
    }
}

function cfGmailToast(msg, esError = false) {
    const prev = document.getElementById('cf-gmail-toast');
    if (prev) prev.remove();
    const t = document.createElement('div');
    t.id = 'cf-gmail-toast';
    t.style.cssText = `position:fixed;bottom:20px;right:20px;background:${esError ? '#dc2626' : '#0f766e'};color:white;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;z-index:2147483647;box-shadow:0 4px 16px rgba(0,0,0,0.35);`;
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), esError ? 5000 : 3500);
}

// Renovación silenciosa periódica del token (evita que expire mientras la app está abierta)
setInterval(() => {
    if (cfEsMovil()) return;
    if (!gToken) return; // solo renovamos si ya hubo login en esta sesión
    driveGetToken(() => {});
}, 50 * 60 * 1000);

function abrirModalPagoTarjeta(tarjetaId) {
    const t = listaTarjetas.find(x => x.id === tarjetaId);
    if (!t) return;
    const prev = document.getElementById('cf-gmail-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cf-gmail-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.72);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';

    const fechaHoy = cfFechaLocal();
    const opsBancos = listaBancos.map(b => `<option value="${b.id}">🏦 ${b.nombre} (${fmt(b.saldo)})</option>`).join('');

    overlay.innerHTML = `
    <div style="background:#1e293b;border-radius:14px;width:100%;max-width:420px;padding:20px 18px 24px;box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#f1f5f9;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;border-bottom:1px solid #334155;padding-bottom:12px;">
            <span style="font-size:24px;">💳</span>
            <h3 style="font-size:15px;font-weight:700;color:#f1f5f9;margin:0;flex:1;">Pagar tarjeta</h3>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px 12px;margin-bottom:14px;border-left:3px solid #a855f7;">
            <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${t.nombre}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Saldo total: $${(t.saldo||0).toLocaleString('es-AR')} · Vence ahora: $${(t.vencimiento||0).toLocaleString('es-AR')}</div>
        </div>
        ${!listaBancos.length ? '<div style="font-size:12px;color:#fca5a5;margin-bottom:14px;">No hay bancos cargados. Registrá un banco primero.</div>' : `
        <div style="margin-bottom:11px;">
            <label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Sale del banco</label>
            <select id="cf-pt-banco" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">${opsBancos}</select>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <div style="flex:1;">
                <label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Monto</label>
                <input type="number" id="cf-pt-monto" step="1" value="${Math.round(t.vencimiento||0)}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
            </div>
            <div style="flex:1;">
                <label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Fecha</label>
                <input type="date" id="cf-pt-fecha" value="${fechaHoy}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
            </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button onclick="confirmarPagoTarjeta('${t.id}')" style="flex:1;padding:12px;border-radius:10px;font-size:14px;font-weight:700;border:none;background:#a855f7;color:white;cursor:pointer;">✓ Confirmar pago</button>
        </div>`}
        <div style="display:flex;gap:8px;">
            <button onclick="cfCerrarModalGasto()" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:600;border:1.5px solid #334155;background:#0f172a;color:#94a3b8;cursor:pointer;">✕ Cancelar</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
}
function confirmarPagoTarjeta(tarjetaId) {
    const t = listaTarjetas.find(x => x.id === tarjetaId);
    if (!t) return;
    const bancoId = vGet('cf-pt-banco');
    const monto = parseFloat(document.getElementById('cf-pt-monto').value) || 0;
    const fecha = document.getElementById('cf-pt-fecha').value || cfFechaLocal();
    if (!bancoId) { alert('Elegí un banco de origen.'); return; }
    if (monto <= 0) { alert('El monto no es válido.'); return; }
    const banco = listaBancos.find(b => b.id === bancoId);
    if (!banco) { alert('Banco no encontrado.'); return; }

    banco.saldo -= monto;
    t.saldo -= monto;
    t.vencimiento = Math.max(0, (t.vencimiento||0) - monto);
    listaPagosTarjeta.push({ id: 'pt_' + Date.now(), tarjetaId: t.id, tarjetaNombre: t.nombre, bancoId, bancoNombre: banco.nombre, monto, fecha });

    guardar();
    cfCerrarModalGasto();
    render();
    cfGmailToast('✅ ' + t.nombre + ' -' + fmt(monto));
}
function elimPagoTarjeta(id) {
    const p = listaPagosTarjeta.find(x => x.id === id);
    if (!p) return;
    if (!confirm('¿Deshacer este pago? Se revierte el monto al banco y a la tarjeta.')) return;
    const banco = listaBancos.find(b => b.id === p.bancoId);
    const tarjeta = listaTarjetas.find(t => t.id === p.tarjetaId);
    if (banco) banco.saldo += p.monto;
    if (tarjeta) { tarjeta.saldo += p.monto; tarjeta.vencimiento = (tarjeta.vencimiento||0) + p.monto; }
    listaPagosTarjeta = listaPagosTarjeta.filter(x => x.id !== id);
    guardar(); render();
}
function abrirModalPagoTarjetaUSD(tarjetaId) {
    const t = listaTarjetasUSD.find(x => x.id === tarjetaId);
    if (!t) return;
    const prev = document.getElementById('cf-gmail-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cf-gmail-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.72);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';

    const fechaHoy = cfFechaLocal();
    const opsCuentas = listaCuentasUSD.map(c => `<option value="${c.id}">🏦 ${c.nombre} (${fmtUSD(c.saldo)})</option>`).join('');

    overlay.innerHTML = `
    <div style="background:#1e293b;border-radius:14px;width:100%;max-width:420px;padding:20px 18px 24px;box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#f1f5f9;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;border-bottom:1px solid #334155;padding-bottom:12px;">
            <span style="font-size:24px;">💳</span>
            <h3 style="font-size:15px;font-weight:700;color:#f1f5f9;margin:0;flex:1;">Pagar tarjeta USD</h3>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px 12px;margin-bottom:14px;border-left:3px solid #a855f7;">
            <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${t.nombre}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Saldo total: ${fmtUSD(t.saldo||0)} · Vence ahora: ${fmtUSD(t.vencimiento||0)}</div>
        </div>
        ${!listaCuentasUSD.length ? '<div style="font-size:12px;color:#fca5a5;margin-bottom:14px;">No hay cuentas USD cargadas. Registrá una cuenta USD primero.</div>' : `
        <div style="margin-bottom:11px;">
            <label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Sale de la cuenta</label>
            <select id="cf-ptu-cuenta" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">${opsCuentas}</select>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <div style="flex:1;">
                <label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Monto (USD)</label>
                <input type="number" id="cf-ptu-monto" step="0.01" value="${Math.round((t.vencimiento||0)*100)/100}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
            </div>
            <div style="flex:1;">
                <label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Fecha</label>
                <input type="date" id="cf-ptu-fecha" value="${fechaHoy}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
            </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button onclick="confirmarPagoTarjetaUSD('${t.id}')" style="flex:1;padding:12px;border-radius:10px;font-size:14px;font-weight:700;border:none;background:#a855f7;color:white;cursor:pointer;">✓ Confirmar pago</button>
        </div>`}
        <div style="display:flex;gap:8px;">
            <button onclick="cfCerrarModalGasto()" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:600;border:1.5px solid #334155;background:#0f172a;color:#94a3b8;cursor:pointer;">✕ Cancelar</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
}
function confirmarPagoTarjetaUSD(tarjetaId) {
    const t = listaTarjetasUSD.find(x => x.id === tarjetaId);
    if (!t) return;
    const cuentaId = vGet('cf-ptu-cuenta');
    const monto = parseFloat(document.getElementById('cf-ptu-monto').value) || 0;
    const fecha = document.getElementById('cf-ptu-fecha').value || cfFechaLocal();
    if (!cuentaId) { alert('Elegí una cuenta USD de origen.'); return; }
    if (monto <= 0) { alert('El monto no es válido.'); return; }
    const cuenta = listaCuentasUSD.find(c => c.id === cuentaId);
    if (!cuenta) { alert('Cuenta USD no encontrada.'); return; }

    cuenta.saldo -= monto;
    t.saldo -= monto;
    t.vencimiento = Math.max(0, (t.vencimiento||0) - monto);
    listaPagosTarjetaUSD.push({ id: 'ptu_' + Date.now(), tarjetaId: t.id, tarjetaNombre: t.nombre, cuentaId, cuentaNombre: cuenta.nombre, monto, fecha });

    guardar();
    cfCerrarModalGasto();
    renderDolares();
    cfGmailToast('✅ ' + t.nombre + ' -' + fmtUSD(monto));
}
function elimPagoTarjetaUSD(id) {
    const p = listaPagosTarjetaUSD.find(x => x.id === id);
    if (!p) return;
    if (!confirm('¿Deshacer este pago? Se revierte el monto a la cuenta USD y a la tarjeta.')) return;
    const cuenta = listaCuentasUSD.find(c => c.id === p.cuentaId);
    const tarjeta = listaTarjetasUSD.find(t => t.id === p.tarjetaId);
    if (cuenta) cuenta.saldo += p.monto;
    if (tarjeta) { tarjeta.saldo += p.monto; tarjeta.vencimiento = (tarjeta.vencimiento||0) + p.monto; }
    listaPagosTarjetaUSD = listaPagosTarjetaUSD.filter(x => x.id !== id);
    guardar(); renderDolares();
}
function cfAbrirModalPagoServicio(datos, servicio) {
    cfGmailDatosActual = datos;
    const prev = document.getElementById('cf-gmail-overlay');
    if (prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.id = 'cf-gmail-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.72);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    const fechaHoy = cfFechaLocal();
    const montoPago = datos.monto ? datos.monto.toFixed(2) : (servicio.presupuesto || 0).toFixed(2);
    overlay.innerHTML = `
    <div style="background:#1e293b;border-radius:14px;width:100%;max-width:420px;padding:20px 18px 24px;box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#f1f5f9;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;border-bottom:1px solid #334155;padding-bottom:12px;">
            <span style="font-size:24px;">🔧</span>
            <h3 style="font-size:15px;font-weight:700;color:#f1f5f9;margin:0;flex:1;">Pago de servicio fijo</h3>
            <span style="font-size:10px;background:#0f766e;color:white;padding:2px 7px;border-radius:20px;font-weight:600;">${datos.origen || 'Santander'}</span>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px 12px;margin-bottom:14px;border-left:3px solid #0f766e;">
            <div style="font-size:13px;font-weight:700;color:#f1f5f9;">${servicio.nombre}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Presupuesto: $${(servicio.presupuesto||0).toLocaleString('es-AR')} · Pagado: $${(servicio.pagado||0).toLocaleString('es-AR')}</div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:11px;">
            <div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Monto pagado</label>
            <input type="number" id="cf-gm-srv-monto" step="0.01" value="${montoPago}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;"></div>
            <div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Fecha de pago</label>
            <input type="date" id="cf-gm-srv-fecha" value="${datos.fecha || fechaHoy}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;"></div>
        </div>
        <div style="font-size:11px;color:#64748b;margin-bottom:14px;">Comercio: <span style="color:#94a3b8;font-weight:600;">${datos.comercio}</span> · ${datos.tipo_tarjeta} terminada en ${datos.tarjeta}</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button onclick="cfConfirmarPagoServicio('${servicio.id}')" style="flex:1;padding:12px;border-radius:10px;font-size:14px;font-weight:700;border:none;background:#0f766e;color:white;cursor:pointer;">✓ Asentar pago</button>
        </div>
        <div style="display:flex;gap:8px;">
            <button onclick="cfModalPagoACorriente()" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:600;border:1.5px solid #334155;background:#0f172a;color:#94a3b8;cursor:pointer;">↩ Registrar como gasto corriente</button>
            <button onclick="cfCerrarModalGasto()" style="flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:600;border:1.5px solid #334155;background:#0f172a;color:#94a3b8;cursor:pointer;">✕ Cancelar</button>
        </div>
        <button onclick="cfDescartarDefinitivo()" style="width:100%;margin-top:8px;padding:9px;border-radius:10px;font-size:11.5px;font-weight:600;border:1px dashed #64748b;background:transparent;color:#94a3b8;cursor:pointer;">🚫 Descartar definitivamente (no volver a mostrar este mail)</button>
    </div>`;
    document.body.appendChild(overlay);
}

function cfConfirmarPagoServicio(servicioId) {
    const monto = parseFloat(document.getElementById('cf-gm-srv-monto').value);
    const fecha = document.getElementById('cf-gm-srv-fecha').value;
    if (isNaN(monto) || monto <= 0) { alert('El monto no es válido.'); return; }
    let s = listaServicios.find(x => x.id === servicioId);
    let esUSD = false;
    if (!s) { s = listaServiciosUSD.find(x => x.id === servicioId); esUSD = true; }
    if (!s) { alert('Servicio no encontrado.'); return; }
    s.pagado = monto;
    s.fPago  = fecha;
    guardar();
    if (esUSD) { if (typeof renderDolares === 'function') renderDolares(); }
    else { render(); }
    const datos = cfGmailDatosActual;
    if (datos && datos._gmailId) cfGmailMarkProcessed(datos._gmailId);
    const ov = document.getElementById('cf-gmail-overlay');
    if (ov) ov.remove();
    cfGmailIdx++;
    if (cfGmailIdx < cfGmailQueue.length) setTimeout(cfGmailMostrarSiguiente, 600);
}

function cfModalPagoACorriente() {
    const datos = cfGmailDatosActual;
    cfAbrirModalGasto(datos);
}

function cfCerrarModalGasto() {
    // No marcamos como procesado: al cancelar, el mail debe poder reaparecer
    // en el próximo chequeo (ej. tras corregir el nombre del comercio en un fijo).
    const ov = document.getElementById('cf-gmail-overlay');
    if (ov) ov.remove();
    cfGmailIdx++;
    if (cfGmailIdx < cfGmailQueue.length) setTimeout(cfGmailMostrarSiguiente, 400);
}

function cfDescartarDefinitivo() {
    // A diferencia de Cancelar: acá sí marcamos el mail como procesado,
    // para que este mail puntual no vuelva a aparecer nunca más.
    const datos = cfGmailDatosActual;
    if (datos && datos._gmailId) cfGmailMarkProcessed(datos._gmailId);
    const ov = document.getElementById('cf-gmail-overlay');
    if (ov) ov.remove();
    cfGmailIdx++;
    if (cfGmailIdx < cfGmailQueue.length) setTimeout(cfGmailMostrarSiguiente, 400);
}

function cfAbrirModalGasto(datos) {
    cfGmailDatosActual = datos;
    const prev = document.getElementById('cf-gmail-overlay');
    if (prev) prev.remove();
    const esUSD = datos.moneda === 'USD';
    const listaTarjetasActual = esUSD ? listaTarjetasUSD : listaTarjetas;
    // Selección de lista de bancos/cuentas según moneda
    const listaBancosActual = esUSD ? listaCuentasUSD : listaBancos;

    let medioPagoId = '';
    if (datos.tipo_tarjeta) {
        const tipo = datos.tipo_tarjeta.toLowerCase();
        const num  = datos.tarjeta || '';
        if (tipo.includes('transferencia')) {
            const cuentaMP = listaBancosActual.find(b => /mercado\s*pago/i.test(b.nombre));
            if (cuentaMP) medioPagoId = cuentaMP.id;
        } else {
            let tarjeta = listaTarjetasActual.find(t => num && t.nombre && t.nombre.includes(num));
            if (!tarjeta) {
                if (tipo.includes('amex') || tipo.includes('american')) tarjeta = listaTarjetasActual.find(t => /amex|american/i.test(t.nombre));
                else if (tipo.includes('visa')) tarjeta = listaTarjetasActual.find(t => /visa/i.test(t.nombre));
            }
            if (!tarjeta) tarjeta = listaTarjetasActual.find(t => /santander/i.test(t.nombre));
            if (tarjeta) medioPagoId = tarjeta.id;
        }
    }
    const opsBancosMedio = listaBancosActual.map(b => `<option value="${b.id}" ${b.id === medioPagoId ? 'selected' : ''}>🏦 ${b.nombre}</option>`).join('');
    const opsTarjetas = listaTarjetasActual.map(t => `<option value="${t.id}" ${t.id === medioPagoId ? 'selected' : ''}>💳 ${t.nombre}</option>`).join('');
    const listaRubrosActual = esUSD ? listaRubrosUSD : listaRubros;
    const opsRubros = [...listaRubrosActual].sort((a,b) => a.localeCompare(b,'es')).map(r => `<option value="${r}" ${r === datos.rubroSugerido ? 'selected' : ''}>${r}</option>`).join('');
    const fechaHoy = cfFechaLocal();
    const overlay = document.createElement('div');
    overlay.id = 'cf-gmail-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.72);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    overlay.innerHTML = `
    <div style="background:#1e293b;border-radius:14px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto;padding:20px 18px 24px;box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#f1f5f9;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;border-bottom:1px solid #334155;padding-bottom:12px;">
            <span style="font-size:24px;">📧</span>
            <h3 style="font-size:15px;font-weight:700;color:#f1f5f9;margin:0;flex:1;">Gasto detectado</h3>
            <span style="font-size:10px;background:${datos.origen === 'Comprobante MP' ? '#009ee3' : '#ea4335'};color:white;padding:2px 7px;border-radius:20px;font-weight:600;">${datos.origen || 'Santander'}</span>
        </div>
        ${datos._attachmentDataUrl ? `
        <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px;margin-bottom:12px;">
            ${datos._attachmentEsPdf
                ? `<a href="${datos._attachmentDataUrl}" target="_blank" style="display:block;text-align:center;padding:16px;color:#a855f7;font-size:13px;font-weight:600;text-decoration:none;">📄 Ver comprobante PDF</a>`
                : `<img src="${datos._attachmentDataUrl}" style="width:100%;border-radius:6px;display:block;">`}
        </div>
        <div style="font-size:11px;color:#fbbf24;background:#78350f;border-radius:7px;padding:7px 10px;margin-bottom:10px;">✍️ Completá monto y rubro mirando el comprobante.</div>
        ` : (!datos.monto || !datos.comercio) ? `<div style="font-size:12px;color:#fbbf24;background:#78350f;border-radius:7px;padding:7px 10px;margin-bottom:10px;">⚠️ Algunos datos no se detectaron. Revisá los campos.</div>` : ''}
        <div style="display:flex;gap:8px;margin-bottom:11px;">
            <div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Monto</label>
            <input type="number" id="cf-gm-monto" step="0.01" value="${datos.monto ? datos.monto.toFixed(2) : ''}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;"></div>
            <div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Moneda</label>
            <select id="cf-gm-moneda" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
                <option value="ARS" ${datos.moneda==='ARS'?'selected':''}>$ ARS</option>
                <option value="USD" ${datos.moneda==='USD'?'selected':''}>U$S USD</option>
            </select></div>
        </div>
        <div style="margin-bottom:11px;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Comercio / Detalle</label>
        <input type="text" id="cf-gm-detalle" value="${datos.comercio || ''}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
        <div style="font-size:11px;color:#64748b;margin-top:3px;">${datos.tarjeta ? `${datos.tipo_tarjeta} terminada en ${datos.tarjeta}` : datos.tipo_tarjeta}</div></div>
        <div style="display:flex;gap:8px;margin-bottom:11px;">
            <div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Fecha</label>
            <input type="date" id="cf-gm-fecha" value="${datos.fecha || fechaHoy}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;"></div>
            <div style="flex:1;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Cuotas</label>
            <input type="number" id="cf-gm-cuotas" min="1" max="72" value="${datos.cuotas || 1}" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;"></div>
        </div>
        <div style="margin-bottom:11px;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Rubro</label>
        <select id="cf-gm-rubro" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
            <option value="">— Seleccioná rubro —</option>${opsRubros}
        </select></div>
        <div style="margin-bottom:11px;"><label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:4px;">Medio de pago</label>
        <select id="cf-gm-medio" style="width:100%;padding:9px 11px;border:1.5px solid #334155;border-radius:8px;background:#0f172a;color:#f1f5f9;font-size:14px;box-sizing:border-box;">
            <option value="">— Seleccioná medio de pago —</option>${opsBancosMedio}${opsTarjetas}
        </select></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
            <button onclick="cfCerrarModalGasto()" style="flex:1;padding:12px;border-radius:10px;font-size:14px;font-weight:700;border:1.5px solid #334155;background:#0f172a;color:#f1f5f9;cursor:pointer;">✕ Cancelar</button>
            <button onclick="cfConfirmarGasto()" style="flex:1;padding:12px;border-radius:10px;font-size:14px;font-weight:700;border:none;background:#4f46e5;color:white;cursor:pointer;">✓ Registrar gasto</button>
        </div>
        <button onclick="cfDescartarDefinitivo()" style="width:100%;margin-top:8px;padding:9px;border-radius:10px;font-size:11.5px;font-weight:600;border:1px dashed #64748b;background:transparent;color:#94a3b8;cursor:pointer;">🚫 Descartar definitivamente (no volver a mostrar este mail)</button>
    </div>`;
    document.body.appendChild(overlay);
}

function cfConfirmarGasto() {
    const monto   = parseFloat(document.getElementById('cf-gm-monto').value);
    const moneda  = document.getElementById('cf-gm-moneda').value;
    const detalle = document.getElementById('cf-gm-detalle').value.trim();
    const fecha   = document.getElementById('cf-gm-fecha').value;
    const cuotas  = parseInt(document.getElementById('cf-gm-cuotas').value) || 1;
    const rubro   = document.getElementById('cf-gm-rubro').value;
    const medioId = document.getElementById('cf-gm-medio').value;
    if (!detalle)               { alert('Ingresá el detalle del gasto.'); return; }
    if (isNaN(monto)||monto<=0) { alert('El monto no es válido.'); return; }
    if (!rubro)                 { alert('Seleccioná un rubro.'); return; }
    if (!medioId)               { alert('Seleccioná el medio de pago.'); return; }
    const detalleF = moneda === 'USD' ? `[USD ${monto.toFixed(2)}] ${detalle}` : detalle;
    const notasCuota = cuotas > 1 ? ` (${cuotas} cuotas)` : '';
    if (moneda === 'USD') {
        listaCorrientesUSD.push({ id: 'c_' + Date.now(), rubro, detalle: detalleF + notasCuota, monto, fechaPago: fecha, medioPagoId: medioId, esIngreso: false, clase: 'M' });
        const cuentaUSD = listaCuentasUSD.find(c => c.id === medioId);
        if (cuentaUSD) cuentaUSD.saldo -= monto;
    } else {
        listaCorrientes.push({ id: 'c_' + Date.now(), rubro, detalle: detalleF + notasCuota, monto, fechaPago: fecha, medioPagoId: medioId, esIngreso: false, clase: 'M' });
        // El gasto ya nace "pagado" (fechaPago seteada), así que no dispara el toggle
        // prev/next que descuenta saldo en la tabla — lo hacemos acá directo.
        if (esCuentaLiq(medioId)) {
            const bk = listaBancos.find(b => b.id === medioId);
            if (bk) bk.saldo -= monto;
        }
    }
    guardar();
    if (moneda === 'USD') { if (typeof renderDolares === 'function') renderDolares(); }
    else { render(); }
    const datos = cfGmailDatosActual;
    if (datos && datos._gmailId) cfGmailMarkProcessed(datos._gmailId);
    const ov = document.getElementById('cf-gmail-overlay');
    if (ov) ov.remove();
    cfGmailIdx++;
    if (cfGmailIdx < cfGmailQueue.length) setTimeout(cfGmailMostrarSiguiente, 600);
}

