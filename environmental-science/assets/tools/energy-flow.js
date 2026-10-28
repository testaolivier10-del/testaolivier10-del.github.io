/* Energy flow trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.energyFlow (environmental-science/assets/tools/math/energy-flow.js), the
   content environmental-science/data/tools/energy-flow.json (served filtered as
   assets/tool-data/energy-flow.json).

   Job: see why so little energy reaches the top of a food chain.

   Explore (Tool Studio): the stage is one ecosystem drawn as a pyramid of
   illustrated organisms. Its bars are the model's numbers (energy, biomass
   or numbers per level, widths on a log scale by default, so every factor
   of 10 is the same step; "to scale" in Details); gold sparks rise one
   level for every nine heat sparks that leave (the ratio follows the
   transfer efficiency), and the producers' sunlight budget (GPP, respiration,
   NPP) sits under the base. Tap a level for where its energy went. The
   fourth view is the ecosystem's food web: tap a species to remove it and
   every other species shows its first, most likely response (ApEnvMath.
   energyFlow.respond). Dock: the view, the ecosystem, the producers' GPP.
   More options: transfer efficiency, producer respiration, bar scale.
   Reduced motion: no sparks (the static heat arrows stay).

   Test yourself: ApEnvTools.drill over the model's six kinds (10% rule up
   the chain, energy the producers need, GPP/NPP, transfer efficiency,
   inverted pyramids, food web removal); each problem's figure is drawn by
   the same functions as the explore stage. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.energyFlow) return;
  var EF = M.energyFlow, esc = T.esc, SLUG = 'energy-flow';
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ art
     Each organism is drawn in a 100 × 100 box (flat illustration, fixed
     colors that read on the light and dark backdrop disc). */
  function fish(body, belly, fin, h, stripe){
    var t = 50 - h, b = 50 + h;
    return '<path d="M30 ' + (t + 6) + ' C40 ' + (t - 6) + ' 56 ' + (t - 6) + ' 64 ' + (t + 4) + ' L60 ' + (t + 10) + 'Z" fill="' + fin + '"/>' +
      '<path d="M76 46 L95 ' + (t + 4) + ' L90 50 L95 ' + (b - 4) + ' L76 54Z" fill="' + fin + '"/>' +
      '<path d="M10 50 C20 ' + t + ' 60 ' + t + ' 78 47 L78 53 C60 ' + b + ' 20 ' + b + ' 10 50Z" fill="' + body + '"/>' +
      '<path d="M12 52 C24 ' + (b - 2) + ' 58 ' + (b - 2) + ' 77 53 C58 ' + (50 + h * 0.45) + ' 26 ' + (50 + h * 0.45) + ' 12 52Z" fill="' + belly + '"/>' +
      (stripe ? '<path d="M26 50 C40 47 60 47 76 50" stroke="' + stripe + '" stroke-width="' + (h / 5).toFixed(1) + '" stroke-linecap="round" fill="none" opacity=".75"/>' : '') +
      '<path d="M30 ' + (50 - h * 0.6).toFixed(1) + ' C26 46 26 54 30 ' + (50 + h * 0.6).toFixed(1) + '" stroke="rgba(0,0,0,.25)" stroke-width="1.6" fill="none"/>' +
      '<path d="M44 52 L54 60 L46 58Z" fill="' + fin + '"/>' +
      '<circle cx="20" cy="47" r="3.8" fill="#fff"/><circle cx="19.4" cy="47" r="2.2" fill="#14181a"/>' +
      '<path d="M10 51 L16 52" stroke="rgba(0,0,0,.35)" stroke-width="1.4" stroke-linecap="round"/>';
  }
  function canid(c, dark, light, tailTip, big){
    var k = big ? 1.08 : 1;
    return '<g transform="translate(' + (50 - 50 * k).toFixed(1) + ' ' + (52 - 52 * k).toFixed(1) + ') scale(' + k + ')">' +
      '<path d="M70 58 C84 56 96 46 96 32 C90 44 80 50 68 52Z" fill="' + c + '"/>' + (tailTip ? '<path d="M96 32 C97 40 94 45 90 47 C93 41 94 36 96 32Z" fill="' + tailTip + '"/>' : '') +
      '<rect x="38" y="62" width="5" height="26" rx="2.5" fill="' + dark + '"/><rect x="46" y="64" width="5" height="24" rx="2.5" fill="' + dark + '"/><rect x="62" y="62" width="5" height="26" rx="2.5" fill="' + dark + '"/><rect x="69" y="62" width="5" height="25" rx="2.5" fill="' + dark + '"/>' +
      '<ellipse cx="56" cy="58" rx="22" ry="12" fill="' + c + '"/>' +
      '<path d="M34 64 C42 70 60 70 72 64 C62 66 46 66 34 64Z" fill="' + light + '"/>' +
      '<path d="M42 54 C38 46 34 42 30 42 L12 50 L14 54 L28 58 C34 60 40 60 42 54Z" fill="' + c + '"/>' +
      '<path d="M12 50 L14 54 L26 57 L30 52Z" fill="' + light + '"/>' +
      '<path d="M28 43 L31 30 L37 42Z" fill="' + dark + '"/><path d="M33 42 L38 31 L41 44Z" fill="' + c + '"/>' +
      '<circle cx="25" cy="46" r="1.8" fill="#121212"/><circle cx="12.5" cy="50.5" r="2" fill="#1b1b1b"/></g>';
  }
  var ART = {
    sun: '<circle cx="50" cy="50" r="22" fill="#F7C531"/><circle cx="50" cy="50" r="15" fill="#FBDA62"/>' +
      [0, 45, 90, 135, 180, 225, 270, 315].map(function(a){ var r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return '<path d="M' + (50 + 28 * c).toFixed(1) + ' ' + (50 + 28 * s).toFixed(1) + ' L' + (50 + 42 * c).toFixed(1) + ' ' + (50 + 42 * s).toFixed(1) + '" stroke="#F2A81D" stroke-width="5" stroke-linecap="round"/>'; }).join(''),
    grass: '<path d="M44 96 C40 74 28 58 8 50 C30 52 46 70 52 96Z" fill="#6DB33F"/><path d="M50 96 C48 70 40 46 22 22 C44 40 54 66 56 96Z" fill="#4E9A2E"/>' +
      '<path d="M60 96 C66 78 78 66 95 60 C80 70 70 82 68 96Z" fill="#7CC04B"/><path d="M56 96 C58 70 66 44 84 20 C70 46 64 70 64 96Z" fill="#5AA634"/>' +
      '<path d="M50 96 C52 62 50 36 47 6 C58 36 60 64 58 96Z" fill="#3F8A26"/><path d="M47 6 C50 14 51 22 52 30" stroke="#8FD06A" stroke-width="1.2" fill="none"/>' +
      '<path d="M30 96 C24 84 18 78 10 76 C22 76 30 84 36 96Z" fill="#8CCB5E"/>',
    grasshopper: '<path d="M84 46 C86 32 92 22 98 16" stroke="#4E7F27" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M66 60 L62 80 M74 60 L78 80" stroke="#4E7F27" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M18 58 C26 47 58 45 74 49 C82 51 86 57 82 62 C70 66 38 66 18 58Z" fill="#82BD45"/>' +
      '<path d="M26 52 C42 42 62 42 72 47 C58 50 42 54 26 58Z" fill="#5E9530"/>' +
      '<path d="M44 60 L58 30 L65 32 L52 62Z" fill="#6FA83A"/><path d="M58 30 L36 80 L31 78 L54 30Z" fill="#4E7F27"/>' +
      '<ellipse cx="81" cy="53" rx="9" ry="8.5" fill="#74AE3C"/><circle cx="84" cy="51" r="2.8" fill="#1d1d1d"/>' +
      '<path d="M24 58 L30 60 M32 60 L38 62" stroke="rgba(0,0,0,.18)" stroke-width="1.4"/>',
    frog: '<path d="M14 86 q8 -7 18 0 M68 86 q10 -7 18 0" stroke="#3E8A3A" stroke-width="6" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="50" cy="66" rx="34" ry="23" fill="#4FA34A"/><ellipse cx="50" cy="73" rx="21" ry="13" fill="#BFE29A"/>' +
      '<circle cx="31" cy="42" r="12" fill="#4FA34A"/><circle cx="69" cy="42" r="12" fill="#4FA34A"/>' +
      '<circle cx="31" cy="41" r="7" fill="#fff"/><circle cx="69" cy="41" r="7" fill="#fff"/><circle cx="32" cy="42" r="3.8" fill="#151515"/><circle cx="68" cy="42" r="3.8" fill="#151515"/>' +
      '<path d="M34 57 Q50 65 66 57" stroke="#2F6F2C" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="24" cy="62" r="3" fill="#3B8A37"/><circle cx="76" cy="60" r="2.4" fill="#3B8A37"/>',
    snake: '<path d="M12 80 C28 98 54 86 50 68 C46 52 24 54 28 38 C32 24 58 22 70 30" fill="none" stroke="#7C6A26" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M12 80 C28 98 54 86 50 68 C46 52 24 54 28 38 C32 24 58 22 70 30" fill="none" stroke="#C9B458" stroke-width="5" stroke-dasharray="3 8" stroke-linecap="round"/>' +
      '<ellipse cx="78" cy="33" rx="13" ry="9" fill="#7C6A26" transform="rotate(18 78 33)"/><circle cx="82" cy="30" r="2.1" fill="#111"/>' +
      '<path d="M90 38 l7 3 m-7 -3 l6 -2" stroke="#C0392B" stroke-width="1.8" stroke-linecap="round"/>',
    hawk: '<path d="M50 46 C38 34 18 32 3 40 C14 43 22 48 28 55 C36 52 44 52 50 55 C56 52 64 52 72 55 C78 48 86 43 97 40 C82 32 62 34 50 46Z" fill="#8B5A2B"/>' +
      '<path d="M3 40 C8 38 12 38 16 40 M97 40 C92 38 88 38 84 40" stroke="#5B3A1A" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M43 70 L50 88 L57 70Z" fill="#B5462E"/><ellipse cx="50" cy="57" rx="8.5" ry="16" fill="#A86E37"/><ellipse cx="50" cy="61" rx="5.2" ry="10" fill="#EAD7B4"/>' +
      '<circle cx="50" cy="40" r="7.5" fill="#7A4B22"/><path d="M47.5 44 L50 49 L52.5 44Z" fill="#E1A93A"/><circle cx="47.3" cy="39" r="1.6" fill="#FFD34D"/><circle cx="52.7" cy="39" r="1.6" fill="#FFD34D"/>',
    rabbit: '<ellipse cx="57" cy="66" rx="27" ry="20" fill="#AE9C8F"/><ellipse cx="68" cy="71" rx="15" ry="14" fill="#9C8A7D"/>' +
      '<path d="M29 43 C25 26 25 13 29 11 C35 21 35 33 34 44Z" fill="#9C8A7D"/>' +
      '<ellipse cx="33" cy="51" rx="14" ry="11.5" fill="#AE9C8F"/>' +
      '<path d="M36 43 C36 25 40 13 46 10 C48 20 44 34 42 45Z" fill="#AE9C8F"/><path d="M39 41 C40 27 43 19 45 16 C45 26 42 34 41 42Z" fill="#E7B9B0"/>' +
      '<circle cx="28" cy="49" r="2.4" fill="#1d1d1d"/><circle cx="20" cy="53" r="1.8" fill="#D98E8E"/><circle cx="84" cy="62" r="6.5" fill="#F4F1EE"/>' +
      '<ellipse cx="45" cy="85" rx="9" ry="3.5" fill="#8C7A6E"/>',
    mouse: '<path d="M74 68 C88 72 94 82 86 89 C80 93 73 89 77 85" stroke="#C99090" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="54" cy="63" rx="25" ry="16" fill="#9C9CA3"/><path d="M38 54 C26 54 15 60 10 65 C17 70 29 72 40 69Z" fill="#9C9CA3"/>' +
      '<circle cx="37" cy="50" r="9" fill="#B8B8BF"/><circle cx="37" cy="50" r="5" fill="#E6B8B8"/><circle cx="24" cy="60" r="2" fill="#111"/><circle cx="10.5" cy="65" r="2" fill="#D98E8E"/>' +
      '<path d="M12 64 l-8 -3 M12 66 l-8 2" stroke="#6d6d73" stroke-width="1"/><ellipse cx="44" cy="79" rx="5" ry="2.4" fill="#C99090"/><ellipse cx="64" cy="79" rx="5" ry="2.4" fill="#C99090"/>',
    fox: canid('#E07A2E', '#5A3A22', '#FFF6EC', '#FFFFFF', false),
    wolf: canid('#8E949A', '#4E5358', '#E2E5E8', '#5C6166', true),
    phyto: '<circle cx="28" cy="34" r="14" fill="#8ACB72" stroke="#3E8A3A" stroke-width="2"/><circle cx="28" cy="34" r="6" fill="#3E8A3A" opacity=".45"/>' +
      '<ellipse cx="66" cy="30" rx="23" ry="7.5" fill="#B4D978" stroke="#5E8E2A" stroke-width="2" transform="rotate(-25 66 30)"/><path d="M48 39 L84 21" stroke="#5E8E2A" stroke-width="1.2"/>' +
      '<rect x="14" y="62" width="17" height="17" rx="5" fill="#92CF66" stroke="#4C8C2C" stroke-width="2"/><rect x="33" y="62" width="17" height="17" rx="5" fill="#92CF66" stroke="#4C8C2C" stroke-width="2"/><rect x="52" y="62" width="17" height="17" rx="5" fill="#92CF66" stroke="#4C8C2C" stroke-width="2"/>' +
      '<circle cx="82" cy="66" r="9" fill="#C3E08A" stroke="#6D9A33" stroke-width="2"/><path d="M82 57 V52 M91 66 H96 M82 75 V80 M73 66 H68" stroke="#6D9A33" stroke-width="2" stroke-linecap="round"/>',
    pondweed: '<path d="M30 97 C34 72 26 46 34 16 M56 97 C52 72 62 46 56 10 M78 97 C82 74 74 56 80 30" stroke="#3E7F3A" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      [[33, 76, -30], [29, 56, 35], [34, 36, -30], [33, 20, 30], [55, 82, 35], [58, 62, -35], [55, 42, 35], [58, 24, -30], [80, 80, -30], [76, 62, 30], [80, 44, -30]].map(function(l){ return '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="11" ry="4.2" fill="' + (l[2] > 0 ? '#5DA853' : '#4C9A43') + '" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ') translate(' + (l[2] > 0 ? 8 : -8) + ' 0)"/>'; }).join(''),
    zoo: '<path d="M44 30 C30 24 16 28 5 40 M56 30 C70 24 84 28 95 40" stroke="#B9733E" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M50 72 L42 94 M50 72 L58 94" stroke="#B9733E" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M50 24 C63 24 67 40 63 56 C61 66 55 73 50 73 C45 73 39 66 37 56 C33 40 37 24 50 24Z" fill="#F4CDA6" stroke="#C47F4A" stroke-width="2"/>' +
      '<path d="M39 44 H61 M38 52 H62 M40 60 H60" stroke="#D9A070" stroke-width="1.5"/><circle cx="50" cy="33" r="3.4" fill="#C0392B"/>' +
      '<path d="M37 50 l-9 6 M37 56 l-9 6 M63 50 l9 6 M63 56 l9 6" stroke="#B9733E" stroke-width="1.6" stroke-linecap="round"/>',
    snail: '<path d="M10 80 C10 72 22 68 36 69 L80 70 C88 72 88 81 80 82 L18 83 C13 83 10 82 10 80Z" fill="#CDAE86"/>' +
      '<path d="M18 71 L12 54 M24 70 L22 52" stroke="#CDAE86" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="53" r="2.4" fill="#5A4A3A"/><circle cx="22" cy="51" r="2.4" fill="#5A4A3A"/>' +
      '<circle cx="56" cy="52" r="24" fill="#B0703A"/><circle cx="56" cy="52" r="24" fill="none" stroke="#8A552A" stroke-width="2"/>' +
      '<path d="M56 52 a4 4 0 1 1 4 4 a9 9 0 1 1 -9 -9 a14 14 0 1 1 14 14 a19 19 0 1 1 -19 -19" stroke="#7A4A22" stroke-width="2.4" fill="none"/>',
    minnow: fish('#AEB9C2', '#E9EEF2', '#8A97A3', 11, '#6B7A88'),
    sunfish: fish('#4E8F86', '#F0A24A', '#3A6F68', 21, null),
    bass: fish('#5E8A3A', '#DCE6C4', '#45692A', 15, '#2E4A1C'),
    heron: '<path d="M52 66 L49 97 M58 66 L62 97 M49 97 l-6 0 M62 97 l6 0" stroke="#666" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M40 50 C50 40 72 40 84 52 C88 61 77 71 60 71 C48 71 40 63 40 50Z" fill="#9AADBE"/><path d="M50 48 C62 44 78 46 88 57 C74 60 60 59 50 56Z" fill="#6E8396"/>' +
      '<path d="M44 53 C33 46 41 33 34 23 C32 19 29 17 27 17" stroke="#9AADBE" stroke-width="7.5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="27" cy="17" r="6.5" fill="#E3EAF0"/><path d="M30 13 L44 9" stroke="#2c2c2c" stroke-width="2.2" stroke-linecap="round"/><path d="M22 15.5 L4 20 L22 20Z" fill="#E1B12C"/><circle cx="26" cy="16" r="1.4" fill="#111"/>',
    oak: '<path d="M44 97 L46 66 C40 60 33 57 28 53 L32 50 C39 54 44 57 48 59 L50 44 L55 44 L55 59 C59 55 65 52 69 48 L72 51 C67 57 61 61 57 65 L59 97Z" fill="#7A5230"/>' +
      '<circle cx="28" cy="42" r="18" fill="#3F8F3A"/><circle cx="72" cy="42" r="18" fill="#3F8F3A"/><circle cx="50" cy="28" r="23" fill="#4FA046"/>' +
      '<circle cx="38" cy="54" r="14" fill="#2F7A2E"/><circle cx="63" cy="54" r="14" fill="#2F7A2E"/><circle cx="44" cy="22" r="9" fill="#62B357" opacity=".8"/>' +
      '<ellipse cx="66" cy="62" rx="2.6" ry="3.4" fill="#A9773D"/><path d="M63.6 59.5 h4.8" stroke="#6B4A22" stroke-width="2"/>',
    caterpillar: [16, 26, 36, 46, 56, 66, 76].map(function(x, i){ var y = 64 - 7 * Math.sin(i * 0.9); return '<path d="M' + x + ' ' + (y + 8).toFixed(1) + ' l-1 6" stroke="#2E5A1C" stroke-width="2" stroke-linecap="round"/><circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="9.5" fill="' + (i % 2 ? '#6AAE3C' : '#80C24F') + '"/><circle cx="' + (x - 2) + '" cy="' + (y - 4).toFixed(1) + '" r="1.6" fill="#F2D14B"/>'; }).join('') +
      '<circle cx="87" cy="54" r="10.5" fill="#E2B23A"/><circle cx="91" cy="52" r="2.2" fill="#111"/><path d="M85 44 L82 34 M90 44 L93 35" stroke="#2E2E2E" stroke-width="1.8" stroke-linecap="round"/>',
    deer: '<path d="M32 24 C30 14 26 9 21 5 M30 16 L36 9 M27 11 L23 3 M36 23 C38 14 42 10 47 7 M39 16 L45 15" stroke="#8A6A45" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<rect x="38" y="58" width="4.5" height="37" rx="2" fill="#8A5E33"/><rect x="46" y="60" width="4.5" height="35" rx="2" fill="#7A522C"/><rect x="66" y="58" width="4.5" height="37" rx="2" fill="#8A5E33"/><rect x="73" y="58" width="4.5" height="36" rx="2" fill="#7A522C"/>' +
      '<ellipse cx="57" cy="55" rx="25" ry="13" fill="#B07A45"/><path d="M38 60 C48 66 66 66 78 60 C66 63 50 63 38 60Z" fill="#E8D2B4"/>' +
      '<path d="M37 52 L30 32 L39 29 L45 50Z" fill="#B07A45"/><ellipse cx="30" cy="30" rx="10" ry="6.5" fill="#B07A45" transform="rotate(-15 30 30)"/>' +
      '<path d="M35 25 L43 18 L40 29Z" fill="#9A6A3A"/><circle cx="21" cy="33" r="2.2" fill="#2a2a2a"/><circle cx="29" cy="28" r="1.6" fill="#111"/><path d="M81 49 L88 44 L86 53Z" fill="#fff"/>',
    warbler: '<path d="M70 60 L93 66 L89 73 L70 67Z" fill="#6F7330"/><path d="M46 70 L44 83 M54 70 L56 83" stroke="#6B5B3A" stroke-width="2.2" stroke-linecap="round"/>' +
      '<ellipse cx="50" cy="57" rx="23" ry="16.5" fill="#F2C731"/><path d="M44 51 C56 44 73 48 82 61 C69 65 54 63 44 59Z" fill="#8A8F3A"/><path d="M52 55 C60 53 68 55 74 60" stroke="#E9E4B0" stroke-width="1.6" fill="none"/>' +
      '<circle cx="30" cy="44" r="12.5" fill="#F2C731"/><circle cx="27" cy="42" r="2.2" fill="#111"/><path d="M18 43 L9 46 L18 48Z" fill="#555"/>' +
      '<path d="M35 55 l2 6 M41 57 l2 6 M30 54 l1 5" stroke="#C0702A" stroke-width="1.6" stroke-linecap="round"/>',
    owl: '<path d="M30 24 L25 8 L41 19Z M70 24 L75 8 L59 19Z" fill="#6E5236"/>' +
      '<path d="M50 17 C73 17 81 40 79 60 C77 80 65 93 50 93 C35 93 23 80 21 60 C19 40 27 17 50 17Z" fill="#8B6A4A"/>' +
      '<ellipse cx="50" cy="67" rx="19" ry="23" fill="#DCC6A3"/><path d="M40 60 l3 3 l3 -3 M54 60 l3 3 l3 -3 M47 70 l3 3 l3 -3 M40 78 l3 3 l3 -3 M54 78 l3 3 l3 -3" stroke="#8B6A4A" stroke-width="1.6" fill="none"/>' +
      '<circle cx="39" cy="38" r="11" fill="#EBDDC2"/><circle cx="61" cy="38" r="11" fill="#EBDDC2"/><circle cx="39" cy="38" r="6" fill="#F2B531"/><circle cx="61" cy="38" r="6" fill="#F2B531"/><circle cx="39" cy="38" r="3.2" fill="#111"/><circle cx="61" cy="38" r="3.2" fill="#111"/>' +
      '<path d="M50 44 L46 50 L50 55 L54 50Z" fill="#C79A3A"/><path d="M42 92 l-3 4 m6 -4 v5 m6 -5 l3 4 M58 92 l3 4" stroke="#C79A3A" stroke-width="2" stroke-linecap="round"/>'
  };
  function art(id, x, y, size){ var k = size / 100; return '<g class="ef-art" transform="translate(' + (x - size / 2).toFixed(1) + ' ' + (y - size / 2).toFixed(1) + ') scale(' + k.toFixed(4) + ')" aria-hidden="true">' + (ART[id] || '') + '</g>'; }

  /* ------------------------------------------------------- numbers */
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function num(v){
    if(!isFinite(v)) return '?';
    if(v === 0) return '0';
    var a = Math.abs(v);
    if(a >= 1e7 || a < 0.001){ var e = Math.floor(Math.log10(a) + 1e-9), m = M.sig(v / Math.pow(10, e), 2); return String(m).replace('-', '−') + ' × 10' + String(e).split('').map(function(c){ return SUP[c]; }).join(''); }
    return EF.big(M.sig(v, 3));
  }
  var KEY = { energy: { unit: 'kcal/m²/yr', name: 'energy', title: 'Pyramid of energy' }, biomass: { unit: 'g/m²', name: 'biomass', title: 'Pyramid of biomass' }, number: { unit: 'per hectare', name: 'number', title: 'Pyramid of numbers' } };
  var LV = ['l1', 'l2', 'l3', 'l4', 'l5'];

  /* ---------------------------------------------- the pyramid drawing
     drawPyramid(P, o) -> svg inner markup. o: { W, H, key, scale, sel,
     ask (level shown as ?), hide ({ level: true } values hidden), known
     ({ level: value } overriding the label), budget (show GPP strip),
     flows (static up and heat arrows), interactive } */
  function geom(P, o){
    var W = o.W, H = o.H, n = P.levels.length, phone = W < 600;
    var colW = phone ? 120 : 214, top = phone ? 30 : 38, bot = o.budget ? (phone ? 80 : 62) : 14;
    var band = (H - top - bot) / n, barH = Math.min(band * 0.56, phone ? 46 : 60);
    var x0 = colW + 8, x1 = W - 8, cx = (x0 + x1) / 2, wMax = x1 - x0, wMin = phone ? 26 : 34;
    var vals = P.levels.map(function(l){ return l[o.key]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    function width(v){
      if(o.scale === 'linear') return Math.max(3, wMax * v / hi);
      if(hi / lo < 1.0001) return wMax;
      return wMin + (wMax - wMin) * (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    }
    return P.levels.map(function(l, k){
      var yc = top + band * (n - k - 0.5), w = width(l[o.key]);
      return { k: k, y: yc - barH / 2, h: barH, yc: yc, w: w, x: cx - w / 2, cx: cx, colW: colW, band: band, phone: phone };
    });
  }
  function drawPyramid(P, o){
    var G = geom(P, o), Kd = KEY[o.key], out = [], phone = G[0].phone, fs = phone ? 12 : 14;
    var titleY = phone ? 18 : 24;
    out.push('<text class="ef-title" x="8" y="' + titleY + '">' + esc(Kd.title) + ' <tspan class="ef-sub">' + esc(Kd.unit) + (o.scale === 'linear' ? ', to scale' : ', widths on a log scale') + '</tspan></text>');
    // flows between levels (drawn first, under the bars)
    if(o.flows !== false) G.forEach(function(g, k){
      if(k + 1 < G.length){
        var u = G[k + 1], y1 = g.y - 2, y2 = u.y + u.h + 2;
        out.push('<path class="ef-up" d="M' + g.cx + ' ' + y1.toFixed(1) + ' L' + g.cx + ' ' + (y2 + 7).toFixed(1) + '" marker-end="url(#' + MK + '-up)"/>');
        if(o.key === 'energy') out.push('<text class="ef-up-t" x="' + (g.cx + 7) + '" y="' + ((y1 + y2) / 2 + 4).toFixed(1) + '">' + esc(M.fmt(P.eff * 100, 3)) + '%</text>');
      }
      if(o.key === 'energy'){
        var hx = g.x + 6, hy = g.y - 1;
        out.push('<path class="ef-heat" d="M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ' q-6 -5 -2 -10 t-2 -10" marker-end="url(#' + MK + '-heat)"/>');
      }
    });
    G.forEach(function(g, k){
      var l = P.levels[k], v = o.known && o.known[k] != null ? o.known[k] : l[o.key], hide = (o.hide && o.hide[k]) || o.ask === k;
      var cls = 'ef-bar ' + LV[k] + (o.sel === k ? ' is-sel' : '') + (o.ask === k ? ' is-ask' : '');
      var lab = l.levelShort + ', ' + l.plural + ': ' + (hide ? 'unknown' : num(v) + ' ' + Kd.unit);
      out.push('<g class="ef-lvl" data-k="' + k + '"' + (o.interactive ? ' role="button" tabindex="0" aria-pressed="' + (o.sel === k) + '" aria-label="' + esc(lab) + '. Show where its energy goes."' : '') + '>');
      out.push('<rect class="ef-hit" x="0" y="' + (g.yc - g.band / 2).toFixed(1) + '" width="' + o.W + '" height="' + g.band.toFixed(1) + '"/>');
      // organism disc in the left column, its names beside it
      var r = phone ? 19 : 26, dx = 8 + r, dy = g.yc;
      out.push('<circle class="ef-disc ' + LV[k] + '" cx="' + dx + '" cy="' + dy.toFixed(1) + '" r="' + r + '"/>' + art(l.id, dx, dy, r * 1.75));
      var tx = dx + r + 6;
      out.push('<text class="ef-org" x="' + tx + '" y="' + (dy - 2).toFixed(1) + '">' + esc(cap(l.plural.replace(/ plants| cells| trees/, ''))) + '</text>');
      out.push('<text class="ef-lv" x="' + tx + '" y="' + (dy + (phone ? 12 : 15)).toFixed(1) + '">' + esc(phone ? ['Producers', 'Primary', 'Secondary', 'Tertiary', 'Quaternary'][k] : l.levelShort) + '</text>');
      // the bar; to scale, the energy that did not make it up from the level
      // below is a faint ghost around it, labeled as heat lost (tool-audit:
      // a log-scale pyramid hid the 90% loss)
      if(o.key === 'energy' && o.scale === 'linear' && k > 0 && o.flows !== false){
        var gb = G[k - 1];
        out.push('<rect class="ef-lost" x="' + gb.x.toFixed(1) + '" y="' + g.y.toFixed(1) + '" width="' + gb.w.toFixed(1) + '" height="' + g.h.toFixed(1) + '" rx="' + Math.min(8, g.h / 4).toFixed(1) + '"/>');
        // the label in the ghost, left of the bar, only where it fits
        var lt = esc(M.fmt((1 - P.eff) * 100, 3)) + '% not passed up (mostly heat)', lw = lt.length * 6.6 + 10;
        if(g.x - gb.x > lw) out.push('<text class="ef-lost-t" x="' + (gb.x + 6).toFixed(1) + '" y="' + (g.yc + 4).toFixed(1) + '">' + lt + '</text>');
        else if(g.x - gb.x > 40) out.push('<text class="ef-lost-t" x="' + (gb.x + 5).toFixed(1) + '" y="' + (g.yc + 4).toFixed(1) + '">' + esc(M.fmt((1 - P.eff) * 100, 3)) + '%</text>');
      }
      out.push('<rect class="' + cls + '" x="' + g.x.toFixed(1) + '" y="' + g.y.toFixed(1) + '" width="' + g.w.toFixed(1) + '" height="' + g.h.toFixed(1) + '" rx="' + Math.min(8, g.h / 4).toFixed(1) + '"/>');
      if(o.sel === k && o.key === 'energy' && k + 1 < G.length){
        var wu = Math.max(4, g.w * P.eff);
        out.push('<rect class="ef-split-up" x="' + (g.x + g.w - wu).toFixed(1) + '" y="' + (g.y + 3).toFixed(1) + '" width="' + (wu - 3).toFixed(1) + '" height="' + (g.h - 6).toFixed(1) + '" rx="3"/>');
      }
      var txt = hide ? '?' : num(v), tw = (txt.length + 1) * fs * 0.6;
      var inside = g.w > tw + 14;
      out.push('<text class="ef-val' + (inside ? '' : ' out') + (hide ? ' ask' : '') + '" x="' + (inside ? g.cx : g.x + g.w + 8).toFixed(1) + '" y="' + (g.yc + fs * 0.36).toFixed(1) + '" text-anchor="' + (inside ? 'middle' : 'start') + '">' + esc(txt) + '</text>');
      out.push('</g>');
    });
    if(o.budget){
      var b = G[0], bh = phone ? 16 : 18, y = b.y + b.h + (phone ? 12 : 14), x0 = b.colW + 8, x1 = o.W - 8, w = x1 - x0, fr = P.r / P.gpp, ty = y + bh + (phone ? 14 : 15);
      out.push('<g class="ef-budget">' + art('sun', 8 + (phone ? 19 : 26), y + bh / 2 + 4, phone ? 34 : 42) +
        '<text class="ef-bud-t" x="' + (8 + (phone ? 19 : 26) * 2 + 6) + '" y="' + (y + bh / 2 + 1).toFixed(1) + '">Sunlight</text>' +
        '<text class="ef-bud-s" x="' + (8 + (phone ? 19 : 26) * 2 + 6) + '" y="' + (y + bh / 2 + (phone ? 14 : 16)).toFixed(1) + '">GPP ' + num(P.gpp) + '</text>' +
        '<rect class="ef-bud-r" x="' + x0 + '" y="' + y.toFixed(1) + '" width="' + (w * fr).toFixed(1) + '" height="' + bh + '" rx="4"/>' +
        '<rect class="ef-bud-n" x="' + (x0 + w * fr).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (w * (1 - fr)).toFixed(1) + '" height="' + bh + '" rx="4"/>' +
        '<text class="ef-bud-l heat" x="' + (x0 + 2) + '" y="' + ty.toFixed(1) + '">Respiration ' + num(P.r) + '</text>' +
        '<text class="ef-bud-l npp" x="' + (phone ? Math.min(x0 + w * fr + 4, x1 - 150) : x0 + w * fr + 4).toFixed(1) + '" y="' + (ty + (phone ? 16 : 0)).toFixed(1) + '">NPP ' + num(P.npp) + '</text></g>');
    }
    return out.join('');
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  /* Marker ids are per svg (two svgs share a page: the explore stage and a
     drill figure); MK is set by whoever draws next. */
  var mkN = 0, MK = 'efm0';
  function newMk(){ MK = 'efm' + (++mkN); return MK; }
  function defs(m){
    return '<defs><marker id="' + m + '-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="ef-up-h"/></marker>' +
      '<marker id="' + m + '-heat" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="ef-heat-h"/></marker>' +
      '<marker id="' + m + '-web" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="ef-web-h"/></marker></defs>';
  }

  /* --------------------------------------------- the food web drawing */
  var EFFECT = { up: { g: '▲', w: 'More', cls: 'up' }, down: { g: '▼', w: 'Fewer', cls: 'down' }, gone: { g: '✕', w: 'Dies out', cls: 'gone' }, same: { g: '', w: 'About the same', cls: 'same' }, removed: { g: '✕', w: 'Removed', cls: 'removed' } };
  /* Hand-placed nodes (x, y in a unit box), so each web reads bottom
     (producers) to top with few crossings. */
  var WEBPOS = {
    grassland: { grass: [0.5, 0.9], grasshopper: [0.17, 0.7], rabbit: [0.83, 0.7], mouse: [0.5, 0.56], frog: [0.13, 0.4], snake: [0.33, 0.2], fox: [0.84, 0.36], hawk: [0.64, 0.12] },
    pond: { phyto: [0.3, 0.9], pondweed: [0.74, 0.9], zoo: [0.15, 0.68], snail: [0.6, 0.7], minnow: [0.16, 0.42], sunfish: [0.6, 0.46], bass: [0.38, 0.2], heron: [0.82, 0.14] },
    forest: { oak: [0.5, 0.9], caterpillar: [0.18, 0.68], deer: [0.84, 0.68], mouse: [0.5, 0.52], warbler: [0.14, 0.36], owl: [0.42, 0.14], wolf: [0.84, 0.3] }
  };
  function webGeom(ecoId, W, H){
    var web = EF.webOf(ecoId), phone = W < 600, top = phone ? 30 : 38, bot = phone ? 26 : 30, side = phone ? 30 : 60, pos = {}, P = WEBPOS[ecoId] || {};
    web.forEach(function(s){ var q = P[s.id] || [0.5, 0.5]; pos[s.id] = { x: side + q[0] * (W - 2 * side), y: top + q[1] * (H - top - bot) }; });
    return { web: web, pos: pos, r: Math.min(phone ? 25 : 32, (H - top - bot) * 0.075), phone: phone };
  }
  function drawWeb(ecoId, o){
    var g = webGeom(ecoId, o.W, o.H), res = o.removed ? EF.respond(ecoId, o.removed) : {}, out = [], r = g.r, fs = g.phone ? 11.5 : 13.5;
    out.push('<text class="ef-title" x="8" y="' + (g.phone ? 18 : 24) + '">' + esc(cap(EF.ECOS[ecoId].name)) + ' food web <tspan class="ef-sub">arrows point from food to eater</tspan></text>');
    g.web.forEach(function(s){
      s.eats.forEach(function(f){
        var a = g.pos[f], b = g.pos[s.id], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        // an arrow arriving from below ends under the eater's name, not on it
        var fromBelow = dy < 0 && Math.abs(dx) < Math.abs(dy) * 1.2, endR = fromBelow ? r + fs + 10 : r + 9;
        var startR = dy > 0 && Math.abs(dx) < Math.abs(dy) * 1.2 ? r + fs + 6 : r + 3;
        var x1 = a.x + dx / d * startR, y1 = a.y + dy / d * startR, x2 = b.x - dx / d * endR, y2 = b.y - dy / d * endR;
        if(fromBelow){ x2 = b.x + (dx > 0 ? -1 : 1) * Math.min(Math.abs(dx) * 0.4, r * 0.4); y2 = b.y + r + fs + 9; }
        var mx = (x1 + x2) / 2 + dy * 0.08, my = (y1 + y2) / 2 - dx * 0.08;
        var dead = o.removed && (res[f] && /removed|gone/.test(res[f].effect) || res[s.id] && /removed|gone/.test(res[s.id].effect));
        out.push('<path class="ef-link' + (dead ? ' is-dead' : '') + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" marker-end="url(#' + MK + '-web)"/>');
      });
    });
    var lv = EF.webLevels(ecoId);
    g.web.forEach(function(s){
      var p = g.pos[s.id], e = res[s.id] || (o.mark === s.id ? { effect: 'removed' } : null), E = e ? EFFECT[e.effect] : null, ask = o.ask && o.ask.indexOf(s.id) > -1;
      var label = cap(s.name) + (E && e.effect !== 'same' ? ': ' + E.w.toLowerCase() : '') + (o.interactive ? (o.removed ? '' : '. Remove it from the web.') : '');
      out.push('<g class="ef-node' + (E ? ' is-' + E.cls : '') + (ask ? ' is-ask' : '') + '" data-id="' + s.id + '"' + (o.interactive ? ' role="button" tabindex="0" aria-label="' + esc(label) + '"' : '') + '>');
      // the picture responds: more of a species draws it bigger, fewer
      // smaller; the removed one leaves an empty ring; a species that dies
      // out is drawn grey and crossed out (not only faded)
      var ef = e ? e.effect : null, rr = ef === 'up' ? r * 1.22 : ef === 'down' ? r * 0.8 : r;
      if(ef === 'removed'){
        out.push('<circle class="ef-disc ef-hole" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '"/>');
      } else {
        out.push('<circle class="ef-disc ' + LV[Math.min(4, lv[s.id])] + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + rr.toFixed(1) + '"/>' + (ef === 'gone' ? '<g class="ef-grey">' + art(s.id, p.x, p.y, rr * 1.72) + '</g>' : art(s.id, p.x, p.y, rr * 1.72)));
        if(ef === 'gone') out.push('<path class="ef-cross" d="M' + (p.x - rr * 0.7).toFixed(1) + ' ' + (p.y - rr * 0.7).toFixed(1) + ' L' + (p.x + rr * 0.7).toFixed(1) + ' ' + (p.y + rr * 0.7).toFixed(1) + ' M' + (p.x + rr * 0.7).toFixed(1) + ' ' + (p.y - rr * 0.7).toFixed(1) + ' L' + (p.x - rr * 0.7).toFixed(1) + ' ' + (p.y + rr * 0.7).toFixed(1) + '"/>');
        if(ef === 'up' || ef === 'down') out.push('<circle class="ef-was" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '"/>');
      }
      out.push('<text class="ef-node-t" x="' + p.x.toFixed(1) + '" y="' + (p.y + r + fs + 1).toFixed(1) + '" text-anchor="middle">' + esc(cap(s.name)) + '</text>');
      if(E && E.g){
        var bx = p.x + r * 0.78, by = p.y - r * 0.78;
        out.push('<circle class="ef-badge ' + E.cls + '" cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="' + (g.phone ? 9 : 11) + '"/><text class="ef-badge-t" x="' + bx.toFixed(1) + '" y="' + (by + (g.phone ? 3.6 : 4.4)).toFixed(1) + '" text-anchor="middle">' + E.g + '</text>');
      }
      if(ask){ var qx = p.x + r * 0.78, qy = p.y - r * 0.78; out.push('<circle class="ef-badge ask" cx="' + qx.toFixed(1) + '" cy="' + qy.toFixed(1) + '" r="' + (g.phone ? 9 : 11) + '"/><text class="ef-badge-t" x="' + qx.toFixed(1) + '" y="' + (qy + 4).toFixed(1) + '" text-anchor="middle">?</text>'); }
      out.push('</g>');
    });
    return out.join('');
  }

  /* --------------------------------------------------------- mount */
  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, { slug: SLUG,
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex) ex.active(m === 'explore'); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------- explore */
  function explore(host, data){
    var X = data.explore || {}, st = { view: 'energy', eco: X.eco || 'grassland', gpp: X.gpp || 20000, rPct: X.rPct || 50, eff: X.eff || 10, scale: X.scale || 'linear', sel: null, removed: null };
    var LS = null, touched = false, nid = T.nid('ef'), P = null, live = true, myMk = newMk();
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    var VIEWS = [['energy', 'Energy'], ['biomass', 'Biomass'], ['number', 'Numbers'], ['web', 'Food web']];
    host.innerHTML = '<section class="bt-problem ef-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Energy flow through an ecosystem</h2>' +
      '<div class="ef-fig"><svg class="ef-svg" xmlns="http://www.w3.org/2000/svg" role="group" aria-labelledby="' + nid + '-d"></svg><p class="sr-only" id="' + nid + '-d"></p></div>' +
      '<div class="ef-ctl">' +
        '<div class="ef-views" role="group" aria-label="What the pyramid shows">' + VIEWS.map(function(v){ return '<button type="button" class="tchip ef-view" data-v="' + v[0] + '" aria-pressed="false">' + v[1] + '</button>'; }).join('') + '</div>' +
        '<div class="ef-ecos" role="group" aria-label="Ecosystem">' + EF.ECO_IDS.map(function(id){ return '<button type="button" class="tchip ef-eco" data-e="' + id + '" aria-pressed="false">' + esc(EF.ECOS[id].title) + '</button>'; }).join('') + '</div>' +
        '<div class="ef-gpp"></div><div class="ef-webctl" hidden><button type="button" class="bt-btn ef-reset">Bring every species back</button></div>' +
      '</div>' +
      '<div class="ef-say"></div>' +
      T.moreHtml('<div class="ef-more-sl"></div><div class="bt-tabs ef-scale" role="group" aria-label="Bar widths"><button type="button" class="bt-btn" data-s="linear" aria-pressed="true">Widths to scale</button><button type="button" class="bt-btn" data-s="log" aria-pressed="false">Widths on a log scale</button></div><p class="bt-small">To scale, each bar is 10% of the one below, so you see the 90% lost at every step; the top of a five-level chain is a sliver, 1/10,000 of the base. On a log scale every factor of 10 is the same step, so the top levels are easier to see.</p>', 'efficiency, respiration, scale') +
      '<div class="ef-nums"></div><p class="sr-only ef-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.ef-live'));
    var cue = T.cue('Tap a level of the pyramid to see where its energy goes.');
    $('.ef-ctl').insertBefore(cue.el, $('.ef-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var gpp = T.slider({ label: 'Producers\' GPP (sunlight captured)', min: 2000, max: 40000, step: 1000, value: st.gpp, unit: 'kcal/m²/yr', onInput: function(v){ st.gpp = v; act(); draw(); } });
    $('.ef-gpp').appendChild(gpp.el);
    var eff = T.slider({ label: 'Energy passed up each level', min: 5, max: 20, step: 1, value: st.eff, unit: '%', onInput: function(v){ st.eff = v; act(); draw(); } });
    var resp = T.slider({ label: 'Producers\' respiration (share of GPP)', min: 30, max: 70, step: 5, value: st.rPct, unit: '%', onInput: function(v){ st.rPct = v; act(); draw(); } });
    $('.ef-more-sl').appendChild(eff.el); $('.ef-more-sl').appendChild(resp.el);
    var svg = $('.ef-svg');

    function onClick(e){
      var b = e.target.closest('.ef-view'); if(b){ st.view = b.getAttribute('data-v'); st.sel = null; act(); draw(true); return; }
      b = e.target.closest('.ef-eco'); if(b){ st.eco = b.getAttribute('data-e'); st.sel = null; st.removed = null; act(); draw(true); return; }
      b = e.target.closest('.ef-scale [data-s]'); if(b){ st.scale = b.getAttribute('data-s'); (LS ? LS.root : host).querySelectorAll('.ef-scale [data-s]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); draw(); return; }
      if(e.target.closest('.ef-reset')){ st.removed = null; draw(true); return; }
    }
    host.addEventListener('click', onClick);
    function pick(el){
      if(!el) return;
      act();
      if(el.classList.contains('ef-lvl')){ var k = +el.getAttribute('data-k'); st.sel = st.sel === k ? null : k; draw(true, k); }
      else if(el.classList.contains('ef-node')){ var id = el.getAttribute('data-id'); st.removed = st.removed === id ? null : id; draw(true, id); }
    }
    svg.addEventListener('click', function(e){ pick(e.target.closest('.ef-lvl, .ef-node')); });
    svg.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ var g = e.target.closest('.ef-lvl, .ef-node'); if(g){ e.preventDefault(); pick(g); } } });

    function size(){
      var r = svg.getBoundingClientRect(), w = r.width || 360, h = r.height || 420;
      var W = w < 600 ? 400 : 820, H = Math.max(W * 0.62, Math.min(W * 1.6, W * h / w));
      return { W: W, H: Math.round(H) };
    }
    function words(){
      var E = EF.ECOS[st.eco], L = P.levels, top = L[L.length - 1], Kd = KEY[st.view] || KEY.energy, head, why = '';
      if(st.view === 'web'){
        if(!st.removed){ head = 'Tap a species to remove it from the ' + E.name + ' and see how the others respond.'; why = '<p>Each arrow points from a food to the organism that eats it, the direction energy flows. A species that loses its only food dies out; its prey increase; a predator that loses one food eats more of another.</p>'; }
        else {
          var res = EF.respond(st.eco, st.removed), S = EF.webOf(st.eco).filter(function(s){ return s.id === st.removed; })[0];
          var list = EF.webOf(st.eco).filter(function(s){ return s.id !== st.removed && res[s.id].effect !== 'same'; });
          head = 'Without the ' + S.name + ': ' + ['gone', 'up', 'down'].map(function(k){ var n = list.filter(function(s){ return res[s.id].effect === k; }).map(function(s){ return s.name; }); return n.length ? EFFECT[k].w.toLowerCase() + ' ' + n.join(', ') : ''; }).filter(Boolean).join('; ') + '.';
          why = '<ul class="ef-why-l">' + list.map(function(s){ var x = res[s.id]; return '<li><b class="ef-eff ' + EFFECT[x.effect].cls + '">' + EFFECT[x.effect].g + ' ' + esc(cap(s.name)) + '</b> ' + esc(x.why) + (x.direct ? '' : ' <span class="bt-small">(indirect, less certain)</span>') + '</li>'; }).join('') + '</ul><p>These are the first, most likely effects. Later, animals may switch foods and numbers can recover; a web with more links is more stable because each consumer has other foods.</p>';
        }
        return { head: head, why: why };
      }
      if(st.sel != null){
        var l = L[st.sel], nx = L[st.sel + 1];
        if(st.view === 'energy'){
          head = cap(l.plural.replace(/ cells| plants/, '')) + ' (' + l.level + ') hold ' + num(l.energy) + ' ' + Kd.unit + ': ' + (nx ? num(nx.energy) + ' passes up to the ' + nx.plural + ', ' + num(l.energy - nx.energy) + ' leaves the chain.' : 'all of it leaves the chain as heat or to decomposers; nothing eats them here.');
          why = '<p>' + (st.sel === 0 ? 'The producers capture ' + num(P.gpp) + ' ' + Kd.unit + ' of sunlight (GPP) and burn ' + num(P.r) + ' in their own cellular respiration, leaving ' + num(P.npp) + ' stored as NPP. ' : 'The ' + l.plural + ' received ' + M.fmt(P.eff * 100, 3) + '% of the level below. ') +
            (nx ? 'Only about ' + M.fmt(P.eff * 100, 3) + '% of what they hold becomes the next level\'s biomass. The rest is used for their own life (cellular respiration releases it as heat), is never eaten (roots, bones, fur), or is not digested and leaves as waste for decomposers.' : 'At the top, no level above eats them; their energy is released as heat or passes to decomposers when they die.') + '</p>' +
            '<p class="bt-small">Energy flows one way: heat cannot be recycled into food, which is why the chain needs the sun every day.</p>';
        } else {
          head = cap(l.plural.replace(/ cells| plants/, '')) + ': ' + num(l[st.view]) + ' ' + Kd.unit + ' (' + l.level + ').';
          why = '<p>' + (st.view === 'biomass' ? 'Biomass is the dry mass of living things at one moment. It equals the energy flowing through the level divided by how fast the organisms turn over: small, fast organisms (phytoplankton) need little standing biomass to pass on a lot of energy.' : 'A pyramid of numbers counts individuals. A level of a few big organisms (one oak tree) can feed many small ones (thousands of caterpillars), so this pyramid can be inverted.') + '</p>';
        }
        return { head: head, why: why };
      }
      if(st.view === 'energy'){
        head = 'Only ' + num(top.energy) + ' of the producers\' ' + num(P.npp) + ' ' + Kd.unit + ' reaches the ' + top.plural + ': about ' + M.fmt(100 - P.eff * 100, 3) + '% is lost at each step.';
        why = '<p>NPP = GPP − respiration = ' + num(P.gpp) + ' − ' + num(P.r) + ' = ' + num(P.npp) + ' ' + Kd.unit + '. Each level up keeps about ' + M.fmt(P.eff * 100, 3) + '% of the level below (the 10% rule), so after ' + (L.length - 1) + ' transfers the top gets ' + M.fmt(Math.pow(P.eff, L.length - 1) * 100, 3) + '% of the NPP.</p><p>That is why food chains rarely have more than four or five levels, and why eating lower on the chain feeds more people from the same land.</p>';
      } else {
        var inv = EF.inverted(P, st.view);
        head = inv ? 'This pyramid is inverted: there is more ' + (st.view === 'biomass' ? 'biomass' : 'individuals') + ' of ' + L[inv].plural + ' than of ' + L[inv - 1].plural + '. The energy pyramid never is.' : 'This pyramid is upright, like the energy pyramid. ' + (st.view === 'biomass' ? 'Try the pond.' : 'Try the forest.');
        why = '<p>' + (st.view === 'biomass' ? 'In the pond, phytoplankton are eaten and replaced within days, so a small standing biomass feeds a larger biomass of zooplankton.' : 'In the forest, one oak tree feeds thousands of caterpillars, so the numbers pyramid widens above the producers.') + ' Biomass and numbers show what is there at one moment; energy is a flow per year, and it always drops level by level.</p>';
      }
      return { head: head, why: why };
    }
    var fx = null;
    function draw(announce, focusId){
      P = EF.pyramid(st.eco, st.gpp, st.rPct, st.eff / 100);
      var sz = size(), inner;
      MK = myMk;
      svg.setAttribute('viewBox', '0 0 ' + sz.W + ' ' + sz.H);
      if(st.view === 'web') inner = drawWeb(st.eco, { W: sz.W, H: sz.H, removed: st.removed, interactive: true });
      else inner = drawPyramid(P, { W: sz.W, H: sz.H, key: st.view, scale: st.scale, sel: st.sel, budget: st.view === 'energy', interactive: true });
      svg.innerHTML = defs(MK) + inner + '<g class="ef-fx" aria-hidden="true"></g>';
      fx = svg.querySelector('.ef-fx');
      if(focusId != null){ var f = svg.querySelector(typeof focusId === 'number' ? '[data-k="' + focusId + '"]' : '[data-id="' + focusId + '"]'); if(f && document.activeElement !== f){ try{ f.focus({ preventScroll: true }); }catch(e){} } }
      // controls
      (LS ? LS.root : host).querySelectorAll('.ef-view').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === st.view)); });
      (LS ? LS.root : host).querySelectorAll('.ef-eco').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-e') === st.eco)); });
      $('.ef-gpp').hidden = st.view === 'web'; $('.ef-webctl').hidden = st.view !== 'web'; $('.ef-reset').disabled = !st.removed;
      cue.el.querySelector('.bt-cue-t').textContent = st.view === 'web' ? 'Tap a species to remove it.' : 'Tap a level of the pyramid to see where its energy goes.';
      var w = words();
      T.explain($('.ef-say'), '<b>' + esc(w.head) + '</b>', w.why);
      $('#' + nid + '-d').textContent = describe();
      nums();
      if(LS){
        LS.caption('<b>' + esc(w.head) + '</b>', 'explore');
        if(st.view === 'web') LS.pills(st.removed ? [{ k: 'Removed', html: esc(EF.webOf(st.eco).filter(function(s){ return s.id === st.removed; })[0].name), tone: 'warn' }] : [], 'left', 'explore');
        else LS.pills([{ k: 'NPP', html: num(P.npp), tone: 'readout' }], 'left', 'explore');
        LS.pills(st.view === 'web' ? [] : st.view === 'energy' ? [{ k: 'Top gets', html: M.fmt(P.levels[P.levels.length - 1].share, 2) + '%', tone: 'accent' }] : [{ k: 'Pyramid', html: EF.inverted(P, st.view) ? 'inverted' : 'upright', tone: EF.inverted(P, st.view) ? 'warn' : 'good' }], 'right', 'explore');
        if(LS.why) LS.why.querySelectorAll && LS.root.querySelectorAll('.env-ls-why details.bt-why').forEach(function(d){ d.open = true; });
      }
      if(announce) say(w.head);
    }
    function describe(){
      if(st.view === 'web') return 'Food web of the ' + EF.ECOS[st.eco].name + ': ' + EF.webOf(st.eco).map(function(s){ return s.name + (s.eats.length ? ' eat ' + s.eats.map(function(f){ return EF.webOf(st.eco).filter(function(x){ return x.id === f; })[0].name; }).join(' and ') : ' are producers'); }).join('; ') + '.';
      var Kd = KEY[st.view];
      return Kd.title + ' for the ' + EF.ECOS[st.eco].name + ', from the bottom: ' + P.levels.map(function(l){ return l.plural + ' ' + num(l[st.view]) + ' ' + Kd.unit; }).join(', ') + '.';
    }
    function nums(){
      var rows = P.levels.map(function(l){ return [esc(cap(l.levelShort)) + '<br><span class="bt-small">' + esc(l.plural) + '</span>', num(l.energy), num(l.biomass), num(l.number)]; });
      $('.ef-nums').innerHTML = '<h3 class="ls-title-l">Every level</h3>' + T.dataTable(['Level', 'Energy (kcal/m²/yr)', 'Biomass (g/m²)', 'Number per hectare'], rows, 'The ' + EF.ECOS[st.eco].name + ' at GPP ' + num(P.gpp) + ' kcal/m²/yr') +
        '<p class="bt-small">GPP ' + num(P.gpp) + ' − respiration ' + num(P.r) + ' = NPP ' + num(P.npp) + ' kcal/m²/yr. Level n holds NPP × ' + M.fmt(P.eff, 2) + '<sup>n − 1</sup>. Biomass and numbers come from illustrative turnover rates and body masses, so their shapes are typical, not measured.</p>';
    }

    /* sparks: per level, (1 − eff) / eff heat sparks leave for every one that rises */
    var raf = 0, sparks = [], last = 0, acc = 0;
    function tick(t){
      raf = 0;
      if(!live || document.hidden || st.view === 'web' || T.reduced() || !fx){ sparks = []; if(fx) fx.innerHTML = ''; return; }
      var dt = last ? Math.min(60, t - last) : 16; last = t; acc += dt;
      var G = geom(P, Object.assign(size(), { key: st.view, scale: st.scale, budget: st.view === 'energy' }));
      if(acc > 160){
        acc = 0;
        var k = Math.floor(Math.random() * G.length), g = G[k], up = Math.random() < (st.view === 'energy' ? P.eff : 0.5) && k + 1 < G.length;
        if(st.view === 'energy') sparks.push(up ? { kind: 'up', x: g.cx, y: g.y - 3, ty: G[k + 1].y + G[k + 1].h + 6, life: 0 } : { kind: 'heat', x: g.x + 6 + Math.random() * Math.min(40, g.w * 0.3), y: g.y - 2, vx: -0.004 - Math.random() * 0.01, life: 0 });
      }
      sparks = sparks.filter(function(s){ s.life += dt; return s.life < 1600; });
      fx.innerHTML = sparks.map(function(s){
        var u = s.life / 1600;
        if(s.kind === 'up'){ var y = s.y + (s.ty - s.y) * Math.min(1, u * 1.6); return '<circle class="ef-spark" cx="' + s.x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.4" opacity="' + (1 - Math.max(0, u - 0.7) / 0.3).toFixed(2) + '"/>'; }
        return '<circle class="ef-hspark" cx="' + (s.x + s.vx * s.life).toFixed(1) + '" cy="' + (s.y - 26 * u - 6 * Math.sin(u * 9)).toFixed(1) + '" r="' + (2.8 - 1.4 * u).toFixed(2) + '" opacity="' + (0.9 * (1 - u)).toFixed(2) + '"/>';
      }).join('');
      raf = requestAnimationFrame(tick);
    }
    function kick(){ if(!raf && live && !T.reduced()) raf = requestAnimationFrame(tick); }
    var drawRaw = draw; draw = function(a, f){ drawRaw(a, f); kick(); };

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.ef-fig')], dock: [$('.ef-ctl')], primary: [gpp.el], why: [$('.ef-say')], details: [$('.ef-nums')], moreLabel: 'Efficiency, respiration and scale' });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      draw();
      if(s.mode() === 'explore') s.hint({ target: svg.querySelector('.ef-lvl[data-k="1"] .ef-bar') || svg, text: 'Start here: tap a level' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ draw(); }, 60); }).observe($('.ef-fig')); }
    }
    draw();
    document.addEventListener('visibilitychange', kick);
    return { studio: studio, active: function(on){ live = on; if(on) kick(); } };
  }

  /* After a step the drill clears its Check button (the focused element),
     and the figure redraws: keep focus in the drill, on the next step's
     first input, else on the feedback just given, never the page start. */
  function keepFocus(api){
    setTimeout(function(){
      var a = document.activeElement;
      if(a && a !== document.body && document.contains(a) && a.offsetParent !== null) return;
      var area = api.area, root = (area && area.closest('.ls-root')) || document;
      var steps = [].slice.call(root.querySelectorAll('form.cd-step'));
      var open = steps.filter(function(f){ return f.querySelector('button[type=submit]'); }).pop();
      var t = open && [].slice.call(open.querySelectorAll('input:not([readonly]):not([disabled])')).filter(function(x){ return x.offsetParent !== null; })[0];
      if(!t){ var fb = steps.length ? steps[steps.length - 1].querySelector('.cd-fb') : null; if(fb){ fb.setAttribute('tabindex', '-1'); t = fb; } }
      if(!t) t = root.querySelector('.cd-again');
      if(t) try{ t.focus({ preventScroll: true }); }catch(e){}
    }, 30);
  }
  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: SLUG, noun: 'drill',
      generate: function(r, ctx, type){ return EF.generate(r, ctx, type); },
      types: [{ value: 'tenpct', label: 'The 10% rule' }, { value: 'reverse', label: 'Energy the producers need' }, { value: 'npp', label: 'GPP and NPP' }, { value: 'efficiency', label: 'Transfer efficiency' }, { value: 'pyramid', label: 'Inverted pyramids' }, { value: 'web', label: 'Food web changes' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { tenpct: 'Energy up the chain', reverse: 'How much must the producers store?', npp: 'GPP, respiration and NPP', efficiency: 'Transfer efficiency', pyramid: 'An inverted pyramid', web: 'Remove a species' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; figure(el, p, {}); },
      onStep: function(s, right, api){ keepFocus(api); if(api.problem.type === 'web' || api.problem.type === 'tenpct' || api.problem.type === 'reverse' || api.problem.type === 'npp'){ api.st = api.st || {}; api.st[s.key] = true; figure(api.fig, api.problem, api.st); } }
    });
  }
  /* A drill's figure, from the problem's own givens, revealing nothing the
     steps ask until they are answered. */
  function figure(el, p, done){
    var f = p.figure, phone = (window.innerWidth || 1280) <= 640, W = phone ? 400 : 640, H, inner, label;
    if(!f){ el.innerHTML = ''; return; }
    var E = EF.ECOS[f.eco], mk = newMk();
    if(f.kind === 'web'){
      H = phone ? 440 : 400;
      var res = done && done.w1 && done.w2 ? f.removed : null;
      inner = drawWeb(f.eco, { W: W, H: H, removed: res || null, mark: f.removed, ask: res ? null : f.ask, interactive: false });
      label = 'Food web of the ' + E.name + ' with the ' + f.removed + ' removed';
    } else if(f.kind === 'budget'){
      H = phone ? 200 : 180;
      var P0 = { gpp: f.gpp || (f.npp + f.r), r: f.r, npp: f.npp || (f.gpp - f.r), levels: [] };
      inner = budgetSvg(P0, W, H, { hideG: f.gpp == null && !(done && done.ans), hideN: f.npp == null && !(done && done.ans) });
      label = 'The producers\' sunlight budget: GPP split into respiration and NPP';
    } else {
      var P = EF.pyramid(f.eco, 20000, 50, 0.1), key = f.kind === 'pyramid' ? f.key : 'energy', o = { W: W, key: key, scale: 'log', flows: f.kind !== 'pyramid' };
      if(f.kind === 'chain'){
        var base = f.known[0] != null ? f.known[0] : f.known[Object.keys(f.known)[0]] * Math.pow(10, +Object.keys(f.known)[0]);
        P = EF.pyramid(f.eco, base * 2, 50, 0.1);
        var lvls = Math.max(f.ask, +Object.keys(f.known)[0]) + 1;
        P.levels = P.levels.slice(0, lvls);
        o.hide = {}; P.levels.forEach(function(l, k){ if(f.known[k] == null) o.hide[k] = true; });
        o.known = f.known; o.ask = done && done.ans ? null : f.ask;
        if(done && done.ans){ o.hide = {}; P.levels.forEach(function(l, k){ if(f.known[k] == null && k !== f.ask) o.hide[k] = true; }); o.known = Object.assign({}, f.known); o.known[f.ask] = p.steps[p.steps.length - 1].cell.numeric.answer; }
      } else if(f.kind === 'pair'){
        P.levels = P.levels.slice(f.k, f.k + 2); P.levels.forEach(function(l, i){ l.energy = i ? f.eb : f.ea; l.levelShort = EF.LEVEL_SHORT[f.k + i]; });
        o.flows = false;
      }
      H = phone ? 80 + 78 * P.levels.length : 70 + 80 * P.levels.length;
      o.H = H;
      inner = drawPyramid(P, o);
      label = KEY[key].title + ' for a ' + E.name;
    }
    el.innerHTML = '<figure class="ef-qfig"><svg class="ef-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + defs(mk) + inner + '</svg></figure>';
  }
  function budgetSvg(P, W, H, o){
    var phone = W < 600, x0 = 16, x1 = W - 16, w = x1 - x0, y = phone ? 96 : 92, fr = P.r / P.gpp, bh = phone ? 34 : 38;
    return '<text class="ef-title" x="8" y="22">The producers\' sunlight budget <tspan class="ef-sub">kcal/m²/yr</tspan></text>' +
      art('sun', 40, 58, 52) + '<path class="ef-sunray" d="M70 60 L' + (x0 + w * 0.45) + ' ' + (y - 8) + '" marker-end="url(#' + MK + '-up)"/>' +
      '<text class="ef-bud-l" x="' + (x0 + w * 0.5) + '" y="52">' + (o.hideG ? 'GPP = ?' : 'GPP = ' + num(P.gpp)) + '</text>' +
      '<rect class="ef-bud-r" x="' + x0 + '" y="' + y + '" width="' + (w * fr).toFixed(1) + '" height="' + bh + '" rx="6"/><rect class="ef-bud-n" x="' + (x0 + w * fr).toFixed(1) + '" y="' + y + '" width="' + (w * (1 - fr)).toFixed(1) + '" height="' + bh + '" rx="6"/>' +
      '<text class="ef-bud-l" x="' + (x0 + 8) + '" y="' + (y + bh / 2 + 5) + '">Respiration ' + num(P.r) + '</text>' +
      '<text class="ef-bud-l" x="' + (x1 - 8) + '" y="' + (y + bh / 2 + 5) + '" text-anchor="end">' + (o.hideN ? 'NPP ?' : 'NPP ' + num(P.npp)) + '</text>' +
      '<path class="ef-heat" d="M' + (x0 + w * fr * 0.5) + ' ' + (y + bh + 4) + ' q-6 8 -2 14 t-2 14" marker-end="url(#' + MK + '-heat)"/><text class="ef-heat-t" x="' + (x0 + w * fr * 0.5 + 10) + '" y="' + (y + bh + 26) + '">heat</text>' +
      '<text class="ef-heat-t" x="' + (x1 - 8) + '" y="' + (y + bh + 24) + '" text-anchor="end">stored: food for consumers</text>';
  }
  // exposed for the test page and other builders' reference (pure strings)
  window.ApEnvEnergyFlowArt = { art: art, drawPyramid: drawPyramid, drawWeb: drawWeb };
})();
