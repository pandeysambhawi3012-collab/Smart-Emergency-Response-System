
#include "../include/EmergencyPriorityQueue.h"
#include <iostream>

using namespace std;

bool EmergencyPriorityQueue::higherPriority(
    const Emergency& a, const Emergency& b) const
{
    if (a.getSeverity() != b.getSeverity())
        return a.getSeverity() > b.getSeverity();

    return a.getRegistrationOrder() < b.getRegistrationOrder();
}

void EmergencyPriorityQueue::heapifyUp(int index)
{
    while (index > 0)
    {
        int parent = (index - 1) / 2;

        if (!higherPriority(heap[index], heap[parent]))
            break;

        swap(heap[index], heap[parent]);
        index = parent;
    }
}

void EmergencyPriorityQueue::heapifyDown(int index)
{
    int n = static_cast<int>(heap.size());

    while (true)
    {
        int highest = index;
        int left = 2 * index + 1;
        int right = 2 * index + 2;

        if (left < n &&
            higherPriority(heap[left], heap[highest]))
            highest = left;

        if (right < n &&
            higherPriority(heap[right], heap[highest]))
            highest = right;

        if (highest == index)
            break;

        swap(heap[index], heap[highest]);
        index = highest;
    }
}

void EmergencyPriorityQueue::insert(const Emergency& emergency)
{
    heap.push_back(emergency);
    heapifyUp(static_cast<int>(heap.size()) - 1);
}

bool EmergencyPriorityQueue::peek(Emergency& result) const
{
    if (heap.empty())
        return false;

    result = heap[0];
    return true;
}

bool EmergencyPriorityQueue::removeHighestPriority(Emergency& result)
{
    if (heap.empty())
        return false;

    result = heap[0];

    if (heap.size() == 1)
    {
        heap.pop_back();
        return true;
    }

    heap[0] = heap.back();
    heap.pop_back();

    heapifyDown(0);
    return true;
}

bool EmergencyPriorityQueue::isEmpty() const
{
    return heap.empty();
}

int EmergencyPriorityQueue::size() const
{
    return static_cast<int>(heap.size());
}

void EmergencyPriorityQueue::display() const
{
    if (heap.empty())
    {
        cout << "Priority queue is empty.\n";
        return;
    }

    for (const Emergency& emergency : heap)
        emergency.display();
}
