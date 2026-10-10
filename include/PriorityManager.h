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
    // Add an emergency to the priority queue
    void addEmergency(const Emergency& emergency);

    // Remove and return the highest-priority emergency
    Emergency getHighestPriorityEmergency();

    // Display the current priority queue
    void displayPriorityQueue() const;

    // Check whether the queue is empty
    bool isEmpty() const;

    // Return number of emergencies in queue
    int getQueueSize() const;

    // Clear the queue
    void clearQueue();
};

#endif