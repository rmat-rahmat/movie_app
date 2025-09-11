"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiX } from 'react-icons/fi';
import { TagVo, searchTags } from '@/lib/tagAPI';

// Simple cache for tag searches
const tagCache = new Map<string, TagVo[]>();

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TagSelector({ selectedTags, onTagsChange, placeholder, className = '' }: TagSelectorProps) {
  const { t } = useTranslation('common');
  const [searchInput, setSearchInput] = useState('');
  const [availableTags, setAvailableTags] = useState<TagVo[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagVo[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial tags when component mounts
  useEffect(() => {
    loadTags();
  }, []);

  // Filter tags based on search input
  useEffect(() => {
    if (searchInput.trim()) {
      const filtered = availableTags.filter(tag => 
        tag.name.toLowerCase().includes(searchInput.toLowerCase()) &&
        !selectedTags.includes(tag.name)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(availableTags.filter(tag => !selectedTags.includes(tag.name)));
    }
  }, [searchInput, availableTags, selectedTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTags = useCallback(async () => {
    const cacheKey = 'all_tags';
    if (tagCache.has(cacheKey)) {
      setAvailableTags(tagCache.get(cacheKey) || []);
      return;
    }

    try {
      setIsLoading(true);
      const tags = await searchTags(''); // Load all tags
      tagCache.set(cacheKey, tags);
      setAvailableTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setIsDropdownOpen(true);

    // Search tags from server when user types
    if (value.trim()) {
      const cacheKey = `search_${value.toLowerCase()}`;
      
      if (tagCache.has(cacheKey)) {
        const cached = tagCache.get(cacheKey) || [];
        // Merge with existing tags
        const merged = [...availableTags];
        cached.forEach(newTag => {
          if (!merged.find(existing => existing.id === newTag.id)) {
            merged.push(newTag);
          }
        });
        setAvailableTags(merged);
        return;
      }

      try {
        setIsLoading(true);
        const searchResults = await searchTags(value);
        tagCache.set(cacheKey, searchResults);
        
        // Merge with existing tags to avoid losing data
        const merged = [...availableTags];
        searchResults.forEach(newTag => {
          if (!merged.find(existing => existing.id === newTag.id)) {
            merged.push(newTag);
          }
        });
        setAvailableTags(merged);
      } catch (error) {
        console.error('Failed to search tags:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setSearchInput('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleTagRemove = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSearchInput('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fbb033] text-black font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="ml-2 hover:bg-yellow-600 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={placeholder || t('upload.searchTags', 'Search tags...')}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fbb033]"></div>
            </div>
          )}
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelect(tag.name)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-600 text-white transition-colors"
                >
                  <div className="font-medium">{tag.name}</div>
                  {tag.description && (
                    <div className="text-sm text-gray-400">{tag.description}</div>
                  )}
                </button>
              ))
            ) : searchInput.trim() ? (
              <div className="px-4 py-2 text-gray-400 text-sm">
                {isLoading ? t('upload.searchingTags', 'Searching...') : t('upload.noTagsFound', 'No tags found')}
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-400 text-sm">
                {t('upload.startTyping', 'Start typing to search tags')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
