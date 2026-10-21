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
    Emergency registerEmergencyFromAPI(
    int id,
    EmergencyType type,
    const std::string& location,
    int peopleAffected,
    int injurySeverity,
    int riskLevel,
    const std::string& timeReported
);
    // Register a new emergency
    void registerEmergency();

    // Display all registered emergencies
    void displayAllEmergencies() const;

    // Search emergency using ID
    Emergency* searchEmergency(int emergencyId);

    // Display a specific emergency
    void displayEmergency(int emergencyId) const;
     void updateEmergencyStatus(
    int emergencyId,
    EmergencyStatus newStatus
);

    // Remove an emergency record (used to free a resolved ID for reuse)
    bool removeEmergency(int emergencyId);

    // Return number of emergencies
    int getEmergencyCount() const;
    const std::vector<Emergency>& getEmergencies() const;
};

#endif