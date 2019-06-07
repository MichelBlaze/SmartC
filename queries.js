

const AWS = require('aws-sdk')

const Pool = require('pg').Pool
const pool = new Pool({
 user: 'imadmin',
  host: 'localhost',
  database: 'vistadb',
  password: 'root',
  port: 5432,
})

aws_access_key_id = "AKIAJ3H2Y7OGSC6IQPPQ"
aws_secret_access_key = "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"

const s3 = new AWS.S3({
  accessKeyId: aws_access_key_id,
  secretAccessKey: aws_secret_access_key
})


const saveTestScenario = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  const { paths, cars, actions, testName } = request.body

  const params = {
    Bucket: "simulator.com/TestScenarios",
    Key: testName+".json",
    Body: JSON.stringify(request.body),
    ContentType: "application/json"
   }
  s3.upload(params, function(err, data) {
    if(err){
      console.log(err, data);
      return err;
    }
    console.log("success: "+ data);
      response.status(200).json(data);

   });
}

const loadTestScenario = (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  request.header("Access-Control-Allow-Origin", "*");
  const { fileName } = request.body
  const params = {
    Bucket: "simulator.com/TestScenarios",
    Key: fileName+".json",
   }
   s3.getObject(params, function(err, data) {
      // Handle any error and exit
      if (err){
        console.log( err);
        return err;
      }
    // No error happened
    // Convert Body from a Buffer to a String
      let objectData = data.Body.toString('utf-8'); // Use the encoding necessary
      var alldata = JSON.parse(objectData);
      response.status(200).json(alldata);//.rows

  });  
  }
  
  const getAllTestScenarios = async (request, response) => {
    response.header("Access-Control-Allow-Origin", "*");
    request.header("Access-Control-Allow-Origin", "*");
    const params = {
      Bucket: "simulator.com",
    }
    var d;
    try {
        d = await s3.listObjectsV2(params).promise();
    } catch(e) {
        throw e // an error occurred
    }
    d.Contents.shift();
   // TestScenarios/
   var content = [];
   for (var currentValue of d.Contents) {
     if (currentValue.Size > 0) {
      if(currentValue.Key.includes("TestScenarios/")){
        content.push( currentValue.Key.split('TestScenarios/')[1] )
      }
     }
   }
  response.status(200).json(content);//.rows
}

/*
var repoDir = "https://sundasB@bitbucket.org/effective/vista.git";

var nodegit = require("nodegit");
var path = require("path");
var fse = require("fs-extra");
var fileName = "newfile.txt";
var fileContent = "hello world";
var directoryName = "/TestScenarios";
var repo;
var index;
var oid;
/*
  const uploadToGit = async (request, response) => {
    const { paths, cars, actions, testName } = request.body
    fileName = testName+'.json';
    fileContent = JSON.stringify(request.body);

    var repoFolder = path.resolve("/Users/sunmun/Sites/vista/.git");//"/Users/sunmun/Sites/vista/.git";
var repo, remote;

nodegit.Repository.open(repoFolder)
    .then(function(repoResult) {
        repo = repoResult;
        console.log("path: "+repo.path());
        return repoResult.openIndex();
    })
    .then(function() {
        return repo.getRemote("origin");
    }).then(function(remoteResult) {

      console.log('remote Loaded');
      remote = remoteResult;
      remote.setCallbacks({
          credentials: function(url, userName) {
              return nodegit.Cred.sshKeyFromAgent(userName);
          }
      });
      console.log('remote Configured');
      return remote.connect(nodegit.Enums.DIRECTION.PUSH);
    }).then(function() {
      console.log('remote Connected?', remote.connected())

      return remote.push(
                ["refs/heads/master:refs/heads/master"],
                null,
                repo.defaultSignature(),
                "Push to master")
    }).then(function() {
      console.log('remote Pushed!')
    })
    .catch(function(reason) {
        console.log(reason);
    })

  }

*

const uploadToGit = async (request, response) => {
    const { paths, cars, actions, testName } = request.body

    var  fileName = testName+'.json';
    fileContent = JSON.stringify(request.body);

    var repoFolder = path.resolve("../../../vista");;//path.resolve(__dirname, 'https://sundasB@bitbucket.org/effective/vista.git');//path.resolve(__dirname, 'repos/test/.git');

var repo, index, oid, remote;

  /*  nodegit.Repository.open(repoFolder)
      .then(function(repoResult) {
        repo = repoResult;
        console.log(repo);
        return repo.openIndex();
      })
      .then(function(indexResult) {
        index  = indexResult;

        // this file is in the root of the directory and doesn't need a full path
        indexResult.addByPath(fileToStage);

        // this will write files to the index
        indexResult.write();

        return indexResult.writeTree();
      })
      .then(function(oidResult) {
        oid = oidResult;

        return nodegit.Reference.nameToId(repo, 'HEAD');
      })
      .then(function(head) {
        return repo.getCommit(head);
      })
      .then(function(parent) {
        author = nodegit.Signature.now('Walid Taha', 'maroneal@gmail.com');
        committer = nodegit.Signature.now('Sundas Munir', 'sundas.munir90@gmail.com');

        return repo.createCommit('HEAD', author, committer, 'Added new test scenario file named: '+ fileToStage, oid, [parent]);
      })
      .then(function(commitId) {
        return console.log('New Commit: ', commitId);
      })
*
var signature = nodegit.Signature.now('Sundas Munir', 'sundas.munir90@gmail.com');
    nodegit.Repository.open(path.resolve(__dirname, "../../.git"))
    .then(function(repoResult) {
      repo = repoResult;
      return fse.ensureDir(path.join(repo.workdir(), directoryName));
    }).then(function(){
      return fse.writeFile(path.join(repo.workdir(), fileName), fileContent);
    })
    .then(function() {
    /*  return fse.writeFile(
        path.join(repo.workdir(), directoryName, fileName),
        fileContent
      );*
    })
    .then(function() {
    
      return repo.refreshIndex();
    })
    .then(function(indexResult) {
    
      index = indexResult;
    })
    .then(function() {
      // this file is in the root of the directory and doesn't need a full path
    return index.addByPath(fileName);
    })
    .then(function() {
      // this file is in a subdirectory and can use a relative path

    // return index.addByPath(path.posix.join(directoryName, fileName));
    })
    .then(function() {
      // this will write both files to the index
      return index.write();
    })
    .then(function() {
      return index.writeTree();
    })
    .then(function(oidResult) {
      oid = oidResult;
      return nodegit.Reference.nameToId(repo, "HEAD");
    })
    .then(function(head) {
      return repo.getCommit(head);
    })
    .then(function(parent) {
   //   var author = nodegit.Signature.now('Walid Taha', "bla@gmail.com");///'maroneal@gmail.com');
   // var committer = nodegit.Signature.now('sundasB', 'sundas.munir90@gmail.com');

      return repo.createCommit("HEAD", signature,signature, "message", oid, [parent]);
    })
    .then(function(commitId) {
      console.log("New Commit: ", commitId);
    })
    // Add a new remote
    .then(function() {
      return repo.getRemote('origin');
    })
      .then(function(remoteResult) {
        remote = remoteResult;

        // Create the push object for this remote
        return remote.push(
          ["refs/heads/master:refs/heads/master"],
          {
            callbacks: {
              certificateCheck: function() { return 1; },
              credentials: function(url, userName) {
                console.log("user",userName);
                return nodegit.Cred.sshKeyFromAgent(userName);}
            }
          }
        );
      }).then(function() {
        console.log('remote Pushed!')
      })
      .catch(function(reason) {
        console.log("reason: "+reason);
      });
}
*/

module.exports = {
  saveTestScenario,
  loadTestScenario,
  getAllTestScenarios
  //uploadToGit
}
/*
      /// PUSH
      .then(function() {
        return repo.getRemote('origin');
      })
      .then(function(remoteResult) {
        console.log('remote Loaded');
        remote = remoteResult;
        remote.setCallbacks({
          credentials: function(url, userName) {
            return nodegit.Cred.sshKeyFromAgent(userName);
          }
        });
        console.log('remote Configured');

        return remote.connect(nodegit.Enums.DIRECTION.PUSH);
      })
      .then(function() {
        console.log('remote Connected?', remote.connected())

        return remote.push(
          ['refs/heads/master:refs/heads/master'],
          null,
          repo.defaultSignature(),
          'Push to master'
        )
      })*/