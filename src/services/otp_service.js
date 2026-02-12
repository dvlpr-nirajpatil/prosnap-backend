const axios = require("axios");

module.exports.sendOtp = async (number) => {
  try {
    let url = `https://2factor.in/API/V1/${process.env.API_KEY}/SMS/${number}/AUTOGEN3/${process.env.TEMPLATE}`;

    if (process.env.TEST_CREDENTIALS.includes(number)) {
      url = `https://2factor.in/API/V1/${process.env.API_KEY}/SMS/${number}/${process.env.STATIC_OTP}/${process.env.TEMPLATE}`;
    }

    return await axios.get(url);
  } catch (e) {
    throw e;
  }
};

module.exports.verifyOtp = async (number, otp) => {
  try {
    return await axios.get(
      `https://2factor.in/API/V1/${process.env.API_KEY}/SMS/VERIFY3/${number}/${otp}`
    );
  } catch (e) {
    throw e;
  }
};
