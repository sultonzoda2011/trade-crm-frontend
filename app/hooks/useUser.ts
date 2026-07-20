import { useQuery } from "@tanstack/react-query";
import { authApi } from "~/api/auth";
import { getAuthToken } from "~/lib/auth-utils";

/**
 * Хук для получения данных текущего авторизованного пользователя
 */
export function useUser() {
  const token = getAuthToken();

  return useQuery({
    queryKey: ["user-me"],
    queryFn: authApi.me,
    enabled: !!token, // Запрос идет только если есть токен
    staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
  });
}
