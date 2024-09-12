import dotenv from 'dotenv';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
dotenv.config();

export const createToken = (payload) => {
  const accessToken = sign(
    { userId: payload.userId, email: payload.email },
    process.env.ACCESS_TOKEN_SECRET
  );
  return accessToken;
};

export const verifyToken = (req, res, next) => {
  // fetch token from bearer
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send('Access Denied');
  }
  const payload = verify(token, process.env.ACCESS_TOKEN_SECRET);
  if (payload) {
    req.user = payload;
    return next();
  }
};
