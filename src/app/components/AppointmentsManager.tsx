"use client";

import { useState, useEffect, useCallback } from "react";

interface Appointment {
  id: string;
  status: string;
  start: string;
  end: string;
  participant: Array<{
    actor: { reference: string; display?: string };
    status?: string;
  }>;
}

interface Slot {
  id: string;
  start: string;
  end: string;
}

interface Patient {
  id: string;
  name?: Array<{
    given?: string[];
    family?: string;
  }>;
}

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedProvider, setSelectedProvider] = useState("1");
  const [selectedPatient, setSelectedPatient] = useState("73337");
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    start: "",
    end: "",
    patientId: "73337",
    providerId: "1",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Record<string, Patient>>({});

  useEffect(() => {
    setNewAppointment((prev) => ({
      ...prev,
      patientId: selectedPatient,
      providerId: selectedProvider,
    }));
  }, [selectedPatient, selectedProvider]);

  const fetchPatients = async () => {
    const patientIds = ["73337", "73338"]; // Hardcoded known patient IDs
    const fetchedPatients: Record<string, Patient> = {};

    for (const id of patientIds) {
      try {
        const response = await fetch(`/api/patients/${id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          fetchedPatients[id] = data;
        }
      } catch (err) {
        console.error(`Failed to fetch patient ${id}:`, err);
      }
    }

    setPatients(fetchedPatients);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const getPatientDisplay = (id: string) => {
    const patient = patients[id];
    if (patient && patient.name && patient.name[0]) {
      const name = patient.name[0];
      return (
        `${name.given?.join(" ") || ""} ${name.family || ""}`.trim() ||
        `Patient ${id}`
      );
    }
    return `Patient ${id}`;
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      if (selectedPatient) queryParams.append("patient", selectedPatient);
      if (selectedDate) queryParams.append("date", selectedDate);
      if (selectedProvider) queryParams.append("provider", selectedProvider);

      const response = await fetch(
        `/api/appointments?${queryParams.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setAppointments(
        data.entry?.map((e: { resource: Appointment }) => e.resource) || []
      );
    } catch (err) {
      setError((err as Error).message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedProvider, selectedPatient]);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/providers/${selectedProvider}/availability?date=${selectedDate}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();

      setAvailableSlots(
        data.entry?.map((e: { resource: Slot }) => e.resource) || []
      );
    } catch (err) {
      setError((err as Error).message || "Failed to fetch availability");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedProvider]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAppointments();
      await fetchAvailability();
    };

    fetchData();
  }, [fetchAppointments, fetchAvailability]);

  const handleBookAppointment = async () => {
    if (new Date(newAppointment.start) >= new Date(newAppointment.end)) {
      setError("Start time must be before end time");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        resourceType: "Appointment",
        status: "booked",
        start: new Date(newAppointment.start).toISOString(),
        end: new Date(newAppointment.end).toISOString(),
        participant: [
          {
            actor: { reference: `Patient/${newAppointment.patientId}` },
            status: "accepted",
          },
          {
            actor: { reference: `Practitioner/${newAppointment.providerId}` },
            status: "accepted",
          },
        ],
      };
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchAppointments();
      setNewAppointment({
        start: "",
        end: "",
        patientId: selectedPatient,
        providerId: selectedProvider,
      });
    } catch (err) {
      setError((err as Error).message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (id: string) => {
    if (new Date(newAppointment.start) >= new Date(newAppointment.end)) {
      setError("Start time must be before end time");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        resourceType: "Appointment",
        status: "booked",
        start: new Date(newAppointment.start).toISOString(),
        end: new Date(newAppointment.end).toISOString(),
        participant: [
          {
            actor: { reference: `Patient/${newAppointment.patientId}` },
            status: "accepted",
          },
          {
            actor: { reference: `Practitioner/${newAppointment.providerId}` },
            status: "accepted",
          },
        ],
      };
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchAppointments();
      setEditingId(null);
      setNewAppointment({
        start: "",
        end: "",
        patientId: selectedPatient,
        providerId: selectedProvider,
      });
    } catch (err) {
      setError((err as Error).message || "Failed to reschedule appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const appointment = appointments.find((a) => a.id === id);
      if (!appointment) throw new Error("Appointment not found");
      const payload = {
        resourceType: "Appointment",
        id,
        status: "cancelled",
      };
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchAppointments();
    } catch (err) {
      setError((err as Error).message || "Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  // Convert FHIR dateTime (UTC) into value for datetime-local input
  const toLocalInputValue = (isoString: string) => {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Appointment Manager
      </h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {loading && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
          >
            <option value="1">Provider 1</option>
            <option value="2">Provider 2</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Patient
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
          >
            <option value="73337">{getPatientDisplay("73337")}</option>
            <option value="73338">{getPatientDisplay("73338")}</option>
          </select>
        </div>
      </div>

      {/* Available Slots */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Available Slots
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() =>
                setNewAppointment({
                  ...newAppointment,
                  start: toLocalInputValue(slot.start),
                  end: toLocalInputValue(slot.end),
                })
              }
              className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-md"
            >
              {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
            </button>
          ))}
        </div>
      </div>

      {/* Book New Appointment */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Book New Appointment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="datetime-local"
            value={newAppointment.start}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, start: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
          />
          <input
            type="datetime-local"
            value={newAppointment.end}
            onChange={(e) =>
              setNewAppointment({ ...newAppointment, end: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
          />
        </div>
        <button
          onClick={handleBookAppointment}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          disabled={!newAppointment.start || !newAppointment.end}
        >
          Book Appointment
        </button>
      </div>

      {/* Appointments List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Appointments
        </h3>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p>
                    Patient:{" "}
                    {appointment.participant.find((p) =>
                      p.actor.reference.startsWith("Patient/")
                    )?.actor.display ||
                      appointment.participant
                        .find((p) => p.actor.reference.startsWith("Patient/"))
                        ?.actor.reference.split("/")[1]}
                  </p>
                  <p>
                    Provider:{" "}
                    {appointment.participant.find((p) =>
                      p.actor.reference.startsWith("Practitioner/")
                    )?.actor.display ||
                      appointment.participant
                        .find((p) =>
                          p.actor.reference.startsWith("Practitioner/")
                        )
                        ?.actor.reference.split("/")[1]}
                  </p>
                  <p>
                    Time: {formatDateTime(appointment.start)} -{" "}
                    {formatDateTime(appointment.end)}
                  </p>
                  <p>Status: {appointment.status}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(appointment.id);
                      setNewAppointment({
                        start: toLocalInputValue(appointment.start),
                        end: toLocalInputValue(appointment.end),
                        patientId:
                          appointment.participant
                            .find((p) =>
                              p.actor.reference.startsWith("Patient/")
                            )
                            ?.actor.reference.split("/")[1] || "73337",
                        providerId:
                          appointment.participant
                            .find((p) =>
                              p.actor.reference.startsWith("Practitioner/")
                            )
                            ?.actor.reference.split("/")[1] || "1",
                      });
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleCancel(appointment.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {editingId === appointment.id && (
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={newAppointment.start}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        start: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                  <input
                    type="datetime-local"
                    value={newAppointment.end}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        end: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
                  <button
                    onClick={() => handleReschedule(appointment.id)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    disabled={!newAppointment.start || !newAppointment.end}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="mt-2 ml-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
