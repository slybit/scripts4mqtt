import React from "react";
import Icon from '@mdi/react'
import { mdiProgressClock, mdiOwl } from '@mdi/js'

export class RuleList extends React.Component {
    onItemSelection = arg => {
        //this.setState({ selectedPath: arg.path });
    };

    render() {
        const pushRightStyle = {
            float: 'right',
            cursor: 'pointer'
        };

        const items = this.props.data.map(rule => (
            <li className="list-group-item" key={rule.key} id={rule.key}> 
            {rule.name} 
            <span style={pushRightStyle}>
                <Icon path={mdiProgressClock} size={1} color="grey" onClick={() => this.props.onClick(rule.key)} />
                <Icon path={mdiOwl} size={1} color="grey"/>
            </span>
            </li>
        ));
        return (
            <ul className="list-group">
                {items}                
            </ul>
        );
    }
}
