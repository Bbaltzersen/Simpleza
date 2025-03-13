import axios from "axios";

const API_BASE_URL = process.env.RECIPES_API_URL || "http://localhost:8020/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/tags`,
  withCredentials: true, // Ensures cookies (auth_token) and CSRF token are sent
});

// Define a Tag type
export interface Tag {
  tag_id: string;
  name: string;
}

/* --- TAG API FUNCTIONS --- */

// Fetch all existing tags
export const fetchTags = async (): Promise<Tag[]> => {
  try {
    const response = await apiClient.get("/");
    return response.data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
};

// Create a new tag
export const createTag = async (tagName: string): Promise<Tag | null> => {
  try {
    const response = await apiClient.post(`/${encodeURIComponent(tagName)}`);
    return response.data;
  } catch (error) {
    console.error("Error creating tag:", error);
    return null;
  }
};

export default apiClient;
