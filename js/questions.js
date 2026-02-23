/* 
  Kérdésbank – Mássalhangzó-törvények (5. osztály)
  Bővített verzió: témakörönként ~45+ kérdés, részletes magyarázattal és tipikus hibákkal.

  Topics (topic):
    - teljes_hasonulas
    - reszleges_hasonulas
    - osszeolvadas
    - egyszerusites
    - hosszusag
    - vegyes

  Fields:
    - explanation: részletes szabály + mire figyelj
    - mistakeMap: (opcionális) { normalized_user_answer : "miért rossz + tipp" }
    - accepted: input típusnál elfogadott válaszok listája (kis/nagybetű, több alak)
*/

(function(){
  const Q = [];
  const push = (q) => Q.push(q);
  const id = (base, i) => `${base}_${String(i).padStart(3,'0')}`;

  const norm = (s) => (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g,' ');

  const shuffle = (arr) => {
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  };

  const mcq = ({id, topic, difficulty, prompt, answer, options, explanation, hint, mistakeMap}) => push({
    id, topic, difficulty, type:'mcq', prompt, answer, options, explanation, hint, mistakeMap
  });

  const input = ({id, topic, difficulty, prompt, answer, accepted, explanation, hint, mistakeMap}) => push({
    id, topic, difficulty, type:'input', prompt, answer, accepted: accepted ?? [answer], explanation, hint, mistakeMap
  });

  const pick = ({id, topic, difficulty, prompt, answer, pills, explanation, hint, mistakeMap}) => push({
    id, topic, difficulty, type:'pick', prompt, answer, pills, explanation, hint, mistakeMap
  });

  // ----------------------------------------------------------------------------
  // 1) TELJES HASONULÁS – -val/-vel (kézzel, híddal)
  // Szabály (rövid): ha a szó mássalhangzóra végződik, a v hasonul, és a végső mássalhangzó megkettőződik: kéz+vel→kézzel.
  // Ha magánhangzóra végződik, marad a v: autó+val→autóval.
  // ----------------------------------------------------------------------------

  const valvel_words = [
    // mássalhangzóra végződők
    ['kéz','kézzel'], ['láb','lábbal'], ['híd','híddal'], ['barát','baráttal'], ['bot','bottal'],
    ['szél','széllel'], ['toll','tollal'], ['bőr','bőrrel'], ['papír','papírral'], ['kerék','kerékkel'],
    ['szék','székkel'], ['tükör','tükörrel'], ['kard','karddal'], ['pad','paddal'], ['ajtó','ajtóval'], // magánhangzós: kontroll
    ['könyv','könyvvel'], ['csengő','csengővel'], ['virág','virággal'], ['hal','hallal'], ['kép','képpel'],
    ['cél','céllal'], ['gép','géppel'], ['kulcs','kulccsal'], ['nyúl','nyúllal'], ['ár','árral'],
    ['út','úttal'], ['haj','hajjal'], ['lépcső','lépcsővel'], ['sár','sárral'], ['vonal','vonallal'],
    ['fal','fallal'], ['hang','hanggal'], ['tenger','tengerrel'], ['föld','földdel'], ['kert','kerttel'],
    ['kő','kővel'], ['fű','fűvel'], ['autó','autóval'], ['tábla','táblával'], ['mozi','mozival'],
    ['alma','almával'], ['szoba','szobával'], ['kakaó','kakaóval'], ['híd','híddal'], ['csónak','csónakkal'],
    ['dolog','dologgal'], ['rét','réttel'], ['ház','házzal'], ['tél','téllal'], ['fény','fénnyel'],
  ];

  const explain_valvel = (stem, correct) => `
    <div><strong>Szabály:</strong> a <em>-val/-vel</em> rag <strong>v</strong> hangja 
    mássalhangzó előtt <strong>teljesen hasonul</strong> (átváltozik a szó utolsó mássalhangzójává).</div>
    <ul>
      <li><strong>${stem} + -val/-vel → ${correct}</strong></li>
      <li>Ezért a végső mássalhangzó <strong>kettőződik</strong> (kéz→kéz<strong>z</strong>el).</li>
      <li>Ha a szó <strong>magánhangzóra</strong> végződik, akkor marad a <strong>v</strong>: pl. autó+val → autóval.</li>
    </ul>
    <div><strong>Mire figyelj?</strong> Ne hagyd ki a kettőzést (kézzel ≠ kézel), és ne írj feleslegesen v-t mássalhangzó után (hídval ✗).</div>
  `;

  // Generate ~45 input questions
  let i1 = 1;
  shuffle(valvel_words).slice(0, 46).forEach(([stem, corr])=>{
    const wrong1 = corr.replace(/(.)\1/, '$1'); // remove doubling once (naive)
    const wrong2 = stem + (stem.match(/[aeiouáéíóöőúüű]$/i) ? 'vel' : 'val'); // naive wrong v form
    const mistakeMap = {};
    mistakeMap[norm(wrong1)] = 'Kimaradt a mássalhangzó kettőzése. Mássalhangzó előtt a v hasonul, ezért kettőzni kell.';
    mistakeMap[norm(wrong2)] = 'A -val/-vel ragot nem így írjuk. Mássalhangzó végén a v nem marad meg, hanem hasonul (→ kettőzés).';
    input({
      id: id('th_in', i1++),
      topic:'teljes_hasonulas',
      difficulty: i1<18 ? 'easy' : (i1<34 ? 'medium':'hard'),
      prompt:`Írd le helyesen: <strong>${stem}</strong> + <strong>-val/-vel</strong> = ?`,
      answer:corr,
      accepted:[corr],
      hint:'Ha mássalhangzóra végződik a szó, a v átalakul és kettőzünk. Magánhangzó után marad a v.',
      explanation: explain_valvel(stem, corr),
      mistakeMap
    });
  });

  // Plus ~10 MCQ (gyors ellenőrzés)
  const valvel_mcq_pairs = shuffle(valvel_words).filter(x=>!/val$|vel$/i.test(x[1])).slice(0, 12);
  let i1m=1;
  valvel_mcq_pairs.forEach(([stem, corr])=>{
    const opts = [];
    // distractors
    const baseWrong = stem + (corr.endsWith('val') ? 'val':'vel'); // often wrong
    const noDouble = corr.replace(/([bcdfghjklmnpqrstvwxyz])\1/i,'$1');
    opts.push(corr, baseWrong, noDouble);
    while(opts.length<4){
      const rand = shuffle(valvel_words)[0][1];
      if(!opts.includes(rand)) opts.push(rand);
    }
    const mistakeMap = {};
    mistakeMap[norm(baseWrong)] = 'Itt mássalhangzó + v találkozna, ezért a v hasonul, nem marad külön betűként.';
    mistakeMap[norm(noDouble)] = 'A hasonulás miatt a végső mássalhangzó kettőződik, ezt nem szabad elhagyni.';
    mcq({
      id:id('th_mcq', i1m++),
      topic:'teljes_hasonulas',
      difficulty:'easy',
      prompt:`Válaszd ki a helyes alakot: <strong>${stem} + -val/-vel</strong>`,
      answer:corr,
      options: opts,
      hint:'Mássalhangzó után: v hasonul → kettőzés.',
      explanation: explain_valvel(stem, corr),
      mistakeMap
    });
  });

  // ----------------------------------------------------------------------------
  // 2) RÉSZLEGES HASONULÁS (zöngésség) – gyakran KIEJTÉSBEN történik, az írás többnyire a szóelemeket követi.
  // Tipikus: kapta [kabta] de írjuk: kapta; dobtam [doptam] de írjuk: dobtam.
  // ----------------------------------------------------------------------------

  const zh_pairs = [
    // helyes, gyakori téves
    ['kapta','kabta'], ['loptam','lobtam'], ['kértem','kérdem'], ['dobtam','doptam'], ['vágtad','váktad'],
    ['írtam','írdam'], ['hoztam','hozdam'], ['futott','fudott'], ['buktam','bugtam'], ['csaptam','csabtam'],
    ['léptem','lébdem'], ['ütött','üdött'], ['kaptok','kabtok'], ['vágd','vákt'], ['dobtad','doptad'],
    ['szívtam','szíftam'], ['raktam','ragdam'], ['tudtam','tuttam'], // kontroll: más jelenség
    ['hozd','hoszt'], ['nézd','nészt'], ['vitték','viték'], // kontroll: hosszúság
  ];

  const explain_zh = (correct) => `
    <div><strong>Szabály:</strong> a <em>zöngésség szerinti részleges hasonulás</em> gyakran <strong>kiejtésben</strong> jelenik meg, 
    de a <strong>helyesírás</strong> többnyire a <strong>szóelemeket</strong> követi.</div>
    <ul>
      <li>Pl. <strong>kapta</strong> (k+p+t) kiejtve [kabta], de <strong>írva kapta</strong>.</li>
      <li>Pl. <strong>dobtam</strong> kiejtve [doptam], de <strong>írva dobtam</strong>.</li>
    </ul>
    <div><strong>Mire figyelj?</strong> Ne azt írd le, amit hallasz, hanem amit a szó <em>alapja</em> és a toldalék <em>mutat</em>.</div>
  `;

  let i2=1;
  shuffle(zh_pairs).filter(p=>p[0].length>=3).slice(0, 50).forEach(([corr, wrong])=>{
    const opts = shuffle([corr, wrong, mutateZhDistractor(corr), mutateZhDistractor(wrong)]).slice(0,4);
    const mistakeMap = {};
    mistakeMap[norm(wrong)] = 'Ez a kiejtéshez igazodik, de helyesírásban általában a szó alapját tartjuk meg (szóelemzés elve).';
    mcq({
      id:id('rh_mcq', i2++),
      topic:'reszleges_hasonulas',
      difficulty: i2<18 ? 'easy' : (i2<34 ? 'medium':'hard'),
      prompt:`Melyik a helyes írásmód?`,
      answer:corr,
      options: ensureContains(opts, corr),
      hint:'A kiejtés becsapós! Írásban sokszor a szóelemeket tartjuk meg.',
      explanation: explain_zh(corr),
      mistakeMap
    });
  });

  // input – mondatba illesztés
  const rh_sentences = [
    ['kapta','A fiú gyorsan ____ a labdát. (kapta/kabta)'],
    ['dobtam','Tegnap ____ egy kavicsot a vízbe. (dobtam/doptam)'],
    ['vágtad','Miért ____ el a papírt? (vágtad/váktad)'],
    ['hozd','Kérlek, ____ ide a füzetet! (hozd/hoszt)'],
    ['nézd','____ meg a térképet! (nézd/nészt)'],
    ['dobtad','Te ____ el a kulcsot? (dobtad/doptad)'],
    ['kaptok','Ti is ____ jutalmat? (kaptok/kabtok)'],
    ['csaptam','Én ____ a legyet. (csaptam/csabtam)'],
    ['loptam','Nem én ____ a csokit! (loptam/lobtam)'],
    ['raktam','A polcra ____ a könyveket. (raktam/ragdam)'],
  ];

  let i2i=1;
  rh_sentences.forEach(([corr, templ])=>{
    const wrong = zh_pairs.find(x=>x[0]===corr)?.[1] ?? '';
    const mistakeMap = {};
    if(wrong) mistakeMap[norm(wrong)] = 'A kiejtésben lehet hangváltozás, de írva a helyes szóalakot használjuk.';
    input({
      id:id('rh_in', i2i++),
      topic:'reszleges_hasonulas',
      difficulty:'medium',
      prompt:`Írd be a hiányzó szót helyesen: „${templ.replace('____','<strong>____</strong>')}”`,
      answer:corr,
      accepted:[corr],
      hint:'Gondold végig: mi a szó töve? A helyesírás általában nem a kiejtést másolja.',
      explanation: explain_zh(corr),
      mistakeMap
    });
  });

  // ----------------------------------------------------------------------------
  // 3) ÖSSZEOLVADÁS – j hang hatása (kiejtésben: tugya, mongya), de helyesírásban: tudja, mondja
  // ----------------------------------------------------------------------------

  const j_pairs = [
    ['tudja','tugya'],
    ['mondja','mongya'],
    ['látja','láttya'],
    ['adja','agya'],
    ['hagyja','hadja'],
    ['fújja','fúja'],
    ['írja','írja'], // kontroll (nem változik)
    ['hallja','hajja'],
    ['vigye','vigye'], // kontroll
    ['szóljon','szójjon'],
    ['nézze','nézze'], // kontroll
    ['tartja','tartya'],
    ['kérje','kérgye'],
    ['dobja','dobjja'],
    ['átadja','átagya'],
    ['mondjuk','mongyuk'],
    ['tudjuk','tugyuk'],
    ['látjuk','láttyuk'],
    ['írjuk','írlyuk'],
    ['hozzák','hozzák'], // kontroll
  ];

  const explain_j = (correct) => `
    <div><strong>Szabály:</strong> a <em>j</em> hang a megelőző mássalhangzóval gyakran <strong>összeolvad</strong> a <strong>kiejtésben</strong> 
    (pl. tudja → [tugya], mondja → [mongya]).</div>
    <div><strong>Helyesírás:</strong> általában megtartjuk a szó eredeti betűit: <strong>${correct}</strong>.</div>
    <div><strong>Mire figyelj?</strong> Ne „hallás után” írj (tugya ✗), hanem a tanult alakot: tudja ✓.</div>
  `;

  let i3=1;
  shuffle(j_pairs).slice(0, 50).forEach(([corr, wrong])=>{
    // make sure wrong differs; if same, craft a different wrong
    if(norm(corr)===norm(wrong)) wrong = corr.replace('j','gy');
    const options = ensureContains(shuffle([corr, wrong, mutateJWrong(corr), mutateJWrong(wrong)]).slice(0,4), corr);
    const mistakeMap = {};
    mistakeMap[norm(wrong)] = 'Ez a kiejtést követi, de helyesírásban a j-t és a tő betűit megtartjuk (pl. tud+ja).';
    mcq({
      id:id('oj_mcq', i3++),
      topic:'osszeolvadas',
      difficulty: i3<18 ? 'easy' : (i3<34 ? 'medium':'hard'),
      prompt:`Melyik a helyes írásmód?`,
      answer:corr,
      options,
      hint:'A kiejtés: „tugya”, de írjuk: „tudja”.',
      explanation: explain_j(corr),
      mistakeMap
    });
  });

  // input mondatok
  const oj_sent = [
    ['tudja','Ő már biztosan ____ a választ.'],
    ['mondja','A tanár ____ a megoldást.'],
    ['hagyja','Kérlek, ____ békén!'],
    ['adja','____ ide a ceruzát!'],
    ['fújja','A szél erősen ____ a leveleket.'],
    ['hallja','Aki a hátsó sorban ül, jól ____?'],
    ['tartja','A fiú ____ a zászlót.'],
    ['kérje','Ha kell, ____ segítséget!'],
    ['mondjuk','Mi most ezt ____ hangosan.'],
    ['tudjuk','Mi már ____ a szabályt.'],
  ];

  let i3i=1;
  oj_sent.forEach(([corr, s])=>{
    input({
      id:id('oj_in', i3i++),
      topic:'osszeolvadas',
      difficulty:'medium',
      prompt:`Írd be a hiányzó szót helyesen: „${s.replace('____','<strong>____</strong>')}”`,
      answer:corr,
      accepted:[corr],
      hint:'A „gy” hangzás nem jelenti, hogy gy-t kell írni. Gyakran j-t írunk (tudja).',
      explanation: explain_j(corr),
      mistakeMap: {}
    });
  });

  // ----------------------------------------------------------------------------
  // 4) EGYSZERŰSÍTÉS – 3 azonos mássalhangzó találkozása
  // Toldalékolásnál: hosszal (hossz+val), rosszal (rossz+val), passzal (passz+val)
  // ----------------------------------------------------------------------------

  const simpl_suffix = [
    ['hossz','hosszal'], ['rossz','rosszal'], ['passz','passzal'], ['bossz','bosszal'],
    ['messz','messzel'], ['lassz','lasszal'], // ritkább, de mintapéldák
    ['szenn','szennyel'], ['toll','tollal'], // kontroll (nem 3 azonos, de gyakran keverik)
    ['ház','házzal'], ['rész','résszel'], ['szél','széllel'], // részben teljes hasonulás
  ];

  const explain_simpl = (correct) => `
    <div><strong>Szabály:</strong> ha <strong>három azonos mássalhangzó</strong> találkozna, a helyesírás <strong>egyszerűsít</strong>.</div>
    <ul>
      <li><strong>Toldalékolásnál</strong> általában <strong>kettőt írunk</strong>: rossz+val → rosszal.</li>
      <li><strong>Összetett szavaknál</strong> a helyes írásmód külön szabály szerint alakul (ezt most nem keverjük ide).</li>
    </ul>
    <div><strong>Mire figyelj?</strong> Ne írj három azonos betűt egymás után (rosszszal ✗), és kerüld a három azonos betűt egymás után.</div>
  `;

  let i4=1;
  // suffix-based (mcq + input)
  shuffle(simpl_suffix).slice(0, 30).forEach(([stem, corr])=>{
    const wrong3 = stem + stem.slice(-1) + (corr.endsWith('al') ? 'al':'el'); // naive triple
    const wrong2 = corr.replace(/([a-záéíóöőúüű])\1\1/gi,'$1$1'); // not really used
    const options = ensureContains(shuffle([corr, stem+'val', stem+'vel', wrong3]).slice(0,4), corr);
    const mistakeMap = {};
    mistakeMap[norm(wrong3)] = 'Három azonos mássalhangzó nem maradhat egymás mellett toldalékolásnál: egyszerűsítünk (kettőt írunk).';
    mistakeMap[norm(stem+'val')] = 'Mássalhangzó végén a -val/-vel v-je hasonul, nem marad v. Emellett a három azonos betűt is kerülni kell.';
    mcq({
      id:id('es_mcq', i4++),
      topic:'egyszerusites',
      difficulty: i4<16 ? 'easy' : (i4<26 ? 'medium':'hard'),
      prompt:`Melyik a helyes alak? <strong>${stem} + -val/-vel</strong>`,
      answer:corr,
      options,
      hint:'Ha három azonos betű lenne, egyszerűsítünk (kettőt írunk).',
      explanation: explain_simpl(corr),
      mistakeMap
    });

    input({
      id:id('es_in', i4++),
      topic:'egyszerusites',
      difficulty:'medium',
      prompt:`Írd le helyesen: <strong>${stem}</strong> + <strong>-val/-vel</strong> = ?`,
      answer:corr,
      accepted:[corr],
      hint:'Három azonos mássalhangzó helyett kettőt írunk.',
      explanation: explain_simpl(corr),
      mistakeMap
    });
  });

  // (Removed) compound-based pick questions: túl sok a vitatható/ritka írásmód, tanári elvárás szerint csak biztos példák maradnak.

  // ----------------------------------------------------------------------------
  // 5) HOSSZÚSÁG / KETTŐZÉS – kell/kel, hall/hal, száll/szal, megy/menn...
  // ----------------------------------------------------------------------------

  // ----------------------------------------------------------------------------

  const length_pairs = [
    ['kell','kel','Más a jelentés: kell (szükséges) vs. kel (felkel).'],
    ['hall','hal','hall (fülel) vs. hal (úszó állat).'],
    ['száll','szal','száll (repül/leszáll) vs. szal (fut, szalad).'],
    ['toll','tol','toll (írószerszám) vs. tol (mozgat).'],
    ['szem','szemm','(kontroll)'], // remove
    ['mennyi','menyi','A „mennyi” két n-nel írandó.'],
    ['innen','inen','A „innen” két n-nel írandó.'],
    ['onnan','onan','Az „onnan” két n-nel írandó.'],
    ['vajon','vajjon','A helyes alak: vajon (egy j).'],
    ['jön','jőn','A mai helyesírás: jön.'],
    ['vitte','vite','A „vitte” két t-vel.'],
    ['éppen','épen','éppen (pontosan) vs épen (sértetlenül).'],
    ['szebb','szeb','A középfokban kettőzünk: szebb.'],
    ['könnyű','könyű','A „könnyű” ny + ny (kettőzés jelölése).'],
    ['annyi','anyi','Az „annyi” két n-nel.'],
    ['mellé','melé','A „mellé” két l-lel.'],
    ['több','töb','A „több” két b-vel.'],
    ['színes','színess','(kontroll)'],
  ];

  const clean_length = length_pairs.filter(p=>!p[2]?.includes('kontroll') && p[0] && p[1]);
  const explain_len = (good, bad, note) => `
    <div><strong>Szabály:</strong> a magyarban a <strong>rövid</strong> és <strong>hosszú</strong> mássalhangzók jelentéskülönbséget is okozhatnak.</div>
    <ul>
      <li>Helyes: <strong>${good}</strong></li>
      <li>Gyakori hibás írásmód: <strong>${bad}</strong></li>
    </ul>
    <div><strong>Miért fontos?</strong> ${safe(note || 'A kettőzés sokszor a szó jelentését vagy nyelvtani alakját jelzi.')}</div>
    <div><strong>Mire figyelj?</strong> Ha bizonytalan vagy: mondd ki lassan, és gondold végig a jelentést (pl. kell vs kel).</div>
  `;

  let i5=1;
  shuffle(clean_length).slice(0, 55).forEach(([good, bad, note])=>{
    const options = shuffle([good, bad]);
    const mistakeMap = {};
    mistakeMap[norm(bad)] = 'Kimaradt a kettőzés / hosszú mássalhangzó jelölése. Sokszor a jelentés is megváltozik!';
    mcq({
      id:id('hl_mcq', i5++),
      topic:'hosszusag',
      difficulty: i5<18 ? 'easy' : (i5<36 ? 'medium':'hard'),
      prompt:`Válaszd ki a helyes alakot a zárójelből: (${good} / ${bad})`,
      note:'Figyelj: a rossz opciók szándékosan hibás írásmódok (gyakori tévesztések), nem „külön szavak”.',
      answer:good,
      options,
      hint:'Figyelj a kettőzésre (pl. kell, több, innen).',
      explanation: explain_len(good, bad, note),
      mistakeMap
    });
  });

  // input – jelentés segítséggel
  const len_sent = [
    ['kell','Írd be a helyes szót: „Nekem ez nagyon ____ (szükséges).”'],
    ['kel','Írd be a helyes szót: „Reggel korán ____ az ember.”'],
    ['hall','Írd be a helyes szót: „Csendben ____ a madárhangot.”'],
    ['hal','Írd be a helyes szót: „A tóban úszik egy ____.”'],
    ['innen','Írd be a helyes alakot a zárójelből: (innen / ide) – „Gyere ____ gyorsan!”'],
    ['onnan','Írd be a helyes alakot a zárójelből: (onnan / onan) – „Tedd el ____ a könyvet!”'],
    ['több','Írd be a helyes szót: „Kérek ____ időt.”'],
    ['mellé','Írd be a helyes szót: „Ülj ide ____!”'],
    ['annyi','Írd be a helyes alakot a zárójelből: (annyi / anyi) – „Nem ettem ____.”'],
    ['vitte','Írd be a helyes szót: „Ő ____ haza a táskát.”'],
  ];
  let i5i=1;
  len_sent.forEach(([good, p])=>{
    input({
      id:id('hl_in', i5i++),
      topic:'hosszusag',
      difficulty:'medium',
      prompt:p,
      note:'Ha két alakot látsz a zárójelben, az egyik szándékosan hibás írásmód (gyakori hiba).',
      answer:good,
      accepted:[good],
      hint:'A jelentés segít: kell=szükséges, kel=felkel; hall=hall, hal=állat.',
      explanation:`<div>${explain_len(good, '', 'Itt a mondat jelentése dönti el a helyes alakot.')}</div>`,
      mistakeMap:{}
    });
  });

  // ----------------------------------------------------------------------------
  // 6) VEGYES – törvény felismerése / gyors kategorizálás
  // ----------------------------------------------------------------------------

  const law_pills = [
    {label:'Teljes hasonulás (-val/-vel)', value:'teljes_hasonulas'},
    {label:'Részleges hasonulás (zöngésség)', value:'reszleges_hasonulas'},
    {label:'Összeolvadás (j hatása)', value:'osszeolvadas'},
    {label:'Egyszerűsítés (3 azonos)', value:'egyszerusites'},
    {label:'Hosszúság (kettőzés)', value:'hosszusag'},
  ];

  const mixed_items = [
    {w:'kézzel', law:'teljes_hasonulas', why:'kéz + vel → a v hasonul, ezért kettőzés.'},
    {w:'híddal', law:'teljes_hasonulas', why:'híd + val → d + v találkozás, teljes hasonulás.'},
    {w:'kapta', law:'reszleges_hasonulas', why:'kiejtésben [kabta], de írva kapta (szóelemzés).'},
    {w:'dobtam', law:'reszleges_hasonulas', why:'kiejtésben [doptam], de írva dobtam.'},
    {w:'tudja', law:'osszeolvadas', why:'kiejtés: [tugya], írás: tudja (j megmarad).'},
    {w:'mondja', law:'osszeolvadas', why:'kiejtés: [mongya], írás: mondja.'},
    {w:'rosszal', law:'egyszerusites', why:'rossz + val → három z lenne, egyszerűsítünk.'},
        {w:'kell', law:'hosszusag', why:'kettőzött l jelöli a hosszú mássalhangzót, és jelentést is megkülönböztet.'},
    {w:'innen', law:'hosszusag', why:'két n: a szó helyes alakja.'},
  ];

  let i6=1;
  // create 45 by reusing items with different prompts
  while(i6<=45){
    const it = mixed_items[(i6-1)%mixed_items.length];
    pick({
      id:id('mix_pick', i6),
      topic:'vegyes',
      difficulty: i6<16 ? 'easy' : (i6<31 ? 'medium':'hard'),
      prompt:`Melyik mássalhangzó-törvényhez tartozik a szó: <strong>${it.w}</strong>?`,
      answer:it.law,
      pills: law_pills,
      hint:'Ne csak a szót nézd, gondold végig: toldalék? kiejtés vs írás? kettőzés? kötőjel?',
      explanation:`<div><strong>Helyes válasz:</strong> ${lawLabel(it.law)}.</div><div>${safe(it.why)}</div>`,
      mistakeMap:{}
    });
    i6++;
  }

  // ----------------------------------------------------------------------------
  // Helpers (local)
  // ----------------------------------------------------------------------------

  function safe(s){
    return String(s ?? '').replace(/[&<>"]/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }

  function ensureContains(opts, must){
    if(!opts.includes(must)) opts[0]=must;
    // de-dup
    return Array.from(new Set(opts)).slice(0,4);
  }

  function lawLabel(key){
    const map = {
      'teljes_hasonulas':'Teljes hasonulás',
      'reszleges_hasonulas':'Részleges hasonulás',
      'osszeolvadas':'Összeolvadás',
      'egyszerusites':'Egyszerűsítés',
      'hosszusag':'Hosszúság / kettőzés'
    };
    return map[key] || key;
  }

  function mutateZhDistractor(word){
    // light random swap between t/d, p/b, k/g around suffix -t/-tam/-tad etc.
    return word
      .replace(/pt/g,'bt')
      .replace(/bt/g,'pt')
      .replace(/kt/g,'gt')
      .replace(/gt/g,'kt')
      .replace(/dt/g,'tt');
  }

  function mutateJWrong(word){
    // create "hallás szerinti" változat
    return word
      .replace(/dj/g,'gy')
      .replace(/tj/g,'ty')
      .replace(/dja/g,'gya')
      .replace(/djuk/g,'gyuk')
      .replace(/ndj/g,'ngy')
      .replace(/tja/g,'tya');
  }

  function mutateLenWrong(word){
    // remove or add one doubling where common
    if(/ll/.test(word)) return word.replace(/ll/,'l');
    if(/nn/.test(word)) return word.replace(/nn/,'n');
    if(/bb/.test(word)) return word.replace(/bb/,'b');
    if(/tt/.test(word)) return word.replace(/tt/,'t');
    if(/pp/.test(word)) return word.replace(/pp/,'p');
    if(/kk/.test(word)) return word.replace(/kk/,'k');
    // else add doubling to last consonant
    return word.replace(/([bcdfghjklmnpqrstvwxyz])$/i,'$1$1');
  }

  

  // ============================================================================
  // EXTRA BŐVÍTÉS (tanári elvárás: témánként 40+ kérdés)
  // ============================================================================

  // --- RÉSZLEGES HASONULÁS bővítés: generált múlt idejű / felszólító alakok (kiejtés vs írás)
  const rh_stems = [
    {stem:'kap', last:'p'}, {stem:'dob', last:'b'}, {stem:'rak', last:'k'}, {stem:'vág', last:'g'},
    {stem:'szív', last:'v'}, {stem:'csap', last:'p'}, {stem:'lop', last:'p'}, {stem:'üt', last:'t'},
    {stem:'néz', last:'z'}, {stem:'hoz', last:'z'}
  ];
  const rh_suffixes = [
    {s:'ta', label:'(múlt idő: -ta/-te)'}, {s:'tam', label:'(múlt idő: -tam/-tem)'}, {s:'tad', label:'(múlt idő: -tad/-ted)'},
    {s:'tok', label:'(múlt idő: -tok/-tek)'}, {s:'d', label:'(felszólító: -d)'}
  ];

  function voiceSwap(ch){
    const map = {p:'b', b:'p', t:'d', d:'t', k:'g', g:'k', f:'v', v:'f', s:'z', z:'s'};
    return map[ch] || ch;
  }

  function makeRhWrong(word){
    // swap last consonant before t/d if possible
    return word.replace(/([pbtdkgfvsz])([td])/g, (m,a,b)=> voiceSwap(a)+b);
  }

  let rhExtra = 1;
  for(const st of rh_stems){
    for(const sf of rh_suffixes){
      // build correct
      const corr = st.stem + sf.s;
      const wrong = makeRhWrong(corr);
      if(norm(corr)===norm(wrong)) continue;

      mcq({
        id:id('rhx_mcq', rhExtra++),
        topic:'reszleges_hasonulas',
        difficulty: (rhExtra<18?'easy':(rhExtra<36?'medium':'hard')),
        prompt:`Melyik a helyes írásmód? <em>${sf.label}</em>`,
        answer:corr,
        options: ensureContains(shuffle([corr, wrong, mutateZhDistractor(corr), mutateZhDistractor(wrong)]).slice(0,4), corr),
        hint:'Ne a kiejtést írd le! Írásban sokszor a szóelemeket tartjuk meg.',
        explanation: explain_zh(corr),
        mistakeMap: {[norm(wrong)]:'Ez a kiejtéshez igazodik. Helyesírásban a szótő betűit megtartjuk (szóelemzés elve).'}
      });

      // input mondat
      input({
        id:id('rhx_in', rhExtra++),
        topic:'reszleges_hasonulas',
        difficulty:'medium',
        prompt:`Írd be a helyes alakot a zárójelből: (${corr} / ${wrong}) – „Tegnap ő ____.”`,
        answer:corr,
        accepted:[corr],
        hint:'Hallás után könnyű elrontani. Gondold végig a szótövet!',
        explanation: explain_zh(corr),
        mistakeMap: {[norm(wrong)]:'Ez a „hallás szerinti” alak, de helyesen a szóelemeket követjük.'}
      });

      if(rhExtra>60) break;
    }
    if(rhExtra>60) break;
  }

  // --- ÖSSZEOLVADÁS bővítés: ja/je/juk/jük alakok + hallás szerinti hibák
  const oj_verbs = [
    {stem:'tud', suff:'ja', corr:'tudja'},
    {stem:'mond', suff:'ja', corr:'mondja'},
    {stem:'lát', suff:'ja', corr:'látja'},
    {stem:'ad', suff:'ja', corr:'adja'},
    {stem:'hagy', suff:'ja', corr:'hagyja'},
    {stem:'tart', suff:'ja', corr:'tartja'},
    {stem:'kér', suff:'je', corr:'kérje'},
    {stem:'fúj', suff:'ja', corr:'fújja'},
    {stem:'ír', suff:'ja', corr:'írja'},
    {stem:'mond', suff:'juk', corr:'mondjuk'},
    {stem:'tud', suff:'juk', corr:'tudjuk'},
    {stem:'lát', suff:'juk', corr:'látjuk'},
  ];

  let ojExtra=1;
  for(const v of oj_verbs){
    const corr = v.corr;
    const wrong1 = mutateJWrong(corr);
    const wrong2 = corr.replace(/j/g,'jj'); // túl sok j
    const options = ensureContains(shuffle([corr, wrong1, wrong2, corr.replace(/dj/g,'dgy')]).slice(0,4), corr);
    mcq({
      id:id('ojx_mcq', ojExtra++),
      topic:'osszeolvadas',
      difficulty:(ojExtra<18?'easy':(ojExtra<36?'medium':'hard')),
      prompt:`Melyik a helyes írásmód? <strong>${v.stem} + ${v.suff}</strong>`,
      answer:corr,
      options,
      hint:'Kiejtésben „gy/ty” hangzás lehet, de írva gyakran j marad (tudja, mondja).',
      explanation: explain_j(corr),
      mistakeMap: {[norm(wrong1)]:'Ez a kiejtést követi („tugya/mongya”). Helyesen a j-t megtartjuk: tudja/mondja.'}
    });

    input({
      id:id('ojx_in', ojExtra++),
      topic:'osszeolvadas',
      difficulty:'medium',
      prompt:`Írd le helyesen: <strong>${v.stem} + ${v.suff}</strong> = ?`,
      answer:corr,
      accepted:[corr],
      hint:'Ne „gy”-t írj csak azért, mert úgy hallod!',
      explanation: explain_j(corr),
      mistakeMap: {[norm(wrong1)]:'Hallás szerinti írásmód. A helyes alakban j szerepel.'}
    });

    if(ojExtra>55) break;
  }

  // --- EGYSZERŰSÍTÉS bővítés: dupla végű szavak + -val/-vel → hármas lenne → kettőt írunk
  const es_double_end = [
    ['több','többel'], ['szebb','szebbel'], ['jobb','jobbal'], ['kedd','keddel'],
    ['orr','orral'], ['mell','mellel'], ['száll','szállal'], ['kell','kellel'],
    ['vissz','visszel'], ['hossz','hosszal'], ['passz','passzal'], ['bossz','bosszal'],
  ];

  let esExtra=1;
  shuffle(es_double_end).forEach(([stem, corr])=>{
    const wrongTriple = corr.replace(/([a-záéíóöőúüű])\1\b/i, '$1$1$1'); // force triple at end (approx)
    const wrongV = stem + (stem.match(/[aeiouáéíóöőúüű]$/i) ? 'vel' : 'val');
    mcq({
      id:id('esx_mcq', esExtra++),
      topic:'egyszerusites',
      difficulty:(esExtra<18?'easy':(esExtra<36?'medium':'hard')),
      prompt:`Melyik a helyes alak? <strong>${stem} + -val/-vel</strong>`,
      answer:corr,
      options: ensureContains(shuffle([corr, wrongV, wrongTriple, stem+stem.slice(-1)+'al']).slice(0,4), corr),
      hint:'Három azonos mássalhangzó helyett kettőt írunk.',
      explanation: explain_simpl(corr),
      mistakeMap: {
        [norm(wrongV)]:'Itt nem marad külön v, és a három azonos betűt is el kell kerülni.',
        [norm(wrongTriple)]:'Három azonos betűt nem írunk egymás után toldaléknál: egyszerűsítünk.'
      }
    });

    input({
      id:id('esx_in', esExtra++),
      topic:'egyszerusites',
      difficulty:'medium',
      prompt:`Írd le helyesen: <strong>${stem}</strong> + <strong>-val/-vel</strong> = ?`,
      answer:corr,
      accepted:[corr],
      hint:'Egyszerűsítés: 3 azonos helyett 2.',
      explanation: explain_simpl(corr),
      mistakeMap:{}
    });
  });

  // további összetett kötőjeles példák
  const es_more_comp = [
    ['több büntetés','több-büntetés'],
['kedd délután','kedd-délután'],
['mell lapon','mell-lapon'],
    ['orr része','orr-része'],
    ['hossz szakasz','hossz-szakasz'],
    ['passz széria','passz-széria'],
  ];
  let esComp=20;
  es_more_comp.forEach(([raw,corr])=>{
    pick({
      id:id('esx_pick', esComp++),
      topic:'egyszerusites',
      difficulty:'hard',
      prompt:`Válaszd ki a helyes írásmódot: <strong>${raw}</strong>`,
      answer:'ok',
      pills:[
        {label:corr, value:'ok'},
        {label:corr.replace('-',''), value:'nodash'},
        {label:raw.replace(' ',''), value:'concat'}
      ],
      hint:'Összetett szónál a kötőjel gyakori megoldás a túl sok azonos betű „ütközésénél”.',
      explanation: explain_simpl(corr),
      mistakeMap:{
        'nodash':'Kötőjel nélkül nehezebben olvasható és könnyen „három azonos betű” érzetet kelt.',
        'concat':'A taghatárt jelöljük kötőjellel, hogy átlátható legyen.'
      }
    });
  });

  // --- HOSSZÚSÁG bővítés: több minimálpár
  const len_more = [
    ['mellett','mellet','mellett (valami mellett) – mellet (mell+et).'],
    ['ott','ot','ott (helyhatározó) – ot (nem helyes szó).'],
    ['hosszú','hoszú','hosszú két s-sel.'],
    ['vissza','visa','vissza két s-sel.'],
    ['kassa','kasa','kassa két s-sel.'],
    ['cselló','celó','cselló két l-lel.'],
    ['kassza','kasza','kassza két s-sel (kasza = eszköz).'],
    ['üss','üs','üss (felszólítás) – üs (nem helyes).'],
    ['mossa','mosa','mossa két s-sel.'],
    ['hitta','hita','hitte/hitta kettőzött t-vel.'],
    ['áll','ál','áll (állni) – ál (álom).'],
    ['jobb','job','jobb két b-vel.'],
    ['könnyen','könyen','könnyen ny+ny.'],
    ['szállt','szalt','szállt két l-lel.'],
  ];

  let lenExtra=1;
  shuffle(len_more).forEach(([good,bad,note])=>{
    mcq({
      id:id('hlx_mcq', lenExtra++),
      topic:'hosszusag',
      difficulty:(lenExtra<18?'easy':(lenExtra<36?'medium':'hard')),
      prompt:'Válaszd ki a helyes alakot!',
      answer:good,
      options: shuffle([good, bad]),
      hint:'A kettőzés sokszor jelentést is megkülönböztet.',
      explanation: explain_len(good, bad, note),
      mistakeMap:{[norm(bad)]:'Kimaradt a kettőzés, emiatt a szó hibás vagy más jelentésű.'}
    });
  });


// Final: expose
  window.QUESTIONS = Object.freeze(Q);
})();
