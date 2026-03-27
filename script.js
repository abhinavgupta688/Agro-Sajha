// SAJHA - Simple, Villager-Friendly
let map;
let bookings = [];
let forumPosts = [
    { author: 'Ram Singh (Village A)', time: '2 hours ago', text: 'Does anyone know the best fertilizer for Mustard this month?' }
];
let coins = 450;
let currentLang = 'en';
let pumpStatus = false;
let ledgerHistory = [];
let exchangeItems = [
    { farmer: 'Suresh P.', item: 'Mustard Seeds (5kg)', type: 'seed', contact: '98765 00001' },
    { farmer: 'Vikram Singh', item: 'Electric Sprayer', type: 'tool', contact: '98765 00002' }
];

// Equipment on map
const equipmentData = [
    { lat: 19.07, lng: 72.87, type: 'tractor', name: 'Rajesh Kumar', price: 500, verified: true },
    { lat: 28.61, lng: 77.20, type: 'tractor', name: 'Mohan Singh', price: 550, verified: true },
    { lat: 12.97, lng: 77.59, type: 'harvester', name: 'Kumar Farms', price: 800, verified: true },
    { lat: 22.57, lng: 88.36, type: 'plough', name: 'Amit Patel', price: 300, verified: false },
    { lat: 18.52, lng: 73.85, type: 'irrigation', name: 'Green Fields', price: 400, verified: true },
    { lat: 26.84, lng: 80.94, type: 'cultivator', name: 'Suresh Yadav', price: 350, verified: false },
    { lat: 23.02, lng: 72.57, type: 'seedDrill', name: 'Patel Agri', price: 450, verified: true },
    { lat: 25.59, lng: 85.13, type: 'thresher', name: 'Grain Works', price: 600, verified: true },
    { lat: 17.38, lng: 78.48, type: 'sprayer', name: 'Crop Care', price: 250, verified: false },
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
    fetchWeather();
    renderForum();
    updateUI();
    updatePrice();
    renderMandiRates();
    updateAuthUI();
    setupPWAInstall();
    renderMandiStateFilter();
});

function loadData() {
    try {
        const s = localStorage.getItem('sajhaBookings');
        if (s) bookings = JSON.parse(s);

        const c = localStorage.getItem('sajhaCoins');
        if (c) coins = parseInt(c);

        const f = localStorage.getItem('sajhaForum');
        if (f) forumPosts = JSON.parse(f);

        const l = localStorage.getItem('sajhaLedger');
        if (l) farmLedger = JSON.parse(l);

        const h = localStorage.getItem('sajhaLedgerHistory');
        if (h) ledgerHistory = JSON.parse(h);
    } catch (e) {
        console.error("Data error", e);
    }
}

let farmLedger = { income: 12400, expenses: 5800 };

function updateUI() {
    const coinEl = document.getElementById('statCoins');
    if (coinEl) coinEl.textContent = coins + ' SAJHA Coins';

    const incomeEl = document.getElementById('statIncome');
    if (incomeEl) incomeEl.textContent = '₹' + farmLedger.income.toLocaleString();

    const savingsEl = document.getElementById('statSavings');
    if (savingsEl) {
        const savings = farmLedger.income - farmLedger.expenses;
        savingsEl.textContent = '₹' + (savings > 0 ? savings : 0).toLocaleString();
    }
}

function updateLedger(type, amount, note = "") {
    if (type === 'income') farmLedger.income += amount;
    else farmLedger.expenses += amount;

    ledgerHistory.unshift({ type, amount, note, time: new Date().toLocaleTimeString() });
    
    localStorage.setItem('sajhaLedger', JSON.stringify(farmLedger));
    localStorage.setItem('sajhaLedgerHistory', JSON.stringify(ledgerHistory));
    updateUI();
}

function updateCoins(amount) {
    coins += amount;
    localStorage.setItem('sajhaCoins', coins);
    updateUI();
}

let currentWeather = { icon: 'fa-sun', msg: 'Clear', rain: false };

// WMO weather code to icon/text mapping
function wmoToWeather(code) {
    if (code === 0) return { icon: 'fa-sun', msg: 'Clear Sky', rain: false, advice: 'Good for harvest and pesticide spray. Ideal field day!' };
    if (code <= 3) return { icon: 'fa-cloud-sun', msg: 'Partly Cloudy', rain: false, advice: 'Good conditions for sowing and general farm work.' };
    if (code <= 49) return { icon: 'fa-smog', msg: 'Foggy/Hazy', rain: false, advice: 'Foggy morning. Delay chemical spray until visibility improves.' };
    if (code <= 67) return { icon: 'fa-cloud-rain', msg: 'Rain Expected', rain: true, advice: 'Rain expected. Postpone fertilization to avoid runoff. Cover stored crops.' };
    if (code <= 77) return { icon: 'fa-snowflake', msg: 'Snow/Sleet', rain: true, advice: 'Cold weather. Protect sensitive crops with mulch.' };
    if (code <= 82) return { icon: 'fa-cloud-showers-heavy', msg: 'Heavy Showers', rain: true, advice: 'Heavy rain. Stay indoors. Check drainage channels in fields.' };
    return { icon: 'fa-bolt', msg: 'Thunderstorm', rain: true, advice: 'Thunderstorm warning. Do NOT operate equipment outdoors.' };
}

async function fetchWeather() {
    const weatherList = [
        { icon: 'fa-cloud-sun', msg: 'Partly Cloudy', rain: false, advice: 'Good for harvest and pesticide spray.' },
        { icon: 'fa-cloud-rain', msg: 'Rain Predicted', rain: true, advice: 'Postpone fertilization. Cover harvested crops.' },
        { icon: 'fa-sun', msg: 'Sunny & Hot', rain: false, advice: 'Increase irrigation for vegetable crops. Check moisture levels.' },
        { icon: 'fa-wind', msg: 'Windy', rain: false, advice: 'Strong winds. Avoid foliar spray today.' }
    ];
    const fallback = weatherList[Math.floor(Math.random() * weatherList.length)];

    function applyWeatherData(w, source) {
        currentWeather = w;
        const widget = document.querySelector('.weather-widget');
        if (widget) {
            widget.querySelector('i').className = 'fas ' + w.icon;
            widget.querySelector('h4').textContent = (source === 'live' ? '🌐 Live Weather' : '⚡ Weather Alert');
            widget.querySelector('p').textContent = w.advice;
        }
        const advisoryTips = document.querySelector('.crop-advisory p');
        if (advisoryTips) {
            const month = new Date().toLocaleDateString('en-IN', {month: 'long'});
            advisoryTips.innerHTML = `<strong>${month} Advisory:</strong> ${w.advice}`;
        }
        // Update 4-day forecast cards if weather data has them
        applyLang();
    }

    if (!navigator.geolocation) {
        applyWeatherData(fallback, 'random');
        return;
    }

    // Try to get GPS position, then fetch real weather
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude: lat, longitude: lng } = pos.coords;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&daily=weathercode,temperature_2m_max,precipitation_sum&timezone=auto&forecast_days=4`;
            const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!resp.ok) throw new Error('fetch failed');
            const data = await resp.json();
            const code = data.current.weathercode;
            const temp = Math.round(data.current.temperature_2m);
            const humidity = data.current.relativehumidity_2m;
            const w = wmoToWeather(code);
            w.advice = `${w.advice} Temp: ${temp}°C | Humidity: ${humidity}%`;

            applyWeatherData(w, 'live');

            // Update 4-day forecast cards
            const cards = document.querySelectorAll('#weatherCards > div');
            const days = ['Today', 'Tmrw', 'Day 3', 'Day 4'];
            if (data.daily && cards.length >= 4) {
                data.daily.weathercode.slice(0,4).forEach((dc, i) => {
                    const dw = wmoToWeather(dc);
                    const maxT = Math.round(data.daily.temperature_2m_max[i]);
                    if (cards[i]) {
                        cards[i].querySelector('div')?.textContent !== undefined && (cards[i].children[0].textContent = days[i]);
                        cards[i].querySelector('i').className = `fas ${dw.icon}`;
                        cards[i].querySelector('div:last-child').textContent = `${maxT}°C`;
                    }
                });
            }
        } catch (err) {
            console.warn('Weather API failed, using fallback.', err);
            applyWeatherData(fallback, 'random');
        }
    }, () => applyWeatherData(fallback, 'random'), { timeout: 4000 });
}

function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
    }).addTo(map);

    // Auto-locate user on load
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            map.setView([lat, lng], 13);
            L.marker([lat, lng], {icon: L.divIcon({className: 'user-loc-icon', html: '<i class="fas fa-circle" style="color:#0288d1; border: 2px solid white; border-radius: 50%;"></i>'})}).addTo(map).bindPopup("<b>You are here</b>");
        }, () => {
            console.log("Location access denied or unavailable.");
        });
    }

    // Click on map to set location
    let userMarker;
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
        userMarker.bindPopup("<b>Selected Location</b>").openPopup();

        // Update location input with mock address
        const locInput = document.getElementById('locationInput');
        if (locInput) {
            locInput.value = `Farm at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            locInput.classList.add('highlight-flash'); // Visual feedback
            setTimeout(() => locInput.classList.remove('highlight-flash'), 1000);
        }
    });

    equipmentData.forEach(loc => {
        const m = L.marker([loc.lat, loc.lng]).addTo(map);
        m.on('click', () => {
             // Auto-select this equipment type and owner in the panel
             document.querySelector(`.equip-btn[data-type="${loc.type}"]`)?.click();
             const locInput = document.getElementById('locationInput');
             if (locInput) locInput.value = `Near ${loc.name}'s Service Area`;
        });
        const vTag = loc.verified ? `<div class="verified-badge"><i class="fas fa-check-circle"></i> Verified</div>` : '';
        m.bindPopup(`<b>${loc.name} ${vTag}</b><br>${tL(loc.type)} - ₹${loc.price}/hr<br><small>Click marker to select</small>`);
    });

    // Fix for map rendering in dynamic layouts
    setTimeout(() => {
        map.invalidateSize();
    }, 500);
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
            showToast('⚠️ Location services not supported on this device.', 'warning');
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
                showToast('⚠️ Could not get your location. Please allow location access.', 'warning');
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
    document.getElementById('bookBtn')?.addEventListener('click', () => {
        if (!checkAuth()) return;
        showModal();
    });
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
            showToast('✅ ₹' + document.getElementById('modalTotal').textContent + ' paid via UPI! Booking confirmed.', 'success');
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
            showToast(currentLang === 'hi' ? '⚠️ आपका ब्राउज़र वॉइस सपोर्ट नहीं करता।' : '⚠️ Voice recognition not supported. Please use Google Chrome.', 'warning');
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

    // Mandi search filter — also respects state filter
    document.getElementById('mandiSearch')?.addEventListener('input', (e) => {
        const state = document.getElementById('mandiStateFilter')?.value || '';
        renderMandiRatesFiltered(e.target.value, state);
    });

    document.getElementById('startScanBtn')?.addEventListener('click', () => {
        const btn = document.getElementById('startScanBtn');
        const overlay = document.getElementById('scanOverlay');
        const progress = document.getElementById('scanProgress');
        const stepText = document.getElementById('scanStepText');
        const resText = document.getElementById('scanResultText');

        if (!overlay) return;

        overlay.style.display = 'flex';
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            if (progress) progress.style.width = p + '%';
            
            if (p < 30) if (stepText) stepText.textContent = "Uploading image to SAJHA Cloud...";
            else if (p < 60) if (stepText) stepText.textContent = "AI is identifying crop species...";
            else if (p < 90) if (stepText) stepText.textContent = "Scanning for 150+ known pests & diseases...";
            else if (p >= 100) {
                clearInterval(interval);
                overlay.style.display = 'none';
                
                const results = [
                    { disease: "Leaf Rust (Puccinia)", treatment: "Spray Propiconazole 25% EC. Maintain distance between plants." },
                    { disease: "Early Blight (Alternaria)", treatment: "Remove infected leaves. Apply Mancozeb or Copper oxychloride." },
                    { disease: "Healthy Leaf", treatment: "No disease detected. Keep up the good work!" },
                    { disease: "Aphid Infestation", treatment: "Use Neem oil spray or Yellow sticky traps." }
                ];

                const r = results[Math.floor(Math.random() * results.length)];
                if (resText) {
                    resText.innerHTML = `<strong>${tL('scanResult')}:</strong> ${r.disease}<br><small style="color:#555"><strong>Treatment:</strong> ${r.treatment}</small>`;
                    resText.style.display = 'block';
                }
                if (btn) btn.style.display = 'none';
                updateCoins(20);
                speakText(currentLang === 'hi' ? `जाँच पूरी हुई: ${r.disease}` : `Diagnosis complete: ${r.disease}`);
            }
        }, 50);
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

    // Soil Health
    document.getElementById('soilBtn')?.addEventListener('click', () => {
        document.getElementById('soilModal').classList.add('active');
        document.getElementById('soilResult').style.display = 'none';
    });

    // Crop Preview Handler
    document.getElementById('cropFile')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('cropPreview');
                if (preview) {
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                    document.getElementById('scanPlaceholder').style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('analyzeSoilBtn')?.addEventListener('click', () => {
        const overlay = document.getElementById('scanOverlay');
        const stepText = document.getElementById('scanStepText');
        const res = document.getElementById('soilResult');
        const advice = document.getElementById('soilAdviceText');

        if (!overlay) return;
        overlay.style.display = 'flex';
        if (stepText) stepText.textContent = "Calculating Soil Nutrient Balance (NPK)...";

        setTimeout(() => {
            overlay.style.display = 'none';
            const n = parseInt(document.getElementById('soilN').value) || 0;
            const p = parseInt(document.getElementById('soilP').value) || 0;
            const k = parseInt(document.getElementById('soilK').value) || 0;

            let recommendations = [];
            
            if (n < 50) recommendations.push("Add 50kg/acre of Urea for Nitrogen boost.");
            else if (n > 120) recommendations.push("Nitrogen is high. Avoid Urea; use organic mulch.");

            if (p < 20) recommendations.push("Add 25kg/acre of DAP for Phosphorus.");
            else if (p > 60) recommendations.push("Phosphorus is sufficient. No extra DAP needed.");

            if (k < 100) recommendations.push("Add 30kg/acre of MOP for Potassium.");

            if (recommendations.length === 0) {
                advice.textContent = "Your soil nutrients (N-P-K) are balanced. Maintain with organic compost.";
            } else {
                advice.innerHTML = "<strong>Our Recommendations:</strong><ul style='text-align:left; padding-left:20px; margin-top:10px;'>" + 
                                   recommendations.map(r => `<li>${r}</li>`).join('') + "</ul>";
            }

            if (res) res.style.display = 'block';
            updateCoins(15);
            speakText(currentLang === 'hi' ? "मिट्टी की जाँच पूरी हुई" : "Soil analysis complete.");
        }, 2000);
    });

    document.getElementById('startWaterBtn')?.addEventListener('click', () => {
        const btn = document.getElementById('startWaterBtn');
        const status = pumpStatus;
        btn.innerHTML = status ? '<i class="fas fa-spinner fa-spin"></i> Stopping...' : '<i class="fas fa-spinner fa-spin"></i> Starting...';

        setTimeout(() => {
            pumpStatus = !pumpStatus;
            updateIrrigationModal();
            showToast(pumpStatus ? '💧 Motor Started! Irrigation active.' : '⏹️ Motor Stopped!', pumpStatus ? 'success' : 'info');
        }, 1500);
    });

    // Community
    document.getElementById('chowpalAskBtn')?.addEventListener('click', () => {
        document.getElementById('chowpalModal').classList.add('active');
        document.getElementById('chowpalInput').value = '';
        const btnText = document.getElementById('imgBtnText');
        if (btnText) btnText.textContent = 'Add Photo (Optional)';
        const camIcon = document.getElementById('imgCamIcon');
        if (camIcon) camIcon.style.color = '#666';
    });

    document.getElementById('chowpalImage')?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const btnText = document.getElementById('imgBtnText');
            if (btnText) btnText.textContent = 'Photo attached ✓';
            const camIcon = document.getElementById('imgCamIcon');
            if (camIcon) camIcon.style.color = 'var(--green)';
        }
    });

    document.getElementById('submitPostBtn')?.addEventListener('click', () => {
        const q = document.getElementById('chowpalInput').value;
        const imgInput = document.getElementById('chowpalImage');
        if (q.trim()) {
            let postText = q;
            if (imgInput.files.length > 0) {
                postText += '<br><strong style="color:var(--green); font-size: 12px; margin-top: 5px; display: inline-block;"><i class="fas fa-image"></i> Image attached</strong>';
            }
            forumPosts.unshift({ author: 'You', time: 'Just now', text: postText });
            localStorage.setItem('sajhaForum', JSON.stringify(forumPosts));
            renderForum();
            updateCoins(5);
            document.getElementById('chowpalModal').classList.remove('active');
        } else {
            showToast('⚠️ Please enter a question before posting!', 'warning');
        }
    });

    // Profit Calculator
    document.getElementById('openCalcBtn')?.addEventListener('click', () => {
        document.getElementById('profitModal').classList.add('active');
        document.getElementById('calcResult').style.display = 'none';
        document.getElementById('calcAcres').value = '';
    });

    document.getElementById('calcProfitBtn')?.addEventListener('click', () => {
        const acresInput = document.getElementById('calcAcres');
        const acres = parseFloat(acresInput.value);
        if (!acres || acres <= 0 || acres > 10000) {
            acresInput.style.borderColor = '#d32f2f';
            acresInput.style.boxShadow = '0 0 0 2px rgba(211,47,47,0.15)';
            showToast('⚠️ Please enter valid land size (e.g. 2.5 acres)', 'warning');
            setTimeout(() => { acresInput.style.borderColor = ''; acresInput.style.boxShadow = ''; }, 2000);
            return;
        }
        acresInput.style.borderColor = '';
        acresInput.style.boxShadow = '';

        const revPerAcre = parseInt(document.getElementById('calcCrop').value);
        // Average costs: seed + fertilizer + rent + labor = ₹16,000 per acre
        const totalRev = revPerAcre * acres;
        const totalCost = 16000 * acres;
        const profit = totalRev - totalCost;

        document.getElementById('calcResult').style.display = 'block';
        const profitEl = document.getElementById('calcProfitValue');
        profitEl.textContent = '₹' + profit.toLocaleString();
        profitEl.style.color = profit >= 0 ? '#2e7d32' : '#d32f2f';
        if (profit < 0) showToast('⚠️ Costs exceed revenue at current scale. Consider reducing inputs.', 'warning');
        else showToast('✅ Calculation complete! Check your estimated profit.', 'success');
    });

    // Govt Subsidy Assistant
    document.getElementById('subsidyAssistBtn')?.addEventListener('click', () => {
        document.getElementById('subsidyModal').classList.add('active');
        document.getElementById('subsidyStep1').style.display = 'block';
        document.getElementById('subsidyStep2').style.display = 'none';
        document.getElementById('subsidyResult').style.display = 'none';
    });

    window.triggerSubsidyAnalysis = (isSmall) => {
        const overlay = document.getElementById('scanOverlay');
        const stepText = document.getElementById('scanStepText');
        
        document.getElementById('subsidyStep1').style.display = 'none';
        
        if (overlay) {
            overlay.style.display = 'flex';
            if (stepText) stepText.textContent = "AI is scanning 80+ govt schemes for your profile...";
        }

        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            const res = document.getElementById('subsidyResult');
            res.style.display = 'block';

            if (isSmall) {
                res.innerHTML = `
                    <div class="scheme-card" style="border: 2px solid var(--green); background: #f1f8e9;">
                        <div class="deal-tag" style="background: var(--green); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; font-weight: bold;">
                            <i class="fas fa-check-circle"></i> 100% Match: PM-KISAN
                        </div>
                        <h4 style="margin-bottom: 8px;">Small Farmer Benefit</h4>
                        <p style="font-size: 14px;">You qualify for ₹6,000/year assistance and 55% subsidy on irrigation equipment.</p>
                        <button class="orange-btn" style="background:var(--green); border-radius:8px; margin-top:10px;">Apply Now</button>
                    </div>`;
            } else {
                res.innerHTML = `
                    <div class="scheme-card" style="border: 2px solid #1565c0; background: #e3f2fd;">
                        <div class="deal-tag" style="background: #1565c0; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; font-weight: bold;">
                            <i class="fas fa-info-circle"></i> Match: PM Fasal Bima
                        </div>
                        <h4 style="margin-bottom: 8px;">Crop Insurance</h4>
                        <p style="font-size: 14px;">Protect your large-scale harvest against weather risks. Subsidy on premium is available.</p>
                        <button class="orange-btn" style="background:#1565c0; border-radius:8px; margin-top:10px;">View Details</button>
                    </div>`;
            }
            updateCoins(25);
            applyLang();
        }, 2500);
    };

    document.getElementById('subsidyYes')?.addEventListener('click', () => {
        const step1 = document.getElementById('subsidyStep1');
        if (step1) {
            step1.innerHTML = `
                <p style="font-size: 16px; font-weight: 600; margin-bottom: 16px; text-align: center;">Question 2: Are you looking for irrigation subsidy or direct cash benefit?</p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="big-btn primary full" onclick="triggerSubsidyAnalysis(true)" style="background: #1565c0; color: white;">Irrigation (55% Off)</button>
                    <button class="big-btn secondary full" onclick="triggerSubsidyAnalysis(true)">Cash Benefit (₹2000/inst)</button>
                </div>
            `;
        }
    });

    document.getElementById('subsidyNo')?.addEventListener('click', () => triggerSubsidyAnalysis(false));

    // E-Chaupal
    document.getElementById('joinLiveBtn')?.addEventListener('click', () => {
        const overlay = document.getElementById('scanOverlay');
        const stepText = document.getElementById('scanStepText');
        
        if (overlay) {
            overlay.style.display = 'flex';
            if (stepText) stepText.textContent = "Connecting to SAJHA Expert Secure Line...";
        }

        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            document.getElementById('videoModal').classList.add('active');
            speakText(currentLang === 'hi' ? "ई-चौपाल में आपका स्वागत है" : "Welcome to E-Chaupal live session.");
        }, 3000);
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
        // Show a nice inline invite panel instead of a prompt
        const existing = document.getElementById('invitePanel');
        if (existing) { existing.remove(); return; }
        const panel = document.createElement('div');
        panel.id = 'invitePanel';
        panel.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:white;border-radius:16px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:5000;width:320px;max-width:90vw;border-top:4px solid #7b1fa2;';
        panel.innerHTML = `
            <h3 style="margin-bottom:12px;color:#7b1fa2;"><i class="fas fa-user-plus"></i> Invite a Farmer</h3>
            <p style="font-size:13px;color:#666;margin-bottom:12px;">Enter their mobile number. You earn 50 coins after their first booking!</p>
            <div style="display:flex;gap:8px;">
                <input type="tel" id="inviteNumInput" placeholder="10-digit mobile number" maxlength="10"
                    style="flex:1;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;font-family:inherit;">
                <button onclick="submitInvite()" style="background:#7b1fa2;color:white;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:600;">Send</button>
            </div>
            <button onclick="document.getElementById('invitePanel')?.remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;">&times;</button>
        `;
        document.body.appendChild(panel);
    });

    window.submitInvite = function() {
        const input = document.getElementById('inviteNumInput');
        const num = input ? input.value.trim() : '';
        if (!/^[6-9]\d{9}$/.test(num)) {
            input.style.borderColor = '#d32f2f';
            showToast('⚠️ Enter a valid 10-digit Indian mobile number', 'warning');
            return;
        }
        document.getElementById('invitePanel')?.remove();
        showToast(`✅ Invite sent to +91 ${num}! You'll earn 50 coins after their first booking.`, 'success');
        updateCoins(5); // Bonus for initiating invite
    };
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
        <div class="mandi-item" style="display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
            <div>
                <span style="display: block; font-weight: 500;">${item.crop}</span> 
                <span style="color: var(--green); font-size: 14px; font-weight: bold;">${item.price}</span>
            </div>
            <button class="notification-bell" onclick="setPriceAlert('${item.crop.replace(/'/g, "\\'")}', '${item.price}')" style="background: rgba(255, 179, 0, 0.1); border: none; color: #ffb300; font-size: 18px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: 0.2s;" title="Set Price Alert"><i class="fas fa-bell"></i></button>
        </div>
    `).join('');
}

function renderMandiRatesFiltered(filterText = '', state = '') {
    const container = document.getElementById('mandiListContainer');
    if (!container) return;

    const allRates = mandiRatesByState.all || mandiRatesData.map(r => ({...r, state: 'All'}));
    const lowerFilter = filterText.toLowerCase();
    const filteredRates = allRates.filter(item => {
        const matchText = item.crop.toLowerCase().includes(lowerFilter);
        const matchState = !state || item.state === state;
        return matchText && matchState;
    });

    if (filteredRates.length === 0) {
        container.innerHTML = '<div style="padding: 16px; text-align: center; color: #888;"><i class="fas fa-search"></i> No crops found for the selected filters.</div>';
        return;
    }

    container.innerHTML = filteredRates.map(item => `
        <div class="mandi-item" style="display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); padding: 12px; border-radius: 8px; margin-bottom: 8px; animation: toastIn 0.2s ease;">
            <div>
                <span style="display: block; font-weight: 500;">${item.crop}</span>
                <span style="color: var(--green); font-size: 14px; font-weight: bold;">${item.price}</span>
                ${item.state ? `<span style="font-size:11px;background:#e8f5e9;color:var(--green);padding:2px 6px;border-radius:8px;font-weight:600;">${item.state}</span>` : ''}
            </div>
            <button class="notification-bell" onclick="setPriceAlert('${item.crop.replace(/'/g, "\\'")}', '${item.price}')" style="background: rgba(255, 179, 0, 0.1); border: none; color: #ffb300; font-size: 18px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: 0.2s;" title="Set Price Alert"><i class="fas fa-bell"></i></button>
        </div>
    `).join('');
}

window.switchCommunityTab = function(tab) {
    const postsBtn = document.querySelectorAll('.tab-btn')[0];
    const exchangeBtn = document.querySelectorAll('.tab-btn')[1];
    const postsDiv = document.getElementById('chowpalPosts');
    const exchangeDiv = document.getElementById('exchangeItems');
    const askBtn = document.getElementById('chowpalAskBtn');

    if (tab === 'posts') {
        postsBtn.style.background = 'var(--green)';
        postsBtn.style.color = 'white';
        exchangeBtn.style.background = '#f5f5f5';
        exchangeBtn.style.color = 'var(--text)';
        postsDiv.style.display = 'block';
        exchangeDiv.style.display = 'none';
        askBtn.style.display = 'block';
    } else {
        exchangeBtn.style.background = 'var(--green)';
        exchangeBtn.style.color = 'white';
        postsBtn.style.background = '#f5f5f5';
        postsBtn.style.color = 'var(--text)';
        postsDiv.style.display = 'none';
        exchangeDiv.style.display = 'block';
        askBtn.style.display = 'none';
        renderExchange();
    }
}

function renderExchange() {
    const container = document.getElementById('exchangeList');
    if (!container) return;
    container.innerHTML = exchangeItems.map(item => `
        <div class="simple-card" style="text-align: left; margin-bottom: 12px; border-left: 4px solid var(--green);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${item.item}</strong>
                <span style="font-size:10px; background:#e8f5e9; color:var(--green); padding:2px 6px; border-radius:10px; font-weight:bold;">${item.type.toUpperCase()}</span>
            </div>
            <div style="font-size:13px; color:#666; margin:5px 0;">Shared by: ${item.farmer}</div>
            <button class="big-btn secondary" onclick="alert('Contacting ${item.farmer} at ${item.contact}...')" style="padding:5px 10px; font-size:12px; height:auto; width:auto; border-radius:6px;">Contact Farmer</button>
        </div>
    `).join('');
}

window.setPriceAlert = function (cropName, currentPrice) {
    // Replace confirm() with a toast confirmation
    showToast(`🔔 Alert set for ${cropName}! You'll be notified if price changes from ${currentPrice}.`, 'success');
    // Simulate push notification 5 seconds later
    setTimeout(() => {
        const notif = document.getElementById('pushNotification');
        const msg = document.getElementById('pushMsg');
        if (notif && msg) {
            msg.textContent = `🔔 PRICE SURGE! ${cropName} has spiked in your local mandi. Check now!`;
            notif.style.top = '20px';
            speakText(currentLang === 'hi' ? "मंडी भाव का अलर्ट आया है" : "You have a new Mandi price alert!");
            setTimeout(() => { notif.style.top = '-150px'; }, 7000);
        }
    }, 5000);
}

// Auth UI Helper
function updateAuthUI() {
    const userRole = localStorage.getItem('sajhaUser');
    const loginBtn = document.getElementById('loginNavBtn');
    
    if (userRole) {
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${userRole})`;
            loginBtn.onclick = () => {
                localStorage.removeItem('sajhaUser');
                location.reload();
            };
        }
    } else {
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Login`;
            loginBtn.onclick = () => location.href = 'login.html';
        }
    }
}

// PWA Install Prompt
function setupPWAInstall() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.style.display = 'flex';
            document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
                banner.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') showToast('🎉 SAJHA installed! Find it on your home screen.', 'success');
                deferredPrompt = null;
            });
            document.getElementById('pwaDismissBtn')?.addEventListener('click', () => {
                banner.style.display = 'none';
                localStorage.setItem('sajhaPWADismissed', '1');
            });
        }
    });
    // Don't show if already dismissed
    if (localStorage.getItem('sajhaPWADismissed')) {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) banner.style.display = 'none';
    }
}

// Auth Helper
function checkAuth() {
    const user = localStorage.getItem('sajhaUser');
    if (!user || user !== 'farmer') {
        showToast('🔒 Please login as a Farmer to book equipment.', 'warning');
        setTimeout(() => location.href = 'login.html', 1500);
        return false;
    }
    return true;
}

// Mandi State Filter
const mandiRatesByState = {
    all: [
        { crop: 'Wheat (Gehu)', price: '₹2,275/qtl', state: 'UP' },
        { crop: 'Rice (Dhan)', price: '₹2,183/qtl', state: 'Punjab' },
        { crop: 'Mustard (Sarson)', price: '₹5,650/qtl', state: 'Rajasthan' },
        { crop: 'Cotton (Kapas)', price: '₹6,620/qtl', state: 'Gujarat' },
        { crop: 'Sugarcane (Ganna)', price: '₹315/qtl', state: 'UP' },
        { crop: 'Soybean', price: '₹4,600/qtl', state: 'MP' },
        { crop: 'Potato (Aloo)', price: '₹1,200/qtl', state: 'UP' },
        { crop: 'Onion (Pyaz)', price: '₹2,100/qtl', state: 'Maharashtra' },
        { crop: 'Tomato (Tamatar)', price: '₹1,500/qtl', state: 'Karnataka' },
        { crop: 'Maize (Makka)', price: '₹2,090/qtl', state: 'Bihar' },
        { crop: 'Groundnut', price: '₹5,440/qtl', state: 'Gujarat' },
        { crop: 'Chana (Chickpea)', price: '₹5,230/qtl', state: 'Rajasthan' },
        { crop: 'Arhar (Toor Dal)', price: '₹7,000/qtl', state: 'Maharashtra' },
        { crop: 'Bajra (Pearl Millet)', price: '₹2,350/qtl', state: 'Haryana' },
        { crop: 'Jowar (Sorghum)', price: '₹2,970/qtl', state: 'Maharashtra' },
    ]
};

function renderMandiStateFilter() {
    const section = document.querySelector('.mandi-section');
    if (!section) return;
    
    // Add state filter dropdown if not already present
    if (document.getElementById('mandiStateFilter')) return;

    const states = ['All States', 'UP', 'Punjab', 'Rajasthan', 'Gujarat', 'MP', 'Maharashtra', 'Karnataka', 'Bihar', 'Haryana'];
    const filterHtml = `
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
            <select id="mandiStateFilter" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;background:white;cursor:pointer;outline:none;">
                ${states.map(s => `<option value="${s === 'All States' ? '' : s}">${s}</option>`).join('')}
            </select>
            <span style="font-size:12px;color:#888;">Rates updated: ${new Date().toLocaleDateString('en-IN')}</span>
        </div>
    `;
    const heading = section.querySelector('h2');
    if (heading) heading.insertAdjacentHTML('afterend', filterHtml);

    document.getElementById('mandiStateFilter')?.addEventListener('change', (e) => {
        const state = e.target.value;
        const search = document.getElementById('mandiSearch')?.value || '';
        renderMandiRatesFiltered(search, state);
    });
}

function handleVoiceCommand(cmd) {
    if (!cmd) return;

    // Check keywords for equipment
    if (cmd.includes('tractor') || cmd.includes('ट्रैक्टर')) {
        document.querySelector('.equip-btn[data-type="tractor"]')?.click();
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "मैंने आपके लिए ट्रैक्टर चुन लिया है।" : "I have selected a Tractor for you.");
    } else if (cmd.includes('harvester') || cmd.includes('हार्वेस्टर')) {
        document.querySelector('.equip-btn[data-type="harvester"]')?.click();
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "मैंने आपके लिए हार्वेस्टर चुन लिया है।" : "I have selected a Harvester for you.");
    } else if (cmd.includes('irrigation') || cmd.includes('सिंचाई') || cmd.includes('pump') || cmd.includes('पंप') || cmd.includes('water')) {
        document.querySelector('.equip-btn[data-type="irrigation"]')?.click();
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "मैंने सिंचाई चुन लिया है।" : "I have selected Irrigation.");
    }
    // Navigation / Sections
    else if (cmd.includes('mandi') || cmd.includes('मंडी') || cmd.includes('price') || cmd.includes('भाव') || cmd.includes('rate')) {
        document.querySelector('.mandi-section')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "यहाँ मंडी भाव हैं।" : "Here are the Mandi rates.");
    } else if (cmd.includes('home') || cmd.includes('घर')) {
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
            document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = 'index.html';
        }
        speakText(currentLang === 'hi' ? "होम पेज खोल रहा हूँ।" : "Opening Home.");
    } else if (cmd.includes('owner') || cmd.includes('मालिक') || cmd.includes('rent')) {
        window.location.href = 'owner.html';
        speakText(currentLang === 'hi' ? "मालिक पोर्टल खोल रहा हूँ।" : "Opening Owner Portal.");
    } else if (cmd.includes('driver') || cmd.includes('ड्राइवर') || cmd.includes('job')) {
        window.location.href = 'driver.html';
        speakText(currentLang === 'hi' ? "ड्राइवर पोर्टल खोल रहा हूँ।" : "Opening Driver Portal.");
    } else if (cmd.includes('club') || cmd.includes('क्लब') || cmd.includes('community')) {
        window.location.href = 'club.html';
        speakText(currentLang === 'hi' ? "किसान क्लब खोल रहा हूँ।" : "Opening Farmers Club.");
    } else if (cmd.includes('scheme') || cmd.includes('yojana') || cmd.includes('योजना') || cmd.includes('subsidy')) {
        document.querySelector('.schemes-section')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "यहाँ सरकारी योजनाएं हैं।" : "Here are Government Schemes.");
    } else if (cmd.includes('contact') || cmd.includes('call') || cmd.includes('फोन') || cmd.includes('संपर्क')) {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "यहाँ संपर्क जानकारी है।" : "Here is our contact information.");
    } else if (cmd.includes('post') || cmd.includes('chowpal') || cmd.includes('चौपाल')) {
        document.getElementById('chowpal')?.scrollIntoView({ behavior: 'smooth' });
        speakText(currentLang === 'hi' ? "किसान चौपाल खोल रहा हूँ।" : "Opening Kisan Chowpal.");
    }
    // Modals & Popups
    else if (cmd.includes('booking') || cmd.includes('history') || cmd.includes('बुकिंग')) {
        document.getElementById('bookingsPanel')?.classList.add('active');
        speakText(currentLang === 'hi' ? "आपकी बुकिंग्स यहाँ हैं।" : "Opening your bookings.");
    } else if (cmd.includes('scan') || cmd.includes('disease') || cmd.includes('बीमारी') || cmd.includes('crop')) {
        document.getElementById('scanCropBtn')?.click();
        speakText(currentLang === 'hi' ? "फसल स्कैनिंग खोल रहा हूँ।" : "Opening crop scanner.");
    }
    // Languages
    else if (cmd.includes('hindi') || cmd.includes('हिंदी')) {
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = 'hi';
            langSelect.dispatchEvent(new Event('change'));
            speakText("मैंने भाषा हिंदी कर दी है।");
        }
    } else if (cmd.includes('english') || cmd.includes('अंग्रेजी')) {
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = 'en';
            langSelect.dispatchEvent(new Event('change'));
            speakText("I have changed the language to English.");
        }
    } else {
        speakText(currentLang === 'hi' ? "मुझे समझ नहीं आया। 'ट्रैक्टर', 'योजना', या 'मालिक पोर्टल' बोलें।" : "I didn't catch that. Say Tractor, Mandi, Schemes, or Owner Portal.");
    }
}

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const colors = { success: '#2e7d32', warning: '#e65100', info: '#1565c0', error: '#c62828' };
    toast.style.cssText = `background:${colors[type]||colors.info};color:white;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,0.2);max-width:320px;text-align:center;animation:toastIn 0.3s ease;`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease'; setTimeout(() => toast.remove(), 280); }, 3500);
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
    const equipName = document.getElementById('modalEquipment').textContent;
    const totalRaw = document.getElementById('modalTotal').textContent;
    const total = parseInt(totalRaw.replace(/[,₹]/g, '')) || 0;

    bookings.unshift({
        id,
        equipment: equipName,
        location: document.getElementById('modalLocation').textContent,
        dateTime: document.getElementById('modalDateTime').textContent,
        total: '₹' + total.toLocaleString(),
        status: 'Confirmed'
    });
    localStorage.setItem('sajhaBookings', JSON.stringify(bookings));
    
    // Update Ledger
    if (typeof updateLedger === 'function') {
        updateLedger('expense', total, `Booked ${equipName}`);
    }
    updateCoins(50); // Reward for booking

    document.getElementById('bookingModal').classList.remove('active');
    document.getElementById('bookingId').textContent = id;
    document.getElementById('successScreen').classList.add('active');
    
    speakText(currentLang === 'hi' ? "बुकिंग सफल रही" : "Booking confirmed successfully.");
}

function renderBookings() {
    const list = document.getElementById('bookingsList');
    if (!list) return;
    if (bookings.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:40px 24px;"><i class="fas fa-calendar-check" style="font-size:48px;color:#ddd;margin-bottom:16px;"></i><p style="color:#888;">${tL('noBookings')}</p></div>`;
        return;
    }
    list.innerHTML = bookings.map((b, index) => `
        <div class="booking-item" id="booking-item-${index}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h4 style="font-size:15px;">${b.equipment}</h4>
                <span style="font-size:11px; padding:3px 10px; border-radius:12px; font-weight:600;
                    background:${b.status === 'Cancelled' ? '#ffebee' : (b.status === 'Completed' ? '#e8f5e9' : '#fff3e0')};
                    color:${b.status === 'Cancelled' ? '#c62828' : (b.status === 'Completed' ? '#2e7d32' : '#e65100')};
                ">${b.status}</span>
            </div>
            <p style="font-size:12px;color:#888;margin-bottom:8px;">ID: <strong>${b.id}</strong></p>
            <p><i class="fas fa-map-marker-alt" style="color:var(--green);"></i> ${b.location}</p>
            <p><i class="fas fa-calendar" style="color:var(--green);"></i> ${b.dateTime}</p>
            <p><strong style="color:var(--green);font-size:16px;">${b.total}</strong></p>
            ${b.rating ? `<div style="color:#fbc02d;margin:4px 0;">${'\u2605'.repeat(b.rating)}${'\u2606'.repeat(5-b.rating)} <span style="font-size:12px;color:#888;">(Your rating)</span></div>` : ''}
            <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
                ${b.status !== 'Cancelled' ? `
                    <button class="dur-btn" onclick="trackBooking('${b.id}')" style="padding:4px 12px; font-size:13px; height:32px; min-height:32px; background: #e3f2fd; border-color: #2196f3; color: #1976d2;">
                        <i class="fas fa-route"></i> Track
                    </button>
                    ${!b.rating ? `<button class="dur-btn" onclick="rateBooking(${index})" style="padding:4px 12px; font-size:13px; height:32px; min-height:32px; background:#fff8e1; border-color:#fbc02d; color:#f57f17;">
                        <i class="fas fa-star"></i> Rate
                    </button>` : ''}
                    <button class="dur-btn" onclick="cancelBooking(${index})" style="padding:4px 12px; font-size:13px; height:32px; min-height:32px; border-color:#ffcdd2; color:#c62828;">
                        Cancel
                    </button>
                ` : `<p style="color:#c62828; font-size:12px; margin:0;"><i class="fas fa-info-circle"></i> ${tL('refundInfo')}</p>`}
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
    // Remove any existing rating panel
    document.getElementById('ratingPanel')?.remove();
    const panel = document.createElement('div');
    panel.id = 'ratingPanel';
    panel.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:white;border-radius:16px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:5000;width:300px;max-width:90vw;border-top:4px solid #fbc02d;text-align:center;';
    panel.innerHTML = `
        <h3 style="margin-bottom:8px;color:#333;"><i class="fas fa-star" style="color:#fbc02d;"></i> Rate Service</h3>
        <p style="font-size:13px;color:#666;margin-bottom:16px;">How was your experience?</p>
        <div id="starSelector" style="font-size:36px;cursor:pointer;letter-spacing:4px;color:#e0e0e0;user-select:none;">★★★★★</div>
        <p id="ratingLabel" style="font-size:13px;color:#888;margin:8px 0 16px;">Tap a star to rate</p>
        <button id="submitRatingBtn" disabled style="background:#fbc02d;color:white;border:none;border-radius:8px;padding:10px 24px;font-weight:600;font-size:15px;cursor:pointer;opacity:0.5;width:100%;">Submit Rating</button>
        <button onclick="document.getElementById('ratingPanel')?.remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;">&times;</button>
    `;
    document.body.appendChild(panel);

    let selectedRating = 0;
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
    const stars = panel.querySelector('#starSelector');
    const label = panel.querySelector('#ratingLabel');
    const submitBtn = panel.querySelector('#submitRatingBtn');

    stars.addEventListener('mousemove', (e) => {
        const rect = stars.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const hovered = Math.ceil((x / rect.width) * 5);
        stars.innerHTML = '★'.repeat(Math.max(0,hovered)) + '☆'.repeat(Math.max(0, 5-hovered));
        stars.style.color = '#fbc02d';
        label.textContent = labels[hovered] || 'Tap a star';
    });
    stars.addEventListener('mouseleave', () => {
        stars.innerHTML = selectedRating > 0 ? ('★'.repeat(selectedRating) + '☆'.repeat(5-selectedRating)) : '★★★★★';
        stars.style.color = selectedRating > 0 ? '#fbc02d' : '#e0e0e0';
        label.textContent = selectedRating > 0 ? labels[selectedRating] : 'Tap a star to rate';
    });
    stars.addEventListener('click', (e) => {
        const rect = stars.getBoundingClientRect();
        const x = e.clientX - rect.left;
        selectedRating = Math.ceil((x / rect.width) * 5);
        stars.innerHTML = '★'.repeat(selectedRating) + '☆'.repeat(5-selectedRating);
        stars.style.color = '#fbc02d';
        label.textContent = labels[selectedRating];
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    });
    submitBtn.addEventListener('click', () => {
        bookings[index].rating = selectedRating;
        localStorage.setItem('sajhaBookings', JSON.stringify(bookings));
        document.getElementById('ratingPanel')?.remove();
        updateCoins(10);
        renderBookings();
        showToast(`⭐ Thanks! You gave ${selectedRating}/5 stars and earned 10 SAJHA coins!`, 'success');
    });
};

window.cancelBooking = function (index) {
    // Replace confirm() with an inline confirmation toast-style widget
    const existing = document.getElementById('cancelConfirmPanel');
    if (existing) { existing.remove(); return; }
    const panel = document.createElement('div');
    panel.id = 'cancelConfirmPanel';
    panel.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:white;border-radius:16px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:5000;width:300px;max-width:90vw;border-top:4px solid #d32f2f;text-align:center;';
    panel.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size:32px;color:#d32f2f;margin-bottom:12px;"></i>
        <h3 style="margin-bottom:8px;color:#333;">Cancel Booking?</h3>
        <p style="font-size:13px;color:#666;margin-bottom:16px;">Full refund will be initiated within 3-5 business days.</p>
        <div style="display:flex;gap:8px;">
            <button onclick="document.getElementById('cancelConfirmPanel')?.remove()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;cursor:pointer;font-weight:600;">Go Back</button>
            <button id="confirmCancelBtn" style="flex:1;padding:10px;background:#d32f2f;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Yes, Cancel</button>
        </div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('#confirmCancelBtn').addEventListener('click', () => {
        bookings[index].status = 'Cancelled';
        localStorage.setItem('sajhaBookings', JSON.stringify(bookings));
        document.getElementById('cancelConfirmPanel')?.remove();
        renderBookings();
        showToast('🔴 Booking cancelled. Refund will be processed in 3-5 days.', 'info');
    });
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

