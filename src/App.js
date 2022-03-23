import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import players, { getPlayerId } from '@nhl-api/players';
import seedrandom from 'seedrandom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faCircleXmark, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';


const currentDate = new Date();
const month = currentDate.getMonth();
const date = currentDate.getDate();
const year = currentDate.getFullYear();

const dateStr = "" + year + month + date;
const generator = seedrandom(parseInt(dateStr))

function App() {
  var teamOfTheDay = Math.floor(generator() *  32) + 1;

  
  const [guessCount, setGuessCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuess, setCorrectGuess] = useState();
  const [correctPlayerInfo, setCorrectPlayerInfo] = useState({});

  const [userWin, setUserWin] = useState(false);
  const [userLose, setUserLose] = useState(false);

  const [howToPlay, setHowToPlay] = useState(false);
  //console.log(correctGuess);
  
  useEffect(() => {
    // if we havent set todays guess we have to do that
    if (!correctGuess){
      /* the api has random teams for certain numbers, so this is 
         converting them to get the right rosters */
      
         if(teamOfTheDay == 11) teamOfTheDay = 54;// if thrashers -> golden knights
         if(teamOfTheDay == 27) teamOfTheDay = 53; // if phoenix coyotes -> arizona coyotes
         if(teamOfTheDay == 0) teamOfTheDay = 55; // if nordiques -> kraken
         if(teamOfTheDay == 31) teamOfTheDay = 52; // north stars -> winnipeg jets
         if(Object.keys(correctPlayerInfo).length === 0) {
          setPlayer();
        }
    }
    if(userWin) {
      console.log("congrats, you won!")
    }
  })

  function infoSetter() {
    if (howToPlay == true)
      setHowToPlay(false);
    else
      setHowToPlay(true);
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
      //response.data.roster.;
      correctID = player.person.id;
      //setCorrectGuess(player.person.id);
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
    
    setCorrectPlayerInfo(
      {
        name: playerData.fullName,
        team: playerTeamData.abbreviation, 
        division: playerTeamData.division.name,
        conference: playerTeamData.conference.name,
        shoots: playerData.shootsCatches,
        country: playerData.birthCountry,
        dob: YOB,
        position: playerData.primaryPosition.code
      }
    )

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

    if(userGuess.name == correctPlayerInfo.name) {
      compareCheck.name = true;
      setUserWin(true);
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
    
      console.log(userGuess.dob)
      console.log(correctPlayerInfo.dob)
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

  async function doGuess() {
    

    if(guessCount > 7) {
      if(userLose == false) setUserLose(true);
      return;
    } 
    else {
      var playerData;
      const playerId = getPlayerId(currentGuess);
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
        index: guessCount,
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
      console.log(comparison);
      
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

      if(playerData.primaryPosition.code == 'L' || playerData.primaryPosition.code == 'R' || playerData.primaryPosition.code == 'C')
        newRow.position = 'F'

      var updatedRows = [...rows];
      updatedRows.push(newRow);

      setRows(updatedRows);
      setGuessCount(guessCount + 1);
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
      
      {(userWin === false) && // if the user wins then we remove the submit 
                              // button so they cant keep playing
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
           {guessCount == 0 && <td style={{backgroundColor: 'white'}}></td>}
            { (r.divisionTruth == true) &&
              <td className="data" style={{backgroundColor: r.teamTruth ? 'green' : 'yellow'}}>{r.team}</td>}
            { (r.divisionTruth == false) &&
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
        </div>)}
      {(userLose && 
        <div className="correctDiv">
          <h1>You didn't get today's player</h1>
          <h2>{correctPlayerInfo.name}</h2>
        </div>)}
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
