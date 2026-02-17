const inkColors = {
  Amber: "#f9cd73ff",
  Amethyst: "#cf9fd0ff",
  Emerald: "#a0d4aaff",
  Ruby: "#eeb3b2ff",
  Sapphire: "#b0daedff",
  Steel: "#cfd5ddff"
};

const SYMBOL_MAP = {
  "{I}": "#symbol-ink",
  "{W}": "#symbol-willpower",
  "{S}": "#symbol-strength",
  "{L}": "#symbol-lore",
  "{IW}": "#symbol-inkwell",
  "{E}": "#symbol-exert"
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
  // ----- Basic Text Fields -----
  svgRoot.querySelector("#name").textContent = card.name || "TITLE";
  svgRoot.querySelector("#version").textContent = card.version || "Version";

  svgRoot.querySelector("#classifications").textContent =
    card.classifications?.join(" · ") || "Classifications";

  svgRoot.querySelector("#ink-color-text").textContent =
    card.ink || "InkColor";

  svgRoot.querySelector("#artist").textContent =
    card.illustrators?.join(", ") || "Artist";

  svgRoot.querySelector("#card-and-set-text").textContent =
    `${card.collector_number || "c#"} / 204 · ${card.lang?.toUpperCase() || "EN"} · ${card.set?.code || "s#"}`;

  // ----- Ink Color Bar -----
  const inkColors = {
    Amber: "#f9cd73ff",
    Amethyst: "#cf9fd0ff",
    Emerald: "#a0d4aaff",
    Ruby: "#eeb3b2ff",
    Sapphire: "#b0daedff",
    Steel: "#cfd5ddff"
  };

  const inkBar = svgRoot.querySelector("#ink-color-bar");
  if (inkBar && inkColors[card.ink]) {
    inkBar.setAttribute("fill", inkColors[card.ink]);
  }

  // ----- Strength -----
  for (let i = 0; i <= 10; i++) {
    const el = svgRoot.querySelector(`#strength-${i}`);
    if (el) el.style.display = i === card.strength ? "inline" : "none";
  }

  // ----- Willpower -----
  for (let i = 0; i <= 10; i++) {
    const el = svgRoot.querySelector(`#willpower-${i}`);
    if (el) el.style.display = i === card.willpower ? "inline" : "none";
  }

  // ----- Ink Cost -----
  for (let i = 0; i <= 12; i++) {
    const el = svgRoot.querySelector(`#ink-cost-${i}`);
    if (el) el.style.display = i === card.cost ? "inline" : "none";
  }

  // ----- Lore -----
  for (let i = 1; i <= 5; i++) {
    const el = svgRoot.querySelector(`#lore-${i}`);
    if (el) el.style.display = i === card.lore ? "inline" : "none";
  }

  // ----- Inkwell -----
  const inkwell = svgRoot.querySelector("#inkable");
  if (inkwell) {
    inkwell.style.display = card.inkwell ? "inline" : "none";
  }

  // ----- Rarity -----
  const rarityMap = {
    Common: "rarity-common",
    Uncommon: "rarity-uncommon",
    Rare: "rarity-rare",
    "Super Rare": "rarity-superrare",
    Legendary: "rarity-legendary"
  };

  Object.values(rarityMap).forEach(id => {
    const el = svgRoot.querySelector(`#${id}`);
    if (el) el.style.display = "none";
  });

  if (rarityMap[card.rarity]) {
    const rarityEl = svgRoot.querySelector(`#${rarityMap[card.rarity]}`);
    if (rarityEl) rarityEl.style.display = "inline";
  }

  // ----- Render Card Text (Rules + Flavor + Scaling + Divider) -----
  renderCardText(svgRoot, card);
}

// -----------------------------
// CLEAR TEXT + DIVIDER
// -----------------------------

function clearText(textEl) {
  if (textEl) {
    textEl.textContent = "";
  }
}

function clearDivider(svgRoot) {
  const oldDivider = svgRoot.querySelector(".card-divider");
  if (oldDivider) {
    oldDivider.remove();
  }
}

// -----------------------------
// RULES + FLAVOR TEXT
// -----------------------------

function renderCardText(svgRoot, card) {
  const textEl = svgRoot.querySelector("#card-text");
  const textArea = svgRoot.querySelector("#card-text-area");

  if (!textEl || !textArea) return;

  clearDivider(svgRoot);
  clearText(textEl);

  const areaBox = textArea.getBBox();
  const maxWidth = areaBox.width;
  const startX = areaBox.x;

  const rulesText = card.text || "";
  const flavorText = card.flavor_text || "";

  const baseFontSize = parseFloat(textEl.getAttribute("font-size")) || 2.11667;
  let ruleLines = [];
  let flavorLines = [];
  let fontSize = baseFontSize;

  function wrapText(text) {
    const paragraphs = text.split("\n");
    const wrapped = [];
  
    paragraphs.forEach(paragraph => {
      const tokens = paragraph.split(/(\{[A-Z]+\})/g).filter(Boolean);
  
      let currentLine = "";
  
      tokens.forEach(token => {
  
        const isSymbol = SYMBOL_MAP[token];
  
        const testLine = currentLine + token;
  
        const testTspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
        );
  
        testTspan.setAttribute("x", startX);
        testTspan.setAttribute("font-size", fontSize);
  
        if (isSymbol) {
          const use = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "use"
          );
          
          use.setAttribute("href", SYMBOL_MAP[token]);
          use.setAttribute("width", fontSize);
          use.setAttribute("height", fontSize);
          use.setAttribute("y", -fontSize * 0.8);
  
          testTspan.appendChild(use);
        } else {
          testTspan.textContent = testLine;
        }
  
        textEl.appendChild(testTspan);
        const width = testTspan.getBBox().width;
        textEl.removeChild(testTspan);
  
        if (width > maxWidth && currentLine !== "") {
          wrapped.push(currentLine);
          currentLine = token;
        } else {
          currentLine = testLine;
        }
  
      });
  
      wrapped.push(currentLine);
    });
  
    return wrapped;
  }

  // -----------------------------
  // RENDER RULE LINE
  // -----------------------------
  function renderRuleLine(svgRoot, parentGroup, line, x, y, fontSize) {

    const lineGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
  
    parentGroup.appendChild(lineGroup);
  
    let currentX = x;
  
    const tokens = line.split(/(\{[A-Z]+\})/g).filter(Boolean);
  
    tokens.forEach(token => {
  
      if (SYMBOL_MAP[token]) {
  
        const symbolDef = svgRoot.querySelector(SYMBOL_MAP[token]);
        if (!symbolDef) return;
  
        const clone = symbolDef.cloneNode(true);
  
        const scaleFactor = fontSize / 40;
  
        clone.setAttribute(
          "transform",
          `translate(${currentX}, ${y - fontSize * 0.8}) scale(${scaleFactor})`
        );
  
        lineGroup.appendChild(clone);
  
        // Advance X by fontSize (symbol width)
        currentX += fontSize;
  
        // Add normal word spacing
        currentX += fontSize * 0.25;
  
      } else {
  
        const textEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
  
        textEl.setAttribute("x", currentX);
        textEl.setAttribute("y", y);
        textEl.setAttribute("font-size", fontSize);
        textEl.setAttribute("fill", "#2e2e2e");
  
        textEl.textContent = token;
  
        lineGroup.appendChild(textEl);
  
        const width = textEl.getBBox().width;
        currentX += width;
      }
  
    });
  
    return lineGroup;
  }
  
  function renderAtSize() {
    clearText(textEl);
    textEl.setAttribute("font-size", fontSize);

    ruleLines = wrapText(rulesText);
    flavorLines = flavorText ? wrapText(flavorText) : [];

    const ruleTspans = [];

    // rule lines loop
    const textGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    
    svgRoot.appendChild(textGroup);
    
    let currentY = centeredTop + fontSize;
    
    ruleLines.forEach((line, index) => {
    
      renderRuleLine(
        svgRoot,
        textGroup,
        line,
        startX,
        currentY,
        fontSize
      );
    
      currentY += fontSize * 1.2;
    });

    //flavor lines loop
    flavorLines.forEach((line, i) => {
      const tspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );

      tspan.setAttribute("x", startX);
      tspan.setAttribute(
        "dy",
        ruleTspans.length > 0 && i === 0 ? "2em" : "1em"
      );
      tspan.setAttribute("font-style", "italic");
      tspan.textContent = line;

      textEl.appendChild(tspan);
    });

    // Position at top first
    textEl.setAttribute("x", startX);
    textEl.setAttribute("y", areaBox.y);

    return {
      height: textEl.getBBox().height,
      ruleTspans: ruleTspans
    };
  }
  
  // ---- Shrink loop using real bbox ----
  let layout = renderAtSize();

  while (layout.height > areaBox.height) {
    fontSize -= 0.3;
    layout = renderAtSize();
  }

  // ---- Center after final size ----
  const centeredTop =
    areaBox.y + (areaBox.height - layout.height) / 2;

  textEl.setAttribute("y", centeredTop);

  // ---- Divider ----
  if (flavorText && layout.ruleTspans.length > 0) {
  
    const lastRule =
      layout.ruleTspans[layout.ruleTspans.length - 1];
  
    const lastRuleBox = lastRule.getBBox();
  
    const divider = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
  
    const dividerY = areaBox.y + (ruleLines.length * fontSize * 1.2);
  
    divider.setAttribute("x1", areaBox.x);
    divider.setAttribute("x2", areaBox.x + areaBox.width);
    divider.setAttribute("y1", dividerY);
    divider.setAttribute("y2", dividerY);
    divider.setAttribute("stroke", "#bbbbbb");
    divider.setAttribute("stroke-width", "0.2");
    divider.classList.add("card-divider");
  
    textEl.parentNode.insertBefore(
      divider,
      textEl.nextSibling
    );
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
  text: "VOICELESS This character can't {E} to sing songs.",
  flavor_text: "\"...\"",
  illustrators: ["Matthew Robert Davies"],
  collector_number: "67",
  lang: "en",
  set: { code: "8" }
};

loadCard(testCard);
