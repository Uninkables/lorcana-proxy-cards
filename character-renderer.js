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

            const tokens = paragraph.split(/(\{[A-Z]+\})/g).filter(Boolean);
            let currentLine = "";

            tokens.forEach(token => {

                const testText = currentLine + token;

                const testNode = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );

                testNode.setAttribute("x", startX);
                testNode.setAttribute("font-size", fontSize);
                testNode.textContent = testText;

                textEl.appendChild(testNode);
                const width = testNode.getBBox().width;
                textEl.removeChild(testNode);

                if (width > maxWidth && currentLine !== "") {
                    wrapped.push(currentLine);
                    currentLine = token;
                } else {
                    currentLine = testText;
                }

            });

            wrapped.push(currentLine);
        });

        return wrapped;
    }

    // -----------------------------
    // RENDER RULE LINE
    // -----------------------------
    function renderRuleLine(parentGroup, line, y) {

        let currentX = startX;
        const tokens = line.split(/(\{[A-Z]+\})/g).filter(Boolean);

        tokens.forEach(token => {

            if (SYMBOL_MAP[token]) {

                const symbolDef = svgRoot.querySelector(SYMBOL_MAP[token]);
                if (!symbolDef) return;

                const clone = symbolDef.cloneNode(true);
                const scaleFactor = fontSize / 105.834;

                clone.setAttribute(
                    "transform",
                    `translate(${currentX}, ${y - fontSize * 0.8}) scale(${scaleFactor})`
                );

                parentGroup.appendChild(clone);

                currentX += fontSize + (fontSize * 0.25);

            } else {

                const textNode = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );

                textNode.setAttribute("x", currentX);
                textNode.setAttribute("y", y);
                textNode.setAttribute("font-size", fontSize);
                textNode.setAttribute("fill", "#2e2e2e");
                textNode.textContent = token;

                parentGroup.appendChild(textNode);

                const width = textNode.getBBox().width;
                currentX += width;
            }

        });
    }

    // -----------------------------
    // RENDER AT SIZE
    // -----------------------------
    function renderAtSize() {

        clearText(textEl);

        ruleLines = wrapText(rulesText);
        flavorLines = flavorText ? wrapText(flavorText) : [];

        let currentY = areaBox.y + fontSize;

        ruleLines.forEach(line => {
            renderRuleLine(textEl, line, currentY);
            currentY += fontSize * 1.2;
        });

        if (flavorLines.length > 0) {
            currentY += fontSize * 0.8;

            flavorLines.forEach(line => {

                const flavorNode = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );

                flavorNode.setAttribute("x", startX);
                flavorNode.setAttribute("y", currentY);
                flavorNode.setAttribute("font-size", fontSize);
                flavorNode.setAttribute("font-style", "italic");
                flavorNode.setAttribute("fill", "#2e2e2e");

                flavorNode.textContent = line;

                textEl.appendChild(flavorNode);

                currentY += fontSize * 1.2;
            });
        }

        return textEl.getBBox().height;
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
    cost: 4,
    inkwell: true,
    strength: 3,
    willpower: 4,
    lore: 2,
    rarity: "Uncommon",
    classifications: ["Storyborn", "Hero", "Princess"],
    text: "SHADOW POWER When you play this character, you may give chosen character Challenger +2 and Resist +2 until the start of your next turn. (They get +2 {S} while challenging. Damage dealt to them is reduced by 2.)\nETERNAL NIGHT Your Gargoyle characters lose the Stone by Day ability.",
    flavor_text: "\"...\n...\n...\"",
    illustrators: ["Matthew Robert Davies"],
    collector_number: "67",
    lang: "en",
    set: { code: "8" }
};

loadCard(testCard);
