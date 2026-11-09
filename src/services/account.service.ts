import apiClient from '@/lib/axios';
import type {
  AccountDeletionPlan,
  APIDelete,
  APIPatch,
  APISingleGet,
  DeletionChoice,
} from '@/types';

class AccountService {
  private client = apiClient;

  async updateProfile(payload: {
    fullName: string;
  }): Promise<APIPatch<{ id: string; fullName: string }>> {
    return this.client
      .patch('/account', payload)
      .then(
        (response) =>
          response.data as APIPatch<{ id: string; fullName: string }>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to update profile');
      });
  }

  async getDeletionPlan(): Promise<APISingleGet<AccountDeletionPlan>> {
    return this.client
      .get('/account/deletion')
      .then((response) => response.data as APISingleGet<AccountDeletionPlan>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to load your boards');
      });
  }

  async deleteAccount(payload: {
    confirmEmail: string;
    boards: Record<string, DeletionChoice>;
    workspace?: DeletionChoice;
  }): Promise<APIDelete<boolean>> {
    return this.client
      .delete('/account', { data: payload })
      .then((response) => response.data as APIDelete<boolean>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to delete account');
      });
  }
}

export const accountServices = new AccountService();
