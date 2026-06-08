/** Ресурс управления пользователями аккаунта. */

import { assertEnum, validUserRoles } from '../enums.js';
import type { User } from '../types.js';
import { BaseResource } from './base.js';

export class UserResource extends BaseResource {
  /** Список пользователей аккаунта (GET v1/account/{accountID}/users). */
  async list(signal?: AbortSignal): Promise<User[]> {
    const response = await this.http.request<{ users?: User[] }>(
      'GET',
      this.accountPath('users'),
      undefined,
      signal,
    );
    return response.data.users ?? [];
  }

  /** Добавить пользователя (POST v1/account/{accountID}/add-user). */
  async add(userId: number, role: string, signal?: AbortSignal): Promise<void> {
    const validRole = assertEnum(role, validUserRoles, 'UserRole');
    await this.http.request(
      'POST',
      this.accountPath('add-user'),
      { userId, role: validRole },
      signal,
    );
  }

  /** Изменить роль пользователя (POST v1/account/{accountID}/set-user-role). */
  async setRole(userId: number, role: string, signal?: AbortSignal): Promise<void> {
    const validRole = assertEnum(role, validUserRoles, 'UserRole');
    await this.http.request(
      'POST',
      this.accountPath('set-user-role'),
      { userId, role: validRole },
      signal,
    );
  }

  /** Удалить пользователя (DELETE v1/account/{accountID}/delete-user/{userID}). */
  async delete(userId: number, signal?: AbortSignal): Promise<void> {
    await this.http.request('DELETE', this.accountPath(`delete-user/${userId}`), undefined, signal);
  }
}
