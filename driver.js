// SAJHA - Driver Portal Logic
let drivers = [];
let currentLang = localStorage.getItem('sajhaLang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    loadDrivers();
    setupEvents();
    applyLang();
    prefillFromAccount();
});

// Pre-fill the form if a registered user is logged in
function prefillFromAccount() {
    const userName = localStorage.getItem('sajhaUserName') || '';
    const userPhone = localStorage.getItem('sajhaUserPhone') || '';
    if (userName) {
        const nameInput = document.getElementById('driverName');
        if (nameInput && !nameInput.value) nameInput.value = userName;
    }
    if (userPhone) {
        const phoneInput = document.getElementById('driverPhone');
        if (phoneInput && !phoneInput.value) phoneInput.value = '+91' + userPhone;
    }
}

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

        const name = document.getElementById('driverName').value.trim();
        const exp = document.getElementById('driverExp').value;
        const loc = document.getElementById('driverLoc').value.trim();
        const rate = document.getElementById('driverRate').value;
        const phone = document.getElementById('driverPhone').value.trim();

        if (!name || !loc || !phone) {
            showDriverMsg('⚠️ Please fill in all fields.', 'error');
            return;
        }

        // Check for duplicate phone
        const existing = drivers.find(d => d.phone === phone);
        if (existing) {
            showDriverMsg('⚠️ A driver with this phone number is already registered!', 'error');
            return;
        }

        const newDriver = {
            id: Date.now(),
            name,
            exp: parseInt(exp) || 0,
            loc,
            rate: parseInt(rate) || 0,
            phone
        };

        drivers.unshift(newDriver);
        saveDrivers();
        renderDrivers();
        e.target.reset();
        prefillFromAccount(); // Re-fill from account after form reset

        showDriverMsg('✅ You are now registered as a driver! Farmers can see and call you.', 'success');
    });
}

function loadDrivers() {
    try {
        const saved = localStorage.getItem('sajhaDrivers');
        // Only use pre-seeded demo drivers if nothing stored yet
        if (saved) {
            drivers = JSON.parse(saved);
        } else {
            drivers = [
                { id: 1, name: 'Sohan Lal', exp: 8, loc: 'Patna, Bihar', rate: 450, phone: '+919800012345' },
                { id: 2, name: 'Vikram Singh', exp: 12, loc: 'Gaya, Bihar', rate: 500, phone: '+919876543210' }
            ];
            saveDrivers();
        }
        renderDrivers();
    } catch (e) {
        drivers = [];
        renderDrivers();
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
                <p>${tL('noDrivers')}</p>
                <p style="font-size:12px; color:#aaa; margin-top:6px;">Be the first to register!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = drivers.map(d => `
        <div class="driver-card">
            <div class="driver-info">
                <h4><i class="fas fa-user-circle" style="color:#1565c0;"></i> ${d.name}</h4>
                <p><i class="fas fa-briefcase"></i> ${d.exp} ${tL('yearsExp') || 'yrs experience'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${d.loc}</p>
            </div>
            <div class="driver-meta">
                <div class="driver-rate">₹${d.rate}/${currentLang === 'hi' ? 'दिन' : 'day'}</div>
                <a href="tel:${d.phone}" class="call-btn">
                    <i class="fas fa-phone"></i> ${tL('call') || 'Call'}
                </a>
            </div>
        </div>
    `).join('');
}

function showDriverMsg(text, type) {
    const el = document.getElementById('driverMsg');
    if (!el) return;
    const colors = { success: '#e8f5e9', error: '#ffebee', info: '#e3f2fd' };
    const textColors = { success: '#2e7d32', error: '#c62828', info: '#1565c0' };
    el.style.cssText = `background:${colors[type]||colors.info}; color:${textColors[type]||textColors.info}; padding:12px 16px; border-radius:10px; font-size:14px; margin-bottom:16px; display:block; border:1px solid ${textColors[type]||textColors.info}40;`;
    el.textContent = text;
    if (type !== 'error') setTimeout(() => { if(el) el.style.display = 'none'; }, 4000);
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
