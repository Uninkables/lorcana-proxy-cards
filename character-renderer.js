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
    function wrapTextExact(text, fontSize, maxWidth, keywordSet) {
    
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
    
                measurer.textContent = token;
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
    // RENDER RULE LINE
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
    
        let currentX = startX;
    
        const tokens = line.match(/\{[^}]+\}|\S+|\s+/g) || [];
    
        for (let i = 0; i < tokens.length; i++) {
    
            const token = tokens[i];
    
            if (/^\{[^}]+\}$/.test(token)) {
    
                const symbol = createSymbol(token, currentX, y, fontSize);
                parentGroup.appendChild(symbol);
                currentX += symbol.getBBox().width;
                continue;
            }
    
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
    
            const textNode = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );
    
            textNode.setAttribute("x", currentX);
            textNode.setAttribute("y", y);
            textNode.setAttribute("font-size", fontSize);
            textNode.setAttribute("font-family", "Brandon Grotesque");
            textNode.setAttribute("fill", "#2e2e2e");
    
            textNode.setAttribute("font-weight", isBold ? "900" : "700");
            if (isItalic) textNode.setAttribute("font-style", "italic");
    
            textNode.textContent = token;
    
            parentGroup.appendChild(textNode);
    
            currentX += textNode.getBBox().width;
    
            if (token.includes(")")) state.insideParentheses = false;
        }
    }

    // -----------------------------
    // RENDER AT SIZE
    // -----------------------------
    function renderAtSize({
        text,
        flavorText,
        keywords,
        fontSize,
        cardTextGroup,
        maxWidth,
        topY,
        bottomY
    }) {
    
        cardTextGroup.innerHTML = "";
    
        const keywordSet = new Set(
            (keywords || []).map(k => k.toLowerCase())
        );
    
        const lineHeight = fontSize * 1.35;
    
        const rulesLines = wrapTextExact(
            text,
            fontSize,
            maxWidth,
            keywordSet
        );
    
        const flavorLines = flavorText
            ? wrapTextExact(flavorText, fontSize, maxWidth, keywordSet)
            : [];
    
        const totalHeight =
            (rulesLines.length + flavorLines.length) * lineHeight +
            (flavorLines.length > 0 ? lineHeight * 0.5 : 0);
    
        const availableHeight = bottomY - topY;
        let currentY = topY + (availableHeight - totalHeight) / 2;
    
        const state = { insideParentheses: false };
    
        for (const line of rulesLines) {
            renderRuleLineExact(
                line,
                0,
                currentY,
                fontSize,
                cardTextGroup,
                keywordSet,
                state
            );
            currentY += lineHeight;
        }
    
        if (flavorLines.length > 0) {
    
            currentY += lineHeight * 0.25;
    
            const divider = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );
    
            divider.setAttribute("x1", 0);
            divider.setAttribute("x2", maxWidth);
            divider.setAttribute("y1", currentY);
            divider.setAttribute("y2", currentY);
            divider.setAttribute("stroke", "#2e2e2e");
            divider.setAttribute("stroke-width", "0.5");
    
            cardTextGroup.appendChild(divider);
    
            currentY += lineHeight * 0.75;
    
            for (const line of flavorLines) {
                renderRuleLineExact(
                    line,
                    0,
                    currentY,
                    fontSize,
                    cardTextGroup,
                    keywordSet,
                    state
                );
                currentY += lineHeight;
            }
        }
    }

    // -----------------------------
    // SHRINK LOOP
    // -----------------------------
    let layout = renderAtSize({
            text: rulesText,
            flavorText: flavorText,
            keywords: card.keywords || [],
            fontSize: fontSize,
            cardTextGroup: textGroup,
            maxWidth: maxWidth,
            topY: areaBox.y,
            bottomY: areaBox.y + areaBox.height
        });
    
    while (layout.height > areaBox.height) {
        fontSize -= 0.2;
        svgRoot.removeChild(layout.group);
        layout = renderAtSize({
            text: rulesText,
            flavorText: flavorText,
            keywords: card.keywords || [],
            fontSize: fontSize,
            cardTextGroup: textGroup,
            maxWidth: maxWidth,
            topY: areaBox.y,
            bottomY: areaBox.y + areaBox.height
        });
    }

    // -----------------------------
    // CENTERING
    // -----------------------------
    const centeredTop =
        areaBox.y + (areaBox.height - layout.height) / 2;
    
    const offset = centeredTop - areaBox.y;

    layout.group.setAttribute("transform", `translate(0, ${offset})`);

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
    set: { code: "11" }
};

loadCard(testCard);
