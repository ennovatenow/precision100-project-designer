const debug = require("debug")("evolvus-precision100-repository:dao");
const path = require("path");
const PropertiesReader = require("properties-reader");
const properties = new PropertiesReader("application.properties");

const DataStore = require("nedb");
const storedir = properties.get("app.store.dir");
const dbdir = path.join(storedir, "db", "repository.db");

const repositoryDb = new DataStore({
  filename: dbdir,
  autoload: true,
  timestampData: true
});


module.exports.save = (repositoryName, description, url, callback) => {
  let repository = {
    "name": repositoryName,
    "description": description,
    "url": url
  };
  repositoryDb.insert(repository, (err, doc) => {
    debug("Error saving repository: " + JSON.stringify(err, null, 2));
    debug("Saved doc: " + JSON.stringify(doc, null, 2));
    callback(err, doc);
  });
};

module.exports.findAll = (callback) => {
  repositoryDb.find({})
    .sort({
      "createdAt": -1
    })
    .exec((err, docs) => {
      callback(err, docs);
    });
};

module.exports.findAllPairs = (callback) => {
  repositoryDb.find({})
    .sort({
      "createdAt": -1
    })
    .exec((err, docs) => {
      if (err == null) {
        var repos = [];
        for (var i = 0; i < docs.length; i += 2) {
          var pair;;
          if (i < docs.length)
            pair = Object.assign({}, {
              "first": docs[i]
            });
          if ((i + 1) < docs.length)
            pair = Object.assign(pair, {
              "second": docs[i + 1]
            });
          debug("pair: " + JSON.stringify(pair, null, 2));
          repos.push(pair);
        }
        return callback(err, repos);
      } else {
        return callback(err, docs);
      }
    });
};
