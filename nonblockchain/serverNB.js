'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import mongoose from 'mongoose';
import { DocMetadata } from './models/doc-metadata.model.js';
import { minioConnect } from './connector/minio.js';

// Initializing the express app
const app = express();
app.use(bodyParser.json());
app.use(fileUpload());

const minioClient = await minioConnect();

async function uploadToMinio(fileBuffer, fileName, bucketName) {
  try {
    await minioClient.putObject(bucketName, fileName, fileBuffer);
    return { success: true, message: 'File uploaded successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Create Doc
app.post('/api/createdoc/', async function (req, res) {
  console.log('Request Body:', req.body);
  console.log('Files received:', req.files);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  try {
    const file = req.files.file;
    const documentBuffer = file.data;
    const docname = req.body.docname || file.name;
    const doctype = file.mimetype;
    // Get the current date-time
    const now = new Date();
    // Format the current date-time to ISO string format
    const formattedNow = now.toISOString();

    await uploadToMinio(documentBuffer, docname, 'test-bucket');

    const instance = new DocMetadata();

    // const docMetadata = await DocMetadata.create(req.body);
    instance.docId = req.body.docid;
    instance.docName = docname;
    instance.docType = doctype;
    const result = await instance.save();

    res
      .status(201)
      .json({ msg: 'Transaction has been submitted', response: result });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
});

// Query by user ID
app.get('/api/querydocbyuserid/:id', async function (req, res) {
  try {
    const { id } = req.params;
    const instance = await DocMetadata.findById(id);
    res.status(200).send({ instance });

    console.log(`Transaction has been evaluated, result is: ${instance}`);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
});

// Query by doc ID
app.get('/api/querydocbydocid/:docId', async function (req, res) {
  try {
    const { docId } = req.params;
    const instance = await DocMetadata.findOne({ docId: docId });
    res.status(200).send({ instance });

    console.log(`Transaction has been evaluated, result is: ${instance}`);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
});

// Query by doc name
app.get('/api/querydocbyname/:docName', async function (req, res) {
  try {
    const { docName } = req.params;
    const instance = await DocMetadata.findOne({ docName: docName });
    res.status(200).send({ instance });

    console.log(`Transaction has been evaluated, result is: ${instance}`);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).send(`Failed to submit transaction: ${error}`);
  }
});

// Download file from Minio
app.get('/api/download/:bucketName/:objectName', async (req, res) => {
  const { bucketName, objectName } = req.params;

  try {
    const dataStream = await minioClient.getObject(bucketName, objectName);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${objectName}"`
    );

    dataStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file');
  }
});

// Connect to DB
mongoose
  .connect(
    'mongodb+srv://mozasajidah:0PXMD5q6bpWIhrsM@miniodb.7iyenth.mongodb.net/Minio-Metadata?retryWrites=true&w=majority&appName=MinioDB'
  )
  .then(() => {
    console.log('Database connected!'),
      app.listen(7070, () => {
        console.log('Running on http://localhost:7070');
      });
  })
  .catch(() => {
    console.log('Connection failed:', error.message);
  });
