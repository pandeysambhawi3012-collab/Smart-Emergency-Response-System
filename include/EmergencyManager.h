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

    void registerEmergency();

    void displayAllEmergencies() const;

    Emergency* searchEmergency(int emergencyId);

    void displayEmergency(int emergencyId) const;
     void updateEmergencyStatus(
    int emergencyId,
    EmergencyStatus newStatus
);

    int getEmergencyCount() const;
    const std::vector<Emergency>& getEmergencies() const;
};

#endif