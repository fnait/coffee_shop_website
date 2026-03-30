export const getAboutContent = async () => {
  const response = await fetch("http://localhost:5000/api/about");

  if (!response.ok) {
    throw new Error("Failed to load about content");
  }

  return response.json();
};