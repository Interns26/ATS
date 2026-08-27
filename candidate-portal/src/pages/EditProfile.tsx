import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  updateCandidateProfile,
} from "../services/api";
import { getToken } from "../lib/auth";

export function EditProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",

    // Contact Information
    address: "",
    city: "",
    state_province: "",
    mobile_number: "",
    how_heard: "",

    // Professional Information
    cnic: "",
    years_of_experience: "",
    current_job_title: "",
    current_employer: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load saved candidate information
  useEffect(() => {
    const loadProfile = async () => {
      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const user = await fetchCurrentUser(token);

        setFormData({
          name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
          email: user.email ?? "",

          // Contact Information
          address: user.address ?? "",
          city: user.city ?? "",
          state_province: user.state_province ?? "",
          mobile_number: user.mobile_number ?? "",
          how_heard: user.how_heard ?? "",

          // Professional Information
          cnic: user.cnic ?? "",
          years_of_experience:
            user.years_of_experience !== undefined &&
            user.years_of_experience !== null
              ? String(user.years_of_experience)
              : "",
          current_job_title: user.current_job_title ?? "",
          current_employer: user.current_employer ?? "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((previousData) => ({
      ...previousData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    try {
      setError("");

      await updateCandidateProfile(token, {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state_province: formData.state_province,
        mobile_number: formData.mobile_number,
        how_heard: formData.how_heard,
        cnic: formData.cnic,
        years_of_experience: formData.years_of_experience
          ? Number(formData.years_of_experience)
          : undefined,
        current_job_title: formData.current_job_title,
        current_employer: formData.current_employer,
      });

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile."
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">
          Edit Profile
        </h1>

        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">
        Edit Profile
      </h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* =========================
            BASIC INFORMATION
        ========================== */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>

              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* =========================
            CONTACT INFORMATION
        ========================== */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Contact Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Address
              </label>

              <input
                name="address"
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                City
              </label>

              <input
                name="city"
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                State / Province
              </label>

              <input
                name="state_province"
                type="text"
                placeholder="State / Province"
                value={formData.state_province}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>

              <input
                name="mobile_number"
                type="tel"
                placeholder="Mobile Number"
                value={formData.mobile_number}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                How did you hear about us?
              </label>

              <input
                name="how_heard"
                type="text"
                placeholder="How did you hear about us?"
                value={formData.how_heard}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* =========================
            PROFESSIONAL INFORMATION
        ========================== */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Professional Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                CNIC
              </label>

              <input
                name="cnic"
                type="text"
                placeholder="CNIC"
                value={formData.cnic}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Years of Experience
              </label>

              <input
                name="years_of_experience"
                type="number"
                min="0"
                placeholder="Years of Experience"
                value={formData.years_of_experience}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Current Job Title
              </label>

              <input
                name="current_job_title"
                type="text"
                placeholder="Current Job Title"
                value={formData.current_job_title}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Current Employer
              </label>

              <input
                name="current_employer"
                type="text"
                placeholder="Current Employer"
                value={formData.current_employer}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* =========================
            SAVE BUTTON
        ========================== */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
        {/* =========================
            BACK TO HOME BUTTON
        ========================== */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Home Page
        </button>
      </form>
    </div>
  );
}