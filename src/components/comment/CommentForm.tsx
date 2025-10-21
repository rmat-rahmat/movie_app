"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSend } from 'react-icons/fi';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  submitting: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function CommentForm({
  onSubmit,
  submitting,
  placeholder,
  autoFocus = false,
  onCancel,
  showCancel = false,
}: CommentFormProps) {
  const { t } = useTranslation('common');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    try {
      await onSubmit(content.trim());
      setContent(''); // Clear form on success
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || t('comments.writeComment', 'Write a comment...')}
        autoFocus={autoFocus}
        rows={3}
        disabled={submitting}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white placeholder-gray-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        required
      />
      <div className="flex items-center justify-end gap-3">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="flex items-center gap-2 px-6 py-2 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              {t('comments.posting', 'Posting...')}
            </>
          ) : (
            <>
              <FiSend className="w-4 h-4" />
              {t('comments.post', 'Post')}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
