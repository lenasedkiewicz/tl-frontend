import React, { useState, useEffect } from "react";
import axios from "axios";

interface DietEntry {
  _id?: string;
  username: string;
  userId: string;
  date: string;
  content: string;
}

const API_URL = "http://localhost:5000/api/diet";

const DietEntryForm: React.FC = () => {
  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [formData, setFormData] = useState<DietEntry>({
    username: "",
    userId: "",
    date: new Date().toISOString().split("T")[0],
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch entries");
      setLoading(false);
      console.error(err);
    }
  };

  const fetchUserEntries = async (userId: string) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/user/${userId}`);
      setEntries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch user entries");
      setLoading(false);
      console.error(err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "userId" && value) {
      fetchUserEntries(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await axios.post(API_URL, formData);

      setSuccess("Diet entry saved successfully!");
      setFormData({
        ...formData,
        date: new Date().toISOString().split("T")[0],
        content: "",
      });

      fetchUserEntries(formData.userId);
      setLoading(false);
    } catch (err) {
      setError("Failed to save diet entry");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4"> Diet Tracker </h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 p-4 bg-gray-100 rounded shadow"
      >
        <div className="mb-4">
          <label className="block mb-1"> Username: </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1"> User ID: </label>
          <input
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1"> Date: </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1"> Diet Content: </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="w-full p-2 border rounded h-32"
            placeholder="What did you eat today?"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Diet Entry"}
        </button>

        {error && <p className="mt-2 text-red-500"> {error} </p>}
        {success && <p className="mt-2 text-green-500"> {success} </p>}
      </form>

      <div>
        <h2 className="text-xl font-bold mb-2"> Diet Entries </h2>
        {loading ? (
          <p>Loading entries...</p>
        ) : entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry._id} className="p-4 border rounded shadow">
                <p className="font-bold">
                  {" "}
                  {entry.username}(ID: {entry.userId}){" "}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap"> {entry.content} </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No entries found.</p>
        )}
      </div>
    </div>
  );
};

export default DietEntryForm;
