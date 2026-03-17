const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_RULES = [
  {
    test: (password) => password.length >= MIN_PASSWORD_LENGTH,
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
  },
  {
    test: (password) => /[A-Z]/.test(password),
    message: "Password must include at least one uppercase letter",
  },
  {
    test: (password) => /[a-z]/.test(password),
    message: "Password must include at least one lowercase letter",
  },
  {
    test: (password) => /\d/.test(password),
    message: "Password must include at least one number",
  },
  {
    test: (password) => /[^A-Za-z0-9]/.test(password),
    message: "Password must include at least one special character",
  },
];

export const getAdminPasswordValidationErrors = (password) => {
  const normalizedPassword = typeof password === "string" ? password : "";

  return PASSWORD_RULES.filter(({ test }) => !test(normalizedPassword)).map(
    ({ message }) => message
  );
};

export const getAdminPasswordValidationMessage = (password) =>
  getAdminPasswordValidationErrors(password)[0] || "";

export const ADMIN_PASSWORD_REQUIREMENTS_TEXT =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
