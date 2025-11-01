// Get color scheme based on category name
export const getCategoryColors = (name) => {
  const colors = {
    "Class Standing": {
      gradient: "from-blue-400 to-blue-500",
      bg: "bg-blue-50/80",
      border: "border-blue-300/60",
      text: "text-blue-800",
      badge: "bg-blue-500",
      light: "bg-blue-100/70",
      hover: "hover:bg-blue-50"
    },
    "Laboratory": {
      gradient: "from-purple-400 to-purple-500",
      bg: "bg-purple-50/80",
      border: "border-purple-300/60",
      text: "text-purple-800",
      badge: "bg-purple-500",
      light: "bg-purple-100/70",
      hover: "hover:bg-purple-50"
    },
    "Major Output": {
      gradient: "from-emerald-400 to-emerald-500",
      bg: "bg-emerald-50/80",
      border: "border-emerald-300/60",
      text: "text-emerald-800",
      badge: "bg-emerald-500",
      light: "bg-emerald-100/70",
      hover: "hover:bg-emerald-50"
    }
  };
  return colors[name] || colors["Class Standing"];
};
