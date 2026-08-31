import { Capacitor } from '@capacitor/core';
import { isElectronStorageAvailable } from '@trade-crm/storage-electron';

/**
 * Единая точка ответа на вопрос "есть ли у нас локальная SQLite прямо
 * сейчас". Используется всеми api/*.ts файлами вместо прямой проверки
 * Capacitor.isNativePlatform() — иначе Electron (который не является
 * Capacitor-платформой) молча остался бы только-онлайн навсегда.
 */
export function isOfflineCapable(): boolean {
  return Capacitor.isNativePlatform() || isElectronStorageAvailable();
}
