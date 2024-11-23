import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import NodeCache from "node-cache";
const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour cache
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone values when getting from cache
  deleteOnExpire: true, // Delete expired keys automatically
  // Optionally enable statistics
  enableStatistics: true,
});
const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Validate input fields
  if (!name || !email || !password || !role || !phone) {
    return res.status(400).send("Name, email, role, phone, and password are required");
  }

  try {
    // Check if a user with the same email and role already exists
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(400).json({
        message: "User creation failed, email and role combination already exists.",
      });
    }

    // Create the new user if no duplicate is found
    const newUser = new User({ name, email, password, role, phone });
    await newUser.save();

    return res.status(201).json({
      message: "User created successfully",
    });

  } catch (error) {
    // Handle other errors
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).send("Email, password, and role are required");
  }

  try {
    // Find user with the specified role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign(
      { _id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "90d" }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
    });
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
    res.json({ message: "Password updated successfully" });
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

  try {
    // Fetch the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check the current user's role and apply logic based on it
    if (req.user.role === 'admin') {
      // Admins can update all fields, including roles
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = password;
      if (role) user.role = role; // Allow updating role if provided and user is admin
    } else if (req.user.role === 'user') {
      // Regular users can only update specific fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = password;
    } else {
      return res.status(403).send("Unauthorized action");
    }

    // Save the updated user information to the database
    await user.save();

    // Construct the updated user profile object
    const updatedUserProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    // Generate the cache key for the user profile
    const cacheKey = `user-profile-${req.user._id}`;

    // Delete the old cache
    cache.del(cacheKey);

    // Update the cache with the new user profile
    cache.set(cacheKey, updatedUserProfile);

    res.status(200).json({ message: "User updated successfully"});
  } catch (error) {
    // Handle errors gracefully
    res.status(500).send(error.message);
  }
};


const getUserProfile = async (req, res) => {
  try {
    // Generate a unique cache key based on the user ID
    const cacheKey = `user-profile-${req.user._id}`;

    // Check if user profile is available in the cache
    const cachedUserProfile = cache.get(cacheKey);
    if (cachedUserProfile) {
      console.log('Serving user profile from cache');
      return res.status(200).json(cachedUserProfile);
    }

    // Fetch the user by ID from the database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Construct the user profile object
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    // Store the user profile in cache with the cache key
    cache.set(cacheKey, userProfile);

    // Return the user's profile
    res.status(200).json(userProfile);
  } catch (error) {
    // Handle errors gracefully
    res.status(500).send(error.message);
  }
};

export { register, login, forgetPassword, refreshToken, updateUserInfo,getUserProfile };