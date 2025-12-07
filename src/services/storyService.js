import api from '../utils/api';
import { ENDPOINTS, API_BASE_URL } from '../config/apiConfig';

/**
 * Story Service - Handles all story-related API calls
 */

/**
 * Get list of active stories from friends
 * @returns {Promise} API response with stories list
 */
export const getStories = async () => {
  try {
    const response = await api.get(ENDPOINTS.STORIES.LIST);
    
    // Check if response is paginated (has 'results' property)
    if (response.data && response.data.results) {
      return response.data.results;
    }
    
    // If it's a plain array, return it
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Fallback to empty array
    return [];
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
};

/**
 * Create a new story
 * @param {FormData} formData - Story data including content, privacy, and media files
 * @returns {Promise} API response with created story
 */
export const createStory = async (formData) => {
  try {
    const response = await api.post(ENDPOINTS.STORIES.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
};

/**
 * Get a specific story by ID
 * @param {string} storyId - Story ID
 * @returns {Promise} API response with story details
 */
export const getStory = async (storyId) => {
  try {
    const response = await api.get(ENDPOINTS.STORIES.DETAIL(storyId));
    return response.data;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
};

/**
 * Delete a story
 * @param {string} storyId - Story ID to delete
 * @returns {Promise} API response
 */
export const deleteStory = async (storyId) => {
  try {
    const response = await api.delete(ENDPOINTS.STORIES.DELETE(storyId));
    return response.data;
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

/**
 * Record a story view (automatic when viewing a story)
 * @param {string} storyId - Story ID
 * @returns {Promise} API response
 */
export const viewStory = async (storyId) => {
  try {
    const response = await api.get(ENDPOINTS.STORIES.DETAIL(storyId));
    return response.data;
  } catch (error) {
    console.error('Error recording story view:', error);
    throw error;
  }
};
