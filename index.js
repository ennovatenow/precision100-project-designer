const debug = require("debug")("evolvus-precision100:index");
var PropertiesReader = require("properties-reader");
var fs = require("fs");
var path = require("path");
var projectDao = require("./projectDao");
var repositoryDao = require("./repositoryDao");

var projectService = require("./projectService");

var bodyParser = require("body-parser");

var express = require("express");
var app = express();

var hbs = require("express-handlebars");

var properties = new PropertiesReader("application.properties");
var repoNamesProperty = properties.get("app.repository");
var repoNames = repoNamesProperty.split(",");

var storedir = properties.get("app.store.dir");
if (!fs.existsSync(storedir)) {
  fs.mkdirSync(storedir, 0744);
}

var repos = repoNames.map(function(repoName) {
  var repoJson = path.format({
    root: "/ignored",
    dir: storedir,
    name: repoName,
    ext: ".json"
  });
  console.log(repoJson);
  if (fs.existsSync(repoJson)) {
    return JSON.parse(fs.readFileSync(repoJson, "utf8"));
  }
});
console.log(repos);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.set('view engine', 'hbs');
app.engine('hbs', hbs({
  extname: 'hbs',
  defaultView: 'default',
  layoutsDir: __dirname + '/views/pages/',
  partialsDir: __dirname + '/views/partials/'
}));

var router = express.Router();

var path = __dirname + "/views/";

app.use("/public", express.static("public"));
app.use("/", router);


router.get("/", function(req, res, next) {
  var respVars = {
    layout: "index",
    title: "Precision 100 Project Designer",
    repos: null,
  };
  projectDao.findAllTriples((err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "repos": docs,
      });
    }
    res.render("index", respVars)
  });;
});

router.get("/project", function(req, res, next) {
  var respVars = {
    layout: "default",
    title: "Start a new Project",
    repos: null,
    templates: null,
    saveSuccess: false,
    saveFailure: false
  };
  repositoryDao.findAll((errRepo, repos) => {
    if (errRepo == null) {
      projectDao.findAll((errProj, projects) => {
        if (errProj == null) {
          respVars = Object.assign(respVars, {
            "repos": repos,
            "templates": projects
          });
        }
        return res.render("project", respVars);
      });
    } else {
      return res.render("project", respVars);
    }
  });
});

router.post("/project", function(req, res, next) {
  var projectName = req.body.projectName;
  var description = req.body.description;
  var publish = req.body.publish;
  var template = req.body.templateName;
  var repoName = req.body.repositoryName;

  if (typeof publish === "undefined") {
    publish = false;
  }

  var respVars = {
    layout: "default",
    title: "Start a new Project",
    repos: null,
    templates: null,
    saveSuccess: false,
    saveFailure: false
  };
  projectDao.save(projectName, description, template, repoName, publish, (err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "saveSuccess": true,
        "saveFailure": false
      });
    } else {
      respVars = Object.assign(respVars, {
        "saveSuccess": false,
        "saveFailure": true
      });
      res.render("project", respVars);
    }
  });

});

router.get("/dataflow", function(req, res, next) {
  var respVars = {
    layout: "default",
    title: "Add a Dataflow to the Project",
    repos: null,
    saveSuccess: false,
    saveFailure: false
  };

  projectDao.findAll((err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "repos": docs
      });
    }
    return res.render("dataflow", respVars);
  });
});

router.post("/dataflow", function(req, res, next) {
  var projectName = req.body.projectName;
  var description = req.body.description;
  var dataflowName = req.body.dataflowName;
  var respVars = {
    layout: "default",
    title: "Add a Dataflow to the Project",
    repos: null,
    saveSuccess: false,
    saveFailure: false
  };

  projectDao.saveDataflow(projectName, dataflowName, description, (err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "saveSuccess": true,
        "saveFailure": false
      });
    } else {
      respVars = Object.assign(respVars, {
        "saveSuccess": false,
        "saveFailure": true
      });
    }
    return res.render("dataflow", respVars);
  });
});


router.get("/pipeline", function(req, res, next) {
  var respVars = {
    layout: "default",
    title: "Add a Pipeline to a Dataflow",
    repos: null,
    saveSuccess: false,
    saveFailure: false
  };
  projectDao.findAll((err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "repos": docs
      });
    }
    return res.render("pipeline", respVars);
  });
});

router.post("/pipeline", function(req, res, next) {
  var dataflowName = req.body.dataflowName;
  var description = req.body.description;
  var pipelineName = req.body.pipelineName;
  var respVars = {
    layout: "default",
    title: "Add a Pipeline to a Dataflow",
    repos: null,
    saveSuccess: false,
    saveFailure: false
  };

  projectDao.savePipeline(dataflowName, pipelineName, description, (err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "saveSuccess": true,
        "saveFailure": false
      });
    } else {
      respVars = Object.assign(respVars, {
        "saveSuccess": false,
        "saveFailure": true
      });
    }
    return res.render("pipeline", respVars);
  });
});


router.get("/container", function(req, res, next) {
  var respVars = {
    layout: "default",
    title: "Add a Container to a Pipeline",
    repos: null,
    saveSuccess: false,
    saveFailure: false
  };
  projectDao.findAll((err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "repos": docs
      });
    }
    return res.render("container", respVars);
  });
});

router.post("/container", function(req, res, next) {
  var containerName = req.body.containerName;
  var description = req.body.description;
  var pipelineName = req.body.pipelineName;
  var respVars = {
    layout: "default",
    title: "Add a Container to a Pipeline",
    repos: null,
    saveSuccess: false,
    saveFailure: false
  };

  projectDao.saveContainer(pipelineName, containerName, description, (err, docs) => {
    if (err == null) {
      respVars = Object.assign(respVars, {
        "saveSuccess": true,
        "saveFailure": false
      });
    } else {
      respVars = Object.assign(respVars, {
        "saveSuccess": false,
        "saveFailure": true
      });
    }
    return res.render("container", respVars);
  });
});

router.get("/manage", function(req, res, next) {
  res.render("manage", {
    layout: "default",
    title: "Manage Projects"
  });
});

router.get("/settings", function(req, res, next) {
  repositoryDao.findAllPairs((err, doc) => {
    if (err == null) {
      return res.render("settings", {
        layout: "default",
        title: "Settings",
        repos: doc,
        saveSuccess: false,
        saveFailure: false,
      });
    } else {
      return res.render("settings", {
        layout: "default",
        title: "Settings",
        repos: doc,
        saveSuccess: false,
        saveFailure: false
      });
    }
  });
});

router.post("/settings", function(req, res) {
  var repositoryName = req.body.repositoryName;
  var description = req.body.description;
  var url = req.body.url;

  repositoryDao.save(repositoryName, description, url, (err, doc) => {
    if (err == null) {
      repositoryDao.findAllPairs((err, doc) => {
        if (err == null) {
          return res.render("settings", {
            layout: "default",
            title: "Settings",
            repos: doc,
            saveSuccess: true,
            saveFailure: false
          });
        } else {
          console.log("repos are: " + JSON.stringify(doc, null, 2));
          return res.render("settings", {
            layout: "default",
            title: "Settings",
            repos: doc,
            saveSuccess: false,
            saveFailure: true
          });
        }
      });
    } else {
      return res.render("settings", {
        layout: "default",
        title: "Settings",
        repos: doc,
        saveSuccess: false,
        saveFailure: true
      });
    }
  });
});

router.get("/files", function(req, res, next) {
  res.render("files", {
    layout: "default",
    title: "Upload Files to Container"
  });
});

router.get("/mapping", function(req, res, next) {
  res.render("mapping", {
    layout: "default",
    title: "Upload Mapping Sheets"
  });
});

app.use(" * ", function(req, res) {
  res.send("Error 404: Not Found!");
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
