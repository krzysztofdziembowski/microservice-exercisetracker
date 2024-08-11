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

app.post('/api/users/:id/exercises', (req, res) => {
  User.findById(req.params.id)
  .then(user => {
    let exercise = new Exercise({
      username: user.username,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || new Date()
    })

    exercise.save()
    .then(data => {
      res.json({
        username: user.username,
        description: data.description,
        duration: data.duration,
        date: data.date?.toDateString(),
        _id: user._id
      })
    })
    
  })
  .catch(err => {
    res.json({"error": err})
  })
})

app.get('/api/users/:id/logs', (req, res) => {
  let limit = req.query.limit || 0;
  let from = req.query.from || '1900-01-01'
  let to = req.query.to || '3000-01-01'

  User.findById(req.params.id)
  .then(user => {
    Exercise.countDocuments({username: user.username})
    .then(count => {
      Exercise.find({
        username: user.username,
        $or: [
          {
            date: {
              $gte: from,
              $lte: to
            }
          },
          { date: { $exists: false }}
        ]
      })
      .limit(limit)
      .then(data => {
        res.json({
          username: user.username,
          count: count,
          _id: user._id.toString(),
          log: data.map(e => ({
            description: e.description,
            duration: e.duration,
            date: e.date?.toDateString()
          }))
        })
      })
    })
  })
  .catch(err => {
    res.json({"error": err})
  })})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
