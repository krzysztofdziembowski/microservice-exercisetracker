const express = require('express')
const app = express()
const cors = require('cors')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_DB_URI)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
}})

userSchema.methods.getData = function() {
  return {
    username: this.username,
    _id: this._id.toString()
  }
}

const User = mongoose.model("User", userSchema)

const exerciseSchema = new mongoose.Schema({
  username: { type: String },
  description: { type: String },
  duration: { type: Number },
  date: { type: Date }
})

const Exercise = mongoose.model("Exercise", exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use(bodyparser.urlencoded({extended: false}))

//Exercise.deleteMany({}).then(data => {})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  if( username == "") {
    res.json({"error": "invalid username"})
    return
  }

  let newUser = new User({"username": username});
  newUser.save()
  .then(data => {
    res.json(data.getData())
  })
  .catch(err => {
    res.json({"error": "invalid username"})
  })
})

app.get('/api/users', (req, res) => {
  User.find()
  .then(data => {
    res.json(data.map(u => u.getData()))
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
