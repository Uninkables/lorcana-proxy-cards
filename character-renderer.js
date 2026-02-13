const inkColors = {
  Amber: "#f9cd73ff",
  Amethyst: "#cf9fd0ff",
  Emerald: "#a0d4aaff",
  Ruby: "#eeb3b2ff",
  Sapphire: "#b0daedff",
  Steel: "#cfd5ddff"
};

async function loadSymbols() {
  const response = await fetch("symbols.svg");
  const text = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");

  const symbols = doc.querySelectorAll("symbol");
  const defs = document.querySelector("#card svg defs");

  symbols.forEach(symbol => {
    defs.appendChild(symbol);
  });
}

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
  // RULES + FLAVOR TEXT (RAW)
  // -----------------------------
  
  renderCardText(svgRoot, card);

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

  const rarityMap = {
  "Common": "rarity-common",
  "Uncommon": "rarity-uncommon",
  "Rare": "rarity-rare",
  "Super_rare": "rarity-superrare",
  "Legendary": "rarity-legendary"
  };
  
  const rarityIds = Object.values(rarityMap);
  
  // Hide all first
  rarityIds.forEach(id => {
    const el = get(id);
    if (el) el.style.display = "none";
  });
  
  // Show correct one
  const rarityId = rarityMap[card.rarity];
  if (rarityId) {
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

  // -----------------------------
  // RULES + FLAVOR TEXT
  // -----------------------------

  function renderCardText(svgRoot, card) {
    const NS = "http://www.w3.org/2000/svg";
    const textEl = svgRoot.querySelector("#card-text");
    if (!textEl) return;
  
    // Clear previous content
    while (textEl.firstChild) {
      textEl.removeChild(textEl.firstChild);
    }
  
    const rulesText = card.text || "";
    const flavorText = card.flavor_text || "";
  
    let combinedText = rulesText;
    if (flavorText) {
      combinedText += "\n\n" + flavorText;
    }
  
    const lines = combinedText.split("\n");
  
    const baseX = parseFloat(textEl.getAttribute("x"));
    let currentY = parseFloat(textEl.getAttribute("y"));
  
    const fontSize = parseFloat(
      window.getComputedStyle(textEl).fontSize
    );
  
    const lineHeight = fontSize * 1.2;
  
    lines.forEach((line, lineIndex) => {
      let currentX = baseX;
  
      // Split line into text + symbols
      const parts = line.split(/(\{.*?\})/g);
  
      parts.forEach(part => {
        const symbolMatch = part.match(/^\{(.*?)\}$/);
  
        if (symbolMatch) {
          // Symbol detected
          const symbolId = "icon-" + symbolMatch[1];
  
          const use = document.createElementNS(NS, "use");
          use.setAttribute("href", `#${symbolId}`);
          use.setAttribute("x", currentX);
          use.setAttribute("y", currentY + fontSize);
          use.setAttribute("height", fontSize);
          use.setAttribute("width", fontSize);
  
          textEl.appendChild(use);
  
          currentX += fontSize;
        } else if (part.length > 0) {
          const tspan = document.createElementNS(NS, "tspan");
          tspan.setAttribute("x", currentX);
          tspan.setAttribute("y", currentY);
          tspan.textContent = part;
  
          textEl.appendChild(tspan);
  
          // Temporarily append to measure width
          const bbox = tspan.getBBox();
          currentX += bbox.width;
        }
      });
  
      currentY += lineHeight;
    });
  }
  
  function processLineWithSymbols(tspan, line, svgRoot) {
    const symbolMap = {
      "{E}": "#symbol-exert",
      "{IW}": "#symbol-inkwell",
      "{I}": "#symbol-ink",
      "{L}": "#symbol-lore",
      "{S}": "#symbol-strength",
      "{W}": "#symbol-willpower"
    };

    const parts = line.split(/(\{[^}]+\})/g);

    parts.forEach(part => {
      if (symbolMap[part]) {
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", symbolMap[part]);
        use.setAttribute("width", "16");
        use.setAttribute("height", "16");
        use.setAttribute("y", "-3"); // adjust baseline alignment
        tspan.appendChild(use);
      } else {
        tspan.appendChild(document.createTextNode(part));
      }
    });
  }

  function autoScaleText(textEl, svgRoot, percentage) {
    const viewBox = svgRoot.viewBox.baseVal;
    const maxHeight = viewBox.height * percentage;
  
    let fontSize = 18;
    textEl.setAttribute("font-size", fontSize);
  
    requestAnimationFrame(() => {
      while (textEl.getBBox().height > maxHeight && fontSize > 8) {
        fontSize -= 0.5;
        textEl.setAttribute("font-size", fontSize);
      }
    });
  }
  
}

// -----------------------------
// TEST DATA
// -----------------------------

const testCard = {
  name: "ARIEL",
  version: "On Human Legs",
  ink: "Amber",
  cost: 4,
  inkwell: true,
  strength: 3,
  willpower: 4,
  lore: 2,
  rarity: "Uncommon",
  classifications: ["Storyborn", "Hero", "Princess"],
  text: "Rush\nVOICELESS When you play this character, gain 1 lore.\n{E} — Deal 1 damage.",
  flavor_text: "The fastest blade in the Inklands.",
  illustrators: ["Matthew Robert Davies"],
  collector_number: "1",
  lang: "en",
  set: { code: "1" }
};

(async () => {
  await loadSymbols();
  await loadCard(testCard);
})();
