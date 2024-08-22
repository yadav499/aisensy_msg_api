const ApiKey = require('../models/apiModel');

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized: API Key is missing' });
  }
  
  try {
    const validApiKey = await ApiKey.findOne({ key: apiKey });
    if (!validApiKey) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key' });
    }
    next();
  } catch (error) {
    console.error("Error validating API Key:", error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = authenticateApiKey;
