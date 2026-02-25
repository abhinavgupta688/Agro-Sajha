// SAJHA - Driver Portal Logic
let drivers = [];
let currentLang = localStorage.getItem('sajhaLang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    loadDrivers();
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

    // Driver Registration Form
    document.getElementById('driverForm')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('driverName').value;
        const exp = document.getElementById('driverExp').value;
        const loc = document.getElementById('driverLoc').value;
        const rate = document.getElementById('driverRate').value;
        const phone = document.getElementById('driverPhone').value;

        const newDriver = {
            id: Date.now(),
            name,
            exp,
            loc,
            rate,
            phone
        };

        drivers.unshift(newDriver);
        saveDrivers();
        renderDrivers();
        e.target.reset();

        alert(tL('driverSuccess'));
    });
}

function loadDrivers() {
    try {
        const saved = localStorage.getItem('sajhaDrivers');
        drivers = saved ? JSON.parse(saved) : [
            { id: 1, name: 'Sohan Lal', exp: 8, loc: 'Patna', rate: 450, phone: '+919800012345' },
            { id: 2, name: 'Vikram Singh', exp: 12, loc: 'Gaya', rate: 500, phone: '+919876543210' }
        ];
        renderDrivers();
    } catch (e) {
        drivers = [];
    }
}

function saveDrivers() {
    localStorage.setItem('sajhaDrivers', JSON.stringify(drivers));
}

function renderDrivers() {
    const list = document.getElementById('driverList');
    if (!list) return;

    if (drivers.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-id-card"></i>
                <p data-i18n="noDrivers">${tL('noDrivers')}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = drivers.map(d => `
        <div class="driver-card">
            <div class="driver-info">
                <h4>${d.name}</h4>
                <p><i class="fas fa-briefcase"></i> ${d.exp} ${tL('yearsExp')}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${d.loc}</p>
            </div>
            <div class="driver-meta">
                <div class="driver-rate">₹${d.rate}/${currentLang === 'hi' ? 'दिन' : 'day'}</div>
                <a href="tel:${d.phone}" class="call-btn"><i class="fas fa-phone"></i> ${tL('call')}</a>
            </div>
        </div>
    `).join('');
}



function tL(key) {
    if (typeof lang === 'undefined') return key;
    return (lang[currentLang] && lang[currentLang][key]) || lang.en[key] || key;
}

function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = tL(key);
    });
    document.title = currentLang === 'hi' ? 'SAJHA - ड्राइवर पोर्टल' : 'SAJHA - Driver Portal';
}
