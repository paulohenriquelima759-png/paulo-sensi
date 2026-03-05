(() => {
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];

  const state = {
    sortAZ: true,
    onlyPopular: false,
    brand: "__ALL__",
    q: "",
    selected: null,
    plan: localStorage.getItem("ps_plan") || "free",   // free | std | pro
    vip: localStorage.getItem("ps_vip") || "",         // vip code local
    owner: false,
    favorites: new Set(JSON.parse(localStorage.getItem("ps_favs") || "[]"))
  };

  const meta = window.APP_DATA?.meta || { version:"v1.0", updatedAt:"" };

  // --- Helpers ---
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add("hidden"), 1700);
  };

  const norm = (s) => (s||"")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().trim();

  const getPhones = () => {
    const stored = localStorage.getItem("ps_phones");
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return (window.APP_DATA?.phones || []).slice();
  };

  const savePhones = (phones) => localStorage.setItem("ps_phones", JSON.stringify(phones));

  const getAd = () => {
    const stored = localStorage.getItem("ps_ad");
    if (stored) { try { return JSON.parse(stored); } catch {} }
    return window.APP_DATA?.ad || { visible:true, title:"Espaço de banner", sub:"", link:"" };
  };

  const saveAd = (ad) => localStorage.setItem("ps_ad", JSON.stringify(ad));

  const isVipUnlocked = () => {
    // sem servidor => trava simples
    if (state.plan === "pro") return true;
    if (state.plan === "std") return true;
    if (state.vip && state.vip.length >= 8) return true;
    return false;
  };

  const planLabel = () => {
    if (state.plan === "pro") return "Premium";
    if (state.plan === "std") return "Padrão";
    return "Grátis";
  };

  const copyText = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast("Copiado! ✅");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copiado! ✅");
    }
  };

  // --- Rendering ---
  const fillBrands = (phones) => {
    const brands = Array.from(new Set(phones.map(p => p.brand).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    const sel = $("#brandSelect");
    const keep = sel.value || "__ALL__";
    sel.innerHTML = `<option value="__ALL__">Todas marcas</option>` + brands.map(b => `<option value="${b}">${b}</option>`).join("");
    sel.value = brands.includes(keep) ? keep : "__ALL__";
  };

  const filtered = (phones) => {
    const qn = norm(state.q);
    return phones.filter(p => {
      if (state.brand !== "__ALL__" && p.brand !== state.brand) return false;
      if (state.onlyPopular && !p.popular) return false;
      if (!qn) return true;
      const hay = norm(`${p.brand} ${p.name}`);
      return hay.includes(qn);
    });
  };

  const sortPhones = (arr) => {
    const a = arr.slice();
    a.sort((x,y) => state.sortAZ ? x.name.localeCompare(y.name) : y.name.localeCompare(x.name));
    return a;
  };

  const renderStats = (total) => {
    $("#statCount").textContent = total;
    $("#statPlan").textContent = planLabel();
    $("#statVer").textContent = meta.version || "v1.0";
    $("#statDate").textContent = meta.updatedAt ? meta.updatedAt : "atualização";
    $("#year").textContent = new Date().getFullYear();
  };

  const sensiString = (p) => {
    // ESSÊNCIA COMPLETA (não só geral e red)
    // Você pode ajustar aqui depois
    const lines = [
      `📌 ${p.name} (${p.brand})`,
      `Geral: ${p.geral}`,
      `Red Dot: ${p.red}`,
      `DPI: ${p.dpi}`,
      `Dica: Ajuste ±2 se precisar`,
      `PAULO SENSI ✅`
    ];
    return lines.join("\n");
  };

  const cardHTML = (p) => {
    const fav = state.favorites.has(p.name) ? "★ Favorito" : "☆ Favorito";
    const vipBadge = p.vip ? `<span class="badge vip">VIP</span>` : "";
    const popBadge = p.popular ? `<span class="badge">Popular</span>` : "";
    return `
      <div class="card">
        <div class="card-top">
          <div class="card-title">${p.name}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
            ${vipBadge}
            ${popBadge}
          </div>
        </div>

        <div class="kvrow">
          <div class="kvbox"><div class="k">Geral</div><div class="v">${p.geral}</div></div>
          <div class="kvbox"><div class="k">Red Dot</div><div class="v">${p.red}</div></div>
          <div class="kvbox"><div class="k">DPI</div><div class="v">${p.dpi}</div></div>
        </div>

        <div class="card-actions">
          <button class="btn btn-primary btnCopy">Copiar Sensibilidade</button>
          <button class="btn btn-soft btnDetails">Ver detalhes</button>
        </div>

        <div class="card-actions" style="margin-top:10px">
          <button class="btn btn-ghost btnFav">${fav}</button>
        </div>
      </div>
    `;
  };

  const render = () => {
    const phones = getPhones();
    fillBrands(phones);

    const list = sortPhones(filtered(phones));
    renderStats(phones.length);

    const cards = $("#cards");
    cards.innerHTML = list.map(cardHTML).join("");

    // bind events
    const allCards = $$("#cards .card");
    allCards.forEach((node, idx) => {
      const p = list[idx];

      node.querySelector(".btnCopy").addEventListener("click", () => {
        // trava VIP simples
        if (p.vip && !isVipUnlocked()) {
          openPlans();
          toast("Esse modelo é VIP. Desbloqueie no Plano.");
          return;
        }
        copyText(sensiString(p));
      });

      node.querySelector(".btnDetails").addEventListener("click", () => openModal(p));

      node.querySelector(".btnFav").addEventListener("click", () => {
        if (state.favorites.has(p.name)) state.favorites.delete(p.name);
        else state.favorites.add(p.name);
        localStorage.setItem("ps_favs", JSON.stringify([...state.favorites]));
        render();
      });
    });

    renderAd();
  };

  // --- Modal details ---
  const openModal = (p) => {
    state.selected = p;
    $("#mTitle").textContent = p.name;
    $("#mSub").textContent = `Config Free Fire • ${p.brand} • PAULO SENSI`;
    $("#mGeral").textContent = p.geral;
    $("#mRed").textContent = p.red;
    $("#mDpi").textContent = p.dpi;

    const isFav = state.favorites.has(p.name);
    $("#mFav").textContent = isFav ? "★ Favorito" : "☆ Favorito";

    const note = p.vip ? (isVipUnlocked() ? "VIP liberado ✅" : "VIP bloqueado • desbloqueie no plano") : "Dica: teste e ajuste ±2.";
    $("#mNote").textContent = note;

    $("#modal").classList.remove("hidden");
  };

  const closeModal = () => $("#modal").classList.add("hidden");

  // --- Plans ---
  const openPlans = () => $("#plansModal").classList.remove("hidden");
  const closePlans = () => $("#plansModal").classList.add("hidden");

  // --- Ad box ---
  const renderAd = () => {
    const ad = getAd();
    const box = $("#adBox");

    if (!ad.visible) { box.style.display = "none"; return; }
    box.style.display = "block";

    $("#adTitle").textContent = ad.title || "Espaço de banner";
    $("#adSub").textContent = ad.sub || "Aqui você coloca AdSense / outra rede depois.";
  };

  // --- Generate suggestion (heurística) ---
  const generateSuggestion = (query) => {
    const q = (query || state.q || "").trim();
    if (!q) return null;

    // tenta separar marca / modelo
    const brands = ["Samsung","Apple","Xiaomi","Motorola","Realme","Infinix","OPPO","Vivo","Asus","LG","Huawei"];
    let brand = "Outra";
    for (const b of brands) {
      if (norm(q).includes(norm(b))) { brand = b; break; }
    }

    // heurística de valores (não é “IA real”, mas fica bem)
    const base = Math.min(100, Math.max(88, 92 + (q.length % 9)));
    const geral = Math.min(100, base + 4);
    const red = Math.min(100, base + 1);
    const dpi = 380 + ((q.length * 7) % 240);

    return { name: q, brand, geral, red, dpi, popular:false, vip:false, generated:true };
  };

  // --- Owner panel (trava simples) ---
  const OWNER_KEY = "ps_owner_ok";
  const ownerOk = () => localStorage.getItem(OWNER_KEY) === "1";

  const setOwner = (v) => {
    state.owner = v;
    if (v) localStorage.setItem(OWNER_KEY, "1");
    else localStorage.removeItem(OWNER_KEY);
    $("#ownerArea").classList.toggle("hidden", !v);
  };

  // senha simples (troque se quiser)
  const OWNER_PASS = "PAULO#SENSI@2026";

  // --- Install (PWA) ---
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $("#btnInstall").disabled = false;
  });

  // --- Bind UI ---
  const bind = () => {
    $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
    $("#btnClear").addEventListener("click", () => { state.q=""; $("#q").value=""; render(); });

    $("#brandSelect").addEventListener("change", (e) => { state.brand = e.target.value; render(); });

    $("#btnSort").addEventListener("click", () => {
      state.sortAZ = !state.sortAZ;
      $("#btnSort").textContent = state.sortAZ ? "Ordenar: A→Z" : "Ordenar: Z→A";
      render();
    });

    $("#btnOnlyPopular").addEventListener("click", () => {
      state.onlyPopular = !state.onlyPopular;
      $("#btnOnlyPopular").textContent = state.onlyPopular ? "Só populares: ON" : "Só populares: OFF";
      render();
    });

    $("#btnRandom").addEventListener("click", () => {
      const list = filtered(getPhones());
      if (!list.length) { toast("Nada pra sortear"); return; }
      const p = list[Math.floor(Math.random() * list.length)];
      openModal(p);
    });

    $("#btnGenerate").addEventListener("click", () => {
      const sug = generateSuggestion();
      if (!sug) return toast("Digite o modelo primeiro");
      openModal(sug);
      toast("Sugestão criada ✅");
    });

    $("#btnShare").addEventListener("click", async () => {
      const url = location.href;
      try {
        if (navigator.share) await navigator.share({ title:"PAULO SENSI", text:"Testa minha sensi:", url });
        else await copyText(url);
      } catch {}
    });

    // modal close
    $("#mClose").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target?.dataset?.close) closeModal(); });

    $("#mCopy").addEventListener("click", () => {
      const p = state.selected;
      if (!p) return;
      if (p.vip && !isVipUnlocked()) { openPlans(); toast("VIP bloqueado"); return; }
      copyText(sensiString(p));
    });

    $("#mFav").addEventListener("click", () => {
      const p = state.selected;
      if (!p) return;
      if (state.favorites.has(p.name)) state.favorites.delete(p.name);
      else state.favorites.add(p.name);
      localStorage.setItem("ps_favs", JSON.stringify([...state.favorites]));
      $("#mFav").textContent = state.favorites.has(p.name) ? "★ Favorito" : "☆ Favorito";
      render();
    });

    $("#mOpenPlans").addEventListener("click", () => openPlans());

    // plans
    $("#btnPlans").addEventListener("click", openPlans);
    $("#pClose").addEventListener("click", closePlans);
    $("#plansModal").addEventListener("click", (e) => { if (e.target?.dataset?.close) closePlans(); });

    $("#planFree").addEventListener("click", () => {
      state.plan = "free"; localStorage.setItem("ps_plan","free");
      toast("Plano Grátis ativado ✅");
      closePlans(); render();
    });

    // sem servidor => botão “quero” abre mensagem (você troca por link do seu pagamento)
    const askPay = (plan) => {
      const msg = `Quero o plano ${plan} do PAULO SENSI. Meu nome: ____`;
      copyText(msg);
      toast("Mensagem copiada. Cole no Whats/DM ✅");
    };

    $("#planStd").addEventListener("click", () => askPay("Padrão (R$9,99)"));
    $("#planPro").addEventListener("click", () => askPay("Premium (R$19,50)"));

    // ad
    $("#btnAdClose").addEventListener("click", () => {
      const ad = getAd(); ad.visible = false; saveAd(ad);
      renderAd(); toast("Anúncio ocultado");
    });
    $("#btnSimClick").addEventListener("click", () => {
      const ad = getAd();
      if (ad.link) window.open(ad.link, "_blank");
      else toast("Coloque um link no Painel do dono");
    });

    // owner
    $("#btnOpenOwner").addEventListener("click", () => {
      $("#ownerModal").classList.remove("hidden");
      setOwner(ownerOk());
    });
    $("#oClose").addEventListener("click", () => $("#ownerModal").classList.add("hidden"));
    $("#ownerModal").addEventListener("click", (e) => { if (e.target?.dataset?.close) $("#ownerModal").classList.add("hidden"); });

    $("#btnOwnerLogin").addEventListener("click", () => {
      const pass = $("#ownerPass").value || "";
      if (pass === OWNER_PASS) {
        setOwner(true);
        toast("Painel liberado ✅");
      } else {
        toast("Senha errada");
      }
    });

    $("#btnOwnerLogout").addEventListener("click", () => {
      setOwner(false);
      toast("Saiu do painel");
    });

    $("#btnFactoryReset").addEventListener("click", () => {
      if (!confirm("Resetar dados locais do app?")) return;
      localStorage.removeItem("ps_phones");
      localStorage.removeItem("ps_ad");
      localStorage.removeItem("ps_favs");
      localStorage.removeItem("ps_plan");
      localStorage.removeItem("ps_vip");
      toast("Resetado ✅");
      render();
    });

    $("#btnAddOne").addEventListener("click", () => {
      const name = $("#addName").value.trim();
      const g = parseInt($("#addG").value,10);
      const r = parseInt($("#addR").value,10);
      const d = parseInt($("#addD").value,10);

      if (!name || Number.isNaN(g) || Number.isNaN(r) || Number.isNaN(d)) {
        $("#addMsg").textContent = "Preencha tudo certinho.";
        return;
      }

      const phones = getPhones();
      const brand = (name.split(" ")[0] || "Outra").replace(/[^\wÀ-ÿ]/g,"");
      phones.unshift({ name, brand, geral:g, red:r, dpi:d, popular:false });

      savePhones(phones);
      $("#addMsg").textContent = "Adicionado ✅";
      $("#addName").value = $("#addG").value = $("#addR").value = $("#addD").value = "";
      render();
    });

    $("#btnBulkImport").addEventListener("click", () => {
      const txt = $("#bulkJson").value.trim();
      if (!txt) return $("#bulkMsg").textContent = "Cole um JSON primeiro.";
      try {
        const arr = JSON.parse(txt);
        if (!Array.isArray(arr)) throw new Error("não é array");

        const clean = arr
          .filter(x => x && x.name)
          .map(x => ({
            name: String(x.name),
            brand: String(x.brand || "Outra"),
            geral: Number(x.geral ?? 95),
            red: Number(x.red ?? 90),
            dpi: Number(x.dpi ?? 420),
            popular: !!x.popular,
            vip: !!x.vip
          }));

        const phones = getPhones();
        const merged = [...clean, ...phones];

        savePhones(merged);
        $("#bulkMsg").textContent = `Importado: ${clean.length} ✅`;
        render();
      } catch (e) {
        $("#bulkMsg").textContent = "JSON inválido.";
      }
    });

    $("#btnBulkExport").addEventListener("click", () => {
      const phones = getPhones();
      copyText(JSON.stringify(phones, null, 2));
      $("#bulkMsg").textContent = "Base copiada ✅";
    });

    $("#btnSaveAd").addEventListener("click", () => {
      const ad = getAd();
      ad.visible = true;
      ad.title = $("#adTitleIn").value.trim() || "Espaço de banner";
      ad.sub = $("#adSubIn").value.trim() || "Aqui você coloca AdSense / outra rede depois.";
      ad.link = $("#adLinkIn").value.trim() || "";
      saveAd(ad);
      $("#adMsg").textContent = "Anúncio salvo ✅";
      renderAd();
    });

    $("#btnHideAd").addEventListener("click", () => {
      const ad = getAd();
      ad.visible = false;
      saveAd(ad);
      $("#adMsg").textContent = "Ocultado ✅";
      renderAd();
    });

    $("#btnGenVip").addEventListener("click", () => {
      const code = "PS-" + Math.random().toString(16).slice(2,10).toUpperCase() + "-" + Date.now().toString().slice(-4);
      copyText(code);
      $("#vipMsg").textContent = "Código gerado e copiado ✅";
    });

    $("#btnApplyVip").addEventListener("click", () => {
      const code = $("#vipCodeIn").value.trim();
      if (code.length < 8) return $("#vipMsg").textContent = "Código inválido.";
      state.vip = code;
      localStorage.setItem("ps_vip", code);
      $("#vipMsg").textContent = "VIP ativado (local) ✅";
      toast("VIP ativado ✅");
      render();
    });

    // install
    $("#btnInstall").addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      $("#btnInstall").disabled = true;
    });
  };

  // close modals by clicking backdrop
  const bindBackdrop = () => {
    $$(".modal-backdrop").forEach(el => el.addEventListener("click", () => {
      el.closest(".modal").classList.add("hidden");
    }));
  };

  // boot
  const boot = () => {
    bind();
    bindBackdrop();
    render();

    // prefill ad inputs
    const ad = getAd();
    $("#adTitleIn").value = ad.title || "";
    $("#adSubIn").value = ad.sub || "";
    $("#adLinkIn").value = ad.link || "";

    // set plan label
    $("#btnSort").textContent = state.sortAZ ? "Ordenar: A→Z" : "Ordenar: Z→A";
    $("#btnOnlyPopular").textContent = state.onlyPopular ? "Só populares: ON" : "Só populares: OFF";
  };

  boot();
})();
