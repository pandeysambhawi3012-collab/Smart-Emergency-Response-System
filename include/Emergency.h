#ifndef EMERGENCY_H
#define EMERGENCY_H

#include <string>

enum class EmergencyType
{
    Accident,
    Fire,
    Medical,
    NaturalDisaster,
    Crime,
    Other
};

enum class EmergencyStatus
{
    Reported,
    Pending,
    ResourceAssigned,
    InProgress,
    Resolved
};

class Emergency
{
private:

    int emergencyId;
    EmergencyType type;
    std::string location;

    int peopleAffected;
    int injurySeverity;
    int riskLevel;

    std::string timeReported;
    std::string requiredResource;

    int severityScore;
    std::string severityLevel;
    std::string priority;

    EmergencyStatus status;

public:

    // Default constructor
    Emergency();

    // Parameterized constructor
    Emergency(
        int id,
        EmergencyType emergencyType,
        const std::string& emergencyLocation,
        int affected,
        int injury,
        int risk,
        const std::string& time,
        const std::string& resource
    );

    // Getters
    int getEmergencyId() const;
    EmergencyType getType() const;
    std::string getLocation() const;

    int getPeopleAffected() const;
    int getInjurySeverity() const;
    int getRiskLevel() const;

    std::string getTimeReported() const;
    std::string getRequiredResource() const;

    int getSeverityScore() const;
    std::string getSeverityLevel() const;
    std::string getPriority() const;

    EmergencyStatus getStatus() const;

    // Setters
    void setSeverityScore(int score);
    void setSeverityLevel(const std::string& level);
    void setPriority(const std::string& priorityLevel);
    void setStatus(EmergencyStatus newStatus);

    // Display emergency information
    void display() const;
};

#endif