const meetingsCollection = require("./getCollections").meetups;
const usersCollection = require("./getCollections").users;
const connection = require("./establishConnection");
const ObjectID = require("mongodb").ObjectID;
const slugify = require("slugify");

let createMeeting = async function(meetupName,owner,date,location, preferences){
    if(!meetupName || !owner || !date || !location || !preferences){
        return false;
    }
    else{
        const meetings = await meetingsCollection();
        const users = await usersCollection();
        let meeting = {
                        meetupName:meetupName,
                        owner:owner,
                        attendees:[owner],
                        date:date,
                        location:location,
                        preferences: preferences,
                        comments:[]
                    }
        const insertInfo = await meetings.insertOne(meeting);
        if(insertInfo.insertedCount === 0){
            throw "Unable to create user."
        }
        return insertInfo.insertedId;
    }
}

let getMeetingByMeetId = async function(meetId){
    if(!meetId){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = meetings.findOne({"_id" : meetId});
        if (found === null){
            return {"empty" : true};
        }
        return found;
    }
}


let getMeetingByName = async function(name){
    if(!name){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.findOne({"meetupName" : name});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getMeetingsByName = async function(name){
     if(!name){
        return [];
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"meetupName" : name});
        return found.toArray();
    }
}  
let getMeetingsByRegex = async function(regex){
     if(!regex){
        return [];
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"meetupName" :{$regex: regex}});
        return found.toArray();
    }
}  

let getMeetingByOwnerId = async function(ownerId){
    if(!ownerId){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.findOne({"owner" : ownerId});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getMeetingByUserId = async function(userId){
    if(!userId){
        return false;
    }else{
        const meetings = await meetingsCollection();
        const found = await meetings.find({"attendees" : userId});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getMeetingByLocation = async function(location){
    if(!location){
        return false;
    }else{
        const meetings = await meetingsCollection();
        const found = await meetings.find({"location" : location});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getMeetingByPreferences = async function(prefArray){
    if(!prefArray){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"preferences" : {$in : prefArray}});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getFutureMeetings = async function(date){
    if(!date){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"date" : {$gt : date}});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getPreviousMeetings = async function(date){
    if(!date){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"date" : {$lt : date}});
        if(found === null){
            return {"empty" : true};
        }
        return found;
    }
}

let getUsersFutureMeetings = async function(id,date){
    if(!date){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"attendees":id,"date" : {$gte : date}});
        if(found === null){
            return {"empty" : true};
        }
        return found.toArray();
    }
}

let getUsersPreviousMeetings = async function(id,date){
    if(!date){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let found = await meetings.find({"attendees":id,"date" : {$lt : date}});
        if(found === null){
            return {"empty" : true};
        }
        return found.toArray();
    }
}

let updateMeetingAttendees = async function(meetId, user){
    if(!meetId || !user){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let meeting = await getMeetingByMeetId(meetId);
        let attendees = meeting.attendees;
        let containsUser = attendees.find(function(attendeeID){
            return user._id.toString() == attendeeID.toString();
        });
        if(containsUser !== undefined){
            return false;
        }
        attendees.push(user._id);
        const modifiedUpdateInfo = await meetings.updateOne(
            {"_id" : meetId},
            {$set: {"attendees" : attendees}}
        );
        if (modifiedUpdateInfo.modifiedCount === 0){
            return false;
        }
        return true;
    }
}

let updateMeetingsComments = async function(meetId, comment){
    if(!meetId || !comment){
        return false;
    }else{
        const meetings = await meetingsCollection();
        let meeting = await getMeetingByMeetId(meetId);
        if(!meeting){
            console.log("no meetings match");
            throw "Unable to create comment"
        }
        let comments = meeting.comments;
        comments.push(comment);
        const modifiedUpdateInfo = await meetings.updateOne(
            {"_id" : meetId},
            {$set:
                {"comments" : comments}
            }
        );
        if (modifiedUpdateInfo.modifiedCount === 0){
            return false;
        }
        return true;
    }
}

let leaveMeeting = async function(userId, meetId){
    if(!userId || !meetId){
        return false;
    }
    let meetings = await meetingsCollection();
    let meeting = await getMeetingByMeetId(ObjectID(meetId));
    if(!meeting){
        console.log("no meetings match");
        throw "Unable to find meeting"
    }
    if(meeting.owner.toString() == userId.toString()){
        return false;
    }
    let attendees = meeting.attendees;
    if(meeting.attendees.length == 0){
        return false;
    }
    let len = attendees.length;
    for(let i = 0; i<len; i++){
        if(attendees[i].toString() == userId.toString()){
            attendees.splice(i, 1);
        }
    };
    if(len == attendees.length){
        return false;
    }
    const modifiedUpdateInfo = await meetings.updateOne(
        {"_id" : ObjectID(meetId)},
        {$set:
            {attendees : attendees}
        }
    );

    if (modifiedUpdateInfo.modifiedCount === 0){
        return false;
    }
    return true;

}


module.exports = {
    createMeeting,
    getMeetingByMeetId,
    getMeetingByName,
    getMeetingsByName,
    getMeetingsByRegex,
    getMeetingByUserId,
    getMeetingByOwnerId,
    getMeetingByLocation,
    getMeetingByPreferences,
    getPreviousMeetings,
    getFutureMeetings,
    getUsersPreviousMeetings,
    getUsersFutureMeetings,
    updateMeetingsComments,
    updateMeetingAttendees,
    leaveMeeting
}
