/* App logic – mobile-first, no dependencies */

(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const STORAGE = {
    session: 'nyelvtan_mt_session_v1',
    stats: 'nyelvtan_mt_stats_v2'
  };

  const TOPICS = [
    {key:'teljes_hasonulas', label:'Teljes hasonulás (-val/-vel, kézzel)', short:'Teljes hason.'},
    {key:'reszleges_hasonulas', label:'Részleges hasonulás (zöngésség, kiejtés)', short:'Részleges'},
    {key:'osszeolvadas', label:'Összeolvadás (t/d + j → ty/gy hangzás)', short:'Összeolv.'},
    {key:'egyszerusites', label:'Egyszerűsítés (rosszszal → rosszal)', short:'Egyszerűs.'},
    {key:'hosszusag', label:'Hosszúság / kettőzés (nn, jj, stb.)', short:'Hosszúság'},
    {key:'vegyes', label:'Vegyes (törvény felismerése)', short:'Vegyes'}
  ];

  const normalize = (s) => (s ?? '')
    .toString()
    .trim()
    .replace(/\s+/g,' ')
    .toLowerCase();

  const safeHtml = (s) => (s ?? '').toString()
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');

const stripDiacritics = (s) => normalize(s)
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu,'');

const collapseDoubles = (s) => normalize(s).replace(/([a-záéíóöőúüű])\1+/g,'$1');

function evaluateAnswer(q, user){
  // Returns {score:0|0.5|1, verdict:'ok'|'partial'|'wrong', reason?:string}
  if(q.type==='mcq'){
    const ok = normalize(user) === normalize(q.answer);
    return {score: ok ? 1 : 0, verdict: ok ? 'ok' : 'wrong'};
  }
  if(q.type==='pick'){
    const ok = user === q.answer;
    return {score: ok ? 1 : 0, verdict: ok ? 'ok' : 'wrong'};
  }
  // input
  const accepted = (q.accepted ?? [q.answer]).map(normalize);
  const u = normalize(user);
  if(accepted.includes(u)) return {score:1, verdict:'ok'};

  // Partial 1: only diacritics differ
  const u2 = stripDiacritics(user);
  if(accepted.map(stripDiacritics).includes(u2)){
    return {score:0.5, verdict:'partial', reason:'ékezet'};
  }

  // Partial 2: doubles / kettőzés mismatch (common in assimilation)
  const u3 = collapseDoubles(user);
  if(accepted.map(collapseDoubles).includes(u3)){
    return {score:0.5, verdict:'partial', reason:'kettőzés'};
  }

  return {score:0, verdict:'wrong'};
}


  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const r = crypto.getRandomValues(new Uint32Array(1))[0] / 2**32;
      const j = Math.floor(r*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
function getStats(){
  return loadJSON(STORAGE.stats, {
    bestPct:0, bestScore:0, last:null,
    attemptsById:{}, wrongById:{}, partialById:{},
    wrongByTopic:{}, wrongByReason:{},
    updatedAt: null
  });
}

function saveStats(stats){
  stats.updatedAt = now();
  // persist to localStorage (do NOT call itself)
  saveJSON(STORAGE.stats, stats);
}

function weightedSampleNoReplace(items, weights, k){
  // Efraimidis-Spirakis style: sample by keys = u^(1/w)
  const keyed = items.map((it, idx)=>{
    const w = Math.max(0.0001, weights[idx] ?? 1);
    const u = crypto.getRandomValues(new Uint32Array(1))[0] / 2**32;
    const key = Math.pow(u, 1/w);
    return {it, key};
  });
  keyed.sort((a,b)=>b.key-a.key);
  return keyed.slice(0, k).map(x=>x.it);
}



  function now(){ return Date.now(); }
  function msToClock(ms){
    const s = Math.max(0, Math.floor(ms/1000));
    const m = Math.floor(s/60);
    const r = s%60;
    return `${m}:${String(r).padStart(2,'0')}`;
  }

  function toast(msg){
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>{ el.hidden = true; }, 2200);
  }

  function loadJSON(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw? JSON.parse(raw) : fallback; }
    catch{ return fallback; }
  }
  function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- UI: navigation between views
  const views = {
    home: $('#view-home'),
    practice: $('#view-practice'),
    rules: $('#view-rules'),
    summary: $('#view-summary')
  };

  function showView(name){
    Object.values(views).forEach(v=>v.classList.remove('active'));
    views[name].classList.add('active');
    $$('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.nav===name));
  }

  $$('.navbtn').forEach(btn=>{
    btn.addEventListener('click', () => {
      const name = btn.dataset.nav;
      if(name==='summary') renderSummary();
      showView(name);
    });
  });

  // --- Build topic list
  const topicList = $('#topicList');
  let selectedTopic = null;

  function renderTopics(){
    topicList.innerHTML = '';
    TOPICS.filter(t=>t.key!=='vegyes').forEach(t=>{
      const b = document.createElement('button');
      b.className = 'pill';
      b.type = 'button';
      b.textContent = t.label;
      b.dataset.topic = t.key;
      b.dataset.on = 'false';
      b.addEventListener('click', ()=>{
        $$('.pill[data-topic]', topicList).forEach(x=>x.dataset.on='false');
        b.dataset.on = 'true';
        selectedTopic = t.key;
      });
      topicList.appendChild(b);
    });
  }
  
function populateExamTopicSelect(){
  const sel = $('#examTopicSelect');
  if(!sel) return;
  sel.innerHTML = '';
  TOPICS.filter(t=>t.key!=='vegyes').forEach(t=>{
    const opt = document.createElement('option');
    opt.value = t.key;
    opt.textContent = t.label;
    sel.appendChild(opt);
  });
  // default
  sel.value = TOPICS.find(t=>t.key!=='vegyes')?.key || '';
}

// exam scope UI
const examScopeEl = $('#examScope');
if(examScopeEl){
  examScopeEl.addEventListener('change', ()=>{
    const row = $('#examTopicRow');
    if(row) row.hidden = (getMode()!=='exam') || (examScopeEl.value!=='topic');
    syncModeUI();
  });
}

renderTopics();
  populateExamTopicSelect();

  // --- Mode handling
  const modeRadios = $$('input[name="mode"]');
  const topicCard = $('#topicCard');
  function getMode(){ return modeRadios.find(r=>r.checked)?.value || 'mix'; }
  function syncModeUI(){
    const m = getMode();
    topicCard.style.display = (m==='topic') ? 'block' : 'none';

    const examCard = $('#examCard');
    if(examCard){
      examCard.hidden = (m!=='exam');
      const scope = $('#examScope')?.value ?? 'mixed';
      const row = $('#examTopicRow');
      if(row) row.hidden = !(m==='exam' && scope==='topic');
    }
  }
  modeRadios.forEach(r=>r.addEventListener('change', syncModeUI));
  syncModeUI();

  // --- Session state
  let session = null;
  let timer = null;

  function buildPool({mode, topic, difficulty, adaptive}){
    let pool = window.QUESTIONS.slice();

    // Mode filter
    if(mode==='topic'){
      pool = pool.filter(q => q.topic === topic);
    } else if(mode==='exam'){
      // exam: alapból vegyes (helyesírás fókusz), de ha megadtál témát, akkor csak abból kérdez
      pool = pool.filter(q => q.topic !== 'vegyes');
      if(topic){ pool = pool.filter(q => q.topic === topic); }
    }

    // Difficulty filter: include chosen level + all easier
    const order = ['easy','medium','hard'];
    const idx = order.indexOf(difficulty);
    pool = pool.filter(q => order.indexOf(q.difficulty) <= idx);

      if(!adaptive){
    return shuffle(pool);
  }

  const stats = getStats();
  const weights = pool.map(q=>{
    const wId = (stats.wrongById?.[q.id] ?? 0);
    const wTopic = (stats.wrongByTopic?.[q.topic] ?? 0);
    // base weight: wrong items and wrong topic get more probability
    return 1 + Math.min(6, wId*0.8 + wTopic*0.08);
  });

  // Don't return more than pool size
  return weightedSampleNoReplace(pool, weights, pool.length);
}

  function startNewSession(){
    const mode = getMode();
    const difficulty = $('#difficulty').value;
    const count = parseInt($('#count').value, 10);
    const tts = $('#ttsEnabled').checked;
    const hintEnabled = $('#showHint').checked;

    if(mode==='topic' && !selectedTopic){
  toast('Válassz témakört!');
  return;
}

// Mini témazáró: lehet kevert vagy témakörös
const examScope = (mode==='exam') ? ($('#examScope')?.value ?? 'mixed') : null;
const examTopic = (mode==='exam' && examScope==='topic') ? ($('#examTopicSelect')?.value ?? null) : null;

if(mode==='exam' && examScope==='topic' && !examTopic){
  toast('Válassz témakört a mini témazáróhoz!');
  return;
}

const topic = (mode==='topic') ? selectedTopic : (mode==='exam' && examScope==='topic') ? examTopic : null;
const adaptive = !!$('#adaptiveMode')?.checked;
let pool = buildPool({mode, topic, difficulty, adaptive});

    if(pool.length === 0){
      toast('Nincs elég kérdés ehhez a beállításhoz.');
      return;
    }

    // If requested count > pool, cap it
    const realCount = Math.min(count, pool.length);
    pool = pool.slice(0, realCount);

    session = {
      id: `s_${now()}`,
      createdAt: now(),
      mode,
      topic,
      difficulty,
      count: realCount,
      index: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      answered: [], // {id, ok, user, correct}
      qids: pool.map(q=>q.id),
      settings: {tts, hintEnabled},
      exam: (mode==='exam') ? {durationMs: Number($('#examDuration')?.value ?? 8)*60*1000, startedAt: now(), scope: ($('#examScope')?.value ?? 'mixed'), examTopic: ($('#examTopicSelect')?.value ?? null)} : null
    };

    saveJSON(STORAGE.session, session);
    $('#btnResume').hidden = true;
    showView('practice');
    renderCurrentQuestion();
    startExamTimerIfNeeded();
  }

  function loadSession(){
    const s = loadJSON(STORAGE.session, null);
    if(!s || !Array.isArray(s.qids) || typeof s.index !== 'number') return null;
    // finished session shouldn't be resumable
    if(s.index >= s.qids.length) return null;
    return s;
  }

  function clearSession(){
    localStorage.removeItem(STORAGE.session);
    session = null;
    stopExamTimer();
  }

  function startExamTimerIfNeeded(){
    stopExamTimer();
    if(!session?.exam) return;

    const tick = () => {
      const elapsed = now() - session.exam.startedAt;
      const left = session.exam.durationMs - elapsed;
      $('#kpiTopic').textContent = `Mini témazáró • ${msToClock(left)}`;
      if(left <= 0){
        stopExamTimer();
        toast('Lejárt az idő!');
        finishSession();
      }
    };

    tick();
    timer = setInterval(tick, 250);
  }

  function stopExamTimer(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  // --- Rendering questions
  const qPrompt = $('#qPrompt');
  const qBody = $('#qBody');
  const qMeta = $('#qMeta');
  const feedback = $('#feedback');

  const btnSubmit = $('#btnSubmit');
  const btnNext = $('#btnNext');
  const btnHint = $('#btnHint');
  const btnSpeak = $('#btnSpeak');

  let currentSelection = null; // for mcq & pick

  function getQuestionById(qid){
    return window.QUESTIONS.find(q => q.id === qid);
  }

  function renderHeader(){
    const idx = session.index + 1;
    $('#kpiIndex').textContent = `${idx}/${session.count}`;
    $('#kpiScore').textContent = `Pont: ${session.score}`;

    const topicLabel = session.mode==='mix' ? 'Kevert' :
      (session.mode==='exam' ? 'Mini témazáró' : (TOPICS.find(t=>t.key===session.topic)?.short || 'Téma'));

    if(!session.exam) $('#kpiTopic').textContent = topicLabel;

    const pct = Math.floor((session.index / session.count) * 100);
    $('#progressBar').style.width = `${pct}%`;
  }

  function resetInteraction(){
    currentSelection = null;
    feedback.hidden = true;
    feedback.className = 'feedback';
    btnSubmit.hidden = false;
    btnNext.hidden = true;
  }

  function renderCurrentQuestion(){
    if(!session) return;
    renderHeader();
    resetInteraction();

    const qid = session.qids[session.index];
    const q = getQuestionById(qid);

    if(!q){
      toast('Hiba: hiányzó kérdés.');
      finishSession();
      return;
    }

    qMeta.innerHTML = `${safeHtml(q.topic)} • ${safeHtml(q.difficulty)} • ${safeHtml(q.type)}`;
    qPrompt.innerHTML = q.prompt;

    // Hint & TTS
    btnHint.hidden = !(session.settings.hintEnabled && q.hint);
    btnSpeak.hidden = !session.settings.tts;

    // Body
    qBody.innerHTML = '';

    if(q.type==='input'){
      const inp = document.createElement('input');
      inp.className = 'input';
      inp.id = 'answerInput';
      inp.placeholder = 'Írd ide a választ…';
      inp.autocomplete = 'off';
      inp.autocapitalize = 'none';
      inp.spellcheck = false;
      inp.inputMode = 'text';
      inp.addEventListener('keydown', (e)=>{
        if(e.key==='Enter' && !btnSubmit.hidden) checkAnswer();
        if(e.key==='Enter' && !btnNext.hidden) nextQuestion();
      });
      qBody.appendChild(inp);
      setTimeout(()=>inp.focus(), 50);
    }

    if(q.type==='mcq'){
      const wrap = document.createElement('div');
      wrap.className = 'options';
      shuffle(q.options).forEach(opt => {
        const b = document.createElement('button');
        b.className = 'option';
        b.type = 'button';
        b.textContent = opt;
        b.dataset.selected = 'false';
        b.addEventListener('click', ()=>{
          $$('.option', wrap).forEach(x=>x.dataset.selected='false');
          b.dataset.selected = 'true';
          currentSelection = opt;
        });
        wrap.appendChild(b);
      });
      qBody.appendChild(wrap);
    }

    if(q.type==='pick'){
      const wrap = document.createElement('div');
      wrap.className = 'pills';
      q.pills.forEach(p => {
        const b = document.createElement('button');
        b.className = 'pill';
        b.type = 'button';
        b.textContent = p.label;
        b.dataset.value = p.value;
        b.dataset.on = 'false';
        b.addEventListener('click', ()=>{
          $$('.pill', wrap).forEach(x=>x.dataset.on='false');
          b.dataset.on = 'true';
          currentSelection = p.value;
        });
        wrap.appendChild(b);
      });
      qBody.appendChild(wrap);
    }

    // Buttons
    btnHint.onclick = () => {
      if(!q.hint) return;
      toast('Hint megjelenítve');
      feedback.hidden = false;
      feedback.className = 'feedback';
      feedback.innerHTML = `<h3>Hint</h3><div class="exp">${q.hint}</div>`;
    };

    btnSpeak.onclick = () => speak(stripHtml(q.prompt));

    btnSubmit.onclick = checkAnswer;
    btnNext.onclick = nextQuestion;
  }

  function stripHtml(html){
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  }

  function speak(text){
    try{
      if(!('speechSynthesis' in window)) { toast('Felolvasás nem támogatott.'); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'hu-HU';
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    } catch {
      toast('Nem sikerült a felolvasás.');
    }
  }

  function checkAnswer(){
    const q = getQuestionById(session.qids[session.index]);
    if(!q) return;

    let user = '';
    if(q.type==='input') user = $('#answerInput')?.value ?? '';
    if(q.type==='mcq' || q.type==='pick') user = currentSelection ?? '';

    if(!user){
      toast('Adj meg választ!');
      return;
    }

    const res = evaluateAnswer(q, user); // {score, verdict, reason?}

// update score/streak
session.score += res.score;
if(res.verdict==='ok'){
  session.streak += 1;
  session.bestStreak = Math.max(session.bestStreak, session.streak);
} else {
  session.streak = 0;
}

session.answered.push({
  id: q.id,
  verdict: res.verdict,
  score: res.score,
  reason: res.reason || null,
  user,
  correct: q.answer
});

// persistent adaptive stats
const stats = getStats();
stats.attemptsById[q.id] = (stats.attemptsById[q.id] ?? 0) + 1;
if(res.verdict==='wrong'){
  stats.wrongById[q.id] = (stats.wrongById[q.id] ?? 0) + 1;
  stats.wrongByTopic[q.topic] = (stats.wrongByTopic[q.topic] ?? 0) + 1;
  if(res.reason) stats.wrongByReason[res.reason] = (stats.wrongByReason[res.reason] ?? 0) + 1;
}
if(res.verdict==='partial'){
  stats.partialById[q.id] = (stats.partialById[q.id] ?? 0) + 1;
  // partial still indicates weakness in topic, but less
  stats.wrongByTopic[q.topic] = (stats.wrongByTopic[q.topic] ?? 0) + 0.25;
  if(res.reason) stats.wrongByReason[res.reason] = (stats.wrongByReason[res.reason] ?? 0) + 0.25;
  if(res.reason==='ékezet') toast('Fél pont – csak az ékezetek csúsztak el.');
  if(res.reason==='kettőzés') toast('Fél pont – a kettőzés/hasonulás volt a buktató.');
}
saveStats(stats);

saveJSON(STORAGE.session, session);

renderFeedback(q, user, res);

    btnSubmit.hidden = true;
    btnNext.hidden = false;

    // disable input to avoid edits after submit
    const inp = $('#answerInput');
    if(inp) inp.disabled = true;
  }

  function isCorrect(q, user){ return evaluateAnswer(q, user).score === 1; }


  
  function mistakeDetail(q, user){
    const u = normalize(user);
    // explicit per-question mapping
    if(q && q.mistakeMap){
      // try direct key
      if(q.mistakeMap[u]) return q.mistakeMap[u];
      // try normalized keys
      for(const k of Object.keys(q.mistakeMap)){
        if(normalize(k) === u) return q.mistakeMap[k];
      }
    }

    // generic fallbacks by topic
    switch(q.topic){
      case 'teljes_hasonulas':
        return 'Valószínűleg a <strong>-val/-vel</strong> rag <strong>teljes hasonulását</strong> hagytad ki: mássalhangzó után a <strong>v</strong> nem marad meg, hanem <strong>átváltozik</strong>, és ezért <strong>kettőzni</strong> kell (pl. kéz+vel → kézzel).';
      case 'reszleges_hasonulas':
        return 'Itt a kiejtés becsapós: gyakran <strong>másképp ejtjük</strong>, mint ahogy írjuk (pl. kapta [kabta]). Írásban sokszor a <strong>szóelemeket</strong> tartjuk meg, nem a kiejtést másoljuk.';
      case 'osszeolvadas':
        return 'A <strong>j</strong> hang miatt a kiejtésben összeolvadás lehet (tudja → „tugya”), de a helyesírás általában megtartja az eredeti betűket (tudja, mondja).';
      case 'egyszerusites':
        return 'Három azonos mássalhangzó találkozásánál <strong>egyszerűsítünk</strong>: toldalékolásnál általában <strong>kettőt írunk</strong> (rossz+val → rosszal), összetételben pedig gyakran <strong>kötőjelet</strong> használunk (toll-labda).';
      case 'hosszusag':
        return 'Valószínűleg a <strong>kettőzést</strong> (hosszú mássalhangzót) írtad rosszul. A kettőzés sokszor <strong>jelentést is megkülönböztet</strong> (kell vs kel, hall vs hal).';
      default:
        return 'Nézd meg a szabályt a magyarázatban, és figyelj arra, hogy ne „hallás után” írj, hanem a tanult helyesírást kövesd.';
    }
  }


function renderFeedback(q, user, res){
  feedback.hidden = false;
  feedback.className =
    (res.verdict==='ok') ? 'feedback ok' :
    (res.verdict==='partial') ? 'feedback partial' :
    'feedback bad';

  const title =
    (res.verdict==='ok') ? '✅ Helyes!' :
    (res.verdict==='partial') ? '🟡 Majdnem (fél pont)' :
    '❌ Nem egészen';

  const userLine = (q.type==='pick')
    ? `<div class="exp"><strong>Válaszod:</strong> ${safeHtml(labelOfPick(q, user) || user)}</div>`
    : `<div class="exp"><strong>Válaszod:</strong> ${safeHtml(user)}</div>`;

  const corrLine = (q.type==='pick')
    ? `<div class="exp"><strong>Helyes:</strong> ${safeHtml(labelOfPick(q, q.answer) || q.answer)}</div>`
    : `<div class="exp"><strong>Helyes:</strong> ${safeHtml(q.answer)}</div>`;

  const exp = q.explanation ? `<div class="exp">${q.explanation}</div>` : '';

  const partialBlock = (res.verdict==='partial')
    ? `<div class="exp"><strong>Részpont oka:</strong> ${safeHtml(res.reason || '')}. Figyelj a részletekre (gyakori: ékezetek / kettőzés).</div>`
    : '';

  const why = (res.verdict!=='ok')
    ? `<div class="exp"><h4>Mi volt a hiba?</h4>${partialBlock}<div>${mistakeDetail(q, user)}</div>${q.hint ? `<div style="margin-top:8px;"><strong>Mire figyelj:</strong> ${safeHtml(q.hint)}</div>` : ''}</div>`
    : '';

  feedback.innerHTML = `<h3>${title}</h3>${userLine}${corrLine}${why}${exp}`;
}

function labelOfPick(q, value){
  return q.pills?.find(p=>p.value===value)?.label;
}

  function nextQuestion(){
    session.index += 1;
    saveJSON(STORAGE.session, session);

    if(session.index >= session.qids.length){
      finishSession();
      return;
    }
    renderCurrentQuestion();
  }

  function finishSession(){
    stopExamTimer();
    // Mark as completed
    session.index = session.qids.length;
    saveJSON(STORAGE.session, session);

    // update persistent stats
    const stats = getStats();
    const pct = Math.round((session.score/session.count)*100);
    if(pct > stats.bestPct) stats.bestPct = pct;
    if(session.score > stats.bestScore) stats.bestScore = session.score;
    stats.last = {
      at: now(),
      score: session.score,
      count: session.count,
      pct,
      bestStreak: session.bestStreak,
      mode: session.mode,
      topic: session.topic,
      durationMs: now() - session.createdAt
    };
    saveStats(stats);

    showView('summary');
    renderSummary();
  }

  // --- Summary
  function renderSummary(){
    const stats = getStats();
    const last = stats.last;

    if(!last){
      $('#sumScore').textContent = '–';
      $('#sumPct').textContent = 'Még nincs eredmény.';
      $('#sumStreak').textContent = '–';
      $('#sumTime').textContent = '–';
      $('#reviewCard').hidden = true;
      return;
    }

    $('#sumScore').textContent = `${last.score}/${last.count}`;
    $('#sumPct').textContent = `${last.pct}% • Legjobb: ${stats.bestPct}%`;
    $('#sumStreak').textContent = String(last.bestStreak);
    $('#sumTime').textContent = msToClock(last.durationMs);

    // Review list from current session (if available)
    const s = loadSession() || loadJSON(STORAGE.session, null);
    const answered = s?.answered || [];
    const wrong = answered.filter(a=>(a.verdict ?? (a.ok?'ok':'wrong'))!=='ok');

    const reviewCard = $('#reviewCard');
    const list = $('#reviewList');

    if(wrong.length===0){
      reviewCard.hidden = true;
    } else {
      reviewCard.hidden = false;
      list.innerHTML = '';
      wrong.slice(0, 30).forEach(item=>{
        const q = getQuestionById(item.id);
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `
          <div class="q">${q ? q.prompt : safeHtml(item.id)}</div>
          <div class="a"><strong>Eredmény:</strong> ${safeHtml(item.verdict==='partial' ? 'Fél pont' : 'Hibás')} ( +${item.score ?? 0} )<br/><strong>Válaszod:</strong> ${safeHtml(item.user)}<br/><strong>Helyes:</strong> ${safeHtml(item.correct)}</div>
          ${q?.explanation ? `<div class="a">${q.explanation}</div>`:''}
        `;
        list.appendChild(div);
      });
    }
  }

  // --- Buttons
  $('#btnStart').addEventListener('click', startNewSession);
  $('#btnQuickStart').addEventListener('click', ()=>{ showView('home'); $('#btnStart').scrollIntoView({behavior:'smooth', block:'center'}); });

  $('#btnQuit').addEventListener('click', ()=>{
    if(confirm('Biztos kilépsz? A kör mentve marad, később folytatható.')){
      saveJSON(STORAGE.session, session);
      showView('home');
      syncResumeButton();
    }
  });

  $('#btnRules').addEventListener('click', ()=> showView('rules'));
  $('#btnBackFromRules').addEventListener('click', ()=>{
    if(session && session.index < session.qids.length) showView('practice');
    else showView('home');
  });

  $('#btnPlayAgain').addEventListener('click', ()=>{
    clearSession();
    showView('home');
    syncResumeButton();
  });

  $('#btnReview').addEventListener('click', ()=>{
    const card = $('#reviewCard');
    card.hidden = !card.hidden;
  });

  $('#btnResetProgress').addEventListener('click', ()=>{
    if(confirm('Biztos törlöd az összes mentett eredményt és a folyamatban lévő kört?')){
      localStorage.removeItem(STORAGE.stats);
      localStorage.removeItem(STORAGE.session);
      toast('Törölve.');
      showView('home');
      syncResumeButton();
    }
  });

  function syncResumeButton(){
    const s = loadSession();
    const btn = $('#btnResume');
    if(s){
      btn.hidden = false;
      btn.onclick = ()=>{
        session = s;
        showView('practice');
        renderCurrentQuestion();
        startExamTimerIfNeeded();
      };
    } else {
      btn.hidden = true;
    }
  }

  syncResumeButton();

  // --- PWA service worker
  (function registerSW(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    });
  })();

})();
