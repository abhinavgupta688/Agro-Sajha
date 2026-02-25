// SAJHA - Simple, Villager-Friendly
let map;
let bookings = [];
let forumPosts = [
    { author: 'Ram Singh (Village A)', time: '2 hours ago', text: 'Does anyone know the best fertilizer for Mustard this month?' }
];
let coins = 450;
let currentLang = 'en';
let pumpStatus = false;

// Equipment on map
const equipmentData = [
    { lat: 19.0760, lng: 72.8777, type: 'tractor', name: 'Rajesh Kumar', price: 500 },
    { lat: 28.6139, lng: 77.2090, type: 'tractor', name: 'Mohan Singh', price: 550 },
    { lat: 12.9716, lng: 77.5946, type: 'harvester', name: 'Kumar Farms', price: 800 },
    { lat: 22.5726, lng: 88.3639, type: 'plough', name: 'Amit Patel', price: 300 },
    { lat: 18.5204, lng: 73.8567, type: 'irrigation', name: 'Green Fields', price: 400 },
    { lat: 26.8467, lng: 80.9462, type: 'cultivator', name: 'Suresh Yadav', price: 350 },
    { lat: 23.0225, lng: 72.5714, type: 'seedDrill', name: 'Patel Agri', price: 450 },
    { lat: 25.5941, lng: 85.1376, type: 'thresher', name: 'Grain Works', price: 600 },
    { lat: 17.3850, lng: 78.4867, type: 'sprayer', name: 'Crop Care', price: 250 },
];

const mandiRatesData = [
    { crop: 'Wheat (Gehu)', price: '₹2,275/qtl' },
    { crop: 'Rice (Dhan)', price: '₹2,183/qtl' },
    { crop: 'Mustard (Sarson)', price: '₹5,650/qtl' },
    { crop: 'Cotton (Kapas)', price: '₹6,620/qtl' },
    { crop: 'Sugarcane (Ganna)', price: '₹315/qtl' },
    { crop: 'Soybean', price: '₹4,600/qtl' },
    { crop: 'Potato (Aloo)', price: '₹1,200/qtl' },
    { crop: 'Onion (Pyaz)', price: '₹2,100/qtl' },
    { crop: 'Tomato (Tamatar)', price: '₹1,500/qtl' },
    { crop: 'Maize (Makka)', price: '₹2,090/qtl' },
];

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setMinDate();
    setDefaultTime();
    loadData();
    setupEvents();
    applyLang();
    randomizeWeather();
    renderForum();
    updateUI();
    updatePrice(); // Show correct initial price on load
    renderMandiRates();
});

function loadData() {
    try {
        const s = localStorage.getItem('sajhaBookings');
        if (s) bookings = JSON.parse(s);

        const c = localStorage.getItem('sajhaCoins');
        if (c) coins = parseInt(c);

        const f = localStorage.getItem('sajhaForum');
        if (f) forumPosts = JSON.parse(f);
    } catch (e) {
        console.error("Data error", e);
    }
}

function updateUI() {
    const coinEl = document.getElementById('statCoins');
    if (coinEl) coinEl.textContent = coins + ' SAJHA Coins';
}

function updateCoins(amount) {
    coins += amount;
    localStorage.setItem('sajhaCoins', coins);
    updateUI();
}

function randomizeWeather() {
    const weatherList = [
        { icon: 'fa-cloud-sun', msg: 'weatherAlert', rain: 'Clear skies. Good for harvest.' },
        { icon: 'fa-cloud-rain', msg: 'weatherAlert', rain: 'rainWarning' },
        { icon: 'fa-sun', msg: 'weatherAlert', rain: 'Hot day ahead. Stay hydrated.' }
    ];
    const w = weatherList[Math.floor(Math.random() * weatherList.length)];
    const widget = document.querySelector('.weather-widget');
    if (widget) {
        widget.querySelector('i').className = 'fas ' + w.icon;
        widget.querySelector('p').setAttribute('data-i18n', w.rain);
        applyLang();
    }
}

function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
    }).addTo(map);
    equipmentData.forEach(loc => {
        const m = L.marker([loc.lat, loc.lng]).addTo(map);
        m.bindPopup(`<b>${loc.name}</b><br>${loc.type} - ₹${loc.price}/hr`);
    });
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const inp = document.getElementById('bookingDate');
    if (inp) { inp.min = today; inp.value = today; }
}

function setDefaultTime() {
    const now = new Date();
    const t = document.getElementById('bookingTime');
    if (t) t.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

function setupEvents() {
    // Menu - Hamburger toggles top menu on desktop, side menu on mobile
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            document.getElementById('sideMenu')?.classList.toggle('open');
        } else {
            document.querySelector('.top-menu')?.classList.toggle('open');
        }
    });

    // Close side menu
    document.getElementById('closeMenu')?.addEventListener('click', () => {
        document.getElementById('sideMenu')?.classList.remove('open');
    });

    // GPS Locate Button
    document.getElementById('locateBtn')?.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Location services not supported on this device.');
            return;
        }
        const btn = document.getElementById('locateBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.setView([pos.coords.latitude, pos.coords.longitude], 12);
                btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            },
            () => {
                alert('Could not get your location. Please allow location access.');
                btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            }
        );
    });

    // My Bookings from Nav
    document.getElementById('menuBookingsTop')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.top-menu')?.classList.remove('open');
        document.getElementById('bookingsPanel').classList.add('active');
        renderBookings();
    });

    document.getElementById('menuBookings')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('sideMenu').classList.remove('open');
        document.getElementById('bookingsPanel').classList.add('active');
        renderBookings();
    });

    // Language
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('sajhaLang', currentLang);
            applyLang();
            renderForum(); // Update forum language if needed
        });
        const saved = localStorage.getItem('sajhaLang');
        if (saved) {
            currentLang = saved;
            langSelect.value = saved;
        }
    }

    // Equipment & Duration Toggles
    document.querySelectorAll('.equip-btn, .dur-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.classList.contains('equip-btn') ? '.equip-btn' : '.dur-btn';
            document.querySelectorAll(group).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updatePrice();
        });
    });

    document.getElementById('bookingDate')?.addEventListener('change', updatePrice);
    document.getElementById('bookingTime')?.addEventListener('change', updatePrice);

    // Book Flow
    document.getElementById('bookBtn')?.addEventListener('click', showModal);
    document.getElementById('confirmBtn')?.addEventListener('click', confirmBooking);

    document.getElementById('selectDealBtn')?.addEventListener('click', () => {
        const bestPrice = document.getElementById('bestOwnerPrice').dataset.price;
        const activeEquip = document.querySelector('.equip-btn.active');
        if (activeEquip) {
            activeEquip.dataset.customPrice = bestPrice;
            updatePrice();
        }
        document.getElementById('comparisonSection').style.display = 'none';
        updateCoins(10); // Reward for choosing local owner
    });

    // Success Screen
    document.getElementById('viewBooking')?.addEventListener('click', () => {
        document.getElementById('successScreen').classList.remove('active');
        document.getElementById('bookingsPanel').classList.add('active');
        renderBookings();
    });
    document.getElementById('newBooking')?.addEventListener('click', () => {
        document.getElementById('successScreen').classList.remove('active');
        resetForm();
    });

    // Panel & Modal Close
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.close)?.classList.remove('active');
        });
    });

    // Insurance
    document.getElementById('insuranceCheck')?.addEventListener('change', updatePrice);

    // Online Payment Mock
    document.getElementById('payOnlineBtn')?.addEventListener('click', () => {
        const btn = document.getElementById('payOnlineBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> UPI Secure...';
        btn.disabled = true;
        setTimeout(() => {
            alert('₹' + document.getElementById('modalTotal').textContent + ' Paid Successfully!');
            confirmBooking();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
    });

    // Voice Command
    document.getElementById('voiceBtn')?.addEventListener('click', () => {
        const voiceBtn = document.getElementById('voiceBtn');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert(currentLang === 'hi' ? "आपका ब्राउज़र वॉइस सपोर्ट नहीं करता।" : "Your browser does not support voice recognition. Please use Google Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = function () {
            voiceBtn.classList.add('listening');
        };

        recognition.onspeechend = function () {
            recognition.stop();
        };

        recognition.onresult = function (event) {
            voiceBtn.classList.remove('listening');
            const transcript = event.results[0][0].transcript.toLowerCase();
            handleVoiceCommand(transcript);
        };

        recognition.onerror = function (event) {
            voiceBtn.classList.remove('listening');
            console.error("Voice Error: ", event.error);
        };

        recognition.start();
    });

    // --- Newest Features Handlers ---

    // Crop Scan
    document.getElementById('scanCropBtn')?.addEventListener('click', () => {
        document.getElementById('scanModal').classList.add('active');
        document.getElementById('scanResultText').style.display = 'none';
        document.getElementById('startScanBtn').style.display = 'block';
    });

    // Mandi search filter
    document.getElementById('mandiSearch')?.addEventListener('input', (e) => {
        renderMandiRates(e.target.value);
    });

    document.getElementById('startScanBtn')?.addEventListener('click', () => {
        const btn = document.getElementById('startScanBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing leaf...';
        setTimeout(() => {
            document.getElementById('scanResultText').style.display = 'block';
            btn.style.display = 'none';
            updateCoins(20); // Reward for using technology
        }, 2000);
    });

    // Marketplace
    document.getElementById('sellCropBtn')?.addEventListener('click', () => {
        document.getElementById('marketplaceModal').classList.add('active');
        renderMarketplace();
    });

    // Irrigation
    document.getElementById('irrigateBtn')?.addEventListener('click', () => {
        document.getElementById('irrigationModal').classList.add('active');
        updateIrrigationModal();
    });

    document.getElementById('startWaterBtn')?.addEventListener('click', () => {
        const btn = document.getElementById('startWaterBtn');
        const status = pumpStatus;
        btn.innerHTML = status ? '<i class="fas fa-spinner fa-spin"></i> Stopping...' : '<i class="fas fa-spinner fa-spin"></i> Starting...';

        setTimeout(() => {
            pumpStatus = !pumpStatus;
            updateIrrigationModal();
            alert(pumpStatus ? "Motor Started!" : "Motor Stopped!");
        }, 1500);
    });

    // Community
    document.getElementById('askQuestionBtn')?.addEventListener('click', () => {
        const q = prompt("What is your question?");
        if (q) {
            forumPosts.unshift({ author: 'You (Mobile Admin)', time: 'Just now', text: q });
            localStorage.setItem('sajhaForum', JSON.stringify(forumPosts));
            renderForum();
            updateCoins(5);
        }
    });

    // Audio Guide
    document.querySelectorAll('.audio-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const parent = e.target.closest('.crop-advisory');
            const tips = parent.querySelector('p').textContent;
            speakText(tips);
        });
    });

    document.getElementById('referBtn')?.addEventListener('click', () => {
        const num = prompt("Enter farmer's mobile number to invite:");
        if (num) {
            alert("Invite sent to " + num + ". You will get 50 coins after their first booking!");
        }
    });
}

function speakText(text) {
    if (!window.speechSynthesis) return alert("Your phone does not support voice audio.");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
}

function updateIrrigationModal() {
    const btn = document.getElementById('startWaterBtn');
    if (!btn) return;
    if (pumpStatus) {
        btn.innerHTML = '<i class="fas fa-power-off"></i> Stop Water';
        btn.style.background = '#d32f2f';
    } else {
        btn.innerHTML = '<i class="fas fa-power-off"></i> Start Water';
        btn.style.background = '#0288d1';
    }
}

function renderForum() {
    const container = document.getElementById('chowpalPosts');
    if (!container) return;
    container.innerHTML = forumPosts.map(p => `
        <div class="simple-card" style="text-align: left; margin-bottom: 16px;">
            <div style="display:flex; gap:12px; margin-bottom: 8px;">
                <i class="fas fa-user-circle" style="font-size: 32px; color: #ccc;"></i>
                <div>
                    <strong>${p.author}</strong>
                    <div style="font-size: 12px; color: #666;">${p.time}</div>
                </div>
            </div>
            <p style="font-size:14px;">${p.text}</p>
        </div>
    `).join('');
}

function renderMarketplace() {
    const list = document.getElementById('buyersList');
    if (!list) return;
    const buyers = [
        { name: 'District Grain Co.', loc: 'Main Mandi', price: '₹2,250/qtl' },
        { name: 'Village Bulk Buyer', loc: 'Your Sub-district', price: '₹2,180/qtl' }
    ];
    list.innerHTML = buyers.map(b => `
        <div class="mandi-item" style="border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; padding: 12px;">
            <div>
                <strong>${b.name}</strong>
                <div style="font-size: 11px;">${b.loc}</div>
            </div>
            <div style="color: var(--green); font-weight: 700;">${b.price}</div>
        </div>
    `).join('');
}

function renderMandiRates(filterText = '') {
    const container = document.getElementById('mandiListContainer');
    if (!container) return;

    const lowerFilter = filterText.toLowerCase();
    const filteredRates = mandiRatesData.filter(item =>
        item.crop.toLowerCase().includes(lowerFilter)
    );

    if (filteredRates.length === 0) {
        container.innerHTML = '<div style="padding: 16px; text-align: center; color: #888;">No crops found.</div>';
        return;
    }

    container.innerHTML = filteredRates.map(item => `
        <div class="mandi-item"><span>${item.crop}</span> <span>${item.price}</span></div>
    `).join('');
}

function handleVoiceCommand(cmd) {
    if (!cmd) return;

    // Check keywords
    if (cmd.includes('tractor') || cmd.includes('ट्रैक्टर')) {
        document.querySelector('.equip-btn[data-type="tractor"]')?.click();
        document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "मैंने आपके लिए ट्रैक्टर चुन लिया है।" : "I have selected a Tractor for you.");
    } else if (cmd.includes('harvester') || cmd.includes('हार्वेस्टर')) {
        document.querySelector('.equip-btn[data-type="harvester"]')?.click();
        document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "मैंने आपके लिए हार्वेस्टर चुन लिया है।" : "I have selected a Harvester for you.");
    } else if (cmd.includes('mandi') || cmd.includes('मंडी') || cmd.includes('price') || cmd.includes('भाव') || cmd.includes('rate')) {
        document.querySelector('.mandi-section')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "यहाँ मंडी भाव हैं।" : "Here are the Mandi rates.");
    } else if (cmd.includes('irrigation') || cmd.includes('सिंचाई') || cmd.includes('pump') || cmd.includes('पंप') || cmd.includes('water')) {
        document.querySelector('.equip-btn[data-type="irrigation"]')?.click();
        document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "मैंने सिंचाई चुन लिया है।" : "I have selected Irrigation.");
    } else if (cmd.includes('home') || cmd.includes('घर')) {
        document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "होम पेज खोल रहा हूँ।" : "Opening Home.");
    } else {
        speakText(currentLang === 'hi' ? "मुझे समझ नहीं आया। ट्रैक्टर, हार्वेस्टर या मंडी बोलें।" : "I didn't catch that. Say Tractor, Harvester, or Mandi rates.");
    }
}

function tL(key) {
    return (lang[currentLang] && lang[currentLang][key]) || lang.en[key] || key;
}

function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = tL(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.setAttribute('placeholder', tL(key));
    });
}

function updatePrice() {
    const equip = document.querySelector('.equip-btn.active');
    const dur = document.querySelector('.dur-btn.active');
    if (!equip) return;

    const basePrice = parseInt(equip.dataset.price);
    const customPrice = equip.dataset.customPrice ? parseInt(equip.dataset.customPrice) : null;
    const finalPrice = customPrice !== null ? customPrice : basePrice;

    const hours = dur ? parseInt(dur.dataset.hours) : 4;
    let total = finalPrice * hours;

    const ins = document.getElementById('insuranceCheck');
    if (ins && ins.checked) total += 50;

    document.getElementById('totalPrice').textContent = '₹' + total.toLocaleString();
    checkCheaperDeals(equip.dataset.type, basePrice);
}

function checkCheaperDeals(type, basePrice) {
    const compSection = document.getElementById('comparisonSection');
    if (!compSection) return;
    try {
        const saved = localStorage.getItem('sajhaOwnerEquipment');
        let ownerEquip = saved ? JSON.parse(saved) : [];

        // Populate default demo data if no owner equipment exists
        if (ownerEquip.length === 0) {
            ownerEquip = [
                { name: 'Ramesh Patel', type: 'tractor', price: '400', timing: '06:00 - 18:00' },
                { name: 'Suresh Kumar', type: 'harvester', price: '1000', timing: '08:00 - 17:00' },
                { name: 'Amit Singh', type: 'cultivator', price: '300', timing: '05:00 - 19:00' },
                { name: 'Vijay Farm', type: 'sprayer', price: '200', timing: '07:00 - 20:00' },
                { name: 'Balvinder Seeders', type: 'seedDrill', price: '350', timing: '06:00 - 18:00' }
            ];
            // Save to local storage so it persists and shows up in owner portal too
            localStorage.setItem('sajhaOwnerEquipment', JSON.stringify(ownerEquip));
        }

        const deals = ownerEquip.filter(item => item.type === type && parseInt(item.price) < basePrice);

        if (deals.length > 0) {
            const bestDeal = deals.reduce((prev, curr) => (parseInt(prev.price) < parseInt(curr.price)) ? prev : curr);
            document.getElementById('bestOwnerName').textContent = bestDeal.name;
            document.getElementById('bestOwnerPrice').textContent = '₹' + bestDeal.price + '/hr';
            document.getElementById('bestOwnerPrice').dataset.price = bestDeal.price;
            document.getElementById('savingsAmount').textContent = 'Save ₹' + (basePrice - parseInt(bestDeal.price)) + ' per hour';
            compSection.style.display = 'block';
        } else {
            compSection.style.display = 'none';
        }
    } catch (e) { compSection.style.display = 'none'; }
}

function showModal() {
    const equip = document.querySelector('.equip-btn.active');
    const dur = document.querySelector('.dur-btn.active');
    const dateVal = document.getElementById('bookingDate').value;
    const timeVal = document.getElementById('bookingTime').value || '10:00';

    const equipName = equip ? (equip.querySelector('span')?.textContent || equip.dataset.type) : 'Tractor';
    const total = document.getElementById('totalPrice').textContent;
    const dateStr = dateVal ? new Date(dateVal).toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';

    document.getElementById('modalEquipment').textContent = equipName;
    document.getElementById('modalLocation').textContent = document.getElementById('locationInput').value || 'My Farm';
    document.getElementById('modalDateTime').textContent = dateStr + ', ' + timeVal;
    document.getElementById('modalTotal').textContent = total.replace('₹', '');

    document.getElementById('confirmBtn').textContent = tL('confirmBook');
    document.getElementById('bookingModal').classList.add('active');
}

function confirmBooking() {
    const id = 'SAJHA-' + new Date().getFullYear() + '-' + (Math.floor(Math.random() * 900) + 100);
    bookings.unshift({
        id,
        equipment: document.getElementById('modalEquipment').textContent,
        location: document.getElementById('modalLocation').textContent,
        dateTime: document.getElementById('modalDateTime').textContent,
        total: '₹' + document.getElementById('modalTotal').textContent,
        status: 'Confirmed'
    });
    localStorage.setItem('sajhaBookings', JSON.stringify(bookings));
    updateCoins(50); // Reward for booking

    document.getElementById('bookingModal').classList.remove('active');
    document.getElementById('bookingId').textContent = id;
    document.getElementById('successScreen').classList.add('active');
}

function renderBookings() {
    const list = document.getElementById('bookingsList');
    if (!list) return;
    if (bookings.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;padding:24px;">' + tL('noBookings') + '</p>';
        return;
    }
    list.innerHTML = bookings.map((b, index) => `
        <div class="booking-item">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h4>${b.equipment} - ${b.id}</h4>
                <span style="font-size:12px; padding:2px 8px; border-radius:12px; background:${b.status === 'Cancelled' ? '#ffebee' : '#e8f5e9'}; color:${b.status === 'Cancelled' ? '#c62828' : '#2e7d32'};">${b.status}</span>
            </div>
            <p><i class="fas fa-map-marker-alt"></i> ${b.location}</p>
            <p><i class="fas fa-calendar"></i> ${b.dateTime}</p>
            <p><strong>${b.total}</strong></p>
            <div style="margin-top:12px; display:flex; gap:8px;">
                ${b.status !== 'Cancelled' ? `
                    <button class="dur-btn" onclick="trackBooking('${b.id}')" style="padding:4px 12px; font-size:13px; height:32px; min-height:32px; background: #e3f2fd; border-color: #2196f3; color: #1976d2;">
                        <i class="fas fa-route"></i> ${tL('trackBooking')}
                    </button>
                    <button class="dur-btn" onclick="rateBooking(${index})" style="padding:4px 12px; font-size:13px; height:32px; min-height:32px;">
                        <i class="fas fa-star"></i> ${tL('rateService')}
                    </button>
                    <button class="dur-btn" onclick="cancelBooking(${index})" style="padding:4px 12px; font-size:13px; height:32px; min-height:32px; border-color:#ffcdd2; color:#c62828;">
                        Cancel
                    </button>
                ` : `<p style="color:#c62828; font-size:12px; margin:0;">${tL('refundInfo')}</p>`}
            </div>
        </div>
    `).join('');
}

window.trackBooking = function (id) {
    document.getElementById('trackIdDisplay').textContent = id;
    document.getElementById('trackingModal').classList.add('active');

    // Simulate progress
    let mins = 15;
    let progress = 0;
    const progressEl = document.getElementById('trackProgress');
    const iconEl = document.getElementById('tractorIcon');
    const etaEl = document.getElementById('etaMinutes');
    const statusEl = document.getElementById('trackStatus');

    // Reset
    progressEl.style.width = '0%';
    iconEl.style.left = '0%';
    etaEl.textContent = mins;
    statusEl.setAttribute('data-i18n', 'onTheWay');
    applyLang();

    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
            statusEl.setAttribute('data-i18n', 'driverArrived');
            applyLang();
            return;
        }
        progress += 10;
        mins = Math.max(0, mins - 1);

        progressEl.style.width = progress + '%';
        iconEl.style.left = progress + '%';
        etaEl.textContent = mins;
    }, 2000);

    // Call Driver Simulation
    document.getElementById('callDriverBtn').onclick = () => {
        alert("Calling Driver for booking " + id + "...");
        window.location.href = "tel:+919876543210";
    };
};

window.rateBooking = function (index) {
    const rating = prompt("Rate out of 5 stars (1-5):", "5");
    if (rating) {
        alert("Thank you! You earned 10 SAJHA coins for feedback.");
        updateCoins(10);
    }
};

window.cancelBooking = function (index) {
    if (confirm("Are you sure you want to cancel? Full refund will be initiated.")) {
        bookings[index].status = 'Cancelled';
        localStorage.setItem('sajhaBookings', JSON.stringify(bookings));
        renderBookings();
    }
};

function resetForm() {
    document.getElementById('locationInput').value = '';
    setMinDate();
    setDefaultTime();
    document.querySelectorAll('.equip-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.equip-btn[data-type="tractor"]')?.classList.add('active');
    document.getElementById('comparisonSection').style.display = 'none';
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.dur-btn[data-hours="4"]')?.classList.add('active');
    updatePrice();
}

