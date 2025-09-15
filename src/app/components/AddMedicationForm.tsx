"use client";

import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";  // Assuming this provides apiKey

interface AddMedicationFormProps {
  patientId: string;
  onSuccess: () => void;
}

export default function AddMedicationForm({ patientId, onSuccess }: AddMedicationFormProps) {
  const { apiKey } = useContext(AuthContext);  // Get apiKey from context
  const [formData, setFormData] = useState({
    status: 'active',
    medicationText: '',
    medicationCode: '',
    medicationSystem: 'RxNorm',
    startDate: '',
    endDate: '',
    dosageRouteText: '',
    dosageRouteCode: '',
    dosageRouteSystem: 'FDA RouteOfAdministration',
    dosageValue: '',
  });
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        resourceType: "MedicationStatement",
        status: formData.status,
        subject: {
          reference: `Patient/${patientId}`,
        },
        medicationCodeableConcept: {
          coding: [{
            system: formData.medicationSystem,
            code: formData.medicationCode,
            display: formData.medicationText
          }],
          text: formData.medicationText
        },
        effectivePeriod: formData.startDate || formData.endDate ? {
          start: formData.startDate || undefined,
          end: formData.endDate || undefined
        } : undefined,
        dosage: formData.dosageRouteText || formData.dosageValue ? [{
          route: {
            coding: formData.dosageRouteCode ? [{
              system: formData.dosageRouteSystem,
              code: formData.dosageRouteCode,
              display: formData.dosageRouteText
            }] : undefined,
            text: formData.dosageRouteText || undefined
          },
          doseAndRate: formData.dosageValue ? [{
            doseQuantity: {
              value: parseFloat(formData.dosageValue) || undefined
            }
          }] : undefined
        }] : undefined
      };

      const response = await fetch('/api/patients/medicatstatements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      console.log(response);
      

      // Read body ONLY ONCE as text
      const responseBody = await response.text();
      if (!response.ok) {
        let errorMessage;
        try {
          errorMessage = JSON.parse(responseBody);  // Parse from stored text
        } catch {
          errorMessage = responseBody;  // Fallback to raw text
        }
        if (response.status === 405) {
          throw new Error("Method Not Allowed: Please verify the API endpoint configuration.");
        }
        throw new Error(JSON.stringify(errorMessage) || 'Failed to add medication');
      }

      // Parse successful response from stored text
      let data;
      try {
        data = JSON.parse(responseBody);
      } catch {
        throw new Error("Invalid JSON response from server");
      }

      // Reset form
      setFormData({
        status: 'active',
        medicationText: '',
        medicationCode: '',
        medicationSystem: 'RxNorm',
        startDate: '',
        endDate: '',
        dosageRouteText: '',
        dosageRouteCode: '',
        dosageRouteSystem: 'FDA RouteOfAdministration',
        dosageValue: '',
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "An error occurred while adding the medication.");
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Add New Medication</h3>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Status *</label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="entered-in-error">Entered in Error</option>
            <option value="intended">Intended</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Medication Name *</label>
          <input 
            type="text" 
            name="medicationText" 
            value={formData.medicationText} 
            onChange={handleInputChange} 
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">RxNorm Code *</label>
          <input 
            type="text" 
            name="medicationCode" 
            value={formData.medicationCode} 
            onChange={handleInputChange} 
            required
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Start Date</label>
          <input 
            type="date" 
            name="startDate" 
            value={formData.startDate} 
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">End Date</label>
          <input 
            type="date" 
            name="endDate" 
            value={formData.endDate} 
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Dosage Route</label>
          <input 
            type="text" 
            name="dosageRouteText" 
            value={formData.dosageRouteText} 
            onChange={handleInputChange}
            placeholder="e.g., ORAL"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Dosage Route Code</label>
          <input 
            type="text" 
            name="dosageRouteCode" 
            value={formData.dosageRouteCode} 
            onChange={handleInputChange}
            placeholder="e.g., C38288"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Dosage Value</label>
          <input 
            type="number" 
            name="dosageValue" 
            value={formData.dosageValue} 
            onChange={handleInputChange}
            placeholder="e.g., 325"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            type="button" 
            onClick={() => onSuccess()}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add Medication
          </button>
        </div>
      </form>
    </div>
  );
}
