import { google } from 'googleapis';
import { readMultipartFormData } from 'h3'; // Assuming you are using h3
import apikeys from './apikeys.json'; //Creating API Key JSON File for authentication  https://console.cloud.google.com/ https://protocoderspoint.com/nodejs-script-to-upload-file-to-google-drive-using-googleapis/
import { PassThrough } from 'stream';

export default defineEventHandler(async (event) => {
  const SCOPE = ['https://www.googleapis.com/auth/drive'];

  // Promisify authorize function
  const authorize = async () => {
    const jwtClient = new google.auth.JWT(
      apikeys.client_email,
      null,
      apikeys.private_key,
      SCOPE
    );
    await jwtClient.authorize();
    return jwtClient;
  };

  const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  // Promisify uploadFile function
  const uploadFile = (authClient, fileBuffer, fileName, mimeType) => {
    return new Promise((resolve, reject) => {
      const drive = google.drive({ version: 'v3', auth: authClient });
      const fileMetaData = {
        name: fileName,
        parents: ['15xT8yFgdylvQjdh3gxnHG8XwukHyEXGk3'] // A folder ID to which the file will get uploaded
      };

      const bufferStream = new PassThrough();
      bufferStream.end(fileBuffer);

      const media = {
        mimeType: mimeType,
        body: bufferStream
      };

      drive.files.create({
        resource: fileMetaData,
        media: media,
        fields: 'id, name, webViewLink' // Specify data you want to receive
      }, (error, res) => {
        if (error) {
          reject(error); // Reject on error
        } else {
          resolve(res); // Resolve on success
        }
      });
    });
  };

  try {
    // Authorize the client
    const authClient = await authorize();

    // Read files from the multipart form data
    const files = await readMultipartFormData(event);
    const uploadPromises = files.map(file => {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
      const randomString = generateRandomString(20);
      const fileName = `${formattedDate}_${randomString}_${file.filename}`;

      return uploadFile(authClient, file.data, fileName, file.mimetype);
    });

    // Upload each file to Google Drive
    const uploadedFiles = await Promise.all(uploadPromises);

    return uploadedFiles.map(file => file.data);
  } catch (error) {
    return error;
  }
});
