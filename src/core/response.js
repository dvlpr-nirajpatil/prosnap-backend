const response = (res, status, message = null, data = null, error = null) => {
  const payload = {
    status,
  };

  if (message) {
    payload.message = message;
  }

  if (data) {
    payload.data = data;
  }

  if (error) {
    payload.error = error;
  }

  return res.status(status).json(payload);
};

module.exports = response;
