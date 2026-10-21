
#include "EmergencyManager.h"
#include "SeverityCalculator.h"

#include <iostream>
#include <limits>
#include <string>

using namespace std;


// ==========================================
// GENERATE EMERGENCY ID
// ==========================================

int EmergencyManager::generateEmergencyId() const
{
    if (emergencies.empty())
    {
        return 1001;
    }

    int highestId = emergencies[0].getEmergencyId();

    for (const Emergency& emergency : emergencies)
    {
        if (emergency.getEmergencyId() > highestId)
        {
            highestId = emergency.getEmergencyId();
        }
    }

    return highestId + 1;
}


// ==========================================
// REGISTER EMERGENCY
// ==========================================

void EmergencyManager::registerEmergency()
{
    cout << "\n========================================\n";
    cout << "         REGISTER EMERGENCY\n";
    cout << "========================================\n";

    int id = generateEmergencyId();

    cout << "Emergency ID: " << id << "\n";


    // --------------------------------------
    // EMERGENCY TYPE
    // --------------------------------------

    int typeChoice;

    cout << "\nSelect Emergency Type:\n";
    cout << "1. Accident\n";
    cout << "2. Fire\n";
    cout << "3. Medical Emergency\n";
    cout << "4. Natural Disaster\n";
    cout << "5. Crime\n";
    cout << "6. Other\n";
    cout << "Enter choice: ";

    while (!(cin >> typeChoice) || typeChoice < 1 || typeChoice > 6)
    {
        cout << "Invalid choice. Enter 1-6: ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

    EmergencyType type;

    switch (typeChoice)
    {
        case 1:
            type = EmergencyType::Accident;
            break;
        case 2:
            type = EmergencyType::Fire;
            break;
        case 3:
            type = EmergencyType::Medical;
            break;
        case 4:
            type = EmergencyType::NaturalDisaster;
            break;
        case 5:
            type = EmergencyType::Crime;
            break;
        default:
            type = EmergencyType::Other;
            break;
    }


    // --------------------------------------
    // LOCATION
    // --------------------------------------

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    string location;

    do
    {
        cout << "\nEnter emergency location: ";
        getline(cin, location);

        if (location.empty())
        {
            cout << "Location cannot be empty.\n";
        }
    }
    while (location.empty());


    // --------------------------------------
    // PEOPLE AFFECTED
    // --------------------------------------

    int peopleAffected;

    cout << "Enter number of people affected: ";

    while (!(cin >> peopleAffected) || peopleAffected < 1)
    {
        cout << "Enter a valid number (at least 1): ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }


    // --------------------------------------
    // INJURY SEVERITY
    // --------------------------------------

    int injurySeverity;

    cout << "Enter injury severity (0-10): ";

    while (!(cin >> injurySeverity) ||
           injurySeverity < 0 || injurySeverity > 10)
    {
        cout << "Enter a value between 0 and 10: ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }


    // --------------------------------------
    // RISK LEVEL
    // --------------------------------------

    int riskLevel;

    cout << "Enter risk level (0-10): ";

    while (!(cin >> riskLevel) ||
           riskLevel < 0 || riskLevel > 10)
    {
        cout << "Enter a value between 0 and 10: ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }


    // --------------------------------------
    // TIME REPORTED
    // --------------------------------------

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    string timeReported;

    do
    {
        cout << "Enter time reported: ";
        getline(cin, timeReported);

        if (timeReported.empty())
        {
            cout << "Time cannot be empty.\n";
        }
    }
    while (timeReported.empty());


    // --------------------------------------
    // AUTOMATIC RESOURCE SELECTION
    // --------------------------------------

    string requiredResource;

    switch (type)
    {
        case EmergencyType::Accident:
            requiredResource = "Ambulance";
            break;

        case EmergencyType::Fire:
            requiredResource = "Fire Truck";
            break;

        case EmergencyType::Medical:
            requiredResource = "Ambulance";
            break;

        case EmergencyType::NaturalDisaster:
            requiredResource = "Rescue Team";
            break;

        case EmergencyType::Crime:
            requiredResource = "Police Vehicle";
            break;

        case EmergencyType::Other:
        {
            int resourceChoice;

            cout << "\nSelect Required Resource:\n";
            cout << "1. Ambulance\n";
            cout << "2. Fire Truck\n";
            cout << "3. Police Vehicle\n";
            cout << "4. Rescue Team\n";
            cout << "Enter choice: ";

            while (!(cin >> resourceChoice) ||
                   resourceChoice < 1 || resourceChoice > 4)
            {
                cout << "Invalid choice. Enter 1-4: ";
                cin.clear();
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
            }

            switch (resourceChoice)
            {
                case 1:
                    requiredResource = "Ambulance";
                    break;
                case 2:
                    requiredResource = "Fire Truck";
                    break;
                case 3:
                    requiredResource = "Police Vehicle";
                    break;
                case 4:
                    requiredResource = "Rescue Team";
                    break;
            }

            break;
        }
    }

    cout << "\nAutomatically selected resource: "
         << requiredResource << "\n";


    // --------------------------------------
    // CREATE EMERGENCY OBJECT
    // --------------------------------------

    Emergency emergency(
        id,
        type,
        location,
        peopleAffected,
        injurySeverity,
        riskLevel,
        timeReported,
        requiredResource
    );


    // --------------------------------------
    // CALCULATE SEVERITY AND PRIORITY
    // --------------------------------------

    int score =
        SeverityCalculator::calculateScore(emergency);

    string level =
        SeverityCalculator::classifySeverity(score);

    emergency.setSeverityScore(score);
    emergency.setSeverityLevel(level);

    // Priority category follows the calculated severity.
    emergency.setPriority(level);


    // --------------------------------------
    // STORE EMERGENCY
    // --------------------------------------

    emergencies.push_back(emergency);

    cout << "\n========================================\n";
    cout << "Emergency registered successfully!\n";
    cout << "Emergency ID : " << id << "\n";
    cout << "Required     : " << requiredResource << "\n";
    cout << "Severity     : " << score << "\n";
    cout << "Level        : " << level << "\n";
    cout << "Priority     : " << level << "\n";
    cout << "========================================\n";
}


// ==========================================
// DISPLAY ALL EMERGENCIES
// ==========================================

void EmergencyManager::displayAllEmergencies() const
{
    if (emergencies.empty())
    {
        cout << "\nNo emergencies registered.\n";
        return;
    }

    cout << "\n========================================\n";
    cout << "        ALL EMERGENCIES\n";
    cout << "========================================\n";

    for (const Emergency& emergency : emergencies)
    {
        emergency.display();
    }
}


// ==========================================
// SEARCH EMERGENCY
// ==========================================

Emergency* EmergencyManager::searchEmergency(int emergencyId)
{
    for (Emergency& emergency : emergencies)
    {
        if (emergency.getEmergencyId() == emergencyId)
        {
            return &emergency;
        }
    }

    return nullptr;
}


// ==========================================
// DISPLAY SPECIFIC EMERGENCY
// ==========================================

void EmergencyManager::displayEmergency(int emergencyId) const
{
    for (const Emergency& emergency : emergencies)
    {
        if (emergency.getEmergencyId() == emergencyId)
        {
            emergency.display();
            return;
        }
    }

    cout << "\nEmergency with ID "
         << emergencyId
         << " not found.\n";
}


// ==========================================
// GET EMERGENCIES
// ==========================================

const vector<Emergency>&
EmergencyManager::getEmergencies() const
{
    return emergencies;
}


// ==========================================
// UPDATE EMERGENCY STATUS
// ==========================================

void EmergencyManager::updateEmergencyStatus(
    int emergencyId,
    EmergencyStatus newStatus
)
{
    Emergency* emergency = searchEmergency(emergencyId);

    if (emergency == nullptr)
    {
        cout << "\nEmergency with ID "
             << emergencyId
             << " not found.\n";
        return;
    }

    emergency->setStatus(newStatus);

    cout << "\nEmergency status updated successfully.\n";
}
Emergency EmergencyManager::registerEmergencyFromAPI(
    int id,
    EmergencyType type,
    const string& location,
    int peopleAffected,
    int injurySeverity,
    int riskLevel,
    const string& timeReported
) {
    string requiredResource;

    switch (type) {
        case EmergencyType::Accident:
        case EmergencyType::Medical:
            requiredResource = "Ambulance";
            break;

        case EmergencyType::Fire:
            requiredResource = "Fire Truck";
            break;

        case EmergencyType::NaturalDisaster:
            requiredResource = "Rescue Team";
            break;

        case EmergencyType::Crime:
            requiredResource = "Police Vehicle";
            break;

        default:
            requiredResource = "Ambulance";
            break;
    }

    Emergency emergency(
        id, type, location, peopleAffected,
        injurySeverity, riskLevel, timeReported,
        requiredResource
    );

    int score = SeverityCalculator::calculateScore(emergency);
    string level = SeverityCalculator::classifySeverity(score);

    emergency.setSeverityScore(score);
    emergency.setSeverityLevel(level);
    emergency.setPriority(level);

    emergencies.push_back(emergency);
    return emergency;
}


bool EmergencyManager::removeEmergency(int emergencyId)
{
    for (auto it = emergencies.begin(); it != emergencies.end(); ++it)
    {
        if (it->getEmergencyId() == emergencyId)
        {
            emergencies.erase(it);
            return true;
        }
    }

    return false;
}
