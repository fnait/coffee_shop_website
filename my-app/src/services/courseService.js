export const getCourses = async () => {
  const response = await fetch("http://localhost:5000/api/courses");

  if (!response.ok) {
    throw new Error("Failed to load courses");
  }

  return response.json();
};