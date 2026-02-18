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
    const keywordSet = new Set((card.keywords || []).map(k => k.toLowerCase()));

    const baseFontSize = 2.11667;
    let fontSize = baseFontSize;

    let ruleLines = [];
    let flavorLines = [];

    // -----------------------------
    // WRAP TEXT
    // -----------------------------
    function wrapText(text) {
        const paragraphs = text.split("\n");
        const wrapped = [];
    
        paragraphs.forEach(paragraph => {
    
            // Split by space but keep symbols intact
            const words = paragraph.split(/(\s+)/g).filter(Boolean);
    
            let currentLine = "";
    
            words.forEach(word => {
    
                const testLine = currentLine + word;
    
                const tempText = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );
    
                tempText.setAttribute("x", startX);
                tempText.setAttribute("font-size", fontSize);
                tempText.setAttribute("visibility", "hidden");
    
                // Render full test line using symbol logic
                const tokens = testLine.split(/(\{[A-Z]+\})/g).filter(Boolean);
    
                let currentX = 0;
    
                tokens.forEach(token => {
                    if (SYMBOL_MAP[token]) {
                        currentX += fontSize; // symbol width
                    } else {
                        tempText.textContent += token;
                    }
                });
    
                textEl.appendChild(tempText);
                const textWidth = tempText.getBBox().width;
                textEl.removeChild(tempText);
    
                const symbolWidth = tokens.filter(t => SYMBOL_MAP[t]).length * fontSize;
    
                const totalWidth = textWidth + symbolWidth;
    
                if (totalWidth > maxWidth && currentLine !== "") {
                    wrapped.push(currentLine.trim());
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
    
            });
    
            wrapped.push(currentLine.trim());
        });
    
        return wrapped;
    }

    // -----------------------------
    // RENDER RULE LINE
    // -----------------------------
    function renderRuleLine(parentGroup, line, y, state) {
    
        let currentX = startX;
    
        const tokens = line.split(/(\{[A-Z]+\})/g).filter(Boolean);
    
        tokens.forEach(token => {
    
            // -------------------------
            // SYMBOL
            // -------------------------
            if (SYMBOL_MAP[token]) {
    
                const symbolDef = svgRoot.querySelector(SYMBOL_MAP[token]);
                if (!symbolDef) return;
    
                const clone = symbolDef.cloneNode(true);
                const scaleFactor = fontSize / 80;
    
                clone.setAttribute(
                    "transform",
                    `translate(${currentX}, ${y - fontSize * 0.8}) scale(${scaleFactor})`
                );
    
                parentGroup.appendChild(clone);
    
                currentX += fontSize + (fontSize * 0.25);
                return;
            }
    
            // -------------------------
            // TEXT PROCESSING
            // -------------------------
    
            const words = token.split(/(\s+)/g).filter(Boolean);
    
            for (let i = 0; i < words.length; i++) {
    
                let word = words[i];
    
                // ---- Preserve whitespace ----
                if (/^\s+$/.test(word)) {
    
                    const spaceNode = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "text"
                    );
    
                    spaceNode.setAttribute("x", currentX);
                    spaceNode.setAttribute("y", y);
                    spaceNode.setAttribute("font-size", fontSize);
                    spaceNode.setAttribute("fill", "#2e2e2e");
    
                    spaceNode.textContent = " ";
    
                    parentGroup.appendChild(spaceNode);
    
                    currentX += spaceNode.getBBox().width;
                    continue;
                }
    
                const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
    
                // ---- Parentheses state ----
                if (word.includes("(")) {
                    state.insideParentheses = true;
                }
    
                let isBold = false;
                let isItalic = false;
    
                // 1. Parentheses state (persistent across lines)
                if (state.insideParentheses) {
                    isItalic = true;
                }
    
                // 2. ALL CAPS
                if (
                    word === word.toUpperCase() &&
                    word.match(/[A-Z]/)
                ) {
                    isBold = true;
                }
    
                // 3. Keywords
                if (keywordSet.has(cleanWord)) {
                    isBold = true;
                }
    
                // 4. +number after keyword
                if (/^\+\d+/.test(word)) {
                    const prevWord = words[i - 1];
                    const prevClean = prevWord
                        ? prevWord.replace(/[^\w]/g, "").toLowerCase()
                        : "";
    
                    if (keywordSet.has(prevClean)) {
                        isBold = true;
                    }
                }
    
                const textNode = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );
    
                textNode.setAttribute("x", currentX);
                textNode.setAttribute("y", y);
                textNode.setAttribute("font-size", fontSize);
                textNode.setAttribute("fill", "#2e2e2e");
    
                if (isBold) {
                    textNode.setAttribute("font-weight", "700");
                }
    
                if (isItalic) {
                    textNode.setAttribute("font-style", "italic");
                }
    
                textNode.textContent = word;
    
                parentGroup.appendChild(textNode);
    
                currentX += textNode.getBBox().width;
    
                // ---- Close parentheses AFTER rendering ----
                if (word.includes(")")) {
                    state.insideParentheses = false;
                }
            }
    
        });
    }

    // -----------------------------
    // RENDER AT SIZE
    // -----------------------------
    function renderAtSize() {
    
        clearText(textEl);
        textEl.setAttribute("font-size", fontSize);
    
        ruleLines = wrapText(rulesText);
        flavorLines = flavorText ? wrapText(flavorText) : [];
    
        const textGroup = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );
    
        svgRoot.appendChild(textGroup);
    
        let currentY = areaBox.y + fontSize;
    
        // ---- Persistent parentheses state ----
        const state = { insideParentheses: false };
    
        // -------------------------
        // RULES TEXT
        // -------------------------
        ruleLines.forEach((line) => {
    
            renderRuleLine(
                textGroup,
                line,
                currentY,
                state
            );
    
            currentY += fontSize * 1.3; // Increased spacing
        });
    
        // -------------------------
        // FLAVOR TEXT
        // -------------------------
        if (flavorLines.length > 0) {
    
            currentY += fontSize * 0.8; // space before divider
    
            flavorLines.forEach((line) => {
    
                const flavorTextNode = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );
    
                flavorTextNode.setAttribute("x", startX);
                flavorTextNode.setAttribute("y", currentY);
                flavorTextNode.setAttribute("font-size", fontSize);
                flavorTextNode.setAttribute("font-style", "italic");
                flavorTextNode.setAttribute("fill", "#2e2e2e");
    
                flavorTextNode.textContent = line;
    
                textGroup.appendChild(flavorTextNode);
    
                currentY += fontSize * 1.3;
            });
        }
    
        return {
            height: textGroup.getBBox().height
        };
    }

    // -----------------------------
    // SHRINK LOOP
    // -----------------------------
    let textHeight = renderAtSize();

    while (textHeight > areaBox.height) {
        fontSize -= 0.2;
        textHeight = renderAtSize();
    }

    // -----------------------------
    // CENTERING
    // -----------------------------
    const centeredTop =
        areaBox.y + (areaBox.height - textHeight) / 2;

    const offset = centeredTop - areaBox.y;

    textEl.setAttribute("transform", `translate(0, ${offset})`);

    // -----------------------------
    // DIVIDER
    // -----------------------------
    if (flavorLines.length > 0 && ruleLines.length > 0) {

        const divider = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        const ruleBlockHeight = ruleLines.length * fontSize * 1.2;

        const dividerY =
            centeredTop + ruleBlockHeight + fontSize * 0.3;

        divider.setAttribute("x1", areaBox.x);
        divider.setAttribute("x2", areaBox.x + areaBox.width);
        divider.setAttribute("y1", dividerY);
        divider.setAttribute("y2", dividerY);
        divider.setAttribute("stroke", "#bbbbbb");
        divider.setAttribute("stroke-width", "0.2");
        divider.classList.add("card-divider");

        svgRoot.appendChild(divider);
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
    set: { code: "7" }
};

loadCard(testCard);
