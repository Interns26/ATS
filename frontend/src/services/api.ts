const API_URL = "http://localhost:8000";

export async function getBuckets() {
  const response = await fetch(`${API_URL}/buckets/`);

  if (!response.ok) {
    throw new Error("Failed to load buckets");
  }

  return response.json();
}

export async function getResumes(bucketName: string) {
  const response = await fetch(
    `${API_URL}/resumes/${bucketName}`
  );

  if (!response.ok) {
    throw new Error("Failed to load resumes");
  }

  return response.json();
}