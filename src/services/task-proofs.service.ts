import { apiService } from './api.service';

export interface TaskProof {
  id: string;
  task_id: string;
  image_blob_id: string;
  description?: string;
  actor_profile_id?: string;
  actor_address?: string;
  reviewed_by?: string | null;
  ai_evaluation?: string;
  review_status?: 'Pending' | 'Approved' | 'Rejected' | string;
  raw_submit_date?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface TaskProofsListResponse {
  data: TaskProof[];
  amount: number;
  page: number;
  total_pages: number;
}

export const getTaskProofsByActor = async (
  actorAddress: string,
): Promise<TaskProofsListResponse> => {
  const response = await apiService.get<TaskProofsListResponse>('/task-proofs', {
    params: { actor_address: actorAddress },
  });
  return response.data;
};

export const getRegionTaskProofs = async (
  region: string,
): Promise<TaskProof[]> => {
  const response = await apiService.get<TaskProofsListResponse>('/task-proofs', {
    params: { region, is_child_task: false },
  });
  return response.data?.data ?? [];
};

export interface SubmitTaskProofParams {
  taskId: string | number;
  imageCloudinaryBlobId: string;
  imageUrl: string;
}

export interface TaskProofResponse {
  success?: boolean;
  message?: string;
  data?: TaskProof;
  [key: string]: any;
}

/**
 * Submit a task proof with image evidence
 * POST /task-proofs/task/{taskId}/submit?image_blob_id={imageBlobId}
 * @param params - Task ID and image blob ID
 * @returns Response from server
 */
export const submitTaskProof = async (
  params: SubmitTaskProofParams
): Promise<TaskProofResponse> => {
  try {
    const { taskId, imageCloudinaryBlobId, imageUrl } = params;

    if (!taskId) {
      throw new Error('Task ID is required');
    }

    if (!imageCloudinaryBlobId) {
      throw new Error('Image cloudinary blob ID is required');
    }

    const url = `/task-proofs/task/${taskId}/submit`;

    const response = await apiService.post<TaskProofResponse>(url, {
      image_cloudinary_blob_id: imageCloudinaryBlobId,
      image_url: imageUrl,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to submit task proof:', error);
    throw error;
  }
};

/**
 * Submit multiple task proofs (batch)
 * @param proofs - Array of task proofs to submit
 * @returns Array of responses
 */
export const submitTaskProofsBatch = async (
  proofs: SubmitTaskProofParams[]
): Promise<TaskProofResponse[]> => {
  const submitPromises = proofs.map((proof) => submitTaskProof(proof));
  return Promise.all(submitPromises);
};

/**
 * Get task proof by ID
 * @param proofId - Proof ID
 * @returns Task proof details
 */
export const getTaskProof = async (proofId: string): Promise<TaskProof> => {
  try {
    const response = await apiService.get<TaskProof>(`/task-proofs/${proofId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch task proof ${proofId}:`, error);
    throw error;
  }
};

/**
 * Get all proofs for a specific task
 * @param taskId - Task ID
 * @returns Array of proofs for the task
 */
export const getTaskProofs = async (taskId: string | number): Promise<TaskProof[]> => {
  try {
    const response = await apiService.get<{ data: TaskProof[] } | TaskProof[]>(
      `/task-proofs/task/${taskId}`
    );

    // Handle both array and object with data property
    const proofs = Array.isArray(response.data) ? response.data : response.data.data || [];
    return proofs;
  } catch (error) {
    console.error(`Failed to fetch proofs for task ${taskId}:`, error);
    throw error;
  }
};
