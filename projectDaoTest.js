const debug = require("debug")("evolvus-library-test:nedbTest");
const projectDao = require("./projectDao");
const chai = require("chai");
const expect = chai.expect;


before(() => {
});

it("should create a new project with name longer-longer-longer-example in precision-100-migration-templates by copying noneProject", () => {
    let projectName = "longer-longer-example";
    let description = "some description";
    let repositoryName = "precision-100-migration-templates";
    let publish = false;

    projectDao.save(projectName, description, repositoryName, publish);
});
