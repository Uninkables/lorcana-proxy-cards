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
        let currentWidth = 0;

        for (const token of tokens) {

            if (/^\{[^}]+\}$/.test(token)) {
                measurer.textContent = "M"; // placeholder width for symbol
            } else {
                measurer.textContent = token;
            }
            
            const tokenWidth = measurer.getBBox().width;

            if (currentWidth + tokenWidth > maxWidth && currentLine !== "") {
                lines.push(currentLine);
                currentLine = token;
                currentWidth = tokenWidth;
            } else {
                currentLine += token;
                currentWidth += tokenWidth;
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
        `translate(${x}, ${y - fontSize * 0.8}) scale(${scale})`
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

    // One flowing text node
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

        // ---- SYMBOL ----
        if (/^\{[^}]+\}$/.test(token)) {

            // Measure current text width before placing symbol
            const textWidth = textNode.getBBox().width;

            const symbolId = SYMBOL_MAP[token];
            const symbolDef = document.querySelector(symbolId);
            if (!symbolDef) continue;

            const clone = symbolDef.cloneNode(true);

            const scale = fontSize / 105.8335;

            clone.setAttribute(
                "transform",
                `translate(${startX + textWidth}, ${y - fontSize * 0.8}) scale(${scale})`
            );

            lineGroup.appendChild(clone);

            // Move text start after symbol
            currentX = startX + textWidth + fontSize;

            // Create new flowing text node after symbol
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

        // ---- STYLE LOGIC ----
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

        // ---- Create TSPAN ----
        const tspan = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "tspan"
        );

        if (isBold) tspan.setAttribute("font-weight", "900");
        else tspan.setAttribute("font-weight", "700");

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

    // Build formatted line for sizing
    function buildFormattedLine(
        line,
        textEl,
        keywordSet,
        state,
        fontSize
    ) {
        const tokens = line.match(/\{[^}]+\}|\S+|\s+/g) || [];
    
        for (let i = 0; i < tokens.length; i++) {
    
            const token = tokens[i];
    
            // -------- SYMBOL --------
            if (/^\{[^}]+\}$/.test(token)) {
    
                const symbolId = SYMBOL_MAP[token];
                if (!symbolId) continue;
    
                const symbolSpan = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "tspan"
                );
    
                const use = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "use"
                );
    
                use.setAttribute("href", symbolId);
                use.setAttribute("width", fontSize);
                use.setAttribute("height", fontSize);
                use.setAttribute("y", -fontSize * 0.75);
    
                symbolSpan.appendChild(use);
    
                textEl.appendChild(symbolSpan);
                continue;
            }
    
            // -------- STATE TRACKING --------
            if (token.includes("(")) state.insideParentheses = true;
    
            const clean = token.replace(/[^\w]/g, "").toLowerCase();
    
            let isBold = false;
            let isItalic = false;
    
            if (state.insideParentheses) isItalic = true;
    
            if (token === token.toUpperCase() && /[A-Z]/.test(token)) {
                isBold = true;
            }
    
            if (keywordSet.has(clean)) {
                isBold = true;
            }
    
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
    
            tspan.textContent = token;
    
            tspan.setAttribute("font-weight", isBold ? "900" : "700");
    
            if (isItalic) {
                tspan.setAttribute("font-style", "italic");
            }
    
            textEl.appendChild(tspan);
    
            if (token.includes(")")) {
                state.insideParentheses = false;
            }
        }
    }

    function renderAtSize(fontSize) {
    
        textGroup.innerHTML = "";
    
        const keywordSet = new Set(
            keywords.map(k => k.toLowerCase())
        );
    
        const lineHeight = fontSize * 1.45;
    
        const ruleLines = wrapTextExact(
            rulesText,
            fontSize,
            maxWidth,
            keywordSet
        );
    
        const flavorLines = flavorText
            ? wrapTextExact(flavorText, fontSize, maxWidth, keywordSet)
            : [];
    
        const state = { insideParentheses: false };
    
        let currentY = areaBox.y;
    
        // ---------------- RULES ----------------
        for (const line of ruleLines) {
    
            const textEl = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );
    
            textEl.setAttribute("x", areaBox.x);
            textEl.setAttribute("y", currentY + lineHeight);
            textEl.setAttribute("font-size", fontSize);
            textEl.setAttribute("font-family", "Brandon Grotesque");
            textEl.setAttribute("fill", "#2e2e2e");
    
            buildFormattedLine(
                line,
                textEl,
                keywordSet,
                state,
                fontSize
            );
    
            textGroup.appendChild(textEl);
            currentY += lineHeight;
        }
    
        // ---------------- FLAVOR ----------------
        if (flavorLines.length > 0) {
    
            currentY += lineHeight * 0.25;
    
            const dividerY = currentY;
    
            const divider = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );
    
            divider.setAttribute("x1", areaBox.x);
            divider.setAttribute("x2", areaBox.x + maxWidth);
            divider.setAttribute("y1", dividerY);
            divider.setAttribute("y2", dividerY);
            divider.setAttribute("stroke", "#2e2e2e");
            divider.setAttribute("stroke-width", "0.4");
    
            textGroup.appendChild(divider);
    
            currentY += lineHeight * 0.75;
    
            for (const line of flavorLines) {
    
                const textEl = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );
    
                textEl.setAttribute("x", areaBox.x);
                textEl.setAttribute("y", currentY + lineHeight);
                textEl.setAttribute("font-size", fontSize);
                textEl.setAttribute("font-family", "Brandon Grotesque");
                textEl.setAttribute("fill", "#2e2e2e");
                textEl.setAttribute("font-style", "italic");
    
                buildFormattedLine(
                    line,
                    textEl,
                    keywordSet,
                    state,
                    fontSize
                );
    
                textGroup.appendChild(textEl);
                currentY += lineHeight;
            }
        }
    
        // REAL MEASUREMENT
        const box = textGroup.getBBox();
    
        return {
            height: box.height,
            top: box.y
        };
    }

    // Shrink loop
    let height = renderAtSize(fontSize);

    while (height > areaBox.height && fontSize > 1.2) {
        fontSize -= 0.2;
        height = renderAtSize(fontSize);
    }
}

// -----------------------------
// TEST DATA
// -----------------------------

const testCard = {
    name: "ARIEL",
    version: "On Human Legs",
    ink: "Amber",
    cost: 12,
    inkwell: true,
    strength: 3,
    willpower: 4,
    lore: 2,
    rarity: "Uncommon",
    classifications: ["Storyborn", "Hero", "Princess"],
    text: "SHADOW POWER When you play this character, you may give chosen character Challenger +2 and Resist +2 until the start of your next turn. (They get +2 {S} while challenging. Damage dealt to them is reduced by 2.)\nETERNAL NIGHT Your Gargoyle characters lose the Stone by Day ability.",
    flavor_text: "",
    keywords: ["Challenger", "Resist"],
    illustrators: ["Matthew Robert Davies"],
    collector_number: "67",
    lang: "en",
    set: { code: "10" }
};

initCard(testCard);

async function initCard(cardData) {
    await document.fonts.ready;
    await document.fonts.load('700 16px "Brandon Grotesque"');
    await document.fonts.load('900 16px "Brandon Grotesque"');
    await document.fonts.load('500 italic 16px "Brandon Grotesque"');
    await loadCard(cardData);
}
