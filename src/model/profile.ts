import { Schema, model } from 'mongoose';


const Profile = new Schema({
    phone: { type: String, required: true, unique: true, minLength: 10 },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    birthday: { type: String, required: true },
    avatar: { type: String },
})

export default model("profile", Profile);