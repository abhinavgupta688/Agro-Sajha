// SAJHA - Club Portal Logic
let clubs = [
    { id: 1, name: 'Progressive Farmers', village: 'Rampur', members: 12 },
    { id: 2, name: 'Agro Cooperative', village: 'Siwan', members: 8 },
    { id: 3, name: 'Local Combine Group', village: 'Khurja', members: 15 }
];
let currentLang = localStorage.getItem('sajhaLang') || 'en';

let toolBankData = [
    { name: 'Seed Drill (Manual)', owner: 'Ram Singh', type: 'Tool', status: 'Available' },
    { name: 'Mustard Seeds (High Yield)', owner: 'Suresh Yadav', type: 'Seed', status: '5kg Left' },
    { name: 'Sickle & Spade Set', owner: 'Amit Patel', type: 'Tool', status: 'In Use' }
];

document.addEventListener('DOMContentLoaded', () => {
    loadClubs();
    loadToolBank();
    renderToolBank();
    setupEvents();
    applyLang();
});

function loadToolBank() {
    try {
        const saved = localStorage.getItem('sajhaToolBank');
        if (saved) toolBankData = JSON.parse(saved);
    } catch(e) {}
}

function saveToolBank() {
    localStorage.setItem('sajhaToolBank', JSON.stringify(toolBankData));
}

function renderToolBank() {
    const list = document.getElementById('toolBankList');
    if (!list) return;

    list.innerHTML = toolBankData.map((item, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #fafafa; border: 1px solid #eee; border-radius: 10px; margin-bottom: 8px;">
            <div>
                <strong style="font-size: 14px; color: #333;">${item.name}</strong>
                <div style="font-size: 12px; color: #888; margin-top: 2px;">
                    <i class="fas fa-user" style="color:var(--green);"></i> ${item.owner} &nbsp;|&nbsp;
                    <span style="background:#e8f5e9; color:#2e7d32; padding:2px 6px; border-radius:6px; font-size:11px; font-weight:600;">${item.type}</span>
                </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                <span style="font-size: 11px; font-weight: 700; padding:3px 8px; border-radius:8px;
                    background:${item.status === 'Available' ? '#e8f5e9' : '#fff3e0'};
                    color:${item.status === 'Available' ? '#2e7d32' : '#e65100'};">${item.status}</span>
                ${item.status === 'Available' ? `<button onclick="requestTool(${idx})" style="font-size:11px; padding:4px 10px; background:#1565c0; color:white; border:none; border-radius:6px; cursor:pointer; font-family:inherit;">Request</button>` : ''}
            </div>
        </div>
    `).join('');
}

window.requestTool = function(idx) {
    showClubMsg(`✅ Request sent for "${toolBankData[idx].name}"! The owner will contact you soon.`, 'success');
};

function setupEvents() {
    // List Tool Button — replaced prompt() with inline form
    document.getElementById('listToolBtn')?.addEventListener('click', () => {
        const existingForm = document.getElementById('addToolForm');
        if (existingForm) { existingForm.remove(); return; }

        const form = document.createElement('div');
        form.id = 'addToolForm';
        form.style.cssText = 'background:#f5f5f5; padding:16px; border-radius:10px; margin-top:12px; border:1px solid #e0e0e0;';
        form.innerHTML = `
            <p style="font-weight:600; margin-bottom:12px; color:#333;"><i class="fas fa-plus"></i> List a Tool or Seed</p>
            <input type="text" id="toolNameInput" placeholder="Tool/Seed name (e.g. Rotavator 2hr free)" 
                style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; font-family:inherit; font-size:14px; margin-bottom:10px; box-sizing:border-box;">
            <select id="toolTypeInput" style="width:100%; padding:10px 12px; border:1px solid #ddd; border-radius:8px; font-family:inherit; font-size:14px; margin-bottom:10px; box-sizing:border-box;">
                <option value="Tool">Tool</option>
                <option value="Seed">Seed</option>
                <option value="Equipment">Equipment</option>
            </select>
            <div style="display:flex; gap:8px;">
                <button onclick="submitToolListing()" style="flex:1; background:var(--green); color:white; border:none; padding:10px; border-radius:8px; font-weight:600; cursor:pointer; font-family:inherit;">List Now</button>
                <button onclick="document.getElementById('addToolForm').remove()" style="flex:1; background:#f5f5f5; border:1px solid #ddd; padding:10px; border-radius:8px; cursor:pointer; font-family:inherit;">Cancel</button>
            </div>
        `;
        document.getElementById('listToolBtn').insertAdjacentElement('afterend', form);
    });

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

    // Create Club Form
    document.getElementById('createClubForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newClubName').value.trim();
        const village = document.getElementById('clubVillage').value.trim();

        if (!name || !village) {
            showClubMsg('⚠️ Please enter both club name and village.', 'error');
            return;
        }

        const existing = clubs.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            showClubMsg('⚠️ A club with this name already exists!', 'error');
            return;
        }

        const newClub = {
            id: Date.now(),
            name,
            village,
            members: 1
        };

        clubs.unshift(newClub);
        saveClubs();
        renderClubs();
        e.target.reset();
        showClubMsg(`✅ "${name}" club created! Others can now join.`, 'success');
    });
}

window.submitToolListing = function() {
    const name = document.getElementById('toolNameInput')?.value.trim();
    const type = document.getElementById('toolTypeInput')?.value || 'Tool';
    if (!name) {
        showClubMsg('⚠️ Please enter a tool or seed name.', 'error');
        return;
    }
    const userName = localStorage.getItem('sajhaUserName') || 'You';
    toolBankData.unshift({ name, owner: userName, type, status: 'Available' });
    saveToolBank();
    renderToolBank();
    document.getElementById('addToolForm')?.remove();
    showClubMsg(`✅ "${name}" listed! Nearby farmers can now request it.`, 'success');
};

function loadClubs() {
    const saved = localStorage.getItem('sajhaClubs');
    if (saved) {
        try { clubs = JSON.parse(saved); } catch(e) {}
    }
    renderClubs();
}

function saveClubs() {
    localStorage.setItem('sajhaClubs', JSON.stringify(clubs));
}

function renderClubs() {
    const list = document.getElementById('clubList');
    if (!list) return;

    if (clubs.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:30px;color:#888;"><i class="fas fa-users" style="font-size:36px;opacity:0.3;margin-bottom:12px;display:block;"></i>${tL('noClubs')}</div>`;
        return;
    }

    list.innerHTML = clubs.map(club => `
        <div class="club-card">
            <div class="club-info">
                <h4>${club.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${club.village}</p>
            </div>
            <div class="club-meta">
                <span class="member-badge">${club.members} ${tL('memberCount') || 'members'}</span>
                <button class="orange-btn" style="padding: 8px 16px; margin-top: 8px; font-size: 13px;" onclick="joinClub(${club.id})">
                    ${tL('joinBtn') || 'Join'}
                </button>
            </div>
        </div>
    `).join('');
}

window.joinClub = function(id) {
    const club = clubs.find(c => c.id === id);
    if (!club) return;
    clubs = clubs.map(c => c.id === id ? { ...c, members: c.members + 1 } : c);
    saveClubs();
    renderClubs();
    showClubMsg(`✅ You joined "${club.name}"! Welcome to the community.`, 'success');
};

function showClubMsg(text, type) {
    let el = document.getElementById('clubMsg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'clubMsg';
        const container = document.querySelector('.club-container') || document.body;
        container.insertAdjacentElement('afterbegin', el);
    }
    const colors = { success: '#e8f5e9', error: '#ffebee', info: '#e3f2fd' };
    const textColors = { success: '#2e7d32', error: '#c62828', info: '#1565c0' };
    el.style.cssText = `background:${colors[type]};color:${textColors[type]};padding:12px 16px;border-radius:10px;font-size:14px;margin-bottom:16px;display:block;border:1px solid ${textColors[type]}40;`;
    el.textContent = text;
    if (type !== 'error') setTimeout(() => { el.style.display = 'none'; }, 4000);
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
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.placeholder = tL(key);
    });
    document.title = (currentLang === 'hi' ? 'SAJHA - किसान क्लब' : 'SAJHA - Farmers Club');
}
