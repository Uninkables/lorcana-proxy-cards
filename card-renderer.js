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

    // -------- Detect Ability Header --------
    const abilityMatch = line.match(/^([A-Z0-9\s!'’\-]+(?:\s\{[^}]+\})?)\s+—\s+(.*)$/);

    if (abilityMatch) {
        const abilityTitle = abilityMatch[1] + " —";
        const remainder = abilityMatch[2];

        renderAbilityHeader(
            abilityTitle,
            startX,
            y,
            fontSize,
            lineGroup
        );

        const extraSpacing = fontSize * 0.75;

        renderRuleLineExact(
            remainder,
            startX,
            y + extraSpacing,
            fontSize,
            lineGroup,
            keywordSet,
            state
        );

        return;
    }

    // -------- Normal Line Rendering --------

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

        // -------- SYMBOL --------
        if (/^\{[^}]+\}$/.test(token)) {
        
            const textWidth = textNode.getBBox().width;
        
            const symbolId = SYMBOL_MAP[token];
            const def = document.querySelector(symbolId);
            if (!def) continue;
        
            const rawBox = def.getBBox();
            const scale = fontSize / 105.8335;
        
            const realWidth = rawBox.width * scale;
        
            const symbol = createSymbol(
                token,
                startX + textWidth,
                y,
                fontSize
            );
        
            lineGroup.appendChild(symbol);
        
            const spacing = fontSize * 0.25;
        
            currentX = startX + textWidth + realWidth + spacing;
        
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

        // -------- STYLE LOGIC --------

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

        if (isItalic) {
            tspan.setAttribute("font-style", "italic");
            tspan.setAttribute("font-weight", "500");
        } else if (isBold) {
            tspan.setAttribute("font-weight", "900");
        } else {
            tspan.setAttribute("font-weight", "700");
        }

        tspan.textContent = token;

        textNode.appendChild(tspan);

        if (token.includes(")")) state.insideParentheses = false;
    }
}

// -----------------------------
// CARD NAME AND VERSION
// -----------------------------

function renderCardName(svgRoot, card) {

    const nameGroup = svgRoot.querySelector("#name");
    const nameArea = svgRoot.querySelector("#name-text-area");

    console.log(card.version);

    if (!nameGroup || !nameArea) return;

    nameGroup.innerHTML = "";

    const box = nameArea.getBBox();

    const versionText = card.version || null;

    let fontSize = 8;
    const minFontSize = 4;

    function renderAtSize(size) {

        nameGroup.innerHTML = "";

        const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        text.setAttribute("font-family", "Brandon Grotesque");
        text.setAttribute("font-weight", "900");
        text.setAttribute("font-size", size);
        text.setAttribute("text-anchor", "middle");

        nameGroup.appendChild(text);

        const words = card.name.toUpperCase().split(" ");

        let lines = [];
        let currentLine = "";

        for (let word of words) {

            const testLine = currentLine ? currentLine + " " + word : word;
            text.textContent = testLine;

            if (text.getBBox().width > box.width && currentLine !== "") {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) lines.push(currentLine);

        if (lines.length > 3) {
            return { overflow: true };
        }

        text.textContent = "";

        lines.forEach((line, i) => {
            const tspan = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan"
            );

            tspan.setAttribute("x", box.x + box.width / 2);
            tspan.setAttribute("dy", i === 0 ? 0 : size * 1.05);
            tspan.textContent = line;

            text.appendChild(tspan);
        });

        let totalHeight = text.getBBox().height;

        if (versionText) {
        
            const versionTspan = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan"
            );
        
            versionTspan.setAttribute("x", box.x + box.width / 2);
            versionTspan.setAttribute("dy", size * 0.9);
            versionTspan.setAttribute("font-weight", "500");
            versionTspan.setAttribute("font-size", size * 0.65);
            versionTspan.textContent = versionText;
        
            text.appendChild(versionTspan);
        }

        const bbox = text.getBBox();

        const offsetY =
            box.y + (box.height - bbox.height) / 2 - bbox.y;

        nameGroup.setAttribute(
            "transform",
            `translate(0, ${offsetY})`
        );

        return {
            width: bbox.width,
            height: bbox.height,
            overflow: false
        };
    }

    let metrics = renderAtSize(fontSize);

    while (
        (metrics.overflow ||
            metrics.width > box.width ||
            metrics.height > box.height) &&
        fontSize > minFontSize
    ) {
        fontSize -= 0.3;
        metrics = renderAtSize(fontSize);
    }
}

// -----------------------------
// ABILITY HEADER
// -----------------------------

function renderAbilityHeader(
    text,
    x,
    y,
    fontSize,
    parent,
    keywordSet,
    state
) {
    const header = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    header.setAttribute("x", x);
    header.setAttribute("y", y);
    header.setAttribute("font-size", fontSize);
    header.setAttribute("font-family", "Brandon Grotesque");
    header.setAttribute("font-weight", "900");

    header.textContent = text;

    parent.appendChild(header);
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
    "id": "crd_d9f3b86af85f48579ed9d0d7ce0de129",
    "name": "Ariel",
    "version": "On Human Legs",
    "layout": "normal",
    "released_at": "2023-08-18",
    "image_uris": {
      "digital": {
        "small": "https://cards.lorcast.io/card/digital/small/crd_d9f3b86af85f48579ed9d0d7ce0de129.avif?1709690747",
        "normal": "https://cards.lorcast.io/card/digital/normal/crd_d9f3b86af85f48579ed9d0d7ce0de129.avif?1709690747",
        "large": "https://cards.lorcast.io/card/digital/large/crd_d9f3b86af85f48579ed9d0d7ce0de129.avif?1709690747"
      }
    },
    "cost": 4,
    "inkwell": true,
    "ink": "Amber",
    "inks": null,
    "type": [
      "Character"
    ],
    "classifications": [
      "Storyborn",
      "Hero",
      "Princess"
    ],
    "text": "VOICELESS This character can't {E} to sing songs.",
    "keywords": [],
    "move_cost": null,
    "strength": 3,
    "willpower": 4,
    "lore": 2,
    "rarity": "Uncommon",
    "illustrators": [
      "Matthew Robert Davies"
    ],
    "collector_number": "1",
    "lang": "en",
    "flavor_text": "\"...\"",
    "tcgplayer_id": 494102,
    "legalities": {
      "core": "legal"
    },
    "set": {
      "id": "set_7ecb0e0c71af496a9e0110e23824e0a5",
      "code": "1",
      "name": "The First Chapter"
    },
    "prices": {
      "usd": "0.09",
      "usd_foil": "0.43"
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
