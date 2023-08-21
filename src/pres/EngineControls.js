import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt, faUser } from '@fortawesome/free-solid-svg-icons'
import { FormGroup, FormControlLabel, Switch, Table, TableRow, TableHead, TableBody, TableCell, TableFooter, TextField } from '@material-ui/core';
import React from 'react'
import {getPerformanceDetails} from '../app/util'
import {copyText} from './loader/Common'

export default class EngineControls extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            engineOn: true,
            engineInitialized: false,
            engineLoaded: false,
            engineReady: false,
            engineCurDepth: 0,
            engineCurNps: 0,
            engineCurScore: 0,
            engineMateIn: null,
            moveFrom: '',
            moveTo: '',
            movePromotion: '',
            isEngineRunning: false,
        };
        this.engine = new Worker('stockfish-nnue-16.js#stockfish-nnue-16.wasm');
        this.evaler = new Worker('stockfish-nnue-16.js#stockfish-nnue-16.wasm');

        this.engine.onmessage = this.engineOnMessage.bind(this);
        this.evaler.onmessage = this.evalerOnMessage.bind(this);
    }

    uciCmd(cmd, which) {
        console.log("UCI: " + cmd);
        
        (which || this.engine).postMessage(cmd);
    }

    engineOnMessage(event) {
        var line;
        
        if (event && typeof event === "object") {
            line = event.data;
        } else {
            line = event;
        }
        if(line == 'uciok') {
            this.state.engineLoaded = true;
        } else if(line == 'readyok') {
            this.state.engineReady = true;
        } else {
            var match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
            /// Did the AI move?
            if(match) {
                this.state.isEngineRunning = false;
                this.state.moveFrom = match[1];
                this.state.moveTo = match[2];
                this.state.movePromotion = match[3];
                this.uciCmd("eval", this.evaler);
            /// Is it sending feedback?
            } else if(match = line.match(/^info .*\bdepth (\d+) .*\bnps (\d+)/)) {
                this.state.engineCurDepth = match[1];
                this.state.engineCurNps = match[2];
            }
            
            /// Is it sending feed back with a score?
            if(match = line.match(/^info .*\bscore (\w+) (-?\d+)/)) {
                var score = parseInt(match[2]);
                /// Is it measuring in centipawns?
                if(match[1] == 'cp') {
                    this.state.engineCurScore = (score / 100.0).toFixed(2);
                /// Did it find a mate?
                } else if(match[1] == 'mate') {
                    this.state.engineMateIn = Math.abs(score);
                }
                
                /// Is the score bounded?
                // if(match = line.match(/\b(upper|lower)bound\b/)) {
                //     engineStatus.score = ((match[1] == 'upper') == (game.turn() == 'w') ? '<= ' : '>= ') + engineStatus.score
                // }
            }
        }

        console.log("Reply: " + line);
        this.render();
    }

    evalerOnMessage(event) {
        var line;
        
        if (event && typeof event === "object") {
            line = event.data;
        } else {
            line = event;
        }
        
        console.log("evaler: " + line);
    }

    copyFen() {
        copyText("fenField")/* Get the text field */
        /* Alert the copied text */
        this.props.showInfo("FEN copied");
    }

    switchEngineState() {
        this.setState({engineOn:!this.state.engineOn});
        console.log("turn on/off engine: " + this.state.engineOn);
        if(this.state.engineOn) {
            // turn on the engine and start reporting visualizing
            if(!this.state.engineInitialized) {
                this.uciCmd('uci');
                this.uciCmd('setoption name Use NNUE value false', this.engine);
                this.uciCmd('setoption name Use NNUE value false', this.evaler);
                this.state.engineInitialized = true;
            }
            
            this.uciCmd('position ' + document.getElementById("fenField"));
            this.uciCmd('position ' + document.getElementById("fenField"), this.evaler);
            this.uciCmd("go depth 20");
        }else{
            this.uciCmd("stop");
        }
    }

    getEngineSwitch() {
        return (<div>   
            <FormControlLabel 
                control={
                    <Switch
                    onChange={this.switchEngineState.bind(this)}
                />} 
                label="Stockfish 16 in Local Browser" 
                />
            </div>
        );             
    }

    getFenField() {
        return this.props.simplifiedView?null:
            <div className="fenDiv">
            <TextField
                id="fenField"
                multiline
                label="FEN"
                rowsMax="2"   
                value={this.props.fen}
                inputProps={{
                    style: {fontSize: 12},
                    spellCheck: false,
                  }}
                  variant="outlined"
                className="fenField"
                margin="dense"
                onClick = {this.copyFen.bind(this)}
                /></div>
    }


    render() {
        // let moveDetails = this.props.moveDetails
        // if(!moveDetails.hasData) {
        //     return <div>{this.getFenField()}<div className = "infoMessage" >No data to show. Please enter a lichess or chess.com user name in the
        //         <span className = "navLinkButton" onClick={()=>this.props.switchToUserTab()}> <FontAwesomeIcon icon={faUser} /> User</span> tab and click "Load"</div>
        //         </div>
        // }
        // let performanceDetails = {}
        // if(this.props.isOpen) {
        //     performanceDetails = getPerformanceDetails(moveDetails.totalOpponentElo,
        //                                                 moveDetails.averageElo,
        //                                                 moveDetails.whiteWins,
        //                                                 moveDetails.draws,
        //                                                 moveDetails.blackWins,
        //                                                 this.props.settings.playerColor)
        // }

        return <div className="performanceOverlay">
            {this.getEngineSwitch()}
            {this.getFenField()}
            {
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell><b>Score</b></TableCell>
                    <TableCell><b>Move</b></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                <TableRow>
                    <TableCell>{this.state.engineCurScore}</TableCell>
                    <TableCell>{this.state.moveTo}</TableCell>
                </TableRow>
                </TableBody>
            </Table>}
        </div>
    }

    removeQuestionMarksFromDate(date) {
        if(!date || date.indexOf('?') === -1) {
            return date
        }
        return date.slice(0, date.indexOf('.'))
    }
}