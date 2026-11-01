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

    if (badge) {
        badge.textContent = `${total} / 100 (${level})`;
        if (level === "Critical") badge.style.color = "#dc2626";
        else if (level === "High") badge.style.color = "#ea580c";
        else if (level === "Medium") badge.style.color = "#ca8a04";
        else badge.style.color = "#16a34a";
    }

    if (breakdown) {
        breakdown.textContent = `People: ${pScore} + Injury: ${iScore} + Risk: ${rScore} + Type: ${tScore}`;
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

            const pathText = r.route && r.route.reachable ? r.route.