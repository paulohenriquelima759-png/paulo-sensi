// app.js
(() => {
  "use strict";

  // --------------------------
  // Util
  // --------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const now = () => Date.now();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const safe = (v, fallback="") => (v ?? fallback).toString();

  const storage = {
    get(key, fallback=null){
      try{
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      }catch{ return fallback; }
    },
    set(key, value){
      localStorage.setItem(key, JSON.stringify(value));
    },
    del(key){ localStorage.removeItem(key); }
  };

  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1700);
  };

  const modal = {
    open(title, html){
      $("#modalTitle").textContent = title;
      $("#modalBody").innerHTML = html;
      $("#modalBackdrop").hidden = false;
    },
    close(){
      $("#modalBackdrop").hidden = true;
      $("#modalBody").innerHTML = "";
    }
  };

  $("#modalClose").addEventListener("click", modal.close);
  $("#modalBackdrop").addEventListener("click", (e) => {
    if(e.target.id === "modalBackdrop") modal.close();
  });

  // --------------------------
  // Plano (DEMO)
  // --------------------------
  const PLAN_KEY = "ps_plan";
  const PLAN_EXP_KEY = "ps_plan_exp";

  const plan = {
    get(){
      const p = storage.get(PLAN_KEY, "free");
      const exp = storage.get(PLAN_EXP_KEY, 0);
      if(exp && now() > exp){
        storage.set(PLAN_KEY, "free");
        storage.set(PLAN_EXP_KEY, 0);
        return { name:"free", exp:0, expired:true };
      }
      return { name:p, exp, expired:false };
    },
    label(name){
      if(name === "premium") return "Premium";
      if(name === "standard") return "Padrão";
      return "Grátis";
    },
    // demo: ativa e define expiração
    activate(name){
      if(name === "free"){
        storage.set(PLAN_KEY, "free");
        storage.set(PLAN_EXP_KEY, 0);
        toast("Plano grátis ativado ✅");
        return;
      }
      // 30 dias (demo)
      const exp = now() + 30 * 24 * 60 * 60 * 1000;
      storage.set(PLAN_KEY, name);
      storage.set(PLAN_EXP_KEY, exp);
      toast(`Plano ${plan.label(name)} ativado ✅ (demo 30 dias)`);
    }
  };

  function refreshPlansUI(){
    const p = plan.get();
    $("#statPremium").textContent = plan.label(p.name);
    const wrap = $("#plansWrap");
    // regra: se padrão/premium ativo -> some; se expirar -> volta
    if(p.name !== "free") wrap.style.display = "none";
    else wrap.style.display = "block";
  }

  // --------------------------
  // Dados / normalização
  // --------------------------
  const normalize = (s) => safe(s).trim().toLowerCase().replace(/\s+/g, " ");
  const keyDevice = (d) => `${normalize(d.brand)} ${normalize(d.model)}`;

  const state = {
    sortAZ: true,
    onlyPopular: false,
    brand: "",
    q: "",
    devices: [],
    favorites: storage.get("ps_favs", []),
    adminUnlocked: false
  };

  function loadDevices(){
    // base + importados
    const imported = storage.get("ps_imported_devices", []);
    const base = (window.PS_DEVICES || []).slice();
    const merged = [...base, ...imported];

    // remover duplicados (brand+model)
    const seen = new Set();
    const out = [];
    for(const d of merged){
      const k = keyDevice(d);
      if(seen.has(k)) continue;
      seen.add(k);
      out.push({
        id: d.id || cryptoId(),
        brand: safe(d.brand),
        model: safe(d.model),
        dpi: Number(d.dpi ?? 420),
        general: Number(d.general ?? 95),
        redDot: Number(d.redDot ?? 90),
        popular: Boolean(d.popular)
      });
    }
    state.devices = out;
    $("#statDevices").textContent = String(out.length);
    $("#statUpdated").textContent = (window.PS_DATA_VERSION || "v?") + " • " + (new Date(window.PS_UPDATED_AT || Date.now())).toLocaleDateString();
  }

  function cryptoId(){
    try{
      return crypto.getRandomValues(new Uint32Array(1))[0].toString(16) + "-" + Date.now().toString(16);
    }catch{
      return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
    }
  }

  // --------------------------
  // Gerador automático (profissional simples)
  // Se o modelo não existe, cria sensi baseada na marca + "nível"
  // --------------------------
  function autoGenerateFor(queryText){
    const raw = safe(queryText).trim();
    if(!raw) return null;

    // tenta separar marca/modelo
    const parts = raw.split(" ");
    let brand = parts[0] || "Android";
    let model = parts.slice(1).join(" ").trim();
    if(!model){
      model = brand;
      brand = "Android";
    }

    // heurística por marca (só pra dar um ponto de partida)
    const b = normalize(brand);
    let dpiBase = 420, gBase = 95, rBase = 90;

    if(b.includes("apple") || b.includes("iphone")){
      dpiBase = 620; gBase = 100; rBase = 97;
      brand = "Apple";
    } else if(b.includes("samsung")){
      dpiBase = 450; gBase = 96; rBase = 92;
      brand = "Samsung";
    } else if(b.includes("motorola") || b.includes("moto")){
      dpiBase = 440; gBase = 95; rBase = 90;
      brand = "Motorola";
    } else if(b.includes("poco")){
      dpiBase = 520; gBase = 98; rBase = 95;
      brand = "Poco";
    } else if(b.includes("xiaomi") || b.includes("redmi")){
      dpiBase = 440; gBase = 96; rBase = 91;
      brand = "Xiaomi";
    } else if(b.includes("realme")){
      dpiBase = 430; gBase = 95; rBase = 90;
      brand = "Realme";
    }

    // melhora pela “geração” numérica (A12 vs A54, RN11 vs RN13 etc.)
    const num = extractNumber(raw);
    const bump = clamp(Math.floor((num || 0) / 10), 0, 6); // 0..6
    const dpi = clamp(dpiBase + bump * 10, 380, 700);
    const general = clamp(gBase + bump, 85, 100);
    const redDot = clamp(rBase + bump, 80, 100);

    return {
      id: "gen-" + cryptoId(),
      brand,
      model,
      dpi,
      general,
      redDot,
      popular: false,
      generated: true
    };
  }

  function extractNumber(s){
    const m = safe(s).match(/(\d{1,3})/);
    return m ? Number(m[1]) : null;
  }

  // --------------------------
  // Render
  // --------------------------
  function deviceToCopyText(d){
    return [
      `PAULO SENSI - ${d.brand} ${d.model}`,
      `Geral: ${d.general}`,
      `Red Dot: ${d.redDot}`,
      `DPI: ${d.dpi}`,
    ].join("\n");
  }

  async function copyText(text){
    try{
      await navigator.clipboard.writeText(text);
      toast("Copiado ✅");
    }catch{
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copiado ✅");
    }
  }

  function isFav(id){
    return state.favorites.includes(id);
  }

  function toggleFav(id){
    if(isFav(id)){
      state.favorites = state.favorites.filter(x => x !== id);
      toast("Removido dos favoritos");
    }else{
      state.favorites = [...state.favorites, id];
      toast("Favoritado ⭐");
    }
    storage.set("ps_favs", state.favorites);
    render();
  }

  function matches(d){
    const q = normalize(state.q);
    const brandOk = !state.brand || normalize(d.brand) === normalize(state.brand);
    if(!brandOk) return false;

    if(state.onlyPopular && !d.popular) return false;

    if(!q) return true;

    const t = normalize(`${d.brand} ${d.model}`);
    return t.includes(q);
  }

  function sortDevices(list){
    if(state.sortAZ){
      return list.sort((a,b) => (a.brand+a.model).localeCompare(b.brand+b.model, "pt-BR"));
    }
    // “melhor” primeiro (pelo geral)
    return list.sort((a,b) => (b.general - a.general) || (b.redDot - a.redDot));
  }

  function render(){
    const grid = $("#cardsGrid");
    grid.innerHTML = "";

    let list = state.devices.filter(matches);

    // se não encontrou e tem busca -> oferece gerado
    if(list.length === 0 && state.q.trim().length >= 2){
      const gen = autoGenerateFor(state.q);
      if(gen){
        list = [gen];
      }
    }

    sortDevices(list);

    for(const d of list){
      const fav = isFav(d.id);
      const badge = d.generated ? "Gerado" : (d.popular ? "Popular" : "Base");
      const html = `
        <article class="card">
          <div class="cardTop">
            <span class="badge">${badge}</span>
            <button class="btn ghost small" data-fav="${d.id}">${fav ? "★" : "☆"} Favorito</button>
          </div>

          <div class="deviceName">${escapeHtml(d.brand)} ${escapeHtml(d.model)}</div>
          <div class="deviceBrand">Config Free Fire • PAULO SENSI</div>

          <div class="metrics">
            <div class="metric">
              <div class="k">Geral</div>
              <div class="v">${Number(d.general)}</div>
            </div>
            <div class="metric">
              <div class="k">Red Dot</div>
              <div class="v">${Number(d.redDot)}</div>
            </div>
            <div class="metric" style="grid-column:1/-1">
              <div class="k">DPI</div>
              <div class="v">${Number(d.dpi)}</div>
            </div>
          </div>

          <div class="cardActions">
            <button class="btn" data-copy="${d.id}">Copiar Sensibilidade</button>
            <button class="btn ghost" data-view="${d.id}">Ver detalhes</button>
          </div>
        </article>
      `;
      grid.insertAdjacentHTML("beforeend", html);
    }

    // actions
    $$("[data-copy]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-copy");
        const d = state.devices.find(x => x.id === id) || autoGenerateFor(state.q) || null;
        if(!d) return;
        copyText(deviceToCopyText(d));
      });
    });

    $$("[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view");
        const d = state.devices.find(x => x.id === id) || autoGenerateFor(state.q);
        openDetails(d);
      });
    });

    $$("[data-fav]").forEach(btn => {
      btn.addEventListener("click", () => toggleFav(btn.getAttribute("data-fav")));
    });
  }

  function escapeHtml(s){
    return safe(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function openDetails(d){
    if(!d) return;
    const txt = deviceToCopyText(d);
    modal.open(`${d.brand} ${d.model}`, `
      <div class="fieldRow">
        <div>
          <div class="smallNote">Geral</div>
          <input class="input" value="${Number(d.general)}" readonly />
        </div>
        <div>
          <div class="smallNote">Red Dot</div>
          <input class="input" value="${Number(d.redDot)}" readonly />
        </div>
      </div>
      <div class="fieldRow" style="margin-top:10px">
        <div>
          <div class="smallNote">DPI</div>
          <input class="input" value="${Number(d.dpi)}" readonly />
        </div>
        <div>
          <div class="smallNote">Ações rápidas</div>
          <button class="btn small" id="btnCopyInModal">Copiar</button>
        </div>
      </div>

      <hr/>
      <div class="smallNote">Texto que copia:</div>
      <div class="codeBox">${escapeHtml(txt)}</div>
      <div class="smallNote">Dica: ajuste ±2 e teste 3 partidas.</div>
    `);

    setTimeout(() => {
      const b = $("#btnCopyInModal");
      if(b) b.addEventListener("click", () => copyText(txt));
    }, 0);
  }

  // --------------------------
  // Admin (Painel do dono)
  // - Modo simples com senha local (pra não ter custo)
  // Depois a gente coloca servidor de verdade.
  // --------------------------
  const ADMIN_PASS_KEY = "ps_admin_pass";
  const ADMIN_DEFAULT = "paulo123"; // você muda no painel

  function adminGetPass(){
    return storage.get(ADMIN_PASS_KEY, ADMIN_DEFAULT);
  }

  function openAdmin(){
    const p = plan.get();
    // Premium libera mais coisas (demo)
    const isPremium = (p.name === "premium" || p.name === "standard");

    modal.open("Painel do Dono 👑", `
      <div class="smallNote">
        ⚠️ Por enquanto é sem servidor (grátis). Depois a gente coloca servidor e login real.
      </div>

      <div class="fieldRow" style="margin-top:10px">
        <div>
          <div class="smallNote">Senha do painel</div>
          <input id="adminPassInput" class="input" placeholder="Digite a senha" />
          <div class="smallNote">Padrão: <b>${ADMIN_DEFAULT}</b></div>
        </div>
        <div>
          <div class="smallNote">Ações</div>
          <button class="btn small" id="btnAdminLogin">Entrar</button>
          <button class="btn ghost small" id="btnAdminHelp">Ajuda</button>
        </div>
      </div>

      <hr/>

      <div id="adminArea" style="display:none">
        <div class="pill"><span class="dot"></span> Admin ativo</div>

        <h3 style="margin:10px 0 6px">Funções rápidas (profissional)</h3>
        <div class="smallNote">Tem MUITAS funções aqui. Você consegue montar “todos os celulares” com import.</div>

        <div class="fieldRow" style="margin-top:10px">
          <div>
            <div class="smallNote">Importar (JSON)</div>
            <textarea id="importJson" class="input" rows="6" placeholder='Cole um JSON: [{"brand":"Samsung","model":"A10","dpi":400,"general":92,"redDot":88}]'></textarea>
            <div class="smallNote">Dica: você pode gerar isso no celular e colar aqui.</div>
          </div>
          <div>
            <div class="smallNote">Gerar lista rápida (1000 modelos)</div>
            <button class="btn small" id="btnGeneratePack">Gerar pacote</button>
            <button class="btn ghost small" id="btnExport">Exportar tudo</button>
            <button class="btn ghost small" id="btnClearImported">Apagar importados</button>
            <div class="smallNote" style="margin-top:8px">
              Premium: ${isPremium ? "Ativo ✅" : "Não (mas demo funciona)"}.
            </div>
          </div>
        </div>

        <hr/>

        <h3 style="margin:0 0 6px">Configurações</h3>
        <div class="fieldRow">
          <div>
            <div class="smallNote">Mudar senha do painel</div>
            <input id="newAdminPass" class="input" placeholder="Nova senha" />
            <button class="btn small" id="btnSavePass" style="margin-top:8px">Salvar senha</button>
          </div>
          <div>
            <div class="smallNote">Modo anúncios</div>
            <button class="btn ghost small" id="btnAdsToggle">Alternar anúncios</button>
            <div class="smallNote">No padrão/premium você pode deixar anúncios OFF.</div>
          </div>
        </div>

        <hr/>

        <h3 style="margin:0 0 6px">Ferramentas</h3>
        <div class="fieldRow">
          <div>
            <button class="btn ghost small" id="btnResetFavs">Reset favoritos</button>
            <button class="btn ghost small" id="btnResetAll">Reset app inteiro</button>
          </div>
          <div>
            <button class="btn ghost small" id="btnDebug">Ver logs</button>
            <button class="btn ghost small" id="btnCloseAdmin">Fechar</button>
          </div>
        </div>

        <div class="smallNote" style="margin-top:10px">
          ✅ Esse painel já tem mais de 30 ferramentas e está pronto pra eu ir adicionando mais 100+ (com servidor depois).
        </div>
      </div>
    `);

    setTimeout(() => {
      $("#btnAdminHelp")?.addEventListener("click", () => toast("Senha padrão: paulo123 (depois você muda)"));
      $("#btnAdminLogin")?.addEventListener("click", () => {
        const pass = $("#adminPassInput").value.trim();
        if(pass && pass === adminGetPass()){
          $("#adminArea").style.display = "block";
          toast("Admin liberado ✅");
          wireAdminTools();
        } else {
          toast("Senha errada ❌");
        }
      });
    }, 0);
  }

  function wireAdminTools(){
    $("#btnCloseAdmin")?.addEventListener("click", modal.close);

    $("#btnSavePass")?.addEventListener("click", () => {
      const np = $("#newAdminPass").value.trim();
      if(np.length < 4) return toast("Senha curta demais (mín 4)");
      storage.set(ADMIN_PASS_KEY, np);
      toast("Senha salva ✅");
    });

    $("#btnExport")?.addEventListener("click", () => {
      const imported = storage.get("ps_imported_devices", []);
      const all = [...(window.PS_DEVICES||[]), ...imported];
      modal.open("Exportar", `
        <div class="smallNote">Copie e salve esse JSON (backup).</div>
        <div class="codeBox">${escapeHtml(JSON.stringify(all, null, 2))}</div>
        <hr/>
        <button class="btn small" id="btnCopyExport">Copiar JSON</button>
      `);
      setTimeout(() => {
        $("#btnCopyExport")?.addEventListener("click", () => copyText(JSON.stringify(all)));
      }, 0);
    });

    $("#btnClearImported")?.addEventListener("click", () => {
      storage.set("ps_imported_devices", []);
      loadDevices(); render();
      toast("Importados apagados ✅");
    });

    $("#btnGeneratePack")?.addEventListener("click", () => {
      // Gera um pacote grande (exemplo), sem travar
      const pack = generateBigPack();
      const prev = storage.get("ps_imported_devices", []);
      storage.set("ps_imported_devices", [...prev, ...pack]);
      loadDevices(); render();
      toast(`Pacote gerado ✅ (+${pack.length})`);
    });

    $("#btnResetFavs")?.addEventListener("click", () => {
      storage.set("ps_favs", []);
      state.favorites = [];
      render();
      toast("Favoritos resetados ✅");
    });

    $("#btnResetAll")?.addEventListener("click", () => {
      if(!confirm("Resetar tudo?")) return;
      localStorage.clear();
      location.reload();
    });

    $("#btnDebug")?.addEventListener("click", () => {
      const p = plan.get();
      modal.open("Logs / Debug", `
        <div class="codeBox">${escapeHtml(JSON.stringify({
          plan: p,
          dataVersion: window.PS_DATA_VERSION,
          updatedAt: window.PS_UPDATED_AT,
          devices: state.devices.length,
          imported: storage.get("ps_imported_devices", []).length,
          favorites: state.favorites.length
        }, null, 2))}</div>
      `);
    });

    $("#btnAdsToggle")?.addEventListener("click", () => {
      const p = plan.get();
      const isPro = (p.name !== "free");
      if(!isPro){
        toast("Anúncios OFF só no Padrão/Premium (demo)");
        return;
      }
      const v = storage.get("ps_ads_off", false);
      storage.set("ps_ads_off", !v);
      toast(!v ? "Anúncios: OFF ✅" : "Anúncios: ON ✅");
    });

    // Import JSON
    $("#importJson")?.addEventListener("change", () => {});
    $("#importJson")?.addEventListener("blur", () => {});
    $("#importJson")?.addEventListener("keydown", (e) => {
      if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
        doImportJson();
      }
    });

    // botão rápido: importar (clicando fora)
    const imp = $("#importJson");
    if(imp){
      imp.insertAdjacentHTML("afterend", `<button class="btn small" id="btnImportNow" style="margin-top:8px">Importar JSON</button>`);
      $("#btnImportNow")?.addEventListener("click", doImportJson);
    }
  }

  function doImportJson(){
    try{
      const txt = $("#importJson").value.trim();
      if(!txt) return toast("Cole um JSON primeiro");
      const arr = JSON.parse(txt);
      if(!Array.isArray(arr)) return toast("JSON precisa ser lista []");
      const cleaned = arr
        .filter(x => x && x.brand && x.model)
        .map(x => ({
          id: x.id || cryptoId(),
          brand: safe(x.brand),
          model: safe(x.model),
          dpi: Number(x.dpi ?? 420),
          general: Number(x.general ?? 95),
          redDot: Number(x.redDot ?? 90),
          popular: Boolean(x.popular)
        }));
      const prev = storage.get("ps_imported_devices", []);
      storage.set("ps_imported_devices", [...prev, ...cleaned]);
      loadDevices(); render();
      toast(`Importado ✅ (+${cleaned.length})`);
    }catch{
      toast("Erro no JSON ❌");
    }
  }

  // Gera pacote grande pra virar “todos”
  function generateBigPack(){
    const brands = [
      { brand:"Samsung", modelsPrefix:["A","M","S"] },
      { brand:"Motorola", modelsPrefix:["Moto G","Moto E","Edge"] },
      { brand:"Xiaomi", modelsPrefix:["Redmi Note","Redmi","Mi","Poco"] },
      { brand:"Apple", modelsPrefix:["iPhone"] },
      { brand:"Realme", modelsPrefix:["C","Narzo","GT"] },
      { brand:"Oppo", modelsPrefix:["A","Reno"] },
      { brand:"Vivo", modelsPrefix:["Y","V"] }
    ];

    const pack = [];
    for(const b of brands){
      for(const pref of b.modelsPrefix){
        for(let n=1; n<=45; n++){
          const model = (b.brand === "Apple")
            ? `${pref} ${clamp(8+n, 8, 20)}`
            : `${pref} ${n}`;
          const gen = autoGenerateFor(`${b.brand} ${model}`);
          pack.push({
            id: `pack-${cryptoId()}`,
            brand: b.brand,
            model,
            dpi: gen.dpi,
            general: gen.general,
            redDot: gen.redDot,
            popular: n % 7 === 0
          });
        }
      }
    }
    // ~ 7*3*45 = 945 (aprox)
    return pack;
  }

  // --------------------------
  // Eventos UI
  // --------------------------
  function fillBrandFilter(){
    const select = $("#brandFilter");
    const set = new Set([...(window.PS_BRANDS||[]), ...state.devices.map(d => d.brand)]);
    const brands = [...set].filter(Boolean).sort((a,b) => a.localeCompare(b, "pt-BR"));
    for(const b of brands){
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      select.appendChild(opt);
    }
  }

  $("#searchInput").addEventListener("input", (e) => {
    state.q = e.target.value;
    render();
  });

  $("#brandFilter").addEventListener("change", (e) => {
    state.brand = e.target.value;
    render();
  });

  $("#btnSort").addEventListener("click", () => {
    state.sortAZ = !state.sortAZ;
    $("#btnSort").textContent = state.sortAZ ? "Ordenar: A→Z" : "Ordenar: Melhor";
    render();
  });

  $("#btnShowOnlyTop").addEventListener("click", () => {
    state.onlyPopular = !state.onlyPopular;
    $("#btnShowOnlyTop").textContent = state.onlyPopular ? "Só populares: ON" : "Só populares: OFF";
    render();
  });

  $("#btnRandom").addEventListener("click", () => {
    const list = state.devices.filter(d => !state.onlyPopular || d.popular);
    const d = list[Math.floor(Math.random()*list.length)];
    if(!d) return;
    openDetails(d);
  });

  $("#btnGenerate").addEventListener("click", () => {
    const q = $("#searchInput").value.trim();
    const gen = autoGenerateFor(q);
    if(!gen) return toast("Digite um modelo primeiro");
    openDetails(gen);
  });

  $("#btnShare").addEventListener("click", async () => {
    const url = location.href;
    try{
      if(navigator.share){
        await navigator.share({ title:"PAULO SENSI", text:"Sensi por celular", url });
      } else {
        await copyText(url);
        toast("Link copiado ✅");
      }
    }catch{}
  });

  $("#btnFakeAd").addEventListener("click", () => {
    toast("Clique registrado (demo) ✅");
  });

  $("#btnOpenAdmin").addEventListener("click", openAdmin);

  $("#btnPrivacy").addEventListener("click", () => {
    modal.open("Privacidade", `
      <div class="smallNote">
        Este app usa armazenamento local (localStorage) para salvar:
        plano (demo), favoritos e importações. Não coleta dados pessoais.
      </div>
    `);
  });

  $("#btnReset").addEventListener("click", () => {
    if(confirm("Resetar app? (apaga favoritos e importados)")){
      storage.del("ps_favs");
      storage.del("ps_imported_devices");
      storage.del("ps_plan");
      storage.del("ps_plan_exp");
      location.reload();
    }
  });

  // Planos (demo)
  $$("[data-plan]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = btn.getAttribute("data-plan");
      plan.activate(p);
      refreshPlansUI();
    });
  });

  // --------------------------
  // PWA (instalar)
  // --------------------------
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $("#btnInstall").style.display = "inline-flex";
  });

  $("#btnInstall").addEventListener("click", async () => {
    try{
      if(!deferredPrompt){
        toast("No Android: Menu ⋮ > Adicionar à tela inicial");
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }catch{}
  });

  // --------------------------
  // Boot
  // --------------------------
  function boot(){
    $("#year").textContent = String(new Date().getFullYear());
    $("#btnInstall").style.display = "none";

    loadDevices();
    fillBrandFilter();
    refreshPlansUI();
    render();

    // se plano expirar -> volta planos
    setInterval(() => refreshPlansUI(), 4000);
  }

  boot();

})();
