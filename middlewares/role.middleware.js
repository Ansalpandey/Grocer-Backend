const authorizeAdmin = (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      next(); // User is authorized, proceed to the next middleware/route handler
    } else {
      res.status(403).json({ message: "Access denied. Admins only." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export { authorizeAdmin };