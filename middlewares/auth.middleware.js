import jwt from "jsonwebtoken";
const auth = (req, res, next) => {
  try {
    let token = req.headers.authorization || req.headers.Authorization;

    if (token) {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { _id: decoded._id, name: decoded.name, role: decoded.role }; 
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default auth;
