const axios = require("axios");

const uploadToImgBB = async (image) => {
  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        image: image.buffer.toString("base64"),
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.data.url;
  } catch (error) {
    console.error("Error uploading to ImgBB:", error.response.data);
    return null;
  }
};

module.exports = uploadToImgBB;
