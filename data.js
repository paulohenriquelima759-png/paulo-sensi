/* Base local (sem servidor) */
window.APP_DATA = {
  meta: {
    version: "v1.0",
    updatedAt: "05/03/2026",
    ownerHint: "PauloSensi"
  },

  // modelos (você pode importar milhares pelo Painel)
  phones: [
    // Samsung
    { name:"Samsung A16", brand:"Samsung", geral:95, red:90, dpi:420, popular:true },
    { name:"Samsung A12", brand:"Samsung", geral:92, red:88, dpi:400, popular:true },
    { name:"Samsung A22", brand:"Samsung", geral:94, red:90, dpi:410, popular:true },
    { name:"Samsung A32", brand:"Samsung", geral:95, red:92, dpi:420, popular:false },
    { name:"Samsung A52", brand:"Samsung", geral:97, red:94, dpi:430, popular:true },
    { name:"Samsung A54", brand:"Samsung", geral:98, red:95, dpi:440, popular:true },
    { name:"Samsung S21", brand:"Samsung", geral:99, red:96, dpi:560, popular:true },
    { name:"Samsung S23", brand:"Samsung", geral:100, red:97, dpi:600, popular:true },

    // Apple
    { name:"iPhone 11", brand:"Apple", geral:99, red:96, dpi:560, popular:true, vip:true },
    { name:"iPhone 12", brand:"Apple", geral:100, red:97, dpi:600, popular:true, vip:true },
    { name:"iPhone 13", brand:"Apple", geral:100, red:97, dpi:600, popular:true, vip:true },
    { name:"iPhone XR", brand:"Apple", geral:98, red:95, dpi:520, popular:false, vip:true },

    // Xiaomi / Redmi / Poco
    { name:"Redmi Note 11", brand:"Xiaomi", geral:95, red:90, dpi:420, popular:true },
    { name:"Redmi Note 12", brand:"Xiaomi", geral:96, red:92, dpi:430, popular:true },
    { name:"Redmi Note 13", brand:"Xiaomi", geral:97, red:93, dpi:440, popular:true },
    { name:"Poco X3", brand:"Xiaomi", geral:97, red:92, dpi:430, popular:true },
    { name:"Poco X5", brand:"Xiaomi", geral:98, red:95, dpi:450, popular:true },

    // Motorola
    { name:"Moto G84", brand:"Motorola", geral:96, red:92, dpi:430, popular:true },
    { name:"Moto G54", brand:"Motorola", geral:95, red:91, dpi:420, popular:true },
    { name:"Moto G73", brand:"Motorola", geral:96, red:92, dpi:430, popular:false },

    // Realme
    { name:"Realme C55", brand:"Realme", geral:95, red:90, dpi:420, popular:true },
    { name:"Realme 11", brand:"Realme", geral:96, red:92, dpi:430, popular:false },

    // Infinix
    { name:"Infinix Hot 30", brand:"Infinix", geral:94, red:90, dpi:410, popular:false },

    // Oppo
    { name:"OPPO A78", brand:"OPPO", geral:95, red:91, dpi:420, popular:false },

    // Vivo
    { name:"Vivo Y21", brand:"Vivo", geral:93, red:89, dpi:405, popular:false }
  ],

  ad: {
    visible: true,
    title: "Espaço de banner",
    sub: "Aqui você coloca AdSense / outra rede depois.",
    link: ""
  }
};
