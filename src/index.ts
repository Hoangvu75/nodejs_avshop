import express from "express";
import mongoose from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";

import Account from "./model/account";
import Profile from "./model/profile";

import * as ACCESS_LINK from "./utils/access_link";
import * as API_LINK from "./utils/api_link";

const app = express();
app.use(express.json());

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET||'secret';

function initate_server() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Listening to server: ${PORT}\nConnecting to the database...`);
  });
}

function setup_database_connection() {
  mongoose.connect(ACCESS_LINK.DB_CONNECTION_STRINGS, function (err) {
    console.log("Initialization completed.");
    if (err) {
      console.log("Connection error");
      throw err;
    }
  });
}

function setup_get_request() {
  app.get("/", function (_req: any, res: any) {
    res.status(200).send("Hello world!");
  });

  app.get(API_LINK.LINK_PROFILE_ACCOUNT, function (req: any, res: any) {
    // Get the token from the request header
    const token = req.headers["authorization"];
    var ObjectId = require('mongodb').ObjectID;

    jwt.verify(token, ACCESS_TOKEN_SECRET, { complete: true }, function (err) {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
      const payload = decoded as JwtPayload;
      Account.findOne({ "_id": new ObjectId(payload.id) }, function (err: any, account: any) {
        if (!account) {
          return res.status(404).send({
            success: false,
            message: "Invalid account data.",
          });
        }
        // Return the user data in the response
        res.status(200).send({
          success: true,
          account,
        });
      });
    });
  });

  app.get(API_LINK.LINK_PROFILE_GET_PROFILE_DATA, function (req: any, res: any) {
    // Get the token from the request header
    const token = req.headers["authorization"];
    var ObjectId = require('mongodb').ObjectID;

    jwt.verify(token, ACCESS_TOKEN_SECRET, { complete: true }, function (err) {
      if (err) return res.sendStatus(401);
      // Find the user in the database using the decoded token
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
      const payload = decoded as JwtPayload;
      Account.findOne({ "_id": new ObjectId(payload.id) }, function (err: any, account: any) {
        if (!account) {
          return res.status(404).send({
            success: false,
            message: "Invalid account data.",
          });
        }

        Profile.findOne({ "phone": account.phone }, function (err: any, profile: any) {
          res.status(200).send({
            success: true,
            profile: profile,
          });
        });
      });
    });
  });
}

function setup_post_request() {
  app.post(API_LINK.LINK_AUTH_REGISTER, async (req: any, res: any) => {
    try {
      const account = new Account(req.body);
      await account.save();
      return res.status(200).send({
        success: true,
        message: "Create account successfully",
        account: account,
      });
    } catch (err) {
      return res.send({ message: `${err}` });
    }
  });

  app.post(API_LINK.LINK_PROFILE_CREATE_PROFILE, async (req: any, res: any) => {
    try {
      const profile = new Profile(req.body);
      await profile.save();
      return res.status(200).send({
        success: true,
        message: "Create profile successfully",
        profile: profile,
      });
    } catch (err) {
      return res.send({ message: `${err}` });
    }
  });

  app.post(API_LINK.LINK_AUTH_LOGIN, (req, res) => {
    // find the user with the given phone
    Account.findOne(
      { phone: req.body.phone },
      (err: any, account: { password: any; _id: any }) => {
        if (!account) {
          return res.status(404).send({
            success: false,
            message: "Wrong phone or password.",
          });
        }

        const passwordIsValid = account.password === req.body.password;
        if (!passwordIsValid) {
          return res.status(401).send({
            success: false,
            message: "Wrong phone or password.",
          });
        }

        // if the phone and password are correct, create a JWT
        const token = jwt.sign({ id: account._id },  ACCESS_TOKEN_SECRET, {
          expiresIn: 86400, // expires in 24 hours
        });

        // return the token in the response
        return res.status(200).send({
            success: true,
            message: "Login successfully",
            token,
            account,
        });
      }
    );
  });
}

async function main() {
  initate_server();
  setup_database_connection();
  setup_get_request();
  setup_post_request();
}
main();
