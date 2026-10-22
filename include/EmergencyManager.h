
#ifndef EMERGENCY_MANAGER_H
#define EMERGENCY_MANAGER_H

#include <string>
#include <vector>

#include "Emergency.h"

class EmergencyManager
{
private:
    std::vector<Emergency> emergencies;

    int generateEmergencyId() const;

public:
    // Register an emergency through the API
    Emergency registerEmergencyFromAPI(
        int id,
        EmergencyType type,
        const std::string& location,
        int peopleAffected,
        int injurySeverity,
        int riskLevel,
        const std::string& timeReported
    );

    // Register a new emergency through the console
    void registerEmergency();

    // Display all registered emergencies
    void displayAllEmergencies() const;

    // Search for an emergency using its ID
    Emergency* searchEmergency(int emergencyId);

    // Display a specific emergency
    void displayEmergency(int emergencyId) const;

    // Update emergency status
    void updateEmergencyStatus(
        int emergencyId,
        EmergencyStatus newStatus
    );

    // Remove an emergency using its ID
    bool removeEmergency(int emergencyId);

    // Return the number of registered emergencies
    int getEmergencyCount() const;

    // Return all registered emergencies
    const std::vector<Emergency>& getEmergencies() const;
};

#endif
