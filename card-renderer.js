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

// ===============================
// TYPOGRAPHY CONFIG
// ===============================
const TYPO = {

    // Base font sizes
    NAME_SIZE: 10.4,
    VERSION_SIZE: 5.3,
    RULE_SIZE: 2.2,
    FLAVOR_SIZE: 2.2,

    // TRUE vertical glyph scaling (actual transform scale)
    NAME_Y_SCALE: 1.1,
    VERSION_Y_SCALE: 1.15,
    RULE_Y_SCALE: 1.25,
    FLAVOR_Y_SCALE: 1.25,

    // Line heights (before Y scaling)
    RULE_LINE_HEIGHT: 1.25,
    FLAVOR_LINE_HEIGHT: 1.25,

    // Spacing controls (in px, not multipliers)
    NAME_VERSION_GAP: 1,
    RULE_FLAVOR_GAP: -0.5,
    SYMBOL_SPACING: 0.18,
    ABILITY_SPACING: 0.8,

    // Name shrink step
    NAME_SHRINK_STEP: 0.2
};

async function loadSymbols() {
    const response = await fetch("symbols.svg");
    const svgText = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

    document.body.appendChild(svgDoc.documentElement);
}

async function loadCard(cardData) {

    const primaryType = getPrimaryType(cardData);

    const templateMap = {
        Character: "CharacterFrame.svg",
        Action: "ActionFrame.svg",
        Item: "ActionFrame.svg",
        Location: "LocationFrame.svg"
    };

    const templateFile = templateMap[primaryType];

    if (!templateFile) {
        console.error("Unknown card type:", cardData.type);
        return;
    }

    const response = await fetch(templateFile);
    const svgText = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    document.getElementById("card-container").innerHTML = "";
    document.getElementById("card-container").appendChild(svgElement);

    // Shared fields
    applyCommonFields(svgElement, cardData);

    // Type-specific logic
    switch (primaryType) {

        case "Character":
            applyCharacterFields(svgElement, cardData);
            break;

        case "Action":
        case "Item":
            applyActionItemFields(svgElement, cardData);
            break;

        case "Location":
            applyLocationFields(svgElement, cardData);
            break;
    }

    // Shared text renderer (already built and working)
    renderCardText(svgElement, cardData);

    // Name scaling
    renderCardName(svgElement, cardData);
}

function getPrimaryType(card) {
    if (!card.type || card.type.length === 0) return null;

    if (card.type.includes("Character")) return "Character";
    if (card.type.includes("Location")) return "Location";
    if (card.type.includes("Item")) return "Item";
    if (card.type.includes("Action")) return "Action";

    return null;
}

function applyCommonFields(svgRoot, card) {

    svgRoot.querySelector("#ink-color-text").textContent =
        card.ink || "";

    svgRoot.querySelector("#artist").textContent =
        card.illustrators?.join(", ") || "";

    svgRoot.querySelector("#card-and-set-text").textContent =
        `${card.collector_number || ""} / 204 · ${card.lang?.toUpperCase() || ""} · ${card.set?.code || ""}`;

    // Ink Bar
    const inkBar = svgRoot.querySelector("#ink-color-bar");
    if (inkBar && inkColors[card.ink]) {
        inkBar.setAttribute("fill", inkColors[card.ink]);
    }

    // Ink Cost
    for (let i = 0; i <= 12; i++) {
        const el = svgRoot.querySelector(`#ink-cost-${i}`);
        if (el) el.style.display = i === card.cost ? "inline" : "none";
    }

    // Inkwell
    const inkwell = svgRoot.querySelector("#inkable");
    if (inkwell) {
        inkwell.style.display = card.inkwell ? "inline" : "none";
    }

    // Rarity
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
}

function applyCharacterFields(svgRoot, card) {

    svgRoot.querySelector("#classifications").textContent =
        card.classifications?.join(" · ") || "";

    // Strength
    for (let i = 0; i <= 10; i++) {
        const el = svgRoot.querySelector(`#strength-${i}`);
        if (el) el.style.display = i === card.strength ? "inline" : "none";
    }

    // Willpower
    for (let i = 0; i <= 10; i++) {
        const el = svgRoot.querySelector(`#willpower-${i}`);
        if (el) el.style.display = i === card.willpower ? "inline" : "none";
    }

    // Lore
    for (let i = 1; i <= 5; i++) {
        const el = svgRoot.querySelector(`#lore-${i}`);
        if (el) el.style.display = i === card.lore ? "inline" : "none";
    }
}

function applyActionItemFields(svgRoot, card) {

    svgRoot.querySelector("#classifications").textContent =
        card.type.join(" · ");

    // Hide character-only layers if present
    ["strength", "willpower", "lore"].forEach(stat => {
        const nodes = svgRoot.querySelectorAll(`[id^="${stat}-"]`);
        nodes.forEach(n => n.style.display = "none");
    });

    // If it's a Song
    if (card.type.includes("Song")) {
        const songBadge = svgRoot.querySelector("#song-indicator");
        if (songBadge) songBadge.style.display = "inline";
    }
}

function applyLocationFields(svgRoot, card) {

    svgRoot.querySelector("#classifications").textContent =
        card.type.join(" · ");

    // Future location-specific fields go here
}

function scaleNameToFit(svgRoot, card) {

    const nameEl = svgRoot.querySelector("#name");
    const nameArea = svgRoot.querySelector("#name-text-area");

    if (!nameEl || !nameArea) return;

    const areaBox = nameArea.getBBox();
    let fontSize = parseFloat(nameEl.getAttribute("font-size")) || 6;

    nameEl.setAttribute("font-size", fontSize);

    while (nameEl.getBBox().width > areaBox.width && fontSize > 2) {
        fontSize -= 0.3;
        nameEl.setAttribute("font-size", fontSize);
    }
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
// WRAP TEXT
// -----------------------------

function wrapTextExact(text, fontSize, maxWidth) {

    const lines = [];
    const paragraphs = text.split("\n");

    const measurer = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    measurer.setAttribute("font-family", "Brandon Grotesque");
    measurer.setAttribute("font-size", fontSize);
    measurer.setAttribute("font-weight", "700");
    measurer.setAttribute("visibility", "hidden");

    document.querySelector("svg").appendChild(measurer);

    for (const paragraph of paragraphs) {

        const tokens = paragraph.match(/\{[^}]+\}|\S+|\s+/g) || [];

        let currentLine = "";

        for (const token of tokens) {

            const testLine = currentLine + token;

            // Replace symbols with a placeholder character width
            const measureString = testLine.replace(/\{[^}]+\}/g, "M");

            measurer.textContent = measureString;
            const width = measurer.getBBox().width;

            if (width > maxWidth && currentLine !== "") {
                lines.push(currentLine);
                currentLine = token;
            } else {
                currentLine = testLine;
            }
        }

        lines.push(currentLine);
    }

    measurer.remove();

    return lines;
}

// -----------------------------
// CREATE SYMBOL
// -----------------------------

function createSymbol(token, x, y, fontSize) {

    const symbolId = SYMBOL_MAP[token];
    if (!symbolId) {
        console.warn("Unknown symbol token:", token);
        return document.createElementNS("http://www.w3.org/2000/svg", "g");
    }

    const def = document.querySelector(symbolId);
    if (!def) {
        console.warn("Symbol definition not found:", symbolId);
        return document.createElementNS("http://www.w3.org/2000/svg", "g");
    }

    const clone = def.cloneNode(true);

    const scale = fontSize / 105.8335;

    clone.setAttribute(
        "transform",
        `translate(${x}, ${y - fontSize * 0.82}) scale(${scale})`
    );

    return clone;
}

// -----------------------------
// RULES LINES
// -----------------------------

function renderRuleLineExact(
    line,
    startX,
    y,
    fontSize,
    parentGroup,
    keywordSet,
    state,
    isFlavor
) {

    const lineGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    parentGroup.appendChild(lineGroup);

    const yScale = isFlavor
        ? TYPO.FLAVOR_Y_SCALE
        : TYPO.RULE_Y_SCALE;

    let currentX = startX;

    const tokens = line.match(/\{[^}]+\}|\S+|\s+/g) || [];

    let textNode = createTextNode(currentX, y, fontSize, yScale);
    lineGroup.appendChild(textNode);

    let abilityActive = false;
    let abilitySpacingApplied = false;

    for (let i = 0; i < tokens.length; i++) {

        const token = tokens[i];

        // ===== SYMBOL =====
        if (/^\{[^}]+\}$/.test(token)) {

            const textWidth = textNode.getBBox().width;
            const symbolX = currentX + textWidth;

            const scale = fontSize / 105.8335;

            const symbol = createSymbol(
                token,
                symbolX,
                y,
                fontSize
            );

            lineGroup.appendChild(symbol);

            const rawBBox = symbol.getBBox();
            const scaledWidth = rawBBox.width * scale;

            const spacing = fontSize * TYPO.SYMBOL_SPACING;

            currentX = symbolX + scaledWidth + spacing;

            textNode = createTextNode(
                currentX,
                y,
                fontSize,
                yScale
            );

            lineGroup.appendChild(textNode);

            continue;
        }

        const trimmed = token.trim();

        const isAllCaps =
            trimmed &&
            trimmed === trimmed.toUpperCase() &&
            /[A-Z]/.test(trimmed);
        
        if (!abilitySpacingApplied) {
        
            if (isAllCaps) {
                abilityActive = true;
            }
            else if (abilityActive) {
        
                // Measure width of what has been rendered so far
                const renderedWidth = textNode.getBBox().width;
        
                // Advance currentX to end of header
                currentX = startX + renderedWidth;
        
                // Add configurable spacing
                currentX += fontSize * TYPO.ABILITY_SPACING;
        
                // Create new text node at correct X
                textNode = createTextNode(
                    currentX,
                    y,
                    fontSize,
                    yScale
                );
        
                lineGroup.appendChild(textNode);
        
                abilitySpacingApplied = true;
            }
        }

        const tspan = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "tspan"
        );

        if (isFlavor) {
            tspan.setAttribute("font-style", "italic");
            tspan.setAttribute("font-weight", "500");
        } else {
            tspan.setAttribute("font-weight", "700");
        }

        tspan.textContent = token;
        textNode.appendChild(tspan);
    }

    function createTextNode(x, y, size, scale) {

        const node = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        node.setAttribute("x", x);
        node.setAttribute("y", y / scale);
        node.setAttribute("font-size", size);
        node.setAttribute("font-family", "Brandon Grotesque");
        node.setAttribute("fill", "#2e2e2e");

        node.setAttribute(
            "style",
            `transform: scale(1, ${scale}); transform-origin: left top;`
        );

        return node;
    }
}

// -----------------------------
// CARD NAME AND VERSION
// -----------------------------

function renderCardName(svgRoot, card) {

    const nameGroup = svgRoot.querySelector("#name");
    const nameArea = svgRoot.querySelector("#name-text-area");

    if (!nameGroup || !nameArea) return;

    nameGroup.innerHTML = "";

    const areaBox = nameArea.getBBox();

    const nameText = (card.name || "").toUpperCase();
    const versionText = card.version || "";

    // ---------- CONFIG ----------
    let nameFontSize = 10.4;
    let versionFontSize = 5.3;

    const NAME_Y_SCALE = TYPO.NAME_Y_SCALE;
    const VERSION_Y_SCALE = TYPO.VERSION_Y_SCALE;

    // ---------- CREATE NODE HELPERS ----------
    function createNameNode(size) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
        node.setAttribute("font-family", "The Bystander Collection");
        node.setAttribute("font-size", size);
        node.setAttribute("text-anchor", "middle");
        node.setAttribute("fill", "#2e2e2e");
        node.setAttribute("style", `transform: scale(1, ${NAME_Y_SCALE}); transform-origin: center;`);
        node.textContent = nameText;
        return node;
    }

    function createVersionNode(size) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
        node.setAttribute("font-family", "Brandon Grotesque Condensed");
        node.setAttribute("font-size", size);
        node.setAttribute("text-anchor", "middle");
        node.setAttribute("fill", "#2e2e2e");
        node.setAttribute("style", `transform: scale(1, ${VERSION_Y_SCALE}); transform-origin: center;`);
        node.textContent = versionText;
        return node;
    }

    // ---------- FIT NAME WIDTH ----------
    let nameNode = createNameNode(nameFontSize);
    nameGroup.appendChild(nameNode);

    while (nameNode.getBBox().width > areaBox.width && nameFontSize > 4) {
        nameFontSize -= 0.2;
        nameNode.setAttribute("font-size", nameFontSize);
    }

    // ---------- FIT VERSION WIDTH ----------
    let versionNode = null;

    if (versionText) {
        versionNode = createVersionNode(versionFontSize);
        nameGroup.appendChild(versionNode);

        while (versionNode.getBBox().width > areaBox.width && versionFontSize > 2) {
            versionFontSize -= 0.2;
            versionNode.setAttribute("font-size", versionFontSize);
        }
    }

    // ---------- POSITION + CENTER AS BLOCK ----------
    const nameHeight = nameNode.getBBox().height;
    const versionHeight = versionNode ? versionNode.getBBox().height : 0;

    const gap = TYPO.NAME_VERSION_GAP;

    const totalHeight = versionNode
        ? nameHeight + gap + versionHeight
        : nameHeight;

    const startY = areaBox.y + (areaBox.height - totalHeight) / 2;

    nameNode.setAttribute("x", areaBox.x + areaBox.width / 2);
    nameNode.setAttribute("y", startY + nameHeight);

    if (versionNode) {
        versionNode.setAttribute("x", areaBox.x + areaBox.width / 2);
        versionNode.setAttribute("y", startY + nameHeight + gap + versionHeight);
    }
}

// -----------------------------
// RULES + FLAVOR TEXT
// -----------------------------

function renderCardText(svgRoot, card) {

    const textArea = svgRoot.querySelector("#card-text-area");
    const cardText = svgRoot.querySelector("#card-text");

    if (!textArea || !cardText) return;

    cardText.innerHTML = "";

    const areaBox = textArea.getBBox();
    const maxWidth = areaBox.width;

    const rulesText = card.text || "";
    const flavorText = card.flavor_text || "";
    const keywords = card.keywords || [];

    let fontSize = 2.11667;

    // Create text group inside #card-text
    const textGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    cardText.appendChild(textGroup);

    function renderAtSize(fontSize) {
    
        textGroup.innerHTML = "";
    
        const keywordSet = new Set(
            keywords.map(k => k.toLowerCase())
        );
    
        const lineHeight =
            fontSize *
            TYPO.RULE_LINE_HEIGHT *
            TYPO.RULE_Y_SCALE;

        const flavorLineHeight =
            fontSize *
            TYPO.FLAVOR_LINE_HEIGHT *
            TYPO.FLAVOR_Y_SCALE;
    
        const ruleLines = wrapTextExact(
            rulesText,
            fontSize,
            maxWidth
        );
    
        const flavorLines = flavorText
            ? wrapTextExact(flavorText, fontSize, maxWidth)
            : [];
    
        const totalHeight =
            (ruleLines.length + flavorLines.length) * lineHeight +
            (flavorLines.length > 0 ? lineHeight * 0.5 : 0);
    
        let currentY = areaBox.y;
    
        const state = { insideParentheses: false };
    
        // -------- RULES --------
        for (const line of ruleLines) {
    
            renderRuleLineExact(
                line,
                areaBox.x,
                currentY,
                fontSize,
                textGroup,
                keywordSet,
                state,
                false
            );
    
            currentY += lineHeight;
        }
    
        // -------- FLAVOR --------
        if (flavorLines.length > 0) {

            currentY += flavorLineHeight * TYPO.RULE_FLAVOR_GAP;
    
            const divider = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );
    
            divider.setAttribute("x1", areaBox.x);
            divider.setAttribute("x2", areaBox.x + maxWidth);
            divider.setAttribute("y1", currentY);
            divider.setAttribute("y2", currentY);
            divider.setAttribute("stroke", "#ababab");
            divider.setAttribute("stroke-width", "0.1");
            
            textGroup.appendChild(divider);
    
            currentY += lineHeight * 0.9;
    
            for (const line of flavorLines) {
    
                renderRuleLineExact(
                    line,
                    areaBox.x,
                    currentY,
                    fontSize,
                    textGroup,
                    keywordSet,
                    state,
                    true
                );
    
                currentY += lineHeight;
            }
        }
    
        const box = textGroup.getBBox();
    
        return {
            height: box.height,
            top: box.y
        };
    }

    // Shrink loop
    let metrics = renderAtSize(fontSize);

    while (metrics.height > areaBox.height && fontSize > 1.2) {
        fontSize -= 0.2;
        metrics = renderAtSize(fontSize);
    }

    textGroup.removeAttribute("transform");

    const bbox = textGroup.getBBox();
    
    const offset =
      areaBox.y + (areaBox.height - bbox.height) / 2 - bbox.y;
    
    textGroup.setAttribute("transform", `translate(0, ${offset})`);
    
}

// -----------------------------
// TEST DATA
// -----------------------------

const testCard = {
    "id": "crd_e672bba7d4c5402f82d9360fca1594f5",
    "name": "Kit Cloudkicker",
    "version": "Tough Guy",
    "layout": "normal",
    "released_at": "2024-02-23",
    "image_uris": {
      "digital": {
        "small": "https://cards.lorcast.io/card/digital/small/crd_e672bba7d4c5402f82d9360fca1594f5.avif?1709690747",
        "normal": "https://cards.lorcast.io/card/digital/normal/crd_e672bba7d4c5402f82d9360fca1594f5.avif?1709690747",
        "large": "https://cards.lorcast.io/card/digital/large/crd_e672bba7d4c5402f82d9360fca1594f5.avif?1709690747"
      }
    },
    "cost": 3,
    "inkwell": true,
    "ink": "Emerald",
    "inks": null,
    "type": [
      "Character"
    ],
    "classifications": [
      "Storyborn",
      "Ally"
    ],
    "text": "SKYSURFING When you play this character, you may return chosen opposing character with 2 {S} or less to their player's hand.",
    "keywords": [],
    "move_cost": null,
    "strength": 2,
    "willpower": 2,
    "lore": 1,
    "rarity": "Uncommon",
    "illustrators": [
      "Jake Parker"
    ],
    "collector_number": "77",
    "lang": "en",
    "flavor_text": "\"It's been fun, guys, but I got to be going.\nYahoooo!\"",
    "tcgplayer_id": 538357,
    "legalities": {
      "core": "legal"
    },
    "set": {
      "id": "set_10a1db03fe66417c9912494b94463e8e",
      "code": "3",
      "name": "Into the Inklands"
    },
    "prices": {
      "usd": "0.06",
      "usd_foil": "0.22"
    }
  };

initCard(testCard);

async function initCard(cardData) {
    await document.fonts.ready;
    await document.fonts.load('700 16px "Brandon Grotesque"');
    await document.fonts.load('900 16px "Brandon Grotesque"');
    await document.fonts.load('500 italic 16px "Brandon Grotesque"');
    await document.fonts.load("10px Brandon Grotesque");
    await document.fonts.load("10px Brandon Grotesque Condensed");
    await document.fonts.load("10px 'The Bystander Collection'");
    await loadCard(cardData);
}
