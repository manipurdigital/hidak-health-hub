// Placeholder implementations for notification hooks
import { useQuery, useMutation } from '@tanstack/react-query';

export const useCreateBookingNotification = () => {
  return {
    mutate: () => {},
    isLoading: false,
  };
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => [],
  });
};

export const useMarkNotificationRead = () => {
  return {
    mutate: () => {},
    isLoading: false,
  };
};