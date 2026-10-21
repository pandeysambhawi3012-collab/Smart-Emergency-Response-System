
#include "../include/Emergency.h"
#include <iostream>
using namespace std;

Emergency::Emergency(string id, string type, string loc,
                     int sev, int order)
{
    emergencyID = id;
    emergencyType = type;
    location = loc;
    severity = sev;
    registrationOrder = order;

    status = "PENDING";
    ambulanceID = "NONE";
}

string Emergency::getID() const
{
    return emergencyID;
}

string Emergency::getType() const
{
    return emergencyType;
}

string Emergency::getLocation() const
{
    return location;
}

int Emergency::getSeverity() const
{
    return severity;
}

string Emergency::getStatus() const
{
    return status;
}

string Emergency::getAmbulanceID() const
{
    return ambulanceID;
}

int Emergency::getRegistrationOrder() const
{
    return registrationOrder;
}

bool Emergency::updateStatus(string newStatus)
{
    if (newStatus == "DISPATCHED" && status == "PENDING")
        status = newStatus;
    else if (newStatus == "ON_THE_WAY" && status == "DISPATCHED")
        status = newStatus;
    else if (newStatus == "ARRIVED" && status == "ON_THE_WAY")
        status = newStatus;
    else if (newStatus == "RESOLVED" && status == "ARRIVED")
        status = newStatus;
    else if (newStatus == "CANCELLED" &&
             status != "RESOLVED" && status != "CANCELLED")
        status = newStatus;
    else
        return false;

    return true;
}

void Emergency::assignAmbulance(string id)
{
    ambulanceID = id;
}

void Emergency::display() const
{
    cout << "\n--------------------------------\n";
    cout << "Emergency ID       : " << emergencyID << '\n';
    cout << "Emergency Type     : " << emergencyType << '\n';
    cout << "Location           : " << location << '\n';
    cout << "Severity           : " << severity << '\n';
    cout << "Status             : " << status << '\n';
    cout << "Ambulance ID       : " << ambulanceID << '\n';
    cout << "Registration Order : " << registrationOrder << '\n';
    cout << "--------------------------------\n";
}
