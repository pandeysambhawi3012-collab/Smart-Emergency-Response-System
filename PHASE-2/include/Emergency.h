
#ifndef EMERGENCY_H
#define EMERGENCY_H

#include <string>
using namespace std;

class Emergency
{
private:
    string emergencyID;
    string emergencyType;
    string location;
    int severity;
    string status;
    string ambulanceID;
    int registrationOrder;

public:
    Emergency(string id, string type, string loc,
              int sev, int order);

    string getID() const;
    string getType() const;
    string getLocation() const;
    int getSeverity() const;
    string getStatus() const;
    string getAmbulanceID() const;
    int getRegistrationOrder() const;

    bool updateStatus(string newStatus);
    void assignAmbulance(string id);
    void display() const;
};

#endif
