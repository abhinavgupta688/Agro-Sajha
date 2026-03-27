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
    renderToolBank();
    setupEvents();
    applyLang();
});

function renderToolBank() {
    const list = document.getElementById('toolBankList');
    if (!list) return;

    list.innerHTML = toolBankData.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #fafafa; border: 1px solid #eee; border-radius: 8px;">
            <div>
                <strong style="font-size: 14px; color: #333;">${item.name}</strong>
                <div style="font-size: 11px; color: #888;">Owner: ${item.owner} | ${item.type}</div>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: ${item.status === 'Available' ? '#2e7d32' : '#e65100'};">${item.status}</span>
        </div>
    `).join('');
}

function setupEvents() {
    // List Tool Button
    document.getElementById('listToolBtn')?.addEventListener('click', () => {
        const name = prompt("Enter Tool or Seed Name:");
        if (name) {
            toolBankData.unshift({
                name: name,
                owner: 'You',
                type: 'Shared',
                status: 'Available'
            });
            renderToolBank();
            alert("Listed successfully! Your neighbor will contact you if they need it.");
        }
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

    // Create Club
    document.getElementById('createClubForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newClubName').value;
        const village = document.getElementById('clubVillage').value;

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
        alert(tL('clubSuccess'));
    });
}

function loadClubs() {
    const saved = localStorage.getItem('sajhaClubs');
    if (saved) {
        clubs = JSON.parse(saved);
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
        list.innerHTML = `<p style="text-align:center;color:#666;">${tL('noClubs')}</p>`;
        return;
    }

    list.innerHTML = clubs.map(club => `
        <div class="club-card">
            <div class="club-info">
                <h4>${club.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${club.village}</p>
            </div>
            <div class="club-meta">
                <span class="member-badge">${club.members} ${tL('memberCount')}</span>
                <button class="orange-btn" style="padding: 8px 16px; margin-top: 8px; font-size: 13px;" onclick="joinClub(${club.id})">
                    ${tL('joinBtn')}
                </button>
            </div>
        </div>
    `).join('');
}

window.joinClub = function (id) {
    clubs = clubs.map(c => {
        if (c.id === id) {
            return { ...c, members: c.members + 1 };
        }
        return c;
    });
    saveClubs();
    renderClubs();
    alert(tL('clubSuccess'));
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

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.placeholder = tL(key);
    });

    document.title = (currentLang === 'hi' ? 'SAJHA - किसान क्लब' : 'SAJHA - Farmers Club');
}
