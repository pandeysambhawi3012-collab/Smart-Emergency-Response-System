const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");

const app = express();
const PORT = 8080;

app.use(express.json());

const frontendPath = path.join(__dirname, "..", "frontend");
const bridgeName = process.platform === "win32" ? "api_bridge.exe" : "api_bridge";
const bridgePath = path.join(__dirname, "..", bridgeName);

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Spawn persistent C++ daemon
const bridge = spawn(bridgePath, [], {
    cwd: path.dirname(bridgePath),
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"]
});

bridge.stderr.on("data", (data) => {
    console.log("[C++]", data.toString().trim());
});

bridge.on("error", (error) => {
    console.error("Could not start C++ bridge:", error.message);
    console.error("Build it first (see build_bridge.bat) and keep it in the project root.");
});

bridge.on("exit", (code) => {
    console.error("C++ bridge exited with code:", code);
});

const stdoutLines = readline.createInterface({
    input: bridge.stdout
});

// Sequential FIFO command queue to prevent concurrent request collisions
const commandQueue = [];
let isProcessingCommand = false;

function bridgeRequest(command) {
    return new Promise((resolve, reject) => {
        if (bridge.exitCode !== null) {
            reject(new Error("C++ bridge is not running"));
            return;
        }

        commandQueue.push({ command, resolve, reject });
        processNextCommand();
    });
}

function processNextCommand() {
    if (isProcessingCommand || commandQueue.length === 0) return;
    isProcessingCommand = true;

    const { command, resolve, reject } = commandQueue.shift();

    const onLine = (line) => {
        let result;
        try {
            result = JSON.parse(line);
        } catch {
            return; // Ignore non-JSON C++ logs
        }

        cleanup();
        resolve(result);
        isProcessingCommand = false;
        processNextCommand();
    };

    const onError = (err) => {
        cleanup();
        reject(err);
        isProcessingCommand = false;
        processNextCommand();
    };

    function cleanup() {
        stdoutLines.off("line", onLine);
        bridge.off("error", onError);
    }

    stdoutLines.on("line", onLine);
    bridge.once("error", onError);

    bridge.stdin.write(command + "\n", (err) => {
        if (err) onError(err);
    });
}

function encodeField(value) {
    return encodeURIComponent(String(value));
}

function errorResponse(res, error, status = 500) {
    return res.status(status).json({
        success: false,
        error: error.message || String(error)
    });
}

async function routeBetween(source, destination) {
    const result = await bridgeRequest(
        `ROUTE\t${encodeField(source)}\t${encodeField(destination)}`
    );

    if (!result.success) {
        return { distance: 0, path: [], reachable: false };
    }

    return {
        distance: result.distance,
        path: result.path,
        reachable: result.reachable
    };
}

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Smart Emergency Response API is running",
        bridgeRunning: bridge.exitCode === null
    });
});

app.get("/api/state", async (req, res) => {
    try {
        const state = await bridgeRequest("STATE");
        res.json(state);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.get("/api/queue", async (req, res) => {
    try {
        res.json(await bridgeRequest("QUEUE"));
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.post("/api/emergencies", async (req, res) => {
    let {
        id,
        type,
        location,
        peopleAffected,
        injurySeverity,
        riskLevel,
        timeReported
    } = req.body;

    let emergencyId = Number(id);
    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        try {
            const state = await bridgeRequest("STATE");
            const existingIds = (state.emergencies || []).map(e => Number(e.id));
            emergencyId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1001;
        } catch {
            emergencyId = 1001;
        }
    }

    peopleAffected = Number.isInteger(Number(peopleAffected)) && Number(peopleAffected) >= 1 ? Number(peopleAffected) : 1;
    injurySeverity = Number.isInteger(Number(injurySeverity)) && Number(injurySeverity) >= 0 ? Math.min(10, Number(injurySeverity)) : 5;
    riskLevel = Number.isInteger(Number(riskLevel)) && Number(riskLevel) >= 0 ? Math.min(10, Number(riskLevel)) : 5;

    const command = [
        "REGISTER",
        emergencyId,
        encodeField(type || "Accident"),
        encodeField((location || "Clock Tower").trim()),
        peopleAffected,
        injurySeverity,
        riskLevel,
        encodeField(timeReported || new Date().toLocaleTimeString())
    ].join("\t");

    try {
        const result = await bridgeRequest(command);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

// Return the AVAILABLE vehicles of the type this emergency needs, nearest first.
// Routes come from the C++ Dijkstra module.
async function rankResources(req, res) {
    const emergencyId = Number(req.query.emergencyId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid emergencyId is required"
        });
    }

    try {
        const state = await bridgeRequest("STATE");

        if (!state.success) {
            return res.status(503).json(state);
        }

        const emergency = state.emergencies.find(
            item => Number(item.id) === emergencyId
        );

        if (!emergency) {
            return res.status(404).json({
                success: false,
                error: "Emergency not found"
            });
        }

        // Determine baseline requirement
        let requiredResource = emergency.requiredResource || "Small Ambulance";
        let sharedCorridorInfo = null;

        // ============================================================
        // 1. DYNAMIC CAPACITY & SHARED CORRIDOR DETECTION
        // ============================================================
        const isAmbulanceEmergency =
            requiredResource.includes("Ambulance") ||
            emergency.type === "Accident" ||
            emergency.type === "Medical";

        if (isAmbulanceEmergency) {
            // More than 2 people -> Demand Large Ambulance
            if (Number(emergency.peopleAffected) > 2) {
                requiredResource = "Large Ambulance";
            }

            // Check if other pending incidents share the same corridor (<= 6 km)
            const otherPending = (state.emergencies || []).filter(e =>
                (e.status === "Pending" || e.status === "Reported") &&
                Number(e.id) !== emergencyId &&
                (e.type === "Accident" || e.type === "Medical" || (e.requiredResource && e.requiredResource.includes("Ambulance")))
            );

            for (const other of otherPending) {
                const routeBetweenIncidents = await routeBetween(emergency.location, other.location);
                const isNearby = emergency.location === other.location ||
                    (routeBetweenIncidents.reachable && routeBetweenIncidents.distance <= 6);

                if (isNearby) {
                    requiredResource = "Large Ambulance";
                    sharedCorridorInfo = {
                        detected: true,
                        pairedIncidentId: other.id,
                        pairedLocation: other.location,
                        reason: `Shared corridor detected with Incident #${other.id} at ${other.location}. Upgraded to Large Ambulance for combined response.`
                    };
                    break;
                }
            }
        }

        // ============================================================
        // 2. RESOURCE MATCHING & FLEET FALLBACK
        // ============================================================
        const resources = [];
        const availableFleet = (state.resources || []).filter(r => r.status === "Available");

        if (isAmbulanceEmergency) {
            // Include all available ambulances (Large, Small, or standard Ambulance)
            const availableAmbulances = availableFleet.filter(r =>
                r.type.includes("Ambulance")
            );

            for (const item of availableAmbulances) {
                let isExactMatch = false;
                let isFallback = false;

                if (requiredResource === "Large Ambulance") {
                    if (item.type === "Large Ambulance") {
                        isExactMatch = true;
                    } else {
                        // Standard Ambulance or Small Ambulance serves as backup
                        isFallback = true;
                    }
                } else if (requiredResource === "Small Ambulance") {
                    if (item.type === "Small Ambulance" || item.type === "Ambulance") {
                        isExactMatch = true;
                    } else {
                        isFallback = true;
                    }
                } else {
                    isExactMatch = true;
                }

                const capacity = item.capacity || (item.type.includes("Large") ? 6 : (item.type.includes("Small") ? 2 : 4));

                resources.push({
                    id: item.id,
                    type: item.type,
                    location: item.location,
                    status: item.status,
                    capacity: capacity,
                    isExactMatch: isExactMatch,
                    isFallback: isFallback,
                    route: await routeBetween(item.location, emergency.location)
                });
            }
        } else {
            // Other emergency types (Fire Truck, Police, Rescue Team)
            for (const item of availableFleet) {
                if (item.type !== requiredResource) continue;

                resources.push({
                    id: item.id,
                    type: item.type,
                    location: item.location,
                    status: item.status,
                    capacity: item.capacity || 4,
                    isExactMatch: true,
                    isFallback: false,
                    route: await routeBetween(item.location, emergency.location)
                });
            }
        }

        // Sort candidates:
        // 1. Exact capacity matches first, then backups
        // 2. Shortest Dijkstra distance first
        resources.sort((a, b) => {
            if (a.isExactMatch && !b.isExactMatch) return -1;
            if (!a.isExactMatch && b.isExactMatch) return 1;
            if (!a.route.reachable && !b.route.reachable) return 0;
            if (!a.route.reachable) return 1;
            if (!b.route.reachable) return -1;
            return a.route.distance - b.route.distance;
        });

        // Hospital leg for accident/medical incidents
        const hospitalRoute = isAmbulanceEmergency
            ? await routeBetween(emergency.location, "Hospital")
            : null;

        res.json({
            success: true,
            emergencyId,
            requiredResource,
            sharedCorridor: sharedCorridorInfo,
            resources,
            ambulances: resources,
            hospitalRoute
        });
    } catch (error) {
        errorResponse(res, error, 503);
    }
}

app.get(["/api/resources/ranked", "/api/ambulances/ranked"], rankResources);

app.post("/api/dispatch", async (req, res) => {
    const emergencyId = Number(req.body.emergencyId);
    const ambulanceId = Number(req.body.ambulanceId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({ success: false, error: "A valid emergencyId is required" });
    }

    const command = Number.isInteger(ambulanceId) && ambulanceId > 0
        ? `DISPATCH\t${emergencyId}\t${ambulanceId}`
        : `DISPATCH\t${emergencyId}`;

    try {
        const result = await bridgeRequest(command);
        res.status(result.success ? 200 : 409).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.post("/api/emergencies/resolve", async (req, res) => {
    const emergencyId = Number(req.body.emergencyId);

    if (!Number.isInteger(emergencyId) || emergencyId <= 0) {
        return res.status(400).json({ success: false, error: "A valid emergencyId is required" });
    }

    try {
        const result = await bridgeRequest(`RESOLVE\t${emergencyId}`);
        res.status(result.success ? 200 : 409).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.post("/api/resources/release", async (req, res) => {
    const resourceId = Number(req.body.resourceId);

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
        return res.status(400).json({ success: false, error: "A valid resourceId is required" });
    }

    try {
        const result = await bridgeRequest(`RELEASE\t${resourceId}`);
        res.status(result.success ? 200 : 409).json(result);
    } catch (error) {
        errorResponse(res, error, 503);
    }
});

app.use("/api", (req, res) => {
    res.status(404).json({ success: false, error: "API endpoint not found", path: req.originalUrl });
});

app.listen(PORT, "127.0.0.1", () => {
    console.log(`Smart Emergency Dashboard: http://127.0.0.1:${PORT}/`);
});