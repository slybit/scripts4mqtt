import React from "react";
import Icon from '@mdi/react'
import { mdiDelete } from '@mdi/js'

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};

const selectedStyle = {
    background: 'lightskyblue',
    color: 'black'
};

export class RuleList extends React.Component {

    handleDeleteClick = (e, key) => {
        e.stopPropagation();
        this.props.onDeleteClick(key);
    }

    render() {

        const items = this.props.data.map(rule => {

            const style = {
                cursor: 'pointer',
                ...(rule.key === this.props.selectedRule ? selectedStyle: null)
            }

            return (
                <li className="list-group-item" key={rule.key} id={rule.key} style={style} onClick={() => this.props.onClick(rule.key)}>
                {rule.name}
                <span style={pushRightStyle}>
                    <Icon path={mdiDelete} size={1} className="deleteIcon" onClick={(e) => this.handleDeleteClick(e, rule.key)}/>
                </span>
                </li>
            )
        });
        return (
            <ul className="list-group">
                {items}
            </ul>
        );
    }
}
