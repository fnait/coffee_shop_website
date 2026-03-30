export const createCourseRequest = async (requestData) => {
  const response = await fetch("http://localhost:5000/api/course-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create course request");
  }

  return result;
};