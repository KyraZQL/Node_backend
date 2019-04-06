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

userRoute.get(async (request, response) => {

    try {
        var query = UserModel.find(request.query.where);
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
        }
        var result = await query.exec();
        response.send(result);
    } catch (error) {
        response.status(500).send(error);
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
                console.log('error' + err);
                console.log('has docs'  + docs);
                // response.send(user);
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
        response.send(user);
    })
    .catch(err => {
        response.status(500).send(err);
    })

});

router.get("/users/:id", async (request, response) => {
    UserModel.findById(request.params.id, (err, docs) => {
        if(docs === null || docs === undefined) {
            console.log('has error' + err);
            console.log('docs'  + docs);
            response.status(404).send(err);
        } else {
            console.log('error' + err);
            console.log('has docs'  + docs);
            response.send(docs);
        }
    });
});

router.put("/users/:id", async (request, response) => {

    ////////////////////////////currently working on

    //remove all old tasks, and update the assigned user to be ''
    //add all new tasks, and update the assigned user to be new name

    UserModel.findById(request.params.id, (err, docs) => {
        if(err || docs === null || docs === undefined) {
            console.log('has error' + err);
            response.status(404).send(err);
        } else {
            console.log('put user request body' + request.body);
            console.log('has docs'  + docs);

            oldTasks = docs.pendingTasks;

            if(oldTasks.length > 0) {
                //update the user name
                if(request.body.name){
                    console.log('put user\'s name' + request.body.name);

                    TaskModel.find({_id: {$in: tasks}}, (err, docs) => {
                        if(err != null || docs === null || docs === undefined) {
                            console.log('cannot find the task in the pendingTasks array' + err);
                        } else {
                            TaskModel.updateMany({_id: {$in: tasks}}, 
                                {assignedUser: user._id, assignedUserName: user.name}).exec()
                                .catch(err => {
                                    console.log('update tasks got error' + err);
                                });
                            console.log('error' + err);
                            console.log('has docs'  + docs);
                        }
                    })
                    .exec()
                    .catch(err => {
                        console.log('find task got error' + err);
                    })
                response.send(docs);

                }
            }


            //update the pending tasks
    

    //         let a = (request.body);
    //         a.dateCreated = new Date();
    //         var user = new UserModel(a);


    //         //check pending tasks
    //         if(tasks.length > 0) {
    //             console.log('pendingTasks in the >0 branch' + tasks);
    //             TaskModel.find({_id: {$in: tasks}}, (err, docs) => {
    //                 if(err != null || docs === null || docs === undefined) {
    //                     console.log('cannot find the task in the pendingTasks array' + err);
    //                 } else {
    //                     TaskModel.updateMany({_id: {$in: tasks}}, 
    //                         {assignedUser: user._id, assignedUserName: user.name}).exec()
    //                         .catch(err => {
    //                             console.log('update tasks got error' + err);
    //                         });
    //                     console.log('error' + err);
    //                     console.log('has docs'  + docs);
    //                 }
    //             })
    //             .exec()
    //             .catch(err => {
    //                 console.log('find task got error' + err);
    //             })
    //         } 
    //         docs.set(request.body)
    //         .then(res => {
    //             response.send(res);
    //         })
    //         .catch(err => {
    //             response.status(500).send(err);
    //         })
    //         response.send(docs);
        }
    });




    // const userRes = UserModel.findById(request.params.id);
    // if(!userRes) {
    //     result.status(404).send('The user with given id was not found.');
    // } else {
    //     try {
    //         var user = await userRes.exec();
    //         //validation?????
    //         user.set(request.body);
    //         var result = await user.save();
    //         response.send(result);
    //     } catch (error) {
    //         response.status(500).send(error);
    //     }
    // } 
});
router.delete("/users/:id", async (request, response) => {

    UserModel.findById(request.params.id, (err, docs) => {
        // response.status(404).send(err);
        console.log('error' + err);
        console.log('docs'  + docs);
        if(docs === null || docs === undefined) {
            response.status(404).send(err);
            // return;
        } else {
            // console.log('user' + docs);
            TaskModel.find({ assignedUser: request.params.id}).exec()
            .then(res => {
                TaskModel.updateMany({assignedUser: request.params.id}, 
                    {assignedUser: '', assignedUserName: "unassigned"}
                    )
                    .catch(err => {
                        console.log('related tasks err' + err);
                    })
            })
            .catch(err => {
                console.log('no related tasks');
            });
    
            UserModel.deleteOne({ _id: request.params.id }).exec()
            .then(res => {
                response.send(result);
            })
            .catch(error => {
                response.status(500).send(error);
            });
        }        
    });
    // try{
    //     var user = await UserModel.findById(request.params.id);
    //     // console.log('user' + user);
    // } catch (error) {
    //     response.status(500).send(error);
    // }

        // TaskModel.find({ assignedUser: request.params.id}).exec()
        // .then(res => {
        //     TaskModel.updateMany({assignedUser: request.params.id}, 
        //         {assignedUser: '', assignedUserName: "unassigned"}
        //         )
        //         .catch(err => {
        //             console.log('related tasks err' + err);
        //         })
        // })
        // .catch(err => {
        //     console.log('no related tasks');
        // });

        // UserModel.deleteOne({ _id: request.params.id }).exec()
        // .then(res => {
        //     response.send(result);
        // })
        // .catch(error => {
        //     response.status(500).send(error);
        // });
        // try {
        //     var result = await UserModel.deleteOne({ _id: request.params.id }).exec();
        //     await TaskModel.delete(tasks).exec();
        //     response.send(result);
        // } catch (error) {
        //     response.status(500).send(error);
        // }
    // } else {
    // // )
    // // .catch(err => {
    //     response.status(404).send('The user with given id was not found.');
    // }
});


taskRoute.get(async (request, response) => {
    try {
        var query = TaskModel.find(request.query.where);
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
        }
        var result = await query.exec();
        response.send(result);
    } catch (error) {
        response.status(500).send(error);
    }
});

taskRoute.post(async (request, response) => {
    let a = request.body;
    a.dateCreated = new Date();
    var task = new TaskModel(a);

    if(task.assignedUser) {
        UserModel.findOne({_id: task.assignedUser})
        .then(_ => {
            UserModel.findOneAndUpdate({_id: task.assignedUser},
                { "$push": { "pendingTasks": task._id } }
            )
            .then(res => {
                console.log('after update assigned user object' + res);
                task.assignedUserName = res.name;
                console.log('task' + task);
            })
            .catch(error => {
                response.status(500).send(error);
            });
        })
        .then(_ => {
            task.save()
            .then(result => {
                response.status(500).send(result)
            })
            .catch(error => {
                response.status(500).send(error);
            });
        })
        .catch(error => {
            response.status(404).send(error);
        });
    } else {
        task.save()
        .then(result => {
            response.status(500).send(result)
        })
        .catch(error => {
            response.status(500).send(error);
        });
    }

});

router.get("/tasks/:id", async (request, response) => {
    TaskModel.findById(request.params.id, (err, docs) => {
        if(docs === null || docs === undefined) {
            console.log('has error' + err);
            console.log('docs'  + docs);
            response.status(404).send(err);
        } else {
            console.log('error' + err);
            console.log('has docs'  + docs);
            response.send(docs);
        }
    });
    // try {
    //     var task = await TaskModel.findById(request.params.id).exec();
    //     response.send(task);
    // } catch (error) {
    //     response.status(404).send(error);
    // }
});

router.put("/tasks/:id", async (request, response) => {

    //update the related user's pending tasks
    if(request.body._id) {
        console.log('You cannot update the task id!');
        response.status(500).send(request.body);
    } else {
        try{
        var newInfo = request.body;
        var task = await TaskModel.findById(request.params.id, (err, docs) => {
            // response.status(404).send(err);
            console.log('error' + err);
            console.log('docs'  + docs);
            if(err || docs === null || docs === undefined) {
                response.status(404).send(err);
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

                        // UserModel.findOne({_id: newUser})
                        // .then(_ => {
                            UserModel.findById(newUser, (err, docs) => {
                                // response.status(404).send(err);
                                console.log('error' + err);
                                console.log('docs'  + docs);
                                if(err || docs === null || docs === undefined) {
                                    response.status(404).send(err);
                                } else {
                                    newUserName = docs.name;
                                }});


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
                        // })
                        // .catch(err => {
                        //     response.status(500).send(err);
                        // });
                    // })
                    // .catch(err => {
                    //     // response.status(500).send(err);
                    //     console.log('Cannot find the old assigned user!' + err);
                    // })

                } else if(request.body.assignedUserName) {
                    console.log('You cannot update the assigned user name!');
                    // response.status(500).send(request.body);
                }
             
            }
        }).exec();
        // console.log('Finally the new info is' + (newInfo));
        // var res = await task.set(newInfo);
        // // .then(res => {
        //     response.send(res);
    } catch(err) {
        response.status(500).send(err);

    }
        // })
        // .catch(err => {
            // console.log('Got erro when send the response!');
            // response.status(500).send(err);
        // });
    }
    // const taskRes = TaskModel.findById(request.params.id);
    // if(!taskRes) {
    //     result.status(404).send('The task with given id was not found.');
    // } else {
    //     try {
    //         var task = await TaskModel.findById(request.params.id).exec();
    //         task.set(request.body);
    //         var result = await task.save();
    //         response.send(result);
    //     } catch (error) {
    //         response.status(500).send(error);
    //     }
    // }
});
router.delete("/tasks/:id", async (request, response) => {
    try {
        var result = await TaskModel.deleteOne({ _id: request.params.id }).exec();
        response.send(result);
    } catch (error) {
        response.status(404).send(error);
    }
});



