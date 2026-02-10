const inkColors = {
  Amber: "#f9cd73ff",
  Amethyst: "#cf9fd0ff",
  Emerald: "#a0d4aaff",
  Ruby: "#eeb3b2ff",
  Sapphire: "#b0daedff",
  Steel: "#cfd5ddff"
};

async function loadCard(cardData) {
  const response = await fetch("CharacterFrame.svg");
  const svgText = await response.text();

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

  const svgElement = svgDoc.documentElement;

  document.getElementById("card-container")
    .appendChild(svgElement);

  updateCharacterCard(svgElement, cardData);
}

function updateCharacterCard(svgRoot, card) {
  const get = (id) => svgRoot.querySelector(`#${id}`);

  console.log("Updating v2: ", card.name);
  console.log("Name element v2: ", get("name"));
  
  // -----------------------------
  // TEXT
  // -----------------------------

  get("name").textContent = card.name || "TITLE";
  get("version").textContent = card.version || "Version";

  get("ink-color-text").textContent = card.ink || "InkColor";

  get("classifications").textContent =
    card.classifications?.join(" · ") || "Classifications";

  get("artist").textContent =
    card.illustrators?.[0] || "Artist";

  get("card-and-set-text").textContent =
    `${card.collector_number || "c#"}`
    + `/204`
    + ` · ${card.lang?.toUpperCase() || "EN"}`
    + ` · ${card.set?.code || "1"}`;

  // -----------------------------
  // INK COLOR
  // -----------------------------

  const inkHex = inkColors[card.ink];
  if (inkHex) {
    get("ink-color-bar").setAttribute("fill", inkHex);
  }

  // -----------------------------
  // NUMERIC TOGGLING
  // -----------------------------

  function toggleNumber(prefix, value) {
    for (let i = 0; i <= 10; i++) {
      const el = get(`${prefix}-${i}`);
      if (!el) continue;
      el.style.display = (i === value) ? "inline" : "none";
    }
  }

  toggleNumber("ink-cost", card.cost);
  toggleNumber("strength", card.strength);
  toggleNumber("willpower", card.willpower);

  // -----------------------------
  // INKABLE
  // -----------------------------

  get("inkable").style.display =
    card.inkwell ? "inline" : "none";

  // -----------------------------
  // RARITY
  // -----------------------------

  const rarityIds = [
    "rarity-common",
    "rarity-uncommon",
    "rarity-rare",
    "rarity-superrare",
    "rarity-legendary"
  ];

  rarityIds.forEach(id => {
    const el = get(id);
    if (el) el.style.display = "none";
  });

  if (card.rarity) {
    const rarityId = `rarity-${card.rarity.toLowerCase()}`;
    const el = get(rarityId);
    if (el) el.style.display = "inline";
  }

  // -----------------------------
  // LORE
  // -----------------------------
  
  const loreValue = Number(card.lore) || 0;

  for (let i = 1; i <= 5; i++) {
    const el = get(`lore-${i}`);
    if (!el) continue;
  
    el.style.display = (i === loreValue) ? "inline" : "none";
  }
}

// -----------------------------
// TEST DATA
// -----------------------------

const testCard = {
  name: "Ariel",
  version: "On Human Legs",
  ink: "Amethyst",
  cost: 10,
  inkwell: false,
  strength: 10,
  willpower: 10,
  lore: 5,
  rarity: "Legendary",
  classifications: ["Storyborn", "Hero", "Princess"],
  illustrators: ["Matthew Robert Davies"],
  collector_number: "104",
  lang: "en",
  set: { code: "11" }
};

loadCard(testCard);
