export const healthCheck = (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SwiftContract API is running",
  });
};
