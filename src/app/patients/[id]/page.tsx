"use client";

import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useParams, useRouter } from 'next/navigation';
import AddMedicationForm from "@/app/components/AddMedicationForm";

interface PatientName {
  family?: string;
  given?: string[];
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

export default function PatientPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { apiKey } = useContext(AuthContext);
  const [patient, setPatient] = useState<PatientResource | null>(null);
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function fetchPatientData() {
      setLoading(true);
      setError("");
      try {
        // Fetch patient details
        const patientRes = await fetch(`/api/patients/${id}`, { credentials: "include" });
        if (!patientRes.ok) {
          throw new Error("Failed to fetch patient details.");
        }
        const patientData: PatientResource = await patientRes.json();
        setPatient(patientData);

        // Fetch allergies
        const allergiesRes = await fetch(`/api/patients/${id}/allergies`, { credentials: "include" });
        if (!allergiesRes.ok) {
          throw new Error("Failed to fetch allergies.");
        }
        const allergiesData: AllergyBundle = await allergiesRes.json();
        setAllergies(allergiesData.entry?.map(e => e.resource) || []);

        // Fetch conditions
        const conditionsRes = await fetch(`/api/patients/${id}/conditions`, { credentials: "include" });
        if (!conditionsRes.ok) {
          throw new Error("Failed to fetch conditions.");
        }
        const conditionsData: ConditionBundle = await conditionsRes.json();
        setConditions(conditionsData.entry?.map(e => e.resource) || []);

        // Fetch medications
        const medicationsRes = await fetch(`/api/patients/${id}/medications`, { credentials: "include" });
        if (!medicationsRes.ok) {
          throw new Error("Failed to fetch medications.");
        }
        const medicationsData: MedicationBundle = await medicationsRes.json();
        setMedications(medicationsData.entry?.map(e => e.resource) || []);

      } catch (err) {
        setError((err as Error).message || "An error occurred while fetching patient data.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const handleMedicationAdded = async () => {
    try {
      const medicationsRes = await fetch(`/api/patients/${id}/medications`, { credentials: "include" });
      if (!medicationsRes.ok) {
        throw new Error("Failed to fetch updated medications.");
      }
      const medicationsData: MedicationBundle = await medicationsRes.json();
      setMedications(medicationsData.entry?.map(e => e.resource) || []);
      setShowAddForm(false);
    } catch (err) {
      setError((err as Error).message || "An error occurred while refreshing medications.");
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

  const getEthnicityFromExtensions = (extensions?: any[]) => {
    if (!extensions) return null;
    const ethnicityExt = extensions.find(ext => 
      ext.url === "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity"
    );
    if (ethnicityExt?.extension) {
      const textExt = ethnicityExt.extension.find((e: any) => e.url === "text");
      return textExt?.valueString;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-slate-600 font-medium">Loading patient data...</span>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700 font-medium">{error || "Patient not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Patient List
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex-grow">
          Patient Details: {patient.name ? `${patient.name[0].given?.join(" ") || ""} ${patient.name[0].family || ""}`.trim() : "Unnamed Patient"}
        </h1>
      </div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <div className={`transition-all duration-300 ${showAddForm ? 'blur-sm' : ''}`}>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Personal Information */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                Personal Information
              </h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Full Name</dt>
                  <dd className="text-base text-slate-900">
                    {patient.name
                      ? `${patient.name[0].given?.join(" ") || ""} ${patient.name[0].family || ""}`.trim()
                      : "Unnamed Patient"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Patient ID</dt>
                  <dd className="text-base font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block">
                    {patient.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Gender</dt>
                  <dd className="mt-1">{getGenderIcon(patient.gender || "")}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Age</dt>
                  <dd className="text-base text-slate-900">{calculateAge(patient.birthDate || "")}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Birth Date</dt>
                  <dd className="text-base text-slate-900">{formatDate(patient.birthDate || "")}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Status</dt>
                  <dd className="mt-1">{getStatusBadge(patient.active !== false, patient.deceasedBoolean)}</dd>
                </div>
              </dl>
            </div>

            {/* Demographics & Identifiers */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                Demographics
              </h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Marital Status</dt>
                  <dd className="text-base text-slate-900">
                    {patient.maritalStatus?.text || "Status Unknown"}
                  </dd>
                </div>
                {getEthnicityFromExtensions(patient.extension) && (
                  <div>
                    <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Ethnicity</dt>
                    <dd className="text-base text-slate-900">
                      {getEthnicityFromExtensions(patient.extension)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Identifiers</dt>
                  <dd className="mt-2 space-y-2">
                    {patient.identifier?.map((identifier, index) => (
                      <div key={index} className="p-2 bg-slate-50 rounded-lg text-sm">
                        <div className="font-mono text-slate-900">{identifier.value}</div>
                        {identifier.system && <div className="text-xs text-slate-500">{identifier.system}</div>}
                      </div>
                    ))}
                    {!patient.identifier?.length && <p className="text-sm text-slate-400 italic">No identifiers available</p>}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Contact & Address */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4">
                Contact & Address
              </h4>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Contact</dt>
                  <dd className="mt-2 space-y-2">
                    {patient.telecom?.map((contact, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg text-sm">
                        {contact.system === "phone" && (
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        )}
                        {contact.system === "email" && (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        <div>
                          <span className="text-slate-900">{contact.value}</span>
                          <span className="text-xs text-slate-500 block">{contact.system} {contact.use && `(${contact.use})`}</span>
                        </div>
                      </div>
                    ))}
                    {!patient.telecom?.length && <p className="text-sm text-slate-400 italic">No contact info</p>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-600 uppercase tracking-wider">Address</dt>
                  <dd className="mt-2 space-y-2">
                    {patient.address?.map((addr, index) => (
                      <div key={index} className="p-2 bg-slate-50 rounded-lg text-sm text-slate-900">
                        {addr.line?.join(", ")}
                        {addr.line && addr.line.length > 0 && <br />}
                        {addr.city && `${addr.city}, `}
                        {addr.state && `${addr.state} `}
                        {addr.postalCode && `${addr.postalCode}`}
                        {addr.use && <span className="text-xs text-slate-500 block">{addr.use} address</span>}
                      </div>
                    ))}
                    {!patient.address?.length && <p className="text-sm text-slate-400 italic">No address info</p>}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Allergies */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Allergies ({allergies.length})
              </h4>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {allergies.map((allergy, index) => (
                  <div key={allergy.id || index} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-red-900">
                        {allergy.substance?.text || allergy.substance?.coding?.[0]?.display || "Unknown Substance"}
                      </h5>
                      <div className="flex space-x-1">
                        {allergy.criticality && getCriticalityBadge(allergy.criticality)}
                      </div>
                    </div>
                    <dl className="space-y-1 text-xs text-slate-600">
                      {allergy.type && <div><strong>Type:</strong> {allergy.type}</div>}
                      {allergy.category && <div><strong>Category:</strong> {allergy.category.join(", ")}</div>}
                      {allergy.status && <div><strong>Status:</strong> {allergy.status}</div>}
                      {allergy.verificationStatus && <div><strong>Verification:</strong> {allergy.verificationStatus}</div>}
                      {allergy.recordedDate && <div><strong>Recorded:</strong> {formatDate(allergy.recordedDate)}</div>}
                    </dl>
                    {allergy.reaction && allergy.reaction.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-red-100">
                        <div className="text-xs font-medium text-slate-600 mb-1">Reactions:</div>
                        {allergy.reaction.map((reaction, rIndex) => (
                          <div key={rIndex} className="flex items-center justify-between text-xs text-slate-600">
                            <span>{reaction.manifestation?.[0]?.text || "Reaction"}</span>
                            {reaction.severity && getSeverityBadge(reaction.severity)}
                          </div>
                        ))}
                      </div>
                    )}
                    {allergy.note && allergy.note.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-red-100">
                        <div className="text-xs font-medium text-slate-600 mb-1">Notes:</div>
                        {allergy.note.map((note, nIndex) => (
                          <p key={nIndex} className="text-xs text-slate-600">{note.text}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!allergies.length && <p className="text-sm text-slate-400 italic">No allergies recorded</p>}
              </div>
            </div>

            {/* Conditions */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
                </svg>
                Conditions ({conditions.length})
              </h4>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {conditions.map((condition, index) => (
                  <div key={condition.id || index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-yellow-900">
                        {condition.code?.text || condition.code?.coding?.[0]?.display || "Unknown Condition"}
                      </h5>
                      {condition.severity?.text && getSeverityBadge(condition.severity.text)}
                    </div>
                    <dl className="space-y-1 text-xs text-slate-600">
                      {condition.category && (
                        <div><strong>Category:</strong> {condition.category.map(cat => cat.text || cat.coding?.[0]?.display).join(", ")}</div>
                      )}
                      {condition.clinicalStatus && <div><strong>Clinical Status:</strong> {condition.clinicalStatus}</div>}
                      {condition.verificationStatus && <div><strong>Verification:</strong> {condition.verificationStatus}</div>}
                      {condition.onsetDateTime && <div><strong>Onset:</strong> {formatDate(condition.onsetDateTime)}</div>}
                      {condition.recordedDate && <div><strong>Recorded:</strong> {formatDate(condition.recordedDate)}</div>}
                    </dl>
                    {condition.note && condition.note.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-yellow-100">
                        <div className="text-xs font-medium text-slate-600 mb-1">Notes:</div>
                        {condition.note.map((note, nIndex) => (
                          <p key={nIndex} className="text-xs text-slate-600">{note.text}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!conditions.length && <p className="text-sm text-slate-400 italic">No conditions recorded</p>}
              </div>
            </div>

            {/* Medications */}
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center flex-grow">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Medications ({medications.length})
                </h4>
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="ml-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {showAddForm ? 'Cancel' : 'Add'}
                </button>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {medications.map((med, index) => (
                  <div key={med.id || index} className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <h5 className="font-semibold text-green-900 mb-2">
                      {med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || "Unknown Medication"}
                    </h5>
                    <dl className="space-y-1 text-xs text-slate-600">
                      {med.status && <div><strong>Status:</strong> {med.status}</div>}
                      {med.authoredOn && <div><strong>Authored On:</strong> {formatDate(med.authoredOn)}</div>}
                    </dl>
                    {med.note && med.note.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-100">
                        <div className="text-xs font-medium text-slate-600 mb-1">Notes:</div>
                        {med.note.map((note, nIndex) => (
                          <p key={nIndex} className="text-xs text-slate-600">{note.text}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!medications.length && <p className="text-sm text-slate-400 italic">No medications recorded</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <AddMedicationForm patientId={id} onSuccess={handleMedicationAdded} />
          </div>
        </div>
      )}
    </div>
  );
}