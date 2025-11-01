import React from "react";
import { CategoryCard } from "./CategoryCard";

export function CategoryCardsList({ categories }) {
  return (
    <div className="space-y-8">
      {categories.map((cat) => (
        <CategoryCard 
          key={cat.name} 
          name={cat.name} 
          weightLabel={cat.weightLabel} 
          percent={cat.percent} 
          rows={cat.rows} 
        />
      ))}
    </div>
  );
}
