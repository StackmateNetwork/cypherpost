db = db.getSiblingDB('cypherpost')
db.createUser({
  user: "___USER___",
  pwd: "___PASS___",
  roles: [{
    role: "readWrite",
    db: "cypherpost"
  }]
})

db = db.getSiblingDB('admin')
db.shutdownServer()
