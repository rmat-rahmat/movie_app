"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCommentList, createComment, type CommentVO, type PageResultCommentVO } from '@/lib/commentApi';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { FiMessageSquare } from 'react-icons/fi';

interface CommentSectionProps {
  showComments?: boolean;
  mediaId: string;
  mediaType: 'video' | 'episode';
  className?: string;
  onCommentCountChange?: (count: number) => void;
  isauth?:boolean;
}

export default function CommentSection({ mediaId, mediaType, className = '', onCommentCountChange ,showComments, isauth}: CommentSectionProps) {
  const { t } = useTranslation('common');
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 10;

  // Load comments
  const loadComments = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result: PageResultCommentVO = await getCommentList(mediaId, mediaType, pageNum, pageSize);
      if (append) {
        setComments(prev => [...prev, ...result.records]);
      } else {
        setComments(result.records);
      }
      setTotalPages(result.totalPages);
      setTotal(result.total);
      setPage(pageNum);
      
      // Notify parent of comment count change
      if (onCommentCountChange) {
        onCommentCountChange(result.total);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load comments';
      setError(message);
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadComments(1, false);
  }, [mediaId, mediaType]);

  // Handle new comment submission
  const handleCommentSubmit = async (content: string) => {
    setSubmitting(true);
    try {
      const newComment = await createComment({
        mediaId,
        mediaType,
        content,
      });
      // Add new comment to the top of the list
      setComments(prev => [newComment, ...prev]);
      const newTotal = total + 1;
      setTotal(newTotal);
      
      // Notify parent of comment count change
      if (onCommentCountChange) {
        onCommentCountChange(newTotal);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post comment';
      alert(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleCommentDelete = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    const newTotal = Math.max(0, total - 1);
    setTotal(newTotal);
    
    // Notify parent of comment count change
    if (onCommentCountChange) {
      onCommentCountChange(newTotal);
    }
  };

  // Handle comment update (like count changes)
  const handleCommentUpdate = (updatedComment: CommentVO) => {
    setComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c));
  };

  // Load more comments
  const handleLoadMore = () => {
    if (page < totalPages) {
      loadComments(page + 1, true);
    }
  };
  if(showComments===false){
    return null;
  }
  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FiMessageSquare className="w-6 h-6 text-[#fbb033]" />
        <h2 className="text-2xl font-bold text-white">
          {t('comments.title', 'Comments')} ({total})
        </h2>
      </div>

      {/* Comment Form */}
      {isauth &&<div className="mb-8">
        <CommentForm
          onSubmit={handleCommentSubmit}
          submitting={submitting}
          placeholder={t('comments.writeComment', 'Write a comment...')}
        />
      </div>}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {/* {comments.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <FiMessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('comments.noComments', 'No comments yet. Be the first to comment!')}</p>
          </div>
        )} */}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            mediaId={mediaId}
            mediaType={mediaType}
            onDelete={handleCommentDelete}
            onUpdate={handleCommentUpdate}
          />
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fbb033]"></div>
        </div>
      )}

      {/* Load More Button */}
      {!loading && page < totalPages && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            {t('common.loadMore', 'Load More')}
          </button>
        </div>
      )}
    </div>
  );
}
