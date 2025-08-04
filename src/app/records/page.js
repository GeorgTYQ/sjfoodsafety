"use client";

import { useEffect, useState } from "react";

export default function FridgeTempForm() {
  const userIdToEdit = 6;

  const [userId, setUserId] = useState(userIdToEdit);
  const [recordedAt, setRecordedAt] = useState(getTodayDate());
  const [fridgeOptions, setFridgeOptions] = useState([]);
  const [temperatures, setTemperatures] = useState([]);
  const [responseMsg, setResponseMsg] = useState(null);
  const [recentRecord, setRecentRecord] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);

  function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  // Fetch fridges
  useEffect(() => {
    async function fetchFridges() {
      try {
        const res = await fetch("/api/fridge");
        const data = await res.json();
        setFridgeOptions(data);

        // Init temps only if not editing
        if (!editingRecordId) {
          setTemperatures(
            data.map((fridge) => ({
              fridgeId: fridge.id,
              fridgeName: fridge.name,
              temperature: "",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch fridges:", err);
      }
    }
    fetchFridges();
  }, [editingRecordId]);

  // Fetch recent record for user 6
  useEffect(() => {
    async function fetchRecentRecord() {
      try {
        const res = await fetch(`/api/records?userId=${userId}&limit=1`);
        const data = await res.json();
        console.log(data);

        if (Array.isArray(data) && data.length > 0) {
          setRecentRecord(data[0]);
        } else {
          setRecentRecord(null);
        }
      } catch (err) {
        console.error("Failed to fetch recent record:", err);
      }
    }
    fetchRecentRecord();
  }, []);

  // Load recent record into form for editing
  const handleLoadRecentRecord = () => {
    if (!recentRecord || !fridgeOptions.length) return;

    setEditingRecordId(recentRecord.id);
    setUserId(recentRecord.userId);
    setRecordedAt(recentRecord.recordedAt?.slice(0, 10) || getTodayDate());

    const temps = fridgeOptions.map((fridge) => {
      const reading = recentRecord.readings?.find(
        (r) => r.fridgeId === fridge.id
      );
      return {
        fridgeId: fridge.id,
        fridgeName: fridge.name,
        temperature: reading ? reading.temperature.toString() : "",
      };
    });

    setTemperatures(temps);
  };

  const handleTemperatureChange = (index, value) => {
    const newTemps = [...temperatures];
    newTemps[index].temperature = value;
    setTemperatures(newTemps);
  };

  // Submit new or update existing
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      userId: parseInt(userId),
      recordedAt,
      fridgeTemperatures: temperatures.map(({ fridgeId, temperature }) => ({
        fridgeId,
        temperature: parseFloat(temperature),
      })),
    };

    try {
      let res;
      if (editingRecordId) {
        // PUT update
        res = await fetch("/api/records", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: editingRecordId, ...payload }),
        });
      } else {
        // POST create new
        res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      setResponseMsg(JSON.stringify(data, null, 2));

      if (res.ok) {
        if (editingRecordId) {
          setRecentRecord(data); // PUT returns updated record directly
          setResponseMsg("Record updated successfully.");
        } else {
          setRecentRecord(data.newRecord); // POST returns newRecord inside object
          setResponseMsg("Record submitted successfully.");
        }

        // Reset form
        setEditingRecordId(null);
        setRecordedAt(getTodayDate());
        setTemperatures(
          fridgeOptions.map((fridge) => ({
            fridgeId: fridge.id,
            fridgeName: fridge.name,
            temperature: "",
          }))
        );
      } else {
        // Not OK, show only the error message
        setResponseMsg(data.error || "Submission failed.");
      }
    } catch (err) {
      setResponseMsg("Network error or unexpected failure.");
    }
  };

  // Cancel editing mode
  // 处理取消编辑
  const handleCancelEdit = () => {
    // 设置编辑记录的ID为null
    setEditingRecordId(null);
    // 设置记录时间为今天
    setRecordedAt(getTodayDate());
    // 设置温度为空
    setTemperatures(
      fridgeOptions.map((fridge) => ({
        fridgeId: fridge.id,
        fridgeName: fridge.name,
        temperature: "",
      }))
    );
    // 设置响应消息为null
    setResponseMsg(null);
  };

  return (
    <div className="max-w-xl mx-auto mt-2 p-6">
      <h2 className="text-2xl font-bold mb-2">Fridge Temperature Logger</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block font-semibold mb-1">Date</label>
          <input
            type="date"
            className="w-full border rounded p-1"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            required
          />
        </div>

        <div className="space-y-3">
          <h3 className="block font-semibold mb-1">Fridge Temperatures</h3>
          {temperatures.map((fridge, index) => (
            <div key={fridge.fridgeId} className="flex items-center">
              <span className="w-32 ml-2">{fridge.fridgeName}</span>
              <input
                type="number"
                placeholder="Temperature (°C)"
                value={fridge.temperature}
                onChange={(e) => handleTemperatureChange(index, e.target.value)}
                className="flex-1 border rounded p-1"
                required
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="mt-2 bg-sky-400 text-white px-6 py-2 rounded hover:bg-sky-700 transition flex-1"
          >
            {editingRecordId ? "Update" : "Submit"}
          </button>
          {editingRecordId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="mt-2 bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition flex-1"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {responseMsg && (
        <pre className="mt-6 p-4 bg-gray-100 border rounded text-sm overflow-auto">
          {responseMsg}
        </pre>
      )}

      {recentRecord && (
        <div className="mt-8 p-4 bg-gray-50 border rounded">
          <div className="flex items-center justify-between align-middle">
            <h3 className="text-lg font-semibold ">Most Recent Record</h3>
          </div>

          <p className="text-sm text-gray-600 mb-2 ml-2">
            Date: {recentRecord.recordedAt?.slice(0, 10) || ""} | Recorded By:{" "}
            {recentRecord.user.name}
          </p>
          <ul className="list-disc list-inside mt-2 max-h-40 overflow-auto">
            {(recentRecord.readings ?? []).map((r) => (
              <li key={r.fridgeId}>
                {r.fridge.name} : {r.temperature} °C
              </li>
            ))}
          </ul>
          <button
            onClick={handleLoadRecentRecord}
            className="mt-4 bg-green-400 text-white p-2 rounded hover:bg-green-600 transition"
          >
            Click to Edit
          </button>
        </div>
      )}
    </div>
  );
}
