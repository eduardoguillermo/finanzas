
// ═══════════════════════════════════════════
//  ESTADO GLOBAL
// ═══════════════════════════════════════════
console.log('CF v3.2: script iniciando');
const K = {
    rubros: 'f_r_v2_2', bancos: 'f_bancos_v2_4', tarjetas: 'f_tarjetas_v2_4',
    servicios: 'f_servicios_v2_4', corrientes: 'f_corrientes_v2_4',
    transferencias: 'f_transferencias_v3', cuotas: 'f_cuotas_v3', historico: 'f_historico_v3'
};

let listaRubros         = leer(K.rubros)         || ["Carnicería / Verdulería", "Supermercado / Almacén", "Gastos Auto / Combustible"];
let listaBancos         = leer(K.bancos)         || [];
let listaTarjetas       = leer(K.tarjetas)       || [];
let listaServicios      = leer(K.servicios)      || [];
let listaCorrientes     = leer(K.corrientes)     || [];
let listaTransferencias = leer(K.transferencias) || [];
let listaCuotas         = leer(K.cuotas)         || [];
let historicoMeses      = leer(K.historico)      || [];
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
}

function fmt(n) { return '$ ' + Math.round(n).toLocaleString('es-AR', {maximumFractionDigits:0}); }
function fmtN(n) { return Math.round(n).toLocaleString('es-AR', {maximumFractionDigits:0}); }
function clon(x) { return JSON.parse(JSON.stringify(x)); }

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

    const tAct = document.createElement('div');
    tAct.className = 'tab' + (tabActivo === null ? ' activo' : '');
    tAct.innerHTML = '<span>📊 Mes Actual</span>';
    tAct.onclick = () => { tabActivo = null; renderTabs(); renderContenido(); };
    bar.appendChild(tAct);

    const tRep = document.createElement('div');
    tRep.className = 'tab' + (tabActivo === 'reportes' ? ' activo' : '');
    tRep.style.cssText = tabActivo === 'reportes' ? 'background:#f0fdf4;color:#166534;border-color:#86efac;' : '';
    tRep.innerHTML = '<span>📈 Reportes</span>';
    tRep.onclick = () => { tabActivo = 'reportes'; renderTabs(); renderContenido(); };
    bar.appendChild(tRep);

    [...historicoMeses].reverse().forEach(mes => {
        const t = document.createElement('div');
        t.className = 'tab historico' + (tabActivo === mes.id ? ' activo' : '');
        t.innerHTML = `<span>🗂 ${mes.nombre}</span><span class="tab-x">✕</span>`;
        t.onclick = e => {
            if (e.target.classList.contains('tab-x')) {
                if (confirm(`¿Eliminar "${mes.nombre}"?`)) {
                    historicoMeses = historicoMeses.filter(m => m.id !== mes.id);
                    if (tabActivo === mes.id) tabActivo = null;
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
    try {
        if (tabActivo === null) {
            app.appendChild(buildMesActual());
            bindEventosMesActual();
            render();
        } else if (tabActivo === 'reportes') {
            app.appendChild(buildReportes());
        } else {
            const mes = historicoMeses.find(m => m.id === tabActivo);
            if (mes) app.appendChild(buildHistorico(mes));
        }
    } catch(err) {
        app.innerHTML = `<div style="padding:40px;color:#ef4444;font-family:monospace;">
            <b>Error al renderizar:</b><br>${err.message}<br><br>
            <small>${err.stack}</small></div>`;
    }
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
          <p class="version-tag">v3.2.0</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn-mes" id="btn-nuevo-mes">🔄 Abrir Nuevo Mes</button>
          <button class="btn btn-blue" id="btn-exportar">💾 Exportar Backup</button>
          <button class="btn btn-green" id="btn-importar-trigger">📥 Importar Backup</button>
          <input type="file" id="input-backup" accept=".json" style="display:none;">
          <button class="btn btn-gdrive no-print" id="btn-gdrive-exportar" title="Subir a Drive">☁️ Drive</button>
          <button class="btn btn-gdrive no-print" id="btn-gdrive-importar" title="Restaurar desde Drive">📂 Drive</button>
          <button class="btn btn-dark" onclick="window.print()">🖨️ PDF</button>
        </div>
      </header>

      <div class="grid-dashboard">
        <div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco Disponible</h4><p id="d-bancos" style="color:#0284c7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Total Deuda Tarjetas</h4><p id="d-tarjetas" style="color:#a855f7;">$ 0</p></div>
        <div class="card-bal" style="border-left:5px solid #10b981;"><h4>Total Egresado / Pagado</h4><p id="d-pagado" style="color:#10b981;">$ 0</p></div>
        <div class="card-bal" id="card-pend" style="border-left:5px solid #ef4444;"><h4>Fijos Pendientes de Pago</h4><p id="d-pendiente" style="color:#ef4444;">$ 0</p></div>
      </div>

      <div class="grid-principal">
        <!-- IZQUIERDA -->
        <div>
          <!-- BANCOS -->
          <div class="panel panel-bancos no-print">
            <h3 class="panel-title">🏦 Cuentas Bancarias / Efectivo</h3>
            <div class="form-block">
              <form id="form-banco">
                <div class="form-group"><label>Nombre de la Cuenta</label><input type="text" id="banco-nombre" required placeholder="Ej. Galicia, MercadoPago"></div>
                <div class="form-group"><label>Saldo Disponible ($)</label><input type="number" id="banco-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-blue">Añadir Cuenta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:45%">Cuenta</th><th style="width:30%" class="tr">Saldo ($)</th><th style="width:15%" class="tc">Auto⬇</th><th style="width:10%" class="no-print"></th></tr></thead>
            <tbody id="t-bancos"></tbody></table>
          </div>

          <!-- TARJETAS -->
          <div class="panel panel-tarjetas no-print">
            <h3 class="panel-title">💳 Tarjetas de Crédito</h3>
            <div class="form-block">
              <form id="form-tarjeta">
                <div class="form-group"><label>Nombre de la Tarjeta</label><input type="text" id="tarjeta-nombre" required placeholder="Ej. Visa Galicia"></div>
                <div class="form-group"><label>Saldo Inicial Acumulado ($)</label><input type="number" id="tarjeta-saldo" required value="0" step="1"></div>
                <button type="submit" class="btn btn-add btn-purple">Registrar Tarjeta</button>
              </form>
            </div>
            <table><thead><tr><th style="width:55%">Tarjeta</th><th style="width:35%" class="tr">Consumo ($)</th><th style="width:10%" class="no-print"></th></tr></thead>
            <tbody id="t-tarjetas"></tbody></table>
          </div>

          <!-- TRANSFERENCIAS -->
          <div class="panel panel-transf no-print">
            <h3 class="panel-title">↔️ Transferencias entre Cuentas</h3>
            <div class="form-block">
              <form id="form-transf">
                <div class="form-row">
                  <div><label>Origen</label><select id="transf-origen" required></select></div>
                  <div><label>Destino</label><select id="transf-destino" required></select></div>
                </div>
                <div class="form-row">
                  <div><label>Monto ($)</label><input type="number" id="transf-monto" required placeholder="0" step="1"></div>
                  <div><label>Fecha</label><input type="date" id="transf-fecha" required></div>
                </div>
                <button type="submit" class="btn btn-add btn-amber">Registrar Transferencia</button>
              </form>
            </div>
            <table><thead><tr>
              <th style="width:18%">Fecha</th><th style="width:30%">Origen</th><th style="width:30%">Destino</th>
              <th style="width:17%" class="tr">Monto</th><th style="width:5%" class="no-print"></th>
            </tr></thead><tbody id="t-transf"></tbody></table>
          </div>

          <!-- CUOTAS -->
          <div class="panel no-print" style="border-top:4px solid #6366f1;">
            <h3 class="panel-title">💳 Compras en Cuotas</h3>
            <div class="form-block">
              <form id="form-cuota">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="cuota-desc" required placeholder="Ej. TV Samsung, Notebook"></div>
                  <div><label>Monto Total ($)</label><input type="number" id="cuota-total" required placeholder="0" step="1"></div>
                  <div><label>Cant. Cuotas</label><input type="number" id="cuota-cant" required placeholder="12" min="2" step="1"></div>
                </div>
                <div class="form-row">
                  <div><label>Medio de Pago</label><select id="cuota-medio" required></select></div>
                  <div style="display:flex;align-items:flex-end;">
                    <div id="cuota-preview" style="font-size:12px;color:#6366f1;font-weight:bold;padding:9px 0;"></div>
                  </div>
                </div>
                <button type="submit" class="btn btn-add" style="background:#6366f1;">Registrar Compra en Cuotas</button>
              </form>
            </div>
            <table><thead><tr>
              <th style="width:35%">Descripción</th>
              <th style="width:20%" class="tr">Cuota ($)</th>
              <th style="width:20%" class="tc">Progreso</th>
              <th style="width:18%" class="tr">Resto ($)</th>
              <th style="width:7%" class="no-print"></th>
            </tr></thead><tbody id="t-cuotas"></tbody></table>
          </div>

          <!-- RUBROS -->
          <div class="panel panel-rubros no-print">
            <h3 class="panel-title">⚙️ Rubros de Gasto Corriente</h3>
            <div class="form-block">
              <form id="form-rubro" style="display:grid;grid-template-columns:2fr 1fr;gap:10px;">
                <input type="text" id="rubro-nombre" required placeholder="Ej. Carnicería, Gastos Auto">
                <button type="submit" class="btn" style="background:#64748b;color:white;">Crear Rubro</button>
              </form>
            </div>
            <div id="rubros-lista" class="rubros-wrap"></div>
          </div>
        </div>

        <!-- DERECHA -->
        <div>
          <!-- SERVICIOS FIJOS -->
          <div class="panel panel-servicios">
            <h3 class="panel-title">📋 Liquidación de Servicios y Vencimientos Fijos</h3>
            <div class="form-block no-print">
              <form id="form-servicio">
                <div class="form-row">
                  <div style="flex:2"><label>Descripción</label><input type="text" id="srv-nombre" required placeholder="Ej. Luz, AYSAM, Internet"></div>
                  <div><label>Presupuesto ($)</label><input type="number" id="srv-presupuesto" required placeholder="0" step="1"></div>
                  <div><label>Vto.</label><input type="date" id="srv-vto" required></div>
                </div>
                <div class="form-row" style="margin-bottom:12px;">
                  <div>
                    <label>Clase</label>
                    <select id="srv-clase" required>
                      <option value="M">M — Mío</option>
                      <option value="O">O — Oma</option>
                      <option value="X">X — Otros</option>
                    </select>
                  </div>
                </div>
                <button type="submit" class="btn btn-add btn-indigo">Configurar Vencimiento Fijo</button>
              </form>
            </div>
            <table><thead><tr>
              <th style="width:20%">Servicio</th><th style="width:6%" class="tc">Clase</th><th style="width:13%" class="tc">Vto.</th>
              <th style="width:10%" class="tr">Presup.</th><th style="width:10%" class="tr">Pagado</th>
              <th style="width:11%" class="tc">F.Pago</th><th style="width:15%">Medio</th>
              <th style="width:9%" class="tc">Estado</th><th style="width:4%" class="no-print"></th>
            </tr></thead><tbody id="t-servicios"></tbody></table>
          </div>

          <!-- GASTOS CORRIENTES -->
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

function bindEventosMesActual() {
    const get = id => document.getElementById(id);
    get('form-banco')?.addEventListener('submit', altaBanco);
    get('form-tarjeta')?.addEventListener('submit', altaTarjeta);
    get('form-servicio')?.addEventListener('submit', altaServicio);
    get('form-corriente')?.addEventListener('submit', altaCorriente);
    get('form-transf')?.addEventListener('submit', altaTransferencia);
    get('form-rubro')?.addEventListener('submit', altaRubro);
    get('input-backup')?.addEventListener('change', importar);
    get('btn-exportar')?.addEventListener('click', exportar);
    get('btn-importar-trigger')?.addEventListener('click', () => get('input-backup')?.click());
    get('btn-nuevo-mes')?.addEventListener('click', nuevoMes);
    get('btn-gdrive-exportar')?.addEventListener('click', driveExportar);
    get('btn-gdrive-importar')?.addEventListener('click', driveImportar);
}

// ═══════════════════════════════════════════
//  RENDER PRINCIPAL
// ═══════════════════════════════════════════
function render() {
    const tB = document.getElementById('t-bancos');
    if (!tB) return;

    const tT  = document.getElementById('t-tarjetas');
    const tS  = document.getElementById('t-servicios');
    const tTr = document.getElementById('t-transf');
    const rL  = document.getElementById('rubros-lista');
    const sRubro = document.getElementById('corr-rubro');
    const sMedio = document.getElementById('corr-medio');
    const sOrig  = document.getElementById('transf-origen');
    const sDest  = document.getElementById('transf-destino');

    tB.innerHTML = ''; tT.innerHTML = ''; tS.innerHTML = ''; tTr.innerHTML = ''; rL.innerHTML = '';

    // Selects medios de pago
    sMedio.innerHTML = ''; sOrig.innerHTML = ''; sDest.innerHTML = '';
    listaBancos.forEach(b => {
        addOpt(sMedio, b.id, '🏦 ' + b.nombre);
        addOpt(sOrig,  b.id, '🏦 ' + b.nombre);
        addOpt(sDest,  b.id, '🏦 ' + b.nombre);
    });
    listaTarjetas.forEach(t => {
        addOpt(sMedio, t.id, '💳 ' + t.nombre);
        addOpt(sOrig,  t.id, '💳 ' + t.nombre);
        addOpt(sDest,  t.id, '💳 ' + t.nombre);
    });

    // Rubros
    sRubro.innerHTML = '';
    listaRubros.forEach(r => {
        addOpt(sRubro, r, r);
        const b = el('div', 'rubro-badge'); b.innerHTML = `<span>${r}</span>`;
        const x = el('button'); x.type='button'; x.innerText='✕'; x.onclick=()=>elimRubro(r);
        b.appendChild(x); rL.appendChild(b);
    });

    // Bancos
    listaBancos.forEach(b => {
        const tdToggle = document.createElement('td'); tdToggle.className = 'tc';
        const tog = document.createElement('input'); tog.type = 'checkbox'; tog.checked = b.autoDescontar || false;
        tog.title = 'Descontar saldo automáticamente al confirmar gastos';
        tog.style.cssText = 'width:16px;height:16px;cursor:pointer;accent-color:#4f46e5;';
        tog.onchange = e => { b.autoDescontar = e.target.checked; guardar(); };
        tdToggle.appendChild(tog);
        const tr = fila([
            tdHTML(`<b>${b.nombre}</b>`),
            tdInpNum(b.saldo, v => { b.saldo = v; guardar(); calcDash(); }, 'tr'),
            tdToggle,
            tdBtn('✕', ()=>elimBanco(b.id))
        ]);
        tB.appendChild(tr);
    });

    // Tarjetas
    listaTarjetas.forEach(t => {
        const inp = inpNum(t.saldo, v => { t.saldo = v; guardar(); calcDash(); });
        inp.id = 'saldo-t-' + t.id;
        const tdS = document.createElement('td'); tdS.className='tr'; tdS.appendChild(inp);
        const tr = fila([ tdHTML(`<b>${t.nombre}</b>`), tdS, tdBtn('✕', ()=>elimTarjeta(t.id)) ]);
        tT.appendChild(tr);
    });

    // Servicios — orden: pendiente > parcial > pagado, luego alfabético
    const serviciosOrdenados = [...listaServicios].sort((a, b) => {
        const estado = s => s.pagado >= s.presupuesto && s.presupuesto > 0 ? 2 : s.pagado > 0 ? 1 : 0;
        const ea = estado(a), eb = estado(b);
        if (ea !== eb) return ea - eb;
        return a.nombre.localeCompare(b.nombre, 'es');
    });
    serviciosOrdenados.forEach(s => {
        const medioSel = selMedios(s.medioPagoId, v => { s.medioPagoId = v; guardar(); calcDash(); });
        const estadoSpan = document.createElement('span');
        estadoSpan.id = 'est-' + s.id;
        estadoSpan.style.cssText = 'font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;';
        const tdEst = document.createElement('td'); tdEst.className='tc'; tdEst.appendChild(estadoSpan);

        const selClase = document.createElement('select'); selClase.className='inp';
        ['M','O','X'].forEach(op => {
            const o=document.createElement('option'); o.value=op; o.innerText=op;
            if((s.clase||'M')===op) o.selected=true; selClase.appendChild(o);
        });
        selClase.onchange = e => { s.clase=e.target.value; guardar(); };
        const tdClase = document.createElement('td'); tdClase.className='tc'; tdClase.appendChild(selClase);

        const tr = document.createElement('tr');
        [
            tdHTML(`<b>${s.nombre}</b>`),
            tdClase,
            tdInpDate(s.fVto,  v => { s.fVto  = v; guardar(); }),
            tdInpNum(s.presupuesto, v => { s.presupuesto = v; guardar(); calcDash(); }, 'tr'),
            tdInpNum(s.pagado, v => {
                const diff = v - s.pagado;
                if (diff !== 0) {
                    const cuenta = listaBancos.find(b => b.id === s.medioPagoId) || listaTarjetas.find(t => t.id === s.medioPagoId);
                    if (cuenta) {
                        const esTarjeta = !!listaTarjetas.find(t => t.id === s.medioPagoId);
                        if (esTarjeta) cuenta.saldo += diff; // tarjetas acumulan deuda
                        else cuenta.saldo -= diff;           // bancos descuentan saldo
                    }
                }
                s.pagado = v; guardar(); calcDash();
            }, 'tr'),
            tdInpDate(s.fPago, v => { s.fPago = v; guardar(); }),
            (() => { const td = document.createElement('td'); td.appendChild(medioSel); return td; })(),
            tdEst,
            tdBtn('✕', ()=>elimServicio(s.id))
        ].forEach(td => tr.appendChild(td));
        tS.appendChild(tr);
    });

    // Transferencias
    if (listaTransferencias.length === 0) {
        tTr.innerHTML = '<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>';
    } else {
        [...listaTransferencias].reverse().forEach(t => {
            const tr = fila([
                tdTxt(t.fecha || '—'),
                tdTxt(t.origenNombre),
                tdTxt(t.destinoNombre),
                (() => { const td=document.createElement('td'); td.className='tr'; td.style.cssText='font-weight:bold;color:#f59e0b;'; td.innerText=fmt(t.monto); return td; })(),
                tdBtn('✕', ()=>elimTransferencia(t.id))
            ]);
            tTr.appendChild(tr);
        });
    }

    // Tabla corrientes
    const wrapC = document.getElementById('wrap-corrientes');
    wrapC.innerHTML = '';
    const tblC = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr>' +
        '<th style="width:20%">Rubro</th>' +
        '<th style="width:27%">Detalle</th>' +
        '<th style="width:17%">Medio</th>' +
        '<th style="width:13%;text-align:center;">F. Pago</th>' +
        '<th style="width:15%;text-align:right;">Monto ($)</th>' +
        '<th style="width:8%" class="no-print"></th>' +
        '</tr>';
    const tbody = document.createElement('tbody');
    tblC.appendChild(thead); tblC.appendChild(tbody); wrapC.appendChild(tblC);

    if (listaCorrientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="tc" style="color:#94a3b8;padding:15px;">Sin egresos corrientes.</td></tr>';
    } else {
        listaCorrientes.forEach(c => {
            const medio = listaBancos.find(b=>b.id===c.medioPagoId) || listaTarjetas.find(t=>t.id===c.medioPagoId);
            const medioNom = medio ? (listaBancos.find(b=>b.id===c.medioPagoId) ? '🏦 ' : '💳 ') + medio.nombre : 'Desconocido';

            const selR = document.createElement('select'); selR.className='inp';
            listaRubros.forEach(r => addOpt(selR, r, r, r===c.rubro));
            selR.onchange = e => { c.rubro = e.target.value; guardar(); };

            const inpD = document.createElement('input'); inpD.type='text'; inpD.className='inp'; inpD.value=c.detalle;
            inpD.onchange = e => { c.detalle = e.target.value.trim(); guardar(); };

            const inpFP = document.createElement('input'); inpFP.type='date'; inpFP.className='inp'; inpFP.value=c.fechaPago||'';
            inpFP.onchange = e => {
                const fechaAnterior = c.fechaPago;
                const fechaNueva = e.target.value;
                // Si pasa de sin fecha a con fecha: descontar saldo en cuentas liquidables
                if (!fechaAnterior && fechaNueva && esCuentaLiq(c.medioPagoId)) {
                    const bk = listaBancos.find(b => b.id === c.medioPagoId);
                    if (bk) bk.saldo -= c.monto;
                }
                // Si pasa de con fecha a sin fecha: restaurar saldo en cuentas liquidables
                if (fechaAnterior && !fechaNueva && esCuentaLiq(c.medioPagoId)) {
                    const bk = listaBancos.find(b => b.id === c.medioPagoId);
                    if (bk) bk.saldo += c.monto;
                }
                c.fechaPago = fechaNueva;
                guardar(); render();
            };

            const inpM = inpNum(c.monto, v => {
                const diff = v - c.monto;
                if (c.fechaPago && esCuentaLiq(c.medioPagoId)) {
                    const bk = listaBancos.find(b=>b.id===c.medioPagoId);
                    if (bk) bk.saldo -= diff;
                }
                c.monto = v; guardar(); calcDash();
            });
            inpM.style.cssText='font-weight:bold;color:#10b981;';

            const tdR=document.createElement('td'); tdR.appendChild(selR);
            const tdD=document.createElement('td'); tdD.appendChild(inpD);
            const tdM=document.createElement('td'); tdM.style.color='#64748b'; tdM.innerText=medioNom;
            const tdFP=document.createElement('td'); tdFP.className='tc'; tdFP.appendChild(inpFP);
            const tdMon=document.createElement('td'); tdMon.className='tr'; tdMon.appendChild(inpM);
            const tdX=document.createElement('td'); tdX.className='tc no-print';
            const btnX=document.createElement('button'); btnX.className='btn-del'; btnX.innerText='✕';
            btnX.onclick=()=>elimCorriente(c.id); tdX.appendChild(btnX);

            const tr=document.createElement('tr');
            [tdR,tdD,tdM,tdFP,tdMon,tdX].forEach(td=>tr.appendChild(td));
            tbody.appendChild(tr);
        });
    }

    renderCuotas();
    calcDash();
}

// ═══════════════════════════════════════════
//  HELPERS DOM
// ═══════════════════════════════════════════
function el(tag, cls) { const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function addOpt(sel, val, txt, selected=false) { const o=el('option'); o.value=val; o.innerText=txt; if(selected) o.selected=true; sel.appendChild(o); }
function fila(tds) { const tr=el('tr'); tds.forEach(td=>tr.appendChild(td)); return tr; }
function tdHTML(html) { const td=el('td'); td.innerHTML=html; return td; }
function tdTxt(txt, cls='') { const td=el('td',cls||undefined); td.style.fontSize='12px'; td.innerText=txt; return td; }
function tdBtn(label, fn, cls='no-print') {
    const td=el('td','tc '+cls);
    const b=el('button','btn-del'); b.innerText=label; b.onclick=fn;
    td.appendChild(b); return td;
}
function inpNum(val, onChange) {
    const inp=el('input'); inp.type='text'; inp.className='inp tr';
    inp.value=fmtN(val);
    let lastRaw = Math.round(val);
    inp.addEventListener('focus', () => { inp.value = lastRaw; });
    inp.addEventListener('change', e => {
        const v = parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.')) || 0;
        lastRaw = Math.round(v);
        onChange(v);
        inp.value = fmtN(v);
    });
    inp.addEventListener('blur', e => {
        const v = parseFloat(String(e.target.value).replace(/\./g,'').replace(',','.')) || 0;
        if (v !== lastRaw) {
            lastRaw = Math.round(v);
            onChange(v);
        }
        inp.value = fmtN(lastRaw);
    });
    // Exponer setter para que calcDash pueda actualizar el display sin romper el closure
    inp._setVal = (v) => { lastRaw = Math.round(v); if (document.activeElement !== inp) inp.value = fmtN(v); };
    return inp;
}
function tdInpNum(val, onChange, cls='') {
    const td=el('td',cls); td.appendChild(inpNum(val, onChange)); return td;
}
function tdInpDate(val, onChange) {
    const td=el('td');
    const inp=el('input'); inp.type='date'; inp.className='inp'; inp.value=val||'';
    inp.onchange=e=>onChange(e.target.value);
    td.appendChild(inp); return td;
}
function selMedios(selId, onChange) {
    const sel=el('select'); sel.className='inp';
    listaBancos.forEach(b=>addOpt(sel,b.id,'🏦 '+b.nombre,b.id===selId));
    listaTarjetas.forEach(t=>addOpt(sel,t.id,'💳 '+t.nombre,t.id===selId));
    sel.onchange=e=>onChange(e.target.value);
    return sel;
}
function medioNom(id) {
    const b=listaBancos.find(x=>x.id===id); if(b) return '🏦 '+b.nombre;
    const t=listaTarjetas.find(x=>x.id===id); if(t) return '💳 '+t.nombre;
    return '—';
}
function esCuentaLiq(id) {
    const b=listaBancos.find(x=>x.id===id);
    if (!b) return false;
    if (b.autoDescontar) return true;
    const n=b.nombre.toLowerCase();
    return n.includes('efectivo') || n.includes('mercado pago') || n.includes('mercadopago');
}

// ═══════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════
function calcDash() {
    const mDeb={};
    listaBancos.forEach(b=>mDeb[b.id]=0);
    listaTarjetas.forEach(t=>mDeb[t.id]=0);

    let totalPag=0, fijosPend=0;
    listaServicios.forEach(s => {
        if (s.pagado>0 && mDeb[s.medioPagoId]!==undefined) { mDeb[s.medioPagoId]+=Math.round(s.pagado); totalPag+=Math.round(s.pagado); }
        if (s.presupuesto>s.pagado) fijosPend+=Math.round(s.presupuesto-s.pagado);
        // Estado badge
        const sp=document.getElementById('est-'+s.id);
        if (sp) {
            if (s.pagado>=s.presupuesto && s.presupuesto>0) { sp.innerText='PAGADO';    sp.style.background='#e6f4ea'; sp.style.color='#137333'; }
            else if (s.pagado>0)                            { sp.innerText='PARCIAL';   sp.style.background='#fef7e0'; sp.style.color='#b06000'; }
            else                                            { sp.innerText='PENDIENTE'; sp.style.background='#fce8e6'; sp.style.color='#c5221f'; }
        }
    });
    listaCorrientes.forEach(c => {
        if (c.fechaPago) {
            totalPag+=Math.round(c.monto);
            if (mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=Math.round(c.monto);
        }
    });

    // Redondear todos los saldos para eliminar centavos acumulados
    listaBancos.forEach(b => { b.saldo = Math.round(b.saldo); });
    listaTarjetas.forEach(t => { t.saldo = Math.round(t.saldo); });

    let sumaBancos=0;
    listaBancos.forEach(b => sumaBancos+=b.saldo);

    let sumaTarjetas=0;
    listaTarjetas.forEach(t => {
        const total=Math.round(t.saldo+(mDeb[t.id]||0));
        sumaTarjetas+=total;
        const inp=document.getElementById('saldo-t-'+t.id);
        if (inp) { if (inp._setVal) inp._setVal(total); else if (document.activeElement!==inp) inp.value=fmtN(total); }
    });

    setTxt('d-bancos',   fmt(sumaBancos));
    setTxt('d-tarjetas', fmt(sumaTarjetas));
    setTxt('d-pagado',   fmt(Math.round(totalPag)));
    setTxt('d-pendiente',fmt(Math.round(fijosPend)));
    const cp=document.getElementById('card-pend');
    if (cp) cp.style.borderLeftColor = fijosPend>0 ? '#ef4444' : '#10b981';
}
function setTxt(id,v) { const e=document.getElementById(id); if(e) e.innerText=v; }

// ═══════════════════════════════════════════
//  ALTAS
// ═══════════════════════════════════════════
function altaBanco(e) {
    e.preventDefault();
    listaBancos.push({ id:'b_'+Date.now(), nombre:v('banco-nombre'), saldo:n('banco-saldo'), autoDescontar:false });
    guardar(); e.target.reset(); render();
}
function altaTarjeta(e) {
    e.preventDefault();
    listaTarjetas.push({ id:'t_'+Date.now(), nombre:v('tarjeta-nombre'), saldo:n('tarjeta-saldo') });
    guardar(); e.target.reset(); render();
}
function altaServicio(e) {
    e.preventDefault();
    const medioId = listaBancos[0]?.id || listaTarjetas[0]?.id || '';
    listaServicios.push({ id:'s_'+Date.now(), nombre:v('srv-nombre'), presupuesto:n('srv-presupuesto'), pagado:0, fVto:v('srv-vto'), fPago:'', medioPagoId:medioId });
    guardar(); e.target.reset(); render();
}
function altaCorriente(e) {
    e.preventDefault();
    const medioId = v('corr-medio');
    if (!medioId) { alert('Configure un medio de pago.'); return; }
    const monto = n('corr-monto');
    // No descontar saldo al dar de alta — se descuenta al confirmar con fecha de pago
    listaCorrientes.push({ id:'c_'+Date.now(), rubro:v('corr-rubro'), detalle:v('corr-detalle'), monto, fechaPago:'', medioPagoId:medioId });
    guardar(); e.target.reset(); render();
}
function altaTransferencia(e) {
    e.preventDefault();
    const origenId  = v('transf-origen');
    const destinoId = v('transf-destino');
    const monto     = n('transf-monto');
    const fecha     = v('transf-fecha');
    if (origenId===destinoId)  { alert('Origen y destino no pueden ser iguales.'); return; }
    if (monto<=0)              { alert('El monto debe ser mayor a cero.'); return; }

    const origen  = listaBancos.find(b=>b.id===origenId)  || listaTarjetas.find(t=>t.id===origenId);
    const destino = listaBancos.find(b=>b.id===destinoId) || listaTarjetas.find(t=>t.id===destinoId);
    if (origen)  origen.saldo  -= monto;
    if (destino) destino.saldo += monto;

    listaTransferencias.push({ id:'tr_'+Date.now(), origenId, destinoId, monto, fecha, origenNombre:origen?.nombre||'?', destinoNombre:destino?.nombre||'?' });
    guardar(); e.target.reset(); render();
}
function altaRubro(e) {
    e.preventDefault();
    const nombre = v('rubro-nombre');
    if (!nombre || listaRubros.includes(nombre)) return;
    listaRubros.push(nombre); guardar(); document.getElementById('rubro-nombre').value=''; render();
}

// ═══════════════════════════════════════════
//  ELIMINACIONES
// ═══════════════════════════════════════════
function elimBanco(id)    { if(confirm('¿Remover esta cuenta?'))   { listaBancos=listaBancos.filter(b=>b.id!==id);       guardar(); render(); } }
function elimTarjeta(id)  { if(confirm('¿Remover esta tarjeta?'))  { listaTarjetas=listaTarjetas.filter(t=>t.id!==id);   guardar(); render(); } }
function elimServicio(id) { listaServicios=listaServicios.filter(s=>s.id!==id);                                          guardar(); render(); }
function elimRubro(r)     { if(listaCorrientes.some(c=>c.rubro===r)){alert('Rubro en uso.');return;} listaRubros=listaRubros.filter(x=>x!==r); guardar(); render(); }

function elimCorriente(id) {
    const c=listaCorrientes.find(x=>x.id===id);
    if (c && c.fechaPago && esCuentaLiq(c.medioPagoId)) {
        const bk=listaBancos.find(b=>b.id===c.medioPagoId);
        if (bk) bk.saldo+=c.monto;
    }
    listaCorrientes=listaCorrientes.filter(x=>x.id!==id); guardar(); render();
}

function elimTransferencia(id) {
    const t=listaTransferencias.find(x=>x.id===id);
    if (t) {
        const orig=listaBancos.find(b=>b.id===t.origenId)||listaTarjetas.find(x=>x.id===t.origenId);
        const dest=listaBancos.find(b=>b.id===t.destinoId)||listaTarjetas.find(x=>x.id===t.destinoId);
        if (orig) orig.saldo+=t.monto;
        if (dest) dest.saldo-=t.monto;
    }
    listaTransferencias=listaTransferencias.filter(x=>x.id!==id); guardar(); render();
}

// ═══════════════════════════════════════════
//  NUEVO MES
// ═══════════════════════════════════════════
function nombreMes() {
    return new Date().toLocaleString('es-AR',{month:'long',year:'numeric'}).replace(/^\w/,c=>c.toUpperCase());
}

function nuevoMes() {
    const nombre = nombreMes();
    const yaExiste = historicoMeses.some(m=>m.nombre===nombre);
    const sufijo = yaExiste ? ' ('+Date.now()+')' : '';
    if (!confirm(`🔄 ¿Abrir nuevo período mensual?\n\n→ Se archivará "${nombre}${sufijo}"\n→ Se conservan bancos, tarjetas y servicios fijos\n→ Los pagados/ejecutados se limpian\n→ La caja diaria y transferencias se vacían`)) return;

    historicoMeses.push({
        id: 'mes_'+Date.now(),
        nombre: nombre+sufijo,
        fechaCierre: new Date().toISOString(),
        datos: { listaBancos:clon(listaBancos), listaTarjetas:clon(listaTarjetas), listaServicios:clon(listaServicios), listaCorrientes:clon(listaCorrientes), listaTransferencias:clon(listaTransferencias), listaRubros:clon(listaRubros), listaCuotas:clon(listaCuotas) }
    });

    // Ajustar saldos
    const mDeb={};
    listaBancos.forEach(b=>mDeb[b.id]=0);
    listaTarjetas.forEach(t=>mDeb[t.id]=0);
    listaServicios.forEach(s=>{ if(s.pagado>0&&mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c=>{ if(mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto; });
    listaBancos.forEach(b=>{ b.saldo-=(mDeb[b.id]||0); });
    listaTarjetas.forEach(t=>{ t.saldo+=(mDeb[t.id]||0); });

    listaServicios.forEach(s=>{ s.pagado=0; s.fPago=''; });
    listaCorrientes = listaCorrientes.filter(c => !c.fechaPago); // arrastrar sin fecha
    listaTransferencias=[];

    // Generar cuotas del nuevo mes como servicios fijos
    listaCuotas.forEach(c => {
        if (c.cuotaActual < c.totalCuotas) {
            c.cuotaActual++;
            const medioId = c.medioPagoId || (listaBancos[0]?.id || listaTarjetas[0]?.id || '');
            listaServicios.push({
                id: 's_cuota_' + c.id + '_' + c.cuotaActual,
                nombre: c.descripcion + ' (' + c.cuotaActual + '/' + c.totalCuotas + ')',
                presupuesto: c.montoCuota,
                pagado: 0, fVto: '', fPago: '',
                medioPagoId: medioId,
                clase: c.clase || 'M', esCuota: true, cuotaId: c.id
            });
        }
    });
    // Eliminar cuotas terminadas
    listaCuotas = listaCuotas.filter(c => c.cuotaActual < c.totalCuotas);

    guardar(); renderTabs(); renderContenido();
    alert('✅ Mes "'+nombre+sufijo+'" archivado. Nuevo período abierto.');
}

// ═══════════════════════════════════════════
//  BACKUP
// ═══════════════════════════════════════════
function exportar() {
    const ahora = new Date();
    const fecha = ahora.getFullYear() +
        String(ahora.getMonth()+1).padStart(2,'0') +
        String(ahora.getDate()).padStart(2,'0') + '_' +
        String(ahora.getHours()).padStart(2,'0') +
        String(ahora.getMinutes()).padStart(2,'0');
    const data={listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses};
    const a=document.createElement('a'); a.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data));
    a.download=`backup_finanzas_${fecha}.json`; document.body.appendChild(a); a.click(); a.remove();
}
function importar(event) {
    const file=event.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=e=>{
        try {
            const res=JSON.parse(e.target.result);
            if (!res.listaBancos) { alert('Backup invalido: falta listaBancos.'); return; }
            listaBancos         = res.listaBancos         || [];
            listaTarjetas       = res.listaTarjetas       || [];
            listaServicios      = res.listaServicios      || [];
            listaCorrientes     = res.listaCorrientes     || [];
            listaRubros         = res.listaRubros         || [];
            listaTransferencias = res.listaTransferencias || [];
            listaCuotas         = res.listaCuotas         || [];
            historicoMeses      = res.historicoMeses      || [];
            guardar(); renderTabs(); renderContenido();
            alert('Backup importado correctamente.');
        } catch(err) { alert('Error al importar: ' + err.message); }
    };
    r.readAsText(file); event.target.value='';
}

// ═══════════════════════════════════════════
//  MODAL VENCIMIENTOS
// ═══════════════════════════════════════════
function esFeriado(fecha) {
    const mm=String(fecha.getMonth()+1).padStart(2,'0');
    const dd=String(fecha.getDate()).padStart(2,'0');
    const cl=mm+'-'+dd;
    const fijos=['01-01','03-24','04-02','05-01','05-25','06-20','07-09','10-12','11-20','12-08','12-25'];
    if (fijos.includes(cl)) return true;
    const ss=calcPascua(fecha.getFullYear());
    const fmt=d=>String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    return cl===fmt(ss.jue)||cl===fmt(ss.vie);
}
function calcPascua(y) {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mes=Math.floor((h+l-7*m+114)/31)-1,dia=(h+l-7*m+114)%31+1;
    const p=new Date(y,mes,dia);
    const jue=new Date(p); jue.setDate(p.getDate()-3);
    const vie=new Date(p); vie.setDate(p.getDate()-2);
    return {jue,vie};
}
function esHabil(d) { const dw=d.getDay(); return dw!==0&&dw!==6&&!esFeriado(d); }
function proximosHabiles(desde,n) {
    const dias=[]; const cur=new Date(desde); cur.setHours(0,0,0,0);
    while(dias.length<n){cur.setDate(cur.getDate()+1);if(esHabil(cur))dias.push(new Date(cur));}
    return dias;
}

function modalVencimientos() {
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    const habiles=proximosHabiles(hoy,5);
    const limite=habiles[habiles.length-1];

    const proximos=listaServicios.filter(s=>{
        if(!s.fVto) return false;
        if(s.pagado>=s.presupuesto&&s.presupuesto>0) return false;
        const vto=new Date(s.fVto+'T00:00:00');
        return vto>=hoy&&vto<=limite;
    });
    if(proximos.length===0) return;

    const conDias=proximos.map(s=>{
        const vto=new Date(s.fVto+'T00:00:00');
        let dh=0; const cur=new Date(hoy);
        while(cur<vto){cur.setDate(cur.getDate()+1);if(esHabil(cur))dh++;}
        return {...s,vtoDate:vto,diasH:dh};
    }).sort((a,b)=>a.vtoDate-b.vtoDate);

    const fmtF=d=>d.toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});

    const items=conDias.map(s=>{
        const urg=s.diasH<=2;
        const lbl=s.diasH===0?'¡Hoy!':s.diasH===1?'1 día hábil':s.diasH+' días hábiles';
        const pend=s.presupuesto>0?fmt(s.presupuesto-s.pagado):'—';
        const sub=s.pagado>0?`Pago parcial · Resta ${pend}`:`Pendiente · ${pend}`;
        return `<div class="vto-item ${urg?'urgente':'proximo'}">
            <div><div class="vto-nombre">${s.nombre}</div><div class="vto-sub">${sub}</div></div>
            <div class="vto-fecha"><div class="vto-dias">${lbl}</div><div class="vto-txt">${fmtF(s.vtoDate)}</div></div>
        </div>`;
    }).join('');

    const ov=document.createElement('div'); ov.className='modal-overlay no-print'; ov.id='modal-vto';
    ov.innerHTML=`<div class="modal-box">
        <div class="modal-header"><span style="font-size:20px;">⚠️</span><h3>Vencimientos en los próximos 5 días hábiles</h3></div>
        <div class="modal-body">${items}</div>
        <div class="modal-footer"><button class="btn btn-dark" onclick="document.getElementById('modal-vto').remove()">Entendido</button></div>
    </div>`;
    document.body.appendChild(ov);
}

// ═══════════════════════════════════════════
//  REPORTES
// ═══════════════════════════════════════════
function buildReportes() {
    const wrap = document.createElement('div');
    wrap.className = 'container';
    wrap.style.paddingTop = '20px';

    // Header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:3px solid #4f46e5;';
    hdr.innerHTML = `
        <div>
            <h2 style="margin:0;font-size:22px;color:#1e293b;">📈 Reportes Financieros</h2>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Datos en tiempo real · ${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}</p>
        </div>
        <button onclick="window.print()" class="btn btn-dark no-print" style="font-size:12px;padding:8px 14px;">🖨️ Imprimir / PDF</button>`;
    wrap.appendChild(hdr);

    // ── REPORTE 1: RESUMEN MENSUAL ─────────────────────────────
    const r1 = document.createElement('div');
    r1.innerHTML = `<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 1 · Resumen del Mes Actual</h3>`;
    wrap.appendChild(r1);

    const grid1 = document.createElement('div');
    grid1.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:24px;';

    // Card: Saldos bancarios — el saldo ya refleja todos los descuentos
    const mDeb = {};
    listaTarjetas.forEach(t => mDeb[t.id] = 0);
    listaServicios.forEach(s => { if(s.pagado>0 && mDeb[s.medioPagoId]!==undefined) mDeb[s.medioPagoId]+=s.pagado; });
    listaCorrientes.forEach(c => { if(c.fechaPago && mDeb[c.medioPagoId]!==undefined) mDeb[c.medioPagoId]+=c.monto; });

    let totalBancos=0;
    listaBancos.forEach(b => totalBancos+=b.saldo);

    let cardBancos = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #0284c7;padding:16px;">
        <h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🏦 Cuentas Bancarias</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;color:#475569;">Cuenta</th><th style="padding:6px;text-align:right;color:#475569;">Saldo Disponible</th></tr>`;
    listaBancos.forEach(b => {
        cardBancos += `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;font-weight:bold;">${b.nombre}</td>
            <td style="padding:5px 6px;text-align:right;color:#0284c7;font-weight:bold;">${fmt(b.saldo)}</td>
        </tr>`;
    });
    cardBancos += `<tr style="background:#f8fafc;font-weight:bold;">
        <td style="padding:6px;">TOTAL</td>
        <td style="padding:6px;text-align:right;color:#0284c7;">${fmt(totalBancos)}</td>
    </tr></table></div>`;

    // Card: Tarjetas
    let totalTarjDeuda=0;
    let cardTarj = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #a855f7;padding:16px;">
        <h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">💳 Tarjetas de Credito</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;color:#475569;">Tarjeta</th><th style="padding:6px;text-align:right;color:#475569;">Saldo Base</th><th style="padding:6px;text-align:right;color:#475569;">Consumo Mes</th><th style="padding:6px;text-align:right;color:#475569;">Total Deuda</th></tr>`;
    listaTarjetas.forEach(t => {
        const consumo = mDeb[t.id]||0;
        const total = t.saldo+consumo;
        totalTarjDeuda+=total;
        cardTarj += `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;font-weight:bold;">${t.nombre}</td>
            <td style="padding:5px 6px;text-align:right;">${fmt(t.saldo)}</td>
            <td style="padding:5px 6px;text-align:right;color:#a855f7;">${fmt(consumo)}</td>
            <td style="padding:5px 6px;text-align:right;font-weight:bold;color:#a855f7;">${fmt(total)}</td>
        </tr>`;
    });
    cardTarj += `<tr style="background:#f8fafc;font-weight:bold;">
        <td colspan="3" style="padding:6px;">TOTAL DEUDA</td>
        <td style="padding:6px;text-align:right;color:#a855f7;">${fmt(totalTarjDeuda)}</td>
    </tr></table></div>`;

    grid1.innerHTML = cardBancos + cardTarj;
    wrap.appendChild(grid1);

    // Servicios fijos
    let totalPres=0, totalPag=0, totalPend=0;
    listaServicios.forEach(s=>{ totalPres+=s.presupuesto; totalPag+=s.pagado; if(s.presupuesto>s.pagado) totalPend+=(s.presupuesto-s.pagado); });

    let tablaSrv = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:16px;margin-bottom:16px;">
        <h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📋 Servicios Fijos del Mes</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;color:#475569;">Servicio</th><th style="padding:6px;text-align:center;color:#475569;">Clase</th><th style="padding:6px;text-align:right;color:#475569;">Presup.</th><th style="padding:6px;text-align:right;color:#475569;">Pagado</th><th style="padding:6px;text-align:right;color:#475569;">Pendiente</th><th style="padding:6px;text-align:center;color:#475569;">Estado</th></tr>`;
    listaServicios.forEach(s => {
        const pend = Math.max(0, s.presupuesto-s.pagado);
        let estColor='#c5221f', estBg='#fce8e6', estTxt='PENDIENTE';
        if(s.pagado>=s.presupuesto&&s.presupuesto>0){estColor='#137333';estBg='#e6f4ea';estTxt='PAGADO';}
        else if(s.pagado>0){estColor='#b06000';estBg='#fef7e0';estTxt='PARCIAL';}
        const claseColor = {'M':'#0284c7','O':'#a855f7','X':'#64748b'};
        tablaSrv += `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;font-weight:bold;">${s.nombre}</td>
            <td style="padding:5px 6px;text-align:center;"><span style="font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;background:${claseColor[s.clase||'M']}22;color:${claseColor[s.clase||'M']};">${s.clase||'M'}</span></td>
            <td style="padding:5px 6px;text-align:right;">${fmt(s.presupuesto)}</td>
            <td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(s.pagado)}</td>
            <td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pend)}</td>
            <td style="padding:5px 6px;text-align:center;"><span style="font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;background:${estBg};color:${estColor};">${estTxt}</span></td>
        </tr>`;
    });
    tablaSrv += `<tr style="background:#f8fafc;font-weight:bold;">
        <td style="padding:6px;">TOTAL</td>
        <td style="padding:6px;text-align:right;">${fmt(totalPres)}</td>
        <td style="padding:6px;text-align:right;color:#10b981;">${fmt(totalPag)}</td>
        <td style="padding:6px;text-align:right;color:#ef4444;">${fmt(totalPend)}</td>
        <td></td>
    </tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend', tablaSrv);

    // Reporte por clase de gasto
    const clases = [{k:'M',label:'M — Mío',color:'#0284c7'},{k:'O',label:'O — Oma',color:'#a855f7'},{k:'X',label:'X — Otros',color:'#64748b'}];
    let tablaClase = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #6366f1;padding:16px;margin-bottom:16px;">
        <h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">📊 Servicios Fijos por Clase</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;color:#475569;">Clase</th><th style="padding:6px;text-align:right;color:#475569;">Presupuestado</th><th style="padding:6px;text-align:right;color:#475569;">Pagado</th><th style="padding:6px;text-align:right;color:#475569;">Pendiente</th><th style="padding:6px;text-align:right;color:#475569;">% del total</th></tr>`;
    clases.forEach(cl => {
        const srvClase = listaServicios.filter(s=>(s.clase||'M')===cl.k);
        const pres = srvClase.reduce((a,s)=>a+s.presupuesto,0);
        const pag  = srvClase.reduce((a,s)=>a+s.pagado,0);
        const pend = srvClase.reduce((a,s)=>a+Math.max(0,s.presupuesto-s.pagado),0);
        const pct  = totalPres>0 ? ((pres/totalPres)*100).toFixed(1) : '0.0';
        tablaClase += `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;"><span style="font-weight:bold;padding:2px 8px;border-radius:4px;background:${cl.color}22;color:${cl.color};">${cl.label}</span></td>
            <td style="padding:5px 6px;text-align:right;font-weight:bold;">${fmt(pres)}</td>
            <td style="padding:5px 6px;text-align:right;color:#10b981;">${fmt(pag)}</td>
            <td style="padding:5px 6px;text-align:right;color:#ef4444;">${fmt(pend)}</td>
            <td style="padding:5px 6px;text-align:right;">${pct}%</td>
        </tr>`;
    });
    tablaClase += `<tr style="background:#f8fafc;font-weight:bold;">
        <td style="padding:6px;">TOTAL</td>
        <td style="padding:6px;text-align:right;">${fmt(totalPres)}</td>
        <td style="padding:6px;text-align:right;color:#10b981;">${fmt(totalPag)}</td>
        <td style="padding:6px;text-align:right;color:#ef4444;">${fmt(totalPend)}</td>
        <td></td>
    </tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend', tablaClase);

    wrap.insertAdjacentHTML('beforeend', tablaClase);

    // Gráfico de torta: un sector por servicio fijo
    const srvConPres = [...listaServicios.filter(s => s.presupuesto > 0)].sort((a,b) => b.presupuesto - a.presupuesto);
    if (srvConPres.length > 0) {
        const totalTorta = srvConPres.reduce((a,s)=>a+s.presupuesto,0);
        // Paleta de colores
        const paleta = ['#4f46e5','#0284c7','#10b981','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#6366f1','#14b8a6'];

        const divTorta = document.createElement('div');
        divTorta.style.cssText = 'background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #4f46e5;padding:20px;margin-bottom:24px;';
        divTorta.innerHTML = `<h4 style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;">🥧 Distribución Presupuesto · Servicios Fijos del Mes</h4>
            <div style="display:flex;align-items:flex-start;justify-content:center;gap:32px;flex-wrap:wrap;">
                <div id="torta-wrap"></div>
                <div id="torta-leyenda" style="max-height:320px;overflow-y:auto;"></div>
            </div>`;
        wrap.appendChild(divTorta);

        setTimeout(() => {
            const tw = document.getElementById('torta-wrap');
            if (!tw) return;
            const canvas = document.createElement('canvas');
            canvas.width = 300; canvas.height = 300;
            tw.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            const cx = 150, cy = 150, r = 120, ri = 60;
            let anguloInicio = -Math.PI / 2;

            srvConPres.forEach((s, i) => {
                const pct = s.presupuesto / totalTorta;
                const anguloFin = anguloInicio + pct * 2 * Math.PI;
                const color = paleta[i % paleta.length];

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, anguloInicio, anguloFin);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Mostrar % solo si el sector es suficientemente grande
                if (pct > 0.05) {
                    const midAngle = anguloInicio + (anguloFin - anguloInicio) / 2;
                    const lx = cx + (r * 0.68) * Math.cos(midAngle);
                    const ly = cy + (r * 0.68) * Math.sin(midAngle);
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((pct*100).toFixed(0)+'%', lx, ly);
                }
                anguloInicio = anguloFin;
            });

            // Agujero central
            ctx.beginPath();
            ctx.arc(cx, cy, ri, 0, 2*Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Total', cx, cy - 10);
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#4f46e5';
            ctx.fillText(fmt(totalTorta), cx, cy + 10);

            // Leyenda
            const ley = document.getElementById('torta-leyenda');
            if (ley) {
                ley.innerHTML = srvConPres.map((s, i) => {
                    const color = paleta[i % paleta.length];
                    const pct = (s.presupuesto/totalTorta*100).toFixed(1);
                    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <div style="width:12px;height:12px;border-radius:3px;background:${color};flex-shrink:0;"></div>
                        <div>
                            <span style="font-size:12px;font-weight:bold;color:#1e293b;">${s.nombre}</span>
                            <span style="font-size:11px;color:#64748b;margin-left:6px;">${fmt(s.presupuesto)} · ${pct}%</span>
                        </div>
                    </div>`;
                }).join('');
            }
        }, 50);
    }

    // Gastos corrientes por rubro
    const porRubro = {};
    listaCorrientes.filter(c=>c.fechaPago).forEach(c => { porRubro[c.rubro]=(porRubro[c.rubro]||0)+c.monto; });
    const porRubroSinFecha = {};
    listaCorrientes.filter(c=>!c.fechaPago).forEach(c => { porRubroSinFecha[c.rubro]=(porRubroSinFecha[c.rubro]||0)+c.monto; });
    const totalCorr = Object.values(porRubro).reduce((a,b)=>a+b,0);
    const totalPendCorr = Object.values(porRubroSinFecha).reduce((a,b)=>a+b,0);

    let tablaCorr = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #10b981;padding:16px;margin-bottom:24px;">
        <h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">🛍️ Gastos Corrientes por Rubro</h4>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f8fafc;"><th style="padding:6px;text-align:left;color:#475569;">Rubro</th><th style="padding:6px;text-align:right;color:#475569;">Pagado</th><th style="padding:6px;text-align:right;color:#475569;">Sin confirmar</th><th style="padding:6px;text-align:right;color:#475569;">% del total</th></tr>`;
    const todosRubros = new Set([...Object.keys(porRubro), ...Object.keys(porRubroSinFecha)]);
    [...todosRubros].sort().forEach(r => {
        const pag = porRubro[r]||0;
        const pend = porRubroSinFecha[r]||0;
        const pct = totalCorr>0 ? ((pag/totalCorr)*100).toFixed(1) : '0.0';
        tablaCorr += `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 6px;font-weight:bold;">${r}</td>
            <td style="padding:5px 6px;text-align:right;color:#10b981;font-weight:bold;">${fmt(pag)}</td>
            <td style="padding:5px 6px;text-align:right;color:#94a3b8;">${fmt(pend)}</td>
            <td style="padding:5px 6px;text-align:right;">${pct}%</td>
        </tr>`;
    });
    tablaCorr += `<tr style="background:#f8fafc;font-weight:bold;">
        <td style="padding:6px;">TOTAL</td>
        <td style="padding:6px;text-align:right;color:#10b981;">${fmt(totalCorr)}</td>
        <td style="padding:6px;text-align:right;color:#94a3b8;">${fmt(totalPendCorr)}</td>
        <td></td>
    </tr></table></div>`;
    wrap.insertAdjacentHTML('beforeend', tablaCorr);

    // ── REPORTE 2: ACUMULADO 12 MESES ──────────────────────────
    wrap.insertAdjacentHTML('beforeend', `<h3 style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#f59e0b;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Reporte 2 · Análisis por Rubro · Últimos 12 Meses</h3>`);

    // Recopilar todos los meses (historico + actual)
    const ultimos12 = [...historicoMeses].slice(-12);
    const mesesData = ultimos12.map(m => ({ nombre: m.nombre, datos: m.datos }));
    // Agregar mes actual
    mesesData.push({ nombre: 'Mes Actual', datos: { listaCorrientes, listaRubros } });

    // Construir matriz rubros x meses
    const todosRub = new Set();
    mesesData.forEach(m => (m.datos.listaCorrientes||[]).filter(c=>c.fechaPago).forEach(c=>todosRub.add(c.rubro)));
    const rubrosArr = [...todosRub].sort();

    if (rubrosArr.length === 0) {
        wrap.insertAdjacentHTML('beforeend', `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:24px;text-align:center;color:#94a3b8;">Sin datos históricos suficientes aún. Los rubros aparecerán al acumular meses cerrados.</div>`);
    } else {
        // Tabla de rubros x meses
        const colMeses = mesesData.map(m => m.nombre.replace(' de ', ' '));
        let t2 = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;border-top:4px solid #f59e0b;padding:16px;margin-bottom:16px;overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;">
            <thead><tr style="background:#1e293b;">
                <th style="padding:7px 8px;text-align:left;color:white;font-size:11px;">Rubro</th>`;
        colMeses.forEach(m => { t2+=`<th style="padding:7px 8px;text-align:right;color:white;font-size:11px;">${m}</th>`; });
        t2+=`<th style="padding:7px 8px;text-align:right;color:#f59e0b;font-size:11px;">TOTAL</th></tr></thead><tbody>`;

        let totalGeneral=0;
        const totalesMes = new Array(mesesData.length).fill(0);

        rubrosArr.forEach((rub, ri) => {
            let totalRub=0;
            t2+=`<tr style="background:${ri%2===0?'#ffffff':'#f8fafc'};">
                <td style="padding:5px 8px;font-weight:bold;color:#334155;">${rub}</td>`;
            mesesData.forEach((m, mi) => {
                const suma = (m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===rub).reduce((a,c)=>a+c.monto,0);
                totalesMes[mi]+=suma;
                totalRub+=suma;
                const col = suma>0 ? '#10b981' : '#94a3b8';
                t2+=`<td style="padding:5px 8px;text-align:right;color:${col};font-weight:${suma>0?'bold':'normal'};">${suma>0?fmt(suma):'—'}</td>`;
            });
            totalGeneral+=totalRub;
            t2+=`<td style="padding:5px 8px;text-align:right;font-weight:bold;color:#f59e0b;">${fmt(totalRub)}</td></tr>`;
        });

        // Fila totales
        t2+=`<tr style="background:#f1f5f9;font-weight:bold;">
            <td style="padding:7px 8px;color:#1e293b;">TOTAL MES</td>`;
        totalesMes.forEach(t => { t2+=`<td style="padding:7px 8px;text-align:right;color:#4f46e5;">${fmt(t)}</td>`; });
        t2+=`<td style="padding:7px 8px;text-align:right;color:#f59e0b;">${fmt(totalGeneral)}</td></tr>`;
        t2+=`</tbody></table></div>`;
        wrap.insertAdjacentHTML('beforeend', t2);

        // Resumen: top rubros
        const topRubros = rubrosArr.map(r => ({
            rubro: r,
            total: mesesData.reduce((a,m)=>a+(m.datos.listaCorrientes||[]).filter(c=>c.fechaPago&&c.rubro===r).reduce((b,c)=>b+c.monto,0),0)
        })).sort((a,b)=>b.total-a.total);

        const totalAcum = topRubros.reduce((a,r)=>a+r.total,0);

        let resumen = `<div style="background:white;border-radius:8px;border:1px solid #cbd5e1;padding:16px;margin-bottom:24px;">
            <h4 style="margin:0 0 12px;font-size:12px;color:#64748b;text-transform:uppercase;">Participacion por Rubro (acumulado)</h4>`;
        topRubros.forEach(r => {
            const pct = totalAcum>0 ? (r.total/totalAcum*100).toFixed(1) : 0;
            const barW = Math.round(pct);
            resumen+=`<div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                    <span style="font-weight:bold;color:#334155;">${r.rubro}</span>
                    <span style="color:#64748b;">${fmt(r.total)} · ${pct}%</span>
                </div>
                <div style="background:#e2e8f0;border-radius:4px;height:10px;">
                    <div style="background:linear-gradient(90deg,#f59e0b,#f97316);height:10px;border-radius:4px;width:${barW}%;"></div>
                </div>
            </div>`;
        });
        resumen+=`<div style="font-size:12px;color:#64748b;text-align:right;margin-top:8px;font-weight:bold;">Total acumulado: ${fmt(totalAcum)}</div></div>`;
        wrap.insertAdjacentHTML('beforeend', resumen);
    }

    return wrap;
}

// ═══════════════════════════════════════════
//  VISTA HISTÓRICA
// ═══════════════════════════════════════════
function buildHistorico(mes) {
    const db=mes.datos;
    const wrap=document.createElement('div');

    const banner=document.createElement('div'); banner.className='hist-banner no-print';
    banner.innerHTML=`<span style="font-size:20px;">🗂</span><div><strong>Período Cerrado: ${mes.nombre}</strong><div style="font-size:11px;margin-top:2px;">Vista de sólo lectura</div></div>`;
    wrap.appendChild(banner);

    let sumB=0,sumT=0,totP=0,fijoP=0;
    db.listaBancos.forEach(b=>sumB+=b.saldo);
    db.listaTarjetas.forEach(t=>sumT+=t.saldo);
    db.listaServicios.forEach(s=>{totP+=s.pagado;if(s.presupuesto>s.pagado)fijoP+=(s.presupuesto-s.pagado);});
    db.listaCorrientes.forEach(c=>totP+=c.monto);

    const cont=document.createElement('div'); cont.className='container';
    cont.innerHTML=`<div style="height:15px;"></div>
    <div class="grid-dashboard">
        <div class="card-bal" style="border-left:5px solid #0284c7;"><h4>Efectivo / Banco (Cierre)</h4><p style="color:#0284c7;">${fmt(sumB)}</p></div>
        <div class="card-bal" style="border-left:5px solid #a855f7;"><h4>Deuda Tarjetas (Cierre)</h4><p style="color:#a855f7;">${fmt(sumT)}</p></div>
        <div class="card-bal" style="border-left:5px solid #10b981;"><h4>Total Egresado</h4><p style="color:#10b981;">${fmt(totP)}</p></div>
        <div class="card-bal" style="border-left:5px solid ${fijoP>0?'#ef4444':'#10b981'};"><h4>Fijos Pendientes al Cierre</h4><p style="color:${fijoP>0?'#ef4444':'#10b981'};">${fmt(fijoP)}</p></div>
    </div>
    <div class="grid-principal">
        <div>
            ${roTablaSimple('🏦 Bancos al Cierre','panel-bancos',['Cuenta','Saldo'],db.listaBancos.map(b=>[b.nombre,fmt(b.saldo)]))}
            ${roTablaSimple('💳 Tarjetas al Cierre','panel-tarjetas',['Tarjeta','Deuda'],db.listaTarjetas.map(t=>[t.nombre,fmt(t.saldo)]))}
            ${roTablaTransf(db)}
        </div>
        <div>${roTablaServicios(db)}${roTablaCorrientes(db)}</div>
    </div>`;
    wrap.appendChild(cont);
    return wrap;
}

function roTablaSimple(titulo,cls,headers,rows) {
    const ths=headers.map(h=>`<th>${h}</th>`).join('');
    const trs=rows.length===0?`<tr><td colspan="${headers.length}" class="tc" style="color:#94a3b8;padding:12px;">Sin datos</td></tr>`:
        rows.map(r=>`<tr>${r.map((c,i)=>`<td class="ro-cell${i>0?' ro-money':''}">${c}</td>`).join('')}</tr>`).join('');
    return `<div class="panel ${cls}"><h3 class="panel-title">${titulo}</h3><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function roTablaTransf(db) {
    const trs=(db.listaTransferencias||[]).length===0?
        '<tr><td colspan="4" class="tc" style="color:#94a3b8;padding:12px;">Sin transferencias.</td></tr>':
        db.listaTransferencias.map(t=>`<tr>
            <td class="ro-cell ro-muted">${t.fecha||'—'}</td>
            <td class="ro-cell ro-muted">${t.origenNombre}</td>
            <td class="ro-cell ro-muted">${t.destinoNombre}</td>
            <td class="ro-cell ro-money" style="color:#f59e0b;">${fmt(t.monto)}</td>
        </tr>`).join('');
    return `<div class="panel panel-transf"><h3 class="panel-title">↔️ Transferencias</h3>
        <table><thead><tr><th>Fecha</th><th>Origen</th><th>Destino</th><th class="tr">Monto</th></tr></thead>
        <tbody>${trs}</tbody></table></div>`;
}

function roTablaServicios(db) {
    const rows=db.listaServicios.map(s=>{
        let est='PENDIENTE',estC='#c5221f';
        if(s.pagado>=s.presupuesto&&s.presupuesto>0){est='PAGADO';estC='#137333';}
        else if(s.pagado>0){est='PARCIAL';estC='#b06000';}
        return `<tr>
            <td class="ro-cell"><b>${s.nombre}</b></td>
            <td class="ro-cell ro-muted">${s.fVto||'—'}</td>
            <td class="ro-cell ro-money">${fmt(s.presupuesto)}</td>
            <td class="ro-cell ro-money">${fmt(s.pagado)}</td>
            <td class="ro-cell ro-muted tc">${s.fPago||'—'}</td>
            <td class="ro-cell ro-muted">${medioNomDB(db,s.medioPagoId)}</td>
            <td class="tc"><span style="font-size:10px;font-weight:bold;padding:3px 6px;border-radius:4px;background:${estC}22;color:${estC}">${est}</span></td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" class="tc" style="color:#94a3b8;padding:12px;">Sin servicios</td></tr>';
    return `<div class="panel panel-servicios"><h3 class="panel-title">📋 Servicios Fijos</h3>
        <table><thead><tr><th style="width:22%">Servicio</th><th style="width:13%">Vto.</th><th style="width:12%" class="tr">Presup.</th>
        <th style="width:12%" class="tr">Pagado</th><th style="width:12%" class="tc">F.Pago</th>
        <th style="width:18%">Medio</th><th style="width:11%" class="tc">Estado</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
}

function roTablaCorrientes(db) {
    const rows=db.listaCorrientes.length===0?
        '<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin egresos corrientes.</td></tr>':
        db.listaCorrientes.map(c=>`<tr>
            <td class="ro-cell">${c.rubro}</td>
            <td class="ro-cell">${c.detalle}</td>
            <td class="ro-cell ro-muted">${medioNomDB(db,c.medioPagoId)}</td>
            <td class="ro-cell ro-muted tc">${c.fechaPago||'—'}</td>
            <td class="ro-cell ro-green tr">${fmt(c.monto)}</td>
        </tr>`).join('');
    return `<div class="panel panel-corrientes"><h3 class="panel-title">🛍️ Gastos Corrientes</h3>
        <table><thead><tr><th style="width:22%">Rubro</th><th style="width:28%">Detalle</th>
        <th style="width:23%">Medio</th><th style="width:12%" class="tc">F.Pago</th>
        <th style="width:15%" class="tr">Monto</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
}

function medioNomDB(db,id) {
    const b=(db.listaBancos||[]).find(x=>x.id===id); if(b) return '🏦 '+b.nombre;
    const t=(db.listaTarjetas||[]).find(x=>x.id===id); if(t) return '💳 '+t.nombre;
    return '—';
}

// ═══════════════════════════════════════════
//  CUOTAS
// ═══════════════════════════════════════════
function bindCuotas() {
    const fC = document.getElementById('form-cuota');
    if (!fC || fC._bound) return;
    fC._bound = true;
    fC.addEventListener('submit', altaCuota);

    // Preview monto cuota
    ['cuota-total','cuota-cant'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', actualizarPreviewCuota);
    });
}

function actualizarPreviewCuota() {
    const total = parseFloat(document.getElementById('cuota-total')?.value) || 0;
    const cant  = parseInt(document.getElementById('cuota-cant')?.value)   || 0;
    const prev  = document.getElementById('cuota-preview');
    if (prev) prev.innerText = (total > 0 && cant > 0) ? 'Cuota: ' + fmt(Math.ceil(total / cant)) + '/mes' : '';
}

function altaCuota(e) {
    e.preventDefault();
    const desc    = v('cuota-desc');
    const total   = n('cuota-total');
    const cant    = parseInt(document.getElementById('cuota-cant')?.value) || 0;
    const medioId = v('cuota-medio');
    if (!desc || total <= 0 || cant < 2) { alert('Completá todos los campos.'); return; }

    const montoCuota = Math.ceil(total / cant);
    const cuota = { id: 'cuota_' + Date.now(), descripcion: desc, montoTotal: total, totalCuotas: cant, montoCuota, medioPagoId: medioId, cuotaActual: 1 };
    listaCuotas.push(cuota);

    // Asentar la primera cuota como servicio fijo del mes actual
    listaServicios.push({
        id: 's_cuota_' + cuota.id + '_1',
        nombre: desc + ' (1/' + cant + ')',
        presupuesto: montoCuota,
        pagado: 0, fVto: '', fPago: '',
        medioPagoId: medioId,
        esCuota: true, cuotaId: cuota.id
    });

    guardar(); e.target.reset(); document.getElementById('cuota-preview').innerText = ''; render();
}

function elimCuota(id) {
    if (!confirm('¿Eliminar esta cuota? Se eliminarán también sus servicios fijos pendientes.')) return;
    listaCuotas = listaCuotas.filter(c => c.id !== id);
    listaServicios = listaServicios.filter(s => s.cuotaId !== id);
    guardar(); render();
}

function renderCuotas() {
    const tC = document.getElementById('t-cuotas');
    if (!tC) return;

    // Poblar select medio de cuota
    const sM = document.getElementById('cuota-medio');
    if (sM && sM.options.length === 0) {
        listaBancos.forEach(b => addOpt(sM, b.id, '🏦 ' + b.nombre));
        listaTarjetas.forEach(t => addOpt(sM, t.id, '💳 ' + t.nombre));
    }

    bindCuotas();

    tC.innerHTML = '';
    if (listaCuotas.length === 0) {
        tC.innerHTML = '<tr><td colspan="5" class="tc" style="color:#94a3b8;padding:12px;">Sin cuotas activas.</td></tr>';
        return;
    }
    listaCuotas.forEach(c => {
        const resto = c.montoCuota * (c.totalCuotas - c.cuotaActual);
        const pct   = Math.round((c.cuotaActual / c.totalCuotas) * 100);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-size:12px;"><b>${c.descripcion}</b></td>
            <td class="tr" style="font-size:12px;font-weight:bold;color:#6366f1;">${fmt(c.montoCuota)}</td>
            <td class="tc" style="font-size:11px;">
                <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;margin-bottom:3px;">
                    <div style="background:#6366f1;height:8px;border-radius:4px;width:${pct}%;"></div>
                </div>
                ${c.cuotaActual}/${c.totalCuotas}
            </td>
            <td class="tr" style="font-size:12px;color:#64748b;">${fmt(resto)}</td>
            <td class="tc no-print"></td>`;
        const btn = document.createElement('button'); btn.className = 'btn-del'; btn.innerText = '✕';
        btn.onclick = () => elimCuota(c.id);
        tr.lastElementChild.appendChild(btn);
        tC.appendChild(tr);
    });
}

// ═══════════════════════════════════════════
//  HELPERS FORM
// ═══════════════════════════════════════════
function v(id) { return document.getElementById(id)?.value?.trim()||''; }
function n(id) { return parseFloat(document.getElementById(id)?.value)||0; }

// ═══════════════════════════════════════════
//  GOOGLE DRIVE
// ═══════════════════════════════════════════
const GDRIVE_CLIENT_ID = '1049169592532-is5j1j4s1bmgrc9tsq48slrgul8fbj17.apps.googleusercontent.com';
const GDRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
let gdriveToken = null;

function driveGetToken(callback) {
    if (gdriveToken) { callback(gdriveToken); return; }
    // Cargar script de Google si no está cargado
    if (typeof google === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = () => driveIniciarToken(callback);
        s.onerror = () => alert('No se pudo cargar Google. Verificá tu conexión.');
        document.head.appendChild(s);
        return;
    }
    driveIniciarToken(callback);
}

function driveIniciarToken(callback) {
    const client = google.accounts.oauth2.initTokenClient({
        client_id: GDRIVE_CLIENT_ID,
        scope: GDRIVE_SCOPE,
        callback: resp => {
            if (resp.error) { alert('Error al conectar con Google Drive: ' + resp.error); return; }
            gdriveToken = resp.access_token;
            callback(gdriveToken);
        }
    });
    client.requestAccessToken();
}

function driveExportar() {
    driveGetToken(token => {
        const ahora = new Date();
        const fecha = ahora.getFullYear() +
            String(ahora.getMonth()+1).padStart(2,'0') +
            String(ahora.getDate()).padStart(2,'0') + '_' +
            String(ahora.getHours()).padStart(2,'0') +
            String(ahora.getMinutes()).padStart(2,'0');
        const nombre = `backup_finanzas_${fecha}.json`;
        const data = JSON.stringify({listaBancos,listaTarjetas,listaServicios,listaCorrientes,listaRubros,listaTransferencias,listaCuotas,historicoMeses});

        const meta = JSON.stringify({ name: nombre, parents: ['appDataFolder'] });
        const blob = new Blob([data], { type: 'application/json' });
        const form = new FormData();
        form.append('metadata', new Blob([meta], { type: 'application/json' }));
        form.append('file', blob);

        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: form
        })
        .then(r => r.json())
        .then(f => {
            if (f.id) alert('Backup guardado en Drive: ' + nombre);
            else { alert('Error al subir: ' + JSON.stringify(f)); gdriveToken = null; }
        })
        .catch(e => { alert('Error: ' + e.message); gdriveToken = null; });
    });
}

function driveImportar() {
    driveGetToken(token => {
        // Listar archivos de backup
        fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&orderBy=modifiedTime+desc&pageSize=20", {
            headers: { Authorization: 'Bearer ' + token }
        })
        .then(r => r.json())
        .then(data => {
            const archivos = (data.files || []).filter(f => f.name.startsWith('backup_finanzas_'));
            mostrarModalDrive(archivos, token);
        })
        .catch(e => { alert('Error al listar Drive: ' + e.message); gdriveToken = null; });
    });
}

function mostrarModalDrive(archivos, token) {
    const existente = document.getElementById('modal-drive');
    if (existente) existente.remove();

    const ov = document.createElement('div');
    ov.className = 'drive-modal'; ov.id = 'modal-drive';

    let items = '';
    if (archivos.length === 0) {
        items = '<p style="color:#64748b;text-align:center;padding:20px;">No hay backups en Drive todavía.<br>Usá "Subir a Drive" para crear el primero.</p>';
    } else {
        archivos.forEach(f => {
            const fecha = new Date(f.modifiedTime).toLocaleString('es-AR');
            items += `<div class="drive-file" onclick="driveCargarArchivo('${f.id}','${f.name}')">
                <div>
                    <div class="drive-file-name">📄 ${f.name}</div>
                    <div class="drive-file-date">${fecha}</div>
                </div>
                <span style="font-size:11px;color:#4285f4;font-weight:bold;">Restaurar →</span>
            </div>`;
        });
    }

    ov.innerHTML = `<div class="drive-box">
        <div class="drive-header">
            <h3>☁️ Backups en Google Drive</h3>
            <button onclick="document.getElementById('modal-drive').remove()" style="background:transparent;border:none;color:white;font-size:18px;cursor:pointer;">✕</button>
        </div>
        <div class="drive-body">${items}</div>
        <div class="drive-footer">
            <button class="btn" style="background:#e2e8f0;color:#334155;" onclick="document.getElementById('modal-drive').remove()">Cancelar</button>
        </div>
    </div>`;
    document.body.appendChild(ov);
    // Guardar token para uso del modal
    window._driveToken = token;
}

function driveCargarArchivo(id, nombre) {
    if (!confirm('Restaurar backup ' + nombre + '? Se reemplazaran todos los datos.')) return;
    document.getElementById('modal-drive').remove();

    fetch('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media', {
        headers: { Authorization: 'Bearer ' + window._driveToken }
    })
    .then(r => r.json())
    .then(res => {
        if (!res.listaBancos || !res.listaServicios) { alert('Backup inválido.'); return; }
        listaBancos         = res.listaBancos;
        listaTarjetas       = res.listaTarjetas       || [];
        listaServicios      = res.listaServicios;
        listaCorrientes     = res.listaCorrientes     || [];
        listaRubros         = res.listaRubros         || [];
        listaTransferencias = res.listaTransferencias || [];
        listaCuotas         = res.listaCuotas         || [];
        historicoMeses      = res.historicoMeses      || [];
        guardar(); renderTabs(); renderContenido();
        alert('Backup restaurado: ' + nombre);
    })
    .catch(e => alert('Error al descargar: ' + e.message));
}

// ═══════════════════════════════════════════
//  SERVICE WORKER
// ═══════════════════════════════════════════
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(r => console.log('SW:', r.scope))
            .catch(e => console.log('SW error:', e));
    });
}
