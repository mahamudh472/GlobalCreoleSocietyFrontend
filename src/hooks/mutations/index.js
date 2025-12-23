/**
 * Authentication Mutations
 */
export { 
  useLoginMutation, 
  useRegisterMutation, 
  useLogoutMutation,
  useUpdateUserMutation 
} from './useAuth';

/**
 * Post Mutations
 */
export {
  useCreatePostMutation,
  useLikePostMutation,
  useDeletePostMutation,
  useCreateCommentMutation,
  useLikeCommentMutation,
  useUpdatePostMutation,
} from './usePosts';

/**
 * Society Mutations
 */
export {
  useCreateSocietyMutation,
  useUpdateSocietyMutation,
  useDeleteSocietyMutation,
  useJoinSocietyMutation,
  useLeaveSocietyMutation,
  useRemoveMemberMutation,
} from './useSocieties';

/**
 * Friend Mutations
 */
export {
  useSendFriendRequestMutation,
  useRespondToRequestMutation,
  useUnfriendMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
} from './useFriends';

/**
 * Chat Mutations
 */
export {
  useCreateConversationMutation,
  useSendMessageMutation,
  useSendGlobalMessageMutation,
  useMarkAsReadMutation as useMarkChatAsReadMutation,
  useDeleteConversationMutation,
} from './useChat';

/**
 * Notification Mutations
 */
export {
  useMarkAsReadMutation as useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from './useNotifications';

/**
 * Profile Settings Mutations
 */
export {
  useToggleProfileLockMutation,
  useSendOTPMutation,
  useAddEmailMutation,
  useDeleteEmailMutation,
  useAddPhoneNumberMutation,
  useDeletePhoneNumberMutation,
  useChangePasswordMutation,
} from './useProfileSettings';
