'use strict';

/* ---------- config ---------- */
const API = 'https://pokeapi.co/api/v2/';
const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const MODEL = 'https://raw.githubusercontent.com/Pokemon-3D-api/assets/refs/heads/main/models/opt/';
const CACHE_KEY = 'pokedexCacheV9';      // bumped: v8 entries may not include species descriptions
const HISTORY_KEY = 'pokemonSearchHistory';
const MAX_DEX = 1025;
const MAX_CACHED_POKEMON = 150;
const pokemonDataCache = new Map();      // trimmed Pokémon data shared by gallery and detail views
const TYPE_COLORS = {
  normal: '#a8a77a', fire: '#e08a5b', water: '#6f93c9', electric: '#e0c25a', grass: '#7fb069',
  ice: '#8cc5c9', fighting: '#c0605a', poison: '#a668a6', ground: '#d1b06a', flying: '#9aa5d6',
  psychic: '#e07f9c', bug: '#a4b454', rock: '#b5a25f', ghost: '#7a689a', dragon: '#6f6ac0',
  dark: '#6b5d54', steel: '#a5a9bd', fairy: '#dda0c0'
};
const TYPE_TEXT_COLORS = {
  normal: '#173A63', fire: '#173A63', water: '#173A63', electric: '#173A63', grass: '#173A63',
  ice: '#173A63', fighting: '#173A63', poison: '#173A63', ground: '#173A63', flying: '#173A63',
  psychic: '#173A63', bug: '#173A63', rock: '#173A63', ghost: '#FFFFFF', dragon: '#FFFFFF',
  dark: '#FFFFFF', steel: '#173A63', fairy: '#173A63'
};
const STAT_NAMES = {
  hp: 'HP', attack: 'ATTACK', defense: 'DEFENSE',
  'special-attack': 'SP. ATK', 'special-defense': 'SP. DEF', speed: 'SPEED'
};
const REGIONS = {
  'generation-i': 'Kanto', 'generation-ii': 'Johto', 'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh', 'generation-v': 'Unova', 'generation-vi': 'Kalos',
  'generation-vii': 'Alola', 'generation-viii': 'Galar', 'generation-ix': 'Paldea'
};

/* ---------- type icons (inline SVG, white on type color) ---------- */
const TYPE_ICONS = {
  normal: '<circle cx="12" cy="12" r="6.5" fill="#fff"/>',
  fire: '<path fill="#fff" d="M12.6 3.2c.5 2.8-2 4.2-2 7a3.6 3.6 0 0 0 7.2.2c0-1.7-1-2.7-.7-4.4 1.9 1.2 3 3.3 3 5.4a7.3 7.3 0 1 1-14.6 0c0-4.4 4.6-5.9 7.1-8.2Z"/>',
  water: '<path fill="#fff" d="M12 3.5c2.8 3.6 5.8 6.2 5.8 9.7a5.8 5.8 0 1 1-11.6 0C6.2 9.7 9.2 7.1 12 3.5Z"/>',
  electric: '<path fill="#fff" d="M13.2 2.8 6.5 13h4.2l-1 8.2 7.8-11.4h-4.4l.1-7Z"/>',
  grass: '<path fill="#fff" d="M5.2 19.2C5.2 10 12 5.4 20 5.4c0 7.4-4.8 13.8-14.8 13.8Z"/><path d="M7 18.4C9.8 13 13 9.8 16.8 7.6" stroke="var(--tc)" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  ice: '<path stroke="#fff" stroke-width="2" stroke-linecap="round" d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  fighting: '<path fill="#fff" d="M7 8.2V6.4a1.6 1.6 0 0 1 3.2 0v1.2h1V5.2a1.6 1.6 0 0 1 3.2 0v2.4h1V6.4a1.6 1.6 0 0 1 3.2 0v4.3c0 3.9-3 7.1-6.9 7.1-3.6 0-6.3-2.6-6.7-6L5 10.4a1.5 1.5 0 0 1 2-2.2Z"/>',
  poison: '<circle cx="12" cy="14" r="5.6" fill="#fff"/><circle cx="8.2" cy="7.6" r="2.7" fill="#fff"/><circle cx="15.8" cy="7.2" r="3.2" fill="#fff"/>',
  ground: '<path fill="#fff" d="M4 18.5h16v-1.6a7 7 0 0 0-6.6-7l-1 .1a7 7 0 0 0-8.4 6.9v.6Z"/><path d="M9 14.8h4.6M11 12l-1.6-1.4" stroke="var(--tc)" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  flying: '<path fill="#fff" d="M3 15.2c5.6-.6 8.8-3.2 10.6-8.4 3 .8 5.9 3.3 7.4 7-3.4-1.4-5.3-1.5-6.6-.5-2 1.7-5.7 2.7-11.4 1.9Z"/>',
  psychic: '<path fill="#fff" d="M12 6c4.6 0 8.2 3.2 9.4 6-1.2 2.8-4.8 6-9.4 6s-8.2-3.2-9.4-6C3.8 9.2 7.4 6 12 6Zm0 3.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z"/>',
  bug: '<ellipse cx="12" cy="13.4" rx="4.2" ry="6" fill="#fff"/><path d="M9.2 8.6C7.6 6.2 7.4 5 6.4 3.6M14.8 8.6c1.6-2.4 1.8-3.6 2.8-5M6.6 12.4l-3 .8M17.4 12.4l3 .8M7 16.8l-2.4 2M17 16.8l2.4 2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  rock: '<path fill="#fff" d="m6.4 9 3.8-3.8h4.9L19 8.8l-1.1 7.1-5.3 3.1-5.3-3.1Z"/>',
  ghost: '<path fill="#fff" d="M7 12.2a5 5 0 0 1 10 0v7l-1.9-1.5-1.8 1.5-1.6-1.5-1.8 1.5-1.9-1.5v-6.5Z"/><circle cx="10" cy="12" r="1.4" fill="var(--tc)"/><circle cx="14.2" cy="12" r="1.4" fill="var(--tc)"/>',
  dragon: '<path fill="#fff" d="M6.4 18.6c-2.1-5.6 1.2-12 8-12 3.9 0 6.3 2.1 6.3 5-1.5-.6-2.7-.7-3.7 0 2 .9 3.1 2.9 2.3 6-3.3 2.7-9.5 3.2-12.9 1Z"/>',
  dark: '<path fill="#fff" d="M20 13.6A8.2 8.2 0 1 1 10.8 4a6.8 6.8 0 0 0 9.2 9.6Z"/>',
  steel: '<path fill="#fff" d="m12 3 7.6 4.4v8.8L12 20.6l-7.6-4.4V7.4L12 3Zm0 4.6-3.4 2v3.8l3.4 2 3.4-2V9.6l-3.4-2Z"/>',
  fairy: '<path fill="#fff" d="m12 3 2 4.4 4.8.5-3.6 3.2 1 4.7L12 13.4l-4.2 2.4 1-4.7-3.6-3.2 4.8-.5L12 3Z"/>'
};
function typeIcon(t) {
  const c = TYPE_COLORS[t] || '#888';
  return `<span class="type-ico" style="--tc:${c}"><svg viewBox="0 0 24 24" aria-hidden="true">${TYPE_ICONS[t] || TYPE_ICONS.normal}</svg></span>`;
}

// Shared type badge for both Pokémon types and move types
function typeBadge(t, opts = {}) {
  if (!t) return '<span class="type-badge type-badge--unknown">—</span>';
  const c = TYPE_COLORS[t] || '#888';
  const textColor = TYPE_TEXT_COLORS[t] || '#173A63';
  const label = cap(t);
  const icon = opts.icon ? typeIcon(t) : '';
  const sizeClass = opts.size ? `type-badge--${opts.size}` : '';
  return `<span class="type-badge ${sizeClass}" style="--type-color:${c};--type-text:${textColor}">${icon}${label}</span>`;
}

/* ---------- type matchup calculation ---------- */
const typeDamageCache = new Map();
const typeDamagePending = new Map();

function loadTypeDamageRelations(typeName) {
  const type = String(typeName || '').trim().toLowerCase();
  if (!TYPE_COLORS[type]) return Promise.reject(new Error(`Unknown type: ${typeName}`));
  if (typeDamageCache.has(type)) return Promise.resolve(typeDamageCache.get(type));
  if (typeDamagePending.has(type)) return typeDamagePending.get(type);

  const request = (async () => {
    const t = await fetchJSON(API + 'type/' + encodeURIComponent(type));
    const relations = t.damage_relations || {};
    const names = key => Array.isArray(relations[key]) ? relations[key].map(x => x.name) : [];
    const rel = {
      doubleDamageFrom: names('double_damage_from'),
      halfDamageFrom: names('half_damage_from'),
      noDamageFrom: names('no_damage_from')
    };
    typeDamageCache.set(type, rel);
    return rel;
  })();

  typeDamagePending.set(type, request);
  request.then(
    () => typeDamagePending.delete(type),
    () => typeDamagePending.delete(type)
  );
  return request;
}

function calculateTypeMatchup(types) {
  const pokemonTypes = normalizeTypeList(types);
  const allTypes = Object.keys(TYPE_COLORS);
  const result = { 4: [], 2: [], 0.5: [], 0.25: [], 0: [], 1: [] };
  
  for (const targetType of allTypes) {
    let multiplier = 1;
    for (const pokemonType of pokemonTypes) {
      const rel = typeDamageCache.get(pokemonType);
      if (!rel) continue;
      if (rel.doubleDamageFrom.includes(targetType)) multiplier *= 2;
      else if (rel.halfDamageFrom.includes(targetType)) multiplier *= 0.5;
      else if (rel.noDamageFrom.includes(targetType)) multiplier = 0;
    }
    if (multiplier === 4) result[4].push(targetType);
    else if (multiplier === 2) result[2].push(targetType);
    else if (multiplier === 0.25) result[0.25].push(targetType);
    else if (multiplier === 0.5) result[0.5].push(targetType);
    else if (multiplier === 0) result[0].push(targetType);
    else result[1].push(targetType);
  }
  return result;
}

function hasTypeMatchupData(types) {
  const typeList = normalizeTypeList(types);
  return typeList.length > 0 && typeList.every(type => typeDamageCache.has(type));
}

function renderTypeMatchup(types) {
  const matchup = calculateTypeMatchup(types);
  const sections = [
    { mult: 4, label: '4× Weak', color: '#b42318', arrow: '↓', direction: 'down', types: matchup[4] },
    { mult: 2, label: '2× Weak', color: '#b54708', arrow: '↓', direction: 'down', types: matchup[2] },
    { mult: 0.25, label: '¼× Resist', color: '#287a3d', arrow: '↑', direction: 'up', types: matchup[0.25] },
    { mult: 0.5, label: '½× Resist', color: '#3f6212', arrow: '↑', direction: 'up', types: matchup[0.5] },
    { mult: 0, label: 'Immune', color: '#5b3fb0', types: matchup[0] },
  ];
  
  return sections.filter(s => s.types.length > 0).map(s => `
    <div class="type-matchup-row">
      ${s.arrow ? `<span class="type-matchup-direction type-matchup-direction--${s.direction}" aria-hidden="true">${s.arrow}</span>` : ''}
      <span class="type-matchup-label" style="color:${s.color}">${s.label}</span>
      <span class="type-matchup-types">${s.types.map(t => typeBadge(t, { size: 'xs' })).join('')}</span>
    </div>
  `).join('');
}

/* ---------- ability details (lazy, in-memory) ---------- */
const abilityCache = new Map();
const abilityPending = new Map();

function loadAbilityDetail(abilityName) {
  if (abilityCache.has(abilityName)) return Promise.resolve(abilityCache.get(abilityName));
  if (abilityPending.has(abilityName)) return abilityPending.get(abilityName);
  const request = fetchJSON(API + 'ability/' + encodeURIComponent(abilityName)).then(a => {
    const fx = (a.effect_entries || []).find(e => e.language.name === 'en');
    const flavor = (a.flavor_text_entries || []).find(e => e.language.name === 'en');
    const d = {
      name: a.name,
      shortEffect: fx ? cleanFx(fx.short_effect) : '',
      fullEffect: fx ? cleanFx(fx.effect) : '',
      flavorText: flavor ? cleanFx(flavor.flavor_text) : '',
      generation: a.generation?.name || '',
      isMainSeries: a.is_main_series,
    };
    abilityCache.set(abilityName, d);
    return d;
  });
  abilityPending.set(abilityName, request);
  request.then(() => abilityPending.delete(abilityName), () => abilityPending.delete(abilityName));
  return request;
}
 
function typeMatchupLoadingHtml() {
  return '<p class="type-matchup-loading" role="status"><span class="type-matchup-spinner" aria-hidden="true"></span>Loading type matchup…</p>';
}

function typeMatchupErrorHtml() {
  return '<div class="type-matchup-error" role="alert"><p>Type matchup unavailable.</p><button type="button" class="type-matchup-retry" data-act="retry-type-matchup">Retry</button></div>';
}

async function loadTypeMatchupForCurrent(entry = cur) {
  if (!entry || !entry.p) return;

  const types = normalizeTypeList(entry.p.types);
  const grid = $('.type-matchup-grid');
  if (!grid || !types.length) return;

  grid.setAttribute('aria-busy', 'true');
  if (hasTypeMatchupData(types)) {
    grid.innerHTML = renderTypeMatchup(types);
    grid.setAttribute('aria-busy', 'false');
    return;
  }

  grid.innerHTML = typeMatchupLoadingHtml();
  const results = await Promise.allSettled(types.map(type => loadTypeDamageRelations(type)));

  // A newer search may have replaced this page while the requests were running.
  if (cur !== entry) return;
  const currentGrid = $('.type-matchup-grid');
  if (!currentGrid) return;
  currentGrid.setAttribute('aria-busy', 'false');

  if (results.some(result => result.status === 'rejected') || !hasTypeMatchupData(types)) {
    currentGrid.innerHTML = typeMatchupErrorHtml();
    return;
  }

  currentGrid.innerHTML = renderTypeMatchup(types);
}

async function loadAbilitiesForCurrent() {
  if (!cur) return;
  const cards = $$('.ability-card');
  for (const card of cards) {
    const url = card.dataset.url;
    const name = card.dataset.ability;
    const body = $('.ability-body', card);
    if (!url || !body) {
      if (body) body.innerHTML = '<p class="ability-effect">Ability details unavailable.</p>';
      continue;
    }
    try {
      const detail = await loadAbilityDetail(name);
      const shortEffect = detail.shortEffect || '';
      const fullEffect = detail.fullEffect && detail.fullEffect !== shortEffect ? detail.fullEffect : '';
      body.innerHTML = `
        <p class="ability-effect">${shortEffect || detail.flavorText || 'No description available.'}</p>
        ${fullEffect ? `<p class="ability-full">${fullEffect}</p>` : ''}
        ${detail.generation ? `<p class="ability-gen">Generation ${detail.generation.split('-')[1].toUpperCase()}</p>` : ''}
      `;
    } catch {
      body.innerHTML = '<p class="ability-effect">Failed to load ability details.</p>';
    }
  }
}
 
/* ---------- type atmosphere ---------- */
/* Each scene is deliberately small, decorative, and built from inline SVG so it
   never adds another network request. The first two API types become layers. */
const TYPE_ATMOSPHERE_MOTIFS = {
  normal: `<g class="atmos-normal-motif">
    <path class="atmos-dust-cloud" d="M45 412c82-55 156-28 224-58 83-37 154-12 230 23 65 30 142 27 256-18v141H45Z" fill="currentColor" fill-opacity=".08"/>
    <circle class="atmos-float" cx="118" cy="154" r="6" fill="currentColor"/><circle class="atmos-float" cx="278" cy="92" r="3" fill="currentColor"/><circle class="atmos-float" cx="548" cy="176" r="5" fill="currentColor"/><circle class="atmos-float" cx="692" cy="96" r="3" fill="currentColor"/>
    <path class="atmos-pebble" d="m170 356 24-12 22 15-17 20-25-5Z" fill="currentColor" fill-opacity=".34"/><path class="atmos-pebble" d="m605 320 19-10 18 12-12 17-21-3Z" fill="currentColor" fill-opacity=".28"/>
  </g>`,
  fire: `<g class="atmos-fire-motif">
    <path class="atmos-flame" d="M116 430c-35-56 14-91 34-135 10 35 35 43 25 78 29-28 30-62 21-101 64 48 94 99 71 158Z" fill="currentColor" fill-opacity=".42"/>
    <path class="atmos-flame-inner" d="M178 430c-19-35 14-57 28-86 6 20 18 29 15 48 15-16 19-31 16-49 28 28 42 57 28 87Z" fill="#fff" fill-opacity=".24"/>
    <path class="atmos-flame" d="M552 438c-25-38 10-69 28-99 8 25 24 32 19 57 22-21 26-47 20-72 45 35 61 74 43 114Z" fill="currentColor" fill-opacity=".25"/>
    <circle class="atmos-ember" cx="350" cy="154" r="5" fill="#fff"/><circle class="atmos-ember" cx="405" cy="238" r="3" fill="currentColor"/><circle class="atmos-ember" cx="464" cy="108" r="4" fill="#fff"/><circle class="atmos-ember" cx="650" cy="198" r="3" fill="currentColor"/>
  </g>`,
  water: `<g class="atmos-water-motif">
    <path class="atmos-wave" d="M-40 338c92-54 151 43 247-4 97-48 147 48 246 1 101-49 153 37 258-8 58-25 104-19 139 0" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
    <path class="atmos-wave" d="M-50 410c91-46 151 35 245-7 94-42 157 42 249 1 95-43 157 35 253-10 62-29 105-17 143 4" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <circle class="atmos-bubble" cx="134" cy="202" r="22" fill="none" stroke="currentColor" stroke-width="5"/><circle class="atmos-bubble" cx="218" cy="112" r="10" fill="none" stroke="currentColor" stroke-width="4"/><circle class="atmos-bubble" cx="562" cy="178" r="28" fill="none" stroke="currentColor" stroke-width="5"/><circle class="atmos-bubble" cx="682" cy="282" r="13" fill="none" stroke="currentColor" stroke-width="4"/>
    <path class="atmos-droplet" d="M410 118c0 22-25 39-25 61a25 25 0 0 0 50 0c0-22-25-39-25-61Z" fill="currentColor" fill-opacity=".34"/>
  </g>`,
  electric: `<g class="atmos-electric-motif">
    <path class="atmos-bolt" d="m180 38-78 172h62l-35 181 142-238h-70l49-115Z" fill="currentColor" fill-opacity=".58"/>
    <path class="atmos-bolt" d="m604 92-54 116h44l-25 124 103-165h-50l32-75Z" fill="currentColor" fill-opacity=".32"/>
    <path class="atmos-circuit" d="M64 278h88l36-42h92M500 354h104l42 42h54" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="atmos-spark" cx="92" cy="96" r="6" fill="#fff"/><circle class="atmos-spark" cx="354" cy="92" r="4" fill="currentColor"/><circle class="atmos-spark" cx="474" cy="210" r="5" fill="#fff"/><circle class="atmos-spark" cx="722" cy="168" r="4" fill="currentColor"/>
  </g>`,
  grass: `<g class="atmos-grass-motif">
    <path class="atmos-vine" d="M92 472c22-125 5-206 74-304 35-49 71-71 119-104M192 472c-4-94 31-153 91-204 42-36 83-53 130-59M580 472c-13-100-2-170 42-246 24-42 52-73 91-99" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    <path class="atmos-leaf" d="M144 244c-44-28-62-8-73 22 35 17 61 7 73-22ZM274 274c-28-43-58-39-78-15 25 32 52 37 78 15ZM652 290c33-35 62-30 76-2-25 28-52 28-76 2Z" fill="currentColor" fill-opacity=".62"/>
    <circle class="atmos-pollen" cx="126" cy="116" r="5" fill="#fff"/><circle class="atmos-pollen" cx="356" cy="146" r="4" fill="currentColor"/><circle class="atmos-pollen" cx="518" cy="92" r="6" fill="#fff"/><circle class="atmos-pollen" cx="708" cy="350" r="4" fill="currentColor"/>
  </g>`,
  ice: `<g class="atmos-ice-motif">
    <g class="atmos-snowflake" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M142 74v122M86 108l112 54M86 162l112-54M142 98l-22-22M142 98l22-22M142 172l-22 22M142 172l22 22"/><path d="M620 112v96M578 140l84 40M578 180l84-40"/></g>
    <path class="atmos-shard" d="m350 62 25 52-25 42-25-42Z" fill="currentColor" fill-opacity=".42"/><path class="atmos-shard" d="m512 300 20 42-20 34-20-34Z" fill="#fff" fill-opacity=".28"/>
    <circle class="atmos-frost" cx="92" cy="316" r="6" fill="#fff"/><circle class="atmos-frost" cx="278" cy="222" r="4" fill="currentColor"/><circle class="atmos-frost" cx="448" cy="132" r="5" fill="#fff"/><circle class="atmos-frost" cx="708" cy="270" r="4" fill="currentColor"/>
  </g>`,
  fighting: `<g class="atmos-fighting-motif">
    <ellipse class="atmos-impact" cx="314" cy="252" rx="188" ry="104" fill="none" stroke="currentColor" stroke-width="9"/>
    <ellipse class="atmos-impact" cx="314" cy="252" rx="116" ry="64" fill="none" stroke="currentColor" stroke-width="4"/>
    <path class="atmos-speed-line" d="M42 176h174M58 218h122M584 306h166M610 348h112" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    <circle class="atmos-kick-dust" cx="174" cy="344" r="8" fill="currentColor"/><circle class="atmos-kick-dust" cx="210" cy="376" r="4" fill="#fff"/><circle class="atmos-kick-dust" cx="490" cy="168" r="7" fill="currentColor"/><circle class="atmos-kick-dust" cx="538" cy="138" r="4" fill="#fff"/>
  </g>`,
  poison: `<g class="atmos-poison-motif">
    <circle class="atmos-bubble" cx="142" cy="304" r="34" fill="none" stroke="currentColor" stroke-width="6"/><circle class="atmos-bubble" cx="210" cy="186" r="18" fill="none" stroke="currentColor" stroke-width="5"/><circle class="atmos-bubble" cx="604" cy="248" r="44" fill="none" stroke="currentColor" stroke-width="6"/><circle class="atmos-bubble" cx="698" cy="130" r="17" fill="none" stroke="currentColor" stroke-width="4"/>
    <path class="atmos-drip" d="M326 82c0 26-22 42-22 64a22 22 0 0 0 44 0c0-22-22-38-22-64Z" fill="currentColor" fill-opacity=".44"/><path class="atmos-drip" d="M468 258c0 18-15 29-15 44a15 15 0 0 0 30 0c0-15-15-26-15-44Z" fill="#fff" fill-opacity=".25"/>
    <circle class="atmos-spore" cx="78" cy="118" r="6" fill="#fff"/><circle class="atmos-spore" cx="392" cy="388" r="5" fill="currentColor"/><circle class="atmos-spore" cx="560" cy="92" r="7" fill="#fff"/>
  </g>`,
  ground: `<g class="atmos-ground-motif">
    <path class="atmos-boulder" d="m68 420 42-108 90-36 76 75-23 101H68Z" fill="currentColor" fill-opacity=".34"/><path class="atmos-boulder" d="m518 430 34-92 83-30 89 65-20 91H518Z" fill="currentColor" fill-opacity=".28"/>
    <path class="atmos-crack" d="m214 470 34-82 44-18 31 46 48 12 32 42M572 470l-25-67 35-37 52 10 31 41 52 9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="atmos-dust" cx="126" cy="202" r="8" fill="currentColor"/><circle class="atmos-dust" cx="310" cy="174" r="5" fill="#fff"/><circle class="atmos-dust" cx="466" cy="258" r="7" fill="currentColor"/><circle class="atmos-dust" cx="718" cy="210" r="5" fill="#fff"/>
  </g>`,
  flying: `<g class="atmos-flying-motif">
    <path class="atmos-feather" d="M112 212c48 12 91-6 122-49-10 48-39 83-91 94-25 5-37-15-31-45Z" fill="currentColor" fill-opacity=".45"/><path class="atmos-feather" d="M520 334c51-7 85-37 105-83 5 51-19 91-70 112-25 10-42-4-35-29Z" fill="currentColor" fill-opacity=".32"/>
    <path class="atmos-wind" d="M42 126c116 34 176-24 267 12 86 34 136-17 208 9 85 30 142-9 238 15M68 422c91-29 152 18 231-8 86-28 146 22 225-4 78-26 129 9 207-5" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
    <path class="atmos-cloud" d="M566 86c15-32 67-35 83-3 33-7 52 33 26 51H548c-24-12-18-37 18-48Z" fill="#fff" fill-opacity=".18"/>
  </g>`,
  psychic: `<g class="atmos-psychic-motif">
    <ellipse class="atmos-orbit" cx="312" cy="244" rx="190" ry="78" fill="none" stroke="currentColor" stroke-width="6"/><ellipse class="atmos-orbit" cx="312" cy="244" rx="120" ry="190" fill="none" stroke="currentColor" stroke-width="4"/>
    <path class="atmos-star" d="m312 102 18 48 50 2-39 29 14 48-43-31-43 31 14-48-39-29 50-2Z" fill="currentColor" fill-opacity=".48"/><path class="atmos-star" d="m620 276 11 29 31 1-24 18 8 30-26-20-26 20 8-30-24-18 31-1Z" fill="#fff" fill-opacity=".34"/>
    <path class="atmos-crystal" d="m126 330 27-58 28 58-28 38Z" fill="currentColor" fill-opacity=".28"/>
  </g>`,
  bug: `<g class="atmos-bug-motif">
    <path class="atmos-wing" d="M306 250c-86-99-165-69-174-12 62 3 119 27 174 12ZM306 250c86-99 165-69 174-12-62 3-119 27-174 12Z" fill="currentColor" fill-opacity=".3"/>
    <path class="atmos-bug-line" d="M306 250V94M306 250 222 330M306 250l84 80" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>
    <path class="atmos-leaf" d="M106 126c42-32 75-18 87 14-38 21-70 13-87-14ZM526 108c43-27 75-10 84 22-39 17-70 7-84-22Z" fill="currentColor" fill-opacity=".5"/>
    <circle class="atmos-pollen" cx="98" cy="348" r="6" fill="#fff"/><circle class="atmos-pollen" cx="454" cy="106" r="5" fill="#fff"/><circle class="atmos-pollen" cx="682" cy="334" r="7" fill="currentColor"/>
  </g>`,
  rock: `<g class="atmos-rock-motif">
    <path class="atmos-stone" d="m72 412 54-128 108-42 88 86-32 116H72Z" fill="currentColor" fill-opacity=".38"/><path class="atmos-stone" d="m492 426 44-104 84-34 92 68-28 102H492Z" fill="currentColor" fill-opacity=".3"/>
    <path class="atmos-strata" d="m130 326 86-34 58 42 82-18M520 352l64-38 74 34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <path class="atmos-chip" d="m344 98 21 19-15 26-25-17Z" fill="#fff" fill-opacity=".34"/><path class="atmos-chip" d="m674 214 16 14-12 21-19-13Z" fill="currentColor" fill-opacity=".48"/>
  </g>`,
  ghost: `<g class="atmos-ghost-motif">
    <path class="atmos-ghost-shape" d="M166 414V224c0-75 50-126 112-126s112 51 112 126v190l-39-31-36 31-37-31-37 31-36-31Z" fill="currentColor" fill-opacity=".2"/>
    <path class="atmos-wisp" d="M92 364c42-54 41-111 4-157 68 35 86 101 39 157-16 19-28 19-43 0ZM602 116c-37 36-38 77-7 111 26 29 44 24 53 0 12-33-5-76-46-111Z" fill="currentColor" fill-opacity=".36"/>
    <circle class="atmos-shadow" cx="244" cy="224" r="7" fill="#fff"/><circle class="atmos-shadow" cx="316" cy="224" r="7" fill="#fff"/><circle class="atmos-shadow" cx="540" cy="350" r="5" fill="currentColor"/>
  </g>`,
  dragon: `<g class="atmos-dragon-motif">
    <path class="atmos-scale" d="m112 144 42-24 42 24-42 24Zm144 58 42-24 42 24-42 24Zm142-68 42-24 42 24-42 24Zm-116 168 42-24 42 24-42 24Z" fill="currentColor" fill-opacity=".42"/>
    <path class="atmos-dragon-ribbon" d="M70 388c105-106 181-33 266-112 83-77 155 34 232-55 48-56 100-54 162-26" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round"/>
    <path class="atmos-crystal" d="m620 82 30 65-30 42-30-42Z" fill="#fff" fill-opacity=".28"/><path class="atmos-crystal" d="m420 306 22 46-22 31-22-31Z" fill="currentColor" fill-opacity=".34"/>
  </g>`,
  dark: `<g class="atmos-dark-motif">
    <path class="atmos-tendril" d="M76 438c72-86 54-154 126-204 58-40 96-13 110 38 18 66-38 96-5 151 22 36 67 31 108 2 48-34 84-25 131 9" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/>
    <path class="atmos-dark-shard" d="m180 94 32 58-32 42-32-42Zm430 140 27 49-27 37-27-37Z" fill="currentColor" fill-opacity=".4"/>
    <path class="atmos-mist" d="M42 352c105-45 169 25 260-11 90-35 146 33 225-7 75-38 144 17 231-18v106H42Z" fill="#fff" fill-opacity=".08"/>
  </g>`,
  steel: `<g class="atmos-steel-motif">
    <path class="atmos-plate" d="m78 140 92-48 84 48-84 48Zm286 180 90-47 83 47-83 48Z" fill="currentColor" fill-opacity=".34"/>
    <path class="atmos-circuit" d="M78 140v148l92 48 84-48V188M452 372v92l90 48 83-48v-95" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
    <circle class="atmos-glint" cx="282" cy="86" r="8" fill="#fff"/><circle class="atmos-glint" cx="596" cy="198" r="6" fill="#fff"/><path class="atmos-glint" d="m320 278 48-48M320 230l48 48" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
  </g>`,
  fairy: `<g class="atmos-fairy-motif">
    <path class="atmos-petal" d="M152 154c-46-16-61-53-40-82 39 9 59 37 40 82ZM330 98c-3-50 26-78 59-70 17 40-2 67-59 70ZM588 176c42-30 78-12 90 22-34 28-66 19-90-22Z" fill="currentColor" fill-opacity=".55"/>
    <path class="atmos-ribbon" d="M68 368c118-106 186 50 280-40 91-88 161 32 238-56 46-52 91-51 146-18" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    <path class="atmos-sparkle" d="m250 272 12 31 32 3-25 19 9 31-28-19-28 19 9-31-25-19 32-3Z" fill="#fff" fill-opacity=".4"/><path class="atmos-sparkle" d="m684 320 8 20 21 2-16 12 6 20-19-13-19 13 6-20-16-12 21-2Z" fill="currentColor" fill-opacity=".5"/>
  </g>`
};

function atmosphereSvg(type) {
  const motif = TYPE_ATMOSPHERE_MOTIFS[type] || TYPE_ATMOSPHERE_MOTIFS.normal;
  return `<svg class="atmos-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${motif}</svg>`;
}

function normalizeTypeList(types) {
  return [...new Set((Array.isArray(types) ? types : [])
    .map(type => String(type).trim().toLowerCase())
    .filter(type => TYPE_COLORS[type]))].slice(0, 2);
}

function populateTypeAtmosphere(types) {
  const container = $('.hero-atmosphere');
  if (!container) return;

  const typeList = normalizeTypeList(types);
  const atmosphereTypes = typeList.length ? typeList : ['normal'];

  container.dataset.types = atmosphereTypes.join(',');
  container.replaceChildren(...atmosphereTypes.map((type, index) => {
    const layer = document.createElement('div');
    layer.classList.add('atmos-layer', `atmos-${index === 0 ? 'primary' : 'secondary'}`, `atmos-${type}`);
    layer.dataset.type = type;
    layer.style.setProperty('--atmos-color', TYPE_COLORS[type]);
    layer.innerHTML = atmosphereSvg(type);
    return layer;
  }));
}

function galleryAtmosphereHtml(types) {
  const typeList = normalizeTypeList(types);
  const atmosphereTypes = typeList.length ? typeList : ['normal'];
  return atmosphereTypes.map((type, index) => {
    const role = index === 0 ? 'primary' : 'secondary';
    return `<div class="gallery-card-atmos gallery-card-atmos--${role} atmos-${type}" data-type="${type}" style="--card-type-color:${TYPE_COLORS[type]};--atmos-color:${TYPE_COLORS[type]}">${atmosphereSvg(type)}</div>`;
  }).join('');
}
 
/* ---------- cry playback ---------- */
let currentCryAudio = null;
function setCryButtonState(btn, playing) {
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(playing));
  const baseLabel = btn.dataset.cryLabel || btn.getAttribute('aria-label') || 'Play Pokémon cry';
  if (baseLabel) btn.setAttribute('aria-label', playing ? baseLabel.replace(/^Play /, 'Stop ') : baseLabel);
}
function stopCry() {
  if (currentCryAudio) {
    currentCryAudio.pause();
    currentCryAudio.currentTime = 0;
    currentCryAudio = null;
  }
  $$('.cry-btn').forEach(btn => setCryButtonState(btn, false));
}
function setupCryButton() {
  const btn = $('.cry-btn');
  if (!btn) return;
  const url = btn.dataset.cry;
  if (!url) { btn.hidden = true; return; }
  if (!btn.dataset.cryLabel) btn.dataset.cryLabel = btn.getAttribute('aria-label') || 'Play Pokémon cry';
  if (btn.dataset.cryBound === 'true') return;
  btn.dataset.cryBound = 'true';

  btn.addEventListener('click', () => {
    const playing = btn.getAttribute('aria-pressed') === 'true';
    if (playing) {
      stopCry();
      return;
    }

    stopCry();
    const audio = new Audio(url);
    audio.volume = 0.6;
    currentCryAudio = audio;
    setCryButtonState(btn, true);
    audio.addEventListener('ended', () => {
      if (currentCryAudio === audio) currentCryAudio = null;
      setCryButtonState(btn, false);
    });
    audio.addEventListener('error', () => {
      if (currentCryAudio === audio) currentCryAudio = null;
      setCryButtonState(btn, false);
    });
    audio.play().catch(() => {
      if (currentCryAudio === audio) currentCryAudio = null;
      setCryButtonState(btn, false);
    });
  });
}

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cap = s => String(s).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const roman = s => String(s).split('-')[1].toUpperCase();
const ROMAN_VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function romanNumber(value) {
  const text = String(value || '').toUpperCase();
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const current = ROMAN_VALUES[text[i]] || 0;
    const next = ROMAN_VALUES[text[i + 1]] || 0;
    total += current < next ? -current : current;
  }
  return total;
}
const lastId = url => +url.split('/').filter(Boolean).pop();
const cleanFx = s => String(s || '').replace(/\s+/g, ' ').replace(/\$\w+%?/g, '').trim();
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function cleanFlavorText(value) {
  return String(value || '')
    .replace(/\$[^$]+\$/g, '')
    .replace(/\\[nfr]/g, ' ')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function chooseSpeciesDescription(species) {
  const entries = Array.isArray(species.flavor_text_entries) ? species.flavor_text_entries : [];
  const english = entries
    .filter(entry => entry && entry.language && entry.language.name === 'en')
    .map(entry => cleanFlavorText(entry.flavor_text))
    .filter(Boolean);
  if (!english.length) return '';
  let text = english.find(value => value.length >= 40) || english[0];
  if (text.length <= 260) return text;
  const sentence = text.slice(0, 261).match(/^[\s\S]*[.!?](?:\s|$)/);
  if (sentence && sentence[0].length <= 260) return sentence[0].trim();
  return `${text.slice(0, 260).replace(/\s+\S*$/, '')}…`;
}

let cur = null;        // currently displayed cache entry
let shiny = false;
let randomMode = false;
let token = 0;         // guards against out-of-order async results
let searchController = null;
let galleryGeneration = 0;
const view = $('#view');

/* ---------- storage (never throws) ---------- */
function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v && typeof v === 'object' && Array.isArray(v) === Array.isArray(fallback) ? v : fallback;
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable or full */ }
}
function cleanupOldPokemonCaches() {
  try {
    Object.keys(localStorage)
      .filter(key => /^pokedexCacheV\d+$/.test(key) && key !== CACHE_KEY)
      .forEach(key => localStorage.removeItem(key));
  } catch { /* storage unavailable */ }
}

/* ---------- cache ---------- */
function getCachedPokemon(q) {
  const c = load(CACHE_KEY, {});
  const id = /^\d+$/.test(q) ? q : (c.__names || {})[q];
  const e = id && c[id];
  if (!e) return null;
  // Validate required fields + abilities must be objects with name/url
  if (e.p && e.p.id && e.s && e.evo && e.p.art && e.p.stats &&
      Array.isArray(e.p.types) && e.p.types.length && e.p.types.every(t => TYPE_COLORS[t]) &&
      Array.isArray(e.p.moves) && Array.isArray(e.p.abilities) &&
      e.p.abilities.every(a => a && typeof a === 'object' && a.name && a.url)) {
    pokemonDataCache.set(String(e.p.id), e.p);
    pokemonDataCache.set(e.p.name, e.p);
    return e;
  }
  delete c[id];                        // malformed entry: drop it
  save(CACHE_KEY, c);
  return null;
}
function cachePokemon(e) {
  const c = load(CACHE_KEY, {});
  c.__names = c.__names && typeof c.__names === 'object' ? c.__names : {};
  c.__names[e.p.name] = e.p.id;
  c[e.p.id] = e;

  const ids = Object.keys(c)
    .filter(key => /^\d+$/.test(key) && String(e.p.id) !== key)
    .sort((a, b) => (c[a].t || 0) - (c[b].t || 0));
  while (ids.length >= MAX_CACHED_POKEMON) {
    const oldId = ids.shift();
    const old = c[oldId];
    if (old && old.p && c.__names[old.p.name] === Number(oldId)) delete c.__names[old.p.name];
    delete c[oldId];
  }

  save(CACHE_KEY, c);
}

/* ---------- API / data ---------- */
const REQUEST_TIMEOUT = 12000;
async function fetchJSON(url, { signal, timeout = REQUEST_TIMEOUT } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortFromCaller, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) {
      const err = new Error(`HTTP ${r.status}`);
      err.status = r.status;
      throw err;
    }
    return await r.json();
  } catch (err) {
    if (timedOut) {
      const timeoutError = new Error('Request timed out');
      timeoutError.status = 0;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', abortFromCaller);
  }
}
const getPokemon = (identifier, options) => fetchJSON(API + 'pokemon/' + encodeURIComponent(identifier), options);
const getPokemonSpecies = (url, options) => fetchJSON(url, options);
const getEvolutionChain = (url, options) => fetchJSON(url, options);
const getPokemon3DModel = (id, isShiny) => `${MODEL}${isShiny ? 'shiny' : 'regular'}/${id}.glb`;

function trimPokemon(p) {
  const gens = {};
  const versions = p.sprites.versions || {};
  for (const g in versions) {
    for (const game in versions[g]) {
      const s = versions[g][game];
      if (game === 'icons' || !s || !s.front_default) continue;
      gens[g] = { game, d: s.front_default, s: s.front_shiny || null };
      break;
    }
  }
  const o = p.sprites.other || {};
  const oa = o['official-artwork'] || {}, home = o.home || {};
  // skills: level-up moves with the earliest learned level
  const moves = p.moves
    .map(m => {
      const lv = m.version_group_details
        .filter(v => v.move_learn_method.name === 'level-up')
        .map(v => v.level_learned_at)
        .filter(l => Number.isFinite(l));
      return lv.length ? { name: m.move.name, url: m.move.url, level: Math.min(...lv), type: m.move.type?.name || null } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  
  // abilities with URLs for detailed fetching
  const abilities = p.abilities.map(a => ({
    name: cap(a.ability.name),
    url: a.ability.url,
    hidden: a.is_hidden,
    slot: a.slot
  }));
  
  return {
    id: p.id, name: p.name, sid: lastId(p.species.url), species: p.species.url,
    types: p.types.map(t => t.type.name), h: p.height, w: p.weight, xp: p.base_experience,
    abilities,
    stats: p.stats.map(s => [s.stat.name, s.base_stat]),
    moves,
    art: {
      n: oa.front_default, s: oa.front_shiny, hn: home.front_default, hs: home.front_shiny,
      sn: p.sprites.front_default, ss: p.sprites.front_shiny
    },
    gens,
    cries: p.cries // { latest, legacy }
  };
}
function trimSpecies(s) {
  const g = (s.genera || []).find(x => x.language.name === 'en');
  const ja = (s.names || []).find(x => x.language.name === 'ja-Hrkt')
          || (s.names || []).find(x => x.language.name === 'ja');
  return {
    genus: g && g.genus, gen: s.generation.name, cr: s.capture_rate, hp: s.base_happiness,
    gr: s.growth_rate && s.growth_rate.name, eggs: (s.egg_groups || []).map(e => cap(e.name)),
    hab: s.habitat && s.habitat.name, leg: s.is_legendary, myth: s.is_mythical,
    jname: ja && ja.name, region: REGIONS[s.generation.name] || cap(s.generation.name),
    description: chooseSpeciesDescription(s)
  };
}
function condText(d) {
  if (!d) return '';
  const p = [];
  if (d.min_level) p.push('Level ' + d.min_level);
  if (d.item) p.push(cap(d.item.name));
  if (d.trigger && d.trigger.name === 'trade') p.push('Trade');
  if (d.min_happiness) p.push('Friendship');
  if (d.min_affection) p.push('Affection');
  if (d.time_of_day) p.push(cap(d.time_of_day));
  if (d.known_move) p.push('Knows ' + cap(d.known_move.name));
  if (d.location) p.push(cap(d.location.name));
  if (d.held_item) p.push('Holding ' + cap(d.held_item.name));
  if (!p.length && d.trigger && d.trigger.name !== 'level-up') p.push(cap(d.trigger.name));
  return p.join(', ');
}
function walkChain(n) {
  return {
    id: lastId(n.species.url), name: n.species.name,
    cond: condText(n.evolution_details && n.evolution_details[0]),
    kids: n.evolves_to.map(walkChain)
  };
}
async function getTrimmedPokemon(identifier, options = {}) {
  const key = String(identifier).trim().toLowerCase();
  if (pokemonDataCache.has(key)) return pokemonDataCache.get(key);
  const raw = await getPokemon(identifier, options);
  const trimmed = trimPokemon(raw);
  pokemonDataCache.set(key, trimmed);
  pokemonDataCache.set(String(trimmed.id), trimmed);
  pokemonDataCache.set(trimmed.name, trimmed);
  return trimmed;
}

async function loadPokemon(q, options = {}) {
  const cached = getCachedPokemon(q);
  if (cached) return cached;
  const p = await getTrimmedPokemon(q, options);
  const s = await getPokemonSpecies(p.species, options);
  const chain = await getEvolutionChain(s.evolution_chain.url, options);
  const entry = { t: Date.now(), p, s: trimSpecies(s), evo: walkChain(chain.chain) };
  cachePokemon(entry);
  return entry;
}

async function loadGalleryPokemon(id, options = {}) {
  return { p: await getTrimmedPokemon(id, options) };
}

/* ---------- move details (lazy, in-memory) ---------- */
const moveCache = new Map();
const movePending = new Map();
const moveTypeCache = new Map();
const moveTypePending = new Map();
let moveTypeObserver = null;

function loadMove(url) {
  if (moveCache.has(url)) return Promise.resolve(moveCache.get(url));
  if (movePending.has(url)) return movePending.get(url);
  const request = fetchJSON(url).then(m => {
    const fx = (m.effect_entries || []).find(e => e.language.name === 'en');
    const d = {
      type: m.type && m.type.name,
      cls: m.damage_class && m.damage_class.name,
      power: m.power, acc: m.accuracy, pp: m.pp,
      effect: fx ? cleanFx(fx.short_effect) : ''
    };
    moveCache.set(url, d);
    if (d.type) moveTypeCache.set(url, d.type);
    return d;
  });
  movePending.set(url, request);
  request.then(() => movePending.delete(url), () => movePending.delete(url));
  return request;
}

function loadMoveType(url) {
  if (!url) return Promise.resolve(null);
  if (moveTypeCache.has(url)) return Promise.resolve(moveTypeCache.get(url));
  if (moveTypePending.has(url)) return moveTypePending.get(url);
  const request = fetchJSON(url).then(m => {
    const type = m.type && m.type.name;
    if (type) moveTypeCache.set(url, type);
    return type || null;
  });
  moveTypePending.set(url, request);
  request.then(() => moveTypePending.delete(url), () => moveTypePending.delete(url));
  return request;
}

function observeMoveTypes(root) {
  if (!root) return;
  const rows = $$('.move[data-murl]', root).filter(row => {
    const badge = $('.move-type', row);
    return badge && badge.textContent.trim() === '—';
  });
  if (!rows.length) return;
  if (!('IntersectionObserver' in window)) {
    rows.forEach(row => loadMoveType(row.dataset.murl).then(type => updateMoveTypeBadge(row.dataset.murl, type)).catch(() => {}));
    return;
  }
  if (!moveTypeObserver) {
    moveTypeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const url = entry.target.dataset.murl;
        moveTypeObserver.unobserve(entry.target);
        loadMoveType(url).then(type => updateMoveTypeBadge(url, type)).catch(() => {});
      });
    }, { rootMargin: '160px 0px', threshold: 0.01 });
  }
  rows.forEach(row => {
    row.dataset.moveTypeObserved = 'true';
    moveTypeObserver.observe(row);
  });
}

function resetMoveTypeObserver() {
  if (!moveTypeObserver) return;
  moveTypeObserver.disconnect();
  moveTypeObserver = null;
}

function getMoveType(url) {
  return moveTypeCache.get(url) || null;
}

/* ---------- search history ---------- */
function getHistory() {
  return load(HISTORY_KEY, []).filter(x => typeof x === 'string').slice(0, 5);
}
function updateSearchHistory(name) {
  save(HISTORY_KEY, [name, ...getHistory().filter(x => x !== name)].slice(0, 5));
  renderHistory();
}
function renderHistory() {
  const h = getHistory();
  $('#history').hidden = !h.length;
  $('#hint').hidden = h.length > 0;
  const chips = $('#chips');
  chips.innerHTML = '';
  h.forEach(n => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = cap(n); b.dataset.q = n;
    chips.append(b);
  });
}

/* ---------- suggestions ---------- */
let dexList = null;   // [{name, id}]
async function ensureDexList() {
  if (dexList) return dexList;
  const r = await fetchJSON(API + 'pokemon?limit=100000');
  dexList = r.results.map((x, i) => ({ name: x.name, id: i + 1 }));
  return dexList;
}
function findSuggestions(q) {
  const n = String(q).trim().toLowerCase().replace(/\s+/g, '-');
  if (!n || !dexList) return [];
  if (/^\d+$/.test(n)) {
    return dexList.filter(d => String(d.id).startsWith(n) && d.id <= MAX_DEX).slice(0, 8);
  }
  const starts = [], contains = [];
  for (const d of dexList) {
    if (d.name.startsWith(n)) starts.push(d);
    else if (d.name.includes(n)) contains.push(d);
  }
  return starts.concat(contains).slice(0, 8);
}
const sugBox = $('#suggest');
const input = $('#q');
let sugItems = [], sugActive = -1, sugTimer = 0;
function renderSuggestions() {
  sugItems = findSuggestions(input.value);
  sugActive = -1;
  if (!sugItems.length) { closeSuggestions(); return; }
  sugBox.innerHTML = sugItems.map((d, i) =>
    `<li role="option" id="sg${i}" data-q="${d.name}" aria-selected="false"><img loading="lazy" src="${SPR}${d.id}.png" alt=""><span class="sn">${cap(d.name)}</span><span class="sid">#${String(d.id).padStart(4, '0')}</span></li>`
  ).join('');
  sugBox.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}
function closeSuggestions() {
  sugBox.hidden = true;
  sugBox.innerHTML = '';
  sugItems = []; sugActive = -1;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}
function setActive(i) {
  sugActive = i;
  $$('li', sugBox).forEach((li, k) => {
    const active = k === i;
    li.classList.toggle('active', active);
    li.setAttribute('aria-selected', String(active));
  });
  if (i >= 0 && sugItems[i]) input.setAttribute('aria-activedescendant', `sg${i}`);
  else input.removeAttribute('aria-activedescendant');
}
input.addEventListener('input', () => {
  clearTimeout(sugTimer);
  sugTimer = setTimeout(renderSuggestions, 140);
});
input.addEventListener('keydown', e => {
  if (sugBox.hidden) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(sugItems.length - 1, sugActive + 1)); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, sugActive - 1)); }
  else if (e.key === 'Enter' && sugActive >= 0) { e.preventDefault(); closeSuggestions(); search(sugItems[sugActive].name); }
  else if (e.key === 'Escape') { closeSuggestions(); }
});
input.addEventListener('blur', () => setTimeout(closeSuggestions, 140));
sugBox.addEventListener('pointerdown', e => e.preventDefault());
sugBox.addEventListener('click', e => {
  const li = e.target.closest('li[data-q]');
  if (li) { closeSuggestions(); search(li.dataset.q); }
});

/* ---------- rendering ---------- */
const POKEBALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#222222" stroke-width="4"/><path d="M 2.05 50 A 48 48 0 0 1 97.95 50 Z" fill="#EE1515"/><path d="M 2 50 L 98 50" stroke="#222222" stroke-width="4"/><circle cx="50" cy="50" r="14" fill="#222222"/><circle cx="50" cy="50" r="8" fill="#FFFFFF" stroke="#222222" stroke-width="3"/></svg>`;

function setPageStatus(message) {
  const status = $('#page-status');
  if (status) status.textContent = message;
}

function showLoading() {
  setPageStatus('Loading Pokémon data');
  document.body.style.removeProperty('--bg-type-primary');
  document.body.style.removeProperty('--bg-type-secondary');
  view.innerHTML = `
    <div class="gallery-loader" style="padding-top:4rem">
      <div class="pokeball-loader" role="status" aria-label="Loading Pokémon">${POKEBALL_SVG}
        <span class="satellite"></span>
        <span class="satellite"></span>
        <span class="satellite"></span>
        <span class="satellite"></span>
      </div>
      <p class="sub" style="margin-top:1rem;text-align:center">Loading Pokédex data...</p>
    </div>`;
}
function showError(kind, q) {
  const d = document.createElement('div');
  d.className = 'card msg';
  if (kind === 'nf') {
    d.innerHTML = '<h2>Pokémon not found</h2><p class="q"></p><p>Try another name or Pokédex number.</p>';
    $('.q', d).textContent = `We couldn't find a Pokémon matching "${q}".`;
    setPageStatus('Pokémon not found');
  } else {
    d.innerHTML = '<h2>Unable to load Pokémon data.</h2><p>Please check your connection and try again.</p><button type="button" class="link" data-act="retry-search">Retry</button>';
    const retry = $('[data-act="retry-search"]', d);
    retry.dataset.query = String(q || '');
    setPageStatus('Unable to load Pokémon data');
  }
  view.replaceChildren(d);
}

function dexNav(id) {
  const nums = [];
  for (let d = id - 2; d <= id + 2; d++) {
    if (d < 1 || d > MAX_DEX) continue;
    nums.push(d === id
      ? `<span class="here">${d}</span>`
      : `<a href="#" data-q="${d}">${d}</a>`);
  }
  const prev = id > 1 ? `<a class="arrow" href="#" data-q="${id - 1}" aria-label="Previous Pokémon">&lsaquo;</a>` : '';
  const next = id < MAX_DEX ? `<a class="arrow" href="#" data-q="${id + 1}" aria-label="Next Pokémon">&rsaquo;</a>` : '';
  return prev + nums.join('') + next;
}
function renderMoves(moves) {
  if (!moves.length) return '<p class="sub move-list-note">No level-up moves data available for this Pokémon.</p>';
  
  return `<div class="moves">${moves.map((m, i) => {
    const cachedType = m.type || getMoveType(m.url);
    return `
    <div class="move" data-murl="${m.url}">
      <button type="button" class="move-head" aria-expanded="false">
        <span class="lv" title="Earliest level-up level across game versions">Lv ${m.level ?? '—'}</span>
        <span class="mn">${cap(m.name)}</span>
        <span class="move-type" data-murl="${m.url}">
          ${cachedType ? typeBadge(cachedType, { size: 'sm' }) : '<span class="type-badge type-badge--unknown type-badge--sm">—</span>'}
        </span>
        <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="move-body"><div class="mgrid"></div><p class="effect"></p></div>
    </div>`;
  }).join('')}</div>
    <p class="sub small move-list-note">${moves.length} level-up move${moves.length === 1 ? '' : 's'} · levels show the earliest level across game versions · click a move for details.</p>`;
}
function evoNode(n) {
  const now = n.id === cur.p.sid ? ' now' : '';
  const kids = n.kids.length
    ? `<div class="evo-kids">${n.kids.map(k => `<div class="evo-branch"><span class="cond">${k.cond}</span>${evoNode(k)}</div>`).join('')}</div>`
    : '';
  return `<div class="evo-node"><button class="evo-card${now}" data-q="${n.id}">
    <img loading="lazy" src="${ART}${n.id}.png" alt="${cap(n.name)}"><b>${cap(n.name)}</b><small>#${n.id}</small></button>${kids}</div>`;
}
function renderEvolutionChain(chain) {
  return chain.kids.length ? evoNode(chain) : '<p class="sub">This Pokémon does not evolve.</p>' + evoNode(chain);
}
function renderGenerationArtwork(gens) {
  return Object.keys(gens).sort((a, b) => romanNumber(a.split('-')[1]) - romanNumber(b.split('-')[1])).map(k => {
    const x = gens[k];
    const btn = (src, label) => `<button type="button" data-zoom="${src}" data-zoom-label="${cap(label)} sprite, generation ${roman(k)}" aria-label="Enlarge ${label} sprite"><img loading="lazy" src="${src}" alt="${label} sprite, generation ${roman(k)}"></button>`;
    return `<figure class="gen"><div class="pair">${btn(x.d, 'Regular')}${x.s ? btn(x.s, 'Shiny') : ''}</div>
      <figcaption><b>Gen ${roman(k)}</b><small>${cap(x.game)}</small></figcaption></figure>`;
  }).join('');
}
function renderPokemon(e) {
  const { p, s } = e;
  const c = TYPE_COLORS[p.types[0]] || '#596a63';
  view.style.setProperty('--c', c);
  document.body.classList.add('has');
  
  // Set type-tinted background
  document.body.style.setProperty('--bg-type-primary', c);
  if (p.types[1]) document.body.style.setProperty('--bg-type-secondary', TYPE_COLORS[p.types[1]] || '#888');
  else document.body.style.removeProperty('--bg-type-secondary');
  
  const info = [
    ['Pokédex number', '#' + p.id], ['Region', s.region], ['Generation', roman(s.gen)], ['Species', s.genus],
    ['Height', (p.h / 10).toFixed(1) + ' m'], ['Weight', (p.w / 10).toFixed(1) + ' kg'],
    ['Base experience', p.xp], ['Capture rate', s.cr],
    ['Base happiness', s.hp], ['Growth rate', s.gr && cap(s.gr)], ['Egg groups', s.eggs.join(', ')],
    ['Habitat', s.hab && cap(s.hab)], ['Status', s.leg ? 'Legendary' : s.myth ? 'Mythical' : null]
  ].filter(([, v]) => v != null && v !== '');
  const gens = renderGenerationArtwork(p.gens);
  const spot = randomMode
    ? `<div class="spot"><span class="tag">Random spotlight</span><button type="button" data-act="shuffle">Shuffle another</button></div>`
    : '';

  const maxStat = p.stats.reduce((a, b) => b[1] > a[1] ? b : a);
  const total = p.stats.reduce((a, s) => a + s[1], 0);
  const statRatio = Math.min(100, Math.round((total / 720) * 100));
  
  // Type matchup HTML
  const typeMatchupReady = hasTypeMatchupData(p.types);
  const typeMatchupHtml = typeMatchupReady ? renderTypeMatchup(p.types) : typeMatchupLoadingHtml();
  
  // Abilities HTML - fully visible, no toggle
  const abilityList = Array.isArray(p.abilities) ? p.abilities : [];
  const abilitiesHtml = abilityList.map(a => {
    const ability = typeof a === 'string' ? { name: a, url: '' } : (a || {});
    const abilityName = cap(ability.name || 'Unknown ability');
    const abilityUrl = typeof ability.url === 'string' ? ability.url : '';
    const abilityKey = abilityName.toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="ability-card" data-ability="${abilityKey}" data-url="${abilityUrl}">
        <div class="ability-header">
          <span class="ability-name">${abilityName}${ability.hidden ? ' <span class="ability-hidden">Hidden</span>' : ''}</span>
        </div>
        <div class="ability-body">
          <p class="ability-loading">${abilityUrl ? 'Loading ability details…' : 'Ability details unavailable.'}</p>
        </div>
      </div>`;
  }).join('');

  // Cry button
  const cryUrl = p.cries?.latest || p.cries?.legacy;
  const cryBtn = cryUrl
    ? `<button type="button" class="cry-btn" data-cry="${cryUrl}" aria-label="Play ${cap(p.name)}'s cry" aria-pressed="false">
         <svg class="cry-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
           <!-- Speaker Base -->
           <path d="M11 5L6 9H2v6h4l5 4V5z"/>
           <!-- Sound Wave -->
           <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
         </svg>
         <span class="cry-label">Cry</span>
       </button>`
    : '';

  view.innerHTML = `${spot}
  <article class="hero-card" style="--c:${c}">
    <div class="dexnav">${dexNav(p.id < 10000 ? p.id : 0) || ''}</div>
    <div class="region">Region · ${s.region}</div>
    <div class="hero-atmosphere" aria-hidden="true"></div>
    <div class="hero-pokeball-watermark" aria-hidden="true">${POKEBALL_SVG}</div>
    <div class="hero-grid">
      <div class="hero-left">
        <div class="kicker"><span class="num">#${String(p.id).padStart(4, '0')}</span><span>${s.leg ? 'Legendary' : s.myth ? 'Mythical' : 'Pokémon'}</span></div>
        <h2 class="name">${cap(p.name)}</h2>
        ${s.jname ? `<p class="jname" lang="ja">${s.jname}</p>` : ''}
        <p class="genus">${s.genus || ''}</p>
        ${s.description ? `<p class="hero-description" lang="en">${escapeHtml(s.description)}</p>` : ''}
        <div class="type-row">
          <span class="type-label">Type</span>
          <div class="type-badges">${p.types.map(t => typeBadge(t, { icon: true })).join('')}</div>
        </div>
        <div class="facts">
          <div><small>Height</small><b>${(p.h / 10).toFixed(2)} m</b></div>
          <div><small>Weight</small><b>${(p.w / 10).toFixed(2)} kg</b></div>
          <div><small>Region</small><b>${s.region}</b></div>
        </div>
        <div class="hero-controls">
          <div class="seg" role="group" aria-label="Colour variant">
            <button type="button" data-shiny="0">Regular</button><button type="button" data-shiny="1">Shiny</button>
          </div>
          ${cryBtn}
        </div>
      </div>
      <div class="art"><span class="halo"></span><img id="hero" alt="${cap(p.name)} artwork"></div>
    </div>
    <section class="hero-stats" aria-labelledby="h-stats">
      <h3 id="h-stats">Base stats</h3>
      <div class="hero-stats-dial" style="--dial:${statRatio}%" aria-hidden="true"><span>${total}</span></div>
      <div class="hero-stats-grid">
        ${p.stats.map(([n, v]) => `
          <div class="hero-stat">
            <span class="hero-stat-label">${STAT_NAMES[n] || cap(n)}</span>
            <div class="hero-stat-bar">
              <span class="hero-stat-value">${v}</span>
              <i><u style="width:${Math.min(100, v / 255 * 100)}%"></u></i>
            </div>
          </div>
        `).join('')}
        <div class="hero-stat hero-stat-total">
          <span class="hero-stat-label">TOTAL</span>
          <span class="hero-stat-value">${total}</span>
        </div>
        <div class="hero-stat hero-stat-strongest">
          <span class="hero-stat-label">Strongest: ${STAT_NAMES[maxStat[0]] || cap(maxStat[0])}</span>
          <span class="hero-stat-value">${maxStat[1]}</span>
        </div>
      </div>
    </section>
  </article>
  
  <section class="card type-matchup" aria-labelledby="h-matchup">
    <h3 id="h-matchup">Type matchup</h3>
    <div class="type-matchup-grid" aria-live="polite" aria-busy="${typeMatchupReady ? 'false' : 'true'}">${typeMatchupHtml}</div>
  </section>
  
  <div class="row">
    <section class="card" aria-labelledby="h-moves"><h3 id="h-moves">Moves · Skills</h3>${renderMoves(p.moves)}</section>
    <section class="card" aria-labelledby="h-3d"><h3 id="h-3d">3D model</h3>
      <div class="stage" id="stage"></div>
      <div class="viewer-foot"><span>Drag to rotate · Scroll to zoom</span>
        <span id="ctl3d"><button type="button" data-act="rotate">Auto-rotate</button><button type="button" data-act="reset">Reset view</button></span></div>
      <p class="sub small model-note" id="note3d" style="margin:.4rem 0 0"></p>
    </section>
  </div>
  <section class="card" aria-labelledby="h-abilities"><h3 id="h-abilities">Abilities</h3>
    <div class="abilities-grid">${abilitiesHtml}</div>
  </section>
  <section class="card" aria-labelledby="h-evo"><h3 id="h-evo">Evolution</h3><div class="scroll">${renderEvolutionChain(e.evo)}</div></section>
  <section class="card" aria-labelledby="h-info"><h3 id="h-info">Details</h3>
    <dl class="info">${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></section>
  ${gens ? `<section class="card" aria-labelledby="h-gen"><h3 id="h-gen">Generation artwork</h3><div class="gens">${gens}</div></section>` : ''}`;
  
  observeMoveTypes($('.moves'));
  paintVisuals();
  loadAbilitiesForCurrent().catch(err => console.error('Ability details initialization failed:', err));
  loadTypeMatchupForCurrent(e).catch(err => console.error('Type matchup initialization failed:', err));
}
function paintVisuals(refreshAtmosphere = true) {
  const p = cur && cur.p;
  if (!p || !p.art) return;

  const a = p.art;
  const list = (shiny ? [a.s, a.hs, a.ss, a.n, a.hn, a.sn] : [a.n, a.hn, a.sn]).filter(Boolean);
  const h = $('#hero');
  if (!h) return;
  h.classList.toggle('broken', !list.length);
  h.dataset.fb = list[1] || '';
  h.src = list[0] || '';
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.shiny === '1') === shiny)));
  if (refreshAtmosphere) populateTypeAtmosphere(p.types);
  try { render3DModel(); } catch (err) { console.error('3D preview initialization failed:', err); }
  try { setupCryButton(); } catch (err) { console.error('Cry control initialization failed:', err); }
}
function render3DModel() {
  const entry = cur, p = cur && cur.p;
  const box = $('#stage'), note = $('#note3d'), ctl = $('#ctl3d');
  if (!p || !box || !note || !ctl) return;
  box.innerHTML = ''; note.textContent = ''; ctl.hidden = false;
  const fallback = () => {
    if (cur !== entry) return;
    ctl.hidden = true;
    box.innerHTML = '<div class="none"><div><img alt=""><p>3D model unavailable</p></div></div>';
    const img = $('img', box);
    img.src = p.art.n || p.art.hn || p.art.sn || '';
    img.dataset.fb = p.art.sn || '';
  };
  if (p.id > MAX_DEX) return fallback();
  const mv = document.createElement('model-viewer');
  mv.setAttribute('camera-controls', '');
  mv.setAttribute('auto-rotate', '');
  mv.setAttribute('touch-action', 'pan-y');
  mv.setAttribute('shadow-intensity', '0.6');
  mv.setAttribute('interaction-prompt', 'none');
  mv.setAttribute('alt', '3D model of ' + cap(p.name));
  let triedRegular = !shiny;
  const timer = setTimeout(() => { if (!mv.loaded) fallback(); }, 12000);
  mv.addEventListener('load', () => clearTimeout(timer));
  mv.addEventListener('error', () => {
    if (cur !== entry) return;
    if (!triedRegular) {
      triedRegular = true;
      note.textContent = 'Shiny 3D model unavailable. Showing the regular model.';
      mv.src = getPokemon3DModel(p.id, false);
    } else { clearTimeout(timer); fallback(); }
  });
  mv.src = getPokemon3DModel(p.id, shiny);
  box.append(mv);
}

/* ---------- search / navigation ---------- */
function updateURL(name) {
  try {
    if (new URLSearchParams(location.search).get('pokemon') === name) return;
    history.pushState({}, '', '?pokemon=' + encodeURIComponent(name));
  } catch { /* file:// or restricted context */ }
}
async function search(raw, opts = {}) {
  const { push = true, record = true } = opts;
  let q = String(raw).trim().toLowerCase().replace(/\s+/g, '-');
  if (!q) return;
  if (/^\d+$/.test(q)) q = String(+q);
  const my = ++token;
  if (searchController) searchController.abort();
  searchController = new AbortController();
  const signal = searchController.signal;
  cur = null;
  stopCry();
  closeSuggestions();
  resetGalleryCardObserver();
  resetMoveTypeObserver();
  galleryGeneration++;
  // Clean up gallery state when searching
  window.removeEventListener('scroll', handleInfiniteScroll);
  galleryLoading = false;
  galleryEnded = true;
  showLoading();
  try {
    const e = await loadPokemon(q, { signal });
    if (my !== token) return;
    cur = e;
    input.value = e.p.name;
    renderPokemon(e);
    setPageStatus(`${cap(e.p.name)} loaded`);
    if (record) updateSearchHistory(e.p.name);
    if (push) updateURL(e.p.name);
    document.title = cap(e.p.name) + ' · Pokédex';
    window.scrollTo({ top: 0, behavior: 'auto' });
  } catch (err) {
    if (my !== token) return;
    if (err.name === 'AbortError') return;
    console.error(`Pokémon load failed for "${raw}":`, err);
    showError(err.status === 404 ? 'nf' : 'net', raw);
  } finally {
    if (my === token) searchController = null;
  }
}
function randomPokemon() {
  randomMode = true;
  search(1 + Math.floor(Math.random() * MAX_DEX), { record: false });
}
function go(id) {
  if (cur && cur.p.id < 10000 && id >= 1 && id <= MAX_DEX) { randomMode = false; search(id); }
}

/* ---------- events ---------- */
$('#form').addEventListener('submit', e => { e.preventDefault(); closeSuggestions(); randomMode = false; search(input.value); });
$('#clear').addEventListener('click', () => { save(HISTORY_KEY, []); renderHistory(); });
$('#chips').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { randomMode = false; search(b.dataset.q); } });

view.addEventListener('click', e => {
  const q = e.target.closest('[data-q]');
  if (q) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    randomMode = false;
    return search(q.dataset.q);
  }
  const sh = e.target.closest('[data-shiny]');
  if (sh && cur) { shiny = sh.dataset.shiny === '1'; return paintVisuals(false); }
  const z = e.target.closest('[data-zoom]');
  if (z) {
    const d = $('#zoom');
    const image = $('img', d);
    image.src = z.dataset.zoom;
    image.alt = z.dataset.zoomLabel || 'Enlarged Pokémon artwork';
    return d.showModal ? d.showModal() : window.open(z.dataset.zoom);
  }
  const act = e.target.closest('[data-act]');
  if (act && (act.dataset.act === 'gallery-shuffle' || act.dataset.act === 'gallery-retry')) {
    e.preventDefault();
    galleryEnded = false;
    return loadGalleryBatch(GALLERY_BATCH_SIZE, galleryGeneration);
  }
  if (act && act.dataset.act === 'retry-search') {
    e.preventDefault();
    return search(act.dataset.query || input.value);
  }
  if (act && act.dataset.act === 'retry-type-matchup') {
    e.preventDefault();
    loadTypeMatchupForCurrent(cur).catch(err => console.error('Type matchup retry failed:', err));
    return;
  }
  if (act && act.dataset.act === 'shuffle') { randomMode = true; return randomPokemon(); }
  const head = e.target.closest('.move-head');
  if (head) return toggleMove(head);
  const a = e.target.closest('[data-act]');
  const mv = $('model-viewer');
  if (a && mv) {
    if (a.dataset.act === 'rotate') mv.autoRotate = !mv.autoRotate;
    else { mv.cameraOrbit = '0deg 75deg 105%'; mv.fieldOfView = 'auto'; if (mv.jumpCameraToGoal) mv.jumpCameraToGoal(); }
  }
});

view.addEventListener('change', e => {
  if (e.target.id === 'gallery-filter') applyGalleryFilter(e.target.value);
});

view.addEventListener('keydown', e => {
  const card = e.target.closest('.gallery-card[data-q]');
  if (!card) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    randomMode = false;
    search(card.dataset.q);
    return;
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  const grid = $('#gallery-grid');
  if (!grid) return;
  const cards = $$('.gallery-card:not([hidden])', grid);
  const index = cards.indexOf(card);
  if (index < 0) return;
  const columns = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
  let next = index;
  if (e.key === 'ArrowLeft') next = Math.max(0, index - 1);
  if (e.key === 'ArrowRight') next = Math.min(cards.length - 1, index + 1);
  if (e.key === 'ArrowUp') next = Math.max(0, index - columns);
  if (e.key === 'ArrowDown') next = Math.min(cards.length - 1, index + columns);
  if (next === index) return;
  e.preventDefault();
  e.stopPropagation();
  cards.forEach(item => { item.tabIndex = item === cards[next] ? 0 : -1; });
  cards[next].focus();
});

function moveClassIcon(cls) {
  const icons = {
    physical: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    special: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 6.8H21l-5.5 4 2.1 6.8-5.6-4.1-5.6 4.1 2.1-6.8-5.5-4h6.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    status: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4l2.5 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  return icons[String(cls || '').toLowerCase()] || icons.status;
}
function moveMeter(value, max = 100) {
  if (value == null) return '—';
  const width = Math.max(0, Math.min(100, (Number(value) / max) * 100));
  return `<span class="move-meter" aria-label="${value}"><i style="width:${width}%"></i></span><strong>${value}</strong>`;
}

/* move expand: fetch details on first open */
async function toggleMove(head) {
  const box = head.parentElement;
  const open = box.classList.toggle('open');
  head.setAttribute('aria-expanded', String(open));
  if (!open) return;
  const body = $('.move-body', box);
  if (body.dataset.done) return;
  const grid = $('.mgrid', body), fx = $('.effect', body);
  grid.innerHTML = '<div><small>Loading</small><b>…</b></div>';
  try {
    const m = await loadMove(box.dataset.murl);
    grid.innerHTML = `
      <div><small>Type</small><b>${m.type ? typeBadge(m.type, { icon: true, size: 'sm' }) : '—'}</b></div>
      <div class="move-class-cell" aria-label="Move category"><b class="move-class-value">${moveClassIcon(m.cls)}${m.cls ? cap(m.cls) : '—'}</b></div>
      <div><small>Power</small><b>${moveMeter(m.power, 150)}</b></div>
      <div><small>Accuracy</small><b>${m.acc != null ? `${m.acc}%` : '—'}</b></div>
      <div><small>PP</small><b>${m.pp ?? '—'}</b></div>`;
    fx.textContent = m.effect || '';
    body.dataset.done = '1';
    // Update the move type badge in the list if it was unknown
    updateMoveTypeBadge(box.dataset.murl, m.type);
  } catch {
    grid.innerHTML = '<div><small>Error</small><b>Could not load move data</b></div>';
  }
}

/* Update move type badge in the list when type becomes available */
function updateMoveTypeBadge(url, type) {
  if (!type) return;
  const badges = $$(`.move-type[data-murl="${url}"]`);
  badges.forEach(badge => {
    badge.innerHTML = typeBadge(type, { size: 'sm' });
  });
}

$('#zoom').addEventListener('click', () => $('#zoom').close());
$('#zoom-close').addEventListener('click', () => $('#zoom').close());

// Broken images fall back to a secondary source, then hide
document.addEventListener('error', e => {
  const i = e.target;
  if (!i || i.tagName !== 'IMG') return;
  if (i.dataset.fb && i.getAttribute('src') !== i.dataset.fb) { i.src = i.dataset.fb; i.dataset.fb = ''; }
  else i.classList.add('broken');
}, true);

document.addEventListener('keydown', e => {
  if (!cur || $('#zoom').open || /INPUT|TEXTAREA|MODEL-VIEWER/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowLeft') go(cur.p.id - 1);
  if (e.key === 'ArrowRight') go(cur.p.id + 1);
});

window.addEventListener('popstate', () => {
  const q = new URLSearchParams(location.search).get('pokemon');
  if (q) { randomMode = false; search(q, { push: false, record: false }); }
  else { randomMode = false; renderGallery(); }
});

// Global error handlers
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error || e.message);
  // Try to show a user-friendly message if the view is empty
  if (view && view.innerHTML.trim() === '') {
    view.innerHTML = `
      <div class="card msg" style="max-width:500px;margin:2rem auto;text-align:center">
        <h2>Something went wrong</h2>
        <p>Please refresh the page or try again.</p>
        <button class="link" onclick="location.reload()">Reload</button>
      </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

/* ---------- gallery (home page) ---------- */
const GALLERY_BATCH_SIZE = 12;
const MAX_GALLERY_CARDS = 120;
let displayedPokemonIds = new Set();
let galleryLoading = false;
let galleryEnded = false;
let galleryCardObserver = null;
let galleryFilter = 'all';

function resetGalleryCardObserver() {
  if (!galleryCardObserver) return;
  galleryCardObserver.disconnect();
  galleryCardObserver = null;
}

function getRandomPokemonIds(count, exclude = new Set()) {
  const ids = [];
  let attempts = 0;
  while (ids.length < count && attempts < MAX_DEX * 4) {
    attempts++;
    const id = 1 + Math.floor(Math.random() * MAX_DEX);
    if (!exclude.has(id) && !displayedPokemonIds.has(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function galleryFilterOptions() {
  return `<option value="all">All types</option>${Object.keys(TYPE_COLORS).map(type => `<option value="${type}">${cap(type)}</option>`).join('')}`;
}

function gallerySkeletonHtml(id) {
  return `<div class="gallery-card gallery-skeleton" data-gallery-skeleton="${id}" aria-hidden="true"><div class="skeleton-art"><span class="skeleton-pokeball"></span></div><div class="skeleton-info"><span></span><span></span><span></span></div></div>`;
}

function galleryCardMarkup(e, index = 0) {
  const p = e.p;
  const cardTypes = normalizeTypeList(p.types);
  const primaryType = cardTypes[0] || 'normal';
  const typeColor = TYPE_COLORS[primaryType] || '#596a63';
  const secondaryColor = TYPE_COLORS[cardTypes[1]] || typeColor;
  const artUrl = p.art.n || p.art.hn || p.art.sn || '';
  const fallbackUrl = p.art.sn || '';
  const enterDelay = Math.min(index, 10) * 45;
  const typeLabel = cardTypes.map(cap).join(' / ') || 'Unknown type';
  return `<a class="gallery-card gallery-card--enter" href="?pokemon=${encodeURIComponent(p.name)}" data-id="${p.id}" data-q="${p.name}" data-types="${cardTypes.join(',')}" style="--type-color:${typeColor};--card-type-primary:${typeColor};--card-type-secondary:${secondaryColor};--card-delay:${enterDelay}ms" tabindex="0" aria-label="${cap(p.name)}, #${String(p.id).padStart(4, '0')}, ${typeLabel} type">
    <div class="gallery-card-art">
      <div class="gallery-card-atmosphere" aria-hidden="true">${galleryAtmosphereHtml(cardTypes)}</div>
      <img loading="lazy" src="${artUrl}" data-fb="${fallbackUrl}" alt="${cap(p.name)} artwork">
    </div>
    <div class="gallery-card-info">
      <span class="gallery-card-num">#${String(p.id).padStart(4, '0')}</span>
      <h3 class="gallery-card-name">${cap(p.name)}</h3>
      <span class="gallery-card-type">${cardTypes.map(type => typeBadge(type, { size: 'sm' })).join('')}</span>
    </div>
  </a>`;
}

function updateGalleryCount() {
  const grid = $('#gallery-grid');
  if (!grid) return;
  const cards = $$('.gallery-card:not(.gallery-skeleton)', grid);
  const visible = cards.filter(card => !card.hidden).length;
  const count = $('#gallery-count');
  if (count) count.textContent = `${visible} shown · ${cards.length} loaded`;
  const empty = $('#gallery-filter-empty');
  if (empty) empty.hidden = galleryFilter === 'all' || visible > 0;
}

function applyGalleryFilter(value) {
  galleryFilter = value || 'all';
  const grid = $('#gallery-grid');
  if (!grid) return;
  $$('.gallery-card[data-types]', grid).forEach(card => {
    const types = String(card.dataset.types || '').split(',');
    card.hidden = galleryFilter !== 'all' && !types.includes(galleryFilter);
  });
  updateGalleryCount();
}

function pruneGalleryCards() {
  const grid = $('#gallery-grid');
  if (!grid) return;
  const cards = $$('.gallery-card:not(.gallery-skeleton)', grid);
  while (cards.length > MAX_GALLERY_CARDS) {
    const old = cards.shift();
    if (old.dataset.id) displayedPokemonIds.delete(Number(old.dataset.id));
    if (galleryCardObserver) galleryCardObserver.unobserve(old);
    old.remove();
  }
  const firstVisible = cards.find(card => !card.hidden) || cards[0];
  cards.forEach(card => { card.tabIndex = card === firstVisible ? 0 : -1; });
}

function showGalleryBatchError() {
  let error = $('.gallery-batch-error', view);
  if (!error) {
    error = document.createElement('div');
    error.className = 'gallery-batch-error';
    error.innerHTML = '<span>Some cards could not be loaded.</span><button type="button" class="link" data-act="gallery-retry">Retry</button>';
    view.appendChild(error);
  }
  error.hidden = false;
}

async function loadGalleryBatch(count = GALLERY_BATCH_SIZE, generation = galleryGeneration) {
  if (galleryLoading || galleryEnded) return;
  const grid = $('#gallery-grid');
  if (!grid) return;

  galleryLoading = true;
  const previousError = $('.gallery-batch-error', view);
  if (previousError) previousError.hidden = true;
  showGalleryLoading(true);
  const ids = getRandomPokemonIds(count);
  if (ids.length === 0) {
    galleryEnded = true;
    showGalleryLoading(false);
    galleryLoading = false;
    return;
  }

  const failed = [];
  grid.insertAdjacentHTML('beforeend', ids.map(gallerySkeletonHtml).join(''));

  await Promise.all(ids.map(async (id, index) => {
    try {
      const entry = await loadGalleryPokemon(id);
      if (generation !== galleryGeneration) return;
      displayedPokemonIds.add(id);
      const skeleton = $(`[data-gallery-skeleton="${id}"]`, grid);
      if (skeleton) {
        const holder = document.createElement('div');
        holder.innerHTML = galleryCardMarkup(entry, index);
        skeleton.replaceWith(holder.firstElementChild);
      } else {
        grid.insertAdjacentHTML('beforeend', galleryCardMarkup(entry, index));
      }
      observeGalleryCards(grid);
      applyGalleryFilter(galleryFilter);
      pruneGalleryCards();
      updateGalleryCount();
    } catch (err) {
      if (generation !== galleryGeneration) return;
      failed.push(id);
      displayedPokemonIds.delete(id);
      const skeleton = $(`[data-gallery-skeleton="${id}"]`, grid);
      if (skeleton) skeleton.remove();
      console.error(`Failed to load gallery Pokémon ${id}:`, err);
    }
  }));

  if (generation !== galleryGeneration) return;
  if (failed.length) showGalleryBatchError();
  if (displayedPokemonIds.size >= MAX_DEX) galleryEnded = true;
  showGalleryLoading(false);
  galleryLoading = false;
}

function showGalleryLoading(show) {
  let loader = $('#gallery-loader');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'gallery-loader';
      loader.className = 'gallery-loader';
      loader.innerHTML = `
        <div class="pokeball-loader" role="status" aria-label="Loading more Pokémon">${POKEBALL_SVG}
          <span class="satellite"></span>
          <span class="satellite"></span>
          <span class="satellite"></span>
          <span class="satellite"></span>
        </div>`;
      view.appendChild(loader);
    }
    loader.hidden = false;
  } else if (loader) {
    loader.hidden = true;
  }
}

function observeGalleryCards(root) {
  const cards = $$('.gallery-card--enter:not([data-card-observed])', root);
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach(card => card.classList.add('is-visible', 'is-in-view'));
    return;
  }

  if (!galleryCardObserver) {
    galleryCardObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target;
        card.classList.toggle('is-in-view', entry.isIntersecting);
        if (entry.isIntersecting) card.classList.add('is-visible');
      });
    }, { rootMargin: '120px 0px', threshold: 0.12 });
  }

  cards.forEach(card => {
    card.dataset.cardObserved = 'true';
    galleryCardObserver.observe(card);
  });
}

function renderGalleryCards(entries) {
  const grid = $('#gallery-grid');
  if (!grid || !entries.length) return;
  entries.forEach(entry => { if (entry.p && entry.p.id) displayedPokemonIds.add(entry.p.id); });
  grid.insertAdjacentHTML('beforeend', entries.map((entry, index) => galleryCardMarkup(entry, index)).join(''));
  observeGalleryCards(grid);
  applyGalleryFilter(galleryFilter);
  pruneGalleryCards();
  updateGalleryCount();
}

function renderGallery() {
  if (searchController) {
    searchController.abort();
    searchController = null;
  }
  token++;
  galleryGeneration++;
  resetGalleryCardObserver();
  resetMoveTypeObserver();
  stopCry();
  closeSuggestions();
  cur = null;
  shiny = false;
  randomMode = false;
  galleryFilter = 'all';
  displayedPokemonIds.clear();
  galleryLoading = false;
  galleryEnded = false;
  input.value = '';
  document.body.classList.remove('has');
  document.body.style.removeProperty('--bg-type-primary');
  document.body.style.removeProperty('--bg-type-secondary');
  document.title = 'Pokédex';
  history.replaceState({}, '', './');
  setPageStatus('Random Pokémon gallery');
  view.innerHTML = `
    <section class="gallery" aria-label="Pokémon gallery">
      <div class="gallery-toolbar">
        <div class="gallery-heading"><span class="gallery-eyebrow">National Pokédex</span><h2>Random encounters</h2></div>
        <div class="gallery-toolbar-actions">
          <label class="gallery-filter">Type <select id="gallery-filter" aria-label="Filter gallery by type">${galleryFilterOptions()}</select></label>
          <span id="gallery-count" class="gallery-count">0 shown · 0 loaded</span>
          <button type="button" class="gallery-shuffle" data-act="gallery-shuffle">New batch</button>
        </div>
      </div>
      <a class="skip-gallery" href="#about">Skip gallery</a>
      <div class="gallery-grid" id="gallery-grid"></div>
      <div class="gallery-filter-empty" id="gallery-filter-empty" hidden>No loaded Pokémon match this type yet. <button type="button" class="link" data-act="gallery-shuffle">Load more</button></div>
    </section>`;
  loadGalleryBatch(GALLERY_BATCH_SIZE, galleryGeneration);
  setupInfiniteScroll();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function setupInfiniteScroll() {
  // Remove existing listener if any
  window.removeEventListener('scroll', handleInfiniteScroll);
  window.addEventListener('scroll', handleInfiniteScroll, { passive: true });
}

function handleInfiniteScroll() {
  if (galleryLoading || galleryEnded) return;
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  
  // Trigger when within 500px of bottom
  if (scrollTop + windowHeight >= docHeight - 500) {
    loadGalleryBatch(GALLERY_BATCH_SIZE);
  }
}

/* ---------- init ---------- */
function init() {
  try {
    cleanupOldPokemonCaches();
    renderHistory();
    ensureDexList().catch(() => { /* suggestions unavailable offline — search still works */ });
    const initial = new URLSearchParams(location.search).get('pokemon');
    if (initial) {
      search(initial, { push: false, record: false });
    } else {
      randomMode = false;
      renderGallery();
    }
  } catch (err) {
    console.error('Init failed:', err);
    // Fallback: show basic gallery even if JS fails partially
    if (document.getElementById('view')) {
      document.getElementById('view').innerHTML = `
        <section class="gallery" aria-label="Pokémon gallery">
          <div class="gallery-loader" style="padding-top:4rem">
            <div class="pokeball-loader" role="status" aria-label="Loading Pokémon">${POKEBALL_SVG}
              <span class="satellite"></span>
              <span class="satellite"></span>
              <span class="satellite"></span>
              <span class="satellite"></span>
            </div>
            <p class="sub" style="margin-top:1rem;text-align:center">Loading Pokédex data...</p>
          </div>
        </section>`;
    }
  }
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
