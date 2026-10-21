
#ifndef EMERGENCY_PRIORITY_QUEUE_H
#define EMERGENCY_PRIORITY_QUEUE_H

#include "Emergency.h"
#include <vector>

class EmergencyPriorityQueue
{
private:
    vector<Emergency> heap;

    bool higherPriority(const Emergency& a,
                        const Emergency& b) const;

    void heapifyUp(int index);
    void heapifyDown(int index);

public:
    void insert(const Emergency& emergency);

    bool peek(Emergency& result) const;
    bool removeHighestPriority(Emergency& result);

    bool isEmpty() const;
    int size() const;
    void display() const;
};

#endif
