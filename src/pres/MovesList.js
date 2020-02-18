import { Container, Row, Col, Progress } from "reactstrap"
import React from 'react'
import { Table, TableRow, TableHead, TableBody, TableCell } from '@material-ui/core';

export default class MovesList extends React.Component {
    constructor(props) {
        super(props)
    }

    move(from, to) {
        return () => {
            this.props.onMove(from, to)
        }
    }

    render(){
        return <Table>  
            <TableHead>            
            <TableRow>
                <TableCell size="small" className="smallCol"><b>Move</b></TableCell>
                <TableCell size="small" className="smallCol"><b>Games</b></TableCell>
                <TableCell><b>Results</b></TableCell>
            </TableRow></TableHead>  
            <TableBody>
        {
            (this.props.movesToShow)? this.props.movesToShow.map(move => 
                <TableRow className="moveRow" onClick={this.move(move.orig, move.dest)}>
                    <TableCell size="small" className="smallCol">{move.san}</TableCell>
                    <TableCell size="small" className="smallCol">{move.count}</TableCell>
                    <TableCell>
                        <Progress multi>
                            <Progress bar className="whiteMove" value={`${move.whiteWins/move.count*100}`}>{move.whiteWins/move.count>0.1?move.whiteWins:''}</Progress>
                            <Progress bar className="grayMove" value={`${move.draws/move.count*100}`}>{move.draws/move.count>0.1?move.draws:''}</Progress>
                            <Progress bar className="blackMove" value={`${move.blackWins/move.count*100}`}>{move.blackWins/move.count>0.1?move.blackWins:''}</Progress>
                        </Progress>
                    </TableCell>
                </TableRow>
            ):""
        }</TableBody>
        </Table>
    }
}