"use client";

import React from "react";

interface PatientName {
  family?: string;
  given?: string[];
}

interface PatientResource {
  resourceType: string;
  id: string;
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
  maritalStatus?: {
    text?: string;
  };
}

interface PatientModalProps {
  patient: PatientResource;
  onClose: () => void;
}

const PatientModal: React.FC<PatientModalProps> = ({ patient, onClose }) => {
  return (
    <>
      {/* Background overlay with blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4" // added p-4 for small screens
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking modal
      >
        <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-8 w-full max-w-lg relative border border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-slate-500 hover:text-slate-900 text-xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">
            Patient Details
          </h2>
          <dl className="space-y-2">
            <div>
              <dt className="inline font-medium text-slate-500">Name: </dt>
              <dd className="inline">
                {patient.name
                  ? `${patient.name[0]?.given?.join(" ")} ${
                      patient.name[0]?.family
                    }`
                  : "Unnamed"}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">ID: </dt>
              <dd className="inline">{patient.id}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">Gender: </dt>
              <dd className="inline">{patient.gender ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">
                Birth Date:{" "}
              </dt>
              <dd className="inline">{patient.birthDate ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">Active: </dt>
              <dd className="inline">{patient.active ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">Contact: </dt>
              <dd className="inline">
                {patient.telecom?.map((t, idx) => (
                  <span key={idx}>
                    {t.system}: {t.value} <br />
                  </span>
                )) || "None"}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">Address: </dt>
              <dd className="inline">
                {patient.address?.map((addr, i) => (
                  <span key={i}>
                    {[
                      ...(addr.line || []),
                      addr.city,
                      addr.state,
                      addr.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    <br />
                  </span>
                )) || "None"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
};

export default PatientModal;
