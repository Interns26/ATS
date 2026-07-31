export type JobStatus = "open" | "closing_soon" | "new";

export interface Job {
  id: string;
  title: string;
  location: string;
  employmentType: "Permanent" | "Contract" | "Internship" | "Part-time";
  openingDate: string;   // ISO date
  closingDate: string;   // ISO date
  department: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}
