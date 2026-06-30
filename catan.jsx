import React, { useReducer, useState, useMemo } from "react";

/* ============================================================
   CATAN — Pass & Play  (DE / EN)
   Implementation aligned with the official Catan-Almanach
   (Kosmos, Regelstand April 2010, 3–4 Spieler).
   ============================================================ */

/* ---------- constants ---------- */
const SIZE = 52;
const SQRT3 = Math.sqrt(3);
const ROWS = [3, 4, 5, 4, 3];

const RES = ["wood", "brick", "sheep", "wheat", "ore"];
const RES_META = {
  wood:  { tile: "#3f6b41", icon: "🌲", token: "#dff0df" },
  brick: { tile: "#b1582f", icon: "🧱", token: "#f6ddcf" },
  sheep: { tile: "#8fb766", icon: "🐑", token: "#e9f3d9" },
  wheat: { tile: "#d9aa3c", icon: "🌾", token: "#f7ecca" },
  ore:   { tile: "#6b7480", icon: "⛰️", token: "#e2e5ea" },
  desert:{ tile: "#d8c79a", icon: "🏜️", token: "#efe6cf" },
};

const PLAYER_COLORS = [
  { main: "#cf3a36", dark: "#8e221f", text: "#fff" },
  { main: "#2f6fd0", dark: "#1d4a91", text: "#fff" },
  { main: "#e2882a", dark: "#a85d12", text: "#fff" },
  { main: "#f3efe2", dark: "#9a9484", text: "#3a3730" },
];

const COSTS = {
  road:       { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city:       { wheat: 2, ore: 3 },
  dev:        { sheep: 1, wheat: 1, ore: 1 },
};

// Official piece supply per player (Almanach: 15 Straßen, 5 Siedlungen, 4 Städte)
const PIECE = { road: 15, settlement: 5, city: 4 };

/* ============================================================
   i18n
   ============================================================ */
const I18N = {
  de: {
    subtitle: "Pass & Play · Besiedle die Insel",
    choose: "Wähle die Anzahl der Siedler",
    begin: "LOSLEGEN",
    blurb: "Eine originalgetreue Umsetzung des Klassikers · Straßen, Siedlungen, Städte, Räuber, Entwicklungskarten, Längste Handelsstraße & Größte Rittermacht · wer zuerst 10 Punkte erreicht, gewinnt.",
    phase_setup: "Gründungsphase",
    phase_play: "Spielzug",
    phase_over: "Spielende",
    turn: "Am Zug:",
    new_game: "Neues Spiel",
    place_a: "Setze die hervorgehobene",
    s_settlement: "Siedlung",
    s_road: "Straße",
    on_board: "auf den Plan.",
    click_robber: "Klicke ein Feld, um den Räuber zu versetzen.",
    roll: "🎲 Würfeln",
    end_turn: "Zug beenden →",
    dev_cards: "Entwicklungskarten",
    new_suffix: "·neu",
    vp_card: "★ Siegpunkt ×",
    settlers: "Siedler",
    game_log: "Spielprotokoll",
    bank_trade: "Seehandel · 4 : 1",
    trade: "Tauschen",
    supply: "Vorrat",
    cards: "Karten",
    tip_hand: "Handkarten",
    tip_knights: "gespielte Ritter",
    tip_lroad: "Längste Handelsstraße (+2)",
    tip_larmy: "Größte Rittermacht (+2)",
    tip_newdev: "Diese Runde gekauft – ab dem nächsten Zug spielbar",
    // build buttons
    b_road: "Straße",
    b_settlement: "Siedlung",
    b_city: "Stadt",
    b_dev: "Entw.-Karte",
    // modals
    discard_title: "{name} muss abwerfen",
    discard_desc: "Zu viele Karten. Wähle {count} zum Ablegen auf den Vorrat.",
    discard_have: "habe",
    discard_btn: "Abwerfen {sel}/{count}",
    steal_title: "Wem Karte rauben?",
    plenty_title: "Erfindung",
    plenty_desc: "Nimm dir 2 beliebige Rohstoffe aus dem Vorrat.",
    plenty_picked: "Gewählt:",
    plenty_reset: "zurücksetzen",
    plenty_btn: "Rohstoffe nehmen",
    mono_title: "Monopol",
    mono_desc: "Wähle einen Rohstoff – alle Mitspieler geben dir alle Karten dieser Sorte.",
    win_title: "{name} gewinnt!",
    win_sub: "10 Siegpunkte erreicht und die Insel besiedelt.",
    win_again: "NEUES SPIEL",
    rb_hint: "Lege 2 Straßen kostenlos.",
    // dev names + desc
    dev_knight: "Ritter", dev_road: "Straßenbau", dev_plenty: "Erfindung", dev_monopoly: "Monopol", dev_vp: "Siegpunkt",
    devd_knight: "Versetze den Räuber und raube eine Karte.",
    devd_road: "Baue 2 Straßen kostenlos.",
    devd_plenty: "Nimm 2 beliebige Rohstoffe aus dem Vorrat.",
    devd_monopoly: "Nenne einen Rohstoff; nimm alle davon von allen.",
    devd_vp: "1 Siegpunkt. Bleibt verdeckt.",
    // resources
    res_wood: "Holz", res_brick: "Lehm", res_sheep: "Wolle", res_wheat: "Getreide", res_ore: "Erz",
    // colors
    c0: "Rot", c1: "Blau", c2: "Orange", c3: "Weiß",
    // log
    log_setup_settle: "{name} setzt eine Siedlung.",
    log_setup_road: "{name} setzt eine Straße.",
    log_setup_prompt: "{name}, setze eine Siedlung.",
    log_setup_first: "Setzt eure ersten Siedlungen.",
    log_setup_done: "Gründung abgeschlossen. {name} würfelt.",
    log_roll: "{name} würfelt {sum} ({d1}+{d2}).",
    log_robber_discard: "Räuber! Spieler mit 8+ Karten werfen die Hälfte ab.",
    log_move_robber: "Versetze den Räuber.",
    log_discarded: "{name} wirft {count} Karten ab.",
    log_robber_nosteal: "Räuber versetzt. Niemand zum Berauben.",
    log_stole: "{name} raubt {victim} eine Karte.",
    log_nothing_steal: "Nichts zu rauben.",
    log_built_road: "{name} baut eine Straße.",
    log_built_settle: "{name} baut eine Siedlung.",
    log_built_city: "{name} baut eine Stadt.",
    log_bought_dev: "{name} kauft eine Entwicklungskarte.",
    log_played_dev: "{name} spielt {card}.",
    log_plenty: "{name} nimmt {resList}.",
    log_monopoly: "{name} monopolisiert {res} (+{count}).",
    log_bank: "{name} tauscht 4 {give} → 1 {get}.",
    log_next: "{name} ist am Zug.",
    log_wins: "{name} gewinnt!",
  },
  en: {
    subtitle: "Pass & Play · Settle the Island",
    choose: "Choose your number of settlers",
    begin: "BEGIN",
    blurb: "A faithful take on the classic island game · roads, settlements, cities, the robber, development cards, Longest Road & Largest Army · first to 10 points wins.",
    phase_setup: "Setup",
    phase_play: "In play",
    phase_over: "Game over",
    turn: "Turn:",
    new_game: "New game",
    place_a: "Place a highlighted",
    s_settlement: "settlement",
    s_road: "road",
    on_board: "on the board.",
    click_robber: "Click a hex to move the robber.",
    roll: "🎲 Roll dice",
    end_turn: "End turn →",
    dev_cards: "Development cards",
    new_suffix: "·new",
    vp_card: "★ Victory ×",
    settlers: "Settlers",
    game_log: "Game log",
    bank_trade: "Bank trade · 4 : 1",
    trade: "Trade",
    supply: "Supply",
    cards: "cards",
    tip_hand: "cards in hand",
    tip_knights: "knights played",
    tip_lroad: "Longest Road (+2)",
    tip_larmy: "Largest Army (+2)",
    tip_newdev: "Bought this turn — playable next turn",
    b_road: "Road",
    b_settlement: "Settlement",
    b_city: "City",
    b_dev: "Dev card",
    discard_title: "{name} must discard",
    discard_desc: "Too many cards. Choose {count} to return to the bank.",
    discard_have: "have",
    discard_btn: "Discard {sel}/{count}",
    steal_title: "Steal from whom?",
    plenty_title: "Year of Plenty",
    plenty_desc: "Take any two resources from the bank.",
    plenty_picked: "Picked:",
    plenty_reset: "reset",
    plenty_btn: "Take resources",
    mono_title: "Monopoly",
    mono_desc: "Name a resource — every other player hands you all of theirs.",
    win_title: "{name} wins!",
    win_sub: "Reached 10 victory points and settled the island.",
    win_again: "PLAY AGAIN",
    rb_hint: "Place 2 roads for free.",
    dev_knight: "Knight", dev_road: "Road Building", dev_plenty: "Year of Plenty", dev_monopoly: "Monopoly", dev_vp: "Victory Point",
    devd_knight: "Move the robber and steal a card.",
    devd_road: "Place 2 roads for free.",
    devd_plenty: "Take any 2 resources from the bank.",
    devd_monopoly: "Name a resource; take everyone's of it.",
    devd_vp: "Worth 1 point. Kept hidden.",
    res_wood: "Wood", res_brick: "Brick", res_sheep: "Sheep", res_wheat: "Wheat", res_ore: "Ore",
    c0: "Red", c1: "Blue", c2: "Orange", c3: "White",
    log_setup_settle: "{name} placed a settlement.",
    log_setup_road: "{name} placed a road.",
    log_setup_prompt: "{name}, place a settlement.",
    log_setup_first: "Place your first settlements.",
    log_setup_done: "Setup complete. {name} to roll.",
    log_roll: "{name} rolled {sum} ({d1}+{d2}).",
    log_robber_discard: "Robber! Players with 8+ cards discard half.",
    log_move_robber: "Move the robber.",
    log_discarded: "{name} discarded {count} cards.",
    log_robber_nosteal: "Robber moved. No one to steal from.",
    log_stole: "{name} stole from {victim}.",
    log_nothing_steal: "Nothing to steal.",
    log_built_road: "{name} built a road.",
    log_built_settle: "{name} built a settlement.",
    log_built_city: "{name} upgraded to a city.",
    log_bought_dev: "{name} bought a development card.",
    log_played_dev: "{name} played {card}.",
    log_plenty: "{name} took {resList}.",
    log_monopoly: "{name} monopolized {res} (+{count}).",
    log_bank: "{name} traded 4 {give} → 1 {get}.",
    log_next: "{name}'s turn.",
    log_wins: "{name} wins!",
  },
};

function fmt(str, p) {
  if (!p) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (p[k] !== undefined ? p[k] : `{${k}}`));
}
function tr(lang, key, p) {
  const s = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
  return fmt(s, p);
}
const resLabel = (lang, r) => tr(lang, `res_${r}`);
const devLabel = (lang, card) => tr(lang, `dev_${card}`);
const devDesc  = (lang, card) => tr(lang, `devd_${card}`);
const colorName = (lang, i) => tr(lang, `c${i}`);

function logText(lang, e) {
  const p = { ...(e.p || {}) };
  if (typeof p.name === "number") p.name = colorName(lang, p.name);
  if (typeof p.victim === "number") p.victim = colorName(lang, p.victim);
  if (p.give && RES.includes(p.give)) p.give = resLabel(lang, p.give);
  if (p.get && RES.includes(p.get)) p.get = resLabel(lang, p.get);
  if (p.res && RES.includes(p.res)) p.res = resLabel(lang, p.res);
  if (Array.isArray(p.resList)) p.resList = p.resList.map((r) => resLabel(lang, r)).join(" & ");
  return tr(lang, e.k, p);
}

/* ---------- utilities ---------- */
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const emptyRes = () => ({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
const totalCards = (r) => RES.reduce((s, k) => s + r[k], 0);
const canAfford = (r, cost) => Object.entries(cost).every(([k, v]) => r[k] >= v);
const pay = (r, cost) => {
  const n = { ...r };
  for (const [k, v] of Object.entries(cost)) n[k] -= v;
  return n;
};

/* ---------- board geometry ---------- */
function buildBoard() {
  const hSpacing = SQRT3 * SIZE;
  const vSpacing = 1.5 * SIZE;
  const centers = [];
  ROWS.forEach((count, r) => {
    const y = r * vSpacing;
    const rowWidth = (count - 1) * hSpacing;
    for (let i = 0; i < count; i++) centers.push({ x: i * hSpacing - rowWidth / 2, y });
  });

  const corner = (cx, cy, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return { x: cx + SIZE * Math.cos(a), y: cy + SIZE * Math.sin(a) };
  };

  const vmap = new Map();
  const vertices = [];
  const vid = (p) => {
    const key = `${Math.round(p.x)},${Math.round(p.y)}`;
    if (vmap.has(key)) return vmap.get(key);
    const id = vertices.length;
    vertices.push({ id, x: p.x, y: p.y, hexes: [], edges: [], adj: [] });
    vmap.set(key, id);
    return id;
  };

  const hexes = centers.map((c, hi) => {
    const vs = [];
    for (let i = 0; i < 6; i++) vs.push(vid(corner(c.x, c.y, i)));
    return { id: hi, x: c.x, y: c.y, vertices: vs };
  });
  hexes.forEach((h) =>
    h.vertices.forEach((v) => { if (!vertices[v].hexes.includes(h.id)) vertices[v].hexes.push(h.id); })
  );

  const emap = new Map();
  const edges = [];
  const eid = (a, b) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (emap.has(key)) return emap.get(key);
    const id = edges.length;
    const va = vertices[a], vb = vertices[b];
    edges.push({ id, v1: a, v2: b, x: (va.x + vb.x) / 2, y: (va.y + vb.y) / 2 });
    emap.set(key, id);
    return id;
  };
  hexes.forEach((h) => {
    for (let i = 0; i < 6; i++) {
      const a = h.vertices[i], b = h.vertices[(i + 1) % 6];
      const e = eid(a, b);
      if (!vertices[a].edges.includes(e)) vertices[a].edges.push(e);
      if (!vertices[b].edges.includes(e)) vertices[b].edges.push(e);
    }
  });
  edges.forEach((e) => {
    if (!vertices[e.v1].adj.includes(e.v2)) vertices[e.v1].adj.push(e.v2);
    if (!vertices[e.v2].adj.includes(e.v1)) vertices[e.v2].adj.push(e.v1);
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  vertices.forEach((v) => {
    minX = Math.min(minX, v.x); minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y);
  });
  return { hexes, vertices, edges, bounds: { minX, minY, maxX, maxY } };
}

function assignTiles() {
  const pool = shuffle([
    ...Array(4).fill("wood"),
    ...Array(3).fill("brick"),
    ...Array(4).fill("sheep"),
    ...Array(4).fill("wheat"),
    ...Array(3).fill("ore"),
    "desert",
  ]);
  const tokens = shuffle([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]);
  let ti = 0;
  return pool.map((res) => ({ resource: res, number: res === "desert" ? null : tokens[ti++] }));
}

// Almanach: 14 Ritter, 6 Fortschritt (2× Straßenbau, 2× Erfindung, 2× Monopol), 5 Siegpunkte = 25
function buildDevDeck() {
  return shuffle([
    ...Array(14).fill("knight"),
    ...Array(5).fill("vp"),
    ...Array(2).fill("road"),
    ...Array(2).fill("plenty"),
    ...Array(2).fill("monopoly"),
  ]);
}

/* ---------- rules helpers ---------- */
function distanceOK(vertexId, buildings, board) {
  if (buildings[vertexId]) return false;
  return board.vertices[vertexId].adj.every((a) => !buildings[a]);
}
function settlementLegal(vertexId, player, buildings, roads, board, setup) {
  if (!distanceOK(vertexId, buildings, board)) return false;
  if (setup) return true;
  return board.vertices[vertexId].edges.some((e) => roads[e]?.owner === player);
}
function roadLegal(edgeId, player, buildings, roads, board, restrictVertex = null) {
  if (roads[edgeId]) return false;
  const e = board.edges[edgeId];
  if (restrictVertex !== null) return e.v1 === restrictVertex || e.v2 === restrictVertex;
  return [e.v1, e.v2].some((w) => {
    const b = buildings[w];
    if (b && b.owner === player) return true;
    if (b && b.owner !== player) return false; // opponent building blocks extension through here
    return board.vertices[w].edges.some((oe) => roads[oe]?.owner === player);
  });
}
function longestRoad(player, roads, board, buildings) {
  const owned = board.edges.filter((e) => roads[e.id]?.owner === player);
  if (owned.length === 0) return 0;
  const inc = {};
  owned.forEach((e) => {
    (inc[e.v1] = inc[e.v1] || []).push(e);
    (inc[e.v2] = inc[e.v2] || []).push(e);
  });
  const blocked = (v) => buildings[v] && buildings[v].owner !== player; // only opponents break a road
  let best = 0;
  const dfs = (vertex, used) => {
    if (used.size > 0 && blocked(vertex)) { best = Math.max(best, used.size); return; }
    (inc[vertex] || []).forEach((e) => {
      if (used.has(e.id)) return;
      const next = e.v1 === vertex ? e.v2 : e.v1;
      used.add(e.id); dfs(next, used); used.delete(e.id);
    });
    best = Math.max(best, used.size);
  };
  Object.keys(inc).forEach((v) => dfs(Number(v), new Set()));
  return best;
}

const countRoads = (state, pi) => Object.values(state.roads).filter((r) => r.owner === pi).length;
const countType = (state, pi, type) =>
  Object.values(state.buildings).filter((b) => b.owner === pi && b.type === type).length;

/* ---------- victory points ---------- */
function publicVP(pi, state) {
  let vp = 0;
  Object.values(state.buildings).forEach((b) => { if (b.owner === pi) vp += b.type === "city" ? 2 : 1; });
  if (state.longestRoadOwner === pi) vp += 2;
  if (state.largestArmyOwner === pi) vp += 2;
  return vp;
}
const fullVP = (pi, state) => publicVP(pi, state) + state.players[pi].vpCards;

/* ---------- award recalculation (Almanach-faithful) ---------- */
function recomputeAwards(state) {
  // Longest Road: needs >=5; holder keeps on ties; a break that creates a tie among challengers sets the card aside.
  const lengths = state.players.map((_, pi) => longestRoad(pi, state.roads, state.board, state.buildings));
  const max = Math.max(...lengths, 0);
  let owner = state.longestRoadOwner;
  if (max < 5) owner = null;
  else if (owner !== null && lengths[owner] === max) { /* holder retains */ }
  else {
    const leaders = lengths.map((l, i) => (l === max ? i : -1)).filter((i) => i >= 0);
    owner = leaders.length === 1 ? leaders[0] : null;
  }
  state.longestRoadOwner = owner;
  state.longestRoadLength = owner === null ? 0 : lengths[owner];

  // Largest Army: needs >=3; taken only by strictly more knights.
  const knights = state.players.map((p) => p.knights);
  const aMax = Math.max(...knights, 0);
  let aOwner = state.largestArmyOwner;
  if (aMax < 3) aOwner = null;
  else if (aOwner !== null && knights[aOwner] === aMax) { /* holder retains */ }
  else {
    const aLeaders = knights.map((k, i) => (k === aMax ? i : -1)).filter((i) => i >= 0);
    aOwner = aLeaders.length === 1 ? aLeaders[0] : null;
  }
  state.largestArmyOwner = aOwner;
  state.largestArmySize = aOwner === null ? 0 : knights[aOwner];
  return state;
}

/* ---------- initial state ---------- */
function freshGame(numPlayers) {
  const board = buildBoard();
  const tiles = assignTiles();
  const robberHex = tiles.findIndex((t) => t.resource === "desert");
  const players = Array.from({ length: numPlayers }, (_, i) => ({
    id: i, res: emptyRes(), dev: [], newDev: [], vpCards: 0, knights: 0, playedDevThisTurn: false,
  }));
  const order = [];
  for (let i = 0; i < numPlayers; i++) order.push(i);
  for (let i = numPlayers - 1; i >= 0; i--) order.push(i);

  return {
    phase: "setup",
    board, tiles, robberHex, players,
    buildings: {}, roads: {},
    current: order[0],
    devDeck: buildDevDeck(),
    setup: { order, idx: 0, placing: "settlement", lastSettlement: null },
    turn: null, uiMode: null, pending: null,
    longestRoadOwner: null, longestRoadLength: 0,
    largestArmyOwner: null, largestArmySize: 0,
    winner: null,
    log: [{ k: "log_setup_first" }],
  };
}
function pushLog(state, k, p) {
  state.log = [{ k, p }, ...state.log].slice(0, 7);
}

/* ---------- reducer ---------- */
function reducer(state, action) {
  switch (action.type) {
    case "NEW_GAME":
      return freshGame(action.numPlayers);

    case "SETUP_SETTLEMENT": {
      const s = cloneState(state);
      const v = action.vertexId;
      const pi = s.setup.order[s.setup.idx];
      s.buildings[v] = { owner: pi, type: "settlement" };
      const secondRound = s.setup.idx >= s.players.length;
      if (secondRound) {
        s.board.vertices[v].hexes.forEach((hi) => {
          const t = s.tiles[hi];
          if (t.resource !== "desert") s.players[pi].res[t.resource] += 1;
        });
      }
      s.setup.placing = "road";
      s.setup.lastSettlement = v;
      pushLog(s, "log_setup_settle", { name: pi });
      return s;
    }
    case "SETUP_ROAD": {
      const s = cloneState(state);
      const pi = s.setup.order[s.setup.idx];
      s.roads[action.edgeId] = { owner: pi };
      pushLog(s, "log_setup_road", { name: pi });
      s.setup.idx += 1;
      if (s.setup.idx >= s.setup.order.length) {
        s.phase = "play";
        s.current = s.setup.order[s.setup.order.length - 1];
        s.setup = null;
        s.turn = { rolled: false, dice: null };
        recomputeAwards(s);
        pushLog(s, "log_setup_done", { name: s.current });
      } else {
        s.setup.placing = "settlement";
        s.setup.lastSettlement = null;
        pushLog(s, "log_setup_prompt", { name: s.setup.order[s.setup.idx] });
      }
      return s;
    }

    case "ROLL": {
      const s = cloneState(state);
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      const sum = d1 + d2;
      s.turn = { ...s.turn, rolled: true, dice: [d1, d2] };
      pushLog(s, "log_roll", { name: s.current, sum, d1, d2 });
      if (sum === 7) {
        const queue = [];
        s.players.forEach((p, pi) => {
          const n = totalCards(p.res);
          if (n > 7) queue.push({ pi, count: Math.floor(n / 2) });
        });
        if (queue.length > 0) {
          s.pending = { type: "discard", queue, qi: 0 };
          pushLog(s, "log_robber_discard");
        } else {
          s.uiMode = "moveRobber";
          s.pending = { type: "robber", source: "roll" };
          pushLog(s, "log_move_robber");
        }
      } else {
        s.tiles.forEach((t, hi) => {
          if (t.number !== sum || hi === s.robberHex) return;
          s.board.hexes[hi].vertices.forEach((v) => {
            const b = s.buildings[v];
            if (b) s.players[b.owner].res[t.resource] += b.type === "city" ? 2 : 1;
          });
        });
      }
      return s;
    }

    case "DISCARD": {
      const s = cloneState(state);
      const cur = s.pending.queue[s.pending.qi];
      s.players[cur.pi].res = action.res;
      pushLog(s, "log_discarded", { name: cur.pi, count: cur.count });
      s.pending.qi += 1;
      if (s.pending.qi >= s.pending.queue.length) {
        s.pending = { type: "robber", source: "roll" };
        s.uiMode = "moveRobber";
        pushLog(s, "log_move_robber");
      }
      return s;
    }

    case "MOVE_ROBBER": {
      const s = cloneState(state);
      s.robberHex = action.hexId;
      const victims = new Set();
      s.board.hexes[action.hexId].vertices.forEach((v) => {
        const b = s.buildings[v];
        if (b && b.owner !== s.current && totalCards(s.players[b.owner].res) > 0) victims.add(b.owner);
      });
      const list = [...victims];
      s.uiMode = null;
      if (list.length === 0) { s.pending = null; pushLog(s, "log_robber_nosteal"); }
      else if (list.length === 1) { stealFrom(s, list[0]); s.pending = null; }
      else s.pending = { type: "steal", candidates: list };
      return s;
    }
    case "STEAL": {
      const s = cloneState(state);
      stealFrom(s, action.from);
      s.pending = null;
      return s;
    }

    case "SET_MODE": {
      const s = cloneState(state);
      s.uiMode = s.uiMode === action.mode ? null : action.mode;
      return s;
    }

    case "BUILD_ROAD": {
      const s = cloneState(state);
      const p = s.players[s.current];
      const free = s.pending?.type === "roadbuilding";
      if (countRoads(s, s.current) >= PIECE.road) return state; // supply check
      if (!free) {
        if (!canAfford(p.res, COSTS.road)) return state;
        p.res = pay(p.res, COSTS.road);
      }
      s.roads[action.edgeId] = { owner: s.current };
      pushLog(s, "log_built_road", { name: s.current });
      recomputeAwards(s);
      if (free) {
        s.pending.left -= 1;
        const anyLegal =
          countRoads(s, s.current) < PIECE.road &&
          s.board.edges.some((e) => roadLegal(e.id, s.current, s.buildings, s.roads, s.board));
        if (s.pending.left <= 0 || !anyLegal) { s.pending = null; s.uiMode = null; }
      }
      checkWin(s);
      return s;
    }

    case "BUILD_SETTLEMENT": {
      const s = cloneState(state);
      const p = s.players[s.current];
      if (countType(s, s.current, "settlement") >= PIECE.settlement) return state;
      if (!canAfford(p.res, COSTS.settlement)) return state;
      p.res = pay(p.res, COSTS.settlement);
      s.buildings[action.vertexId] = { owner: s.current, type: "settlement" };
      s.uiMode = null;
      pushLog(s, "log_built_settle", { name: s.current });
      recomputeAwards(s); // an opponent's new settlement may break a longest road
      checkWin(s);
      return s;
    }

    case "BUILD_CITY": {
      const s = cloneState(state);
      const p = s.players[s.current];
      if (countType(s, s.current, "city") >= PIECE.city) return state;
      if (!canAfford(p.res, COSTS.city)) return state;
      p.res = pay(p.res, COSTS.city);
      // upgrading frees the settlement back to supply (type change handles the count)
      s.buildings[action.vertexId] = { owner: s.current, type: "city" };
      s.uiMode = null;
      pushLog(s, "log_built_city", { name: s.current });
      checkWin(s);
      return s;
    }

    case "BUY_DEV": {
      const s = cloneState(state);
      const p = s.players[s.current];
      if (!canAfford(p.res, COSTS.dev) || s.devDeck.length === 0) return state;
      p.res = pay(p.res, COSTS.dev);
      const card = s.devDeck.shift();
      if (card === "vp") p.vpCards += 1; else p.newDev.push(card);
      pushLog(s, "log_bought_dev", { name: s.current });
      checkWin(s); // a VP card can clinch 10 the moment it is bought
      return s;
    }

    case "PLAY_DEV": {
      const s = cloneState(state);
      const p = s.players[s.current];
      if (p.playedDevThisTurn) return state; // one dev card per turn
      const idx = p.dev.indexOf(action.card);
      if (idx === -1) return state;
      p.dev.splice(idx, 1);
      p.playedDevThisTurn = true;
      s.uiMode = null;
      pushLog(s, "log_played_dev", { name: s.current, card: action.card });
      if (action.card === "knight") {
        p.knights += 1;
        recomputeAwards(s);
        s.uiMode = "moveRobber";
        s.pending = { type: "robber", source: "knight" };
        checkWin(s);
      } else if (action.card === "road") {
        s.pending = { type: "roadbuilding", left: 2 };
        s.uiMode = "road";
      } else if (action.card === "plenty") {
        s.pending = { type: "plenty" };
      } else if (action.card === "monopoly") {
        s.pending = { type: "monopoly" };
      }
      return s;
    }

    case "PLENTY_PICK": {
      const s = cloneState(state);
      const p = s.players[s.current];
      action.picks.forEach((r) => (p.res[r] += 1));
      s.pending = null;
      pushLog(s, "log_plenty", { name: s.current, resList: action.picks });
      return s;
    }
    case "MONOPOLY_PICK": {
      const s = cloneState(state);
      const p = s.players[s.current];
      let taken = 0;
      s.players.forEach((q, qi) => { if (qi === s.current) return; taken += q.res[action.res]; q.res[action.res] = 0; });
      p.res[action.res] += taken;
      s.pending = null;
      pushLog(s, "log_monopoly", { name: s.current, res: action.res, count: taken });
      return s;
    }

    case "BANK_TRADE": {
      const s = cloneState(state);
      const p = s.players[s.current];
      if (p.res[action.give] < 4 || action.give === action.get) return state;
      p.res[action.give] -= 4;
      p.res[action.get] += 1;
      pushLog(s, "log_bank", { name: s.current, give: action.give, get: action.get });
      return s;
    }

    case "END_TURN": {
      const s = cloneState(state);
      const p = s.players[s.current];
      p.dev = [...p.dev, ...p.newDev];
      p.newDev = [];
      p.playedDevThisTurn = false;
      s.current = (s.current + 1) % s.players.length;
      s.turn = { rolled: false, dice: null };
      s.uiMode = null; s.pending = null;
      pushLog(s, "log_next", { name: s.current });
      return s;
    }

    default:
      return state;
  }
}

function cloneState(state) {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, res: { ...p.res }, dev: [...p.dev], newDev: [...p.newDev] })),
    buildings: { ...state.buildings },
    roads: { ...state.roads },
    devDeck: [...state.devDeck],
    setup: state.setup ? { ...state.setup } : null,
    turn: state.turn ? { ...state.turn } : null,
    pending: state.pending ? { ...state.pending } : null,
    log: [...state.log],
  };
}
function stealFrom(s, victimPi) {
  const victim = s.players[victimPi];
  const pool = [];
  RES.forEach((r) => { for (let i = 0; i < victim.res[r]; i++) pool.push(r); });
  if (pool.length === 0) { pushLog(s, "log_nothing_steal"); return; }
  const r = pool[Math.floor(Math.random() * pool.length)];
  victim.res[r] -= 1;
  s.players[s.current].res[r] += 1;
  pushLog(s, "log_stole", { name: s.current, victim: victimPi });
}
function checkWin(s) {
  if (fullVP(s.current, s) >= 10) { s.winner = s.current; s.phase = "gameover"; pushLog(s, "log_wins", { name: s.current }); }
}

/* ============================================================
   COMPONENTS
   ============================================================ */
export default function CatanGame() {
  const [state, dispatch] = useReducer(reducer, null);
  const [lang, setLang] = useState("de");
  const t = (k, p) => tr(lang, k, p);

  if (!state)
    return <StartScreen lang={lang} setLang={setLang} t={t} onStart={(n) => dispatch({ type: "NEW_GAME", numPlayers: n })} />;

  return (
    <div className="w-full min-h-screen text-[#2a2620]"
      style={{ background: "radial-gradient(circle at 50% 0%, #cfe3ee 0%, #a9cbdf 45%, #7fb0cd 100%)", fontFamily: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif" }}>
      <FontStyles />
      <div className="max-w-6xl mx-auto px-3 py-4">
        <Header state={state} lang={lang} setLang={setLang} t={t} onNew={() => dispatch({ type: "NEW_GAME", numPlayers: state.players.length })} />
        <div className="flex flex-col lg:flex-row gap-4 mt-3">
          <div className="flex-1 min-w-0"><Board state={state} dispatch={dispatch} /></div>
          <Sidebar state={state} dispatch={dispatch} lang={lang} t={t} />
        </div>
      </div>
      {state.pending?.type === "discard" && <DiscardModal state={state} dispatch={dispatch} lang={lang} t={t} />}
      {state.pending?.type === "steal" && <StealModal state={state} dispatch={dispatch} lang={lang} t={t} />}
      {state.pending?.type === "plenty" && <PlentyModal dispatch={dispatch} t={t} />}
      {state.pending?.type === "monopoly" && <MonopolyModal dispatch={dispatch} lang={lang} t={t} />}
      {state.phase === "gameover" && <WinModal state={state} lang={lang} t={t} onNew={() => dispatch({ type: "NEW_GAME", numPlayers: state.players.length })} />}
    </div>
  );
}

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&display=swap');
      .display { font-family: 'Cinzel','Iowan Old Style',Georgia,serif; }
      .ui { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
      @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
    `}</style>
  );
}

function LangToggle({ lang, setLang, dark }) {
  const base = "ui text-xs font-semibold px-2.5 py-1 rounded-md transition";
  return (
    <div className={`inline-flex gap-1 rounded-lg p-0.5 ${dark ? "bg-black/25" : "bg-[#1f3242]/10"}`}>
      {["de", "en"].map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`${base} ${lang === l ? "bg-[#e2882a] text-white" : dark ? "text-[#9fc0d4] hover:text-white" : "text-[#33526a] hover:bg-white/40"}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function StartScreen({ lang, setLang, t, onStart }) {
  const [n, setN] = useState(3);
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6" style={{ background: "radial-gradient(circle at 50% 30%, #2b4a63, #16242f)" }}>
      <FontStyles />
      <div className="text-center text-[#f3ecda] max-w-md">
        <div className="flex justify-center mb-6"><LangToggle lang={lang} setLang={setLang} dark /></div>
        <div className="text-6xl mb-2">⚓︎</div>
        <h1 className="display text-5xl tracking-[0.25em] mb-1">CATAN</h1>
        <p className="ui text-sm tracking-widest uppercase text-[#9fc0d4] mb-8">{t("subtitle")}</p>
        <p className="ui text-[#cdd9e0] mb-3 text-sm">{t("choose")}</p>
        <div className="flex justify-center gap-3 mb-8">
          {[2, 3, 4].map((k) => (
            <button key={k} onClick={() => setN(k)}
              className={`ui w-14 h-14 rounded-full text-xl font-bold border-2 transition ${n === k ? "bg-[#e2882a] border-[#f3ecda] text-white scale-110" : "bg-transparent border-[#5d7e93] text-[#9fc0d4] hover:border-[#9fc0d4]"}`}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={() => onStart(n)} className="display tracking-widest text-lg px-10 py-3 rounded-lg bg-[#cf3a36] hover:bg-[#b8302c] text-white shadow-lg transition">
          {t("begin")}
        </button>
        <p className="ui text-[11px] text-[#7c98a9] mt-8 leading-relaxed">{t("blurb")}</p>
      </div>
    </div>
  );
}

function Header({ state, lang, setLang, t, onNew }) {
  const c = PLAYER_COLORS[state.current];
  const phaseLabel = state.phase === "setup" ? t("phase_setup") : state.phase === "gameover" ? t("phase_over") : t("phase_play");
  return (
    <div className="flex items-center justify-between gap-3 bg-[#1f3242]/85 text-[#f3ecda] rounded-xl px-4 py-2 shadow">
      <div className="flex items-center gap-3 min-w-0">
        <span className="display text-2xl tracking-[0.2em]">CATAN</span>
        <span className="ui text-xs uppercase tracking-widest text-[#9fc0d4] hidden sm:inline">{phaseLabel}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="ui flex items-center gap-2 text-sm">
          <span className="text-[#9fc0d4] hidden sm:inline">{t("turn")}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full border border-white/40" style={{ background: c.main }} />
            {colorName(lang, state.current)}
          </span>
        </div>
        <LangToggle lang={lang} setLang={setLang} dark />
        <button onClick={onNew} className="ui text-xs px-3 py-1.5 rounded-md bg-[#33526a] hover:bg-[#3e637e]">{t("new_game")}</button>
      </div>
    </div>
  );
}

/* ---------- board ---------- */
function Board({ state, dispatch }) {
  const { board, tiles } = state;
  const pad = 46;
  const vb = {
    x: board.bounds.minX - pad, y: board.bounds.minY - pad,
    w: board.bounds.maxX - board.bounds.minX + pad * 2, h: board.bounds.maxY - board.bounds.minY + pad * 2,
  };
  const me = state.current;
  const mode = state.uiMode;
  const setup = state.setup;

  const legalVerts = useMemo(() => {
    const out = new Set();
    if (state.phase === "setup" && setup?.placing === "settlement")
      board.vertices.forEach((v) => { if (settlementLegal(v.id, setup.order[setup.idx], state.buildings, state.roads, board, true)) out.add(v.id); });
    else if (mode === "settlement" && countType(state, me, "settlement") < PIECE.settlement)
      board.vertices.forEach((v) => { if (settlementLegal(v.id, me, state.buildings, state.roads, board, false)) out.add(v.id); });
    else if (mode === "city" && countType(state, me, "city") < PIECE.city)
      Object.entries(state.buildings).forEach(([v, b]) => { if (b.owner === me && b.type === "settlement") out.add(Number(v)); });
    return out;
  }, [state, mode, setup]);

  const legalEdges = useMemo(() => {
    const out = new Set();
    const canRoad = countRoads(state, state.phase === "setup" ? setup?.order[setup?.idx] : me) < PIECE.road;
    if (!canRoad) return out;
    if (state.phase === "setup" && setup?.placing === "road")
      board.edges.forEach((e) => { if (roadLegal(e.id, setup.order[setup.idx], state.buildings, state.roads, board, setup.lastSettlement)) out.add(e.id); });
    else if (mode === "road")
      board.edges.forEach((e) => { if (roadLegal(e.id, me, state.buildings, state.roads, board)) out.add(e.id); });
    return out;
  }, [state, mode, setup]);

  const moveRobber = state.uiMode === "moveRobber";

  const clickVertex = (v) => {
    if (state.phase === "setup" && setup.placing === "settlement" && legalVerts.has(v)) dispatch({ type: "SETUP_SETTLEMENT", vertexId: v });
    else if (mode === "settlement" && legalVerts.has(v)) dispatch({ type: "BUILD_SETTLEMENT", vertexId: v });
    else if (mode === "city" && legalVerts.has(v)) dispatch({ type: "BUILD_CITY", vertexId: v });
  };
  const clickEdge = (e) => {
    if (state.phase === "setup" && setup.placing === "road" && legalEdges.has(e)) dispatch({ type: "SETUP_ROAD", edgeId: e });
    else if (mode === "road" && legalEdges.has(e)) dispatch({ type: "BUILD_ROAD", edgeId: e });
  };

  return (
    <div className="bg-[#2a6f97] rounded-2xl p-2 shadow-inner" style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,.35)" }}>
      <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className="w-full h-auto select-none" style={{ display: "block" }}>
        {board.hexes.map((h) => {
          const t = tiles[h.id];
          const pts = h.vertices.map((vi) => `${board.vertices[vi].x},${board.vertices[vi].y}`).join(" ");
          const robberClickable = moveRobber && h.id !== state.robberHex;
          return (
            <g key={`h${h.id}`} onClick={() => robberClickable && dispatch({ type: "MOVE_ROBBER", hexId: h.id })} style={{ cursor: robberClickable ? "pointer" : "default" }}>
              <polygon points={pts} fill={RES_META[t.resource].tile} stroke="#244e36" strokeWidth="3" strokeLinejoin="round" />
              <polygon points={pts} fill="none" stroke={robberClickable ? "#ffe08a" : "transparent"} strokeWidth="4" strokeLinejoin="round" />
              <text x={h.x} y={h.y - SIZE * 0.42} textAnchor="middle" fontSize="20" opacity="0.9">{RES_META[t.resource].icon}</text>
              {t.number !== null && (
                <g>
                  <circle cx={h.x} cy={h.y + 6} r="16" fill={RES_META[t.resource].token} stroke="#7a6a45" strokeWidth="1.2" />
                  <text x={h.x} y={h.y + 12} textAnchor="middle" fontSize="17" fontWeight="700"
                    fill={t.number === 6 || t.number === 8 ? "#c0392b" : "#3a3024"} style={{ fontFamily: "Georgia,serif" }}>{t.number}</text>
                  <text x={h.x} y={h.y + 24} textAnchor="middle" fontSize="7" fill={t.number === 6 || t.number === 8 ? "#c0392b" : "#7a6a45"} letterSpacing="1">{pips(t.number)}</text>
                </g>
              )}
            </g>
          );
        })}

        {state.robberHex >= 0 && (() => {
          const h = board.hexes[state.robberHex];
          return <g key="robber" transform={`translate(${h.x - 20},${h.y - 4})`} pointerEvents="none">
            <ellipse cx="0" cy="14" rx="8" ry="3" fill="rgba(0,0,0,.3)" />
            <path d="M0,-12 C6,-12 7,-4 5,2 L7,14 L-7,14 L-5,2 C-7,-4 -6,-12 0,-12 Z" fill="#2c2c2c" stroke="#000" strokeWidth="0.8" />
            <circle cx="0" cy="-12" r="5" fill="#2c2c2c" stroke="#000" strokeWidth="0.8" />
          </g>;
        })()}

        {Object.entries(state.roads).map(([eid, r]) => {
          const e = board.edges[eid]; const va = board.vertices[e.v1], vb2 = board.vertices[e.v2];
          return <line key={`r${eid}`} x1={va.x} y1={va.y} x2={vb2.x} y2={vb2.y} stroke={PLAYER_COLORS[r.owner].main} strokeWidth="9" strokeLinecap="round" />;
        })}
        {[...legalEdges].map((eid) => {
          const e = board.edges[eid];
          return <line key={`le${eid}`} x1={board.vertices[e.v1].x} y1={board.vertices[e.v1].y} x2={board.vertices[e.v2].x} y2={board.vertices[e.v2].y}
            stroke="#fff7d6" strokeWidth="9" strokeLinecap="round" opacity="0.55" style={{ cursor: "pointer" }} onClick={() => clickEdge(eid)}>
            <animate attributeName="opacity" values="0.3;0.75;0.3" dur="1.4s" repeatCount="indefinite" />
          </line>;
        })}

        {Object.entries(state.buildings).map(([vid, b]) => {
          const v = board.vertices[vid]; const c = PLAYER_COLORS[b.owner];
          return <g key={`b${vid}`} pointerEvents="none">{house(v.x, v.y, b.type === "city" ? 13 : 9, c.main, c.dark)}</g>;
        })}
        {[...legalVerts].map((vid) => {
          const v = board.vertices[vid];
          return <circle key={`lv${vid}`} cx={v.x} cy={v.y} r="9" fill="#fff7d6" stroke="#caa33a" strokeWidth="2" opacity="0.85" style={{ cursor: "pointer" }} onClick={() => clickVertex(vid)}>
            <animate attributeName="r" values="7;10;7" dur="1.3s" repeatCount="indefinite" />
          </circle>;
        })}
      </svg>
    </div>
  );
}

function house(x, y, s, fill, stroke) {
  const d = `M ${x - s} ${y + s} L ${x - s} ${y - s * 0.25} L ${x} ${y - s} L ${x + s} ${y - s * 0.25} L ${x + s} ${y + s} Z`;
  return <>
    <path d={d} fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    {s > 11 && <circle cx={x} cy={y + s * 0.15} r={s * 0.28} fill={stroke} opacity="0.5" />}
  </>;
}
function pips(n) {
  const map = { 2: "•", 12: "•", 3: "••", 11: "••", 4: "•••", 10: "•••", 5: "••••", 9: "••••", 6: "•••••", 8: "•••••" };
  return map[n] || "";
}

/* ---------- sidebar ---------- */
function Sidebar({ state, dispatch, lang, t }) {
  const me = state.current;
  const p = state.players[me];
  const c = PLAYER_COLORS[me];
  const isSetup = state.phase === "setup";
  const blocking = !!state.pending && state.pending.type !== "robber";
  const mustRobber = state.uiMode === "moveRobber";
  const canAct = state.phase === "play" && !blocking && !mustRobber;
  const rolled = state.turn?.rolled;
  const canBuild = canAct && rolled;
  const canPlayDev = canAct && !p.playedDevThisTurn; // dev cards may be played before rolling (Almanach)

  const roadsLeft = PIECE.road - countRoads(state, me);
  const settLeft = PIECE.settlement - countType(state, me, "settlement");
  const cityLeft = PIECE.city - countType(state, me, "city");

  return (
    <div className="ui w-full lg:w-[320px] shrink-0 space-y-3">
      <div className="rounded-xl shadow bg-[#f3ecda] overflow-hidden">
        <div className="px-4 py-2 flex items-center justify-between" style={{ background: c.main, color: c.text }}>
          <span className="font-bold tracking-wide flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-white/70" /> {colorName(lang, me)}</span>
          <span className="text-sm font-semibold">{fullVP(me, state)} / 10 ★</span>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {RES.map((r) => (
              <div key={r} className="text-center rounded-md py-1.5" style={{ background: RES_META[r].token }} title={resLabel(lang, r)}>
                <div className="text-lg leading-none">{RES_META[r].icon}</div>
                <div className="font-bold text-sm">{p.res[r]}</div>
              </div>
            ))}
          </div>

          {/* piece supply */}
          <div className="flex items-center justify-between text-[11px] text-[#7a6e52] mb-3 px-1">
            <span className="uppercase tracking-widest text-[10px] text-[#8a7d5e]">{t("supply")}</span>
            <span className="flex gap-2.5">
              <span title={t("b_road")}>🛤️ {roadsLeft}</span>
              <span title={t("b_settlement")}>🏠 {settLeft}</span>
              <span title={t("b_city")}>🏛️ {cityLeft}</span>
            </span>
          </div>

          {(p.dev.length > 0 || p.newDev.length > 0 || p.vpCards > 0) && (
            <div className="mb-3">
              <div className="text-[11px] uppercase tracking-widest text-[#8a7d5e] mb-1">{t("dev_cards")}</div>
              <div className="flex flex-wrap gap-1.5">
                {p.dev.map((d, i) => (
                  <button key={`d${i}`} disabled={!canPlayDev} onClick={() => dispatch({ type: "PLAY_DEV", card: d })} title={devDesc(lang, d)}
                    className="text-[11px] px-2 py-1 rounded bg-[#33526a] text-[#f3ecda] disabled:opacity-40 hover:bg-[#3e637e]">{devLabel(lang, d)}</button>
                ))}
                {p.newDev.map((d, i) => (
                  <span key={`nd${i}`} title={t("tip_newdev")} className="text-[11px] px-2 py-1 rounded bg-[#9a9484]/40 text-[#5a523f]">{devLabel(lang, d)} {t("new_suffix")}</span>
                ))}
                {p.vpCards > 0 && <span className="text-[11px] px-2 py-1 rounded bg-[#caa33a]/30 text-[#7a5e12]">{t("vp_card")}{p.vpCards}</span>}
              </div>
            </div>
          )}

          {isSetup ? (
            <div className="text-sm text-[#5a523f] bg-[#e6dcc2] rounded-md p-2">
              {t("place_a")} <b>{state.setup.placing === "settlement" ? t("s_settlement") : t("s_road")}</b> {t("on_board")}
            </div>
          ) : mustRobber ? (
            <div className="text-sm text-[#5a523f] bg-[#e6dcc2] rounded-md p-2">{t("click_robber")}</div>
          ) : (
            <div className="space-y-2">
              {state.pending?.type === "roadbuilding" && (
                <div className="text-xs text-[#7a5e12] bg-[#caa33a]/25 rounded-md p-2">{t("rb_hint")} ({state.pending.left})</div>
              )}
              {!rolled ? (
                <button onClick={() => dispatch({ type: "ROLL" })} disabled={!canAct}
                  className="w-full py-2.5 rounded-lg bg-[#cf3a36] hover:bg-[#b8302c] text-white font-semibold tracking-wide shadow disabled:opacity-50">{t("roll")}</button>
              ) : <DiceRow dice={state.turn.dice} />}

              <div className="grid grid-cols-2 gap-2">
                <BuildBtn label={t("b_road")} cost={COSTS.road} active={state.uiMode === "road"}
                  enabled={canBuild && canAfford(p.res, COSTS.road) && roadsLeft > 0}
                  onClick={() => dispatch({ type: "SET_MODE", mode: "road" })} />
                <BuildBtn label={t("b_settlement")} cost={COSTS.settlement} active={state.uiMode === "settlement"}
                  enabled={canBuild && canAfford(p.res, COSTS.settlement) && settLeft > 0}
                  onClick={() => dispatch({ type: "SET_MODE", mode: "settlement" })} />
                <BuildBtn label={t("b_city")} cost={COSTS.city} active={state.uiMode === "city"}
                  enabled={canBuild && canAfford(p.res, COSTS.city) && cityLeft > 0 && countType(state, me, "settlement") > 0}
                  onClick={() => dispatch({ type: "SET_MODE", mode: "city" })} />
                <BuildBtn label={t("b_dev")} cost={COSTS.dev} active={false}
                  enabled={canBuild && canAfford(p.res, COSTS.dev) && state.devDeck.length > 0}
                  onClick={() => dispatch({ type: "BUY_DEV" })} />
              </div>

              <BankTrade res={p.res} disabled={!canBuild} lang={lang} t={t}
                onTrade={(give, get) => dispatch({ type: "BANK_TRADE", give, get })} />

              <button disabled={!rolled || !canAct} onClick={() => dispatch({ type: "END_TURN" })}
                className="w-full py-2 rounded-lg bg-[#33526a] hover:bg-[#3e637e] text-[#f3ecda] font-semibold disabled:opacity-40">{t("end_turn")}</button>
            </div>
          )}
        </div>
      </div>

      <Scoreboard state={state} lang={lang} t={t} />

      <div className="rounded-xl bg-[#1f3242]/85 text-[#dfe9ef] p-3 text-[12px] leading-relaxed">
        <div className="uppercase tracking-widest text-[10px] text-[#7f9cae] mb-1">{t("game_log")}</div>
        {state.log.map((l, i) => <div key={i} className={i === 0 ? "text-[#f3ecda]" : "opacity-60"}>{logText(lang, l)}</div>)}
      </div>
    </div>
  );
}

function DiceRow({ dice }) {
  return (
    <div className="flex items-center justify-center gap-3 py-1">
      {dice.map((d, i) => <Die key={i} n={d} />)}
      <span className="text-2xl font-bold text-[#33526a]">= {dice[0] + dice[1]}</span>
    </div>
  );
}
function Die({ n }) {
  const dots = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n];
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-9 h-9 bg-white rounded-md shadow border border-[#d8cfb6] p-1">
      {Array.from({ length: 9 }).map((_, i) => <span key={i} className="flex items-center justify-center">{dots.includes(i) && <span className="w-1.5 h-1.5 rounded-full bg-[#33526a]" />}</span>)}
    </div>
  );
}
function BuildBtn({ label, cost, enabled, active, onClick }) {
  return (
    <button disabled={!enabled} onClick={onClick}
      className={`px-2 py-1.5 rounded-lg text-sm font-semibold transition border ${active ? "bg-[#e2882a] border-[#caa33a] text-white" : enabled ? "bg-[#e6dcc2] border-[#d8cfb6] text-[#3a3024] hover:bg-[#dcceac]" : "bg-[#e6dcc2]/50 border-transparent text-[#9a9484] cursor-not-allowed"}`}>
      <div>{label}</div>
      <div className="text-[10px] font-normal opacity-80">{Object.entries(cost).map(([k, v]) => `${v}${RES_META[k].icon}`).join(" ")}</div>
    </button>
  );
}
function BankTrade({ res, disabled, lang, t, onTrade }) {
  const [give, setGive] = useState("wood");
  const [get, setGet] = useState("ore");
  return (
    <div className="rounded-lg bg-[#e6dcc2] p-2">
      <div className="text-[11px] uppercase tracking-widest text-[#8a7d5e] mb-1">{t("bank_trade")}</div>
      <div className="flex items-center gap-1.5 text-sm">
        <ResSelect value={give} onChange={setGive} lang={lang} />
        <span className="text-[#8a7d5e]">→</span>
        <ResSelect value={get} onChange={setGet} lang={lang} />
        <button disabled={disabled || res[give] < 4 || give === get} onClick={() => onTrade(give, get)}
          className="ml-auto px-2.5 py-1 rounded bg-[#33526a] text-[#f3ecda] text-xs font-semibold disabled:opacity-40">{t("trade")}</button>
      </div>
    </div>
  );
}
function ResSelect({ value, onChange, lang }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-white rounded px-1.5 py-1 text-sm border border-[#d8cfb6]">
      {RES.map((r) => <option key={r} value={r}>{RES_META[r].icon} {resLabel(lang, r)}</option>)}
    </select>
  );
}
function Scoreboard({ state, lang, t }) {
  return (
    <div className="rounded-xl bg-[#f3ecda] p-3 shadow">
      <div className="text-[11px] uppercase tracking-widest text-[#8a7d5e] mb-2">{t("settlers")}</div>
      <div className="space-y-1.5">
        {state.players.map((p, pi) => {
          const c = PLAYER_COLORS[pi];
          return (
            <div key={pi} className={`flex items-center gap-2 text-sm rounded-md px-2 py-1 ${pi === state.current ? "bg-[#e6dcc2]" : ""}`}>
              <span className="w-3 h-3 rounded-full border border-black/20" style={{ background: c.main }} />
              <span className="font-semibold w-14">{colorName(lang, pi)}</span>
              <span className="text-[#5a523f]">{publicVP(pi, state)} ★</span>
              <span className="ml-auto flex items-center gap-2 text-[11px] text-[#7a6e52]">
                <span title={t("tip_hand")}>🂠 {totalCards(p.res)}</span>
                <span title={t("tip_knights")}>⚔ {p.knights}</span>
                {state.longestRoadOwner === pi && <span title={t("tip_lroad")}>🛤️</span>}
                {state.largestArmyOwner === pi && <span title={t("tip_larmy")}>🏰</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- modals ---------- */
function ModalShell({ children, color = "#1f3242" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="ui w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#f3ecda" }}>
        <div className="h-1.5" style={{ background: color }} />
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function DiscardModal({ state, dispatch, lang, t }) {
  const cur = state.pending.queue[state.pending.qi];
  const p = state.players[cur.pi];
  const c = PLAYER_COLORS[cur.pi];
  const [sel, setSel] = useState(emptyRes());
  const selected = totalCards(sel);
  const adj = (r, d) => setSel((s) => ({ ...s, [r]: Math.max(0, Math.min(p.res[r], s[r] + d)) }));
  return (
    <ModalShell color={c.main}>
      <h3 className="display text-xl mb-1" style={{ color: c.main }}>{t("discard_title", { name: colorName(lang, cur.pi) })}</h3>
      <p className="text-sm text-[#5a523f] mb-4">{t("discard_desc", { count: cur.count })}</p>
      <div className="space-y-2 mb-4">
        {RES.map((r) => p.res[r] > 0 && (
          <div key={r} className="flex items-center gap-2">
            <span className="w-28">{RES_META[r].icon} {resLabel(lang, r)}</span>
            <span className="text-xs text-[#8a7d5e] w-14">{t("discard_have")} {p.res[r]}</span>
            <button onClick={() => adj(r, -1)} className="w-7 h-7 rounded bg-[#e6dcc2]">−</button>
            <span className="w-6 text-center font-bold">{sel[r]}</span>
            <button onClick={() => adj(r, 1)} className="w-7 h-7 rounded bg-[#e6dcc2]">+</button>
          </div>
        ))}
      </div>
      <button disabled={selected !== cur.count}
        onClick={() => dispatch({ type: "DISCARD", res: RES.reduce((a, r) => ({ ...a, [r]: p.res[r] - sel[r] }), {}) })}
        className="w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-40" style={{ background: c.main }}>
        {t("discard_btn", { sel: selected, count: cur.count })}
      </button>
    </ModalShell>
  );
}
function StealModal({ state, dispatch, lang, t }) {
  return (
    <ModalShell>
      <h3 className="display text-xl mb-3 text-[#1f3242]">{t("steal_title")}</h3>
      <div className="space-y-2">
        {state.pending.candidates.map((pi) => {
          const c = PLAYER_COLORS[pi];
          return (
            <button key={pi} onClick={() => dispatch({ type: "STEAL", from: pi })}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-white font-semibold" style={{ background: c.main }}>
              <span className="w-3 h-3 rounded-full bg-white/70" />{colorName(lang, pi)}
              <span className="ml-auto text-sm opacity-90">{totalCards(state.players[pi].res)} {t("cards")}</span>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}
function PlentyModal({ dispatch, t }) {
  const [picks, setPicks] = useState([]);
  const toggle = (r) => setPicks((p) => (p.length < 2 ? [...p, r] : p));
  return (
    <ModalShell color="#caa33a">
      <h3 className="display text-xl mb-1 text-[#7a5e12]">{t("plenty_title")}</h3>
      <p className="text-sm text-[#5a523f] mb-3">{t("plenty_desc")}</p>
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {RES.map((r) => <button key={r} onClick={() => toggle(r)} className="rounded-md py-2 text-center" style={{ background: RES_META[r].token }}><div className="text-lg">{RES_META[r].icon}</div></button>)}
      </div>
      <div className="text-sm mb-3 text-[#5a523f]">{t("plenty_picked")} {picks.map((r) => RES_META[r].icon).join(" ") || "—"}
        {picks.length > 0 && <button className="ml-2 text-xs underline" onClick={() => setPicks([])}>{t("plenty_reset")}</button>}</div>
      <button disabled={picks.length !== 2} onClick={() => dispatch({ type: "PLENTY_PICK", picks })}
        className="w-full py-2.5 rounded-lg bg-[#caa33a] text-white font-semibold disabled:opacity-40">{t("plenty_btn")}</button>
    </ModalShell>
  );
}
function MonopolyModal({ dispatch, lang, t }) {
  return (
    <ModalShell color="#cf3a36">
      <h3 className="display text-xl mb-1 text-[#8e221f]">{t("mono_title")}</h3>
      <p className="text-sm text-[#5a523f] mb-3">{t("mono_desc")}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {RES.map((r) => (
          <button key={r} onClick={() => dispatch({ type: "MONOPOLY_PICK", res: r })} className="rounded-md py-3 text-center hover:scale-105 transition" style={{ background: RES_META[r].token }}>
            <div className="text-xl">{RES_META[r].icon}</div><div className="text-[10px] mt-0.5">{resLabel(lang, r)}</div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
function WinModal({ state, lang, t, onNew }) {
  const pi = state.winner; const c = PLAYER_COLORS[pi];
  return (
    <ModalShell color={c.main}>
      <div className="text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h3 className="display text-3xl tracking-wide mb-1" style={{ color: c.main }}>{t("win_title", { name: colorName(lang, pi) })}</h3>
        <p className="text-sm text-[#5a523f] mb-4">{t("win_sub")}</p>
        <button onClick={onNew} className="display tracking-widest px-8 py-2.5 rounded-lg text-white" style={{ background: c.main }}>{t("win_again")}</button>
      </div>
    </ModalShell>
  );
}
