// Lit Energy Flavors Data Configuration
const FLAVORS = [
    {
        id: 1,
        name: "Lit Energy Original",
        img: "assets/lit_energy_1.jpg",
        rarity: "ОБЫЧНЫЙ",
        rarityClass: "common",
        chance: 24,
        color: "#e22f38"
    },
    {
        id: 2,
        name: "Lit Energy Blueberry",
        img: "assets/lit_energy_2.jpg",
        rarity: "ОБЫЧНЫЙ",
        rarityClass: "common",
        chance: 22,
        color: "#3b5998"
    },
    {
        id: 3,
        name: "Lit Energy Mango Coconut",
        img: "assets/lit_energy_3.jpg",
        rarity: "РЕДКИЙ",
        rarityClass: "rare",
        chance: 18,
        color: "#f39c12"
    },
    {
        id: 4,
        name: "Lit Energy Zero Sugar",
        img: "assets/lit_energy_4.jpg",
        rarity: "ОБЫЧНЫЙ",
        rarityClass: "common",
        chance: 15,
        color: "#2ecc71"
    },
    {
        id: 5,
        name: "Lit Energy Bubble Gum",
        img: "assets/lit_energy_5.jpg",
        rarity: "РЕДКИЙ",
        rarityClass: "rare",
        chance: 7,
        color: "#e84393"
    },
    {
        id: 6,
        name: "Lit Energy Citrus Rush",
        img: "assets/lit_energy_6.jpg",
        rarity: "ЭПИЧЕСКИЙ",
        rarityClass: "epic",
        chance: 4,
        color: "#f1c40f"
    },
    {
        id: 7,
        name: "Lit Energy Wild Berry",
        img: "assets/lit_energy_7.jpg",
        rarity: "ЭПИЧЕСКИЙ",
        rarityClass: "epic",
        chance: 3,
        color: "#9b59b6"
    },
    {
        id: 8,
        name: "Lit Energy Secret Edition Gold",
        img: "assets/lit_energy_8.jpg",
        rarity: "ЛЕГЕНДАРНЫЙ",
        rarityClass: "legendary",
        chance: 1,
        color: "#ffb703"
    },
    {
        id: 9,
        name: "Lit Energy Trubochki",
        img: "assets/lit_energy_9.png",
        rarity: "ЭПИЧЕСКИЙ",
        rarityClass: "rare",
        chance: 5,
        color: "#e84393"
    }
];

// App State
let balance = 5000;
let currentBet = 100;
let inventory = {}; // { flavorId: count }
let isSpinning = false;
let currentRotation = 0; // in radians
let pendingWonFlavor = null;

// Loaded Images Cache
const loadedImages = {};

// DOM Elements
const balanceDisplay = document.getElementById("balanceDisplay");
const spinBtn = document.getElementById("spinBtn");
const betButtons = document.querySelectorAll(".bet-btn");
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const tabInventoryBtn = document.getElementById("tabInventoryBtn");
const tabFlavorsBtn = document.getElementById("tabFlavorsBtn");
const inventoryTab = document.getElementById("inventoryTab");
const flavorsTab = document.getElementById("flavorsTab");
const inventoryGrid = document.getElementById("inventoryGrid");
const inventoryCount = document.getElementById("inventoryCount");
const flavorsList = document.getElementById("flavorsList");

// Modals
const depositModal = document.getElementById("depositModal");
const openDepositBtn = document.getElementById("openDepositBtn");
const closeDepositBtn = document.getElementById("closeDepositBtn");
const depositForm = document.getElementById("depositForm");

const winModal = document.getElementById("winModal");
const closeWinBtn = document.getElementById("closeWinBtn");
const claimWinBtn = document.getElementById("claimWinBtn");
const winItemImg = document.getElementById("winItemImg");
const winItemTitle = document.getElementById("winItemTitle");
const winRarityBadge = document.getElementById("winRarityBadge");

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    preloadImages(() => {
        drawWheel(currentRotation);
    });
    renderFlavorsList();
    renderInventory();
    updateUI();
    setupEventListeners();
});

// Load State from LocalStorage
function loadState() {
    const savedBalance = localStorage.getItem("l1t_balance");
    if (savedBalance !== null) {
        balance = parseInt(savedBalance, 10);
    } else {
        balance = 5000;
        localStorage.setItem("l1t_balance", balance);
    }

    const savedInventory = localStorage.getItem("l1t_inventory");
    if (savedInventory) {
        try {
            inventory = JSON.parse(savedInventory);
        } catch (e) {
            inventory = {};
        }
    }
}

function saveState() {
    localStorage.setItem("l1t_balance", balance);
    localStorage.setItem("l1t_inventory", JSON.stringify(inventory));
}

// Preload flavor images for canvas drawing
function preloadImages(callback) {
    let loaded = 0;
    FLAVORS.forEach((flavor) => {
        const img = new Image();
        img.src = flavor.img;
        img.onload = () => {
            loadedImages[flavor.id] = img;
            loaded++;
            if (loaded === FLAVORS.length) {
                callback();
            }
        };
        img.onerror = () => {
            loaded++;
            if (loaded === FLAVORS.length) {
                callback();
            }
        };
    });
}

// UI Updates
function updateUI() {
    balanceDisplay.textContent = balance.toLocaleString("ru-RU") + " ₽";
    spinBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> ВРАЩАТЬ (${currentBet.toLocaleString("ru-RU")} ₽)`;

    if (balance < currentBet) {
        spinBtn.disabled = true;
    } else {
        spinBtn.disabled = isSpinning;
    }

    const totalItemsCount = Object.values(inventory).reduce((a, b) => a + b, 0);
    inventoryCount.textContent = totalItemsCount;
}

// Event Listeners Setup
function setupEventListeners() {
    // Bet Buttons
    betButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (isSpinning) return;
            betButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentBet = parseInt(btn.dataset.bet, 10);
            updateUI();
        });
    });

    // Spin Button
    spinBtn.addEventListener("click", spinWheel);

    // Deposit Modal
    openDepositBtn.addEventListener("click", () => depositModal.classList.remove("hidden"));
    closeDepositBtn.addEventListener("click", () => depositModal.classList.remove("hidden") && false);
    closeDepositBtn.onclick = () => depositModal.classList.add("hidden");

    depositModal.addEventListener("click", (e) => {
        if (e.target === depositModal) depositModal.classList.add("hidden");
    });

    depositForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const depositAmountInput = document.getElementById("depositAmountInput");
        const addedAmount = parseInt(depositAmountInput.value, 10) || 5000;

        balance += addedAmount;
        saveState();
        updateUI();

        depositModal.classList.add("hidden");
        alert(`Счёт успешно пополнен на ${addedAmount.toLocaleString("ru-RU")} ₽!`);
    });

    // Win Modal
    closeWinBtn.addEventListener("click", claimWin);
    claimWinBtn.addEventListener("click", claimWin);

    // Tabs
    tabInventoryBtn.addEventListener("click", () => {
        tabInventoryBtn.classList.add("active");
        tabFlavorsBtn.classList.remove("active");
        inventoryTab.classList.remove("hidden");
        flavorsTab.classList.add("hidden");
    });

    tabFlavorsBtn.addEventListener("click", () => {
        tabFlavorsBtn.classList.add("active");
        tabInventoryBtn.classList.remove("active");
        flavorsTab.classList.remove("hidden");
        inventoryTab.classList.add("hidden");
    });

    // Card Input Auto-formatting
    const cardNumberInput = document.getElementById("cardNumberInput");
    cardNumberInput.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "");
        val = val.replace(/(.{4})/g, "$1 ").trim();
        e.target.value = val.substring(0, 19);
    });

    const cardExpInput = document.getElementById("cardExpInput");
    cardExpInput.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length >= 2) {
            val = val.substring(0, 2) + "/" + val.substring(2, 4);
        }
        e.target.value = val.substring(0, 5);
    });
}

// Draw Canvas Wheel
function drawWheel(rotationAngle) {
    const numSectors = FLAVORS.length;
    const arcSize = (2 * Math.PI) / numSectors;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSectors; i++) {
        const flavor = FLAVORS[i];
        const startAngle = rotationAngle + i * arcSize;
        const endAngle = startAngle + arcSize;

        // Draw Sector Slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // Alternate sector background styles
        const bgGradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, radius);
        if (i % 2 === 0) {
            bgGradient.addColorStop(0, "#3a2d3a");
            bgGradient.addColorStop(1, "#251a25");
        } else {
            bgGradient.addColorStop(0, "#2c212c");
            bgGradient.addColorStop(1, "#1d141d");
        }
        ctx.fillStyle = bgGradient;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(249, 92, 84, 0.3)";
        ctx.stroke();

        // Draw Outer Rim Accent
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineWidth = 6;
        ctx.strokeStyle = flavor.color;
        ctx.stroke();

        // Draw Flavor Can Image inside Sector
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);

        const img = loadedImages[flavor.id];
        if (img) {
            const imgSize = 45;
            ctx.drawImage(img, radius * 0.65 - imgSize / 2, -imgSize / 2, imgSize, imgSize);
        }

        ctx.restore();
    }

    // Draw Center Circle Cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 40);
    centerGradient.addColorStop(0, "#f95c54");
    centerGradient.addColorStop(1, "#e22f38");
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Center Lightning Bolt Icon Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", centerX, centerY);
}

// Spin Wheel Logic
function spinWheel() {
    if (isSpinning || balance < currentBet) return;

    balance -= currentBet;
    saveState();
    updateUI();

    isSpinning = true;
    spinBtn.disabled = true;

    // Pick winning flavor according to weighted chances
    const wonFlavor = selectWinningFlavor();
    pendingWonFlavor = wonFlavor;

    const winningIndex = FLAVORS.findIndex((f) => f.id === wonFlavor.id);
    const numSectors = FLAVORS.length;
    const arcSize = (2 * Math.PI) / numSectors;

    // Target pointer is at the TOP of canvas (-PI/2 or 3PI/2)
    // Sector center relative to rotation = winningIndex * arcSize + arcSize / 2
    // We want: rotationAngle + sectorCenter = 3*PI/2 (or -PI/2)
    const targetSectorCenter = winningIndex * arcSize + arcSize / 2;
    const pointerAngle = 1.5 * Math.PI; // 270 degrees in radians (Top pointer)

    // Calculate normalized target rotation (modulo 2PI)
    let desiredRotationNorm = pointerAngle - targetSectorCenter;
    desiredRotationNorm = ((desiredRotationNorm % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Current rotation modulo 2PI
    const currentNorm = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Add extra 5-8 full spins for dramatic effect
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;

    let rotationDelta = desiredRotationNorm - currentNorm;
    if (rotationDelta < 0) {
        rotationDelta += 2 * Math.PI;
    }

    const totalRotationTarget = currentRotation + extraSpins + rotationDelta;

    const startTime = performance.now();
    const duration = 4500; // 4.5 seconds spin animation

    function animateSpin(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic ease-out function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAnimRotation = currentRotation + (totalRotationTarget - currentRotation) * easeOut;

        drawWheel(currentAnimRotation);

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            currentRotation = totalRotationTarget;
            isSpinning = false;
            updateUI();
            showWinModal(wonFlavor);
        }
    }

    requestAnimationFrame(animateSpin);
}

// Select Winning Flavor using Weighted Random Probability
function selectWinningFlavor() {
    const totalChance = FLAVORS.reduce((acc, f) => acc + f.chance, 0);
    let rand = Math.random() * totalChance;

    for (let flavor of FLAVORS) {
        if (rand < flavor.chance) {
            return flavor;
        }
        rand -= flavor.chance;
    }
    return FLAVORS[0];
}

// Show Win Modal
function showWinModal(flavor) {
    winItemImg.src = flavor.img;
    winItemTitle.textContent = flavor.name;
    winRarityBadge.textContent = flavor.rarity;
    winRarityBadge.className = `win-rarity-badge ${flavor.rarityClass}`;

    winModal.classList.remove("hidden");
}

// Claim Win into Inventory
function claimWin() {
    if (pendingWonFlavor) {
        const id = pendingWonFlavor.id;
        inventory[id] = (inventory[id] || 0) + 1;
        saveState();
        renderInventory();
        updateUI();
        pendingWonFlavor = null;
    }
    winModal.classList.add("hidden");
}

// Render Inventory Section
function renderInventory() {
    const keys = Object.keys(inventory).filter((key) => inventory[key] > 0);

    if (keys.length === 0) {
        inventoryGrid.innerHTML = `
            <div class="empty-inventory">
                <i class="fa-solid fa-box-open"></i>
                <p>Ваш инвентарь пуст. Крутите колесо, чтобы выбить баночки!</p>
            </div>
        `;
        return;
    }

    inventoryGrid.innerHTML = "";
    keys.forEach((keyId) => {
        const flavor = FLAVORS.find((f) => f.id == keyId);
        const count = inventory[keyId];
        if (!flavor) return;

        const card = document.createElement("div");
        card.className = `item-card ${flavor.rarityClass}`;
        card.innerHTML = `
            <span class="item-count-badge">x${count}</span>
            <img src="${flavor.img}" alt="${flavor.name}" class="item-img">
            <div class="item-name">${flavor.name}</div>
            <div class="item-rarity">${flavor.rarity}</div>
        `;
        inventoryGrid.appendChild(card);
    });
}

// Render Flavors List
function renderFlavorsList() {
    flavorsList.innerHTML = "";
    FLAVORS.forEach((flavor) => {
        const row = document.createElement("div");
        row.className = "flavor-row";
        row.innerHTML = `
            <img src="${flavor.img}" alt="${flavor.name}" class="flavor-thumb">
            <div class="flavor-details">
                <h4>${flavor.name}</h4>
                <p class="flavor-rarity ${flavor.rarityClass}">${flavor.rarity}</p>
            </div>
            <div class="flavor-chance">${flavor.chance}%</div>
        `;
        flavorsList.appendChild(row);
    });
}
