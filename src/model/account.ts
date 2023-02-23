import { Schema, model } from 'mongoose';


const Account = new Schema({
    phone: { type: String, required: true, unique: true, minLength: 10 },
    password: { type: String, required: true, minLength: 8 },
})

export default model("account", Account);