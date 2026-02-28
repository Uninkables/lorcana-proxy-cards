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
    scaleNameToFit(svgElement, cardData);
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

    svgRoot.querySelector("#name").textContent =
        card.name || "";

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
        "Super_rare": "rarity-superrare",
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
    state
) {
    const lineGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    parentGroup.appendChild(lineGroup);

    let currentX = startX;

    const tokens = line.match(/\{[^}]+\}|\S+|\s+/g) || [];

    let textNode = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    textNode.setAttribute("x", currentX);
    textNode.setAttribute("y", y);
    textNode.setAttribute("font-size", fontSize);
    textNode.setAttribute("font-family", "Brandon Grotesque");
    textNode.setAttribute("fill", "#2e2e2e");

    lineGroup.appendChild(textNode);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // ---------------- SYMBOL ----------------
        if (/^\{[^}]+\}$/.test(token)) {

            // Measure current flowing text width
            const textWidth = textNode.getBBox().width;

            // Move X to end of flowing text
            currentX += textWidth;

            // Reset text node width baseline
            textNode.setAttribute("x", startX);

            const symbol = createSymbol(
                token,
                currentX,
                y,
                fontSize
            );

            lineGroup.appendChild(symbol);

            const spacing = fontSize * 0.15;
            const scaledWidth = fontSize;
            
            currentX += scaledWidth + spacing;

            // Start a NEW flowing text node after symbol
            textNode = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            textNode.setAttribute("x", currentX);
            textNode.setAttribute("y", y);
            textNode.setAttribute("font-size", fontSize);
            textNode.setAttribute("font-family", "Brandon Grotesque");
            textNode.setAttribute("fill", "#2e2e2e");

            lineGroup.appendChild(textNode);

            continue;
        }

        // ---------------- STYLE LOGIC ----------------
        if (token.includes("(")) state.insideParentheses = true;

        const clean = token.replace(/[^\w]/g, "").toLowerCase();

        let isBold = false;
        let isItalic = false;

        if (state.insideParentheses) isItalic = true;

        if (token === token.toUpperCase() && /[A-Z]/.test(token)) {
            isBold = true;
        }

        if (keywordSet.has(clean)) isBold = true;

        if (/^\+\d+/.test(token)) {
            let j = i - 1;
            while (j >= 0 && /^\s+$/.test(tokens[j])) j--;
            if (j >= 0) {
                const prevClean = tokens[j]
                    .replace(/[^\w]/g, "")
                    .toLowerCase();
                if (keywordSet.has(prevClean)) isBold = true;
            }
        }

        const tspan = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "tspan"
        );

        if (isBold) {
            tspan.setAttribute("font-weight", "900");
        } else {
            tspan.setAttribute("font-weight", "700");
        }

        if (isItalic) {
            tspan.setAttribute("font-style", "italic");
            tspan.setAttribute("font-weight", "500");
        }

        tspan.textContent = token;

        textNode.appendChild(tspan);

        if (token.includes(")")) state.insideParentheses = false;
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
    
        const lineHeight = fontSize * 1.45;
    
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
                state
            );
    
            currentY += lineHeight;
        }
    
        // -------- FLAVOR --------
        if (flavorLines.length > 0) {

            currentY += lineHeight * -0.5;
    
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
                    state
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
    "id": "crd_4ab0c55e07324d30903f51b7bbd41c8d",
    "name": "Dinglehopper",
    "layout": "normal",
    "released_at": "2023-08-18",
    "image_uris": {
      "digital": {
        "small": "https://cards.lorcast.io/card/digital/small/crd_4ab0c55e07324d30903f51b7bbd41c8d.avif?1709690747",
        "normal": "https://cards.lorcast.io/card/digital/normal/crd_4ab0c55e07324d30903f51b7bbd41c8d.avif?1709690747",
        "large": "https://cards.lorcast.io/card/digital/large/crd_4ab0c55e07324d30903f51b7bbd41c8d.avif?1709690747"
      }
    },
    "cost": 1,
    "inkwell": true,
    "ink": "Amber",
    "inks": null,
    "type": [
      "Item"
    ],
    "classifications": null,
    "text": "STRAIGHTEN HAIR {E} — Remove up to 1 damage from chosen character.",
    "keywords": [],
    "move_cost": null,
    "strength": null,
    "willpower": null,
    "lore": null,
    "rarity": "Common",
    "illustrators": [
      "Eri Welli"
    ],
    "collector_number": "32",
    "lang": "en",
    "flavor_text": "Enjoy the finest of human hairstyles!",
    "tcgplayer_id": 492733,
    "legalities": {
      "core": "legal"
    },
    "set": {
      "id": "set_7ecb0e0c71af496a9e0110e23824e0a5",
      "code": "1",
      "name": "The First Chapter"
    },
    "prices": {
      "usd": "0.06",
      "usd_foil": "0.17"
    }
  };

initCard(testCard);

async function initCard(cardData) {
    await document.fonts.ready;
    await document.fonts.load('700 16px "Brandon Grotesque"');
    await document.fonts.load('900 16px "Brandon Grotesque"');
    await document.fonts.load('500 italic 16px "Brandon Grotesque"');
    await loadCard(cardData);
}
