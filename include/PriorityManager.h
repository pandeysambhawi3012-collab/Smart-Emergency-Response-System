#ifndef PRIORITY_MANAGER_H
#define PRIORITY_MANAGER_H

#include <queue>
#include <vector>

#include "Emergency.h"

class EmergencyComparator
{
public:

    bool operator()(
        const Emergency& first,
        const Emergency& second
    ) const;
};


class PriorityManager
{
private:

    std::priority_queue<
        Emergency,
        std::vector<Emergency>,
        EmergencyComparator
    > priorityQueue;

public:
    bool processEmergency(int emergencyId);
    void addEmergency(const Emergency& emergency);

    Emergency getHighestPriorityEmergency();

    void displayPriorityQueue() const;

    bool isEmpty() const;

    int getQueueSize() const;

    void clearQueue();
};

#endif