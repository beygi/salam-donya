var MongoClient = require('mongodb').MongoClient;
var BSON = require('mongodb').BSONPure;
var exec = require('child_process').exec;
var md5 = require('MD5');
async=require("async");


function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

exports.connect=function(callback){
    var mthis=this;
    MongoClient.connect("mongodb://127.0.0.1:27017/mahfel", function(err, mdb) {
        if(err) throw err;
        mthis.db=mdb;
        callback();
    });
};

exports.db=null;

exports.insertOrUpdateObject=function(collectionName,obj,uniqCol,callback){
    var collection=mongo.db.collection(collectionName);
    var addobj=function(obj){
        //add crawl date for every object
        obj.updateDate=new Date();
        find={};
        find[uniqCol]=obj[uniqCol];

        collection.find(find).toArray(function(err,findrec){
            if(findrec.length==0){
                console.log("insert new Object : "+obj[uniqCol]);
                collection.insert(obj,function(err,records){
                    callback(err);
                });
            }else{
                console.log("Update Object : "+obj[uniqCol]);
                collection.update(find,{
                    '$set':obj
                },function(err){
                    callback(err);
                });
            }
        });

        // This will find it and update record, if not, just insert record
        // Some how this is not working, i'm reverting to old one
        /*collection.find(find, {
          '$set': obj
          }, {
          upsert: true
          }, function(err) {
          console.log("Update Object : "+obj[uniqCol]);
          callback(err);
          }
          );*/

    };
    if (obj.localImage===undefined && obj.image !=="" && obj.image!==undefined ) {
        //fetch image
        ext=undefined;
        if (obj.imageExt!==undefined) {
            ext=obj.imageExt;
        }
        console.log("fetch Image :"+obj.image);
        downloadImage(obj.image,config.otherConf.imagesdir,
                function(localImage){
                    obj.localImage=localImage;
                    //if (localImage!="" && obj.siteid==1) {
                    //    //remove borders using image magick
                    //    console.log("Crop image from ketab.ir");
                    //    command="convert images/"+localImage+"  -gravity South  -chop  0x20  images/"+localImage;
                    //    exec(command, function (error,stdout,stderror){
                    //    });
                    //}
                    addobj(obj);
                },ext);
    }else{
        addobj(obj);
    }
};


exports.openVote=function(obj,callback){
    var collection=mongo.db.collection('votes');
    var addobj=function(obj){
        obj.createDate=new Date();
        find={'user':obj.user , 'type':obj.type , status:'open'};
        collection.find(find).toArray(function(err,findrec){
            if(findrec.length===0){
                obj.status='open';
                obj.voters=[];
                obj.totalPoint=0;
                collection.insert(obj,function(err,records){
                    callback("vote opened successfully with id: "+records[0]['_id']);
                });
            }else{
                callback("this vote already exist! id: "+findrec[0]['_id']);
            }
        });
    };
    addobj(obj);
};

exports.getOpenVotes=function(callback){
    var collection=mongo.db.collection('votes');
    find={'status':'open'};
    collection.find(find).toArray(function(err,findrecs){
        callback(findrecs);
    });
};

exports.getVote=function(id,callback){
    var collection=mongo.db.collection('votes');
    var o_id = new BSON.ObjectID(id);
    find={'_id':o_id,status:'open'};
    collection.find(find).toArray(function(err,findrecs){
        if (findrecs.length===0) {
            callback(null);
        }else
        {
            callback(findrecs[0]);
        }
    });
};

exports.updateVote=function(obj,callback){
    var collection=mongo.db.collection('votes');
    find={type:obj.type,user:obj.user,role:obj.role,status:'open'};
    delete obj['_id'];
    collection.update(find,{
        '$set':obj
    },function(err){
        callback(err);
    });
};

exports.getUsers=function(callback){
    var collection=mongo.db.collection('users');
    find={};
    collection.find(find).toArray(function(err,findrecs){
	for(var i=0;i<findrecs.length;i++)
	{
	    findrecs[i].email=md5(findrecs[i].email);
	}
        callback(shuffleArray(findrecs));
    });
};

exports.getUser=function(name,callback){
    var collection=mongo.db.collection('users');
    find={name:name};
    collection.find(find).toArray(function(err,findrecs){
        if (findrecs.length===0) {
            callback(null);
        }else
        {
            callback(findrecs[0]);
        }
    });
};

exports.updateUserVote=function(name, point, callback){
    var collection=mongo.db.collection('users');
    find={
        name: name,
        role: "newuser"
    };

    // this one will change points instantly due a cuncurrency problem
    collection.findAndModify(find, [
            ['_id','asc']
    ], {
        '$inc': {
            points: pointr
        }
    },
    {},
    function (err, res){
        callback(err, res);
    }
    );
};


/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}