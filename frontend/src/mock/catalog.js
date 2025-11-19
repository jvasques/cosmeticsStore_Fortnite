export const mockCosmetics = [
  {
    id: "CID_001",
    name: "Galaxy Vanguard",
    description: "Um guerreiro cósmico que atravessa as constelações para salvar a ilha.",
    rarity: "legendary",
    type: "outfit",
    is_new: true,
    images: {
      icon: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=600&q=60",
    },
  },
  {
    id: "CID_002",
    name: "Neon Pulse",
    description: "Pulse elétrica vista no submundo cyberpunk de Neo Tilted.",
    rarity: "epic",
    type: "emote",
    is_on_sale: true,
    images: {
      icon: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=60",
    },
  },
  {
    id: "CID_003",
    name: "Aurora Drift",
    description: "Planador que deixa rastros de aurora boreal.",
    rarity: "rare",
    type: "glider",
    images: {
      icon: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=60",
    },
  },
];

export const mockBundles = [
  {
    offerId: "BUNDLE_001",
    bundleName: "Legado Cósmico",
    description: "Conjunto completo com traje, picareta e asa-delta.",
    regularPrice: 3200,
    finalPrice: 2400,
    isPromo: true,
  },
  {
    offerId: "BUNDLE_002",
    bundleName: "Circuito Neon",
    description: "Pacote temático com skins futuristas.",
    regularPrice: 2800,
    finalPrice: 2800,
    isPromo: false,
  },
];

export const mockUsers = [
  {
    id: "user-1",
    displayName: "BuilderPro",
    totalItems: 87,
    region: "BR",
  },
  {
    id: "user-2",
    displayName: "Skyline",
    totalItems: 54,
    region: "NA",
  },
];