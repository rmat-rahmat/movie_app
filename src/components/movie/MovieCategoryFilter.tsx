import React, { useState } from "react";

type MovieCategoryFilterProps = {
  categories: string[];
  display?: string;
};

const MovieCategoryFilter: React.FC<MovieCategoryFilterProps> = ({ categories, display }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <>
      {display === 'mobile' && <hr className="flex md:hidden h-1 rounded-full bg-gradient-to-r from-[#e50914] via-[#b20710] to-[#e50914] border-0 mt-18" />}
      <div
        className={`
          flex justify-center w-full overflow-x-auto mt-2 mb-5
          ${display === 'mobile'
            ? "overflow-x-auto mt-2 mb-5 md:hidden"
            : "hidden md:flex"}
        `}
        style={{ scrollbarWidth: "none" }}
      >
        <div
          className="flex w-full gap-2 md:gap-4 px-2 py-1"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={`px-3 py-1 md:px-4 md:py-2 whitespace-nowrap rounded-md hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === category
                  ? "bg-gradient-to-b from-[#e50914] to-[#b20710] text-white"
                  : "text-gray-300 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#e50914] hover:text-white transition-colors duration-300"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </>
  );
};

export default MovieCategoryFilter;