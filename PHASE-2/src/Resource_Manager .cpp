#include <iostream>
#include <string>
using namespace std;

class Ambulance
{
private:
    int id;
    string location;
    string status;

public:
    Ambulance()
    {
        id = 0;
        location = "";
        status = "AVAILABLE";
    }

    Ambulance(int i, string l, string s)
    {
        id = i;
        location = l;
        status = s;
    }

    int getId()
    {
        return id;
    }

    string getLocation()
    {
        return location;
    }

    string getStatus()
    {
        return status;
    }

    void setStatus(string s)
    {
        status = s;
    }

    void display()
    {
        cout << "Ambulance ID : " << id << endl;
        cout << "Location     : " << location << endl;
        cout << "Status       : " << status << endl;
        cout << "--------------------------" << endl;
    }
};

class Emergency
{
private:
    int id;
    string type;
    string location;
    int severity;
    string status;
    int ambulanceId;

public:
    Emergency()
    {
        id = 0;
        type = "";
        location = "";
        severity = 0;
        status = "PENDING";
        ambulanceId = -1;
    }

    Emergency(int i, string t, string l, int s)
    {
        id = i;
        type = t;
        location = l;
        severity = s;
        status = "PENDING";
        ambulanceId = -1;
    }

    int getId()
    {
        return id;
    }

    string getType()
    {
        return type;
    }

    string getLocation()
    {
        return location;
    }

    int getSeverity()
    {
        return severity;
    }

    string getStatus()
    {
        return status;
    }

    int getAmbulanceId()
    {
        return ambulanceId;
    }

    void setStatus(string s)
    {
        status = s;
    }

    void setAmbulanceId(int id)
    {
        ambulanceId = id;
    }

    void display()
    {
        cout << "\nEmergency ID : " << id << endl;
        cout << "Type         : " << type << endl;
        cout << "Location     : " << location << endl;
        cout << "Severity     : " << severity << endl;
        cout << "Status       : " << status << endl;

        if (ambulanceId == -1)
            cout << "Ambulance    : Not Assigned" << endl;
        else
            cout << "Ambulance    : " << ambulanceId << endl;
    }
};

#define MAX_AMBULANCE 10
#define MAX_EMERGENCY 10

Ambulance ambulances[MAX_AMBULANCE];
Emergency emergencies[MAX_EMERGENCY];

int ambulanceCount = 0;
int emergencyCount = 0;

void addAmbulance()
{
    if (ambulanceCount >= MAX_AMBULANCE)
    {
        cout << "Ambulance limit reached.\n";
        return;
    }

    int id;
    string location;
    string status;

    cout << "Enter Ambulance ID: ";
    cin >> id;

    for (int i = 0; i < ambulanceCount; i++)
    {
        if (ambulances[i].getId() == id)
        {
            cout << "Ambulance ID already exists.\n";
            return;
        }
    }

    cout << "Enter Location: ";
    cin >> location;

    cout << "Enter Status (AVAILABLE/BUSY): ";
    cin >> status;

    if (status != "AVAILABLE" && status != "BUSY")
    {
        cout << "Invalid status.\n";
        return;
    }

    ambulances[ambulanceCount] = Ambulance(id, location, status);
    ambulanceCount++;

    cout << "Ambulance added successfully.\n";
}

void viewAmbulances()
{
    if (ambulanceCount == 0)
    {
        cout << "No ambulances available.\n";
        return;
    }

    cout << "\n===== AMBULANCE LIST =====\n";

    for (int i = 0; i < ambulanceCount; i++)
        ambulances[i].display();
}

int findAvailableAmbulance()
{
    for (int i = 0; i < ambulanceCount; i++)
    {
        if (ambulances[i].getStatus() == "AVAILABLE")
            return i;
    }

    return -1;
}

void assignAmbulance()
{
    int emergencyId;

    cout << "Enter Emergency ID: ";
    cin >> emergencyId;

    int eIndex = -1;

    for (int i = 0; i < emergencyCount; i++)
    {
        if (emergencies[i].getId() == emergencyId)
        {
            eIndex = i;
            break;
        }
    }

    if (eIndex == -1)
    {
        cout << "Invalid Emergency ID.\n";
        return;
    }

    int aIndex = findAvailableAmbulance();

    if (aIndex == -1)
    {
        cout << "No ambulance available.\n";
        return;
    }

    ambulances[aIndex].setStatus("BUSY");
    emergencies[eIndex].setAmbulanceId(ambulances[aIndex].getId());
    emergencies[eIndex].setStatus("DISPATCHED");

    cout << "\nAmbulance assigned successfully.\n";
    cout << "Ambulance ID : " << ambulances[aIndex].getId() << endl;
    cout << "Emergency ID : " << emergencies[eIndex].getId() << endl;
}

void releaseAmbulance()
{
    int id;

    cout << "Enter Ambulance ID: ";
    cin >> id;

    for (int i = 0; i < ambulanceCount; i++)
    {
        if (ambulances[i].getId() == id)
        {
            if (ambulances[i].getStatus() == "AVAILABLE")
            {
                cout << "Ambulance is already available.\n";
                return;
            }

            ambulances[i].setStatus("AVAILABLE");
            cout << "Ambulance released successfully.\n";
            return;
        }
    }

    cout << "Invalid Ambulance ID.\n";
}

void addEmergency()
{
    if (emergencyCount >= MAX_EMERGENCY)
    {
        cout << "Emergency limit reached.\n";
        return;
    }

    int id;
    string type;
    string location;
    int severity;

    cout << "Enter Emergency ID: ";
    cin >> id;

    for (int i = 0; i < emergencyCount; i++)
    {
        if (emergencies[i].getId() == id)
        {
            cout << "Emergency ID already exists.\n";
            return;
        }
    }

    cout << "Enter Emergency Type: ";
    cin >> type;

    cout << "Enter Location: ";
    cin >> location;

    cout << "Enter Severity (1-5): ";
    cin >> severity;

    if (severity < 1 || severity > 5)
    {
        cout << "Invalid severity. Enter 1 to 5.\n";
        return;
    }

    emergencies[emergencyCount] = Emergency(id, type, location, severity);
    emergencyCount++;

    cout << "Emergency registered successfully.\n";
}

void viewEmergencies()
{
    if (emergencyCount == 0)
    {
        cout << "No emergencies registered.\n";
        return;
    }

    cout << "\n===== EMERGENCY LIST =====\n";

    for (int i = 0; i < emergencyCount; i++)
        emergencies[i].display();
}

void updateStatus()
{
    int id;
    string newStatus;

    cout << "Enter Emergency ID: ";
    cin >> id;

    for (int i = 0; i < emergencyCount; i++)
    {
        if (emergencies[i].getId() == id)
        {
            cout << "Enter New Status:\n";
            cout << "DISPATCHED / ON_THE_WAY / ARRIVED / RESOLVED / CANCELLED\n";
            cout << "Enter status: ";
            cin >> newStatus;

            if (newStatus != "DISPATCHED" &&
                newStatus != "ON_THE_WAY" &&
                newStatus != "ARRIVED" &&
                newStatus != "RESOLVED" &&
                newStatus != "CANCELLED")
            {
                cout << "Invalid status.\n";
                return;
            }

            emergencies[i].setStatus(newStatus);
            cout << "Emergency status updated.\n";
            return;
        }
    }

    cout << "Invalid Emergency ID.\n";
}

void dispatchSummary()
{
    int id;

    cout << "Enter Emergency ID: ";
    cin >> id;

    for (int i = 0; i < emergencyCount; i++)
    {
        if (emergencies[i].getId() == id)
        {
            cout << "\n===== DISPATCH SUMMARY =====\n";
            cout << "Emergency ID : " << emergencies[i].getId() << endl;
            cout << "Type         : " << emergencies[i].getType() << endl;
            cout << "Location     : " << emergencies[i].getLocation() << endl;
            cout << "Severity     : " << emergencies[i].getSeverity() << endl;
            cout << "Status       : " << emergencies[i].getStatus() << endl;
            cout << "Ambulance ID : " << emergencies[i].getAmbulanceId() << endl;
            return;
        }
    }

    cout << "Invalid Emergency ID.\n";
}

int main()
{
    int choice;

    ambulances[0] = Ambulance(101, "LocationA", "AVAILABLE");
    ambulances[1] = Ambulance(102, "LocationB", "BUSY");
    ambulances[2] = Ambulance(103, "LocationC", "AVAILABLE");
    ambulanceCount = 3;

    do
    {
        cout << "\n\n====================================\n";
        cout << " SMART EMERGENCY RESPONSE SYSTEM\n";
        cout << "====================================\n";
        cout << "1. Add Ambulance\n";
        cout << "2. View Ambulances\n";
        cout << "3. Find Available Ambulance\n";
        cout << "4. Add Emergency\n";
        cout << "5. View Emergencies\n";
        cout << "6. Assign Ambulance\n";
        cout << "7. Release Ambulance\n";
        cout << "8. Update Emergency Status\n";
        cout << "9. Dispatch Summary\n";
        cout << "10. Exit\n";

        cout << "\nEnter choice: ";
        cin >> choice;

        switch (choice)
        {
        case 1:
            addAmbulance();
            break;

        case 2:
            viewAmbulances();
            break;

        case 3:
        {
            int index = findAvailableAmbulance();

            if (index == -1)
                cout << "No ambulance available.\n";
            else
                cout << "Available Ambulance: "
                     << ambulances[index].getId() << endl;

            break;
        }

        case 4:
            addEmergency();
            break;

        case 5:
            viewEmergencies();
            break;

        case 6:
            assignAmbulance();
            break;

        case 7:
            releaseAmbulance();
            break;

        case 8:
            updateStatus();
            break;

        case 9:
            dispatchSummary();
            break;

        case 10:
            cout << "Program ended.\n";
            break;

        default:
            cout << "Invalid menu choice.\n";
        }

    } while (choice != 10);

    return 0;
}
