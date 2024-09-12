import mongoose from 'mongoose';

const DocMetadaSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    docId: {
      type: String,
      required: true,
    },

    docName: {
      type: String,
      required: true,
    },

    docType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// const DocMetadata = mongoose.model('DocMetadata', DocMetadaSchema);
export const DocMetadata = mongoose.model('DocMetadata', DocMetadaSchema);

// module.exports = DocMetadata;
