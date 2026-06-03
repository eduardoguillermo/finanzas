// ═══════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════
const K = {
    rubros:'f_r_v2_2', bancos:'f_bancos_v2_4', tarjetas:'f_tarjetas_v2_4',
    servicios:'f_servicios_v2_4', corrientes:'f_corrientes_v2_4',
    transferencias:'f_transferencias_v3', cuotas:'f_cuotas_v3', historico:'f_historico_v3',
    cuentasUSD:'f_cuentasUSD_v3', tarjetasUSD:'f_tarjetasUSD_v3',
    serviciosUSD:'f_serviciosUSD_v3', corrientesUSD:'f_corrientesUSD_v3',
    tipoCambio:'f_tipoCambio_v3'
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
let tabActivo = null;
function leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } }
function guardar() {
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
}

// ═══════════════════════════════════════════
//  FORMATO
// ═══════════════════════════════════════════
function fmt(n)    { return '$ '   + Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtN(n)   { return Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function fmtUSD(n) { return 'USD ' + (Math.round(n*100)/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtARS(n) { return '$ '   + Math.round(n).toLocaleString('es-AR',{maximumFractionDigits:0}); }
function clon(x)   { return JSON.parse(JSON.stringify(x)); }
function parseNum(str) {
    const s=String(str).trim();
    if(s.includes(',')&&s.includes('.')) return s.lastIndexOf(',')>s.lastIndexOf('.')?parseFloat(s.replace(/\./g,'').replace(',','.'))||0:parseFloat(s.replace(/,/g,''))||0;
    if(s.includes(',')){ const p=s.split(','); return p[p.length-1].length<=2?parseFloat(s.replace(',','.'))||0:parseFloat(s.replace(/,/g,''))||0; }
    if(s.includes('.')){ const p=s.split('.'); return p[p.length-1].length<=2?parseFloat(s)||0:parseFloat(s.replace(/\./g,''))||0; }
    return parseFloat(s)||0;
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    renderTabs();
    renderContenido();
    setTimeout(modalVencimientos, 400);
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
    mkTab('<span>💵 Dólares</span>',     tabActivo==='dolares',  ()=>{ tabActivo='dolares';  renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#15803d;border-color:#86efac;');
    mkTab('<span>📈 Reportes</span>',    tabActivo==='reportes', ()=>{ tabActivo='reportes'; renderTabs(); renderContenido(); }, 'background:#f0fdf4;color:#166534;border-color:#86efac;');
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
    if      (tabActivo===null)       { app.appendChild(buildMesActual()); bindMesActual(); render(); }
    else if (tabActivo==='dolares')  { app.appendChild(buildDolares());   bindDolares();   renderDolares(); }
    else if (tabActivo==='reportes') { app.appendChild(buildReportes()); }
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
    if(!b) return false;
    if(b.autoDescontar) return true;
    const n=b.nombre.toLowerCase();
    return n.includes('efectivo')||n.includes('mercado pago')||n.includes('mercadopago');
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
          <h2 style="margin:0;font-size:20px;">Gestión Financiera y Control de Gastos</h2>
          <p class="version-tag">v3.3.0</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-mes"   id="btn-nuevo-mes">🔄 Abrir Nuevo Mes</button>
          <button class="btn btn-blue"  id="btn-exportar">💾 Exportar</button>
          <button class="btn btn-green" id="btn-importar-trigger">📥 Importar</button>
          <input type="file" id="input-backup" accept=".json" style="display:none;">
          <button class="btn no-print"  id="btn-drive-up"   style="background:#4285f4;color:white;">☁️ Drive</button>
          <button class="btn no-print"  id="btn-drive-down" style="background:#4285f4;color:white;">📂 Drive</button>
          <button class="btn btn-dark"  onclick="window.print()">🖨️ PDF</button>
        </div>
      </header>
      <div class="grid-dashboard">
        <div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco Disponible</h4><p id="d-bancos" style="color:#0284c7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Total Deuda Tarjetas</h4><p id="d-tarjetas" style="color:#a855f7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #10b981;"><h4>Total Egresado / Pagado</h4><p id="d-pagado" style="color:#10b981;">$ 0</p></div>
        <div class="card-bal" id="card-pend" style="border-left:5px solid #ef4444;"><h4>Fijos Pendientes</h4><p id="d-pendiente" style="color:#ef4444;">$ 0</p></div>
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
                </div>
                <button type="submit" class="btn btn-add btn-indigo">Configurar Servicio Fijo</button>
              </form>
            </div>
            <table><thead><tr>
              <th style="width:18%">Servicio</th><th style="width:6%" class="tc">Clase</th><th style="width:12%" class="tc">Vto.</th>
              <th style="width:10%" class="tr">Presup.</th><th style="width:10%" class="tr">Pagado</th>
              <th style="width:11%" class="tc">F.Pago</th><th style="width:14%">Medio</th>
              <th style="width:9%" class="tc">Estado</th><th style="width:4%" class="no-print"></th>
            </tr></thead><tbody id="t-servicios"></tbody></table>
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
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                  <input type="checkbox" id="corr-es-ingreso" style="width:16px;height:16px;accent-color:#10b981;cursor:pointer;">
                  <label for="corr-es-ingreso" style="font-size:13px;color:#334155;text-transform:none;font-weight:bold;cursor:pointer;">Es un ingreso</label>
                </div>
                <button type="submit" class="btn btn-add btn-green">Asentar Gasto Corriente</button>
              </form>
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
    g('btn-drive-up')?.addEventListener('click', driveSubir);
    g('btn-drive-down')?.addEventListener('click', driveRestaurar);
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
    if(sRubro){ sRubro.innerHTML=''; listaRubros.forEach(r=>addOpt(sRubro,r,r)); }
    listaRubros.forEach(r=>{
        const b=el('div','rubro-badge'); b.innerHTML=`<span>${r}</span>`;
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
        });
        tdPag.appendChild(inpPag);
        const tr=el('tr');
        [tdHTML(`<b>${s.nombre}</b>`), tdCl, tdInpDate(s.fVto,v=>{ s.fVto=v; guardar(); }),
         tdInpNum(s.presupuesto,v=>{ s.presupuesto=v; guardar(); calcDash(); },'tr'),
         tdPag, tdInpDate(s.fPago,v=>{ s.fPago=v; guardar(); }),
         (()=>{ const td=el('td'); td.appendChild(selMediosPesos(s.medioPagoId,v=>{ s.medioPagoId=v; guardar(); calcDash(); })); return td; })(),
         tdEst, tdBtn('✕',()=>elimServicio(s.id))
        ].forEach(td=>tr.appendChild(td));
        tS.appendChild(tr);
    });
    if(!listaServicios.length) tS.innerHTML='<tr><td colspan="9" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios.</td></tr>';
    renderCuotas();
    // Corrientes
    const wC=document.getElementById('wrap-corrientes');
    if(wC){
        wC.innerHTML='';
        const tbl=el('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;';
        const thead=el('thead'); thead.innerHTML='<tr><th style="width:20%">Rubro</th><th style="width:27%">Detalle</th><th style="width:17%">Medio</th><th style="width:13%;text-align:center;">F. Pago</th><th style="width:15%;text-align:right;">Monto ($)</th><th style="width:8%" class="no-print"></th></tr>';
        const tbody=el('tbody');
        if(!listaCorrientes.length) { tbody.innerHTML='<tr><td colspan="6" class="tc" style="color:#94a3b8;padding:15px;">Sin egresos corrientes.</td></tr>'; }
        else { listaCorrientes.forEach(c=>{
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
            const tdR=el('td'); tdR.appendChild(selR);
            const tdD=el('td'); tdD.appendChild(inpD);
            const tdM=el('td'); tdM.style.color='#64748b'; tdM.innerText=(c.esIngreso?'⬆ ':'')+medioNom(c.medioPagoId);
            const tdFP=el('td','tc'); tdFP.appendChild(inpFP);
            const tdMon=el('td','tr'); tdMon.appendChild(inpM);
            const tdX=el('td','tc no-print'); const bX=el('button','btn-del'); bX.innerText='✕'; bX.onclick=()=>elimCorriente(c.id); tdX.appendChild(bX);
            const tr=el('tr'); [tdR,tdD,tdM,tdFP,tdMon,tdX].forEach(td=>tr.appendChild(td)); tbody.appendChild(tr);
        }); }
        tbl.appendChild(thead); tbl.appendChild(tbody); wC.appendChild(tbl);
    }
    calcDash();
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
    setTxt('d-pagado',   fmt(Math.round(totalPag)));
    setTxt('d-pendiente',fmt(Math.round(fijosPend)));
    const cp=document.getElementById('card-pend'); if(cp) cp.style.borderLeftColor=fijosPend>0?'#ef4444':'#10b981';
}

// ═══════════════════════════════════════════
//  ALTAS PESOS
// ═══════════════════════════════════════════
function altaBanco(e) { e.preventDefault(); listaBancos.push({id:'b_'+Date.now(),nombre:vGet('banco-nombre'),saldo:nGet('banco-saldo'),autoDescontar:false}); guardar(); e.target.reset(); render(); }
function altaTarjeta(e) { e.preventDefault(); listaTarjetas.push({id:'t_'+Date.now(),nombre:vGet('tarjeta-nombre'),saldo:nGet('tarjeta-saldo')}); guardar(); e.target.reset(); render(); }
function altaServicio(e) {
    e.preventDefault();
    const medioId=listaBancos[0]?.id||listaTarjetas[0]?.id||'';
    listaServicios.push({id:'s_'+Date.now(),nombre:vGet('srv-nombre'),presupuesto:nGet('srv-presupuesto'),pagado:0,fVto:vGet('srv-vto'),fPago:'',medioPagoId:medioId,clase:vGet('srv-clase')||'M'});
    guardar(); e.target.reset(); render();
}
function altaCorriente(e) {
    e.preventDefault();
    const medioId=vGet('corr-medio'); if(!medioId){alert('Configure un medio de pago.'); return;}
    const monto=nGet('corr-monto'), esIngreso=document.getElementById('corr-es-ingreso')?.checked||false;
    listaCorrientes.push({id:'c_'+Date.now(),rubro:vGet('corr-rubro'),detalle:vGet('corr-detalle'),monto,fechaPago:'',medioPagoId:medioId,esIngreso});
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
    // Limpiar pesos
    listaServicios.forEach(s=>{ s.pagado=0; s.fPago=''; });
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
    listaServiciosUSD.forEach(s=>{ s.pagado=0; s.fPago=''; });
    listaCorrientesUSD=[];
    guardar(); renderTabs(); renderContenido();
    alert('✅ Mes "'+nombre+sufijo+'" archivado. Nuevo período abierto.');
}

// ═══════════════════════════════════════════
//  BACKUP
// ═══════════════════════════════════════════
function exportar() {
    const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
    const data={listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio};
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
    if(!proximos.length) return;
    const conDias=proximos.map(s=>{ const v=new Date(s.fVto+'T00:00:00'); let dh=0; const cur=new Date(hoy); while(cur<v){cur.setDate(cur.getDate()+1);if(esHabil(cur))dh++;} return {...s,vtoDate:v,diasH:dh}; }).sort((a,b)=>a.vtoDate-b.vtoDate);
    const fmtF=d=>d.toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});
    const items=conDias.map(s=>{ const urg=s.diasH<=2, lbl=s.diasH===0?'¡Hoy!':s.diasH===1?'1 día hábil':s.diasH+' días hábiles'; const pend=s.presupuesto>0?fmt(s.presupuesto-s.pagado):'—'; const sub=s.pagado>0?`Pago parcial · Resta ${pend}`:`Pendiente · ${pend}`; return `<div class="vto-item ${urg?'urgente':'proximo'}"><div><div class="vto-nombre">${s.nombre}</div><div class="vto-sub">${sub}</div></div><div class="vto-fecha"><div class="vto-dias">${lbl}</div><div class="vto-txt">${fmtF(s.vtoDate)}</div></div></div>`; }).join('');
    const ov=el('div','modal-overlay no-print'); ov.id='modal-vto';
    ov.innerHTML=`<div class="modal-box"><div class="modal-header"><span style="font-size:20px;">⚠️</span><h3>Vencimientos en los próximos 5 días hábiles</h3></div><div class="modal-body">${items}</div><div class="modal-footer"><button class="btn btn-dark" onclick="document.getElementById('modal-vto').remove()">Entendido</button></div></div>`;
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
        <div style="display:flex;align-items:center;gap:12px;">
          <label style="font-size:11px;font-weight:bold;color:#16a34a;text-transform:uppercase;">Tipo de cambio (ARS/USD)</label>
          <input id="tc-input" type="number" value="${tipoCambio}" step="1" style="width:130px;padding:8px;border:2px solid #86efac;border-radius:6px;font-size:16px;font-weight:bold;color:#15803d;text-align:right;">
        </div>
      </header>
      <div class="grid-dashboard" style="margin-top:20px;">
        <div class="card-bal" style="border-left:5px solid #16a34a;"><h4>USD Disponibles</h4><p id="usd-disp" style="color:#16a34a;">USD 0</p><small id="usd-disp-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>USD a Pagar (tarjetas)</h4><p id="usd-pagar" style="color:#a855f7;">USD 0</p><small id="usd-pagar-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" id="card-usd-bal" style="border-left:5px solid #f59e0b;"><h4>Balance USD</h4><p id="usd-bal" style="color:#f59e0b;">USD 0</p><small id="usd-bal-ars" style="color:#64748b;font-size:12px;"></small></div>
        <div class="card-bal" id="card-usd-comp" style="border-left:5px solid #94a3b8;"><h4>USD a Comprar</h4><p id="usd-comp" style="color:#94a3b8;">—</p><small id="usd-comp-ars" style="color:#64748b;font-size:12px;"></small></div>
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
            <table><thead><tr><th style="width:35%">Tarjeta</th><th style="width:22%" class="tr">Saldo base</th><th style="width:22%" class="tr">Consumo mes</th><th style="width:16%" class="tr">En pesos</th><th style="width:5%"></th></tr></thead><tbody id="t-tusd"></tbody></table>
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
    g('tc-input')?.addEventListener('input', e=>{ tipoCambio=parseFloat(e.target.value)||1200; guardar(); calcDashUSD(); });
}

function calcMDU() {
    const mDU={};
    listaTarjetasUSD.forEach(t=>mDU[t.id]=0);
    listaCuentasUSD.forEach(c=>mDU[c.id]=0);
    listaServiciosUSD.forEach(s=>{ if(s.pagado>0&&mDU[s.medioPagoId]!==undefined) mDU[s.medioPagoId]+=s.pagado; });
    listaCorrientesUSD.forEach(c=>{ if(mDU[c.medioPagoId]!==undefined) mDU[c.medioPagoId]+=c.monto*(c.esIngreso?-1:1); });
    return mDU;
}

function calcDashUSD() {
    const mDU=calcMDU(), tc=tipoCambio;
    const totalDisp=listaCuentasUSD.reduce((a,c)=>a+c.saldo,0);
    const totalTarj=listaTarjetasUSD.reduce((a,t)=>a+(t.saldo+(mDU[t.id]||0)),0);
    const balance=totalDisp-totalTarj;
    setTxt('usd-disp',      fmtUSD(totalDisp));
    setTxt('usd-disp-ars',  fmtARS(totalDisp*tc));
    setTxt('usd-pagar',     fmtUSD(totalTarj));
    setTxt('usd-pagar-ars', fmtARS(totalTarj*tc));
    setTxt('usd-bal',       fmtUSD(balance));
    setTxt('usd-bal-ars',   fmtARS(Math.abs(balance)*tc));
    const dBal=document.getElementById('usd-bal'), cBal=document.getElementById('card-usd-bal');
    const dComp=document.getElementById('usd-comp'), dCA=document.getElementById('usd-comp-ars'), cComp=document.getElementById('card-usd-comp');
    if(dBal) dBal.style.color=balance>=0?'#16a34a':'#ef4444';
    if(cBal) cBal.style.borderLeftColor=balance>=0?'#16a34a':'#ef4444';
    if(balance<0){ const f=Math.abs(balance); if(dComp){dComp.innerText=fmtUSD(f);dComp.style.color='#ef4444';} if(dCA) dCA.innerText=fmtARS(f*tc); if(cComp) cComp.style.borderLeftColor='#ef4444'; }
    else { if(dComp){dComp.innerText='—';dComp.style.color='#94a3b8';} if(dCA) dCA.innerText=''; if(cComp) cComp.style.borderLeftColor='#94a3b8'; }
    // Actualizar consumo en tabla tarjetas sin reconstruir
    const rowsTU=document.querySelectorAll('#t-tusd tr');
    listaTarjetasUSD.forEach((t,i)=>{ if(rowsTU[i]){ const tds=rowsTU[i].querySelectorAll('td'); const consumo=mDU[t.id]||0; if(tds[2]) tds[2].innerText=consumo>0?fmtUSD(consumo):'—'; if(tds[3]) tds[3].innerText=fmtARS((t.saldo+consumo)*tc); } });
    // Actualizar estado servicios USD
    listaServiciosUSD.forEach(s=>{ const sp=document.getElementById('estu-'+s.id); if(sp){ if(s.pagado>=s.presupuesto&&s.presupuesto>0){sp.innerText='PAGADO';sp.style.background='#e6f4ea';sp.style.color='#137333';} else if(s.pagado>0){sp.innerText='PARCIAL';sp.style.background='#fef7e0';sp.style.color='#b06000';} else{sp.innerText='PENDIENTE';sp.style.background='#fce8e6';sp.style.color='#c5221f';} } });
}

function renderDolares() {
    const tCU=document.getElementById('t-cusd'), tTU=document.getElementById('t-tusd'), tSU=document.getElementById('t-susd');
    if(!tCU) return;
    tCU.innerHTML=''; tTU.innerHTML=''; tSU.innerHTML='';
    const selR=document.getElementById('ccusd-rubro'), selM=document.getElementById('ccusd-medio');
    if(selR){ selR.innerHTML=''; listaRubros.forEach(r=>addOpt(selR,r,r)); }
    if(selM){ selM.innerHTML=''; listaTarjetasUSD.forEach(t=>addOpt(selM,t.id,'💳 '+t.nombre)); listaCuentasUSD.forEach(c=>addOpt(selM,c.id,'🏦 '+c.nombre)); }
    const mDU=calcMDU();
    // Cuentas USD
    let totCU=0;
    listaCuentasUSD.forEach(c=>{ totCU+=c.saldo;
        const inp=inpNumUSD(c.saldo,v=>{ c.saldo=v; guardar(); calcDashUSD(); }); inp.style.color='#16a34a'; inp.style.fontWeight='bold';
        const tdS=el('td','tr'); tdS.appendChild(inp);
        const tdA=el('td','tr'); tdA.style.cssText='color:#64748b;font-size:12px;'; tdA.innerText=fmtARS(c.saldo*tipoCambio);
        tCU.appendChild(fila([tdHTML(`<b>${c.nombre}</b>`),tdS,tdA,tdBtn('✕',()=>elimCuentaUSD(c.id))]));
    });
    if(listaCuentasUSD.length){ const trT=el('tr'); trT.style.background='#f8fafc'; trT.innerHTML=`<td><b>Total</b></td><td class="tr" style="color:#16a34a;font-weight:bold;">${fmtUSD(totCU)}</td><td class="tr" style="font-weight:bold;">${fmtARS(totCU*tipoCambio)}</td><td></td>`; tCU.appendChild(trT); }
    else tCU.innerHTML='<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin cuentas USD.</td></tr>';
    // Tarjetas USD
    let totTU=0;
    listaTarjetasUSD.forEach(t=>{ const consumo=mDU[t.id]||0, total=t.saldo+consumo; totTU+=total;
        const inp=inpNumUSD(t.saldo,v=>{ t.saldo=v; guardar(); calcDashUSD(); }); inp.style.color='#a855f7'; inp.style.fontWeight='bold';
        const tdS=el('td','tr'); tdS.appendChild(inp);
        const tdC=el('td','tr'); tdC.style.cssText='color:#6366f1;font-size:12px;font-weight:bold;'; tdC.innerText=consumo>0?fmtUSD(consumo):'—';
        const tdA=el('td','tr'); tdA.style.cssText='color:#64748b;font-size:12px;'; tdA.innerText=fmtARS(total*tipoCambio);
        tTU.appendChild(fila([tdHTML(`<b>${t.nombre}</b>`),tdS,tdC,tdA,tdBtn('✕',()=>elimTarjetaUSD(t.id))]));
    });
    if(listaTarjetasUSD.length){ const trT=el('tr'); trT.style.background='#f8fafc'; trT.innerHTML=`<td><b>Total</b></td><td></td><td class="tr" style="color:#a855f7;font-weight:bold;">${fmtUSD(totTU)}</td><td class="tr" style="font-weight:bold;">${fmtARS(totTU*tipoCambio)}</td><td></td>`; tTU.appendChild(trT); }
    else tTU.innerHTML='<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin tarjetas USD.</td></tr>';
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
            const selR2=el('select'); selR2.className='inp'; listaRubros.forEach(r=>addOpt(selR2,r,r,r===c.rubro)); selR2.onchange=e=>{ c.rubro=e.target.value; guardar(); };
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

// ═══════════════════════════════════════════
//  REPORTES
// ═══════════════════════════════════════════
function buildReportes() {
    const wrap=el('div','container'); wrap.style.paddingTop='20px';
    const hdr=el('div'); hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #4f46e5;';
    hdr.innerHTML=`<div><h2 style="margin:0;font-size:22px;color:#1e293b;">📈 Reportes Financieros</h2><p style="margin:4px 0 0;font-size:12px;color:#64748b;">${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}</p></div><button onclick="window.print()" class="btn btn-dark no-print" style="font-size:12px;padding:8px 14px;">🖨️ Imprimir</button>`;
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

    // Gráfico torta
    const srvConPres=[...listaServicios.filter(s=>s.presupuesto>0)].sort((a,b)=>b.presupuesto-a.presupuesto);
    if(srvConPres.length>0){
        const paleta=['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];
        const totT2=srvConPres.reduce((a,s)=>a+s.presupuesto,0);
        const divT=el('div'); divT.style.cssText='background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:20px;margin-bottom:16px;';
        divT.innerHTML=`<h4 style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 Distribución Presupuesto · Servicios Fijos</h4><div style="display:flex;align-items:flex-start;justify-content:center;gap:32px;flex-wrap:wrap;"><div id="torta-wrap"></div><div id="torta-ley" style="max-height:320px;overflow-y:auto;"></div></div>`;
        wrap.appendChild(divT);
        setTimeout(()=>{
            const tw=document.getElementById('torta-wrap'); if(!tw) return;
            const cv=el('canvas'); cv.width=300; cv.height=300; tw.appendChild(cv);
            const ctx=cv.getContext('2d'); const cx=150,cy=150,r=120,ri=60; let ang=-Math.PI/2;
            srvConPres.forEach((s,i)=>{ const pct=s.presupuesto/totT2,a2=ang+pct*2*Math.PI,col=paleta[i%paleta.length]; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,a2); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke(); if(pct>0.05){ const ma=ang+(a2-ang)/2; ctx.fillStyle='white'; ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText((pct*100).toFixed(0)+'%',cx+(r*0.68)*Math.cos(ma),cy+(r*0.68)*Math.sin(ma)); } ang=a2; });
            ctx.beginPath(); ctx.arc(cx,cy,ri,0,2*Math.PI); ctx.fillStyle='white'; ctx.fill();
            ctx.fillStyle='#1e293b'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('Total',cx,cy-10); ctx.fillStyle='#4f46e5'; ctx.fillText(fmt(totT2),cx,cy+10);
            const ley=document.getElementById('torta-ley'); if(ley) ley.innerHTML=srvConPres.map((s,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="width:12px;height:12px;border-radius:3px;background:${paleta[i%paleta.length]};flex-shrink:0;"></div><span style="font-size:12px;font-weight:bold;color:#1e293b;">${s.nombre}</span><span style="font-size:11px;color:#64748b;">${fmt(s.presupuesto)} · ${(s.presupuesto/totT2*100).toFixed(1)}%</span></div>`).join('');
        },50);
    }

    // Gastos corrientes por rubro
    const porR={},porRSF={};
    listaCorrientes.filter(c=>c.fechaPago).forEach(c=>{ porR[c.rubro]=(porR[c.rubro]||0)+c.monto; });
    listaCorrientes.filter(c=>!c.fechaPago).forEach(c=>{ porRSF[c.rubro]=(porRSF[c.rubro]||0)+c.monto; });
    const totCorr=Object.values(porR).reduce((a,b)=>a+b,0);
    const todosR=new Set([...Object.keys(porR),...Object.keys(porRSF)]);
    let tCorr=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🛍️ Gastos Corrientes por Rubro</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Rubro</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Sin confirmar</th><th style="padding:6px;text-align:right;">% del total</th></tr>`;
    [...todosR].sort().forEach(r=>{ const pg=porR[r]||0,sf=porRSF[r]||0,pct=totCorr>0?((pg/totCorr)*100).toFixed(1):'0.0'; tCorr+=`<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${r}</td><td style="padding:5px 6px;text-align:right;color:#10b981;font-weight:bold;">${fmt(pg)}</td><td style="padding:5px 6px;text-align:right;color:#94a3b8;">${fmt(sf)}</td><td style="padding:5px 6px;text-align:right;">${pct}%</td></tr>`; });
    tCorr+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;color:#10b981;">${fmt(totCorr)}</td><td style="text-align:right;color:#94a3b8;">${fmt(Object.values(porRSF).reduce((a,b)=>a+b,0))}</td><td></td></tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend',tCorr);

    // ── SECCIÓN DÓLARES ────────────────────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#16a34a;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Resumen en Dólares · Mes Actual</h3>');
    if(listaCuentasUSD.length>0||listaTarjetasUSD.length>0||listaServiciosUSD.length>0){
        const mDU2=calcMDU(), tc=tipoCambio;
        const tD=listaCuentasUSD.reduce((a,c)=>a+c.saldo,0), tTU=listaTarjetasUSD.reduce((a,t)=>a+(t.saldo+(mDU2[t.id]||0)),0), bal=tD-tTU;
        const gU=el('div'); gU.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px;';
        gU.innerHTML=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #16a34a;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD Disponibles</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#16a34a;">${fmtUSD(tD)}</p><small style="color:#64748b;">${fmtARS(tD*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid #a855f7;padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Pagar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:#a855f7;">${fmtUSD(tTU)}</p><small style="color:#64748b;">${fmtARS(tTU*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal>=0?'#16a34a':'#ef4444'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">Balance USD</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal>=0?'#16a34a':'#ef4444'};">${fmtUSD(bal)}</p><small style="color:#64748b;">${fmtARS(Math.abs(bal)*tc)}</small></div><div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-left:5px solid ${bal<0?'#ef4444':'#94a3b8'};padding:16px;"><h4 style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;">USD a Comprar</h4><p style="margin:0;font-size:20px;font-weight:bold;color:${bal<0?'#ef4444':'#94a3b8'};">${bal<0?fmtUSD(Math.abs(bal)):'—'}</p><small style="color:#64748b;">${bal<0?fmtARS(Math.abs(bal)*tc):''}</small></div>`;
        wrap.appendChild(gU);
        if(listaServiciosUSD.length>0){
            let tSU=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos en USD · TC ${fmtARS(tc)}</h4><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;">Servicio</th><th style="padding:6px;text-align:right;">Presup.</th><th style="padding:6px;text-align:right;">Pagado</th><th style="padding:6px;text-align:right;">Pend. (USD)</th><th style="padding:6px;text-align:right;">Pend. (ARS)</th><th style="padding:6px;text-align:center;">Estado</th></tr>`;
            let tpU=0,pgU=0,peU=0;
            listaServiciosUSD.forEach((s,ri)=>{ const pe=Math.max(0,s.presupuesto-s.pagado); tpU+=s.presupuesto; pgU+=s.pagado; peU+=pe; let ec='#c5221f',eb='#fce8e6',et='PENDIENTE'; if(s.pagado>=s.presupuesto&&s.presupuesto>0){ec='#137333';eb='#e6f4ea';et='PAGADO';} else if(s.pagado>0){ec='#b06000';eb='#fef7e0';et='PARCIAL';}
                tSU+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td><td style="padding:5px 6px;text-align:right;">${fmtUSD(s.presupuesto)}</td><td style="padding:5px 6px;text-align:right;color:#10b981;">${fmtUSD(s.pagado)}</td><td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmtUSD(pe)}</td><td style="padding:5px 6px;text-align:right;color:#64748b;">${fmtARS(pe*tc)}</td><td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${eb};color:${ec};">${et}</span></td></tr>`; });
            tSU+=`<tr style="background:#f8fafc;font-weight:bold;"><td>TOTAL</td><td style="text-align:right;">${fmtUSD(tpU)}</td><td style="text-align:right;color:#10b981;">${fmtUSD(pgU)}</td><td style="text-align:right;color:#ef4444;">${fmtUSD(peU)}</td><td style="text-align:right;">${fmtARS(peU*tc)}</td><td></td></tr></table></div>`;
            wrap.insertAdjacentHTML('beforeend',tSU);
        }
    } else { wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;margin-bottom:24px;">Sin datos en dólares para este mes.</div>'); }

    // ── REPORTE 2: ACUMULADO 12 MESES ─────────────────
    wrap.insertAdjacentHTML('beforeend','<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#f59e0b;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 2 · Análisis por Rubro · Últimos 12 Meses</h3>');
    const ultimos12=[...historicoMeses].slice(-12);
    const mesesData=ultimos12.map(m=>({nombre:m.nombre,datos:m.datos}));
    mesesData.push({nombre:'Mes Actual',datos:{listaCorrientes,listaRubros}});
    const todosRub2=new Set(); mesesData.forEach(m=>(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago).forEach(c=>todosRub2.add(c.rubro)));
    const rubrosArr=[...todosRub2].sort();
    if(!rubrosArr.length){ wrap.insertAdjacentHTML('beforeend','<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;">Sin datos históricos aún.</div>'); }
    else {
        let t2=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:16px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;"><thead><tr style="background:#1e293b;"><th style="padding:7px 8px;text-align:left;color:white;">Rubro</th>`;
        mesesData.forEach(m=>{ t2+=`<th style="padding:7px 8px;text-align:right;color:white;">${m.nombre.replace(' de ',' ')}</th>`; });
        t2+=`<th style="padding:7px 8px;text-align:right;color:#f59e0b;">TOTAL</th></tr></thead><tbody>`;
        const totMes=new Array(mesesData.length).fill(0); let totGen=0;
        rubrosArr.forEach((rub,ri)=>{ let totR=0; t2+=`<tr style="background:${ri%2===0?'white':'#f8fafc'};"><td style="padding:5px 8px;font-weight:bold;color:#334155;">${rub}</td>`;
            mesesData.forEach((m,mi)=>{ const s=(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===rub).reduce((a,c)=>a+c.monto,0); totMes[mi]+=s; totR+=s; t2+=`<td style="padding:5px 8px;text-align:right;color:${s>0?'#10b981':'#94a3b8'};font-weight:${s>0?'bold':'normal'};">${s>0?fmt(s):'—'}</td>`; });
            totGen+=totR; t2+=`<td style="padding:5px 8px;text-align:right;font-weight:bold;color:#f59e0b;">${fmt(totR)}</td></tr>`; });
        t2+=`<tr style="background:#f1f5f9;font-weight:bold;"><td style="padding:7px 8px;color:#1e293b;">TOTAL MES</td>`;
        totMes.forEach(t=>{ t2+=`<td style="padding:7px 8px;text-align:right;color:#4f46e5;">${fmt(t)}</td>`; });
        t2+=`<td style="padding:7px 8px;text-align:right;color:#f59e0b;">${fmt(totGen)}</td></tr></tbody></table></div>`;
        wrap.insertAdjacentHTML('beforeend',t2);
        const topR=[...rubrosArr].map(r=>({rubro:r,total:mesesData.reduce((a,m)=>a+(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===r).reduce((b,c)=>b+c.monto,0),0)})).sort((a,b)=>b.total-a.total);
        const totAc=topR.reduce((a,r)=>a+r.total,0);
        let res=`<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:16px;margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Participación por Rubro (acumulado)</h4>`;
        topR.forEach(r=>{ const pct=totAc>0?(r.total/totAc*100).toFixed(1):0; res+=`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:bold;color:#334155;">${r.rubro}</span><span style="color:#64748b;">${fmt(r.total)} · ${pct}%</span></div><div style="background:#e2e8f0;border-radius:4px;height:10px;"><div style="background:linear-gradient(90deg,#f59e0b,#f97316);height:10px;border-radius:4px;width:${Math.round(pct)}%;"></div></div></div>`; });
        res+=`<div style="font-size:12px;color:#64748b;text-align:right;margin-top:8px;font-weight:bold;">Total acumulado: ${fmt(totAc)}</div></div>`;
        wrap.insertAdjacentHTML('beforeend',res);
    }
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
//  GOOGLE DRIVE
// ═══════════════════════════════════════════
const GDRIVE_CLIENT_ID='1049169592532-is5j1j4s1bmgrc9tsq48slrgul8fbj17.apps.googleusercontent.com';
const GDRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
let gToken=null;

function driveCargarGoogle(cb) {
    if(typeof google!=='undefined'){ cb(); return; }
    const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client';
    s.onload=cb; s.onerror=()=>alert('No se pudo cargar Google. Verificá la conexión.'); document.head.appendChild(s);
}
function driveGetToken(cb) {
    driveCargarGoogle(()=>{
        if(gToken){ cb(gToken); return; }
        const client=google.accounts.oauth2.initTokenClient({
            client_id:GDRIVE_CLIENT_ID, scope:GDRIVE_SCOPE,
            hint:'factory.viking.systems@gmail.com', prompt:'',
            callback:resp=>{
                if(resp.error==='interaction_required'){
                    const c2=google.accounts.oauth2.initTokenClient({client_id:GDRIVE_CLIENT_ID,scope:GDRIVE_SCOPE,hint:'factory.viking.systems@gmail.com',callback:r2=>{ if(r2.error){alert('Error: '+r2.error);return;} gToken=r2.access_token; cb(gToken); }});
                    c2.requestAccessToken(); return;
                }
                if(resp.error){alert('Error Google: '+resp.error);return;}
                gToken=resp.access_token; cb(gToken);
            }
        });
        client.requestAccessToken({prompt:''});
    });
}
function driveSubir() {
    driveGetToken(token=>{
        const a=new Date(), ts=a.getFullYear()+String(a.getMonth()+1).padStart(2,'0')+String(a.getDate()).padStart(2,'0')+'_'+String(a.getHours()).padStart(2,'0')+String(a.getMinutes()).padStart(2,'0');
        const nombre='backup_finanzas_'+ts+'.json';
        const data=JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses,listaCuentasUSD,listaTarjetasUSD,listaServiciosUSD,listaCorrientesUSD,tipoCambio});
        const meta=JSON.stringify({name:nombre,parents:['appDataFolder']});
        const form=new FormData();
        form.append('metadata',new Blob([meta],{type:'application/json'}));
        form.append('file',new Blob([data],{type:'application/json'}));
        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+token},body:form})
        .then(r=>r.json()).then(f=>{ if(f.id) alert('Backup guardado en Drive: '+nombre); else{alert('Error al subir: '+JSON.stringify(f));gToken=null;} })
        .catch(e=>{alert('Error: '+e.message);gToken=null;});
    });
}
function driveRestaurar() {
    driveGetToken(token=>{
        fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&orderBy=modifiedTime+desc&pageSize=20',{headers:{Authorization:'Bearer '+token}})
        .then(r=>r.json()).then(data=>{
            const arch=(data.files||[]).filter(f=>f.name.startsWith('backup_finanzas_'));
            mostrarModalDrive(arch,token);
        }).catch(e=>{alert('Error al listar Drive: '+e.message);gToken=null;});
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
        const lft=el('div'); lft.innerHTML=`<div style="font-size:13px;font-weight:bold;color:#1e293b;">${f.name}</div><div style="font-size:11px;color:#64748b;">${fecha}</div>`;
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
        navigator.serviceWorker.register('./sw.js')
            .then(r=>console.log('SW:',r.scope))
            .catch(e=>console.log('SW error:',e));
    });
}
