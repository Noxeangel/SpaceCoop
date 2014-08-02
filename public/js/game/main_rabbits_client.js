////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Varibles declaration
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
var isXPRunning = false;
var canvas;
var stage;
var stagewidth;
var stageheight;

var state;
var state_load = 'STATE_LOAD';
var state_game ='STATE_GAME';
var state_endAnim = 'STATE_ENDANIM';
var state_share = 'STATE_SHARE';
var state_wait = 'STATE_WAIT';
var state_lobby = 'STATE_LOBBY';
var state_noxp = 'STATE_NOXP';
var state_xpEnd = 'STATE_ENDXP';
var state_login = 'STATE_LOGIN';

//Language
var language = 'en';
//Strings Array index numbers

var str_lobby = 0;
var str_noxp = 1;
var str_waitShare = 2;
var str_doShare = 3;

var str_playerId = 4;
var str_playerRep = 5;
var str_playerScore = 6;

var str_xpName = 7;
var str_xpRep = 8;
var str_xpGame = 9;

var str_score = 10;
//Strings Array
var stringsArray = [];
var score_value = 0;

//IO Socket
var socket;

//Views
var ship;
var allyShip;
var background;
var enemy;
var shot;
var mothership;

var progressText ;
var score;

var maxAmmount;
var minAmmount;
var givenAmmount;
var slider;
//Game Variables

var share = 0;
var canfire = true;
var bulletArray = [];

//Preloader
var preloader;
var manifest;
var totalLoaded = 0;

var WaitView = new createjs.Container();
var GameView = new createjs.Container();
var ShareView = new createjs.Container();


var WaitWheel = new createjs.Container();
var wheelCircleArray;
var wheelInc = 0;

var EnemiesCont = new createjs.Container();
var enemiesY = 150;
var enemiesX = 100;
var enemiesX_spacing = 60;
var enemiesY_spacing = 60;
var lines = 4;
var number = 10;


//Constants
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_SPACE = 32;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point of Space Coop (Function called by main.jst)
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main_Rabbits() {
      canvas = document.getElementById("viewport");
      stage = new createjs.Stage(canvas);

      stagewidth = stage.canvas.width;
      stageheight = stage.canvas.height;

      //Game Loop Listener
      createjs.Ticker.setFPS(60);
      createjs.Ticker.on("tick", tick); 

      window.addEventListener("keydown", function(e) {
      // space and arrow keys
      if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
      }
      }, false);

      StartLoading();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//   Loading Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function StartLoading()
{
  state = state_load;
  LoadStrings();

  background = new createjs.Bitmap("/public/images/RabbitBackground.png");
  stage.addChild(background);
  stage.update();

  progressText = new createjs.Text("", "20px Arial", "#FFFFFF");
  progressText.textAlign = "center";
  progressText.y = 20;
  progressText.x = 400 ;

  score = new createjs.Text("Score : 0","10px Arial","#FFFFFF");

  maxAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");
  minAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");
  givenAmmount= new createjs.Text("", "20px Arial", "#FFFFFF");

  stage.addChild(progressText);
  stage.update();
  //Loading Manifest
  manifest = [
                {src:"/public/images/RabbitBackground.png", id:"background"},
                {src:"/public/images/RabbitRight.png", id:"ship"},
                {src:"/public/images/RabbitRight.png", id:"allyShip"},
                {src:"/public/images/RedBalloon.png", id:"enemy"},
                {src:"/public/images/FlyingRabbit.png", id:"shot"},
                {src:"/public/images/GoalBalloon.png", id:"mother"},
              ];
  //loading Events and Callbacks
  preloader = new createjs.LoadQueue(true)
  preloader.installPlugin(createjs.Sound);
  preloader.on("progress",handleProgress);
  preloader.on("complete" , handleComplete);
  preloader.on("fileload" , handleFileLoad);
  preloader.on("error", loadError);
  preloader.loadManifest(manifest);
}

function LoadStrings()
{
  var XMLStrings;
  var XMLNode;
  if(window.XMLHttpRequest)
  {
    var xmlhttp = new XMLHttpRequest();
  }
  else
  {
    var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");    
  }
  xmlhttp.open("GET","/public/localization/lang.xml",false);
  xmlhttp.send();
  
  XMLStrings= xmlhttp.responseXML;

  XMLNode = XMLStrings.getElementsByTagName(language)
  console.log(XMLNode);
  for(var i = 0; i < XMLNode[0].children.length ; i++)
  {
    stringsArray.push(XMLNode[0].children[i].innerHTML)
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Preloading callback functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function handleFileLoad (event)
{
      if(event.item.id == "background"){
            background = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "ship"){
            ship = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "allyShip"){
            allyShip = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "mother"){
            mothership = new createjs.Bitmap(event.result);
      }
      if(event.item.id == "enemy"){
            enemy = new createjs.Bitmap(event.result);
            for(var j = 0; j < lines; j++)
            {
                for(var i = 0; i < number; i ++)
                {
                  var tmpEnemy = new createjs.Bitmap(event.result);
                  tmpEnemy.x = i * enemiesX_spacing;
                  tmpEnemy.y = j * enemiesY_spacing;
                  EnemiesCont.addChild(tmpEnemy);
                }
            } 


      }
      if(event.item.id == "shot"){
            shot = new createjs.Bitmap(event.result);
      }
}
function loadError (event)
{
      console.log("PRELOAD ERROR : "+evt.text);
}
function handleProgress (event)
{
     progressText.text = (preloader.progress*100|0) + " % Loaded";
     stage.update(); 
}
function handleComplete (event)
{
     startServerListen();  //We start listening to the server after the loading of all the assets
     InitLobbyState(); 
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Server listening relative code
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function startServerListen()
{
      //Socket init
      
      var tmpAddress = document.URL;
      var serverAddress = tmpAddress.substring(0,tmpAddress.lastIndexOf('/'));
      socket = io.connect(serverAddress);
      console.log('connection message sent to : '+serverAddress);
      //Socket Server Listener
      socket.on("message",function(data){
            serverMessageParser(data);
      });   

}

function serverMessageParser(data)
{
      var splittedData = data.split(',');
      switch (splittedData[0])
      {
        case 'UPDATE':
          updateScreen(splittedData);
        break;
        case 'INFO':
          document.getElementById("id").innerHTML = stringsArray[str_playerId]+splittedData[1];
          document.getElementById("repetition").innerHTML = stringsArray[str_playerRep]+splittedData[2];
          document.getElementById("score").innerHTML = stringsArray[str_playerScore]+splittedData[3];

          document.getElementById("xpName").innerHTML = stringsArray[str_xpName]+splittedData[4];
          document.getElementById("xpIter").innerHTML = stringsArray[str_xpRep]+splittedData[5];
          document.getElementById("xpGame").innerHTML = stringsArray[str_xpGame]+splittedData[6];
        break;
        case 'GAME_START':
          isXPRunning = true;
          //ClearGameState();
          ClearLobbyState();
          InitGameState();
        break;
        case 'LOBBY':
          //ClearLobbyState();
          ClearGameState();
          ClearShareState();
          ClearWaitState();
          InitLobbyState();
        break;
        case 'NO_XP':
          isXPRunning = false;
          ClearGameState();
          //ClearLobbyState();
          InitNoXP();
        break;
        case 'SHARE_STATE':
          ClearGameState();
          //ClearLobbyState();
          InitShareState();
        break;
        case 'SHARE_WAIT':
          ClearGameState();
          ClearLobbyState();
          InitShareWait();
        break;
        case 'REDIRECT':
 
          window.location.replace('/');
        break;
      }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Init State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function InitGameState()
{
  progressText.text = "Use Arrow Keys to Move and Space key to shoot"; 
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  ship.x = 400;
  ship.y = 550;
  
  allyShip.x = 400;
  allyShip.y = 550;

  EnemiesCont.x = 100;
  EnemiesCont.y = 150;

  mothership.x = 100;
  mothership.y = 20;

  stage.addChild(progressText);
  stage.addChild(ship);
  stage.addChild(allyShip);
  stage.addChild(mothership);
  stage.addChild(score);
  stage.addChild(EnemiesCont);
  document.onkeydown = handleKeyDown;
  state = state_game;  
}

function InitLobbyState()
{
  progressText.text = "You are now in Lobby\n Waiting For another Player to join";
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  var circleSize = 80;
  var elemSize = 20;
  var elemNum = 8;
  var stageCenterX = stagewidth / 2;
  var stageCenterY = stageheight / 2;
  var angle = 2*Math.PI / elemNum;

  WaitWheel = new createjs.Container();

  for(var i = 0 ; i < elemNum ; i++)
  {
    var tmpCircle = new createjs.Shape();
    tmpCircle.graphics.beginFill("white").drawCircle( circleSize/2 * Math.cos(i*angle),  circleSize/2 * Math.sin(i*angle), elemSize);
    tmpCircle.alpha = 0.75;
    WaitWheel.addChild(tmpCircle);
  }
  WaitWheel.x = stageCenterX - circleSize/2;
  WaitWheel.y = stageCenterY - circleSize/2;
  stage.addChild(WaitWheel);
  stage.addChild(progressText);
  stage.update();

  window.setInterval(function(){
    if(wheelInc < WaitWheel.getNumChildren())
    {
      wheelInc++;
    }
    else
    {
      wheelInc = 0;
    }
    for(var i = 0 ; i < WaitWheel.getNumChildren() ; i++  )
    {
      if(i == wheelInc)
      {
            WaitWheel.getChildAt(i).alpha = 0;
            if(i-1 >= 0){WaitWheel.getChildAt(i-1).alpha = 0.125;}
            if(i-2 >= 0){WaitWheel.getChildAt(i-2).alpha = 0.25;} 
            if(i-3 >= 0){WaitWheel.getChildAt(i-3).alpha = 0.375;} 
            if(i-4 >= 0){WaitWheel.getChildAt(i-4).alpha = 0.50;} 
            if(i-5 >= 0){WaitWheel.getChildAt(i-5).alpha = 0.625;}                         
      }
      else
      {
        WaitWheel.getChildAt(i).alpha = 0.75;
      }
    }
  },60);
  state = state_lobby;  
}

function InitNoXP()
{
  progressText.text = "You are now in Lobby \n No XP is currently running \n Please come again later or contact the administrator : johndoe@fake.com ";  
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  stage.addChild(progressText);
  stage.update();
  state = state_noxp;  
}

function InitShareState()
{
  progressText.text = "You can now share the points with the other player \n Use the arrow keys to move your ship and select the ammount of point given \n then hit space key to send"; 
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  maxAmmount.x = 700;
  maxAmmount.y = 400;
  maxAmmount.width = 100;
  maxAmmount.text = "Max Ammount"

  minAmmount.x = 0;
  minAmmount.y = 400;
  minAmmount.width = 100;
  minAmmount.text = "0"

  givenAmmount.x = 350;
  givenAmmount.y = 350;
  givenAmmount.width = 100;
  givenAmmount.text = "Given Ammount : "

  slider = new createjs.Shape();
  slider.graphics.beginFill("white").drawRect(100,400,600,20);
  ship.x = 100;
  ship.y = 390;

  
  stage.addChild(slider);
  stage.addChild(ship);
  stage.addChild(maxAmmount);
  stage.addChild(minAmmount);
  stage.addChild(givenAmmount);
  stage.addChild(progressText);
  stage.update();
  state = state_share;  
}

function InitShareWait()
{
  progressText.text = "The other player will now share a fraction of the points with you.\nWait until he is done";  
  progressText.y = 20;
  progressText.x = 400 ;
  progressText.textAlign = "center";

  stage.addChild(progressText);
  stage.update();
  state = state_wait; 
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Clear State Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function ClearGameState()
{
  stage.removeChild(progressText);
  stage.removeChild(ship);
  stage.removeChild(allyShip);
  stage.removeChild(EnemiesCont);
  stage.removeChild(mothership);
  stage.removeChild(score);
  for(var i = 0 ; i < EnemiesCont.getNumChildren() ; i++)
  {
    EnemiesCont.getChildAt(i).alpha = 1;
  }
  for(var j = 0; j < bulletArray.length; j ++)
  {
    stage.removeChild(bulletArray[j]);
  }
  stage.update();
}

function ClearLobbyState()
{
  stage.removeChild(progressText);
  stage.removeChild(WaitWheel);
  stage.update();
}
function ClearShareState()
{
  stage.removeChild(slider);
  stage.removeChild(ship);
  stage.removeChild(maxAmmount);
  stage.removeChild(minAmmount);
  stage.removeChild(givenAmmount);
  stage.removeChild(progressText);
}
function ClearWaitState()
{
  stage.removeChild(progressText);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Screen Default Update
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function tick(event) {
  stage.update(event);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Input Callbacks
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleKeyDown(e)
{
  if(state == state_game)
  {
    switch (e.keyCode) {
      case KEYCODE_LEFT:
        sendInputs(1,0,0);
        break;

      case KEYCODE_RIGHT:
        sendInputs(0,1,0);
        break;

      case KEYCODE_SPACE:
        if(canfire)
        {
          sendInputs(0,0,1);
          canfire = false;
          setTimeout(function(){canfire = true},120);
        }
      break;

    }
  }
  else if (state == state_share)
  {
    switch (e.keyCode) {
      case KEYCODE_LEFT:
        sendInputs(1,0,0);
        UpdateShareAmmount();
        break;

      case KEYCODE_RIGHT:
        sendInputs(0,1,0);
        UpdateShareAmmount();
        break;

      case KEYCODE_SPACE:
        if(canfire)
        {
          SendShareAmmount();
        }
      break;

    }
  }
}

function UpdateShareAmmount()
{
  share = parseInt(score_value * (ship.x-100)/700);
  console.log(share);
  maxAmmount.text = score_value;
  minAmmount.text = 0;
  givenAmmount.text = 'You will give : '+share+' points';

}
function SendShareAmmount()
{
  socket.emit("message",'SHARE,'+ share);
}
function debugAddScore()
{
  socket.emit("message",'SCORE');
}

function debugShare()
{
  socket.emit("message",'SHARE');
}

function debugEnd()
{
  socket.emit("message",'END');
}

function sendInputs(left,right,shoot)
{
  if(isXPRunning)
  {
    socket.emit("message",'INPUT,'+left+','+right+','+shoot);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Drawing Functions
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//   Update Message Anatomy
//      Element 0 = 'UPDATE'
//      Element 1 = own ship x
//      Element 2 = ally ship x
//      Element 3 = enemy pack data (x position then 1 if alive 0 else)
//      Element 4 = mothership x
//      Element 5 = shots
//      Element 6 = score
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateScreen(data)
{
  drawOwnShip(data[1]);
  drawAllyShip(data[2]);
  drawEnemies(data[3]);
  drawMothership(data[4]);
  drawShots(data[5]);
  drawScore(data[6]);
}

function drawOwnShip(data)
{
  ship.x = data;
}

function drawAllyShip(data)
{
  allyShip.x = data;
}

function drawEnemies(data)
{
  var splittedData = data.split('#');
  EnemiesCont.x = splittedData[0];
  for(var i = 1; i < splittedData.length; i ++)
  {
    if(splittedData[i] == '0')
    {
      if(EnemiesCont.getChildAt(i-1))
      {
        EnemiesCont.getChildAt(i-1).alpha = 0;
      }
      
    }
  }
}

function drawMothership(data)
{
  var splittedData = data.split('#');
  mothership.x = splittedData[0];
  mothership.y = splittedData[1];
}

function drawShots(data)
{
  var splittedData = data.split('#');

  for(var i = 0; i < splittedData.length / 4; i++)
  {

    for(var j = 0; j < bulletArray.length; j++)
    {
      if(bulletArray[j].uid == splittedData[i*4+3])
      {
        bulletArray[j].x = splittedData[i*4];
        bulletArray[j].y = splittedData[i*4+1];
        bulletArray[j].isUpdated = true;
        splittedData.splice(i*4,4);
      }
    }    
  }
  for(var i = 0; i < (splittedData.length / 4); i++)
  {
    var tmpShot = shot.clone();
    tmpShot.x = splittedData[i*4];
    tmpShot.y = splittedData[i*4+1];
    tmpShot.uid = splittedData[i*4+3];
    tmpShot.isUpdated = true;
    bulletArray.push(tmpShot);
    stage.addChild(bulletArray[bulletArray.length - 1]);  
  }
  for(var j = 0; j < bulletArray.length; j++)
  {
    if(!bulletArray[j].isUpdated)
    {
      stage.removeChild(bulletArray[j]);
      bulletArray.splice(j,1);
    }
    else
    {
      bulletArray[j].isUpdated = false;
    }
  }   
  stage.update();
}

function drawScore(data)
{
  score.text = "Score : "+ data;
  score_value = data;
  stage.update();
}