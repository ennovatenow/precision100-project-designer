const debug = require("debug")("evolvus-precision100-project:dao");
const path = require("path");
const PropertiesReader = require("properties-reader");
const properties = new PropertiesReader("application.properties");

const DataStore = require("nedb");
const storedir = properties.get("app.store.dir");
const dbdir = path.join(storedir, "db", "project.db");

const projectDb = new DataStore({
  filename: dbdir,
  autoload: true,
  timestampData: true
});

module.exports.findByName = (repositoryName, projectName, callback) => {
  projectDb.find({
    "name": projectName,
    "repository.name": repositoryName
  }, (err, docs) => {
    if (err == null) {
      var repos = [];
      var dataflowList = [];
      var pipelineList = [];
      var containerList = [];
      var fileList = [];
      docs.forEach((doc) => {
        doc.dataflows.forEach((d) => {
          dataflowList.push(d);
          d.pipelines.forEach((p) => {
            pipelineList.push(p);
            p.containers.forEach((c) => {
              containerList.push(c);
              c.files.forEach((f) => {
                fileList.push(f);
              });
            });
          });
        });
        var repo = Object.assign(doc, {
          "dataflowList": dataflowList,
          "pipelineList": pipelineList,
          "containerList": containerList,
          "fileList": fileList
        });
        repos.push(repo);
      });
      callback(err, repos);
    } else {
      callback(err, docs);
    }
  });
};

module.exports.saveNone = (projectName, description, repositoryName, publish, callback) => {
  debug("None template save" + JSON.stringify(callback));
  var noneProject = {
    "name": "",
    "description": "",
    "publish": false,
    "dataflows": [],
    "repository": {
      "name": "",
      "url": ""
    }
  };
  var project = Object.assign({}, noneProject);
  project.name = projectName;
  project.description = description;
  project.repository.name = repositoryName;
  project.publish = publish;

  module.exports.saveProject(project, callback);
};

module.exports.save = (projectName, description, template, repositoryName, publish, callback) => {
  debug("not none model: " + template);
  if (template == "none") {
    debug("none model");
    return module.exports.saveNone(projectName, description, repositoryName, publish, callback);
  }
  debug("not none model");
  let terms = template.split(",");
  let sourceRepoName = terms[0];
  let sourceProjectName = terms[1];

  /*
   * Find the project with the sourceRepoName and sourceProjectName
   * Copy the new attributes and create a new Project
   * (remember to remove the _id field)
   */
  projectDb.find({
    "name": sourceProjectName,
    "repository.name": sourceRepoName
  }, (err, docs) => {

    var project = Object.assign({}, docs[0]);
    delete project._id;

    project.name = projectName;
    project.description = description;
    project.repository.name = repositoryName;
    project.publish = publish;

    return module.exports.saveProject(project, callback);
  });
};

module.exports.saveProject = (project, callback) => {
  debug("Saving: " + JSON.stringify(project, null, 2));
  projectDb.insert(project, (err, doc) => {
    if (err == null) {
      debug("Saved: " + JSON.stringify(doc, null, 2));
    } else {
      debug("Error saving project: " + JSON.stringify(err, null, 2));
    }
    callback(err, doc);
  });
};

module.exports.findAll = (callback) => {
  projectDb.find({})
    .sort({
      "createdAt": -1
    })
    .exec((err, docs) => {
      callback(err, docs);
    });
};

module.exports.saveDataflow = (projectName, dataflowName, description, callback) => {
  var terms = projectName.split(",");
  var repoName = terms[0];
  var project = terms[1];

  var dataflow = {
    "name": dataflowName,
    "description": description,
    "pipelines": []
  };

  projectDb.find({
    "name": project,
    "repository.name": repoName
  }, (err, docs) => {
    if (err == null) {
      var projectObject = docs[0];
      projectObject.dataflows.push(dataflow);
      projectDb.update({
        "name": project,
        "repository.name": repoName
      }, projectObject, {}, (updErr, numReplaced) => {
        if (updErr == null) {
          debug("dataflow update success: " + numReplaced);
        } else {
          debug("error updating dataflow: " + JSON.stringify(updErr, null, 2));
        }
        callback(updErr, docs);
      });

    } else {
      callback(err, docs);
    }
  });
};

module.exports.savePipeline = (dataflowName, pipelineName, description, callback) => {
  var terms = dataflowName.split(",");
  var repoName = terms[0];
  var projectName = terms[1];
  var dataflow = terms[2];

  var pipeline = {
    "name": pipelineName,
    "description": description,
    "containers": []
  };

  projectDb.find({
    "name": projectName,
    "repository.name": repoName,
    "dataflows.name": dataflow
  }, (err, docs) => {
    if (err == null) {
      var projectObject = docs[0];

      debug("The project object: " + JSON.stringify(projectObject, null, 2));
      var dataflowObject = projectObject.dataflows.map((d) => {
        if (d.name == dataflow)
          return d;
      });

      debug("The dataflow object: " + JSON.stringify(dataflowObject, null, 2));
      dataflowObject[0].pipelines.push(pipeline);

      projectDb.update({
        "name": projectName,
        "repository.name": repoName,
        "dataflows.name": dataflow
      }, projectObject, {}, (updErr, numReplaced) => {
        if (updErr == null) {
          debug("dataflow update success: " + numReplaced);
        } else {
          debug("error updating dataflow: " + JSON.stringify(updErr, null, 2));
        }
        callback(updErr, docs);
      });

    } else {
      callback(err, docs);
    }
  });
};

module.exports.saveContainer = (template, containerName, description, callback) => {
  var terms = template.split(",");
  var repoName = terms[0];
  var projectName = terms[1];
  var dataflowName = terms[2];
  var pipelineName = terms[3];

  var container = {
    "name": containerName,
    "description": description,
    "files": []
  };

  projectDb.find({
    "name": projectName,
    "repository.name": repoName,
    "dataflows.name": dataflowName,
    "dataflows.pipelines.name": pipelineName
  }, (err, docs) => {
    if (err == null) {
      var projectObject = docs[0];

      debug("The project object: " + JSON.stringify(projectObject, null, 2));
      var pipelineObject = projectObject.dataflows.map((d) => {
        if (d.name == dataflowName) {
          return d.pipelines.map((p) => {
            if (p.name == pipelineName)
              return p;
          });
        }
      });

      debug("The pipeline object: " + JSON.stringify(pipelineObject, null, 2));
      var pipelines = pipelineObject[0];
      pipelines[0].containers.push(container);

      projectDb.update({
        "name": projectName,
        "repository.name": repoName,
        "dataflows.name": dataflowName,
        "dataflows.pipelines.name": pipelineName
      }, projectObject, {}, (updErr, numReplaced) => {
        if (updErr == null) {
          debug("pipeline update success: " + numReplaced);
        } else {
          debug("error updating pipeline: " + JSON.stringify(updErr, null, 2));
        }
        callback(updErr, docs);
      });

    } else {
      callback(err, docs);
    }
  });
};

module.exports.findAllTriples = (callback) => {
  projectDb.find({})
    .sort({
      "createdAt": -1
    })
    .exec((err, docs) => {
      if (err == null) {
        var repos = [];
        for (var i = 0; i < docs.length; i += 3) {
          var pair;
          if (i < docs.length) {
            var dataflowCount = docs[i].dataflows.length;
            var pipelineCount = 0;
            var containerCount = 0;
            var fileCount = 0;
            docs[i].dataflows.forEach((d) => {
              pipelineCount = pipelineCount + d.pipelines.length;
              d.pipelines.forEach((p) => {
                containerCount = containerCount + p.containers.length;
                p.containers.forEach((c) => {
                  fileCount = fileCount + c.files.length;
                });
              });
            });
            var first = Object.assign({
              "dataflowCount": dataflowCount,
              "pipelineCount": pipelineCount,
              "containerCount": containerCount,
              "fileCount": fileCount
            }, docs[i]);
            pair = Object.assign({}, {
              "first": first,
            });
          }
          if ((i + 1) < docs.length) {
            var dataflowCount = docs[i + 1].dataflows.length;
            var pipelineCount = 0;
            var containerCount = 0;
            var fileCount = 0;
            docs[i + 1].dataflows.forEach((d) => {
              pipelineCount = pipelineCount + d.pipelines.length;
              d.pipelines.forEach((p) => {
                containerCount = containerCount + p.containers.length;
                p.containers.forEach((c) => {
                  fileCount = fileCount + c.files.length;
                });
              });
            });
            var second = Object.assign({
              "dataflowCount": dataflowCount,
              "pipelineCount": pipelineCount,
              "containerCount": containerCount,
              "fileCount": fileCount
            }, docs[i + 1]);

            pair = Object.assign(pair, {
              "second": second
            });
          }
          if ((i + 2) < docs.length) {
            var dataflowCount = docs[i + 2].dataflows.length;
            var pipelineCount = 0;
            var containerCount = 0;
            var fileCount = 0;
            docs[i + 2].dataflows.forEach((d) => {
              pipelineCount = pipelineCount + d.pipelines.length;
              d.pipelines.forEach((p) => {
                containerCount = containerCount + p.containers.length;
                p.containers.forEach((c) => {
                  fileCount = fileCount + c.files.length;
                });
              });
            });
            var third = Object.assign({
              "dataflowCount": dataflowCount,
              "pipelineCount": pipelineCount,
              "containerCount": containerCount,
              "fileCount": fileCount
            }, docs[i + 2]);

            pair = Object.assign(pair, {
              "third": third
            });
          }
          debug("pair: " + JSON.stringify(pair, null, 2));
          repos.push(pair);
        }
        return callback(err, repos);
      } else {
        return callback(err, docs);
      }
    });
};
