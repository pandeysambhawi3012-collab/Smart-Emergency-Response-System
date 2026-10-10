#include "PriorityManager.h"

#include <iostream>
#include <vector>
#include <queue>

using namespace std;


// ==========================================
// COMPARATOR
// ==========================================

bool EmergencyComparator::operator()(
    const Emergency& first,
    const Emergency& second
) const
{
    // Rule 1:
    // Higher severity score gets higher priority.

    if (first.getSeverityScore() != second.getSeverityScore())
    {
        return first.getSeverityScore()
               < second.getSeverityScore();
    }


    // Rule 2:
    // If severity is equal,
    // more people affected gets higher priority.

    if (first.getPeopleAffected() != second.getPeopleAffected())
    {
        return first.getPeopleAffected()
               < second.getPeopleAffected();
    }


    // Rule 3:
    // If people affected is equal,
    // higher risk gets higher priority.

    if (first.getRiskLevel() != second.getRiskLevel())
    {
        return first.getRiskLevel()
               < second.getRiskLevel();
    }


    // Rule 4:
    // If all previous values are equal,
    // smaller emergency ID means earlier registration.

    return first.getEmergencyId()
           > second.getEmergencyId();
}


// ==========================================
// ADD EMERGENCY
// ==========================================

void PriorityManager::addEmergency(
    const Emergency& emergency
)
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

    Emergency emergency =
        priorityQueue.top();

    priorityQueue.pop();

    return emergency;
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


    // Create a temporary copy so that
    // displaying does not destroy the original queue.

    auto tempQueue = priorityQueue;


    cout << "\n========================================\n";
    cout << "        EMERGENCY PRIORITY QUEUE\n";
    cout << "========================================\n";


    int position = 1;


    while (!tempQueue.empty())
    {
        Emergency emergency = tempQueue.top();

        cout << "\nPriority Position : "
             << position << "\n";

        cout << "Emergency ID      : "
             << emergency.getEmergencyId() << "\n";

        cout << "Severity Score    : "
             << emergency.getSeverityScore() << "\n";

        cout << "Severity Level    : "
             << emergency.getSeverityLevel() << "\n";

        cout << "People Affected   : "
             << emergency.getPeopleAffected() << "\n";

        cout << "Risk Level        : "
             << emergency.getRiskLevel() << "\n";

        tempQueue.pop();

        position++;
    }


    cout << "\n========================================\n";
}


// ==========================================
// CHECK EMPTY
// ==========================================

bool PriorityManager::isEmpty() const
{
    return priorityQueue.empty();
}


// ==========================================
// QUEUE SIZE
// ==========================================

int PriorityManager::getQueueSize() const
{
    return static_cast<int>(
        priorityQueue.size()
    );
}


// ==========================================
// CLEAR QUEUE
// ==========================================

void PriorityManager::clearQueue()
{
    while (!priorityQueue.empty())
    {
        priorityQueue.pop();
    }
}