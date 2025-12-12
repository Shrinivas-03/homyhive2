const cloudinary = require('cloudinary').v2;
const msc = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET,
});

const CloudinaryStorage = msc && (msc.CloudinaryStorage || msc);

const storageParams = {
  cloudinary: cloudinary,
  params: {
    folder: 'HomyHive_DEV',
    allowedFormats: ["png","jpg","jpeg"],
  },
};

let storage;
try {
  // Try to instantiate as a class
  storage = new CloudinaryStorage(storageParams);
} catch (e) {
  try {
    // Some versions export a factory function
    storage = CloudinaryStorage(storageParams);
  } catch (err) {
    console.error('Failed to create Cloudinary storage:', e, err);
    storage = null;
  }
}

module.exports={
    cloudinary,
    storage
};