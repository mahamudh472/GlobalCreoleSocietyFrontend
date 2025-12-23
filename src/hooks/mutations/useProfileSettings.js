import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMethods } from '../../utils/api';
import { ENDPOINTS } from '../../config/apiConfig';
import { queryKeys } from '../../utils/queryKeys';
import { toast } from 'react-toastify';

/**
 * Toggle Profile Lock Mutation
 */
export const useToggleProfileLockMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiMethods.post(ENDPOINTS.AUTH.PROFILE_LOCK),
    onSuccess: (response) => {
      // Update the current user in cache
      const currentUser = queryClient.getQueryData(queryKeys.auth.currentUser());
      if (currentUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), {
          ...currentUser,
          profile_lock: !currentUser.profile_lock,
        });
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          profile_lock: !currentUser.profile_lock,
        }));
      }
      toast.success(response.data?.message || 'Profile lock status updated');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update profile lock';
      toast.error(errorMessage);
    },
  });
};

/**
 * Send OTP Mutation
 */
export const useSendOTPMutation = () => {
  return useMutation({
    mutationFn: () => apiMethods.post(ENDPOINTS.AUTH.SEND_OTP),
    onSuccess: () => {
      toast.success('OTP sent to your email');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP';
      toast.error(errorMessage);
    },
  });
};

/**
 * Add Email Mutation
 */
export const useAddEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiMethods.post(ENDPOINTS.AUTH.ADD_EMAIL, data),
    onSuccess: (response) => {
      // Update the current user's extra_emails in cache
      const currentUser = queryClient.getQueryData(queryKeys.auth.currentUser());
      if (currentUser) {
        const newEmail = {
          id: response.data.id,
          email: response.data.email,
          is_verified: true,
        };
        queryClient.setQueryData(queryKeys.auth.currentUser(), {
          ...currentUser,
          extra_emails: [...(currentUser.extra_emails || []), newEmail],
        });
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          extra_emails: [...(currentUser.extra_emails || []), newEmail],
        }));
      }
      toast.success('Email added successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.email?.[0] || 
                          error.response?.data?.password?.[0] ||
                          error.response?.data?.code?.[0] ||
                          error.response?.data?.error || 
                          'Failed to add email';
      toast.error(errorMessage);
    },
  });
};

/**
 * Delete Email Mutation
 */
export const useDeleteEmailMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailId) => apiMethods.delete(ENDPOINTS.AUTH.DELETE_EMAIL(emailId)),
    onSuccess: (_, emailId) => {
      // Update the current user's extra_emails in cache
      const currentUser = queryClient.getQueryData(queryKeys.auth.currentUser());
      if (currentUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), {
          ...currentUser,
          extra_emails: (currentUser.extra_emails || []).filter(e => e.id !== emailId),
        });
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          extra_emails: (currentUser.extra_emails || []).filter(e => e.id !== emailId),
        }));
      }
      toast.success('Email removed successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to remove email';
      toast.error(errorMessage);
    },
  });
};

/**
 * Add Phone Number Mutation
 */
export const useAddPhoneNumberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiMethods.post(ENDPOINTS.AUTH.ADD_PHONE_NUMBER, data),
    onSuccess: (response) => {
      // Update the current user's extra_phone_numbers in cache
      const currentUser = queryClient.getQueryData(queryKeys.auth.currentUser());
      if (currentUser) {
        const newPhone = {
          id: response.data.id,
          phone_number: response.data.phone_number,
          is_verified: true,
        };
        queryClient.setQueryData(queryKeys.auth.currentUser(), {
          ...currentUser,
          extra_phone_numbers: [...(currentUser.extra_phone_numbers || []), newPhone],
        });
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          extra_phone_numbers: [...(currentUser.extra_phone_numbers || []), newPhone],
        }));
      }
      toast.success('Phone number added successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.phone_number?.[0] || 
                          error.response?.data?.password?.[0] ||
                          error.response?.data?.code?.[0] ||
                          error.response?.data?.error || 
                          'Failed to add phone number';
      toast.error(errorMessage);
    },
  });
};

/**
 * Delete Phone Number Mutation
 */
export const useDeletePhoneNumberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phoneId) => apiMethods.delete(ENDPOINTS.AUTH.DELETE_PHONE_NUMBER(phoneId)),
    onSuccess: (_, phoneId) => {
      // Update the current user's extra_phone_numbers in cache
      const currentUser = queryClient.getQueryData(queryKeys.auth.currentUser());
      if (currentUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), {
          ...currentUser,
          extra_phone_numbers: (currentUser.extra_phone_numbers || []).filter(p => p.id !== phoneId),
        });
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          extra_phone_numbers: (currentUser.extra_phone_numbers || []).filter(p => p.id !== phoneId),
        }));
      }
      toast.success('Phone number removed successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to remove phone number';
      toast.error(errorMessage);
    },
  });
};

/**
 * Change Password Mutation
 */
export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (data) => apiMethods.patch(ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.old_password?.[0] || 
                          error.response?.data?.new_password?.[0] ||
                          error.response?.data?.error || 
                          'Failed to change password';
      toast.error(errorMessage);
    },
  });
};
