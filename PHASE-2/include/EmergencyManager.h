
#ifndef EMERGENCY_MANAGER_H
#define EMERGENCY_MANAGER_H

#include "Emergency.h"
#include "EmergencyPriorityQueue.h"
#include <vector>
#include <string>

class EmergencyManager
{
private:
    vector<Emergency> emergencies;
    EmergencyPriorityQueue priorityQueue;
    int nextRegistrationOrder;

    int findEmergencyIndex(const string& id) const;
    void rebuildPriorityQueue();

public:
    EmergencyManager();

    bool registerEmergency(const string& id,
                           const string& type,
                           const string& location,
                           int severity);

    bool viewEmergency(const string& id) const;
    bool updateEmergencyStatus(const string& id,
                               const string& newStatus);
    bool assignAmbulance(const string& id,
                         const string& ambulanceID);

    bool processNextEmergency(Emergency& result);
    void displayAllEmergencies() const;
    void displayPriorityQueue() const;

    int getEmergencyCount() const;
};

#endif
