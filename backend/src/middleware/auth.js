export function isAuthenticated(req, res, next) {
  // Placeholder authentication logic
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify token logic (e.g., using JWT)
    // const decoded = jwt.verify(token, 'your-secret-key');
    // req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
