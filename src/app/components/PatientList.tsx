"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";

interface PatientName {
  family?: string;
  given?: string[];
}

interface FhirExtension {
  url: string;
  valueString?: string;
  extension?: FhirExtension[];
}

interface PatientResource {
  resourceType: string;
  id: string;
  meta?: {
    lastUpdated?: string;
  };
  extension?: {
    url: string;
    extension?: {
      url: string;
      valueString?: string;
    }[];
    valueString?: string;
  }[];
  identifier?: {
    system?: string;
    value?: string;
    use?: string;
  }[];
  name?: PatientName[];
  gender?: string;
  birthDate?: string;
  telecom?: { system: string; value: string; use?: string }[];
  address?: {
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  }[];
  active?: boolean;
  deceasedBoolean?: boolean;
  maritalStatus?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  };
}

interface AllergyIntolerance {
  resourceType: string;
  id: string;
  meta?: {
    lastUpdated?: string;
  };
  patient: {
    reference: string;
  };
  substance?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  };
  category?: string[];
  criticality?: string;
  type?: string;
  status?: string;
  verificationStatus?: string;
  reaction?: {
    manifestation?: {
      coding?: {
        system?: string;
        code?: string;
        display?: string;
      }[];
      text?: string;
    }[];
    severity?: string;
  }[];
  recordedDate?: string;
  note?: {
    text?: string;
  }[];
}

interface Condition {
  resourceType: string;
  id: string;
  meta?: {
    lastUpdated?: string;
  };
  patient: {
    reference: string;
  };
  code?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  };
  category?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  }[];
  clinicalStatus?: string;
  verificationStatus?: string;
  severity?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  };
  onsetDateTime?: string;
  recordedDate?: string;
  note?: {
    text?: string;
  }[];
}

interface Medication {
  resourceType: string;
  id: string;
  meta?: {
    lastUpdated?: string;
  };
  patient: {
    reference: string;
  };
  medicationCodeableConcept?: {
    coding?: {
      system?: string;
      code?: string;
      display?: string;
    }[];
    text?: string;
  };
  status?: string;
  authoredOn?: string;
  note?: {
    text?: string;
  }[];
}

interface PatientBundle {
  resourceType: string;
  total: number;
  entry: {
    fullUrl: string;
    resource: PatientResource;
  }[];
}

interface AllergyBundle {
  resourceType: string;
  total: number;
  entry?: {
    fullUrl: string;
    resource: AllergyIntolerance;
  }[];
}

interface ConditionBundle {
  resourceType: string;
  total: number;
  entry?: {
    fullUrl: string;
    resource: Condition;
  }[];
}

interface MedicationBundle {
  resourceType: string;
  total: number;
  entry?: {
    fullUrl: string;
    resource: Medication;
  }[];
}

export default function PatientList() {
  const [patients, setPatients] = useState<PatientResource[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<{
    [key: string]: PatientResource;
  }>({});
  const [patientAllergies, setPatientAllergies] = useState<{
    [key: string]: AllergyIntolerance[];
  }>({});
  const [patientConditions, setPatientConditions] = useState<{
    [key: string]: Condition[];
  }>({});
  const [patientMedications, setPatientMedications] = useState<{
    [key: string]: Medication[];
  }>({});
  const [loadingDetails, setLoadingDetails] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingAllergies, setLoadingAllergies] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingConditions, setLoadingConditions] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingMedications, setLoadingMedications] = useState<{
    [key: string]: boolean;
  }>({});
  const [detailsErrors, setDetailsErrors] = useState<{ [key: string]: string }>(
    {}
  );
  const [allergiesErrors, setAllergiesErrors] = useState<{
    [key: string]: string;
  }>({});
  const [conditionsErrors, setConditionsErrors] = useState<{
    [key: string]: string;
  }>({});
  const [medicationsErrors, setMedicationsErrors] = useState<{
    [key: string]: string;
  }>({});
  const router = useRouter();

  useEffect(() => {
    async function fetchPatients() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/patients", { credentials: "include" });

        if (!res.ok) {
          setError("Failed to fetch patients.");
          setPatients([]);
          setTotalPatients(0);
          return;
        }

        const data: PatientBundle = await res.json();
        setTotalPatients(data.total || 0);
        setPatients(data.entry?.map((e) => e.resource) || []);
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching patients.");
        setTotalPatients(0);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  const fetchPatientDetails = async (id: string) => {
    if (patientDetails[id]) return; // Already fetched

    setLoadingDetails((prev) => ({ ...prev, [id]: true }));
    setDetailsErrors((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetch(`/api/patients/${id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setDetailsErrors((prev) => ({
          ...prev,
          [id]: "Failed to fetch patient details.",
        }));
        return;
      }
      const data: PatientResource = await res.json();
      setPatientDetails((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error(err);
      setDetailsErrors((prev) => ({
        ...prev,
        [id]: "An error occurred while fetching patient details.",
      }));
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [id]: false }));
    }
  };

  const fetchPatientAllergies = async (id: string) => {
    if (patientAllergies[id]) return; // Already fetched

    setLoadingAllergies((prev) => ({ ...prev, [id]: true }));
    setAllergiesErrors((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetch(`/api/patients/${id}/allergies`, {
        credentials: "include",
      });
      if (!res.ok) {
        setAllergiesErrors((prev) => ({
          ...prev,
          [id]: "Failed to fetch allergies.",
        }));
        return;
      }
      const data: AllergyBundle = await res.json();
      setPatientAllergies((prev) => ({
        ...prev,
        [id]: data.entry?.map((e) => e.resource) || [],
      }));
    } catch (err) {
      console.error(err);
      setAllergiesErrors((prev) => ({
        ...prev,
        [id]: "An error occurred while fetching allergies.",
      }));
    } finally {
      setLoadingAllergies((prev) => ({ ...prev, [id]: false }));
    }
  };

  const fetchPatientConditions = async (id: string) => {
    if (patientConditions[id]) return; // Already fetched

    setLoadingConditions((prev) => ({ ...prev, [id]: true }));
    setConditionsErrors((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetch(`/api/patients/${id}/conditions`, {
        credentials: "include",
      });
      if (!res.ok) {
        setConditionsErrors((prev) => ({
          ...prev,
          [id]: "Failed to fetch conditions.",
        }));
        return;
      }
      const data: ConditionBundle = await res.json();
      setPatientConditions((prev) => ({
        ...prev,
        [id]: data.entry?.map((e) => e.resource) || [],
      }));
    } catch (err) {
      console.error(err);
      setConditionsErrors((prev) => ({
        ...prev,
        [id]: "An error occurred while fetching conditions.",
      }));
    } finally {
      setLoadingConditions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const fetchPatientMedications = async (id: string) => {
    if (patientMedications[id]) return; // Already fetched

    setLoadingMedications((prev) => ({ ...prev, [id]: true }));
    setMedicationsErrors((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetch(`/api/patients/${id}/medications`, {
        credentials: "include",
      });
      if (!res.ok) {
        setMedicationsErrors((prev) => ({
          ...prev,
          [id]: "Failed to fetch medications.",
        }));
        return;
      }
      const data: MedicationBundle = await res.json();
      setPatientMedications((prev) => ({
        ...prev,
        [id]: data.entry?.map((e) => e.resource) || [],
      }));
    } catch (err) {
      console.error(err);
      setMedicationsErrors((prev) => ({
        ...prev,
        [id]: "An error occurred while fetching medications.",
      }));
    } finally {
      setLoadingMedications((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePatientToggle = (patientId: string) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
      fetchPatientDetails(patientId);
      fetchPatientAllergies(patientId);
      fetchPatientConditions(patientId);
      fetchPatientMedications(patientId);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "N/A";
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }
      return `${age} years`;
    } catch {
      return "N/A";
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case "male":
        return (
          <div className="flex items-center space-x-1 text-blue-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14 2a1 1 0 011 1v2.586l1.707-1.707a1 1 0 111.414 1.414L16.414 6.414A1 1 0 0116 7v2a1 1 0 01-2 0V7.414l-1.707 1.707a1 1 0 01-1.414-1.414L12.586 6H11a1 1 0 010-2h2V3a1 1 0 011-1zM2 10a6 6 0 1112 0 6 6 0 01-12 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Male</span>
          </div>
        );
      case "female":
        return (
          <div className="flex items-center space-x-1 text-pink-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14 10a6 6 0 11-12 0 6 6 0 0112 0zM8 14a1 1 0 011-1h2a1 1 0 110 2v2a1 1 0 11-2 0v-2a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Female</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1 text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">Unknown</span>
          </div>
        );
    }
  };

  const getStatusBadge = (active: boolean, deceased?: boolean) => {
    if (deceased) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Deceased
        </span>
      );
    }
    return active ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const getEthnicityFromExtensions = (
    extensions?: FhirExtension[]
  ): string | null => {
    if (!extensions) return null;

    const ethnicityExt = extensions.find(
      (ext) =>
        ext.url ===
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity"
    );

    if (ethnicityExt?.extension) {
      const textExt = ethnicityExt.extension.find((e) => e.url === "text");
      return textExt?.valueString || null;
    }

    return null;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Mild
          </span>
        );
      case "moderate":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Moderate
          </span>
        );
      case "severe":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Severe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {severity || "Unknown"}
          </span>
        );
    }
  };

  const getCriticalityBadge = (criticality: string) => {
    switch (criticality?.toLowerCase()) {
      case "low":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Low Risk
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            High Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {criticality || "Unknown"}
          </span>
        );
    }
  };

  const renderPatientDetails = (patientId: string) => {
    const patient = patientDetails[patientId];
    const allergies = patientAllergies[patientId] || [];
    const conditions = patientConditions[patientId] || [];
    const medications = patientMedications[patientId] || [];
    const isLoadingDetails = loadingDetails[patientId];
    const isLoadingAllergies = loadingAllergies[patientId];
    const isLoadingConditions = loadingConditions[patientId];
    const isLoadingMedications = loadingMedications[patientId];
    const detailsError = detailsErrors[patientId];
    const allergiesError = allergiesErrors[patientId];
    const conditionsError = conditionsErrors[patientId];
    const medicationsError = medicationsErrors[patientId];

    const isLoading =
      isLoadingDetails ||
      isLoadingAllergies ||
      isLoadingConditions ||
      isLoadingMedications;

    if (isLoading) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-slate-600 font-medium">
                  Loading patient information...
                </span>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    if (detailsError || allergiesError || conditionsError || medicationsError) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  {detailsError && (
                    <p className="text-red-700 font-medium">{detailsError}</p>
                  )}
                  {allergiesError && (
                    <p className="text-red-700 font-medium">{allergiesError}</p>
                  )}
                  {conditionsError && (
                    <p className="text-red-700 font-medium">
                      {conditionsError}
                    </p>
                  )}
                  {medicationsError && (
                    <p className="text-red-700 font-medium">
                      {medicationsError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    if (!patient) return null;

    return (
      <tr>
        <td colSpan={7} className="px-6 py-6 bg-slate-50/50">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Personal Information
                </h4>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Full Name
                  </label>
                  <p className="text-base text-slate-900 mt-1">
                    {patient.name
                      ? `${patient.name[0].given?.join(" ") || ""} ${
                          patient.name[0].family || ""
                        }`.trim()
                      : "Unnamed Patient"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Patient ID
                  </label>
                  <p className="text-base font-mono text-slate-900 mt-1 bg-slate-100 px-2 py-1 rounded inline-block">
                    {patient.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Gender
                  </label>
                  <div className="mt-1">
                    {getGenderIcon(patient.gender || "")}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Age
                  </label>
                  <p className="text-base text-slate-900 mt-1">
                    {calculateAge(patient.birthDate || "")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Birth Date
                  </label>
                  <p className="text-base text-slate-900 mt-1">
                    {formatDate(patient.birthDate || "")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(
                      patient.active !== false,
                      patient.deceasedBoolean
                    )}
                  </div>
                </div>
              </div>

              {/* Demographics & Identifiers */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Demographics
                </h4>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Marital Status
                  </label>
                  <p className="text-base text-slate-900 mt-1">
                    {patient.maritalStatus?.text || "Status Unknown"}
                  </p>
                </div>
                {getEthnicityFromExtensions(patient.extension) && (
                  <div>
                    <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                      Ethnicity
                    </label>
                    <p className="text-base text-slate-900 mt-1">
                      {getEthnicityFromExtensions(patient.extension)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Identifiers
                  </label>
                  <div className="space-y-2 mt-2">
                    {patient.identifier?.map((identifier, index) => (
                      <div key={index} className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-900 font-mono">
                          {identifier.value}
                        </div>
                        {identifier.system && (
                          <div className="text-xs text-slate-500 mt-1">
                            {identifier.system}
                          </div>
                        )}
                      </div>
                    ))}
                    {!patient.identifier?.length && (
                      <p className="text-sm text-slate-400 italic">
                        No identifiers available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  Contact & Address
                </h4>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Contact
                  </label>
                  <div className="space-y-2 mt-2">
                    {patient.telecom?.map((contact, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg"
                      >
                        {contact.system === "phone" && (
                          <svg
                            className="w-4 h-4 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        )}
                        {contact.system === "email" && (
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                        <div>
                          <span className="text-sm text-slate-900">
                            {contact.value}
                          </span>
                          <span className="text-xs text-slate-500 block">
                            {contact.system} {contact.use && `(${contact.use})`}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!patient.telecom?.length && (
                      <p className="text-sm text-slate-400 italic">
                        No contact info
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                    Address
                  </label>
                  <div className="space-y-2 mt-2">
                    {patient.address?.map((addr, index) => (
                      <div key={index} className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-900">
                          {addr.line?.join(", ")}
                          {addr.line && addr.line.length > 0 && <br />}
                          {addr.city && `${addr.city}`}
                          {addr.state && `, ${addr.state}`}
                          {addr.postalCode && ` ${addr.postalCode}`}
                        </div>
                        {addr.use && (
                          <span className="text-xs text-slate-500">
                            {addr.use} address
                          </span>
                        )}
                      </div>
                    ))}
                    {!patient.address?.length && (
                      <p className="text-sm text-slate-400 italic">
                        No address info
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Allergies ({allergies.length})
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {allergies.map((allergy, index) => (
                    <div
                      key={allergy.id || index}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-semibold text-red-900">
                          {allergy.substance?.text ||
                            allergy.substance?.coding?.[0]?.display ||
                            "Unknown Substance"}
                        </h5>
                        <div className="flex space-x-1">
                          {allergy.criticality &&
                            getCriticalityBadge(allergy.criticality)}
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        {allergy.type && (
                          <div>
                            <strong>Type:</strong> {allergy.type}
                          </div>
                        )}
                        {allergy.category && (
                          <div>
                            <strong>Category:</strong>{" "}
                            {allergy.category.join(", ")}
                          </div>
                        )}
                        {allergy.status && (
                          <div>
                            <strong>Status:</strong> {allergy.status}
                          </div>
                        )}
                        {allergy.verificationStatus && (
                          <div>
                            <strong>Verification:</strong>{" "}
                            {allergy.verificationStatus}
                          </div>
                        )}
                        {allergy.recordedDate && (
                          <div>
                            <strong>Recorded:</strong>{" "}
                            {formatDate(allergy.recordedDate)}
                          </div>
                        )}
                      </div>
                      {allergy.reaction && allergy.reaction.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-300">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Reactions:
                          </div>
                          {allergy.reaction.map((reaction, reactionIndex) => (
                            <div
                              key={reactionIndex}
                              className="flex items-center justify-between"
                            >
                              <span className="text-xs text-slate-600">
                                {reaction.manifestation?.[0]?.text ||
                                  reaction.manifestation?.[0]?.coding?.[0]
                                    ?.display ||
                                  "Reaction"}
                              </span>
                              {reaction.severity &&
                                getSeverityBadge(reaction.severity)}
                            </div>
                          ))}
                        </div>
                      )}
                      {allergy.note && allergy.note.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-300">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Notes:
                          </div>
                          {allergy.note.map((note, noteIndex) => (
                            <div
                              key={noteIndex}
                              className="text-xs text-slate-600"
                            >
                              {note.text || "No note text"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {!allergies.length && (
                    <p className="text-sm text-slate-400 italic">
                      No allergies recorded
                    </p>
                  )}
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"
                    />
                  </svg>
                  Conditions ({conditions.length})
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {conditions.map((condition, index) => (
                    <div
                      key={condition.id || index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-semibold text-yellow-900">
                          {condition.code?.text ||
                            condition.code?.coding?.[0]?.display ||
                            "Unknown Condition"}
                        </h5>
                        <div className="flex space-x-1">
                          {condition.severity?.text &&
                            getSeverityBadge(condition.severity.text)}
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        {condition.category && (
                          <div>
                            <strong>Category:</strong>{" "}
                            {condition.category
                              .map(
                                (cat) => cat.text || cat.coding?.[0]?.display
                              )
                              .join(", ")}
                          </div>
                        )}
                        {condition.clinicalStatus && (
                          <div>
                            <strong>Clinical Status:</strong>{" "}
                            {condition.clinicalStatus}
                          </div>
                        )}
                        {condition.verificationStatus && (
                          <div>
                            <strong>Verification Status:</strong>{" "}
                            {condition.verificationStatus}
                          </div>
                        )}
                        {condition.onsetDateTime && (
                          <div>
                            <strong>Onset:</strong>{" "}
                            {formatDate(condition.onsetDateTime)}
                          </div>
                        )}
                        {condition.recordedDate && (
                          <div>
                            <strong>Recorded:</strong>{" "}
                            {formatDate(condition.recordedDate)}
                          </div>
                        )}
                      </div>
                      {condition.note && condition.note.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-yellow-300">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Notes:
                          </div>
                          {condition.note.map((note, noteIndex) => (
                            <div
                              key={noteIndex}
                              className="text-xs text-slate-600"
                            >
                              {note.text || "No note text"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {!conditions.length && (
                    <p className="text-sm text-slate-400 italic">
                      No conditions recorded
                    </p>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Medications ({medications.length})
                </h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {medications.map((med, index) => (
                    <div
                      key={med.id || index}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-semibold text-green-900">
                          {med.medicationCodeableConcept?.text ||
                            med.medicationCodeableConcept?.coding?.[0]
                              ?.display ||
                            "Unknown Medication"}
                        </h5>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        {med.status && (
                          <div>
                            <strong>Status:</strong> {med.status}
                          </div>
                        )}
                        {med.authoredOn && (
                          <div>
                            <strong>Authored On:</strong>{" "}
                            {formatDate(med.authoredOn)}
                          </div>
                        )}
                      </div>
                      {med.note && med.note.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-300">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Notes:
                          </div>
                          {med.note.map((note, noteIndex) => (
                            <div
                              key={noteIndex}
                              className="text-xs text-slate-600"
                            >
                              {note.text || "No note text"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {!medications.length && (
                    <p className="text-sm text-slate-400 italic">
                      No medications recorded
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Patient List</h1>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-slate-600 font-medium">
              Loading patients...
            </span>
          </div>
        </div>
      )}
      {!loading && patients.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-slate-600 text-lg">No patients found.</p>
        </div>
      )}
      {!loading && patients.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {patients.length} of {totalPatients} patients
            </p>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Patient ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Gender
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Age
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Last Updated
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {patients.map((patient) => (
                <React.Fragment key={patient.id}>
                  <tr
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handlePatientToggle(patient.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {patient.name
                          ? `${patient.name[0].given?.join(" ") || ""} ${
                              patient.name[0].family || ""
                            }`.trim()
                          : "Unnamed Patient"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-600">
                        {patient.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getGenderIcon(patient.gender || "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {calculateAge(patient.birthDate || "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(
                        patient.active !== false,
                        patient.deceasedBoolean
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(patient.meta?.lastUpdated || "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientToggle(patient.id);
                        }}
                      >
                        {expandedPatient === patient.id ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(
                            openMenu === patient.id ? null : patient.id
                          );
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                      {openMenu === patient.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/patients/${patient.id}`);
                              setOpenMenu(null);
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedPatient === patient.id &&
                    renderPatientDetails(patient.id)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
