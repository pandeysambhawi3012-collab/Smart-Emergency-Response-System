#include "PriorityManager.h"

#include <iostream>
#include <vector>
#include <queue>

using namespace std;



bool EmergencyComparator::operator()(
    const Emergency& first,
    const Emergency& second
) const
{

    if (first.getSeverityScore() != second.getSeverityScore())
    {
        return first.getSeverityScore()
               < second.getSeverityScore();
    }


    if (first.getPeopleAffected() != second.getPeopleAffected())
    {
        return first.getPeopleAffected()
               < second.getPeopleAffected();
    }

    if (first.getRiskLevel() != second.getRiskLevel())
    {
        return first.getRiskLevel()
               < second.getRiskLevel();
    }



    return first.getEmergencyId()
           > second.getEmergencyId();
}


void PriorityManager::addEmergency(
    const Emergency& emergency
)
{
    priorityQueue.push(emergency);
}


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

bool PriorityManager::isEmpty() const
{
    return priorityQueue.empty();
}


int PriorityManager::getQueueSize() const
{
    return static_cast<int>(
        priorityQueue.size()
    );
}


void PriorityManager::clearQueue()
{
    while (!priorityQueue.empty())
    {
        priorityQueue.pop();
    }
}