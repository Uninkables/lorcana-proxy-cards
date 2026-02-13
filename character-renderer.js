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
  const svgText = await response.text();

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

  document.body.appendChild(svgDoc.documentElement);
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
  const textEl = svgRoot.querySelector("#card-text");
  const textArea = svgRoot.querySelector("#card-text-area");

  if (!textEl || !textArea) return;

  // Remove old divider if present
  const oldDivider = svgRoot.querySelector(".card-divider");
  if (oldDivider) oldDivider.remove();

  textEl.textContent = "";

  const areaBox = textArea.getBBox();
  const maxWidth = areaBox.width;
  const startX = areaBox.x;

  const rulesText = card.text || "";
  const flavorText = card.flavor_text || "";

  function wrapText(text) {
    const paragraphs = text.split("\n");
    const wrapped = [];

    paragraphs.forEach(paragraph => {
      const words = paragraph.split(" ");
      let currentLine = "";

      words.forEach(word => {
        const testLine = currentLine
          ? currentLine + " " + word
          : word;

        const testTspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
        );

        testTspan.setAttribute("x", startX);
        testTspan.textContent = testLine;

        textEl.appendChild(testTspan);
        const width = testTspan.getBBox().width;
        textEl.removeChild(testTspan);

        if (width > maxWidth && currentLine !== "") {
          wrapped.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      wrapped.push(currentLine);
    });

    return wrapped;
  }

  const ruleLines = wrapText(rulesText);
  const flavorLines = flavorText ? wrapText(flavorText) : [];

  const allLines = [...ruleLines];

  if (flavorLines.length > 0) {
    allLines.push("__DIVIDER__");
    allLines.push(...flavorLines);
  }

  // Render all lines first
  allLines.forEach((line, index) => {
    if (line === "__DIVIDER__") return;

    const tspan = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );

    tspan.setAttribute("x", startX);
    tspan.setAttribute("dy", index === 0 ? "1em" : "1.2em");
    tspan.textContent = line;

    textEl.appendChild(tspan);
  });

  // Position block at top initially
  textEl.setAttribute("x", startX);
  textEl.setAttribute("y", areaBox.y);

  // Measure full text block
  const textHeight = textEl.getBBox().height;

  // Vertical center
  const centeredTop =
    areaBox.y + (areaBox.height - textHeight) / 2;

  textEl.setAttribute("y", centeredTop);

  // Now insert divider if needed
  if (flavorLines.length > 0) {
    const tspans = textEl.querySelectorAll("tspan");

    const divider = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    divider.classList.add("card-divider");

    const lastRuleTspan = tspans[ruleLines.length - 1];
    const ruleBox = lastRuleTspan.getBBox();

    const dividerY = ruleBox.y + ruleBox.height + 4;

    divider.setAttribute("x1", startX);
    divider.setAttribute("x2", startX + maxWidth);
    divider.setAttribute("y1", dividerY);
    divider.setAttribute("y2", dividerY);
    divider.setAttribute("stroke", "#cccccc");
    divider.setAttribute("stroke-width", "0.4");

    textEl.parentNode.appendChild(divider);
  }
}

  // -----------------------------
  // Process Symbols
  // -----------------------------
  
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
        use.setAttributeNS("http://www.w3.org/1999/xlink", "href", symbolMap[part]);
        use.setAttribute("width", "16");
        use.setAttribute("height", "16");
        use.setAttribute("y", "+3"); // adjust baseline alignment
        tspan.appendChild(use);
      } else {
        tspan.appendChild(document.createTextNode(part));
      }
    });
  }

  // -----------------------------
  // Scale text to fit
  // -----------------------------

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
  text: "VOICELESS This character can't exert to sing songs.",
  flavor_text: "\"The sea always calls her home.\"",
  illustrators: ["Matthew Robert Davies"],
  collector_number: "1",
  lang: "en",
  set: { code: "1" }
};

loadCard(testCard);
