// SAJHA - Owner Portal Logic
let myEquipment = [];
let currentLang = localStorage.getItem('sajhaLang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check - Must be logged in as owner
    const userRole = localStorage.getItem('sajhaUser');
    if (!userRole || userRole !== 'owner') {
        showMsg('⚠️ Please login as a Machine Owner to access this portal. Redirecting...', 'error');
        setTimeout(() => location.href = 'login.html', 1500);
        return;
    }

    const ownerName = localStorage.getItem('sajhaUserName') || 'Owner';
    const ownerVillage = localStorage.getItem('sajhaUserVillage') || '';
    const welcomeEl = document.getElementById('ownerWelcome');
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${ownerName} (${ownerVillage})`;

    loadMyEquipment();
    renderIncomingBookings();
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

        const name = document.getElementById('equipName').value.trim();
        const type = document.getElementById('equipType').value;
        const price = document.getElementById('equipPrice').value;
        const from = document.getElementById('timeFrom').value;
        const to = document.getElementById('timeTo').value;
        const ownerName = localStorage.getItem('sajhaUserName') || 'Owner';
        const ownerPhone = localStorage.getItem('sajhaUserPhone') || '';

        if (!name || !price) {
            showMsg('⚠️ Please fill all required fields.', 'error');
            return;
        }

        const newItem = {
            id: Date.now(),
            name,
            type,
            price,
            timing: `${from} - ${to}`,
            status: 'Active',
            ownerName,
            ownerPhone
        };

        myEquipment.unshift(newItem);
        saveEquipment();
        renderEquipment();
        e.target.reset();
        showMsg('✅ Equipment listed successfully! Farmers can now find your machine.', 'success');
    });
}

function loadMyEquipment() {
    try {
        // Load ALL equipment  — filter only equipment listed by this owner
        const ownerPhone = localStorage.getItem('sajhaUserPhone') || '';
        const saved = localStorage.getItem('sajhaOwnerEquipment');
        const allEquip = saved ? JSON.parse(saved) : [];
        // Show only this owner's equipment
        myEquipment = allEquip.filter(item => item.ownerPhone === ownerPhone || !item.ownerPhone);
        renderEquipment();
    } catch (e) {
        myEquipment = [];
        renderEquipment();
    }
}

function saveEquipment() {
    try {
        const ownerPhone = localStorage.getItem('sajhaUserPhone') || '';
        const saved = localStorage.getItem('sajhaOwnerEquipment');
        let allEquip = saved ? JSON.parse(saved) : [];

        // Remove this owner's old entries
        allEquip = allEquip.filter(item => item.ownerPhone !== ownerPhone);

        // Add their current list back
        const updated = [...myEquipment, ...allEquip];
        localStorage.setItem('sajhaOwnerEquipment', JSON.stringify(updated));
    } catch(e) {
        localStorage.setItem('sajhaOwnerEquipment', JSON.stringify(myEquipment));
    }
}

function renderEquipment() {
    const list = document.getElementById('equipmentList');
    if (!list) return;

    if (myEquipment.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tractor"></i>
                <p>${tL('noListings')}</p>
                <p style="font-size: 13px; margin-top: 6px; color: #aaa;">Use the form to list your first machine!</p>
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
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                <span style="font-size:11px; padding:3px 8px; border-radius:10px;
                    background:${item.status==='Active'?'#e8f5e9':'#fff3e0'};
                    color:${item.status==='Active'?'#2e7d32':'#e65100'}; font-weight:600;">
                    ${item.status}
                </span>
                <button class="delete-btn" onclick="deleteItem(${item.id})" title="Remove listing">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Render incoming farmer bookings for this owner's equipment
function renderIncomingBookings() {
    const container = document.getElementById('incomingBookings');
    if (!container) return;

    try {
        const ownerPhone = localStorage.getItem('sajhaUserPhone') || '';
        const savedReqs = localStorage.getItem('sajhaBookingRequests');
        const allReqs = savedReqs ? JSON.parse(savedReqs) : [];

        // Filter requests for this owner's equipment
        const myReqs = allReqs.filter(r => r.ownerPhone === ownerPhone);

        if (myReqs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No booking requests yet.</p>
                    <p style="font-size:12px; color:#aaa; margin-top:6px;">Requests from farmers will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myReqs.map(req => `
            <div class="equip-item" style="flex-direction:column; align-items:stretch;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <h4 style="font-size:15px; margin-bottom:2px;">${req.farmerName || 'Farmer'}</h4>
                        <p style="font-size:12px; color:#888;"><i class="fas fa-phone"></i> ${req.farmerPhone || 'N/A'}</p>
                    </div>
                    <span style="font-size:11px; padding:3px 10px; border-radius:10px; font-weight:600;
                        background:${req.status==='Confirmed'?'#e8f5e9':req.status==='Cancelled'?'#ffebee':'#fff3e0'};
                        color:${req.status==='Confirmed'?'#2e7d32':req.status==='Cancelled'?'#c62828':'#e65100'};">
                        ${req.status}
                    </span>
                </div>
                <p style="font-size:13px;"><i class="fas fa-tractor" style="color:var(--green);"></i> <strong>${req.equipment}</strong></p>
                <p style="font-size:13px;"><i class="fas fa-map-marker-alt" style="color:var(--green);"></i> ${req.location}</p>
                <p style="font-size:13px;"><i class="fas fa-calendar" style="color:var(--green);"></i> ${req.dateTime}</p>
                <p style="font-size:14px; font-weight:700; color:var(--green);">${req.total}</p>
                <p style="font-size:11px; color:#888;">Booking ID: ${req.id}</p>
                ${req.status === 'Confirmed' ? `
                <div style="display:flex; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
                    <a href="tel:${req.farmerPhone}" class="call-btn" style="flex:1; text-align:center; padding:8px; text-decoration:none;">
                        <i class="fas fa-phone"></i> Call Farmer
                    </a>
                    <button onclick="markComplete('${req.id}')" style="flex:1; background:#1565c0; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; padding:8px; font-family:inherit;">
                        <i class="fas fa-check"></i> Done
                    </button>
                </div>` : ''}
            </div>
        `).join('');

    } catch(e) {
        console.error('Error loading bookings', e);
    }
}

window.markComplete = function(reqId) {
    try {
        const savedReqs = localStorage.getItem('sajhaBookingRequests');
        let allReqs = savedReqs ? JSON.parse(savedReqs) : [];
        allReqs = allReqs.map(r => r.id === reqId ? {...r, status: 'Completed'} : r);
        localStorage.setItem('sajhaBookingRequests', JSON.stringify(allReqs));
        renderIncomingBookings();
        showMsg('✅ Job marked as completed!', 'success');
    } catch(e) {}
};

window.deleteItem = function(id) {
    if (confirm(currentLang === 'hi' ? 'क्या आप इसे हटाना चाहते हैं?' : 'Are you sure you want to delete this listing?')) {
        myEquipment = myEquipment.filter(item => item.id !== id);
        saveEquipment();
        renderEquipment();
        showMsg('Listing removed.', 'info');
    }
};

function showMsg(text, type) {
    const msgEl = document.getElementById('ownerMsg');
    if (!msgEl) return;
    const colors = { success: '#e8f5e9', error: '#ffebee', info: '#e3f2fd' };
    const textColors = { success: '#2e7d32', error: '#c62828', info: '#1565c0' };
    msgEl.style.cssText = `background:${colors[type]||colors.info}; color:${textColors[type]||textColors.info}; padding:12px 16px; border-radius:10px; font-size:14px; margin-bottom:16px; display:block;`;
    msgEl.textContent = text;
    if (type !== 'error') setTimeout(() => { if(msgEl) msgEl.style.display = 'none'; }, 3500);
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
    document.title = currentLang === 'hi' ? 'SAJHA - मालिक पोर्टल' : 'SAJHA - Owner Portal';
}
