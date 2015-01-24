var url = require('url');
var http = require("http");
var htmlparser = require("htmlparser2");
var request = require('request');
var async = require("async");

var feedsReceived = 0;
var feedsDB = [];


function collectFeeds(req,res, feeds) {
    
    feedsDB.push.apply(feedsDB, feeds);
    feedsReceived++;
    
    if (feedsReceived < 2) {
        //need to get basketball feeds then send 
        request('http://duke.scout.com/a.z?s=167&p=4&cfg=bb', function (error, response, body) {
            if (!error && response.statusCode == 200) {
            processHomePage(req,res,body);
        }
        })
    }
    else {
        res.send(feedsDB);
    }
}

function processHomePage(req,res,body) {
    
    var storiesDivPrefix = body.indexOf("<div id=\"archiveStories\">");  
    var storiesDiv = body.substring(storiesDivPrefix);
    storiesDiv = storiesDiv.substring(storiesDivPrefix.length);
    
    var firstTablePrefix = storiesDiv.indexOf("<table");
    storiesDiv = storiesDiv.substr(firstTablePrefix);
    
    var storiesEndPrefix = storiesDiv.indexOf("<!--end ARCHIVE MODULE-->");
    storiesDiv = storiesDiv.substring(0,storiesEndPrefix);
    
    var breaker = 0;
    var fullPage = storiesDiv;
    
    var stories = [];
    
    while (storiesDiv.length > 0) {
        var tableIndex = storiesDiv.indexOf("<table");
        
        storiesDiv = storiesDiv.substring(tableIndex);
        
        //Getting the story link********************************
        var hrefPrefix = "href=\""
        var linkIndex = storiesDiv.indexOf(hrefPrefix);
        storiesDiv = storiesDiv.substring(linkIndex);
        storiesDiv = storiesDiv.substring(hrefPrefix.length);
        var linkEndPrefix = "\">";
        var linkEndIndex = storiesDiv.indexOf(linkEndPrefix);
        var storyLink = storiesDiv.substring(0,linkEndIndex);
        //End Story Link****************************************
        
        storiesDiv = storiesDiv.substring(linkEndIndex);
        storiesDiv = storiesDiv.substring(linkEndPrefix.length);

        //Get the story title***********************************
        var titleEndPrefix = storiesDiv.indexOf("</");
        var storyTitle = storiesDiv.substring(0,titleEndPrefix);
        //End Story Title***************************************
        
        var colorIndex = storiesDiv.indexOf("color");
        storiesDiv = storiesDiv.substring(colorIndex);
        
        var writerInitPrefix = ">";
        var writerIndex = storiesDiv.indexOf(writerInitPrefix);
        storiesDiv = storiesDiv.substring(writerIndex);
        storiesDiv = storiesDiv.substring(writerInitPrefix.length);
        
        //Writer and Date***************************************
        var writerEndPrefix = "<";
        var writerEndIndex = storiesDiv.indexOf(writerEndPrefix);
        var writerAndDate = storiesDiv.substring(0,writerEndIndex);
        
        var commaIndex = writerAndDate.indexOf(",");
        var storyWriter = writerAndDate.substring(0,commaIndex);
        var storyDate = writerAndDate.substring(commaIndex+1);
        //End Writer And Date***********************************
        
        var featuredTextPrefix = "featureText";
        var featuredIndex = storiesDiv.indexOf(featuredTextPrefix);
        storiesDiv = storiesDiv.substring(featuredIndex);
        
        var textStartsPrefix = ">";
        storiesDiv = storiesDiv.substring(storiesDiv.indexOf(textStartsPrefix));
        storiesDiv = storiesDiv.substring(textStartsPrefix.length);
        
        //Story Text********************************************
        var textEndPrefix = "<";
        var storyText = storiesDiv.substring(0,storiesDiv.indexOf(textEndPrefix));
        storyText = storyText.replace(/&nbsp;/g, "")
        //End Story Text****************************************
        
        var imgTagPrefix = "IMG SRC=\"";
        var imgTagIndex = storiesDiv.indexOf(imgTagPrefix);
        storiesDiv = storiesDiv.substring(imgTagIndex);
        storiesDiv = storiesDiv.substring(imgTagPrefix.length);
        
        //Getting the image URL**********************************
        var imgEndPrefix = "\"";
        var imgEndIndex = storiesDiv.indexOf(imgEndPrefix);
        var imgURL = storiesDiv.substring(0,imgEndIndex);
        
        //removing the thumbnail tag (t)
        
        imgURL = imgURL.substr(0,imgURL.length-5);
        imgURL = imgURL + ".jpg";
        //End  Image URL******************************************
        
        if (storyLink.length > 0) {
            var story = {
            "StoryLink" : storyLink,
            "StoryTitle" : storyTitle,
            "StoryWrite" : storyWriter,
            "StoryDate" : storyDate,
            "StoryText" : storyText,
            "ImageURL": imgURL
            }
            stories.push(story);
        }
        
        var tableEndPrefix = storiesDiv.indexOf("</table>");
        storiesDiv = storiesDiv.substr(tableEndPrefix);
        
        //Stops the while loop after max 40 stories
        breaker++;
        if (breaker > 40) {
            console.log(storiesDiv);
            storiesDiv = "";
        } 
        //------------------------------------------  
    }
    
    collectFeeds(req,res,stories);
}

function getAppHomePage(req,res) {
    request('http://duke.scout.com/a.z?s=167&p=4&cfg=fb', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        processHomePage(req,res,body);
    }
    })
}

function getDukeData(req,res) {
    var queryData = url.parse(req.url, true).query; //Parse the URL Request Data Components
    
    if (queryData.section == "homepage") {
        getAppHomePage(req,res);
    }
    else {
        res.send('no section');   
    }
}
exports.getDukeData = getDukeData;