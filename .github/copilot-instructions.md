# AI Coding Agent Instructions

Welcome to the `seefu_tv` codebase! This document provides essential guidelines for AI coding agents to be productive in this project. Follow these instructions to understand the architecture, workflows, and conventions specific to this repository.

---

## Project Overview

This is a **Next.js** application designed for video streaming. It uses the **App Router** (`src/app`) and is optimized for static export. Key features include:

- **Video Uploads**: Supports movies and series uploads with metadata, tags, and categories.
- **Internationalization (i18n)**: Managed via `i18next`.
- **Dynamic Video Listings**: Includes components like `DashboardItem` and `MovieModal` for consistent UI.
- **Server-Driven Data**: Categories, tags, and other metadata are fetched from APIs and cached locally.

---

## Key Directories

- **`src/app`**: Contains Next.js pages and layouts.
  - `upload/`: Handles movie and series uploads.
  - `category/`, `search/`: Dynamic routes for browsing content.
- **`src/components`**: Reusable UI components.
  - `movie/`: Components for video cards, modals, and grids.
  - `ui/`: Generic UI elements like `UploadSuccessModal`.
- **`src/lib`**: API clients and utility functions.
  - `movieApi.ts`: Handles category and video-related API calls.
  - `tagAPI.ts`: Manages tag-related operations.
- **`public/locales`**: Translation files for i18n.

---

## Developer Workflows

### Build and Run
- **Development**: `npm run dev` or `yarn dev`
- **Build**: `yarn build` (outputs to `.next/`)
- **Static Export**: Ensure `next.config.ts` has `output: 'export'`.

### Testing
- No explicit test framework is configured. Add tests under `src/tests/` if needed.

### Debugging
- Use `debugLog` utility in upload components for consistent logging.

---

## Project-Specific Conventions

### API Integration
- Use `src/lib/*API.ts` for all server interactions.
- Cache data locally using `localStorage` or in-memory variables (e.g., `inMemoryCategoriesCache`).

### i18n
- Add new translation keys to `public/locales/en/common.json`.
- Use `useTranslation` hook for localized strings.

### Component Patterns
- **Forms**: Use `useState` for form state and `useEffect` for side effects.
- **Modals**: Use `UploadSuccessModal` for consistent user feedback.

---

## Examples

### Adding a Category Dropdown
Use `getCachedCategories` from `movieApi.ts` to populate a dropdown:

```tsx
const [categories, setCategories] = useState<CategoryItem[]>([]);

useEffect(() => {
  const cachedCategories = getCachedCategories();
  if (cachedCategories) {
    setCategories(cachedCategories);
  }
}, []);

<select>
  {categories.map((category) => (
    <option key={category.id} value={category.id}>
      {category.categoryName || category.categoryAlias || category.id}
    </option>
  ))}
</select>
```

---

## External Dependencies

- **Next.js**: Framework for server-side rendering and static site generation.
- **i18next**: Library for internationalization.
- **Axios**: HTTP client for API calls.

---

For further questions or updates, refer to the `README.md` or contact the project maintainers.
