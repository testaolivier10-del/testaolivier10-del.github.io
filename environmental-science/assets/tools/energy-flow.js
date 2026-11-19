/* Energy flow trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.energyFlow (environmental-science/assets/tools/math/energy-flow.js), the
   content environmental-science/data/tools/energy-flow.json (served filtered as
   assets/tool-data/energy-flow.json).

   Job: see why so little energy reaches the top of a food chain.

   Explore (tools v2, docs/tools-v2-apenv-energy-flow-brief.md; kit assets/course/tool-kit2.js): three chapters,
   one idea and one control each, on a drawn scene with no side panel (see explore() below): the 10% rule (drag
   the energy up the meadow's pyramid), Eat lower (drag a hectare's corn toward cattle) and Food web (tap a species
   out). The old views (biomass, numbers, pond, forest) are tables in "?".

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
    // The name column is as wide as the longest name needs on a phone ("Grasshoppers", "Caterpillars" ran into
    // the bars and the "90%" beside them; consistency audit 2026-11, C3).
    var longest = Math.max.apply(null, P.levels.map(function(l){ return cap(l.plural.replace(/ plants| cells| trees/, '')).length; }));
    var colW = phone ? Math.min(176, Math.max(120, Math.ceil(8 + 38 + 6 + longest * 8.6 + 8))) : 214, top = phone ? 30 : 38, bot = o.budget ? (phone ? 80 : 62) : 14;
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
        // pass 2 (Explore): the first step up carries the numbers; the steps above repeat it, so only their arrows show
        if(o.key === 'energy' && (!o.interactive || k === 0)) out.push('<text class="ef-up-t" x="' + (g.cx + 7) + '" y="' + ((y1 + y2) / 2 + 4).toFixed(1) + '">' + esc(M.fmt(P.eff * 100, 3)) + '%</text>');
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
      out.push('<text class="ef-org" x="' + tx + '" y="' + (dy - (phone ? 4 : 2)).toFixed(1) + '">' + esc(cap(l.plural.replace(/ plants| cells| trees/, ''))) + '</text>');
      out.push('<text class="ef-lv" x="' + tx + '" y="' + (dy + (phone ? 13 : 15)).toFixed(1) + '">' + esc(phone ? ['Producers', 'Primary', 'Secondary', 'Tertiary', 'Quaternary'][k] : l.levelShort) + '</text>');
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
      // on the log scale the loss cannot be drawn as width, so it is said beside the step up
      if(o.key === 'energy' && o.scale !== 'linear' && k > 0 && o.flows !== false && (!o.interactive || k === 1)){
        var lt2 = '−' + M.fmt((1 - P.eff) * 100, 3) + '% as heat', lx = g.x - 10;
        if(lx - g.colW < lt2.length * 6.4 + 6) lt2 = lx - g.colW > 64 ? '−' + M.fmt((1 - P.eff) * 100, 3) + '% heat' : lx - g.colW > 36 ? '−' + M.fmt((1 - P.eff) * 100, 3) + '%' : '';
        if(lt2) out.push('<text class="ef-lost-t" x="' + lx.toFixed(1) + '" y="' + (g.yc + 4).toFixed(1) + '" text-anchor="end">' + esc(lt2) + '</text>');
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
        '<text class="ef-bud-t" x="' + (8 + (phone ? 19 : 26) * 2 + 6) + '" y="' + (y + bh / 2 + (phone ? -1 : 1)).toFixed(1) + '">Sunlight</text>' +
        '<text class="ef-bud-s" x="' + (8 + (phone ? 19 : 26) * 2 + 6) + '" y="' + (y + bh / 2 + (phone ? 15 : 16)).toFixed(1) + '">GPP ' + num(P.gpp) + '</text>' +
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
      onShow: function(m){ if(ex) ex.shown(m); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ====================================================================== Explore v2
     (docs/tools-v2-apenv-energy-flow-brief.md). Three chapters, one idea and one main control each, on a drawn scene:
       chain  the energy pyramid of a meadow; drag the energy up one feeding step at a time (the knob rides the tip of
              the gold stream); at every step passed 1 of 10 parts goes on (gold) and 9 leave as heat (vermillion),
              drawn on one measure; the quiet Sunlight knob sets GPP (the grass keeps half as NPP).
       eat    one hectare of corn; drag the share fed to cattle; the grain and the cattle's heat and beef are bands
              on one measure, and the people fed come and go one by one.
       web    the meadow food web; tap a species to take it out (again to bring it back); every linked species
              answers (more, fewer, dies out; "maybe fewer" for the indirect, less certain effects).
     One colour per idea: energy gold, heat vermillion, removed or dies out red. Words never run ahead of the picture:
     the cause line reads the state as drawn. Reduced motion: the result at once with a short cross fade. */
  var K = window.LevlKit2;
  var CH = [{ value: 'chain', label: '10% rule' }, { value: 'eat', label: 'Eat lower' }, { value: 'web', label: 'Food web' }];
  var PURPOSE = { chain: 'How little energy reaches the top of a food chain', eat: 'Why a field feeds more people as grain than as beef', web: 'What changes when one species leaves a food web' };
  var CHAIN = EF.ECOS.grassland.chain;
  var NAME = ['Grass', 'Grasshoppers', 'Frogs', 'Snakes', 'Hawks'];
  var GPP0 = 20000, RPCT = 50;
  var PW = 4000;   // the scene's width, so a pill never leaves it
  function n1(v){ return (+v).toFixed(1); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, f){ return a + (b - a) * f; }
  function kc(v){ return num(v) + ' kcal'; }
  function pct(v){ return M.fmt(v, 3) + '%'; }
  function tw(t, fs, bold){ return String(t).length * fs * (bold ? 0.58 : 0.54); }   // text width estimate (Nunito)
  function pill(x, y, t, cls, fs, anchor){
    var w = tw(t, fs, true) + 14, h = fs + 9, x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    x0 = Math.max(4, Math.min(x0, PW - w - 4));
    return { w: w, h: h, x: x0, y: y - h / 2, svg: '<g class="efa-pill ' + (cls || '') + '"><rect x="' + n1(x0) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><text x="' + n1(x0 + w / 2) + '" y="' + n1(y + fs * 0.36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(t) + '</text></g>' };
  }
  /* A wisp of heat or a stroke of energy that goes on, from (x, y) along angle a (radians), length L, grown to f. */
  function wisp(x, y, a, L, f, wig){
    var l = L * f, ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l, nx = -Math.sin(a) * wig, ny = Math.cos(a) * wig;
    return 'M' + n1(x) + ' ' + n1(y) + ' C' + n1(x + Math.cos(a) * l * 0.35 + nx) + ' ' + n1(y + Math.sin(a) * l * 0.35 + ny) + ' ' + n1(x + Math.cos(a) * l * 0.7 - nx) + ' ' + n1(y + Math.sin(a) * l * 0.7 - ny) + ' ' + n1(ex) + ' ' + n1(ey);
  }
  /* New art for this screen (100 x 100 boxes, as ART): a corn plant, a steer, a person. */
  ART.corn = '<path d="M50 98 C49 70 51 40 50 8" stroke="#6E9A2E" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path d="M50 70 C36 60 26 62 14 72 C28 66 38 68 50 76Z" fill="#7DB03A"/><path d="M50 56 C64 44 76 44 88 52 C74 50 64 54 50 62Z" fill="#6FA334"/>' +
    '<path d="M50 40 C38 30 28 30 18 36 C30 34 40 38 50 46Z" fill="#88BC45"/><path d="M50 26 C60 16 70 14 80 18 C70 20 60 24 50 32Z" fill="#7DB03A"/>' +
    '<path d="M52 62 C62 58 66 46 64 36 C58 40 54 50 52 62Z" fill="#E9BE3A" stroke="#B88A1C" stroke-width="1.4"/><path d="M57 54 l4 -2 M56 49 l5 -2 M57 44 l4 -2" stroke="#B88A1C" stroke-width="1.1"/>' +
    '<path d="M50 10 l-6 -6 M50 10 l6 -7 M50 10 v-8" stroke="#C9A24A" stroke-width="2" stroke-linecap="round"/>';
  ART.cow = '<rect x="26" y="66" width="6" height="26" rx="3" fill="#5B4636"/><rect x="36" y="68" width="6" height="24" rx="3" fill="#4A382B"/><rect x="66" y="66" width="6" height="26" rx="3" fill="#5B4636"/><rect x="76" y="68" width="6" height="24" rx="3" fill="#4A382B"/>' +
    '<path d="M86 52 C92 58 94 66 92 74" stroke="#6E553F" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="56" cy="56" rx="32" ry="17" fill="#8C5A3C"/><path d="M40 46 C48 40 60 44 58 54 C52 60 42 58 40 46Z" fill="#F2E6D6"/><path d="M68 60 C74 56 82 58 82 64 C76 70 68 68 68 60Z" fill="#F2E6D6"/>' +
    '<path d="M28 48 C20 42 12 44 8 52 C6 60 12 66 20 64 C26 62 30 56 28 48Z" fill="#8C5A3C"/><ellipse cx="11" cy="60" rx="6" ry="5" fill="#D9A79A"/>' +
    '<path d="M22 44 l-4 -8 M14 46 l-8 -4" stroke="#E8DCC6" stroke-width="2.6" stroke-linecap="round"/><circle cx="18" cy="52" r="1.8" fill="#151515"/>';
  var SHIRT = ['#3D7EC2', '#C2553D', '#4F9A55', '#8A5FB4', '#D08A2A', '#2F8F8A', '#B8466E', '#5D6B7A'];
  function person(x, y, h, k){
    var s = h / 100, c = SHIRT[k % SHIRT.length], skin = ['#E8B994', '#C68B62', '#8D5B3E', '#F0C8A8'][(k * 7) % 4];
    return '<g transform="translate(' + n1(x - 50 * s) + ' ' + n1(y - 100 * s) + ') scale(' + s.toFixed(4) + ')">' +
      '<rect x="38" y="66" width="10" height="32" rx="5" fill="#3B3F4A"/><rect x="52" y="66" width="10" height="32" rx="5" fill="#33363F"/>' +
      '<path d="M30 74 C30 46 38 38 50 38 C62 38 70 46 70 74Z" fill="' + c + '"/>' +
      '<circle cx="50" cy="24" r="14" fill="' + skin + '"/><path d="M36 22 C38 10 62 8 64 20 C58 16 44 16 36 22Z" fill="#3A2A20"/></g>';
  }

  function explore(host, data){
    var X = data.explore || {};
    var S = { ch: 'chain', mode: 'explore', lvl: 0, p: 0, gpp: X.gpp || GPP0, share: 0, fs: 0, removed: null, wt: 1 };
    try{ var q0 = new URLSearchParams(location.search).get('ch'); if(q0 === 'eat' || q0 === 'web') S.ch = q0; }catch(e){}
    var LS = null, nid = T.nid('efa');
    var stage = document.createElement('div'); stage.className = 'efa'; stage.setAttribute('data-ch', S.ch);
    var tabs = K.tabs({ label: 'Chapters', items: CH, value: S.ch, big: true, onChange: function(v){ setCh(v); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: PURPOSE[S.ch], how: { label: 'Show me how', onClick: function(){ startTour(true); } } });
    stage.appendChild(head.el);
    var sceneBox = document.createElement('div'); sceneBox.className = 'efa-scene'; sceneBox.id = nid + '-sc';
    sceneBox.innerHTML = '<svg class="efa-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="efa-static"></g></svg><svg class="efa-svg efa-top" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g class="efa-mid"></g><g class="efa-dyn"></g><g class="efa-dyn efa-labs"></g></svg><div class="efa-fade" aria-hidden="true"></div>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), svgTop = sceneBox.querySelector('.efa-top'), gStatic = svg.querySelector('.efa-static'), gMid = svgTop.querySelector('.efa-mid'), gDyn = svgTop.querySelector('.efa-dyn'), gLabs = svgTop.querySelector('.efa-labs'), fade = sceneBox.querySelector('.efa-fade');
    var layer = K.layer(sceneBox);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
    var lines = document.createElement('div'); lines.className = 'efa-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el); stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    host.appendChild(stage);
    var ref = document.createElement('div'); ref.className = 'efa-ref';

    /* ---- controls on the picture */
    var cLvl = K.drag(layer, { key: 'apenv-ef-up', label: 'Follow the energy up the food chain', min: 0, max: 4, step: 1, value: S.lvl, track: [0, 1, 0, 0], chip: false,
      valuetext: function(v){ var P = pyr(); return NAME[v] + ': ' + kc(P.levels[v].energy) + ' per square meter per year, ' + pct(P.levels[v].share) + ' of the grass\'s energy'; },
      onInput: function(v){ used(); S.lvl = v; kick(); tourDid('up'); } });
    cLvl.el.classList.add('efa-up');   // the gold stream and the pyramid's slope are its track: no groove drawn
    var cSun = K.drag(layer, { label: 'Sunlight the grass captures (GPP)', min: 10000, max: 30000, step: 1000, value: S.gpp, track: [0, 0, 1, 0], quiet: true,
      valuetext: function(v){ return EF.big(v) + ' kilocalories per square meter per year'; }, tag: function(v){ return EF.big(v); }, tagSide: "right",
      onInput: function(v){ used(); S.gpp = v; flash(); kick(); tourDid('sun'); } });
    var cShare = K.drag(layer, { key: 'apenv-ef-cattle', label: 'Share of the corn fed to cattle', min: 0, max: 100, step: 10, value: 0, track: [0, 0, 1, 0], chip: false,
      valuetext: function(v){ return v + '% of the corn to cattle, ' + EF.field(v / 100).people + ' people fed'; }, tag: function(v){ return v + "% to cattle"; }, tagSide: "up",
      onInput: function(v){ used(); S.share = v / 100; kick(); tourDid('cattle'); } });
    var cWeb = CHAIN_WEB().map(function(sp){
      return K.tap(layer, { key: sp.id === 'grasshopper' ? 'apenv-ef-web' : null, label: '', box: [0, 0, 1, 1], pressed: false, chip: false,
        onClick: function(){ used(); cWeb.forEach(function(b){ if(b.done) b.done(); }); S.removed = S.removed === sp.id ? null : sp.id; webChanged(); tourDid('tap'); } });
    });
    function CHAIN_WEB(){ return EF.webOf('grassland'); }
    var cues = {
      chain: K.cue(layer, { key: 'apenv-ef-chain', text: 'Drag up', side: 'right', at: function(){ return G && G.track ? [G.track[0] + knobR + 4, G.track[1] + (G.ph ? 26 : 0)] : [0, 0]; } }),
      eat: K.cue(layer, { key: 'apenv-ef-eat', text: 'Drag to feed cattle', side: 'below', at: function(){ return G && G.strack ? [G.strack[0], G.strack[1] + knobR + 2] : [0, 0]; } }),
      web: K.cue(layer, { key: 'apenv-ef-web', text: 'Tap an animal', side: 'below', at: function(){ var p = G && G.pos && G.pos.grasshopper; return p ? [p.x, p.y + G.r + G.fs * 1.9 + 2] : [0, 0]; } })
    };
    function used(){ Object.keys(cues).forEach(function(k){ if(k === S.ch && cues[k].active()) cues[k].hide(true); }); }
    sceneBox.addEventListener('pointerdown', used);

    /* ---- the model, as drawn */
    var Pc = null;
    function pyr(){ if(!Pc || Pc.gpp !== S.gpp) Pc = EF.pyramid('grassland', S.gpp, RPCT, 0.1); return Pc; }
    var wShown = {};   // per species: { s scale, o opacity, g grey, e extra animal, b badge }
    CHAIN_WEB().forEach(function(sp){ wShown[sp.id] = { s: 1, o: 1, g: 0, e: 0, b: 0 }; });
    var people = [], cows = [];
    for(var i = 0; i < 44; i++) people.push(i < EF.field(0).people ? 1 : 0);
    for(var j = 0; j < 6; j++) cows.push(0);
    function webTarget(){
      var res = S.removed ? EF.respond('grassland', S.removed) : {}, out = {};
      CHAIN_WEB().forEach(function(sp){
        var r = res[sp.id], e = r ? r.effect : 'same';
        out[sp.id] = e === 'removed' ? { s: 0.6, o: 0, g: 0, e: 0, b: 1, eff: 'removed' } : e === 'gone' ? { s: 0.8, o: 0.32, g: 1, e: 0, b: 1, eff: 'gone' }
          : e === 'up' ? { s: 1.12, o: 1, g: 0, e: 1, b: 1, eff: 'up' } : e === 'down' ? { s: r.direct ? 0.78 : 0.9, o: r.direct ? 0.8 : 0.92, g: 0, e: 0, b: 1, eff: r.direct ? 'down' : 'maybe' }
          : { s: 1, o: 1, g: 0, e: 0, b: 0, eff: 'same' };
      });
      return out;
    }

    /* ---- the loop: everything shown eases toward the setting; a change runs as an animation */
    var raf = 0, lastT = 0;
    function kick(){ if(K.reduced()){ settleAll(); flash(); draw(); return; } if(!raf){ lastT = 0; raf = requestAnimationFrame(tick); } }
    function settleAll(){
      S.p = S.lvl; S.fs = S.share;
      var fp = EF.field(S.share).people, nc = cowN(S.share);
      people = people.map(function(v, i){ return i < fp ? 1 : 0; }); cows = cows.map(function(v, i){ return i < nc ? 1 : 0; });
      var t = webTarget(); Object.keys(t).forEach(function(id){ var w = wShown[id]; ['s', 'o', 'g', 'e', 'b'].forEach(function(k){ w[k] = t[id][k]; }); });
      S.wt = 1;
    }
    function cowN(f){ return f <= 0 ? 0 : Math.max(1, Math.round(f * 6)); }
    function step(cur, to, d){ return Math.abs(to - cur) <= d ? to : cur + (to > cur ? d : -d); }
    function tick(ts){
      raf = 0;
      var dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0.016; lastT = ts;
      var moving = false;
      // chapter 1: the tip climbs 1.6 levels a second
      if(S.p !== S.lvl){ S.p = step(S.p, S.lvl, dt * 1.6); moving = true; }
      // chapter 2: the bands follow the share; people and cows come and go one at a time
      if(S.fs !== S.share){ S.fs = step(S.fs, S.share, dt * 0.9); moving = true; }
      var fp = EF.field(S.fs).people, nc = cowN(S.fs);
      people = people.map(function(v, i){ var to = i < fp ? 1 : 0; if(v !== to) moving = true; return step(v, to, dt * 4); });
      cows = cows.map(function(v, i){ var to = i < nc ? 1 : 0; if(v !== to) moving = true; return step(v, to, dt * 3); });
      // chapter 3: each species eases to its new state
      var t = webTarget();
      Object.keys(t).forEach(function(id){ var w = wShown[id]; ['s', 'o', 'g', 'e', 'b'].forEach(function(k){ var to = t[id][k]; if(w[k] !== to){ w[k] = step(w[k], to, dt * (k === 'b' ? 2.2 : 1.8)); moving = true; } }); });
      if(S.wt < 1){ S.wt = Math.min(1, S.wt + dt * 1.6); moving = true; }
      draw();
      stage.setAttribute('data-busy', moving ? '1' : '');
      if(moving) raf = requestAnimationFrame(tick);
    }
    function flash(){ if(!K.reduced()) return; fade.classList.remove('is-on'); void fade.offsetWidth; fade.classList.add('is-on'); }
    function webChanged(){ S.wt = 0; refHtml(); cWeb.forEach(function(b, i){ b.pressed(CHAIN_WEB()[i].id === S.removed); }); kick(); }

    /* ---- layout: one geometry per chapter, from the scene box */
    var G = null;
    function dark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }
    function layoutNow(){
      var r = sceneBox.getBoundingClientRect(), W = Math.max(300, Math.round(r.width) || 640), H = Math.max(300, Math.round(r.height) || 460);
      [svg, svgTop].forEach(function(e){ e.setAttribute('viewBox', '0 0 ' + W + ' ' + H); e.setAttribute('width', W); e.setAttribute('height', H); });
      PW = W;
      G = S.ch === 'chain' ? geoChain(W, H) : S.ch === 'eat' ? geoEat(W, H) : geoWeb(W, H);
      gStatic.innerHTML = S.ch === 'chain' ? staticChain(G) : S.ch === 'eat' ? staticEat(G) : staticWeb(G);
      // the drawn plants and animals are built once per layout; a frame only moves or fades them (updMid)
      gMid.innerHTML = S.ch === 'chain' ? midChain(G) : S.ch === 'eat' ? midEat(G) : midWeb(G); MID = { els: {}, last: {} };
      knobR = (cLvl.el.querySelector('.tk2-knob') || {}).offsetWidth / 2 || 22;
      cLvl.hide(S.ch !== 'chain'); cSun.hide(S.ch !== 'chain'); cShare.hide(S.ch !== 'eat');
      cWeb.forEach(function(b){ b.el.hidden = S.ch !== 'web'; });
      if(S.ch === 'chain'){ cLvl.place(G.track); cSun.place(G.sunTrack); }
      else if(S.ch === 'eat') cShare.place(G.strack);
      else CHAIN_WEB().forEach(function(sp, i){ var p = G.pos[sp.id], rr = G.r * 1.15; cWeb[i].place([p.x - rr, p.y - rr, rr * 2, rr * 2]); });
      draw();
      if(cues[S.ch].active()) cues[S.ch].place();
    }
    function sky(W, H, y){
      return '<defs><linearGradient id="' + nid + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="efa-sky0"/><stop offset="1" class="efa-sky1"/></linearGradient>' +
        '<radialGradient id="' + nid + '-sun"><stop offset="0" class="efa-sun0"/><stop offset="1" class="efa-sun1"/></radialGradient>' +
        '<linearGradient id="' + nid + '-gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="efa-gr0"/><stop offset="1" class="efa-gr1"/></linearGradient>' +
        '<linearGradient id="' + nid + '-so" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="efa-so0"/><stop offset="1" class="efa-so1"/></linearGradient>' +
        '<linearGradient id="' + nid + '-ts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient></defs>' +
        '<rect class="efa-skyr" width="' + W + '" height="' + n1(y + 2) + '" fill="url(#' + nid + '-sky)"/>' +
        '<path class="efa-hill is-far" d="M0 ' + n1(y - H * 0.06) + ' C' + n1(W * 0.2) + ' ' + n1(y - H * 0.13) + ' ' + n1(W * 0.42) + ' ' + n1(y - H * 0.03) + ' ' + n1(W * 0.62) + ' ' + n1(y - H * 0.09) + ' S' + n1(W * 0.9) + ' ' + n1(y - H * 0.05) + ' ' + W + ' ' + n1(y - H * 0.1) + ' V' + n1(y + 2) + ' H0Z"/>' +
        '<path class="efa-hill" d="M0 ' + n1(y - H * 0.02) + ' C' + n1(W * 0.25) + ' ' + n1(y - H * 0.06) + ' ' + n1(W * 0.55) + ' ' + n1(y) + ' ' + n1(W * 0.75) + ' ' + n1(y - H * 0.04) + ' S' + W + ' ' + n1(y - H * 0.02) + ' ' + W + ' ' + n1(y - H * 0.02) + ' V' + n1(y + 2) + ' H0Z"/>';
    }

    /* ================= chapter 1: the pyramid */
    function geoChain(W, H){
      var ph = W < 640, top = ph ? 74 : 84, bot = ph ? 16 : 22, n = 5, gap = ph ? 5 : 6;
      var th = (H - top - bot) / n, side = ph ? 30 : Math.max(60, W * 0.14);
      // a phone keeps a strip on the right for the labels, so each tier's animals have the whole tier
      var wB = ph ? W - 22 - Math.min(104, W * 0.27) : Math.min(W - 2 * side, (H - top) * 2.1), cx = ph ? 22 + wB / 2 : W / 2 + W * 0.02;
      var dw = wB * 0.165, tiers = [];
      for(var k = 0; k < n; k++){
        var yb = H - bot - k * th, yt = yb - th + gap, wb = wB - k * dw, wt = wb - dw * (th - gap) / th;
        tiers.push({ k: k, yb: yb, yt: yt, yc: (yb + yt) / 2, wb: wb, wt: wt, xl: function(y, yb, wb){ return cx - (wb - dw * (yb - y) / th) / 2; } });
      }
      tiers.forEach(function(t){ var yb = t.yb, wb = t.wb; t.L = function(y){ return cx - (wb - dw * (yb - y) / th) / 2; }; t.R = function(y){ return cx + (wb - dw * (yb - y) / th) / 2; }; });
      var ins = ph ? 15 : 20, P0 = [tiers[0].L(tiers[0].yc) + ins, tiers[0].yc], P4 = [tiers[4].L(tiers[4].yc) + ins, tiers[4].yc];
      var sx = ph ? 30 : 46, sy = ph ? 40 : 46, sr = ph ? 17 : 22;
      return { W: W, H: H, ph: ph, top: top, th: th, cx: cx, wB: wB, dw: dw, tiers: tiers, ins: ins, track: [P0[0], P0[1], P4[0], P4[1]],
        sun: [sx, sy, sr], sunTrack: [sx + sr + 16, sy, sx + sr + 16 + (ph ? 84 : 120), sy], fs: ph ? 12.5 : 14, wl: ph ? 30 : 46, sw0: ph ? 3.2 : 4.2, rw: ph ? 1.7 : 2.2 };
    }
    function tierPath(g, t){ return 'M' + n1(t.L(t.yb)) + ' ' + n1(t.yb) + ' L' + n1(t.L(t.yt)) + ' ' + n1(t.yt) + ' L' + n1(t.R(t.yt)) + ' ' + n1(t.yt) + ' L' + n1(t.R(t.yb)) + ' ' + n1(t.yb) + 'Z'; }
    function trackAt(g, p){ var t = g.track; return [lerp(t[0], t[2], p / 4), lerp(t[1], t[3], p / 4)]; }
    /* Where each tier's label goes: inside its right part when it fits, else outside to the right. */
    function labelSpot(g, t){
      var fs = g.fs, w = Math.max(tw(NAME[t.k], fs, true), tw('10,000 kcal', fs, true)) + 18, inR = t.R(t.yc) - 10, inL = t.L(t.yc) + g.ins + 26;
      if(t.k > 0 && g.W - t.R(t.yc) - 14 >= w) return { x: t.R(t.yc) + 10, anchor: 'start', inside: false, w: w };
      if(t.k === 0 || inR - w > inL) return { x: inR, anchor: 'end', inside: true, w: w };
      return { x: t.R(t.yc) + 10, anchor: 'start', inside: false, w: w };
    }
    function critters(g, t){
      // organisms of the tier, between the stream and the label, fewer up the chain (counts in "?": numbers can invert)
      var lab = labelSpot(g, t), x0 = t.L(t.yc) + g.ins + (g.ph ? 72 : 96), x1 = lab.inside ? lab.x - lab.w - 6 : t.R(t.yc) - 10;
      var hgt = Math.min(g.th - 14, g.ph ? 46 : 60), out = [], id = CHAIN[t.k].id;
      if(t.k === 0){
        for(var x = t.L(t.yb) + 14; x < t.R(t.yb) - 14; x += g.ph ? 22 : 28) if(x < x1 || x > lab.x + 4) out.push(art('grass', x, t.yb - hgt * 0.42, hgt * 0.9));
        return out.join('');
      }
      var want = [0, 3, 2, 1, 1][t.k] + (g.ph ? 0 : [0, 1, 1, 1, 0][t.k]), sz = Math.min(hgt, (x1 - x0) / Math.max(1, want) * 0.95);
      if(x1 - x0 < 30){
        // a narrow top tier on a phone: one animal, right of the stream and its knob, sized from the tier
        var ax0 = t.L(t.yc) + g.ins + knobR + 4, ax1 = lab.inside ? lab.x - lab.w - 4 : t.R(t.yc) - 4, s1 = Math.max(32, Math.min(hgt, (ax1 - ax0) * 1.05, g.th - 16)), c1 = Math.max(ax0 + s1 / 2, (ax0 + ax1) / 2);
        return '<ellipse class="efa-shadow" cx="' + n1(c1) + '" cy="' + n1(t.yb - 6) + '" rx="' + n1(s1 * 0.32) + '" ry="3"/>' + art(id, c1, t.yb - 4 - s1 * 0.45, s1);
      }
      if(sz < 22){ want = Math.max(1, Math.floor((x1 - x0) / 24)); sz = Math.min(hgt, (x1 - x0) / want * 0.95); }
      for(var i = 0; i < want; i++){ var cxk = x0 + (x1 - x0) * (i + 0.5) / want; out.push('<ellipse class="efa-shadow" cx="' + n1(cxk) + '" cy="' + n1(t.yb - 6) + '" rx="' + n1(sz * 0.32) + '" ry="3"/>' + art(id, cxk, t.yb - 4 - sz * 0.45, sz)); }
      return out.join('');
    }
    function midChain(g){ return g.tiers.map(function(t){ return '<g class="efa-crit" data-k="' + t.k + '">' + critters(g, t) + '</g>'; }).join(''); }
    function midEat(g){
      return g.cows.map(function(c, i){ return '<g data-cow="' + i + '"><ellipse class="efa-shadow" cx="' + n1(c.x) + '" cy="' + n1(c.y - 2) + '" rx="' + n1(c.s * 0.36) + '" ry="3"/>' + art('cow', c.x, c.y - c.s * 0.42, c.s) + '</g>'; }).join('') +
        g.ppl.map(function(q, i){ return '<g data-p="' + i + '"><ellipse class="efa-shadow" cx="' + n1(q.x) + '" cy="' + n1(q.y - 1) + '" rx="' + n1(q.h * 0.2) + '" ry="2.2"/>' + person(q.x, q.y, q.h, i) + '</g>'; }).join('');
    }
    function midWeb(g){
      var r = g.r;
      return CHAIN_WEB().map(function(s){ var p = g.pos[s.id], sz = r * 1.8;
        return '<g data-sp="' + s.id + '"><g class="efa-body"><ellipse class="efa-shadow" cx="' + n1(p.x) + '" cy="' + n1(p.y + r * 0.78) + '" rx="' + n1(r * 0.6) + '" ry="3.5"/>' + art(s.id, p.x, p.y, sz) + '</g>' +
          '<g class="efa-extra">' + art(s.id, p.x + r, p.y + r * 0.25, sz * 0.7) + '</g>' +
          '<path class="efa-cross" d="M' + n1(p.x - r * 0.55) + ' ' + n1(p.y - r * 0.55) + ' L' + n1(p.x + r * 0.55) + ' ' + n1(p.y + r * 0.55) + ' M' + n1(p.x + r * 0.55) + ' ' + n1(p.y - r * 0.55) + ' L' + n1(p.x - r * 0.55) + ' ' + n1(p.y + r * 0.55) + '"/></g>'; }).join('');
    }
    var MID = { els: {}, last: {} }, knobR = 22;
    function midEl(sel){ return MID.els[sel] || (MID.els[sel] = gMid.querySelector(sel)); }
    function setA(el, k, v){ if(!el) return; var key = k; if(el['_' + key] === v) return; el['_' + key] = v; if(k === 'class') el.setAttribute('class', v); else if(k === 'style') el.setAttribute('style', v); else el.setAttribute(k, v); }
    /* One frame: only attributes change on the built plants and animals. */
    function updMid(){
      if(!G) return;
      if(S.ch === 'chain') G.tiers.forEach(function(t){ setA(midEl('[data-k="' + t.k + '"]'), 'style', 'opacity:' + (0.38 + 0.62 * clamp(S.p - t.k + 1, 0, 1)).toFixed(2)); });
      else if(S.ch === 'eat'){
        G.cows.forEach(function(c, i){ var v = cows[i], el = midEl('[data-cow="' + i + '"]'); setA(el, 'style', v <= 0 ? 'display:none' : 'opacity:' + v.toFixed(2)); setA(el, 'transform', 'translate(' + n1(c.x) + ' ' + n1(c.y) + ') scale(' + (0.6 + 0.4 * v).toFixed(2) + ') translate(' + n1(-c.x) + ' ' + n1(-c.y) + ')'); });
        G.ppl.forEach(function(q, i){ var v = people[i], el = midEl('[data-p="' + i + '"]'); setA(el, 'style', v <= 0 ? 'display:none' : 'opacity:' + v.toFixed(2)); setA(el, 'transform', 'translate(0 ' + n1((1 - v) * 10) + ')'); });
      } else {
        var t = webTarget();
        CHAIN_WEB().forEach(function(s){
          var w = wShown[s.id], p = G.pos[s.id], el = midEl('[data-sp="' + s.id + '"]'); if(!el) return;
          var body = el.firstChild, ex = body.nextSibling, cr = ex.nextSibling;
          setA(body, 'style', w.o <= 0.01 ? 'display:none' : 'opacity:' + w.o.toFixed(2));
          setA(body, 'transform', 'translate(' + n1(p.x) + ' ' + n1(p.y) + ') scale(' + w.s.toFixed(3) + ') translate(' + n1(-p.x) + ' ' + n1(-p.y) + ')');
          setA(body, 'class', w.g > 0.5 ? 'efa-body efa-grey' : 'efa-body');
          setA(ex, 'style', w.e <= 0.01 ? 'display:none' : 'opacity:' + w.e.toFixed(2));
          setA(ex, 'transform', 'translate(' + n1(-G.r * 0.3 * (1 - w.e)) + ' 0)');
          setA(cr, 'style', t[s.id].eff === 'gone' && w.g > 0.5 && w.o > 0.01 ? '' : 'display:none');
        });
      }
    }
    function staticChain(g){
      var out = [sky(g.W, g.H, g.H)], P = pyr();
      g.tiers.forEach(function(t){
        out.push('<path class="efa-tier is-' + t.k + '" d="' + tierPath(g, t) + '"/>');
        out.push('<path class="efa-tiersh" d="' + tierPath(g, t) + '" fill="url(#' + nid + '-ts)"/>');
        out.push('<path class="efa-tierhi" d="M' + n1(t.L(t.yt)) + ' ' + n1(t.yt + 1.5) + ' H' + n1(t.R(t.yt)) + '"/>');
      });
      return out.join('');
    }
    function dynChain(g){
      var P = pyr(), out = [], p = S.p, reached = Math.floor(p + 1e-6), fs = g.fs;
      // the sun and the grass's own respiration (half of what it captures leaves as heat)
      var su = g.sun, glow = 1 + (S.gpp - 10000) / 20000;
      out.push('<circle class="efa-sunglow" cx="' + su[0] + '" cy="' + su[1] + '" r="' + n1(su[2] * (1.7 + 0.6 * glow)) + '" fill="url(#' + nid + '-sun)"/><circle class="efa-sun" cx="' + su[0] + '" cy="' + su[1] + '" r="' + n1(su[2] * (0.85 + 0.15 * glow)) + '"/>');
      out.push('<text class="efa-k" x="' + n1(Math.max(6, su[0] - su[2])) + '" y="' + n1(su[1] + su[2] + 21) + '">Sunlight</text>');
      var t0 = g.tiers[0], bx = t0.L(t0.yc) + g.ins, base = [bx, t0.yc];
      // the sunbeam into the grass
      out.push('<path class="efa-beam" d="M' + n1(su[0] - su[2] * 0.5) + ' ' + n1(su[1] + su[2] * 0.6) + ' L' + n1(bx - 10) + ' ' + n1(t0.yt + 6) + ' L' + n1(bx + 26) + ' ' + n1(t0.yt + 6) + ' L' + n1(su[0] + su[2] * 0.6) + ' ' + n1(su[1] + su[2] * 0.4) + 'Z"/>');
      // grass respiration on one measure with what it stores: each wisp is a tenth of GPP, and the stored stream (NPP,
      // the other 5 tenths) is exactly as wide as the 5 wisps together
      var half = Math.round(10 * RPCT / 100), rw = g.rw, store = rw * (10 - half);
      for(var w = 0; w < half; w++){ var ry = t0.yt + 8 + w * (t0.yb - t0.yt - 16) / Math.max(1, half - 1); out.push('<path class="efa-heat is-resp" style="stroke-width:' + rw.toFixed(2) + 'px" d="' + wisp(t0.R(ry) + 3, ry, -0.5 - w * 0.06, g.wl * 0.8, 1, 2.6) + '"/>'); }
      // the stream: from the grass up to the tip; after each step it is one part of ten, as thin as one heat wisp
      function sw(k){ return k < 0 ? store : Math.max(1.6, g.sw0 * Math.pow(0.66, k)); }
      var segs = [];
      for(var k = 0; k < 4 && k < p; k++){
        var a = trackAt(g, k), b = trackAt(g, Math.min(p, k + 1)), yS = g.tiers[k].yt - 1, f0 = clamp((p - k - 0.15) / 0.55, 0, 1);
        // below the step the stream carries what reached this level; above it, the one part in ten that goes on
        var cut = (a[1] - yS) / (a[1] - b[1] || 1);
        if(p <= k + 0.15 || cut >= 1) segs.push('<path class="efa-stream' + (k ? '' : ' is-npp') + '" style="stroke-width:' + sw(k - 1).toFixed(2) + 'px" d=""M' + n1(a[0]) + ' ' + n1(a[1]) + ' L' + n1(b[0]) + ' ' + n1(b[1]) + '"/>');
        else { var m = [lerp(a[0], b[0], cut), yS]; segs.push('<path class="efa-stream' + (k ? '' : ' is-npp') + '" style="stroke-width:' + sw(k - 1).toFixed(2) + 'px" d="M' + n1(a[0]) + ' ' + n1(a[1]) + ' L' + n1(m[0]) + ' ' + n1(m[1]) + '"/><path class="efa-stream" style="stroke-width:' + n1(sw(k)) + 'px" d="M' + n1(m[0]) + ' ' + n1(m[1]) + ' L' + n1(b[0]) + ' ' + n1(b[1]) + '"/>'); }
      }
      out.push(segs.join(''));
      out.push('<circle class="efa-pool" cx="' + n1(base[0]) + '" cy="' + n1(base[1]) + '" r="' + n1(sw(-1) * 0.55) + '"/>');
      // the split at each step passed: of every 10 parts, 1 goes on (the gold stream) and 9 leave as heat, each wisp
      // as wide as the stream that goes on (one measure per step); they grow out as the energy passes
      for(var s2 = 0; s2 < 4; s2++){
        var f = clamp((p - s2 - 0.15) / 0.55, 0, 1); if(f <= 0) continue;
        var t = g.tiers[s2], yB = t.yt - 1, hw = sw(s2), sp = Math.max(hw * 2.2, g.ph ? 4.2 : 5.6);
        for(var hh = 0; hh < 9; hh++){
          var yy = yB + 3 + hh * sp, xx = trackAt(g, s2 + (yy > t.yc ? 0 : 0))[0] - (yy - trackAt(g, s2)[1]) * (g.track[2] - g.track[0]) / (g.track[3] - g.track[1]);
          out.push('<path class="efa-heat" style="stroke-width:' + n1(hw) + 'px" d="' + wisp(xx - hw, yy, Math.PI + 0.42 - hh * 0.02, g.wl, f, 2.2) + '"/>');
        }
        if(s2 === Math.min(3, reached - 1) && f >= 1 && S.p === S.lvl){
          // placed from the knob's drawn box (it sits on the level reached): "90% heat" left of the wisps and below
          // the knob, "10% on" right of the stream at the step, under the knob
          var kp = trackAt(g, S.lvl), kb = [kp[0] - knobR - 3, kp[1] - knobR - 3, kp[0] + knobR + 3, kp[1] + knobR + 3];
          var sxB = trackAt(g, s2)[0] - (yB - trackAt(g, s2)[1]) * (g.track[2] - g.track[0]) / (g.track[3] - g.track[1]);
          var hy = Math.max(yB + 12, kb[3] + fs * 0.75 + 2), hx = Math.min(sxB - g.wl * 0.95 - 2, kb[0] - 2);
          out.push(pill(hx, hy, '90% heat', 'is-heat', fs - 1.5, 'end').svg);
          var ow = tw('10% on', fs - 1.5, true) + 14;
          if(kb[0] - 6 - ow >= 4) out.push(pill(kb[0] - 4, kp[1], '10% on', 'is-energy', fs - 1.5, 'end').svg);   // left of the knob, in the sky
          else out.push(pill(Math.max(sxB + 10, kp[0] + 6), Math.max(yB - 2, kb[3] + fs * 0.75 + 2), '10% on', 'is-energy', fs - 1.5, 'start').svg);
        }
      }
      // the tiers' labels (the energy written once it arrives): their own layer, rebuilt only when they change
      out.push('\u0000');
      g.tiers.forEach(function(t){
        var on = clamp(p - t.k + 1, 0, 1), at = p >= t.k - 0.001;
        var lab = labelSpot(g, t), ly = t.k === 0 && g.ph ? t.yt + fs * 0.9 + 2 : t.yc - (at ? fs * 0.72 + 2 : 0), cls = lab.inside ? 'efa-lab is-in' : 'efa-lab';
        out.push('<text class="' + cls + '" x="' + n1(lab.x) + '" y="' + n1(ly + fs * 0.35) + '" text-anchor="' + lab.anchor + '" style="font-size:' + fs + 'px">' + esc(NAME[t.k]) + '</text>');
        if(at) out.push('<text class="efa-val" x="' + n1(lab.x) + '" y="' + n1(ly + fs * 1.8 + 4) + '" text-anchor="' + lab.anchor + '" style="font-size:' + fs + 'px">' + esc(kc(P.levels[t.k].energy)) + (t.k ? '<tspan class="efa-sh"> ' + esc(pct(P.levels[t.k].share)) + '</tspan>' : '') + '</text>');
      });
      return out.join('');
    }
    function causeChain(){
      var P = pyr(), rl = Math.floor(S.p + 1e-6), settled = S.p === S.lvl;
      if(rl === 0) return { parts: [{ t: EF.big(S.gpp) + ' kcal of sunlight', role: 'energy' }, { t: 'half to heat', role: 'heat' }, { t: EF.big(P.npp) + ' kcal stored', role: 'energy' }] };
      var x = []; for(var i = 0; i < rl; i++) x.push('0.1');
      if(rl === 4 && settled) return { take: 'Each step keeps only about 10%, so the hawks get ' + pct(P.levels[4].share) + ' of the grass’s energy.' };
      return { parts: [{ t: EF.big(P.npp) + ' kcal', role: 'energy' }, { t: '× ' + x.join(' × '), role: 'ink' }, { t: '90% heat', role: 'heat', join: '+' }, { t: kc(P.levels[rl].energy) + ' ' + NAME[rl].toLowerCase(), role: 'energy' }] };
    }

    /* ================= chapter 2: one field */
    function geoEat(W, H){
      var ph = W < 700, g = { W: W, H: H, ph: ph, fs: ph ? 12.5 : 14 };
      if(!ph){
        var gy = H * 0.58;
        g.gy = gy; g.field = [16, gy, W * 0.36, H - 16]; g.lot = [W * 0.42, gy, W * 0.62, gy + (H - gy) * 0.72]; g.town = [W * 0.66, gy - 10, W - 16, H - 12];
        g.B = Math.min(40, H * 0.07); g.sun = [W * 0.07, H * 0.13, Math.min(28, H * 0.05)];
        g.out = [W * 0.36 + 4, gy + 30];     // where the harvest leaves the field
        g.strack = [g.field[0] + 40, H - 96, g.field[2] - 40, H - 96];
      } else {
        var gy1 = H * 0.3;
        g.gy = gy1; g.field = [10, gy1, W * 0.52, gy1 + H * 0.22]; g.lot = [W * 0.6, gy1, W - 10, gy1 + H * 0.15]; g.town = [10, H * 0.6, W - 10, H - 10];
        g.B = 22; g.sun = [W * 0.1, H * 0.08, 16];
        g.out = [W * 0.27, gy1 + H * 0.22 + 6];
        g.strack = [g.field[0] + 52, gy1 + H * 0.22 - 18, g.field[2] - 52, gy1 + H * 0.22 - 18];
      }
      // the people: 44 places in rows, front row first
      var T0 = g.town.slice(); T0[1] += ph ? 46 : 0; g.pplTop = T0[1]; var cols = ph ? 11 : Math.max(8, Math.min(11, Math.round((T0[2] - T0[0]) / 34))), rows = Math.ceil(44 / cols);
      var cw = (T0[2] - T0[0]) / cols, rh = Math.min((T0[3] - T0[1] - 6) / rows, cw * 1.8), ph2 = Math.min(rh * 1.3, cw * 1.6);
      g.ppl = []; for(var i = 0; i < 44; i++){ var r = Math.floor(i / cols), c = i % cols, order = [5, 4, 6, 3, 7, 2, 8, 1, 9, 0, 10].filter(function(x){ return x < cols; })[c] != null ? [5, 4, 6, 3, 7, 2, 8, 1, 9, 0, 10].filter(function(x){ return x < cols; })[c] : c;
        g.ppl.push({ x: T0[0] + cw * (order + 0.5) + (r % 2 ? cw * 0.18 : 0), y: T0[3] - r * rh, h: ph2 }); }
      g.ppl.sort(function(a, b){ return b.y - a.y; });
      var L = g.lot, cwid = (L[2] - L[0]) / 3, ch = (L[3] - L[1] - 8) / 2, cs = Math.min(cwid * 0.92, ch * 1.5);
      g.cows = []; for(var k = 0; k < 6; k++){ var row = Math.floor(k / 3); g.cows.push({ x: L[0] + cwid * ((k % 3) + 0.5) + (row ? -cwid * 0.12 : cwid * 0.08), y: L[1] + 6 + ch * (row + 1), s: cs }); }
      return g;
    }
    function staticEat(g){
      var W = g.W, H = g.H, F = g.field, out = [sky(W, H, g.gy)];
      out.push('<rect class="efa-ground" x="0" y="' + n1(g.gy) + '" width="' + W + '" height="' + n1(H - g.gy) + '" fill="url(#' + nid + '-gr)"/>');
      // the field: soil and rows of corn
      out.push('<rect class="efa-soil" x="' + n1(F[0]) + '" y="' + n1(F[1] + 4) + '" width="' + n1(F[2] - F[0]) + '" height="' + n1(F[3] - F[1] - 4) + '" rx="10" fill="url(#' + nid + '-so)"/>');
      var rows = g.ph ? 2 : 3, cs = Math.min((F[3] - F[1]) / (rows + 0.4), g.ph ? 46 : 70);
      for(var r = 0; r < rows; r++) for(var x = F[0] + cs * 0.35; x < F[2] - cs * 0.3; x += cs * 0.42) out.push(art('corn', x + (r % 2) * cs * 0.2, F[1] + cs * (r * 0.75 + 0.42) - 2, cs));
      out.push(pill((F[0] + F[2]) / 2, F[1] - (g.ph ? 12 : 16), '1 hectare of corn', 'is-ink', g.fs - 1).svg);
      // the feedlot: a fence around trodden ground
      var L = g.lot;
      out.push('<rect class="efa-lot" x="' + n1(L[0]) + '" y="' + n1(L[1] + 4) + '" width="' + n1(L[2] - L[0]) + '" height="' + n1(L[3] - L[1]) + '" rx="8"/>');
      for(var fx = L[0]; fx <= L[2] + 0.5; fx += (L[2] - L[0]) / 6) out.push('<path class="efa-post" d="M' + n1(fx) + ' ' + n1(L[3] + 4) + ' v-16"/>');
      out.push('<path class="efa-rail" d="M' + n1(L[0]) + ' ' + n1(L[3] - 4) + ' H' + n1(L[2]) + ' M' + n1(L[0]) + ' ' + n1(L[3] - 10) + ' H' + n1(L[2]) + '"/>');
      // the town's ground
      var Tn = g.town;
      var hw = Math.min(g.ph ? 40 : 70, (Tn[2] - Tn[0]) / 4.4), hy = g.ph ? Tn[1] + 40 : g.gy + 4;
      (g.ph ? [0.1, 0.42] : [0.16, 0.5, 0.84]).forEach(function(fx, i){ var x = Tn[0] + (Tn[2] - Tn[0]) * fx, hh = hw * (0.78 + 0.08 * i);
        out.push('<g class="efa-house"><rect class="efa-wall" x="' + n1(x - hw / 2) + '" y="' + n1(hy - hh) + '" width="' + n1(hw) + '" height="' + n1(hh) + '"/><path class="efa-roof" d="M' + n1(x - hw * 0.62) + ' ' + n1(hy - hh) + ' L' + n1(x) + ' ' + n1(hy - hh - hw * 0.5) + ' L' + n1(x + hw * 0.62) + ' ' + n1(hy - hh) + 'Z"/><rect class="efa-door" x="' + n1(x - hw * 0.12) + '" y="' + n1(hy - hh * 0.5) + '" width="' + n1(hw * 0.24) + '" height="' + n1(hh * 0.5) + '"/><rect class="efa-win" x="' + n1(x + hw * 0.2) + '" y="' + n1(hy - hh * 0.72) + '" width="' + n1(hw * 0.2) + '" height="' + n1(hw * 0.18) + '"/></g>'); });
      return out.join('');
    }
    function band(d, w, cls, k){ return w > 0.3 ? '<path class="' + cls + '" data-k="' + k + '" style="stroke-width:' + w.toFixed(2) + 'px" d="' + d + '"/>' : ''; }
    function dynEat(g){
      var out = [], f = S.fs, R = EF.field(f), B = g.B, fs = g.fs, wG = B * (1 - f), wC = B * f, wBeef = wC * 0.1, wHeat = wC * 0.9;
      if(cows.some(function(v){ return v > 0.05; })) wBeef = Math.max(wBeef, 0.6);   // a cow always passes some beef on (a drawn minimum)
      var su = g.sun; out.push('<circle class="efa-sunglow" cx="' + n1(su[0]) + '" cy="' + n1(su[1]) + '" r="' + n1(su[2] * 2.3) + '" fill="url(#' + nid + '-sun)"/><circle class="efa-sun" cx="' + n1(su[0]) + '" cy="' + n1(su[1]) + '" r="' + n1(su[2]) + '"/>');
      var L = g.lot, Tn = g.town, o = g.out, lotIn, lotOut, townIn, townIn2, plume;
      if(!g.ph){
        var ly = L[1] + (L[3] - L[1]) * 0.3;
        lotIn = [L[0] - 2, ly]; lotOut = [L[2] + 2, ly]; townIn = [Tn[0] + (Tn[2] - Tn[0]) * 0.33, g.gy + 8]; townIn2 = [Tn[0] + 12, g.gy + 8];
        // grain to the people: an arc over the feedlot; to the cattle: straight in
        var gTop = g.gy - g.H * 0.42;
        out.push(band('M' + n1(o[0]) + ' ' + n1(o[1] - wC / 2) + ' C' + n1(o[0] + g.W * 0.12) + ' ' + n1(o[1] - wC / 2) + ' ' + n1(o[0] + g.W * 0.04) + ' ' + n1(gTop) + ' ' + n1((o[0] + townIn[0]) / 2) + ' ' + n1(gTop) + ' S' + n1(townIn[0]) + ' ' + n1(gTop + 10) + ' ' + n1(townIn[0]) + ' ' + n1(townIn[1]), wG, 'efa-band', 'grain'));
        out.push(band('M' + n1(o[0]) + ' ' + n1(o[1] + wG / 2) + ' C' + n1((o[0] + lotIn[0]) / 2) + ' ' + n1(o[1] + wG / 2) + ' ' + n1((o[0] + lotIn[0]) / 2) + ' ' + n1(lotIn[1]) + ' ' + n1(lotIn[0]) + ' ' + n1(lotIn[1]), wC, 'efa-band', 'cattle'));
        out.push(band('M' + n1(lotOut[0]) + ' ' + n1(lotOut[1]) + ' C' + n1(townIn2[0]) + ' ' + n1(lotOut[1]) + ' ' + n1(townIn2[0]) + ' ' + n1(lotOut[1]) + ' ' + n1(townIn2[0]) + ' ' + n1(townIn2[1]), wBeef, 'efa-band', 'beef'));
        plume = [(L[0] + L[2]) / 2, L[1] - 6];
      } else {
        lotIn = [L[0] - 4, (L[1] + L[3]) / 2]; townIn = [o[0], Tn[1] - 2]; townIn2 = [(L[0] + L[2]) / 2 + 10, Tn[1] - 2]; lotOut = [(L[0] + L[2]) / 2 + 10, L[3] + 6];
        out.push(band('M' + n1(o[0] - wC / 2) + ' ' + n1(o[1] - 8) + ' V' + n1(townIn[1]), wG, 'efa-band', 'grain'));
        out.push(band('M' + n1(g.field[2] + 2) + ' ' + n1(lotIn[1] - wG * 0) + ' H' + n1(lotIn[0]), wC, 'efa-band', 'cattle'));
        out.push(band('M' + n1(lotOut[0]) + ' ' + n1(lotOut[1]) + ' V' + n1(townIn2[1]), wBeef, 'efa-band', 'beef'));
        plume = [(L[0] + L[2]) / 2 - 6, L[1] - 4];
      }
      // the cattle's heat: a plume 9 times the beef, on the same measure as every band
      if(wHeat > 0.3){
        var hp = '', hy = plume[1], top = g.ph ? Math.max(18, hy - g.H * 0.2) : Math.max(24, hy - g.H * 0.22);
        hp = 'M' + n1(plume[0]) + ' ' + n1(hy) + ' C' + n1(plume[0] - 18) + ' ' + n1(lerp(hy, top, 0.35)) + ' ' + n1(plume[0] + 18) + ' ' + n1(lerp(hy, top, 0.65)) + ' ' + n1(plume[0] - 4) + ' ' + n1(top);
        out.push('<path class="efa-plume" style="stroke-width:' + wHeat.toFixed(2) + 'px" d="' + hp + '"/>');
        if(wHeat >= 6) out.push(pill(plume[0] + wHeat / 2 + 8, lerp(hy, top, 0.6), '90% heat', 'is-heat', fs - 1.5, 'start').svg);
      }
      if(wG >= 8) out.push(pill(g.ph ? o[0] + wG / 2 + 8 : (o[0] + townIn[0]) / 2, g.ph ? (g.field[3] + Tn[1]) / 2 + 6 : g.gy - g.H * 0.3 - wG / 2 - 14, 'grain', 'is-energy', fs - 1.5, g.ph ? 'start' : null).svg);
      if(wBeef >= 1.2 && cows.some(function(v){ return v > 0.5; })) out.push(pill(g.ph ? townIn2[0] + 8 : (lotOut[0] + townIn2[0]) / 2, g.ph ? (lotOut[1] + townIn2[1]) / 2 : lotOut[1] - 14, 'beef', 'is-energy', fs - 1.5, g.ph ? 'start' : null).svg);
      // the cows

      if(!cows.some(function(v){ return v > 0.05; })) out.push('<text class="efa-k is-mut" x="' + n1((L[0] + L[2]) / 2) + '" y="' + n1((L[1] + L[3]) / 2 + 8) + '" text-anchor="middle" style="font-size:' + (fs - 1) + 'px">no cattle</text>');
      // the people: the ones fed stand in the town, one by one
      var shown = 0;
      people.forEach(function(v){ if(v > 0.5) shown++; });
      g.shown = shown;
      var tp = pill(g.ph ? (Tn[0] + Tn[2]) / 2 : Tn[0] + (Tn[2] - Tn[0]) * 0.67, g.gy - Math.min(70, (Tn[2] - Tn[0]) / 4.4) * 1.45 - 14, shown + ' people fed', 'is-ink', fs);
      if(!g.ph) out.push(tp.svg); else out.push(pill(W2(g) - 12, g.pplTop - 18, shown + ' people fed', 'is-ink', fs, 'end').svg);
      return out.join('');
    }
    function W2(g){ return g.W; }
    function causeEat(){
      var n = G && G.shown != null ? G.shown : EF.field(S.fs).people, all = EF.field(0).people, pc = Math.round(S.fs * 100);
      if(S.fs !== S.share) return { parts: [{ t: pc + '% of corn to cattle', role: 'energy' }] };
      if(pc === 0) return { parts: [{ t: 'All the corn eaten as grain', role: 'energy' }, { t: n + ' people fed', role: 'ink' }] };
      if(pc === 100 && n === EF.field(1).people) return { take: 'Fed to cattle first, the field feeds ' + n + ' people, not ' + all + '.' };
      return { parts: [{ t: pc + '% of corn to cattle', role: 'energy' }, { t: '90% of it lost as heat', role: 'heat' }, { t: n + ' people fed, not ' + all, role: 'ink' }] };
    }

    /* ================= chapter 3: the food web */
    var WPOS = { grass: [0.5, 0.92], grasshopper: [0.14, 0.68], rabbit: [0.86, 0.68], mouse: [0.5, 0.6], frog: [0.13, 0.36], snake: [0.36, 0.16], fox: [0.86, 0.36], hawk: [0.66, 0.06] };
    var WPOS_PH = { grass: [0.5, 0.95], grasshopper: [0.1, 0.72], rabbit: [0.88, 0.72], mouse: [0.5, 0.57], frog: [0.1, 0.44], snake: [0.34, 0.13], fox: [0.92, 0.36], hawk: [0.66, 0.02] };
    function geoWeb(W, H){
      var ph = W < 640, top = ph ? 50 : 56, bot = ph ? 44 : 48, side = ph ? 38 : Math.max(80, W * 0.12), pos = {};
      var r = Math.min(ph ? 29 : 44, (H - top - bot) * 0.1, W * 0.08);
      CHAIN_WEB().forEach(function(s){ var q = (ph ? WPOS_PH : WPOS)[s.id]; pos[s.id] = { x: side + q[0] * (W - 2 * side), y: top + q[1] * (H - top - bot) }; });
      return { W: W, H: H, ph: ph, pos: pos, r: r, fs: ph ? 12.5 : 14, gy: top + 0.45 * (H - top - bot) };
    }
    function staticWeb(g){
      var out = [sky(g.W, g.H, g.gy)];
      out.push('<rect class="efa-ground" x="0" y="' + n1(g.gy) + '" width="' + g.W + '" height="' + n1(g.H - g.gy) + '" fill="url(#' + nid + '-gr)"/>');
      for(var i = 0; i < 26; i++){ var x = 12 + (i * 97.3) % (g.W - 24), y = g.gy + 12 + ((i * 53.1) % (g.H - g.gy - 18)); out.push('<path class="efa-tuft" d="M' + n1(x) + ' ' + n1(y) + ' l-3 -7 M' + n1(x) + ' ' + n1(y) + ' l1 -9 M' + n1(x) + ' ' + n1(y) + ' l4 -7"/>'); }
      return out.join('');
    }
    var EFX = { up: 'More', down: 'Fewer', maybe: 'Maybe fewer', gone: 'Dies out', removed: 'Removed' };
    function dynWeb(g){
      var out = [], t = webTarget(), web = CHAIN_WEB(), r = g.r, fs = g.fs, P = g.pos;
      // arrows from food to eater (energy gold); they fade with a species that is gone
      web.forEach(function(s){
        s.eats.forEach(function(fid){
          var a = P[fid], b = P[s.id], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
          var x0 = a.x + ux * r * 1.05, y0 = a.y + uy * r * 1.05, x1 = b.x - ux * (r * 1.12 + 6), y1 = b.y - uy * (r * 1.12 + 6);
          var mx = (x0 + x1) / 2 - uy * d * 0.08, my = (y0 + y1) / 2 + ux * d * 0.08;
          var op = Math.min(wShown[fid].o, wShown[s.id].o < 0.5 ? wShown[s.id].o : 1);
          op = Math.max(0.1, Math.min(op, 1 - 0.85 * Math.max(wShown[fid].g, wShown[s.id].g)));
          if(wShown[fid].o < 0.02 || wShown[s.id].o < 0.02) op = 0.1;
          out.push('<path class="efa-link" style="opacity:' + op.toFixed(2) + '" d="M' + n1(x0) + ' ' + n1(y0) + ' Q' + n1(mx) + ' ' + n1(my) + ' ' + n1(x1) + ' ' + n1(y1) + '" marker-end="url(#' + nid + '-ar)"/>');
        });
      });
      out.unshift('<defs><marker id="' + nid + '-ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" class="efa-link-h"/></marker></defs>');
      // the species
      web.forEach(function(s){
        var w = wShown[s.id], p = P[s.id], eff = t[s.id].eff;
        var nm = cap(s.name), ly = p.y + r + fs * 0.9;
        out.push(pill(p.x, ly, nm, 'is-ink is-name', fs - 1).svg);
        if(w.b > 0.02 && eff !== 'same'){
          var bt = EFX[eff], bp = pill(p.x, p.y - r * 1.12 - fs * 0.85, bt, 'is-' + eff, fs - 1.5);
          out.push('<g style="opacity:' + w.b.toFixed(2) + '">' + bp.svg + '</g>');
        }
      });
      return out.join('');
    }
    function causeWeb(){
      if(!S.removed) return { parts: [{ t: 'Arrows: food → eater', role: 'energy' }, { t: 'tap one to take it out', role: 'ink' }] };
      var web = CHAIN_WEB(), res = EF.respond('grassland', S.removed), nm = function(id){ return web.filter(function(s){ return s.id === id; })[0].name; };
      var parts = [{ t: 'No ' + nm(S.removed), role: 'bad' }];
      if(S.wt < 1) return { parts: parts };
      var gone = [], up = [], down = [], maybe = [];
      web.forEach(function(s){ var x = res[s.id]; if(!x || s.id === S.removed) return; if(x.effect === 'gone') gone.push(s.name); else if(x.effect === 'up') up.push(s.name); else if(x.effect === 'down') (x.direct ? down : maybe).push(s.name); });
      if(gone.length >= 7) return { parts: parts.concat([{ t: 'every animal dies out', role: 'bad' }]) };
      function list(a){ return a.length > 2 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(' and '); }
      if(gone.length) parts.push({ t: list(gone) + ' die out', role: 'bad' });
      if(up.length) parts.push({ t: list(up) + ' more', role: 'ink' });
      if(down.length) parts.push({ t: list(down) + ' fewer', role: 'ink', join: up.length ? '+' : null });
      if(parts.length === 1 && maybe.length) parts.push({ t: list(maybe) + ' maybe fewer', role: 'ink' });
      return { parts: parts };
    }

    /* ---- drawing and words */
    var lastCause = '';
    function draw(){
      if(!G) return;
      var h = (S.ch === 'chain' ? dynChain(G) : S.ch === 'eat' ? dynEat(G) : dynWeb(G)).split('\u0000');
      if(h[0] !== draw.h){ draw.h = h[0]; gDyn.innerHTML = h[0]; }
      if((h[1] || '') !== draw.l){ draw.l = h[1] || ''; gLabs.innerHTML = draw.l; }
      updMid();
      var c = S.ch === 'chain' ? causeChain() : S.ch === 'eat' ? causeEat() : causeWeb(), key = JSON.stringify(c);
      if(key !== lastCause){
        lastCause = key;
        if(c.take) cause.take(c.take); else cause.set(c.parts);
        var txt = c.take || cause.text();
        live.textContent = txt;
        svg.setAttribute('aria-label', (S.ch === 'chain' ? 'An energy pyramid of a meadow: grass, grasshoppers, frogs, snakes and hawks. ' : S.ch === 'eat' ? 'One hectare of corn, a feedlot and the people the field feeds. ' : 'A meadow food web; arrows point from food to eater. ') + txt);
      }
    }
    function setCh(v){
      S.ch = v; stage.setAttribute('data-ch', v); tabs.value(v); head.purpose(PURPOSE[v]);
      Object.keys(cues).forEach(function(k){ if(k !== v) cues[k].hide(false); });
      stopTour(); lastCause = ''; refHtml();
      layoutNow(); if(S.mode === 'explore') cues[v].show();
    }

    /* ---- "Show me how": three pointers per chapter (opens from its link and from "?") */
    var tour = null;
    function knobOf(c){ return c.el.querySelector('.tk2-knob') || c.el; }
    function tourSteps(){
      if(S.ch === 'chain') return [{ id: 'up', text: 'Drag the energy up one level at a time.', target: function(){ return knobOf(cLvl); } },
        { id: 'heat', text: 'At every step, 9 of 10 parts leave as heat.', target: function(){ return sceneBox; } },
        { id: 'sun', text: 'More sunlight means more for every level.', target: function(){ return knobOf(cSun); } }];
      if(S.ch === 'eat') return [{ id: 'cattle', text: 'Drag to feed more of the corn to cattle.', target: function(){ return knobOf(cShare); } },
        { id: 'heat', text: 'The cattle lose 90% of it as heat.', target: function(){ return sceneBox; } },
        { id: 'ppl', text: 'Count the people the field still feeds.', target: function(){ return cause.el; } }];
      return [{ id: 'tap', text: 'Tap an animal to take it out of the web.', target: function(){ return cWeb[4].el; } },
        { id: 'look', text: 'Linked animals show more, fewer or dies out.', target: function(){ return sceneBox; } },
        { id: 'back', text: 'Tap it again to bring it back.', target: function(){ return cause.el; } }];
    }
    function startTour(force){ if(S.mode !== 'explore') return; stopTour(); if(force) cues[S.ch].hide(false); tour = K.tour({ key: 'apenv-ef-' + S.ch, label: 'Show me how', steps: tourSteps() }); if(force) tour.start(true); }
    function stopTour(){ if(tour){ tour.stop(); tour = null; } }
    function tourDid(id){ if(tour && tour.active()) tour.did(id); }

    /* ---- "?" for the chapter */
    function refHtml(){
      var P = pyr(), h = '';
      if(S.ch === 'chain'){
        h = '<p><b>Where the energy goes.</b> The grass captures sunlight (gross primary productivity, GPP) and uses about half in its own cellular respiration, which leaves as heat. What is left is stored: <b>NPP = GPP − respiration</b>. Only NPP is food for the levels above.</p><p><b>Energy flows one way.</b> Heat cannot be turned back into food, so a food chain needs new sunlight every day; nutrients cycle, energy does not.</p>' +
          '<p><b>The 10% rule.</b> About 10% of a level’s energy becomes the next level’s tissue. The rest is used for living (respiration releases it as heat), never eaten, or passed out as waste for decomposers, whose respiration also ends as heat. Count the feeding steps and multiply by 0.1 for each one; going down, divide. Real transfers run from about 5% to 20%; the exam uses 10%.</p>' +
          '<h3 class="ls-title-l">This meadow (kcal/m²/yr)</h3>' + T.dataTable(['Level', 'Energy', 'Share of NPP', 'Setup'], P.levels.map(function(l, k){ var x = []; for(var i = 0; i < k; i++) x.push('0.1'); return [esc(NAME[k]) + '<br><span class="bt-small">' + esc(EF.LEVEL_SHORT[k]) + '</span>', num(l.energy), pct(l.share), k ? num(P.npp) + ' × ' + x.join(' × ') : 'GPP ' + num(P.gpp) + ' − ' + num(P.r)]; }), 'Energy at each level for GPP ' + num(P.gpp)) +
          '<p class="bt-small">How it is drawn: the tiers step down evenly, as a textbook draws an energy pyramid; drawn to scale, each tier would be a tenth as wide as the one below and the hawks a sliver. At each step the 10 strokes are one measure: 1 gold goes on, 9 vermillion leave as heat. The grass’s 5 wisps (each a tenth of the sunlight it captures) are together as wide as the gold it stores: half to heat, half stored. The animals in a tier are not counts: a pyramid of numbers can even be inverted (one oak feeds thousands of caterpillars), but a pyramid of energy never is.</p>' +
          '<h3 class="ls-title-l">Biomass and numbers in three ecosystems</h3>' + EF.ECO_IDS.map(function(id){ var Q = EF.pyramid(id, 20000, 50, 0.1), bi = EF.inverted(Q, 'biomass'), ni = EF.inverted(Q, 'number');
            return T.dataTable(['Level', 'Energy (kcal/m²/yr)', 'Biomass (g/m²)', 'Number per hectare'], Q.levels.map(function(l){ return [esc(cap(l.plural)), num(l.energy), num(l.biomass), num(l.number)]; }), cap(EF.ECOS[id].name)) +
              '<p class="bt-small">' + cap(EF.ECOS[id].name) + ': energy upright; biomass ' + (bi ? 'inverted (more ' + esc(Q.levels[bi].plural) + ' than ' + esc(Q.levels[bi - 1].plural) + ')' : 'upright') + '; numbers ' + (ni ? 'inverted (more ' + esc(Q.levels[ni].plural) + ' than ' + esc(Q.levels[ni - 1].plural) + ')' : 'upright') + '.</p>'; }).join('') +
          '<p class="bt-small">Biomass is the energy flowing through a level divided by how fast its organisms turn over; numbers are biomass over one individual’s mass. Those rates and masses are illustrative, chosen so each ecosystem shows its textbook shape.</p>';
      } else if(S.ch === 'eat'){
        var F = EF.FIELD;
        h = '<p><b>One more step.</b> People who eat grain are primary consumers. Feeding the grain to cattle first makes people secondary consumers: the cattle use most of it to live and stay warm, and it leaves as heat and waste. With the 10% rule, the beef holds a tenth of the grain’s energy.</p>' +
          '<h3 class="ls-title-l">The numbers</h3><ul class="efa-src">' +
          '<li>A hectare of corn grows about ' + EF.big(F.kcal / 1e6) + ' million kcal of grain a year: about 177 bushels an acre in 2023 (USDA NASS, <i>Crop Production 2023 Summary</i>), about 11,100 kg a hectare, at about 365 kcal per 100 g (USDA FoodData Central). Rounded.</li>' +
          '<li>A person eats about ' + EF.big(F.perDay) + ' kcal a day, ' + EF.big(F.perYear) + ' a year: the grain feeds ' + EF.field(0).people + ' people, the beef from all of it ' + EF.field(1).people + '.</li>' +
          '<li>Real animals do worse than 10% for beef (nearer 3%) and better for chicken and eggs; across all livestock, about 12% of feed calories come back as food, and about a third of the world’s crop calories are fed to animals (Cassidy and others, 2013, <i>Environmental Research Letters</i>).</li>' +
          '<li>A teaching model: cattle also eat grass on land that grows no crops, and grain is not all a diet needs.</li></ul>' +
          T.dataTable(['To cattle', 'People fed'], [0, 25, 50, 75, 100].map(function(v){ return [v + '%', String(EF.field(v / 100).people)]; }), 'People one hectare feeds');
      } else {
        h = '<p><b>Reading the web.</b> Each arrow points from a food to the organism that eats it, the way energy moves. An organism with many arrows in has many foods; one with many arrows out is eaten by many.</p>' +
          '<p><b>Taking a species out</b> shows its first, most likely effects: its prey increase (fewer are eaten), its predators decrease (one food fewer), and a consumer left with no food dies out, and so on up the web. “Maybe fewer” marks an indirect, less certain effect: a hungrier predator eating more of its other food, or more plant eaters eating more plants. Later, animals may switch foods and numbers can recover; a web with more links is more stable.</p>' +
          '<h3 class="ls-title-l">Who eats whom</h3><ul class="efa-src">' + CHAIN_WEB().map(function(s){ var w = CHAIN_WEB(); return '<li><b>' + esc(cap(s.name)) + '</b> ' + (s.eats.length ? 'eat ' + s.eats.map(function(f){ return w.filter(function(x){ return x.id === f; })[0].name; }).join(', ') : (s.id === 'grass' ? 'is a producer' : 'are producers')) + '.</li>'; }).join('') + '</ul>' +
          (S.removed ? (function(){ var res = EF.respond('grassland', S.removed), w = CHAIN_WEB(); return '<h3 class="ls-title-l">Why each one changes (no ' + esc(w.filter(function(x){ return x.id === S.removed; })[0].name) + ')</h3><ul class="efa-src">' + w.filter(function(x){ return x.id !== S.removed && res[x.id] && res[x.id].effect !== 'same'; }).map(function(x){ var r = res[x.id]; return '<li><b>' + esc(cap(x.name)) + ': ' + esc(EFX[r.effect === 'down' && !r.direct ? 'maybe' : r.effect].toLowerCase()) + '.</b> ' + esc(r.why) + '</li>'; }).join('') + '</ul>'; })() : '') +
          '<p class="bt-small">The pond and forest webs are in Test yourself.</p>';
      }
      ref.innerHTML = '<p class="efa-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use this chapter.</p>' + h;
    }
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-how]')){ if(LS && LS.close) LS.close(); setTimeout(function(){ startTour(true); }, 280); } });

    function labelTaps(){ CHAIN_WEB().forEach(function(sp, i){ cWeb[i].el.setAttribute('aria-label', (S.removed === sp.id ? 'Bring back the ' : 'Take out the ') + sp.name); }); }
    var webChanged0 = webChanged; webChanged = function(){ webChanged0(); labelTaps(); };
    labelTaps();

    function studio(pane, s){
      LS = s;
      K.on(s);
      s.add('stage', stage, { mode: 'explore' });
      s.add('details', ref, { mode: 'explore' });
      stage.setAttribute('data-ls-only', 'explore'); ref.setAttribute('data-ls-only', 'explore');
      var ab = pane.querySelector('details.tool-about, .tool-about'); if(ab) s.add('about', ab, { mode: 'explore' });
      s.mode(s.mode());
      refHtml(); layoutNow();
      if(window.ResizeObserver){ var tm = null; new ResizeObserver(function(){ clearTimeout(tm); tm = setTimeout(layoutNow, 50); }).observe(sceneBox); }
      try{ new MutationObserver(function(){ layoutNow(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
      if(s.mode() === 'explore') cues[S.ch].show();
      startTour(false);
    }
    refHtml();
    return {
      studio: studio,
      shown: function(m){
        S.mode = m;
        if(m === 'explore'){ setTimeout(function(){ layoutNow(); cues[S.ch].show(); }, 30); }
        else { stopTour(); Object.keys(cues).forEach(function(k){ cues[k].hide(false); }); }
      }
    };
  }

  /* After a step the drill clears its Check button (the focused element), and the figure redraws: keep focus in the
     drill, on the next step's first input, else on the feedback just given, never the page start. */
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
      refit: function(api){ figure(api.fig, api.problem, api.st || {}); },
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
      H = T.figSize(W, phone ? 440 : 400, { max: 0.95 })[1];
      var res = done && done.w1 && done.w2 ? f.removed : null;
      inner = drawWeb(f.eco, { W: W, H: H, removed: res || null, mark: f.removed, ask: res ? null : f.ask, interactive: false });
      label = 'Food web of the ' + E.name + ' with the ' + f.removed + ' removed';
    } else if(f.kind === 'budget'){
      W = phone ? 400 : 440; H = phone ? 200 : 180;   // drawn narrower, so on the stage it shows larger
      var P0 = { gpp: f.gpp || (f.npp + f.r), r: f.r, npp: f.npp || (f.gpp - f.r), levels: [] };
      var Hb = H; H = T.figSize(W, H, { max: 0.62 })[1];
      inner = '<g transform="translate(0 ' + Math.round((H - Hb) / 2) + ')">' + budgetSvg(P0, W, Hb, { hideG: f.gpp == null && !(done && done.ans), hideN: f.npp == null && !(done && done.ans) }) + '</g>';
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
      H = T.figSize(W, phone ? 80 + 78 * P.levels.length : 70 + 80 * P.levels.length, { max: P.levels.length < 3 ? 0.5 : 0.3 + 0.2 * P.levels.length })[1];
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
