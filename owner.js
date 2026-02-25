// SAJHA - Owner Portal Logic
let myEquipment = [];
let currentLang = localStorage.getItem('sajhaLang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    loadMyEquipment();
    setupEvents();
    applyLang();
});

function setupEvents() {
    // Language Selection
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('sajhaLang', currentLang);
            applyLang();
        });
    }

    // Form Submission
    document.getElementById('listingForm')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('equipName').value;
        const type = document.getElementById('equipType').value;
        const price = document.getElementById('equipPrice').value;
        const from = document.getElementById('timeFrom').value;
        const to = document.getElementById('timeTo').value;

        const newItem = {
            id: Date.now(),
            name,
            type,
            price,
            timing: `${from} - ${to}`,
            status: 'Active'
        };

        myEquipment.unshift(newItem);
        saveEquipment();
        renderEquipment();
        e.target.reset();

        alert(tL('listingSuccess'));
    });
}

function loadMyEquipment() {
    try {
        const saved = localStorage.getItem('sajhaOwnerEquipment');
        myEquipment = saved ? JSON.parse(saved) : [];
        renderEquipment();
    } catch (e) {
        myEquipment = [];
    }
}

function saveEquipment() {
    localStorage.setItem('sajhaOwnerEquipment', JSON.stringify(myEquipment));
}

function renderEquipment() {
    const list = document.getElementById('equipmentList');
    if (!list) return;

    if (myEquipment.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tractor"></i>
                <p data-i18n="noListings">${tL('noListings')}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = myEquipment.map(item => `
        <div class="equip-item">
            <div class="equip-info">
                <h4>${item.name} <small>(${tL(item.type)})</small></h4>
                <p><i class="far fa-clock"></i> ${item.timing}</p>
                <div class="equip-price">₹${item.price}/hr</div>
            </div>
            <button class="delete-btn" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

window.deleteItem = function (id) {
    if (confirm(currentLang === 'hi' ? 'क्या आप इसे हटाना चाहते हैं?' : 'Are you sure you want to delete this?')) {
        myEquipment = myEquipment.filter(item => item.id !== id);
        saveEquipment();
        renderEquipment();
    }
};



function tL(key) {
    if (typeof lang === 'undefined') return key;
    return (lang[currentLang] && lang[currentLang][key]) || lang.en[key] || key;
}

function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = tL(key);
    });

    // Also update titles in head if needed
    document.title = currentLang === 'hi' ? 'SAJHA - मालिक पोर्टल' : 'SAJHA - Owner Portal';
}
