#include "PriorityManager.h"

#include <iostream>
#include <vector>
#include <queue>

using namespace std;

// ==========================================
// COMPARATOR (Heap Order)
// ==========================================

bool EmergencyComparator::operator()(
    const Emergency& first,
    const Emergency& second
) const
{
    // Rule 1: Higher severity score gets higher priority.
    if (first.getSeverityScore() != second.getSeverityScore())
    {
        return first.getSeverityScore() < second.getSeverityScore();
    }

    // Rule 2: If severity is equal, more people affected gets higher priority.
    if (first.getPeopleAffected() != second.getPeopleAffected())
    {
        return first.getPeopleAffected() < second.getPeopleAffected();
    }

    // Rule 3: If people affected is equal, higher risk gets higher priority.
    if (first.getRiskLevel() != second.getRiskLevel())
    {
        return first.getRiskLevel() < second.getRiskLevel();
    }

    // Rule 4: If all values are equal, smaller ID (earlier arrival) first.
    return first.getEmergencyId() > second.getEmergencyId();
}

// ==========================================
// ADD EMERGENCY
// ==========================================

void PriorityManager::addEmergency(const Emergency& emergency)
{
    priorityQueue.push(emergency);
}

// ==========================================
// GET HIGHEST PRIORITY EMERGENCY
// ==========================================

Emergency PriorityManager::getHighestPriorityEmergency()
{
    if (priorityQueue.empty())
    {
        return Emergency();
    }

    Emergency emergency = priorityQueue.top();
    priorityQueue.pop();
    return emergency;
}

// ==========================================
// PROCESS EMERGENCY (Removes matching ID)
// ==========================================

bool PriorityManager::processEmergency(int emergencyId)
{
    std::vector<Emergency> temp;
    bool found = false;

    while (!priorityQueue.empty())
    {
        Emergency top = priorityQueue.top();
        priorityQueue.pop();

        if (top.getEmergencyId() == emergencyId)
        {
            found = true;
            break; // Removed from queue
        }
        temp.push_back(top);
    }

    for (const auto& em : temp)
    {
        priorityQueue.push(em);
    }

    return found;
}

// ==========================================
// DISPLAY PRIORITY QUEUE
// ==========================================

void PriorityManager::displayPriorityQueue() const
{
    if (priorityQueue.empty())
    {
        cout << "\nPriority queue is empty.\n";
        return;
    }

    auto tempQueue = priorityQueue;

    cout << "\n========================================\n";
    cout << "        EMERGENCY PRIORITY QUEUE\n";
    cout << "========================================\n";

    int position = 1;
    while (!tempQueue.empty())
    {
        Emergency emergency = tempQueue.top();
        cout << "\nPriority Position : " << position << "\n";
        cout << "Emergency ID      : " << emergency.getEmergencyId() << "\n";
        cout << "Severity Score    : " << emergency.getSeverityScore() << "\n";
        cout << "Severity Level    : " << emergency.getSeverityLevel() << "\n";
        cout << "People Affected   : " << emergency.getPeopleAffected() << "\n";
        cout << "Risk Level        : " << emergency.getRiskLevel() << "\n";
        tempQueue.pop();
        position++;
    }
    cout << "\n========================================\n";
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

bool PriorityManager::isEmpty() const
{
    return priorityQueue.empty();
}

int PriorityManager::getQueueSize() const
{
    return static_cast<int>(priorityQueue.size());
}

void PriorityManager::clearQueue()
{
    while (!priorityQueue.empty())
    {
        priorityQueue.pop();
    }
}