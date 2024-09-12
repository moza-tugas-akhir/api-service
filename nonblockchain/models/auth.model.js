import mongoose from 'mongoose';

const AuthSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    pwd: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Auth = mongoose.model('Auth', AuthSchema);

// module.exports = DocMetadata;
