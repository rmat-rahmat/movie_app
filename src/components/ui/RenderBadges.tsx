import React from 'react';

/**
 * Reusable badge components for rendering tags, regions, and languages
 * 
 * These components normalize various data formats (string, array, object, JSON string)
 * into consistent badge displays.
 * 
 * @example
 * // Basic usage
 * <RenderTags tags={["Action", "Drama"]} />
 * <RenderRegion region="USA" />
 * <RenderLanguage language={["English", "Spanish"]} />
 * 
 * @example
 * // With custom styling
 * <RenderTags tags={video.tags} className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm" />
 * <RenderRegion region={video.region} className="bg-green-600/80 text-white px-2 py-1" />
 * 
 * @example
 * // Handles various data formats automatically:
 * // - String: "Action,Drama" or '["Action","Drama"]'
 * // - Array: ["Action", "Drama"] or [{ name: "Action" }, { name: "Drama" }]
 * // - Object: { 0: "Action", 1: "Drama" } or { name: "Action" }
 * // - JSON string: '{"name":"Action"}'
 */

interface RenderTagsProps {
  tags?: unknown;
  className?: string;
}


function normalizeToStringArray(input: unknown): string[] {
  const out: string[] = [];

  if (input == null) return out;

  // If it's already an array-like structure
  if (Array.isArray(input)) {
    for (const item of input) {
      if (item == null) continue;
      if (typeof item === 'string') {
        // strings may be JSON too
        try {
          const parsed = JSON.parse(item);
          if (parsed == null) continue;
          if (Array.isArray(parsed)) {
            out.push(...normalizeToStringArray(parsed));
            continue;
          }
          if (typeof parsed === 'object') {
            const val = (parsed as Record<string, unknown>).name ?? (parsed as Record<string, unknown>).id ?? parsed;
            out.push(String(val).trim());
            continue;
          }
          out.push(String(parsed).trim());
          continue;
        } catch (_e) {
          out.push(item.trim());
          continue;
        }
      }
      if (typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const v = obj.name ?? obj.id ?? Object.values(obj)[0];
        if (v != null) out.push(String(v).trim());
        continue;
      }
      out.push(String(item).trim());
    }
    return out.filter(Boolean);
  }

  // If input is a string, try JSON parse, otherwise split by comma
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return out;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return normalizeToStringArray(parsed);
      if (parsed && typeof parsed === 'object') {
         return normalizeToStringArray([parsed]);
      }
      // fall through to comma-split
    } catch (_e) {
      // not JSON
    }
    return s.split(',').map((v) => v.trim()).filter(Boolean);
  }

  // If input is an object (not array), return its values
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    return Object.values(obj).map((v) => String(v).trim()).filter(Boolean);
  }

  // Fallback
  return [String(input)].map((v) => v.trim()).filter(Boolean);
}

export const RenderTags: React.FC<RenderTagsProps> = ({ tags, className = '' }) => {
  const tagArray = normalizeToStringArray(tags);
  if (tagArray.length === 0) return null;

  return (
    <>
      {tagArray.map((tag, idx) => (
        <span
          key={idx}
          className={className || 'border-1 border-[#fbb033] text-white px-1 md:px-2 py-1 rounded-full text-[10px] md:text-xs font-medium'}
        >
          {tag}
        </span>
      ))}
    </>
  );
};

interface RenderRegionProps {
  region?: unknown;
  className?: string;
}

export const RenderRegion: React.FC<RenderRegionProps> = ({ region, className = '' }) => {
  const regionArray = normalizeToStringArray(region);
  if (regionArray.length === 0) return null;

  return (
    <>
      {regionArray.map((reg, idx) => (
        <span
          key={idx}
          className={className || 'border-1 border-[#fbb033] text-white px-1 md:px-2 py-1 rounded-full text-[10px] md:text-xs font-medium'}
        >
          {reg}
        </span>
      ))}
    </>
  );
};

interface RenderLanguageProps {
  language?: unknown;
  className?: string;
}

export const RenderLanguage: React.FC<RenderLanguageProps> = ({ language, className = '' }) => {
  const languageArray = normalizeToStringArray(language);
  if (languageArray.length === 0) return null;

  return (
    <>
      {languageArray.map((lang, idx) => (
        <span
          key={idx}
          className={className || 'border-1 border-[#fbb033] text-white px-1 md:px-2 py-1 rounded-full text-[10px] md:text-xs font-medium'}
        >
          {lang}
        </span>
      ))}
    </>
  );
};

interface RenderCastProps {
  actors?: unknown;
  className?: string;
}

export const RenderCast: React.FC<RenderCastProps> = ({ actors, className = '' }) => {
  const actorArray = normalizeToStringArray(actors);
  if (actorArray.length === 0) return null;

  return (
    <>
      {actorArray.map((actor, idx) => (
        <span
          key={idx}
          className={className || 'bg-gray-700 text-white px-3 py-1 rounded-full text-sm'}
        >
          {actor}
        </span>
      ))}
    </>
  );
};

interface RenderDirectorProps {
  director?: unknown;
  className?: string;
}

export const RenderDirector: React.FC<RenderDirectorProps> = ({ director, className = '' }) => {
    // console.log('Rendering director with value:', director,typeof director);
  const directorArray = normalizeToStringArray(director);
  if (directorArray.length === 0) return null;

  return (
    <>
      {directorArray.map((dir, idx) => (
        <span
          key={idx}
          className={className || 'text-white'}
        >
          {dir}
        </span>
      ))}
    </>
  );
};
