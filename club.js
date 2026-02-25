// SAJHA - Club Portal Logic
let clubs = [
    { id: 1, name: 'Progressive Farmers', village: 'Rampur', members: 12 },
    { id: 2, name: 'Agro Cooperative', village: 'Siwan', members: 8 },
    { id: 3, name: 'Local Combine Group', village: 'Khurja', members: 15 }
];
let currentLang = localStorage.getItem('sajhaLang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    loadClubs();
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
