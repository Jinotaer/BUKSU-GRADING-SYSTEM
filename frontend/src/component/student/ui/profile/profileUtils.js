// Get Google profile picture from institutional email
export const getGoogleProfilePicture = (email) => {
  if (!email) return null;
  
  // Google's profile picture API using email
  // This works for Google Workspace accounts (institutional emails)
  return `https://lh3.googleusercontent.com/a/default-user=s96-c?email=${encodeURIComponent(email)}`;
};

// Fallback function for profile picture
export const handleImageError = (e) => {
  // If Google profile picture fails, use a default avatar
  e.target.style.display = 'none';
  e.target.nextSibling.style.display = 'flex';
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Get status color
export const getStatusColor = (status) => {
  switch (status) {
    case "Approved":
      return "green";
    case "Pending":
      return "yellow";
    case "Rejected":
      return "red";
    default:
      return "gray";
  }
};
