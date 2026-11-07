// ============================================================
// SMART EMERGENCY RESPONSE SYSTEM - CLIENT APPLICATION
// Authoritative Frontend synchronized with C++ Backend API
// ============================================================

const SAFEROUTE_API = "/api";

// Core application state - populated directly from C++
let vehicles = [];
let emergencies = [];
let apiEmergencyId = null;
let apiSelectedVehicleId = null;
let apiHospitalRoute = null;
let apiAvailable = false;

// Resource Type Emoji Helper
const RESOURCE_ICONS = {
    "Ambulance": "🚑",
    "Fire Truck": "🚒",
    "Police Vehicle": "🚓",
    "Rescue Team": "🛟"
};

function resourceIcon(type) {
    return RESOURCE_ICONS[type] || "🚨";
}

// ============================================================
// FRONTEND SEVERITY CALCULATOR
// Exact replica of C++ SeverityCalculator.cpp logic
// ============================================================
const SeverityCalculator = {
    // Factor 1: People Affected Score (Max: 30)
    calculatePeopleScore(people) {
        if (people <= 0) return 0;
        if (people === 1) return 5;
        if (people <= 3) return 10;
        if (people <= 6) return 15;
        if (people <= 10) return 20;
        return 30; // > 10 people
    },

    // Factor 2: Injury Severity Score (Max: 25)
    calculateInjuryScore(injury) {
        if (injury <= 0) return 0;
        if (injury <= 2) return 5;
        if (injury <= 4) return 10;
        if (injury <= 6) return 15;
        if (injury <= 8) return 20;
        return 25; // 9 or 10
    },

    // Factor 3: Risk Level Score (Max: 25)
    calculateRiskScore(risk) {
        if (risk <= 0) return 0;
        if (risk <= 2) return 5;
        if (risk <= 4) return 10;
        if (risk <= 6) return 15;
        if (risk <= 8) return 20;
        return 25; // 9 or 10
    },

    // Factor 4: Emergency Type Score (Max: 20)
    calculateTypeScore(type) {
        const cleanType = (type || "").trim();
        switch (cleanType) {
            case "Fire":
            case "Natural Disaster":
                return 20;
            case "Accident":
            case "Medical":
            case "Cardiac Emergency":
            case "Medical Emergency":
            case "Crime":
                return 15;
            default:
                return 10; // Other
        }
    },

    // Composite Total: 0 to 100 Points
    calculateScore(people, injury, risk, type) {
        return (
            this.calculatePeopleScore(people) +
            this.calculateInjuryScore(injury) +
            this.calculateRiskScore(risk) +
            this.calculateTypeScore(type)
        );
    },

    // Severity Classification: Low, Medium, High, Critical
    classifySeverity(score) {
        if (score <= 30) return "Low";
        if (score <= 60) return "Medium";
        if (score <= 80) return "High";
        return "Critical";
    }
};

function updateLiveSeverityPreview() {
    const people = parseInt(document.getElementById("peopleAffected")?.value || "1", 10);
    const injury = parseInt(document.getElementById("injurySeverity")?.value || "0", 10);
    const risk = parseInt(document.getElementById("riskLevel")?.value || "0", 10);
    const type = document.getElementById("emergencyType")?.value || "Accident";

    const pScore = SeverityCalculator.calculatePeopleScore(people);
    const iScore = SeverityCalculator.calculateInjuryScore(injury);
    const rScore = SeverityCalculator.calculateRiskScore(risk);
    const tScore = SeverityCalculator.calculateTypeScore(type);

    const total = pScore + iScore + rScore + tScore;
    const level = SeverityCalculator.classifySeverity(total);

    const badge = document.getElementById("liveSeverityScore");
    const breakdown = document.getElementById("severityBreakdownText");

    // Dynamic Sizing Note
    let vehicleDemandText = "🚑 Small Ambulance (1–2 patients)";
    if (type === "Accident" || type === "Medical") {
        if (people > 2) {
            vehicleDemandText = "🚐 Large Ambulance (Mass Casualty, 3+ patients)";
        }
    } else if (type === "Fire") {
        vehicleDemandText = "🚒 Fire Truck";
    } else if (type === "Crime") {
        vehicleDemandText = "🚓 Police Patrol";
    } else if (type === "Natural Disaster") {
        vehicleDemandText = "🛟 Rescue Team";
    }

    if (badge) {
        badge.textContent = `${total} / 100 (${level})`;
        if (level === "Critical") badge.style.color = "#dc2626";
        else if (level === "High") badge.style.color = "#ea580c";
        else if (level === "Medium") badge.style.color = "#ca8a04";
        else badge.style.color = "#16a34a";
    }

    if (breakdown) {
        breakdown.innerHTML = `
            <span>Score: ${pScore} (People) + ${iScore} (Injury) + ${rScore} (Risk) + ${tScore} (Type)</span><br>
            <strong style="color:#166534;">Target Resource: ${vehicleDemandText}</strong>
        `;
    }
}

// HTTP API helper
async function saferouteApi(path, options = {}) {
    const response = await fetch(`${SAFEROUTE_API}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error || `API error (${response.status})`);
    }
    return payload;
}

function normalizeEmergencyId(raw) {
    if (!raw) return NaN;
    const match = String(raw).trim().match(/(\d+)/);
    return match ? Number(match[1]) : NaN;
}

// ============================================================
// DASHBOARD NAVIGATION
// ============================================================

function openDashboard() {
    const welcome = document.getElementById("welcomeScreen");
    const dashboard = document.getElementById("dashboard");

    welcome.style.opacity = "0";

    setTimeout(async () => {
        welcome.classList.add("hidden");
        dashboard.classList.remove("hidden");

        await loadBackendState();
    }, 350);
}

function returnHome() {
    const welcome = document.getElementById("welcomeScreen");
    const dashboard = document.getElementById("dashboard");

    dashboard.classList.add("hidden");
    welcome.classList.remove("hidden");

    setTimeout(() => {
        welcome.style.opacity = "1";
    }, 50);
}

// ============================================================
// BACKEND STATE SYNCHRONIZATION
// ============================================================

async function loadBackendState() {
    try {
        const state = await saferouteApi("/state");
        apiAvailable = true;
        setConnectionStatus(true);

        vehicles = state.resources || [];

        // Exclude resolved emergencies from the active queue
        emergencies = (state.emergencies || []).filter(e => e.status !== "Resolved").map(e => ({
            id: String(e.id),
            type: e.type,
            location: e.location,
            severity: Number(e.severity),
            severityLevel: e.severityLevel,
            status: e.status,
            requiredResource: e.requiredResource,
            assignedResourceId: e.assignedResourceId
        }));

        // Query C++ Heap Priority Queue order
        try {
            const q = await saferouteApi("/queue");
            if (q && Array.isArray(q.queue)) {
                const rankMap = new Map();
                q.queue.forEach((item, index) => rankMap.set(String(item.id), index));

                emergencies.sort((a, b) => {
                    const rankA = rankMap.has(a.id) ? rankMap.get(a.id) : 9999;
                    const rankB = rankMap.has(b.id) ? rankMap.get(b.id) : 9999;
                    return rankA - rankB;
                });
            }
        } catch (queueErr) {
            console.warn("Could not read C++ priority queue:", queueErr);
        }

        renderPriorityQueue();
        updateDashboardStats();

        // Determine active pending emergency
        const pendingEmergencies = emergencies.filter(e => e.status === "Pending" || e.status === "Reported");
        if (pendingEmergencies.length > 0) {
            if (!apiEmergencyId || !pendingEmergencies.some(e => Number(e.id) === apiEmergencyId)) {
                apiEmergencyId = Number(pendingEmergencies[0].id);
            }
            await refreshBackendRanking(apiEmergencyId);
        } else {
            apiEmergencyId = null;
            apiSelectedVehicleId = null;
            renderAllVehiclesFleet();
            const btn = document.getElementById("dispatchBtn");
            if (btn) btn.textContent = "Dispatch Vehicle";
            const msg = document.getElementById("dispatchMessage");
            if (msg) msg.textContent = "All emergencies handled. Register a new incident to begin.";
        }

        return true;
    } catch (error) {
        apiAvailable = false;
        setConnectionStatus(false);
        console.error("C++ backend connection failure:", error);

        const msg = document.getElementById("dispatchMessage");
        if (msg) {
            msg.innerHTML = `<span style="color:#dc2626;font-weight:bold;">⚠️ Backend Offline:</span> Run <code>node server.js</code> in the server folder and verify <code>api_bridge.exe</code> is compiled.`;
        }
        return false;
    }
}

function setConnectionStatus(online) {
    const dot = document.getElementById("connectionStatusDot");
    const text = document.getElementById("connectionStatusText");
    const mode = document.getElementById("systemModeStatus");

    if (online) {
        if (dot) dot.style.background = "#16a34a";
        if (text) text.textContent = "C++ Backend Online";
        if (mode) mode.textContent = "Operational";
    } else {
        if (dot) dot.style.background = "#dc2626";
        if (text) text.textContent = "C++ Backend Offline";
        if (mode) mode.textContent = "Disconnected";
    }
}

// ============================================================
// STATS CARD RENDERING
// ============================================================

function updateDashboardStats() {
    const emergencyCount = document.getElementById("emergencyCount");
    const availableCount = document.getElementById("availableCount");
    const priorityDisplay = document.getElementById("priorityDisplay");

    if (emergencyCount) emergencyCount.textContent = emergencies.length;

    if (availableCount) {
        const availableTotal = vehicles.filter(v => v.status === "Available").length;
        availableCount.textContent = availableTotal;
    }

    if (priorityDisplay) {
        const pending = emergencies.filter(e => e.status === "Pending" || e.status === "Reported");
        if (pending.length === 0) {
            priorityDisplay.textContent = "--";
        } else {
            const topSeverity = Math.max(...pending.map(e => e.severity));
            priorityDisplay.textContent = topSeverity > 0 ? topSeverity : "--";
        }
    }
}

// ============================================================
// EMERGENCY REGISTRATION (Sends Calculated Metrics to C++)
// ============================================================

async function registerEmergency() {
    const rawId = document.getElementById("emergencyId").value.trim();
    const id = normalizeEmergencyId(rawId);
    const type = document.getElementById("emergencyType").value;
    const location = document.getElementById("emergencyLocation").value;

    const peopleAffected = parseInt(document.getElementById("peopleAffected")?.value || "1", 10);
    const injurySeverity = parseInt(document.getElementById("injurySeverity")?.value || "5", 10);
    const riskLevel = parseInt(document.getElementById("riskLevel")?.value || "5", 10);

    if (isNaN(peopleAffected) || peopleAffected < 1) {
        alert("Please enter a valid number for people affected (at least 1).");
        return;
    }

    // Calculate severity in frontend using identical C++ formula
    const calculatedScore = SeverityCalculator.calculateScore(peopleAffected, injurySeverity, riskLevel, type);
    const calculatedLevel = SeverityCalculator.classifySeverity(calculatedScore);

    const payload = {
        id: Number.isInteger(id) && id > 0 ? id : undefined,
        type: type,
        location: location,
        peopleAffected: peopleAffected,
        injurySeverity: isNaN(injurySeverity) ? 5 : injurySeverity,
        riskLevel: isNaN(riskLevel) ? 5 : riskLevel,
        severity: calculatedScore,
        severityLevel: calculatedLevel,
        timeReported: new Date().toLocaleTimeString()
    };

    try {
        const result = await saferouteApi("/emergencies", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        document.getElementById("emergencyId").value = "";
        apiEmergencyId = result.emergency ? result.emergency.id : id;

        await loadBackendState();
        triggerEmergencyAlert(type);

        const notice = document.getElementById("dispatchMessage");
        if (notice && result.emergency) {
            notice.textContent = `Incident #${result.emergency.id} registered! Severity Score: ${result.emergency.severity} (${result.emergency.severityLevel}). C++ Heap updated.`;
        }
    } catch (error) {
        alert(`Failed to register emergency: ${error.message}`);
    }
}

// ============================================================
// PRIORITY QUEUE RENDERING
// ============================================================

function renderPriorityQueue() {
    const queue = document.getElementById("priorityQueue");
    if (!queue) return;

    if (emergencies.length === 0) {
        queue.innerHTML = `<div class="empty-state">No pending emergencies</div>`;
        return;
    }

    queue.innerHTML = "";

    emergencies.forEach((emergency, index) => {
        const isSelected = Number(emergency.id) === apiEmergencyId;
        const item = document.createElement("div");
        item.style.padding = "12px";
        item.style.marginBottom = "8px";
        item.style.border = isSelected ? "2px solid #16a34a" : "1px solid #e1ebe4";
        item.style.borderRadius = "10px";
        item.style.background = isSelected ? "#f0fdf4" : "#f8fcf9";
        item.style.cursor = "pointer";

        const badgeColor = emergency.status === "Resource Assigned" ? "#2563eb" : "#dc2626";

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>#${index + 1} — Incident ${emergency.id}</strong>
                <span style="font-size:11px; padding:2px 8px; border-radius:6px; color:white; background:${badgeColor}">
                    ${emergency.status}
                </span>
            </div>
            <div style="margin-top:4px; font-size:12px; color:#4b5563;">
                ${emergency.type} | 📍 ${emergency.location}
            </div>
            <div style="margin-top:2px; font-size:12px;">
                Severity: <strong>${emergency.severityLevel || "Score"} (${emergency.severity})</strong>
                ${emergency.requiredResource ? ` • Needs: <strong>${emergency.requiredResource}</strong>` : ""}
            </div>
            ${emergency.status === "Resource Assigned" ? `
                <button class="outline-btn" style="margin-top:8px; font-size:11px; padding:4px 10px;"
                    onclick="event.stopPropagation(); resolveEmergency('${emergency.id}')">
                    ✔ Mark Resolved & Free Vehicle
                </button>
            ` : ""}
        `;

        item.addEventListener("click", () => {
            apiEmergencyId = Number(emergency.id);
            renderPriorityQueue();
            refreshBackendRanking(apiEmergencyId);
        });

        queue.appendChild(item);
    });
}

// ============================================================
// FLEET RENDERING & DIJKSTRA RANKING
// ============================================================

function renderAllVehiclesFleet() {
    const container = document.getElementById("ambulanceList");
    if (!container) return;
    container.innerHTML = "";

    vehicles.forEach(v => {
        const card = document.createElement("div");
        card.className = "ambulance-card";
        const statusClass = v.status === "Available" ? "available" : "busy";
        card.innerHTML = `
            <div class="ambulance-top">
                <strong>${resourceIcon(v.type)} ${v.id}</strong>
                <span class="status ${statusClass}">${v.status}</span>
            </div>
            <div class="ambulance-location">${v.type} — 📍 ${v.location}</div>
        `;
        container.appendChild(card);
    });
}

async function refreshBackendRanking(emergencyId) {
    if (!emergencyId) return;

    try {
        const result = await saferouteApi(`/resources/ranked?emergencyId=${encodeURIComponent(emergencyId)}`);
        const required = result.requiredResource || "Ambulance";
        apiHospitalRoute = result.hospitalRoute;

        const container = document.getElementById("ambulanceList");
        if (!container) return;
        container.innerHTML = "";

        const candidateResources = result.resources || [];

        const stillValid = candidateResources.some(r => String(r.id) === String(apiSelectedVehicleId));
        if (!stillValid) {
            apiSelectedVehicleId = candidateResources.length > 0 ? candidateResources[0].id : null;
        }

        if (candidateResources.length === 0) {
            container.innerHTML = `
                <div style="padding:14px; color:#b91c1c; font-weight:bold; background:#fee2e2; border-radius:8px;">
                    ⚠️ No available ${required}s in the fleet. Please mark an active incident as Resolved to free one.
                </div>
            `;
        }

        candidateResources.forEach((r, idx) => {
            const card = document.createElement("div");
            const isSelected = String(r.id) === String(apiSelectedVehicleId);
            card.className = "ambulance-card" + (isSelected ? " selected-ambulance" : "");

            const pathText = r.route && r.route.reachable ? r.route.path.join(" → ") : "No reachable path";
            const distText = r.route && r.route.reachable ? `${r.route.distance} km` : "Unreachable";

                       card.innerHTML = `
                <div class="ambulance-top">
                    <strong>${resourceIcon(r.type)} ${r.id}</strong>
                    <span class="status available">Available</span>
                </div>
                <div class="ambulance-location">${r.type} (Cap: ${r.capacity || 2}) — 📍 ${r.location}</div>
                ${r.isFallback ? `<div style="font-size:11px; color:#b45309; font-weight:bold;">⚡ High-Capacity Backup Assignment</div>` : ""}
                <div style="margin-top:8px; font-size:12px; color:#15803d; font-weight:bold;">
                    ${idx === 0 ? "⭐ Shortest Route: " : "Route Distance: "} ${distText}
                </div>
                <div style="margin-top:4px; font-size:11px; color:#64748b;">
                    ${pathText}
                </div>
            `;
            card.addEventListener("click", () => {
                apiSelectedVehicleId = r.id;
                refreshBackendRanking(emergencyId);
                const msg = document.getElementById("dispatchMessage");
                if (msg) {
                    msg.textContent = `${r.type} #${r.id} selected. Route distance: ${distText}. Click Dispatch to confirm.`;
                }
            });

            container.appendChild(card);
        });

        const selected = candidateResources.find(r => String(r.id) === String(apiSelectedVehicleId)) || candidateResources[0];
        if (selected && selected.route) {
            const box = document.getElementById("routeResult");
            const distance = document.getElementById("routeDistanceText");
            const pathBox = document.getElementById("routePath");
            const statRoute = document.getElementById("routeDistance");

            if (box && distance && pathBox) {
                box.classList.remove("hidden");
                distance.textContent = selected.route.reachable ? `${selected.route.distance} km` : "No route";
                pathBox.textContent = selected.route.reachable ? selected.route.path.join(" → ") : "Unreachable";
            }
            if (statRoute) {
                statRoute.textContent = selected.route.reachable ? `${selected.route.distance} km` : "--";
            }
        }

        const btn = document.getElementById("dispatchBtn");
        if (btn) btn.textContent = `Dispatch ${required} → Incident #${emergencyId}`;

        if (typeof updateRealMapRoute === "function") setTimeout(updateRealMapRoute, 80);
    } catch (error) {
        console.error("C++ Dijkstra route ranking error:", error);
    }
            // Display Shared Corridor Optimization Banner if detected
        const msg = document.getElementById("dispatchMessage");
        if (result.sharedCorridor && result.sharedCorridor.detected) {
            if (msg) {
                msg.innerHTML = `
                    <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:10px 14px; border-radius:8px; margin-bottom:8px;">
                        <span style="color:#1d4ed8; font-weight:800; font-size:12px; display:block;">🛣️ SHARED CORRIDOR OPTIMIZATION ACTIVATED</span>
                        <span style="color:#1e3a8a; font-size:12px;">${result.sharedCorridor.reason}</span>
                    </div>
                `;
            }
        }
}

async function handleSortByDistanceClick() {
    if (!apiEmergencyId) {
        const pending = emergencies.find(e => e.status === "Pending" || e.status === "Reported");
        if (pending) apiEmergencyId = Number(pending.id);
    }

    if (!apiEmergencyId) {
        alert("Please register an incident first to rank resources by Dijkstra shortest path.");
        return;
    }

    await refreshBackendRanking(apiEmergencyId);
}

// ============================================================
// DISPATCH & RESOLVE ACTIONS
// ============================================================

async function dispatchVehicle() {
    if (!apiEmergencyId) {
        alert("No active pending emergency to dispatch to.");
        return;
    }

    if (!apiSelectedVehicleId) {
        alert("Please select an available vehicle card first.");
        return;
    }

    try {
        const result = await saferouteApi("/dispatch", {
            method: "POST",
            body: JSON.stringify({
                emergencyId: apiEmergencyId,
                ambulanceId: Number(apiSelectedVehicleId)
            })
        });

        const msg = document.getElementById("dispatchMessage");
        if (msg) {
            msg.textContent = `SUCCESS: ${result.resourceType} #${result.resourceId} dispatched! Route distance: ${result.distance} km.`;
        }

        apiSelectedVehicleId = null;
        await loadBackendState();
        alert(`Dispatched successfully! Vehicle #${result.resourceId} is en route.`);
    } catch (error) {
        alert(`Dispatch failed: ${error.message}`);
    }
}

async function resolveEmergency(id) {
    try {
        const result = await saferouteApi("/emergencies/resolve", {
            method: "POST",
            body: JSON.stringify({ emergencyId: Number(id) })
        });

        apiSelectedVehicleId = null;
        await loadBackendState();

        const msg = document.getElementById("dispatchMessage");
        if (msg) {
            msg.textContent = result.releasedResourceId
                ? `Incident #${id} resolved. Vehicle #${result.releasedResourceId} is now AVAILABLE.`
                : `Incident #${id} resolved.`;
        }
    } catch (error) {
        alert(`Could not resolve emergency: ${error.message}`);
    }
}

// ============================================================
// AUDIO & VISUAL EMERGENCY SIREN
// ============================================================

function triggerEmergencyAlert(type) {
    const list = document.getElementById("ambulanceList");
    if (list) {
        list.classList.remove("emergency-flash");
        void list.offsetWidth;
        list.classList.add("emergency-flash");
        setTimeout(() => list.classList.remove("emergency-flash"), 1700);
    }

    let popup = document.getElementById("emergencySirenPopup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "emergencySirenPopup";
        popup.setAttribute("role", "status");
        document.body.appendChild(popup);
    }

    const icon = type === "Fire" ? "🔥" : type === "Crime" ? "🚓" : "🚨";
    popup.innerHTML = `
        <span class="siren-emoji">${icon}</span>
        <span class="siren-copy">
            <strong>${type} Incident Ingested</strong>
            <small>C++ Priority Heap Updated</small>
        </span>
    `;
    popup.classList.add("siren-popup-show");
    setTimeout(() => popup.classList.remove("siren-popup-show"), 1800);

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        setTimeout(() => ctx.close().catch(() => {}), 400);
    } catch (_) {}
}

// ============================================================
// LEAFLET MAP MODULE (OpenStreetMap + Dehradun Coordinates)
// ============================================================

let realMap = null;
let realMapReady = false;
let realEmergencyMarker = null;
let realVehicleMarkers = [];
let realRouteLayer = null;
const REAL_MAP_CENTER = [30.3165, 78.0322];

const DEHRADUN_COORDINATES = {
    "ISBT": { lat: 30.2874, lon: 78.0075 },
    "Clock Tower": { lat: 30.3256, lon: 78.0413 },
    "Rajpur Road": { lat: 30.3560, lon: 78.0750 },
    "Patel Nagar": { lat: 30.3115, lon: 78.0120 },
    "Prem Nagar": { lat: 30.3520, lon: 77.9660 },
    "Hospital": { lat: 30.3165, lon: 78.0322 },
    "Fire Station": { lat: 30.3310, lon: 78.0450 },
    "Police Station": { lat: 30.3500, lon: 78.0680 },
    "Rescue Center": { lat: 30.3480, lon: 77.9720 }
};

function makeIcon(emoji, color) {
    if (typeof L === "undefined") return null;
    return L.divIcon({
        className: "saferoute-map-icon",
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:grid;place-items:center;font-size:16px;">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

function initRealMap() {
    const mapEl = document.getElementById("liveMap");
    if (!mapEl || typeof L === "undefined") return;
    if (realMapReady) {
        setTimeout(() => realMap.invalidateSize(), 150);
        return;
    }

    realMap = L.map("liveMap").setView(REAL_MAP_CENTER, 12);
    L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(realMap);

    realMapReady = true;
    renderMapBaseMarkers();
    updateRealMapRoute();
}

function renderMapBaseMarkers() {
    if (!realMapReady || !realMap) return;
    realVehicleMarkers.forEach(m => realMap.removeLayer(m));
    realVehicleMarkers = [];

    vehicles.forEach(v => {
        const coords = DEHRADUN_COORDINATES[v.location];
        if (coords) {
            const marker = L.marker([coords.lat, coords.lon], {
                icon: makeIcon(resourceIcon(v.type), v.status === "Available" ? "#16a34a" : "#64748b")
            }).addTo(realMap);
            marker.bindPopup(`<strong>${v.type} #${v.id}</strong><br>Base: ${v.location}<br>Status: ${v.status}`);
            realVehicleMarkers.push(marker);
        }
    });
}

async function updateRealMapRoute() {
    if (!realMapReady || !realMap) return;

    const currentEmergency = emergencies.find(e => Number(e.id) === apiEmergencyId);
    if (!currentEmergency) return;

    const endCoords = DEHRADUN_COORDINATES[currentEmergency.location];
    if (!endCoords) return;

    if (realEmergencyMarker) realMap.removeLayer(realEmergencyMarker);
    realEmergencyMarker = L.marker([endCoords.lat, endCoords.lon], {
        icon: makeIcon("🚨", "#dc2626")
    }).addTo(realMap);
    realEmergencyMarker.bindPopup(`<strong>Incident #${currentEmergency.id}</strong><br>${currentEmergency.location}`);

    const selectedVehicle = vehicles.find(v => String(v.id) === String(apiSelectedVehicleId));
    if (!selectedVehicle) return;

    const startCoords = DEHRADUN_COORDINATES[selectedVehicle.location];
    if (!startCoords) return;

    if (realRouteLayer) realMap.removeLayer(realRouteLayer);

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === "Ok" && data.routes.length > 0) {
            const route = data.routes[0];
            realRouteLayer = L.geoJSON(route.geometry, {
                style: { color: "#16a34a", weight: 5, opacity: 0.85 }
            }).addTo(realMap);

            document.getElementById("realRouteTitle").textContent = `${selectedVehicle.type} #${selectedVehicle.id} (${selectedVehicle.location}) → Incident #${currentEmergency.id} (${currentEmergency.location})`;
            document.getElementById("realRouteSummary").textContent = `Route distance: ${(route.distance / 1000).toFixed(1)} km • Est. travel time: ${Math.round(route.duration / 60)} mins`;

            const link = document.getElementById("openGoogleMapsLink");
            if (link) {
                link.href = `https://www.google.com/maps/dir/?api=1&origin=${startCoords.lat},${startCoords.lon}&destination=${endCoords.lat},${endCoords.lon}&travelmode=driving`;
                link.hidden = false;
            }
        }
    } catch (_) {
        const latlngs = [[startCoords.lat, startCoords.lon], [endCoords.lat, endCoords.lon]];
        realRouteLayer = L.polyline(latlngs, { color: "#16a34a", dashArray: "6 6" }).addTo(realMap);
    }
}

// ============================================================
// DOM EVENT LISTENERS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const welcome = document.getElementById("welcomeScreen");
    if (welcome) welcome.style.opacity = "1";

    // Bind real-time calculation listeners for the form
    ["peopleAffected", "injurySeverity", "riskLevel", "emergencyType"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", updateLiveSeverityPreview);
            el.addEventListener("change", updateLiveSeverityPreview);
        }
    });
    updateLiveSeverityPreview();

    // Map collapsible toggle
    const toggle = document.getElementById("toggleMapBtn");
    const expandable = document.getElementById("mapExpandable");
    if (toggle && expandable) {
        toggle.addEventListener("click", () => {
            const opening = expandable.classList.contains("collapsed");
            expandable.classList.toggle("collapsed", !opening);
            expandable.classList.toggle("expanded", opening);
            toggle.textContent = opening ? "Minimize map −" : "Expand map ＋";
            if (opening) {
                setTimeout(() => {
                    if (!realMapReady) initRealMap();
                    else if (realMap) {
                        realMap.invalidateSize();
                        updateRealMapRoute();
                    }
                }, 200);
            }
        });
    }

    // GPS location
    const locate = document.getElementById("locateMeBtn");
    if (locate) {
        locate.addEventListener("click", () => {
            if (expandable && expandable.classList.contains("collapsed") && toggle) toggle.click();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    if (realMap) realMap.setView([pos.coords.latitude, pos.coords.longitude], 14);
                });
            }
        });
    }
});
// Updated Resource Icons (Small Ambulance vs Large Ambulance)
const RESOURCE_ICONS = {
    "Small Ambulance": "🚑",
    "Large Ambulance": "🚐", // High capacity / mass casualty
    "Fire Truck": "🚒",
    "Police Vehicle": "🚓",
    "Rescue Team": "🛟"
};

function resourceIcon(type) {
    return RESOURCE_ICONS[type] || "🚨";
}