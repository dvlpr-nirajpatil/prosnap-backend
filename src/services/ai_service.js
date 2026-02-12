/**
 * @desc    Generate a personal profile description for Maratha matrimonial app using Gemini API
 * @route   POST /api/user/profile-description
 * @access  Private (JWT Authenticated)
 */

const response = require("../core/response");
const logger = require("../core/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports.generateProfileDescriptions = async (req, res) => {
  try {
    // 1. Get user data from request body
    const clientData = req.body;

    if (!clientData || !clientData.firstName || !clientData.dob) {
      return response(res, 400, "Missing required user data in request body.");
    }

    // Destructure data
    const {
      gender,
      firstName,
      lastName,
      dob,
      height,
      employedIn,
      education,
      occupation,
      businessAndCompanyName,
      jobOrBusinessLocation,
      annualIncome,
      caste,
      maritialStatus,
      haveChildren,
      isHandicap,
      disability,
      diet,
      hobbiesAndInterests,
    } = clientData;

    // 2. Create structured prompt for Maratha matrimonial style
    const prompt = `
Write a simple, professional, culturally appropriate matrimonial profile in first-person for a Maratha matrimonial app.
Keep it concise (4-6 sentences) and natural, without any headings, bullet points, or line breaks. 
The description should read like the person is introducing themselves personally, highlighting their lifestyle, personality, profession, and hobbies in a natural, flowing way.

User details:
Name: ${firstName} ${lastName || ""}
Gender: ${gender}
Date of Birth: ${dob}
Height: ${height || "Not specified"}
Employment: ${employedIn || "Not specified"}
Education: ${education || "Not specified"}
Occupation: ${occupation || "Not specified"}
Business/Company: ${businessAndCompanyName || "Not specified"}
Job/Business Location: ${jobOrBusinessLocation || "Not specified"}
Annual Income: ${annualIncome || "Not specified"}
Caste: ${caste}
Marital Status: ${maritialStatus}
Children: ${haveChildren || "Not specified"}
Handicap: ${isHandicap} ${disability ? `(${disability})` : ""}
Diet: ${diet || "Not specified"}
Hobbies & Interests: ${hobbiesAndInterests?.join(", ") || "Not specified"}

Make sure the description reads naturally and does not indicate it is AI-generated.
`;

    // 3. Setup Gemini SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 4. Generate content
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    // 5. Send response
    return response(res, 200, "Profile description generated successfully.", {
      profileDescription: generatedText,
    });
  } catch (e) {
    logger.error("GENERATE PROFILE DESCRIPTION", e);
    return response(res, 500, "INTERNAL SERVER ERROR");
  }
};
