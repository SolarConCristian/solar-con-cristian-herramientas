/* Solar con Cristian · simulador: lectura de factura, recomendación por marca, simulación 24 h y animaciones de scroll.
   Todo corre en el navegador. Ningún archivo sale del teléfono o la computadora de la persona. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '17873901302';
  var FORM = 'https://forms.gle/PQHGJS21RnGeX22AA';
  var KWH_PER_KWP_MONTH = 135;     // Puerto Rico, con pérdidas (estimado)
  // paneles que instala Solar con Cristian: Tesla 410 o 440 W, Enphase 410 W, EG4 (neta y off-grid) 580 W
  var PANEL_AREA = { 410: 1.95, 440: 2.0, 580: 2.58 };   // m² por panel (aprox.)
  function panelW(brand, mode, tp) { return mode === 'off' || brand === 'eg4' ? 580 : brand === 'enphase' ? 410 : (tp === 410 ? 410 : 440); }
  var EG4_KWH = 16.07;             // EG4 WallMount 314Ah: 16 kWh por batería
  var RATE = 0.28;                 // $/kWh LUMA todo incluido (factura real oct-2026: promedio 12 meses $0.2793), solo si no hay kWh
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var fmt = function (v, d) { return Number(v).toLocaleString('es-PR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

  /* ------------------------------------------------------------------ dimensionamiento */
  function recommend(o) {
    var M = o.kwh, D = M / 30.4, r = { mode: o.mode, brand: o.mode === 'off' ? 'eg4' : o.brand, type: o.type, kwh: M };
    var kWp = o.mode === 'off' ? D * 1.3 / (KWH_PER_KWP_MONTH / 30.4) : M / KWH_PER_KWP_MONTH;
    var PW = panelW(r.brand, o.mode, o.tpanel); r.panelW = PW;
    r.panels = Math.max(6, Math.ceil(kWp * 1000 / PW));
    r.kWp = r.panels * PW / 1000;
    r.area = Math.round(r.panels * PANEL_AREA[PW]);
    r.prod = Math.round(r.kWp * KWH_PER_KWP_MONTH);
    r.cover = r.prod / M;
    var c = [], P = r.panels + '× paneles de ' + PW + ' W', PK = 'panel' + PW;
    if (o.mode === 'off') {
      var nb = Math.max(1, Math.ceil(D / 0.9 / EG4_KWH));
      var peak = 2.5 + 1.6 * (o.acs || 0) + (o.type === 'negocio' ? 1.5 : 0);
      var ni = Math.max(Math.ceil(peak / 13), Math.ceil(r.kWp / 18));
      r.batt = nb * EG4_KWH; r.units = nb; r.battP = Math.min(10 * ni, nb * 10); r.hub = 'FlexBOSS18'; r.battName = 'EG4 16 kWh';
      r.warranty = 'Garantía de EG4: 10 años.';
      c.push([ni + '× EG4 FlexBOSS18', 'Inversor híbrido · 13 kW · hasta 18 kW de paneles' + (ni > 1 ? ' c/u, en paralelo' : '') + ' · funciona sin LUMA', 'eg4inv'],
        [nb + '× batería EG4 WallMount 16 kWh', fmt(r.batt, 1) + ' kWh en total (~24 h de autonomía)', 'eg4bat'],
        [P, fmt(r.kWp, 2) + ' kWp con 30 % de margen para días nublados', PK], ['Monitoreo EG4', 'Ves producción y batería desde el celular', 'phone'],
        ['Generador (opcional)', 'Para varios días seguidos de lluvia', 'gen']);
      r.note = 'Off-grid trabajamos 100 % con equipos EG4. El tamaño final depende de tus equipos grandes (aires, bomba, calentador) y de cuánta autonomía quieres.';
    } else {
      var target = clamp(D * 0.45, 10, 40);
      if (r.brand === 'tesla') {
        var u = clamp(Math.ceil(target / 13.5), 1, 4);
        r.units = u; r.batt = u * 13.5; r.battP = u * 11.5; r.hub = 'Backup Gateway'; r.battName = 'Powerwall 3';
        c.push([u + '× Tesla Powerwall 3', '13.5 kWh c/u · inversor solar integrado · 11.5 kW', 'pw3'], ['Backup Gateway 3 / Backup Switch', 'Cambia a batería sola cuando se va LUMA', 'gateway'],
          [P, fmt(r.kWp, 2) + ' kWp conectados directo al Powerwall', PK], ['App Tesla', 'Producción, batería y modo apagón en el celular', 'phone']);
        r.warranty = 'Garantía de Tesla: 15 o 25 años, según el programa que elijas.';
        r.why = 'Todo en uno: batería e inversor solar en una sola unidad, instalación limpia y respaldo de la casa.';
      } else if (r.brand === 'enphase') {
        var e = clamp(Math.ceil(target / 5), 2, 8);
        r.units = e; r.batt = e * 5; r.battP = e * 3.84; r.hub = 'IQ Combiner 5'; r.battName = 'IQ Battery 5P';
        c.push([r.panels + '× microinversores IQ8', 'Uno por panel: la sombra de un panel no apaga a los demás', 'iq8'], [e + '× Enphase IQ Battery 5P', '5 kWh c/u · ' + fmt(r.batt) + ' kWh en total', 'iq5p'],
          ['IQ System Controller 3', 'Separa la casa de LUMA durante un apagón', 'sysctl'], ['IQ Combiner 5', 'Medición, protección y comunicación', 'combiner'],
          [P, fmt(r.kWp, 2) + ' kWp', PK], ['App Enphase', 'Ves cada panel por separado', 'phone']);
        r.warranty = 'Garantía de Enphase: 15 años en Puerto Rico (local) o 25 años a través de nuestro programa.';
        r.why = 'Modular: microinversor en cada panel y baterías de 5 kWh que puedes ir sumando.';
      } else {
        var g = Math.max(1, Math.ceil(target / EG4_KWH)), ni = Math.max(1, Math.ceil(r.kWp / 18));
        r.units = g; r.batt = g * EG4_KWH; r.battP = Math.min(10 * ni, g * 10); r.hub = 'FlexBOSS18'; r.battName = 'EG4 16 kWh';
        c.push([ni + '× EG4 FlexBOSS18', 'Inversor híbrido · 13 kW · hasta 18 kW de paneles' + (ni > 1 ? ' c/u' : ''), 'eg4inv'],
          [g + '× batería EG4 WallMount 16 kWh', fmt(r.batt, 1) + ' kWh en total', 'eg4bat']);
        if (ni > 1) c.push(['EG4 GridBOSS', 'Une los inversores y maneja el respaldo', 'gridboss']);
        c.push([P, fmt(r.kWp, 2) + ' kWp', PK], ['Monitoreo EG4', 'Producción, batería y red en el celular', 'phone']);
        r.warranty = 'Garantía de EG4: 10 años.';
        r.why = 'Ecosistema completo de un solo fabricante, con mucha capacidad de batería y crecimiento modular.';
      }
      r.note = 'Meta de diseño en medición neta: que tu factura de LUMA quede cerca del cargo fijo de $8. Es una meta, no una promesa: depende de tu techo, la sombra y tu consumo.';
    }
    r.comps = c;
    return r;
  }

  /* ------------------------------------------------------------------ modelo minuto a minuto */
  var gauss = function (h, m, s) { return Math.exp(-0.5 * Math.pow((h - m) / s, 2)); };
  function loadShape(h, type) {
    return type === 'negocio' ? 0.3 + 1.1 * gauss(h, 13, 3.3) + 0.15 * gauss(h, 19, 1.5)
      : 0.45 + 0.35 * gauss(h, 7.5, 1.2) + 0.25 * gauss(h, 14, 3) + 1.0 * gauss(h, 20.3, 2.2);
  }
  function solarShape(h) { var x = (h - 6.2) / 12.4; return x <= 0 || x >= 1 ? 0 : Math.pow(Math.sin(Math.PI * x), 1.3); }
  function simulate(cfg) {
    var N = 1440, dt = 1 / 60, i, h;
    var sS = 0, lS = 0; for (i = 0; i < N; i++) { h = i / 60; sS += solarShape(h) * dt; lS += loadShape(h, cfg.type) * dt; }
    var D = cfg.kwh / 30.4, pvK = cfg.kWp * (KWH_PER_KWP_MONTH / 30.4) / sS, ldK = D / lS;
    var out = { pv: new Float32Array(N), load: new Float32Array(N), bat: new Float32Array(N), soc: new Float32Array(N), grid: new Float32Array(N), gen: new Float32Array(N), cut: new Float32Array(N), unmet: new Float32Array(N) };
    var C = cfg.batt, P = cfg.battP, gridOn = cfg.mode === 'net' && !cfg.outage, res = gridOn ? (cfg.reserve == null ? 0.2 : cfg.reserve) : 0.08, soc = 0.6;
    for (var day = 0; day < 2; day++) {
      for (i = 0; i < N; i++) {
        h = i / 60;
        var cloud = cfg.cloudy ? 0.35 + 0.15 * Math.sin(i / 23) * Math.sin(i / 7) : 1;
        var pv = pvK * solarShape(h) * cloud, ld = ldK * loadShape(h, cfg.type), net = pv - ld, b = 0, g = 0, gen = 0, cut = 0, un = 0;
        if (net >= 0) {
          b = Math.min(net, P, (1 - soc) * C / dt / 0.95); soc += b * dt * 0.95 / C; var rest = net - b;
          if (gridOn) g = -rest; else cut = rest;
        } else {
          var need = -net; var d = Math.min(need, P, Math.max(0, soc - res) * C / dt); soc -= d * dt / C; b = -d; need -= d;
          if (need > 1e-6) {
            if (gridOn) g = need;
            else if (cfg.gen && cfg.mode === 'off') gen = need;
            else un = need;
          }
        }
        if (day === 1) { out.pv[i] = pv; out.load[i] = ld; out.bat[i] = b; out.soc[i] = soc; out.grid[i] = g; out.gen[i] = gen; out.cut[i] = cut; out.unmet[i] = un; }
      }
    }
    var k, keys = ['pv', 'load', 'imp', 'exp', 'gen', 'unmet', 'chg', 'dis'], cum = {};
    keys.forEach(function (x) { cum[x] = new Float32Array(N); });
    var acc = { pv: 0, load: 0, imp: 0, exp: 0, gen: 0, unmet: 0, chg: 0, dis: 0 };
    for (i = 0; i < N; i++) {
      acc.chg += Math.max(0, out.bat[i]) * dt; acc.dis += Math.max(0, -out.bat[i]) * dt;
      acc.pv += out.pv[i] * dt; acc.load += out.load[i] * dt; acc.imp += Math.max(0, out.grid[i]) * dt; acc.exp += Math.max(0, -out.grid[i]) * dt;
      acc.gen += out.gen[i] * dt; acc.unmet += out.unmet[i] * dt;
      for (k in acc) cum[k][i] = acc[k];
    }
    out.cum = cum; out.maxP = Math.max(pvK, ldK * 1.6);
    return out;
  }

  /* ------------------------------------------------------------------ escena SVG */
  var SKY = [[0, '#070d1f', '#16213d'], [5, '#0b1430', '#2a2f55'], [6.2, '#3b4a7a', '#f2a46b'], [7.6, '#6fa6d8', '#f6d7a8'], [12, '#5aa8e6', '#cfe9fb'],
    [17, '#6aa2d4', '#f3d3a0'], [18.5, '#3c3f73', '#f08a5d'], [19.6, '#121a3a', '#3a3560'], [24, '#070d1f', '#16213d']];
  function hx(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { a = hx(a); b = hx(b); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function sky(h) {
    for (var i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) {
      var t = (h - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return [mix(SKY[i][1], SKY[i + 1][1], t), mix(SKY[i][2], SKY[i + 1][2], t)];
    }
    return [SKY[0][1], SKY[0][2]];
  }
  var uid = 0;
  var FLOWS = { pv: ['M318 226 L226 226 L226 268', '#FFC93C'], load: ['M254 306 L352 306', '#4aa3ff'], bat: ['M200 330 L166 330', '#5BC27A'],
    grid: ['M564 300 L650 300 L726 214', '#b8bcc4'], gen: ['M622 412 L226 412 L226 342', '#c9a0ff'] };
  // diagrama de flujo estilo app: centro (170,145); solar arriba, red izquierda, casa derecha, batería abajo
  var AFLOW = { pv: 'M170 70 L170 124', grid: 'M149 145 L76 145', load: 'M191 145 L264 145', bat: 'M170 166 L170 220', gen: 'M76 145 L149 145' };
  var ICON = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    grid: '<path d="M8 22 12 2l4 20M6.5 9h11M5 15h14M9 15l6-6M15 15 9 9"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    bat: '<rect x="6" y="4" width="12" height="17" rx="2.5"/><path d="M10 2h4M13 8l-3 5h4l-3 5"/>',
    gen: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 7V4h10v3M12 10l-2 3h4l-2 3"/>'
  };
  function node(x, y, key, color, label) {
    return '<g class="nd nd-' + key + '" transform="translate(' + x + ' ' + y + ')"><circle r="25" fill="#1c1c1e" stroke="' + color + '" stroke-width="2"/>' +
      '<g transform="translate(-11 -11) scale(.92)" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[key] + '</g>' +
      '<text class="nd-v" y="' + (key === 'sun' ? -36 : 44) + '" text-anchor="middle">0 kW</text><text class="nd-l" y="' + (key === 'sun' ? -52 : 60) + '" text-anchor="middle">' + label + '</text></g>';
  }

  function Sim(root, mode) {
    var interactive = !!mode, app = mode === 'app';
    var id = 's' + (++uid), self = this;
    this.root = root; this.h = 6; this.playing = false; this.vis = false; this.offs = {}; this.cfg = null; this.data = null;
    var stars = ''; for (var i = 0; i < 26; i++) stars += '<circle cx="' + ((i * 137) % 820) + '" cy="' + (14 + (i * 71) % 170) + '" r="' + (i % 3 ? 1 : 1.6) + '"/>';
    var fl = ''; for (var k in FLOWS) fl += '<path class="trk tk-' + k + '" d="' + FLOWS[k][0] + '"/><path class="fl fl-' + k + '" d="' + FLOWS[k][0] + '" stroke="' + FLOWS[k][1] + '"/>';
    var scene =
      '<div class="scene-wrap"><svg class="scene" viewBox="0 0 820 470" role="img" aria-label="Simulación de un sistema solar funcionando durante el día">' +
      '<defs><linearGradient id="' + id + 'k" x1="0" y1="0" x2="0" y2="1"><stop class="k0" offset="0"/><stop class="k1" offset="1"/></linearGradient>' +
      '<radialGradient id="' + id + 'g"><stop offset="0" stop-color="#FFC93C" stop-opacity=".55"/><stop offset="1" stop-color="#FFC93C" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="820" height="470" fill="url(#' + id + 'k)"/><g class="stars" fill="#fff">' + stars + '</g>' +
      '<circle class="glow" r="70" fill="url(#' + id + 'g)"/><circle class="sun" r="24" fill="#FFC93C"/><circle class="moon" r="15" fill="#e8ecf5"/>' +
      '<path d="M0 400 Q200 386 410 396 T820 392 V470 H0Z" fill="#26401f"/><rect y="404" width="820" height="66" fill="#1f3519"/>' +
      '<g class="palm" stroke="#173014" stroke-width="5" fill="none" stroke-linecap="round"><path d="M770 404 Q764 350 776 300"/><path d="M776 300 q-30 -6 -48 12M776 300 q30 -8 46 10M776 300 q-14 -22 -40 -22M776 300 q18 -22 40 -18M776 300 q2 -26 -6 -38"/></g>' +
      '<rect x="300" y="250" width="260" height="152" rx="3" fill="#ece4d4"/><rect x="290" y="240" width="280" height="12" rx="2" fill="#d6ccb8"/>' +
      '<rect x="412" y="332" width="38" height="70" rx="2" fill="#7b5b3e"/><rect class="win" x="328" y="286" width="54" height="38" rx="2"/><rect class="win" x="482" y="286" width="54" height="38" rx="2"/>' +
      '<rect x="552" y="292" width="14" height="22" rx="2" fill="#9aa09a"/>' +
      '<g class="pnl"></g><text class="pnl-t" x="430" y="196" text-anchor="middle"></text>' +
      '<g class="pole"><line x1="730" y1="206" x2="730" y2="404" stroke="#5c4c3c" stroke-width="7"/><line x1="708" y1="216" x2="752" y2="216" stroke="#5c4c3c" stroke-width="5"/><rect x="738" y="238" width="16" height="24" rx="4" fill="#8d958d"/><text x="730" y="198" text-anchor="middle" class="lbl">LUMA</text>' +
      '<g class="xo" stroke="#ff5a4a" stroke-width="6" stroke-linecap="round"><line x1="712" y1="250" x2="748" y2="286"/><line x1="748" y1="250" x2="712" y2="286"/></g></g>' +
      '<g class="gen"><rect x="622" y="362" width="74" height="42" rx="5" fill="#3b3f3b"/><rect x="630" y="370" width="22" height="10" rx="2" fill="#6c736c"/><text x="659" y="356" text-anchor="middle" class="lbl">Generador</text></g>' +
      '<g class="hub"><rect x="198" y="268" width="56" height="74" rx="6"/><circle cx="226" cy="290" r="4" class="led"/></g><text class="hub-t lbl" x="226" y="360" text-anchor="middle"></text>' +
      '<g class="bats"></g><text class="bat-t lbl" x="104" y="282" text-anchor="middle"></text>' + fl +
      '<text class="clk" x="26" y="50">06:00</text><text class="st" x="26" y="76"></text>' +
      '</svg></div>';
    var chart = '<svg class="chart" viewBox="0 0 800 96" preserveAspectRatio="none" aria-hidden="true"><path class="c-pv"/><path class="c-ld"/><line class="c-cur" y1="0" y2="84"/></svg>' +
      '<div class="ticks" aria-hidden="true"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>12 am</span></div>';
    var legend = '<div class="legend" aria-hidden="true"><span><i style="background:#FFC93C"></i>Solar</span><span><i style="background:#4aa3ff"></i>Casa</span><span><i style="background:#5BC27A"></i>Batería</span>' +
      '<span><i style="background:#b8bcc4"></i>LUMA</span><span><i style="background:#c9a0ff"></i>Generador</span></div>';
    var ctl = '<div class="ctl"><button type="button" class="pp" aria-label="Pausar">❚❚</button><input type="range" class="hr" min="0" max="1439" value="360" aria-label="Hora del día">' +
      '<label class="tg t-out"><input type="checkbox" class="o-out"> Apagón de LUMA</label><label class="tg"><input type="checkbox" class="o-cld"> Día nublado</label>' +
      '<label class="tg t-gen"><input type="checkbox" class="o-gen"> Generador</label></div>';
    if (app) {
      var af = ''; for (var a in AFLOW) af += '<path class="atk atk-' + a + '" d="' + AFLOW[a] + '"/><path class="fl af-' + a + '" d="' + AFLOW[a] + '" stroke="' + FLOWS[a][1] + '"/>';
      var tab = function (v, t, ic) { return '<button type="button" role="tab" data-v="' + v + '" aria-selected="' + (v === 'flow') + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + '</svg>' + t + '</button>'; };
      root.innerHTML = '<div class="app"><div class="phone" aria-label="Simulación en una app de energía">' +
        '<div class="ap-head"><div><small class="ap-sys"></small><b class="ap-clk">6:00 am</b></div><span class="ap-st"></span></div>' +
        '<div class="ap-hero"><div class="ap-pct"><b data-k="soc">0</b><i>%</i></div><small data-k="batl">Batería</small></div>' + scene +
        '<div class="ap-view" data-v="flow"><svg class="aflow" viewBox="0 -22 340 340" role="img" aria-label="Flujo de energía en vivo">' +
        '<circle cx="170" cy="145" r="20" fill="#2c2c2e"/><circle cx="170" cy="145" r="5" fill="#fff"/>' + af +
        node(170, 45, 'sun', '#FFC93C', 'Solar') + node(51, 145, 'grid', '#b8bcc4', 'Red') + node(289, 145, 'home', '#4aa3ff', 'Casa') + node(170, 245, 'bat', '#5BC27A', 'Batería') +
        node(51, 145, 'gen', '#c9a0ff', 'Generador') + '</svg></div>' +
        '<div class="ap-view" data-v="energy" hidden><div class="ap-big"><b data-k="self">0</b><i>%</i><small>Autosuficiente hoy</small></div><ul class="ap-rows"></ul>' + chart + '</div>' +
        '<div class="ap-view" data-v="backup" hidden><div class="ap-big"><b data-k="bkh">0</b><i>h</i><small>Respaldo estimado con tu consumo promedio</small></div>' +
        '<label class="ap-res"><span>Reserva para apagones <b data-k="resv">20 %</b></span><input type="range" class="o-res" min="0" max="100" step="5" value="20"></label>' +
        '<p class="ap-hint">La batería guarda esta parte solo para cuando se va la luz. Más reserva, más horas de respaldo; menos reserva, más ahorro diario.</p>' +
        '<button type="button" class="ap-out">Simular apagón de LUMA</button></div>' +
        '<nav class="ap-tabs" role="tablist" aria-label="Vistas de la app">' +
        tab('flow', 'Flujo', '<path d="M4 12h6l2-5 2 10 2-5h4"/>') + tab('energy', 'Energía', '<path d="M5 20V10M12 20V4M19 20v-7"/>') + tab('backup', 'Respaldo', '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>') + '</nav>' +
        '</div><div class="ap-side"><span class="pill dk">Simulación</span><h3>Así lo verías en la app de tu sistema</h3>' +
        '<p>Un día típico con tu consumo, minuto a minuto. Toca las pestañas de la app, cambia la hora o prueba un apagón y un día nublado.</p>' +
        ctl + legend + '<p class="tot" aria-live="off"></p></div></div>';
    } else {
      root.innerHTML = scene + '<div class="hud"><div class="tile"><small>Solar</small><b data-k="pv">0.0</b><span>kW</span></div><div class="tile"><small>Casa</small><b data-k="load">0.0</b><span>kW</span></div>' +
        '<div class="tile"><small data-k="batl">Batería</small><b data-k="soc">0</b><span>%</span></div><div class="tile"><small data-k="gridl">Red LUMA</small><b data-k="grid">0.0</b><span>kW</span></div></div>' +
        chart + legend + '<p class="tot" aria-live="off"></p>' + (interactive ? ctl : '');
    }
    var q = function (s) { return root.querySelector(s); };
    this.el = { k0: q('.k0'), k1: q('.k1'), stars: q('.stars'), sun: q('.sun'), glow: q('.glow'), moon: q('.moon'), wins: $$('.win', root), pnl: q('.pnl'), pnlT: q('.pnl-t'),
      pole: q('.pole'), xo: q('.xo'), gen: q('.gen'), hub: q('.hub rect'), led: q('.led'), hubT: q('.hub-t'), bats: q('.bats'), batT: q('.bat-t'), clk: q('.clk'), st: q('.st'),
      tiles: {}, cpv: q('.c-pv'), cld: q('.c-ld'), cur: q('.c-cur'), tot: q('.tot'), fl: {}, tk: {} };
    $$('[data-k]', root).forEach(function (n) { self.el.tiles[n.dataset.k] = n; });
    ['pv', 'load', 'soc', 'batl', 'grid', 'gridl', 'self', 'bkh', 'resv'].forEach(function (n) { if (!self.el.tiles[n]) self.el.tiles[n] = document.createElement('span'); });
    for (k in FLOWS) { this.el.fl[k] = [q('.fl-' + k)]; if (q('.af-' + k)) this.el.fl[k].push(q('.af-' + k)); this.el.tk[k] = q('.tk-' + k); this.offs[k] = 0; }
    this.app = app;
    if (window.SolarScene) {
      var sw = q('.scene-wrap');
      try {
        sw.classList.add('has3d'); this.s3 = new window.SolarScene(sw, { tall: app });
        var ov = document.createElement('div'); ov.className = 'g-ov'; ov.innerHTML = '<b></b><span></span>'; sw.appendChild(ov); this.ov = ov;
      } catch (err) { this.s3 = null; sw.classList.remove('has3d'); }
    }
    if (app) {
      var E = this.el;
      E.sys = q('.ap-sys'); E.aclk = q('.ap-clk'); E.ast = q('.ap-st'); E.rows = q('.ap-rows'); E.atkGrid = q('.atk-grid'); E.atkGen = q('.atk-gen');
      E.nd = {}; ['sun', 'grid', 'home', 'bat', 'gen'].forEach(function (n) { E.nd[n] = { g: q('.nd-' + n), v: q('.nd-' + n + ' .nd-v') }; });
      $$('.ap-tabs button', root).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.ap-tabs button', root).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
          $$('.ap-view', root).forEach(function (v) { v.hidden = v.dataset.v !== b.dataset.v; });
        });
      });
      var rs = q('.o-res');
      rs.addEventListener('input', function () { E.tiles.resv.textContent = rs.value + ' %'; });
      rs.addEventListener('change', function () { self.cfg.reserve = rs.value / 100; self.set(self.cfg); });
      q('.ap-out').addEventListener('click', function () { var c = q('.o-out'); c.checked = !c.checked; c.dispatchEvent(new Event('change')); });
      E.apOut = q('.ap-out'); E.rs = rs;
    }
    if (interactive) {
      var pp = q('.pp'), hr = q('.hr');
      pp.addEventListener('click', function () { self.playing = !self.playing; pp.textContent = self.playing ? '❚❚' : '▶'; pp.setAttribute('aria-label', self.playing ? 'Pausar' : 'Reproducir'); });
      hr.addEventListener('input', function () { self.setHour(hr.value / 60); });
      this.el.hr = hr; this.el.pp = pp;
      var re = function () { self.cfg.outage = q('.o-out').checked; self.cfg.cloudy = q('.o-cld').checked; self.cfg.gen = q('.o-gen').checked; self.set(self.cfg); };
      ['.o-out', '.o-cld', '.o-gen'].forEach(function (s) { q(s).addEventListener('change', re); });
      this.el.tOut = q('.t-out'); this.el.tGen = q('.t-gen');
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { self.vis = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(root);
    else this.vis = true;
    var last = performance.now();
    var loop = function (now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (self.vis && self.data) {
        if (self.playing && !RM) self.setHour((self.h + dt * self.speed) % 24);
        if (!RM) self.dash(dt);
      }
      requestAnimationFrame(loop);
    };
    this.speed = 1;
    requestAnimationFrame(loop);
  }
  Sim.prototype.set = function (cfg) {
    this.cfg = cfg; this.data = simulate(cfg); var e = this.el, d = this.data, i;
    // paneles
    var n = cfg.panels, show = Math.min(n, 14), rows = show > 7 ? 2 : 1, per = Math.ceil(show / rows), html = '';
    for (var r = 0; r < rows; r++) {
      var cnt = r === rows - 1 ? show - per * (rows - 1) : per, w = (236 - 6 * (per - 1)) / per, y0 = 237 - r * 20, x0 = 312 + r * 6;
      for (i = 0; i < cnt; i++) { var x = x0 + i * (w + 6); html += '<polygon points="' + [x, y0, x + w, y0, x + w + 7, y0 - 20, x + 7, y0 - 20].join(' ') + '"/>'; }
    }
    e.pnl.innerHTML = html; e.pnlT.textContent = n + ' paneles · ' + fmt(cfg.kWp, 2) + ' kWp';
    if (this.s3) this.s3.build(cfg);
    // baterías
    var u = Math.min(cfg.units, 4), bw = (120 - 6 * (u - 1)) / u, bh = cfg.brand === 'enphase' ? 70 : 104, bh2 = '';
    for (i = 0; i < u; i++) {
      var bx = 44 + i * (bw + 6), by = 404 - bh;
      bh2 += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="6" class="bx"/><rect class="sf" x="' + (bx + 5) + '" width="' + (bw - 10) + '" rx="3" data-y="' + (by + 6) + '" data-h="' + (bh - 12) + '"/>';
    }
    e.bats.innerHTML = bh2; e.sf = $$('.sf', e.bats);
    var brand = cfg.mode === 'off' ? 'eg4' : cfg.brand;
    e.hub.setAttribute('fill', brand === 'tesla' ? '#f1f1ee' : brand === 'enphase' ? '#e3e6e2' : '#202420');
    $$('.bx', e.bats).forEach(function (b) { b.setAttribute('fill', brand === 'tesla' ? '#f6f6f3' : brand === 'enphase' ? '#dfe3de' : '#1b1e1b'); });
    e.hubT.textContent = cfg.hub; e.batT.textContent = (cfg.units > 1 ? cfg.units + '× ' : '') + cfg.battName;
    var gridOn = cfg.mode === 'net';
    e.pole.style.display = gridOn ? '' : 'none'; e.xo.style.display = cfg.outage ? '' : 'none';
    e.gen.style.display = cfg.mode === 'off' && cfg.gen ? '' : 'none';
    e.tk.grid.style.display = gridOn ? '' : 'none'; e.tk.gen.style.display = cfg.mode === 'off' && cfg.gen ? '' : 'none';
    if (e.tOut) { e.tOut.style.display = gridOn ? '' : 'none'; e.tGen.style.display = gridOn ? 'none' : ''; }
    e.tiles.gridl.textContent = gridOn ? 'Red LUMA' : 'Generador';
    if (this.app) {
      e.sys.textContent = (cfg.mode === 'off' ? 'Off-grid · ' : 'Medición neta · ') + (cfg.units > 1 ? cfg.units + '× ' : '') + cfg.battName + ' · ' + fmt(cfg.kWp, 2) + ' kWp';
      var rv = Math.round((cfg.reserve == null ? 0.2 : cfg.reserve) * 100); e.rs.value = rv; e.tiles.resv.textContent = rv + ' %';
      e.rs.closest('.ap-res').hidden = !gridOn;
    }
    // gráfico
    var mx = d.maxP, pts = function (arr) { var s = ''; for (var j = 0; j < 1440; j += 10) s += (j ? 'L' : 'M') + (j / 1439 * 800).toFixed(1) + ' ' + (84 - arr[j] / mx * 76).toFixed(1); return s; };
    e.cpv.setAttribute('d', pts(d.pv) + ' L800 84 L0 84Z'); e.cld.setAttribute('d', pts(d.load));
    this.setHour(this.h);
  };
  Sim.prototype.setHour = function (h) {
    this.h = h; if (!this.data) return;
    var e = this.el, d = this.data, c = this.cfg, i = clamp(Math.floor(h * 60), 0, 1439);
    var s = sky(h); e.k0.setAttribute('stop-color', s[0]); e.k1.setAttribute('stop-color', s[1]);
    var t = (h - 6) / 12.8, up = t > 0 && t < 1, el = up ? Math.sin(Math.PI * t) : 0;
    if (up) { var sx = 60 + 700 * t, sy = 380 - 300 * el; e.sun.setAttribute('cx', sx); e.sun.setAttribute('cy', sy); e.glow.setAttribute('cx', sx); e.glow.setAttribute('cy', sy); }
    e.sun.style.opacity = e.glow.style.opacity = up ? (c.cloudy ? 0.45 : 1) : 0;
    var hm = (h + 12) % 24, tm = (hm - 6) / 12.8, mu = tm > 0 && tm < 1;
    if (mu) { e.moon.setAttribute('cx', 60 + 700 * tm); e.moon.setAttribute('cy', 380 - 300 * Math.sin(Math.PI * tm)); }
    e.moon.style.opacity = mu ? 0.95 : 0;
    var night = 1 - clamp(el * 3, 0, 1); e.stars.style.opacity = night * 0.9;
    var dark = d.unmet[i] > 0.01;
    e.wins.forEach(function (w) { w.setAttribute('fill', dark ? '#2b2f36' : mix('#9cc3dc', '#ffd27a', night)); });
    var pvR = d.pv[i] / (c.kWp || 1);
    $$('polygon', e.pnl).forEach(function (p) { p.setAttribute('fill', mix('#1a2c47', '#3d6a9e', clamp(pvR * 1.4, 0, 1))); });
    e.sf.forEach(function (r) { var hh = +r.dataset.h * d.soc[i]; r.setAttribute('height', hh.toFixed(1)); r.setAttribute('y', (+r.dataset.y + +r.dataset.h - hh).toFixed(1)); r.setAttribute('fill', d.soc[i] < 0.25 ? '#F58220' : '#5BC27A'); });
    e.led.setAttribute('fill', d.pv[i] > 0.05 || d.bat[i] < -0.05 ? '#5BE39A' : '#ffb347');
    var hh2 = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60), ap = hh2 < 12 ? 'am' : 'pm', h12 = hh2 % 12 || 12;
    e.clk.textContent = h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
    // estado
    var g = d.grid[i], b = d.bat[i], st;
    if (dark) st = c.mode === 'off' ? 'Batería en reserva: hace falta generador o más batería' : 'Apagón y batería en reserva: sin luz';
    else if (c.outage && c.mode === 'net') st = 'Apagón de LUMA: tu casa sigue con ' + (d.pv[i] > 0.1 ? 'sol y batería' : 'batería');
    else if (g < -0.05) st = 'Batería llena: el sobrante va a LUMA (medición neta)';
    else if (b > 0.05) st = 'Sobra energía: la batería se está cargando';
    else if (d.gen[i] > 0.05) st = 'Generador apoyando a la batería';
    else if (b < -0.05) st = d.pv[i] > 0.05 ? 'Sol y batería mantienen la casa' : 'Sin sol: la batería mantiene la casa';
    else if (g > 0.05) st = 'Batería en reserva: la red completa lo que falta';
    else if (d.cut[i] > 0.05) st = 'Batería llena: el sistema produce solo lo que usas';
    else st = d.pv[i] > 0.05 ? 'El sol cubre lo que usa la casa' : 'Casa en espera';
    e.st.textContent = st;
    var T = e.tiles; T.pv.textContent = fmt(d.pv[i], 1); T.load.textContent = fmt(d.load[i], 1); T.soc.textContent = fmt(d.soc[i] * 100);
    T.batl.textContent = b > 0.05 ? 'Batería · cargando' : b < -0.05 ? 'Batería · usando' : 'Batería';
    if (c.mode === 'net') { T.grid.textContent = c.outage ? '—' : fmt(Math.abs(g), 1); T.gridl.textContent = c.outage ? 'Red LUMA · apagón' : g < -0.05 ? 'Red · exportando' : g > 0.05 ? 'Red · importando' : 'Red LUMA'; }
    else { T.grid.textContent = fmt(d.gen[i], 1); }
    var cu = d.cum, tx = 'Hasta ahora hoy: ' + fmt(cu.pv[i], 1) + ' kWh producidos · ' + fmt(cu.load[i], 1) + ' kWh usados';
    if (c.mode === 'net' && !c.outage) tx += ' · ' + fmt(cu.exp[i], 1) + ' kWh a LUMA · ' + fmt(cu.imp[i], 1) + ' kWh de LUMA';
    if (cu.gen[i] > 0.05) tx += ' · ' + fmt(cu.gen[i], 1) + ' kWh de generador';
    if (cu.unmet[i] > 0.05) tx += ' · faltaron ' + fmt(cu.unmet[i], 1) + ' kWh';
    e.tot.textContent = tx;
    e.cur.setAttribute('x1', h / 24 * 800); e.cur.setAttribute('x2', h / 24 * 800);
    if (e.hr && document.activeElement !== e.hr) e.hr.value = i;
    this.p = { pv: d.pv[i], load: d.load[i] - d.unmet[i], bat: b, grid: -g, gen: d.gen[i] };
    if (this.s3) {
      this.ov.firstChild.textContent = e.clk.textContent; this.ov.lastChild.textContent = st;
      this.s3.update({ h: h, pv: d.pv[i], load: d.load[i] - d.unmet[i], bat: b, grid: g, gen: d.gen[i], soc: d.soc[i], unmet: d.unmet[i], cloudy: c.cloudy,
        outage: c.outage && c.mode === 'net', kWp: c.kWp, battName: c.mode === 'off' || c.brand === 'eg4' ? 'Baterías EG4' : c.brand === 'enphase' ? 'IQ Battery' : 'Powerwall' });
    }
    if (this.app) this.appHour(i, st);
    if (RM) for (var k in this.p) e.fl[k].forEach(function (f) { f.style.opacity = Math.abs(this.p[k]) > 0.05 ? 1 : 0; }, this);
  };
  Sim.prototype.appHour = function (i, st) {
    var e = this.el, d = this.data, c = this.cfg, net = c.mode === 'net', g = d.grid[i], b = d.bat[i], cu = d.cum;
    e.aclk.textContent = e.clk.textContent;
    var pill = d.unmet[i] > 0.01 ? ['Sin energía', 'bad'] : c.outage && net ? ['Apagón · respaldo', 'warn'] : g < -0.05 ? ['Exportando a LUMA', ''] : b > 0.05 ? ['Cargando batería', 'ok'] :
      d.gen[i] > 0.05 ? ['Generador', 'warn'] : b < -0.05 ? ['Usando batería', 'ok'] : g > 0.05 ? ['Usando la red', ''] : ['Solar cubre la casa', 'ok'];
    e.ast.textContent = pill[0]; e.ast.className = 'ap-st ' + pill[1];
    e.ast.title = st;
    var kw = function (v) { return fmt(Math.abs(v), 1) + ' kW'; };
    e.nd.sun.v.textContent = kw(d.pv[i]); e.nd.home.v.textContent = kw(d.load[i] - d.unmet[i]); e.nd.bat.v.textContent = fmt(d.soc[i] * 100) + ' % · ' + kw(b);
    e.nd.grid.v.textContent = c.outage ? 'apagón' : kw(g); e.nd.gen.v.textContent = kw(d.gen[i]);
    e.nd.grid.g.style.display = e.atkGrid.style.display = net ? '' : 'none';
    e.nd.gen.g.style.display = e.atkGen.style.display = net ? 'none' : '';
    e.nd.grid.g.style.opacity = c.outage ? 0.35 : 1;
    var L = Math.max(0.01, cu.load[i]), self = 1 - (cu.imp[i] + cu.unmet[i] + cu.gen[i]) / L;
    e.tiles.self.textContent = fmt(clamp(self, 0, 1) * 100);
    var rows = [['#FFC93C', 'Solar producido', cu.pv[i]], ['#4aa3ff', 'Casa usó', cu.load[i]], ['#5BC27A', 'Batería cargó', cu.chg[i]], ['#5BC27A', 'Batería entregó', cu.dis[i]]];
    if (net) rows.push(['#b8bcc4', 'De LUMA', cu.imp[i]], ['#b8bcc4', 'A LUMA (crédito)', cu.exp[i]]); else rows.push(['#c9a0ff', 'Generador', cu.gen[i]]);
    e.rows.innerHTML = rows.map(function (r) { return '<li><i style="background:' + r[0] + '"></i>' + r[1] + '<b>' + fmt(r[2], 1) + ' kWh</b></li>'; }).join('');
    var avg = c.kwh / 30.4 / 24, usable = Math.max(0, d.soc[i] - (net && !c.outage ? 0 : 0.08)) * c.batt;
    e.tiles.bkh.textContent = fmt(usable / avg, 0);
    e.apOut.textContent = c.outage ? 'Volver a la red de LUMA' : 'Simular apagón de LUMA';
    e.apOut.hidden = !net;
  };
  Sim.prototype.dash = function (dt) {
    if (!this.p) return; var ref = Math.max(1, this.data.maxP * 0.5);
    for (var k in this.p) {
      var v = this.p[k], fs = this.el.fl[k], on = Math.abs(v) > 0.05;
      if (k === 'grid' && (this.cfg.mode !== 'net' || this.cfg.outage)) on = false;
      if (on) this.offs[k] -= (v > 0 ? 1 : -1) * (14 + 46 * Math.min(1, Math.abs(v) / ref)) * dt;
      for (var j = 0; j < fs.length; j++) { fs[j].style.opacity = on ? 1 : 0; if (on) fs[j].style.strokeDashoffset = this.offs[k].toFixed(1); }
    }
  };

  /* ------------------------------------------------------------------ factura */
  var cache = {};
  function loadScript(src) {
    if (!cache[src]) cache[src] = new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ko(new Error('No se pudo cargar ' + src)); }; document.head.appendChild(s); });
    return cache[src];
  }
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', PDFW = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  function num(s) { s = String(s).trim(); if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return +s.replace(/[.,]/g, ''); return +s.replace(',', '.'); }
  function parseBill(t) {
    t = t.replace(/\s+/g, ' ');
    var N = '(\\d{1,3}(?:[.,]\\d{3})+|\\d{2,5})', m, cands = [], re = new RegExp(N + '\\s*k\\s?wh', 'gi');
    while ((m = re.exec(t))) cands.push(num(m[1]));
    re = new RegExp('k\\s?wh[^\\d$]{0,20}' + N, 'gi'); while ((m = re.exec(t))) cands.push(num(m[1]));
    cands = cands.filter(function (v) { return v >= 30 && v <= 20000; });
    var kwh = null, how = '';
    var ok = function (v) { return v >= 30 && v <= 20000; };
    // LUMA: la línea del cargo de combustible (FCA) se cobra sobre todo el consumo del mes
    var fm = new RegExp('combustible\\s*' + N + '\\s*k\\s?wh', 'i').exec(t);
    var dm = /promedio\s*de\s*consumo\s*diario/i.test(t) && /(\d{1,3}(?:\.\d+)?)\s*kwh\s*promedio\s*de\s*consumo\s*diario/i.exec(t);
    var cm = new RegExp('consumo\\s*(?:de\\s*energ[ií]a\\s*)?(?:kwh\\s*)?[:=]?\\s*' + N + '\\s*k\\s?wh', 'i').exec(t);
    if (fm && ok(num(fm[1]))) { kwh = num(fm[1]); how = 'consumo del mes'; }
    else if (cm && ok(num(cm[1]))) { kwh = num(cm[1]); how = 'consumo del mes'; }
    else if (dm && ok(+dm[1] * 30.4)) { kwh = Math.round(+dm[1] * 30.4); how = 'promedio diario × 30'; }
    else if (cands.length >= 6) { var s = cands.slice().sort(function (a, b) { return a - b; }); kwh = s[Math.floor(s.length / 2)]; how = 'el valor que más se repite en la factura'; }
    else if (cands.length) { kwh = cands[0]; how = 'kWh de la factura'; }
    // Cargos del mes (no la cantidad adeudada, que puede incluir balances anteriores)
    var M = '\\$?\\s*(\\d{1,3}(?:,\\d{3})*\\.\\d{2})', amt = null;
    var am = new RegExp('cargos\\s*corrientes[^$\\d]{0,20}' + M, 'i').exec(t) ||
      new RegExp('(?:total\\s*a\\s*pagar|cantidad\\s*a\\s*pagar|monto\\s*a\\s*pagar|total\\s*de\\s*(?:la\\s*)?factura)[^$\\d]{0,30}' + M, 'i').exec(t) ||
      new RegExp('subtotal[^$]{0,20}\\$[\\d.,]+\\s*total\\s*' + M, 'i').exec(t);
    if (am) amt = +am[1].replace(/,/g, '');
    return { kwh: kwh, how: how, amt: amt, n: cands.length };
  }
  var MES = { ene: 'Ene', feb: 'Feb', mar: 'Mar', abr: 'Abr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Ago', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dic' };
  var money = function (v, d) { return '$' + fmt(v, d || 0); };
  // Historial de consumo de LUMA (página 4): kWh por mes y costo por kWh de cada mes
  function parseHistory(t, amt, lastKwh) {
    t = t.replace(/\s+/g, ' ');
    var mi = /\b(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)-\d{2}\b/i.exec(t);
    if (!mi) return null;
    var run = /^(?:\s*(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:-\d{2})?\b)+/i.exec(t.slice(mi.index));
    if (!run) return null;
    var labels = run[0].trim().split(/\s+/).map(function (x) { return x.toLowerCase().slice(0, 3); });
    var K = labels.length;
    if (K < 6) return null;
    var before = t.slice(Math.max(0, mi.index - 20 - K * 7), mi.index);
    var nums = (before.match(/(?<![\d.,$])\d{1,3}(?:,\d{3})*(?![\d,]|\.\d)/g) || []).map(function (x) { return +x.replace(/,/g, ''); }).filter(function (v) { return v >= 20 && v <= 30000; });
    if (nums.length < K) return null;
    var kwh = nums.slice(-K);
    var cm = /((?:\$0\.\d{2}\s*){6,14})\s*Costo por kWh/i.exec(t), cpk = null;
    if (cm) { var cs = cm[1].match(/0\.\d{2}/g).map(Number); if (cs.length >= K) cpk = cs.slice(-K); }
    var n = Math.min(12, K), off = K - n, months = [];
    for (var i = 0; i < n; i++) {
      var j = off + i, rate = cpk ? cpk[j] : RATE;
      if (j === K - 1 && amt && kwh[j]) rate = amt / kwh[j];   // el mes de esta factura: costo real
      months.push({ l: MES[labels[j]] || labels[j], kwh: kwh[j], usd: kwh[j] * rate, rate: rate, est: !(j === K - 1 && amt) });
    }
    return months;
  }
  // Desglose de los cargos corrientes (página 3)
  function parseBreakdown(t, amt) {
    t = t.replace(/\s+/g, ' ');
    var M = '\\$\\s*(\\d{1,3}(?:,\\d{3})*\\.\\d{2})', pick = function (re) { var m = re.exec(t); return m ? +m[1].replace(/,/g, '') : null; };
    var fijo = pick(new RegExp('cargo\\s*por\\s*cliente\\s*' + M, 'i'));
    var cons = 0, re = new RegExp('cargo\\s*por\\s*consumo(?:\\s*adicional)?\\s*[\\d.,]+\\s*kwh\\s*x\\s*\\$[\\d.]+\\s*' + M, 'gi'), m;
    while ((m = re.exec(t))) cons += +m[1].replace(/,/g, '');
    var fca = pick(new RegExp('FCA[^$]*?kwh\\s*x\\s*\\$[\\d.]+\\s*' + M, 'i'));
    var ppca = pick(new RegExp('PPCA[^$]*?kwh\\s*x\\s*\\$[\\d.]+\\s*' + M, 'i'));
    if (!amt || fca == null) return null;
    var rest = amt - (fijo || 0) - cons - fca - (ppca || 0);
    return [
      { k: 'fca', n: 'Combustible', d: 'Ajuste por cargo de combustible (FCA)', v: fca, c: '#FFC93C' },
      { k: 'ppca', n: 'Compra de energía', d: 'Ajuste por compra de energía (PPCA)', v: ppca || 0, c: '#F58220' },
      { k: 'dist', n: 'Distribución y tarifa base', d: 'Cargo por consumo: uso de la red', v: cons, c: '#4aa3ff' },
      { k: 'otros', n: 'Subsidios, CILTA y otros', d: 'Subsidios, municipios y eficiencia energética', v: Math.max(0, rest), c: '#98a190' },
      { k: 'fijo', n: 'Cargo fijo', d: 'Cargo por cliente', v: fijo || 0, c: '#B6F23B' }
    ].filter(function (x) { return x.v > 0; });
  }
  function analyze(months) {
    var by = months.slice().sort(function (a, b) { return a.kwh - b.kwh; }), q = Math.max(1, Math.round(months.length / 3));
    var avg = function (arr, f) { return arr.reduce(function (s, x) { return s + f(x); }, 0) / arr.length; };
    var lo = by.slice(0, q), hi = by.slice(-q), peak = by[by.length - 1], low = by[0];
    return {
      months: months, q: q, avg: avg(months, function (x) { return x.kwh; }), avgUsd: avg(months, function (x) { return x.usd; }),
      lo: { kwh: avg(lo, function (x) { return x.kwh; }), usd: avg(lo, function (x) { return x.usd; }) },
      hi: { kwh: avg(hi, function (x) { return x.kwh; }), usd: avg(hi, function (x) { return x.usd; }) },
      peak: peak, low: low, year: months.reduce(function (s, x) { return s + x.usd; }, 0), yearKwh: months.reduce(function (s, x) { return s + x.kwh; }, 0),
      lastKwh: months[months.length - 1].kwh
    };
  }
  function renderAnalysis(an, bd, last) {
    var box = $('#billan'); if (!box) return;
    var mx = Math.max.apply(null, an.months.map(function (x) { return x.kwh; })), sorted = an.months.map(function (x) { return x.kwh; }).sort(function (a, b) { return a - b; });
    var loCut = sorted[an.q - 1], hiCut = sorted[sorted.length - an.q];
    $('#ba-title').textContent = 'Tu consumo promedio es ' + fmt(an.avg) + ' kWh al mes';
    $('#ba-sub').textContent = 'Calculado con ' + an.months.length + ' meses de tu historial, no solo con el último (' + fmt(an.lastKwh) + ' kWh). Pagaste unos ' + money(an.year) + ' en el año (estimado).';
    $('#ba-bars').innerHTML = an.months.map(function (m) {
      var cls = m.kwh >= hiCut ? 'hi' : m.kwh <= loCut ? 'lo' : '';
      return '<div class="ba-b ' + cls + '" title="' + m.l + ': ' + fmt(m.kwh) + ' kWh · ' + money(m.usd) + '"><i style="height:' + Math.max(6, m.kwh / mx * 100).toFixed(1) + '%"></i><span>' + m.l + '</span></div>';
    }).join('') + '<u class="ba-avg" style="bottom:' + (22 + an.avg / mx * 148).toFixed(1) + 'px"><em>promedio</em></u>';
    var card = function (cls, t, kw, usd, sub) { return '<div class="' + cls + '"><small>' + t + '</small><b>' + fmt(kw) + '<em> kWh</em></b><span>' + money(usd) + ' al mes</span><i>' + sub + '</i></div>'; };
    $('#ba-kpis').innerHTML =
      card('lo', 'Promedio bajo', an.lo.kwh, an.lo.usd, 'tus ' + an.q + ' meses más bajos') +
      card('mid', 'Promedio 12 meses', an.avg, an.avgUsd, 'base para diseñar tu sistema') +
      card('hi', 'Promedio alto', an.hi.kwh, an.hi.usd, 'tus ' + an.q + ' meses más altos') +
      card('pk', 'Pico', an.peak.kwh, an.peak.usd, 'mes más alto: ' + an.peak.l);
    var bdBox = $('#ba-split-box');
    if (bd && last) {
      var tot = bd.reduce(function (s, x) { return s + x.v; }, 0);
      $('#ba-split-t').textContent = 'A dónde se va el dinero de tu factura (' + (an.months[an.months.length - 1].l) + ', ' + money(tot, 2) + ')';
      $('#ba-stack').innerHTML = bd.map(function (x) { return '<i style="flex:' + x.v + ';background:' + x.c + '" title="' + x.n + '"></i>'; }).join('');
      $('#ba-rows').innerHTML = bd.map(function (x) {
        return '<li><i style="background:' + x.c + '"></i><div><b>' + x.n + '</b><span>' + x.d + '</span></div><strong>' + money(x.v, 2) + '<em>' + fmt(x.v / tot * 100, 1) + ' %</em></strong></li>';
      }).join('');
      var fuel = bd.filter(function (x) { return x.k === 'fca' || x.k === 'ppca'; }).reduce(function (s, x) { return s + x.v; }, 0), dist = bd.filter(function (x) { return x.k === 'dist' || x.k === 'fijo'; }).reduce(function (s, x) { return s + x.v; }, 0);
      $('#ba-key').innerHTML = 'Combustible y compra de energía son el <b>' + fmt(fuel / tot * 100, 0) + ' %</b> de esta factura; la tarifa base y el cargo fijo, el <b>' + fmt(dist / tot * 100, 0) + ' %</b>. Si se mantiene esa proporción, serían unos <b>' + money(an.year * fuel / tot) + '</b> al año solo en combustible y compra de energía. Estos cargos se cobran por cada kWh que le compras a LUMA; el cargo fijo se mantiene.';
      bdBox.hidden = false;
    } else bdBox.hidden = true;
    var waB = $('#ba-wa');
    if (waB) {
      var fuelPct = '';
      if (bd && last) { var tt = bd.reduce(function (x, y) { return x + y.v; }, 0), ff = bd.filter(function (x) { return x.k === 'fca' || x.k === 'ppca'; }).reduce(function (x, y) { return x + y.v; }, 0); fuelPct = ' Combustible y compra de energía: ' + fmt(ff / tt * 100, 0) + ' % de la factura.'; }
      waB.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola Cristian, subí mi factura en la página. Mi consumo promedio de ' + an.months.length + ' meses es ' + fmt(an.avg) + ' kWh al mes (pico ' + fmt(an.peak.kwh) + ' kWh).' + fuelPct + ' Quiero que me ayudes con mi propuesta.' + (window.__REF || ''));
    }
    box.hidden = false;
  }
  function ocr(img, say) {
    return loadScript(TESS).then(function () {
      return window.Tesseract.recognize(img, 'spa', { logger: function (m) { if (m.status === 'recognizing text') say('Leyendo la foto… ' + Math.round(m.progress * 100) + ' %'); } });
    }).then(function (r) { return r.data.text; });
  }
  function readBill(file, say) {
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
      say('Abriendo el PDF…');
      return loadScript(PDFJS).then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFW;
        return file.arrayBuffer();
      }).then(function (buf) { return window.pdfjsLib.getDocument({ data: buf }).promise; }).then(function (doc) {
        var pages = [], n = Math.min(doc.numPages, 4);
        for (var p = 1; p <= n; p++) pages.push(doc.getPage(p).then(function (pg) { return pg.getTextContent(); }).then(function (c) { return c.items.map(function (x) { return x.str; }).join(' '); }));
        return Promise.all(pages).then(function (txt) {
          txt = txt.join('\n');
          if (txt.replace(/\s/g, '').length > 60) return txt;
          say('El PDF es una imagen: leyéndolo como foto…');
          return doc.getPage(1).then(function (pg) {
            var vp = pg.getViewport({ scale: 2 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
            return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () { return ocr(cv, say); });
          });
        });
      });
    }
    say('Preparando la lectura de la foto…');
    return ocr(file, say);
  }

  /* ------------------------------------------------------------------ formulario + resultados */
  var F = $('#simf');
  if (F) {
    var st = { type: 'casa', mode: 'net', brand: 'tesla', acs: 2 }, kw = $('#kwh'), usd = $('#usd'), msg = $('#billmsg'), out = $('#simout'), sim = null, last = null;
    var say = function (t, cls) { msg.textContent = t; msg.className = 'billmsg' + (cls ? ' ' + cls : ''); };
    $$('.seg', F).forEach(function (g) {
      $$('button', g).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          st[g.dataset.f] = b.dataset.v; $('#acsrow').hidden = st.mode !== 'off';
          if (last) run();
        });
      });
    });
    $('#acs').addEventListener('change', function () { st.acs = +this.value; if (last) run(); });
    usd.addEventListener('input', function () { var v = +usd.value; if (v > 8) kw.value = Math.round((v - 8) / RATE); });
    var file = $('#bill'), drop = $('#drop');
    var take = function (f) {
      if (!f) return;
      drop.classList.add('busy'); $('#dropname').textContent = f.name;
      readBill(f, say).then(function (txt) {
        var r = parseBill(txt || '');
        var months = parseHistory(txt || '', r.amt, r.kwh), bd = parseBreakdown(txt || '', r.amt);
        st.hist = null; if ($('#billan')) $('#billan').hidden = true;
        if (months && months.length >= 6) {
          var an = analyze(months); st.hist = an;
          kw.value = Math.round(an.avg); if (r.amt) usd.value = r.amt.toFixed(2);
          renderAnalysis(an, bd, true);
          say('Leímos ' + months.length + ' meses de tu historial: promedio de ' + fmt(an.avg) + ' kWh al mes (el último mes fue ' + fmt(an.lastKwh) + '). Diseñamos con el promedio. Toca "Ver mi sistema".', 'ok');
        } else if (r.kwh) {
          kw.value = r.kwh; if (r.amt) usd.value = r.amt.toFixed(2);
          say('Solo encontramos un mes: ' + fmt(r.kwh) + ' kWh (' + r.how + '). Con el historial de 12 meses el cálculo es más preciso: si tu factura trae la gráfica de consumo, sube la página completa.', 'warn');
        } else if (r.amt) {
          usd.value = r.amt.toFixed(2); kw.value = Math.round((r.amt - 8) / RATE);
          say('No vimos los kWh, pero sí el total de $' + fmt(r.amt, 2) + '. Estimamos los kWh: corrígelos si los tienes.', 'warn');
        } else say('No pudimos leer los números de esta factura. Escribe tus kWh del mes (salen en la factura como "Consumo kWh").', 'warn');
      }).catch(function () { say('No pudimos leer el archivo aquí. Escribe tus kWh del mes, o envíanos la factura por WhatsApp.', 'warn'); })
        .then(function () { drop.classList.remove('busy'); });
    };
    file.addEventListener('change', function () { take(file.files[0]); });
    ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { take(e.dataTransfer.files[0]); });
    var tabs = $('#brands');
    $$('button', tabs).forEach(function (b) { b.addEventListener('click', function () { st.brand = b.dataset.v; run(); }); });
    st.tpanel = 440;
    var tp = $('#tpanel');
    $$('button', tp).forEach(function (b) { b.addEventListener('click', function () { st.tpanel = +b.dataset.v; run(); }); });

    var run = function () {
      var k = +kw.value;
      if (!(k >= 50 && k <= 30000)) { say('Escribe tu consumo en kWh al mes (entre 50 y 30,000), o el total de tu factura.', 'warn'); kw.focus(); return; }
      var r = recommend({ kwh: k, type: st.type, mode: st.mode, brand: st.brand, acs: st.acs, tpanel: st.tpanel }); last = r;
      out.hidden = false; $('#simwrap').hidden = false; $('#simempty').hidden = true;
      tabs.hidden = st.mode === 'off'; $('#offbadge').hidden = st.mode !== 'off';
      $$('button', tabs).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === st.brand ? 'true' : 'false'); });
      tp.hidden = !(st.mode === 'net' && st.brand === 'tesla');
      $$('button', tp).forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.v === st.tpanel ? 'true' : 'false'); });
      $('#r-pw').textContent = 'Paneles de ' + r.panelW + ' W';
      $('#r-kwp').textContent = fmt(r.kWp, 2); $('#r-pan').textContent = r.panels; $('#r-bat').textContent = fmt(r.batt, 1);
      $('#r-prod').textContent = fmt(r.prod); $('#r-cov').textContent = fmt(Math.min(r.cover, 9.99) * 100);
      $('#r-area').textContent = '~' + r.area + ' m² de techo (' + fmt(r.area * 10.76) + ' pies²)';
      $('#r-mode').textContent = st.mode === 'off' ? 'Off-grid · EG4' : 'Medición neta · ' + { tesla: 'Tesla Powerwall 3', enphase: 'Enphase', eg4: 'EG4' }[st.brand];
      $('#r-why').textContent = r.why || ''; $('#r-wty').textContent = r.warranty || '';
      var TH = window.SolarScene && window.SolarScene.thumb;
      // fotos oficiales de producto (assets/marcas); lo que no tiene foto usa la miniatura 3D
      var REAL = { pw3: 'tesla-powerwall3', iq5p: 'enphase-iq-battery-5p', sysctl: 'enphase-iq-system-controller-3', eg4bat: 'eg4-bateria-314ah', gridboss: 'eg4-gridboss' };
      var realFor = function (c) {
        if (c[2] === 'eg4inv') return 'eg4-flexboss18';
        return REAL[c[2]] || null;
      };
      $('#eco').innerHTML = r.comps.map(function (c) {
        var real = realFor(c), src = real ? 'assets/marcas/' + real + '.webp' : (TH && c[2] ? TH(c[2]) : null);
        return '<li' + (src ? ' class="th' + (real ? ' real' : '') + '"' : '') + '>' + (src ? '<img src="' + src + '" alt="" width="64" height="64" loading="lazy">' : '') + '<b>' + c[0] + '</b><span>' + c[1] + '</span></li>';
      }).join('');
      $('#r-note').textContent = r.note;
      var cfg = { kwh: k, type: st.type, mode: st.mode, brand: r.brand, kWp: r.kWp, panels: r.panels, panelW: r.panelW, batt: r.batt, battP: r.battP, units: r.units, hub: r.hub, battName: r.battName,
        outage: false, cloudy: false, gen: st.mode === 'off' };
      if (!sim) { sim = new Sim($('#simlive'), 'app'); sim.playing = !RM; sim.h = 6; }
      $$('.o-out,.o-cld', $('#simlive')).forEach(function (c) { c.checked = false; }); $('.o-gen', $('#simlive')).checked = st.mode === 'off';
      sim.set(cfg);
      var text = 'Hola Cristian, usé el simulador de la página. Consumo: ' + fmt(k) + ' kWh/mes' + (st.hist ? ' (promedio de ' + st.hist.months.length + ' meses; pico ' + fmt(st.hist.peak.kwh) + ' kWh)' : '') + ' (' + st.type + '). Me interesa ' + $('#r-mode').textContent +
        ': ~' + fmt(r.kWp, 2) + ' kWp (' + r.panels + ' paneles de ' + r.panelW + ' W) y ' + fmt(r.batt, 1) + ' kWh de batería. Te envío mi factura para la propuesta.';
      $('#r-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text + (window.__REF || ''));
      say('Listo. Este es un estimado preliminar: la propuesta final la diseña Cristian con tu factura y tu techo.', 'ok');
      if (!run.done) { run.done = true; out.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };
    F.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  }

  /* ------------------------------------------------------------------ "un día con tu sistema" + scroll */
  var dayBox = $('#daysim'), demo = null, caps = $$('#dia .cap2');
  if (dayBox) {
    demo = new Sim(dayBox, false);
    demo.set({ kwh: 750, type: 'casa', mode: 'net', brand: 'tesla', kWp: 7.48, panels: 17, panelW: 440, batt: 13.5, battP: 11.5, units: 1, hub: 'Backup Gateway', battName: 'Powerwall 3', outage: false, cloudy: false, gen: false });
    var showCap = function (h) { caps.forEach(function (c) { var a = +c.dataset.a, b = +c.dataset.b; c.classList.toggle('on', h >= a && h < b); }); };
    var setDay = function (h) { demo.setHour(h); showCap(h); };
    setDay(RM ? 13 : 5.5);
    var gs = window.gsap, STr = window.ScrollTrigger;
    if (gs && STr && !RM) {
      gs.registerPlugin(STr);
      STr.create({ trigger: '#dia', start: 'top top', end: '+=2400', pin: '#dia .pinbox', scrub: 0.6, anticipatePin: 1, onUpdate: function (s) { setDay(5.5 + s.progress * 18.4); } });
    } else if (!RM) { demo.playing = true; demo.h = 6; setInterval(function () { showCap(demo.h); }, 300); }
  }
  var gsap = window.gsap, ST = window.ScrollTrigger;

  /* placa por dentro: capas que se separan + zoom a la celda */
  var pw = $('#placaw');
  if (pw) {
    var cg = $('.cells', pw), cs = ''; for (var ci = 0; ci < 60; ci++) cs += '<b></b>'; cg.innerHTML = cs;
    var L = ['.ly-glass', '.ly-eva1', '.ly-cells', '.ly-eva2', '.ly-back', '.ly-frame', '.ly-jb'].map(function (s) { return $(s, pw); });
    var items = $$('#pl-list li'), zitems = $$('#pl-zl li'), stack = $('.pl-stack', pw);
    var zstep = function () { return stack.offsetHeight * 0.2; };
    if (gsap && ST && !RM) {
      gsap.registerPlugin(ST);
      gsap.set(stack, { rotateX: 58, rotateZ: -38 });
      L.forEach(function (l, k) { gsap.set(l, { z: (3 - k) * 2 }); });
      var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      L.forEach(function (l, k) {
        tl.to(l, { z: function () { return (3 - k) * zstep(); }, duration: 1 }, k * 0.8);
        tl.to(l.querySelector('i'), { opacity: 1, duration: 0.3 }, k * 0.8 + 0.5);
      });
      tl.to({}, { duration: 0.8 });
      var Z = tl.duration();
      L.forEach(function (l, k) { if (k !== 2) tl.to(l, { opacity: 0, duration: 0.8 }, Z); });
      tl.to(L[2].querySelector('i'), { opacity: 0, duration: 0.3 }, Z);
      tl.to(stack, { rotateX: 0, rotateZ: 0, duration: 1.4 }, Z);
      tl.to(L[2], { z: 0, duration: 1.4 }, Z);
      tl.to('.pl-cam', { scale: 2.3, duration: 1.4 }, Z + 0.4);
      tl.to(stack, { opacity: 0, duration: 0.5 }, Z + 1.6);
      tl.fromTo('.pl-cell', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7 }, Z + 1.6);
      tl.to('.pl-cell .dt', { opacity: 1, stagger: 0.45, duration: 0.3 }, Z + 2.2);
      tl.to({}, { duration: 0.8 });
      var ZT = Z + 2.2;
      var sync = function () {
        var t = tl.time(), zoom = t >= Z + 1.6, cur = Math.min(6, Math.floor((t + 0.2) / 0.8));
        pw.classList.toggle('zoom', zoom);
        items.forEach(function (li, k) { li.classList.toggle('on', t >= k * 0.8 + 0.3); li.classList.toggle('cur', k === cur && !zoom); });
        var zc = clamp(Math.floor((t - ZT) / 0.45), 0, 3);
        zitems.forEach(function (li, k) { li.classList.toggle('on', zoom && t >= ZT + k * 0.45); li.classList.toggle('cur', zoom && k === zc); });
      };
      tl.eventCallback('onUpdate', sync);
      ST.create({ trigger: '#placa', start: 'top top', end: '+=3400', pin: '#placa .pinbox', scrub: 0.6, anticipatePin: 1, animation: tl, invalidateOnRefresh: true });
      sync();
    } else {
      pw.classList.add('static');
      L.forEach(function (l, k) { l.style.transform = 'translateZ(' + ((3 - k) * zstep()) + 'px)'; });
    }
  }

  if (gsap && ST && !RM) {
    gsap.registerPlugin(ST);
    // scroll suave en toda la página (Lenis) sincronizado con ScrollTrigger
    if (window.Lenis) {
      var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id === '#top' ? 0 : id, { offset: -10 }); } });
      });
      window.__lenis = lenis;
    }
    gsap.to('.sprog', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
    // revelado automático en toda la landing (fuera de las secciones fijadas)
    $$('main section .pill, main section h2, .fine, .cap, .final h2, .final p, .final .row, footer .w > div').forEach(function (el) {
      if (!el.closest('#dia') && !el.closest('#tablet') && !el.closest('#placa') && !el.hasAttribute('data-rv')) el.setAttribute('data-rv', '');
    });
    $$('.simgrid, .ap-side').forEach(function (el) { el.setAttribute('data-st', ''); });
    var hs = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.mark', { yPercent: -35, scale: 1.12, ease: 'none', scrollTrigger: hs });
    gsap.to('.prod', { y: -140, rotate: -3, ease: 'none', scrollTrigger: hs });
    gsap.to('.play', { y: -90, ease: 'none', scrollTrigger: hs });
    gsap.to('.hcopy', { y: -70, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });
    gsap.utils.toArray('[data-rv]').forEach(function (el) {
      gsap.from(el, { y: 46, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
    gsap.utils.toArray('[data-st]').forEach(function (g) {
      gsap.from(g.children, { y: 60, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 82%' } });
    });
    gsap.utils.toArray('.shot .img').forEach(function (im) {
      gsap.fromTo(im, { backgroundPosition: '50% 20%' }, { backgroundPosition: '50% 80%', ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from(im.querySelector('.ui'), { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: im, start: 'top 70%' } });
    });
    gsap.from('.final .mk', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'center center', scrub: true } });
  }
})();
