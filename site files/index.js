const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require("fs");
const bcrypt = require('bcrypt');

const { MongoClient, ObjectID } = require("mongodb");

const port = 3001;
const db_uri = "mongodb+srv://135team:cse135datapass@cse135hw3.hsvbe.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(db_uri);

//returns true if a user with that identifier exists
async function getUser(identifier, isEmail = false)
{
  const searchObject = isEmail ? {email: identifier} : {username: identifier};
  await client.connect(); 
  let collection = await client.db("Users").collection("data");
  let user = await collection.findOne(searchObject);
  return user;
}

function checkAndSend(path, res)
{
  if (!fs.existsSync(path))
  {
    res.status(404).send("sorry can't find that!");
    console.log("could not find", path);
    return;
  }
  res.sendFile(path);
}

function authenticated(req)
{
  if (!req.session.username)
    return false;
  return true;
}

function isAdmin(req)
{
  if (authenticated(req) && req.session.isAdmin)
    return true;
  return false;
}

async function login(identifier, password)
{
  if (identifier == undefined || password == undefined)
    return null;
  
  const isEmail = identifier.includes("@");
  const user = await getUser(identifier, isEmail);

  if (user == null)
    return null;

  const match = bcrypt.compareSync(password, user.password_hash);

  if (match)
    return user;
  else
    return null;
}

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(session(
  {
    secret: 'testing', 
    resave: false, 
    saveUninitialized: false
  }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  if (!authenticated(req))
  {
    res.redirect('/login')
    return;
  }
  checkAndSend(path.join(__dirname, "/site/index.html"), res);
});

app.get('/login', (req, res) => {
  checkAndSend(path.join(__dirname, '/site/login.html'), res);
});

app.post('/auth', async (req, res) => {
    //try to login
    const user = await login(req.body.username, req.body.password);
    if (user == null)
    {
      res.redirect('/login');
      return;
    }

    //if authentication was successful setup session using session callbacks
    req.session.regenerate((err) => {
      if (err) next(err);
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin;
      
      req.session.save((err) => {
        if (err) next(err);
        res.redirect('/');
      });
    });
});

//little bit of a hack because we didn't have time to do template rendering, used to check if admin panel link should be rednered
app.get('/isadmin', (req, res) => {
  if (!isAdmin(req))
    res.status(401);
  else
    res.status(200);
  res.send();
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  checkAndSend(path.join(__dirname, '/site/logout.html'), res);
});

app.get('/metric', (req, res) => {
  if (!authenticated(req))
  {
    res.redirect('/login')
    return;
  }
  checkAndSend(path.join(__dirname, "/site/metric.html"), res);
});

app.get('/admin_panel', (req, res) => {
  if (!isAdmin(req))
  {
    res.redirect('/');
    return;
  }
  checkAndSend(path.join(__dirname, "/site/adminpanel.html"), res);
});

app.get("/users", async (req, res) => {
  if (!isAdmin(req))
  {
    res.redirect('/');
    return;
  }

  let data = {};

  try
  {
    await client.connect();
    const dbresponse = await client.db("Users").collection("data").find().toArray();
    for(const element of dbresponse)
    {
      data[element.username] = element;
    }
    await client.close();
  }
  catch(e)
  {
    await client.close();
    console.log(e);
    res.status(400);
  }

  res.send(data);
});

app.post("/users", async (req, res) => {
  if (!isAdmin(req))
  {
    res.redirect('/');
    return;
  }

  try
  {
    let data = req.body;
    const usernameTaken = getUser(data.username) != null;
    const emailTaken = getUser(data.email, true) != null;
    if (usernameTaken || emailTaken)
    {
      res.status(409);
    }
    else
    {
      let hash = bcrypt.hashSync(data.password, 8);
      let newUser = {
        username: data.username,
        email: data.email,
        password_hash: hash,
        creation_date: (new Date()).toString(),
        isAdmin: data.isAdmin == "on"
      }
      await client.connect();
      await collection.insertOne(newUser);
      await client.close();
      res.status(200);
    }
  }
  catch(e)
  {
    await client.close();
    console.log(e);
    res.status(400);
  }

  res.redirect("/admin_panel");
});

//using post as a because appache doesn't seem to want to enable put/delete
app.post("/update/:user", async (req, res) => {
  if (!isAdmin(req))
  {
    res.redirect('/');
    return;
  }
  try
  {
    let updateObj = req.body;

    if (req.body.password)
    {
      updateObj.password_hash = bcrypt.hashSync(req.body.password, 8);
      delete updateObj.password;
    }
    
    if (req.body.isAdmin)
    {
      updateObj.isAdmin = updateObj.isAdmin == "true";
    }

    await client.connect();
    const result = await client.db("Users").collection("data").updateOne({username : req.params.user}, {$set : updateObj});
    await client.close();

    if (result.matchedCount > 0)
      res.status(200);
    else
      res.status(404);
  }
  catch(e)
  {
    await client.close();
    console.log(e);
    res.status(400);
  }
  res.send();
});

app.post("/delete/:user", async (req, res) => {
  if (!isAdmin(req))
  {
    res.redirect('/');
    return;
  }

  await client.connect();
  const result = await client.db("Users").collection("data").deleteOne({username : req.params.user});
  await client.close();

  if (result.deletedCount > 0)
      res.status(200);
  else
      res.status(404);

  res.send();
});

app.use((req, res, next) => {
  res.status(404).send("sorry can't find that!");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})