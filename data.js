// data.js
// Base inicial (você pode aumentar com IMPORT)
// Estrutura: { id, brand, model, dpi, general, redDot, popular }

window.PS_DATA_VERSION = "v1.0";
window.PS_UPDATED_AT = new Date().toISOString();

window.PS_DEVICES = [
  // Samsung
  { id:"s-a16", brand:"Samsung", model:"A16", dpi:420, general:95, redDot:90, popular:true },
  { id:"s-a12", brand:"Samsung", model:"A12", dpi:400, general:92, redDot:88, popular:true },
  { id:"s-a22", brand:"Samsung", model:"A22", dpi:410, general:94, redDot:90, popular:true },
  { id:"s-a32", brand:"Samsung", model:"A32", dpi:410, general:94, redDot:89, popular:true },
  { id:"s-a52", brand:"Samsung", model:"A52", dpi:450, general:96, redDot:92, popular:true },
  { id:"s-a53", brand:"Samsung", model:"A53", dpi:450, general:96, redDot:92, popular:true },
  { id:"s-a54", brand:"Samsung", model:"A54", dpi:460, general:97, redDot:93, popular:true },
  { id:"s-s20fe", brand:"Samsung", model:"S20 FE", dpi:520, general:98, redDot:95, popular:true },
  { id:"s-s21", brand:"Samsung", model:"S21", dpi:560, general:99, redDot:96, popular:false },
  { id:"s-s22", brand:"Samsung", model:"S22", dpi:560, general:99, redDot:96, popular:false },
  { id:"s-s23", brand:"Samsung", model:"S23", dpi:600, general:100, redDot:97, popular:false },

  // Xiaomi / Redmi / Poco
  { id:"x-rn11", brand:"Xiaomi", model:"Redmi Note 11", dpi:420, general:95, redDot:90, popular:true },
  { id:"x-rn12", brand:"Xiaomi", model:"Redmi Note 12", dpi:430, general:96, redDot:91, popular:true },
  { id:"x-rn13", brand:"Xiaomi", model:"Redmi Note 13", dpi:440, general:97, redDot:92, popular:true },
  { id:"p-x3", brand:"Poco", model:"X3", dpi:500, general:97, redDot:93, popular:true },
  { id:"p-x3pro", brand:"Poco", model:"X3 Pro", dpi:520, general:98, redDot:95, popular:true },
  { id:"p-f3", brand:"Poco", model:"F3", dpi:560, general:99, redDot:96, popular:false },

  // Motorola
  { id:"m-g22", brand:"Motorola", model:"Moto G22", dpi:410, general:93, redDot:88, popular:true },
  { id:"m-g32", brand:"Motorola", model:"Moto G32", dpi:430, general:95, redDot:90, popular:true },
  { id:"m-g52", brand:"Motorola", model:"Moto G52", dpi:450, general:96, redDot:92, popular:true },
  { id:"m-g54", brand:"Motorola", model:"Moto G54", dpi:450, general:97, redDot:92, popular:true },
  { id:"m-g84", brand:"Motorola", model:"Moto G84", dpi:460, general:97, redDot:93, popular:true },
  { id:"m-edge20", brand:"Motorola", model:"Edge 20", dpi:520, general:98, redDot:95, popular:false },

  // Apple
  { id:"a-ip11", brand:"Apple", model:"iPhone 11", dpi:560, general:99, redDot:96, popular:true },
  { id:"a-ip12", brand:"Apple", model:"iPhone 12", dpi:600, general:100, redDot:97, popular:true },
  { id:"a-ip13", brand:"Apple", model:"iPhone 13", dpi:620, general:100, redDot:97, popular:true },
  { id:"a-ip14", brand:"Apple", model:"iPhone 14", dpi:640, general:100, redDot:98, popular:false },
  { id:"a-ip15", brand:"Apple", model:"iPhone 15", dpi:660, general:100, redDot:98, popular:false },

  // Realme / Oppo / Vivo (exemplos)
  { id:"r-c55", brand:"Realme", model:"C55", dpi:420, general:95, redDot:90, popular:true },
  { id:"o-a57", brand:"Oppo", model:"A57", dpi:410, general:93, redDot:88, popular:false },
  { id:"v-y21", brand:"Vivo", model:"Y21", dpi:400, general:92, redDot:87, popular:false },
];

// Marcas conhecidas (pra filtro)
window.PS_BRANDS = [
  "Samsung","Motorola","Xiaomi","Redmi","Poco","Apple","Realme","Oppo","Vivo","Infinix","Asus","LG","Huawei","Nokia","Tecno","OnePlus"
];
