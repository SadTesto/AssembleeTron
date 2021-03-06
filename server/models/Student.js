"use strict";
const mongoose = require('mongoose');
const { Schema } = mongoose;

const Student = new Schema({
    studentId: Number,
    name: String,
    surname: String,
    section: String
});

module.exports = mongoose.model('Student', Student);