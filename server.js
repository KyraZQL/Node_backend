// Get the packages we need
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    secrets = require('./config/secrets'),
    bodyParser = require('body-parser');

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

// Connect to a MongoDB
mongoose.connect(secrets.mongo_connection,  { useNewUrlParser: true });

// Allow CORS so that backend and frontend could be put on different servers
var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Use routes as a module (see index.js)
require('./routes')(app, router);

// Start the server
app.listen(port);
console.log('Server running on port ' + port);



var UserModel = require('./models/user')
var TaskModel = require('./models/task')

var userRoute = router.route('/users');
var taskRoute = router.route('/tasks');

// taskRoute.delete(async (request, response) => {
//     try{
//         await TaskModel.deleteMany({}).exec();
//     } catch(err) {

//     }
// });
// userRoute.delete(async (request, response) => {
//     try{
//         await UserModel.deleteMany({}).exec();
//     } catch(err) {

//     }
// });

userRoute.get(async (request, response) => {

    try {
        var query;
        if(request.query.where) {
            query = UserModel.find(JSON.parse(request.query.where));
        } else {
            query = UserModel.find();
        }
        if(request.query.where) {
            query.where(JSON.parse(request.query.where));
            console.log('where' + JSON.parse(request.query.where));
        }
        if(request.query.sort) {
            query.sort(JSON.parse(request.query.sort));
            console.log('sort' + JSON.parse(request.query.sort));
        }
        if(request.query.skip) {
            query.skip(parseInt(request.query.skip));
            console.log('skip' + parseInt(request.query.skip));
        }
        if(request.query.limit) {
            query.limit(parseInt(request.query.limit));
            console.log('limit' + parseInt(request.query.limit));
        }
        var result = await query.exec();
        var resMsg = {
            message: "Ok",
            data: result
        };
        response.send(resMsg);
    } catch (err) {
        var errMsg = {
            message: "Got error when creating user!",
            error: err
        };
        response.status(500).send(errMsg);
    }
});

userRoute.post(async (request, response) => {
    let a = (request.body);
    a.dateCreated = new Date();
    var user = new UserModel(a);
 
    tasks = user.pendingTasks;
    //check pending tasks
    if(tasks.length > 0) {
        console.log('pendingTasks in the >0 branch' + tasks);
        TaskModel.find({_id: {$in: tasks}}, (err, docs) => {
            if(err != null || docs === null || docs === undefined) {
                console.log('cannot find the task in the pendingTasks array' + err);
                // response.status(404).send(err);
            } else {
                TaskModel.updateMany({_id: {$in: tasks}}, 
                    {assignedUser: user._id, assignedUserName: user.name}).exec()
                .catch(err => {
                    console.log('update tasks got error' + err);
                });
            }
        })
        .exec()
        .catch(err => {
            console.log('find task got error' + err);
            // response.status(500).send(err);
        })
    } 
    user.save()
    .then(_ => {
        var resMsg = {
            message: "Created user!",
            data: user
        };
        response.status(201).send(resMsg);
        // response.send(user);
    })
    .catch(err => {
        var errMsg = {
            message: "Got error when creating user!",
            error: err
        };
        response.status(500).send(errMsg);
    })

});

router.get("/users/:id", async (request, response) => {
    UserModel.findById(request.params.id, (err, docs) => {
        if(docs === null || docs === undefined) {
            console.log('has error' + err);
            var errMsg = {
                message: "User not found!", 
                error: err
            }
            response.status(404).send(errMsg);
            // response.status(404).send(err);
        } else {
            // console.log('has docs'  + docs);
            var resMsg = {
                message: "Ok",
                data: docs
            };
            response.send(resMsg);
            // response.send(docs);
        }
    });
});

router.put("/users/:id", async (request, response) => {

    //remove all old tasks, and update the assigned user to be ''
    //add all new tasks, and update the assigned user to be new name
    if(request.body._id) {
        console.log('You cannot update the task id!');
        var errMsg = {
            message: "You cannot update the task id!", 
            error: request.body
        };
        response.status(500).send(errMsg);
    } else {

        UserModel.findById(request.params.id, (err, docs) => {
            if(err || docs === null || docs === undefined) {
                console.log('has error' + err);
                var errMsg = {
                    message: "User not found!", 
                    error: err
                }
                response.status(404).send(errMsg);
            } else {
                var oldTasks = docs.pendingTasks;
                
                console.log('put user request body' + request.body);
                console.log('has docs'  + docs);

                if(request.body.name === "" || request.body.email === "") {
                    console.log('try to delete the user\'s name or email.');
                    var errMsg = {
                        message: "You cannot update the user without a name or email!", 
                        error: request.body
                    }
                    response.status(500).send(errMsg);
                } else {
                    var name = docs.name;
                    if(request.body.name){
                        name = request.body.name;
                        console.log('update name to ' + name);
                        if(oldTasks.length > 0) {
                
                            console.log('put user\'s name' + request.body.name);

                            TaskModel.updateMany({_id: {$in: oldTasks}}, 
                                {assignedUserName: request.body.name}).exec()
                            .catch(err => {
                                console.log('update tasks got error' + err);
                            });
                        }
                    } 
                    if(request.body.pendingTasks) {
                        var newTasks = request.body.pendingTasks;
                        oldTasks = docs.pendingTasks;

                        console.log('have to update pending tasks to ' + newTasks);
                        console.log('have old tasks ' + oldTasks);

                        if(oldTasks.length > 0) {
                            TaskModel.updateMany({_id: {$in: oldTasks}}, 
                                {assignedUser: "", assignedUserName: "unassigned"}).exec()
                            .catch(err => {
                                console.log('update tasks got error' + err);
                            });
                        }


                        if(newTasks.length > 0) {
                            console.log('show update the new oending tasks!!!!!!!!!!');
                            TaskModel.updateMany({_id: {$in: newTasks}}, 
                                {assignedUser: request.params.id, assignedUserName: name}).exec()
                            .catch(err => {
                                console.log('update tasks got error' + err);
                            });
                        }
                    }

                    UserModel.updateOne({_id: request.params.id}, 
                        request.body
                        )
                    .then( res => {
                        var resMsg = {
                            message: "Updated user!",
                            data: request.body
                        };
                        response.send(resMsg);
                    })
                    .catch( err => {
                        var errMsg = {
                            message: "Got server internal error!", 
                            error: err
                        }
                        response.status(500).send(errMsg);
                    })
                }
            }
        });
    }
});
router.delete("/users/:id", async (request, response) => {

    UserModel.findById(request.params.id, (err, docs) => {
        if(docs === null || docs === undefined) {
            var errMsg = {
                message: "User not found!", 
                error: err
            }
            response.status(404).send(errMsg);
        } else {
            TaskModel.updateMany({assignedUser: request.params.id}, 
                {assignedUser: "", assignedUserName: "unassigned"}
                )
            .catch(err => {
                console.log('related tasks err' + err);
            });
    
            UserModel.deleteOne({ _id: request.params.id })
            .then(res => {
                var resMsg = {
                    message: "Deleted user!",
                    data: request.body, 
                    result: res
                };
                response.send(resMsg);
            })
            .catch(err => {
                var errMsg = {
                    message: "Got server internal error!", 
                    error: err
                }
                response.status(500).send(errMsg);
            });
        }        
    });
});


taskRoute.get(async (request, response) => {
    try {
        var query;
        if(request.query.where) {
            query = TaskModel.find(JSON.parse(request.query.where));
        } else {
            query = TaskModel.find();
        }
        if(request.query.select) {
            query.select(JSON.parse(request.query.select));
            console.log('select' + JSON.parse(request.query.select));
        }
        if(request.query.sort) {
            query.sort(JSON.parse(request.query.sort));
            console.log('sort' + JSON.parse(request.query.sort));
        }
        if(request.query.skip) {
            query.skip(parseInt(request.query.skip));
            console.log('skip' + parseInt(request.query.skip));
        }
        if(request.query.limit) {
            query.limit(parseInt(request.query.limit));
            console.log('limit' + parseInt(request.query.limit));
        } else {            
            query.limit(100);
        }
        var result = await query.exec();
        var resMsg = {
            message: "Ok",
            data: result
        };
        response.send(resMsg);
        // response.send(result);
    } catch (err) {
        var errMsg = {
            message: "Got server internal error!", 
            error: err
        }
        response.status(500).send(errMsg);
        // response.status(500).send(error);
    }
});

taskRoute.post(async (request, response) => {
    let a = request.body;
    a.dateCreated = new Date();
    var task = new TaskModel(a);

    if(request.body.assignedUser !== undefined) {
        console.log('assigned user' + request.body.assignedUser + typeof(request.body.assignedUser));
        // UserModel.findOne({_id: task.assignedUser})
        // .then(_ => {
        UserModel.findOneAndUpdate({_id: request.body.assignedUser},
            { "$push": { "pendingTasks": task._id } }, (err, docs) => {
                if(err || docs === null || docs === undefined) {
                    task.assignedUser = "";
                    task.assignedUserName = "unassigned";
                    console.log('Got error when updating the user: ' + err);
                } else {
                    console.log('after update assigned user object' + docs);
                    task.assignedUserName = docs.name;
                    console.log('task' + task);
                }
            }
        );
    } 
    // else {
        task.save()
        .then(res => {
            var resMsg = {
                message: "Created task!",
                data: res
            };
            response.status(201).send(resMsg);
            // response.send(res)
        })
        .catch(err => {
            var errMsg = {
                message: "Got server internal error!", 
                error: err
            }
            response.status(500).send(errMsg);
            // response.status(500).send(err);
        });
    // }

});

router.get("/tasks/:id", async (request, response) => {
    TaskModel.findById(request.params.id, (err, docs) => {
        if(err || docs === null || docs === undefined) {
            console.log('has error' + err);
            var errMsg = {
                message: "User not found!", 
                error: err
            };
            response.status(404).send(errMsg);
        } else {
            console.log('has docs'  + docs);
            var resMsg = {
                message: "Ok",
                data: docs
            };
            response.send(resMsg);
        }
    });
});

router.put("/tasks/:id", async (request, response) => {

    //update the related user's pending tasks
    if(request.body._id) {
        console.log('You cannot update the task id!');
        var errMsg = {
            message: "You cannot update the task id!", 
            error: request.body
        };
        response.status(500).send(errMsg);
    } else {
        try{
        var newInfo = request.body;
        var task = await TaskModel.findById(request.params.id, (err, docs) => {
            // response.status(404).send(err);
            console.log('error' + err);
            console.log('docs'  + docs);
            if(err || docs === null || docs === undefined) {
                var errMsg = {
                    message: "User not found!", 
                    error: err
                }
                response.status(404).send(errMsg);
                // response.status(404).send(err);
            } else {
             
                var newUser;
                var newUserName;
                var oldUser = docs.assignedUser;
                if(request.body.assignedUser) {
                    // UserModel.findOne({_id: oldUser})
                    // .then(res => {
                        UserModel.updateOne({_id: oldUser}, 
                            {"$pull": { "pendingTasks": docs._id } })
                        .catch(err => {
                            console.log('Got error when update the old assigned user!' + err);
                        });

                        newUser = request.body.assignedUser;

                        console.log('old user id ' + oldUser + ' new user id' + newUser + ' new user name' + newUserName);


                            newInfo.assignedUser = newUser;
    
                            UserModel.updateOne({_id: newUser},
                                { "$push": { "pendingTasks": docs._id } }
                            )
                            .then(res => {
                                // console.log('after update assigned user object' + res + " and new user name" + res.name);
                                // newUserName = res.name;
                                newInfo.assignedUser = newUser;
                                newInfo.assignedUserName = newUserName;
                                TaskModel.updateOne({_id: request.params.id},
                                    newInfo)
                                    .then(res => {
                                        response.send(res);
                                    })
                                    .catch(err => {
                                        response.status(500).send(err);
                                    })
                            })
                            .catch(err => {
                                response.status(500).send(err);
                            });

                } else if(request.body.assignedUserName) {
                    console.log('You cannot update the assigned user name!');
                }
             
            }
        }).exec();
    } catch(err) {
        response.status(500).send(err);
    }
        // })
        // .catch(err => {
            // console.log('Got erro when send the response!');
            // response.status(500).send(err);
        // });
    }
});
router.delete("/tasks/:id", async (request, response) => {

    TaskModel.findById(request.params.id, (err, docs) => {
        if(docs === null || docs === undefined) {
            var errMsg = {
                message: "User not found!", 
                error: err
            }
            response.status(404).send(errMsg);
        } else {
            if(docs.assignedUser !== "") {
                var assignedUser = docs.assignedUser;

                UserModel.updateOne({_id: assignedUser},
                    { "$pull": { "pendingTasks": docs._id } }
                )
                .catch(err => {
                    // response.status(500).send(err);
                });
            }
            TaskModel.deleteOne({ _id: request.params.id })
            .then(res => {
                var resMsg = {
                    message: "Deleted the task!",
                    data: request.body, 
                    result: res
                };
                response.send(resMsg);
            })
            .catch(err => {
                var errMsg = {
                    message: "Got server internal error!", 
                    error: err
                }
                response.status(500).send(errMsg);
            });
        }
    });
});



