import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, MapPin, Briefcase } from "lucide-react";
import { Header } from "../components/Header";
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
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="flex animate-pulse space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 rounded bg-slate-200"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 h-4 rounded bg-slate-200"></div>
                  <div className="col-span-1 h-4 rounded bg-slate-200"></div>
                </div>
                <div className="h-4 rounded bg-slate-200"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
        
        {/* Navigation & Title */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </button>
          <div className="flex items-center justify-between">
            <h1
              className="text-3xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              My Profile
            </h1>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-primary-700"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* =========================
              BASIC INFORMATION
          ========================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <User size={20} className="text-primary-600" />
              Basic Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  name="name"
                  placeholder="E.g. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className={`${inputBase} cursor-not-allowed bg-slate-50 text-slate-500 opacity-80`}
                />
              </div>
            </div>
          </div>

          {/* =========================
              CONTACT INFORMATION
          ========================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <MapPin size={20} className="text-primary-600" />
              Contact Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Address
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="Street Address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  placeholder="E.g. New York"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  State / Province
                </label>
                <input
                  name="state_province"
                  type="text"
                  placeholder="E.g. NY"
                  value={formData.state_province}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mobile Number
                </label>
                <input
                  name="mobile_number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  How did you hear about us?
                </label>
                <input
                  name="how_heard"
                  type="text"
                  placeholder="LinkedIn, Friend, etc."
                  value={formData.how_heard}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* =========================
              PROFESSIONAL INFORMATION
          ========================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Briefcase size={20} className="text-primary-600" />
              Professional Details
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  National ID / CNIC
                </label>
                <input
                  name="cnic"
                  type="text"
                  placeholder="E.g. XXXXX-XXXXXXX-X"
                  value={formData.cnic}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Years of Experience
                </label>
                <input
                  name="years_of_experience"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="E.g. 5"
                  value={formData.years_of_experience}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Current Job Title
                </label>
                <input
                  name="current_job_title"
                  type="text"
                  placeholder="E.g. Senior Software Engineer"
                  value={formData.current_job_title}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Current Employer
                </label>
                <input
                  name="current_employer"
                  type="text"
                  placeholder="E.g. Google"
                  value={formData.current_employer}
                  onChange={handleChange}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <Save size={18} />
              Save Profile
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}