export interface ReleaseFormData {
    riskLevel: string;
    type: string;
    versionType: string;
    changeNumber: string;
    systemName: string;
    scheduledTime: {
        date: Date | null;
        time: Date | null;
    };
    primarySystemCode: string;
    secondarySystemCode: string;
    changeSubject: string;
    versionTypes: Record<string, boolean>;
    requestNumbers: string[];
    deliverables: Record<string, boolean>;
    others: string;
    department: string;
    division: string;
    projectPath: string;
    affectedSystems: string;
    impactAreas: string;
    applicant: {
        employeeId: string;
        extension: string;
    };
}

