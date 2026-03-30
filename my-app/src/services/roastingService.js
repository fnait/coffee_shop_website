export const getRoastingContent = async () => {
  const response = await fetch("http://localhost:5000/api/roasting");

  if (!response.ok) {
    throw new Error("Failed to load roasting content");
  }

  return response.json();
};

export const createRoastingRequest = async (requestData) => {
  const response = await fetch("http://localhost:5000/api/roasting-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create roasting request");
  }

  return result;
};