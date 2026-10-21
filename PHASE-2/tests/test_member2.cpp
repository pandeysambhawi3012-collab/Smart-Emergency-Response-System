
#include "../include/EmergencyManager.h"
#include <cassert>
#include <iostream>

using namespace std;

int main()
{
    EmergencyManager manager;

    // Test 1: Register valid emergencies
    assert(manager.registerEmergency("E1", "Medical",
                                     "Location A", 3));
    assert(manager.registerEmergency("E2", "Fire",
                                     "Location B", 5));
    assert(manager.registerEmergency("E3", "Accident",
                                     "Location C", 5));

    assert(manager.getEmergencyCount() == 3);

    // Test 2: Reject duplicate IDs
    assert(!manager.registerEmergency("E1", "Fire",
                                      "Location D", 4));

    // Test 3: Reject invalid severity
    assert(!manager.registerEmergency("E4", "Medical",
                                      "Location D", 6));

    // Test 4: Highest severity is processed first
    Emergency result("TEMP", "TEMP", "TEMP", 1, 0);

    assert(manager.processNextEmergency(result));
    assert(result.getID() == "E2");
    assert(result.getStatus() == "DISPATCHED");

    // Test 5: Equal severity uses registration order
    assert(manager.processNextEmergency(result));
    assert(result.getID() == "E3");

    // Test 6: Remaining emergency is processed
    assert(manager.processNextEmergency(result));
    assert(result.getID() == "E1");

    // Test 7: Empty queue
    assert(!manager.processNextEmergency(result));

    // Test 8: Unknown emergency ID
    assert(!manager.viewEmergency("UNKNOWN"));

    // Test 9: Invalid status transition
    assert(!manager.updateEmergencyStatus("E1", "RESOLVED"));

    // Test 10: Valid status transition
    assert(manager.updateEmergencyStatus("E1", "DISPATCHED"));

    cout << "All Member 2 tests passed.\n";

    return 0;
}
