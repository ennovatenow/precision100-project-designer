const debug = require("debug")("evolvus-precision100-project:service");
const projectDao = require("./projectDao");
const repositoryDao = require("./repositoryDao");

module.exports.getProject = (req, res, next) => {
  repositoryDao.findAll((errRepo, repos) => {
    if (errRepo == null) {
      projectDao.findAll((errProj, projects) => {
        if (errProj == null) {
          return res.render("project", {
            layout: "default",
            title: "Start a new Project",
            repos: repos,
            templates: projects
          });
        } else {
          debug("Unexpected error: " + JSON.stringify(errProj, null, 2));
          return res.render("project", {
            layout: "default",
            title: "Start a new Project",
            repos: null,
            templates: null
          });
        }
      });
    } else {
      /*
       ** Error finding repositories, everything comes null
       */
      debug("Unexpected error: " + JSON.stringify(errRepo, null, 2));
      return res.render("project", {
        layout: "default",
        title: "Start a new Project",
        repos: null,
        templates: null
      });
    }
  });
};
