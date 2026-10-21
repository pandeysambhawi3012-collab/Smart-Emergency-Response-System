#include "SeverityCalculator.h"

int SeverityCalculator::calculatePeopleScore(int peopleAffected)
{
    if (peopleAffected <= 0)
    {
        return 0;
    }
    else if (peopleAffected == 1)
    {
        return 5;
    }
    else if (peopleAffected <= 3)
    {
        return 10;
    }
    else if (peopleAffected <= 6)
    {
        return 15;
    }
    else if (peopleAffected <= 10)
    {
        return 20;
    }
    else
    {
        return 30;
    }
}


int SeverityCalculator::calculateInjuryScore(int injurySeverity)
{
    if (injurySeverity <= 0)
    {
        return 0;
    }
    else if (injurySeverity <= 2)
    {
        return 5;
    }
    else if (injurySeverity <= 4)
    {
        return 10;
    }
    else if (injurySeverity <= 6)
    {
        return 15;
    }
    else if (injurySeverity <= 8)
    {
        return 20;
    }
    else
    {
        return 25;
    }
}


int SeverityCalculator::calculateRiskScore(int riskLevel)
{
    if (riskLevel <= 0)
    {
        return 0;
    }
    else if (riskLevel <= 2)
    {
        return 5;
    }
    else if (riskLevel <= 4)
    {
        return 10;
    }
    else if (riskLevel <= 6)
    {
        return 15;
    }
    else if (riskLevel <= 8)
    {
        return 20;
    }
    else
    {
        return 25;
    }
}


int SeverityCalculator::calculateTypeScore(EmergencyType type)
{
    switch (type)
    {
        case EmergencyType::Accident:
            return 15;

        case EmergencyType::Fire:
            return 20;

        case EmergencyType::Medical:
            return 15;

        case EmergencyType::NaturalDisaster:
            return 20;

        case EmergencyType::Crime:
            return 15;

        case EmergencyType::Other:
            return 10;

        default:
            return 0;
    }
}

int SeverityCalculator::calculateScore(const Emergency& emergency)
{
    int peopleScore =
        calculatePeopleScore(emergency.getPeopleAffected());

    int injuryScore =
        calculateInjuryScore(emergency.getInjurySeverity());

    int riskScore =
        calculateRiskScore(emergency.getRiskLevel());

    int typeScore =
        calculateTypeScore(emergency.getType());

    int totalScore =
        peopleScore +
        injuryScore +
        riskScore +
        typeScore;

    return totalScore;
}

std::string SeverityCalculator::classifySeverity(int score)
{
    if (score <= 30)
    {
        return "Low";
    }
    else if (score <= 60)
    {
        return "Medium";
    }
    else if (score <= 80)
    {
        return "High";
    }
    else
    {
        return "Critical";
    }
}