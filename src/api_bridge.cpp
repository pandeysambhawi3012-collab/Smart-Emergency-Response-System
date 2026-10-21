
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cctype>
#include <map>

#include "../include/Emergency.h"
#include "../include/EmergencyManager.h"
#include "../include/PriorityManager.h"
#include "../include/Resource.h"
#include "../include/ResourceManager.h"
#include "../include/Graph.h"

using namespace std;



string jsonEscape(const string& value) {
    string result;

    for (char ch : value) {
        switch (ch) {
            case '"':  result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;
            default:   result += ch;
        }
    }

    return result;
}

string urlDecode(const string& value) {
    string result;

    for (size_t i = 0; i < value.size(); ++i) {
        if (value[i] == '%' && i + 2 < value.size()) {
            try {
                int number = stoi(value.substr(i + 1, 2), nullptr, 16);
                result += static_cast<char>(number);
                i += 2;
            } catch (...) {
                result += value[i];
            }
        } else if (value[i] == '+') {
            result += ' ';
        } else {
            result += value[i];
        }
    }

    return result;
}

vector<string> splitTabs(const string& line) {
    vector<string> fields;
    string field;
    stringstream stream(line);

    while (getline(stream, field, '\t')) {
        fields.push_back(field);
    }

    return fields;
}

string emergencyTypeName(EmergencyType type) {
    switch (type) {
        case EmergencyType::Accident:       return "Accident";
        case EmergencyType::Fire:           return "Fire";
        case EmergencyType::Medical:        return "Medical Emergency";
        case EmergencyType::NaturalDisaster:return "Natural Disaster";
        case EmergencyType::Crime:          return "Crime";
        default:                            return "Other";
    }
}

bool parseEmergencyType(string value, EmergencyType& type) {
    transform(value.begin(), value.end(), value.begin(),
        [](unsigned char ch) { return static_cast<char>(tolower(ch)); });

    if (value == "accident" || value == "road accident" ||
        value == "vehicle collision") {
        type = EmergencyType::Accident;
    } else if (value == "fire") {
        type = EmergencyType::Fire;
    } else if (value == "medical" || value == "medical emergency" ||
               value == "cardiac emergency") {
        type = EmergencyType::Medical;
    } else if (value == "natural disaster" || value == "flood" ||
               value == "earthquake") {
        type = EmergencyType::NaturalDisaster;
    } else if (value == "crime" || value == "police") {
        type = EmergencyType::Crime;
    } else if (value == "other") {
        type = EmergencyType::Other;
    } else {
        return false;
    }

    return true;
}

string emergencyStatusName(EmergencyStatus status) {
    switch (status) {
        case EmergencyStatus::Reported:        return "Pending";
        case EmergencyStatus::Pending:         return "Pending";
        case EmergencyStatus::ResourceAssigned:return "Resource Assigned";
        case EmergencyStatus::InProgress:      return "In Progress";
        case EmergencyStatus::Resolved:        return "Resolved";
        default:                               return "Pending";
    }
}

string resourceTypeName(ResourceType type) {
    switch (type) {
        case ResourceType::Ambulance:     return "Ambulance";
        case ResourceType::FireTruck:     return "Fire Truck";
        case ResourceType::PoliceVehicle: return "Police Vehicle";
        case ResourceType::RescueTeam:    return "Rescue Team";
        default:                          return "Unknown";
    }
}

string resourceStatusName(ResourceStatus status) {
    return status == ResourceStatus::Available ? "Available" : "Busy";
}

bool parseResourceType(const string& name, ResourceType& type) {
    if (name == "Ambulance") {
        type = ResourceType::Ambulance;
    } else if (name == "Fire Truck") {
        type = ResourceType::FireTruck;
    } else if (name == "Police Vehicle") {
        type = ResourceType::PoliceVehicle;
    } else if (name == "Rescue Team") {
        type = ResourceType::RescueTeam;
    } else {
        return false;
    }

    return true;
}

struct QuietOutput {
    ostringstream sink;
    streambuf* old;

    QuietOutput() : old(cout.rdbuf(sink.rdbuf())) {}
    ~QuietOutput() { cout.rdbuf(old); }
};

string pathJson(const vector<string>& path) {
    string result = "[";

    for (size_t i = 0; i < path.size(); ++i) {
        if (i) result += ",";
        result += "\"" + jsonEscape(path[i]) + "\"";
    }

    return result + "]";
}

void printError(const string& message) {
    cout << "{\"success\":false,\"error\":\""
         << jsonEscape(message) << "\"}" << endl;
}

void printSuccess(const string& message) {
    cout << "{\"success\":true,\"message\":\""
         << jsonEscape(message) << "\"}" << endl;
}

int main() {
    EmergencyManager emergencyManager;
    PriorityManager priorityManager;
    ResourceManager resourceManager;
    Graph graph;

    map<int, int> assignments;

    {
        QuietOutput quiet;

        resourceManager.addResource(Resource(
            101, ResourceType::Ambulance,
            "Hospital", ResourceStatus::Available));

        resourceManager.addResource(Resource(
            102, ResourceType::Ambulance,
            "ISBT", ResourceStatus::Available));

        resourceManager.addResource(Resource(
            201, ResourceType::FireTruck,
            "Fire Station", ResourceStatus::Available));

        resourceManager.addResource(Resource(
            301, ResourceType::PoliceVehicle,
            "Police Station", ResourceStatus::Available));

        resourceManager.addResource(Resource(
            401, ResourceType::RescueTeam,
            "Rescue Center", ResourceStatus::Available));

        graph.addLocation("ISBT");
        graph.addLocation("Clock Tower");
        graph.addLocation("Rajpur Road");
        graph.addLocation("Patel Nagar");
        graph.addLocation("Prem Nagar");
        graph.addLocation("Hospital");

        graph.addRoad("ISBT", "Clock Tower", 4);
        graph.addRoad("ISBT", "Patel Nagar", 5);
        graph.addRoad("Clock Tower", "Rajpur Road", 3);
        graph.addRoad("Clock Tower", "Patel Nagar", 6);
        graph.addRoad("Rajpur Road", "Hospital", 5);
        graph.addRoad("Patel Nagar", "Prem Nagar", 4);
        graph.addRoad("Prem Nagar", "Hospital", 6);

        graph.addLocation("Fire Station");
        graph.addLocation("Police Station");
        graph.addLocation("Rescue Center");

        graph.addRoad("Fire Station", "Clock Tower", 3);
        graph.addRoad("Police Station", "Rajpur Road", 2);
        graph.addRoad("Rescue Center", "Prem Nagar", 3);
    }

    cerr << "C++ API bridge started." << endl;

    string line;

    while (getline(cin, line)) {
        if (line == "QUIT") {
            break;
        }

        if (line == "STATE") {
            const auto& emergencies = emergencyManager.getEmergencies();
            const auto& resources = resourceManager.getResources();

            cout << "{\"success\":true,\"backendConnected\":true,"
                 << "\"emergencies\":[";

            for (size_t i = 0; i < emergencies.size(); ++i) {
                if (i) cout << ",";

                const Emergency& e = emergencies[i];

                cout << "{\"id\":" << e.getEmergencyId()
                     << ",\"type\":\""
                     << jsonEscape(emergencyTypeName(e.getType()))
                     << "\",\"location\":\""
                     << jsonEscape(e.getLocation())
                     << "\",\"severity\":" << e.getSeverityScore()
                     << ",\"severityLevel\":\""
                     << jsonEscape(e.getSeverityLevel())
                     << "\",\"status\":\""
                     << jsonEscape(emergencyStatusName(e.getStatus()))
                     << "\",\"requiredResource\":\""
                     << jsonEscape(e.getRequiredResource())
                     << "\",\"assignedResourceId\":"
                     << (assignments.count(e.getEmergencyId())
                             ? assignments.at(e.getEmergencyId())
                             : 0)
                     << "}";
            }

            cout << "],\"resources\":[";

            for (size_t i = 0; i < resources.size(); ++i) {
                if (i) cout << ",";

                const Resource& r = resources[i];

                cout << "{\"id\":\"" << r.getResourceId()
                     << "\",\"type\":\""
                     << jsonEscape(resourceTypeName(r.getType()))
                     << "\",\"location\":\""
                     << jsonEscape(r.getLocation())
                     << "\",\"status\":\""
                     << resourceStatusName(r.getStatus())
                     << "\"}";
            }

            cout << "],\"ambulances\":[";

            bool first = true;

            for (const Resource& r : resources) {
                if (r.getType() != ResourceType::Ambulance) continue;

                if (!first) cout << ",";
                first = false;

                cout << "{\"id\":\"" << r.getResourceId()
                     << "\",\"location\":\""
                     << jsonEscape(r.getLocation())
                     << "\",\"status\":\""
                     << resourceStatusName(r.getStatus())
                     << "\"}";
            }

            cout << "]}" << endl;
            continue;
        }

        vector<string> fields = splitTabs(line);

        if (fields.empty()) {
            printError("Empty command");
            continue;
        }

        if (fields[0] == "ROUTE") {
            if (fields.size() < 3) {
                printError("ROUTE requires a source and a destination");
                continue;
            }

            RouteResult route;

            {
                QuietOutput quiet;
                route = graph.dijkstra(
                    urlDecode(fields[1]), urlDecode(fields[2]));
            }

            cout << "{\"success\":true,\"distance\":" << route.distance
                 << ",\"reachable\":"
                 << (route.reachable ? "true" : "false")
                 << ",\"path\":" << pathJson(route.path) << "}" << endl;

            continue;
        }

        if (fields[0] == "QUEUE") {

            PriorityManager copy = priorityManager;
            bool firstItem = true;

            cout << "{\"success\":true,\"queue\":[";

            while (!copy.isEmpty()) {
                Emergency top = copy.getHighestPriorityEmergency();
                Emergency* live =
                    emergencyManager.searchEmergency(top.getEmergencyId());

                if (!live ||
                    (live->getStatus() != EmergencyStatus::Reported &&
                     live->getStatus() != EmergencyStatus::Pending))
                    continue;

                if (!firstItem) cout << ",";
                firstItem = false;

                cout << "{\"id\":" << top.getEmergencyId()
                     << ",\"severity\":" << top.getSeverityScore() << "}";
            }

            cout << "]}" << endl;
            continue;
        }

        // RESOLVE <emergency ID> -> closes the emergency, frees its vehicle
        if (fields[0] == "RESOLVE") {
            if (fields.size() < 2) {
                printError("RESOLVE requires an emergency ID");
                continue;
            }

            int id;

            try {
                id = stoi(fields[1]);
            } catch (...) {
                printError("Invalid emergency ID");
                continue;
            }

            Emergency* emergency = emergencyManager.searchEmergency(id);

            if (!emergency) {
                printError("Emergency not found");
                continue;
            }

            if (emergency->getStatus() == EmergencyStatus::Resolved) {
                printError("Emergency is already resolved");
                continue;
            }

            int releasedId = 0;

            {
                QuietOutput quiet;

                auto it = assignments.find(id);

                if (it != assignments.end()) {
                    if (resourceManager.releaseResource(it->second)) {
                        releasedId = it->second;
                    }

                    assignments.erase(it);
                }

                emergencyManager.updateEmergencyStatus(
                    id, EmergencyStatus::Resolved);
            }

            cout << "{\"success\":true,\"message\":\"Emergency resolved\","
                 << "\"emergencyId\":" << id
                 << ",\"releasedResourceId\":" << releasedId
                 << "}" << endl;

            continue;
        }

        if (fields[0] == "REGISTER") {
            bool oldFormat = fields.size() == 7;
            bool newFormat = fields.size() == 8;

            if (!oldFormat && !newFormat) {
                printError(
                    "REGISTER requires id, type, location, people, injury, risk and time");
                continue;
            }

            int id = 0;
            size_t offset = 0;

            try {
                if (newFormat) {
                    id = stoi(fields[1]);
                    offset = 1;
                }
            } catch (...) {
                printError("Invalid emergency ID");
                continue;
            }

            EmergencyType type;

            if (!parseEmergencyType(
                    urlDecode(fields[1 + offset]), type)) {
                printError("Unsupported emergency type");
                continue;
            }

            string location = urlDecode(fields[2 + offset]);
            string timeReported = urlDecode(fields[6 + offset]);

            int people, injury, risk;

            try {
                people = stoi(fields[3 + offset]);
                injury = stoi(fields[4 + offset]);
                risk = stoi(fields[5 + offset]);
            } catch (...) {
                printError("Invalid numeric emergency data");
                continue;
            }

            if (location.empty() || people < 1 ||
                injury < 0 || injury > 10 ||
                risk < 0 || risk > 10) {
                printError("Emergency data is outside valid limits");
                continue;
            }

            if (newFormat) {
                Emergency* existing = emergencyManager.searchEmergency(id);

                if (existing) {
                    if (existing->getStatus() != EmergencyStatus::Resolved) {
                        printError(
                            "Emergency ID already exists and is still active");
                        continue;
                    }

                    QuietOutput quiet;

                    emergencyManager.removeEmergency(id);
                    priorityManager.clearQueue();

                    for (const Emergency& e :
                         emergencyManager.getEmergencies()) {
                        if (e.getStatus() == EmergencyStatus::Reported ||
                            e.getStatus() == EmergencyStatus::Pending) {
                            priorityManager.addEmergency(e);
                        }
                    }
                }
            }

            if (oldFormat) {
                id = 1001;
                for (const Emergency& e : emergencyManager.getEmergencies()) {
                    if (e.getEmergencyId() >= id)
                        id = e.getEmergencyId() + 1;
                }
            }

            Emergency emergency =
                emergencyManager.registerEmergencyFromAPI(
                    id, type, location, people, injury, risk, timeReported);

            priorityManager.addEmergency(emergency);

            cout << "{\"success\":true,\"message\":\"Emergency registered\","
                 << "\"emergency\":{\"id\":" << emergency.getEmergencyId()
                 << ",\"type\":\""
                 << jsonEscape(emergencyTypeName(emergency.getType()))
                 << "\",\"location\":\""
                 << jsonEscape(emergency.getLocation())
                 << "\",\"severity\":" << emergency.getSeverityScore()
                 << ",\"severityLevel\":\""
                 << jsonEscape(emergency.getSeverityLevel())
                 << "\",\"status\":\"Pending\"}}"
                 << endl;

            continue;
        }

        if (fields[0] == "DISPATCH") {
            if (fields.size() < 2) {
                printError("DISPATCH requires an emergency ID");
                continue;
            }

            int id;

            try {
                id = stoi(fields[1]);
            } catch (...) {
                printError("Invalid emergency ID");
                continue;
            }

            Emergency* emergency = emergencyManager.searchEmergency(id);

            if (!emergency) {
                printError("Emergency not found");
                continue;
            }

            if (emergency->getStatus() == EmergencyStatus::ResourceAssigned ||
                emergency->getStatus() == EmergencyStatus::InProgress ||
                emergency->getStatus() == EmergencyStatus::Resolved) {
                printError("Emergency already has a resource assigned");
                continue;
            }

            ResourceType requiredType;

            if (!parseResourceType(
                    emergency->getRequiredResource(), requiredType)) {
                printError("Unsupported required resource");
                continue;
            }

            Resource* resource = nullptr;

            if (fields.size() >= 3) {
                // The dashboard picked a specific vehicle.
                int wanted;

                try {
                    wanted = stoi(fields[2]);
                } catch (...) {
                    printError("Invalid resource ID");
                    continue;
                }

                for (Resource& r : resourceManager.getResources()) {
                    if (r.getResourceId() == wanted) {
                        resource = &r;
                        break;
                    }
                }

                if (!resource) {
                    printError("Selected resource does not exist");
                    continue;
                }

                if (resource->getType() != requiredType) {
                    printError("Selected resource is not the type this "
                               "emergency needs (" +
                               emergency->getRequiredResource() + ")");
                    continue;
                }

                if (resource->getStatus() != ResourceStatus::Available) {
                    printError("Selected resource is already busy");
                    continue;
                }
            } else {
                resource =
                    resourceManager.findAvailableResource(requiredType);

                if (!resource) {
                    printError(
                        "No available resource of the required type");
                    continue;
                }
            }

            RouteResult route;

            {
                QuietOutput quiet;
                route = graph.dijkstra(
                    resource->getLocation(), emergency->getLocation());
                resource->setStatus(ResourceStatus::Busy);
                emergencyManager.updateEmergencyStatus(
                    id, EmergencyStatus::ResourceAssigned);
                assignments[id] = resource->getResourceId();
            }

            cout << "{\"success\":true,\"message\":\"Resource assigned\","
                 << "\"emergencyId\":" << id
                 << ",\"resourceId\":\"" << resource->getResourceId()
                 << "\",\"resourceType\":\""
                 << jsonEscape(resourceTypeName(resource->getType()))
                 << "\",\"resourceLocation\":\""
                 << jsonEscape(resource->getLocation())
                 << "\",\"distance\":" << route.distance
                 << ",\"reachable\":"
                 << (route.reachable ? "true" : "false")
                 << ",\"path\":" << pathJson(route.path)
                 << "}" << endl;

            continue;
        }

        if (fields[0] == "RELEASE") {
            if (fields.size() < 2) {
                printError("RELEASE requires a resource ID");
                continue;
            }

            int id;

            try {
                id = stoi(fields[1]);
            } catch (...) {
                printError("Invalid resource ID");
                continue;
            }

            bool released;

            {
                QuietOutput quiet;
                released = resourceManager.releaseResource(id);

                if (released) {
                    // A vehicle released mid-response puts its emergency
                    // back in the waiting queue so it can be re-dispatched.
                    for (auto it = assignments.begin();
                         it != assignments.end();) {
                        if (it->second == id) {
                            emergencyManager.updateEmergencyStatus(
                                it->first, EmergencyStatus::Pending);
                            it = assignments.erase(it);
                        } else {
                            ++it;
                        }
                    }
                }
            }

            if (released) {
                printSuccess("Resource released successfully");
            } else {
                printError("Resource not found or already available");
            }

            continue;
        }

        printError("Unknown command");
    }

    cerr << "C++ API bridge stopped." << endl;
    return 0;
}
