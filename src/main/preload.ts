import { contextBridge, ipcRenderer } from 'electron';
import {
  AuthChannelResponse,
  AuthCodePayload,
  BulkChannelResponse,
  BulkUploadPayload,
  ReviewChannelResponse,
  ReviewRequestPayload,
} from '../types/ipc';
import { OAuthConfig } from './services/auth';

type Invoke<T, P = void> = P extends void ? () => Promise<T> : (payload: P) => Promise<T>;

const api = {
  exchangeAuthCode: ((payload: AuthCodePayload) => ipcRenderer.invoke('auth:exchange', payload)) as Invoke<
    AuthChannelResponse,
    AuthCodePayload
  >,
  refreshTokens: ((config: OAuthConfig) => ipcRenderer.invoke('auth:refresh', config)) as Invoke<
    AuthChannelResponse,
    OAuthConfig
  >,
  loadStoredTokens: (() => ipcRenderer.invoke('auth:load')) as Invoke<AuthChannelResponse>,
  submitReview: ((payload: ReviewRequestPayload) => ipcRenderer.invoke('review:submit', payload)) as Invoke<
    ReviewChannelResponse,
    ReviewRequestPayload
  >,
  uploadBulk: ((payload: BulkUploadPayload) => ipcRenderer.invoke('review:bulk', payload)) as Invoke<
    BulkChannelResponse,
    BulkUploadPayload
  >,
};

contextBridge.exposeInMainWorld('reviewApi', api);

export type ReviewApi = typeof api;
