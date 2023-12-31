const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const mongourl = 'mongodb+srv://Nelsonli:153045Nelson@cluster0.vx0cxpw.mongodb.net/?retryWrites=true&w=majority'; 
const dbName = 'device';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const session = require('cookie-session');
const SECRETKEY = 'gp48';

var usersinfo = new Array(
    {name: "user1", password: "gp48"},
    {name: "user2", password: "gp48"},
    {name: "user3", password: "gp48"}
);

var documents = {};
//Main Body
app.set('view engine', 'ejs');
app.use(session({
    userid: "session",  
    keys: [SECRETKEY],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const createDocument = function(db, createddocuments, callback){
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to the MongoDB database server.");
        const db = client.db(dbName);

        db.collection('list_device').insertOne(createddocuments, function(error, results){
            if(error){
            	throw error
            };
            console.log(results);
            return callback();
        });
    });
}

const findDocument =  function(db, criteria, callback){
    let cursor = db.collection('device').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray(function(err, docs){
        assert.equal(err, null);
        console.log(`findDocument: ${docs.length}`);
        return callback(docs);
    });
}

const handle_Find = function(res, criteria){
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findDocument(db, criteria, function(docs){
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('display', {nItems: docs.length, items: docs});
        });
    });
}

const handle_Edit = function(res, criteria) {
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let documentID = {};
        documentID['_id'] = ObjectID(criteria._id)
        let cursor = db.collection('list_device').find(documentID);
        cursor.toArray(function(err,docs) {
            client.close();
            assert.equal(err,null);
            res.status(200).render('edit',{item: docs[0]});

        });
    });
}

const handle_Details = function(res, criteria) {
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let documentID = {};
        documentID['_id'] = ObjectID(criteria._id)
        findDocument(db, documentID, function(docs){ 
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('details', {item: docs[0]});
        });
    });
}

const updateDocument = function(criteria, updatedocument, callback){
    const client = new MongoClient(mongourl);
    client.connect(function(err){
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        console.log(criteria);
	console.log(updatedocument);
	
        db.collection('list_device').updateOne(criteria,{
                $set: updatedocument
            }, function(err, results){
                client.close();
                assert.equal(err, null);
                return callback(results);
            }
        );
    });
}

const deleteDocument = function(db, criteria, callback){
console.log(criteria);
	db.collection('list_device').deleteOne(criteria, function(err, results){
	assert.equal(err, null);
	console.log(results);
	return callback();
	});

};

const handle_Delete = function(res, criteria) {
    const client = new MongoClient(mongourl);
    client.connect(function(err) {
        console.log("Connected successfully to server");
        const db = client.db(dbName);
	
	let deldocument = {};
	
        deldocument["_id"] = ObjectID(criteria._id);
        deldocument["ownerID"] = criteria.name;
        console.log(deldocument["_id"]);
        console.log(deldocument["ownerID"]);
        
        deleteDocument(db, deldocument, function(results){
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('info', {message: "Document is successfully deleted."});
        })     
    });
    //client.close();
    //res.status(200).render('info', {message: "Document is successfully deleted."});
}

app.get('/', function(req, res){
    if(!req.session.authenticated){
        console.log("...Not authenticated; directing to login");
        res.redirect("/login");
    }else{
    	res.redirect("/login");
    }
    console.log("...Hello, welcome back");
});

//login
app.get('/login', function(req, res){
    console.log("...Welcome to login page.")
    res.sendFile(__dirname + '/public/login.html');
    return res.status(200).render("login");
});

app.post('/login', function(req, res){
    console.log("...Handling your login request");
    for (var i=0; i<usersinfo.length; i++){
        if (usersinfo[i].name == req.body.username && usersinfo[i].password == req.body.password) {
        req.session.authenticated = true;
        req.session.userid = usersinfo[i].name;
        console.log(req.session.userid);
        return res.status(200).redirect("/home");
        }
    }
        console.log("Error username or password.");
        return res.redirect("/");
});

app.get('/logout', function(req, res){
    req.session = null;
    req.authenticated = false;
    res.redirect('/login');
});

app.get('/home', function(req, res){
    console.log("...Welcome to the home page!");
    return res.status(200).render("home");
});

app.get('/list', function(req, res){
    console.log("Show all information! ");
    handle_Find(res,req.query.docs);
    
});

app.get('/find', function(req, res){
    return res.status(200).render("search");
});

app.post('/search', function(req, res){
    const client = new MongoClient(mongourl);
    client.connect(function(err){
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
    
    var searchID={};
    searchID['DeviceID'] = req.body.deviceID;
    
    if (searchID.restaurantID){
    console.log("...Searching the document");
    findDocument(db, searchID, function(docs){
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('display', {nItems: docs.length, items: docs});
        });
    }
    else{
    console.log("Invalid Entry - Device ID is compulsory for searching!");
    res.status(200).redirect('/find');
    }         	
	});
});

app.get('/details', function(req,res){
    handle_Details(res, req.query);
});

app.get('/edit', function(req,res) {
    handle_Edit(res, req.query);
})

app.get('/create', function(req, res){
    return res.status(200).render("create");
});

app.post('/create', function(req, res){
    const client = new MongoClient(mongourl);
    client.connect(function(err){
        assert.equal(null, err);
        console.log("Connected successfully to the DB server.");
        const db = client.db(dbName);
        
        documents["_id"] = ObjectID;
        documents["deviceID"] = req.body.deviceID;	        	
	documents['name']= req.body.name;
	documents['type']= req.body.type;
	documents['price']= req.body.number;
        documents['brand']= req.body.brand;
        documents['colour']= req.body.colour;
        
        if(documents.deviceID){
            console.log("...Creating the document");
            createDocument(db, documents, function(docs){
                client.close();
                console.log("Closed DB connection");
                return res.status(200).render('info', {message: "Document is created successfully!"});
            });
        } else{
            client.close();
            console.log("Closed DB connection");
            return res.status(200).render('info', {message: "Invalid entry - device ID is compulsory!"});
        }
    });
    //client.close();
    //return res.status(200).render('info', {message: "Document created"}); 
});


app.post('/update', function(req, res){
    var updatedocument={};
    const client = new MongoClient(mongourl);
        client.connect(function(err){
            assert.equal(null, err);
            console.log("Connected successfully to server");
            
                if(req.body.name){
                updatedocument["ownerID"] = `${req.session.userid}`
	        updatedocument['name']= req.body.name;
	        updatedocument['type']= req.body.type;
	        updatedocument['price']= req.body.number;
                updatedocument['colour']= req.body.colour;
                updatedocument['brand']= req.body.brand;
 

        	let updateDoc = {};
                updateDoc['deviceID'] = req.body.postId;
                console.log(updateDoc);

                updateDocument(updateDoc, updatedocument, function(docs) {
                    client.close();
                    console.log("Closed DB connection");
                    return res.render('info', {message: "Document is updated successfully!."});
                    
                })
            }
            else{
            	return res.render('info', {message: "Invalid entry - device name is compulsory!"});
            }
    });
    
});

app.get('/delete', function(req, res){
    if(req.query.owner == req.session.userid){
        console.log("...Hello !");
        handle_Delete(res, req.query);
    }else{
        return res.status(200).render('info', {message: "Access denied - You don't have the access and deletion right!"}); 
    }
});

//Restful
//insert
app.post('/api/item/deviceID/:deviceID', function(req,res) {
    if (req.params.restaurantID) {
        console.log(req.body)
        const client = new MongoClient(mongourl);
        client.connect(function(err){
            assert.equal(null,err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            let newDocument = {};
            newDocument['deviceID'] = req.body.deviceID;

   	db.collection('list_device').insertOne(newDocument, function(err,results){
                assert.equal(err,null);
                client.close()
                res.status(200).end()
                    });
          
                })
            }
        else {
        res.status(500).json({"error": "missing device ID"});
    }
})

//find
app.get('/api/item/deviceID/:deviceID', function(req,res) {
    if (req.params.restaurantID) {
        let criteria = {};
        criteria['deviceID'] = req.params.deviceID;
        const client = new MongoClient(mongourl);
        client.connect(function(err) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            findDocument(db, criteria, function(docs){
                client.close();
                console.log("Closed DB connection");
                res.status(200).json(docs);
            });
        });
    } else {
        res.status(500).json({"error": "missing device id"});
    }
})

//delete
app.delete('/api/item/deviceID/:deviceID', function(req,res){
    if (req.params.restaurantID) {
        let criteria = {};
        criteria['deviceID'] = req.params.deviceID;
        const client = new MongoClient(mongourl);
        client.connect(function(err){
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = client.db(dbName);

            db.collection('list_device').deleteMany(criteria, function(err,results) {
                assert.equal(err,null)
                client.close()
                res.status(200).end();
            })
        });
    } else {
        res.status(500).json({"error": "missing device id"});       
    }
})

app.listen(app.listen(process.env.PORT || 8099));
