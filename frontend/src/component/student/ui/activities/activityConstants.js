// Get color scheme based on category name
export const getCategoryColors = (name) => {
  const colors = {
    "Class Standing": {
      bg: "bg-blue-50",
      border: "border-gray-300/60",
      text: "text-blue-800",
      badge: "bg-blue-50",
      iconColor: "bg-blue-500",
      light: "bg-blue-100/70",
      hover: "hover:bg-blue-50",
      line: "text-blue-600",
      cell: "bg-blue-100",
      num: "text-blue-700"
    },
    "Laboratory": {
      bg: "bg-green-50",
      border: "border-gray-300/60",
      text: "text-green-800",
      badge: "bg-green-50",
      iconColor: "bg-green-500",
      light: "bg-green-100/70",
      hover: "hover:bg-green-50",
      line: "text-green-600",
      cell: "bg-green-100",
      num: "text-green-700"
    },
    "Major Output": {
      bg: "bg-purple-50",
      border: "border-gray-300/60",
      text: "text-purple-800",
      badge: "bg-purple-50",
      iconColor: "bg-purple-500",
      light: "bg-purple-100/70",
      hover: "hover:bg-purple-50",
      line: "text-purple-600",
      cell: "bg-purple-100",
      num: "text-purple-700"
    }
  };
  return colors[name] || colors["Class Standing"];
};
