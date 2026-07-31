import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { JobCard } from "../components/JobCard";
import { SearchBar } from "../components/SearchBar";
import { fetchApprovedJobs } from "../services/api";
import type { Job } from "../types/job";

export function JobListings() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApprovedJobs()
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.department.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
    );
  }, [query, jobs]);

  return (
    <div className="min-h-screen bg-ink-50">
      <Header />

      {/* Hero */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-600">
            We're growing — and looking for people to grow with us
          </p>
          <h1
            className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-primary-900 sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Find your next role here
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-500">
            Browse our current openings below and apply directly — no account
            needed to get started.
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2
              className="text-xl font-bold text-ink-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Current openings
            </h2>
            <p className="text-sm text-ink-500">
              {loading
                ? "Loading…"
                : `${filteredJobs.length} position${filteredJobs.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {loading && (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white py-16 text-center">
            <p className="text-ink-500">Loading job listings…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 py-16 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white py-16 text-center">
            <p className="text-ink-500">
              {query
                ? `No roles match "${query}" right now — try a different search.`
                : "No open positions at the moment. Check back soon!"}
            </p>
          </div>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => navigate(`/jobs/${job.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
