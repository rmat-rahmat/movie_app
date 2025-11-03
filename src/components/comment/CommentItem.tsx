"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiMessageCircle, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { type CommentVO, createComment, deleteComment, toggleCommentLike, getCommentReplies } from '@/lib/commentApi';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: CommentVO;
  mediaId: string;
  mediaType: 'video' | 'episode';
  onDelete: (commentId: string) => void;
  onUpdate: (comment: CommentVO) => void;
  isReply?: boolean;
  isauth?:boolean;
}

export default function CommentItem({
  comment,
  mediaId,
  mediaType,
  onDelete,
  onUpdate,
  isReply = false,
  isauth
}: CommentItemProps) {
  const { t } = useTranslation('common');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [localComment, setLocalComment] = useState<CommentVO>(comment);
  const [replies, setReplies] = useState<CommentVO[]>(comment.replies || []);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [likingComment, setLikingComment] = useState(false);

  // Get current user ID from localStorage (if available)
  const getCurrentUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userId');
  };

  const currentUserId = getCurrentUserId();
  const isOwnComment = currentUserId === localComment.userId;

  // Format time ago
  const timeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
      };
      
      for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
          return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
      }
      
      return 'just now';
    } catch {
      return dateString;
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (content: string) => {
    setSubmittingReply(true);
    try {
      const newReply = await createComment({
        mediaId,
        mediaType,
        content,
        parentId: localComment.id,
      });
      setReplies(prev => [...prev, newReply]);
      setLocalComment(prev => ({
        ...prev,
        replyCount: prev.replyCount + 1,
      }));
      setShowReplyForm(false);
      setShowReplies(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post reply';
      alert(message);
      throw err;
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm(t('comments.confirmDelete', 'Are you sure you want to delete this comment?'))) {
      return;
    }

    try {
      await deleteComment(localComment.id);
      onDelete(localComment.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      alert(message);
    }
  };

  // Handle like toggle
  const handleLike = async () => {
    if (likingComment) return;
    
    setLikingComment(true);
    try {
      await toggleCommentLike(localComment.id);
      const updatedComment: CommentVO = {
        ...localComment,
        isLiked: !localComment.isLiked,
        likeCount: localComment.isLiked ? localComment.likeCount - 1 : localComment.likeCount + 1,
      };
      setLocalComment(updatedComment);
      onUpdate(updatedComment);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle like';
      console.error(message);
    } finally {
      setLikingComment(false);
    }
  };

  // Load replies
  const handleLoadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    if (replies.length === 0) {
      setLoadingReplies(true);
      try {
        const loadedReplies = await getCommentReplies(localComment.id);
        setReplies(loadedReplies);
      } catch (err) {
        console.error('Failed to load replies:', err);
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(true);
  };

  // Handle reply deletion
  const handleReplyDelete = (replyId: string) => {
    setReplies(prev => prev.filter(r => r.id !== replyId));
    setLocalComment(prev => ({
      ...prev,
      replyCount: Math.max(0, prev.replyCount - 1),
    }));
  };

  // Handle reply update
  const handleReplyUpdate = (updatedReply: CommentVO) => {
    setReplies(prev => prev.map(r => r.id === updatedReply.id ? updatedReply : r));
  };

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={localComment.userAvatar || '/fallback_poster/sample_poster.png'}
            alt={localComment.username}
            className="w-10 h-10 rounded-full object-cover bg-gray-700"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{localComment.username}</span>
            <span className="text-sm text-gray-400">{timeAgo(localComment.createdAt)}</span>
          </div>

          {/* Comment Text */}
          <p className="text-gray-200 mb-3 whitespace-pre-wrap">{localComment.content}</p>

          {/* Actions */}
          {isauth && <div className="flex items-center gap-4 text-sm">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={likingComment}
              className={`flex items-center gap-1 transition-colors ${
                localComment.isLiked
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-red-500'
              } disabled:opacity-50`}
            >
              <FiHeart className={`w-4 h-4 ${localComment.isLiked ? 'fill-current' : ''}`} />
              <span>{localComment.likeCount > 0 ? localComment.likeCount : t('comments.like', 'Like')}</span>
            </button>

            {/* Reply Button */}
            {!isReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-gray-400 hover:text-[#fbb033] transition-colors"
              >
                <FiMessageCircle className="w-4 h-4" />
                <span>{t('comments.reply', 'Reply')}</span>
              </button>
            )}

            {/* Delete Button (only for own comments) */}
            {isOwnComment && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>{t('comments.delete', 'Delete')}</span>
              </button>
            )}
          </div>}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                onSubmit={handleReplySubmit}
                submitting={submittingReply}
                placeholder={t('comments.writeReply', 'Write a reply...')}
                autoFocus
                onCancel={() => setShowReplyForm(false)}
                showCancel
              />
            </div>
          )}

          {/* Show Replies Button */}
          {localComment.replyCount > 0 && !isReply && (
            <button
              onClick={handleLoadReplies}
              disabled={loadingReplies}
              className="flex items-center gap-2 mt-3 text-sm text-[#fbb033] hover:text-yellow-500 transition-colors disabled:opacity-50"
            >
              {showReplies ? (
                <>
                  <FiChevronUp className="w-4 h-4" />
                  {t('comments.hideReplies', 'Hide replies')}
                </>
              ) : (
                <>
                  <FiChevronDown className="w-4 h-4" />
                  {loadingReplies
                    ? t('comments.loadingReplies', 'Loading replies...')
                    : t('comments.showReplies', `Show ${localComment.replyCount} ${localComment.replyCount === 1 ? 'reply' : 'replies'}`)}
                </>
              )}
            </button>
          )}

          {/* Replies List */}
          {showReplies && replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  mediaId={mediaId}
                  mediaType={mediaType}
                  onDelete={handleReplyDelete}
                  onUpdate={handleReplyUpdate}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
