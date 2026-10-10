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
    // Emergency Type
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
    cin >> typeChoice;


    while (typeChoice < 1 || typeChoice > 6)
    {
        cout << "Invalid choice. Enter 1-6: ";
        cin >> typeChoice;
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
    }


    // --------------------------------------
    // Location
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

    } while (location.empty());


    // --------------------------------------
    // People affected
    // --------------------------------------

    int peopleAffected;

    cout << "Enter number of people affected: ";
    cin >> peopleAffected;

    while (peopleAffected < 1)
    {
        cout << "Number of people must be at least 1: ";
        cin >> peopleAffected;
    }


    // --------------------------------------
    // Injury severity
    // --------------------------------------

    int injurySeverity;

    cout << "Enter injury severity (0-10): ";
    cin >> injurySeverity;

    while (injurySeverity < 0 || injurySeverity > 10)
    {
        cout << "Enter a value between 0 and 10: ";
        cin >> injurySeverity;
    }


    // --------------------------------------
    // Risk level
    // --------------------------------------

    int riskLevel;

    cout << "Enter risk level (0-10): ";
    cin >> riskLevel;

    while (riskLevel < 0 || riskLevel > 10)
    {
        cout << "Enter a value between 0 and 10: ";
        cin >> riskLevel;
    }


    // --------------------------------------
    // Time reported
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

    } while (timeReported.empty());


    // --------------------------------------
    // Required resource
    // --------------------------------------

    string requiredResource;

    cout << "\nSelect Required Resource:\n";
    cout << "1. Ambulance\n";
    cout << "2. Fire Truck\n";
    cout << "3. Police Vehicle\n";
    cout << "4. Rescue Team\n";

    int resourceChoice;

    cout << "Enter choice: ";
    cin >> resourceChoice;

    while (resourceChoice < 1 || resourceChoice > 4)
    {
        cout << "Invalid choice. Enter 1-4: ";
        cin >> resourceChoice;
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


    // --------------------------------------
    // Create Emergency object
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
    // Calculate Severity
    // --------------------------------------

    int score =
        SeverityCalculator::calculateScore(emergency);

    string level =
        SeverityCalculator::classifySeverity(score);


    emergency.setSeverityScore(score);
    emergency.setSeverityLevel(level);


    // --------------------------------------
    // Add emergency to vector
    // --------------------------------------

    emergencies.push_back(emergency);


    cout << "\n========================================\n";
    cout << "Emergency registered successfully!\n";
    cout << "Emergency ID : " << id << "\n";
    cout << "Severity     : " << score << "\n";
    cout << "Level        : " << level << "\n";
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
// GET EMERGENCY COUNT
// ==========================================

const std::vector<Emergency>&
EmergencyManager::getEmergencies() const
{
    return emergencies;
}
void EmergencyManager::updateEmergencyStatus(
    int emergencyId,
    EmergencyStatus newStatus
)
{
    for (Emergency& emergency : emergencies)
    {
        if (emergency.getEmergencyId() == emergencyId)
        {
            emergency.setStatus(newStatus);
            return;
        }
    }
}