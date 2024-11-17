import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).send("Name, email, role, and password are required");
  }

  try {
    // Create the new user if email and role combination is unique
    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
    });

  } catch (error) {
    // Check for duplicate key error (if email and role combination is violated)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "User creation failed, possibly due to duplicate email and role combination.",
      });
    }
    res.status(500).send(error.message);
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const user = await User.findOne({ email});
    if (!user) {
      return res.status(404).send("User not found");
    }
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }
    const token = jwt.sign({ _id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: "90d" });
    res.status(200).json({ token, user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }});
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const forgetPassword = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).send("Email, new password, and role are required");
  }

  try {
    // Find the user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).send("User with the specified role not found");
    }

    // Update the user's password
    user.password = password;
    await user.save();
    res.send("Password updated successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const refreshToken = (req, res) => {
  // Ensure the Authorization header is present
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(" ")[1];

  // Verify and decode the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(403).json({ message: "Forbidden" });
    }

    // Log the decoded payload for debugging
    console.log("Token verified successfully. Decoded payload:", decoded);

    // Extract necessary fields from the decoded token
    const { _id, name, role } = decoded;

    // Create a new token with the same user details
    const newToken = jwt.sign(
      { _id, name, role },
      process.env.JWT_SECRET,
      { expiresIn: "90d" } // Use the same expiration time as in `login`
    );

    console.log("New Token:", newToken);

    return res.status(200).json({
      message: "Token refreshed successfully!",
      token: newToken,
    });
  });
};

const updateUserInfo = async (req, res) => {
  const { name, email, password, role } = req.body; // Include role if needed for updates.

  // Validate the required fields
  if (!name || !email || !password) {
    return res.status(400).send("Name, email, and password are required");
  }

  try {
    // Fetch the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check the current user's role and apply logic based on it
    if (req.user.role === 'admin') {
      // Admins can update all fields, including roles
      user.name = name;
      user.email = email;
      user.password = password;
      if (role) {
        user.role = role; // Allow updating role if provided and user is admin
      }
    } else if (req.user.role === 'user') {
      // Regular users can only update specific fields
      user.name = name;
      user.email = email;
      user.password = password;
    } else {
      return res.status(403).send("Unauthorized action");
    }

    // Save updated user information
    await user.save();
    res.status(200).send("User updated successfully");
  } catch (error) {
    // Handle errors gracefully
    res.status(500).send(error.message);
  }
};

export { register, login, forgetPassword, refreshToken };
