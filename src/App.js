import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import players, { getPlayerId } from '@nhl-api/players';
import seedrandom from 'seedrandom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faCircleXmark, faQuestionCircle, faShareFromSquare } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { useCookies } from 'react-cookie';

const initialDate = new Date("03/23/2022");
const currentDate = new Date();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0,0,0,0);

var difference = Math.ceil(Math.abs(currentDate - initialDate));
var diff = new moment.duration(difference);
var dayNumber = Math.ceil(diff.asDays());

const month = currentDate.getMonth();
const date = currentDate.getDate();
const year = currentDate.getFullYear();

const dateStr = "" + year + month + date;
const generator = seedrandom(parseInt(dateStr))


function App() {
  var teamOfTheDay = Math.floor(generator() *  32) + 1;

  const [cookies, setCookie, removeCookie] = useCookies(["user", "count", "winBool", "loseBool", "storage"])
  
  const [guessCount, setGuessCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuess, setCorrectGuess] = useState(false);
  const [correctPlayerInfo, setCorrectPlayerInfo] = useState({});
  const [startedUp, setStartedUp] = useState(false);
  const [userWin, setUserWin] = useState(false);
  const [userLose, setUserLose] = useState(false);

  const [howToPlay, setHowToPlay] = useState(false);
  useEffect(() => {
    if(!startedUp) startUp();
  }, [userLose, userWin]);

  function startUp() {
    // if we dont have storage, we'll check to see if there is some in cookies
    if(cookies.storage) {
      storageManager();
    }
    // if we havent set todays guess and there is nothing in storage for today we have to do that
    if (!correctGuess && !cookies.storage){
      console.log("test");
      /* the api has random int values for certain teams, so this is 
          converting them to get the right rosters */
        if(teamOfTheDay == 11) teamOfTheDay = 54;// if thrashers -> golden knights
        if(teamOfTheDay == 27) teamOfTheDay = 53; // if phoenix coyotes -> arizona coyotes
        if(teamOfTheDay == 0) teamOfTheDay = 55; // if nordiques -> kraken
        if(teamOfTheDay == 31) teamOfTheDay = 52; // north stars -> winnipeg jets
        if(Object.keys(correctPlayerInfo).length === 0) setPlayer();
    }
    setStartedUp(true);
  }

  function storageManager() {
    if(cookies.user && rows.length == 0) { // if we have info in cookies and its not on the page we put it there
      setRows(cookies.user);
      setGuessCount(cookies.user.length);
      if(cookies.winBool) setUserWin(true);  // if user has already won then we set the win 
      if(cookies.loseBool) setUserLose(true);  // if user has already lost then we set the lose
    }
    if(cookies.storage) {
      setCorrectPlayerInfo(cookies.storage.correctInfo);
      setCorrectGuess(true);
    }
    else {
      var correct;
      if(correctGuess) correct = true;

      var x = {
        correct: correct,
        correctInfo: correctPlayerInfo,
      }

      setCookie("storage", x, {
        path: "/",
        expires: tomorrow
      })
    }
  }


  function setText() {
    var rowsString = "";
    for(var i = 0; i < rows.length; i++) {
      if(rows[i].nameTruth == true) rowsString = rowsString.concat("🟩");
      else rowsString = rowsString.concat("⬜");

      if(rows[i].teamTruth == true) rowsString = rowsString.concat("🟩");
      else if(rows[i].divisionTruth == true) rowsString = rowsString.concat("🟨");
      else rowsString = rowsString.concat("⬜");

      if(rows[i].shootsTruth == true) rowsString = rowsString.concat("🟩");
      else rowsString = rowsString.concat("⬜");

      if(rows[i].countryTruth == true) rowsString = rowsString.concat("🟩");
      else rowsString = rowsString.concat("⬜");

      if(rows[i].dobTruth == true) rowsString = rowsString.concat("🟩")
      else if(rows[i].dobAbove == true || rows[i].dobBelow == true) rowsString = rowsString.concat("🟨");
      else rowsString = rowsString.concat("⬜");

      if(rows[i].positionTruth == true) rowsString = rowsString.concat("🟩");
      else rowsString = rowsString.concat("⬜");

      rowsString = rowsString.concat("\n");
    }

    if(userWin == true) rowsString = rowsString.concat("Skatle #" + dayNumber + " " + rows.length + "/8\n\nhttps://skatle.herokuapp.com/");
    else rowsString = rowsString.concat("Skatle #" + dayNumber + " X" + "/8\n\nhttps://skatle.herokuapp.com/");
    return rowsString;
  }

  function infoSetter() {
    if (howToPlay == true)
      setHowToPlay(false);
    else
      setHowToPlay(true);
      // removeCookie("count");
      // removeCookie("user");
      // removeCookie("winBool");
      // removeCookie("loseBool");

  }

  async function setPlayer() {
    var playerData;
    var playerTeamData;
    var YOB;
    
    var correctID;

    await axios({
      method: 'get',
      url: 'https://statsapi.web.nhl.com/api/v1/teams/' + teamOfTheDay + '/roster'
    }).then(function (response) {
      var playerToPick = Math.floor(generator() * response.data.roster.length);
      var player = response.data.roster[playerToPick];
      correctID = player.person.id;
    }).catch(err => {
      console.log(err);
    })

    await axios({
      method: 'get',
      url: 'https://statsapi.web.nhl.com/api/v1/people/' + correctID
    }).then(function (response) {
      playerData = response.data.people[0]
     
      YOB = playerData.birthDate.substring(0, 4);
    }).catch(err => {
      console.log(err);
    })
    
    await axios({
      method: 'get',
      url: 'https://statsapi.web.nhl.com/api/v1/teams/' + playerData.currentTeam.id
    }).then(function (response) {
      playerTeamData = response.data.teams[0];
    }).catch(err => {
      console.log(err);
    })
    
    setCorrectPlayerInfo({
      name: playerData.fullName,
      team: playerTeamData.abbreviation, 
      division: playerTeamData.division.name,
      conference: playerTeamData.conference.name,
      shoots: playerData.shootsCatches,
      country: playerData.birthCountry,
      dob: YOB,
      position: playerData.primaryPosition.code
    })
    setCorrectGuess(true);
  }
  
  function comparePlayer(userGuess) {
    var compareCheck = {
      name: false,
      team: false,
      division: false,
      shoots: false,
      country: false,
      dob: false,
      userBelow: false,
      userAbove: false,
      position: false
    }
    console.log(guessCount);
    if(userGuess.name == correctPlayerInfo.name) {
      compareCheck.name = true;
      setUserWin(true);
      setCookie("winBool", true, {
        path: "/",
        expires: tomorrow
      });
    }
    else if(guessCount + 1 == 8 && userGuess.name != correctPlayerInfo.name) {
      setUserLose(true)
      setCookie("loseBool", true, {
        path: "/",
        expires: tomorrow
      })
      console.log("test");
    }

    var userForwardCheck = false;
    var correctForwardCheck = false;
    

    /* this is a condition added because forwards are just labeled as 'F' rather than lw/c/rw
       the main purpose of this is because players arent always labeled as the right position */
    if(userGuess.position == 'L' || userGuess.position == 'R' || userGuess.position == 'C')
      userForwardCheck = true;
    if(correctPlayerInfo.position == 'L' || correctPlayerInfo.position == 'R' || correctPlayerInfo.position == 'C')
      correctForwardCheck = true;
    if(userForwardCheck && correctForwardCheck)
      compareCheck.position = true;

    if(userGuess.team == correctPlayerInfo.team) compareCheck.team = true;
    if(userGuess.division == correctPlayerInfo.division) compareCheck.division = true;
    if(userGuess.conference == correctPlayerInfo.conference) compareCheck.conference = true;
    if(userGuess.shoots == correctPlayerInfo.shoots) compareCheck.shoots = true;
    if(userGuess.country == correctPlayerInfo.country) compareCheck.country = true;
    if(userGuess.dob == correctPlayerInfo.dob) compareCheck.dob = true;
    if(parseInt(userGuess.dob) == parseInt(correctPlayerInfo.dob) - 1 || parseInt(userGuess.dob) == parseInt(correctPlayerInfo.dob) - 2)  compareCheck.userBelow = true;
    if(parseInt(userGuess.dob) == parseInt(correctPlayerInfo.dob) + 1 || parseInt(userGuess.dob) == parseInt(correctPlayerInfo.dob) + 2) compareCheck.userAbove = true;
    if(userGuess.position == correctPlayerInfo.position) compareCheck.position = true;
    return compareCheck;
  }


  function updateCookie(newRows, newGuessCount) {
    setCookie("user", newRows, {
      path: "/",
      expires: tomorrow
    });
    
    setCookie("count", newGuessCount, {
      path: "/",
      expires: tomorrow
    });
  }

  async function doGuess() {
    if(guessCount == 8) {
      if(userLose == false) setUserLose(true);
      updateCookie(rows, 8);
    }
    else {
      var playerId;
      var playerData;
      // some players have special cases where they dont return in searches, theyre accounted for here
      switch(currentGuess.toLowerCase()) {
        case "ryan o'rielly":
          playerId = 8475158;
          break;
        default:
          playerId = getPlayerId(currentGuess);
          break;
      }
      
      var playerTeamData;

      // get player data from user lookup
      await axios({
        method: 'get',
        url: 'https://statsapi.web.nhl.com/api/v1/people/' + playerId
      }).then(function (response) {
        playerData = response.data.people[0];
      })

      //get players team data for conference and stuff
      await axios({
        method: 'get',
        url: 'https://statsapi.web.nhl.com/api/v1/teams/' + playerData.currentTeam.id
      }).then(function (response) {
        playerTeamData = response.data.teams[0];
      })

      var YOB = playerData.birthDate.substring(0, 4);
      var newRow = {
        index: rows.length,
        name: playerData.fullName,
        nameTruth: false,
        team: playerTeamData.abbreviation,
        teamTruth: false,
        division: playerTeamData.division.name,
        divisionTruth: false,
        conference: playerTeamData.conference.name,
        conferenceTruth: false,
        shoots: playerData.shootsCatches,
        shootsTruth: false,
        country: playerData.birthCountry,
        countryTruth: false,
        dob: YOB,
        dobTruth: false,
        dobAbove: false,
        dobBelow: false,
        position: playerData.primaryPosition.code,
        positionTruth: false
      }

      var comparison = comparePlayer(newRow);
      
      if(comparison.name) newRow.nameTruth = true;
      if(comparison.team) newRow.teamTruth = true;
      if(comparison.division) newRow.divisionTruth = true;
      if(comparison.conference) newRow.conferenceTruth = true;
      if(comparison.shoots) newRow.shootsTruth = true;
      if(comparison.country) newRow.countryTruth = true;
      if(comparison.dob) newRow.dobTruth = true;
      if(comparison.userBelow) newRow.dobBelow = true;
      if(comparison.userAbove) newRow.dobAbove = true;
      if(comparison.position) newRow.positionTruth = true;

      //setting position to F for all forwards
      if(playerData.primaryPosition.code == 'L' || playerData.primaryPosition.code == 'R' || playerData.primaryPosition.code == 'C')
        newRow.position = 'F'

      var updatedRows = [...rows];
      updatedRows.push(newRow);

      setRows(updatedRows);
      setGuessCount(guessCount + 1);    

      updateCookie(updatedRows, guessCount + 1);
    }
  }
  
  const handleChange = e => {
    setCurrentGuess(e.target.value);
  }

  return (
    <div className="App">
      <div className="header">
        <h3 id="how-to" onClick={infoSetter}>{howToPlay == false && <FontAwesomeIcon icon={faQuestionCircle} />}
                                             {howToPlay == true && <FontAwesomeIcon icon={faCircleXmark} />} 
        </h3>
        <h1 id="skatle-logo">Skatle</h1>
        <h2 id="skatle-desc">Guess the hockey player daily</h2>
      </div>
      
      {(userWin === false && userLose == false) && //if the user wins/loses then we remove the submit button so they cant keep playing
        <div>
          <input type="text" placeholder="player name" value={currentGuess} onChange={handleChange}/>
          <button id="submitBtn" onClick={doGuess}>Submit</button>
        </div>
      }
      <br />
      <table className="guessTable">
        <thead className="table-header">

          <th className="heading">Name</th>
          <th className="heading">Team</th>
          <th className="heading">Shoots/Catches</th>
          <th className="heading">Country</th>
          <th className="heading">Year Born</th>
          <th className="heading">Position</th>
        </thead>
          {rows.map((r) => (
            <tbody className="table-body">
              <td className="data" style={{backgroundColor: r.nameTruth ? 'green' : 'white'}}>{r.name}</td>
              {/*guessCount == 0 && <td style={{backgroundColor: 'white'}}></td>*/}
              { (r.divisionTruth) &&
                <td className="data" style={{backgroundColor: r.teamTruth ? 'green' : 'yellow'}}>{r.team}</td>}
              { (!r.divisionTruth) &&
                <td className="data" style={{backgroundColor: r.teamTruth ? 'green' : 'white'}}>{r.team}</td>}
              <td className="data" style={{backgroundColor: r.shootsTruth ? 'green' : 'white'}}>{r.shoots}</td>
              <td className="data" style={{backgroundColor: r.countryTruth ? 'green' : 'white'}}>{r.country}</td>
              <td className="data" style={{backgroundColor: r.dobTruth ? 'green' : 'white'}}>
                {(r.dobAbove == true) && <FontAwesomeIcon icon={faArrowDown} />}
                {(r.dobBelow == true) && <FontAwesomeIcon icon={faArrowUp} />}
                {r.dob}</td>
              <td className="data" style={{backgroundColor: r.positionTruth ? 'green' : 'white'}}>{r.position}</td>
            </tbody>
          ))}

        
      </table>
      {(userWin && 
        <div className="correctDiv">
          <h1>You guessed today's player!</h1>
          <h2>{correctPlayerInfo.name}</h2>
          <button onClick={() => {navigator.clipboard.writeText(setText())}}><FontAwesomeIcon icon={faShareFromSquare} />Share</button>
        </div>
      )}
      {(userLose && 
        <div className="correctDiv">
          <h1>You didn't get today's player</h1>
          <h2>{correctPlayerInfo.name}</h2>
          <button onClick={() => {navigator.clipboard.writeText(setText())}}><FontAwesomeIcon icon={faShareFromSquare} />Share</button>
        </div>
      )}
      {(howToPlay && 
        <div className="infoContainer">
          <div className="gameInfo">
            <h1>HOW TO PLAY</h1>
            <h2>You have 8 guesses to correctly identify the NHL player</h2>
            <h2>Any correct guess will show the color green</h2>
            <h2>If you guess the player's division, but not the right team, the color of the team will be yellow.</h2>
            <h2>If you guess within 2 years of the player's YOB, but not the right year:</h2>
            <h2>A player who was born 1 or 2 years later will be indicated by an <FontAwesomeIcon icon={faArrowUp} /> icon</h2>
            <h2>A player who was born 1 or 2 years earlier will be indicated by an <FontAwesomeIcon icon={faArrowDown} /> icon</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
