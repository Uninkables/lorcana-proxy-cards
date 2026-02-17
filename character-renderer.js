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
  for (let i = 0; i <= 10; i++) {
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

  const baseFontSize = 14;
  let fontSize = baseFontSize;

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
        testTspan.setAttribute("font-size", fontSize);
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

  function renderAtSize() {
    clearText(textEl);
    textEl.setAttribute("font-size", fontSize);

    const ruleLines = wrapText(rulesText);
    const flavorLines = flavorText ? wrapText(flavorText) : [];

    const ruleTspans = [];

    ruleLines.forEach((line, i) => {
      const tspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );

      tspan.setAttribute("x", startX);
      tspan.setAttribute("dy", i === 0 ? "1em" : "1.2em");
      tspan.textContent = line;

      textEl.appendChild(tspan);
      ruleTspans.push(tspan);
    });

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

    return textEl.getBBox().height;
  }

  // ---- Shrink loop using real bbox ----
  let textHeight = renderAtSize();

  while (textHeight > areaBox.height && fontSize > 6) {
    fontSize -= 0.3;
    textHeight = renderAtSize();
  }

  // ---- Center after final size ----
  const centeredTop =
    areaBox.y + (areaBox.height - textHeight) / 2;

  textEl.setAttribute("y", centeredTop);

  // ---- Divider ----
  const ruleTspans = textEl.querySelectorAll("tspan");
  if (flavorText && ruleTspans.length > 0) {
    const lastRule = ruleTspans[rulesText.split("\n").length - 1];
    if (lastRule) {
      const lastRuleBox = lastRule.getBBox();

      const divider = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      const dividerY =
        lastRuleBox.y + lastRuleBox.height * 1.25;

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
  text: "SHADOW POWER When you play this character, you may give chosen character Challenger +2 and Resist +2 until the start of your next turn. (They get +2 {} while challenging. Damage dealt to them is reduced by 2.)\n\nETERNAL NIGHT Your Gargoyle characters lose the Stone by Day ability.",
  flavor_text: "\"...\n...\n...\"",
  illustrators: ["Matthew Robert Davies"],
  collector_number: "67",
  lang: "en",
  set: { code: "7" }
};

loadCard(testCard);
