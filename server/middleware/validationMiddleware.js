const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

/**
 * Validates User Registration Request Body
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body || {};
  const errors = [];

  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.push("Name is required");
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("Valid email address is required");
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (role && !["student", "admin"].includes(role)) {
    errors.push("Role must be either 'student' or 'admin'");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Validation Failed: ${errors.join(", ")}`,
      errors,
    });
  }

  next();
};

/**
 * Validates User Login Request Body
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("Valid email address is required");
  }

  if (!password || typeof password !== "string" || password === "") {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Validation Failed: ${errors.join(", ")}`,
      errors,
    });
  }

  next();
};
