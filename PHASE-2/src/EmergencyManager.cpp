
#include "../include/EmergencyManager.h"
#include <iostream>

using namespace std;

EmergencyManager::EmergencyManager()
{
    nextRegistrationOrder = 1;
}

int EmergencyManager::findEmergencyIndex(const string& id) const
{
    for (int i = 0; i < static_cast<int>(emergencies.size()); i++)
    {
        if (emergencies[i].getID() == id)
            return i;
    }

    return -1;
}

void EmergencyManager::rebuildPriorityQueue()
{
    priorityQueue = EmergencyPriorityQueue();

    for (const Emergency& emergency : emergencies)
    {
        if (emergency.getStatus() == "PENDING")
            priorityQueue.insert(emergency);
    }
}

bool EmergencyManager::registerEmergency(
    const string& id,
    const string& type,
    const string& location,
    int severity)
{
    if (id.empty() || type.empty() || location.empty())
        return false;

    if (severity < 1 || severity > 5)
        return false;

    if (findEmergencyIndex(id) != -1)
        return false;

    Emergency emergency(id, type, location,
                        severity, nextRegistrationOrder);

    nextRegistrationOrder++;

    emergencies.push_back(emergency);
    rebuildPriorityQueue();

    return true;
}

bool EmergencyManager::viewEmergency(const string& id) const
{
    int index = findEmergencyIndex(id);

    if (index == -1)
        return false;

    emergencies[index].display();
    return true;
}

bool EmergencyManager::updateEmergencyStatus(
    const string& id,
    const string& newStatus)
{
    int index = findEmergencyIndex(id);

    if (index == -1)
        return false;

    if (!emergencies[index].updateStatus(newStatus))
        return false;

    rebuildPriorityQueue();
    return true;
}

bool EmergencyManager::assignAmbulance(
    const string& id,
    const string& ambulanceID)
{
    int index = findEmergencyIndex(id);

    if (index == -1 || ambulanceID.empty())
        return false;

    emergencies[index].assignAmbulance(ambulanceID);
    return true;
}

bool EmergencyManager::processNextEmergency(Emergency& result)
{
    if (!priorityQueue.removeHighestPriority(result))
        return false;

    int index = findEmergencyIndex(result.getID());

    if (index == -1)
        return false;

    if (!emergencies[index].updateStatus("DISPATCHED"))
    {
        rebuildPriorityQueue();
        return false;
    }

    result = emergencies[index];
    rebuildPriorityQueue();

    return true;
}

void EmergencyManager::displayAllEmergencies() const
{
    if (emergencies.empty())
    {
        cout << "No emergencies registered.\n";
        return;
    }

    for (const Emergency& emergency : emergencies)
        emergency.display();
}

void EmergencyManager::displayPriorityQueue() const
{
    priorityQueue.display();
}

int EmergencyManager::getEmergencyCount() const
{
    return static_cast<int>(emergencies.size());
}
