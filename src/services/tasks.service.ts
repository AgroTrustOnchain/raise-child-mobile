import { apiService } from './api.service';

export interface TaskItem {
  id: string;
  is_child_task?: boolean;
  child_task_detail_id?: string | null;
  created_by?: string;
  assigned_profile_id?: string | null;
  assgined_staff?: string | null;
  review_profile_status?: string;
  reviewed_by?: string | null;
  region?: string;
  description?: string;
  start_period?: string;
  end_period?: string;
  created_at?: string;
  updated_at?: string;
  // legacy/compat fields
  title?: string;
  keyword?: string;
  status?: string;
  [key: string]: any;
}

export interface TasksListResponse {
  data?: TaskItem[] | null;
  items?: TaskItem[];
  tasks?: TaskItem[];
  amount?: number;
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  [key: string]: any;
}

export interface GetTasksParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  region?: string;
}

/**
 * Fetch all tasks with filtering and pagination
 * @param params - Filter and pagination parameters
 * @returns List of tasks with pagination info
 */
export const getTasks = async (params: GetTasksParams = {}): Promise<TasksListResponse> => {
  try {
    const { keyword = '', page = 0, pageSize = 10, region = '' } = params;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (keyword) queryParams.append('keyword', keyword);
    if (page !== undefined) queryParams.append('page', page.toString());
    if (pageSize !== undefined) queryParams.append('page_size', pageSize.toString());
    if (region) queryParams.append('region', region);

    const queryString = queryParams.toString();
    const url = `/tasks${queryString ? '?' + queryString : ''}`;

    const response = await apiService.get<TasksListResponse>(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};

/**
 * Fetch a single task by ID
 * @param taskId - The task ID
 * @returns Task details
 */
export const getTaskDetail = async (taskId: string): Promise<TaskItem> => {
  try {
    const response = await apiService.get<TaskItem>(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    throw error;
  }
};

/**
 * Search tasks by keyword
 * @param keyword - Search keyword
 * @param page - Page number (0-indexed)
 * @param pageSize - Items per page
 * @returns Filtered tasks list
 */
export const searchTasks = async (
  keyword: string,
  page = 0,
  pageSize = 10
): Promise<TasksListResponse> => {
  return getTasks({ keyword, page, pageSize });
};

/**
 * Get tasks by region
 * @param region - Region name
 * @param page - Page number (0-indexed)
 * @param pageSize - Items per page
 * @returns Tasks in specified region
 */
export const getTasksByRegion = async (
  region: string,
  page = 0,
  pageSize = 10
): Promise<TasksListResponse> => {
  return getTasks({ region, page, pageSize });
};

/**
 * Extract tasks array from response (handles different response formats)
 * @param response - API response
 * @returns Array of tasks
 */
export const extractTasksFromResponse = (response: TasksListResponse): TaskItem[] => {
  return response.data || response.items || response.tasks || [];
};

/**
 * Assign a task to the current volunteer profile
 * POST /tasks/{taskId}/assign
 */
export const assignTask = async (taskId: string): Promise<any> => {
  try {
    const response = await apiService.post(`/tasks/${taskId}/claim`);
    return response.data;
  } catch (error) {
    console.error(`Failed to claim task ${taskId}:`, error);
    throw error;
  }
};
